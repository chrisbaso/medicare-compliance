# Product Spec

## Positioning

Compliance Ops for Medicare Agencies is an internal operations platform for agency owners, managers, service staff, agents, and compliance reviewers.

It helps teams answer:
- What happened in this Medicare conversation?
- What consent existed at the time?
- What compliance issues need human review?
- What work is blocked?
- If retirement-income interest appeared, was it moved into a separate consented workflow?

## Non-Goals

- No Medicare plan recommendations.
- No annuity recommendations.
- No autonomous outbound sales.
- No combined Medicare and retirement-income sales workflow.
- No tax vertical in this MVP.

## Modules

### Landing Page

The public root route explains the product in under 30 seconds and links to the live demo story.

### Dashboard

The operational homepage summarizes open flags, consent blockers, tasks, conversations needing review, and separate follow-up visibility.

### Conversation Inbox

The inbox lets staff triage conversations by client, risk, topic, status, and detected separate follow-up signal.

### Conversation Detail

The detail page is the MVP centerpiece:
- Stored transcript display
- Paste/upload transcript input
- AI compliance review
- Inline highlighted flagged text
- Structured flags with rule, severity, quote, reasoning, and remediation
- Human confirm/dismiss decision with reason
- Separate follow-up action panel

### Consent Ledger

The ledger displays Medicare consent and separate retirement-income follow-up consent distinctly. Consent records are immutable in the intended persistence model. Local demo actions now append new consent events instead of rewriting the original event.

### Retirement-Income Follow-Up

This is a separate workflow view. It only shows consent-cleared or explicitly tracked separate follow-up work, with licensed assignment controls and source traceability back to the Medicare conversation.

### Compliance QA

The QA dashboard filters flags by status, severity, rule, reviewer, and owner. Reviewers can resolve or dismiss flags in local demo state.

### Clients

Client list/detail pages show Medicare operational status, consent records, conversations, flags, tasks, separate follow-up indicators, and audit history.

### Tasks

Unified task list across intake, service, compliance, and separate follow-up queues.

## Data Model

The Supabase migration includes organization-scoped tables for users, roles, clients, conversations, messages, consent records, workflow states/transitions, compliance flags, retirement opportunities, tasks, and audit logs.

## AI Behavior

AI review may:
- Summarize
- Flag
- Cite transcript text
- Explain reasoning
- Suggest remediation
- Route to human review

AI review may not:
- Choose a Medicare plan
- Recommend an annuity or insurance product
- Initiate outreach
- Advance a retirement-income workflow automatically

## Demo Agency

Seed data is tuned around `Northstar Senior Benefits`, a fictional Medicare agency with realistic users, clients, conversations, consent records, flags, tasks, and audit logs.
