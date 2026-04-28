"use client";

import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { useDemoApp } from "@/components/providers/demo-app-provider";
import { Card, CardHeader } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import {
  getClientById,
  getCurrentUser,
  getOpenFlagsCount,
  getOpenTasksCount,
  getPendingConsentsCount,
  getRestrictedOpportunityVisibility,
  getUrgentTasks
} from "@/lib/demo-selectors";
import {
  getRetirementIncomeQueueEntries,
  getRetirementIncomeSignalsOutsideQueueCount
} from "@/lib/retirement-income-queue";

export default function DashboardPage() {
  const { state } = useDemoApp();
  const currentUser = getCurrentUser(state);
  const canViewOpportunities = getRestrictedOpportunityVisibility(currentUser);
  const retirementQueueEntries = getRetirementIncomeQueueEntries(state);
  const outsideQueueSignals = getRetirementIncomeSignalsOutsideQueueCount(state);
  const urgentTasks = getUrgentTasks(state).slice(0, 5);
  const openFlags = state.complianceFlags.filter((flag) => flag.status === "open").slice(0, 4);
  const pendingConsents = state.consentRecords.filter((record) => record.status === "pending" || !record.evidenceComplete).slice(0, 4);
  const watchClients = state.clients
    .filter((client) =>
      state.complianceFlags.some((flag) => flag.clientId === client.id && flag.status === "open") ||
      state.tasks.some((task) => task.clientId === client.id && task.status !== "done")
    )
    .slice(0, 5);

  return (
    <>
      <PageHeader
        title="Agency dashboard"
        description="Operating picture for intake, consent verification, transcript review, workflow routing, compliance QA, and separate retirement-income follow-up."
        actions={<ButtonLink href="/conversations">Open conversation queue</ButtonLink>}
      />

      <section className="grid gap-4 xl:grid-cols-4">
        <MetricCard label="Conversations in queue" value={String(state.conversations.length)} detail="New, in-review, routed, and closed demo conversations." />
        <MetricCard label="Open compliance flags" value={String(getOpenFlagsCount(state))} detail="Critical and high-severity issues should be reviewed before routing." />
        <MetricCard label="Pending consent items" value={String(getPendingConsentsCount(state))} detail="Missing or incomplete consent blocks downstream work." />
        <MetricCard label="Open tasks" value={String(getOpenTasksCount(state))} detail="Unified queue across intake, service, compliance, and follow-up." />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.25fr_0.95fr]">
        <Card>
          <CardHeader
            title="Urgent operating priorities"
            description="Highest-signal work items that should move first today."
          />
          <div className="space-y-3">
            {urgentTasks.map((task) => {
              const client = getClientById(state, task.clientId);
              return (
                <Link key={task.id} href="/tasks" className="flex items-start justify-between gap-4 rounded-2xl border border-stone-200 bg-[#fcfaf5] p-4 transition hover:border-teal-200">
                  <div>
                    <strong className="block text-sm text-ink-950">{task.title}</strong>
                    <p className="mt-1 text-sm text-stone-600">{client?.firstName} {client?.lastName} • {task.queue}</p>
                  </div>
                  <Badge value={task.priority} tone={task.priority === "urgent" ? "danger" : "warning"} />
                </Link>
              );
            })}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Retirement-income queue"
            description="Consent-cleared retirement-income follow-up stays isolated from Medicare workflow."
            actions={canViewOpportunities ? <ButtonLink variant="secondary" href="/opportunities">Open queue</ButtonLink> : undefined}
          />
          {canViewOpportunities ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-stone-200 bg-[#fcfaf5] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Queue items</p>
                <p className="mt-2 font-serif text-4xl text-ink-950">{retirementQueueEntries.length}</p>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-amber-800">Held outside queue</p>
                <p className="mt-2 font-serif text-4xl text-ink-950">
                  {outsideQueueSignals}
                </p>
              </div>
            </div>
          ) : (
            <p className="rounded-2xl border border-stone-200 bg-[#fcfaf5] p-4 text-sm text-stone-600">
              This demo user cannot view the retirement-income follow-up queue.
            </p>
          )}
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader title="Flagged conversations" description="Open items needing compliance attention." />
          <div className="space-y-3">
            {openFlags.map((flag) => {
              const client = getClientById(state, flag.clientId);
              return (
                <Link key={flag.id} href={`/conversations/${flag.conversationId}`} className="block rounded-2xl border border-stone-200 bg-[#fcfaf5] p-4 transition hover:border-teal-200">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <strong className="block text-sm text-ink-950">{client?.firstName} {client?.lastName}</strong>
                      <p className="mt-1 text-sm text-stone-600">{flag.rationale}</p>
                    </div>
                    <Badge value={flag.severity} tone={flag.severity === "critical" || flag.severity === "high" ? "danger" : "warning"} />
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>

        <Card>
          <CardHeader title="Pending consent issues" description="Items that block routing or require renewed evidence." />
          <div className="space-y-3">
            {pendingConsents.map((record) => {
              const client = getClientById(state, record.clientId);
              return (
                <Link key={record.id} href="/consents" className="block rounded-2xl border border-stone-200 bg-[#fcfaf5] p-4 transition hover:border-teal-200">
                  <strong className="block text-sm text-ink-950">{client?.firstName} {client?.lastName}</strong>
                  <p className="mt-1 text-sm text-stone-600">{record.consentType.replaceAll("_", " ")} • {record.captureMethod}</p>
                  <div className="mt-3">
                    <Badge value={record.status} tone="warning" />
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>

        <Card>
          <CardHeader title="Client watchlist" description="Clients with open work across queues." />
          <div className="space-y-3">
            {watchClients.map((client) => (
              <Link key={client.id} href={`/clients/${client.id}`} className="block rounded-2xl border border-stone-200 bg-[#fcfaf5] p-4 transition hover:border-teal-200">
                <strong className="block text-sm text-ink-950">{client.firstName} {client.lastName}</strong>
                <p className="mt-1 text-sm text-stone-600">{client.state} • {client.tags.join(", ")}</p>
              </Link>
            ))}
          </div>
        </Card>
      </section>
    </>
  );
}
