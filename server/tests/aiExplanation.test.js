import assert from "node:assert/strict";
import { test } from "node:test";

import { GoogleGenerativeAI } from "@google/generative-ai";
import mongoose from "mongoose";

import { connectDatabase, disconnectDatabase } from "../src/config/db.js";
import { env } from "../src/config/env.js";
import { explainMatch } from "../src/controllers/ai.controller.js";

const validBody = {
  jobTitle: "Engineer",
  company: "Example",
  jobDescription: "Build and maintain software systems.",
  matchScore: 72,
  matchedSkills: ["JavaScript"],
  missingSkills: ["Kubernetes"],
};

const makeResponse = () => ({
  statusCode: null,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});

const callController = async (body = validBody) => {
  const response = makeResponse();
  await explainMatch({ body }, response);
  return response;
};

test("Gemini explanation validation, configuration, provider errors, and timeout are safe", async (t) => {
  const originalKey = env.geminiApiKey;
  const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
  };
  const logs = [];
  const testKey = "test-only-gemini-key-marker";
  const privatePromptMarker = "test-only-prompt-marker";
  let providerMode = "success";
  let requestedModel = "";
  let sawAbortSignal = false;

  console.log = () => {};
  console.warn = () => {};
  console.error = (...args) => logs.push(args.map(String).join(" "));
  env.geminiApiKey = "";

  t.after(async () => {
    await disconnectDatabase();
    env.geminiApiKey = originalKey;
    console.log = originalConsole.log;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
  });

  t.mock.method(mongoose, "connect", async () => mongoose);
  t.mock.method(mongoose, "disconnect", async () => mongoose);
  t.mock.method(
    GoogleGenerativeAI.prototype,
    "getGenerativeModel",
    ({ model }) => {
      requestedModel = model;
      return {
        generateContent: async (_prompt, options) => {
          sawAbortSignal = options?.signal instanceof AbortSignal;

          if (providerMode === "timeout") {
            return new Promise((_, reject) => {
              options.signal.addEventListener(
                "abort",
                () => {
                  const error = new Error(`${testKey} ${privatePromptMarker}`);
                  error.name = "AbortError";
                  reject(error);
                },
                { once: true },
              );
            });
          }

          if (providerMode === "failure") {
            const error = new Error(`${testKey} ${privatePromptMarker}`);
            error.code = "ENOTFOUND";
            error.status = 429;
            throw error;
          }

          return { response: { text: () => "A safe test explanation." } };
        },
      };
    },
  );

  await connectDatabase();

  await t.test("invalid payload returns validation error before provider access", async () => {
    const response = await callController({ ...validBody, matchScore: 101 });
    assert.equal(response.statusCode, 400);
    assert.equal(response.body.error, "validation_failed");
  });

  await t.test("missing API key returns generic unavailable response", async () => {
    const response = await callController();
    assert.equal(response.statusCode, 503);
    assert.equal(response.body.error, "ai_unavailable");
    assert.equal(requestedModel, "");
  });

  env.geminiApiKey = testKey;

  await t.test("successful provider response uses the configured model", async () => {
    providerMode = "success";
    const response = await callController();
    assert.equal(response.statusCode, 200);
    assert.equal(response.body.explanation, "A safe test explanation.");
    assert.equal(requestedModel, "gemini-3.8-flash");
    assert.equal(sawAbortSignal, true);
  });

  await t.test("provider failure is generic and does not log prompt or key", async () => {
    providerMode = "failure";
    const response = await callController();
    assert.equal(response.statusCode, 502);
    assert.equal(response.body.error, "ai_provider_error");
    assert.equal(JSON.stringify(response.body).includes(testKey), false);
    assert.equal(JSON.stringify(response.body).includes(privatePromptMarker), false);
    assert.equal(logs.join("\n").includes(testKey), false);
    assert.equal(logs.join("\n").includes(privatePromptMarker), false);
    assert.equal(logs.join("\n").includes("ENOTFOUND"), true);
    assert.equal(logs.join("\n").includes("status=429"), true);
  });

  await t.test("provider timeout returns 504 without exposing provider data", async () => {
    providerMode = "timeout";
    const response = await callController();
    assert.equal(response.statusCode, 504);
    assert.equal(response.body.error, "ai_timeout");
    assert.match(response.body.message, /match score and recommendations are still available/);
    assert.equal(JSON.stringify(response.body).includes(testKey), false);
    assert.equal(logs.join("\n").includes(privatePromptMarker), false);
  });
});
