-- Per-organization AI review rate limiting.
--
-- Records one row per AI compliance-review call so a daily per-org budget can be
-- enforced before invoking the (paid) AI provider. Org-scoped RLS from creation.

create table public.review_call_log (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  called_at timestamptz not null default now()
);

create index review_call_log_org_day_idx
  on public.review_call_log(organization_id, called_at);

alter table public.review_call_log enable row level security;

create policy "review call log org insert" on public.review_call_log
for insert with check (organization_id in (select public.current_user_org_ids()));

create policy "review call log org read" on public.review_call_log
for select using (organization_id in (select public.current_user_org_ids()));
