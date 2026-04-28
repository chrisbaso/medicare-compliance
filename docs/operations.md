# Operations

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Verification

```bash
npm run build
npm run typecheck
npm run lint
npm test
```

Vitest and Playwright installation is blocked in this environment by npm cache-only mode, so `npm test` currently runs no-dependency contract tests.

## Supabase Setup

1. Create a Supabase project.
2. Apply `supabase/migrations/202604280001_initial_compliance_ops.sql`.
3. Apply `supabase/seed.sql`.
4. Configure environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
APP_ENV=development
```

## Backup Story

For a pilot:
- Enable Supabase point-in-time recovery if available on the selected plan.
- Schedule daily logical exports for `public` schema tables.
- Treat `audit_logs` and `consents` as append-only records; never run manual updates against them.
- Test restore into a separate project before onboarding real agency data.

## Debugging

- Check build/type errors first with `npm run build`.
- Use correlation IDs from structured logs for API or AI review calls.
- Inspect `audit_logs` by `organization_id`, `entity_type`, `entity_id`, and `event_at`.
- If AI provider credentials are missing, the app falls back to deterministic local review for demos.
