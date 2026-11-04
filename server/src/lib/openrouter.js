/**
 * server/src/lib/openrouter.js
 *
 * Small server-side wrapper around OpenRouter's chat completions API. The
 * provider is used only for advisory Job Match explanations.
 *
 * API keys and prompts are never logged or returned. Provider failures are
 * reduced to safe reasons so deterministic match results remain authoritative.
 */

import { env } from "../config/env.js";

const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
export const OPENROUTER_TIMEOUT_MS = 30000;
const SAFE_NETWORK_ERROR_CODES = new Set([
  "ENOTFOUND",
  "EAI_AGAIN",
  "ETIMEDOUT",
  "ECONNREFUSED",
  "ECONNRESET",
  "EHOSTUNREACH",
  "ECONNABORTED",
]);

export function isConfigured() {
  return Boolean(env.openRouterApiKey && env.openRouterModel);
}

function logDiagnostic(event, startedAt, details = {}) {
  const model = env.openRouterModel
    .replace(/[^a-zA-Z0-9._:/-]/g, "")
    .slice(0, 120) || "unknown";
  const fields = [
    `model=${model}`,
    `elapsed_ms=${Math.max(0, Date.now() - startedAt)}`,
  ];

  for (const [name, value] of Object.entries(details)) {
    if (value !== undefined && value !== null) {
      fields.push(`${name}=${value}`);
    }
  }

  console.error(`[openrouter] ${event} (${fields.join(", ")}).`);
}

/**
 * Request a plain-text explanation.
 *
 * Returns `{ ok: true, text }` or `{ ok: false, reason }`. It never throws,
 * and the abort signal bounds both the provider request and response body.
 */
export async function generateText(
  prompt,
  { timeoutMs = OPENROUTER_TIMEOUT_MS } = {},
) {
  if (!isConfigured()) {
    return { ok: false, reason: "unconfigured" };
  }

  const startedAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(OPENROUTER_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.openRouterApiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        model: env.openRouterModel,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 600,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const status =
        Number.isInteger(response.status) &&
        response.status >= 100 &&
        response.status <= 599
          ? response.status
          : "unknown";
      logDiagnostic("Request failed", startedAt, { status });
      return { ok: false, reason: "provider_error" };
    }

    let result;
    try {
      result = await response.json();
    } catch (error) {
      if (controller.signal.aborted || error?.name === "AbortError") {
        throw error;
      }

      logDiagnostic("Response was not valid JSON", startedAt);
      return { ok: false, reason: "invalid_response" };
    }

    const text = result?.choices?.[0]?.message?.content;
    if (typeof text !== "string" || !text.trim()) {
      logDiagnostic("Response did not contain explanation text", startedAt);
      return { ok: false, reason: "invalid_response" };
    }

    logDiagnostic("Request completed", startedAt, { status: response.status });
    return { ok: true, text: text.trim() };
  } catch (error) {
    if (controller.signal.aborted) {
      logDiagnostic("Request timed out", startedAt, {
        error_type: "AbortError",
      });
      return { ok: false, reason: "timeout" };
    }

    const code = SAFE_NETWORK_ERROR_CODES.has(error?.cause?.code)
      ? error.cause.code
      : SAFE_NETWORK_ERROR_CODES.has(error?.code)
        ? error.code
        : "NETWORK_ERROR";
    const errorType = new Set([
      "AbortError",
      "Error",
      "TimeoutError",
      "TypeError",
    ]).has(error?.name)
      ? error.name
      : "UnknownError";
    logDiagnostic("Request failed", startedAt, {
      code,
      error_type: errorType,
    });
    return { ok: false, reason: "provider_error" };
  } finally {
    clearTimeout(timeout);
  }
}
