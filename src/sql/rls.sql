alter table public.courses enable row level security;
drop policy if exists "courses are readable by anyone" on public.courses;
create policy "courses are readable by anyone"
  on public.courses for select
  using (true);

alter table public.evaluations enable row level security;
drop policy if exists "eval select own" on public.evaluations;
drop policy if exists "eval insert own" on public.evaluations;
drop policy if exists "eval update own" on public.evaluations;
drop policy if exists "eval delete own" on public.evaluations;

create policy "eval select own"
  on public.evaluations for select
  using (auth.email() = user_email);

create policy "eval insert own"
  on public.evaluations for insert
  with check (auth.email() = user_email);

create policy "eval update own"
  on public.evaluations for update
  using (auth.email() = user_email)
  with check (auth.email() = user_email);

create policy "eval delete own"
  on public.evaluations for delete
  using (auth.email() = user_email);
