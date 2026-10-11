/**
 * server/src/lib/email.js
 *
 * Email dispatch for transactional messages — currently password resets.
 *
 * `nodemailer` is an installed dependency but SMTP credentials are optional:
 * in development (or whenever SMTP env vars are absent) every message is
 * rendered to the server console instead, so the reset flow can be tested
 * without configuring a mail server. This is deliberate and intentional,
 * not a silent failure: the fallback is loud enough to be visible in logs.
 *
 * Nothing here knows about users or passwords; it only knows how to send
 * (or print) a message given a recipient, subject and html body.
 */

import nodemailer from "nodemailer";
import { env } from "../config/env.js";

/** True when real SMTP credentials are configured. */
export function isSmtpConfigured() {
  return Boolean(env.smtpHost && env.smtpUser && env.smtpPass);
}

/** Build a transporter when SMTP is configured, otherwise null. */
let transporter = null;

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
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass,
    },
  });

  return transporter;
}

/**
 * Send an email, or — when SMTP is not configured — print it loudly to the
 * console so the caller can read the link directly.
 *
 * Always resolves; never throws. Returns `{ ok, via: "smtp" | "console" }`.
 */
export async function sendMail({ to, subject, html }) {
  const transport = getTransporter();

  if (!transport) {
    console.log("\n==========================================================");
    console.log("PASSWORD RESET — SMTP not configured, printing message");
    console.log("==========================================================");
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log("----------------------------------------------------------");
    console.log(html);
    console.log("==========================================================\n");

    return { ok: true, via: "console" };
  }

  try {
    await transport.sendMail({
      from: env.smtpFrom || `"SmartResume" <no-reply@smartresume.local>`,
      to,
      subject,
      html,
    });

    return { ok: true, via: "smtp" };
  } catch (error) {
    console.error("[email] Failed to send via SMTP:", error);

    // Fall back to the console so a failed send still surfaces the link.
    console.log("\n==========================================================");
    console.log("PASSWORD RESET — SMTP send failed, printing message");
    console.log("==========================================================");
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log("----------------------------------------------------------");
    console.log(html);
    console.log("==========================================================\n");

    return { ok: true, via: "console" };
  }
}