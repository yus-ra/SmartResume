import jwt from "jsonwebtoken";

import { env, SESSION_COOKIE_NAME } from "../config/env.js";

/**
 * Issue a signed session token for a user id.
 */
export function signToken(userId) {
  return jwt.sign({ sub: userId.toString() }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

/**
 * Read the raw token from the httpOnly session cookie.
 * Returns null when absent or malformed.
 */
export function readTokenFromCookies(cookies) {
  const token = cookies?.[SESSION_COOKIE_NAME];

  if (typeof token !== "string" || token.length === 0) {
    return null;
  }

  return token;
}

/**
 * Verify a token and return its payload, or null if it is invalid/expired.
 * Never throws — callers treat every failure as "not signed in".
 */
export function verifyToken(token) {
  if (!token) {
    return null;
  }

  try {
    return jwt.verify(token, env.jwtSecret);
  } catch {
    return null;
  }
}