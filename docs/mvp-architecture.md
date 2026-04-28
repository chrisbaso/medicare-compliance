# Compliance-First Medicare Ops MVP

## 1. MVP Architecture

### Product Shape
The MVP is an internal operations platform for Medicare agencies. It is not a sales assistant and it should not produce product recommendations. The system exists to help staff review conversations, verify consent, route work, identify compliance risks, and isolate non-Medicare follow-up opportunities into a separate human-controlled workflow.

### Architectural Approach
- Frontend: Next.js App Router with TypeScript
- UI strategy: componentized operations dashboard with shared layout, tables, badges, timelines, and workflow panels
- Data layer: Postgres-ready relational schema, but demo data is served from in-repo TypeScript fixtures first
- State model: explicit workflow states and compliance statuses instead of implicit booleans wherever possible
- Trust model: compliance guardrails represented in both data design and UI language

### Core Domains
1. Agencies and users
2. Clients and households
3. Conversations and transcripts
4. Consent events and consent evidence
5. Compliance flags and QA reviews
6. Workflow tasks and assignments
7. Separate retirement-income follow-up opportunities

### Guardrails
- Medicare workflow and retirement-income workflow must remain separate objects with separate status, ownership, and consent history.
- A conversation can indicate retirement-income interest, but that signal must only create a separate follow-up opportunity.
- Retirement-income follow-up requires explicit consent and assignment to a licensed human before any outreach.
- No module should generate plan recommendations, annuity recommendations, or mixed-script suggestions.

## 2. Proposed Database Schema

### Main Tables
- `agencies`
  - `id`, `name`, `slug`, `timezone`, `created_at`
- `users`
  - `id`, `agency_id`, `full_name`, `email`, `role`, `license_type`, `status`, `created_at`
- `clients`
  - `id`, `agency_id`, `first_name`, `last_name`, `dob`, `phone`, `email`, `state`, `preferred_contact_method`, `created_at`
- `client_households`
  - `id`, `agency_id`, `primary_client_id`, `household_name`
- `conversations`
  - `id`, `agency_id`, `client_id`, `channel`, `started_at`, `ended_at`, `agent_user_id`, `status`, `summary`, `medicare_scope`, `retirement_interest_detected`
- `transcript_entries`
  - `id`, `conversation_id`, `speaker_type`, `speaker_name`, `utterance`, `spoken_at`, `sequence_number`
- `consent_records`
  - `id`, `agency_id`, `client_id`, `conversation_id`, `consent_type`, `status`, `captured_at`, `capture_method`, `evidence_ref`, `expires_at`
- `compliance_flags`
  - `id`, `agency_id`, `conversation_id`, `client_id`, `flag_type`, `severity`, `status`, `detected_by`, `flagged_at`, `notes`
- `qa_reviews`
  - `id`, `agency_id`, `conversation_id`, `reviewer_user_id`, `score`, `outcome`, `reviewed_at`, `summary`
- `qa_review_findings`
  - `id`, `qa_review_id`, `category`, `result`, `notes`
- `workflow_tasks`
  - `id`, `agency_id`, `client_id`, `conversation_id`, `task_type`, `queue`, `status`, `priority`, `assigned_user_id`, `due_at`, `created_at`
- `follow_up_opportunities`
  - `id`, `agency_id`, `client_id`, `source_conversation_id`, `type`, `status`, `interest_summary`, `explicit_consent_status`, `assigned_user_id`, `created_at`
- `audit_events`
  - `id`, `agency_id`, `entity_type`, `entity_id`, `action`, `actor_user_id`, `event_at`, `metadata`

### Key Enums
- `user.role`: `manager`, `agent`, `service`, `admin`
- `user.license_type`: `none`, `medicare_only`, `life_health`, `series65_plus`
- `conversation.status`: `new`, `in_review`, `routed`, `closed`
- `consent_type`: `contact`, `recording`, `soa`, `retirement_follow_up`
- `consent.status`: `granted`, `revoked`, `pending`, `expired`
- `flag_type`: `missing_consent`, `cross_sell_risk`, `unsupported_claim`, `needs_human_review`
- `flag.severity`: `low`, `medium`, `high`, `critical`
- `qa.outcome`: `pass`, `pass_with_notes`, `escalate`
- `follow_up.status`: `detected`, `awaiting_consent`, `ready_for_assignment`, `assigned`, `completed`, `closed_no_action`

### Relationship Notes
- One client can have many conversations, consents, flags, tasks, and follow-up opportunities.
- One conversation can have many transcript entries, flags, tasks, and at most many QA reviews over time.
- Follow-up opportunities may only reference a source conversation and never inherit Medicare workflow status directly.

## 3. App Routes / Pages

### Core Routes
- `/`
  - Agency dashboard with operational metrics, flagged conversations, pending consents, and follow-up queue summary
- `/inbox`
  - Conversation inbox with summaries, status, compliance flags, and routing actions
- `/conversations/[conversationId]`
  - Conversation detail with transcript, summary, consent snapshot, flags, and recommended operational next steps
- `/consents`
  - Consent ledger across clients and conversations
- `/opportunities`
  - Separate retirement-income follow-up workflow board and queue
- `/compliance`
  - QA review queue, flagged items, reviewer workload, and recent determinations
- `/clients/[clientId]`
  - Basic client detail page with profile, recent conversations, consent history, flags, and open work

### Future Routes
- `/tasks`
- `/team`
- `/settings`
- `/admin`

## 4. Main Reusable Components

### App Shell
- `AppShell`
- `SidebarNav`
- `TopBar`
- `PageHeader`

### Shared Data Display
- `MetricCard`
- `StatusBadge`
- `FlagBadge`
- `SectionCard`
- `DataTable`
- `EmptyState`

### Domain Components
- `ConversationInboxList`
- `TranscriptPanel`
- `ConsentLedgerTable`
- `ConsentStatusPill`
- `OpportunityBoard`
- `ComplianceQueueTable`
- `ClientSummaryPanel`
- `TimelineList`
- `AssignmentChip`

## 5. Sample Seed Data Needed

### Agency and Team
- 1 demo agency
- 4 users: manager, Medicare agent, service rep, compliance reviewer

### Clients
- 6-10 clients with varied states, contact methods, and conversation history

### Conversations
- 10-15 conversations across phone and intake channels
- mix of clean, missing-consent, and cross-sell-risk examples

### Transcript Patterns
- Medicare-only conversation
- conversation missing recording consent
- conversation where client mentions retirement income or annuity curiosity
- conversation that correctly routes that interest into a separate follow-up opportunity

### Consents
- contact consent
- recording consent
- SOA or Medicare-related intake consent
- separate retirement follow-up consent with both pending and granted examples

### QA and Workflow
- flagged conversations in different severities
- open QA reviews
- tasks assigned to manager, agent, and service staff
- 3-5 follow-up opportunities in different statuses

## 6. Risks / Ambiguities

- Regulatory boundaries vary by state and by exact agency workflow, so compliance rules will need legal review before production.
- The exact definition of valid consent artifacts may differ across phone, web intake, and text channels.
- Role permissions are still broad; future admin and FMO views need a stricter authorization model.
- Transcript summaries and compliance flags are demo-only for now; later AI-assisted review must be tightly constrained and auditable.
- We need product decisions on whether service staff can view retirement follow-up opportunities or only managers and licensed staff.
- The MVP needs clear copy standards so the UI never sounds like it is recommending products.
