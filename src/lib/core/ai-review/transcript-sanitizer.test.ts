import { describe, it, expect } from "vitest";
import { sanitizeTranscript, restoreFlagOffsets } from "./transcript-sanitizer";
import { runAiComplianceReview } from "./review-service";
import { LlmProvider, LlmCompletionRequest } from "@/lib/core/llm/types";
import { AiReviewFlag } from "./types";

describe("sanitizeTranscript", () => {
  it("replaces a speaker name with a placeholder and records offsets", () => {
    const { sanitized, replacements } = sanitizeTranscript(
      "Harold: I need help with my Medicare plan.",
      ["Harold"]
    );
    expect(sanitized).toBe("SPEAKER_1: I need help with my Medicare plan.");
    expect(replacements).toHaveLength(1);
    expect(replacements[0]).toMatchObject({ original: "Harold", placeholder: "SPEAKER_1", start: 0, end: 6 });
  });

  it("assigns stable distinct placeholders per unique name and is case-insensitive", () => {
    const { sanitized } = sanitizeTranscript("Alex: hi. Harold: hello alex.", ["Alex", "Harold"]);
    expect(sanitized).not.toContain("Alex");
    expect(sanitized).not.toContain("alex");
    expect(sanitized).not.toContain("Harold");
    expect(sanitized).toMatch(/SPEAKER_\d/);
  });

  it("returns the transcript unchanged when no names are provided", () => {
    const { sanitized, replacements } = sanitizeTranscript("no names here", []);
    expect(sanitized).toBe("no names here");
    expect(replacements).toHaveLength(0);
  });
});

describe("restoreFlagOffsets", () => {
  it("restores a flag that pointed at a placeholder back to the original name", () => {
    const { replacements } = sanitizeTranscript("Harold: hello", ["Harold"]);
    const flags: AiReviewFlag[] = [
      {
        flag_type: "human_review_needed",
        severity: "low",
        rule_id: "x",
        transcript_offset_start: 0,
        transcript_offset_end: 9, // "SPEAKER_1"
        quoted_text: "SPEAKER_1",
        reasoning: "r",
        suggested_remediation: "s"
      }
    ];
    const restored = restoreFlagOffsets(flags, replacements);
    expect(restored[0].quoted_text).toBe("Harold");
    expect(restored[0].transcript_offset_start).toBe(0);
  });

  it("is a no-op when there are no replacements", () => {
    const flags: AiReviewFlag[] = [];
    expect(restoreFlagOffsets(flags, [])).toBe(flags);
  });
});

describe("runAiComplianceReview sanitization integration", () => {
  it("sends sanitized transcript to the provider and marks the result sanitized", async () => {
    let seenPrompt = "";
    const provider: LlmProvider = {
      async complete(req: LlmCompletionRequest) {
        seenPrompt = req.messages.map((m) => m.content).join("\n");
        return { text: JSON.stringify({ flags: [] }), provider: "mock", model: "mock-1" };
      }
    };

    const result = await runAiComplianceReview(
      {
        verticalSlug: "medicare",
        conversationId: "c1",
        transcript: "Harold: I am worried about my Medicare premium.",
        hasScopeOfAppointment: true,
        hasSeparateRetirementConsent: true,
        speakerNames: ["Harold"]
      },
      { provider, model: "mock-1" }
    );

    expect(seenPrompt).not.toContain("Harold");
    expect(seenPrompt).toContain("SPEAKER_1");
    expect(result.sanitized).toBe(true);
  });
});
