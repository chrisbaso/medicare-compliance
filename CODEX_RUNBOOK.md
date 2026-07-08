# Codex Automated Runbook — Security & Test Spine

**Goal:** Execute the entire security + test spine with **zero human steps except two** (call them out loudly, then continue around them). This runbook is written to be run by an autonomous coding agent (Codex) from a fresh clone.

**Branch:** `review/full-audit`
**Definition of done:** all 7 spine items merged, `npm run verify` green in CI, decision log updated.

---

## The only two things a human must do (everything else is automated)

| Human gate | Why it can't be automated | Does it block the build? |
|---|---|---|
| **Sign a BAA with the AI provider** | Legal signature | ❌ No — dev/test uses the mock LLM provider and sanitized inputs. Blocks only *production* use with real PHI. |
| **Set production secrets** (`SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, prod URL) | Live-account credentials | ❌ No — dev/test uses a **local** Supabase stack + mock provider, fully scripted. Blocks only *production deploy*. |

Everything previously called a "prerequisite" (live DB, auth-user linking) is now automated by `npm run setup:dev`. Codex does **not** wait on a human to build and verify the spine.

---

## Session Zero — automated environment bootstrap (run first, always)

```bash
npm run setup:dev      # idempotent: installs deps, starts local Supabase,
                       # applies migrations, seeds, links seed users to auth
npm run verify         # typecheck + lint + test + build — must be green before coding
```

`setup:dev` wraps:
1. `npm ci`
2. `supabase start` (local Postgres + Auth + Storage via Docker — no dashboard, no account)
3. `supabase db reset` (applies every migration in `supabase/migrations/` + `supabase/seed.sql`)
4. `node scripts/link-auth-users.mjs` (creates auth users for the 4 seed staff and writes their `auth_user_id` — automates old prerequisite **P2**)

If Docker is unavailable in the environment, `setup:dev` prints the one required host capability and exits non-zero — that is the *only* infra dependency.

---

## Ordered execution (Codex runs these as sequential commits)

Each step: implement → `npm run verify` → commit → append a one-line decision-log entry. Never proceed on red.

### Step 0 — Toolchain & CI scaffold  *(automatable prereq P4+P5)*
- Add `vitest` + config; add `.github/workflows/ci.yml`; pin Node via `.nvmrc`.
- Add `npm run verify` = `typecheck && lint && test && build`.
- Resolve the PostCSS/Next advisory noted in `docs/STATUS.md` (`npm audit fix` or pin).
- **Done when:** CI runs green on the branch; `npm run verify` passes locally.

### Step 1 — Enforce auth on all `/api/*` routes
- Per `docs/IMPLEMENTATION_PLAN_SECURITY_SPINE.md` Item 1.
- **Verify:** integration test — unauthenticated `POST /api/conversations/:id/review` → 401 before handler.

### Step 2 — Executable test spine
- Plan Item 5. Real unit tests for `deterministic-review`, `validate-output`, `rules`.
- **Verify:** 100% line coverage on those two modules; tests execute real code.
- *(Moved ahead of RLS so items 2/6/7 are provable as they land.)*

### Step 3 — Role-gated RLS
- Plan Item 2. New migration; split broad `FOR ALL` policies.
- **Verify:** RLS integration tests (against local Supabase) — agent-role cannot DELETE client or UPDATE flag status; compliance_reviewer can; cross-org access returns nothing.

### Step 4 — Transcript PII sanitization
- Plan Item 3. `transcript-sanitizer.ts` + wire into `review-service.ts`.
- **Verify:** mock provider receives sanitized text; offsets restore correctly.

### Step 5 — Per-org rate limiting
- Plan Item 4. `review_call_log` table + `rate-limit.ts`.
- **Verify:** over-limit → 429; other orgs unaffected; env override honored.

### Step 6 — Enforce `blocksWorkflow`
- Plan Item 6. Guard terminal transitions on open blocking flags.
- **Verify:** terminal transition with open blocking flag throws; succeeds once resolved.

### Step 7 — Deterministic engine 9-rule parity
- Plan Item 7. Add 5 missing rules; reconcile orphaned rule ids/flag types; report all matches.
- **Verify:** every emitted flag maps to a catalog rule; all 9 rules covered.

---

## Continuous gates (enforced by CI on every commit)

- `npm run verify` must pass.
- No PII in logs (lint rule: no `console.log` of `utterance`/`speaker_name`/`transcript` — add to `compliance-lint.mjs`).
- No new `FOR ALL` RLS policy without a role predicate (extend `compliance-lint.mjs` migration checks).
- Every new table has `enable row level security` + an org-scoped policy in the same migration.

---

## Autonomy policy for Codex

- **Proceed automatically** through Steps 0–7 as long as each `npm run verify` is green and the change matches the plan's do-not-touch lists.
- **Stop and ask a human** only if: a step needs the BAA/prod secrets to *verify* (it should not — use mock/local), a migration would alter existing migration files, or an RLS change can't be proven by test.
- **Never** merge a security item that its test cannot prove. "Written but unverified" is not done.

---

## Production cutover checklist (separate, human-gated — NOT part of the automated build)

1. BAA executed with AI provider. ☐
2. Prod Supabase project created; migrations applied via `supabase db push`. ☐
3. Prod secrets set in the deploy environment (never in repo). ☐
4. `DEMO_BYPASS_AUTH` unset in every non-local environment. ☐
5. Backup/PITR enabled; one restore rehearsed. ☐

Steps 0–7 complete and CI-green **before** this checklist begins.
