-- Seed data for demo usage.
-- Clears data in modul/evaluations/users but keeps standort/studiengang/semester.

truncate table public.evaluation_votes, public.evaluations, public.modul, public.users restart identity;

insert into public.standort (name) values
  ('Lippstadt'),
  ('Hamm')
on conflict do nothing;

with data(name, standort, abschluss) as (
  values
    ('Angewandte Informatik und Soziale Medien', 'Lippstadt', 'Bachelor'),
    ('Betriebswirtschaftslehre', 'Lippstadt', 'Bachelor'),
    ('Biomedizinische Technologie', 'Hamm', 'Bachelor'),
    ('Computervisualistik und Design', 'Lippstadt', 'Bachelor'),
    ('Electronic Engineering (EN)', 'Lippstadt', 'Bachelor'),
    ('Energietechnik und Ressourcenoptimierung', 'Hamm', 'Bachelor'),
    ('Gesundheits- und Sportingenieurwesen', 'Hamm', 'Bachelor'),
    ('Intelligent Systems Design', 'Hamm', 'Bachelor'),
    ('Interkulturelle Wirtschaftspsychologie', 'Hamm', 'Bachelor'),
    ('Materialwissenschaften und Bionik', 'Lippstadt', 'Bachelor'),
    ('Mechatronik', 'Lippstadt', 'Bachelor'),
    ('Technisches Management und Marketing', 'Hamm', 'Bachelor'),
    ('Umweltmonitoring und Forensische Chemie', 'Hamm', 'Bachelor'),
    ('Wirtschaftsingenieurwesen', 'Lippstadt', 'Bachelor'),
    ('Angewandte Biomedizintechnik', 'Hamm', 'Master'),
    ('Betriebswirtschaftslehre', 'Lippstadt', 'Master'),
    ('Biomedizinisches Management und Marketing', 'Hamm', 'Master'),
    ('Business and Systems Engineering', 'Lippstadt', 'Master'),
    ('Intercultural Business Psychology', 'Hamm', 'Master'),
    ('Product and Asset Management', 'Hamm', 'Master'),
    ('Product Development and Business Studies', 'Hamm', 'Master'),
    ('Technical Consulting und Management', 'Lippstadt', 'Master'),
    ('Technical Entrepreneurship and Innovation', 'Lippstadt', 'Master'),
    ('Umwelt- und Gefahrstoffanalytik', 'Hamm', 'Master')
)
insert into public.studiengang (standort_id, name, abschluss)
select s.id, d.name, d.abschluss
from data d
join public.standort s on s.name = d.standort
where not exists (
  select 1
  from public.studiengang sg
  where sg.standort_id = s.id
    and sg.name = d.name
    and sg.abschluss = d.abschluss
);

insert into public.semester (nummer, bezeichnung)
select gs, null
from generate_series(1, 7) as gs
where not exists (
  select 1
  from public.semester sem
  where sem.nummer = gs
);

with users(email, matriculation_number) as (
  values
    ('student01@example.edu', '20240001'),
    ('student02@example.edu', '20240002'),
    ('student03@example.edu', '20240003'),
    ('student04@example.edu', '20240004'),
    ('student05@example.edu', '20240005'),
    ('student06@example.edu', '20240006'),
    ('student07@example.edu', '20240007'),
    ('student08@example.edu', '20240008'),
    ('student09@example.edu', '20240009'),
    ('student10@example.edu', '20240010')
)
insert into public.users (email, matriculation_number)
select email, matriculation_number
from users
on conflict (email) do nothing;

update public.users
set studiengang_id = (
  select sg.id
  from public.studiengang sg
  order by random()
  limit 1
)
where studiengang_id is null;

with module_seed as (
  select
    sg.id as studiengang_id,
    sem.id as semester_id,
    sem.nummer,
    gs as module_index
  from public.studiengang sg
  cross join public.semester sem
  cross join generate_series(1, 3) as gs
),
professors as (
  select array[
    'Prof. Dr. Klein',
    'Prof. Dr. Nguyen',
    'Dr. Schneider',
    'Dr. Hoffmann',
    'Prof. Dr. Wagner'
  ] as names
)
insert into public.modul (studiengang_id, semester_id, name, kuerzel, professor)
select
  ms.studiengang_id,
  ms.semester_id,
  format('%s S%s Modul %s', sg.name, ms.nummer, ms.module_index),
  format('S%sM%s', ms.nummer, ms.module_index),
  (select names[1 + ((ms.module_index + ms.nummer) % array_length(names, 1))] from professors)
from module_seed ms
join public.studiengang sg on sg.id = ms.studiengang_id;

with user_list as (
  select array_agg(email order by email) as emails
  from public.users
),
phrases as (
  select array[
    'Klar strukturiert und gut erklärt.',
    'Gute Beispiele, faire Bewertung.',
    'Tempo ok, Inhalte hilfreich.',
    'Mehr Praxis wäre top.',
    'Sehr gut organisiert.',
    'Interaktiv und nachvollziehbar.',
    'Starker Bezug zur Praxis.',
    'Folien könnten kompakter sein.',
    'Gute Mischung aus Theorie und Praxis.',
    'Freundliche Betreuung.'
  ] as texts
)
insert into public.evaluations (content, user_email, modul_id, created_at)
select
  phrases.texts[1 + ((ev_idx - 1) % array_length(phrases.texts, 1))],
  user_list.emails[1 + ((ev_idx - 1) % array_length(user_list.emails, 1))],
  m.id,
  now() - (random() * 120 || ' days')::interval
from public.modul m
cross join generate_series(1, 10) as ev_idx
cross join user_list
cross join phrases;

-- Seed vote counts for sorting and color intensity.
update public.evaluations
set
  upvotes = floor(random() * 10)::int,
  downvotes = floor(random() * 6)::int;
