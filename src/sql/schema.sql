-- Schema (public) - run in Supabase SQL Editor
SET TIME ZONE 'UTC';

create table if not exists public.users (
  user_id bigserial primary key,
  email varchar(255) unique not null,
  matriculation_number varchar(50) not null,
  created_at timestamptz not null default now(),
  constraint users_matriculation_unique unique (matriculation_number)
);

create table if not exists public.standort (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table if not exists public.studiengang (
  id uuid primary key default gen_random_uuid(),
  standort_id uuid not null references public.standort(id) on delete restrict,
  name text not null,
  abschluss text not null,
  constraint studiengang_abschluss_check check (abschluss in ('Bachelor', 'Master'))
);

create table if not exists public.semester (
  id uuid primary key default gen_random_uuid(),
  nummer int not null check (nummer between 1 and 7),
  bezeichnung text,
  constraint semester_nummer_unique unique (nummer)
);

create table if not exists public.modul (
  id uuid primary key default gen_random_uuid(),
  studiengang_id uuid not null references public.studiengang(id) on delete cascade,
  semester_id uuid not null references public.semester(id) on delete cascade,
  name text not null,
  kuerzel text,
  professor text
);

create table if not exists public.evaluations (
  evaluation_id bigserial primary key,
  content text not null,
  rating int not null check (rating between 1 and 5),
  user_email text,
  modul_id uuid not null references public.modul(id) on delete cascade,
  upvotes int not null default 0,
  downvotes int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint evaluations_votes_check check (upvotes >= 0 and downvotes >= 0)
);

create table if not exists public.evaluation_votes (
  id bigserial primary key,
  evaluation_id bigint not null references public.evaluations(evaluation_id) on delete cascade,
  voter_id uuid not null references auth.users(id) on delete cascade,
  vote smallint not null check (vote in (-1, 1)),
  created_at timestamptz not null default now(),
  constraint evaluation_votes_unique unique (evaluation_id, voter_id)
);

-- Trigger function for updated_at (idempotent)
create or replace function public.set_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_set_timestamp_evaluations on public.evaluations;

create trigger trg_set_timestamp_evaluations
before update on public.evaluations
for each row execute function public.set_timestamp();

-- Indexes
create index if not exists idx_eval_modul on public.evaluations(modul_id);
create index if not exists idx_eval_user_email on public.evaluations(user_email);
create index if not exists idx_eval_votes_evaluation on public.evaluation_votes(evaluation_id);
create index if not exists idx_eval_votes_voter on public.evaluation_votes(voter_id);
