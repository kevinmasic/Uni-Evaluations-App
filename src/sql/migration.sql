-- Migration from legacy courses-based schema to modul-based schema.
-- Run in Supabase SQL Editor.
set time zone 'UTC';

-- 1) Core tables (idempotent)
create table if not exists public.standort (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table if not exists public.studiengang (
  id uuid primary key default gen_random_uuid(),
  standort_id uuid not null references public.standort(id) on delete restrict,
  name text not null
);

alter table public.studiengang
  add column if not exists abschluss text;

update public.studiengang
set abschluss = 'Bachelor'
where abschluss is null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'studiengang_abschluss_check'
      and conrelid = 'public.studiengang'::regclass
  ) then
    alter table public.studiengang
      add constraint studiengang_abschluss_check
      check (abschluss in ('Bachelor', 'Master'));
  end if;
end $$;

alter table public.studiengang
  alter column abschluss set not null;

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

-- 1b) Convert semester table to global (1..7) if it still has studiengang_id
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'semester'
      and column_name = 'studiengang_id'
  ) then
    create table if not exists public.semester_new (
      id uuid primary key default gen_random_uuid(),
      nummer int not null check (nummer between 1 and 7),
      bezeichnung text,
      constraint semester_new_nummer_unique unique (nummer)
    );

    insert into public.semester_new (nummer, bezeichnung)
    select gs, null
    from generate_series(1, 7) as gs
    where not exists (
      select 1
      from public.semester_new sn
      where sn.nummer = gs
    );

    alter table public.modul drop constraint if exists modul_semester_id_fkey;

    update public.modul m
    set semester_id = sn.id
    from public.semester so
    join public.semester_new sn on sn.nummer = so.nummer
    where m.semester_id = so.id;

    drop table public.semester;
    alter table public.semester_new rename to semester;
  end if;
end $$;

insert into public.semester (nummer, bezeichnung)
select gs, null
from generate_series(1, 7) as gs
where not exists (
  select 1
  from public.semester sem
  where sem.nummer = gs
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'modul_semester_id_fkey'
      and conrelid = 'public.modul'::regclass
  ) then
    alter table public.modul
      add constraint modul_semester_id_fkey
      foreign key (semester_id) references public.semester(id) on delete restrict;
  end if;
end $$;

-- 2) Evaluations updates (idempotent)
alter table public.evaluations
  add column if not exists modul_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'evaluations_modul_id_fkey'
      and conrelid = 'public.evaluations'::regclass
  ) then
    alter table public.evaluations
      add constraint evaluations_modul_id_fkey
      foreign key (modul_id) references public.modul(id) on delete cascade;
  end if;
end $$;

create index if not exists idx_eval_modul on public.evaluations(modul_id);
drop index if exists idx_eval_course;

-- 3) Optional: migrate existing courses -> modul (safe to run multiple times)
-- This creates placeholder rows so existing course-based evaluations can be mapped.
do $$
begin
  if to_regclass('public.courses') is null then
    raise notice 'public.courses not found; skipping legacy migration';
    return;
  end if;

  insert into public.standort (name)
  select 'Migration'
  where not exists (select 1 from public.standort where name = 'Migration');

  insert into public.studiengang (standort_id, name)
  select s.id, 'Migration'
  from public.standort s
  where s.name = 'Migration'
    and not exists (
      select 1
      from public.studiengang sg
      where sg.standort_id = s.id
        and sg.name = 'Migration'
    );

  execute $sql$
    insert into public.modul (studiengang_id, semester_id, name, professor)
    select sg.id, sem.id, c.title, c.professor
    from public.courses c
    join public.studiengang sg on sg.name = 'Migration'
    join public.semester sem on sem.nummer = 1
    where not exists (
      select 1
      from public.modul m
      where m.studiengang_id = sg.id
        and m.semester_id = sem.id
        and m.name = c.title
        and coalesce(m.professor, '') = coalesce(c.professor, '')
    );
  $sql$;

  execute $sql$
    update public.evaluations e
    set modul_id = m.id
    from public.courses c
    join public.modul m on m.name = c.title
    where e.modul_id is null
      and e.course_id = c.course_id;
  $sql$;
end $$;

-- 4) Optional cleanup after migration
-- If modul_id is fully populated, enforce NOT NULL and remove legacy course fields.
do $$
begin
  if not exists (select 1 from public.evaluations where modul_id is null) then
    alter table public.evaluations alter column modul_id set not null;
  else
    raise notice 'modul_id still null; skipping NOT NULL and legacy cleanup';
    return;
  end if;
end $$;

alter table public.evaluations drop constraint if exists evaluations_course_id_fkey;
alter table public.evaluations drop column if exists course_id;
drop table if exists public.courses;
