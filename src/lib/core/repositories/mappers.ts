import { Tables } from "../../../../supabase/types";
import {
  Agency,
  AuditEvent,
  Client,
  ClientStatus,
  ComplianceFlag,
  ConsentRecord,
  ConsentType,
  Conversation,
  ConversationChannel,
  ConversationMessage,
  ConversationRoutingState,
  ConversationStatus,
  DetectedTopic,
  FollowupWorkflow,
  FlagType,
  OpportunitySignalType,
  Task,
  TaskPriority,
  TaskQueue,
  TaskSourceType,
  TaskStatus,
  User,
  UserRole,
  WorkflowStatus
} from "@/lib/types";

type OrganizationRow = Tables<"organizations">;
type UserRow = Tables<"users">;
type UserRoleRow = Tables<"user_roles">;
type ClientRow = Tables<"clients">;
type ConversationRow = Tables<"conversations">;
type ConversationMessageRow = Tables<"conversation_messages">;
type ConsentRow = Tables<"consents">;
type ComplianceFlagRow = Tables<"compliance_flags">;
type RetirementOpportunityRow = Tables<"retirement_opportunities">;
type TaskRow = Tables<"tasks">;
type AuditLogRow = Tables<"audit_logs">;

function firstOrFallback<T extends string>(value: string, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

const userRoles = ["manager", "agent", "service", "compliance"] as const;
const clientStatuses = ["new_to_medicare", "active_review", "service_only", "watch"] as const;
const conversationChannels = ["phone", "web_intake", "service_call"] as const;
const conversationStatuses = ["new", "in_review", "routed", "closed"] as const;
const routingStates = ["awaiting_review", "ready_to_route", "blocked", "complete"] as const;
const taskQueues = ["intake", "service", "compliance", "follow_up"] as const;
const taskSourceTypes = ["conversation", "consent", "qa_review", "follow_up_opportunity"] as const;
const opportunityTypes = [
  "retirement_income_interest",
  "cd_maturing",
  "market_risk_concern",
  "estate_change",
  "premium_pressure"
] as const;
const workflowStatuses = [
  "detected",
  "awaiting_consent",
  "ready_for_assignment",
  "assigned",
  "completed",
  "closed_no_action"
] as const;
const flagTypes = ["missing_consent", "cross_sell_risk", "unsupported_claim", "needs_human_review"] as const;

function appRoleToUserRole(role?: UserRoleRow["role"]): UserRole {
  switch (role) {
    case "admin":
    case "manager":
      return "manager";
    case "agent":
      return "agent";
    case "service_staff":
      return "service";
    case "compliance_reviewer":
      return "compliance";
    default:
      return "service";
  }
}

export function organizationRowToAgency(row: OrganizationRow): Agency {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    timezone: row.timezone,
    region: ""
  };
}

export function userRowToUser(row: UserRow, roles: UserRoleRow[] = []): User {
  const primaryRole = roles.find((role) => role.user_id === row.id)?.role;

  return {
    id: row.id,
    agencyId: row.organization_id,
    fullName: row.full_name,
    role: firstOrFallback(appRoleToUserRole(primaryRole), userRoles, "service"),
    licenseType: row.license_type,
    email: row.email,
    team: row.team ?? ""
  };
}

export function clientRowToClient(row: ClientRow): Client {
  return {
    id: row.id,
    agencyId: row.organization_id,
    firstName: row.first_name,
    lastName: row.last_name,
    dob: row.dob ?? "",
    phone: row.phone ?? "",
    email: row.email ?? "",
    state: row.state,
    preferredContactMethod: firstOrFallback(row.preferred_contact_method, ["phone", "email", "text"], "phone"),
    status: firstOrFallback(row.status, clientStatuses, "active_review") as ClientStatus,
    tags: row.tags,
    note: row.note ?? ""
  };
}

export function conversationRowToConversation(row: ConversationRow): Conversation {
  return {
    id: row.id,
    agencyId: row.organization_id,
    clientId: row.client_id,
    ownerUserId: row.owner_user_id ?? "",
    channel: firstOrFallback(row.channel, conversationChannels, "phone") as ConversationChannel,
    status: firstOrFallback(row.status, conversationStatuses, "new") as ConversationStatus,
    startedAt: row.started_at,
    endedAt: row.ended_at ?? row.started_at,
    summary: row.summary ?? "",
    medicareScope: row.medicare_scope,
    routingState: firstOrFallback(row.routing_state, routingStates, "awaiting_review") as ConversationRoutingState,
    detectedTopics: row.detected_topics as DetectedTopic[],
    retirementInterestDetected: row.retirement_interest_detected,
    nextStep: row.next_step ?? ""
  };
}

export function conversationMessageRowToMessage(row: ConversationMessageRow): ConversationMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    speakerType: firstOrFallback(row.speaker_type, ["client", "agent", "service", "system"], "system"),
    speakerName: row.speaker_name,
    utterance: row.utterance,
    spokenAt: row.spoken_at,
    sequenceNumber: row.sequence_number
  };
}

export function consentRowToConsentRecord(row: ConsentRow): ConsentRecord {
  return {
    id: row.id,
    clientId: row.client_id,
    conversationId: row.conversation_id ?? undefined,
    followupWorkflowId: row.retirement_opportunity_id ?? undefined,
    linkedOpportunityId: row.retirement_opportunity_id ?? undefined,
    consentType: firstOrFallback(row.consent_type, ["contact", "recording", "soa", "retirement_follow_up"], "contact") as ConsentType,
    status: row.status,
    capturedAt: row.captured_at,
    captureMethod: row.capture_method,
    evidenceRef: row.evidence_ref ?? "",
    evidenceComplete: row.evidence_complete,
    notes: row.notes ?? ""
  };
}

export function complianceFlagRowToComplianceFlag(row: ComplianceFlagRow): ComplianceFlag {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    clientId: row.client_id,
    flagType: firstOrFallback(row.flag_type, flagTypes, "needs_human_review") as FlagType,
    severity: row.severity,
    status: row.status === "dismissed" ? "dismissed" : row.status === "resolved" || row.status === "confirmed" ? "resolved" : "open",
    rationale: row.reasoning,
    detectedBy: row.detected_by === "human" ? "human" : "system",
    flaggedAt: row.flagged_at,
    recommendedAction: row.suggested_remediation
  };
}

export function retirementOpportunityRowToFollowupWorkflow(row: RetirementOpportunityRow): FollowupWorkflow {
  const explicitConsentStatus =
    row.explicit_consent_status === "expired" ? "revoked" : row.explicit_consent_status;

  return {
    id: row.id,
    clientId: row.client_id,
    sourceConversationId: row.source_conversation_id,
    opportunitySignalId: "",
    type: "retirement_income_follow_up",
    status: firstOrFallback(row.status, workflowStatuses, "detected") as WorkflowStatus,
    explicitConsentStatus,
    assignedUserId: row.assigned_user_id ?? undefined,
    interestSummary: row.signal_summary,
    nextStep: row.next_step,
    requestedAt: row.requested_at,
    lastUpdatedAt: row.last_updated_at
  };
}

export function taskRowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    clientId: row.client_id ?? "",
    sourceType: firstOrFallback(row.source_type, taskSourceTypes, "conversation") as TaskSourceType,
    sourceId: row.source_id,
    title: row.title,
    queue: firstOrFallback(row.queue, taskQueues, "service") as TaskQueue,
    status: row.status as TaskStatus,
    priority: row.priority as TaskPriority,
    assignedUserId: row.assigned_user_id ?? undefined,
    dueAt: row.due_at ?? row.created_at
  };
}

export function auditLogRowToAuditEvent(row: AuditLogRow): AuditEvent {
  return {
    id: row.id,
    entityType: firstOrFallback(
      row.entity_type,
      ["conversation", "consent", "task", "follow_up_opportunity", "qa_review"],
      "conversation"
    ),
    entityId: row.entity_id,
    action: row.action,
    actorUserId: row.actor_user_id ?? "",
    eventAt: row.event_at,
    detail: row.detail,
    sourceContext: row.source,
    consentStatusSnapshot: row.consent_status_snapshot ?? undefined,
    nextAction: row.next_action ?? undefined
  };
}

export function signalTypeFromRetirementOpportunity(row: RetirementOpportunityRow): OpportunitySignalType {
  return firstOrFallback(row.signal_type, opportunityTypes, "retirement_income_interest");
}
