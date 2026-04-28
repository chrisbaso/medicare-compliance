import { ComplianceRuleDefinition, complianceRulesCatalog } from "@/lib/compliance/rules";

export interface MedicareComplianceRule extends ComplianceRuleDefinition {
  cmsRationale: string;
  citation: string;
}

export const medicareComplianceRules: MedicareComplianceRule[] = [
  {
    ...complianceRulesCatalog.cross_sell_contamination,
    cmsRationale:
      "Medicare health/drug plan activity must not be blended with annuity, life-insurance, or retirement-income sales activity.",
    citation: "CMS Medicare Communications and Marketing Guidelines; CMS Scope of Appointment guidance."
  },
  {
    ...complianceRulesCatalog.product_recommendation_language,
    cmsRationale:
      "The platform may support neutral education and human review, but it must not let AI or workflow automation choose a Medicare plan.",
    citation: "CMS Medicare Communications and Marketing Guidelines, marketing and sales oversight principles."
  },
  {
    ...complianceRulesCatalog.implied_government_endorsement,
    cmsRationale:
      "Organizations may not imply that a private agency is Medicare, CMS, or government-endorsed.",
    citation: "CMS Medicare Communications and Marketing Guidelines, prohibited terminology and misleading communications."
  },
  {
    ...complianceRulesCatalog.missing_separate_follow_up_consent,
    cmsRationale:
      "A separate retirement-income discussion requires a distinct, explicit permission record before follow-up.",
    citation: "CMS Scope of Appointment and consent documentation expectations; agency compliance policy."
  },
  {
    ...complianceRulesCatalog.unsupported_claims,
    cmsRationale:
      "Guarantees and unsupported certainty language can mislead beneficiaries and must be escalated.",
    citation: "CMS Medicare Communications and Marketing Guidelines, misleading communications."
  },
  {
    ...complianceRulesCatalog.urgency_high_pressure_language,
    cmsRationale:
      "High-pressure language can undermine informed beneficiary decision-making.",
    citation: "CMS Medicare Communications and Marketing Guidelines, marketing conduct standards."
  },
  {
    ...complianceRulesCatalog.unlicensed_activity_language,
    cmsRationale:
      "Retirement-income or annuity advice must be handled only by appropriately licensed humans in a separate workflow.",
    citation: "Agency licensing policy and state insurance licensing requirements."
  },
  {
    ...complianceRulesCatalog.incomplete_handoff_to_licensed_human,
    cmsRationale:
      "Detected non-Medicare product interest should route to a separate reviewed workflow instead of continuing inside the Medicare conversation.",
    citation: "Agency compliance policy implementing CMS separation and consent principles."
  },
  {
    ...complianceRulesCatalog.plan_comparison_risk,
    cmsRationale:
      "Plan comparison should stay educational and human-reviewed; AI must not produce plan recommendations.",
    citation: "CMS Medicare Communications and Marketing Guidelines, plan marketing oversight."
  }
];

export const requiredMedicareReviewChecks = [
  "scope_of_appointment_confirmation",
  "prohibited_cross_sell_language",
  "retirement_income_mention_without_consent",
  "prohibited_compensation_discussion",
  "ai_or_staff_plan_recommendation"
] as const;
