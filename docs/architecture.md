# Architecture

## Product Shape

This repository is now organized around a generic compliance operations substrate with Medicare as the first vertical pack.

The core rule is separation:
- Medicare operations live in Medicare conversation, consent, compliance, task, and workflow records.
- Retirement-income follow-up lives in `retirement_opportunities`, a separate workflow table and separate UI.
- Audit logs connect the boundary so a reviewer can trace source and consent, but the operational workflows do not merge.

## Platform Substrate

Core files live in `src/lib/core/`:

- `workflows/state-machine.ts`: explicit state transitions with audit labels, consent requirements, and task generation hints.
- `audit/audit-log.ts`: append-only audit event primitives with actor, source, before/after state, consent snapshot, next action, and correlation ID.
- `consent/consent-ledger.ts`: append-only consent creation and revocation. Revocation creates a new record.
- `ai-review/`: provider-agnostic compliance review pipeline with structured flag output and deterministic fallback.
- `llm/`: provider interface plus Anthropic REST implementation scaffold.
- `rbac/roles.ts`: application role permissions and retirement-follow-up access checks.
- `supabase/rest-client.ts`: dependency-free Supabase REST/Auth bridge until official SDK packages can be installed.
- `logging/logger.ts`, `notifications/`, and `reporting/`: shared operational primitives.

## Vertical Packs

Vertical packs live in `src/lib/verticals/<slug>/`.

The Medicare pack includes:
- `compliance-rules.ts`
- `workflows.ts`
- `documents.tsx`
- `vocabulary.ts`
- `ai-prompts.ts`
- `seasonality.ts`

`src/lib/verticals/_template/` documents the contract for future packs.

## Supabase

The initial migration is `supabase/migrations/202604280001_initial_compliance_ops.sql`.

It creates:
- `organizations`
- `users`
- `user_roles`
- `clients`
- `conversations`
- `conversation_messages`
- `consents`
- `workflow_states`
- `workflow_transitions`
- `audit_logs`
- `compliance_flags`
- `retirement_opportunities`
- `tasks`

Every business table includes `organization_id`. RLS policies restrict organization-scoped data using the current authenticated user's organization memberships. `consents` and `audit_logs` are append-only through database triggers.

`supabase/seed.sql` creates the demo agency `Northstar Senior Benefits` with realistic users, clients, conversations, consent records, flags, tasks, and audit events.

## AI Review

The AI review pipeline accepts transcript text and returns structured flags:

- `flag_type`
- `severity`
- `rule_id`
- `transcript_offset_start`
- `transcript_offset_end`
- `quoted_text`
- `reasoning`
- `suggested_remediation`

When an LLM provider is unavailable, the local deterministic review still demonstrates meaningful behavior for missing SOA, retirement-income mentions without separate consent, cross-sell language, plan recommendation language, compensation discussion, and unsupported claims.

## Future Tax Pack

A tax vertical should add `src/lib/verticals/tax/` with its own rules, vocabulary, seasonality, documents, and prompts. It should reuse the same core workflow, audit, consent, AI review, RBAC, notification, and reporting primitives. It should not reuse Medicare-specific tables or copy Medicare workflow labels.
