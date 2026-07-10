import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/core/auth/session";
import { createServerClient } from "@/lib/core/supabase/server";

/**
 * Record the placement outcome of a licensed retirement follow-up.
 *
 * POST body: { outcome: "placed" | "declined" | "closed" | "pending",
 *              premiumWritten?, commissionAmount?, note? }
 *
 * Authorization is enforced by RLS: retirement_opportunities writes are
 * restricted to admin/manager roles — other roles' updates affect zero rows
 * and return 404 here. Every recorded outcome writes an audit-log entry.
 */

const OUTCOMES = new Set(["placed", "declined", "closed", "pending"]);

interface OutcomeRouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: OutcomeRouteContext) {
  const { id } = await context.params;
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  let body: {
    outcome?: string;
    premiumWritten?: number;
    commissionAmount?: number;
    note?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be JSON." }, { status: 400 });
  }

  if (!body.outcome || !OUTCOMES.has(body.outcome)) {
    return NextResponse.json(
      { error: "outcome must be one of: placed, declined, closed, pending." },
      { status: 400 }
    );
  }
  for (const [field, value] of [
    ["premiumWritten", body.premiumWritten],
    ["commissionAmount", body.commissionAmount]
  ] as const) {
    if (value !== undefined && (typeof value !== "number" || !Number.isFinite(value) || value < 0)) {
      return NextResponse.json({ error: `${field} must be a non-negative number.` }, { status: 400 });
    }
  }

  const supabase = await createServerClient();
  const { data: updated, error } = await supabase
    .from("retirement_opportunities")
    .update({
      outcome: body.outcome,
      premium_written: body.premiumWritten ?? null,
      commission_amount: body.commissionAmount ?? null,
      outcome_recorded_at: new Date().toISOString(),
      outcome_note: body.note ?? null,
      last_updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select("id, organization_id, client_id, outcome")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!updated) {
    // Not found, or the caller's role lacks write access under RLS.
    return NextResponse.json(
      { error: "Opportunity not found or you do not have permission to record outcomes." },
      { status: 404 }
    );
  }

  const { error: auditError } = await supabase.from("audit_logs").insert({
    organization_id: updated.organization_id,
    entity_type: "follow_up_opportunity",
    entity_id: updated.id,
    action: "outcome_recorded",
    actor_user_id: currentUser.id,
    actor_role: currentUser.roles[0] ?? null,
    source: "api",
    correlation_id: crypto.randomUUID(),
    before_state: null,
    after_state: {
      outcome: body.outcome,
      premium_written: body.premiumWritten ?? null,
      commission_amount: body.commissionAmount ?? null
    },
    consent_status_snapshot: null,
    next_action: null,
    detail: `Retirement follow-up outcome recorded: ${body.outcome}.`,
    metadata: {}
  });
  if (auditError) {
    throw new Error(auditError.message);
  }

  return NextResponse.json({ id: updated.id, outcome: updated.outcome, recorded: true });
}
