# Decisions Needed

This file records reversible decisions made autonomously and blockers that require the owner later. Irreversible actions are stopped and documented here instead of performed.

## Environment Blockers

### `rg` unavailable

- Date: 2026-04-28
- Command: `rg --files -g '!node_modules' -g '!.next' -g '!pnpm-lock.yaml'`
- Result: PowerShell reported `Program 'rg.exe' failed to run: Access is denied`.
- Why it was needed: Fast repository inventory.
- What I did instead: Used native PowerShell `Get-ChildItem` and `git ls-files`.

### `npm run lint` interactive prompt resolved

- Date: 2026-04-28
- Command: `npm run lint`
- Result: `next lint` opened an interactive prompt asking how to configure ESLint and exited nonzero in unattended execution.
- Why it was needed: Phase verification.
- Resolution: Replaced the script with `node scripts/compliance-lint.mjs`, a no-dependency compliance lint that checks source suppressions, product guardrail language, and Supabase migration requirements. Official ESLint can still be added once npm registry access is available.

### Git commit blocked by `.git/index.lock` permission

- Date: 2026-04-28
- Command: `git add docs/inventory.md docs/decisions-needed.md docs/progress.md; git commit -m "chore: inventory existing codebase"`
- Result: Git reported `fatal: Unable to create 'C:/Users/c_bas/Projects/Compliance based Medicare system/.git/index.lock': Permission denied`.
- Why it was needed: Phase 0 required a commit.
- Additional blocked command: `git add README.md package.json app docs src supabase test-fixtures; git commit -m "feat: build compliance ops MVP substrate"` failed with the same permission error.
- Additional blocked command: `git add README.md package.json tsconfig.json tsconfig.typecheck.json app docs scripts src supabase test-fixtures; git commit -m "fix: stabilize mvp verification scripts"` failed with the same permission error.
- What I did instead: Left all changes written in the working tree and continued with unblocked implementation work.

### Dependency installation blocked by npm cache-only mode

- Date: 2026-04-28
- Command: `npm install @supabase/supabase-js @supabase/ssr zod @t3-oss/env-nextjs @anthropic-ai/sdk`
- Result: npm reported `ENOTCACHED` and `cache mode is 'only-if-cached' but no cached response is available`.
- Why it was needed: Phase 1/4 requested Supabase, Zod validation, typed env helpers, and Anthropic integration.
- What I did instead: Continued with dependency-free Supabase REST scaffolding, internal typed validation helpers, SQL migrations, and provider interfaces. Official SDK packages should be installed when registry access is available.

### Test tooling installation blocked by npm cache-only mode

- Date: 2026-04-28
- Command: `npm install -D vitest @playwright/test`
- Result: npm reported `ENOTCACHED` and `cache mode is 'only-if-cached' but no cached response is available`.
- Why it was needed: The MVP requested Vitest unit tests and Playwright e2e tests.
- What I did instead: Added `npm test` using a no-spawn Node script at `scripts/run-contract-tests.mjs`. Formal Vitest/Playwright coverage is still blocked until packages can be installed.

### Node test runner blocked by spawn permission

- Date: 2026-04-28
- Command: `node --test tests/*.test.mjs`
- Result: Node test runner failed with `Error: spawn EPERM`.
- Why it was needed: A no-dependency substitute for Vitest.
- Resolution: Replaced it with `node scripts/run-contract-tests.mjs`, which runs contract tests in-process and now passes.

### Local Next dev server blocked by spawn permission

- Date: 2026-04-28
- Command: `npm run dev -- --hostname 127.0.0.1 --port 3000`
- Result: Next.js failed with `Error: spawn EPERM`.
- Why it was needed: Browser demo verification.
- What I did instead: Verified with `npm run build` and `npm run typecheck`. The app should run at `http://127.0.0.1:3000` when the environment allows Next to spawn its dev process.

## Reversible Decisions Made

### Preserve the current demo UI as the MVP shell

- Date: 2026-04-28
- Decision: Keep the existing operations screens and refactor their data boundaries instead of rewriting the UI.
- Reason: The screens already tell the compliance-first story well and preserve the Medicare / retirement-income separation.

### Treat existing fake data as seed material

- Date: 2026-04-28
- Decision: Convert the realistic fake data into Supabase seed content over time instead of discarding it.
- Reason: It is useful demo material and aligns with the requested Northstar-style agency story, though it needs persistence and RLS.
