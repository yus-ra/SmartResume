/**
 * server/src/lib/gemini.js
 *
 * Small server-side wrapper around the Google Gemini SDK.
 *
 * This service exists for ONE feature: the advisory Job Match explanation.
 * It is deliberately not a generic AI framework.
 *
 * Rules:
 *   - The API key is read from env.js and never exposed to the client.
 *   - The key is never logged.
 *   - The client is initialized lazily, so importing this module never
 *     throws even when the SDK is missing or the key is absent.
 *   - Every public function resolves; none throw. Callers get a
 *     predictable { ok, ... } | { ok: false, reason } shape.
 *   - Provider errors are caught and mapped to safe reasons. Raw provider
 *     errors, stack traces and request payloads are never returned.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../config/env.js";

/** The model used for explanations. Single source of truth. */
const GEMINI_MODEL = "gemini-3.8-flash";
export const GEMINI_TIMEOUT_MS = 12000;
const SAFE_NETWORK_ERROR_CODES = new Set([
  "ENOTFOUND",
  "EAI_AGAIN",
  "ETIMEDOUT",
  "ECONNREFUSED",
  "ECONNRESET",
  "EHOSTUNREACH",
  "ECONNABORTED",
]);

let client = null;

/** True when a usable API key is configured. */
export function isConfigured() {
  return Boolean(env.geminiApiKey);
}

/**
 * Lazily build the SDK client. Returns null when no key is configured, so
 * callers can short-circuit without touching the network.
 */
function getClient() {
  if (client !== null) {
    return client;
  }

  if (!isConfigured()) {
    return null;
  }

  client = new GoogleGenerativeAI(env.geminiApiKey);

  return client;
}

/**
 * Call Gemini with a prompt and return plain text.
 *
 * Returns:
 *   { ok: true, text: "..." }
 *   { ok: false, reason: "unconfigured" | "provider_error" | "invalid_response" | "timeout" }
 *
 * Never throws. Never logs the API key or the prompt body in full.
 */
export async function generateText(prompt, { timeoutMs = GEMINI_TIMEOUT_MS } = {}) {
  const resolvedClient = getClient();

  if (!resolvedClient) {
    return { ok: false, reason: "unconfigured" };
  }

  let model;

  try {
    model = resolvedClient.getGenerativeModel({ model: GEMINI_MODEL });
  } catch {
    // A bad model name or SDK misuse is a server configuration problem, not
    // something the client should ever see raw.
    console.error("[gemini] Failed to build model.");

    return { ok: false, reason: "provider_error" };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const result = await model.generateContent(prompt, {
      signal: controller.signal,
    });
    const text = extractText(result);

    if (!text) {
      return { ok: false, reason: "invalid_response" };
    }

    return { ok: true, text };
  } catch (error) {
    // Never log raw provider errors; SDK errors can contain the request URL
    // (including its API key) or prompt data.
    if (controller.signal.aborted || error?.name === "AbortError") {
      console.error("[gemini] Generation timed out.");
      return { ok: false, reason: "timeout" };
    }

    const code = SAFE_NETWORK_ERROR_CODES.has(error?.code)
      ? error.code
      : "provider_error";
    const status =
      Number.isInteger(error?.status) && error.status >= 100 && error.status <= 599
        ? error.status
        : "unknown";
    console.error(`[gemini] Generation failed (code=${code}, status=${status}).`);

    return { ok: false, reason: "provider_error" };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Pull plain text out of a generateContent result across SDK versions.
 * The SDK's response shape has changed over time, so we probe defensively
 * rather than trusting one access path.
 */
function extractText(result) {
  if (!result || typeof result !== "object") {
    return "";
  }

  // Modern SDK: result.response.text()
  try {
    if (result.response && typeof result.response.text === "function") {
      const text = result.response.text();

      if (typeof text === "string" && text.trim()) {
        return text.trim();
      }
    }
  } catch {
    // Fall through to the legacy path.
  }

  // Legacy SDK shape: result.response?.candidates?.[0]?.content?.parts
  try {
    const candidates = result.response?.candidates;

    if (Array.isArray(candidates) && candidates.length > 0) {
      const parts = candidates[0].content?.parts;

      if (Array.isArray(parts)) {
        const text = parts
          .map((part) => (typeof part?.text === "string" ? part.text : ""))
          .join("")
          .trim();

        if (text) {
          return text;
        }
      }
    }
  } catch {
    // Fall through.
  }

  return "";
}
