# Database Schema

Source of truth: `supabase/migrations/202604280001_initial_compliance_ops.sql`.

The migration wins over any documentation. This file intentionally mirrors the migration names and columns.

## Verified Migration Properties

- Tenant table: `organizations`
- Message table: `conversation_messages`
- Consent table: `consents`
- Task table: `tasks`
- Audit table: `audit_logs`
- Follow-up table: `retirement_opportunities`
- RLS is enabled on every business table.
- `consents` and `audit_logs` are append-only through `prevent_update_delete()` triggers.

## Enums

### `app_role`

- `admin`
- `manager`
- `agent`
- `compliance_reviewer`
- `service_staff`

### `license_type`

- `none`
- `medicare_only`
- `life_health`
- `series65_plus`

### `consent_status`

- `granted`
- `revoked`
- `pending`
- `expired`

### `consent_category`

- `medicare`
- `separate_retirement_follow_up`

### `flag_status`

- `open`
- `confirmed`
- `dismissed`
- `resolved`
- `escalated`

### `flag_severity`

- `low`
- `medium`
- `high`
- `critical`

### `workflow_domain`

- `medicare`
- `separate_retirement_follow_up`

### `task_status`

- `open`
- `in_progress`
- `blocked`
- `done`

### `task_priority`

- `low`
- `normal`
- `high`
- `urgent`

## Tables

### `organizations`

Columns:
- `id uuid primary key default gen_random_uuid()`
- `name text not null`
- `slug text not null unique`
- `timezone text not null default 'America/Chicago'`
- `vertical_slug text not null default 'medicare'`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

### `users`

Columns:
- `id uuid primary key default gen_random_uuid()`
- `auth_user_id uuid unique`
- `organization_id uuid not null references organizations(id) on delete cascade`
- `full_name text not null`
- `email text not null`
- `license_type license_type not null default 'none'`
- `team text`
- `is_active boolean not null default true`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- unique `(organization_id, email)`

### `user_roles`

Columns:
- `id uuid primary key default gen_random_uuid()`
- `organization_id uuid not null references organizations(id) on delete cascade`
- `user_id uuid not null references users(id) on delete cascade`
- `role app_role not null`
- `created_at timestamptz not null default now()`
- unique `(organization_id, user_id, role)`

### `clients`

Columns:
- `id uuid primary key default gen_random_uuid()`
- `organization_id uuid not null references organizations(id) on delete cascade`
- `first_name text not null`
- `last_name text not null`
- `dob date`
- `phone text`
- `email text`
- `state text not null`
- `preferred_contact_method text not null default 'phone'`
- `status text not null`
- `tags text[] not null default '{}'`
- `note text`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

### `conversations`

Columns:
- `id uuid primary key default gen_random_uuid()`
- `organization_id uuid not null references organizations(id) on delete cascade`
- `client_id uuid not null references clients(id) on delete cascade`
- `owner_user_id uuid references users(id)`
- `channel text not null`
- `status text not null`
- `started_at timestamptz not null`
- `ended_at timestamptz`
- `summary text`
- `medicare_scope text not null`
- `routing_state text not null`
- `detected_topics text[] not null default '{}'`
- `retirement_interest_detected boolean not null default false`
- `next_step text`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

### `conversation_messages`

Columns:
- `id uuid primary key default gen_random_uuid()`
- `organization_id uuid not null references organizations(id) on delete cascade`
- `conversation_id uuid not null references conversations(id) on delete cascade`
- `speaker_type text not null`
- `speaker_name text not null`
- `utterance text not null`
- `spoken_at timestamptz not null`
- `sequence_number integer not null check (sequence_number > 0)`
- `created_at timestamptz not null default now()`
- unique `(conversation_id, sequence_number)`

### `consents`

Columns:
- `id uuid primary key default gen_random_uuid()`
- `organization_id uuid not null references organizations(id) on delete cascade`
- `client_id uuid not null references clients(id) on delete cascade`
- `conversation_id uuid references conversations(id)`
- `retirement_opportunity_id uuid references retirement_opportunities(id)`
- `consent_type text not null`
- `category consent_category not null`
- `status consent_status not null`
- `disclosure_version text not null`
- `channel text not null`
- `captured_at timestamptz not null`
- `captured_by_user_id uuid references users(id)`
- `source text not null`
- `capture_method text not null`
- `evidence_ref text`
- `evidence_complete boolean not null default false`
- `notes text`
- `metadata jsonb not null default '{}'`
- `created_at timestamptz not null default now()`

Append-only:
- `consents_append_only_update`
- `consents_append_only_delete`

### `workflow_states`

Columns:
- `id uuid primary key default gen_random_uuid()`
- `organization_id uuid not null references organizations(id) on delete cascade`
- `domain workflow_domain not null`
- `entity_type text not null`
- `entity_id uuid not null`
- `state text not null`
- `updated_by_user_id uuid references users(id)`
- `updated_at timestamptz not null default now()`
- unique `(domain, entity_type, entity_id)`

### `workflow_transitions`

Columns:
- `id uuid primary key default gen_random_uuid()`
- `organization_id uuid not null references organizations(id) on delete cascade`
- `workflow_state_id uuid not null references workflow_states(id) on delete cascade`
- `from_state text not null`
- `to_state text not null`
- `action text not null`
- `actor_user_id uuid references users(id)`
- `source text not null`
- `consent_status_snapshot text`
- `next_action text`
- `created_at timestamptz not null default now()`

### `compliance_flags`

Columns:
- `id uuid primary key default gen_random_uuid()`
- `organization_id uuid not null references organizations(id) on delete cascade`
- `conversation_id uuid not null references conversations(id) on delete cascade`
- `client_id uuid not null references clients(id) on delete cascade`
- `flag_type text not null`
- `severity flag_severity not null`
- `status flag_status not null default 'open'`
- `rule_id text not null`
- `transcript_offset_start integer`
- `transcript_offset_end integer`
- `quoted_text text`
- `reasoning text not null`
- `suggested_remediation text not null`
- `detected_by text not null`
- `assigned_user_id uuid references users(id)`
- `reviewer_user_id uuid references users(id)`
- `reviewer_reason text`
- `flagged_at timestamptz not null default now()`
- `reviewed_at timestamptz`
- `metadata jsonb not null default '{}'`

### `retirement_opportunities`

Columns:
- `id uuid primary key default gen_random_uuid()`
- `organization_id uuid not null references organizations(id) on delete cascade`
- `client_id uuid not null references clients(id) on delete cascade`
- `source_conversation_id uuid not null references conversations(id)`
- `signal_type text not null`
- `signal_summary text not null`
- `status text not null`
- `explicit_consent_status consent_status not null default 'pending'`
- `assigned_user_id uuid references users(id)`
- `requested_at timestamptz not null default now()`
- `last_updated_at timestamptz not null default now()`
- `next_step text not null`
- `metadata jsonb not null default '{}'`

### `tasks`

Columns:
- `id uuid primary key default gen_random_uuid()`
- `organization_id uuid not null references organizations(id) on delete cascade`
- `client_id uuid references clients(id)`
- `source_type text not null`
- `source_id uuid not null`
- `title text not null`
- `queue text not null`
- `status task_status not null default 'open'`
- `priority task_priority not null default 'normal'`
- `assigned_user_id uuid references users(id)`
- `due_at timestamptz`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

### `audit_logs`

Columns:
- `id uuid primary key default gen_random_uuid()`
- `organization_id uuid not null references organizations(id) on delete cascade`
- `entity_type text not null`
- `entity_id uuid not null`
- `action text not null`
- `actor_user_id uuid references users(id)`
- `actor_role text`
- `event_at timestamptz not null default now()`
- `source text not null`
- `correlation_id text not null`
- `before_state jsonb`
- `after_state jsonb`
- `consent_status_snapshot text`
- `next_action text`
- `detail text not null`
- `metadata jsonb not null default '{}'`

Append-only:
- `audit_logs_append_only_update`
- `audit_logs_append_only_delete`

## RLS Policies

The migration creates helper functions:
- `current_user_org_ids()`
- `current_user_roles()`

RLS policies are organization-scoped for all business tables. `retirement_opportunities` has restricted read/write policies for admin, manager, and compliance reviewer roles.

## Indexes

- `clients_org_idx`
- `conversations_org_client_idx`
- `conversations_started_idx`
- `conversation_messages_conversation_idx`
- `consents_org_client_idx`
- `compliance_flags_org_status_idx`
- `retirement_opportunities_org_status_idx`
- `tasks_org_status_idx`
- `audit_logs_entity_idx`
