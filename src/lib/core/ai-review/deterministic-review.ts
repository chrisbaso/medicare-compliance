import { AiReviewFlag, AiReviewInput, AiReviewResult, AiReviewFlagType } from "@/lib/core/ai-review/types";

const deterministicRules: {
  type: AiReviewFlagType;
  ruleId: string;
  severity: AiReviewFlag["severity"];
  phrases: string[];
  reasoning: string;
  remediation: string;
  requiresMissingSeparateConsent?: boolean;
}[] = [
  {
    type: "cross_sell_language",
    ruleId: "cross_sell_contamination",
    severity: "high",
    phrases: ["annuity", "life insurance", "income product", "retirement income"],
    reasoning:
      "A non-Medicare product or retirement-income topic appeared inside a Medicare conversation.",
    remediation:
      "Pause the topic and route it to a separate consented workflow owned by a licensed human.",
    requiresMissingSeparateConsent: true
  },
  {
    type: "plan_recommendation_language",
    ruleId: "product_recommendation_language",
    severity: "high",
    phrases: ["best plan", "you should enroll", "you should switch", "right plan for you"],
    reasoning:
      "Directive wording can sound like a Medicare plan recommendation instead of neutral education.",
    remediation: "Restate the interaction as neutral education and route to human compliance review."
  },
  {
    type: "unsupported_claim",
    ruleId: "unsupported_claims",
    severity: "high",
    phrases: ["guaranteed", "no risk", "always approved"],
    reasoning: "Guarantee language can create unsupported expectations.",
    remediation: "Remove unsupported certainty language and document a reviewer note."
  },
  {
    type: "prohibited_compensation_discussion",
    ruleId: "prohibited_compensation_discussion",
    severity: "medium",
    phrases: ["commission", "bonus", "paid more", "compensation"],
    reasoning: "Compensation discussion in a beneficiary conversation requires review.",
    remediation: "Keep compensation topics out of beneficiary guidance and escalate for review."
  }
];

function createFlag(input: {
  transcript: string;
  phrase: string;
  type: AiReviewFlagType;
  ruleId: string;
  severity: AiReviewFlag["severity"];
  reasoning: string;
  remediation: string;
}): AiReviewFlag {
  const lower = input.transcript.toLowerCase();
  const start = lower.indexOf(input.phrase.toLowerCase());
  const safeStart = Math.max(start, 0);
  const safeEnd = start >= 0 ? safeStart + input.phrase.length : safeStart;

  return {
    flag_type: input.type,
    severity: input.severity,
    rule_id: input.ruleId,
    transcript_offset_start: safeStart,
    transcript_offset_end: safeEnd,
    quoted_text: start >= 0 ? input.transcript.slice(safeStart, safeEnd) : input.phrase,
    reasoning: input.reasoning,
    suggested_remediation: input.remediation
  };
}

export function runDeterministicAiReview(input: AiReviewInput): AiReviewResult {
  const flags: AiReviewFlag[] = [];
  const lower = input.transcript.toLowerCase();

  if (!input.hasScopeOfAppointment && lower.includes("medicare")) {
    flags.push(
      createFlag({
        transcript: input.transcript,
        phrase: "Medicare",
        type: "missing_scope_of_appointment",
        ruleId: "scope_of_appointment_required",
        severity: "high",
        reasoning:
          "The transcript appears to include Medicare plan-related discussion but no scope-of-appointment confirmation is on file.",
        remediation: "Capture or verify SOA before plan-specific discussion continues."
      })
    );
  }

  for (const rule of deterministicRules) {
    if (rule.requiresMissingSeparateConsent && input.hasSeparateRetirementConsent) {
      continue;
    }

    const phrase = rule.phrases.find((candidate) => lower.includes(candidate));
    if (phrase) {
      flags.push(
        createFlag({
          transcript: input.transcript,
          phrase,
          type: rule.requiresMissingSeparateConsent
            ? "retirement_income_without_consent"
            : rule.type,
          ruleId: rule.ruleId,
          severity: rule.severity,
          reasoning: rule.requiresMissingSeparateConsent
            ? `${rule.reasoning} No separate retirement-income consent is documented.`
            : rule.reasoning,
          remediation: rule.remediation
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
