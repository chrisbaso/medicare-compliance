import { AiReviewInput, AiReviewResult } from "@/lib/core/ai-review/types";
import { runDeterministicAiReview } from "@/lib/core/ai-review/deterministic-review";
import { parseAiReviewJson } from "@/lib/core/ai-review/validate-output";
import { sanitizeTranscript, restoreFlagOffsets } from "@/lib/core/ai-review/transcript-sanitizer";
import { LlmProvider } from "@/lib/core/llm/types";
import { buildMedicareComplianceReviewPrompt } from "@/lib/verticals/medicare/ai-prompts";
import { medicareComplianceRules } from "@/lib/verticals/medicare/compliance-rules";

export interface AiReviewServiceOptions {
  provider?: LlmProvider;
  model?: "claude-opus-4-1-20250805" | "claude-sonnet-4-20250514" | string;
}

export async function runAiComplianceReview(
  input: AiReviewInput,
  options: AiReviewServiceOptions = {}
): Promise<AiReviewResult> {
  if (!options.provider) {
    return runDeterministicAiReview(input);
  }

  // Redact speaker names before the transcript leaves the server.
  const { sanitized, replacements } = sanitizeTranscript(
    input.transcript,
    input.speakerNames ?? []
  );
  const didSanitize = replacements.length > 0;

  const prompt = buildMedicareComplianceReviewPrompt({
    rules: medicareComplianceRules,
    transcript: sanitized
  });
  const model = options.model ?? "claude-sonnet-4-20250514";
  const response = await options.provider.complete({
    model,
    temperature: 0,
    maxTokens: 2000,
    messages: [
      {
        role: "system",
        content:
          "You are a compliance operations reviewer. Return structured JSON only. Do not recommend products."
      },
      {
        role: "user",
        content: prompt
      }
    ]
  });

  const parsed = parseAiReviewJson(response.text, {
    provider: response.provider === "anthropic" ? "anthropic" : "mock",
    model: response.model,
    promptVersion: "medicare-compliance-v1"
  });

  // Map flag offsets from the sanitized transcript back onto the original.
  return {
    ...parsed,
    flags: restoreFlagOffsets(parsed.flags, replacements),
    sanitized: didSanitize
  };
}
