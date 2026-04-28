# Future Tax Vertical

Do not build this yet. This is the implementation sketch.

## Pack Location

`src/lib/verticals/tax/`

## Pack Contents

- `compliance-rules.ts`: Circular 230, engagement-letter, preparer review, data-retention, and consent-to-disclose checks.
- `workflows.ts`: prospect intake, engagement letter, document collection, prep, review, filing, amendment, notice response.
- `documents.tsx`: engagement letter, document request list, e-file authorization checklist, notice response checklist.
- `vocabulary.ts`: taxpayer, return, organizer, notice, filing season.
- `ai-prompts.ts`: document completeness review, notice summarization, risk flagging.
- `seasonality.ts`: filing season, extension season, notice cycles, year-end planning windows.

## Separation From Medicare

The tax pack should reuse `src/lib/core/` primitives but have separate workflow domain values, documents, prompts, and compliance rules. It should not import Medicare rules or labels.
