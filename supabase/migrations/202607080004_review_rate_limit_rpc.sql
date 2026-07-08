-- Atomic per-org review rate limiting.
--
-- Replaces the app-side count-then-insert (which had a small race window) with a
-- single function that serializes per-organization via a transaction advisory
-- lock, counts today's calls, and inserts only when under the limit.

create or replace function public.record_review_call(
  p_organization_id uuid,
  p_conversation_id uuid,
  p_limit integer
)
returns table(allowed boolean, calls_today integer)
language plpgsql
set search_path = public
as $$
declare
  v_count integer;
begin
  -- Serialize concurrent calls for the same organization within this txn.
  perform pg_advisory_xact_lock(hashtext(p_organization_id::text));

  select count(*)
  into v_count
  from public.review_call_log
  where organization_id = p_organization_id
    and called_at >= date_trunc('day', (now() at time zone 'utc'));

  if v_count >= p_limit then
    return query select false, v_count;
    return;
  end if;

  insert into public.review_call_log (organization_id, conversation_id)
  values (p_organization_id, p_conversation_id);

  return query select true, v_count + 1;
end;
$$;
