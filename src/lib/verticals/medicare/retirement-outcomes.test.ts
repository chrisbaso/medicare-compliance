import { describe, it, expect } from "vitest";
import { formatUsd, summarizeRetirementOutcomes } from "./retirement-outcomes";
import { FollowupWorkflow } from "@/lib/types";

function workflow(overrides: Partial<FollowupWorkflow> = {}): FollowupWorkflow {
  return {
    id: "wf1",
    clientId: "c1",
    sourceConversationId: "conv1",
    opportunitySignalId: "sig1",
    type: "retirement_income_follow_up",
    status: "assigned",
    explicitConsentStatus: "granted",
    interestSummary: "",
    nextStep: "",
    requestedAt: "2026-05-01T00:00:00Z",
    lastUpdatedAt: "2026-05-01T00:00:00Z",
    ...overrides
  };
}

describe("summarizeRetirementOutcomes", () => {
  it("totals placements, premium, and commission", () => {
    const summary = summarizeRetirementOutcomes([
      workflow({ outcome: "placed", premiumWritten: 100_000, commissionAmount: 6_500 }),
      workflow({ id: "wf2", outcome: "placed", premiumWritten: 50_000, commissionAmount: 3_000 }),
      workflow({ id: "wf3", outcome: "declined" }),
      workflow({ id: "wf4" }) // no outcome yet
    ]);
    expect(summary.totalOpportunities).toBe(4);
    expect(summary.placed).toBe(2);
    expect(summary.declined).toBe(1);
    expect(summary.stillOpen).toBe(1);
    expect(summary.premiumWritten).toBe(150_000);
    expect(summary.commissionEarned).toBe(9_500);
    expect(summary.placementRatePercent).toBe(67); // 2 of 3 decided
  });

  it("treats missing amounts on a placement as zero, not NaN", () => {
    const summary = summarizeRetirementOutcomes([workflow({ outcome: "placed" })]);
    expect(summary.premiumWritten).toBe(0);
    expect(summary.commissionEarned).toBe(0);
    expect(summary.placed).toBe(1);
  });

  it("reports zero placement rate when nothing is decided", () => {
    const summary = summarizeRetirementOutcomes([workflow(), workflow({ id: "wf2", outcome: "pending" })]);
    expect(summary.placementRatePercent).toBe(0);
    expect(summary.stillOpen).toBe(2);
  });

  it("handles an empty pipeline", () => {
    const summary = summarizeRetirementOutcomes([]);
    expect(summary).toEqual({
      totalOpportunities: 0,
      placed: 0,
      declined: 0,
      stillOpen: 0,
      premiumWritten: 0,
      commissionEarned: 0,
      placementRatePercent: 0
    });
  });
});

describe("formatUsd", () => {
  it("formats whole-dollar currency", () => {
    expect(formatUsd(150000)).toBe("$150,000");
    expect(formatUsd(0)).toBe("$0");
  });
});
