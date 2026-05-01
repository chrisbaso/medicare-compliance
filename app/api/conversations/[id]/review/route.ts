import { NextResponse } from "next/server";
import { runDeterministicAiReview } from "@/lib/core/ai-review/deterministic-review";
import { runAiComplianceReview } from "@/lib/core/ai-review/review-service";
import { AiReviewInput, AiReviewResult } from "@/lib/core/ai-review/types";
import { requireAnthropicEnv } from "@/lib/core/env/server";
import { getCurrentUser } from "@/lib/core/auth/session";
import { createAnthropicProvider } from "@/lib/core/llm/anthropic";
import { createServerClient } from "@/lib/core/supabase/server";
import { Json } from "../../../../../supabase/types";

interface ReviewRouteContext {
  params: Promise<{ id: string }>;
}

function isModelOutputValidationError(error: unknown) {
  if (error instanceof SyntaxError) {
    return true;
  }

  return (
    error instanceof Error &&
    (error.message.startsWith("AI review output") ||
      error.message.startsWith("Each AI review flag") ||
      error.message.startsWith("Unsupported AI review") ||
      error.message.includes("offset cannot be before"))
  );
}

function firstRole(roles: string[]) {
  return roles[0] ?? null;
}

function consentSnapshot(input: {
  hasScopeOfAppointment: boolean;
  hasSeparateRetirementConsent: boolean;
}) {
  if (!input.hasScopeOfAppointment) {
    return "missing_scope_of_appointment";
  }

  if (!input.hasSeparateRetirementConsent) {
    return "separate_retirement_consent_missing_or_incomplete";
  }

  return "complete";
}

async function writeValidationFailureAudit(input: {
  conversationId: string;
  organizationId: string;
  userId: string;
  actorRole: string | null;
  correlationId: string;
  error: Error;
}) {
  const supabase = await createServerClient();
  const { error } = await supabase.from("audit_logs").insert({
    organization_id: input.organizationId,
    entity_type: "conversation",
    entity_id: input.conversationId,
    action: "model_output_validation_failed",
    actor_user_id: input.userId,
    actor_role: input.actorRole,
    source: "ai_review_api",
    correlation_id: input.correlationId,
    before_state: null,
    after_state: { error: input.error.message },
    consent_status_snapshot: null,
    next_action: "Retry AI review or inspect raw model output before persisting flags.",
    detail: "Anthropic returned output that failed structured AI review validation.",
    metadata: {}
  });

  if (error) {
    throw new Error(error.message);
  }
}

function hasAnthropicKey() {
  try {
    requireAnthropicEnv();
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes("Anthropic is not configured")) {
      return false;
    }

    throw error;
  }
}

export async function POST(_request: Request, context: ReviewRouteContext) {
  const { id } = await context.params;
  const correlationId = crypto.randomUUID();
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const supabase = await createServerClient();
  const { data: conversation, error: conversationError } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (conversationError) {
    throw new Error(conversationError.message);
  }

  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  }

  const [{ data: messages, error: messageError }, { data: consents, error: consentError }] =
    await Promise.all([
      supabase
        .from("conversation_messages")
        .select("*")
        .eq("conversation_id", conversation.id)
        .order("sequence_number", { ascending: true }),
      supabase
        .from("consents")
        .select("*")
        .eq("conversation_id", conversation.id)
    ]);

  if (messageError) {
    throw new Error(messageError.message);
  }

  if (consentError) {
    throw new Error(consentError.message);
  }

  const transcript = (messages ?? [])
    .map((message) => `${message.speaker_name}: ${message.utterance}`)
    .join("\n");
  const hasScopeOfAppointment = (consents ?? []).some(
    (record) =>
      record.consent_type === "soa" &&
      record.status === "granted" &&
      record.evidence_complete
  );
  const hasSeparateRetirementConsent = (consents ?? []).some(
    (record) =>
      record.consent_type === "retirement_follow_up" &&
      record.status === "granted" &&
      record.evidence_complete
  );
  const reviewInput: AiReviewInput = {
    verticalSlug: "medicare",
    conversationId: conversation.id,
    transcript,
    hasScopeOfAppointment,
    hasSeparateRetirementConsent
  };
  const snapshot = consentSnapshot({ hasScopeOfAppointment, hasSeparateRetirementConsent });
  let reviewResult: AiReviewResult;

  if (hasAnthropicKey()) {
    try {
      reviewResult = await runAiComplianceReview(reviewInput, {
        provider: createAnthropicProvider(),
        model: "claude-sonnet-4-20250514"
      });
    } catch (error) {
      if (isModelOutputValidationError(error)) {
        await writeValidationFailureAudit({
          conversationId: conversation.id,
          organizationId: conversation.organization_id,
          userId: currentUser.id,
          actorRole: firstRole(currentUser.roles),
          correlationId,
          error: error instanceof Error ? error : new Error("Unknown model output validation error.")
        });

        return NextResponse.json(
          { error: "AI review output failed validation." },
          { status: 502 }
        );
      }

      throw error;
    }
  } else {
    reviewResult = runDeterministicAiReview(reviewInput);
  }

  if (reviewResult.provider === "deterministic") {
    return NextResponse.json({
      ...reviewResult,
      persisted: false,
      persistenceReason: "Deterministic local review results are preview-only and are not written to audit-bearing tables."
    });
  }

  const flagsPayload: Json = reviewResult.flags.map((flag) => ({
    flag_type: flag.flag_type,
    severity: flag.severity,
    rule_id: flag.rule_id,
    transcript_offset_start: flag.transcript_offset_start,
    transcript_offset_end: flag.transcript_offset_end,
    quoted_text: flag.quoted_text,
    reasoning: flag.reasoning,
    suggested_remediation: flag.suggested_remediation
  }));

  const { data: insertedFlags, error: rpcError } = await supabase.rpc("insert_review_results", {
    p_conversation_id: conversation.id,
    p_actor_user_id: currentUser.id,
    p_actor_role: firstRole(currentUser.roles),
    p_provider: reviewResult.provider,
    p_model: reviewResult.model,
    p_prompt_version: reviewResult.promptVersion,
    p_flags: flagsPayload,
    p_consent_status_snapshot: snapshot,
    p_correlation_id: correlationId
  });

  if (rpcError) {
    throw new Error(rpcError.message);
  }

  return NextResponse.json({
    ...reviewResult,
    persisted: true,
    persistedFlagCount: insertedFlags?.length ?? 0,
    correlationId
  });
}
