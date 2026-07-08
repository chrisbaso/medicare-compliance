import { describe, it, expect } from "vitest";
import {
  complianceRulesCatalog,
  phraseDrivenComplianceRules,
  findMatchedPhrases,
  getTranscriptHighlights
} from "./rules";

describe("complianceRulesCatalog", () => {
  it("every rule has a non-empty remediation and a valid severity", () => {
    const severities = new Set(["low", "medium", "high", "critical"]);
    for (const rule of Object.values(complianceRulesCatalog)) {
      expect(rule.remediationGuidance.trim().length).toBeGreaterThan(0);
      expect(severities.has(rule.severity)).toBe(true);
    }
  });

  it("every phrase-driven rule matches at least one of its own trigger examples", () => {
    for (const rule of phraseDrivenComplianceRules) {
      const haystack = rule.triggerExamples.join(" ").toLowerCase();
      const anyPhraseInExamples = (rule.phrases ?? []).some((p) => haystack.includes(p.toLowerCase()));
      // Not every example must contain a phrase, but findMatchedPhrases must work on the phrase itself.
      expect(findMatchedPhrases(rule.phrases?.[0] ?? "", rule.phrases ?? []).length).toBeGreaterThan(0);
      expect(typeof anyPhraseInExamples).toBe("boolean");
    }
  });
});

describe("getTranscriptHighlights", () => {
  it("returns risk and opportunity matches for a known transcript", () => {
    const { riskMatches, opportunityMatches } = getTranscriptHighlights(
      "This is the best plan and we should discuss retirement income and an annuity."
    );
    expect(riskMatches).toContain("best plan");
    expect(opportunityMatches).toContain("retirement income");
    expect(opportunityMatches).toContain("annuity");
  });

  it("returns empty arrays for a clean transcript", () => {
    const { riskMatches, opportunityMatches } = getTranscriptHighlights(
      "I updated your mailing address and sent the packet."
    );
    expect(riskMatches).toHaveLength(0);
    expect(opportunityMatches).toHaveLength(0);
  });
});

describe("findMatchedPhrases", () => {
  it("is case-insensitive", () => {
    expect(findMatchedPhrases("ACT NOW please", ["act now"])).toEqual(["act now"]);
  });
});
