import { describe, it, expect } from "vitest";
import { buildRetirementFunnel } from "./retirement-funnel";
import { Client, ConsentRecord, FollowupWorkflow } from "@/lib/types";

function client(id: string, note = "", tags: string[] = []): Client {
  return {
    id,
    agencyId: "a1",
    firstName: "Test",
    lastName: id,
    dob: "1955-01-01",
    phone: "",
    email: "",
    state: "IL",
    preferredContactMethod: "phone",
    status: "active_review",
    tags,
    note
  };
}

function consent(clientId: string, overrides: Partial<ConsentRecord> = {}): ConsentRecord {
  return {
    id: `cons-${clientId}`,
    clientId,
    consentType: "retirement_follow_up",
    status: "granted",
    capturedAt: "2026-05-01T00:00:00Z",
    captureMethod: "recorded line",
    evidenceRef: "CALL-1",
    evidenceComplete: true,
    notes: "",
    ...overrides
  };
}

function workflow(clientId: string, status: FollowupWorkflow["status"]): FollowupWorkflow {
  return {
    id: `wf-${clientId}`,
    clientId,
    sourceConversationId: "conv-1",
    opportunitySignalId: "sig-1",
    type: "retirement_income_follow_up",
    status,
    explicitConsentStatus: "granted",
    interestSummary: "",
    nextStep: "",
    requestedAt: "2026-05-01T00:00:00Z",
    lastUpdatedAt: "2026-05-01T00:00:00Z"
  };
}

describe("buildRetirementFunnel", () => {
  it("stages a signal-only client at signal_on_file with the wait-for-touchpoint step", () => {
    const funnel = buildRetirementFunnel({
      clients: [client("c1", "CD maturing this summer per his comment")],
      consents: [],
      workflows: []
    });
    expect(funnel.entries).toHaveLength(1);
    expect(funnel.entries[0].stage).toBe("signal_on_file");
    expect(funnel.entries[0].signals).toContain("cd_maturing");
    expect(funnel.entries[0].nextStep).toMatch(/Do not initiate product marketing/);
  });

  it("detects all four signal kinds from notes and tags", () => {
    const funnel = buildRetirementFunnel({
      clients: [
        client("income", "asked about retirement income"),
        client("cd", "", ["cd maturing"]),
        client("spouse", "her husband passed in March"),
        client("market", "worried about market volatility")
      ],
      consents: [],
      workflows: []
    });
    const byId = new Map(funnel.entries.map((e) => [e.client.id, e.signals]));
    expect(byId.get("income")).toContain("retirement_income_language");
    expect(byId.get("cd")).toContain("cd_maturing");
    expect(byId.get("spouse")).toContain("spouse_loss");
    expect(byId.get("market")).toContain("market_risk_concern");
  });

  it("moves a client to consent_captured ONLY with granted + evidence-complete consent", () => {
    const clients = [client("c1", "retirement income question")];
    const granted = buildRetirementFunnel({ clients, consents: [consent("c1")], workflows: [] });
    expect(granted.entries[0].stage).toBe("consent_captured");

    const pending = buildRetirementFunnel({
      clients,
      consents: [consent("c1", { status: "pending" })],
      workflows: []
    });
    expect(pending.entries[0].stage).toBe("signal_on_file");

    const noEvidence = buildRetirementFunnel({
      clients,
      consents: [consent("c1", { evidenceComplete: false })],
      workflows: []
    });
    expect(noEvidence.entries[0].stage).toBe("signal_on_file");
  });

  it("consent without a text signal still enters the funnel at consent_captured", () => {
    const funnel = buildRetirementFunnel({
      clients: [client("c1", "routine service note")],
      consents: [consent("c1")],
      workflows: []
    });
    expect(funnel.entries[0].stage).toBe("consent_captured");
    expect(funnel.entries[0].signals).toHaveLength(0);
  });

  it("an active workflow wins: in_licensed_workflow with its status", () => {
    const funnel = buildRetirementFunnel({
      clients: [client("c1", "retirement income")],
      consents: [consent("c1")],
      workflows: [workflow("c1", "assigned")]
    });
    expect(funnel.entries[0].stage).toBe("in_licensed_workflow");
    expect(funnel.entries[0].workflowStatus).toBe("assigned");
  });

  it("a closed_no_action workflow does not hold a client in stage 3", () => {
    const funnel = buildRetirementFunnel({
      clients: [client("c1", "retirement income")],
      consents: [],
      workflows: [workflow("c1", "closed_no_action")]
    });
    expect(funnel.entries[0].stage).toBe("signal_on_file");
  });

  it("clients with no retirement relevance stay out of the funnel entirely", () => {
    const funnel = buildRetirementFunnel({
      clients: [client("c1", "address change and billing question")],
      consents: [],
      workflows: []
    });
    expect(funnel.entries).toHaveLength(0);
    expect(funnel.counts).toEqual({
      signal_on_file: 0,
      consent_captured: 0,
      in_licensed_workflow: 0
    });
  });

  it("counts match entries per stage", () => {
    const funnel = buildRetirementFunnel({
      clients: [
        client("s1", "cd maturing"),
        client("s2", "market swings concern"),
        client("k1", "retirement income"),
        client("w1", "annuity question")
      ],
      consents: [consent("k1"), consent("w1")],
      workflows: [workflow("w1", "ready_for_assignment")]
    });
    expect(funnel.counts).toEqual({
      signal_on_file: 2,
      consent_captured: 1,
      in_licensed_workflow: 1
    });
  });

  it("never emits product-recommendation language in any next step", () => {
    const funnel = buildRetirementFunnel({
      clients: [client("c1", "annuity"), client("c2", "cd maturing")],
      consents: [consent("c1")],
      workflows: []
    });
    for (const entry of funnel.entries) {
      const text = entry.nextStep.toLowerCase();
      for (const banned of ["recommend", "sell", "pitch", "you should buy", "sign up"]) {
        expect(text, `nextStep must not contain '${banned}'`).not.toContain(banned);
      }
    }
  });
});
