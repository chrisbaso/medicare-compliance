import { DemoDataState, FollowUpOpportunity, User } from "@/lib/types";

export function getCurrentUser(state: DemoDataState) {
  return state.users.find((user) => user.id === state.currentUserId) ?? state.users[0];
}

export function getUserById(state: DemoDataState, userId?: string) {
  return state.users.find((user) => user.id === userId);
}

export function getClientById(state: DemoDataState, clientId: string) {
  return state.clients.find((client) => client.id === clientId);
}

export function getConversationById(state: DemoDataState, conversationId: string) {
  return state.conversations.find((conversation) => conversation.id === conversationId);
}

export function getOpportunityById(state: DemoDataState, opportunityId: string) {
  return state.followUpOpportunities.find((opportunity) => opportunity.id === opportunityId);
}

export function getClientConversations(state: DemoDataState, clientId: string) {
  return state.conversations.filter((conversation) => conversation.clientId === clientId);
}

export function getClientConsents(state: DemoDataState, clientId: string) {
  return state.consentRecords.filter((record) => record.clientId === clientId);
}

export function getClientFlags(state: DemoDataState, clientId: string) {
  return state.complianceFlags.filter((flag) => flag.clientId === clientId);
}

export function getClientTasks(state: DemoDataState, clientId: string) {
  return state.tasks.filter((task) => task.clientId === clientId);
}

export function getClientOpportunities(state: DemoDataState, clientId: string) {
  return state.followUpOpportunities.filter((opportunity) => opportunity.clientId === clientId);
}

export function getConversationFlags(state: DemoDataState, conversationId: string) {
  return state.complianceFlags.filter((flag) => flag.conversationId === conversationId);
}

export function getConversationConsents(state: DemoDataState, conversationId: string) {
  return state.consentRecords.filter((record) => record.conversationId === conversationId);
}

export function getConversationTranscript(state: DemoDataState, conversationId: string) {
  return state.transcriptEntries
    .filter((entry) => entry.conversationId === conversationId)
    .sort((a, b) => a.sequenceNumber - b.sequenceNumber);
}

export function getConversationTasks(state: DemoDataState, conversationId: string) {
  const consentIds = state.consentRecords.filter((record) => record.conversationId === conversationId).map((record) => record.id);
  const reviewIds = state.qaReviews.filter((review) => review.conversationId === conversationId).map((review) => review.id);
  const opportunityIds = state.followUpOpportunities
    .filter((opportunity) => opportunity.sourceConversationId === conversationId)
    .map((opportunity) => opportunity.id);

  return state.tasks.filter((task) => {
    if (task.sourceType === "conversation" && task.sourceId === conversationId) {
      return true;
    }

    if (task.sourceType === "consent" && consentIds.includes(task.sourceId)) {
      return true;
    }

    if (task.sourceType === "qa_review" && reviewIds.includes(task.sourceId)) {
      return true;
    }

    return task.sourceType === "follow_up_opportunity" && opportunityIds.includes(task.sourceId);
  });
}

export function getConversationQaReview(state: DemoDataState, conversationId: string) {
  return state.qaReviews.find((review) => review.conversationId === conversationId);
}

export function getConversationOpportunity(state: DemoDataState, conversationId: string) {
  return state.followUpOpportunities.find((opportunity) => opportunity.sourceConversationId === conversationId);
}

export function getOpenFlagsCount(state: DemoDataState) {
  return state.complianceFlags.filter((flag) => flag.status === "open").length;
}

export function getPendingConsentsCount(state: DemoDataState) {
  return state.consentRecords.filter((record) => record.status === "pending" || !record.evidenceComplete).length;
}

export function getOpenTasksCount(state: DemoDataState) {
  return state.tasks.filter((task) => task.status !== "done").length;
}

export function getRestrictedOpportunityVisibility(user?: User) {
  if (!user) {
    return false;
  }

  return user.role === "manager" || user.role === "compliance" || isRetirementFollowUpLicensedUser(user);
}

export function isRetirementFollowUpLicensedUser(user?: Pick<User, "licenseType">) {
  return user?.licenseType === "life_health" || user?.licenseType === "series65_plus";
}

export function getRetirementFollowUpAssignableUsers(state: DemoDataState) {
  return state.users.filter((user) => isRetirementFollowUpLicensedUser(user));
}

export function getVisibleOpportunities(state: DemoDataState) {
  const currentUser = getCurrentUser(state);
  return getRestrictedOpportunityVisibility(currentUser) ? state.followUpOpportunities : [];
}

export function getUrgentTasks(state: DemoDataState) {
  return state.tasks.filter((task) => task.status !== "done" && (task.priority === "urgent" || task.priority === "high"));
}

export function getOpportunityLanes(opportunities: FollowUpOpportunity[]) {
  return {
    detected: opportunities.filter((item) => item.status === "detected"),
    awaiting_consent: opportunities.filter((item) => item.status === "awaiting_consent"),
    ready_for_assignment: opportunities.filter((item) => item.status === "ready_for_assignment"),
    assigned: opportunities.filter((item) => item.status === "assigned"),
    completed: opportunities.filter((item) => item.status === "completed" || item.status === "closed_no_action")
  };
}
