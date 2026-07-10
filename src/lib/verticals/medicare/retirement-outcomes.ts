import { FollowupWorkflow } from "@/lib/types";

/**
 * Outcome economics for the licensed retirement workflow.
 *
 * Summarizes what consented, licensed follow-ups actually produced —
 * placements, premium written, commission — so the pipeline reports its own
 * ROI ("N consented opportunities -> M placements -> $X, every one with a
 * consent record"). Pure and deterministic.
 */

export interface RetirementOutcomeSummary {
  totalOpportunities: number;
  placed: number;
  declined: number;
  stillOpen: number; // pending outcome (or no outcome data yet)
  premiumWritten: number;
  commissionEarned: number;
  /** placed / decided (placed + declined); 0 when nothing is decided yet. */
  placementRatePercent: number;
}

export function summarizeRetirementOutcomes(
  workflows: FollowupWorkflow[]
): RetirementOutcomeSummary {
  let placed = 0;
  let declined = 0;
  let premiumWritten = 0;
  let commissionEarned = 0;

  for (const workflow of workflows) {
    switch (workflow.outcome) {
      case "placed":
        placed += 1;
        premiumWritten += workflow.premiumWritten ?? 0;
        commissionEarned += workflow.commissionAmount ?? 0;
        break;
      case "declined":
        declined += 1;
        break;
      default:
        break; // pending / closed / no outcome data — still open economics-wise
    }
  }

  const decided = placed + declined;
  return {
    totalOpportunities: workflows.length,
    placed,
    declined,
    stillOpen: workflows.length - decided,
    premiumWritten,
    commissionEarned,
    placementRatePercent: decided === 0 ? 0 : Math.round((placed / decided) * 100)
  };
}

export function formatUsd(amount: number): string {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  });
}
