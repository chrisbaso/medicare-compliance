create table agencies (
  id text primary key,
  name text not null,
  slug text not null unique,
  timezone text not null default 'America/Chicago',
  created_at timestamptz not null default now()
);

create table users (
  id text primary key,
  agency_id text not null references agencies(id),
  full_name text not null,
  email text not null unique,
  role text not null check (role in ('manager', 'agent', 'service', 'compliance')),
  license_type text not null check (license_type in ('none', 'medicare_only', 'life_health', 'series65_plus')),
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table clients (
  id text primary key,
  agency_id text not null references agencies(id),
  first_name text not null,
  last_name text not null,
  dob date,
  phone text,
  email text,
  state text,
  preferred_contact_method text,
  created_at timestamptz not null default now()
);

create table conversations (
  id text primary key,
  agency_id text not null references agencies(id),
  client_id text not null references clients(id),
  channel text not null,
  started_at timestamptz not null,
  ended_at timestamptz,
  agent_user_id text references users(id),
  status text not null check (status in ('new', 'in_review', 'routed', 'closed')),
  summary text not null,
  medicare_scope text not null,
  routing_state text not null check (routing_state in ('awaiting_review', 'ready_to_route', 'blocked', 'complete')),
  detected_topics text[] not null default '{}',
  retirement_interest_detected boolean not null default false
);

create table transcript_entries (
  id text primary key,
  conversation_id text not null references conversations(id) on delete cascade,
  speaker_type text not null,
  speaker_name text,
  utterance text not null,
  spoken_at timestamptz not null,
  sequence_number integer not null
);

create table consent_records (
  id text primary key,
  agency_id text not null references agencies(id),
  client_id text not null references clients(id),
  conversation_id text references conversations(id),
  linked_opportunity_id text,
  consent_type text not null check (consent_type in ('contact', 'recording', 'soa', 'retirement_follow_up')),
  status text not null check (status in ('granted', 'revoked', 'pending', 'expired')),
  captured_at timestamptz not null,
  capture_method text not null,
  evidence_ref text,
  evidence_complete boolean not null default false,
  expires_at timestamptz
);

create table compliance_flags (
  id text primary key,
  agency_id text not null references agencies(id),
  conversation_id text not null references conversations(id),
  client_id text not null references clients(id),
  flag_type text not null check (flag_type in ('missing_consent', 'cross_sell_risk', 'unsupported_claim', 'needs_human_review')),
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  status text not null check (status in ('open', 'resolved', 'dismissed')),
  detected_by text not null check (detected_by in ('system', 'human')),
  flagged_at timestamptz not null,
  rationale text
);

create table qa_reviews (
  id text primary key,
  agency_id text not null references agencies(id),
  conversation_id text not null references conversations(id),
  reviewer_user_id text not null references users(id),
  score integer not null,
  outcome text not null check (outcome in ('pass', 'pass_with_notes', 'escalate')),
  reviewed_at timestamptz not null,
  summary text not null
);

create table workflow_tasks (
  id text primary key,
  agency_id text not null references agencies(id),
  client_id text references clients(id),
  source_type text not null check (source_type in ('conversation', 'consent', 'qa_review', 'follow_up_opportunity')),
  source_id text not null,
  title text not null,
  queue text not null,
  status text not null check (status in ('open', 'in_progress', 'blocked', 'done')),
  priority text not null check (priority in ('low', 'normal', 'high', 'urgent')),
  assigned_user_id text references users(id),
  due_at timestamptz,
  created_at timestamptz not null default now()
);

create table follow_up_opportunities (
  id text primary key,
  agency_id text not null references agencies(id),
  client_id text not null references clients(id),
  source_conversation_id text not null references conversations(id),
  type text not null check (type in ('retirement_income_follow_up')),
  status text not null check (status in ('detected', 'awaiting_consent', 'ready_for_assignment', 'assigned', 'completed', 'closed_no_action')),
  interest_summary text not null,
  explicit_consent_status text not null check (explicit_consent_status in ('missing', 'pending', 'granted', 'revoked')),
  assigned_user_id text references users(id),
  created_at timestamptz not null default now()
);

create table audit_events (
  id text primary key,
  agency_id text not null references agencies(id),
  entity_type text not null check (entity_type in ('conversation', 'consent', 'task', 'follow_up_opportunity', 'qa_review')),
  entity_id text not null,
  action text not null,
  actor_user_id text references users(id),
  event_at timestamptz not null,
  detail text not null,
  metadata jsonb not null default '{}'::jsonb
);
