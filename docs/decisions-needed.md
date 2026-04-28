# Decisions Needed

This file records unresolved decisions or environment blockers that require owner action. Resolved troubleshooting noise has been condensed so the file stays useful.

## Current Git Status

- Branch: `main`
- Latest local commits:
  - `c542393 feat: substrate, medicare vertical pack, AI review, docs`
  - `72f21aa feat: substrate, medicare vertical pack, AI review slice, docs`
- Owner reported `git push origin main` returns `Everything up-to-date`, so the main MVP commits appear to be on `origin/main`.
- Current local-only change: this troubleshooting cleanup file.

## Resolved During Hardening

### `npm run lint` was interactive

- Original issue: `next lint` opened an interactive ESLint setup prompt.
- Resolution: Replaced `npm run lint` with `node scripts/compliance-lint.mjs`.
- Current status: `npm run lint` passes.

### Typecheck depended on generated `.next/types`

- Original issue: running `tsc --noEmit` in some contexts failed before `.next/types` existed.
- Resolution: Added `tsconfig.typecheck.json` and changed `npm run typecheck` to use it.
- Current status: `npm run typecheck` passes.

### Node's built-in test runner hit sandbox spawn restrictions

- Original issue: `node --test` failed with `spawn EPERM`.
- Resolution: Replaced it with `node scripts/run-contract-tests.mjs`, which runs in-process.
- Current status: `npm test` passes.

### GitHub CLI was installed but not on PATH

- Original issue: plain `gh` was not recognized.
- Diagnosis: `gh.exe` exists at `C:\Program Files\GitHub CLI\gh.exe`.
- Resolution: Use the full path or add `C:\Program Files\GitHub CLI` to PATH.

## Remaining Environment Blockers

### Package installation is blocked by npm cache-only mode

- Command attempted: `npm install @supabase/supabase-js @supabase/ssr zod @t3-oss/env-nextjs @anthropic-ai/sdk`
- Result: npm reported `ENOTCACHED` and `cache mode is 'only-if-cached' but no cached response is available`.
- Impact: Official Supabase, Zod, t3-env, Anthropic, Vitest, and Playwright packages could not be installed from this environment.
- Current workaround: Dependency-free Supabase REST scaffolding, internal validation helpers, and no-dependency contract tests are in place.
- Recheck during focused SDK replacement session:
  - `npm config get registry`: `https://registry.npmjs.org/`
  - `npm config get offline`: `true`
  - `npm config get prefer-offline`: `false`
  - `npm config get cache`: `C:\Users\c_bas\AppData\Local\npm-cache`
  - `npm config get cache-min`: `0`
  - `npm config get cache-max`: `Infinity`
  - `npm config get fetch-retries`: `2`
  - `npm config get proxy`: `null`
  - `npm config get https-proxy`: `null`
  - Baseline `npm install` succeeded because existing packages were already cached.
  - Installing new SDKs still failed with `ENOTCACHED`, so Phase B stopped per owner directive.

### Local Next dev server is blocked by spawn permissions

- Command attempted: `npm run dev -- --hostname 127.0.0.1 --port 3000`
- Result: Next.js failed with `Error: spawn EPERM`.
- Impact: Browser smoke testing from this sandbox is blocked.
- Current workaround: `npm run build`, `npm run typecheck`, `npm run lint`, and `npm test` all pass.

### Codex shell could not push to GitHub

- Command attempted: `git push origin main`
- Result in Codex shell: failed to connect to `github.com` via `127.0.0.1`.
- Owner result: `Everything up-to-date`.
- Current interpretation: The main work appears pushed from the owner shell, but this Codex shell still has network/proxy limitations.

### `.git` ACL may block Git writes from this sandbox

- Observed issue: earlier `git add` attempts failed with `.git/index.lock: Permission denied`.
- Diagnosis: `.git` has explicit deny ACL entries for another SID. Attempts to remove them from this sandbox were denied.
- Current interpretation: Owner-side Git operations may work even when Codex-side Git writes fail.
- Latest retry: after verifying branch `main`, `git add -A` for this troubleshooting cleanup still failed with `.git/index.lock: Permission denied`; commit and push were not attempted.

## Reversible Product Decisions Made

### Preserve the current demo UI as the MVP shell

- Decision: Keep the existing operations screens and refactor their data boundaries instead of rewriting the UI.
- Reason: The screens already tell the compliance-first story well and preserve Medicare / retirement-income separation.

### Treat existing fake data as seed material

- Decision: Convert realistic fake data into Supabase seed content over time instead of discarding it.
- Reason: It is useful demo material and aligns with the Northstar Senior Benefits demo story.
