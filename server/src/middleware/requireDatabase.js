import { isDatabaseReady } from "../config/db.js";

/**
 * Build the 503 response used whenever MongoDB is required but unavailable.
 *
 * Exported separately from the middleware so a controller can perform input
 * validation FIRST and only then report that the database is down. Validating
 * a request does not need a database, so a malformed payload must be answered
 * with 400 even while the database is unreachable — otherwise a client cannot
 * distinguish "your input is wrong" from "the server is broken".
 */
export function sendDatabaseUnavailable(res) {
  return res.status(503).json({
    error: "database_unavailable",
    message:
      "The database is not connected. Set MONGODB_URI in server/.env and restart the server.",
  });
}

/**
 * Send the 503 response when MongoDB is required but unavailable.
 * Returns true when the request may proceed.
 *
 * Use this AFTER input validation so a malformed payload is still answered
 * with 400 while the database is down.
 */
export function ensureDatabase(res) {
  if (isDatabaseReady()) {
    return true;
  }

  sendDatabaseUnavailable(res);

  return false;
}

/**
 * Reject a request that needs MongoDB while the connection is down.
 * Used on routes where no cheaper validation can run first.
 */
export function requireDatabase(req, res, next) {
  if (!isDatabaseReady()) {
    return sendDatabaseUnavailable(res);
  }

  return next();
}