insert into public.courses (title, professor) values
  ('Einführung in Datenbanken', 'Prof. Dr. Müller'),
  ('Web-Technologien', 'Dr. Schneider'),
  ('Algorithmen & Datenstrukturen', 'Prof. Dr. Nguyen'),
  ('Software Engineering', 'Prof. Dr. Klein'),
  ('Statistik für Informatiker', 'Dr. Lehmann'),
  ('Rechnernetze', 'Prof. Dr. Hofmann'),
  ('IT-Sicherheit', 'Prof. Dr. Schuster'),
  ('Künstliche Intelligenz', 'Prof. Dr. Wagner'),
  ('Datenvisualisierung', 'Dr. Richter'),
  ('Projektmanagement', 'Prof. Dr. Seidel')
on conflict do nothing;

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
