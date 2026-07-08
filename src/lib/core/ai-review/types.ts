import { FlagSeverity } from "@/lib/types";

export type AiReviewFlagType =
  | "cross_sell_language"
  | "missing_scope_of_appointment"
  | "retirement_income_without_consent"
  | "prohibited_compensation_discussion"
  | "plan_recommendation_language"
  | "unsupported_claim"
  | "implied_government_endorsement"
  | "urgency_high_pressure_language"
  | "unlicensed_activity_language"
  | "plan_comparison_risk"
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
  // True when transcript PII sanitization ran before the provider call.
  sanitized?: boolean;
}

export interface AiReviewInput {
  verticalSlug: "medicare";
  conversationId: string;
  transcript: string;
  hasScopeOfAppointment: boolean;
  hasSeparateRetirementConsent: boolean;
  // Speaker names to redact before sending the transcript to an AI provider.
  speakerNames?: string[];
}
