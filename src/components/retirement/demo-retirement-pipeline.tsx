"use client";

import { useMemo } from "react";
import { RetirementPipelineView } from "@/components/retirement/retirement-pipeline-view";
import { useDemoApp } from "@/components/providers/demo-app-provider";
import { buildRetirementFunnel } from "@/lib/verticals/medicare/retirement-funnel";
import { summarizeRetirementOutcomes } from "@/lib/verticals/medicare/retirement-outcomes";

/** Demo-state fallback for the retirement pipeline when Supabase is not configured. */
export function DemoRetirementPipeline() {
  const { state } = useDemoApp();

  const funnel = useMemo(
    () =>
      buildRetirementFunnel({
        clients: state.clients,
        consents: state.consentRecords,
        workflows: state.followupWorkflows
      }),
    [state.clients, state.consentRecords, state.followupWorkflows]
  );

  const outcomes = summarizeRetirementOutcomes(state.followupWorkflows);

  return <RetirementPipelineView funnel={funnel} outcomes={outcomes} source="demo" />;
}
