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
 */
async function request(path, { method = "GET", body } = {}) {
  const controller =
    typeof AbortController === "undefined" ? null : new AbortController();

  const timer = controller
    ? setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
    : null;

  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      // Required for the httpOnly session cookie to be sent and stored.
      credentials: "include",
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