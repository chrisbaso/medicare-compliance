# PRODUCT_SPEC

## Product Thesis
This product is a compliance-first operations platform for Medicare agencies. It helps agencies manage intake, conversations, transcript summaries, consent records, workflow routing, compliance QA, client service work, and separate follow-up opportunities. It is not a sales bot and it must never blur the line between Medicare activity and retirement-income or annuity follow-up.

## Core Guardrails
- Do not recommend Medicare plans.
- Do not recommend annuities.
- Do not let AI choose a plan, product, or annuity.
- Keep Medicare workflows separate from retirement-income / annuity workflows.
- If retirement-income interest appears during a Medicare conversation, create a separate consented workflow.
- Maintain auditable records for who acted, what changed, when it changed, the source context, consent status, and next action.

## MVP Scope

### Included
- Agency dashboard
- Client list
- Client detail page
- Conversation inbox
- Conversation detail page with summary, transcript evidence, detected topics, flags, and next actions
- Consent ledger
- Retirement-income follow-up opportunity workflow
- Compliance QA dashboard
- Unified task list
- Realistic demo data

### Not Included
- Authentication
- External CRM, telephony, or data integrations
- Autonomous outbound sales
- AI-generated product recommendations
- Plan quoting or plan selection workflows
- Annuity recommendation workflows
- Production persistence beyond the Postgres-ready schema/design

## Primary Users
- Medicare Supplement agencies
- Senior-market insurance agencies
- Agency owners
- Licensed agents
- Service staff
- Managers and compliance reviewers
- Future FMO / IMO views later

## Key Domain Concepts
- `Agency`
- `User`
- `Client`
- `Conversation`
- `TranscriptEntry`
- `ConsentRecord`
- `ComplianceFlag`
- `QaReview`
- `FollowUpOpportunity`
- `Task`
- `AuditEvent`

## Workflow Expectations

### Medicare Operations
- Intake, service, and conversation review should remain operational and compliance-oriented.
- Conversations should surface transcript-backed summaries, detected topics, compliance flags, and next actions.
- Missing or incomplete consent should visibly block downstream work when appropriate.

### Retirement-Income Follow-Up
- Retirement-income or annuity interest detected in a Medicare conversation should not change the Medicare workflow into a sales flow.
- The app should create or route to a separate follow-up opportunity.
- Separate follow-up should require explicit consent and assignment to a licensed human before outreach.

### Compliance and Auditability
- Consent records must be explicit and auditable.
- Compliance reviewers need a clear dashboard for flagged conversations and QA determinations.
- Tasks should unify work across intake, service, compliance, and separate follow-up queues.

## UX Direction
- Professional SaaS admin UI
- Clean reusable components
- Operational clarity over marketing language
- Thin pages with reusable cards, badges, tables, detail panels, and timelines

## Success Criteria
- All MVP routes render from realistic demo data
- Medicare and retirement-income workflows remain visibly separate
- Consent and audit state are easy to inspect
- Demo interactions update local state consistently
- The codebase stays ready for a future Postgres-backed data layer
