import { Client, ConsentRecord, Conversation } from "@/lib/types";
import {
  ClientOpportunityScore,
  ClientScoringSnapshot,
  scoreBook
} from "@/lib/verticals/medicare/opportunity-rules";

/**
 * Book intelligence adapter: maps app state (clients, conversations, consents)
 * into scoring snapshots and runs the eight-rule opportunity engine.
 * Pure and deterministic — the reference date is injected by the caller.
 */

export interface BookIntelligenceInput {
  clients: Client[];
  conversations: Conversation[];
  consents: ConsentRecord[];
}

export function buildScoringSnapshots(input: BookIntelligenceInput): ClientScoringSnapshot[] {
  const lastConversationByClient = new Map<string, string>();
  for (const conversation of input.conversations) {
    const existing = lastConversationByClient.get(conversation.clientId);
    if (!existing || conversation.startedAt > existing) {
      lastConversationByClient.set(conversation.clientId, conversation.startedAt);
    }
  }

  const consentedClients = new Set(
    input.consents
      .filter(
        (record) =>
          record.consentType === "retirement_follow_up" &&
          record.status === "granted" &&
          record.evidenceComplete
      )
      .map((record) => record.clientId)
  );

  return input.clients.map((client) => ({
    clientId: client.id,
    dob: client.dob,
    status: client.status,
    tags: client.tags,
    note: client.note,
    lastConversationAt: lastConversationByClient.get(client.id) ?? null,
    hasSeparateRetirementConsent: consentedClients.has(client.id)
  }));
}

export interface ScoredBookEntry extends ClientOpportunityScore {
  client: Client;
}

export function scoreBookFromState(
  input: BookIntelligenceInput,
  referenceDate: Date
): ScoredBookEntry[] {
  const clientById = new Map(input.clients.map((c) => [c.id, c]));
  return scoreBook(buildScoringSnapshots(input), referenceDate)
    .map((score) => ({ ...score, client: clientById.get(score.clientId)! }))
    .filter((entry) => entry.client !== undefined);
}

/** Clients whose only-or-top signal is retention risk (stale/no contact). */
export function retentionAtRisk(entries: ScoredBookEntry[]): ScoredBookEntry[] {
  return entries.filter((entry) => entry.signals.some((s) => s.ruleKey === "stale_contact"));
}
