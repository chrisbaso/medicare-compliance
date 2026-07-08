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
  }
  return creds;
}

const local = localCredsFromCli();
const url = process.env.SUPABASE_URL || local.url;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || local.serviceKey;

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

let linked = 0;
for (const user of SEED_USERS) {
  const authId = await ensureAuthUser(user.email);
  const { error } = await admin
    .from("users")
    .update({ auth_user_id: authId })
    .eq("id", user.id);
  if (error) throw new Error(`Failed to link ${user.email}: ${error.message}`);
  process.stdout.write(`  ✓ linked ${user.email} → auth ${authId}\n`);
  linked += 1;
}

process.stdout.write(`\n✓ Linked ${linked} seed users to Supabase Auth.\n`);
