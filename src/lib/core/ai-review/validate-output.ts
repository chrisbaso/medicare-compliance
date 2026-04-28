import { AiReviewFlag, AiReviewFlagType, AiReviewResult } from "@/lib/core/ai-review/types";
import { FlagSeverity } from "@/lib/types";

const severities = new Set<FlagSeverity>(["low", "medium", "high", "critical"]);
const flagTypes = new Set<AiReviewFlagType>([
  "cross_sell_language",
  "missing_scope_of_appointment",
  "retirement_income_without_consent",
  "prohibited_compensation_discussion",
  "plan_recommendation_language",
  "unsupported_claim",
  "human_review_needed"
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(record: Record<string, unknown>, key: keyof AiReviewFlag) {
  const value = record[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`AI review output missing string '${String(key)}'.`);
  }
  return value;
}

function readNumber(record: Record<string, unknown>, key: keyof AiReviewFlag) {
  const value = record[key];
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new Error(`AI review output missing non-negative number '${String(key)}'.`);
  }
  return value;
}

export function parseAiReviewJson(
  text: string,
  metadata: Pick<AiReviewResult, "provider" | "model" | "promptVersion">
): AiReviewResult {
  const parsed = JSON.parse(text) as unknown;

  if (!isRecord(parsed) || !Array.isArray(parsed.flags)) {
    throw new Error("AI review output must be an object with a flags array.");
  }

  const flags = parsed.flags.map((flag): AiReviewFlag => {
    if (!isRecord(flag)) {
      throw new Error("Each AI review flag must be an object.");
    }

    const flagType = readString(flag, "flag_type") as AiReviewFlagType;
    const severity = readString(flag, "severity") as FlagSeverity;

    if (!flagTypes.has(flagType)) {
      throw new Error(`Unsupported AI review flag_type '${flagType}'.`);
    }

    if (!severities.has(severity)) {
      throw new Error(`Unsupported AI review severity '${severity}'.`);
    }

    const start = readNumber(flag, "transcript_offset_start");
    const end = readNumber(flag, "transcript_offset_end");

    if (end < start) {
      throw new Error("AI review flag end offset cannot be before start offset.");
    }

    return {
      flag_type: flagType,
      severity,
      rule_id: readString(flag, "rule_id"),
      transcript_offset_start: start,
      transcript_offset_end: end,
      quoted_text: readString(flag, "quoted_text"),
      reasoning: readString(flag, "reasoning"),
      suggested_remediation: readString(flag, "suggested_remediation")
    };
  });

  return {
    flags,
    ...metadata
  };
}
