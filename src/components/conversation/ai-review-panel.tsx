"use client";

import { useState } from "react";
import { AiReviewFlag, AiReviewResult } from "@/lib/core/ai-review/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { SeverityBadge } from "@/components/ui/severity-badge";
import { FlagDecisionPanel } from "@/components/conversation/flag-decision-panel";

interface AiReviewResponse extends AiReviewResult {
  persisted?: boolean;
  persistedFlagCount?: number;
  persistenceReason?: string;
  correlationId?: string;
  error?: string;
}

export function AiReviewPanel({
  conversationId,
  transcriptText,
  initialFlags
}: {
  conversationId: string;
  transcriptText: string;
  initialFlags: AiReviewFlag[];
}) {
  const [reviewResult, setReviewResult] = useState<AiReviewResponse | null>(
    initialFlags.length
      ? {
          flags: initialFlags,
          provider: "mock",
          model: "stored-results",
          promptVersion: "stored-results",
          persisted: true,
          persistedFlagCount: initialFlags.length
        }
      : null
  );
  const [isReviewing, setIsReviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runReview() {
    setIsReviewing(true);
    setError(null);

    try {
      const response = await fetch(`/api/conversations/${conversationId}/review`, {
        method: "POST",
        headers: {
          accept: "application/json"
        }
      });
      const payload = await response.json() as AiReviewResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? "AI review failed.");
      }

      setReviewResult(payload);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "AI review failed.");
    } finally {
      setIsReviewing(false);
    }
  }

  const flags = reviewResult?.flags ?? [];

  return (
    <Card>
      <CardHeader
        eyebrow="AI compliance review"
        title="Server-side review"
        description="The review route reads transcript and consent state from Supabase under RLS, then persists only non-deterministic model results."
        actions={
          <Badge
            value={reviewResult?.persisted ? "Persisted" : "Preview"}
            tone={reviewResult?.persisted ? "success" : "neutral"}
            className="normal-case"
          />
        }
      />

      <div className="space-y-4">
        <div className="rounded-2xl border border-stone-200 bg-[#fcfaf5] p-4 text-sm leading-7 text-stone-700">
          {highlightTranscript(transcriptText, flags)}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={runReview} disabled={isReviewing || transcriptText.trim().length === 0}>
            {isReviewing ? "Reviewing..." : "Run AI review"}
          </Button>
          {reviewResult ? (
            <>
              <Badge value={`${flags.length} flags`} tone={flags.length > 0 ? "warning" : "success"} className="normal-case" />
              <Badge value={reviewResult.model} tone="info" className="normal-case" />
            </>
          ) : null}
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-900">
            {error}
          </div>
        ) : null}

        {reviewResult?.persistenceReason ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
            {reviewResult.persistenceReason}
          </div>
        ) : null}

        {flags.length > 0 ? (
          <div className="space-y-3">
            {flags.map((flag, index) => (
              <article key={`${flag.rule_id}-${flag.transcript_offset_start}-${index}`} className="rounded-2xl border border-stone-200 bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-ink-950">{flag.flag_type.replaceAll("_", " ")}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-stone-500">{flag.rule_id}</p>
                  </div>
                  <SeverityBadge value={flag.severity} />
                </div>
                <blockquote className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
                  {flag.quoted_text}
                </blockquote>
                <p className="mt-3 text-sm leading-6 text-stone-700">{flag.reasoning}</p>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  <strong className="text-ink-950">Suggested remediation:</strong> {flag.suggested_remediation}
                </p>
                <FlagDecisionPanel flagId={`${flag.rule_id}-${flag.transcript_offset_start}-${index}`} />
              </article>
            ))}
          </div>
        ) : reviewResult ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
            No AI flags found. A human reviewer should still verify the conversation before closing the workflow.
          </div>
        ) : null}
      </div>
    </Card>
  );
}

function highlightTranscript(text: string, flags: AiReviewFlag[]) {
  if (flags.length === 0) {
    return text || "No transcript messages are stored for this conversation.";
  }

  const sortedFlags = flags
    .filter((flag) => flag.transcript_offset_end > flag.transcript_offset_start)
    .sort((left, right) => left.transcript_offset_start - right.transcript_offset_start);
  const segments: React.ReactNode[] = [];
  let cursor = 0;

  sortedFlags.forEach((flag, index) => {
    const start = Math.max(0, Math.min(flag.transcript_offset_start, text.length));
    const end = Math.max(start, Math.min(flag.transcript_offset_end, text.length));

    if (start > cursor) {
      segments.push(<span key={`plain-${index}`}>{text.slice(cursor, start)}</span>);
    }

    segments.push(
      <mark key={`flag-${index}`} className="rounded bg-rose-100 px-1 text-rose-950">
        {text.slice(start, end)}
      </mark>
    );
    cursor = end;
  });

  if (cursor < text.length) {
    segments.push(<span key="plain-tail">{text.slice(cursor)}</span>);
  }

  return segments;
}
