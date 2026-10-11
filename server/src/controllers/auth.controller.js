import bcrypt from "bcryptjs";
import crypto from "node:crypto";

import { User } from "../models/User.js";
import { signToken } from "../lib/session.js";
import {
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
  env,
} from "../config/env.js";
import { sendMail } from "../lib/email.js";
import {
  validateForgotPassword,
  validateLogin,
  validateProfileUpdate,
  validateRegistration,
  validateResetPassword,
} from "../lib/validation.js";
import { ensureDatabase } from "../middleware/requireDatabase.js";

/*
 * Auth controller.
 *
 * Two rules are deliberate and should not be relaxed:
 *  1. Login failure returns one generic message whether the user is missing or the
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

  // Validation first, then the database check: a malformed request is a 400
  // regardless of whether MongoDB happens to be reachable.
  if (!ensureDatabase(res)) {
    return;
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

  if (!ensureDatabase(res)) {
    return;
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

/* ------------------------------------------------------------------ */
/* PATCH /api/auth/me                                                  */
/* ------------------------------------------------------------------ */

/**
 * Update the signed-in user's profile.
 *
 * The session identity is authoritative. Nothing in the request body can
 * change which account is updated, and only firstName, surname and email are
 * writable. Password, role, timestamps and resume/portfolio data are never
 * touched by this endpoint.
 */
export async function updateProfile(req, res) {
  const { valid, errors, data } = validateProfileUpdate(req.body);

  if (!valid) {
    return res.status(400).json({
      error: "validation_failed",
      message: "Please correct the highlighted fields.",
      fields: errors,
    });
  }

  if (!ensureDatabase(res)) {
    return;
  }

  const user = req.user;

  // Reject an email already owned by another account. The current user's own
  // existing email is allowed — that is a no-op save, not a conflict.
  if (data.email !== user.email) {
    const existing = await User.findOne({ email: data.email });

    if (existing && existing._id.toString() !== user._id.toString()) {
      return res.status(409).json({
        error: "email_taken",
        message: "An account with that email already exists.",
        fields: { email: "An account with that email already exists." },
      });
    }
  }

  user.firstName = data.firstName;
  user.surname = data.surname;
  user.email = data.email;

  await user.save();

  return res.status(200).json({ user: user.toPublicJSON() });
}

/* ------------------------------------------------------------------ */
/* POST /api/auth/forgot-password                                       */
/* ------------------------------------------------------------------ */

/**
 * Issue a password-reset token for the supplied email.
 *
 * The response is identical whether or not the email is registered, so this
 * endpoint cannot be used to enumerate accounts. A token is generated and
 * dispatched only when the account exists; for an unknown email the same 200
 * is returned without doing anything, so a caller cannot distinguish the two.
 */
export async function forgotPassword(req, res) {
  const { valid, errors, data } = validateForgotPassword(req.body);

  if (!valid) {
    return res.status(400).json({
      error: "validation_failed",
      message: "Please correct the highlighted fields.",
      fields: errors,
    });
  }

  if (!ensureDatabase(res)) {
    return;
  }

  // Look the user up, but never reveal the outcome. A token is generated and
  // dispatched only for a real account; for an unknown email the same 200 is
  // returned without doing anything, so timing and status cannot be probed.
  const user = await User.findOne({ email: data.email });

  if (user) {
    // 32 random bytes -> 64 hex chars. Unpredictable and single-use.
    const rawToken = crypto.randomBytes(32).toString("hex");

    // Store the SHA-256 digest. A database leak then exposes a hash, not a
    // usable credential, and the digest is still fast to compare.
    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    user.resetPasswordToken = tokenHash;
    user.resetPasswordExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS);

    await user.save();

    const resetLink = `${env.clientOrigin}/reset-password?token=${rawToken}`;

    await sendMail({
      to: user.email,
      subject: "Reset your SmartResume password",
      html: `
        <p>Hi ${user.firstName},</p>
        <p>Someone requested a password reset for your SmartResume account.</p>
        <p>This link expires in 1 hour:</p>
        <p><a href="${resetLink}">${resetLink}</a></p>
        <p>If you did not request this, you can safely ignore this email.</p>
      `,
    });
  }

  return res.status(200).json({
    message: "If an account with that email exists, a reset link has been sent.",
  });
}

/* ------------------------------------------------------------------ */
/* POST /api/auth/reset-password                                       */
/* ------------------------------------------------------------------ */

/**
 * Complete a password reset using a token issued by `forgotPassword`.
 *
 * The token is single-use and time-boxed; a successful reset clears both
 * fields so it cannot be replayed.
 */
export async function resetPassword(req, res) {
  const { valid, errors, data } = validateResetPassword(req.body);

  if (!valid) {
    return res.status(400).json({
      error: "validation_failed",
      message: "Please correct the highlighted fields.",
      fields: errors,
    });
  }

  if (!ensureDatabase(res)) {
    return;
  }

  const rawToken = typeof req.body.token === "string" ? req.body.token.trim() : "";

  if (!rawToken) {
    return res.status(400).json({
      error: "invalid_token",
      message: "Invalid or expired reset token.",
    });
  }

  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  const user = await User.findOne({
    resetPasswordToken: tokenHash,
    resetPasswordExpires: { $gt: new Date() },
  }).select("+passwordHash");

  if (!user) {
    // Same response shape whether the token is unknown or expired, so a
    // caller cannot distinguish the two and probe for live tokens.
    return res.status(400).json({
      error: "invalid_token",
      message: "Invalid or expired reset token.",
    });
  }

  user.passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;

  await user.save();

  return res.status(200).json({ message: "Password successfully reset." });
}

/*
 * A valid bcrypt hash of a value nobody knows, used only to keep the timing
 * of a login attempt for an unknown email close to that of a known one.
 */
const DUMMY_HASH = "$2a$12$C6UzMDM.H6dfI/f/IKcEe.7uYbF9EGZs3nJm5r9nYy6bXrLYlGZ1i";

/** How long a reset token is valid for (1 hour). */
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;