# BUILD_PLAN

## Milestone 1: Foundation And Shared UI

### Scope
- Establish the shared app shell
- Standardize reusable UI primitives
- Keep the app TypeScript-first and componentized
- Keep pages thin and push logic into `lib/` and `components/`

### Acceptance Criteria
- Shared layout and navigation exist
- Reusable cards, badges, tables, and detail-panel patterns exist
- Styling system is consistent across pages
- Domain types are strong enough to support all MVP routes

## Milestone 2: Demo Data And Workflow Model

### Scope
- Seed realistic demo users, clients, conversations, consents, flags, QA reviews, tasks, follow-up opportunities, and audit events
- Keep the data model Postgres-ready
- Encode the workflow separation between Medicare operations and retirement-income follow-up

### Acceptance Criteria
- Demo data covers clean, blocked, escalated, and follow-up scenarios
- Consent and audit states are explicit
- Retirement-interest scenarios always map to a separate workflow object
- Shared selectors/helpers support route-level summaries and counts

## Milestone 3: Core MVP Surfaces

### Scope
- Dashboard
- Client list and detail
- Conversation inbox and detail
- Consent ledger
- Compliance QA dashboard
- Task list
- Separate retirement-income follow-up workflow

### Acceptance Criteria
- All MVP routes exist and are navigable
- Each route uses reusable components rather than ad hoc layouts
- Each route clearly shows the operational state, consent state, and next action where relevant

## Milestone 4: Interactive Demo Actions

### Scope
- Local demo-state updates for task status, assignment, consent status, conversation routing, QA outcome, and follow-up progression
- Preserve auditability and visible workflow boundaries in the UI

### Acceptance Criteria
- The app behaves like an interactive demo, not just a static mock
- State changes propagate across related views
- Retirement-income follow-up remains restricted and separate in the UI model
- Major actions leave enough local traceability to support demos and future persistence

## Milestone 5: Hardening For Future Persistence

### Scope
- Align frontend models with the SQL schema
- Keep data access boundaries clean so demo data can later be replaced with Postgres
- Avoid unnecessary dependencies and keep changes reviewable

### Acceptance Criteria
- Frontend models and schema are internally consistent
- No page depends on one-off page-local mock structures
- The app can be transitioned to real persistence without major UI rewrites
- Lint and type/build verification run successfully after meaningful changes when scripts exist
