import { MedicareComplianceRule } from "@/lib/verticals/medicare/compliance-rules";

export function buildMedicareComplianceReviewPrompt({
  rules,
  transcript
}: {
  rules: MedicareComplianceRule[];
  transcript: string;
}) {
  const ruleText = rules
    .map(
      (rule) =>
        `Rule ${rule.ruleKey}: ${rule.title}\nSeverity: ${rule.severity}\nRationale: ${rule.cmsRationale}\nRemediation: ${rule.remediationGuidance}`
    )
    .join("\n\n");

  return `You are reviewing a Medicare agency conversation for compliance operations.

Non-negotiable constraints:
- Do not recommend Medicare plans.
- Do not recommend annuities, life insurance, or retirement-income products.
- Keep Medicare health/drug plan workflows separate from retirement-income follow-up.
- Flag risks and explain reasoning for a human reviewer.
- Cite exact transcript text and character offsets when possible.

Return only valid JSON with this shape:
{
  "flags": [
    {
      "flag_type": "string",
      "severity": "low|medium|high|critical",
      "rule_id": "string",
      "transcript_offset_start": 0,
      "transcript_offset_end": 0,
      "quoted_text": "string",
      "reasoning": "string",
      "suggested_remediation": "string"
    }
  ]
}

Rules:
${ruleText}

Transcript:
${transcript}`;
}

export const medicareAiPrompts = {
  complianceReview: "buildMedicareComplianceReviewPrompt"
};
