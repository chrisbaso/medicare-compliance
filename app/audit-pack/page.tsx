import { AuditPackView } from "@/components/audit/audit-pack-view";
import { DemoAuditPack } from "@/components/audit/demo-audit-pack";
import {
  listAuditEvents,
  listClients,
  listComplianceFlags,
  listConsentLedger,
  listConversations
} from "@/lib/core/repositories/operations-repository";
import { createServerClient } from "@/lib/core/supabase/server";

/**
 * Audit-prep pack — assembled from the LIVE, RLS-scoped records when Supabase
 * is configured; demo dataset otherwise. Live database errors surface rather
 * than silently falling back (an audit pack built on the wrong data is worse
 * than no pack).
 */

export const dynamic = "force-dynamic";

export default async function AuditPackPage() {
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
    return <DemoAuditPack />;
  }

  return <AuditPackView data={liveData} source="live" />;
}

async function loadLiveRecords() {
  const supabase = await createServerClient();
  const [clients, conversations, flags, consents, auditEvents] = await Promise.all([
    listClients(supabase),
    listConversations(supabase),
    listComplianceFlags(supabase),
    listConsentLedger(supabase),
    listAuditEvents(supabase)
  ]);
  return { clients, conversations, flags, consents, auditEvents };
}
