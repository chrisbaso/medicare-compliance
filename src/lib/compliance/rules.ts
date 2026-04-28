import { FlagSeverity } from "@/lib/types";

export type ComplianceRuleKey =
  | "cross_sell_contamination"
  | "product_recommendation_language"
  | "implied_government_endorsement"
  | "missing_separate_follow_up_consent"
  | "unsupported_claims"
  | "urgency_high_pressure_language"
  | "unlicensed_activity_language"
  | "incomplete_handoff_to_licensed_human"
  | "plan_comparison_risk";

export interface ComplianceRuleDefinition {
  ruleKey: ComplianceRuleKey;
  title: string;
  description: string;
  severity: FlagSeverity;
  triggerExamples: string[];
  remediationGuidance: string;
  blocksWorkflow: boolean;
  phrases?: string[];
}

export const medicareSupplementKeywords = [
  "medigap",
  "medicare supplement",
  "supplement plan"
];

export const medicareAdvantageKeywords = [
  "medicare advantage",
  "advantage plan"
];

export const partDKeywords = [
  "part d",
  "drug plan",
  "formulary",
  "pharmacy"
];

export const turning65Keywords = [
  "turning 65",
  "enrollment window",
  "birthday",
  "initial enrollment"
];

export const serviceKeywords = [
  "billing",
  "address",
  "beneficiary",
  "claim",
  "claims",
  "draft",
  "mailing",
  "service",
  "document request"
];

export const missingDocumentKeywords = [
  "missing document",
  "missing packet",
  "renewal packet",
  "signature page",
  "upload instructions"
];

export const premiumIncreaseKeywords = [
  "premium increase",
  "rate increase",
  "cost went up",
  "affordability",
  "future costs"
];

export const retirementIncomeKeywords = [
  "retirement income",
  "income last",
  "income stability",
  "future costs",
  "stable income",
  "drawdown",
  "market swings",
  "market volatility",
  "retire"
];

export const annuityKeywords = [
  "annuity",
  "fixed annuity",
  "indexed annuity",
  "life insurance",
  "whole life",
  "universal life"
];

export const marketRiskKeywords = [
  "market volatility",
  "market swings",
  "market risk",
  "volatility"
];

export const cdKeywords = [
  "cd",
  "certificate of deposit",
  "cd maturing",
  "cd renewing"
];

export const spouseLossKeywords = [
  "spouse passed",
  "wife passed",
  "husband passed",
  "lost my spouse"
];

export const consentKeywords = [
  "consent",
  "permission",
  "authorization",
  "recorded line",
  "scope of appointment",
  "soa"
];

export const clearFollowUpInterestKeywords = [
  "want to talk later",
  "want a later conversation",
  "would like to discuss",
  "need help talking through",
  "asked whether retirement income",
  "may need help",
  "please call me about",
  "future discussion"
];

export const followUpSuggestionKeywords = [
  "follow-up",
  "follow up",
  "call later",
  "later conversation",
  "separate conversation",
  "separate workflow",
  "licensed follow-up",
  "licensed human"
];

export const licensedHumanKeywords = [
  "licensed human",
  "licensed follow-up",
  "licensed advisor",
  "licensed agent",
  "licensed reviewer"
];

export const planComparisonKeywords = [
  "compare",
  "comparison",
  "which is better",
  "better than",
  "difference between",
  "versus"
];

export const complianceRulesCatalog: Record<ComplianceRuleKey, ComplianceRuleDefinition> = {
  cross_sell_contamination: {
    ruleKey: "cross_sell_contamination",
    title: "Cross-sell contamination",
    description:
      "Retirement-income, annuity, or life-insurance discussion appeared inside a Medicare health or drug-plan workflow.",
    severity: "high",
    triggerExamples: [
      "We can review the annuity while we compare your Medicare supplement options.",
      "Let's handle your life insurance questions during this Part D conversation."
    ],
    remediationGuidance:
      "Stop product crossover, document the separation, and move any later discussion into a separate consented workflow.",
    blocksWorkflow: true
  },
  product_recommendation_language: {
    ruleKey: "product_recommendation_language",
    title: "Product recommendation language",
    description:
      "Directive language can imply that the system or staff recommended a specific Medicare plan.",
    severity: "high",
    triggerExamples: [
      "This is the best plan for you.",
      "You should switch to that plan."
    ],
    remediationGuidance:
      "Replace recommendation language with neutral education and route the conversation for human compliance review.",
    blocksWorkflow: true,
    phrases: [
      "best plan",
      "you should switch",
      "you should enroll",
      "switch plans",
      "this is the right plan",
      "better plan for you"
    ]
  },
  implied_government_endorsement: {
    ruleKey: "implied_government_endorsement",
    title: "Implied government endorsement",
    description:
      "Language implying Medicare or government approval, sponsorship, or endorsement is not allowed.",
    severity: "critical",
    triggerExamples: [
      "We are a Medicare-approved agency.",
      "This is an official Medicare agency."
    ],
    remediationGuidance:
      "Pause outreach and escalate for compliance review immediately.",
    blocksWorkflow: true,
    phrases: [
      "medicare-approved agency",
      "medicare approved agency",
      "government-approved",
      "official medicare agency"
    ]
  },
  missing_separate_follow_up_consent: {
    ruleKey: "missing_separate_follow_up_consent",
    title: "Missing separate follow-up consent",
    description:
      "A separate follow-up was suggested or detected, but explicit consent is not fully documented.",
    severity: "high",
    triggerExamples: [
      "Let's talk later about income options once you are ready.",
      "We can set up a separate follow-up, but there is no documented consent yet."
    ],
    remediationGuidance:
      "Request or verify explicit separate follow-up consent before any assignment or outreach.",
    blocksWorkflow: true
  },
  unsupported_claims: {
    ruleKey: "unsupported_claims",
    title: "Unsupported claims",
    description:
      "Guarantee or certainty language can create misleading expectations and requires human review.",
    severity: "high",
    triggerExamples: [
      "This is guaranteed to solve the issue.",
      "You are guaranteed to save money."
    ],
    remediationGuidance:
      "Remove unsupported claims and have a human reviewer verify the transcript summary.",
    blocksWorkflow: true,
    phrases: [
      "guaranteed",
      "guarantee this will",
      "guarantee you will",
      "always approved",
      "no risk"
    ]
  },
  urgency_high_pressure_language: {
    ruleKey: "urgency_high_pressure_language",
    title: "Urgency or high-pressure language",
    description:
      "Pressure tactics can create inappropriate urgency in a Medicare or separate follow-up conversation.",
    severity: "medium",
    triggerExamples: [
      "You need to act now.",
      "This must be done today before it is too late."
    ],
    remediationGuidance:
      "Remove urgency language and restate the next step in neutral operational terms.",
    blocksWorkflow: false,
    phrases: [
      "act now",
      "must do this today",
      "before it's too late",
      "limited time",
      "don't wait"
    ]
  },
  unlicensed_activity_language: {
    ruleKey: "unlicensed_activity_language",
    title: "Unlicensed-activity style language",
    description:
      "Language suggesting investment, annuity, or retirement-income advice without a licensed-human handoff should be reviewed.",
    severity: "high",
    triggerExamples: [
      "I can recommend the annuity for you today.",
      "I can advise on your retirement income choices right now."
    ],
    remediationGuidance:
      "Stop the discussion, document the need for a licensed human, and move the matter into a separate follow-up workflow if consented.",
    blocksWorkflow: true,
    phrases: [
      "i can recommend the annuity",
      "i can sell you an annuity",
      "i can advise on your retirement income",
      "i can compare income products for you",
      "i can set up the annuity today"
    ]
  },
  incomplete_handoff_to_licensed_human: {
    ruleKey: "incomplete_handoff_to_licensed_human",
    title: "Incomplete handoff to licensed human",
    description:
      "A retirement-income signal was detected, but the transcript does not show a clear separate handoff to a licensed human.",
    severity: "medium",
    triggerExamples: [
      "The client raised retirement-income concerns, but no separate follow-up was established.",
      "The transcript shows income-related questions without a licensed-human handoff."
    ],
    remediationGuidance:
      "Document a separate licensed-human handoff and keep any follow-up outside the Medicare workflow.",
    blocksWorkflow: true
  },
  plan_comparison_risk: {
    ruleKey: "plan_comparison_risk",
    title: "Plan comparison risk",
    description:
      "Plan comparison language can drift into recommendation territory and should stay neutral.",
    severity: "medium",
    triggerExamples: [
      "Which plan is better?",
      "Can you compare this advantage plan to a supplement for me?"
    ],
    remediationGuidance:
      "Keep the comparison educational, avoid recommendation language, and route for review if the discussion becomes directive.",
    blocksWorkflow: false,
    phrases: ["compare", "comparison", "which is better", "better than", "difference between", "versus"]
  }
};

export const phraseDrivenComplianceRules = Object.values(complianceRulesCatalog).filter(
  (rule) => Array.isArray(rule.phrases) && rule.phrases.length > 0
);

export function getComplianceRule(ruleKey: ComplianceRuleKey) {
  return complianceRulesCatalog[ruleKey];
}

export function createComplianceFlagFromRule(
  ruleKey: ComplianceRuleKey,
  overrides?: Partial<{
    severity: FlagSeverity;
    explanation: string;
    remediationGuidance: string;
    status: "open";
    matchedPhrases: string[];
  }>
) {
  const rule = getComplianceRule(ruleKey);

  return {
    ruleKey: rule.ruleKey,
    title: rule.title,
    severity: overrides?.severity ?? rule.severity,
    explanation: overrides?.explanation ?? rule.description,
    remediationGuidance: overrides?.remediationGuidance ?? rule.remediationGuidance,
    blocksWorkflow: rule.blocksWorkflow,
    status: overrides?.status ?? "open",
    matchedPhrases: overrides?.matchedPhrases
  };
}

export function findMatchedPhrases(text: string, phrases: string[]) {
  const normalized = text.toLowerCase();
  return phrases.filter((phrase) => normalized.includes(phrase.toLowerCase()));
}

export function includesAny(text: string, phrases: string[]) {
  return findMatchedPhrases(text, phrases).length > 0;
}

export function getTranscriptHighlights(text: string) {
  const normalized = text.toLowerCase();
  const riskMatches = phraseDrivenComplianceRules.flatMap((rule) =>
    (rule.phrases ?? []).filter((phrase) => normalized.includes(phrase.toLowerCase()))
  );
  const opportunityMatches = [
    ...retirementIncomeKeywords,
    ...annuityKeywords,
    ...marketRiskKeywords,
    ...cdKeywords,
    ...spouseLossKeywords,
    ...followUpSuggestionKeywords
  ].filter((phrase) => normalized.includes(phrase.toLowerCase()));

  return {
    riskMatches: Array.from(new Set(riskMatches)),
    opportunityMatches: Array.from(new Set(opportunityMatches))
  };
}
