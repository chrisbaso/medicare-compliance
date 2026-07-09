#!/usr/bin/env node
/**
 * Behavioral RLS integration test — runs in CI against the local Supabase stack
 * (NOT part of `npm run verify`, which has no database).
 *
 * Proves organization isolation and role gating actually ENFORCE (not just that
 * policies exist): signs in as an agent and a compliance_reviewer and asserts
 * the agent cannot delete a client or update a flag, while the reviewer can
 * update the flag. Requires `supabase start` + `db reset` + link-auth-users.mjs
 * to have run first (see .github/workflows/ci.yml).
 *
 * Credentials come from `supabase status` or SUPABASE_URL / *_ANON_KEY /
 * *_SERVICE_ROLE_KEY env vars. Password matches scripts/link-auth-users.mjs.
 */
import { spawnSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
import assert from "node:assert/strict";

const DEV_PASSWORD = "demo-password-123";
const AGENT_EMAIL = "alex@northstar.example"; // role: agent
const REVIEWER_EMAIL = "priya@northstar.example"; // role: compliance_reviewer
const SEED_CLIENT_ID = "33333333-3333-4333-8333-333333333301";
const SEED_FLAG_ID = "66666666-6666-4666-8666-666666666601";
const CONV_OWNED_BY_AGENT = "44444444-4444-4444-8444-444444444401"; // owner: Alex (agent)
const CONV_OWNED_BY_MANAGER = "44444444-4444-4444-8444-444444444403"; // owner: Dana (manager)

function localCreds() {
  const status = spawnSync("supabase", ["status", "-o", "env"], { encoding: "utf8" });
  const creds = {};
  if (status.status === 0) {
    for (const line of status.stdout.split("\n")) {
      const [k, ...rest] = line.split("=");
      const v = rest.join("=").replace(/^"|"$/g, "").trim();
      if (k?.trim() === "API_URL") creds.url = v;
      if (k?.trim() === "ANON_KEY") creds.anon = v;
      // Newer CLI versions name the anon-equivalent key PUBLISHABLE_KEY.
      if (k?.trim() === "PUBLISHABLE_KEY" && !creds.anon) creds.anon = v;
    }
  }
  return creds;
}

const local = localCreds();
const url = process.env.SUPABASE_URL || local.url;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || local.anon;

if (!url || !anon) {
  console.error("✖ Supabase URL / anon key not resolved. Run `supabase start` first.");
  process.exit(1);
}

async function clientFor(email) {
  const c = createClient(url, anon, { auth: { autoRefreshToken: false, persistSession: false } });
  const { error } = await c.auth.signInWithPassword({ email, password: DEV_PASSWORD });
  if (error) throw new Error(`sign-in failed for ${email}: ${error.message}`);
  return c;
}

let failures = 0;
async function check(name, fn) {
  try {
    await fn();
    console.log(`ok - ${name}`);
  } catch (err) {
    failures += 1;
    console.error(`not ok - ${name}`);
    console.error(err);
  }
}

const agent = await clientFor(AGENT_EMAIL);
const reviewer = await clientFor(REVIEWER_EMAIL);

await check("agent CANNOT delete a client", async () => {
  await agent.from("clients").delete().eq("id", SEED_CLIENT_ID);
  // RLS makes the row invisible/unaffected; confirm it still exists via service-independent read.
  const { data } = await reviewer.from("clients").select("id").eq("id", SEED_CLIENT_ID).maybeSingle();
  assert.ok(data, "client should still exist after agent delete attempt");
});

await check("agent CANNOT update a compliance flag status", async () => {
  await agent.from("compliance_flags").update({ status: "dismissed" }).eq("id", SEED_FLAG_ID);
  const { data } = await reviewer
    .from("compliance_flags")
    .select("status")
    .eq("id", SEED_FLAG_ID)
    .maybeSingle();
  assert.notEqual(data?.status, "dismissed", "agent must not be able to dismiss a flag");
});

await check("compliance_reviewer CAN update a compliance flag status", async () => {
  const { error } = await reviewer
    .from("compliance_flags")
    .update({ status: "confirmed" })
    .eq("id", SEED_FLAG_ID);
  assert.equal(error, null, error?.message);
  const { data } = await reviewer
    .from("compliance_flags")
    .select("status")
    .eq("id", SEED_FLAG_ID)
    .maybeSingle();
  assert.equal(data?.status, "confirmed");
});

await check("agent CAN read a conversation they own", async () => {
  const { data } = await agent
    .from("conversations")
    .select("id")
    .eq("id", CONV_OWNED_BY_AGENT)
    .maybeSingle();
  assert.ok(data, "agent should see their own conversation");
});

await check("agent CANNOT read a conversation owned by someone else", async () => {
  const { data } = await agent
    .from("conversations")
    .select("id")
    .eq("id", CONV_OWNED_BY_MANAGER)
    .maybeSingle();
  assert.equal(data, null, "agent must not see another owner's conversation");
});

await check("compliance_reviewer CAN read any org conversation", async () => {
  const { data } = await reviewer
    .from("conversations")
    .select("id")
    .eq("id", CONV_OWNED_BY_MANAGER)
    .maybeSingle();
  assert.ok(data, "reviewer should see org-wide conversations");
});

await check("record_review_call enforces the per-org limit atomically", async () => {
  const ORG = "11111111-1111-4111-8111-111111111111";
  const first = await reviewer.rpc("record_review_call", {
    p_organization_id: ORG,
    p_conversation_id: CONV_OWNED_BY_MANAGER,
    p_limit: 1
  });
  assert.equal(first.error, null, first.error?.message);
  assert.equal(first.data?.[0]?.allowed, true);

  const second = await reviewer.rpc("record_review_call", {
    p_organization_id: ORG,
    p_conversation_id: CONV_OWNED_BY_MANAGER,
    p_limit: 1
  });
  assert.equal(second.data?.[0]?.allowed, false, "second call over limit must be rejected");
});

if (failures > 0) {
  console.error(`\n${failures} RLS integration check(s) failed.`);
  process.exit(1);
}
console.log("\n✓ RLS integration checks passed.");
