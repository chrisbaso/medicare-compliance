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
import { formatDateTime } from "@/lib/format";
import {
  getClientById,
  getConversationById,
  getCurrentUser,
  getOpportunityById,
  getRestrictedOpportunityVisibility
} from "@/lib/demo-selectors";

function getCategoryLabel(queue: string) {
  switch (queue) {
    case "intake":
      return "Intake";
    case "service":
      return "Service";
    case "compliance":
      return "Compliance";
    case "follow_up":
      return "Separate follow-up";
    default:
      return "Operations";
  }
}

function getSourceContext(task: {
  sourceType: string;
  sourceId: string;
}) {
  switch (task.sourceType) {
    case "conversation":
      return "Conversation task";
    case "consent":
      return "Consent follow-through";
    case "qa_review":
      return "QA review task";
    case "follow_up_opportunity":
      return "Separate follow-up workflow task";
    default:
      return task.sourceId;
  }
}

export default function TasksPage() {
  const { state, actions } = useDemoApp();
  const canViewRetirement = getRestrictedOpportunityVisibility(getCurrentUser(state));
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");

  const rows = useMemo(
    () =>
      state.tasks
        .filter((task) => {
          const matchesVisibility = canViewRetirement || task.queue !== "follow_up";
          const matchesCategory = categoryFilter === "all" || task.queue === categoryFilter;
          const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
          const matchesStatus = statusFilter === "all" || task.status === statusFilter;
          const matchesOwner = ownerFilter === "all" || task.assignedUserId === ownerFilter;

          return matchesVisibility && matchesCategory && matchesPriority && matchesStatus && matchesOwner;
        })
        .map((task) => {
          const client = getClientById(state, task.clientId);
          const relatedOpportunity =
            task.sourceType === "follow_up_opportunity"
              ? getOpportunityById(state, task.sourceId)
              : undefined;
          const relatedConversation =
            task.sourceType === "conversation"
              ? getConversationById(state, task.sourceId)
              : relatedOpportunity
                ? getConversationById(state, relatedOpportunity.sourceConversationId)
                : undefined;

          return {
            task,
            client,
            relatedConversation,
            relatedOpportunity
          };
        })
        .sort((left, right) => Date.parse(left.task.dueAt) - Date.parse(right.task.dueAt)),
    [canViewRetirement, categoryFilter, ownerFilter, priorityFilter, state, statusFilter]
  );

  return (
    <>
      <PageHeader
        title="Operations tasks"
        description="Usable task list for intake, service, compliance, and separate follow-up work, with source context and ownership kept visible."
      />

      <FilterBar className="lg:[&>div]:grid-cols-5">
        <FilterField label="Category">
          <Select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
            <option value="all">All categories</option>
            <option value="intake">Intake</option>
            <option value="service">Service</option>
            <option value="compliance">Compliance</option>
            {canViewRetirement ? <option value="follow_up">Separate follow-up</option> : null}
          </Select>
        </FilterField>
        <FilterField label="Priority">
          <Select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}>
            <option value="all">All priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="normal">Normal</option>
            <option value="low">Low</option>
          </Select>
        </FilterField>
        <FilterField label="Status">
          <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">All statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In progress</option>
            <option value="blocked">Blocked</option>
            <option value="done">Done</option>
          </Select>
        </FilterField>
        <FilterField label="Assigned user">
          <Select value={ownerFilter} onChange={(event) => setOwnerFilter(event.target.value)}>
            <option value="all">All owners</option>
            {state.users.map((user) => (
              <option key={user.id} value={user.id}>{user.fullName}</option>
            ))}
          </Select>
        </FilterField>
        <div className="flex items-end">
          <div className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-600">
            Showing {rows.length} tasks
          </div>
        </div>
      </FilterBar>

      <Card className="mt-8">
        <CardHeader
          title="Task list"
          description="Assignment and status changes remain local to the demo while keeping client and source-record context visible."
        />
        <DataTable>
          <TableHead>
            <tr>
              <Th>Task title</Th>
              <Th>Client</Th>
              <Th>Related conversation</Th>
              <Th>Related opportunity</Th>
              <Th>Assigned user</Th>
              <Th>Priority</Th>
              <Th>Due date</Th>
              <Th>Status</Th>
              <Th>Category</Th>
              <Th>Actions</Th>
            </tr>
          </TableHead>
          <tbody>
            {rows.map(({ task, client, relatedConversation, relatedOpportunity }) => (
              <tr key={task.id} className="bg-white transition-colors hover:bg-stone-50/80">
                <Td>
                  <div className="space-y-1">
                    <div className="font-medium text-ink-950">{task.title}</div>
                    <div className="text-xs text-stone-500">{getSourceContext(task)}</div>
                  </div>
                </Td>
                <Td>
                  {client ? (
                    <div className="space-y-1">
                      <Link href={`/clients/${client.id}`} className="font-medium text-ink-950 hover:text-teal-700">
                        {client.firstName} {client.lastName}
                      </Link>
                      <div className="text-xs text-stone-500">
                        <Link href={`/clients/${client.id}`} className="hover:text-teal-700">
                          Open client
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <span className="text-stone-400">Unknown client</span>
                  )}
                </Td>
                <Td>
                  {relatedConversation ? (
                    <div className="space-y-1">
                      <Link href={`/conversations/${relatedConversation.id}`} className="font-medium text-ink-950 hover:text-teal-700">
                        {relatedConversation.id}
                      </Link>
                      <div className="text-xs text-stone-500">{relatedConversation.medicareScope}</div>
                      <div className="text-xs text-stone-500">
                        <Link href={`/conversations/${relatedConversation.id}`} className="hover:text-teal-700">
                          Open conversation
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <span className="text-stone-400">No linked conversation</span>
                  )}
                </Td>
                <Td>
                  {relatedOpportunity ? (
                    <div className="space-y-1">
                      <Link href="/opportunities" className="font-medium text-ink-950 hover:text-teal-700">
                        {relatedOpportunity.id}
                      </Link>
                      <div className="text-xs text-stone-500">{relatedOpportunity.status.replaceAll("_", " ")}</div>
                      <div className="text-xs text-stone-500">
                        <Link href="/opportunities" className="hover:text-teal-700">
                          Open retirement-income queue
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <span className="text-stone-400">No linked opportunity</span>
                  )}
                </Td>
                <Td>
                  <AssignmentSelect
                    users={state.users}
                    value={task.assignedUserId}
                    onChange={(userId) => actions.assignTask(task.id, userId)}
                  />
                </Td>
                <Td>
                  <Badge
                    value={task.priority}
                    tone={task.priority === "urgent" ? "danger" : task.priority === "high" ? "warning" : "neutral"}
                  />
                </Td>
                <Td>{formatDateTime(task.dueAt)}</Td>
                <Td>
                  <Select
                    value={task.status}
                    onChange={(event) => actions.updateTaskStatus(task.id, event.target.value as typeof task.status)}
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In progress</option>
                    <option value="blocked">Blocked</option>
                    <option value="done">Done</option>
                  </Select>
                </Td>
                <Td>
                  <Badge value={getCategoryLabel(task.queue)} tone={task.queue === "follow_up" ? "info" : "neutral"} />
                </Td>
                <Td>
                  <div className="flex min-w-[9rem] flex-col gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => actions.updateTaskStatus(task.id, "done")}
                      disabled={task.status === "done"}
                    >
                      Mark complete
                    </Button>
                    {relatedConversation ? (
                      <ButtonLink href={`/conversations/${relatedConversation.id}`} variant="ghost">
                        Open source
                      </ButtonLink>
                    ) : relatedOpportunity ? (
                      <ButtonLink href="/opportunities" variant="ghost">
                        Open queue
                      </ButtonLink>
                    ) : client ? (
                      <ButtonLink href={`/clients/${client.id}`} variant="ghost">
                        Open client
                      </ButtonLink>
                    ) : null}
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
