-- Role-gated RLS hardening.
--
-- The initial schema granted every organization member unrestricted read/write
-- (FOR ALL) on sensitive tables. This narrows destructive and privileged
-- operations to appropriate roles while preserving organization isolation.
-- Idempotent: policies are dropped-if-exists before recreation.
--
-- Scope of THIS migration (low-risk, behavior-preserving for normal reads):
--   * clients          — UPDATE restricted to agent/manager/admin; DELETE admin-only
--   * compliance_flags — UPDATE restricted to reviewer/manager/admin; DELETE denied
--   * tasks            — DELETE restricted to manager/admin
-- Read/insert access is unchanged (still org-scoped) so existing screens keep working.
-- (Agent-scoped conversation SELECT is deferred to a follow-up that can be
--  behaviorally tested against the app to avoid breaking agent workflows.)

-- Helper predicate reused below: caller is in the row's org.
-- (Expressed inline to avoid coupling to a new SQL function.)

------------------------------------------------------------------------------
-- clients
------------------------------------------------------------------------------
drop policy if exists "org members clients" on public.clients;

create policy "clients org read" on public.clients
for select using (organization_id in (select public.current_user_org_ids()));

create policy "clients org insert" on public.clients
for insert with check (organization_id in (select public.current_user_org_ids()));

create policy "clients staff update" on public.clients
for update using (
  organization_id in (select public.current_user_org_ids())
  and (
    'agent' = any (array(select public.current_user_roles()))
    or 'manager' = any (array(select public.current_user_roles()))
    or 'admin' = any (array(select public.current_user_roles()))
  )
)
with check (organization_id in (select public.current_user_org_ids()));

create policy "clients admin delete" on public.clients
for delete using (
  organization_id in (select public.current_user_org_ids())
  and 'admin' = any (array(select public.current_user_roles()))
);

------------------------------------------------------------------------------
-- compliance_flags
------------------------------------------------------------------------------
drop policy if exists "compliance flags org access" on public.compliance_flags;

create policy "compliance flags org read" on public.compliance_flags
for select using (organization_id in (select public.current_user_org_ids()));

create policy "compliance flags org insert" on public.compliance_flags
for insert with check (organization_id in (select public.current_user_org_ids()));

-- Only reviewers/managers/admins may change a flag's status or reviewer fields.
create policy "compliance flags reviewer update" on public.compliance_flags
for update using (
  organization_id in (select public.current_user_org_ids())
  and (
    'compliance_reviewer' = any (array(select public.current_user_roles()))
    or 'manager' = any (array(select public.current_user_roles()))
    or 'admin' = any (array(select public.current_user_roles()))
  )
)
with check (organization_id in (select public.current_user_org_ids()));

-- No DELETE policy on compliance_flags: deletion is denied for everyone (audit integrity).

------------------------------------------------------------------------------
-- tasks
------------------------------------------------------------------------------
drop policy if exists "org members tasks" on public.tasks;

create policy "tasks org read" on public.tasks
for select using (organization_id in (select public.current_user_org_ids()));

create policy "tasks org insert" on public.tasks
for insert with check (organization_id in (select public.current_user_org_ids()));

create policy "tasks org update" on public.tasks
for update using (organization_id in (select public.current_user_org_ids()))
with check (organization_id in (select public.current_user_org_ids()));

create policy "tasks manager delete" on public.tasks
for delete using (
  organization_id in (select public.current_user_org_ids())
  and (
    'manager' = any (array(select public.current_user_roles()))
    or 'admin' = any (array(select public.current_user_roles()))
  )
);
