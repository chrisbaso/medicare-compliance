import { supabaseRestRequest } from "@/lib/core/supabase/rest-client";

export interface RepositorySession {
  organizationId: string;
  accessToken?: string;
}

function orgFilter(session: RepositorySession, separator = "?") {
  return `${separator}organization_id=eq.${session.organizationId}`;
}

export async function listClients(session: RepositorySession) {
  return supabaseRestRequest<unknown[]>({
    table: "clients",
    query: `${orgFilter(session)}&order=last_name.asc,first_name.asc`,
    accessToken: session.accessToken
  });
}

export async function listConversations(session: RepositorySession) {
  return supabaseRestRequest<unknown[]>({
    table: "conversations",
    query: `${orgFilter(session)}&order=started_at.desc`,
    accessToken: session.accessToken
  });
}

export async function listConsentLedger(session: RepositorySession, clientId?: string) {
  const clientFilter = clientId ? `&client_id=eq.${clientId}` : "";
  return supabaseRestRequest<unknown[]>({
    table: "consents",
    query: `${orgFilter(session)}${clientFilter}&order=captured_at.desc`,
    accessToken: session.accessToken
  });
}

export async function insertConsentRecord(session: RepositorySession, record: Record<string, unknown>) {
  return supabaseRestRequest<unknown[]>({
    table: "consents",
    method: "POST",
    body: {
      ...record,
      organization_id: session.organizationId
    },
    accessToken: session.accessToken
  });
}

export async function listComplianceFlags(session: RepositorySession) {
  return supabaseRestRequest<unknown[]>({
    table: "compliance_flags",
    query: `${orgFilter(session)}&order=flagged_at.desc`,
    accessToken: session.accessToken
  });
}

export async function insertAuditLog(session: RepositorySession, event: Record<string, unknown>) {
  return supabaseRestRequest<unknown[]>({
    table: "audit_logs",
    method: "POST",
    body: {
      ...event,
      organization_id: session.organizationId
    },
    accessToken: session.accessToken
  });
}
