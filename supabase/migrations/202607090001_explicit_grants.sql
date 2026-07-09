-- Explicit table/function privileges for API roles.
--
-- RLS policies restrict WHICH rows a role can touch; GRANTs establish THAT the
-- role may touch the table at all. The original schema relied on legacy
-- Supabase default-privilege behavior; newer stacks do not auto-grant to
-- authenticated on migration-created tables (observed in CI as
-- 'permission denied for table ...' 42501, failing closed). Make the model
-- explicit:
--   * authenticated: table DML + function execute — row access still fully
--     gated by RLS policies and append-only triggers.
--   * anon: schema usage only, NO table access (unauthenticated users have no
--     data access; sign-in happens through the auth API, not these tables).
--   * service_role: full access (server-side only).

grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete on all tables in schema public
  to authenticated, service_role;

grant usage, select on all sequences in schema public
  to authenticated, service_role;

grant execute on all functions in schema public
  to authenticated, service_role;

-- Future tables/functions created by migrations get the same treatment.
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated, service_role;
alter default privileges in schema public
  grant usage, select on sequences to authenticated, service_role;
alter default privileges in schema public
  grant execute on functions to authenticated, service_role;
