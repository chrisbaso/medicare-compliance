"use client";

import { useMemo } from "react";
import { BookIntelligenceView } from "@/components/book/book-intelligence-view";
import { useDemoApp } from "@/components/providers/demo-app-provider";
import { scoreBookFromState } from "@/lib/book-intelligence";

/** Demo-state fallback for Book Intelligence when Supabase is not configured. */
export function DemoBookIntelligence() {
  const { state } = useDemoApp();

  const entries = useMemo(
    () =>
      scoreBookFromState(
        { clients: state.clients, conversations: state.conversations, consents: state.consentRecords },
        new Date()
      ),
    [state.clients, state.conversations, state.consentRecords]
  );

  return <BookIntelligenceView entries={entries} source="demo" />;
}
