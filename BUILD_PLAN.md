# MVP Build Plan

## Goal
Ship a demo-first MVP for Medicare agencies that manages intake, consent, transcript review, workflow routing, compliance QA, and separately governed retirement-income follow-up.

## Principles
- Keep Medicare conversations and retirement-income follow-up operationally separate.
- Never recommend plans or annuities in-app.
- Optimize for manager, agent, and service-staff workflows first.
- Use fake/demo data before external integrations.

## Build Steps
1. Define the domain model, compliance rules, routes, and reusable UI primitives.
2. Scaffold a Next.js + TypeScript app with a clean operations-focused shell.
3. Add demo seed data and render the core MVP modules as realistic working screens.
4. Introduce a Postgres-ready schema and server-side data access boundaries.
5. Tighten workflow states, compliance QA logic, and role-based navigation in later slices.

## First Slice
- Agency dashboard
- Conversation inbox
- Consent ledger
- Retirement-income opportunity workflow
- Compliance QA screen
- Client detail page
