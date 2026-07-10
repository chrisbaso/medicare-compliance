# STATUS

Date: 2026-07-10
Branch: `review/full-audit` (contains everything below; `main` is behind — merge when ready)

## What works today (verified by CI on every push)

- `npm run verify` = typecheck + compliance lint + 119 unit tests (Vitest) +
  6 contract tests + Next.js production build. Green.
- GitHub Actions CI boots a **live local Supabase**, applies all migrations,
  seeds, links auth users, runs `verify`, and then runs a **behavioral RLS
  suite** (role gating, org isolation, conversation scoping, atomic rate
  limit, outcome recording permissions). Green.
- **Security spine:** auth enforced on all `/api/*` routes (401 JSON),
  role-gated RLS (agents cannot delete clients / override flags / record
  outcomes), transcript PII sanitization before the AI provider,
  prompt-injection hardening with a post-generation content check, per-org
  daily AI rate limit (atomic RPC), explicit table grants.
- **Book Intelligence:** CSV ingest for four CRM export formats
  (`/onboarding`: auto-detect, dry-run report, all-or-nothing commit,
  duplicate detection with re-import skip) → eight-rule opportunity scoring →
  prioritized outreach queue (`/book`, live data with demo fallback).
- **Retirement pipeline** (`/retirement-pipeline`): compliant funnel
  signal → separate consent → licensed workflow, with outcome economics
  (placements, premium written, commission) recorded via
  `POST /api/opportunities/[id]/outcome` and displayed on the page.
- **Audit-prep pack** (`/audit-pack`): date-ranged, print-ready examiner
  report from live records — consent coverage, flag dispositions,
  separation integrity, self-identified gap list.
- **AI review:** `POST /api/conversations/[id]/review` on `claude-sonnet-5`
  (env-overridable via `AI_REVIEW_MODEL`); deterministic fallback covers all
  nine catalog rules when no key is configured.
- Demo kit: `docs/DEMO_VIDEO_SCRIPTS.md` + `test-fixtures/demo-book*.csv`,
  with tests pinning the demo's on-screen behavior.

## Screens still on local demo state (not yet live-wired)

Dashboard, clients list/detail, conversations inbox, consents, compliance QA,
tasks, opportunities. (`/book`, `/audit-pack`, `/retirement-pipeline`, and
`/conversations/[id]` are live-wired with demo fallback.)

## Owner actions required before production (see docs/PRODUCTION_CUTOVER.md)

1. BAA with the AI provider (legal) — gates real beneficiary data only.
2. Production Supabase project + secrets in the deploy environment.
3. Production hosting under the BAA chain (AWS route recommended).

## Known debt

- Compliance rules are hard-coded TypeScript — annual CMS updates require a
  deploy (rules-as-data is the planned fix).
- Ingest commit path and outcome route are proven via RLS/CI, not by an
  end-to-end HTTP integration test.
- No transcription pipeline (deferred until an owned agency has recordings).
