# AGENTS.md

## Purpose
This repository is a compliance-first operations platform for Medicare agencies. Any Codex agent working here must preserve the product intent and engineering standards below.

## Product Intent
- This app is a compliance-first operations platform for Medicare agencies.
- It is not an AI sales bot.
- It must not recommend Medicare plans.
- It must not recommend annuities.
- It must keep Medicare workflows separate from retirement-income / annuity follow-up workflows.
- If retirement-income interest appears in a Medicare conversation, route it to a separate consented workflow.
- Always preserve auditability: who, what, when, source, consent status, and next action.

## Compliance-Oriented Product Constraints
- Do not implement autonomous outbound sales.
- Do not implement AI-generated product recommendations.
- Do not let AI choose a plan or annuity.
- Do not combine Medicare health/drug plan sales with annuity or life-insurance sales workflows.
- Prefer human-in-the-loop handoffs.
- Consent records must be explicit and auditable.

## Engineering Preferences
- Use TypeScript strictly.
- Prefer small, reviewable changes.
- Keep pages thin and move logic into `lib/` or `components/`.
- Keep fake demo data realistic and professional.
- Avoid unnecessary dependencies.
- Use reusable components for cards, badges, tables, detail panels, and timelines.
- Run lint and typecheck after meaningful changes if scripts exist.
- Explain major architectural changes briefly.

## Working Guidance
- Preserve the separation between Medicare operations and retirement-income follow-up in data models, UI, and workflow logic.
- Favor clear status enums and explicit transitions over implicit booleans when workflow state matters.
- Keep audit trails and consent states visible in the UX, not hidden in implementation details.
- When adding demo interactions, make them locally stateful and traceable rather than magical.
- Prefer operational language over marketing language in the UI.
