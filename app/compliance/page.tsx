"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AssignmentSelect } from "@/components/domain/assignment-select";
import { PageHeader } from "@/components/page-header";
import { useDemoApp } from "@/components/providers/demo-app-provider";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { DataTable, Td, Th, TableHead } from "@/components/ui/data-table";
import { FilterBar, FilterField, Select } from "@/components/ui/filter-bar";
import { SeverityBadge } from "@/components/ui/severity-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDateTime } from "@/lib/format";
import { getClientById, getConversationById, getUserById } from "@/lib/demo-selectors";
import { ComplianceFlag } from "@/lib/types";

function getRuleCategoryLabel(flagType: ComplianceFlag["flagType"]) {
  switch (flagType) {
    case "missing_consent":
      return "Missing consent";
    case "cross_sell_risk":
      return "Cross-sell contamination";
    case "unsupported_claim":
      return "Unsupported claims";
    case "needs_human_review":
      return "Human review";
  }
}

export default function CompliancePage() {
  const { state, actions } = useDemoApp();
  const [severityFilter, setSeverityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [ruleFilter, setRuleFilter] = useState("all");
  const [assignedUserFilter, setAssignedUserFilter] = useState("all");
  const [reviewedFlags, setReviewedFlags] = useState<Record<string, string>>({});
  const [reviewerAssignments, setReviewerAssignments] = useState<Record<string, string>>({});
  const [demoNotice, setDemoNotice] = useState<string | null>(null);

  const rows = useMemo(
    () =>
      state.complianceFlags
        .map((flag) => {
          const conversation = getConversationById(state, flag.conversationId);
          const client = getClientById(state, flag.clientId);
          const assignedUser =
            getUserById(state, reviewerAssignments[flag.id]) ??
            (conversation ? getUserById(state, conversation.ownerUserId) : undefined);

          return {
            flag,
            conversation,
            client,
            assignedUser,
            isReviewed: Boolean(reviewedFlags[flag.id]),
            ruleCategory: getRuleCategoryLabel(flag.flagType)
          };
        })
        .sort((left, right) => Date.parse(right.flag.flaggedAt) - Date.parse(left.flag.flaggedAt)),
    [reviewedFlags, reviewerAssignments, state]
  );

  const filteredRows = useMemo(
    () =>
      rows.filter((row) => {
        const matchesSeverity = severityFilter === "all" || row.flag.severity === severityFilter;
        const matchesStatus = statusFilter === "all" || row.flag.status === statusFilter;
        const matchesRule = ruleFilter === "all" || row.flag.flagType === ruleFilter;
        const matchesAssignedUser =
          assignedUserFilter === "all" ||
          (assignedUserFilter === "unassigned" && !row.assignedUser) ||
          row.assignedUser?.id === assignedUserFilter;

        return matchesSeverity && matchesStatus && matchesRule && matchesAssignedUser;
      }),
    [assignedUserFilter, rows, ruleFilter, severityFilter, statusFilter]
  );

  const severityCounts = {
    critical: rows.filter((row) => row.flag.severity === "critical").length,
    high: rows.filter((row) => row.flag.severity === "high").length,
    medium: rows.filter((row) => row.flag.severity === "medium").length,
    low: rows.filter((row) => row.flag.severity === "low").length
  };
  const unresolvedCount = rows.filter((row) => row.flag.status === "open").length;
  const resolvedCount = rows.filter((row) => row.flag.status !== "open").length;
  const openHighRiskCount = rows.filter(
    (row) => row.flag.status === "open" && (row.flag.severity === "high" || row.flag.severity === "critical")
  ).length;

  function handleMarkReviewed(flagId: string) {
    setReviewedFlags((current) => ({
      ...current,
      [flagId]: new Date().toISOString()
    }));
    setDemoNotice("Flag marked reviewed in local demo state.");
  }

  function handleAssignReviewer(flagId: string, userId: string) {
    setReviewerAssignments((current) => ({
      ...current,
      [flagId]: userId
    }));
    setDemoNotice(userId ? "Reviewer assignment updated in local demo state." : "Reviewer assignment cleared in local demo state.");
  }

  return (
    <>
      <PageHeader
        title="Compliance QA"
        description="Reviewer queue for missing consent, cross-sell risk, unsupported claims, and QA determinations."
      />

      {demoNotice ? (
        <div className="mt-6 rounded-2xl border border-teal-200 bg-teal-50/70 px-4 py-3 text-sm text-teal-900">
          {demoNotice}
        </div>
      ) : null}

      <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <Card>
          <p className="text-[11px] uppercase tracking-[0.22em] text-stone-500">Critical</p>
          <p className="mt-3 font-serif text-4xl text-ink-950">{severityCounts.critical}</p>
          <p className="mt-2 text-sm text-stone-600">Flags requiring immediate review.</p>
        </Card>
        <Card>
          <p className="text-[11px] uppercase tracking-[0.22em] text-stone-500">High</p>
          <p className="mt-3 font-serif text-4xl text-ink-950">{severityCounts.high}</p>
          <p className="mt-2 text-sm text-stone-600">High-priority issues needing prompt resolution.</p>
        </Card>
        <Card>
          <p className="text-[11px] uppercase tracking-[0.22em] text-stone-500">Medium</p>
          <p className="mt-3 font-serif text-4xl text-ink-950">{severityCounts.medium}</p>
          <p className="mt-2 text-sm text-stone-600">Watch items still needing reviewer attention.</p>
        </Card>
        <Card>
          <p className="text-[11px] uppercase tracking-[0.22em] text-stone-500">Low</p>
          <p className="mt-3 font-serif text-4xl text-ink-950">{severityCounts.low}</p>
          <p className="mt-2 text-sm text-stone-600">Lower-risk items logged for traceability.</p>
        </Card>
        <Card className="border-amber-300 bg-amber-50/80">
          <p className="text-[11px] uppercase tracking-[0.22em] text-amber-800">Open high-risk</p>
          <p className="mt-3 font-serif text-4xl text-ink-950">{openHighRiskCount}</p>
          <p className="mt-2 text-sm text-stone-700">Unresolved high and critical flags in queue.</p>
        </Card>
        <Card className="border-sky-200 bg-sky-50/40">
          <p className="text-[11px] uppercase tracking-[0.22em] text-sky-700">Resolved vs unresolved</p>
          <p className="mt-3 font-serif text-4xl text-ink-950">{resolvedCount} / {unresolvedCount}</p>
          <p className="mt-2 text-sm text-stone-600">Closed items versus still-open review work.</p>
        </Card>
      </section>

      <FilterBar className="mt-8 lg:[&>div]:grid-cols-4">
        <FilterField label="Severity">
          <Select value={severityFilter} onChange={(event) => setSeverityFilter(event.target.value)}>
            <option value="all">All severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </Select>
        </FilterField>
        <FilterField label="Status">
          <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">All statuses</option>
            <option value="open">Open</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </Select>
        </FilterField>
        <FilterField label="Rule category">
          <Select value={ruleFilter} onChange={(event) => setRuleFilter(event.target.value)}>
            <option value="all">All categories</option>
            <option value="missing_consent">Missing consent</option>
            <option value="cross_sell_risk">Cross-sell contamination</option>
            <option value="unsupported_claim">Unsupported claims</option>
            <option value="needs_human_review">Human review</option>
          </Select>
        </FilterField>
        <FilterField label="Assigned user">
          <Select value={assignedUserFilter} onChange={(event) => setAssignedUserFilter(event.target.value)}>
            <option value="all">All owners</option>
            <option value="unassigned">Unassigned</option>
            {state.users.map((user) => (
              <option key={user.id} value={user.id}>{user.fullName}</option>
            ))}
          </Select>
        </FilterField>
      </FilterBar>

      <section className="mt-8 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader
            title="Compliance flag queue"
            description="Filter by severity, status, rule category, or assigned owner to focus review work."
          />
          <DataTable>
            <TableHead>
              <tr>
                <Th>Client</Th>
                <Th>Rule category</Th>
                <Th>Severity</Th>
                <Th>Status</Th>
                <Th>Reviewer</Th>
                <Th>Flagged</Th>
                <Th>Details</Th>
              </tr>
            </TableHead>
            <tbody>
              {filteredRows.map(({ flag, client, assignedUser, ruleCategory, isReviewed }) => (
                <tr key={flag.id} className="bg-white transition-colors hover:bg-stone-50/80">
                  <Td>
                    <div className="space-y-1">
                      <Link href={`/conversations/${flag.conversationId}`} className="font-medium text-ink-950 hover:text-teal-700">
                        {client?.firstName} {client?.lastName}
                      </Link>
                      <p className="text-xs text-stone-500">{flag.conversationId}</p>
                    </div>
                  </Td>
                  <Td>
                    <Badge value={ruleCategory} tone="info" />
                  </Td>
                  <Td>
                    <SeverityBadge value={flag.severity} />
                  </Td>
                  <Td>
                    <StatusBadge value={flag.status} />
                  </Td>
                  <Td>
                    <div className="space-y-2">
                      <AssignmentSelect
                        users={state.users.filter((user) => user.role === "manager" || user.role === "compliance")}
                        value={assignedUser?.id}
                        onChange={(nextValue) => handleAssignReviewer(flag.id, nextValue)}
                      />
                      <p className="text-xs text-stone-500">
                        {assignedUser ? `${assignedUser.fullName} - ${assignedUser.team}` : "No reviewer assigned yet"}
                      </p>
                    </div>
                  </Td>
                  <Td>{formatDateTime(flag.flaggedAt)}</Td>
                  <Td className="max-w-md">
                    <div className="space-y-3">
                      <p className="text-sm text-stone-700">{flag.rationale}</p>
                      <p className="text-xs text-stone-500">
                        <span className="font-medium text-ink-950">Recommended action:</span> {flag.recommendedAction}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {isReviewed ? <Badge value="Reviewed" tone="info" /> : <Badge value="Needs review" tone="warning" />}
                        <Badge value={flag.detectedBy} tone="neutral" />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {flag.status === "open" ? (
                          <>
                            <Button variant="secondary" onClick={() => handleMarkReviewed(flag.id)}>
                              Mark reviewed
                            </Button>
                            <Button variant="secondary" onClick={() => actions.resolveFlag(flag.id, "resolved")}>Resolve</Button>
                            <Button variant="ghost" onClick={() => actions.resolveFlag(flag.id, "dismissed")}>Dismiss</Button>
                            <ButtonLink href={`/conversations/${flag.conversationId}`} variant="ghost">
                              Open source conversation
                            </ButtonLink>
                          </>
                        ) : (
                          <>
                            <Badge value="Reviewed" tone="success" />
                            <ButtonLink href={`/conversations/${flag.conversationId}`} variant="ghost">
                              Open source conversation
                            </ButtonLink>
                          </>
                        )}
                      </div>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        </Card>

        <Card>
          <CardHeader
            title="QA determinations"
            description="Reviewer outcomes remain editable in local demo state."
          />
          <DataTable>
            <TableHead>
              <tr>
                <Th>Conversation</Th>
                <Th>Reviewer</Th>
                <Th>Score</Th>
                <Th>Outcome</Th>
                <Th>Reviewed</Th>
              </tr>
            </TableHead>
            <tbody>
              {state.qaReviews.map((review) => {
                const conversation = getConversationById(state, review.conversationId);
                const client = conversation ? getClientById(state, conversation.clientId) : undefined;
                const reviewer = getUserById(state, review.reviewerUserId);

                return (
                  <tr key={review.id}>
                    <Td>
                      <div className="font-medium text-ink-950">{client?.firstName} {client?.lastName}</div>
                      <div className="mt-1 text-xs text-stone-500">{review.summary}</div>
                    </Td>
                    <Td>{reviewer?.fullName}</Td>
                    <Td>{review.score}</Td>
                    <Td>
                      <Select
                        value={review.outcome}
                        onChange={(event) => actions.updateQaOutcome(review.id, event.target.value as typeof review.outcome)}
                      >
                        <option value="pass">Pass</option>
                        <option value="pass_with_notes">Pass with notes</option>
                        <option value="escalate">Escalate</option>
                      </Select>
                    </Td>
                    <Td>{formatDateTime(review.reviewedAt)}</Td>
                  </tr>
                );
              })}
            </tbody>
          </DataTable>
        </Card>
      </section>
    </>
  );
}
