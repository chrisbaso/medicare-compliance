create extension if not exists pgcrypto;

create type public.app_role as enum (
  'admin',
  'manager',
  'agent',
  'compliance_reviewer',
  'service_staff'
);

create type public.license_type as enum (
  'none',
  'medicare_only',
  'life_health',
  'series65_plus'
);

create type public.consent_status as enum ('granted', 'revoked', 'pending', 'expired');
create type public.consent_category as enum ('medicare', 'separate_retirement_follow_up');
create type public.flag_status as enum ('open', 'confirmed', 'dismissed', 'resolved', 'escalated');
create type public.flag_severity as enum ('low', 'medium', 'high', 'critical');
create type public.workflow_domain as enum ('medicare', 'separate_retirement_follow_up');
create type public.task_status as enum ('open', 'in_progress', 'blocked', 'done');
create type public.task_priority as enum ('low', 'normal', 'high', 'urgent');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  timezone text not null default 'America/Chicago',
  vertical_slug text not null default 'medicare',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  full_name text not null,
  email text not null,
  license_type public.license_type not null default 'none',
  team text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, email)
);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (organization_id, user_id, role)
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  dob date,
  phone text,
  email text,
  state text not null,
  preferred_contact_method text not null default 'phone',
  status text not null,
  tags text[] not null default '{}',
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  owner_user_id uuid references public.users(id),
  channel text not null,
  status text not null,
  started_at timestamptz not null,
  ended_at timestamptz,
  summary text,
  medicare_scope text not null,
  routing_state text not null,
  detected_topics text[] not null default '{}',
  retirement_interest_detected boolean not null default false,
  next_step text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.conversation_messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  speaker_type text not null,
  speaker_name text not null,
  utterance text not null,
  spoken_at timestamptz not null,
  sequence_number integer not null check (sequence_number > 0),
  created_at timestamptz not null default now(),
  unique (conversation_id, sequence_number)
);

create table public.consents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  conversation_id uuid references public.conversations(id),
  retirement_opportunity_id uuid,
  consent_type text not null,
  category public.consent_category not null,
  status public.consent_status not null,
  disclosure_version text not null,
  channel text not null,
  captured_at timestamptz not null,
  captured_by_user_id uuid references public.users(id),
  source text not null,
  capture_method text not null,
  evidence_ref text,
  evidence_complete boolean not null default false,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.workflow_states (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  domain public.workflow_domain not null,
  entity_type text not null,
  entity_id uuid not null,
  state text not null,
  updated_by_user_id uuid references public.users(id),
  updated_at timestamptz not null default now(),
  unique (domain, entity_type, entity_id)
);

create table public.workflow_transitions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  workflow_state_id uuid not null references public.workflow_states(id) on delete cascade,
  from_state text not null,
  to_state text not null,
  action text not null,
  actor_user_id uuid references public.users(id),
  source text not null,
  consent_status_snapshot text,
  next_action text,
  created_at timestamptz not null default now()
);

create table public.compliance_flags (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  flag_type text not null,
  severity public.flag_severity not null,
  status public.flag_status not null default 'open',
  rule_id text not null,
  transcript_offset_start integer,
  transcript_offset_end integer,
  quoted_text text,
  reasoning text not null,
  suggested_remediation text not null,
  detected_by text not null,
  assigned_user_id uuid references public.users(id),
  reviewer_user_id uuid references public.users(id),
  reviewer_reason text,
  flagged_at timestamptz not null default now(),
  reviewed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

create table public.retirement_opportunities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  source_conversation_id uuid not null references public.conversations(id),
  signal_type text not null,
  signal_summary text not null,
  status text not null,
  explicit_consent_status public.consent_status not null default 'pending',
  assigned_user_id uuid references public.users(id),
  requested_at timestamptz not null default now(),
  last_updated_at timestamptz not null default now(),
  next_step text not null,
  metadata jsonb not null default '{}'::jsonb
);

alter table public.consents
  add constraint consents_retirement_opportunity_fk
  foreign key (retirement_opportunity_id)
  references public.retirement_opportunities(id);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid references public.clients(id),
  source_type text not null,
  source_id uuid not null,
  title text not null,
  queue text not null,
  status public.task_status not null default 'open',
  priority public.task_priority not null default 'normal',
  assigned_user_id uuid references public.users(id),
  due_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  actor_user_id uuid references public.users(id),
  actor_role text,
  event_at timestamptz not null default now(),
  source text not null,
  correlation_id text not null,
  before_state jsonb,
  after_state jsonb,
  consent_status_snapshot text,
  next_action text,
  detail text not null,
  metadata jsonb not null default '{}'::jsonb
);

create index clients_org_idx on public.clients(organization_id);
create index conversations_org_client_idx on public.conversations(organization_id, client_id);
create index conversations_started_idx on public.conversations(started_at desc);
create index conversation_messages_conversation_idx on public.conversation_messages(conversation_id, sequence_number);
create index consents_org_client_idx on public.consents(organization_id, client_id, captured_at desc);
create index compliance_flags_org_status_idx on public.compliance_flags(organization_id, status, severity);
create index retirement_opportunities_org_status_idx on public.retirement_opportunities(organization_id, status);
create index tasks_org_status_idx on public.tasks(organization_id, status, priority);
create index audit_logs_entity_idx on public.audit_logs(organization_id, entity_type, entity_id, event_at desc);

create or replace function public.current_user_org_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select ur.organization_id
  from public.user_roles ur
  join public.users u on u.id = ur.user_id
  where u.auth_user_id = auth.uid() and u.is_active = true
$$;

create or replace function public.current_user_roles()
returns setof public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select ur.role
  from public.user_roles ur
  join public.users u on u.id = ur.user_id
  where u.auth_user_id = auth.uid() and u.is_active = true
$$;

create or replace function public.prevent_update_delete()
returns trigger
language plpgsql
as $$
begin
  raise exception 'Records in % are append-only and cannot be modified or deleted', tg_table_name;
end;
$$;

create trigger consents_append_only_update
before update on public.consents
for each row execute function public.prevent_update_delete();

create trigger consents_append_only_delete
before delete on public.consents
for each row execute function public.prevent_update_delete();

create trigger audit_logs_append_only_update
before update on public.audit_logs
for each row execute function public.prevent_update_delete();

create trigger audit_logs_append_only_delete
before delete on public.audit_logs
for each row execute function public.prevent_update_delete();

alter table public.organizations enable row level security;
alter table public.users enable row level security;
alter table public.user_roles enable row level security;
alter table public.clients enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_messages enable row level security;
alter table public.consents enable row level security;
alter table public.workflow_states enable row level security;
alter table public.workflow_transitions enable row level security;
alter table public.compliance_flags enable row level security;
alter table public.retirement_opportunities enable row level security;
alter table public.tasks enable row level security;
alter table public.audit_logs enable row level security;

create policy "org members read organizations" on public.organizations
for select using (id in (select public.current_user_org_ids()));

create policy "org members read users" on public.users
for select using (organization_id in (select public.current_user_org_ids()));

create policy "admins manage users" on public.users
for all using (
  organization_id in (select public.current_user_org_ids())
  and 'admin' = any (array(select public.current_user_roles()))
);

create policy "org members read roles" on public.user_roles
for select using (organization_id in (select public.current_user_org_ids()));

create policy "admins manage roles" on public.user_roles
for all using (
  organization_id in (select public.current_user_org_ids())
  and 'admin' = any (array(select public.current_user_roles()))
);

create policy "org members clients" on public.clients
for all using (organization_id in (select public.current_user_org_ids()))
with check (organization_id in (select public.current_user_org_ids()));

create policy "org members conversations" on public.conversations
for all using (organization_id in (select public.current_user_org_ids()))
with check (organization_id in (select public.current_user_org_ids()));

create policy "org members conversation messages" on public.conversation_messages
for all using (organization_id in (select public.current_user_org_ids()))
with check (organization_id in (select public.current_user_org_ids()));

create policy "org members consents insert read" on public.consents
for insert with check (organization_id in (select public.current_user_org_ids()));

create policy "org members consents read" on public.consents
for select using (organization_id in (select public.current_user_org_ids()));

create policy "org members workflow states" on public.workflow_states
for all using (organization_id in (select public.current_user_org_ids()))
with check (organization_id in (select public.current_user_org_ids()));

create policy "org members workflow transitions" on public.workflow_transitions
for all using (organization_id in (select public.current_user_org_ids()))
with check (organization_id in (select public.current_user_org_ids()));

create policy "compliance flags org access" on public.compliance_flags
for all using (organization_id in (select public.current_user_org_ids()))
with check (organization_id in (select public.current_user_org_ids()));

create policy "retirement opportunities restricted read" on public.retirement_opportunities
for select using (
  organization_id in (select public.current_user_org_ids())
  and (
    'admin' = any (array(select public.current_user_roles()))
    or 'manager' = any (array(select public.current_user_roles()))
    or 'compliance_reviewer' = any (array(select public.current_user_roles()))
  )
);

create policy "retirement opportunities restricted write" on public.retirement_opportunities
for all using (
  organization_id in (select public.current_user_org_ids())
  and (
    'admin' = any (array(select public.current_user_roles()))
    or 'manager' = any (array(select public.current_user_roles()))
  )
)
with check (organization_id in (select public.current_user_org_ids()));

create policy "org members tasks" on public.tasks
for all using (organization_id in (select public.current_user_org_ids()))
with check (organization_id in (select public.current_user_org_ids()));

create policy "org members audit insert" on public.audit_logs
for insert with check (organization_id in (select public.current_user_org_ids()));

create policy "org members audit read" on public.audit_logs
for select using (organization_id in (select public.current_user_org_ids()));
