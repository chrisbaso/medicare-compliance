import { describe, it, expect } from "vitest";
import { DEFAULT_AI_REVIEW_MODEL, runAiComplianceReview } from "./review-service";
import { LlmCompletionRequest, LlmProvider } from "@/lib/core/llm/types";

function captureProvider() {
  const seen: { request?: LlmCompletionRequest } = {};
  const provider: LlmProvider = {
    async complete(request) {
      seen.request = request;
      return { text: JSON.stringify({ flags: [] }), provider: "mock", model: request.model };
    }
  };
  return { provider, seen };
}

const input = {
  verticalSlug: "medicare" as const,
  conversationId: "c1",
  transcript: "Agent: hello",
  hasScopeOfAppointment: true,
  hasSeparateRetirementConsent: true
};

describe("runAiComplianceReview request contract", () => {
  it("defaults to a current, non-retired model", async () => {
    const { provider, seen } = captureProvider();
    await runAiComplianceReview(input, { provider });
    expect(seen.request?.model).toBe(DEFAULT_AI_REVIEW_MODEL);
    // Guard against regressing to a dated snapshot ID (the retired
    // claude-sonnet-4-20250514 pin was a production outage in waiting).
    expect(seen.request?.model).not.toMatch(/-\d{8}$/);
  });

  it("never injects a sampling temperature (current models 400 on it)", async () => {
    const { provider, seen } = captureProvider();
    await runAiComplianceReview(input, { provider });
    expect(seen.request?.temperature).toBeUndefined();
  });

  it("leaves output headroom for adaptive thinking", async () => {
    const { provider, seen } = captureProvider();
    await runAiComplianceReview(input, { provider });
    expect(seen.request?.maxTokens).toBeGreaterThanOrEqual(8000);
  });

  it("honors an explicit model override", async () => {
    const { provider, seen } = captureProvider();
    await runAiComplianceReview(input, { provider, model: "claude-opus-4-8" });
    expect(seen.request?.model).toBe("claude-opus-4-8");
  });
});
