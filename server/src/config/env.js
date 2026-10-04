import { randomBytes } from "node:crypto";

/*
 * Central, validated view of process.env.
 *
 * Nothing else in the server reads process.env directly, so missing or
 * invalid configuration is reported in exactly one place. Every value is
 * optional at boot: the server must stay startable without a database so
 * that the React client can still be developed locally.
 */

const WARN = "⚠️ ";

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  isProduction: process.env.NODE_ENV === "production",
  port: Number(process.env.PORT) || 5000,
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",

  // Empty string means "not configured" — the server still boots.
  mongoUri: (process.env.MONGODB_URI || "").trim(),

  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
};

/*
 * A missing JWT secret must not stop the server, but it must never be
 * silently accepted in production, where a static fallback would mean
 * anyone could forge sessions.
 */
if (process.env.JWT_SECRET?.trim()) {
  env.jwtSecret = process.env.JWT_SECRET.trim();
} else if (env.isProduction) {
  // Fail fast and loudly: this is a deployment mistake, not a dev nuisance.
  throw new Error(
    `${WARN}JWT_SECRET is required when NODE_ENV=production. ` +
      "Generate one with: node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\"",
  );
} else {
  env.jwtSecret = randomBytes(48).toString("hex");

  console.warn(
    `${WARN}JWT_SECRET is not set. Using a random secret for this process.\n` +
      `  Sessions will be invalidated on every restart. Set JWT_SECRET in server/.env for stable sessions.`,
  );
}

export const hasMongoUri = () => env.mongoUri.length > 0;

/** Cookie options shared by every place that sets or clears the session cookie. */
export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: env.isProduction,
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days, matches JWT_EXPIRES_IN default
};

export const SESSION_COOKIE_NAME = "smartresume_session";