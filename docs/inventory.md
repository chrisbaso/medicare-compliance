# Phase 0 Inventory

Date: 2026-04-28

## Summary

The repository is an advanced demo-first Next.js app, not just a scaffold. It already has a professional operations shell, realistic local data, seven main MVP screens, local reducer-driven interactions, compliance guardrail copy, deterministic transcript analysis helpers, and a Postgres-oriented schema reference. It does not yet have Supabase, authentication, RLS, typed environment validation, real persistence, API routes, production LLM integration, tests, or the platform-substrate / vertical-pack folder split requested for the next phases.

`npm run build` succeeds. `npm run lint` is blocked because `next lint` opens an interactive ESLint configuration prompt in this project.

## Files Reviewed

Reviewed all tracked repository files listed by `git ls-files`, plus workspace metadata visible outside `node_modules`, `.git`, and `.next`. `package-lock.json` and `tsconfig.tsbuildinfo` were inspected by metadata because they are generated artifacts; implementation decisions are based on source, config, docs, and schema files.

## Existing Screens

| Route | Current state | Data source | Decision |
|---|---|---|---|
| `/` | Redirects directly to `/dashboard`; no unauthenticated product landing page. | None | Replace with polished public landing page once auth is introduced. |
| `/dashboard` | Operations overview with queue counts, risks, consent visibility, tasks, and separate follow-up signals. | Local `DemoAppProvider` fake data | Keep UI structure; refactor data access behind platform services. |
| `/clients` | Searchable client list with Medicare status, consent state, open tasks, and retirement follow-up summary. | Local state selectors | Keep; thin page further by moving row model logic into `lib/`. |
| `/clients/[id]` | Rich client detail with Medicare operations, consent, conversations, flags, tasks, audit history, and separate follow-up section. | Local state selectors | Keep as demo anchor; refactor into smaller components during persistence work. |
| `/conversations` | Conversation inbox with triage filters and risk/opportunity indicators. | Local state selectors | Keep; add upload/paste transcript entry point in Phase 3a. |
| `/conversations/[id]` | Conversation review surface with summary, compliance table, separate follow-up panel, next actions, and transcript view. | Local state selectors; deterministic precomputed data | Keep; wire to AI review service and inline transcript highlights. |
| `/inbox` | Redirects to `/conversations`. | None | Keep compatibility redirect. |
| `/consents` | Ledger UI with local capture/revoke demo actions and separation between Medicare and separate follow-up consent. | Local reducer state | Keep; change revoke behavior so it appends a new immutable consent record instead of mutating existing records. |
| `/opportunities` | Separate retirement-income follow-up queue with licensed assignment and consent-cleared visibility. | Local reducer state | Keep; map to separate Supabase table and access policy. |
| `/compliance` | QA dashboard with filters, flag status changes, assignment UI, and QA outcome controls. | Local reducer state | Keep; back with compliance flag/review tables and audit events. |
| `/tasks` | Unified task list with queue, source context, assignment, and status changes. | Local reducer state | Keep; persist tasks and generate them from workflow transitions. |

## Workflow Logic

What exists:
- Explicit domain types for users, clients, conversations, consent records, compliance flags, opportunity signals, retirement follow-up workflows, QA reviews, tasks, and audit events.
- Local reducer actions for task status/assignment, conversation status, consent status, follow-up creation, follow-up status/assignment, flag resolution, and QA outcome changes.
- Local audit events are emitted for reducer actions.
- Retirement-income follow-up is visibly separated in navigation, data types, queue filters, consent treatment, and assignment restrictions.
- Deterministic transcript analysis helpers detect Medicare topics, potential cross-sell contamination, missing separate follow-up consent, plan-comparison risk, pressure language, unsupported claims, and unlicensed-activity language.

What is placeholder or incomplete:
- Reducer actions mutate consent records directly; MVP requires immutable consent records with revocation as a new record.
- Audit events lack full before/after state, organization scope, correlation IDs, and durable append-only guarantees.
- Role enforcement is UI-level only and not backed by auth or RLS.
- AI review is deterministic local logic, not a Claude-backed structured review pipeline.
- Transcript review does not yet accept pasted/uploaded transcript text.
- There is no platform substrate under `src/lib/core/` and no vertical pack under `src/lib/verticals/medicare/`.
- Existing `db/schema.sql` is a helpful prototype but is not a Supabase migration with RLS policies or seed data.

## Persistence Assessment

Current state:
- All screens render from in-memory data in `src/lib/fake-data/index.ts` exposed through `DemoAppProvider`.
- `db/schema.sql` and `docs/DATABASE_SCHEMA.md` describe a Postgres-ready model, but nothing is wired to a database.
- No Supabase client, auth helpers, migrations, or RLS policies exist.

Decision:
- Keep existing fake data as demo seed content, but move the source of truth to Supabase migrations and server-side data access helpers.
- Preserve local demo data as fallback fixtures for tests and development where useful.

## Code Quality Assessment

Keep:
- Next.js App Router structure.
- Strict TypeScript configuration.
- Reusable UI primitives in `src/components/ui/`.
- Operational copy and visual separation between Medicare and retirement-income workflow areas.
- Domain model shape as a starting point.
- Deterministic analyzer as a testable fallback and evaluation harness.

Refactor:
- Move core workflow, audit, consent, AI review, RBAC, logging, and reporting primitives into `src/lib/core/`.
- Move Medicare rules, workflows, documents, vocabulary, prompts, and seasonality into `src/lib/verticals/medicare/`.
- Split large route pages into smaller domain components where persistence work would otherwise make them hard to review.
- Replace UI-only role checks with Supabase Auth, RLS, and application-level guards.
- Replace ad hoc audit creation with a shared audit event service that records actor, action, source, before/after state, consent status, and next action.

Rewrite:
- `app/page.tsx` should become a public landing page instead of an unconditional redirect.
- `db/schema.sql` should be superseded by Supabase migrations.
- Consent update behavior should be rewritten to append revocation records rather than mutate captured records.

Skip for now:
- Direct CRM integrations, telephony/audio ingestion, billing, mobile apps, and tax vertical implementation, per scope.

## Verification

- `npm run build`: passed.
- `npm run lint`: blocked by interactive `next lint` setup prompt; logged in `docs/decisions-needed.md`.
