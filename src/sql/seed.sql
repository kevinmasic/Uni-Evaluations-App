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

insert into public.modul (studiengang_id, semester_id, name, kuerzel, professor)
select sg.id, sem.id, sg.name || ' Modul S' || sem.nummer, null, null
from public.studiengang sg
join public.semester sem on sem.nummer between 1 and 7
where not exists (
  select 1
  from public.modul m
  where m.studiengang_id = sg.id
    and m.semester_id = sem.id
    and m.name = sg.name || ' Modul S' || sem.nummer
);

insert into public.users (email, matriculation_number) values
  ('anna.schmidt@example.edu', '20240001'),
  ('benjamin.meier@example.edu', '20240002'),
  ('carla.wolf@example.edu', '20240003'),
  ('david.bauer@example.edu', '20240004'),
  ('eva.schneider@example.edu', '20240005'),
  ('felix.koenig@example.edu', '20240006'),
  ('greta.mayer@example.edu', '20240007'),
  ('henrik.fischer@example.edu', '20240008'),
  ('isabel.hartmann@example.edu', '20240009'),
  ('jonas.weber@example.edu', '20240010')
on conflict (email) do nothing;

insert into public.evaluations (content, rating, user_email, modul_id)
select 'Gute Inhalte und klare Erklaerungen.', 5, 'anna.schmidt@example.edu', m.id
from public.modul m
join public.studiengang sg on sg.id = m.studiengang_id
where sg.name = 'Angewandte Informatik und Soziale Medien'
  and m.name = sg.name || ' Modul S1'
limit 1;

insert into public.evaluations (content, rating, user_email, modul_id)
select 'Etwas zu schnell, aber fair bewertet.', 3, 'benjamin.meier@example.edu', m.id
from public.modul m
join public.studiengang sg on sg.id = m.studiengang_id
where sg.name = 'Biomedizinische Technologie'
  and m.name = sg.name || ' Modul S1'
limit 1;
