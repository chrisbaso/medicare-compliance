"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { ConsentStatusBadge } from "@/components/ui/consent-status-badge";
import { DataTable, Td, Th, TableHead } from "@/components/ui/data-table";
import { useDemoApp } from "@/components/providers/demo-app-provider";
import { formatDateTime } from "@/lib/format";
import { getConsentDisplay, isConsentBlocked } from "@/lib/consent-view";
import {
  getClientById,
  getConversationById,
  getCurrentUser,
  getRestrictedOpportunityVisibility,
  getUserById
} from "@/lib/demo-selectors";
import { ConsentRecord, ConsentType, ConversationChannel } from "@/lib/types";
import { cn } from "@/lib/utils";

function getChannelLabel(channel?: ConversationChannel, captureMethod?: string) {
  if (channel === "phone") {
    return "Phone";
  }

  if (channel === "service_call") {
    return "Service call";
  }

  if (channel === "web_intake") {
    return "Web intake";
  }

  if (captureMethod?.includes("digital") || captureMethod?.includes("electronic")) {
    return "Digital";
  }

  return "Manual";
}

function getSourceLabel(captureMethod: string) {
  switch (captureMethod) {
    case "verbal on recorded line":
      return "Recorded call disclosure";
    case "electronic intake form":
      return "Electronic intake form";
    case "service request intake":
      return "Service request intake";
    case "manual follow-up request":
      return "Manual follow-up request";
    case "missing refresh":
      return "Refresh outstanding";
    case "separate digital request sent":
      return "Separate digital request";
    case "digital consent pending":
      return "Digital consent request";
    case "verbal and documented":
      return "Documented verbal consent";
    case "recorded verbal authorization":
      return "Recorded verbal authorization";
    default:
      return captureMethod;
  }
}

function getDisclosureVersion(consentType: ConsentType) {
  switch (consentType) {
    case "contact":
      return "CONTACT v2026.1";
    case "recording":
      return "RECORDING v2026.1";
    case "soa":
      return "SOA v2026.1";
    case "retirement_follow_up":
      return "SEPARATE-FU v2026.1";
  }
}

function isRetirementFollowUp(record: ConsentRecord) {
  return record.consentType === "retirement_follow_up";
}

export default function ConsentsPage() {
  const { state, actions } = useDemoApp();
  const canViewRetirement = getRestrictedOpportunityVisibility(getCurrentUser(state));
  const [demoNotice, setDemoNotice] = useState<string | null>(null);

  const rows = useMemo(
    () =>
      state.consentRecords
        .filter((record) => canViewRetirement || !isRetirementFollowUp(record))
        .map((record) => {
          const client = getClientById(state, record.clientId);
          const conversation = record.conversationId ? getConversationById(state, record.conversationId) : undefined;
          const capturedBy = conversation ? getUserById(state, conversation.ownerUserId) : undefined;
          const consent = getConsentDisplay(record);

          return {
            record,
            client,
            conversation,
            capturedBy,
            consent
          };
        })
        .sort((a, b) => new Date(b.record.capturedAt).getTime() - new Date(a.record.capturedAt).getTime()),
    [canViewRetirement, state]
  );

  const medicareRecords = rows.filter(({ record }) => record.consentType !== "retirement_follow_up");
  const separateFollowUpRecords = rows.filter(({ record }) => record.consentType === "retirement_follow_up");
  const blockedSeparateFollowUpRecords = separateFollowUpRecords.filter(({ record }) => isConsentBlocked(record));

  function handleMarkCaptured(record: ConsentRecord) {
    actions.updateConsentStatus(record.id, "granted");
    setDemoNotice(`${getConsentDisplay(record).typeLabel} marked captured in local demo state.`);
  }

  function handleRevoke(record: ConsentRecord) {
    actions.updateConsentStatus(record.id, "revoked");
    setDemoNotice(`${getConsentDisplay(record).typeLabel} marked revoked in local demo state.`);
  }

  return (
    <>
      <PageHeader
        title="Consent ledger"
        description="Review auditable consent records across Medicare workflows and separate retirement-income follow-up requests without blending the two workflows."
      />

      <section className="mt-8 grid gap-4 lg:grid-cols-3">
        <Card>
          <p className="text-[11px] uppercase tracking-[0.22em] text-stone-500">Medicare permissions</p>
          <p className="mt-3 text-3xl font-serif text-ink-950">{medicareRecords.length}</p>
          <p className="mt-2 text-sm text-stone-600">
            Medicare-related recording, contact, and SOA permissions stay in the core operational workflow.
          </p>
        </Card>
        <Card className="border-sky-200 bg-sky-50/40">
          <p className="text-[11px] uppercase tracking-[0.22em] text-sky-700">Separate follow-up permissions</p>
          <p className="mt-3 text-3xl font-serif text-ink-950">{separateFollowUpRecords.length}</p>
          <p className="mt-2 text-sm text-stone-600">
            These records apply only to separate retirement-income follow-up and should never be read as Medicare consent.
          </p>
        </Card>
        <Card className="border-amber-300 bg-amber-50/80">
          <p className="text-[11px] uppercase tracking-[0.22em] text-amber-800">Blocked separate follow-up</p>
          <p className="mt-3 text-3xl font-serif text-ink-950">{blockedSeparateFollowUpRecords.length}</p>
          <p className="mt-2 text-sm text-stone-700">
            Missing or incomplete separate consent blocks any follow-up workflow until explicit permission is fully recorded.
          </p>
        </Card>
      </section>

      <Card className="mt-8">
        <CardHeader
          eyebrow="Audit Trail"
          title="Consent records"
          description="Each row shows what was captured, when it was captured, the originating conversation, and who owns the source record."
        />
        {demoNotice ? (
          <div className="mb-4 rounded-2xl border border-teal-200 bg-teal-50/70 px-4 py-3 text-sm text-teal-900">
            {demoNotice}
          </div>
        ) : null}

        <DataTable>
          <TableHead>
            <tr>
              <Th>Client</Th>
              <Th>Category</Th>
              <Th>Channel</Th>
              <Th>Status</Th>
              <Th>Captured timestamp</Th>
              <Th>Source</Th>
              <Th>Disclosure version</Th>
              <Th>Source conversation</Th>
              <Th>Captured by</Th>
              <Th>Actions</Th>
            </tr>
          </TableHead>
          <tbody>
            {rows.map(({ record, client, conversation, capturedBy, consent }) => (
              <tr
                key={record.id}
                className={cn(
                  "bg-white transition-colors hover:bg-stone-50/80",
                  consent.isBlocked ? "bg-amber-50/40 hover:bg-amber-50/60" : undefined
                )}
              >
                <Td>
                  {client ? (
                    <div className="space-y-1">
                      <Link
                        href={`/clients/${client.id}`}
                        className="font-semibold text-ink-950 transition-colors hover:text-teal-700"
                      >
                        {client.firstName} {client.lastName}
                      </Link>
                      <p className="text-xs text-stone-500">{client.state}</p>
                    </div>
                  ) : (
                    <span className="text-stone-400">Unknown client</span>
                  )}
                </Td>
                <Td>
                  <div
                    className={cn(
                      "inline-flex max-w-[14rem] flex-col gap-2 rounded-2xl border px-3 py-2",
                      consent.classes.container
                    )}
                  >
                    <span
                      className={cn(
                        "w-fit rounded-full px-2 py-1 text-[11px] font-semibold tracking-wide",
                        consent.classes.label
                      )}
                    >
                      {consent.categoryLabel}
                    </span>
                    <span className="text-sm font-medium text-ink-950">{consent.typeLabel}</span>
                  </div>
                </Td>
                <Td>{getChannelLabel(conversation?.channel, record.captureMethod)}</Td>
                <Td>
                  <div className="space-y-2">
                    <ConsentStatusBadge
                      record={record}
                      showCategoryLabel={record.consentType === "retirement_follow_up"}
                      showBlockerHint
                    />
                    {!record.evidenceComplete ? <p className="text-xs text-amber-700">Evidence needs follow-through</p> : null}
                    {consent.isBlocked ? (
                      <p className="text-xs font-medium text-amber-800">
                        Separate follow-up cannot proceed until explicit consent is complete.
                      </p>
                    ) : null}
                  </div>
                </Td>
                <Td>
                  <div className="space-y-1">
                    <p className="font-medium text-ink-950">{formatDateTime(record.capturedAt)}</p>
                    <p className="text-xs text-stone-500">{record.evidenceRef}</p>
                  </div>
                </Td>
                <Td>
                  <div className="space-y-1">
                    <p>{getSourceLabel(record.captureMethod)}</p>
                    <p className="text-xs text-stone-500">{record.notes}</p>
                  </div>
                </Td>
                <Td>
                  <span className="rounded-full bg-stone-100 px-2 py-1 text-xs font-semibold text-stone-700">
                    {getDisclosureVersion(record.consentType)}
                  </span>
                </Td>
                <Td>
                  {conversation ? (
                    <div className="space-y-1">
                      <Link
                        href={`/conversations/${conversation.id}`}
                        className="font-semibold text-ink-950 transition-colors hover:text-teal-700"
                      >
                        {conversation.id}
                      </Link>
                      <p className="text-xs text-stone-500">{conversation.medicareScope}</p>
                    </div>
                  ) : (
                    <span className="text-stone-400">No linked conversation</span>
                  )}
                </Td>
                <Td>
                  <div className="space-y-1">
                    <p className="font-medium text-ink-950">{capturedBy?.fullName ?? "System record"}</p>
                    <p className="text-xs text-stone-500">{capturedBy?.team ?? "Audit log"}</p>
                  </div>
                </Td>
                <Td>
                  <div className="flex min-w-[11rem] flex-col gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => handleMarkCaptured(record)}
                      disabled={record.status === "granted" && record.evidenceComplete}
                    >
                      Mark consent captured
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => handleRevoke(record)}
                      disabled={record.status === "revoked"}
                    >
                      Revoke consent
                    </Button>
                    {conversation ? (
                      <ButtonLink href={`/conversations/${conversation.id}`} variant="ghost">
                        View source
                      </ButtonLink>
                    ) : (
                      <span className="px-2 text-xs text-stone-400">No source conversation</span>
                    )}
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      </Card>
    </>
  );
}
