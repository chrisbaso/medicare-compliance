import { DemoRetirementPipeline } from "@/components/retirement/demo-retirement-pipeline";
import { RetirementPipelineView } from "@/components/retirement/retirement-pipeline-view";
import {
  listClients,
  listConsentLedger,
  listRetirementOpportunities
} from "@/lib/core/repositories/operations-repository";
import { createServerClient } from "@/lib/core/supabase/server";
import { buildRetirementFunnel } from "@/lib/verticals/medicare/retirement-funnel";
import { summarizeRetirementOutcomes } from "@/lib/verticals/medicare/retirement-outcomes";

/**
 * Retirement pipeline — the compliant funnel from retirement-adjacent signal
 * to licensed, consented follow-up. Live (RLS-scoped) when Supabase is
 * configured; demo dataset otherwise. Live database errors surface rather
 * than silently falling back.
 */

export const dynamic = "force-dynamic";

export default async function RetirementPipelinePage() {
  let liveData: Awaited<ReturnType<typeof loadLiveRecords>> | null = null;
  try {
    liveData = await loadLiveRecords();
  } catch (error) {
    const notConfigured = error instanceof Error && error.message.includes("not configured");
    if (!notConfigured) {
      throw error;
    }
    liveData = null;
  }

  if (!liveData) {
    return <DemoRetirementPipeline />;
  }

  const funnel = buildRetirementFunnel(liveData);
  const outcomes = summarizeRetirementOutcomes(liveData.workflows);
  return <RetirementPipelineView funnel={funnel} outcomes={outcomes} source="live" />;
}

async function loadLiveRecords() {
  const supabase = await createServerClient();
  const [clients, consents, workflows] = await Promise.all([
    listClients(supabase),
    listConsentLedger(supabase),
    // RLS: non-privileged roles receive an empty list here (no visibility),
    // so stage 3 simply shows nothing for them.
    listRetirementOpportunities(supabase)
  ]);
  return { clients, consents, workflows };
}
