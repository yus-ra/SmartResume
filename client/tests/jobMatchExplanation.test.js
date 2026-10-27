import assert from "node:assert/strict";
import { test } from "node:test";

import { getExplanationFeedback } from "../src/pages/JobMatch/explanationFeedback.js";

test("AI configuration and provider errors keep deterministic results available", () => {
  assert.deepEqual(
    getExplanationFeedback({
      ok: false,
      status: 503,
      error: "ai_unavailable",
    }),
    { unavailable: true, message: "" },
  );

  const providerFailure = getExplanationFeedback({
    ok: false,
    status: 502,
    error: "ai_provider_error",
    message: "The AI service could not complete the request. Please try again shortly.",
  });
  assert.equal(providerFailure.unavailable, false);
  assert.match(providerFailure.message, /try again shortly/);
  assert.match(providerFailure.message, /AI service/);
});

test("AI timeouts and network failures show useful retry guidance", () => {
  for (const result of [
    { ok: false, status: 504, error: "ai_timeout" },
    { ok: false, status: 0, error: "request_timeout" },
  ]) {
    const feedback = getExplanationFeedback(result);
    assert.match(feedback.message, /timed out/);
    assert.match(feedback.message, /match score and recommendations are still available/);
  }

  assert.match(
    getExplanationFeedback({ ok: false, error: "server_unreachable" }).message,
    /Cannot reach the SmartResume server/,
  );
});

test("empty provider responses are errors, never fabricated explanations", () => {
  const feedback = getExplanationFeedback({
    ok: true,
    data: { explanation: "  " },
  });
  assert.equal(feedback.explanation, undefined);
  assert.match(feedback.message, /empty explanation/);
});

test("successful explanations are trimmed and returned unchanged", () => {
  assert.deepEqual(
    getExplanationFeedback({
      ok: true,
      data: { explanation: "  Based on the supplied match data.  " },
    }),
    {
      unavailable: false,
      explanation: "Based on the supplied match data.",
      message: "",
    },
  );
});
