import { describe, it, expect } from "vitest";
import { buildScoringSnapshots, scoreBookFromState, retentionAtRisk } from "./book-intelligence";
import { Client, ConsentRecord, Conversation } from "./types";

const REF = new Date(Date.UTC(2026, 6, 8));

function client(overrides: Partial<Client> = {}): Client {
  return {
    id: "c1",
    agencyId: "a1",
    firstName: "Test",
    lastName: "Client",
    dob: "1950-01-15",
    phone: "555-0100",
    email: "t@example.com",
    state: "IL",
    preferredContactMethod: "phone",
    status: "active_review",
    tags: [],
    note: "",
    ...overrides
  };
}

function conversation(clientId: string, startedAt: string): Conversation {
  return { clientId, startedAt, id: `conv-${startedAt}`, agencyId: "a1" } as unknown as Conversation;
}

function consent(clientId: string, overrides: Partial<ConsentRecord> = {}): ConsentRecord {
  return {
    id: "cons1",
    clientId,
    consentType: "retirement_follow_up",
    status: "granted",
    capturedAt: "2026-04-01T00:00:00Z",
    captureMethod: "recorded line",
    evidenceRef: "CALL-1",
    evidenceComplete: true,
    notes: "",
    ...overrides
  };
}

describe("buildScoringSnapshots", () => {
  it("uses the latest conversation per client and null when never contacted", () => {
    const snapshots = buildScoringSnapshots({
      clients: [client({ id: "c1" }), client({ id: "c2" })],
      conversations: [
        conversation("c1", "2026-01-01T00:00:00Z"),
        conversation("c1", "2026-06-01T00:00:00Z")
      ],
      consents: []
    });
    expect(snapshots.find((s) => s.clientId === "c1")?.lastConversationAt).toBe("2026-06-01T00:00:00Z");
    expect(snapshots.find((s) => s.clientId === "c2")?.lastConversationAt).toBeNull();
  });

  it("grants retirement consent only for granted + evidence-complete records", () => {
    const snapshots = buildScoringSnapshots({
      clients: [client({ id: "c1" }), client({ id: "c2" }), client({ id: "c3" })],
      conversations: [],
      consents: [
        consent("c1"),
        consent("c2", { status: "pending" }),
        consent("c3", { evidenceComplete: false })
      ]
    });
    expect(snapshots.find((s) => s.clientId === "c1")?.hasSeparateRetirementConsent).toBe(true);
    expect(snapshots.find((s) => s.clientId === "c2")?.hasSeparateRetirementConsent).toBe(false);
    expect(snapshots.find((s) => s.clientId === "c3")?.hasSeparateRetirementConsent).toBe(false);
  });
});

describe("scoreBookFromState", () => {
  it("attaches the client record and ranks by score", () => {
    const entries = scoreBookFromState(
      {
        clients: [
          client({ id: "quiet", note: "" }),
          client({ id: "hot", dob: "1961-09-01", note: "premium increase concern" })
        ],
        conversations: [conversation("quiet", REF.toISOString())],
        consents: []
      },
      REF
    );
    expect(entries[0].clientId).toBe("hot");
    expect(entries[0].client.id).toBe("hot");
    expect(entries[0].totalScore).toBeGreaterThan(entries[1].totalScore);
  });

  it("retentionAtRisk selects only entries carrying a stale_contact signal", () => {
    const entries = scoreBookFromState(
      {
        clients: [client({ id: "never" }), client({ id: "recent" })],
        conversations: [conversation("recent", REF.toISOString())],
        consents: []
      },
      REF
    );
    const risky = retentionAtRisk(entries);
    expect(risky.map((e) => e.clientId)).toEqual(["never"]);
  });
});
