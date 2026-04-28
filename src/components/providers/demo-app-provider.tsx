"use client";

import { createContext, useContext, useMemo, useReducer } from "react";
import { initialDemoData } from "@/lib/demo-data";
import { getConversationById } from "@/lib/demo-selectors";
import { DemoDataState, FollowUpOpportunity, QaOutcome, TaskStatus } from "@/lib/types";

type DemoAction =
  | { type: "setCurrentUser"; userId: string }
  | { type: "updateTaskStatus"; taskId: string; status: TaskStatus }
  | { type: "assignTask"; taskId: string; userId: string }
  | { type: "updateConversationStatus"; conversationId: string; status: DemoDataState["conversations"][number]["status"] }
  | { type: "updateConsentStatus"; consentId: string; status: DemoDataState["consentRecords"][number]["status"] }
  | { type: "createFollowUpFromConversation"; conversationId: string }
  | { type: "updateOpportunityStatus"; opportunityId: string; status: FollowUpOpportunity["status"] }
  | { type: "assignOpportunity"; opportunityId: string; userId: string }
  | { type: "resolveFlag"; flagId: string; status: "resolved" | "dismissed" }
  | { type: "updateQaOutcome"; qaReviewId: string; outcome: QaOutcome };

interface DemoAppContextValue {
  state: DemoDataState;
  actions: {
    setCurrentUser: (userId: string) => void;
    updateTaskStatus: (taskId: string, status: TaskStatus) => void;
    assignTask: (taskId: string, userId: string) => void;
    updateConversationStatus: (conversationId: string, status: DemoDataState["conversations"][number]["status"]) => void;
    updateConsentStatus: (consentId: string, status: DemoDataState["consentRecords"][number]["status"]) => void;
    createFollowUpFromConversation: (conversationId: string) => void;
    updateOpportunityStatus: (opportunityId: string, status: FollowUpOpportunity["status"]) => void;
    assignOpportunity: (opportunityId: string, userId: string) => void;
    resolveFlag: (flagId: string, status: "resolved" | "dismissed") => void;
    updateQaOutcome: (qaReviewId: string, outcome: QaOutcome) => void;
  };
}

const DemoAppContext = createContext<DemoAppContextValue | undefined>(undefined);

function createAudit(state: DemoDataState, entityType: DemoDataState["auditEvents"][number]["entityType"], entityId: string, action: string, detail: string) {
  return {
    id: `audit-${state.auditEvents.length + 1}`,
    entityType,
    entityId,
    action,
    actorUserId: state.currentUserId,
    eventAt: new Date().toISOString(),
    detail
  };
}

function reducer(state: DemoDataState, action: DemoAction): DemoDataState {
  switch (action.type) {
    case "setCurrentUser":
      return { ...state, currentUserId: action.userId };
    case "updateTaskStatus": {
      const tasks = state.tasks.map((task) =>
        task.id === action.taskId ? { ...task, status: action.status } : task
      );
      const updatedTask = tasks.find((task) => task.id === action.taskId);
      return {
        ...state,
        tasks,
        auditEvents: updatedTask
          ? [createAudit(state, "task", updatedTask.id, "status_changed", `Task marked ${action.status}.`), ...state.auditEvents]
          : state.auditEvents
      };
    }
    case "assignTask": {
      const tasks = state.tasks.map((task) =>
        task.id === action.taskId ? { ...task, assignedUserId: action.userId || undefined } : task
      );
      return {
        ...state,
        tasks,
        auditEvents: [createAudit(state, "task", action.taskId, "assigned", "Task owner changed."), ...state.auditEvents]
      };
    }
    case "updateConversationStatus": {
      const conversations = state.conversations.map((conversation) =>
        conversation.id === action.conversationId ? { ...conversation, status: action.status } : conversation
      );
      return {
        ...state,
        conversations,
        auditEvents: [createAudit(state, "conversation", action.conversationId, "status_changed", `Conversation moved to ${action.status}.`), ...state.auditEvents]
      };
    }
    case "updateConsentStatus": {
      const consentRecords = state.consentRecords.map((record) =>
        record.id === action.consentId
          ? {
              ...record,
              status: action.status,
              evidenceComplete: action.status === "granted" ? true : record.evidenceComplete
            }
          : record
      );

      const linkedRecord = consentRecords.find((record) => record.id === action.consentId);
      let followUpOpportunities = state.followUpOpportunities;
      if (linkedRecord?.linkedOpportunityId) {
        followUpOpportunities = state.followUpOpportunities.map((opportunity) =>
          opportunity.id === linkedRecord.linkedOpportunityId
            ? {
                ...opportunity,
                explicitConsentStatus:
                  action.status === "granted"
                    ? "granted"
                    : action.status === "revoked"
                      ? "revoked"
                      : "pending",
                status:
                  action.status === "granted"
                    ? opportunity.assignedUserId
                      ? "assigned"
                      : "ready_for_assignment"
                    : action.status === "revoked"
                      ? "closed_no_action"
                      : "awaiting_consent"
              }
            : opportunity
        );
      }

      return {
        ...state,
        consentRecords,
        followupWorkflows: followUpOpportunities,
        followUpOpportunities,
        auditEvents: [createAudit(state, "consent", action.consentId, "status_changed", `Consent updated to ${action.status}.`), ...state.auditEvents]
      };
    }
    case "createFollowUpFromConversation": {
      const existing = getConversationById(state, action.conversationId);
      if (!existing || state.followUpOpportunities.some((item) => item.sourceConversationId === action.conversationId)) {
        return state;
      }

      const nextOpportunityId = `opp-${state.followUpOpportunities.length + 1}`;
      const nextSignalId = `sig-${state.opportunitySignals.length + 1}`;
      const nextConsentId = `consent-${state.consentRecords.length + 1}`;
      const nextTaskId = `task-${state.tasks.length + 1}`;
      const now = new Date().toISOString();
      const followUpOpportunities = [
        {
          id: nextOpportunityId,
          clientId: existing.clientId,
          sourceConversationId: existing.id,
          opportunitySignalId: nextSignalId,
          type: "retirement_income_follow_up" as const,
          status: "awaiting_consent" as const,
          explicitConsentStatus: "pending" as const,
          interestSummary: "Separate follow-up created from conversation topic detection. Explicit consent is still required.",
          nextStep: "Wait for explicit consent before assigning a licensed human.",
          requestedAt: now,
          lastUpdatedAt: now
        },
        ...state.followUpOpportunities
      ];

      return {
        ...state,
        followupWorkflows: followUpOpportunities,
        followUpOpportunities,
        opportunitySignals: [
          {
            id: nextSignalId,
            clientId: existing.clientId,
            conversationId: existing.id,
            signalType: "retirement_income_interest",
            detectedAt: now,
            source: "manual_note",
            confidence: "medium",
            signalSummary: "Separate follow-up signal created from conversation topic detection.",
            recommendedWorkflow: "separate_followup",
            status: "workflow_created"
          },
          ...state.opportunitySignals
        ],
        consentRecords: [
          {
            id: nextConsentId,
            clientId: existing.clientId,
            conversationId: existing.id,
            followupWorkflowId: nextOpportunityId,
            linkedOpportunityId: nextOpportunityId,
            consentType: "retirement_follow_up",
            status: "pending",
            capturedAt: now,
            captureMethod: "demo follow-up request created",
            evidenceRef: "PENDING-CONSENT",
            evidenceComplete: false
            ,
            notes: "Created from local demo action."
          },
          ...state.consentRecords
        ],
        tasks: [
          {
            id: nextTaskId,
            clientId: existing.clientId,
            sourceType: "follow_up_opportunity",
            sourceId: nextOpportunityId,
            title: "Obtain explicit retirement follow-up consent",
            queue: "follow_up",
            status: "open",
            priority: "high",
            assignedUserId: state.currentUserId,
            dueAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString()
          },
          ...state.tasks
        ],
        auditEvents: [createAudit(state, "follow_up_opportunity", nextOpportunityId, "created", "Separate follow-up workflow created from conversation."), ...state.auditEvents]
      };
    }
    case "updateOpportunityStatus": {
      const followUpOpportunities = state.followUpOpportunities.map((opportunity) =>
        opportunity.id === action.opportunityId ? { ...opportunity, status: action.status } : opportunity
      );
      return {
        ...state,
        followupWorkflows: followUpOpportunities,
        followUpOpportunities,
        auditEvents: [createAudit(state, "follow_up_opportunity", action.opportunityId, "status_changed", `Opportunity moved to ${action.status}.`), ...state.auditEvents]
      };
    }
    case "assignOpportunity": {
      const followUpOpportunities = state.followUpOpportunities.map((opportunity) =>
        opportunity.id === action.opportunityId
          ? {
              ...opportunity,
              assignedUserId: action.userId || undefined,
              status: opportunity.explicitConsentStatus === "granted" ? "assigned" : opportunity.status
            }
          : opportunity
      );
      return {
        ...state,
        followupWorkflows: followUpOpportunities,
        followUpOpportunities,
        auditEvents: [createAudit(state, "follow_up_opportunity", action.opportunityId, "assigned", "Follow-up owner changed."), ...state.auditEvents]
      };
    }
    case "resolveFlag": {
      const targetFlag = state.complianceFlags.find((flag) => flag.id === action.flagId);
      const complianceFlags = state.complianceFlags.map((flag) =>
        flag.id === action.flagId ? { ...flag, status: action.status } : flag
      );
      return {
        ...state,
        complianceFlags,
        auditEvents: targetFlag
          ? [createAudit(state, "conversation", targetFlag.conversationId, action.status, `Flag ${targetFlag.flagType} marked ${action.status}.`), ...state.auditEvents]
          : state.auditEvents
      };
    }
    case "updateQaOutcome": {
      const qaReviews = state.qaReviews.map((review) =>
        review.id === action.qaReviewId ? { ...review, outcome: action.outcome } : review
      );
      return {
        ...state,
        qaReviews,
        auditEvents: [createAudit(state, "qa_review", action.qaReviewId, "outcome_changed", `QA outcome updated to ${action.outcome}.`), ...state.auditEvents]
      };
    }
    default:
      return state;
  }
}

export function DemoAppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialDemoData);

  const value = useMemo<DemoAppContextValue>(
    () => ({
      state,
      actions: {
        setCurrentUser: (userId) => dispatch({ type: "setCurrentUser", userId }),
        updateTaskStatus: (taskId, status) => dispatch({ type: "updateTaskStatus", taskId, status }),
        assignTask: (taskId, userId) => dispatch({ type: "assignTask", taskId, userId }),
        updateConversationStatus: (conversationId, status) => dispatch({ type: "updateConversationStatus", conversationId, status }),
        updateConsentStatus: (consentId, status) => dispatch({ type: "updateConsentStatus", consentId, status }),
        createFollowUpFromConversation: (conversationId) => dispatch({ type: "createFollowUpFromConversation", conversationId }),
        updateOpportunityStatus: (opportunityId, status) => dispatch({ type: "updateOpportunityStatus", opportunityId, status }),
        assignOpportunity: (opportunityId, userId) => dispatch({ type: "assignOpportunity", opportunityId, userId }),
        resolveFlag: (flagId, status) => dispatch({ type: "resolveFlag", flagId, status }),
        updateQaOutcome: (qaReviewId, outcome) => dispatch({ type: "updateQaOutcome", qaReviewId, outcome })
      }
    }),
    [state]
  );

  return <DemoAppContext.Provider value={value}>{children}</DemoAppContext.Provider>;
}

export function useDemoApp() {
  const context = useContext(DemoAppContext);
  if (!context) {
    throw new Error("useDemoApp must be used within DemoAppProvider");
  }
  return context;
}
