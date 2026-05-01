import { SupabaseClient } from "@supabase/supabase-js";
import { Database, Inserts } from "../../../../supabase/types";
import {
  auditLogRowToAuditEvent,
  clientRowToClient,
  complianceFlagRowToComplianceFlag,
  consentRowToConsentRecord,
  conversationRowToConversation
} from "@/lib/core/repositories/mappers";

export type AppSupabaseClient = SupabaseClient<Database>;

function throwIfSupabaseError(error: { message: string } | null) {
  if (error) {
    throw new Error(error.message);
  }
}

function requireReturnedRow<Row>(data: Row | null, operation: string): Row {
  if (!data) {
    throw new Error(`Supabase did not return a row for ${operation}.`);
  }

  return data;
}

export async function listClients(supabase: AppSupabaseClient) {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true });

  throwIfSupabaseError(error);
  return (data ?? []).map(clientRowToClient);
}

export async function listConversations(supabase: AppSupabaseClient) {
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .order("started_at", { ascending: false });

  throwIfSupabaseError(error);
  return (data ?? []).map(conversationRowToConversation);
}

export async function listConsentLedger(supabase: AppSupabaseClient, clientId?: string) {
  let query = supabase
    .from("consents")
    .select("*")
    .order("captured_at", { ascending: false });

  if (clientId) {
    query = query.eq("client_id", clientId);
  }

  const { data, error } = await query;
  throwIfSupabaseError(error);
  return (data ?? []).map(consentRowToConsentRecord);
}

export async function insertConsentRecord(
  supabase: AppSupabaseClient,
  record: Inserts<"consents">
) {
  const { data, error } = await supabase
    .from("consents")
    .insert(record)
    .select()
    .single();

  throwIfSupabaseError(error);
  return consentRowToConsentRecord(requireReturnedRow(data, "insertConsentRecord"));
}

export async function listComplianceFlags(supabase: AppSupabaseClient) {
  const { data, error } = await supabase
    .from("compliance_flags")
    .select("*")
    .order("flagged_at", { ascending: false });

  throwIfSupabaseError(error);
  return (data ?? []).map(complianceFlagRowToComplianceFlag);
}

export async function insertAuditLog(
  supabase: AppSupabaseClient,
  event: Inserts<"audit_logs">
) {
  const { data, error } = await supabase
    .from("audit_logs")
    .insert(event)
    .select()
    .single();

  throwIfSupabaseError(error);
  return auditLogRowToAuditEvent(requireReturnedRow(data, "insertAuditLog"));
}
