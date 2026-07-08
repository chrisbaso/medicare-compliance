# Implementation Plan — Security & Test Spine (Phase 8, Session 1)

**Author:** Technical Cofounder session
**Branch:** `review/full-audit`
**Status:** Plan for review — no code written yet
**Prerequisite for:** any work stream that touches real beneficiary PII (ingest, transcription, portfolio)

---

## Why this work stream first

The compliance value of this platform rests entirely on the flagging engine, and today that engine is (a) untested, (b) reachable through routes that bypass auth middleware, (c) fed full beneficiary PII with no redaction, and (d) writable/deletable by any org member regardless of role. This session converts those four liabilities into assets and establishes the executable test spine that every future change will depend on. No new features until this lands.

Sequencing rule: **security controls before the first byte of real PII enters the system.**

---

## Scope of this session (7 work items)

| # | Item | Type | Compliance/Security value |
|---|---|---|---|
| 1 | Enforce auth on all `/api/*` routes | Security | Closes CRITICAL middleware bypass |
| 2 | Role-gated RLS (no agent deletes/flag-overrides) | Security | Closes HIGH broad-CRUD hole |
| 3 | Transcript PII sanitization before AI provider | Privacy | Closes HIGH unredacted-PII-to-Anthropic |
| 4 | Per-org rate limiting + cost ceiling | Security/Cost | Closes HIGH cost-abuse hole |
| 5 | Executable test suite + CI gate | Quality | Closes CRITICAL "zero real tests" |
| 6 | Enforce `blocksWorkflow` on terminal transitions | Compliance integrity | A blocking flag must actually block |
| 7 | Deterministic engine → 9-rule parity | Correctness | No-API-key deploys stop missing 5 rules |

Items 1–4 mirror `CODEX_TASKS.md` Tasks 1–4; items 5–7 are additions this charter prioritizes. Each ships as its own small, backward-compatible commit.

---

## Item 1 — Enforce authentication on all API routes

**Files:** `middleware.ts` (edit), `app/api/conversations/[id]/review/route.ts` (comment only).

**Approach:** Remove the `/api/` early-return from `middleware.ts`. Add a `PUBLIC_API_ROUTES` allow-list (empty today; reserved for future webhooks/health). Keep the existing per-handler `getCurrentUser()` for authorization context. `localDemoBypassEnabled` must still short-circuit both page and API auth so the demo works.

**Acceptance:**
1. Unauthenticated `POST /api/conversations/:id/review` returns 401 before the handler body runs.
2. Authenticated requests unchanged.
3. Demo bypass still works end-to-end.
4. `npm run build` passes.

**Do not touch:** migrations, `src/lib/core/auth/session.ts`, `src/lib/verticals/`, `src/components/`.

---

## Item 2 — Role-gated RLS policies

**Files:** new migration `supabase/migrations/2026XXXX_tighten_rls.sql` only.

**Approach:** Split the broad `FOR ALL` policies into per-operation policies using the existing `current_user_roles()` helper:
- `clients`: SELECT/INSERT all members; UPDATE agent/manager/admin; DELETE admin only.
- `compliance_flags`: SELECT/INSERT all members; UPDATE compliance_reviewer/manager/admin; DELETE denied.
- `conversations`: agent role sees only `owner_user_id = self`; manager/admin/compliance_reviewer org-wide.
- `tasks`: DELETE manager/admin only.
Use `DROP POLICY IF EXISTS` for idempotency. Do not weaken existing org-isolation predicates — only narrow within-org write rights.

**Acceptance:**
1. Migration applies cleanly and is re-runnable.
2. Agent-role session cannot DELETE a client or UPDATE `compliance_flags.status`.
3. compliance_reviewer CAN update flag status.
4. Cross-org isolation still holds (proven by Item 5 tests).

**Do not touch:** existing migrations, any TS source, `middleware.ts`.

---

## Item 3 — Transcript PII sanitization

**Files:** new `src/lib/core/ai-review/transcript-sanitizer.ts`; edit `review-service.ts`, `types.ts`.

**Approach:** `sanitizeTranscript(transcript, speakerNames)` replaces speaker names with `SPEAKER_1..N` (word-boundary, case-insensitive, applied right-to-left) and returns replacement offsets. `restoreFlagOffsets(flags, replacements)` maps returned flag offsets/`quoted_text` back to the original. `review-service.ts` sanitizes before prompt build, restores before returning. Add `sanitized: boolean` to `AiReviewResult`. Extend later to DOB/phone/email patterns — names first this session.

**Acceptance:**
1. Unit test: names replaced, offsets recorded.
2. Unit test: offsets correctly restored on returned flags.
3. The provider receives sanitized text (asserted via mock provider).
4. `npm run build` passes.

**Do not touch:** the route file, migrations, `src/lib/verticals/`, `src/components/`.

**Note:** sanitization reduces but does not eliminate PII exposure — a BAA with the AI provider remains a business prerequisite and will be recorded in the decision log.

---

## Item 4 — Per-org rate limiting + cost ceiling

**Files:** new migration for `review_call_log`; new `src/lib/core/ai-review/rate-limit.ts`; edit route.

**Approach:** `review_call_log` (org-scoped RLS from creation). `checkAndRecordReviewCall()` counts today's calls for the org and atomically records a new one; returns 429 with `Retry-After` when over `AI_REVIEW_DAILY_LIMIT` (default 100, env-overridable). Called after auth + conversation lookup, before the LLM branch.

**Acceptance:**
1. Over-limit call returns 429; other orgs unaffected.
2. Env override works.
3. Migration applies cleanly; new table RLS-scoped.
4. `npm run build` + tests pass.

**Do not touch:** existing migrations, `review-service.ts`, `src/lib/verticals/`, `src/components/`.

---

## Item 5 — Executable test suite + CI gate

**Files:** add a runner (`vitest` dev dep) + `src/**/__tests__/*.test.ts`; `.github/workflows/ci.yml`; update `package.json` test script. Keep existing contract tests running.

**Approach:** Real unit tests that import and execute code:
- `deterministic-review`: the 6 scenario cases + a clean-transcript-zero-flags baseline.
- `validate-output`: valid parse, each throw path, empty-flags success.
- `rules`: every catalog entry has remediation; every phrase-rule matches its own example.
- `transcript-sanitizer` (from Item 3).
CI runs build + lint + test on every push; red blocks merge.

**Acceptance:**
1. `npm test` executes real code and reports pass/fail counts.
2. 100% line coverage on `deterministic-review.ts` and `validate-output.ts`.
3. CI workflow green on this branch.
4. Existing contract tests still pass.

**Do not touch:** app routes, components, migrations.

---

## Item 6 — Enforce `blocksWorkflow` on terminal transitions

**Files:** `src/lib/core/workflows/state-machine.ts`, `src/lib/verticals/medicare/workflows.ts`, `src/lib/core/repositories/operations-repository.ts` (add query). Rules file read-only.

**Approach:** Add `getOpenBlockingFlagsForConversation()` (open flags whose `rule_id` maps to a catalog rule with `blocksWorkflow: true`). Add an optional `guardFn` to transition definitions; terminal transitions (`complete`/`closed`/`resolved`) run the guard and throw if blocking flags remain. Guard uses the RLS-scoped server client, not service role.

**Acceptance:**
1. Unit test: transition to terminal with an open blocking flag throws.
2. Unit test: succeeds once flags are confirmed/dismissed.
3. Non-terminal transitions unaffected.
4. Build + tests pass.

**Do not touch:** migrations, `app/api/`, `src/components/`, auth.

---

## Item 7 — Deterministic engine → 9-rule parity

**Files:** `src/lib/core/ai-review/deterministic-review.ts`; validator/type updates if needed.

**Approach:** Add the five missing rule types (`implied_government_endorsement`, `urgency_high_pressure_language`, `unlicensed_activity_language`, `incomplete_handoff_to_licensed_human`, `plan_comparison_risk`) driven by the existing catalog `phrases`. Remove/reconcile the orphaned `prohibited_compensation_discussion` ruleId and the unmapped `human_review_needed` flag type so every emitted flag traces to a catalog rule. Report all phrase matches, not just the first.

**Acceptance:**
1. Deterministic output covers all 9 catalog rules.
2. Every emitted `flag_type`/`rule_id` maps to a catalog entry (asserted in tests).
3. Multiple occurrences produce multiple flags.
4. Build + tests pass.

**Do not touch:** `app/api/`, migrations, `src/components/`.

---

## Delivery mechanics

- One commit per item, in order 1→7; each independently builds and passes tests.
- Backward compatible: no API contract or response-shape changes except the additive `sanitized` field.
- After each commit I update a short decision-log entry under `docs/`.
- No PR opened unless you ask.

## Session-end deliverables (per charter Phase 10)

Executive summary · what changed · why · compliance impact · security impact · performance impact · debt reduced · remaining risks · recommended next task · updated health score.

## Out of scope this session (explicitly deferred)

Ingest, transcription pipeline, opportunity scoring, portfolio console, UI redesign, rules-as-data, e-signature/retention model. These wait behind the security + test spine.
