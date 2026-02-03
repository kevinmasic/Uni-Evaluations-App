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

-- Checks if an email is already registered in public.users.
create or replace function public.is_email_registered(p_email text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users
    where email = lower(trim(p_email))
  );
$$;

grant execute on function public.is_email_registered(text) to anon, authenticated;

-- Registers a new student profile. Returns true on success.
create or replace function public.register_student(
  p_email text,
  p_matriculation text,
  p_studiengang_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_matriculation text;
begin
  v_email := lower(trim(p_email));
  v_matriculation := trim(p_matriculation);

  if v_email is null or v_email = '' then
    raise exception 'Email required';
  end if;

  if right(v_email, length('@stud.hshl.de')) <> '@stud.hshl.de' then
    raise exception 'Invalid email domain';
  end if;

  if v_matriculation is null or v_matriculation = '' then
    raise exception 'Matriculation required';
  end if;

  if p_studiengang_id is null then
    raise exception 'Studiengang required';
  end if;

  if not exists (select 1 from public.studiengang where id = p_studiengang_id) then
    raise exception 'Studiengang not found';
  end if;

  if exists (select 1 from public.users where email = v_email) then
    raise exception 'Email already registered';
  end if;

  if exists (select 1 from public.users where matriculation_number = v_matriculation) then
    raise exception 'Matriculation already registered';
  end if;

  insert into public.users (email, matriculation_number, studiengang_id)
  values (v_email, v_matriculation, p_studiengang_id);

  return true;
end;
$$;

grant execute on function public.register_student(text, text, uuid) to anon, authenticated;

-- Casts a single up/down vote on an evaluation.
create or replace function public.cast_evaluation_vote(p_evaluation_id bigint, p_vote smallint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_user_studiengang uuid;
  v_eval_studiengang uuid;
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

  select u.studiengang_id
  into v_user_studiengang
  from public.users u
  where u.email = auth.email();

  select m.studiengang_id
  into v_eval_studiengang
  from public.evaluations e
  join public.modul m on m.id = e.modul_id
  where e.evaluation_id = p_evaluation_id;

  if v_user_studiengang is null then
    raise exception 'User has no studiengang assigned';
  end if;

  if v_user_studiengang is distinct from v_eval_studiengang then
    raise exception 'Not allowed to vote for this studiengang';
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
