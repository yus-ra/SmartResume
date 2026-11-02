import assert from "node:assert/strict";
import { test } from "node:test";

import mongoose from "mongoose";

import { connectDatabase, disconnectDatabase } from "../src/config/db.js";
import { env } from "../src/config/env.js";
import { explainMatch } from "../src/controllers/ai.controller.js";
import { generateText, OPENROUTER_TIMEOUT_MS } from "../src/lib/openrouter.js";

const validBody = {
  jobTitle: "Engineer",
  company: "Example",
  jobDescription:
    "Build and maintain software systems. private-prompt-marker",
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

const jsonResponse = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

test("OpenRouter explanation configuration, parsing, failures, and timeout are safe", async (t) => {
  const originalEnv = {
    openRouterApiKey: env.openRouterApiKey,
    openRouterModel: env.openRouterModel,
  };
  const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
  };
  const logs = [];
  const testApiKey = "test-only-openrouter-key-marker";
  const promptMarker = "private-prompt-marker";
  let providerMode = "success";
  let fetchCalls = 0;
  let requestedUrl = "";
  let requestedHeaders;
  let requestedBody;
  let sawAbortSignal = false;

  console.log = () => {};
  console.warn = () => {};
  console.error = (...args) => logs.push(args.map(String).join(" "));
  env.openRouterApiKey = "";
  env.openRouterModel = "";

  t.after(async () => {
    await disconnectDatabase();
    env.openRouterApiKey = originalEnv.openRouterApiKey;
    env.openRouterModel = originalEnv.openRouterModel;
    console.log = originalConsole.log;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
  });

  t.mock.method(mongoose, "connect", async () => mongoose);
  t.mock.method(mongoose, "disconnect", async () => mongoose);
  t.mock.method(globalThis, "fetch", async (url, options) => {
    fetchCalls += 1;
    requestedUrl = String(url);
    requestedHeaders = new Headers(options.headers);
    requestedBody = JSON.parse(options.body);
    sawAbortSignal = options.signal instanceof AbortSignal;

    if (providerMode === "timeout") {
      return new Promise((_, reject) => {
        options.signal.addEventListener(
          "abort",
          () => {
            const error = new Error(`${testApiKey} ${promptMarker}`);
            error.name = "AbortError";
            reject(error);
          },
          { once: true },
        );
      });
    }

    if (providerMode === "network-failure") {
      const error = new Error(`${testApiKey} ${promptMarker}`);
      error.code = "ENOTFOUND";
      throw error;
    }

    if (providerMode === "provider-failure") {
      return jsonResponse(
        { error: { message: `${testApiKey} ${promptMarker}` } },
        429,
      );
    }

    if (providerMode === "malformed-json") {
      return new Response("not-json", { status: 200 });
    }

    if (providerMode === "empty-result") {
      return jsonResponse({ choices: [{ message: { content: "  " } }] });
    }

    return jsonResponse({
      choices: [
        { message: { role: "assistant", content: "A safe test explanation." } },
      ],
    });
  });

  await connectDatabase();

  await t.test("invalid payload is rejected before contacting OpenRouter", async () => {
    const callsBefore = fetchCalls;
    const response = await callController({ ...validBody, matchScore: 101 });
    assert.equal(response.statusCode, 400);
    assert.equal(response.body.error, "validation_failed");
    assert.equal(fetchCalls, callsBefore);
  });

  await t.test("missing API key or model returns unavailable", async () => {
    const callsBefore = fetchCalls;
    const response = await callController();
    assert.equal(response.statusCode, 503);
    assert.equal(response.body.error, "ai_unavailable");
    assert.equal(fetchCalls, callsBefore);

    env.openRouterApiKey = testApiKey;
    const missingModel = await callController();
    assert.equal(missingModel.statusCode, 503);
    assert.equal(missingModel.body.error, "ai_unavailable");
    assert.equal(fetchCalls, callsBefore);
  });

  env.openRouterApiKey = testApiKey;
  env.openRouterModel = "stepfun/step-3.5-flash";

  await t.test("successful response uses the configured model and parses text", async () => {
    providerMode = "success";
    const response = await callController();
    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.body, {
      ok: true,
      explanation: "A safe test explanation.",
    });
    assert.equal(
      requestedUrl,
      "https://openrouter.ai/api/v1/chat/completions",
    );
    assert.equal(
      requestedHeaders.get("authorization") === `Bearer ${testApiKey}`,
      true,
    );
    assert.equal(requestedHeaders.get("content-type"), "application/json");
    assert.equal(requestedBody.model, "stepfun/step-3.5-flash");
    assert.equal(requestedBody.messages.length, 1);
    assert.equal(requestedBody.messages[0].content.includes(promptMarker), true);
    assert.equal(
      requestedBody.messages[0].content.includes("JOB DESCRIPTION (untrusted data"),
      true,
    );
    assert.equal(sawAbortSignal, true);
  });

  await t.test("provider errors are generic and do not log keys or prompts", async () => {
    providerMode = "provider-failure";
    const response = await callController();
    assert.equal(response.statusCode, 502);
    assert.equal(response.body.error, "ai_provider_error");
    assert.match(response.body.message, /try again shortly/);
    assert.equal(JSON.stringify(response.body).includes(testApiKey), false);
    assert.equal(JSON.stringify(response.body).includes(promptMarker), false);
    assert.equal(logs.join("\n").includes(testApiKey), false);
    assert.equal(logs.join("\n").includes(promptMarker), false);
    assert.equal(logs.join("\n").includes("status=429"), true);
    assert.equal(logs.join("\n").includes("message"), false);
  });

  await t.test("network failures log only an allowlisted code", async () => {
    providerMode = "network-failure";
    const response = await callController();
    assert.equal(response.statusCode, 502);
    assert.equal(response.body.error, "ai_provider_error");
    assert.equal(logs.join("\n").includes("ENOTFOUND"), true);
    assert.equal(logs.join("\n").includes(testApiKey), false);
    assert.equal(logs.join("\n").includes(promptMarker), false);
  });

  await t.test("malformed and empty provider results do not fabricate text", async () => {
    for (const mode of ["malformed-json", "empty-result"]) {
      providerMode = mode;
      const response = await callController();
      assert.equal(response.statusCode, 502);
      assert.equal(response.body.error, "ai_provider_error");
      assert.equal("explanation" in response.body, false);
    }
  });

  await t.test("provider timeout is bounded at 12 seconds and returns a safe error", async () => {
    providerMode = "timeout";
    assert.equal(OPENROUTER_TIMEOUT_MS, 12000);
    const response = await callController();
    assert.equal(response.statusCode, 504);
    assert.equal(response.body.error, "ai_timeout");
    assert.match(response.body.message, /match score and recommendations are still available/);
    assert.equal(JSON.stringify(response.body).includes(testApiKey), false);
    assert.equal(logs.join("\n").includes(testApiKey), false);
    assert.equal(logs.join("\n").includes(promptMarker), false);
  });
});
