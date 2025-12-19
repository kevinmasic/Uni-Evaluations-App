import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';

type Course = { course_id: number; title: string; professor: string };

export default function Courses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('course_id, title, professor')
        .order('title', { ascending: true });

      if (error) setError(error.message);
      else setCourses(data || []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <p>Lade Kurse…</p>;
  if (error) return <p style={{ color: 'crimson' }}>Fehler: {error}</p>;

  return (
    <div className="card">
      <h2>Kursübersicht</h2>
      <ul className="list">
        {courses.map(c => (
          <li key={c.course_id}><strong>{c.title}</strong> — {c.professor}</li>
        ))}
      </ul>
    </div>
  );
}
