# Decisions Needed

Unresolved owner actions and decisions as of 2026-07-10. Technical setup that
used to live here is now automated (`npm run setup:dev`, CI) or scripted in
`docs/PRODUCTION_CUTOVER.md`.

## Owner Actions Required (production only — demo/pilot needs none of these)

### Execute the BAA chain
- AI provider (Anthropic direct, or AWS Bedrock via the self-service AWS BAA),
  Supabase Team + HIPAA add-on, and a host covered by a BAA.
- Gates real beneficiary data only. See `docs/PRODUCTION_CUTOVER.md` Gate 1.

### Create the production Supabase project and set deploy secrets
- `supabase db push`, real org + admin (NOT the demo seed), PITR + one
  rehearsed restore, secrets in the hosting environment.
- See `docs/PRODUCTION_CUTOVER.md` Gates 2–3.

## Open Decisions

### Merge `review/full-audit` into `main`
- All work since the audit lives on `review/full-audit` (CI-green). `main` is
  materially behind. Decide when to merge; nothing blocks it.

### Hosting route
- Recommended: Next.js on AWS under the same AWS BAA as Bedrock (cheapest
  compliant chain). Alternative: Vercel Enterprise.

### Partner-model legal structure
- Commission-sharing mechanics for the retirement-lead partner arrangement
  are state-by-state; needs ~1 hour of insurance-attorney review before the
  first split is paid. Consent-script wording should name the outside
  licensed partner explicitly.

## Product Decisions Made

- Keep demo state for not-yet-wired screens; wire screens to live Supabase
  incrementally (done so far: `/book`, `/audit-pack`, `/retirement-pipeline`,
  `/conversations/[id]`).
- The platform never recommends plans or products; retirement signals are
  suppressed until separate documented consent exists. This is load-bearing —
  do not weaken.
