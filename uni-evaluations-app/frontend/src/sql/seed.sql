insert into public.courses (title, professor) values
  ('Einführung in Datenbanken', 'Prof. Dr. Müller'),
  ('Web-Technologien', 'Dr. Schneider'),
  ('Algorithmen & Datenstrukturen', 'Prof. Dr. Nguyen'),
  ('Software Engineering', 'Prof. Dr. Klein')
on conflict do nothing;
