# ROADMAP

## Purpose
This roadmap outlines a practical path from the current compliance-first demo into a real product used by Medicare agencies. It keeps Medicare operations and separate retirement-income follow-up distinct, avoids autonomous recommendation features, and favors human-in-the-loop automation.

## Phase 1: Demo MVP

### Features
- Dashboard, clients, conversations, compliance, consents, opportunities, and tasks routes
- Deterministic transcript analysis mock service
- Separate follow-up workflow with explicit consent gating
- Local demo actions for routing, assignment, review, and workflow progression
- Demo documentation including product spec, schema, roadmap, and demo script

### Business Value
- Gives agency owners and partners a concrete product to react to
- Demonstrates the compliance-first positioning clearly
- Proves the separation between Medicare operations and separate follow-up workflows
- Makes investor, partner, and early customer conversations more tangible

### Technical Complexity
- Low to medium
- Mostly frontend, fake data modeling, and local state interactions

### Compliance Considerations
- No Medicare plan recommendation
- No annuity recommendation
- No outbound autonomous sales behavior
- Strong emphasis on consent, blockers, auditability, and human review

### Dependencies
- Current app routes and reusable UI components
- Deterministic mock analysis rules
- Fake data aligned to the intended workflow model

## Phase 2: Real Agency Pilot

### Features
- Real authentication and role-based access
- Postgres-backed persistence based on `docs/DATABASE_SCHEMA.md`
- Real audit log storage and append-only event capture
- Persistent consent ledger with disclosure version, channel, source, and evidence tracking
- Persistent follow-up workflows and workflow stage events
- Basic internal reporting for queue counts, turnaround time, and blocker counts
- Pilot-safe admin tools for managing agency users and teams

### Business Value
- Moves from “interesting demo” to pilot-ready operating system
- Lets an agency use the product on real internal work instead of sample data
- Creates trustworthy audit records that owners and compliance leaders can inspect
- Reduces admin time spent stitching together notes, consent checks, and follow-up routing

### Technical Complexity
- Medium to high
- Requires auth, multitable persistence, migrations, seed data, and careful state replacement

### Compliance Considerations
- Access control must respect role, license, and workflow boundaries
- Audit records should be durable and queryable
- Medicare and separate follow-up data must remain visibly and operationally separate
- Consent gating must become enforceable at the service or database layer, not just in UI

### Dependencies
- Finalize database implementation decision
- Implement schema and migrations
- Add auth/session model
- Replace local demo provider state with real data access patterns

## Phase 3: Integrations

### Features
- CRM sync for clients, activities, and ownership
- Telephony and call-recording ingestion
- Email/SMS intake and consent-request event capture
- Calendar integration for appointment scheduling
- Document/e-sign integration for consent and disclosure workflows
- Import/export utilities for agency migration and reporting

### Business Value
- Reduces duplicate entry across agency systems
- Makes the product fit into real operations instead of sitting beside them
- Improves data completeness for conversations, consent capture, and task routing
- Lowers adoption friction for pilot agencies

### Technical Complexity
- High
- Requires connector architecture, retry handling, sync reconciliation, and operational observability

### Compliance Considerations
- Imported data must preserve source provenance
- Recording and message data must be permission-aware
- Consent evidence needs source-of-truth traceability across systems
- External systems must not blur Medicare activity with separate follow-up activity

### Dependencies
- Stable pilot data model
- Auth and agency tenancy in place
- Audit event pipeline established
- Connector-specific security and data mapping design

## Phase 4: AI Automation

### Features
- Replace deterministic analysis with configurable production AI services
- Human-in-the-loop summarization, topic detection, consent-gap detection, and flag drafting
- Suggested next actions for reviewers, service staff, and managers
- Assisted QA review queues and draft remediation suggestions
- Automated task creation for clear operational follow-through
- Configurable model routing, prompt/version tracking, and evaluation tooling

### Business Value
- Reduces administrative review time without replacing licensed staff
- Improves consistency of summaries, flag detection, and next-step suggestions
- Helps managers prioritize work faster across conversations, consents, and compliance queues
- Makes the product more defensible through workflow intelligence rather than generic chat

### Technical Complexity
- High
- Requires model orchestration, evaluation loops, prompt governance, observability, and fail-safe design

### Compliance Considerations
- AI must not recommend Medicare plans
- AI must not recommend annuities
- AI outputs must stay advisory and human-reviewable
- Separate follow-up signals must route to consented workflows, not sales recommendations
- Model prompts, outputs, and versions should be auditable

### Dependencies
- Real conversation, consent, and workflow data in production
- Strong audit/event foundation
- Evaluation datasets and QA feedback loops
- Guardrail enforcement in both application logic and prompt policy

## Phase 5: Multi-Agency / Admin Expansion

### Features
- Multi-agency administration and tenancy controls
- Agency-level configuration for disclosures, workflows, rule thresholds, and permissions
- FMO / IMO or distribution-partner visibility into aggregate operational metrics
- Cross-agency reporting, benchmarking, and exception monitoring
- Template management for consent language, QA checklists, and workflow playbooks
- Structured admin console for onboarding and support operations

### Business Value
- Expands from single-agency software to a platform offering
- Creates partner/distribution value without turning the product into a quoting engine
- Supports larger revenue opportunities through agency groups and channel relationships
- Makes rollout, governance, and oversight more scalable

### Technical Complexity
- High
- Requires stronger tenancy boundaries, configuration systems, permissions modeling, and reporting infrastructure

### Compliance Considerations
- Tenant isolation becomes critical
- Partner visibility must not expose client data outside permitted boundaries
- Configurability must not enable prohibited recommendation workflows
- Role-based restrictions around separate follow-up access need to remain enforceable at scale

### Dependencies
- Stable pilot deployments
- Production-grade auth, tenancy, and audit systems
- Configurable workflow/rule architecture
- Reporting and admin infrastructure mature enough for cross-agency use

## Guiding Product Principles
- Keep Medicare operations and separate retirement-income follow-up distinct in UI, data, and process
- Favor human-in-the-loop automation over autonomous selling
- Treat consent and auditability as first-class system requirements
- Build workflow efficiency and defensibility before adding broader automation
- Avoid roadmap items that depend on plan recommendation, annuity recommendation, or autonomous outbound sales

## Near-Term Priority Recommendation
If the goal is real commercial learning quickly, the highest-value next sequence is:
1. Complete Phase 2 foundation work for a real pilot
2. Add the minimum Phase 3 integrations needed for pilot operations
3. Introduce narrow, audited human-in-the-loop AI capabilities from Phase 4 only after real workflow data exists
