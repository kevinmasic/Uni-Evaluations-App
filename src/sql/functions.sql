-- Helper functions for Supabase (execute in SQL Editor)

-- Verifies that a matriculation number belongs to an e-mail address.
-- Returns true only if the pair exists in public.users.
create or replace function public.verify_user_credentials(p_email text, p_matriculation text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users
    where email = lower(trim(p_email))
      and matriculation_number = trim(p_matriculation)
  );
$$;

grant execute on function public.verify_user_credentials(text, text) to anon, authenticated;

-- Casts a single up/down vote on an evaluation.
create or replace function public.cast_evaluation_vote(p_evaluation_id bigint, p_vote smallint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if p_vote not in (-1, 1) then
    raise exception 'Invalid vote';
  end if;

  if exists (
    select 1
    from public.evaluation_votes
    where evaluation_id = p_evaluation_id
      and voter_id = v_uid
  ) then
    raise exception 'Already voted';
  end if;

  insert into public.evaluation_votes (evaluation_id, voter_id, vote)
  values (p_evaluation_id, v_uid, p_vote);

  update public.evaluations
  set upvotes = upvotes + case when p_vote = 1 then 1 else 0 end,
      downvotes = downvotes + case when p_vote = -1 then 1 else 0 end
  where evaluation_id = p_evaluation_id;
end;
$$;

grant execute on function public.cast_evaluation_vote(bigint, smallint) to authenticated;
