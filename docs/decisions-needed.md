# Decisions Needed

This file records unresolved owner actions and decisions. Resolved troubleshooting history has been removed so the remaining items are actionable.

## Current Environment Status

- Branch in use: `main`.
- Git push from this Codex session is working.
- npm package installation is working against `https://registry.npmjs.org/`.
- `npm run build`, `npm run typecheck`, `npm run lint`, and `npm test` have passed in this environment after the SDK/auth foundation changes.

## Owner Actions Required

### Configure a live Supabase project

- Needed for: exercising migrations, RLS policies, Supabase Auth, append-only triggers, and real audited writes.
- Current state: schema and seed SQL exist locally, but no live Supabase project URL/keys are configured in this environment.
- Required env vars:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

### Link seeded users to Supabase Auth users

- Needed for: real sign-in resolving to `public.users`, `public.user_roles`, and tenant-scoped RLS.
- Current state: `supabase/seed.sql` creates app users, but `auth_user_id` is null because Auth users must be created in a real Supabase project.
- Required action after creating Auth users: update each seeded `public.users.auth_user_id` with the matching `auth.users.id`.
- Impact if skipped: Supabase Auth can authenticate a browser session, but server helpers will return no app user/organization because the Auth identity is not mapped to the tenant user table.

### Configure Anthropic for live AI review

- Needed for: real model-backed compliance review.
- Current state: the official Anthropic SDK is wired, but no API key is configured here.
- Required env var:
  - `ANTHROPIC_API_KEY`

## Product Decisions Made

### Preserve the current demo UI shell while replacing infrastructure

- Decision: Keep the existing screens and reducer-backed demo state until each slice is replaced with real Supabase-backed behavior.
- Reason: The UI already preserves the Medicare / retirement-income separation and provides a usable demo shell while infrastructure is made real incrementally.
