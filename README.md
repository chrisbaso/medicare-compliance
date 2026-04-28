# Compliance Ops for Medicare Agencies

Review Medicare conversations, consent, QA flags, tasks, and separate retirement-income handoffs in one audit-ready workspace.

This is not an AI sales bot. It does not recommend Medicare plans, annuities, life insurance, or retirement-income products. AI is used to review transcripts, cite risky language, explain compliance concerns, and route work to humans.

## What the Demo Shows

- Conversation inbox and detail review
- Paste/upload transcript AI compliance review
- Inline transcript flags with human confirm/dismiss reasons
- Scope-of-appointment and consent ledger visibility
- Separate retirement-income follow-up workflow
- Compliance QA dashboard
- Client timeline and unified task list
- Supabase schema, RLS policies, seed data, and append-only audit/consent tables

## Product Guardrails

- Medicare workflows stay operationally separate from retirement-income follow-up.
- Consent records are append-only; revocation creates a new record.
- Audit logs are append-only.
- No autonomous outbound sales.
- Human reviewers own decisions.

## Local Setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Verification

```bash
npm run build
npx tsc --noEmit
```

`npm run lint` is currently blocked by the interactive `next lint` setup prompt. Vitest, Playwright, Supabase SDK, Zod, and Anthropic SDK installation are blocked in this environment by npm cache-only mode; see `docs/decisions-needed.md`.

## Supabase

Apply:

```bash
supabase/migrations/202604280001_initial_compliance_ops.sql
supabase/seed.sql
```

Required environment variables for real Supabase/AI operation:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
APP_ENV=development
```

## Key Docs

- `docs/inventory.md`
- `docs/architecture.md`
- `docs/PRODUCT_SPEC.md`
- `docs/DEMO_SCRIPT.md`
- `docs/COMPLIANCE_RULES.md`
- `docs/operations.md`
- `docs/future-tax-vertical.md`
- `docs/decisions-needed.md`
- `docs/progress.md`
