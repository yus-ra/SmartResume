import bcrypt from "bcryptjs";

import { User } from "../models/User.js";
import { signToken } from "../lib/session.js";
import {
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
} from "../config/env.js";
import { validateLogin, validateRegistration } from "../lib/validation.js";

/*
 * Auth controller.
 *
 * Two rules are deliberate and should not be relaxed:
 *  1. Responses never reveal whether an email is registered. Login failure
 *     returns one generic message whether the user is missing or the
 *     password is wrong.
 *  2. Passwords are never echoed, logged, or returned.
 */

const BCRYPT_ROUNDS = 12;

/** Generic message for any failed login. */
const INVALID_CREDENTIALS = "Email or password is incorrect.";

const setSessionCookie = (res, token) => {
  res.cookie(SESSION_COOKIE_NAME, token, sessionCookieOptions);
};

/* ------------------------------------------------------------------ */
/* POST /api/auth/register                                              */
/* ------------------------------------------------------------------ */

export async function register(req, res) {
  const { valid, errors, data } = validateRegistration(req.body);

  if (!valid) {
    return res.status(400).json({
      error: "validation_failed",
      message: "Please correct the highlighted fields.",
      fields: errors,
    });
  }

  const existing = await User.findOne({ email: data.email });

  if (existing) {
    return res.status(409).json({
      error: "email_taken",
      message: "An account with that email already exists.",
      fields: { email: "An account with that email already exists." },
    });
  }

  const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);

  const user = await User.create({
    firstName: data.firstName,
    surname: data.surname,
    email: data.email,
    passwordHash,
  });

  setSessionCookie(res, signToken(user._id));

  return res.status(201).json({ user: user.toPublicJSON() });
}

/* ------------------------------------------------------------------ */
/* POST /api/auth/login                                                 */
/* ------------------------------------------------------------------ */

export async function login(req, res) {
  const { valid, errors, data } = validateLogin(req.body);

  if (!valid) {
    return res.status(400).json({
      error: "validation_failed",
      message: "Please correct the highlighted fields.",
      fields: errors,
    });
  }

  // passwordHash is select:false, so it must be requested explicitly.
  const user = await User.findOne({ email: data.email }).select(
    "+passwordHash",
  );

  // Compare against a dummy hash when the user is absent, so a missing
  // account and a wrong password take a similar amount of time.
  const hashToCompare = user?.passwordHash ?? DUMMY_HASH;

  const passwordMatches = await bcrypt.compare(data.password, hashToCompare);

  if (!user || !passwordMatches) {
    return res.status(401).json({
      error: "invalid_credentials",
      message: INVALID_CREDENTIALS,
    });
  }

  setSessionCookie(res, signToken(user._id));

  return res.status(200).json({ user: user.toPublicJSON() });
}

/* ------------------------------------------------------------------ */
/* POST /api/auth/logout                                                */
/* ------------------------------------------------------------------ */

export function logout(_req, res) {
  // Clear with the same options used to set it, otherwise the browser keeps
  // the original path/sameSite pairing.
  res.clearCookie(SESSION_COOKIE_NAME, {
    ...sessionCookieOptions,
    maxAge: undefined,
  });

  return res.status(200).json({ ok: true });
}

/* ------------------------------------------------------------------ */
/* GET /api/auth/me                                                     */
/* ------------------------------------------------------------------ */

export function me(req, res) {
  return res.status(200).json({ user: req.user.toPublicJSON() });
}

/*
 * A valid bcrypt hash of a value nobody knows, used only to keep the timing
 * of a login attempt for an unknown email close to that of a known one.
 */
const DUMMY_HASH = "$2a$12$C6UzMDM.H6dfI/f/IKcEe.7uYbF9EGZs3nJm5r9nYy6bXrLYlGZ1i";