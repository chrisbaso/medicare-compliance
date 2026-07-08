import { AiReviewFlag, AiReviewInput, AiReviewResult, AiReviewFlagType } from "@/lib/core/ai-review/types";
import { FlagSeverity } from "@/lib/types";
import {
  ComplianceRuleKey,
  complianceRulesCatalog,
  annuityKeywords,
  retirementIncomeKeywords
} from "@/lib/compliance/rules";

/**
 * Deterministic (no-LLM) compliance review.
 *
 * This is the fallback engine used when no AI provider key is configured. It is
 * intentionally driven by the SAME medicare rule catalog the AI prompt uses, so
 * a no-key deployment does not silently miss rule types. Every emitted flag's
 * rule_id is a real catalog ruleKey, EXCEPT for two documented consent-derived
 * checks (see NON_CATALOG_CHECKS) that are state-driven rather than phrase-driven.
 */

// Maps each catalog rule to the semantic flag_type surfaced to reviewers.
const RULE_FLAG_TYPE: Record<ComplianceRuleKey, AiReviewFlagType> = {
  cross_sell_contamination: "cross_sell_language",
  product_recommendation_language: "plan_recommendation_language",
  implied_government_endorsement: "implied_government_endorsement",
  missing_separate_follow_up_consent: "retirement_income_without_consent",
  unsupported_claims: "unsupported_claim",
  urgency_high_pressure_language: "urgency_high_pressure_language",
  unlicensed_activity_language: "unlicensed_activity_language",
  incomplete_handoff_to_licensed_human: "human_review_needed",
  plan_comparison_risk: "plan_comparison_risk"
};

// Recognized checks that are NOT phrase entries in the CMS rule catalog because
// they derive from consent STATE, not transcript wording. Documented here so the
// mapping stays honest (see docs/COMPLIANCE_RULES.md). Tests allow these rule_ids.
export const NON_CATALOG_CHECKS = {
  scope_of_appointment: "scope_of_appointment_required",
  prohibited_compensation: "prohibited_compensation_discussion"
} as const;

const compensationPhrases = ["commission", "bonus", "paid more", "compensation"];

function flagForMatch(input: {
  transcript: string;
  phrase: string;
  matchIndex: number;
  flagType: AiReviewFlagType;
  ruleId: string;
  severity: FlagSeverity;
  reasoning: string;
  remediation: string;
}): AiReviewFlag {
  const start = input.matchIndex;
  const end = start + input.phrase.length;
  return {
    flag_type: input.flagType,
    severity: input.severity,
    rule_id: input.ruleId,
    transcript_offset_start: start,
    transcript_offset_end: end,
    quoted_text: input.transcript.slice(start, end),
    reasoning: input.reasoning,
    suggested_remediation: input.remediation
  };
}

// Returns the start offset of every (case-insensitive) occurrence of phrase.
function allMatchOffsets(lowerTranscript: string, phrase: string): number[] {
  const needle = phrase.toLowerCase();
  const offsets: number[] = [];
  let from = 0;
  for (;;) {
    const idx = lowerTranscript.indexOf(needle, from);
    if (idx === -1) break;
    offsets.push(idx);
    from = idx + needle.length;
  }
  return offsets;
}

export function runDeterministicAiReview(input: AiReviewInput): AiReviewResult {
  const flags: AiReviewFlag[] = [];
  const lower = input.transcript.toLowerCase();

  // 1) Consent-state check: SOA missing while Medicare plan discussion present.
  if (!input.hasScopeOfAppointment && lower.includes("medicare")) {
    const idx = lower.indexOf("medicare");
    flags.push(
      flagForMatch({
        transcript: input.transcript,
        phrase: "Medicare",
        matchIndex: idx,
        flagType: "missing_scope_of_appointment",
        ruleId: NON_CATALOG_CHECKS.scope_of_appointment,
        severity: "high",
        reasoning:
          "The transcript appears to include Medicare plan-related discussion but no scope-of-appointment confirmation is on file.",
        remediation: "Capture or verify SOA before plan-specific discussion continues."
      })
    );
  }

  // 2) Consent-state check: retirement/annuity cross-sell without separate consent.
  if (!input.hasSeparateRetirementConsent) {
    const crossSellPhrases = [...annuityKeywords, ...retirementIncomeKeywords];
    for (const phrase of crossSellPhrases) {
      for (const idx of allMatchOffsets(lower, phrase)) {
        flags.push(
          flagForMatch({
            transcript: input.transcript,
            phrase,
            matchIndex: idx,
            flagType: RULE_FLAG_TYPE.missing_separate_follow_up_consent,
            ruleId: "missing_separate_follow_up_consent",
            severity: complianceRulesCatalog.missing_separate_follow_up_consent.severity,
            reasoning:
              "A non-Medicare product or retirement-income topic appeared inside a Medicare conversation, and no separate retirement-income consent is documented.",
            remediation:
              "Pause the topic and route it to a separate consented workflow owned by a licensed human."
          })
        );
      }
    }
  }

  // 3) Phrase-driven catalog rules — every occurrence produces a flag.
  const phraseRuleKeys: ComplianceRuleKey[] = [
    "product_recommendation_language",
    "implied_government_endorsement",
    "unsupported_claims",
    "urgency_high_pressure_language",
    "unlicensed_activity_language",
    "plan_comparison_risk"
  ];
  for (const ruleKey of phraseRuleKeys) {
    const rule = complianceRulesCatalog[ruleKey];
    for (const phrase of rule.phrases ?? []) {
      for (const idx of allMatchOffsets(lower, phrase)) {
        flags.push(
          flagForMatch({
            transcript: input.transcript,
            phrase,
            matchIndex: idx,
            flagType: RULE_FLAG_TYPE[ruleKey],
            ruleId: ruleKey,
            severity: rule.severity,
            reasoning: rule.description,
            remediation: rule.remediationGuidance
          })
        );
      }
    }
  }

  // 4) Recognized non-catalog check: compensation discussion (see NON_CATALOG_CHECKS).
  for (const phrase of compensationPhrases) {
    for (const idx of allMatchOffsets(lower, phrase)) {
      flags.push(
        flagForMatch({
          transcript: input.transcript,
          phrase,
          matchIndex: idx,
          flagType: "prohibited_compensation_discussion",
          ruleId: NON_CATALOG_CHECKS.prohibited_compensation,
          severity: "medium",
          reasoning: "Compensation discussion in a beneficiary conversation requires review.",
          remediation: "Keep compensation topics out of beneficiary guidance and escalate for review."
        })
      );
    }
  }

  return {
    flags,
    provider: "deterministic",
    model: "local-rules",
    promptVersion: "medicare-compliance-v1"
  };
}
