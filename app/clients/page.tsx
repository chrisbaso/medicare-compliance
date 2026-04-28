"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { useDemoApp } from "@/components/providers/demo-app-provider";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { DataTable, Td, Th, TableHead } from "@/components/ui/data-table";
import { FilterBar, FilterField, Input, Select } from "@/components/ui/filter-bar";
import { formatDateTime } from "@/lib/format";
import {
  getClientConsents,
  getClientConversations,
  getClientOpportunities,
  getClientTasks,
  getCurrentUser,
  getRestrictedOpportunityVisibility
} from "@/lib/demo-selectors";
import {
  getClientAge,
  getClientPrimaryNeed,
  getConsentSummary,
  getLatestConversation,
  getOpenTaskCount,
  getOpportunitySummary
} from "@/lib/client-view";
import { ConsentStatusBadge } from "@/components/ui/consent-status-badge";

export default function ClientsPage() {
  const { state } = useDemoApp();
  const router = useRouter();
  const canViewRetirement = getRestrictedOpportunityVisibility(getCurrentUser(state));
  const [query, setQuery] = useState("");
  const [stateFilter, setStateFilter] = useState("all");
  const [clientStatus, setClientStatus] = useState("all");
  const [focusFilter, setFocusFilter] = useState("all");

  const rows = useMemo(
    () =>
      state.clients.map((client) => {
        const conversations = getClientConversations(state, client.id);
        const consentRecords = getClientConsents(state, client.id);
        const openTasks = getClientTasks(state, client.id);
        const opportunities = getClientOpportunities(state, client.id);
        const openFlags = state.complianceFlags.filter(
          (flag) => flag.clientId === client.id && flag.status === "open"
        );
        const visibleConsentRecords = canViewRetirement
          ? consentRecords
          : consentRecords.filter((record) => record.consentType !== "retirement_follow_up");
        const medicareConsents = visibleConsentRecords.filter(
          (record) => record.consentType !== "retirement_follow_up"
        );
        const separateFollowUpConsents = visibleConsentRecords.filter(
          (record) => record.consentType === "retirement_follow_up"
        );
        const latestConversation = getLatestConversation(conversations);
        const medicareConsentSummary = getConsentSummary(medicareConsents, "medicare");
        const separateConsentSummary = canViewRetirement
          ? getConsentSummary(separateFollowUpConsents, "separate_follow_up")
          : null;
        const opportunitySummary = getOpportunitySummary(opportunities, canViewRetirement);

        return {
          id: client.id,
          name: `${client.firstName} ${client.lastName}`,
          email: client.email,
          state: client.state,
          clientStatus: client.status,
          age: getClientAge(client.dob),
          primaryNeed: getClientPrimaryNeed(client, conversations),
          lastConversationDate: latestConversation?.startedAt,
          consentSummary: medicareConsentSummary,
          medicareConsentSummary,
          separateConsentSummary,
          separateFollowUpConsents,
          openTasks: getOpenTaskCount(openTasks),
          opportunitySummary,
          hasFlag: openFlags.length > 0
        };
      }),
    [canViewRetirement, state]
  );

  const filteredClients = useMemo(
    () =>
      rows.filter((row) => {
        const matchesQuery =
          row.name.toLowerCase().includes(query.toLowerCase()) ||
          row.email.toLowerCase().includes(query.toLowerCase()) ||
          row.primaryNeed.toLowerCase().includes(query.toLowerCase());
        const matchesState = stateFilter === "all" || row.state === stateFilter;
        const matchesClientStatus =
          clientStatus === "all" || row.clientStatus === clientStatus;
        const matchesFocus =
          focusFilter === "all" ||
          (focusFilter === "consent_attention" &&
            row.consentSummary.tone !== "success") ||
          (focusFilter === "open_tasks" && row.openTasks > 0) ||
          (focusFilter === "potential_follow_up" &&
            row.opportunitySummary.label !== "none" &&
            row.opportunitySummary.label !== "restricted") ||
          (focusFilter === "flagged" && row.hasFlag);

        return (
          matchesQuery &&
          matchesState &&
          matchesClientStatus &&
          matchesFocus
        );
      }),
    [clientStatus, focusFilter, query, rows, stateFilter]
  );

  return (
    <>
      <PageHeader
        title="Client list"
        description="Operational client directory with Medicare status, last-touch visibility, consent readiness, open work, and separate follow-up status."
      />

      <FilterBar className="lg:[&>div]:grid-cols-5">
        <FilterField label="Search">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by client, email, or primary need"
          />
        </FilterField>
        <FilterField label="State">
          <Select value={stateFilter} onChange={(event) => setStateFilter(event.target.value)}>
            <option value="all">All states</option>
            {[...new Set(rows.map((row) => row.state))].map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </Select>
        </FilterField>
        <FilterField label="Medicare status">
          <Select value={clientStatus} onChange={(event) => setClientStatus(event.target.value)}>
            <option value="all">All statuses</option>
            <option value="new_to_medicare">New to Medicare</option>
            <option value="active_review">Active review</option>
            <option value="service_only">Service only</option>
            <option value="watch">Watch</option>
          </Select>
        </FilterField>
        <FilterField label="Operational focus">
          <Select value={focusFilter} onChange={(event) => setFocusFilter(event.target.value)}>
            <option value="all">All clients</option>
            <option value="consent_attention">Consent attention</option>
            <option value="open_tasks">Open tasks</option>
            <option value="flagged">Compliance flagged</option>
            {canViewRetirement ? (
              <option value="potential_follow_up">Potential separate follow-up</option>
            ) : null}
          </Select>
        </FilterField>
        <div className="flex items-end">
          <div className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-600">
            Showing {filteredClients.length} of {rows.length} clients
          </div>
        </div>
      </FilterBar>

      <Card>
        <CardHeader
          title="Clients"
          description="Rows combine Medicare workflow status with consent, task, and separate follow-up visibility for quick triage."
        />
        <DataTable>
          <TableHead>
            <tr>
              <Th>Name</Th>
              <Th>Age / Medicare status</Th>
              <Th>Primary need</Th>
              <Th>Last conversation date</Th>
              <Th>Consent status</Th>
              <Th>Open tasks</Th>
              <Th>Opportunity status</Th>
            </tr>
          </TableHead>
          <tbody>
            {filteredClients.map((client) => (
              <tr
                key={client.id}
                className="cursor-pointer transition hover:bg-white/70"
                onClick={() => router.push(`/clients/${client.id}`)}
              >
                <Td>
                  <Link href={`/clients/${client.id}`} className="font-medium text-ink-950 hover:text-teal-700">
                    {client.name}
                  </Link>
                  <div className="mt-1 text-xs text-stone-500">{client.email}</div>
                  <div className="mt-1 text-xs text-stone-500">{client.state}</div>
                </Td>
                <Td>
                  <div className="flex flex-wrap gap-2">
                    <Badge value={`${client.age}`} tone="neutral" />
                    <Badge
                      value={client.clientStatus}
                      tone={client.clientStatus === "watch" ? "warning" : "info"}
                    />
                  </div>
                </Td>
                <Td className="max-w-sm">
                  <div className="font-medium text-ink-950">{client.primaryNeed}</div>
                </Td>
                <Td>
                  {client.lastConversationDate ? (
                    <span>{formatDateTime(client.lastConversationDate)}</span>
                  ) : (
                    <span className="text-stone-500">No conversation logged</span>
                  )}
                </Td>
                <Td>
                  <div className="space-y-2">
                    <Badge
                      value={`Medicare: ${client.medicareConsentSummary.label}`}
                      tone={client.medicareConsentSummary.tone}
                    />
                    <div className="text-xs text-stone-500">
                      {client.medicareConsentSummary.detail}
                    </div>
                    {canViewRetirement ? (
                      <div className="rounded-2xl border border-sky-200 bg-sky-50/60 p-2">
                        {client.separateFollowUpConsents[0] ? (
                          <ConsentStatusBadge
                            record={client.separateFollowUpConsents[0]}
                            showCategoryLabel
                            showBlockerHint
                          />
                        ) : (
                          <Badge
                            value={`Separate follow-up: ${client.separateConsentSummary?.label ?? "blocked"}`}
                            tone={client.separateConsentSummary?.tone ?? "warning"}
                          />
                        )}
                        <div className="mt-2 text-xs text-stone-500">
                          {client.separateConsentSummary?.detail}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </Td>
                <Td>
                  <div className="space-y-2">
                    <div className="font-medium text-ink-950">{client.openTasks}</div>
                    <div className="text-xs text-stone-500">
                      {client.openTasks === 1 ? "open task" : "open tasks"}
                    </div>
                  </div>
                </Td>
                <Td>
                  <div className="space-y-2">
                    <Badge
                      value={client.opportunitySummary.label}
                      tone={client.opportunitySummary.tone}
                    />
                    <div className="text-xs text-stone-500">
                      {client.opportunitySummary.detail}
                    </div>
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
