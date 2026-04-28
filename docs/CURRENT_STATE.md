# CURRENT_STATE

## Product State
- The app is a compliance-first Medicare agency operations demo built on realistic local fake data.
- Medicare workflows and retirement-income follow-up workflows remain visually and operationally separate.
- Pages are optimized for manager review, service coordination, compliance oversight, and auditable next actions rather than product recommendation.

## Implemented Routes
- `/dashboard` provides an operations homepage with queue counts, conversation review visibility, compliance alerts, separate follow-up opportunities, and near-term task visibility.
- `/clients` provides a searchable client list with consent, task, and opportunity context.
- `/clients/[id]` provides a client workspace with Medicare status, consent history, conversations, compliance flags, separate follow-up signals, tasks, and audit history.
- `/compliance` provides a triage-oriented compliance review page with summary cards, flag severity counts, open high-risk visibility, resolved versus unresolved tracking, lightweight queue filters, and local demo review actions for marking reviewed, resolving, assigning a reviewer, and opening source conversations.
- `/consents` provides a ledger-style consent table with auditable source context, disclosure versions, capture ownership, clear visual separation between Medicare consent and separate follow-up consent, stronger blocker visibility when separate follow-up cannot proceed, and local demo actions for capture, revoke, and source review.
- `/opportunities` provides a separate follow-up workflow page with signal, consent, blocker, assignment, next-action visibility, and local demo stage transitions with lightweight history for consent-gated human follow-up work.
- `/tasks` provides a usable operations task list with client, related source context, lightweight filters, local completion actions, and connected links back into client, conversation, and workflow surfaces.
- `/conversations` provides a polished triage inbox with overview counts, lightweight focus filters, grouped risk and opportunity indicators, and scan-friendly rows that link directly into conversation detail.
- `/conversations/[id]` is now a polished conversation review surface with a command-center header, deterministic AI-style summary, compliance table, separate follow-up signal panel, local demo next-actions panel, and readable transcript viewer with lightweight phrase highlighting.

## Data and Interaction Model
- Demo data is stored locally and exposed through shared selectors and provider state.
- A Postgres-ready schema reference now lives in `docs/DATABASE_SCHEMA.md`, covering the current core entities, workflow blockers, audit requirements, and migration considerations from fake data to a real database.
- A phased product plan now lives in `docs/ROADMAP.md`, organizing the path from demo MVP through pilot, integrations, human-in-the-loop AI automation, and multi-agency expansion.
- A validation guide now lives in `docs/VALIDATION_CHECKLIST.md`, covering problem validation, workflow fit, compliance concerns, separate follow-up validation, pilot readiness, and simple scoring for demos and customer discovery.
- Transcript analysis is powered by a deterministic local mock service in `src/lib/analysis/` with explicit sample transcripts and expected outputs for reviewable demo behavior.
- Compliance rules are centralized in `src/lib/compliance/rules.ts` with reusable metadata, severities, trigger examples, remediation guidance, and workflow-blocking semantics.
- Reusable consent display primitives now live in `src/lib/consent-view.ts` and `src/components/ui/consent-status-badge.tsx`, including category labeling and distinct visual treatment for Medicare consent versus separate follow-up consent.
- Consent summaries and badges now surface when separate follow-up is blocked due to missing or incomplete explicit consent, while keeping Medicare permissions and separate follow-up permissions visually distinct.
- UI actions are locally stateful for demo purposes and keep auditability visible in the interface.
- No external AI, CRM, telephony, or quoting integration is required for the current demo state.

## Guardrails Preserved
- The product does not recommend Medicare plans.
- The product does not recommend annuities.
- Potential retirement-income interest is treated as a separate consented follow-up workflow, not part of Medicare product guidance.
- Consent state, reviewer state, and workflow blockers remain visible in the UI.
