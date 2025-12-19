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
