import { BookIntelligenceView } from "@/components/book/book-intelligence-view";
import { DemoBookIntelligence } from "@/components/book/demo-book-intelligence";
import { scoreBookFromState } from "@/lib/book-intelligence";
import {
  listClients,
  listConsentLedger,
  listConversations
} from "@/lib/core/repositories/operations-repository";
import { createServerClient } from "@/lib/core/supabase/server";

/**
 * Book intelligence — server-rendered from the LIVE book when Supabase is
 * configured (so an ingested book shows up immediately, RLS-scoped to the
 * caller's org), falling back to the demo dataset otherwise.
 */

export const dynamic = "force-dynamic"; // live book data must not be cached at build time

export default async function BookIntelligencePage() {
  let liveData: Awaited<ReturnType<typeof loadLiveBook>> | null = null;
  try {
    liveData = await loadLiveBook();
  } catch (error) {
    // Demo fallback ONLY when Supabase is not configured. A live database
    // error must surface — silently showing demo data would be misleading.
    const notConfigured =
      error instanceof Error && error.message.includes("not configured");
    if (!notConfigured) {
      throw error;
    }
    liveData = null;
  }

  if (!liveData) {
    return <DemoBookIntelligence />;
  }

  const entries = scoreBookFromState(liveData, new Date());
  return <BookIntelligenceView entries={entries} source="live" />;
}

async function loadLiveBook() {
  const supabase = await createServerClient();
  const [clients, conversations, consents] = await Promise.all([
    listClients(supabase),
    listConversations(supabase),
    listConsentLedger(supabase)
  ]);
  return { clients, conversations, consents };
}
