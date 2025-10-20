-- Row Level Security Policies (Supabase Auth)
alter table public.courses enable row level security;
alter table public.evaluations enable row level security;

-- Kurse: öffentlich lesbar
create policy if not exists "courses are readable by anyone"
on public.courses for select
using (true);

-- Evaluations: nur Besitzer per E-Mail
create policy if not exists "eval select own"
on public.evaluations for select
using (auth.email() = user_email);

create policy if not exists "eval insert own"
on public.evaluations for insert
with check (auth.email() = user_email);

create policy if not exists "eval update own"
on public.evaluations for update
using (auth.email() = user_email)
with check (auth.email() = user_email);

create policy if not exists "eval delete own"
on public.evaluations for delete
using (auth.email() = user_email);
