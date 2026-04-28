import {
  AnalysisComplianceFlag,
  AnalysisOpportunitySignal,
  TranscriptAnalysisInput,
  TranscriptAnalysisResult
} from "@/lib/analysis/types";
import {
  annuityKeywords,
  cdKeywords,
  clearFollowUpInterestKeywords,
  consentKeywords,
  createComplianceFlagFromRule,
  findMatchedPhrases,
  followUpSuggestionKeywords,
  includesAny,
  licensedHumanKeywords,
  marketRiskKeywords,
  medicareAdvantageKeywords,
  medicareSupplementKeywords,
  missingDocumentKeywords,
  partDKeywords,
  phraseDrivenComplianceRules,
  planComparisonKeywords,
  premiumIncreaseKeywords,
  retirementIncomeKeywords,
  serviceKeywords,
  spouseLossKeywords,
  turning65Keywords
} from "@/lib/compliance/rules";
import { DetectedTopic } from "@/lib/types";

export function analyzeTranscript(input: TranscriptAnalysisInput): TranscriptAnalysisResult {
  const transcript = input.transcript;
  const combinedText = transcript.map((entry) => entry.utterance).join(" ");
  const normalizedText = combinedText.toLowerCase();
  const clientText = transcript
    .filter((entry) => entry.speakerType === "client")
    .map((entry) => entry.utterance)
    .join(" ")
    .toLowerCase();
  const nonSystemText = transcript
    .filter((entry) => entry.speakerType !== "system")
    .map((entry) => entry.utterance)
    .join(" ")
    .toLowerCase();
  const conversationType = input.conversationType ?? "";
  const normalizedConversationType = conversationType.toLowerCase();
  const channel = input.channel ?? "phone";
  const detectedTopics = getDetectedTopics({
    normalizedText,
    normalizedConversationType,
    channel
  });
  const medicareSalesContext =
    detectedTopics.includes("medigap_review") ||
    detectedTopics.includes("medicare_advantage_question") ||
    detectedTopics.includes("part_d_question") ||
    detectedTopics.includes("turning_65") ||
    normalizedConversationType.includes("medicare");
  const serviceOnlyConversation =
    channel === "service_call" ||
    normalizedConversationType.includes("service only");
  const clearSeparateInterest =
    includesAny(clientText, clearFollowUpInterestKeywords) ||
    includesAny(clientText, retirementIncomeKeywords) ||
    includesAny(clientText, annuityKeywords);
  const consentStatus = getSeparateFollowUpConsentStatus(input);
  const hasLicensedHumanHandoff = includesAny(nonSystemText, licensedHumanKeywords);
  const followUpSuggested =
    includesAny(nonSystemText, followUpSuggestionKeywords) || hasLicensedHumanHandoff;
  const shouldCreateOpportunity =
    (detectedTopics.includes("retirement_income_interest") ||
      detectedTopics.includes("annuity_interest") ||
      detectedTopics.includes("market_risk_concern") ||
      detectedTopics.includes("cd_maturing") ||
      detectedTopics.includes("spouse_passed_away")) &&
    (!serviceOnlyConversation || clearSeparateInterest);
  const opportunitySignals = shouldCreateOpportunity
    ? [buildOpportunitySignal(detectedTopics, consentStatus, Boolean(input.hasExistingFollowUpWorkflow))]
    : [];
  const complianceFlags = getComplianceFlags({
    normalizedText,
    clientText,
    medicareSalesContext,
    detectedTopics,
    opportunitySignals,
    consentStatus,
    followUpSuggested,
    hasLicensedHumanHandoff
  });
  const recommendedNextAction = getRecommendedNextAction({
    serviceOnlyConversation,
    complianceFlags,
    opportunitySignals,
    consentStatus
  });

  return {
    summary: buildSummary({
      detectedTopics,
      serviceOnlyConversation,
      hasComplianceFlags: complianceFlags.length > 0,
      hasOpportunitySignals: opportunitySignals.length > 0
    }),
    clientIntent: getClientIntent(detectedTopics, serviceOnlyConversation, clearSeparateInterest),
    detectedTopics,
    keyFacts: buildKeyFacts({
      channel,
      conversationType,
      detectedTopics,
      consentStatus,
      workflowCreated: Boolean(input.hasExistingFollowUpWorkflow)
    }),
    unresolvedItems: buildUnresolvedItems({
      complianceFlags,
      consentStatus,
      opportunitySignals
    }),
    recommendedNextAction,
    complianceFlags,
    opportunitySignals,
    confidenceScore: getConfidenceScore({
      transcriptLength: transcript.length,
      detectedTopicsCount: detectedTopics.length,
      complianceFlagsCount: complianceFlags.length,
      opportunitySignalsCount: opportunitySignals.length
    })
  };
}

function getDetectedTopics({
  normalizedText,
  normalizedConversationType,
  channel
}: {
  normalizedText: string;
  normalizedConversationType: string;
  channel: string;
}) {
  const topics = new Set<DetectedTopic>();

  if (
    includesAny(normalizedText, turning65Keywords) ||
    normalizedConversationType.includes("turning 65")
  ) {
    topics.add("turning_65");
  }

  if (
    includesAny(normalizedText, medicareSupplementKeywords) ||
    normalizedConversationType.includes("supplement") ||
    normalizedConversationType.includes("medigap")
  ) {
    topics.add("medigap_review");
  }

  if (
    includesAny(normalizedText, medicareAdvantageKeywords) ||
    normalizedConversationType.includes("advantage")
  ) {
    topics.add("medicare_advantage_question");
  }

  if (
    includesAny(normalizedText, partDKeywords) ||
    normalizedConversationType.includes("part d")
  ) {
    topics.add("part_d_question");
  }

  if (
    channel === "service_call" ||
    includesAny(normalizedText, serviceKeywords) ||
    normalizedConversationType.includes("service")
  ) {
    topics.add("service_call");
  }

  if (includesAny(normalizedText, premiumIncreaseKeywords)) {
    topics.add("premium_increase");
  }

  if (includesAny(normalizedText, missingDocumentKeywords)) {
    topics.add("missing_document_follow_up");
  }

  if (includesAny(normalizedText, spouseLossKeywords)) {
    topics.add("spouse_passed_away");
  }

  if (includesAny(normalizedText, marketRiskKeywords)) {
    topics.add("market_risk_concern");
  }

  if (includesAny(normalizedText, cdKeywords)) {
    topics.add("cd_maturing");
  }

  if (includesAny(normalizedText, retirementIncomeKeywords)) {
    topics.add("retirement_income_interest");
  }

  if (includesAny(normalizedText, annuityKeywords)) {
    topics.add("annuity_interest");
  }

  if (includesAny(normalizedText, consentKeywords)) {
    topics.add("consent");
  }

  if (
    phraseDrivenComplianceRules.some((rule) =>
      includesAny(normalizedText, rule.phrases ?? [])
    )
  ) {
    topics.add("compliance_review");
  }

  return Array.from(topics);
}

function buildOpportunitySignal(
  detectedTopics: DetectedTopic[],
  consentStatus: AnalysisOpportunitySignal["consentStatus"],
  workflowCreated: boolean
): AnalysisOpportunitySignal {
  if (detectedTopics.includes("annuity_interest")) {
    return {
      signalType: "annuity_interest",
      summary:
        "Annuity or life-insurance interest appeared in the transcript and must remain outside the Medicare workflow.",
      requiresSeparateWorkflow: true,
      consentStatus,
      workflowCreated
    };
  }

  if (detectedTopics.includes("market_risk_concern")) {
    return {
      signalType: "market_risk_concern",
      summary:
        "Market-risk concerns suggest a potential separate follow-up if the client wants one.",
      requiresSeparateWorkflow: true,
      consentStatus,
      workflowCreated
    };
  }

  if (detectedTopics.includes("cd_maturing")) {
    return {
      signalType: "cd_maturing",
      summary:
        "A CD maturity or renewal issue may justify a separate follow-up only if the client clearly wants that discussion.",
      requiresSeparateWorkflow: true,
      consentStatus,
      workflowCreated
    };
  }

  if (detectedTopics.includes("spouse_passed_away")) {
    return {
      signalType: "estate_change",
      summary:
        "A spouse-loss or estate-change context may require a later, separate follow-up if explicitly consented.",
      requiresSeparateWorkflow: true,
      consentStatus,
      workflowCreated
    };
  }

  if (detectedTopics.includes("premium_increase")) {
    return {
      signalType: "premium_pressure",
      summary:
        "Premium pressure may justify a later, separate retirement-income follow-up if explicitly consented.",
      requiresSeparateWorkflow: true,
      consentStatus,
      workflowCreated
    };
  }

  return {
    signalType: "retirement_income_interest",
    summary:
      "Retirement-income interest was detected and must stay in a separate consented workflow.",
    requiresSeparateWorkflow: true,
    consentStatus,
    workflowCreated
  };
}

function getComplianceFlags({
  normalizedText,
  clientText,
  medicareSalesContext,
  detectedTopics,
  opportunitySignals,
  consentStatus,
  followUpSuggested,
  hasLicensedHumanHandoff
}: {
  normalizedText: string;
  clientText: string;
  medicareSalesContext: boolean;
  detectedTopics: DetectedTopic[];
  opportunitySignals: AnalysisOpportunitySignal[];
  consentStatus: AnalysisOpportunitySignal["consentStatus"];
  followUpSuggested: boolean;
  hasLicensedHumanHandoff: boolean;
}) {
  const flags: AnalysisComplianceFlag[] = [];

  for (const rule of phraseDrivenComplianceRules) {
    const matchedPhrases = findMatchedPhrases(normalizedText, rule.phrases ?? []);
    if (matchedPhrases.length > 0) {
      flags.push(
        createComplianceFlagFromRule(rule.ruleKey, {
          matchedPhrases
        })
      );
    }
  }

  if (medicareSalesContext && detectedTopics.includes("annuity_interest")) {
    flags.push(createComplianceFlagFromRule("cross_sell_contamination"));
  }

  if (
    opportunitySignals.length > 0 &&
    followUpSuggested &&
    consentStatus !== "granted"
  ) {
    flags.push(createComplianceFlagFromRule("missing_separate_follow_up_consent"));
  }

  if (
    opportunitySignals.length > 0 &&
    !hasLicensedHumanHandoff &&
    !followUpSuggested
  ) {
    flags.push(createComplianceFlagFromRule("incomplete_handoff_to_licensed_human"));
  }

  if (
    medicareSalesContext &&
    includesAny(normalizedText, planComparisonKeywords) &&
    (includesAny(normalizedText, medicareAdvantageKeywords) ||
      includesAny(normalizedText, medicareSupplementKeywords) ||
      includesAny(normalizedText, partDKeywords))
  ) {
    flags.push(createComplianceFlagFromRule("plan_comparison_risk"));
  }

  return dedupeFlags(flags);
}

function dedupeFlags(flags: AnalysisComplianceFlag[]) {
  const seen = new Set<string>();
  return flags.filter((flag) => {
    if (seen.has(flag.ruleKey)) {
      return false;
    }

    seen.add(flag.ruleKey);
    return true;
  });
}

function buildSummary({
  detectedTopics,
  serviceOnlyConversation,
  hasComplianceFlags,
  hasOpportunitySignals
}: {
  detectedTopics: DetectedTopic[];
  serviceOnlyConversation: boolean;
  hasComplianceFlags: boolean;
  hasOpportunitySignals: boolean;
}) {
  const primarySummary = serviceOnlyConversation
    ? "Service-focused conversation documented without any product recommendation."
    : detectedTopics.includes("turning_65")
      ? "Turning-65 conversation focused on neutral Medicare education and next-step readiness."
      : detectedTopics.includes("part_d_question")
        ? "Part D discussion focused on neutral education and plan-related service questions."
        : detectedTopics.includes("medicare_advantage_question")
          ? "Medicare Advantage questions surfaced inside a Medicare conversation and should stay neutral."
          : detectedTopics.includes("medigap_review")
            ? "Medicare Supplement review focused on client questions and documented next steps."
            : "Operational Medicare conversation documented for review and follow-through.";

  const additionalNotes = [];

  if (hasOpportunitySignals) {
    additionalNotes.push(
      "A separate follow-up signal was detected and should remain outside the Medicare workflow."
    );
  }

  if (hasComplianceFlags) {
    additionalNotes.push("Transcript review found compliance items that need human attention.");
  }

  return [primarySummary, ...additionalNotes].join(" ");
}

function getClientIntent(
  detectedTopics: DetectedTopic[],
  serviceOnlyConversation: boolean,
  clearSeparateInterest: boolean
) {
  if (serviceOnlyConversation && !clearSeparateInterest) {
    return "The client is asking for service help or account follow-through rather than a product discussion.";
  }

  if (detectedTopics.includes("turning_65")) {
    return "The client wants Medicare timing, intake, or neutral education support.";
  }

  if (detectedTopics.includes("part_d_question")) {
    return "The client wants neutral information about Part D coverage or formulary issues.";
  }

  if (detectedTopics.includes("medicare_advantage_question")) {
    return "The client wants neutral information about Medicare Advantage during a Medicare conversation.";
  }

  if (detectedTopics.includes("medigap_review")) {
    return "The client wants neutral Medicare Supplement review support.";
  }

  if (
    detectedTopics.includes("retirement_income_interest") ||
    detectedTopics.includes("annuity_interest") ||
    detectedTopics.includes("market_risk_concern")
  ) {
    return "The client raised a separate retirement-income concern that requires a separate consented workflow.";
  }

  return "The client needs documented Medicare operations support and human follow-through.";
}

function buildKeyFacts({
  channel,
  conversationType,
  detectedTopics,
  consentStatus,
  workflowCreated
}: {
  channel: string;
  conversationType: string;
  detectedTopics: DetectedTopic[];
  consentStatus: AnalysisOpportunitySignal["consentStatus"];
  workflowCreated: boolean;
}) {
  const facts = [
    `Channel: ${channel.replaceAll("_", " ")}`,
    `Conversation type: ${conversationType || "Not provided"}`
  ];

  if (detectedTopics.includes("premium_increase")) {
    facts.push("The client raised premium or affordability concerns.");
  }

  if (detectedTopics.includes("service_call")) {
    facts.push("The transcript includes service or account-maintenance context.");
  }

  if (
    detectedTopics.includes("retirement_income_interest") ||
    detectedTopics.includes("annuity_interest")
  ) {
    facts.push("Retirement-income related discussion must stay outside Medicare plan guidance.");
    facts.push(`Separate follow-up consent status: ${consentStatus}.`);
    facts.push(`Separate workflow already created: ${workflowCreated ? "yes" : "no"}.`);
  }

  return facts;
}

function buildUnresolvedItems({
  complianceFlags,
  consentStatus,
  opportunitySignals
}: {
  complianceFlags: AnalysisComplianceFlag[];
  consentStatus: AnalysisOpportunitySignal["consentStatus"];
  opportunitySignals: AnalysisOpportunitySignal[];
}) {
  const items = [
    ...complianceFlags.map(
      (flag) => `${flag.ruleKey}: ${flag.remediationGuidance}`
    )
  ];

  if (opportunitySignals.length > 0 && consentStatus !== "granted") {
    items.push("Separate follow-up consent is not fully documented yet.");
  }

  if (opportunitySignals.length > 0 && !opportunitySignals[0].workflowCreated) {
    items.push("No separate follow-up workflow has been created yet.");
  }

  return items.length > 0 ? items : ["No unresolved items identified by the mock analyzer."];
}

function getRecommendedNextAction({
  serviceOnlyConversation,
  complianceFlags,
  opportunitySignals,
  consentStatus
}: {
  serviceOnlyConversation: boolean;
  complianceFlags: AnalysisComplianceFlag[];
  opportunitySignals: AnalysisOpportunitySignal[];
  consentStatus: AnalysisOpportunitySignal["consentStatus"];
}) {
  if (complianceFlags.some((flag) => flag.blocksWorkflow)) {
    return "Pause additional outreach and route the conversation for human compliance review.";
  }

  if (opportunitySignals.length > 0) {
    if (consentStatus === "granted") {
      return "Continue with a separate consented follow-up workflow owned by a licensed human.";
    }

    if (consentStatus === "pending" || consentStatus === "missing") {
      return "Create separate follow-up workflow and request explicit consent before any later outreach.";
    }
  }

  if (serviceOnlyConversation) {
    return "Document the service resolution and keep the conversation in the service workflow unless the client clearly requests more.";
  }

  return "Prepare a neutral summary and route the conversation for the next human review step.";
}

function getSeparateFollowUpConsentStatus(input: TranscriptAnalysisInput) {
  const matchingConsent = input.consentRecords?.find(
    (record) => record.consentType === "retirement_follow_up"
  );

  if (!matchingConsent) {
    return "missing" as const;
  }

  if (matchingConsent.status === "granted" && matchingConsent.evidenceComplete) {
    return "granted" as const;
  }

  if (matchingConsent.status === "revoked") {
    return "revoked" as const;
  }

  return "pending" as const;
}

function getConfidenceScore({
  transcriptLength,
  detectedTopicsCount,
  complianceFlagsCount,
  opportunitySignalsCount
}: {
  transcriptLength: number;
  detectedTopicsCount: number;
  complianceFlagsCount: number;
  opportunitySignalsCount: number;
}) {
  const score =
    0.5 +
    Math.min(transcriptLength, 4) * 0.05 +
    Math.min(detectedTopicsCount, 4) * 0.05 +
    Math.min(complianceFlagsCount, 2) * 0.07 +
    Math.min(opportunitySignalsCount, 1) * 0.08;

  return Number(Math.min(score, 0.94).toFixed(2));
}
