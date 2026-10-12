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
 * Validate an authenticated profile-update payload.
 *
 * Allowed writable fields are firstName, surname and email only. The caller
 * (req.user) supplies the identity; nothing in the body can override it.
 */
export function validateProfileUpdate(body) {
  const errors = {};

  const firstName = readString(body?.firstName, 60);
  const surname = readString(body?.surname, 60);
  const email = normaliseEmail(body?.email);

  if (!firstName) {
    errors.firstName = "First name is required.";
  }

  if (!isValidEmail(email)) {
    errors.email = "Enter a valid email address.";
  }

  const valid = Object.keys(errors).length === 0;

  return {
    valid,
    errors,
    data: valid ? { firstName, surname, email } : null,
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

/**
 * Validate a password-reset request payload.
 *
 * The email is the only input; the token is generated server-side.
 */
export function validateForgotPassword(body) {
  const errors = {};

  const email = normaliseEmail(body?.email);

  if (!isValidEmail(email)) {
    errors.email = "Enter a valid email address.";
  }

  const valid = Object.keys(errors).length === 0;

  return {
    valid,
    errors,
    data: valid ? { email } : null,
  };
}

/**
 * Validate a password-reset completion payload.
 *
 * The token is supplied by the user (typically via a link), and the new
 * password must meet the same minimum length as registration.
 */
export function validateResetPassword(body) {
  const errors = {};

  const password = typeof body?.password === "string" ? body.password : "";

  if (password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }

  const valid = Object.keys(errors).length === 0;

  return {
    valid,
    errors,
    data: valid ? { password } : null,
  };
}

/**
 * Validate the advisory AI explanation request payload.
 *
 * Only the aggregated match data the client already computed is accepted.
 * The server controls the prompt, so user ID, resume ID, API key, arbitrary
 * prompt text, model name and system instructions are all rejected here.
 */
export function validateExplainMatch(body) {
  const errors = {};

  const jobTitle = readString(body?.jobTitle, 120);
  const company = readString(body?.company, 120);
  const jobDescription =
    typeof body?.jobDescription === "string" ? body.jobDescription.trim() : "";

  const matchScore = Number(body?.matchScore);

  const matchedSkills = readStringArray(body?.matchedSkills, 30, 60);
  const missingSkills = readStringArray(body?.missingSkills, 30, 60);

  if (!jobDescription) {
    errors.jobDescription = "A job description is required.";
  }

  if (jobDescription.length > 15000) {
    errors.jobDescription = "Job description is too long.";
  }

  if (!Number.isInteger(matchScore) || matchScore < 0 || matchScore > 100) {
    errors.matchScore = "Match score must be a whole number between 0 and 100.";
  }

  const valid = Object.keys(errors).length === 0;

  return {
    valid,
    errors,
    data: valid
      ? {
          jobTitle,
          company,
          jobDescription,
          matchScore,
          matchedSkills,
          missingSkills,
        }
      : null,
  };
}

/**
 * Read a bounded array of trimmed strings. Non-array input, non-string items,
 * empty items and items over the per-item limit are all dropped rather than
 * throwing, so a malformed payload cannot crash validation.
 */
function readStringArray(value, maxItems, maxLength) {
  if (!Array.isArray(value)) {
    return [];
  }

  const out = [];

  for (let i = 0; i < value.length; i += 1) {
    if (out.length >= maxItems) {
      break;
    }

    if (typeof value[i] !== "string") {
      continue;
    }

    const trimmed = value[i].trim().slice(0, maxLength);

    if (trimmed.length > 0) {
      out.push(trimmed);
    }
  }

  return out;
}