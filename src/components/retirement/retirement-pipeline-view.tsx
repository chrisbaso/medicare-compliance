"use client";

import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  RetirementFunnel,
  RetirementFunnelEntry,
  RetirementFunnelStage,
  RetirementSignalKind
} from "@/lib/verticals/medicare/retirement-funnel";
import {
  formatUsd,
  RetirementOutcomeSummary
} from "@/lib/verticals/medicare/retirement-outcomes";

const STAGE_META: Record<
  RetirementFunnelStage,
  { title: string; description: string; tone: "info" | "warning" | "success" }
> = {
  signal_on_file: {
    title: "Signal on file — no outreach yet",
    description:
      "A retirement-adjacent signal exists, but no consent. These clients are NOT contactable about retirement products. The play: on the next legitimate touchpoint, if the client raises it, offer a separate conversation and capture consent.",
    tone: "warning"
  },
  consent_captured: {
    title: "Consent captured — ready for licensed handoff",
    description:
      "A separate retirement-income consent is granted and evidenced. Assign a licensed owner and schedule the separate conversation.",
    tone: "info"
  },
  in_licensed_workflow: {
    title: "In the licensed workflow",
    description: "Being handled in the separate consented workflow, outside all Medicare interactions.",
    tone: "success"
  }
};

const SIGNAL_LABELS: Record<RetirementSignalKind, string> = {
  retirement_income_language: "Retirement income mention",
  cd_maturing: "CD maturing",
  spouse_loss: "Spouse loss",
  market_risk_concern: "Market risk concern"
};

export function RetirementPipelineView({
  funnel,
  outcomes,
  source
}: {
  funnel: RetirementFunnel;
  outcomes: RetirementOutcomeSummary;
  source: "live" | "demo";
}) {
  const stages: RetirementFunnelStage[] = [
    "signal_on_file",
    "consent_captured",
    "in_licensed_workflow"
  ];

  return (
    <>
      <PageHeader
        title="Retirement pipeline"
        description="The compliant path from a retirement-adjacent signal to a licensed, consented follow-up. Nothing here authorizes product outreach — consent gates every step, and every consent is evidenced in the append-only ledger."
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <Badge
          value={source === "live" ? "Live book data" : "Demo data (Supabase not configured)"}
          tone={source === "live" ? "success" : "info"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {stages.map((stage) => (
          <Card key={stage}>
            <p className="text-[11px] uppercase tracking-[0.22em] text-stone-500">
              {STAGE_META[stage].title}
            </p>
            <p className="mt-2 font-serif text-3xl text-ink-950">{funnel.counts[stage]}</p>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader
          eyebrow="Outcome economics"
          title="What the pipeline has produced"
          description="Recorded on the licensed workflow when a follow-up concludes. Every dollar below traces back to a documented, separate consent."
        />
        <div className="grid gap-4 lg:grid-cols-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-stone-500">Placements</p>
            <p className="mt-2 font-serif text-3xl text-ink-950">{outcomes.placed}</p>
            <p className="mt-1 text-sm text-stone-600">of {outcomes.totalOpportunities} consented opportunities</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-stone-500">Premium written</p>
            <p className="mt-2 font-serif text-3xl text-ink-950">{formatUsd(outcomes.premiumWritten)}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-stone-500">Commission earned</p>
            <p className="mt-2 font-serif text-3xl text-ink-950">{formatUsd(outcomes.commissionEarned)}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-stone-500">Placement rate</p>
            <p className="mt-2 font-serif text-3xl text-ink-950">{outcomes.placementRatePercent}%</p>
            <p className="mt-1 text-sm text-stone-600">{outcomes.stillOpen} still open</p>
          </div>
        </div>
      </Card>

      <Card className="mt-6 border-amber-200 bg-amber-50/60">
        <p className="text-sm text-stone-700">
          <span className="font-semibold">The compliance rule this page enforces:</span>{" "}
          retirement and annuity topics stay out of Medicare conversations. A signal is a
          reason to be ready — never a reason to reach out. Consent must be explicit,
          separate, and documented before any licensed follow-up happens.
        </p>
      </Card>

      {stages.map((stage) => {
        const entries = funnel.entries.filter((entry) => entry.stage === stage);
        return (
          <Card className="mt-6" key={stage}>
            <CardHeader
              eyebrow={`${entries.length} client(s)`}
              title={STAGE_META[stage].title}
              description={STAGE_META[stage].description}
            />
            {entries.length === 0 ? (
              <EmptyState
                title="No clients at this stage"
                description={
                  stage === "signal_on_file"
                    ? "No un-consented retirement signals in the book right now."
                    : stage === "consent_captured"
                      ? "No consented clients are waiting for a licensed owner."
                      : "Nothing is currently in the licensed workflow."
                }
              />
            ) : (
              <ul className="space-y-3">
                {entries.map((entry) => (
                  <PipelineRow key={entry.client.id} entry={entry} />
                ))}
              </ul>
            )}
          </Card>
        );
      })}
    </>
  );
}

function PipelineRow({ entry }: { entry: RetirementFunnelEntry }) {
  const tone = STAGE_META[entry.stage].tone;
  return (
    <li className="rounded-2xl border border-stone-200 bg-[#fcfaf5] p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={`/clients/${entry.client.id}`}
          className="font-medium text-ink-950 underline-offset-4 hover:underline"
        >
          {entry.client.firstName} {entry.client.lastName}
        </Link>
        <span className="text-sm text-stone-500">{entry.client.state}</span>
        {entry.signals.map((signal) => (
          <Badge key={signal} value={SIGNAL_LABELS[signal]} tone={tone} />
        ))}
        {entry.workflowStatus ? (
          <Badge value={entry.workflowStatus.replace(/_/g, " ")} tone="success" />
        ) : null}
      </div>
      <p className="mt-2 text-sm text-stone-600">Next: {entry.nextStep}</p>
    </li>
  );
}
