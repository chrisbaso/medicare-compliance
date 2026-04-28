# Progress

## Phase 0 - Inventory and Assess

- Date: 2026-04-28
- Built: Completed repository inventory, assessed all current routes, data flow, workflow logic, persistence gaps, and code quality. Added `docs/inventory.md`.
- Verification: `npm run build` passed.
- Skipped: `npm run lint` because the script opens an interactive ESLint setup prompt.
- Risks: Current app is still in-memory and demo-only; consent mutation and audit event shape must be hardened early.
- Review when back: Confirm the keep/refactor/rewrite decisions in `docs/inventory.md`, especially keeping the existing UI shell while replacing the data layer.

## Phase 1 - Substrate Foundation

- Date: 2026-04-28
- Built: Added `src/lib/core/` primitives for workflows, audit, consent ledger, RBAC, logging, notifications, reporting, Supabase REST access, LLM provider abstraction, and AI review. Added Supabase migration and seed data with RLS, organization scoping, append-only consent/audit triggers, and separate `retirement_opportunities` table.
- Verification: `npm run build` passed; `npx tsc --noEmit` passed after build generated `.next/types`.
- Skipped: Official Supabase/Zod/t3-env/Anthropic SDK install because npm registry access is blocked by cache-only mode.
- Risks: Supabase is scaffolded through SQL and REST helpers, but the existing UI still mostly reads local demo state.
- Review when back: Install official packages and decide whether to keep the dependency-free REST bridge or replace it with `@supabase/ssr`.

## Phase 2 - Medicare Vertical Pack

- Date: 2026-04-28
- Built: Added `src/lib/verticals/medicare/` with compliance rules, workflows, document templates, vocabulary, AI prompts, and seasonality. Added `_template` pack for future verticals.
- Verification: `npm run build` and `npx tsc --noEmit` passed.
- Skipped: Tax pack implementation, per scope.
- Risks: Compliance citations should be reviewed by counsel before production use.
- Review when back: Confirm rule wording and citations in `docs/COMPLIANCE_RULES.md`.

## Phase 3/4 - Core MVP AI Review Slice

- Date: 2026-04-28
- Built: Added paste/upload transcript review on conversation detail, AI review execution through the core service, inline quote highlighting, structured flags, and human confirm/dismiss decisions with reasons. Hardened local consent behavior to append records instead of mutating existing consent records. Added unauthenticated landing page.
- Verification: `npm run build` and `npx tsc --noEmit` passed.
- Skipped: Persisting AI review outputs to Supabase from the UI because auth/session wiring is not complete.
- Risks: Human review decisions are local UI state until persistence is wired. Browser smoke testing was blocked by `spawn EPERM` when starting `next dev`.
- Review when back: Run through `/conversations/conv-020`, click **Run AI review**, and confirm/dismiss a flag.

## Hardening Pass - Script Stability

- Date: 2026-04-28
- Built: Replaced interactive lint with `scripts/compliance-lint.mjs`, added in-process contract tests at `scripts/run-contract-tests.mjs`, added `tsconfig.typecheck.json` so typecheck does not depend on generated `.next/types`, and added npm scripts for `lint`, `test`, and `typecheck`.
- Verification: `npm run lint`, `npm test`, `npm run typecheck`, and `npm run build` pass.
- Skipped: ESLint/Vitest/Playwright package setup remains blocked by npm registry cache mode.
- Risks: The current lint/test scripts are pragmatic no-dependency checks, not full replacements for ESLint and browser e2e once package installation is available.
- Review when back: Decide whether to keep these as fast contract checks after adding official ESLint/Vitest/Playwright.
