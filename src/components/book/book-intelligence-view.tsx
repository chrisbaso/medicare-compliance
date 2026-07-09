"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterBar, FilterField, Select } from "@/components/ui/filter-bar";
import { retentionAtRisk, ScoredBookEntry } from "@/lib/book-intelligence";
import { OpportunityRuleKey } from "@/lib/verticals/medicare/opportunity-rules";

const RULE_LABELS: Record<OpportunityRuleKey, string> = {
  turning_65_window: "Turning 65",
  enrollment_seasonality: "Enrollment season",
  premium_pressure: "Premium pressure",
  life_event: "Life event",
  consented_retirement_follow_up: "Consented follow-up",
  service_need: "Service need",
  missing_document: "Missing document",
  stale_contact: "Stale contact"
};

function scoreTone(score: number): "danger" | "warning" | "info" | "neutral" {
  if (score >= 80) return "danger";
  if (score >= 60) return "warning";
  if (score >= 40) return "info";
  return "neutral";
}

export function BookIntelligenceView({
  entries,
  source
}: {
  entries: ScoredBookEntry[];
  source: "live" | "demo";
}) {
  const [ruleFilter, setRuleFilter] = useState<"all" | OpportunityRuleKey>("all");

  const withSignals = useMemo(() => entries.filter((entry) => entry.signals.length > 0), [entries]);
  const atRisk = useMemo(() => retentionAtRisk(withSignals), [withSignals]);
  const filtered = useMemo(
    () =>
      ruleFilter === "all"
        ? withSignals
        : withSignals.filter((entry) => entry.signals.some((s) => s.ruleKey === ruleFilter)),
    [withSignals, ruleFilter]
  );

  return (
    <>
      <PageHeader
        title="Book intelligence"
        description="Outreach and retention priorities scored from the book of business. Signals are informational and route to human contact — the platform never recommends plans or products."
      />

      <div className="mb-4">
        <Badge
          value={source === "live" ? "Live book data" : "Demo data (Supabase not configured)"}
          tone={source === "live" ? "success" : "info"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <p className="text-[11px] uppercase tracking-[0.22em] text-stone-500">Clients with signals</p>
          <p className="mt-2 font-serif text-3xl text-ink-950">{withSignals.length}</p>
          <p className="mt-1 text-sm text-stone-600">of {entries.length} scored clients</p>
        </Card>
        <Card>
          <p className="text-[11px] uppercase tracking-[0.22em] text-stone-500">Retention at risk</p>
          <p className="mt-2 font-serif text-3xl text-ink-950">{atRisk.length}</p>
          <p className="mt-1 text-sm text-stone-600">stale or never-contacted clients</p>
        </Card>
        <Card>
          <p className="text-[11px] uppercase tracking-[0.22em] text-stone-500">Top priority</p>
          <p className="mt-2 font-serif text-3xl text-ink-950">
            {withSignals[0] ? `${withSignals[0].client.firstName} ${withSignals[0].client.lastName}` : "—"}
          </p>
          <p className="mt-1 text-sm text-stone-600">
            {withSignals[0]
              ? `score ${withSignals[0].totalScore} · ${RULE_LABELS[withSignals[0].signals[0].ruleKey]}`
              : "no open signals"}
          </p>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader
          eyebrow="Prioritized outreach queue"
          title="Who to contact, and why"
          description="Ranked by combined signal strength. Every next step is a service or education touchpoint — SOA and consent rules still apply before any plan discussion."
        />

        <FilterBar>
          <FilterField label="Signal type">
            <Select
              value={ruleFilter}
              onChange={(event) => setRuleFilter(event.target.value as "all" | OpportunityRuleKey)}
            >
              <option value="all">All signals</option>
              {Object.entries(RULE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </Select>
          </FilterField>
        </FilterBar>

        {filtered.length === 0 ? (
          <EmptyState
            title="No matching signals"
            description={
              entries.length === 0
                ? "No clients in the book yet. Import a book from the Book onboarding page to see prioritized outreach."
                : "No clients currently match this signal filter. That usually means the book is fully current."
            }
          />
        ) : (
          <ul className="mt-4 space-y-4">
            {filtered.map((entry) => (
              <BookEntryRow key={entry.clientId} entry={entry} />
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}

function BookEntryRow({ entry }: { entry: ScoredBookEntry }) {
  return (
    <li className="rounded-2xl border border-stone-200 bg-[#fcfaf5] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href={`/clients/${entry.client.id}`}
            className="font-medium text-ink-950 underline-offset-4 hover:underline"
          >
            {entry.client.firstName} {entry.client.lastName}
          </Link>
          <span className="ml-3 text-sm text-stone-500">{entry.client.state}</span>
        </div>
        <Badge value={`Score ${entry.totalScore}`} tone={scoreTone(entry.totalScore)} />
      </div>
      <ul className="mt-3 space-y-2">
        {entry.signals.map((signal) => (
          <li key={signal.ruleKey} className="flex flex-col gap-1 text-sm lg:flex-row lg:items-baseline lg:gap-3">
            <Badge value={RULE_LABELS[signal.ruleKey]} tone={scoreTone(signal.score)} className="shrink-0" />
            <span className="text-stone-700">{signal.reason}</span>
            <span className="text-stone-500">Next: {signal.nextAction}</span>
          </li>
        ))}
      </ul>
    </li>
  );
}
