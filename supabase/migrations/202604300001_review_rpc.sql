create or replace function public.insert_review_results(
  p_conversation_id uuid,
  p_actor_user_id uuid,
  p_actor_role text,
  p_provider text,
  p_model text,
  p_prompt_version text,
  p_flags jsonb,
  p_consent_status_snapshot text,
  p_correlation_id text
)
returns setof public.compliance_flags
language plpgsql
set search_path = public
as $$
declare
  v_conversation public.conversations%rowtype;
  v_flag record;
  v_inserted public.compliance_flags%rowtype;
begin
  if p_provider = 'deterministic' then
    raise exception 'Deterministic review results cannot be persisted';
  end if;

  if jsonb_typeof(p_flags) is distinct from 'array' then
    raise exception 'p_flags must be a JSON array';
  end if;

  select *
  into v_conversation
  from public.conversations
  where id = p_conversation_id;

  if not found then
    raise exception 'Conversation % was not found or is not accessible', p_conversation_id;
  end if;

  for v_flag in
    select *
    from jsonb_to_recordset(p_flags) as flag_rows(
      flag_type text,
      severity public.flag_severity,
      rule_id text,
      transcript_offset_start integer,
      transcript_offset_end integer,
      quoted_text text,
      reasoning text,
      suggested_remediation text
    )
  loop
    insert into public.compliance_flags (
      organization_id,
      conversation_id,
      client_id,
      flag_type,
      severity,
      status,
      rule_id,
      transcript_offset_start,
      transcript_offset_end,
      quoted_text,
      reasoning,
      suggested_remediation,
      detected_by,
      metadata
    )
    values (
      v_conversation.organization_id,
      v_conversation.id,
      v_conversation.client_id,
      v_flag.flag_type,
      v_flag.severity,
      'open',
      v_flag.rule_id,
      v_flag.transcript_offset_start,
      v_flag.transcript_offset_end,
      v_flag.quoted_text,
      v_flag.reasoning,
      v_flag.suggested_remediation,
      'ai_review',
      jsonb_build_object(
        'provider', p_provider,
        'model', p_model,
        'prompt_version', p_prompt_version,
        'correlation_id', p_correlation_id
      )
    )
    returning * into v_inserted;

    return next v_inserted;
  end loop;

  insert into public.audit_logs (
    organization_id,
    entity_type,
    entity_id,
    action,
    actor_user_id,
    actor_role,
    source,
    correlation_id,
    before_state,
    after_state,
    consent_status_snapshot,
    next_action,
    detail,
    metadata
  )
  values (
    v_conversation.organization_id,
    'conversation',
    v_conversation.id,
    'ai_review_completed',
    p_actor_user_id,
    p_actor_role,
    'ai_review_api',
    p_correlation_id,
    jsonb_build_object('conversation_status', v_conversation.status),
    jsonb_build_object(
      'flag_count', jsonb_array_length(p_flags),
      'provider', p_provider,
      'model', p_model,
      'prompt_version', p_prompt_version
    ),
    p_consent_status_snapshot,
    'Human reviewer confirms or dismisses each flag with a documented reason.',
    'AI compliance review completed and flags were inserted for human review.',
    jsonb_build_object('provider', p_provider, 'model', p_model)
  );
end;
$$;
