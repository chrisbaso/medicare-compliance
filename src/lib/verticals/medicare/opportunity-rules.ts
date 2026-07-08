import {
  premiumIncreaseKeywords,
  retirementIncomeKeywords,
  annuityKeywords,
  cdKeywords,
  spouseLossKeywords,
  serviceKeywords,
  missingDocumentKeywords,
  includesAny
} from "@/lib/compliance/rules";
import { getCurrentMedicareSeason } from "@/lib/verticals/medicare/seasonality";

/**
 * Opportunity & retention scoring engine (Medicare vertical).
 *
 * Scores each client for OUTREACH/SERVICE priority — never product choice.
 * Every rule returns a plain-English reason and a next action that is a human
 * contact or operational step. HARD CONSTRAINT (compliance): no rule may emit
 * a plan, annuity, or product recommendation, and the retirement-income rule
 * is suppressed entirely unless a separate granted consent exists.
 *
 * All rules are pure functions of (client snapshot, referenceDate) so scoring
 * is deterministic and unit-testable.
 */

export type OpportunityRuleKey =
  | "turning_65_window"
  | "enrollment_seasonality"
  | "premium_pressure"
  | "life_event"
  | "consented_retirement_follow_up"
  | "service_need"
  | "missing_document"
  | "stale_contact";

export interface ClientScoringSnapshot {
  clientId: string;
  dob?: string | null; // ISO yyyy-mm-dd
  status: string;
  tags: string[];
  note?: string | null;
  /** Most recent conversation start, ISO timestamp; null when never contacted. */
  lastConversationAt?: string | null;
  /** True only when a granted, evidence-complete separate retirement consent exists. */
  hasSeparateRetirementConsent: boolean;
}

export interface OpportunitySignal {
  ruleKey: OpportunityRuleKey;
  score: number; // 0-100 per rule
  reason: string;
  nextAction: string; // outreach/service step — never a product recommendation
}

export interface ClientOpportunityScore {
  clientId: string;
  totalScore: number;
  signals: OpportunitySignal[];
}

const STALE_CONTACT_DAYS = 120;

function freeText(snapshot: ClientScoringSnapshot): string {
  return [snapshot.note ?? "", ...snapshot.tags].join(" ").toLowerCase();
}

function monthsUntil65(dob: string, reference: Date): number | null {
  const m = dob.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const birthday65 = new Date(Date.UTC(Number(m[1]) + 65, Number(m[2]) - 1, Number(m[3])));
  const msPerMonth = 1000 * 60 * 60 * 24 * 30.44;
  return (birthday65.getTime() - reference.getTime()) / msPerMonth;
}

type Rule = (snapshot: ClientScoringSnapshot, reference: Date) => OpportunitySignal | null;

const rules: Record<OpportunityRuleKey, Rule> = {
  // 1. IEP window: 65th birthday within -1..+6 months (IEP spans 3 before / 3 after).
  turning_65_window: (s, ref) => {
    if (!s.dob) return null;
    const months = monthsUntil65(s.dob, ref);
    if (months === null || months < -1 || months > 6) return null;
    const imminent = months <= 3;
    return {
      ruleKey: "turning_65_window",
      score: imminent ? 90 : 70,
      reason: imminent
        ? "Client's Initial Enrollment Period is open or opening within three months."
        : "Client turns 65 within six months; IEP planning window is approaching.",
      nextAction: "Schedule a turning-65 education call and confirm SOA before any plan discussion."
    };
  },

  // 2. Named enrollment season raises review-outreach priority for active clients.
  enrollment_seasonality: (s, ref) => {
    const season = getCurrentMedicareSeason(ref);
    if (season.code !== "aep" && season.code !== "oep") return null;
    return {
      ruleKey: "enrollment_seasonality",
      score: season.code === "aep" ? 60 : 40,
      reason: `${season.label} is active; clients expect an annual review touchpoint.`,
      nextAction: "Offer an educational annual review appointment (SOA required)."
    };
  },

  // 3. Premium/affordability pressure — churn risk for the renewal book.
  premium_pressure: (s) => {
    if (!includesAny(freeText(s), premiumIncreaseKeywords)) return null;
    return {
      ruleKey: "premium_pressure",
      score: 75,
      reason: "Premium-increase or affordability concern is recorded for this client.",
      nextAction: "Prioritize a service call to review the concern and document options neutrally."
    };
  },

  // 4. Life events that commonly change coverage needs.
  life_event: (s) => {
    const text = freeText(s);
    const spouse = includesAny(text, spouseLossKeywords);
    const cd = includesAny(text, cdKeywords);
    if (!spouse && !cd) return null;
    return {
      ruleKey: "life_event",
      score: spouse ? 80 : 55,
      reason: spouse
        ? "A spouse-loss life event is recorded; coverage and household needs may have changed."
        : "A maturing CD or similar financial life event is recorded.",
      nextAction: spouse
        ? "Schedule a sensitive service check-in and review documentation needs."
        : "Log for a licensed-human follow-up ONLY if a separate consented workflow exists."
    };
  },

  // 5. Retirement-income follow-up — SUPPRESSED without separate granted consent.
  consented_retirement_follow_up: (s) => {
    if (!s.hasSeparateRetirementConsent) return null; // hard compliance gate
    const interested = includesAny(freeText(s), [...retirementIncomeKeywords, ...annuityKeywords]);
    if (!interested) return null;
    return {
      ruleKey: "consented_retirement_follow_up",
      score: 65,
      reason: "Client granted separate retirement-income consent and has a recorded interest signal.",
      nextAction: "Route to the separate consented workflow owned by a licensed human."
    };
  },

  // 6. Open service needs.
  service_need: (s) => {
    if (!includesAny(freeText(s), serviceKeywords)) return null;
    return {
      ruleKey: "service_need",
      score: 50,
      reason: "An unresolved service topic (billing, claims, address, documents) is recorded.",
      nextAction: "Assign a service task and confirm resolution with the client."
    };
  },

  // 7. Missing documentation blocks compliance-clean operations.
  missing_document: (s) => {
    if (!includesAny(freeText(s), missingDocumentKeywords)) return null;
    return {
      ruleKey: "missing_document",
      score: 70,
      reason: "A missing document or signature item is recorded for this client.",
      nextAction: "Send the document request and track completion as a task."
    };
  },

  // 8. Retention risk: valuable book contact gone quiet.
  stale_contact: (s, ref) => {
    if (!s.lastConversationAt) {
      return {
        ruleKey: "stale_contact",
        score: 65,
        reason: "No conversation on record for this client.",
        nextAction: "Schedule an introductory service check-in call."
      };
    }
    const last = Date.parse(s.lastConversationAt);
    if (Number.isNaN(last)) return null;
    const days = (ref.getTime() - last) / (1000 * 60 * 60 * 24);
    if (days < STALE_CONTACT_DAYS) return null;
    return {
      ruleKey: "stale_contact",
      score: Math.min(85, 40 + Math.floor(days / 30) * 5),
      reason: `No contact in ${Math.floor(days)} days; retention risk for the renewal book.`,
      nextAction: "Schedule a service check-in call before the next enrollment window."
    };
  }
};

export const opportunityRuleKeys = Object.keys(rules) as OpportunityRuleKey[];

export function scoreClient(
  snapshot: ClientScoringSnapshot,
  referenceDate: Date
): ClientOpportunityScore {
  const signals = opportunityRuleKeys
    .map((key) => rules[key](snapshot, referenceDate))
    .filter((s): s is OpportunitySignal => s !== null)
    .sort((a, b) => b.score - a.score);

  // Total: top signal at full weight, then diminishing so breadth matters
  // without letting many weak signals outrank one urgent one.
  const totalScore = Math.min(
    100,
    Math.round(signals.reduce((sum, s, i) => sum + s.score * Math.pow(0.5, i), 0))
  );

  return { clientId: snapshot.clientId, totalScore, signals };
}

export function scoreBook(
  snapshots: ClientScoringSnapshot[],
  referenceDate: Date
): ClientOpportunityScore[] {
  return snapshots
    .map((s) => scoreClient(s, referenceDate))
    .sort((a, b) => b.totalScore - a.totalScore);
}
