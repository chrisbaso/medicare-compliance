import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const tests = [];

function test(name, fn) {
  tests.push({ name, fn });
}

async function read(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("Supabase migration enforces organization RLS and append-only ledgers", async () => {
  const migration = await read("supabase/migrations/202604280001_initial_compliance_ops.sql");

  assert.match(migration, /organization_id uuid not null/g);
  assert.match(migration, /enable row level security/g);
  assert.match(migration, /create trigger consents_append_only_update/g);
  assert.match(migration, /create trigger audit_logs_append_only_update/g);
  assert.match(migration, /create table public\.retirement_opportunities/g);
});

test("AI review output contract includes reviewer-actionable fields", async () => {
  const types = await read("src/lib/core/ai-review/types.ts");

  for (const field of [
    "flag_type",
    "severity",
    "rule_id",
    "transcript_offset_start",
    "transcript_offset_end",
    "quoted_text",
    "reasoning",
    "suggested_remediation"
  ]) {
    assert.match(types, new RegExp(field));
  }
});

test("Medicare vertical pack keeps separate retirement follow-up workflow explicit", async () => {
  const workflows = await read("src/lib/verticals/medicare/workflows.ts");
  const rules = await read("src/lib/verticals/medicare/compliance-rules.ts");

  assert.match(workflows, /retirementIncomeHandoffWorkflow/);
  assert.match(workflows, /awaiting_consent/);
  assert.match(workflows, /assign_licensed_owner/);
  assert.match(rules, /cross_sell_contamination/);
  assert.match(rules, /missing_separate_follow_up_consent/);
});

test("Demo transcript fixture contains meaningful compliance issues", async () => {
  const transcript = await read("test-fixtures/transcripts/harold-bennett-cross-sell.txt");

  assert.match(transcript, /Medicare supplement premium/);
  assert.match(transcript, /retirement income/);
  assert.match(transcript, /annuity/);
  assert.match(transcript, /separate retirement-income call/);
});

let failures = 0;

for (const { name, fn } of tests) {
  try {
    await fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    failures += 1;
    console.error(`not ok - ${name}`);
    console.error(error);
  }
}

if (failures > 0) {
  process.exit(1);
}

console.log(`${tests.length} contract tests passed.`);
