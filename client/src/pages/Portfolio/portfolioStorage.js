import { getResumeScope } from "../../lib/resumeSchema";

/*
 * Account-scoped local storage for the portfolio.
 *
 * The SERVER is the authoritative copy of a portfolio (see
 * controllers/portfolio.controller.js). What lives here is a local working
 * copy, used to render instantly on load and to keep edits alive when the
 * server is unreachable.
 *
 * Portfolio data is owned by the signed-in account. It used to live in a single
 * browser-global `portfolioData` key, which meant User B could read User A's
 * portfolio — including the contact details seeded from A's resume — and could
 * overwrite it.
 *
 *     anonymous      portfolioData
 *     account <id>   portfolioData:u<id>
 *
 * An authenticated account NEVER reads the anonymous key.
 */

const PORTFOLIO_STORAGE_KEY = "portfolioData";

/** Marker proving the one-time legacy migration has already run. */
const PORTFOLIO_MIGRATION_MARKER_KEY = "smartresume_portfolio_migration_v1";

/** Namespace holding pre-authentication portfolio data that has no owner. */
const PORTFOLIO_QUARANTINE_KEY = "portfolioData:legacy-migrated";

export const getPortfolioStorageKey = () => {
  const scope = getResumeScope();

  return scope === null
    ? PORTFOLIO_STORAGE_KEY
    : `${PORTFOLIO_STORAGE_KEY}:u${scope}`;
};

/**
 * One-time quarantine of the old browser-global `portfolioData`.
 *
 * Its ownership is unknowable: a portfolio carries no owner id, and it may
 * have been seeded from any account's resume. Rather than assign it to
 * whoever signs in first, it is moved to a namespace this page never reads,
 * preserving it for a future explicit recovery flow.
 *
 * Guarded by the marker so it can never run twice, and it never overwrites an
 * existing quarantined payload.
 */
export const runPortfolioMigrationIfNeeded = () => {
  if (getResumeScope() === null) {
    // Only ever run inside an authenticated session, so the quarantine is
    // performed deliberately rather than on an anonymous visit.
    return;
  }

  try {
    if (localStorage.getItem(PORTFOLIO_MIGRATION_MARKER_KEY)) {
      return;
    }

    const legacyRaw = localStorage.getItem(PORTFOLIO_STORAGE_KEY);

    if (legacyRaw) {
      if (localStorage.getItem(PORTFOLIO_QUARANTINE_KEY) === null) {
        localStorage.setItem(PORTFOLIO_QUARANTINE_KEY, legacyRaw);
      }

      localStorage.removeItem(PORTFOLIO_STORAGE_KEY);
    }

    localStorage.setItem(
      PORTFOLIO_MIGRATION_MARKER_KEY,
      legacyRaw ? "quarantined" : "none",
    );
  } catch {
    // A failed migration must never block the page. Leaving the legacy key in
    // place is safe: no authenticated account reads it.
  }
};

/**
 * Read the local working copy for the active account.
 * Returns null when there is nothing usable stored.
 */
export const readLocalPortfolio = () => {
  try {
    const raw = localStorage.getItem(getPortfolioStorageKey());

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
};

/**
 * Write the local working copy for the active account.
 * Returns true on success; a full or unavailable localStorage is not fatal,
 * because the server copy is still written by the caller.
 */
export const writeLocalPortfolio = (portfolio) => {
  try {
    localStorage.setItem(getPortfolioStorageKey(), JSON.stringify(portfolio));

    return true;
  } catch (error) {
    console.error("Could not save portfolio locally:", error);

    return false;
  }
};
