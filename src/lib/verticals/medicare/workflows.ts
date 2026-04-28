import { WorkflowStateMachine } from "@/lib/core/workflows/state-machine";
import { ConversationRoutingState, WorkflowStatus } from "@/lib/types";

export const medicareConversationWorkflow: WorkflowStateMachine<ConversationRoutingState> = {
  initialState: "awaiting_review",
  terminalStates: ["complete"],
  transitions: [
    {
      from: "awaiting_review",
      to: "ready_to_route",
      action: "review_completed",
      auditLabel: "Conversation review completed"
    },
    {
      from: "awaiting_review",
      to: "blocked",
      action: "compliance_blocked",
      createsTask: true,
      auditLabel: "Conversation blocked for compliance review"
    },
    {
      from: "blocked",
      to: "ready_to_route",
      action: "blocker_resolved",
      auditLabel: "Conversation blocker resolved"
    },
    {
      from: "ready_to_route",
      to: "complete",
      action: "next_action_completed",
      auditLabel: "Conversation next action completed"
    }
  ]
};

export const retirementIncomeHandoffWorkflow: WorkflowStateMachine<WorkflowStatus> = {
  initialState: "detected",
  terminalStates: ["completed", "closed_no_action"],
  transitions: [
    {
      from: "detected",
      to: "awaiting_consent",
      action: "create_separate_workflow",
      requiresConsent: false,
      createsTask: true,
      auditLabel: "Separate retirement-income workflow created"
    },
    {
      from: "awaiting_consent",
      to: "ready_for_assignment",
      action: "consent_granted",
      requiresConsent: true,
      createsTask: true,
      auditLabel: "Separate follow-up consent granted"
    },
    {
      from: "ready_for_assignment",
      to: "assigned",
      action: "assign_licensed_owner",
      requiresConsent: true,
      auditLabel: "Licensed owner assigned"
    },
    {
      from: "assigned",
      to: "completed",
      action: "complete_follow_up",
      requiresConsent: true,
      auditLabel: "Separate follow-up completed"
    },
    {
      from: "awaiting_consent",
      to: "closed_no_action",
      action: "consent_declined_or_revoked",
      auditLabel: "Separate follow-up closed without action"
    }
  ]
};
