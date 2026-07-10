# Production Cutover Runbook

Everything between "works in demo/CI" and "safe with real beneficiary data."
Two gates are human-only (legal signature, secrets custody); the rest is
mechanical. Do them in order.

## Gate 1 — The BAA chain (legal; start first, longest lead time)

Every service that touches beneficiary data needs a BAA:

1. **AI provider** — either Anthropic directly (contact sales; request BAA +
   zero-data-retention for the API), or the self-service route: accept the
   AWS BAA in AWS Artifact and use Claude on Amazon Bedrock (requires adding
   a Bedrock LlmProvider — the provider interface in `src/lib/core/llm/`
   makes this a contained change).
2. **Supabase** — Team plan + HIPAA add-on; mark the project HIPAA in the
   dashboard.
3. **App host** — Vercel requires Enterprise for a BAA; the cheaper route is
   hosting the Next.js app on AWS under the same AWS BAA as Bedrock.
4. Optional but recommended: one hour of healthcare-attorney review of your
   actual obligations (carrier contracts, TPMO, state rules).

> Building and piloting with synthetic data (e.g. `test-fixtures/demo-book.csv`)
> needs none of this. The BAA chain gates REAL beneficiary data only.

## Gate 2 — Production Supabase (~1 hour once the account exists)

1. Create the org/project at supabase.com (US region, strong DB password in a
   password manager).
2. Apply the schema — all migrations, in order:
   ```bash
   supabase link --project-ref <your-project-ref>
   supabase db push
   ```
3. **Do NOT run `supabase/seed.sql` in production** (it's demo data). Create
   your real organization and admin user instead:
   ```sql
   insert into public.organizations (name, slug) values ('<Agency Name>', '<agency-slug>');
   insert into public.users (organization_id, full_name, email, license_type)
     values ('<org-id>', '<Your Name>', '<you@agency.com>', 'life_health');
   insert into public.user_roles (organization_id, user_id, role)
     values ('<org-id>', '<user-id>', 'admin');
   -- After creating your Supabase Auth account (sign-up or dashboard invite):
   update public.users set auth_user_id = '<auth-uid>' where id = '<user-id>';
   ```
4. Enable Point-in-Time Recovery in the dashboard and **rehearse one restore**.

## Gate 3 — Deploy configuration

Set in the hosting environment (never in the repo). See `.env.example` for
the full list:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- `ANTHROPIC_API_KEY` — only after Gate 1 is signed
- `AI_REVIEW_MODEL` (optional override), `AI_REVIEW_DAILY_LIMIT` (cost ceiling)
- `APP_ENV=production`
- Confirm `DEMO_BYPASS_AUTH` is **unset** in every non-local environment

## Final checklist

- [ ] BAA chain executed (AI provider, Supabase, host)
- [ ] Migrations applied via `supabase db push`; real org + admin created
- [ ] PITR enabled; one restore rehearsed
- [ ] Secrets set in deploy env; `DEMO_BYPASS_AUTH` unset everywhere
- [ ] CI green on the deployed commit
- [ ] Smoke test signed in as the real admin: import `demo-book.csv` into a
      TEST org, see `/book` populate, run one AI review, print an audit pack,
      then delete the test org's data
- [ ] First real book import: dry-run first, review the error report, commit
