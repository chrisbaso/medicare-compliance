import { describe, it, expect } from "vitest";
import { buildAuditPack, AuditPackInput, FLAG_TYPE_LABELS } from "./audit-pack";
import { Client, ComplianceFlag, ConsentRecord, Conversation } from "./types";

const START = "2026-01-01T00:00:00Z";
const END = "2026-12-31T23:59:59Z";

function client(id: string, first = "Test", last = "Client"): Client {
  return {
    id,
    agencyId: "a1",
    firstName: first,
    lastName: last,
    dob: "1955-01-01",
    phone: "",
    email: "",
    state: "IL",
    preferredContactMethod: "phone",
    status: "active_review",
    tags: [],
    note: ""
  };
}

function conversation(overrides: Partial<Conversation>): Conversation {
  return {
    id: "conv1",
    agencyId: "a1",
    clientId: "c1",
    ownerUserId: "u1",
    channel: "phone",
    status: "in_review",
    startedAt: "2026-05-01T10:00:00Z",
    endedAt: "2026-05-01T10:30:00Z",
    summary: "",
    medicareScope: "Medicare supplement review",
    routingState: "awaiting_review",
    detectedTopics: [],
    retirementInterestDetected: false,
    nextStep: "",
    ...overrides
  } as Conversation;
}

function flag(overrides: Partial<ComplianceFlag>): ComplianceFlag {
  return {
    id: "f1",
    conversationId: "conv1",
    clientId: "c1",
    flagType: "cross_sell_risk",
    severity: "high",
    status: "open",
    rationale: "test rationale",
    detectedBy: "system",
    flaggedAt: "2026-05-01T11:00:00Z",
    recommendedAction: "",
    ...overrides
  };
}

function consent(overrides: Partial<ConsentRecord>): ConsentRecord {
  return {
    id: "cons1",
    clientId: "c1",
    conversationId: "conv1",
    consentType: "soa",
    status: "granted",
    capturedAt: "2026-05-01T09:55:00Z",
    captureMethod: "recorded line",
    evidenceRef: "CALL-1",
    evidenceComplete: true,
    notes: "",
    ...overrides
  };
}

function input(overrides: Partial<AuditPackInput> = {}): AuditPackInput {
  return {
    clients: [client("c1", "Margaret", "Ellis")],
    conversations: [],
    flags: [],
    consents: [],
    auditEvents: [],
    rangeStart: START,
    rangeEnd: END,
    ...overrides
  };
}

describe("buildAuditPack", () => {
  it("filters everything to the date range", () => {
    const pack = buildAuditPack(
      input({
        conversations: [
          conversation({ id: "in", startedAt: "2026-05-01T10:00:00Z" }),
          conversation({ id: "out", startedAt: "2025-05-01T10:00:00Z" })
        ],
        flags: [flag({ flaggedAt: "2025-01-01T00:00:00Z" })]
      })
    );
    expect(pack.generated.conversationCount).toBe(1);
    expect(pack.flagSummary.total).toBe(0);
  });

  it("computes SOA coverage percent and flags Medicare conversations without SOA as gaps", () => {
    const pack = buildAuditPack(
      input({
        conversations: [
          conversation({ id: "covered" }),
          conversation({ id: "uncovered", clientId: "c1" })
        ],
        consents: [consent({ conversationId: "covered" })]
      })
    );
    expect(pack.consentCoverage.conversationsWithSoa).toBe(1);
    expect(pack.consentCoverage.soaCoveragePercent).toBe(50);
    const soaGaps = pack.gaps.filter((g) => g.category === "conversation_without_soa");
    expect(soaGaps).toHaveLength(1);
    expect(soaGaps[0].clientName).toBe("Margaret Ellis");
  });

  it("computes flag disposition counts and resolution rate", () => {
    const pack = buildAuditPack(
      input({
        flags: [
          flag({ id: "1", status: "resolved" }),
          flag({ id: "2", status: "dismissed", severity: "low" }),
          flag({ id: "3", status: "open", severity: "critical" }),
          flag({ id: "4", status: "open", severity: "medium" })
        ]
      })
    );
    expect(pack.flagSummary.total).toBe(4);
    expect(pack.flagSummary.resolutionRatePercent).toBe(50);
    expect(pack.flagSummary.bySeverity.critical).toBe(1);
    // Only high/critical OPEN flags become gaps: ids 3 (critical) — id 4 is medium.
    expect(pack.gaps.filter((g) => g.category === "open_high_severity_flag")).toHaveLength(1);
  });

  it("reports separation integrity and gaps for retirement interest without consent", () => {
    const pack = buildAuditPack(
      input({
        clients: [client("c1"), client("c2", "Linda", "Park")],
        conversations: [
          conversation({ id: "r1", clientId: "c1", retirementInterestDetected: true }),
          conversation({ id: "r2", clientId: "c2", retirementInterestDetected: true })
        ],
        consents: [
          consent({ clientId: "c2", consentType: "retirement_follow_up", conversationId: "r2" })
        ]
      })
    );
    expect(pack.separationIntegrity.retirementInterestConversations).toBe(2);
    expect(pack.separationIntegrity.withSeparateConsent).toBe(1);
    expect(pack.separationIntegrity.withoutSeparateConsent).toBe(1);
    const gap = pack.gaps.find((g) => g.category === "retirement_interest_without_consent");
    expect(gap?.clientId).toBe("c1");
  });

  it("flags evidence-incomplete consents as gaps", () => {
    const pack = buildAuditPack(
      input({ consents: [consent({ evidenceComplete: false, evidenceRef: "" })] })
    );
    expect(pack.consentCoverage.evidenceIncompleteCount).toBe(1);
    expect(pack.gaps.some((g) => g.category === "consent_evidence_incomplete")).toBe(true);
  });

  it("returns 100% rates for an empty range instead of dividing by zero", () => {
    const pack = buildAuditPack(input());
    expect(pack.consentCoverage.soaCoveragePercent).toBe(100);
    expect(pack.flagSummary.resolutionRatePercent).toBe(100);
    expect(pack.gaps).toHaveLength(0);
  });

  it("uses plain-language labels for every flag type", () => {
    for (const label of Object.values(FLAG_TYPE_LABELS)) {
      expect(label).not.toMatch(/_/); // operator-facing, no internal keys
    }
  });
});
