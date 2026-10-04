import { isDatabaseReady } from "../config/db.js";

/**
 * Reject a request that needs MongoDB while the connection is down.
 * Keeps the failure explicit (503) instead of surfacing a raw driver error.
 */
export function requireDatabase(req, res, next) {
  if (!isDatabaseReady()) {
    return res.status(503).json({
      error: "database_unavailable",
      message:
        "The database is not connected. Set MONGODB_URI in server/.env and restart the server.",
    });
  }

  return next();
}