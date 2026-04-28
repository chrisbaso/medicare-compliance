"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { analyzeTranscript } from "@/lib/analysis/analyzeTranscript";
import { Button, ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { useDemoApp } from "@/components/providers/demo-app-provider";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { DataTable, Td, Th, TableHead } from "@/components/ui/data-table";
import { SeverityBadge } from "@/components/ui/severity-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { getTranscriptHighlights } from "@/lib/compliance/rules";
import { getConversationReviewState } from "@/lib/conversation-view";
import {
  getClientById,
  getConversationById,
  getConversationConsents,
  getConversationFlags,
  getConversationOpportunity,
  getConversationQaReview,
  getConversationTranscript,
  getCurrentUser,
  getRestrictedOpportunityVisibility,
  getUserById
} from "@/lib/demo-selectors";
import { formatDateTime, titleize } from "@/lib/format";

export default function ConversationDetailPage() {
  const params = useParams<{ id: string }>();
  const { state, actions } = useDemoApp();
  const [demoNotice, setDemoNotice] = useState<string | null>(null);
  const [localTasks, setLocalTasks] = useState<
    { id: string; title: string; createdAt: string }[]
  >([]);
  const conversation = getConversationById(state, params.id);

  if (!conversation) {
    return null;
  }

  const activeConversation = conversation;
  const client = getClientById(state, activeConversation.clientId);
  const owner = getUserById(state, activeConversation.ownerUserId);
  const currentUser = getCurrentUser(state);
  const canCreateSeparateFollowUp = getRestrictedOpportunityVisibility(currentUser);
  const consents = getConversationConsents(state, activeConversation.id);
  const flags = getConversationFlags(state, activeConversation.id);
  const transcript = getConversationTranscript(state, activeConversation.id);
  const opportunity = getConversationOpportunity(state, activeConversation.id);
  const review = getConversationQaReview(state, activeConversation.id);
  const transcriptSummary = state.transcriptSummaries.find(
    (summary) => summary.conversationId === activeConversation.id
  );
  const reviewState = getConversationReviewState({
    conversation: activeConversation,
    flags,
    consents,
    review,
    transcriptSummary
  });
  const analysis = useMemo(
    () =>
      analyzeTranscript({
        transcript,
        channel: activeConversation.channel,
        conversationType: activeConversation.medicareScope,
        consentRecords: consents,
        hasExistingFollowUpWorkflow: Boolean(opportunity)
      }),
    [activeConversation.channel, activeConversation.medicareScope, consents, opportunity, transcript]
  );
  const highSeverityReview = analysis.complianceFlags.some(
    (flag) => flag.severity === "critical" || flag.severity === "high"
  );
  const separateConsentRecord = consents.find(
    (record) => record.consentType === "retirement_follow_up"
  );
  const separateConsentGranted =
    separateConsentRecord?.status === "granted" && separateConsentRecord.evidenceComplete;

  function handleCreateTask() {
    const nextTask = {
      id: `local-task-${localTasks.length + 1}`,
      title: `Demo task: ${analysis.recommendedNextAction}`,
      createdAt: new Date().toISOString()
    };

    setLocalTasks((current) => [nextTask, ...current]);
    setDemoNotice("Local demo task created for this conversation review.");
  }

  function handleMarkReviewed() {
    if (highSeverityReview) {
      actions.updateConversationStatus(activeConversation.id, "in_review");
      setDemoNotice(
        "Conversation kept in review because high-severity compliance items still require human attention."
      );
      return;
    }

    actions.updateConversationStatus(activeConversation.id, "routed");
    setDemoNotice(
      "Conversation marked reviewed in demo state and moved forward for operational follow-through."
    );
  }

  function handleRequestConsent() {
    if (!analysis.opportunitySignals.length) {
      setDemoNotice(
        "No separate consent request is needed because no separate follow-up signal is currently detected."
      );
      return;
    }

    if (!separateConsentRecord) {
      setDemoNotice(
        "Create the separate follow-up workflow first so the demo can open a consent request record."
      );
      return;
    }

    if (separateConsentGranted) {
      setDemoNotice("Separate consent is already recorded for this conversation.");
      return;
    }

    actions.updateConsentStatus(separateConsentRecord.id, "pending");
    setDemoNotice("Separate consent request refreshed in demo state.");
  }

  function handleCreateSeparateFollowUp() {
    if (!analysis.opportunitySignals.length) {
      setDemoNotice(
        "No separate follow-up workflow is needed because no retirement-income signal is currently detected."
      );
      return;
    }

    if (!canCreateSeparateFollowUp) {
      setDemoNotice("This demo user cannot create a separate follow-up workflow.");
      return;
    }

    if (opportunity) {
      setDemoNotice("A separate follow-up workflow already exists for this conversation.");
      return;
    }

    actions.createFollowUpFromConversation(activeConversation.id);
    setDemoNotice(
      "Separate follow-up workflow created in demo state with consent still required before outreach."
    );
  }

  return (
    <>
      <PageHeader
        title={client ? `${client.firstName} ${client.lastName}` : `Conversation ${activeConversation.id}`}
        description="Flagship conversation review surface for managers. It keeps operational context, compliance review, transcript evidence, and separate follow-up handling visible in one place without blurring Medicare and retirement-income work."
        actions={
          <>
            <ButtonLink href="/conversations" variant="secondary">
              Back to inbox
            </ButtonLink>
            {client ? (
              <ButtonLink href={`/clients/${client.id}`} variant="ghost">
                Open client
              </ButtonLink>
            ) : null}
          </>
        }
      />

      {demoNotice ? (
        <div className="rounded-2xl border border-teal-200 bg-teal-50 px-5 py-4 text-sm leading-6 text-teal-900">
          {demoNotice}
        </div>
      ) : null}

      <Card className="overflow-hidden border-stone-200 bg-gradient-to-br from-white via-[#fcfaf5] to-teal-50/40">
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <CardHeader
              eyebrow="Conversation command center"
              title="Header and review context"
              description="This top section anchors the record with client, owner, timing, workflow status, and the immediate review posture before anyone takes action."
            />

            <div className="flex flex-wrap gap-2">
              <Badge value={reviewState.label} tone={reviewState.tone} />
              <StatusBadge value={activeConversation.status} />
              <Badge
                value={activeConversation.routingState.replaceAll("_", " ")}
                tone={activeConversation.routingState === "blocked" ? "danger" : "neutral"}
              />
              {analysis.opportunitySignals.length > 0 ? (
                <Badge value="Separate follow-up detected" tone="info" className="normal-case" />
              ) : null}
            </div>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <MetadataPanel
                label="Client"
                value={client ? `${client.firstName} ${client.lastName}` : "Client record"}
                detail={
                  client
                    ? `${client.state} | Preferred contact: ${titleize(client.preferredContactMethod)}`
                    : "No linked client profile"
                }
              />
              <MetadataPanel
                label="Date / time"
                value={formatDateTime(activeConversation.startedAt)}
                detail={`Ended ${formatDateTime(activeConversation.endedAt)}`}
              />
              <MetadataPanel
                label="Channel"
                value={titleize(activeConversation.channel)}
                detail="Original intake or conversation source"
              />
              <MetadataPanel
                label="Conversation type"
                value={activeConversation.medicareScope}
                detail="Recorded Medicare workflow scope"
              />
              <MetadataPanel
                label="Assigned user"
                value={owner?.fullName ?? "Unassigned"}
                detail={
                  owner
                    ? `${titleize(owner.role)} | ${titleize(owner.team)}`
                    : "No owner assigned yet"
                }
              />
              <MetadataPanel
                label="Review status"
                value={titleize(reviewState.label)}
                detail={reviewState.detail}
              />
            </section>
          </div>

          <div className="space-y-4 rounded-3xl border border-stone-200 bg-white/75 p-5">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-stone-500">
                Review spotlight
              </p>
              <h2 className="mt-2 font-serif text-3xl text-ink-950">
                {titleize(reviewState.label)}
              </h2>
              <p className="mt-3 text-sm leading-6 text-stone-700">{reviewState.detail}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <MetricTile
                label="Open compliance flags"
                value={String(analysis.complianceFlags.length)}
                tone={analysis.complianceFlags.length > 0 ? "danger" : "neutral"}
              />
              <MetricTile
                label="Transcript entries"
                value={String(transcript.length)}
                tone="neutral"
              />
              <MetricTile
                label="Separate consent"
                value={separateConsentGranted ? "Clear" : "Pending"}
                tone={separateConsentGranted ? "success" : "warning"}
              />
              <MetricTile
                label="Workflow status"
                value={opportunity ? "Created" : "Not created"}
                tone={opportunity ? "info" : "neutral"}
              />
            </div>

            <div className="rounded-2xl border border-stone-200 bg-[#fcfaf5] p-4">
              <p className="text-[11px] uppercase tracking-[0.2em] text-stone-500">
                Immediate next step
              </p>
              <p className="mt-2 text-sm leading-6 text-stone-700">
                {analysis.recommendedNextAction}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader
            eyebrow="AI-style summary"
            title="Conversation summary"
            description="Deterministic mock analysis turns the transcript into a neutral operations summary for staff review. It does not recommend Medicare plans or annuities."
          />

          <div className="grid gap-4 lg:grid-cols-2">
            <SummaryBlock title="Short summary" body={analysis.summary} />
            <SummaryBlock title="Client intent" body={analysis.clientIntent} />
            <SummaryList title="Key facts" items={analysis.keyFacts} />
            <SummaryList title="Unresolved items" items={analysis.unresolvedItems} />
          </div>

          <div className="mt-4 rounded-2xl border border-stone-200 bg-[#fcfaf5] p-5">
            <p className="text-[11px] uppercase tracking-[0.2em] text-stone-500">
              Recommended next action
            </p>
            <p className="mt-3 text-sm leading-6 text-stone-700">
              {analysis.recommendedNextAction}
            </p>
          </div>
        </Card>

        <Card>
          <CardHeader
            eyebrow="Next actions"
            title="Action panel"
            description="These demo actions help a reviewer move the conversation forward while respecting consent and compliance state."
          />

          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleCreateTask}>Create task</Button>
              <Button
                variant="secondary"
                onClick={handleMarkReviewed}
                className={highSeverityReview ? "ring-1 ring-rose-200" : undefined}
              >
                Mark reviewed
              </Button>
              <Button
                variant="secondary"
                onClick={handleRequestConsent}
                className={!analysis.opportunitySignals.length ? "opacity-70" : undefined}
              >
                Request consent
              </Button>
              <Button
                variant="ghost"
                onClick={handleCreateSeparateFollowUp}
                className={
                  analysis.opportunitySignals.length
                    ? "border border-sky-200 bg-sky-50 text-sky-900 hover:bg-sky-100"
                    : "border border-stone-200 opacity-70"
                }
              >
                Create separate follow-up workflow
              </Button>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-[#fcfaf5] p-5">
              <p className="text-[11px] uppercase tracking-[0.2em] text-stone-500">
                Action guidance
              </p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-stone-700">
                <li>
                  {highSeverityReview
                    ? "High-severity compliance items are open, so marking reviewed will keep this conversation in review rather than clearing it."
                    : "No high-severity compliance block is currently forcing the conversation to stay in manual review."}
                </li>
                <li>
                  {analysis.opportunitySignals.length
                    ? separateConsentGranted
                      ? "Separate consent is already recorded for the detected retirement-income signal."
                      : "Separate consent is not fully complete yet, so any separate follow-up still requires consent handling first."
                    : "No separate follow-up signal is currently detected, so consent and workflow actions may not be needed."}
                </li>
                <li>
                  {opportunity
                    ? "A separate follow-up workflow already exists for this conversation."
                    : "No separate follow-up workflow has been created yet."}
                </li>
              </ul>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-stone-200 bg-[#fcfaf5] p-5">
                <p className="text-[11px] uppercase tracking-[0.2em] text-stone-500">
                  Current state
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge value={reviewState.label} tone={reviewState.tone} />
                  <Badge
                    value={separateConsentGranted ? "Consent clear" : "Consent pending"}
                    tone={separateConsentGranted ? "success" : "warning"}
                    className="normal-case"
                  />
                  <Badge
                    value={opportunity ? "Workflow created" : "Workflow not created"}
                    tone={opportunity ? "info" : "neutral"}
                    className="normal-case"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-stone-200 bg-[#fcfaf5] p-5">
                <p className="text-[11px] uppercase tracking-[0.2em] text-stone-500">
                  Demo task activity
                </p>
                {localTasks.length > 0 ? (
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-stone-700">
                    {localTasks.map((task) => (
                      <li key={task.id}>
                        <span className="font-medium text-ink-950">{task.title}</span>
                        <span className="text-stone-500">
                          {" "}
                          | {formatDateTime(task.createdAt)}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm leading-6 text-stone-600">
                    No local demo tasks have been created from this panel yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        </Card>
      </section>

      <section
        className={
          analysis.opportunitySignals.length > 0
            ? "grid gap-4 xl:grid-cols-[1.05fr_0.95fr]"
            : "grid gap-4"
        }
      >
        <Card>
          <CardHeader
            eyebrow="Compliance review"
            title="Compliance flags"
            description="This panel highlights review items surfaced by the mock analyzer. It supports human review and remediation planning, not legal or regulatory decision-making."
          />

          {analysis.complianceFlags.length > 0 ? (
            <DataTable>
              <TableHead>
                <tr>
                  <Th>Severity</Th>
                  <Th>Rule key</Th>
                  <Th>Explanation</Th>
                  <Th>Remediation guidance</Th>
                  <Th>Status</Th>
                </tr>
              </TableHead>
              <tbody>
                {analysis.complianceFlags.map((flag) => {
                  const isHighSeverity =
                    flag.severity === "critical" || flag.severity === "high";

                  return (
                    <tr
                      key={`${flag.ruleKey}-${flag.explanation}`}
                      className={isHighSeverity ? "bg-rose-50/60" : undefined}
                    >
                      <Td>
                        <SeverityBadge value={flag.severity} />
                      </Td>
                      <Td>
                        <span className="font-medium text-ink-950">{flag.ruleKey}</span>
                      </Td>
                      <Td className="max-w-sm">
                        <p className="leading-6 text-stone-700">{flag.explanation}</p>
                      </Td>
                      <Td className="max-w-sm">
                        <p className="leading-6 text-stone-700">{flag.remediationGuidance}</p>
                      </Td>
                      <Td>
                        <StatusBadge value={flag.status} />
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </DataTable>
          ) : (
            <div className="rounded-2xl border border-dashed border-stone-300 bg-[#fcfaf5] p-5">
              <p className="text-sm leading-6 text-stone-600">
                No compliance flags are currently surfaced for this conversation.
              </p>
            </div>
          )}
        </Card>

        {analysis.opportunitySignals.length > 0 ? (
          <Card className="border-sky-200 bg-sky-50/40">
            <CardHeader
              eyebrow="Separate follow-up required"
              title="Retirement-income signal"
              description="This signal stays separate from Medicare workflow handling. Any next step requires the right consent state and licensed human review."
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <SignalPanelBlock
                label="Detected signal"
                value={titleize(
                  analysis.opportunitySignals[0].signalType.replaceAll("_", " ")
                )}
                detail={analysis.opportunitySignals[0].summary}
              />
              <SignalPanelBlock
                label="Confidence"
                value={`${Math.round(analysis.confidenceScore * 100)}%`}
                detail="Deterministic mock confidence based on transcript evidence and matched rules."
              />
              <SignalPanelBlock
                label="Separate consent"
                value={getConsentLabel(analysis.opportunitySignals[0].consentStatus)}
                detail={
                  analysis.opportunitySignals[0].consentStatus === "granted"
                    ? "Separate consent exists for follow-up outside the Medicare workflow."
                    : "Consent required before any separate follow-up can move forward."
                }
              />
              <SignalPanelBlock
                label="Workflow created"
                value={analysis.opportunitySignals[0].workflowCreated ? "Created" : "Not created"}
                detail={
                  analysis.opportunitySignals[0].workflowCreated
                    ? "A separate follow-up workflow is already on record."
                    : "No separate workflow has been created yet."
                }
              />
            </div>

            <div className="mt-4 rounded-2xl border border-sky-200 bg-white/80 p-5">
              <p className="text-[11px] uppercase tracking-[0.2em] text-sky-700">
                Next recommended action
              </p>
              <p className="mt-3 text-sm leading-6 text-stone-700">
                {getSignalRecommendedAction(
                  analysis.opportunitySignals[0].consentStatus,
                  analysis.opportunitySignals[0].workflowCreated
                )}
              </p>
            </div>
          </Card>
        ) : null}
      </section>

      <Card>
        <CardHeader
          eyebrow="Transcript review"
          title="Transcript viewer"
          description="Readable transcript view for fast review, with lightweight highlighting for risky phrases and separate follow-up signals."
          actions={
            <div className="flex flex-wrap gap-2">
              <Badge value="Review phrase" tone="info" />
              <Badge value="Signal phrase" tone="warning" />
            </div>
          }
        />

        {transcript.length > 0 ? (
          <div className="space-y-3">
            {transcript.map((entry) => {
              const highlights = getTranscriptHighlights(entry.utterance);
              const hasRisk = highlights.riskMatches.length > 0;
              const hasOpportunity = highlights.opportunityMatches.length > 0;

              return (
                <article
                  key={entry.id}
                  className={[
                    "rounded-2xl border p-4",
                    entry.speakerType === "client"
                      ? "border-stone-200 bg-[#fcfaf5]"
                      : entry.speakerType === "system"
                        ? "border-amber-200 bg-amber-50"
                        : "border-stone-200 bg-white"
                  ].join(" ")}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-ink-950">{entry.speakerName}</p>
                      <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-stone-500">
                        {titleize(entry.speakerType)}
                      </p>
                    </div>
                    <p className="text-xs text-stone-500">
                      {entry.spokenAt ? formatDateTime(entry.spokenAt) : "Time not recorded"}
                    </p>
                  </div>

                  {hasRisk || hasOpportunity ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {hasRisk ? <Badge value="Review phrase" tone="info" /> : null}
                      {hasOpportunity ? <Badge value="Signal phrase" tone="warning" /> : null}
                    </div>
                  ) : null}

                  <div className="mt-3 text-sm leading-7 text-stone-700">
                    {renderHighlightedUtterance(entry.utterance)}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-[#fcfaf5] p-5">
            <p className="text-sm leading-6 text-stone-600">
              No transcript entries are currently recorded for this conversation.
            </p>
          </div>
        )}
      </Card>
    </>
  );
}

function MetadataPanel({
  label,
  value,
  detail
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white/80 p-5">
      <p className="text-[11px] uppercase tracking-[0.2em] text-stone-500">{label}</p>
      <p className="mt-3 font-medium text-ink-950">{value}</p>
      <p className="mt-2 text-sm leading-6 text-stone-600">{detail}</p>
    </div>
  );
}

function SummaryBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-[#fcfaf5] p-5">
      <p className="text-[11px] uppercase tracking-[0.2em] text-stone-500">{title}</p>
      <p className="mt-3 text-sm leading-6 text-stone-700">{body}</p>
    </div>
  );
}

function SummaryList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-[#fcfaf5] p-5">
      <p className="text-[11px] uppercase tracking-[0.2em] text-stone-500">{title}</p>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-stone-700">
        {items.map((item) => (
          <li key={`${title}-${item}`} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-stone-400" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SignalPanelBlock({
  label,
  value,
  detail
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-sky-200 bg-white/80 p-5">
      <p className="text-[11px] uppercase tracking-[0.2em] text-sky-700">{label}</p>
      <p className="mt-3 font-medium text-ink-950">{value}</p>
      <p className="mt-2 text-sm leading-6 text-stone-600">{detail}</p>
    </div>
  );
}

function MetricTile({
  label,
  value,
  tone
}: {
  label: string;
  value: string;
  tone: "neutral" | "success" | "warning" | "danger" | "info";
}) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-[#fcfaf5] p-4">
      <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">{label}</p>
      <div className="mt-3 flex items-center gap-3">
        <p className="font-serif text-3xl text-ink-950">{value}</p>
        <Badge value={tone} tone={tone} className="normal-case" />
      </div>
    </div>
  );
}

function getConsentLabel(consentStatus: string) {
  if (consentStatus === "granted") {
    return "Exists";
  }

  if (consentStatus === "pending") {
    return "Pending";
  }

  if (consentStatus === "revoked") {
    return "Revoked";
  }

  return "Consent required";
}

function getSignalRecommendedAction(consentStatus: string, workflowCreated: boolean) {
  if (consentStatus !== "granted") {
    return "Separate follow-up required. Consent required before any outreach, and the next step should remain with licensed human review.";
  }

  if (!workflowCreated) {
    return "Create the separate follow-up workflow and route it for licensed human review outside the Medicare conversation path.";
  }

  return "Keep the follow-up separate from the Medicare workflow and continue with licensed human review.";
}

function renderHighlightedUtterance(text: string) {
  const { riskMatches, opportunityMatches } = getTranscriptHighlights(text);
  const matchedTokens = [...new Set([...riskMatches, ...opportunityMatches])]
    .sort((left, right) => right.length - left.length)
    .map((token) => token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

  if (matchedTokens.length === 0) {
    return text;
  }

  const pattern = new RegExp(`(${matchedTokens.join("|")})`, "gi");

  return text.split(pattern).map((segment, index) => {
    const normalized = segment.toLowerCase();

    if (riskMatches.includes(normalized)) {
      return (
        <span key={`${segment}-${index}`} className="rounded bg-sky-100 px-1 text-sky-900">
          {segment}
        </span>
      );
    }

    if (opportunityMatches.includes(normalized)) {
      return (
        <span key={`${segment}-${index}`} className="rounded bg-amber-100 px-1 text-amber-900">
          {segment}
        </span>
      );
    }

    return <span key={`${segment}-${index}`}>{segment}</span>;
  });
}
