# Compliance Ops for Medicare Agencies

Book intelligence, conversation compliance review, and a compliant
retirement-lead pipeline for independent Medicare agencies — in one
audit-ready workspace.

This is not an AI sales bot. It never recommends Medicare plans, annuities,
life insurance, or retirement-income products. AI reviews transcripts, cites
risky language, explains compliance concerns, and routes work to humans.
Retirement-adjacent signals are walled off until a separate, documented
consent exists, then handled in a licensed-role-gated workflow.

## What the platform does

- **Book onboarding** (`/onboarding`) — import a book of business from four
  CRM export formats: auto-detection, row-by-row validation report,
  duplicate detection, all-or-nothing commit.
- **Book intelligence** (`/book`) — eight-rule scoring of the whole book into
  a prioritized outreach queue (turning-65 windows, premium pressure, life
  events, missing documents, stale contacts) with plain-English reasons.
- **Retirement pipeline** (`/retirement-pipeline`) — the compliant funnel:
  signal on file → separate consent captured → licensed workflow, with
  outcome economics (placements, premium, commission).
- **AI compliance review** (`POST /api/conversations/[id]/review`) — nine
  CMS-grounded rules; flags queue for human confirm/dismiss with documented
  reasons; deterministic fallback engine when no AI key is configured.
- **Audit-prep pack** (`/audit-pack`) — date-ranged, print-ready examiner
  report: consent coverage, flag dispositions, separation integrity, and a
  self-identified gap list.

## Product guardrails

- Medicare workflows stay operationally separate from retirement-income
  follow-up; the AI polices the boundary and a blocking flag actually blocks.
- Consent records and audit logs are append-only (database triggers).
- Row-level security isolates organizations and gates destructive or
  privileged operations by role — proven by a behavioral test suite in CI.
- Beneficiary names are redacted before any transcript reaches the AI
  provider. A BAA with the provider is still required before real data.

## Local development

```bash
npm install
npm run dev          # demo mode: full UI on local demo data, no accounts needed
```

With Docker and the Supabase CLI installed, run against a live local stack:

```bash
npm run setup:dev    # boots local Supabase, applies migrations + seed, links auth users
npm run dev
```

Configuration: copy `.env.example` to `.env.local`. With no Supabase vars the
app runs in demo mode; pages that support live data show a "Demo data" badge.

## Verification

```bash
npm run verify       # typecheck + compliance lint + unit & contract tests + build
```

CI (GitHub Actions) additionally boots a live local Supabase and runs the
behavioral RLS suite (`scripts/rls-integration-test.mjs`) on every push.

## Going to production

Follow `docs/PRODUCTION_CUTOVER.md`. The two human gates are a BAA with the
AI provider and production secrets; everything else is scripted.

## Key docs

- `docs/STATUS.md` — current, verified state of the platform
- `docs/architecture.md` — substrate vs vertical-pack design
- `docs/COMPLIANCE_RULES.md` — the enforced rule set
- `docs/DEMO_VIDEO_SCRIPTS.md` — sales & training demo scripts + demo data kit
- `docs/PRODUCTION_CUTOVER.md` — production checklist
- `CODEX_RUNBOOK.md` — automated build/verification harness for agents
