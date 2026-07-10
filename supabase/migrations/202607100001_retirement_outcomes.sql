-- Placement outcomes on the licensed retirement workflow.
--
-- Records what a consented, licensed follow-up actually produced so the
-- pipeline can report its own economics (placements, premium written,
-- commission) — the ROI evidence for the compliant-lead lane. Outcome
-- writes inherit the existing role-restricted RLS on
-- retirement_opportunities (admin/manager only).

alter table public.retirement_opportunities
  add column outcome text not null default 'pending'
    check (outcome in ('pending', 'placed', 'declined', 'closed')),
  add column premium_written numeric check (premium_written >= 0),
  add column commission_amount numeric check (commission_amount >= 0),
  add column outcome_recorded_at timestamptz,
  add column outcome_note text;
