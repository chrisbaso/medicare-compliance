import { notFound } from "next/navigation";
import { AiReviewPanel } from "@/components/conversation/ai-review-panel";
import { DemoConversationDetail } from "@/components/conversation/demo-conversation-detail";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { createServerClient } from "@/lib/core/supabase/server";
import { formatDateTime } from "@/lib/format";
import { AiReviewFlag } from "@/lib/core/ai-review/types";

interface ConversationPageProps {
  params: Promise<{ id: string }>;
}

export default async function ConversationDetailPage({ params }: ConversationPageProps) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { data: conversation, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!conversation) {
    if (id.startsWith("conv-")) {
      return <DemoConversationDetail conversationId={id} />;
    }

    notFound();
  }

  const [{ data: client }, { data: messages }, { data: flags }, { data: consents }] =
    await Promise.all([
      supabase.from("clients").select("*").eq("id", conversation.client_id).maybeSingle(),
      supabase
        .from("conversation_messages")
        .select("*")
        .eq("conversation_id", conversation.id)
        .order("sequence_number", { ascending: true }),
      supabase
        .from("compliance_flags")
        .select("*")
        .eq("conversation_id", conversation.id)
        .order("flagged_at", { ascending: false }),
      supabase
        .from("consents")
        .select("*")
        .eq("conversation_id", conversation.id)
        .order("captured_at", { ascending: false })
    ]);
  const transcriptText = (messages ?? [])
    .map((message) => `${message.speaker_name}: ${message.utterance}`)
    .join("\n");
  const initialFlags: AiReviewFlag[] = (flags ?? []).map((flag) => ({
    flag_type: flag.flag_type as AiReviewFlag["flag_type"],
    severity: flag.severity,
    rule_id: flag.rule_id,
    transcript_offset_start: flag.transcript_offset_start ?? 0,
    transcript_offset_end: flag.transcript_offset_end ?? 0,
    quoted_text: flag.quoted_text ?? "",
    reasoning: flag.reasoning,
    suggested_remediation: flag.suggested_remediation
  }));
  const hasSoa = (consents ?? []).some(
    (consent) =>
      consent.consent_type === "soa" &&
      consent.status === "granted" &&
      consent.evidence_complete
  );
  const hasSeparateConsent = (consents ?? []).some(
    (consent) =>
      consent.consent_type === "retirement_follow_up" &&
      consent.status === "granted" &&
      consent.evidence_complete
  );

  return (
    <>
      <PageHeader
        title={client ? `${client.first_name} ${client.last_name}` : `Conversation ${conversation.id}`}
        description="Supabase-backed conversation review. The AI review action reads transcript and consent evidence server-side before writing flags and audit rows."
        actions={
          <>
            <ButtonLink href="/conversations" variant="secondary">
              Back to inbox
            </ButtonLink>
            {client ? (
              <ButtonLink href={`/clients/${client.id}`} variant="ghost">
                Open client
              </ButtonLink>
            ) : null}
          </>
        }
      />

      <Card>
        <CardHeader
          eyebrow="Supabase record"
          title={conversation.summary ?? conversation.medicare_scope}
          description={conversation.next_step ?? "No next step recorded."}
          actions={<Badge value={conversation.status} tone="info" />}
        />
        <div className="grid gap-4 md:grid-cols-3">
          <Fact label="Started" value={formatDateTime(conversation.started_at)} />
          <Fact label="Medicare scope" value={conversation.medicare_scope} />
          <Fact label="Routing state" value={conversation.routing_state.replaceAll("_", " ")} />
          <Fact label="SOA evidence" value={hasSoa ? "Complete" : "Missing or incomplete"} />
          <Fact label="Separate consent" value={hasSeparateConsent ? "Granted" : "Missing or incomplete"} />
          <Fact label="Stored flags" value={String(flags?.length ?? 0)} />
        </div>
      </Card>

      <AiReviewPanel
        conversationId={conversation.id}
        transcriptText={transcriptText}
        initialFlags={initialFlags}
      />
    </>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-[#fcfaf5] p-4">
      <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">{label}</p>
      <p className="mt-2 text-sm font-medium text-ink-950">{value}</p>
    </div>
  );
}
