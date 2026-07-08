import { describe, it, expect, afterEach } from "vitest";
import { checkAndRecordReviewCall, dailyReviewLimit, ReviewCallLogStore } from "./rate-limit";

function fakeStore(initialCounts: Record<string, number> = {}): ReviewCallLogStore & { counts: Record<string, number> } {
  const counts = { ...initialCounts };
  return {
    counts,
    async countToday(orgId) {
      return counts[orgId] ?? 0;
    },
    async record(orgId) {
      counts[orgId] = (counts[orgId] ?? 0) + 1;
    }
  };
}

afterEach(() => {
  delete process.env.AI_REVIEW_DAILY_LIMIT;
});

describe("dailyReviewLimit", () => {
  it("defaults to 100", () => {
    expect(dailyReviewLimit()).toBe(100);
  });

  it("honors AI_REVIEW_DAILY_LIMIT override", () => {
    process.env.AI_REVIEW_DAILY_LIMIT = "5";
    expect(dailyReviewLimit()).toBe(5);
  });

  it("ignores invalid overrides", () => {
    process.env.AI_REVIEW_DAILY_LIMIT = "-3";
    expect(dailyReviewLimit()).toBe(100);
  });
});

describe("checkAndRecordReviewCall", () => {
  it("allows and records when under the limit", async () => {
    const store = fakeStore();
    const decision = await checkAndRecordReviewCall(store, "orgA", "c1", 3);
    expect(decision.allowed).toBe(true);
    expect(decision.callsToday).toBe(1);
    expect(store.counts.orgA).toBe(1);
  });

  it("rejects once the limit is reached and does not record", async () => {
    const store = fakeStore({ orgA: 3 });
    const decision = await checkAndRecordReviewCall(store, "orgA", "c1", 3);
    expect(decision.allowed).toBe(false);
    expect(store.counts.orgA).toBe(3); // unchanged
  });

  it("isolates orgs from each other", async () => {
    const store = fakeStore({ orgA: 3 });
    const decision = await checkAndRecordReviewCall(store, "orgB", "c1", 3);
    expect(decision.allowed).toBe(true);
    expect(store.counts.orgB).toBe(1);
    expect(store.counts.orgA).toBe(3);
  });
});
