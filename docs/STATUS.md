# STATUS

Date: 2026-05-01

## What works today (verified)

- `npm install` completes for the current dependency set.
- `npm run build` passes.
- `npm run typecheck` passes.
- `npm test` passes using the current in-process contract test runner. This is temporary and will be replaced by Vitest in this session.
- Official packages are now installed: `@supabase/supabase-js`, `@supabase/ssr`, `@anthropic-ai/sdk`, `zod`, `@t3-oss/env-nextjs`, `vitest`, `@vitest/ui`, `@playwright/test`, `eslint`, and `eslint-config-next`.
- The app builds as a Next.js demo shell with in-memory state.
- The existing UI surfaces conversation review, consent ledger, retirement-income follow-up separation, compliance dashboard, client views, and tasks from local demo data.
- The deterministic AI review fallback exists locally and can return preview flags without a live Anthropic key.
- `src/lib/core/supabase/browser.ts`, `src/lib/core/supabase/server.ts`, and `src/lib/core/supabase/service.ts` use the official Supabase SDK helpers.
- `src/lib/core/llm/anthropic.ts` uses the official Anthropic SDK behind the existing `LlmProvider` interface.
- Environment validation now uses `@t3-oss/env-nextjs` and `zod`, with server-only secrets isolated from browser imports.
- Auth middleware refreshes Supabase sessions and redirects protected routes to `/sign-in` when Supabase is configured.
- Server-side auth helpers can resolve the current Supabase Auth user to `public.users`, `public.user_roles`, and `public.organizations`.
- The sign-in form uses Supabase Auth and redirects to `/dashboard`; `/sign-out` clears the Supabase session.
- `POST /api/conversations/[id]/review` reads conversation transcript and consent state from Supabase, runs the AI review pipeline server-side, and persists Anthropic-backed flags through a Postgres RPC.
- `supabase/migrations/202604300001_review_rpc.sql` adds the transactional `insert_review_results` function for compliance flags plus audit logging.
- `/conversations/[id]` now renders a Supabase-backed review surface for UUID conversation IDs while preserving the existing local demo component for legacy `conv-*` demo IDs.

## What is scaffolded but not wired

- Supabase schema and seed SQL exist, but no live Supabase project is connected from this environment.
- Repository helpers use typed Supabase clients, but most screens still render local demo state instead of querying Supabase.
- The reducer-backed demo state now accepts the authenticated user as the current actor, but the screens still read most business data from local demo fixtures.
- Seeded app users are not linked to `auth.users` yet because no live Supabase project exists in this environment.
- AI review code is wired end-to-end for Supabase + Anthropic, but it has not been executed against a live Supabase project from this environment.
- Audit and consent append-only behavior exists in SQL migrations and local helper logic, but has not been exercised against a live database from this environment.

## What is not started

- Vitest migration and Playwright e2e coverage.
- Real ESLint migration.
- Integration tests against local Supabase/Postgres.

## Current blockers and caveats

- No live Supabase project is configured in this environment, so migrations and RLS cannot be exercised against a real database here.
- `supabase/seed.sql` app users have null `auth_user_id` values until the owner creates Supabase Auth users and links them.
- `npm audit` reports two moderate vulnerabilities through `next` -> bundled `postcss`. The critical Next advisory was removed by upgrading `next` from 15.3.1 to 15.5.15. npm currently suggests a breaking downgrade to `next@9.3.3` for the remaining bundled PostCSS advisory, so that was not applied.

## Resolved environment blocker

Package installation previously failed because npm was in offline/cache-only mode. It was fixed by setting:

```text
registry=https://registry.npmjs.org/
offline=false
prefer-offline=false
```

SDK installation now succeeds.
