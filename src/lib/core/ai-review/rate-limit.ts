import { AppSupabaseClient } from "@/lib/core/repositories/operations-repository";

/**
 * Per-organization daily rate limit for the (paid) AI review endpoint.
 *
 * The core decision logic is expressed against a small store interface so it is
 * unit-testable without a database; a Supabase-backed store is provided for the
 * route. Default limit is 100/day, overridable via AI_REVIEW_DAILY_LIMIT.
 */

export function dailyReviewLimit(): number {
  const raw = process.env.AI_REVIEW_DAILY_LIMIT;
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 100;
}

export interface ReviewCallLogStore {
  /** Number of review calls recorded for this org since the start of the UTC day. */
  countToday(organizationId: string): Promise<number>;
  /** Record a new review call. */
  record(organizationId: string, conversationId: string): Promise<void>;
}

export interface RateLimitDecision {
  allowed: boolean;
  callsToday: number;
  limit: number;
}

/**
 * Checks the org's usage and, when under the limit, records the call.
 * NOTE: count-then-insert has a small race window under high concurrency; a
 * follow-up can move this into a single atomic RPC. Over-counting only ever
 * rejects slightly early, never permits abuse.
 */
export async function checkAndRecordReviewCall(
  store: ReviewCallLogStore,
  organizationId: string,
  conversationId: string,
  limit: number = dailyReviewLimit()
): Promise<RateLimitDecision> {
  const callsToday = await store.countToday(organizationId);
  if (callsToday >= limit) {
    return { allowed: false, callsToday, limit };
  }
  await store.record(organizationId, conversationId);
  return { allowed: true, callsToday: callsToday + 1, limit };
}

function startOfUtcDayIso(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
}

/**
 * Atomic per-org rate check backed by the record_review_call Postgres function
 * (serializes concurrent calls via an advisory lock). Preferred over the
 * store-based checkAndRecordReviewCall for the live route.
 */
export async function recordReviewCallAtomic(
  supabase: AppSupabaseClient,
  organizationId: string,
  conversationId: string,
  limit: number = dailyReviewLimit()
): Promise<RateLimitDecision> {
  const { data, error } = await supabase.rpc("record_review_call", {
    p_organization_id: organizationId,
    p_conversation_id: conversationId,
    p_limit: limit
  });
  if (error) throw new Error(error.message);
  const row = Array.isArray(data) ? data[0] : data;
  return {
    allowed: Boolean(row?.allowed),
    callsToday: row?.calls_today ?? 0,
    limit
  };
}

export function supabaseReviewCallLogStore(supabase: AppSupabaseClient): ReviewCallLogStore {
  return {
    async countToday(organizationId: string) {
      const { count, error } = await supabase
        .from("review_call_log")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .gte("called_at", startOfUtcDayIso());
      if (error) throw new Error(error.message);
      return count ?? 0;
    },
    async record(organizationId: string, conversationId: string) {
      const { error } = await supabase
        .from("review_call_log")
        .insert({ organization_id: organizationId, conversation_id: conversationId });
      if (error) throw new Error(error.message);
    }
  };
}
