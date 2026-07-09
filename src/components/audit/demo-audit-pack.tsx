"use client";

import { AuditPackView } from "@/components/audit/audit-pack-view";
import { useDemoApp } from "@/components/providers/demo-app-provider";

/** Demo-state fallback for the audit-prep pack when Supabase is not configured. */
export function DemoAuditPack() {
  const { state } = useDemoApp();

  return (
    <AuditPackView
      data={{
        clients: state.clients,
        conversations: state.conversations,
        flags: state.complianceFlags,
        consents: state.consentRecords,
        auditEvents: state.auditEvents
      }}
      source="demo"
    />
  );
}
