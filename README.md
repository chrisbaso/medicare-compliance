# Compliance-Based Medicare System

Compliance-Based Medicare System is a demo-first, compliance-first operations platform for Medicare agencies. It is designed to support intake, conversation review, consent tracking, compliance QA, client service workflows, and a strictly separate retirement-income follow-up workflow.

## Product Summary
- Internal operations platform for Medicare agencies
- Not an AI sales bot
- No Medicare plan recommendations
- No annuity recommendations
- Medicare workflows stay separate from retirement-income / annuity follow-up
- Retirement-income interest must move into a separate, consented, auditable workflow
- Human-in-the-loop handoffs are preferred over autonomous action

## Current MVP Shape
- Agency dashboard
- Client list and client detail
- Conversation inbox and conversation detail
- Consent ledger
- Retirement-income follow-up workflow
- Compliance QA dashboard
- Unified task list
- Demo data with Postgres-ready domain types

## Tech Stack
- Next.js App Router
- TypeScript
- Tailwind CSS
- Demo-data-first architecture with Postgres-ready schema

## Local Setup
1. Install dependencies:

```bash
npm install
```

2. Start the local dev server:

```bash
npm run dev
```

3. Build for production verification:

```bash
npm run build
```

4. Run lint if available:

```bash
npm run lint
```

## Notes
- This repo currently uses demo data only.
- No authentication or external integrations are wired yet.
- The app should preserve auditable workflow records: who, what, when, source, consent status, and next action.

## Docs
- [Product spec](docs/PRODUCT_SPEC.md)
- [Build plan](docs/BUILD_PLAN.md)
- [Earlier architecture notes](docs/mvp-architecture.md)
