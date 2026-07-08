-- Agent-scoped conversation reads.
--
-- Previously every org member could read every conversation. Agents should see
-- only conversations they own; managers, admins, compliance reviewers, and
-- service staff retain org-wide read (they triage across the whole book).
-- Writes remain org-scoped (unchanged) to avoid breaking existing flows.

-- Returns the public.users.id for the current auth user (NULL if none).
create or replace function public.current_user_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select u.id
  from public.users u
  where u.auth_user_id = auth.uid() and u.is_active = true
  limit 1
$$;

drop policy if exists "org members conversations" on public.conversations;

create policy "conversations scoped read" on public.conversations
for select using (
  organization_id in (select public.current_user_org_ids())
  and (
    'manager' = any (array(select public.current_user_roles()))
    or 'admin' = any (array(select public.current_user_roles()))
    or 'compliance_reviewer' = any (array(select public.current_user_roles()))
    or 'service_staff' = any (array(select public.current_user_roles()))
    or owner_user_id = public.current_user_id()
  )
);

create policy "conversations org insert" on public.conversations
for insert with check (organization_id in (select public.current_user_org_ids()));

create policy "conversations org update" on public.conversations
for update using (organization_id in (select public.current_user_org_ids()))
with check (organization_id in (select public.current_user_org_ids()));

create policy "conversations manager delete" on public.conversations
for delete using (
  organization_id in (select public.current_user_org_ids())
  and (
    'manager' = any (array(select public.current_user_roles()))
    or 'admin' = any (array(select public.current_user_roles()))
  )
);
