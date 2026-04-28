insert into public.organizations (id, name, slug, timezone, vertical_slug)
values ('11111111-1111-4111-8111-111111111111', 'Northstar Senior Benefits', 'northstar-senior-benefits', 'America/Chicago', 'medicare')
on conflict (id) do nothing;

insert into public.users (id, organization_id, full_name, email, license_type, team)
values
  ('22222222-2222-4222-8222-222222222201', '11111111-1111-4111-8111-111111111111', 'Dana Whitaker', 'dana@northstar.example', 'life_health', 'Operations'),
  ('22222222-2222-4222-8222-222222222202', '11111111-1111-4111-8111-111111111111', 'Alex Rivera', 'alex@northstar.example', 'medicare_only', 'Medicare'),
  ('22222222-2222-4222-8222-222222222203', '11111111-1111-4111-8111-111111111111', 'Mia Chen', 'mia@northstar.example', 'none', 'Service'),
  ('22222222-2222-4222-8222-222222222204', '11111111-1111-4111-8111-111111111111', 'Priya Shah', 'priya@northstar.example', 'none', 'Compliance')
on conflict (id) do nothing;

insert into public.user_roles (organization_id, user_id, role)
values
  ('11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222201', 'manager'),
  ('11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222202', 'agent'),
  ('11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222203', 'service_staff'),
  ('11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222204', 'compliance_reviewer')
on conflict do nothing;

insert into public.clients (id, organization_id, first_name, last_name, dob, phone, email, state, preferred_contact_method, status, tags, note)
values
  ('33333333-3333-4333-8333-333333333301', '11111111-1111-4111-8111-111111111111', 'Margaret', 'Ellis', '1961-07-18', '312-555-0145', 'margaret.ellis@example.com', 'IL', 'phone', 'new_to_medicare', array['turning_65'], 'Turning 65 intake with SOA pending.'),
  ('33333333-3333-4333-8333-333333333302', '11111111-1111-4111-8111-111111111111', 'Harold', 'Bennett', '1954-02-09', '217-555-0118', 'harold.bennett@example.com', 'IL', 'phone', 'active_review', array['premium_pressure'], 'Premium pressure surfaced during Medicare review.'),
  ('33333333-3333-4333-8333-333333333303', '11111111-1111-4111-8111-111111111111', 'Linda', 'Park', '1956-10-22', '630-555-0160', 'linda.park@example.com', 'IL', 'email', 'watch', array['retirement_follow_up'], 'Separate follow-up consent granted.')
on conflict (id) do nothing;

insert into public.conversations (id, organization_id, client_id, owner_user_id, channel, status, started_at, ended_at, summary, medicare_scope, routing_state, detected_topics, retirement_interest_detected, next_step)
values
  ('44444444-4444-4444-8444-444444444401', '11111111-1111-4111-8111-111111111111', '33333333-3333-4333-8333-333333333301', '22222222-2222-4222-8222-222222222202', 'phone', 'in_review', '2026-04-27T10:00:00-05:00', '2026-04-27T10:22:00-05:00', 'Turning-65 intake with missing SOA confirmation.', 'Turning 65 Medicare intake', 'awaiting_review', array['turning_65','medigap_review'], false, 'Capture SOA before plan-specific review.'),
  ('44444444-4444-4444-8444-444444444402', '11111111-1111-4111-8111-111111111111', '33333333-3333-4333-8333-333333333302', '22222222-2222-4222-8222-222222222202', 'phone', 'in_review', '2026-04-27T13:30:00-05:00', '2026-04-27T13:55:00-05:00', 'Premium pressure and retirement-income concern appeared during Medicare review.', 'Medicare Supplement review', 'blocked', array['medigap_review','premium_increase','retirement_income_interest'], true, 'Compliance review and separate consent required before any follow-up.'),
  ('44444444-4444-4444-8444-444444444403', '11111111-1111-4111-8111-111111111111', '33333333-3333-4333-8333-333333333303', '22222222-2222-4222-8222-222222222201', 'phone', 'routed', '2026-04-26T09:15:00-05:00', '2026-04-26T09:40:00-05:00', 'Separate retirement-income follow-up consent captured after Medicare-origin signal.', 'Separate follow-up consent capture', 'complete', array['retirement_income_interest','consent'], true, 'Assign licensed owner.')
on conflict (id) do nothing;

insert into public.conversation_messages (organization_id, conversation_id, speaker_type, speaker_name, utterance, spoken_at, sequence_number)
values
  ('11111111-1111-4111-8111-111111111111', '44444444-4444-4444-8444-444444444402', 'client', 'Harold Bennett', 'My Medicare supplement premium jumped again and I am worried about my retirement income lasting.', '2026-04-27T13:32:00-05:00', 1),
  ('11111111-1111-4111-8111-111111111111', '44444444-4444-4444-8444-444444444402', 'agent', 'Alex Rivera', 'We can look at Medicare options, and maybe talk later about an annuity if that helps the income concern.', '2026-04-27T13:34:00-05:00', 2)
on conflict do nothing;

insert into public.consents (id, organization_id, client_id, conversation_id, consent_type, category, status, disclosure_version, channel, captured_at, captured_by_user_id, source, capture_method, evidence_ref, evidence_complete, notes)
values
  ('55555555-5555-4555-8555-555555555501', '11111111-1111-4111-8111-111111111111', '33333333-3333-4333-8333-333333333301', '44444444-4444-4444-8444-444444444401', 'soa', 'medicare', 'pending', 'SOA-2026-01', 'phone', '2026-04-27T10:05:00-05:00', '22222222-2222-4222-8222-222222222202', 'conversation', 'recorded line', 'CALL-444401', false, 'SOA was discussed but evidence is incomplete.'),
  ('55555555-5555-4555-8555-555555555502', '11111111-1111-4111-8111-111111111111', '33333333-3333-4333-8333-333333333303', '44444444-4444-4444-8444-444444444403', 'retirement_follow_up', 'separate_retirement_follow_up', 'granted', 'RET-FU-2026-01', 'phone', '2026-04-26T09:22:00-05:00', '22222222-2222-4222-8222-222222222201', 'conversation', 'recorded line', 'CALL-444403', true, 'Explicit consent captured for separate licensed follow-up.')
on conflict (id) do nothing;

insert into public.compliance_flags (id, organization_id, conversation_id, client_id, flag_type, severity, status, rule_id, transcript_offset_start, transcript_offset_end, quoted_text, reasoning, suggested_remediation, detected_by, assigned_user_id)
values
  ('66666666-6666-4666-8666-666666666601', '11111111-1111-4111-8111-111111111111', '44444444-4444-4444-8444-444444444402', '33333333-3333-4333-8333-333333333302', 'retirement_income_without_consent', 'high', 'open', 'missing_separate_follow_up_consent', 51, 68, 'retirement income', 'Retirement-income interest appeared during a Medicare review without separate consent.', 'Create a separate consented workflow before any follow-up.', 'ai_review', '22222222-2222-4222-8222-222222222204')
on conflict (id) do nothing;

insert into public.retirement_opportunities (id, organization_id, client_id, source_conversation_id, signal_type, signal_summary, status, explicit_consent_status, assigned_user_id, requested_at, last_updated_at, next_step)
values
  ('77777777-7777-4777-8777-777777777701', '11111111-1111-4111-8111-111111111111', '33333333-3333-4333-8333-333333333303', '44444444-4444-4444-8444-444444444403', 'retirement_income_interest', 'Client requested a later licensed retirement-income conversation.', 'assigned', 'granted', '22222222-2222-4222-8222-222222222201', '2026-04-26T09:24:00-05:00', '2026-04-26T09:30:00-05:00', 'Complete licensed follow-up call outside Medicare workflow.')
on conflict (id) do nothing;

insert into public.tasks (organization_id, client_id, source_type, source_id, title, queue, status, priority, assigned_user_id, due_at)
values
  ('11111111-1111-4111-8111-111111111111', '33333333-3333-4333-8333-333333333301', 'consent', '55555555-5555-4555-8555-555555555501', 'Complete SOA evidence before Medicare plan-specific discussion', 'intake', 'open', 'high', '22222222-2222-4222-8222-222222222202', '2026-04-29T10:00:00-05:00'),
  ('11111111-1111-4111-8111-111111111111', '33333333-3333-4333-8333-333333333302', 'conversation', '44444444-4444-4444-8444-444444444402', 'Review cross-sell language and coach neutral phrasing', 'compliance', 'open', 'urgent', '22222222-2222-4222-8222-222222222204', '2026-04-29T12:00:00-05:00')
on conflict do nothing;

insert into public.audit_logs (organization_id, entity_type, entity_id, action, actor_user_id, actor_role, source, correlation_id, before_state, after_state, consent_status_snapshot, next_action, detail)
values
  ('11111111-1111-4111-8111-111111111111', 'conversation', '44444444-4444-4444-8444-444444444402', 'ai_review_flagged', '22222222-2222-4222-8222-222222222204', 'compliance_reviewer', 'seed', 'seed-ai-review-001', '{}'::jsonb, '{"flag_id":"66666666-6666-4666-8666-666666666601"}'::jsonb, 'missing', 'Compliance reviewer confirms or dismisses flag.', 'Seeded AI review flag created for demo transcript.')
on conflict do nothing;
