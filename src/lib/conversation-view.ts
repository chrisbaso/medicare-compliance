import {
  ComplianceFlag,
  ConsentRecord,
  Conversation,
  QaReview,
  Task,
  TranscriptSummary
} from "@/lib/types";

export const topicLabels: Record<string, string> = {
  turning_65: "Turning 65",
  medigap_review: "Medicare Supplement",
  part_d_question: "Part D",
  medicare_advantage_question: "Medicare Advantage",
  premium_increase: "Premium increase",
  service_call: "Service question",
  missing_document_follow_up: "Missing document follow-up",
  retirement_income_interest: "Retirement income",
  annuity_interest: "Annuity interest",
  market_risk_concern: "Market risk concern",
  cd_maturing: "CD maturing",
  spouse_passed_away: "Spouse passed away",
  compliance_review: "Compliance review",
  consent: "Consent needed"
};

export function getFriendlyTopicLabel(topic: string) {
  return topicLabels[topic] ?? topic.replaceAll("_", " ");
}

export function getConversationReviewState({
  conversation,
  flags,
  consents,
  review,
  transcriptSummary
}: {
  conversation: Conversation;
  flags: ComplianceFlag[];
  consents: ConsentRecord[];
  review?: QaReview;
  transcriptSummary?: TranscriptSummary;
}) {
  const openFlags = flags.filter((flag) => flag.status === "open");
  const hasHighSeverity = openFlags.some(
    (flag) => flag.severity === "critical" || flag.severity === "high"
  );
  const hasConsentGap = consents.some(
    (record) => record.status !== "granted" || !record.evidenceComplete
  );
  const qaEscalated = review?.outcome === "escalate";

  if (qaEscalated || hasHighSeverity) {
    return {
      label: "human review required",
      tone: "danger" as const,
      detail: "Open high-severity compliance issues must be reviewed before more outreach or routing."
    };
  }

  if (
    transcriptSummary?.complianceReviewStatus === "review_required" ||
    conversation.routingState === "awaiting_review" ||
    conversation.status === "new" ||
    conversation.status === "in_review"
  ) {
    return {
      label: "needs review",
      tone: "warning" as const,
      detail: "This conversation still needs reviewer attention before it should be treated as complete."
    };
  }

  if (conversation.routingState === "blocked" || hasConsentGap) {
    return {
      label: "blocked",
      tone: "warning" as const,
      detail: "Consent or workflow blockers should be cleared before the next step."
    };
  }

  if (conversation.routingState === "ready_to_route" || conversation.status === "routed") {
    return {
      label: "ready to route",
      tone: "info" as const,
      detail: "The conversation appears ready for operational follow-through with human oversight."
    };
  }

  return {
    label: "complete",
    tone: "success" as const,
    detail: "No unresolved review blockers are currently recorded on this conversation."
  };
}

export function getClientIntent(conversation: Conversation) {
  if (conversation.detectedTopics.includes("service_call")) {
    return "The client is seeking service help or follow-through on an operational issue.";
  }

  if (conversation.detectedTopics.includes("turning_65")) {
    return "The client wants Medicare timing, intake, or education support.";
  }

  if (conversation.detectedTopics.includes("part_d_question")) {
    return "The client wants neutral education about Part D coverage or formulary questions.";
  }

  if (conversation.detectedTopics.includes("medicare_advantage_question")) {
    return "The client asked for neutral Medicare Advantage information during a Medicare conversation.";
  }

  if (conversation.detectedTopics.includes("medigap_review")) {
    return "The client wants neutral Medicare Supplement review support.";
  }

  if (conversation.retirementInterestDetected) {
    return "The client raised a separate retirement-income concern that cannot be handled inside the Medicare workflow.";
  }

  return "The client needs operational Medicare support and documented next steps.";
}

export function getKeyFacts({
  conversation,
  ownerName,
  transcriptSummary,
  consentCount,
  openTaskCount
}: {
  conversation: Conversation;
  ownerName: string;
  transcriptSummary?: TranscriptSummary;
  consentCount: number;
  openTaskCount: number;
}) {
  return [
    `Assigned user: ${ownerName}`,
    `Conversation scope: ${conversation.medicareScope}`,
    `Channel: ${conversation.channel.replaceAll("_", " ")}`,
    transcriptSummary
      ? `AI-style compliance read: ${transcriptSummary.complianceReviewStatus.replaceAll("_", " ")}`
      : "AI-style compliance read: not generated",
    `Consent records tied to this conversation: ${consentCount}`,
    `Open linked tasks: ${openTaskCount}`
  ];
}

export function getUnresolvedItems({
  flags,
  consents,
  tasks,
  review,
  transcriptSummary
}: {
  flags: ComplianceFlag[];
  consents: ConsentRecord[];
  tasks: Task[];
  review?: QaReview;
  transcriptSummary?: TranscriptSummary;
}) {
  const items = [
    ...flags
      .filter((flag) => flag.status === "open")
      .map((flag) => `${getFriendlyTopicLabel(flag.flagType)}: ${flag.recommendedAction}`),
    ...consents
      .filter((record) => record.status !== "granted" || !record.evidenceComplete)
      .map(
        (record) =>
          `${record.consentType.replaceAll("_", " ")} consent is ${record.status} and evidence is ${
            record.evidenceComplete ? "complete" : "incomplete"
          }.`
      ),
    ...tasks
      .filter((task) => task.status !== "done")
      .map((task) => `${task.title} is still ${task.status.replaceAll("_", " ")}.`)
  ];

  if (review?.outcome === "escalate") {
    items.unshift(`QA escalation: ${review.summary}`);
  }

  if (transcriptSummary?.consentStatus === "missing" || transcriptSummary?.consentStatus === "pending") {
    items.unshift(
      `Transcript summary marked consent as ${transcriptSummary.consentStatus.replaceAll("_", " ")}.`
    );
  }

  return items.length > 0 ? items : ["No unresolved items are currently recorded."];
}
