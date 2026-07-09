#!/usr/bin/env node
/**
 * Automates former prerequisite P2: link seeded staff users to Supabase Auth.
 *
 * Every RLS policy resolves through auth.uid(). Seed users have no auth_user_id
 * until this runs. This creates a Supabase Auth user per seeded staff member and
 * writes the resulting id back into public.users.auth_user_id.
 *
 * Targets the LOCAL Supabase stack by default (credentials come from
 * `supabase status`). Idempotent: re-running updates existing links.
 *
 * Env overrides (for CI or non-default local ports):
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import { spawnSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";

// Seed staff — must match supabase/seed.sql.
const SEED_USERS = [
  { id: "22222222-2222-4222-8222-222222222201", email: "dana@northstar.example" },
  { id: "22222222-2222-4222-8222-222222222202", email: "alex@northstar.example" },
  { id: "22222222-2222-4222-8222-222222222203", email: "mia@northstar.example" },
  { id: "22222222-2222-4222-8222-222222222204", email: "priya@northstar.example" }
];
const DEV_PASSWORD = "demo-password-123"; // local/CI only; never used in production.

function localCredsFromCli() {
  const status = spawnSync("supabase", ["status", "-o", "env"], { encoding: "utf8" });
  if (status.status !== 0) return {};
  const creds = {};
  for (const line of status.stdout.split("\n")) {
    const [k, ...rest] = line.split("=");
    if (!k) continue;
    const v = rest.join("=").replace(/^"|"$/g, "").trim();
    if (k.trim() === "API_URL") creds.url = v;
    if (k.trim() === "SERVICE_ROLE_KEY") creds.serviceKey = v;
    // Newer CLI versions issue new-format keys under different names.
    if (k.trim() === "SECRET_KEY" && !creds.serviceKey) creds.serviceKey = v;
    if (k.trim() === "DB_URL") creds.dbUrl = v;
  }
  return creds;
}

const local = localCredsFromCli();
const url = process.env.SUPABASE_URL || local.url;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || local.serviceKey;
const dbUrl = process.env.SUPABASE_DB_URL || local.dbUrl;

if (!url || !serviceKey) {
  process.stderr.write(
    "✖ Could not resolve Supabase URL / service-role key.\n" +
      "  Run `supabase start` first, or set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.\n"
  );
  process.exit(1);
}

const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

async function ensureAuthUser(email) {
  // Try to create; if it already exists, look it up.
  const created = await admin.auth.admin.createUser({
    email,
    password: DEV_PASSWORD,
    email_confirm: true
  });
  if (created.data?.user?.id) return created.data.user.id;

  // Already exists — page through to find it (local user counts are tiny).
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (error) throw new Error(`listUsers failed: ${error.message}`);
  const match = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!match) throw new Error(`Could not create or find auth user for ${email}`);
  return match.id;
}

/**
 * Write auth_user_id into public.users. Prefer a direct psql connection to the
 * LOCAL database — new-format CLI API keys have gateway role-mapping quirks
 * (observed in CI: 'permission denied for table users' via PostgREST), while
 * a direct superuser connection to the throwaway local stack is unambiguous.
 * Falls back to the REST update when no DB_URL is available.
 */
function linkViaPsql(userId, authId) {
  if (!dbUrl) return false;
  const sql = `update public.users set auth_user_id = '${authId}' where id = '${userId}';`;
  const result = spawnSync("psql", [dbUrl, "-v", "ON_ERROR_STOP=1", "-q", "-c", sql], {
    encoding: "utf8"
  });
  if (result.error || result.status !== 0) {
    process.stdout.write(
      `  (psql link failed${result.stderr ? `: ${result.stderr.trim()}` : ""}; falling back to REST)\n`
    );
    return false;
  }
  return true;
}

async function linkViaRest(userId, authId, email) {
  const { error } = await admin.from("users").update({ auth_user_id: authId }).eq("id", userId);
  if (error) throw new Error(`Failed to link ${email}: ${error.message}`);
}

let linked = 0;
for (const user of SEED_USERS) {
  const authId = await ensureAuthUser(user.email);
  if (!linkViaPsql(user.id, authId)) {
    await linkViaRest(user.id, authId, user.email);
  }
  process.stdout.write(`  ✓ linked ${user.email} → auth ${authId}\n`);
  linked += 1;
}

process.stdout.write(`\n✓ Linked ${linked} seed users to Supabase Auth.\n`);
