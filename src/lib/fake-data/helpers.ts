import { initialDemoData } from "@/lib/fake-data";
import { AuditEvent, Client, ComplianceFlag, ConsentRecord, Conversation, ConversationMessage, DemoDataState, FollowupWorkflow, OpportunitySignal, Task, TranscriptSummary, User } from "@/lib/types";

export function getAgency(state: DemoDataState = initialDemoData) {
  return state.agency;
}

export function getUsers(state: DemoDataState = initialDemoData): User[] {
  return state.users;
}

export function getClients(state: DemoDataState = initialDemoData): Client[] {
  return state.clients;
}

export function getClientById(clientId: string, state: DemoDataState = initialDemoData) {
  return state.clients.find((client) => client.id === clientId);
}

export function getConversations(state: DemoDataState = initialDemoData): Conversation[] {
  return state.conversations;
}

export function getConversationById(conversationId: string, state: DemoDataState = initialDemoData) {
  return state.conversations.find((conversation) => conversation.id === conversationId);
}

export function getConversationsByClientId(clientId: string, state: DemoDataState = initialDemoData) {
  return state.conversations.filter((conversation) => conversation.clientId === clientId);
}

export function getConversationMessages(conversationId?: string, state: DemoDataState = initialDemoData): ConversationMessage[] {
  return conversationId
    ? state.conversationMessages.filter((message) => message.conversationId === conversationId)
    : state.conversationMessages;
}

export function getTranscriptSummaries(state: DemoDataState = initialDemoData): TranscriptSummary[] {
  return state.transcriptSummaries;
}

export function getTranscriptSummaryByConversationId(conversationId: string, state: DemoDataState = initialDemoData) {
  return state.transcriptSummaries.find((summary) => summary.conversationId === conversationId);
}

export function getConsentRecords(state: DemoDataState = initialDemoData): ConsentRecord[] {
  return state.consentRecords;
}

export function getConsentsByClientId(clientId: string, state: DemoDataState = initialDemoData) {
  return state.consentRecords.filter((record) => record.clientId === clientId);
}

export function getConsentsByConversationId(conversationId: string, state: DemoDataState = initialDemoData) {
  return state.consentRecords.filter((record) => record.conversationId === conversationId);
}

export function getComplianceFlags(state: DemoDataState = initialDemoData): ComplianceFlag[] {
  return state.complianceFlags;
}

export function getFlagsByClientId(clientId: string, state: DemoDataState = initialDemoData) {
  return state.complianceFlags.filter((flag) => flag.clientId === clientId);
}

export function getFlagsByConversationId(conversationId: string, state: DemoDataState = initialDemoData) {
  return state.complianceFlags.filter((flag) => flag.conversationId === conversationId);
}

export function getOpportunitySignals(state: DemoDataState = initialDemoData): OpportunitySignal[] {
  return state.opportunitySignals;
}

export function getSignalsByClientId(clientId: string, state: DemoDataState = initialDemoData) {
  return state.opportunitySignals.filter((signal) => signal.clientId === clientId);
}

export function getFollowupWorkflows(state: DemoDataState = initialDemoData): FollowupWorkflow[] {
  return state.followupWorkflows;
}

export function getFollowupWorkflowById(workflowId: string, state: DemoDataState = initialDemoData) {
  return state.followupWorkflows.find((workflow) => workflow.id === workflowId);
}

export function getFollowupWorkflowsByClientId(clientId: string, state: DemoDataState = initialDemoData) {
  return state.followupWorkflows.filter((workflow) => workflow.clientId === clientId);
}

export function getTasks(state: DemoDataState = initialDemoData): Task[] {
  return state.tasks;
}

export function getTasksByClientId(clientId: string, state: DemoDataState = initialDemoData) {
  return state.tasks.filter((task) => task.clientId === clientId);
}

export function getAuditEvents(state: DemoDataState = initialDemoData): AuditEvent[] {
  return state.auditEvents;
}

export function getAuditEventsByEntity(entityId: string, state: DemoDataState = initialDemoData) {
  return state.auditEvents.filter((event) => event.entityId === entityId);
}
