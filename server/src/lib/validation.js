/**
 * Validation helpers shared by the auth controller.
 * Kept deliberately small and explicit rather than pulling in a schema library.
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const MIN_PASSWORD_LENGTH = 8;

export function readString(value, maxLength = 200) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, maxLength);
}

export function normaliseEmail(value) {
  return readString(value, 254).toLowerCase();
}

export function isValidEmail(email) {
  return EMAIL_PATTERN.test(email);
}

/**
 * Validate a registration/login payload.
 * Returns `{ valid, errors, data }` where `data` only exists when valid.
 */
export function validateRegistration(body) {
  const errors = {};

  const firstName = readString(body?.firstName, 60);
  const surname = readString(body?.surname, 60);
  const email = normaliseEmail(body?.email);
  const password = typeof body?.password === "string" ? body.password : "";

  if (!firstName) {
    errors.firstName = "First name is required.";
  }

  if (!isValidEmail(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }

  const valid = Object.keys(errors).length === 0;

  return {
    valid,
    errors,
    data: valid ? { firstName, surname, email, password } : null,
  };
}

/**
 * Login validates presence only — never the password policy — so an existing
 * account with an older policy can still sign in.
 */
export function validateLogin(body) {
  const errors = {};

  const email = normaliseEmail(body?.email);
  const password = typeof body?.password === "string" ? body.password : "";

  if (!isValidEmail(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!password) {
    errors.password = "Password is required.";
  }

  const valid = Object.keys(errors).length === 0;

  return {
    valid,
    errors,
    data: valid ? { email, password } : null,
  };
}