"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { useDemoApp } from "@/components/providers/demo-app-provider";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { DataTable, Td, Th, TableHead } from "@/components/ui/data-table";
import { FilterBar, FilterField, Input } from "@/components/ui/filter-bar";
import { SeverityBadge } from "@/components/ui/severity-badge";
import { getFriendlyTopicLabel } from "@/lib/conversation-view";
import { getClientById, getConversationConsents, getConversationFlags, getUserById } from "@/lib/demo-selectors";
import { formatDateTime, titleize } from "@/lib/format";
import { Conversation, FlagSeverity } from "@/lib/types";

type FocusFilter =
  | "all"
  | "needs_review"
  | "high_risk"
  | "retirement_signal"
  | "missing_consent"
  | "medicare"
  | "service";

type InboxRow = {
  id: string;
  clientName: string;
  conversationType: string;
  channel: string;
  dateTime: string;
  assignedUser: string;
  summarySnippet: string;
  detectedTopics: string[];
  highestSeverity?: FlagSeverity;
  retirementInterestDetected: boolean;
  missingConsent: boolean;
  reviewStatus: string;
  reviewTone: "success" | "warning" | "danger" | "info";
};

const severityRank: Record<FlagSeverity, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4
};

export default function ConversationsPage() {
  const { state } = useDemoApp();
  const [query, setQuery] = useState("");
  const [focusFilter, setFocusFilter] = useState<FocusFilter>("all");

  const rows = useMemo(
    () =>
      state.conversations.map((conversation) => {
        const client = getClientById(state, conversation.clientId);
        const owner = getUserById(state, conversation.ownerUserId);
        const flags = getConversationFlags(state, conversation.id).filter(
          (flag) => flag.status === "open"
        );
        const consents = getConversationConsents(state, conversation.id);
        const highestSeverity = flags
          .slice()
          .sort((left, right) => severityRank[right.severity] - severityRank[left.severity])[0]
          ?.severity;
        const missingConsent = consents.some(
          (record) => record.status !== "granted" || !record.evidenceComplete
        );
        const review = getReviewStatus(conversation, missingConsent, highestSeverity);

        return {
          id: conversation.id,
          clientName: client ? `${client.firstName} ${client.lastName}` : "Client record",
          conversationType: conversation.medicareScope,
          channel: conversation.channel,
          dateTime: conversation.startedAt,
          assignedUser: owner?.fullName ?? "Unassigned",
          summarySnippet: conversation.summary,
          detectedTopics: conversation.detectedTopics,
          highestSeverity,
          retirementInterestDetected: conversation.retirementInterestDetected,
          missingConsent,
          reviewStatus: review.label,
          reviewTone: review.tone
        } satisfies InboxRow;
      }),
    [state]
  );

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesQuery =
        row.clientName.toLowerCase().includes(normalizedQuery) ||
        row.conversationType.toLowerCase().includes(normalizedQuery) ||
        row.channel.toLowerCase().includes(normalizedQuery) ||
        row.assignedUser.toLowerCase().includes(normalizedQuery) ||
        row.summarySnippet.toLowerCase().includes(normalizedQuery);
      const matchesFilter =
        focusFilter === "all" ||
        (focusFilter === "needs_review" &&
          (row.reviewStatus === "Needs review" || row.reviewStatus === "Blocked")) ||
        (focusFilter === "high_risk" &&
          (row.highestSeverity === "critical" || row.highestSeverity === "high")) ||
        (focusFilter === "retirement_signal" && row.retirementInterestDetected) ||
        (focusFilter === "missing_consent" && row.missingConsent) ||
        (focusFilter === "medicare" && row.channel !== "service_call") ||
        (focusFilter === "service" && row.channel === "service_call");

      return matchesQuery && matchesFilter;
    });
  }, [focusFilter, query, rows]);

  const filterOptions = useMemo(
    () => [
      { value: "all", label: "All", count: rows.length },
      {
        value: "needs_review",
        label: "Needs review",
        count: rows.filter(
          (row) => row.reviewStatus === "Needs review" || row.reviewStatus === "Blocked"
        ).length
      },
      {
        value: "high_risk",
        label: "High risk",
        count: rows.filter(
          (row) => row.highestSeverity === "critical" || row.highestSeverity === "high"
        ).length
      },
      {
        value: "retirement_signal",
        label: "Retirement-income signal",
        count: rows.filter((row) => row.retirementInterestDetected).length
      },
      {
        value: "missing_consent",
        label: "Missing consent",
        count: rows.filter((row) => row.missingConsent).length
      },
      {
        value: "medicare",
        label: "Medicare conversation",
        count: rows.filter((row) => row.channel !== "service_call").length
      },
      {
        value: "service",
        label: "Service conversation",
        count: rows.filter((row) => row.channel === "service_call").length
      }
    ] satisfies Array<{ value: FocusFilter; label: string; count: number }>,
    [rows]
  );

  const overview = useMemo(
    () => [
      {
        label: "Needs review",
        value: rows.filter(
          (row) => row.reviewStatus === "Needs review" || row.reviewStatus === "Blocked"
        ).length,
        detail: "Items needing manager or reviewer attention."
      },
      {
        label: "High risk",
        value: rows.filter(
          (row) => row.highestSeverity === "critical" || row.highestSeverity === "high"
        ).length,
        detail: "Open high-severity compliance items in the queue."
      },
      {
        label: "Retirement signal",
        value: rows.filter((row) => row.retirementInterestDetected).length,
        detail: "Separate follow-up signals kept outside Medicare work."
      },
      {
        label: "Missing consent",
        value: rows.filter((row) => row.missingConsent).length,
        detail: "Conversations with incomplete or non-granted consent."
      }
    ],
    [rows]
  );

  return (
    <>
      <PageHeader
        title="Conversation inbox"
        description="Manager-facing triage for recent agency conversations. The layout surfaces what needs review, what carries compliance risk, and what belongs in a separate follow-up path without overwhelming the queue."
      />

      <section className="grid gap-4 xl:grid-cols-4">
        {overview.map((item) => (
          <Card key={item.label} className="p-4">
            <p className="text-[11px] uppercase tracking-[0.2em] text-stone-500">{item.label}</p>
            <p className="mt-3 font-serif text-4xl text-ink-950">{item.value}</p>
            <p className="mt-2 text-sm leading-6 text-stone-600">{item.detail}</p>
          </Card>
        ))}
      </section>

      <Card className="space-y-5">
        <CardHeader
          title="Queue controls"
          description="Search the inbox or narrow it to the conversations that need attention first."
        />

        <FilterBar className="border-0 bg-[#fcfaf5] p-0 lg:[&>div]:grid-cols-[minmax(0,1fr)_auto]">
          <FilterField label="Search conversations">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by client, type, assigned user, or summary"
            />
          </FilterField>
          <div className="flex items-end">
            <div className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-600">
              {filteredRows.length} of {rows.length} conversations
            </div>
          </div>
        </FilterBar>

        <div className="flex flex-wrap gap-2">
          {filterOptions.map((option) => {
            const isActive = focusFilter === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setFocusFilter(option.value)}
                className={[
                  "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "border-teal-600 bg-teal-50 text-teal-800"
                    : "border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:text-ink-950"
                ].join(" ")}
              >
                <span>{option.label}</span>
                <span
                  className={[
                    "rounded-full px-2 py-0.5 text-xs",
                    isActive ? "bg-teal-100 text-teal-800" : "bg-stone-100 text-stone-600"
                  ].join(" ")}
                >
                  {option.count}
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Triage inbox"
          description="Each row bundles the operating context, risk, and follow-up indicators needed for fast prioritization."
        />
        <DataTable>
          <TableHead>
            <tr>
              <Th>Client</Th>
              <Th>Conversation</Th>
              <Th>Summary</Th>
              <Th>Topics</Th>
              <Th>Signals</Th>
              <Th>Owner</Th>
              <Th>Review</Th>
              <Th>Detail</Th>
            </tr>
          </TableHead>
          <tbody>
            {filteredRows.map((row) => (
              <tr key={row.id} className="group transition-colors hover:bg-stone-50/90">
                <Td className="min-w-[12rem]">
                  <div className="space-y-1">
                    <Link
                      href={`/conversations/${row.id}`}
                      className="font-semibold text-ink-950 transition-colors group-hover:text-teal-700"
                    >
                      {row.clientName}
                    </Link>
                    <p className="text-xs uppercase tracking-[0.16em] text-stone-500">
                      {formatDateTime(row.dateTime)}
                    </p>
                  </div>
                </Td>
                <Td className="min-w-[14rem]">
                  <div className="space-y-3">
                    <p className="font-medium text-ink-950">{row.conversationType}</p>
                    <Badge value={titleize(row.channel)} tone="neutral" />
                  </div>
                </Td>
                <Td className="min-w-[22rem] max-w-[28rem]">
                  <Link
                    href={`/conversations/${row.id}`}
                    className="block text-sm leading-6 text-stone-700 transition-colors hover:text-ink-950"
                  >
                    {row.summarySnippet}
                  </Link>
                </Td>
                <Td className="min-w-[15rem]">
                  <div className="flex flex-wrap gap-2">
                    {row.detectedTopics.slice(0, 3).map((topic) => (
                      <Badge
                        key={topic}
                        value={getFriendlyTopicLabel(topic)}
                        tone={getTopicTone(topic)}
                        className="capitalize"
                      />
                    ))}
                    {row.detectedTopics.length > 3 ? (
                      <Badge
                        value={`+${row.detectedTopics.length - 3} more`}
                        tone="neutral"
                        className="normal-case"
                      />
                    ) : null}
                  </div>
                </Td>
                <Td className="min-w-[14rem]">
                  <div className="flex flex-wrap gap-2">
                    {row.highestSeverity ? (
                      <SeverityBadge value={row.highestSeverity} />
                    ) : (
                      <Badge value="Clear" tone="success" />
                    )}
                    <Badge
                      value={row.retirementInterestDetected ? "Retirement signal" : "No signal"}
                      tone={row.retirementInterestDetected ? "warning" : "neutral"}
                      className={!row.retirementInterestDetected ? "normal-case" : undefined}
                    />
                    <Badge
                      value={row.missingConsent ? "Consent gap" : "Consent clear"}
                      tone={row.missingConsent ? "warning" : "success"}
                      className="normal-case"
                    />
                  </div>
                </Td>
                <Td className="min-w-[12rem]">
                  <p className="font-medium text-ink-950">{row.assignedUser}</p>
                  <p className="mt-1 text-sm text-stone-500">Assigned owner</p>
                </Td>
                <Td className="min-w-[10rem]">
                  <Badge value={row.reviewStatus} tone={row.reviewTone} />
                </Td>
                <Td>
                  <Link
                    href={`/conversations/${row.id}`}
                    className="font-semibold text-teal-700 transition-colors hover:text-teal-600"
                  >
                    Open
                  </Link>
                </Td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      </Card>
    </>
  );
}

function getReviewStatus(
  conversation: Conversation,
  missingConsent: boolean,
  highestSeverity?: FlagSeverity
) {
  if (highestSeverity === "critical" || highestSeverity === "high") {
    return { label: "High risk", tone: "danger" as const };
  }

  if (conversation.routingState === "blocked" || missingConsent) {
    return { label: "Blocked", tone: "warning" as const };
  }

  if (
    conversation.status === "new" ||
    conversation.status === "in_review" ||
    conversation.routingState === "awaiting_review"
  ) {
    return { label: "Needs review", tone: "warning" as const };
  }

  if (conversation.status === "routed" || conversation.routingState === "ready_to_route") {
    return { label: "Ready to route", tone: "info" as const };
  }

  return { label: "Complete", tone: "success" as const };
}

function getTopicTone(topic: string) {
  if (topic === "retirement_income_interest" || topic === "annuity_interest") {
    return "warning" as const;
  }

  if (topic === "compliance_review" || topic === "consent") {
    return "info" as const;
  }

  return "neutral" as const;
}
