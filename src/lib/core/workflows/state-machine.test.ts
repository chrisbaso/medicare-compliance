import { describe, it, expect } from "vitest";
import { assertTransitionAllowed, transitionWorkflow } from "./state-machine";
import { medicareConversationWorkflow } from "@/lib/verticals/medicare/workflows";
import { workflowBlockingRuleKeys } from "@/lib/compliance/rules";

describe("assertTransitionAllowed", () => {
  it("blocks a terminal transition when an open blocking flag remains", () => {
    expect(() =>
      assertTransitionAllowed(medicareConversationWorkflow, "ready_to_route", "complete", {
        openBlockingFlags: [{ rule_id: "cross_sell_contamination" }]
      })
    ).toThrow(/open blocking compliance flag/);
  });

  it("allows the terminal transition once blocking flags are cleared", () => {
    const t = assertTransitionAllowed(medicareConversationWorkflow, "ready_to_route", "complete", {
      openBlockingFlags: []
    });
    expect(t.to).toBe("complete");
  });

  it("allows a non-terminal transition regardless of open blocking flags", () => {
    const t = assertTransitionAllowed(medicareConversationWorkflow, "awaiting_review", "blocked", {
      openBlockingFlags: [{ rule_id: "cross_sell_contamination" }]
    });
    expect(t.to).toBe("blocked");
  });

  it("still rejects structurally invalid transitions", () => {
    expect(() =>
      assertTransitionAllowed(medicareConversationWorkflow, "awaiting_review", "complete")
    ).toThrow(/Invalid workflow transition/);
  });

  it("defaults to allowing when no flag info is supplied (back-compatible with transitionWorkflow)", () => {
    const guarded = assertTransitionAllowed(medicareConversationWorkflow, "ready_to_route", "complete");
    const plain = transitionWorkflow(medicareConversationWorkflow, "ready_to_route", "complete");
    expect(guarded.action).toBe(plain.action);
  });
});

describe("workflowBlockingRuleKeys", () => {
  it("includes the catalog rules marked blocksWorkflow", () => {
    expect(workflowBlockingRuleKeys).toContain("cross_sell_contamination");
    expect(workflowBlockingRuleKeys).toContain("implied_government_endorsement");
    // urgency is not workflow-blocking
    expect(workflowBlockingRuleKeys).not.toContain("urgency_high_pressure_language");
  });
});
