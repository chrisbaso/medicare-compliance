# Medicare Compliance Rules

This document is product guidance for the MVP, not legal advice. A compliance officer or counsel should review exact rule wording before production use.

Primary sources consulted:
- [CMS Medicare Marketing Guidelines page](https://www.cms.gov/Medicare/Health-Plans/ManagedCareMarketing/FinalPartCMarketingGuidelines.html)
- [42 CFR 422.2264, Beneficiary contact](https://www.ecfr.gov/current/title-42/chapter-IV/subchapter-B/part-422/subpart-V/section-422.2264)
- [42 CFR 423.2264, Beneficiary contact](https://www.ecfr.gov/current/title-42/chapter-IV/subchapter-B/part-423/subpart-V/section-423.2264)
- [CMS Contract Year 2025 MA and Part D Final Rule fact sheet](https://www.cms.gov/newsroom/fact-sheets/contract-year-2025-medicare-advantage-and-part-d-final-rule-cms-4205-f)

## Rules Checked By The MVP

| Rule | What the app flags | Rationale |
|---|---|---|
| Scope of Appointment required | Medicare plan-related transcript text without SOA evidence | Personal marketing appointments require a documented SOA in applicable MA/Part D contexts. |
| Cross-sell contamination | Annuity, life-insurance, or retirement-income discussion inside Medicare workflow | 42 CFR 422.2264 restricts marketing beyond the agreed scope and prohibits marketing non-health products such as annuities during the appointment. |
| Retirement-income mention without separate consent | Retirement-income interest with no separate follow-up consent | The product policy requires a separate consented workflow before follow-up. |
| Plan recommendation language | "Best plan", "you should enroll", or similar directive language | AI and workflow tools must not choose or recommend plans. |
| Prohibited compensation discussion | Commission, bonus, or compensation discussion in beneficiary-facing transcript | CMS has emphasized guardrails around agent/broker compensation and steering risk. |
| Unsupported claims | Guarantees, "no risk", "always approved" | Misleading certainty language requires human review. |
| High-pressure language | "Act now", "limited time", similar pressure wording | Reviewers need to catch urgency that can undermine informed choice. |
| Incomplete licensed-human handoff | Retirement-income signal without handoff to a licensed human | Non-Medicare product discussions must remain outside the Medicare workflow and be handled by qualified humans. |

## Product Guardrail

The AI review pipeline may summarize, flag, cite, explain, and route. It must not recommend a Medicare plan, annuity, life-insurance product, or retirement-income product.
