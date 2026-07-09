import {
  annuityKeywords,
  cdKeywords,
  includesAny,
  marketRiskKeywords,
  retirementIncomeKeywords,
  spouseLossKeywords
} from "@/lib/compliance/rules";
import { Client, ConsentRecord, FollowupWorkflow } from "@/lib/types";

/**
 * The compliant retirement pipeline (Medicare vertical).
 *
 * Classifies every client into the funnel that turns a retirement-adjacent
 * signal into a defensible, licensed follow-up:
 *
 *   signal_on_file  ->  consent_captured  ->  in_licensed_workflow
 *
 * COMPLIANCE INVARIANTS (do not weaken):
 * - A signal alone NEVER authorizes outreach about retirement products. The
 *   stage-1 next step is to wait for a legitimate touchpoint and, only if the
 *   client raises the topic, offer a separate conversation and capture consent.
 * - Only a granted, evidence-complete `retirement_follow_up` consent moves a
 *   client to stage 2.
 * - Stage 3 mirrors the separate retirement_opportunities workflow, which is
 *   licensed-role gated at the database level.
 *
 * Pure and deterministic: all inputs injected, no clock, no I/O.
 */

export type RetirementFunnelStage =
  | "signal_on_file"
  | "consent_captured"
  | "in_licensed_workflow";

export type RetirementSignalKind =
  | "retirement_income_language"
  | "cd_maturing"
  | "spouse_loss"
  | "market_risk_concern";

export interface RetirementFunnelEntry {
  client: Client;
  stage: RetirementFunnelStage;
  signals: RetirementSignalKind[];
  /** Present at stage 3. */
  workflowStatus?: FollowupWorkflow["status"];
  /** Compliance-safe next step for this stage. */
  nextStep: string;
}

export interface RetirementFunnel {
  entries: RetirementFunnelEntry[];
  counts: Record<RetirementFunnelStage, number>;
}

const STAGE_NEXT_STEP: Record<RetirementFunnelStage, string> = {
  signal_on_file:
    "Wait for a legitimate service or scheduled Medicare touchpoint. If the client raises retirement or income topics, offer a separate conversation and capture explicit consent. Do not initiate product marketing inside a Medicare interaction.",
  consent_captured:
    "Consent is documented. Assign a licensed owner and schedule the separate retirement conversation — outside any Medicare appointment.",
  in_licensed_workflow:
    "Being handled in the separate licensed workflow. Keep all notes and outcomes inside that workflow."
};

function detectSignals(client: Client): RetirementSignalKind[] {
  const text = [client.note ?? "", ...client.tags].join(" ").toLowerCase();
  const signals: RetirementSignalKind[] = [];
  if (includesAny(text, [...retirementIncomeKeywords, ...annuityKeywords])) {
    signals.push("retirement_income_language");
  }
  if (includesAny(text, cdKeywords)) signals.push("cd_maturing");
  if (includesAny(text, spouseLossKeywords)) signals.push("spouse_loss");
  if (includesAny(text, marketRiskKeywords)) signals.push("market_risk_concern");
  return signals;
}

export function buildRetirementFunnel(input: {
  clients: Client[];
  consents: ConsentRecord[];
  workflows: FollowupWorkflow[];
}): RetirementFunnel {
  const consentedClientIds = new Set(
    input.consents
      .filter(
        (record) =>
          record.consentType === "retirement_follow_up" &&
          record.status === "granted" &&
          record.evidenceComplete
      )
      .map((record) => record.clientId)
  );

  const activeWorkflowByClient = new Map<string, FollowupWorkflow>();
  for (const workflow of input.workflows) {
    if (workflow.status === "closed_no_action") continue;
    activeWorkflowByClient.set(workflow.clientId, workflow);
  }

  const entries: RetirementFunnelEntry[] = [];
  for (const client of input.clients) {
    const signals = detectSignals(client);
    const workflow = activeWorkflowByClient.get(client.id);
    const hasConsent = consentedClientIds.has(client.id);

    let stage: RetirementFunnelStage | null = null;
    if (workflow) {
      stage = "in_licensed_workflow";
    } else if (hasConsent) {
      stage = "consent_captured";
    } else if (signals.length > 0) {
      stage = "signal_on_file";
    }
    if (!stage) continue; // no retirement relevance — not in the funnel

    entries.push({
      client,
      stage,
      signals,
      workflowStatus: workflow?.status,
      nextStep: STAGE_NEXT_STEP[stage]
    });
  }

  const counts: Record<RetirementFunnelStage, number> = {
    signal_on_file: 0,
    consent_captured: 0,
    in_licensed_workflow: 0
  };
  for (const entry of entries) counts[entry.stage] += 1;

  return { entries, counts };
}
