"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ActivityFeed } from "@/components/domain/activity-feed";
import { AssignmentSelect } from "@/components/domain/assignment-select";
import { PageHeader } from "@/components/page-header";
import { useDemoApp } from "@/components/providers/demo-app-provider";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { ConsentStatusBadge } from "@/components/ui/consent-status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterBar, FilterField, Select } from "@/components/ui/filter-bar";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  getCurrentUser,
  getRestrictedOpportunityVisibility,
  getRetirementFollowUpAssignableUsers
} from "@/lib/demo-selectors";
import { formatDateTime } from "@/lib/format";
import {
  getRetirementIncomeInterestLabel,
  getRetirementIncomeQueueEntries,
  getRetirementIncomeQueueStatusDetail,
  getRetirementIncomeSignalsOutsideQueueCount
} from "@/lib/retirement-income-queue";
import { WorkflowStatus } from "@/lib/types";

const queueStatusOptions: WorkflowStatus[] = [
  "ready_for_assignment",
  "assigned",
  "completed",
  "closed_no_action"
];

export default function OpportunitiesPage() {
  const { state, actions } = useDemoApp();
  const currentUser = getCurrentUser(state);
  const canViewQueue = getRestrictedOpportunityVisibility(currentUser);
  const [statusFilter, setStatusFilter] = useState<"all" | WorkflowStatus>("all");
  const assignableUsers = getRetirementFollowUpAssignableUsers(state);

  const queueEntries = useMemo(() => getRetirementIncomeQueueEntries(state), [state]);
  const outsideQueueCount = useMemo(() => getRetirementIncomeSignalsOutsideQueueCount(state), [state]);

  const filteredEntries = useMemo(
    () =>
      queueEntries.filter((entry) => statusFilter === "all" || entry.workflowStatus === statusFilter),
    [queueEntries, statusFilter]
  );

  if (!canViewQueue) {
    return (
      <>
        <PageHeader
          title="Retirement-income follow-up queue"
          description="This separate queue is limited to managers, compliance, and appropriately licensed humans."
        />
        <EmptyState
          title="Restricted queue"
          description="Switch the demo user in the sidebar to a manager, compliance user, or retirement-follow-up licensed user to view this queue."
        />
      </>
    );
  }

  const readyForAssignmentCount = queueEntries.filter((entry) => entry.workflowStatus === "ready_for_assignment").length;
  const assignedCount = queueEntries.filter((entry) => entry.workflowStatus === "assigned").length;
  const closedCount = queueEntries.filter(
    (entry) => entry.workflowStatus === "completed" || entry.workflowStatus === "closed_no_action"
  ).length;

  return (
    <>
      <PageHeader
        title="Retirement-income follow-up queue"
        description="Consent-cleared queue for retirement-income follow-up that originated in Medicare conversations. Medicare operations, consent capture, and signal review stay outside this page; this queue only tracks the separate human-owned work after explicit permission is on file."
        actions={<ButtonLink href="/consents" variant="secondary">Open consent ledger</ButtonLink>}
      />

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-sky-200 bg-sky-50/50">
          <p className="text-[11px] uppercase tracking-[0.22em] text-sky-700">Separation guardrail</p>
          <h2 className="mt-2 font-serif text-3xl text-ink-950">Not a Medicare workflow page</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-700">
            Every item here must tie back to a Medicare conversation where retirement-income interest was detected,
            must have explicit separate consent recorded, and must be owned by an appropriately licensed human.
            Signals that are still awaiting consent remain in the conversation and consent surfaces instead of entering this queue.
          </p>
        </Card>

        <Card>
          <p className="text-[11px] uppercase tracking-[0.22em] text-stone-500">Queue boundary</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-stone-200 bg-[#fcfaf5] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Queue items</p>
              <p className="mt-2 font-serif text-4xl text-ink-950">{queueEntries.length}</p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-amber-800">Held outside queue</p>
              <p className="mt-2 font-serif text-4xl text-ink-950">{outsideQueueCount}</p>
            </div>
          </div>
          <p className="mt-3 text-sm leading-6 text-stone-600">
            {outsideQueueCount} detected Medicare-origin follow-up items are still blocked elsewhere because consent is incomplete or not granted.
          </p>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-4">
        <Card>
          <p className="text-[11px] uppercase tracking-[0.22em] text-stone-500">Consent-cleared queue</p>
          <p className="mt-3 text-3xl font-serif text-ink-950">{queueEntries.length}</p>
          <p className="mt-2 text-sm text-stone-600">
            Separate follow-up items eligible for licensed human handling.
          </p>
        </Card>
        <Card className="border-amber-200 bg-amber-50/70">
          <p className="text-[11px] uppercase tracking-[0.22em] text-amber-800">Awaiting assignment</p>
          <p className="mt-3 text-3xl font-serif text-ink-950">{readyForAssignmentCount}</p>
          <p className="mt-2 text-sm text-stone-700">
            Consent is complete, but a licensed human owner still needs to be attached.
          </p>
        </Card>
        <Card className="border-sky-200 bg-sky-50/40">
          <p className="text-[11px] uppercase tracking-[0.22em] text-sky-700">Assigned</p>
          <p className="mt-3 text-3xl font-serif text-ink-950">{assignedCount}</p>
          <p className="mt-2 text-sm text-stone-600">
            Queue items already owned by licensed staff.
          </p>
        </Card>
        <Card className="border-stone-200 bg-stone-50/80">
          <p className="text-[11px] uppercase tracking-[0.22em] text-stone-500">Closed or completed</p>
          <p className="mt-3 text-3xl font-serif text-ink-950">{closedCount}</p>
          <p className="mt-2 text-sm text-stone-600">
            Historical retirement-income follow-up work retained for audit visibility.
          </p>
        </Card>
      </section>

      <FilterBar className="lg:[&>div]:grid-cols-[minmax(0,1fr)_auto]">
        <FilterField label="Queue status">
          <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "all" | WorkflowStatus)}>
            <option value="all">All queue statuses</option>
            <option value="ready_for_assignment">Ready for assignment</option>
            <option value="assigned">Assigned</option>
            <option value="completed">Completed</option>
            <option value="closed_no_action">Closed no action</option>
          </Select>
        </FilterField>
        <div className="flex items-end">
          <div className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-600">
            Showing {filteredEntries.length} of {queueEntries.length} queue items
          </div>
        </div>
      </FilterBar>

      {filteredEntries.length === 0 ? (
        <EmptyState
          title="No consent-cleared items in this view"
          description="Signals without explicit separate consent remain on the Conversations and Consents pages until they are eligible for this queue."
        />
      ) : null}

      <section className="space-y-4">
        {filteredEntries.map((entry) => (
          <Card key={entry.workflowId} className="overflow-hidden">
            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-5">
                <CardHeader
                  eyebrow="Queue item"
                  title={entry.clientName}
                  description="Separate retirement-income follow-up, with the originating Medicare conversation and the consent-cleared queue context kept visible together."
                  actions={
                    <>
                      <StatusBadge value={entry.workflowStatus} />
                      <Badge value={entry.clientState} tone="neutral" />
                    </>
                  }
                />

                <div className="flex flex-wrap gap-2">
                  <Badge value="Separate queue item" tone="info" className="normal-case" />
                  <Badge value="Medicare origin confirmed" tone="success" className="normal-case" />
                  <Badge value={getRetirementIncomeInterestLabel(entry.detectedInterest)} tone="warning" className="normal-case" />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <InfoPanel
                    label="Detected from Medicare conversation"
                    value={entry.detectedFromConversationId}
                    detail={`${entry.detectedFromConversationScope} | ${formatDateTime(entry.detectedFromConversationAt)}`}
                  >
                    <p className="mt-2 text-sm leading-6 text-stone-700">{entry.detectedFromConversationSummary}</p>
                    <Link
                      href={`/conversations/${entry.detectedFromConversationId}`}
                      className="mt-3 inline-flex text-sm font-medium text-teal-700 transition-colors hover:text-teal-600"
                    >
                      Open source conversation
                    </Link>
                  </InfoPanel>

                  <InfoPanel
                    label="Detected interest"
                    value={getRetirementIncomeInterestLabel(entry.detectedInterest)}
                    detail={`Queued ${formatDateTime(entry.requestedAt)}`}
                  >
                    <p className="mt-2 text-sm leading-6 text-stone-700">{entry.detectedInterestSummary}</p>
                  </InfoPanel>

                  <InfoPanel
                    label="Consent status"
                    value="Separate permission on file"
                    detail={
                      entry.consentRecordedAt
                        ? `Recorded ${formatDateTime(entry.consentRecordedAt)}`
                        : "Timestamp not available"
                    }
                  >
                    <div className="mt-2 space-y-3">
                      <ConsentStatusBadge
                        consentType="retirement_follow_up"
                        status={entry.consentStatus}
                        evidenceComplete={entry.consentEvidenceComplete}
                        showCategoryLabel
                      />
                      {entry.consentConversationId ? (
                        <Link
                          href={`/conversations/${entry.consentConversationId}`}
                          className="inline-flex text-sm font-medium text-teal-700 transition-colors hover:text-teal-600"
                        >
                          Open consent capture conversation
                        </Link>
                      ) : (
                        <ButtonLink href="/consents" variant="ghost">
                          Review consent ledger
                        </ButtonLink>
                      )}
                    </div>
                  </InfoPanel>

                  <InfoPanel
                    label="Assigned licensed human"
                    value={entry.assignedLicensedUserName ?? "Unassigned"}
                    detail={
                      entry.assignedLicensedLicenseType
                        ? entry.assignedLicensedLicenseType.replaceAll("_", " ")
                        : "Choose a licensed owner for the separate follow-up."
                    }
                  >
                    <div className="mt-2 space-y-3">
                      <AssignmentSelect
                        users={assignableUsers}
                        value={entry.assignedLicensedUserId}
                        onChange={(nextUserId) => actions.assignOpportunity(entry.workflowId, nextUserId)}
                      />
                      <p className="text-xs leading-5 text-stone-500">
                        Medicare-only users are intentionally excluded from this assignment list.
                      </p>
                    </div>
                  </InfoPanel>
                </div>

                <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
                  <Card className="border-stone-200 bg-[#fcfaf5]">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">Queue controls</p>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <label className="grid gap-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Workflow status</span>
                        <Select
                          value={entry.workflowStatus}
                          onChange={(event) =>
                            actions.updateOpportunityStatus(entry.workflowId, event.target.value as WorkflowStatus)
                          }
                        >
                          {queueStatusOptions.map((status) => (
                            <option key={status} value={status}>
                              {status.replaceAll("_", " ")}
                            </option>
                          ))}
                        </Select>
                      </label>
                      <div className="grid gap-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Status guidance</span>
                        <p className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm leading-6 text-stone-700">
                          {getRetirementIncomeQueueStatusDetail(entry.workflowStatus)}
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card className="border-emerald-200 bg-emerald-50/40">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-700">Next action</p>
                    <p className="mt-3 text-lg font-medium text-ink-950">{entry.nextAction}</p>
                    <p className="mt-2 text-sm leading-6 text-stone-700">
                      Last queue update {formatDateTime(entry.lastUpdatedAt)}. This action belongs in the separate retirement-income follow-up path, not in the Medicare plan workflow.
                    </p>
                  </Card>
                </div>
              </div>

              <div className="rounded-3xl border border-stone-200 bg-[#fcfaf5] p-5">
                <CardHeader
                  eyebrow="Audit timeline"
                  title="Traceable activity"
                  description="Recent audit events tied to the separate queue item, consent, or follow-up tasks."
                />
                {entry.auditTrail.length > 0 ? (
                  <ActivityFeed items={entry.auditTrail.slice(0, 4)} />
                ) : (
                  <p className="rounded-2xl border border-dashed border-stone-300 bg-white p-4 text-sm text-stone-600">
                    No audit events are recorded yet for this queue item.
                  </p>
                )}
              </div>
            </div>
          </Card>
        ))}
      </section>
    </>
  );
}

function InfoPanel({
  label,
  value,
  detail,
  children
}: {
  label: string;
  value: string;
  detail: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5">
      <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">{label}</p>
      <p className="mt-3 font-medium text-ink-950">{value}</p>
      <p className="mt-2 text-sm leading-6 text-stone-600">{detail}</p>
      {children}
    </div>
  );
}
