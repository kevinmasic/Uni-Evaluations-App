alter table public.users enable row level security;
drop policy if exists "users read own" on public.users;
create policy "users read own"
  on public.users for select
  using (auth.email() = email);

alter table public.standort enable row level security;
drop policy if exists "standort read all" on public.standort;
create policy "standort read all"
  on public.standort for select
  using (true);

alter table public.studiengang enable row level security;
drop policy if exists "studiengang read all" on public.studiengang;
create policy "studiengang read all"
  on public.studiengang for select
  using (true);

alter table public.semester enable row level security;
drop policy if exists "semester read all" on public.semester;
create policy "semester read all"
  on public.semester for select
  using (true);

alter table public.modul enable row level security;
drop policy if exists "modul read all" on public.modul;
create policy "modul read all"
  on public.modul for select
  using (true);

alter table public.evaluations enable row level security;
drop policy if exists "eval select public" on public.evaluations;
drop policy if exists "eval insert own" on public.evaluations;
drop policy if exists "eval update own" on public.evaluations;
drop policy if exists "eval delete own" on public.evaluations;

create policy "eval select public"
  on public.evaluations for select
  using (true);

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

alter table public.evaluation_votes enable row level security;
drop policy if exists "eval votes read own" on public.evaluation_votes;
drop policy if exists "eval votes insert own" on public.evaluation_votes;

create policy "eval votes read own"
  on public.evaluation_votes for select
  using (auth.uid() = voter_id);

create policy "eval votes insert own"
  on public.evaluation_votes for insert
  with check (auth.uid() = voter_id);
