import { describe, it, expect } from "vitest";
import { runDeterministicAiReview, NON_CATALOG_CHECKS } from "./deterministic-review";
import { AiReviewInput } from "./types";
import { complianceRulesCatalog } from "@/lib/compliance/rules";

function input(overrides: Partial<AiReviewInput> = {}): AiReviewInput {
  return {
    verticalSlug: "medicare",
    conversationId: "c1",
    transcript: "",
    hasScopeOfAppointment: true,
    hasSeparateRetirementConsent: true,
    ...overrides
  };
}

const catalogRuleIds = new Set<string>(Object.keys(complianceRulesCatalog));
const allowedNonCatalog = new Set<string>(Object.values(NON_CATALOG_CHECKS));

describe("runDeterministicAiReview", () => {
  it("flags retirement/annuity cross-sell when no separate consent exists", () => {
    const result = runDeterministicAiReview(
      input({ transcript: "We could look at an annuity for you.", hasSeparateRetirementConsent: false })
    );
    const f = result.flags.find((x) => x.rule_id === "missing_separate_follow_up_consent");
    expect(f).toBeDefined();
    expect(f?.flag_type).toBe("retirement_income_without_consent");
  });

  it("does NOT flag cross-sell when separate retirement consent is present", () => {
    const result = runDeterministicAiReview(
      input({ transcript: "We could look at an annuity for you.", hasSeparateRetirementConsent: true })
    );
    expect(result.flags.some((x) => x.rule_id === "missing_separate_follow_up_consent")).toBe(false);
  });

  it("flags product recommendation language", () => {
    const result = runDeterministicAiReview(input({ transcript: "Honestly this is the best plan available." }));
    expect(result.flags.some((x) => x.rule_id === "product_recommendation_language")).toBe(true);
  });

  it("flags unsupported guarantee language", () => {
    const result = runDeterministicAiReview(input({ transcript: "This is guaranteed to work." }));
    const f = result.flags.find((x) => x.rule_id === "unsupported_claims");
    expect(f).toBeDefined();
    expect(f?.flag_type).toBe("unsupported_claim");
  });

  it("flags implied government endorsement", () => {
    const result = runDeterministicAiReview(input({ transcript: "We are a medicare-approved agency." }));
    expect(result.flags.some((x) => x.rule_id === "implied_government_endorsement")).toBe(true);
  });

  it("flags urgency / high-pressure language", () => {
    const result = runDeterministicAiReview(input({ transcript: "You need to act now before it's too late." }));
    expect(result.flags.some((x) => x.rule_id === "urgency_high_pressure_language")).toBe(true);
  });

  it("flags plan comparison risk language", () => {
    const result = runDeterministicAiReview(input({ transcript: "Which is better, this or that?" }));
    expect(result.flags.some((x) => x.rule_id === "plan_comparison_risk")).toBe(true);
  });

  it("flags missing SOA when Medicare is discussed without SOA on file", () => {
    const result = runDeterministicAiReview(
      input({ transcript: "Let's review your Medicare options.", hasScopeOfAppointment: false })
    );
    const f = result.flags.find((x) => x.flag_type === "missing_scope_of_appointment");
    expect(f).toBeDefined();
    expect(f?.rule_id).toBe(NON_CATALOG_CHECKS.scope_of_appointment);
  });

  it("produces zero flags on a clean transcript", () => {
    const result = runDeterministicAiReview(
      input({
        transcript: "Thanks for confirming your mailing address. I will send the packet today.",
        hasScopeOfAppointment: true,
        hasSeparateRetirementConsent: true
      })
    );
    expect(result.flags).toHaveLength(0);
  });

  it("reports every occurrence, not just the first", () => {
    const result = runDeterministicAiReview(
      input({ transcript: "guaranteed and guaranteed again", hasScopeOfAppointment: true })
    );
    const guaranteeFlags = result.flags.filter((x) => x.quoted_text.toLowerCase() === "guaranteed");
    expect(guaranteeFlags.length).toBeGreaterThanOrEqual(2);
  });

  it("marks provider deterministic and model local-rules", () => {
    const result = runDeterministicAiReview(input({ transcript: "hello" }));
    expect(result.provider).toBe("deterministic");
    expect(result.model).toBe("local-rules");
  });

  it("every emitted flag maps to a catalog rule or a documented non-catalog check", () => {
    const result = runDeterministicAiReview(
      input({
        transcript:
          "We are a medicare-approved agency. This is the best plan. It is guaranteed. Act now. Which is better? Let's discuss an annuity. Your commission is high.",
        hasScopeOfAppointment: false,
        hasSeparateRetirementConsent: false
      })
    );
    expect(result.flags.length).toBeGreaterThan(0);
    for (const flag of result.flags) {
      const mapped = catalogRuleIds.has(flag.rule_id) || allowedNonCatalog.has(flag.rule_id);
      expect(mapped, `rule_id ${flag.rule_id} must map to a catalog rule or documented check`).toBe(true);
    }
  });
});
