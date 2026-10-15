import assert from "node:assert/strict";
import crypto from "node:crypto";
import { test } from "node:test";

import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import nodemailer from "nodemailer";

import { connectDatabase, disconnectDatabase } from "../src/config/db.js";
import { env } from "../src/config/env.js";
import {
  forgotPassword,
  resetPassword,
} from "../src/controllers/auth.controller.js";
import { User } from "../src/models/User.js";

const GENERIC_FORGOT_RESPONSE = {
  message: "If an account with that email exists, a reset link has been sent.",
};

const tokenFor = (sequence) => Buffer.alloc(32, sequence).toString("hex");

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const makeResponse = () => ({
  statusCode: null,
  body: null,
  cookieCalled: false,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
  cookie() {
    this.cookieCalled = true;
  },
});

const callForgotPassword = async () => {
  const response = makeResponse();
  await forgotPassword(
    { body: { email: "person@example.test" } },
    response,
  );
  return response;
};

test("password reset emails never put bearer credentials in logs", async (t) => {
  const originalEnv = {
    smtpHost: env.smtpHost,
    smtpPort: env.smtpPort,
    smtpUser: env.smtpUser,
    smtpPass: env.smtpPass,
    smtpFrom: env.smtpFrom,
    smtpSecure: env.smtpSecure,
  };
  const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
  };
  const logs = [];
  const mailMessages = [];
  const users = [];
  let sequence = 0;
  let smtpMode = "success";
  let findOneImplementation;

  console.log = (...args) => logs.push(args.map(String).join(" "));
  console.warn = (...args) => logs.push(args.map(String).join(" "));
  console.error = (...args) => logs.push(args.map(String).join(" "));

  env.smtpHost = "";
  env.smtpUser = "";
  env.smtpPass = "";

  t.mock.method(mongoose, "connect", async () => mongoose);
  t.mock.method(mongoose, "disconnect", async () => mongoose);
  t.mock.method(crypto, "randomBytes", (size) => {
    sequence += 1;
    return Buffer.alloc(size, sequence);
  });
  t.mock.method(User, "findOne", (...args) => findOneImplementation(...args));
  t.mock.method(nodemailer, "createTransport", () => ({
    sendMail: async (message) => {
      mailMessages.push(message);

      if (smtpMode === "failure") {
        throw new Error("test SMTP failure details");
      }

      return { messageId: "test-message" };
    },
  }));

  findOneImplementation = async ({ email }) => {
    const user = {
      firstName: "Test User",
      email,
      resetPasswordToken: null,
      resetPasswordExpires: null,
      save: async () => {},
    };
    users.push(user);
    return user;
  };

  const runForgotRequest = async (expectedSequence) => {
    const logStart = logs.length;
    const startedAt = Date.now();
    const response = await callForgotPassword();
    const finishedAt = Date.now();
    const rawToken = tokenFor(expectedSequence);
    const resetUrl = `${env.clientOrigin}/reset-password?token=${rawToken}`;
    const requestLogs = logs.slice(logStart).join("\n");
    const user = users.at(-1);

    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.body, GENERIC_FORGOT_RESPONSE);
    assert.equal(
      Boolean(
        user.resetPasswordToken === hashToken(rawToken) &&
          user.resetPasswordToken !== rawToken,
      ),
      true,
      "the reset token must remain hashed at rest",
    );
    assert.equal(
      Boolean(
        user.resetPasswordExpires instanceof Date &&
          user.resetPasswordExpires.getTime() >= startedAt + 60 * 60 * 1000 &&
          user.resetPasswordExpires.getTime() <= finishedAt + 60 * 60 * 1000,
      ),
      true,
      "the reset token must keep its one-hour expiry",
    );
    assert.equal(requestLogs.includes(rawToken), false, "raw token was logged");
    assert.equal(requestLogs.includes(resetUrl), false, "reset URL was logged");

    return { requestLogs, rawToken, resetUrl };
  };

  try {
    await connectDatabase();
    logs.length = 0;

    await t.test("SMTP unavailable keeps the generic response and logs no link", async () => {
      const { requestLogs } = await runForgotRequest(1);
      assert.equal(requestLogs.includes("<p>"), false, "email HTML was logged");
      assert.equal(
        requestLogs.includes("SMTP is not configured"),
        true,
        "a safe operational warning should be recorded",
      );
    });

    await t.test("configured SMTP still receives the reset email", async () => {
      env.smtpHost = "smtp.test.invalid";
      env.smtpUser = "test-user";
      env.smtpPass = "test-password-placeholder";

      const { requestLogs, rawToken, resetUrl } = await runForgotRequest(2);
      const message = mailMessages.at(-1);

      assert.equal(message.to, "person@example.test");
      assert.equal(message.html.includes(resetUrl), true);
      assert.equal(message.html.includes(rawToken), true);
      assert.equal(requestLogs.includes(rawToken), false);
      assert.equal(requestLogs.includes(resetUrl), false);
      assert.equal(requestLogs.includes(message.html), false);
    });

    await t.test("SMTP failure logs neither the error details nor message HTML", async () => {
      smtpMode = "failure";
      const { requestLogs, rawToken, resetUrl } = await runForgotRequest(3);
      const message = mailMessages.at(-1);

      assert.equal(requestLogs.includes(rawToken), false);
      assert.equal(requestLogs.includes(resetUrl), false);
      assert.equal(requestLogs.includes(message.html), false);
      assert.equal(requestLogs.includes("test SMTP failure details"), false);
      assert.equal(
        requestLogs.includes("SMTP delivery failed"),
        true,
        "only a generic operational warning should be recorded",
      );
    });

    await t.test("reset still hashes the password and consumes the token", async () => {
      const resetToken = "focused-test-reset-token";
      const newPassword = "test-only-new-password";
      const resetUser = {
        passwordHash: "previous-hash",
        resetPasswordToken: hashToken(resetToken),
        resetPasswordExpires: new Date(Date.now() + 60_000),
        save: async () => {
          resetUser.saved = true;
        },
      };
      let lookup;
      let selectedFields;
      findOneImplementation = (query) => {
        lookup = query;
        return {
          select: async (fields) => {
            selectedFields = fields;
            return resetUser;
          },
        };
      };

      const logStart = logs.length;
      const response = makeResponse();
      await resetPassword(
        { body: { token: resetToken, password: newPassword } },
        response,
      );

      const resetLogs = logs.slice(logStart).join("\n");
      assert.equal(response.statusCode, 200);
      assert.equal(response.body.message, "Password successfully reset.");
      assert.equal(
        Boolean(
          lookup.resetPasswordToken === hashToken(resetToken) &&
            lookup.resetPasswordExpires.$gt instanceof Date,
        ),
        true,
        "reset lookup must use a hashed token and an expiry check",
      );
      assert.equal(selectedFields, "+passwordHash");
      assert.equal(resetUser.saved, true);
      assert.equal(await bcrypt.compare(newPassword, resetUser.passwordHash), true);
      assert.equal(resetUser.resetPasswordToken, null);
      assert.equal(resetUser.resetPasswordExpires, null);
      assert.equal(response.cookieCalled, false, "reset must not log the user in");
      assert.equal(resetLogs.includes(resetToken), false);
      assert.equal(resetLogs.includes(newPassword), false);
    });
  } finally {
    await disconnectDatabase();
    env.smtpHost = originalEnv.smtpHost;
    env.smtpPort = originalEnv.smtpPort;
    env.smtpUser = originalEnv.smtpUser;
    env.smtpPass = originalEnv.smtpPass;
    env.smtpFrom = originalEnv.smtpFrom;
    env.smtpSecure = originalEnv.smtpSecure;
    console.log = originalConsole.log;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
  }
});
