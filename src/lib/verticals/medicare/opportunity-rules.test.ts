import { describe, it, expect } from "vitest";
import {
  scoreClient,
  scoreBook,
  ClientScoringSnapshot,
  opportunityRuleKeys
} from "./opportunity-rules";

const JULY = new Date(Date.UTC(2026, 6, 8)); // general season
const AEP = new Date(Date.UTC(2026, 10, 1)); // Nov 1 — inside AEP

function snapshot(overrides: Partial<ClientScoringSnapshot> = {}): ClientScoringSnapshot {
  return {
    clientId: "c1",
    dob: "1950-01-15", // 76 — outside turning-65 window
    status: "active_review",
    tags: [],
    note: "",
    lastConversationAt: JULY.toISOString(), // recent contact
    hasSeparateRetirementConsent: false,
    ...overrides
  };
}

function signalKeys(s: ClientScoringSnapshot, ref: Date) {
  return scoreClient(s, ref).signals.map((x) => x.ruleKey);
}

describe("scoreClient rules", () => {
  it("has exactly eight rule types", () => {
    expect(opportunityRuleKeys).toHaveLength(8);
  });

  it("clean recently-contacted client scores zero signals outside enrollment season", () => {
    const result = scoreClient(snapshot(), JULY);
    expect(result.signals).toHaveLength(0);
    expect(result.totalScore).toBe(0);
  });

  it("turning_65_window fires inside the IEP window and not for a 76-year-old", () => {
    // 65th birthday ~2 months after JULY reference (born 1961-09-01).
    expect(signalKeys(snapshot({ dob: "1961-09-01" }), JULY)).toContain("turning_65_window");
    expect(signalKeys(snapshot({ dob: "1950-01-15" }), JULY)).not.toContain("turning_65_window");
  });

  it("enrollment_seasonality fires during AEP and not in July", () => {
    expect(signalKeys(snapshot(), AEP)).toContain("enrollment_seasonality");
    expect(signalKeys(snapshot(), JULY)).not.toContain("enrollment_seasonality");
  });

  it("premium_pressure fires on recorded affordability concerns", () => {
    expect(signalKeys(snapshot({ note: "Client mentioned a premium increase worry" }), JULY)).toContain(
      "premium_pressure"
    );
  });

  it("life_event fires on spouse loss recorded in tags/notes", () => {
    expect(signalKeys(snapshot({ note: "Her husband passed last month" }), JULY)).toContain("life_event");
  });

  it("SUPPRESSES retirement follow-up without separate consent, allows it with consent", () => {
    const interested = { note: "asked about retirement income options" };
    expect(
      signalKeys(snapshot({ ...interested, hasSeparateRetirementConsent: false }), JULY)
    ).not.toContain("consented_retirement_follow_up");
    expect(
      signalKeys(snapshot({ ...interested, hasSeparateRetirementConsent: true }), JULY)
    ).toContain("consented_retirement_follow_up");
  });

  it("service_need and missing_document fire on their keyword families", () => {
    expect(signalKeys(snapshot({ note: "open billing question" }), JULY)).toContain("service_need");
    expect(signalKeys(snapshot({ note: "renewal packet missing signature page" }), JULY)).toContain(
      "missing_document"
    );
  });

  it("stale_contact fires for never-contacted and long-quiet clients, not recent ones", () => {
    expect(signalKeys(snapshot({ lastConversationAt: null }), JULY)).toContain("stale_contact");
    expect(
      signalKeys(snapshot({ lastConversationAt: "2025-06-01T00:00:00Z" }), JULY)
    ).toContain("stale_contact");
    expect(signalKeys(snapshot(), JULY)).not.toContain("stale_contact");
  });

  it("NEVER emits product-recommendation language in any reason or next action", () => {
    // Trigger every rule at once and scan the output text.
    const everything = scoreClient(
      snapshot({
        dob: "1961-09-01",
        note: "premium increase, husband passed, retirement income, billing, missing packet",
        lastConversationAt: null,
        hasSeparateRetirementConsent: true
      }),
      AEP
    );
    expect(everything.signals.length).toBeGreaterThanOrEqual(6);
    const text = everything.signals.map((s) => `${s.reason} ${s.nextAction}`).join(" ").toLowerCase();
    for (const banned of ["you should enroll", "recommend a", "recommend an", "switch to plan", "buy"]) {
      expect(text, `output must not contain '${banned}'`).not.toContain(banned);
    }
  });
});

describe("scoring aggregation", () => {
  it("caps total at 100 and weights the strongest signal most", () => {
    const hot = scoreClient(
      snapshot({ dob: "1961-09-01", note: "premium increase", lastConversationAt: null }),
      AEP
    );
    expect(hot.totalScore).toBeGreaterThan(90);
    expect(hot.totalScore).toBeLessThanOrEqual(100);
    expect(hot.signals[0].score).toBe(Math.max(...hot.signals.map((s) => s.score)));
  });

  it("scoreBook ranks clients by total score descending", () => {
    const ranked = scoreBook(
      [
        snapshot({ clientId: "cold" }),
        snapshot({ clientId: "hot", dob: "1961-09-01", lastConversationAt: null })
      ],
      JULY
    );
    expect(ranked[0].clientId).toBe("hot");
    expect(ranked[0].totalScore).toBeGreaterThan(ranked[1].totalScore);
  });
});
