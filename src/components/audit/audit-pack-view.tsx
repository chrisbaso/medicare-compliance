"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { buildAuditPack, FLAG_TYPE_LABELS } from "@/lib/audit-pack";
import { formatDateTime } from "@/lib/format";
import {
  AuditEvent,
  Client,
  ComplianceFlag,
  ConsentRecord,
  Conversation
} from "@/lib/types";

/**
 * Audit-prep pack: one click assembles an examiner-ready summary of the
 * agency's own records for a date range — consent coverage, flag
 * dispositions, separation integrity, and a self-identified gap list.
 * Print-ready via the browser's print dialog.
 */

const RANGE_PRESETS = [
  { key: "ytd", label: "Year to date", start: () => `${new Date().getFullYear()}-01-01T00:00:00Z` },
  {
    key: "quarter",
    label: "Last 90 days",
    start: () => new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString()
  },
  { key: "all", label: "All records", start: () => "2000-01-01T00:00:00Z" }
] as const;

function severityTone(sev: string): "danger" | "warning" | "info" | "neutral" {
  if (sev === "critical" || sev === "high") return "danger";
  if (sev === "medium") return "warning";
  return "neutral";
}

export interface AuditPackData {
  clients: Client[];
  conversations: Conversation[];
  flags: ComplianceFlag[];
  consents: ConsentRecord[];
  auditEvents: AuditEvent[];
}

export function AuditPackView({ data, source }: { data: AuditPackData; source: "live" | "demo" }) {
  const [preset, setPreset] = useState<(typeof RANGE_PRESETS)[number]["key"]>("all");

  const pack = useMemo(() => {
    const chosen = RANGE_PRESETS.find((p) => p.key === preset)!;
    return buildAuditPack({
      ...data,
      rangeStart: chosen.start(),
      rangeEnd: new Date().toISOString()
    });
  }, [data, preset]);

  return (
    <>
      <PageHeader
        title="Audit-prep pack"
        description="An examiner-ready summary of this agency's own compliance records. Informational only — it reports what is documented; it is not legal or compliance advice."
      />

      <div className="mb-4">
        <Badge
          value={source === "live" ? "Live records" : "Demo data (Supabase not configured)"}
          tone={source === "live" ? "success" : "info"}
        />
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3 print:hidden">
        {RANGE_PRESETS.map((p) => (
          <Button
            key={p.key}
            variant={preset === p.key ? "primary" : "secondary"}
            onClick={() => setPreset(p.key)}
          >
            {p.label}
          </Button>
        ))}
        <Button variant="ghost" onClick={() => window.print()}>
          Print / save as PDF
        </Button>
      </div>

      <Card>
        <CardHeader
          eyebrow="Coverage"
          title="Record coverage in range"
          description={`Range: ${pack.range.start.slice(0, 10)} through ${pack.range.end.slice(0, 10)}.`}
        />
        <div className="grid gap-4 lg:grid-cols-4">
          <Stat label="Conversations" value={String(pack.generated.conversationCount)} />
          <Stat label="Audit events" value={String(pack.generated.auditEventCount)} />
          <Stat
            label="SOA coverage"
            value={`${pack.consentCoverage.soaCoveragePercent}%`}
            sub={`${pack.consentCoverage.conversationsWithSoa} conversations with completed SOA`}
          />
          <Stat
            label="Flag resolution"
            value={`${pack.flagSummary.resolutionRatePercent}%`}
            sub={`${pack.flagSummary.total} flags in range`}
          />
        </div>
      </Card>

      <Card className="mt-6">
        <CardHeader
          eyebrow="Separation integrity"
          title="Medicare / retirement-income separation"
          description="Conversations where retirement-income interest appeared, and whether a separate granted consent exists — the boundary CMS cross-sell rules require."
        />
        <div className="grid gap-4 lg:grid-cols-3">
          <Stat
            label="Retirement-interest conversations"
            value={String(pack.separationIntegrity.retirementInterestConversations)}
          />
          <Stat label="With separate consent" value={String(pack.separationIntegrity.withSeparateConsent)} />
          <Stat
            label="Without separate consent"
            value={String(pack.separationIntegrity.withoutSeparateConsent)}
            emphasize={pack.separationIntegrity.withoutSeparateConsent > 0}
          />
        </div>
      </Card>

      <Card className="mt-6">
        <CardHeader
          eyebrow={`${pack.gaps.length} item(s)`}
          title="Gaps to close before an examiner finds them"
          description="Self-identified documentation and disposition gaps, each with a concrete next step."
        />
        {pack.gaps.length === 0 ? (
          <p className="text-sm text-stone-600">No gaps identified in this range. 🎉</p>
        ) : (
          <ul className="space-y-3">
            {pack.gaps.map((gap, i) => (
              <li key={i} className="rounded-2xl border border-stone-200 bg-[#fcfaf5] p-4 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge value={gap.category.replace(/_/g, " ")} tone="warning" />
                  <span className="font-medium text-ink-950">{gap.clientName}</span>
                </div>
                <p className="mt-2 text-stone-700">{gap.detail}</p>
                <p className="mt-1 text-stone-500">Next step: {gap.suggestedAction}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="mt-6">
        <CardHeader
          eyebrow="Dispositions"
          title="Compliance flags in range"
          description="Every flag with its severity, status, and rationale. Flags are detected for human review; reviewers confirm or dismiss with documented reasons."
        />
        {pack.flagSummary.detail.length === 0 ? (
          <p className="text-sm text-stone-600">No flags in this range.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-stone-200 text-xs uppercase tracking-wide text-stone-500">
                  <th className="py-2 pr-4">Client</th>
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Finding</th>
                  <th className="py-2 pr-4">Severity</th>
                  <th className="py-2 pr-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {pack.flagSummary.detail.map((f, i) => (
                  <tr key={i} className="border-b border-stone-100 align-top">
                    <td className="py-2 pr-4 font-medium text-ink-950">{f.clientName}</td>
                    <td className="py-2 pr-4 text-stone-600">{formatDateTime(f.flaggedAt)}</td>
                    <td className="py-2 pr-4 text-stone-700">
                      {FLAG_TYPE_LABELS[f.flagType]}
                      <span className="block text-xs text-stone-500">{f.rationale}</span>
                    </td>
                    <td className="py-2 pr-4">
                      <Badge value={f.severity} tone={severityTone(f.severity)} />
                    </td>
                    <td className="py-2 pr-4">
                      <Badge value={f.status} tone={f.status === "open" ? "warning" : "success"} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <p className="mt-6 text-xs text-stone-500">
        Generated from the agency&apos;s own recorded conversations, consents, compliance flags, and
        append-only audit trail. This report is informational and intended for human review; it is
        not legal or compliance advice, and it does not certify compliance with CMS or state
        requirements.
      </p>
    </>
  );
}

function Stat({
  label,
  value,
  sub,
  emphasize
}: {
  label: string;
  value: string;
  sub?: string;
  emphasize?: boolean;
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.22em] text-stone-500">{label}</p>
      <p className={`mt-2 font-serif text-3xl ${emphasize ? "text-rose-700" : "text-ink-950"}`}>{value}</p>
      {sub ? <p className="mt-1 text-sm text-stone-600">{sub}</p> : null}
    </div>
  );
}
