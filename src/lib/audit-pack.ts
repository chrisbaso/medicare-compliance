import {
  AuditEvent,
  Client,
  ComplianceFlag,
  ConsentRecord,
  Conversation,
  FlagSeverity,
  FlagType
} from "@/lib/types";

/**
 * Audit-prep pack builder.
 *
 * Given the agency's records and a date range, assembles an examiner-ready
 * compliance report: consent coverage, flag dispositions, cross-sell
 * separation integrity, and a self-identified gap list ("find it before the
 * auditor does"). Pure and deterministic — all inputs injected, no clock.
 *
 * The output is INFORMATIONAL: it summarizes the agency's own records for
 * human review and is not legal or compliance advice.
 */

export interface AuditPackInput {
  clients: Client[];
  conversations: Conversation[];
  flags: ComplianceFlag[];
  consents: ConsentRecord[];
  auditEvents: AuditEvent[];
  rangeStart: string; // ISO inclusive
  rangeEnd: string; // ISO inclusive
}

export interface AuditGap {
  category:
    | "open_high_severity_flag"
    | "consent_evidence_incomplete"
    | "retirement_interest_without_consent"
    | "conversation_without_soa";
  clientId: string;
  clientName: string;
  detail: string;
  suggestedAction: string;
}

export interface AuditPack {
  range: { start: string; end: string };
  generated: {
    conversationCount: number;
    auditEventCount: number;
  };
  consentCoverage: {
    conversationsWithSoa: number;
    soaCoveragePercent: number; // of in-range conversations
    consentsByStatus: Record<string, number>;
    evidenceIncompleteCount: number;
  };
  flagSummary: {
    total: number;
    bySeverity: Record<FlagSeverity, number>;
    byStatus: Record<string, number>;
    resolutionRatePercent: number; // resolved+dismissed / total
    detail: Array<{
      clientName: string;
      flaggedAt: string;
      flagType: FlagType;
      severity: FlagSeverity;
      status: string;
      rationale: string;
    }>;
  };
  separationIntegrity: {
    retirementInterestConversations: number;
    withSeparateConsent: number;
    withoutSeparateConsent: number;
  };
  gaps: AuditGap[];
}

/** Plain-language labels for internal flag types (operator/examiner-facing). */
export const FLAG_TYPE_LABELS: Record<FlagType, string> = {
  missing_consent: "Consent not on file",
  cross_sell_risk: "Possible cross-sell in Medicare discussion",
  unsupported_claim: "Guarantee or unsupported claim language",
  needs_human_review: "Needs human review"
};

function inRange(iso: string, start: string, end: string): boolean {
  return iso >= start && iso <= end;
}

function clientName(clients: Map<string, Client>, clientId: string): string {
  const c = clients.get(clientId);
  return c ? `${c.firstName} ${c.lastName}` : "Unknown client";
}

export function buildAuditPack(input: AuditPackInput): AuditPack {
  const clientById = new Map(input.clients.map((c) => [c.id, c]));
  const conversations = input.conversations.filter((c) =>
    inRange(c.startedAt, input.rangeStart, input.rangeEnd)
  );
  const flags = input.flags.filter((f) => inRange(f.flaggedAt, input.rangeStart, input.rangeEnd));
  const consents = input.consents.filter((c) =>
    inRange(c.capturedAt, input.rangeStart, input.rangeEnd)
  );
  const auditEvents = input.auditEvents.filter((e) =>
    inRange(e.eventAt, input.rangeStart, input.rangeEnd)
  );

  // --- Consent coverage ---------------------------------------------------
  const soaConversationIds = new Set(
    input.consents
      .filter((c) => c.consentType === "soa" && c.status === "granted" && c.evidenceComplete)
      .map((c) => c.conversationId)
      .filter(Boolean)
  );
  const conversationsWithSoa = conversations.filter((c) => soaConversationIds.has(c.id)).length;
  const consentsByStatus: Record<string, number> = {};
  for (const c of consents) {
    consentsByStatus[c.status] = (consentsByStatus[c.status] ?? 0) + 1;
  }
  const evidenceIncomplete = consents.filter((c) => !c.evidenceComplete);

  // --- Flag dispositions ----------------------------------------------------
  const bySeverity: Record<FlagSeverity, number> = { low: 0, medium: 0, high: 0, critical: 0 };
  const byStatus: Record<string, number> = {};
  for (const f of flags) {
    bySeverity[f.severity] += 1;
    byStatus[f.status] = (byStatus[f.status] ?? 0) + 1;
  }
  const closed = (byStatus["resolved"] ?? 0) + (byStatus["dismissed"] ?? 0);

  // --- Separation integrity (the platform's signature guarantee) ------------
  const retirementConsentClientIds = new Set(
    input.consents
      .filter(
        (c) =>
          c.consentType === "retirement_follow_up" &&
          c.status === "granted" &&
          c.evidenceComplete
      )
      .map((c) => c.clientId)
  );
  const retirementConvs = conversations.filter((c) => c.retirementInterestDetected);
  const withConsent = retirementConvs.filter((c) => retirementConsentClientIds.has(c.clientId));

  // --- Gap list: find it before the auditor does ----------------------------
  const gaps: AuditGap[] = [];
  for (const f of flags) {
    if (f.status === "open" && (f.severity === "high" || f.severity === "critical")) {
      gaps.push({
        category: "open_high_severity_flag",
        clientId: f.clientId,
        clientName: clientName(clientById, f.clientId),
        detail: `${FLAG_TYPE_LABELS[f.flagType]} (${f.severity}) is still open: ${f.rationale}`,
        suggestedAction: "Have a compliance reviewer confirm or dismiss the flag with a documented reason."
      });
    }
  }
  for (const c of evidenceIncomplete) {
    gaps.push({
      category: "consent_evidence_incomplete",
      clientId: c.clientId,
      clientName: clientName(clientById, c.clientId),
      detail: `${c.consentType} consent recorded on ${c.capturedAt.slice(0, 10)} lacks complete evidence (${c.evidenceRef || "no evidence reference"}).`,
      suggestedAction: "Attach or re-capture the consent evidence before the record is relied on."
    });
  }
  for (const conv of retirementConvs) {
    if (!retirementConsentClientIds.has(conv.clientId)) {
      gaps.push({
        category: "retirement_interest_without_consent",
        clientId: conv.clientId,
        clientName: clientName(clientById, conv.clientId),
        detail: `Retirement-income interest detected on ${conv.startedAt.slice(0, 10)} with no separate granted consent on file.`,
        suggestedAction: "Do not follow up until explicit separate consent is captured and evidenced."
      });
    }
  }
  for (const conv of conversations) {
    if (!soaConversationIds.has(conv.id) && conv.medicareScope.toLowerCase().includes("medicare")) {
      gaps.push({
        category: "conversation_without_soa",
        clientId: conv.clientId,
        clientName: clientName(clientById, conv.clientId),
        detail: `Medicare-scope conversation on ${conv.startedAt.slice(0, 10)} has no completed Scope of Appointment on file.`,
        suggestedAction: "Verify or capture the SOA record and evidence."
      });
    }
  }

  return {
    range: { start: input.rangeStart, end: input.rangeEnd },
    generated: {
      conversationCount: conversations.length,
      auditEventCount: auditEvents.length
    },
    consentCoverage: {
      conversationsWithSoa,
      soaCoveragePercent:
        conversations.length === 0
          ? 100
          : Math.round((conversationsWithSoa / conversations.length) * 100),
      consentsByStatus,
      evidenceIncompleteCount: evidenceIncomplete.length
    },
    flagSummary: {
      total: flags.length,
      bySeverity,
      byStatus,
      resolutionRatePercent: flags.length === 0 ? 100 : Math.round((closed / flags.length) * 100),
      detail: flags
        .slice()
        .sort((a, b) => (a.flaggedAt < b.flaggedAt ? 1 : -1))
        .map((f) => ({
          clientName: clientName(clientById, f.clientId),
          flaggedAt: f.flaggedAt,
          flagType: f.flagType,
          severity: f.severity,
          status: f.status,
          rationale: f.rationale
        }))
    },
    separationIntegrity: {
      retirementInterestConversations: retirementConvs.length,
      withSeparateConsent: withConsent.length,
      withoutSeparateConsent: retirementConvs.length - withConsent.length
    },
    gaps
  };
}
