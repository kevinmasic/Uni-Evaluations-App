-- Schema (public) – im Supabase SQL Editor ausführen
SET TIME ZONE 'UTC';

create table if not exists public.users (
  user_id bigserial primary key,
  email varchar(255) unique not null,
  matriculation_number varchar(50) not null,
  created_at timestamptz not null default now(),
  constraint users_matriculation_unique unique (matriculation_number)
);

create table if not exists public.courses (
  course_id bigserial primary key,
  title varchar(255) not null,
  professor varchar(255) not null,
  created_at timestamptz not null default now()
);

create table if not exists public.evaluations (
  evaluation_id bigserial primary key,
  content text not null,
  rating int not null check (rating between 1 and 5),
  user_email text, -- für RLS mit Supabase Auth (auth.email())
  course_id bigint not null references public.courses(course_id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Trigger-Funktion für updated_at (idempotent)
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

-- Indizes
create index if not exists idx_eval_course on public.evaluations(course_id);
create index if not exists idx_eval_user_email on public.evaluations(user_email);
