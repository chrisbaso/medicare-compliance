"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ActivityFeed } from "@/components/domain/activity-feed";
import { PageHeader } from "@/components/page-header";
import { useDemoApp } from "@/components/providers/demo-app-provider";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { DataTable, Td, Th, TableHead } from "@/components/ui/data-table";
import { ConsentStatusBadge } from "@/components/ui/consent-status-badge";
import { SeverityBadge } from "@/components/ui/severity-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate, formatDateTime } from "@/lib/format";
import {
  getClientConsents,
  getClientConversations,
  getClientFlags,
  getClientOpportunities,
  getClientTasks,
  getCurrentUser,
  getRestrictedOpportunityVisibility,
  getUserById
} from "@/lib/demo-selectors";
import {
  getClientAge,
  getClientAuditEvents,
  getClientPrimaryNeed,
  getConsentSummary,
  getLatestConversation,
  getMedicareTaskCount
} from "@/lib/client-view";

export default function ClientDetailPage() {
  const params = useParams<{ id: string }>();
  const { state, actions } = useDemoApp();
  const client = state.clients.find((item) => item.id === params.id);

  if (!client) {
    return null;
  }

  const canViewRetirement = getRestrictedOpportunityVisibility(getCurrentUser(state));
  const clientConsents = getClientConsents(state, client.id);
  const clientTasks = getClientTasks(state, client.id);
  const clientConversations = getClientConversations(state, client.id);
  const clientFlags = getClientFlags(state, client.id);
  const clientOpportunities = getClientOpportunities(state, client.id);
  const clientSignals = state.opportunitySignals
    .filter((signal) => signal.clientId === client.id)
    .slice()
    .sort((left, right) => Date.parse(right.detectedAt) - Date.parse(left.detectedAt));
  const clientActivity = getClientAuditEvents(state, client.id).slice(0, 8);
  const medicareConsents = clientConsents.filter(
    (record) => record.consentType !== "retirement_follow_up"
  );
  const followUpConsents = clientConsents.filter(
    (record) => record.consentType === "retirement_follow_up"
  );
  const medicareTasks = clientTasks.filter((task) => task.queue !== "follow_up");
  const followUpTasks = clientTasks.filter((task) => task.queue === "follow_up");
  const latestConversation = getLatestConversation(clientConversations);
  const medicareConsentSummary = getConsentSummary(medicareConsents, "medicare");
  const separateConsentSummary = getConsentSummary(followUpConsents, "separate_follow_up");

  return (
    <>
      <PageHeader
        title={`${client.firstName} ${client.lastName}`}
        description="Client profile with Medicare workflow status, consent history, conversations, compliance review, and potential separate follow-up visibility."
        actions={
          <>
            <ButtonLink href="/clients" variant="secondary">Back to clients</ButtonLink>
            <ButtonLink href="/conversations" variant="ghost">Conversation inbox</ButtonLink>
          </>
        }
      />

      <section className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader
            eyebrow="Client profile"
            title="Profile summary"
            description="Basic contact details and the current primary Medicare-related need."
          />
          <div className="space-y-3 text-sm text-stone-700">
            <p><strong className="text-ink-950">Age:</strong> {getClientAge(client.dob)}</p>
            <p><strong className="text-ink-950">DOB:</strong> {formatDate(client.dob)}</p>
            <p><strong className="text-ink-950">State:</strong> {client.state}</p>
            <p><strong className="text-ink-950">Primary need:</strong> {getClientPrimaryNeed(client, clientConversations)}</p>
            <p><strong className="text-ink-950">Client note:</strong> {client.note}</p>
            <div className="flex flex-wrap gap-2 pt-2">
              <Badge
                value={client.status}
                tone={client.status === "watch" ? "warning" : "info"}
              />
              {client.tags.map((tag) => <Badge key={tag} value={tag} tone="info" />)}
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader
            eyebrow="Contact preferences"
            title="Contact and service context"
            description="How the team should reach the client and the most recent conversation touchpoint."
          />
          <div className="space-y-3 text-sm text-stone-700">
            <p><strong className="text-ink-950">Phone:</strong> {client.phone}</p>
            <p><strong className="text-ink-950">Email:</strong> {client.email}</p>
            <p><strong className="text-ink-950">Preferred contact:</strong> {client.preferredContactMethod}</p>
            <p>
              <strong className="text-ink-950">Last conversation:</strong>{" "}
              {latestConversation ? formatDateTime(latestConversation.startedAt) : "No conversation logged"}
            </p>
            <p>
              <strong className="text-ink-950">Latest Medicare scope:</strong>{" "}
              {latestConversation?.medicareScope ?? "No Medicare scope logged"}
            </p>
          </div>
        </Card>

        <Card>
          <CardHeader
            eyebrow="Medicare status"
            title="Operational readiness"
            description="Current Medicare-side status, consent readiness, and open operational work."
          />
          <div className="space-y-3 text-sm text-stone-700">
            <div className="flex flex-wrap gap-2">
              <Badge
                value={client.status}
                tone={client.status === "watch" ? "warning" : "info"}
              />
              {latestConversation ? <StatusBadge value={latestConversation.status} /> : null}
              {clientFlags.some((flag) => flag.status === "open") ? (
                <Badge value="open compliance flag" tone="danger" />
              ) : null}
            </div>
            <p>
              <strong className="text-ink-950">Consent status:</strong>{" "}
              {medicareConsentSummary.detail}
            </p>
            <p>
              <strong className="text-ink-950">Open Medicare tasks:</strong>{" "}
              {getMedicareTaskCount(clientTasks)}
            </p>
            <p>
              <strong className="text-ink-950">Open compliance flags:</strong>{" "}
              {clientFlags.filter((flag) => flag.status === "open").length}
            </p>
          </div>
        </Card>
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-stone-500">Medicare operations</p>
          <h2 className="mt-2 font-serif text-3xl text-ink-950">Client service and compliance view</h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-stone-600">
            Medicare-related consent, conversations, flags, and tasks stay in the operational workflow and do not merge with any separate follow-up workflow.
          </p>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
          <Card>
            <CardHeader
              title="Consent records"
              description="Medicare-side consent events and evidence tied to this client."
            />
            <div className="space-y-3">
              {medicareConsents.length > 0 ? medicareConsents.map((consent) => (
                <div key={consent.id} className="rounded-2xl border border-stone-200 bg-[#fcfaf5] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <strong className="block text-sm text-ink-950">{consent.consentType.replaceAll("_", " ")}</strong>
                      <p className="mt-1 text-sm text-stone-600">
                        {consent.captureMethod} / captured {formatDateTime(consent.capturedAt)}
                      </p>
                      <p className="mt-1 text-xs text-stone-500">
                        Evidence {consent.evidenceRef} / {consent.evidenceComplete ? "complete" : "incomplete"}
                      </p>
                    </div>
                    <ConsentStatusBadge record={consent} showCategoryLabel />
                  </div>
                </div>
              )) : (
                <p className="rounded-2xl border border-dashed border-stone-300 bg-[#fcfaf5] p-4 text-sm text-stone-600">
                  No Medicare-side consent records are logged for this client.
                </p>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Compliance flags"
              description="Open and resolved compliance issues connected to the client conversation history."
            />
            <div className="space-y-3">
              {clientFlags.length > 0 ? clientFlags.map((flag) => (
                <div key={flag.id} className="rounded-2xl border border-stone-200 bg-[#fcfaf5] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-ink-950">{flag.flagType.replaceAll("_", " ")}</p>
                      <p className="mt-2 text-sm text-stone-600">{flag.rationale}</p>
                      <p className="mt-2 text-sm text-stone-600">
                        <span className="font-medium text-ink-950">Recommended action:</span> {flag.recommendedAction}
                      </p>
                      <Link
                        href={`/conversations/${flag.conversationId}`}
                        className="mt-3 inline-block text-sm font-medium text-teal-700 hover:text-teal-600"
                      >
                        Open source conversation
                      </Link>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <SeverityBadge value={flag.severity} />
                      <StatusBadge value={flag.status} />
                    </div>
                  </div>
                </div>
              )) : (
                <p className="rounded-2xl border border-dashed border-stone-300 bg-[#fcfaf5] p-4 text-sm text-stone-600">
                  No compliance flags are recorded for this client.
                </p>
              )}
            </div>
          </Card>
        </div>

        <Card>
          <CardHeader
            title="Conversations"
            description="Conversation history with status, routing readiness, and transcript-backed summaries."
          />
          <DataTable>
            <TableHead>
              <tr>
                <Th>Conversation</Th>
                <Th>Status</Th>
                <Th>Routing</Th>
                <Th>Summary</Th>
                <Th>Started</Th>
              </tr>
            </TableHead>
            <tbody>
              {clientConversations.map((conversation) => (
                <tr key={conversation.id}>
                  <Td>
                    <Link href={`/conversations/${conversation.id}`} className="font-medium text-ink-950 hover:text-teal-700">
                      {conversation.id}
                    </Link>
                    <div className="mt-1 text-xs text-stone-500">{conversation.medicareScope}</div>
                  </Td>
                  <Td><StatusBadge value={conversation.status} /></Td>
                  <Td><Badge value={conversation.routingState} tone="neutral" /></Td>
                  <Td>{conversation.summary}</Td>
                  <Td>{formatDateTime(conversation.startedAt)}</Td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        </Card>
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-sky-700">Potential separate follow-up</p>
          <h2 className="mt-2 font-serif text-3xl text-ink-950">Separate, consent-gated workflow</h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-stone-600">
            Retirement-income interest is tracked separately from Medicare operations. This section only documents signals, consent, and human follow-through. It does not imply a product recommendation.
          </p>
        </div>

        {canViewRetirement ? (
          <div className="grid gap-4 xl:grid-cols-2">
            <Card className="border-sky-200 bg-sky-50/40">
              <CardHeader
                title="Opportunity signals"
                description="Potential separate follow-up signals detected from conversations or service notes."
              />
              <div className="space-y-3">
                {clientSignals.length > 0 ? clientSignals.map((signal) => (
                  <div key={signal.id} className="rounded-2xl border border-sky-200 bg-white/80 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-ink-950">{signal.signalType.replaceAll("_", " ")}</p>
                        <p className="mt-2 text-sm text-stone-600">{signal.signalSummary}</p>
                        <p className="mt-2 text-xs text-stone-500">
                          {signal.source.replaceAll("_", " ")} / {formatDateTime(signal.detectedAt)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge value={signal.confidence} tone={signal.confidence === "high" ? "warning" : "info"} />
                        <Badge value={signal.status} tone="neutral" />
                      </div>
                    </div>
                  </div>
                )) : (
                  <p className="rounded-2xl border border-dashed border-sky-200 bg-white/80 p-4 text-sm text-stone-600">
                    No potential separate follow-up signals are logged for this client.
                  </p>
                )}
              </div>
            </Card>

            <Card className="border-sky-200 bg-sky-50/40">
              <CardHeader
                title="Separate consent and workflows"
                description="Follow-up consent and workflow status remain separate from the Medicare conversation."
              />
              <div className="space-y-3">
                <div className="rounded-2xl border border-sky-200 bg-white/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Consent gate</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge value={separateConsentSummary.label} tone={separateConsentSummary.tone} />
                    {separateConsentSummary.tone !== "success" ? (
                      <Badge value="separate follow-up blocked" tone="danger" />
                    ) : null}
                  </div>
                  <p className="mt-3 text-sm text-stone-600">{separateConsentSummary.detail}</p>
                </div>
                {followUpConsents.length > 0 ? followUpConsents.map((consent) => (
                  <div
                    key={consent.id}
                    className={`rounded-2xl border bg-white/80 p-4 ${
                      consent.status === "granted" && consent.evidenceComplete
                        ? "border-sky-200"
                        : "border-amber-300 bg-amber-50/70"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-ink-950">Separate follow-up consent</p>
                        <p className="mt-2 text-sm text-stone-600">
                          {consent.captureMethod} / captured {formatDateTime(consent.capturedAt)}
                        </p>
                        <p className="mt-2 text-xs text-stone-500">
                          Evidence {consent.evidenceRef} / {consent.evidenceComplete ? "complete" : "incomplete"}
                        </p>
                      </div>
                      <ConsentStatusBadge record={consent} showCategoryLabel showBlockerHint />
                    </div>
                  </div>
                )) : (
                  <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50/70 p-4 text-sm text-stone-700">
                    <p className="font-medium text-ink-950">No separate follow-up consent on file.</p>
                    <p className="mt-2">
                      Separate follow-up cannot proceed until explicit consent is recorded and visible in the audit trail.
                    </p>
                  </div>
                )}

                {clientOpportunities.length > 0 ? clientOpportunities.map((workflow) => {
                  const assignedUser = getUserById(state, workflow.assignedUserId);
                  return (
                    <div key={workflow.id} className="rounded-2xl border border-sky-200 bg-white/80 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-ink-950">{workflow.interestSummary}</p>
                          <p className="mt-2 text-sm text-stone-600">
                            <span className="font-medium text-ink-950">Next step:</span> {workflow.nextStep}
                          </p>
                          <p className="mt-2 text-xs text-stone-500">
                            Assigned {assignedUser?.fullName ?? "Awaiting assignment"} / updated {formatDateTime(workflow.lastUpdatedAt)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <StatusBadge value={workflow.status} />
                          <StatusBadge value={workflow.explicitConsentStatus} />
                        </div>
                      </div>
                    </div>
                  );
                }) : (
                  <p className="rounded-2xl border border-dashed border-sky-200 bg-white/80 p-4 text-sm text-stone-600">
                    No separate follow-up workflow is currently open for this client.
                  </p>
                )}
              </div>
            </Card>

            <Card className="border-sky-200 bg-sky-50/40 xl:col-span-2">
              <CardHeader
                title="Tasks"
                description="Operational tasks tied to this client across Medicare work and any separate follow-up workflow."
              />
              <div className="grid gap-4 xl:grid-cols-2">
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Medicare tasks</p>
                  {medicareTasks.length > 0 ? medicareTasks.map((task) => (
                    <div key={task.id} className="rounded-2xl border border-stone-200 bg-white/80 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <strong className="block text-sm text-ink-950">{task.title}</strong>
                          <p className="mt-1 text-sm text-stone-600">
                            {task.queue} / due {formatDateTime(task.dueAt)}
                          </p>
                        </div>
                        <Badge value={task.priority} tone={task.priority === "urgent" ? "danger" : task.priority === "high" ? "warning" : "neutral"} />
                      </div>
                      <select
                        value={task.status}
                        onChange={(event) => actions.updateTaskStatus(task.id, event.target.value as typeof task.status)}
                        className="mt-3 h-10 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm"
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In progress</option>
                        <option value="blocked">Blocked</option>
                        <option value="done">Done</option>
                      </select>
                    </div>
                  )) : (
                    <p className="rounded-2xl border border-dashed border-stone-300 bg-white/80 p-4 text-sm text-stone-600">
                      No Medicare tasks are open for this client.
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Separate follow-up tasks</p>
                  {followUpTasks.length > 0 ? followUpTasks.map((task) => (
                    <div key={task.id} className="rounded-2xl border border-sky-200 bg-white/80 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <strong className="block text-sm text-ink-950">{task.title}</strong>
                          <p className="mt-1 text-sm text-stone-600">
                            due {formatDateTime(task.dueAt)}
                          </p>
                        </div>
                        <Badge value={task.priority} tone={task.priority === "urgent" ? "danger" : task.priority === "high" ? "warning" : "neutral"} />
                      </div>
                      <select
                        value={task.status}
                        onChange={(event) => actions.updateTaskStatus(task.id, event.target.value as typeof task.status)}
                        className="mt-3 h-10 w-full rounded-xl border border-sky-200 bg-white px-3 text-sm"
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In progress</option>
                        <option value="blocked">Blocked</option>
                        <option value="done">Done</option>
                      </select>
                    </div>
                  )) : (
                    <p className="rounded-2xl border border-dashed border-sky-200 bg-white/80 p-4 text-sm text-stone-600">
                      No separate follow-up tasks are open for this client.
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </div>
        ) : (
          <p className="rounded-3xl border border-sky-200 bg-sky-50/40 p-5 text-sm leading-6 text-stone-600">
            Potential separate follow-up stays hidden for this demo user. Authorized roles can review signals, consent, workflows, and follow-up tasks without mixing them into the Medicare workflow.
          </p>
        )}
      </section>

      <Card>
        <CardHeader
          title="Audit timeline"
          description="Recent operational events tied to this client across conversations, consent, tasks, QA, and separate follow-up records."
        />
        <ActivityFeed items={clientActivity.length > 0 ? clientActivity : state.auditEvents.slice(0, 4)} />
      </Card>
    </>
  );
}
