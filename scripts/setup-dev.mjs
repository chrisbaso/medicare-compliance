#!/usr/bin/env node
/**
 * Automated dev/test environment bootstrap.
 *
 * Turns the former "human prerequisites" (live Supabase project, auth-user
 * linking) into a single scripted, idempotent command. Uses the LOCAL Supabase
 * stack (Docker) — no cloud account, no dashboard clicks.
 *
 * Steps:
 *   1. npm ci
 *   2. supabase start        (local Postgres + Auth + Storage)
 *   3. supabase db reset      (apply all migrations + seed.sql)
 *   4. link-auth-users.mjs    (create auth users, set users.auth_user_id)
 *
 * Safe to run repeatedly. Exits non-zero with a clear message if Docker or the
 * Supabase CLI is missing — those are the only host capabilities required.
 */
import { spawnSync } from "node:child_process";

function run(cmd, args, { optional = false } = {}) {
  const label = [cmd, ...args].join(" ");
  process.stdout.write(`\n▶ ${label}\n`);
  const result = spawnSync(cmd, args, { stdio: "inherit", shell: false });
  if (result.status !== 0) {
    if (optional) {
      process.stdout.write(`  (non-fatal: "${label}" exited ${result.status})\n`);
      return false;
    }
    process.stderr.write(`\n✖ "${label}" failed (exit ${result.status}).\n`);
    process.exit(result.status ?? 1);
  }
  return true;
}

function requireTool(cmd, hint) {
  const probe = spawnSync(cmd, ["--version"], { stdio: "ignore", shell: false });
  if (probe.status !== 0) {
    process.stderr.write(
      `\n✖ Required tool "${cmd}" not found.\n  ${hint}\n` +
        `  This is the only host capability the automated setup needs.\n`
    );
    process.exit(1);
  }
}

process.stdout.write("=== Medicare Compliance — automated dev setup ===\n");

requireTool("supabase", "Install the Supabase CLI: https://supabase.com/docs/guides/cli");
// Docker is required by `supabase start`; probe it early for a clear message.
requireTool("docker", "Install Docker and ensure the daemon is running.");

run("npm", ["ci"]);
run("supabase", ["start"]);
run("supabase", ["db", "reset", "--no-seed"], { optional: false });
// seed.sql is applied by `db reset` when configured; apply explicitly to be safe.
run("supabase", ["db", "reset"]);
run("node", ["scripts/link-auth-users.mjs"]);

process.stdout.write(
  "\n✓ Dev environment ready. Next: `npm run verify` (typecheck + lint + test + build).\n"
);
