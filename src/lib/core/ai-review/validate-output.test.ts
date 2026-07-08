import { describe, it, expect } from "vitest";
import { parseAiReviewJson } from "./validate-output";

const meta = { provider: "anthropic" as const, model: "m", promptVersion: "v1" };

function flag(overrides: Record<string, unknown> = {}) {
  return {
    flag_type: "unsupported_claim",
    severity: "high",
    rule_id: "unsupported_claims",
    transcript_offset_start: 0,
    transcript_offset_end: 5,
    quoted_text: "guar",
    reasoning: "because",
    suggested_remediation: "fix it",
    ...overrides
  };
}

describe("parseAiReviewJson", () => {
  it("parses a well-formed flag", () => {
    const result = parseAiReviewJson(JSON.stringify({ flags: [flag()] }), meta);
    expect(result.flags).toHaveLength(1);
    expect(result.provider).toBe("anthropic");
  });

  it("parses an empty flags array", () => {
    const result = parseAiReviewJson(JSON.stringify({ flags: [] }), meta);
    expect(result.flags).toHaveLength(0);
  });

  it("throws when flag_type is missing", () => {
    expect(() => parseAiReviewJson(JSON.stringify({ flags: [flag({ flag_type: undefined })] }), meta)).toThrow();
  });

  it("throws on unknown flag_type", () => {
    expect(() => parseAiReviewJson(JSON.stringify({ flags: [flag({ flag_type: "nope" })] }), meta)).toThrow(
      /Unsupported AI review flag_type/
    );
  });

  it("throws when end offset precedes start offset", () => {
    expect(() =>
      parseAiReviewJson(
        JSON.stringify({ flags: [flag({ transcript_offset_start: 10, transcript_offset_end: 2 })] }),
        meta
      )
    ).toThrow(/offset cannot be before/);
  });

  it("throws on a non-JSON string", () => {
    expect(() => parseAiReviewJson("not json", meta)).toThrow(SyntaxError);
  });

  it("throws when the top-level shape is not an object with flags array", () => {
    expect(() => parseAiReviewJson(JSON.stringify({ notFlags: 1 }), meta)).toThrow(/must be an object with a flags array/);
  });

  it("throws when a flag is not an object", () => {
    expect(() => parseAiReviewJson(JSON.stringify({ flags: ["nope"] }), meta)).toThrow(
      /Each AI review flag must be an object/
    );
  });

  it("throws on an unsupported severity", () => {
    expect(() => parseAiReviewJson(JSON.stringify({ flags: [flag({ severity: "extreme" })] }), meta)).toThrow(
      /Unsupported AI review severity/
    );
  });

  it("throws when an offset is not a non-negative number", () => {
    expect(() =>
      parseAiReviewJson(JSON.stringify({ flags: [flag({ transcript_offset_start: -1 })] }), meta)
    ).toThrow(/non-negative number/);
  });

  it("accepts the newly-supported catalog-aligned flag types", () => {
    for (const t of [
      "implied_government_endorsement",
      "urgency_high_pressure_language",
      "unlicensed_activity_language",
      "plan_comparison_risk"
    ]) {
      const result = parseAiReviewJson(JSON.stringify({ flags: [flag({ flag_type: t })] }), meta);
      expect(result.flags[0].flag_type).toBe(t);
    }
  });
});
