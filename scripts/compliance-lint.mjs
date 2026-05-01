import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const ignoredDirectories = new Set([".git", ".next", "node_modules", "coverage", "dist"]);
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".md", ".sql"]);
const errors = [];

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (ignoredDirectories.has(entry.name)) {
      continue;
    }

    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...await collectFiles(fullPath));
      continue;
    }

    if (sourceExtensions.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }

  return files;
}

function relative(file) {
  return path.relative(root, file).replaceAll("\\", "/");
}

function checkNoSuppression(file, content) {
  const disallowed = [`@ts-${"ignore"}`, `eslint-${"disable"}`];

  for (const token of disallowed) {
    if (content.includes(token)) {
      errors.push(`${relative(file)} contains disallowed suppression '${token}'.`);
    }
  }
}

function checkProductGuardrails(file, content) {
  if (!file.includes(`${path.sep}src${path.sep}`) && !file.includes(`${path.sep}app${path.sep}`)) {
    return;
  }

  if (
    file.endsWith(`${path.sep}src${path.sep}lib${path.sep}compliance${path.sep}rules.ts`) ||
    file.includes(`${path.sep}src${path.sep}lib${path.sep}verticals${path.sep}medicare${path.sep}compliance-rules.ts`)
  ) {
    return;
  }

  const lower = content.toLowerCase();
  const riskyRecommendationTerms = [
    "recommend an annuity",
    "recommend a medicare plan",
    "choose a plan for",
    "best plan for you",
    "autonomous outbound"
  ];

  for (const term of riskyRecommendationTerms) {
    if (lower.includes(term) && !lower.includes("must not")) {
      errors.push(`${relative(file)} includes risky product language '${term}'.`);
    }
  }
}

function checkSupabaseMigrationSet(filesWithContent) {
  const migrationContents = filesWithContent
    .filter(({ file }) => relative(file).startsWith("supabase/migrations/"))
    .map(({ content }) => content.toLowerCase())
    .join("\n\n");
  const required = [
    "enable row level security",
    "create table public.audit_logs",
    "create table public.consents",
    "create table public.retirement_opportunities",
    "prevent_update_delete",
    "organization_id"
  ];

  for (const phrase of required) {
    if (!migrationContents.includes(phrase)) {
      errors.push(`Supabase migrations are missing required phrase '${phrase}'.`);
    }
  }
}

function checkDocsDecisions(content) {
  const unresolvedInteractiveLint = content.includes("`npm run lint` is interactive");
  if (unresolvedInteractiveLint) {
    errors.push("docs/decisions-needed.md still lists npm run lint as interactive.");
  }
}

const files = await collectFiles(root);
const filesWithContent = await Promise.all(
  files.map(async (file) => ({
    file,
    content: await readFile(file, "utf8")
  }))
);

for (const { file, content } of filesWithContent) {
  checkNoSuppression(file, content);
  checkProductGuardrails(file, content);

  if (relative(file) === "docs/decisions-needed.md") {
    checkDocsDecisions(content);
  }
}

checkSupabaseMigrationSet(filesWithContent);

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Compliance lint passed across ${files.length} files.`);
