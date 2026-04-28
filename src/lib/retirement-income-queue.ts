import { getClientById, getConversationById, getUserById } from "@/lib/demo-selectors";
import {
  AuditEvent,
  DemoDataState,
  OpportunitySignalType,
  RetirementIncomeQueueEntry,
  WorkflowStatus
} from "@/lib/types";

const queueVisibleStatuses = new Set<WorkflowStatus>([
  "ready_for_assignment",
  "assigned",
  "completed",
  "closed_no_action"
]);

function isMedicareOriginConversation(
  conversation?: Pick<DemoDataState["conversations"][number], "channel" | "medicareScope" | "retirementInterestDetected">
) {
  if (!conversation) {
    return false;
  }

  return (
    conversation.retirementInterestDetected &&
    conversation.channel !== "service_call" &&
    conversation.medicareScope !== "Separate follow-up only" &&
    conversation.medicareScope !== "Compliance follow-up"
  );
}

function getDetectedFromConversation(
  state: DemoDataState,
  workflow: DemoDataState["followUpOpportunities"][number]
) {
  const signal = state.opportunitySignals.find((item) => item.id === workflow.opportunitySignalId);
  const signalConversation = signal ? getConversationById(state, signal.conversationId) : undefined;

  if (isMedicareOriginConversation(signalConversation)) {
    return signalConversation;
  }

  return state.conversations
    .filter(
      (conversation) =>
        conversation.clientId === workflow.clientId &&
        isMedicareOriginConversation(conversation) &&
        Date.parse(conversation.startedAt) <= Date.parse(workflow.requestedAt)
    )
    .sort((left, right) => Date.parse(right.startedAt) - Date.parse(left.startedAt))[0];
}

function getQueueAuditTrail(state: DemoDataState, workflowId: string, sourceConversationId: string): AuditEvent[] {
  const relatedConsentIds = state.consentRecords
    .filter((record) => record.linkedOpportunityId === workflowId || record.followupWorkflowId === workflowId)
    .map((record) => record.id);
  const relatedTaskIds = state.tasks
    .filter((task) => task.sourceType === "follow_up_opportunity" && task.sourceId === workflowId)
    .map((task) => task.id);
  const relatedIds = new Set([workflowId, ...relatedConsentIds, ...relatedTaskIds]);

  return state.auditEvents
    .filter(
      (event) =>
        relatedIds.has(event.entityId) ||
        event.sourceContext === sourceConversationId
    )
    .slice()
    .sort((left, right) => Date.parse(right.eventAt) - Date.parse(left.eventAt));
}

export function getRetirementIncomeInterestLabel(signalType: OpportunitySignalType) {
  switch (signalType) {
    case "retirement_income_interest":
      return "Retirement income interest";
    case "cd_maturing":
      return "CD maturity concern";
    case "market_risk_concern":
      return "Market volatility concern";
    case "estate_change":
      return "Estate change follow-up";
    case "premium_pressure":
      return "Premium pressure concern";
  }
}

export function getRetirementIncomeQueueStatusDetail(status: WorkflowStatus) {
  switch (status) {
    case "ready_for_assignment":
      return "Consent is complete and the item can move to an appropriately licensed human owner.";
    case "assigned":
      return "A licensed human owns the follow-up queue item and should document each next step.";
    case "completed":
      return "The follow-up was completed outside the Medicare workflow and remains in the audit record.";
    case "closed_no_action":
      return "The separate queue item was closed without further follow-up.";
    default:
      return "This queue only shows consent-cleared follow-up items.";
  }
}

export function getRetirementIncomeSignalsOutsideQueueCount(state: DemoDataState) {
  return state.followUpOpportunities.filter(
    (workflow) =>
      workflow.type === "retirement_income_follow_up" &&
      workflow.explicitConsentStatus !== "granted" &&
      Boolean(getDetectedFromConversation(state, workflow))
  ).length;
}

export function getRetirementIncomeQueueEntries(state: DemoDataState): RetirementIncomeQueueEntry[] {
  return state.followUpOpportunities
    .filter(
      (workflow) =>
        workflow.type === "retirement_income_follow_up" &&
        workflow.explicitConsentStatus === "granted" &&
        queueVisibleStatuses.has(workflow.status)
    )
    .flatMap((workflow) => {
      const client = getClientById(state, workflow.clientId);
      const signal = state.opportunitySignals.find((item) => item.id === workflow.opportunitySignalId);
      const detectedFromConversation = getDetectedFromConversation(state, workflow);
      const consentRecord = state.consentRecords.find(
        (record) => record.linkedOpportunityId === workflow.id || record.followupWorkflowId === workflow.id
      );
      const assignedUser = getUserById(state, workflow.assignedUserId);
      const nextOpenTask = state.tasks
        .filter(
          (task) =>
            task.sourceType === "follow_up_opportunity" &&
            task.sourceId === workflow.id &&
            task.status !== "done"
        )
        .sort((left, right) => Date.parse(left.dueAt) - Date.parse(right.dueAt))[0];

      if (!client || !signal || !detectedFromConversation) {
        return [];
      }

      return [
        {
          queueType: "retirement_income_follow_up_queue",
          workflowId: workflow.id,
          clientId: client.id,
          clientName: `${client.firstName} ${client.lastName}`,
          clientState: client.state,
          detectedFromConversationId: detectedFromConversation.id,
          detectedFromConversationScope: detectedFromConversation.medicareScope,
          detectedFromConversationSummary: detectedFromConversation.summary,
          detectedFromConversationAt: detectedFromConversation.startedAt,
          consentConversationId: consentRecord?.conversationId,
          consentRecordedAt: consentRecord?.capturedAt,
          detectedInterest: signal.signalType,
          detectedInterestSummary: signal.signalSummary,
          consentStatus: consentRecord?.status ?? "granted",
          consentEvidenceComplete: consentRecord?.evidenceComplete ?? true,
          workflowStatus: workflow.status,
          assignedLicensedUserId: assignedUser?.id,
          assignedLicensedUserName: assignedUser?.fullName,
          assignedLicensedLicenseType: assignedUser?.licenseType,
          nextAction: nextOpenTask?.title ?? workflow.nextStep,
          requestedAt: workflow.requestedAt,
          lastUpdatedAt: workflow.lastUpdatedAt,
          auditTrail: getQueueAuditTrail(state, workflow.id, detectedFromConversation.id)
        } satisfies RetirementIncomeQueueEntry
      ];
    })
    .sort((left, right) => Date.parse(right.lastUpdatedAt) - Date.parse(left.lastUpdatedAt));
}
