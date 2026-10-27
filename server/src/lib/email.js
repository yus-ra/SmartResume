/**
 * server/src/lib/email.js
 *
 * Email dispatch for transactional messages — currently password resets.
 *
 * `nodemailer` is an installed dependency but SMTP credentials are optional.
 * When SMTP is unavailable or delivery fails, message content is discarded;
 * only a generic operational warning is logged. Message bodies may contain
 * bearer credentials and must never be written to logs.
 *
 * Nothing here knows about users or passwords; it only knows how to send a
 * message given a recipient, subject and html body.
 */

import nodemailer from "nodemailer";
import { env } from "../config/env.js";

/** True when real SMTP credentials are configured. */
export function isSmtpConfigured() {
  return Boolean(env.smtpHost && env.smtpUser && env.smtpPass);
}

/** Build a transporter when SMTP is configured, otherwise null. */
let transporter = null;
const SAFE_SMTP_ERROR_CODES = new Set([
  "EAUTH",
  "ECONNECTION",
  "EDNS",
  "EAI_AGAIN",
  "ENOTFOUND",
  "ESOCKET",
  "ETIMEDOUT",
  "ECONNREFUSED",
  "ECONNRESET",
  "ETLS",
]);

function getTransporter() {
  if (transporter !== null) {
    return transporter;
  }

  if (!isSmtpConfigured()) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort || 587,
    secure: Boolean(env.smtpSecure),
    // Bound DNS, connection, server greeting, and stalled SMTP sessions.
    // These are independent of the HTTP request lifetime.
    dnsTimeout: 5000,
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 10000,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass,
    },
  });

  return transporter;
}

/**
 * Send an email when SMTP is configured. If SMTP is unavailable or fails,
 * return a failure result without logging message content or recipient data.
 *
 * Always resolves; never throws. Returns `{ ok, via }` where `via` is
 * `"smtp"` or `"unavailable"`.
 */
export async function sendMail({ to, subject, html }) {
  try {
    const transport = getTransporter();

    if (!transport) {
      console.warn("[email] SMTP is not configured; transactional email was not sent.");

      return { ok: false, via: "unavailable" };
    }

    await transport.sendMail({
      from: env.smtpFrom || `"SmartResume" <no-reply@smartresume.local>`,
      to,
      subject,
      html,
    });

    return { ok: true, via: "smtp" };
  } catch (error) {
    // Do not log the SMTP error object: provider errors can contain private
    // connection details. Message content also contains the bearer reset link.
    const code = SAFE_SMTP_ERROR_CODES.has(error?.code)
      ? error.code
      : "SMTP_ERROR";
    console.warn(
      `[email] SMTP delivery failed (${code}); transactional email was not sent.`,
    );

    return { ok: false, via: "smtp" };
  }
}
