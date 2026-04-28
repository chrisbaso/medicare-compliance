export type UserRole = "manager" | "agent" | "service" | "compliance";
export type LicenseType = "none" | "medicare_only" | "life_health" | "series65_plus";
export type ClientStatus = "new_to_medicare" | "active_review" | "service_only" | "watch";
export type PreferredContactMethod = "phone" | "email" | "text";
export type ConversationStatus = "new" | "in_review" | "routed" | "closed";
export type ConversationChannel = "phone" | "web_intake" | "service_call";
export type ConversationRoutingState = "awaiting_review" | "ready_to_route" | "blocked" | "complete";
export type DetectedTopic =
  | "turning_65"
  | "medigap_review"
  | "part_d_question"
  | "medicare_advantage_question"
  | "premium_increase"
  | "service_call"
  | "missing_document_follow_up"
  | "retirement_income_interest"
  | "annuity_interest"
  | "market_risk_concern"
  | "cd_maturing"
  | "spouse_passed_away"
  | "compliance_review"
  | "consent";
export type ConsentType = "contact" | "recording" | "soa" | "retirement_follow_up";
export type ConsentStatus = "granted" | "revoked" | "pending" | "expired";
export type FlagSeverity = "low" | "medium" | "high" | "critical";
export type FlagType = "missing_consent" | "cross_sell_risk" | "unsupported_claim" | "needs_human_review";
export type OpportunitySignalType =
  | "retirement_income_interest"
  | "cd_maturing"
  | "market_risk_concern"
  | "estate_change"
  | "premium_pressure";
export type OpportunitySignalStatus = "new" | "reviewed" | "workflow_created";
export type OpportunityConfidence = "low" | "medium" | "high";
export type WorkflowStatus =
  | "detected"
  | "awaiting_consent"
  | "ready_for_assignment"
  | "assigned"
  | "completed"
  | "closed_no_action";
export type TaskQueue = "intake" | "service" | "compliance" | "follow_up";
export type TaskStatus = "open" | "in_progress" | "blocked" | "done";
export type TaskPriority = "low" | "normal" | "high" | "urgent";
export type TaskSourceType = "conversation" | "consent" | "qa_review" | "follow_up_opportunity";
export type QaOutcome = "pass" | "pass_with_notes" | "escalate";

export interface Agency {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  region: string;
}

export interface User {
  id: string;
  agencyId: string;
  fullName: string;
  role: UserRole;
  licenseType: LicenseType;
  email: string;
  team: string;
}

export interface Client {
  id: string;
  agencyId: string;
  firstName: string;
  lastName: string;
  dob: string;
  phone: string;
  email: string;
  state: string;
  preferredContactMethod: PreferredContactMethod;
  status: ClientStatus;
  tags: string[];
  note: string;
}

export interface Conversation {
  id: string;
  agencyId: string;
  clientId: string;
  ownerUserId: string;
  channel: ConversationChannel;
  status: ConversationStatus;
  startedAt: string;
  endedAt: string;
  summary: string;
  medicareScope: string;
  routingState: ConversationRoutingState;
  detectedTopics: DetectedTopic[];
  retirementInterestDetected: boolean;
  nextStep: string;
}

export interface ConversationMessage {
  id: string;
  conversationId: string;
  speakerType: "client" | "agent" | "service" | "system";
  speakerName: string;
  utterance: string;
  spokenAt: string;
  sequenceNumber: number;
}

export interface TranscriptSummary {
  id: string;
  conversationId: string;
  clientId: string;
  createdAt: string;
  summary: string;
  detectedTopics: DetectedTopic[];
  complianceReviewStatus: "clear" | "watch" | "review_required";
  consentStatus: "complete" | "missing" | "pending";
  nextAction: string;
}

export interface ConsentRecord {
  id: string;
  clientId: string;
  conversationId?: string;
  followupWorkflowId?: string;
  linkedOpportunityId?: string;
  consentType: ConsentType;
  status: ConsentStatus;
  capturedAt: string;
  captureMethod: string;
  evidenceRef: string;
  evidenceComplete: boolean;
  notes: string;
}

export interface ComplianceFlag {
  id: string;
  conversationId: string;
  clientId: string;
  flagType: FlagType;
  severity: FlagSeverity;
  status: "open" | "resolved" | "dismissed";
  rationale: string;
  detectedBy: "system" | "human";
  flaggedAt: string;
  recommendedAction: string;
}

export interface OpportunitySignal {
  id: string;
  clientId: string;
  conversationId: string;
  signalType: OpportunitySignalType;
  detectedAt: string;
  source: "transcript_summary" | "service_call" | "manual_note";
  confidence: OpportunityConfidence;
  signalSummary: string;
  recommendedWorkflow: "separate_followup" | "monitor_only";
  status: OpportunitySignalStatus;
}

export interface FollowupWorkflow {
  id: string;
  clientId: string;
  sourceConversationId: string;
  opportunitySignalId: string;
  type: "retirement_income_follow_up";
  status: WorkflowStatus;
  explicitConsentStatus: "missing" | "pending" | "granted" | "revoked";
  assignedUserId?: string;
  interestSummary: string;
  nextStep: string;
  requestedAt: string;
  lastUpdatedAt: string;
}

export interface RetirementIncomeQueueEntry {
  queueType: "retirement_income_follow_up_queue";
  workflowId: string;
  clientId: string;
  clientName: string;
  clientState: string;
  detectedFromConversationId: string;
  detectedFromConversationScope: string;
  detectedFromConversationSummary: string;
  detectedFromConversationAt: string;
  consentConversationId?: string;
  consentRecordedAt?: string;
  detectedInterest: OpportunitySignalType;
  detectedInterestSummary: string;
  consentStatus: ConsentStatus;
  consentEvidenceComplete: boolean;
  workflowStatus: WorkflowStatus;
  assignedLicensedUserId?: string;
  assignedLicensedUserName?: string;
  assignedLicensedLicenseType?: LicenseType;
  nextAction: string;
  requestedAt: string;
  lastUpdatedAt: string;
  auditTrail: AuditEvent[];
}

export interface Task {
  id: string;
  clientId: string;
  sourceType: TaskSourceType;
  sourceId: string;
  title: string;
  queue: TaskQueue;
  status: TaskStatus;
  priority: TaskPriority;
  assignedUserId?: string;
  dueAt: string;
}

export interface AuditEvent {
  id: string;
  entityType: "conversation" | "consent" | "task" | "follow_up_opportunity" | "qa_review";
  entityId: string;
  action: string;
  actorUserId: string;
  eventAt: string;
  detail: string;
  sourceContext?: string;
  consentStatusSnapshot?: string;
  nextAction?: string;
}

export interface QaReview {
  id: string;
  conversationId: string;
  reviewerUserId: string;
  score: number;
  outcome: QaOutcome;
  reviewedAt: string;
  summary: string;
}

export type TranscriptEntry = ConversationMessage;
export type FollowUpOpportunity = FollowupWorkflow;

export interface DemoDataState {
  agency: Agency;
  users: User[];
  clients: Client[];
  conversations: Conversation[];
  conversationMessages: ConversationMessage[];
  transcriptEntries: TranscriptEntry[];
  transcriptSummaries: TranscriptSummary[];
  consentRecords: ConsentRecord[];
  complianceFlags: ComplianceFlag[];
  opportunitySignals: OpportunitySignal[];
  followupWorkflows: FollowupWorkflow[];
  followUpOpportunities: FollowUpOpportunity[];
  qaReviews: QaReview[];
  tasks: Task[];
  auditEvents: AuditEvent[];
  currentUserId: string;
}
