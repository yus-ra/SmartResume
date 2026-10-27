/**
 * Convert AI endpoint outcomes into safe UI states. The deterministic match
 * result is rendered separately and remains available for every outcome.
 */
export function getExplanationFeedback(result) {
  if (!result?.ok) {
    if (result?.status === 503 && result?.error === "ai_unavailable") {
      return { unavailable: true, message: "" };
    }

    if (
      result?.status === 504 ||
      result?.error === "ai_timeout" ||
      result?.error === "request_timeout"
    ) {
      return {
        unavailable: false,
        message:
          "The AI explanation timed out. Your match score and recommendations are still available. Please try again.",
      };
    }

    if (result?.error === "server_unreachable") {
      return {
        unavailable: false,
        message:
          "Cannot reach the SmartResume server. Your match score and recommendations are still available.",
      };
    }

    return {
      unavailable: false,
      message:
        result?.message ||
        "Could not load the AI explanation. Your match score and recommendations are still available.",
    };
  }

  const explanation = result.data?.explanation;
  if (typeof explanation === "string" && explanation.trim()) {
    return { unavailable: false, explanation: explanation.trim(), message: "" };
  }

  return {
    unavailable: false,
    message:
      "The AI service returned an empty explanation. Your match score and recommendations are still available.",
  };
}
