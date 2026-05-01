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

## What is scaffolded but not wired

- Supabase schema and seed SQL exist, but no live Supabase project is connected from this environment.
- Supabase SDK wiring is not complete yet. The official packages are installed, but the app still needs to replace the previous REST scaffolding.
- Anthropic SDK wiring is not complete yet. The official package is installed, but the app still needs to replace the previous fetch implementation.
- Authentication is scaffolded visually, but not wired end-to-end to a durable Supabase session.
- AI review on the conversation page is not an end-to-end audited Supabase + Anthropic workflow.
- Audit and consent append-only behavior exists in SQL migrations and local helper logic, but has not been exercised against a live database from this environment.

## What is not started

- Replacing hand-rolled Supabase REST scaffolding throughout the app with `@supabase/supabase-js` and `@supabase/ssr`.
- Replacing the Anthropic REST scaffold throughout the app with `@anthropic-ai/sdk`.
- Zod/t3-env-based environment validation.
- Real Supabase Auth middleware/session integration.
- The `/api/conversations/[id]/review` route that reads Supabase data, calls Anthropic, writes `compliance_flags`, and writes `audit_logs`.
- The `insert_review_results` Postgres RPC migration.
- Vitest migration and Playwright e2e coverage.
- Real ESLint migration.
- Integration tests against local Supabase/Postgres.

## Current blockers and caveats

- No live Supabase project is configured in this environment, so migrations and RLS cannot be exercised against a real database here.
- `npm audit` reports two moderate vulnerabilities through `next` -> bundled `postcss`. The critical Next advisory was removed by upgrading `next` from 15.3.1 to 15.5.15. npm currently suggests a breaking downgrade to `next@9.3.3` for the remaining bundled PostCSS advisory, so that was not applied.

## Resolved environment blocker

Package installation previously failed because npm was in offline/cache-only mode. It was fixed by setting:

```text
registry=https://registry.npmjs.org/
offline=false
prefer-offline=false
```

SDK installation now succeeds.
