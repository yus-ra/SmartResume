import { User } from "../models/User.js";
import { readTokenFromCookies, verifyToken } from "../lib/session.js";

/**
 * Attach `req.user` when a valid session cookie is present.
 * Never rejects — this is an enrichment step, not a gate.
 */
export async function attachUser(req, _res, next) {
  const payload = verifyToken(readTokenFromCookies(req.cookies));

  if (!payload?.sub) {
    return next();
  }

  try {
    const user = await User.findById(payload.sub);

    if (user) {
      req.user = user;
    }
  } catch {
    // A lookup failure must not turn into a crash; treat as signed out.
  }

  return next();
}

/**
 * Gate a route behind a valid session.
 * Must run after `attachUser`.
 */
export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: "unauthorized",
      message: "You must be signed in to access this resource.",
    });
  }

  return next();
}