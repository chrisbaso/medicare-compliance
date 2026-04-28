import { FlagSeverity } from "@/lib/types";

export type AiReviewFlagType =
  | "cross_sell_language"
  | "missing_scope_of_appointment"
  | "retirement_income_without_consent"
  | "prohibited_compensation_discussion"
  | "plan_recommendation_language"
  | "unsupported_claim"
  | "human_review_needed";

export interface AiReviewFlag {
  flag_type: AiReviewFlagType;
  severity: FlagSeverity;
  rule_id: string;
  transcript_offset_start: number;
  transcript_offset_end: number;
  quoted_text: string;
  reasoning: string;
  suggested_remediation: string;
}

export interface AiReviewResult {
  flags: AiReviewFlag[];
  provider: "anthropic" | "deterministic" | "mock";
  model: string;
  promptVersion: string;
}

export interface AiReviewInput {
  verticalSlug: "medicare";
  conversationId: string;
  transcript: string;
  hasScopeOfAppointment: boolean;
  hasSeparateRetirementConsent: boolean;
}
