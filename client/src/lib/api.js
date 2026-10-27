/*
 * SmartResume API client.
 *
 * This is the ONLY module in the React app that performs network requests.
 *
 * Design notes:
 *  - Every function resolves to a result object of the shape
 *    { ok, status, data, error, message, fields } and never throws. That
 *    matches the existing convention in lib/resumeSchema.js, where
 *    saveResume() returns { ok, error } instead of raising.
 *  - Sessions are carried by an httpOnly cookie, so every request must set
 *    credentials: "include". The token is never visible to JavaScript.
 *  - Nothing here knows about resume storage. Resume persistence is a
 *    separate concern owned by lib/resumeSchema.js.
 */

const API_BASE_URL =
  import.meta.env?.VITE_API_URL?.trim() || "http://localhost:5000";

/* A request that never returns should not hang a form forever. */
const REQUEST_TIMEOUT_MS = 10000;

const success = (status, data) => ({ ok: true, status, data });

const failure = (status, error, message, fields) => ({
  ok: false,
  status,
  error,
  message,
  fields,
});

/**
 * Perform a JSON request against the API.
 * Always resolves; never rejects.
 *
 * `credentials` defaults to "include" because almost every endpoint is
 * session-scoped. The one exception is the public portfolio read, which is by
 * definition anonymous: sending the cookie there would make the server look the
 * session up for nothing and would make the request behave differently
 * depending on who is viewing the page. Callers pass "omit" for that.
 */
async function request(
  path,
  {
    method = "GET",
    body,
    credentials = "include",
    timeoutMs = REQUEST_TIMEOUT_MS,
  } = {},
) {
  const controller =
    typeof AbortController === "undefined" ? null : new AbortController();

  const timer = controller
    ? setTimeout(() => controller.abort(), timeoutMs)
    : null;

  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      // Required for the httpOnly session cookie to be sent and stored.
      credentials,
      headers: {
        Accept: "application/json",
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      ...(controller ? { signal: controller.signal } : {}),
    });
  } catch (error) {
    // Network failure, DNS failure, CORS rejection, or the timeout above.
    const timedOut = error?.name === "AbortError";

    return failure(
      0,
      timedOut ? "request_timeout" : "server_unreachable",
      timedOut
        ? "The server took too long to respond. Please try again."
        : "Cannot reach the SmartResume server. Check that it is running.",
    );
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }

  // The API always answers with JSON, but a proxy or crash could return
  // something else, so parsing must not be able to throw.
  let payload;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    return failure(
      response.status,
      payload?.error || "request_failed",
      payload?.message || `Request failed with status ${response.status}.`,
      payload?.fields,
    );
  }

  return success(response.status, payload);
}

/* ------------------------------------------------------------------ */
/* Auth endpoints                                                       */
/* ------------------------------------------------------------------ */

/**
 * Resolve the current session.
 * 200 -> signed in, 401 -> signed out. Anything else is a server problem,
 * which the caller must not confuse with being signed out.
 */
export function getSession() {
  return request("/api/auth/me");
}

/** Exchange credentials for a session cookie. */
export function login({ email, password } = {}) {
  return request("/api/auth/login", { method: "POST", body: { email, password } });
}

/** Create an account and sign in. */
export function register({ firstName, surname, email, password } = {}) {
  return request("/api/auth/register", {
    method: "POST",
    body: { firstName, surname, email, password },
  });
}

/**
 * Ask the server to clear the session cookie.
 * The caller clears local state regardless of the outcome: logging out must
 * never depend on the server being reachable.
 */
export function logout() {
  return request("/api/auth/logout", { method: "POST" });
}

/**
 * Update the signed-in user's profile on the server.
 *
 * Only firstName, surname and email are sent. The server validates and
 * persists the change to MongoDB; the returned user is the authoritative
 * public shape and should be used to update local state.
 */
export function updateProfile({ firstName, surname, email } = {}) {
  return request("/api/auth/me", {
    method: "PATCH",
    body: { firstName, surname, email },
  });
}

/* ------------------------------------------------------------------ */
/* Password recovery endpoints                                         */
/* ------------------------------------------------------------------ */

/**
 * Request a password-reset link for the supplied email.
 *
 * The response is intentionally identical whether or not the email is
 * registered, so this endpoint cannot be used to enumerate accounts.
 */
export function forgotPassword(email) {
  return request("/api/auth/forgot-password", {
    method: "POST",
    body: { email },
  });
}

/**
 * Complete a password reset using a token issued by `forgotPassword`.
 *
 * `token` comes from the reset link; `password` is the new password.
 */
export function resetPassword(token, password) {
  return request("/api/auth/reset-password", {
    method: "POST",
    body: { token, password },
  });
}

/* ------------------------------------------------------------------ */
/* Portfolio endpoints                                                  */
/* ------------------------------------------------------------------ */

/**
 * Fetch the account's portfolio.
 *
 * 200 -> `{ portfolio, activeTemplate, updatedAt }`
 * 404 -> `{ portfolio: null, activeTemplate: 1 }` meaning nothing has been
 *        saved server-side yet. This is NOT the same as an empty portfolio,
 *        so callers must not overwrite local data on a 404.
 */
export function getPortfolio() {
  return request("/api/portfolio");
}

/**
 * Create or replace the account's portfolio.
 *
 * `portfolio` is sent verbatim; the canonical shape is owned by the
 * Portfolio page, not by this layer.
 */
export function putPortfolio({ portfolio, activeTemplate } = {}) {
  return request("/api/portfolio", {
    method: "PUT",
    body: { portfolio, activeTemplate },
  });
}

/**
 * Partially update the account's portfolio — used for fast template
 * switches without rewriting the whole payload.
 */
export function patchPortfolio({ activeTemplate } = {}) {
  return request("/api/portfolio", {
    method: "PATCH",
    body: { activeTemplate },
  });
}

/* ------------------------------------------------------------------ */
/* Public share-link endpoints                                          */
/* ------------------------------------------------------------------ */

/**
 * Publish the account's portfolio and get its public link.
 *
 * 200 -> `{ share: { enabled, slug, publishedAt, showContact, publicPath } }`
 * 409 -> `{ error: "portfolio_not_saved" }` — the portfolio has never been
 *        saved, so there is nothing to publish. The caller should save first.
 *
 * Idempotent: calling it again returns the SAME slug, so a retry can never
 * invalidate a link the owner has already handed out.
 */
export function enablePortfolioShare() {
  return request("/api/portfolio/share", { method: "POST" });
}

/**
 * Take the public link offline.
 *
 * The slug is retained by the server, so re-publishing restores the same URL.
 * The link stops working on the next request.
 */
export function revokePortfolioShare() {
  return request("/api/portfolio/share", { method: "DELETE" });
}

/**
 * Change what the published page shows, or replace the link entirely.
 *
 * @param {object}  options
 * @param {boolean} [options.showContact]  Whether contact details are public.
 * @param {boolean} [options.rotate]       Mint a new slug, invalidating the old
 *                                         link immediately.
 */
export function updatePortfolioShare({ showContact, rotate } = {}) {
  return request("/api/portfolio/share", {
    method: "PATCH",
    body: { showContact, rotate },
  });
}

/**
 * Fetch a published portfolio for anonymous viewing.
 *
 * This is the only call in this module that runs without a session, and it is
 * sent with `credentials: "omit"` for that reason: the public page must render
 * identically for a signed-in and a signed-out visitor, and the request has no
 * business carrying the viewer's cookie to a resource that is not theirs.
 *
 * 200 -> `{ portfolio, resume, updatedAt }` (already projected to an allow-list
 *        by the server; see server/src/lib/publicPortfolio.js)
 * 404 -> `{ error: "not_found" }` for an unknown, malformed OR revoked slug.
 *        The three are deliberately indistinguishable.
 * 429 -> `{ error: "rate_limited" }`
 */
export function getPublicPortfolio(slug) {
  return request(`/api/public/portfolios/${encodeURIComponent(slug)}`, {
    credentials: "omit",
  });
}

/**
 * Build the absolute, shareable URL for a public path.
 *
 * The server returns `publicPath` (`/p/<slug>`) rather than a full URL, because
 * it has no reliable way to know which host the client is served from — a
 * server-side CLIENT_ORIGIN is not the same thing as the origin the visitor is
 * actually using, particularly behind a proxy or on a preview deployment.
 */
export function buildPublicUrl(publicPath) {
  if (!publicPath || typeof window === "undefined") {
    return "";
  }

  return `${window.location.origin}${publicPath}`;
}

export { API_BASE_URL, REQUEST_TIMEOUT_MS };

/* ------------------------------------------------------------------ */
/* Resume endpoints                                                     */
/* ------------------------------------------------------------------ */

/**
 * Fetch the account's single resume.
 *
 * 200 -> `{ resume, schemaVersion, updatedAt }`
 * 404 -> `{ resume: null }` meaning nothing has been saved server-side yet.
 *        This is NOT the same as an empty resume, so callers must not
 *        overwrite local data on a 404.
 */
export function getResume() {
  return request("/api/resume");
}

/**
 * Create or replace the account's single resume.
 * `resume` is sent verbatim; the canonical shape is owned by
 * lib/resumeSchema.js, not by this layer.
 */
export function putResume(resume, schemaVersion) {
  return request("/api/resume", {
    method: "PUT",
    body: { schemaVersion, resume },
  });
}

/* ------------------------------------------------------------------ */
/* AI endpoints                                                        */
/* ------------------------------------------------------------------ */

/**
 * Request an advisory explanation of the deterministic Job Match result.
 *
 * The server builds the prompt from the aggregated match data only — the
 * user's full resume is never sent. The deterministic score remains the
 * source of truth; the explanation is purely advisory.
 *
 * 200 -> `{ ok: true, explanation: "..." }`
 * 503 -> `{ error: "ai_unavailable", message }` (no key configured)
 * 502 -> `{ error: "ai_provider_error", message }` (transient provider failure)
 * 400 -> `{ error: "validation_failed", message, fields }`
 * 401 -> unauthorized (handled by the session gate)
 */
export function explainMatch(payload) {
  return request("/api/ai/explain-match", {
    method: "POST",
    body: payload,
    // The server aborts Gemini at 12 seconds and returns a safe 504.
    timeoutMs: 15000,
  });
}
