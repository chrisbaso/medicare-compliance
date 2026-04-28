import {
  AuditEvent,
  Client,
  ConsentRecord,
  Conversation,
  DemoDataState,
  FollowUpOpportunity,
  Task
} from "@/lib/types";

export type SummaryTone = "neutral" | "success" | "warning" | "danger" | "info";

export interface ClientStatusSummary {
  label: string;
  detail: string;
  tone: SummaryTone;
}

export type ConsentSummaryWorkflow = "medicare" | "separate_follow_up";

const opportunityRank: Record<FollowUpOpportunity["status"], number> = {
  assigned: 5,
  ready_for_assignment: 4,
  awaiting_consent: 3,
  detected: 2,
  completed: 1,
  closed_no_action: 0
};

export function getClientAge(dob: string, referenceDate = new Date()) {
  const birthDate = new Date(dob);
  let age = referenceDate.getFullYear() - birthDate.getFullYear();
  const hasHadBirthday =
    referenceDate.getMonth() > birthDate.getMonth() ||
    (referenceDate.getMonth() === birthDate.getMonth() &&
      referenceDate.getDate() >= birthDate.getDate());

  if (!hasHadBirthday) {
    age -= 1;
  }

  return age;
}

export function getLatestConversation(conversations: Conversation[]) {
  return conversations
    .slice()
    .sort((left, right) => Date.parse(right.startedAt) - Date.parse(left.startedAt))[0];
}

export function getClientPrimaryNeed(client: Client, conversations: Conversation[]) {
  const latestOperationalConversation = conversations
    .slice()
    .sort((left, right) => Date.parse(right.startedAt) - Date.parse(left.startedAt))
    .find((conversation) => conversation.medicareScope !== "Service only");

  return client.note || latestOperationalConversation?.medicareScope || "No primary need logged.";
}

export function getConsentSummary(
  records: ConsentRecord[],
  workflow: ConsentSummaryWorkflow = "medicare"
): ClientStatusSummary {
  const isSeparateFollowUp = workflow === "separate_follow_up";

  if (records.length === 0) {
    return {
      label: isSeparateFollowUp ? "blocked" : "missing",
      detail: isSeparateFollowUp
        ? "Separate follow-up cannot proceed until explicit consent is recorded."
        : "No Medicare-related permission has been logged yet.",
      tone: "warning"
    };
  }

  const latestRecordsByType = records.reduce<Record<string, ConsentRecord>>((accumulator, record) => {
    const current = accumulator[record.consentType];
    if (!current || Date.parse(record.capturedAt) > Date.parse(current.capturedAt)) {
      accumulator[record.consentType] = record;
    }

    return accumulator;
  }, {});
  const latestRecords = Object.values(latestRecordsByType);

  if (latestRecords.some((record) => record.status === "revoked" || record.status === "expired")) {
    return {
      label: isSeparateFollowUp ? "blocked" : "needs refresh",
      detail: isSeparateFollowUp
        ? "Separate follow-up is blocked until explicit consent is refreshed."
        : "One or more Medicare-related permissions has been revoked or expired.",
      tone: "danger"
    };
  }

  if (latestRecords.some((record) => record.status === "pending" || !record.evidenceComplete)) {
    return {
      label: isSeparateFollowUp ? "blocked" : "pending",
      detail: isSeparateFollowUp
        ? "Separate follow-up is blocked until consent and evidence are complete."
        : "A Medicare-related permission or its evidence still needs follow-through.",
      tone: "warning"
    };
  }

  return {
    label: isSeparateFollowUp ? "clear" : "complete",
    detail: isSeparateFollowUp
      ? "Separate follow-up consent is in place for licensed human review."
      : "Current Medicare-related permissions are granted with complete evidence.",
    tone: "success"
  };
}

export function getOpportunitySummary(
  opportunities: FollowUpOpportunity[],
  canViewRestrictedWork: boolean
): ClientStatusSummary {
  if (!canViewRestrictedWork) {
    return {
      label: "restricted",
      detail: "Separate follow-up workflow is limited to authorized roles.",
      tone: "neutral"
    };
  }

  if (opportunities.length === 0) {
    return {
      label: "none",
      detail: "No potential separate follow-up is open for this client.",
      tone: "neutral"
    };
  }

  const topOpportunity = opportunities
    .slice()
    .sort(
      (left, right) =>
        opportunityRank[right.status] - opportunityRank[left.status] ||
        Date.parse(right.lastUpdatedAt) - Date.parse(left.lastUpdatedAt)
    )[0];

  if (topOpportunity.explicitConsentStatus === "granted") {
    return {
      label: topOpportunity.status,
      detail: "Consent is granted and the separate workflow can continue with licensed staff.",
      tone: topOpportunity.status === "assigned" ? "success" : "info"
    };
  }

  return {
    label: topOpportunity.status,
    detail: "Potential separate follow-up exists, but consent is not fully in place.",
    tone: "warning"
  };
}

export function getClientAuditEvents(state: DemoDataState, clientId: string): AuditEvent[] {
  const conversationIds = state.conversations
    .filter((conversation) => conversation.clientId === clientId)
    .map((conversation) => conversation.id);
  const consentIds = state.consentRecords
    .filter((record) => record.clientId === clientId)
    .map((record) => record.id);
  const opportunityIds = state.followUpOpportunities
    .filter((workflow) => workflow.clientId === clientId)
    .map((workflow) => workflow.id);
  const taskIds = state.tasks
    .filter((task) => task.clientId === clientId)
    .map((task) => task.id);
  const qaReviewIds = state.qaReviews
    .filter((review) => conversationIds.includes(review.conversationId))
    .map((review) => review.id);

  const relatedIds = new Set([
    ...conversationIds,
    ...consentIds,
    ...opportunityIds,
    ...taskIds,
    ...qaReviewIds
  ]);

  return state.auditEvents
    .filter((event) => relatedIds.has(event.entityId))
    .slice()
    .sort((left, right) => Date.parse(right.eventAt) - Date.parse(left.eventAt));
}

export function getOpenTaskCount(tasks: Task[]) {
  return tasks.filter((task) => task.status !== "done").length;
}

export function getMedicareTaskCount(tasks: Task[]) {
  return tasks.filter((task) => task.queue !== "follow_up" && task.status !== "done").length;
}
