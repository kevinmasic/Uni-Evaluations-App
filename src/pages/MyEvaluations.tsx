import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../utils/supabase';

type Course = { course_id: number; title: string };
type Evaluation = { evaluation_id: number; content: string; rating: number; course_id: number; user_email: string };

export default function MyEvaluations() {
  const [meEmail, setMeEmail] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [items, setItems] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<{ id?: number; course_id: number | ''; rating: number | ''; content: string }>({
    course_id: '',
    rating: '',
    content: ''
  });
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => Boolean(form.course_id && form.rating && form.content.trim().length > 0), [form]);

  useEffect(() => {
    (async () => {
      const [{ data: userData }, coursesRes] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from('courses').select('course_id,title').order('title', { ascending: true })
      ]);

      const email = userData.user?.email ?? null;
      setMeEmail(email);

      if (coursesRes.error) setError(coursesRes.error.message);
      else setCourses(coursesRes.data || []);

      if (!email) {
        setError('Nicht eingeloggt');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('evaluations')
        .select('evaluation_id, content, rating, course_id, user_email')
        .order('evaluation_id', { ascending: false });

      if (error) setError(error.message);
      else setItems(data || []);
      setLoading(false);
    })();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!meEmail) return setError('Nicht eingeloggt');
    if (!canSubmit) return;

    const { data, error } = await supabase
      .from('evaluations')
      .insert({
        content: String(form.content).trim(),
        rating: Number(form.rating),
        course_id: Number(form.course_id),
        user_email: meEmail
      })
      .select('evaluation_id, content, rating, course_id, user_email')
      .single();

    if (error) return setError(error.message);
    setItems(prev => data ? [data, ...prev] : prev);
    setForm({ course_id: '', rating: '', content: '' });
    setError(null);
  }

  function startEdit(ev: Evaluation) {
    setForm({ id: ev.evaluation_id, course_id: ev.course_id, rating: ev.rating, content: ev.content });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!meEmail || !form.id) return;
    const { data, error } = await supabase
      .from('evaluations')
      .update({
        content: String(form.content).trim(),
        rating: Number(form.rating),
        course_id: Number(form.course_id)
      })
      .eq('evaluation_id', form.id)
      .select('evaluation_id, content, rating, course_id, user_email')
      .single();

    if (error) return setError(error.message);
    setItems(prev => prev.map(i => (i.evaluation_id === form.id ? (data as Evaluation) : i)));
    setForm({ course_id: '', rating: '', content: '' });
    setError(null);
  }

  async function handleDelete(id: number) {
    if (!confirm('Bewertung wirklich löschen?')) return;
    const { error } = await supabase.from('evaluations').delete().eq('evaluation_id', id);
    if (error) return setError(error.message);
    setItems(prev => prev.filter(i => i.evaluation_id !== id));
  }

  if (loading) return <p>Lade…</p>;
  if (error) return <p style={{ color: 'crimson' }}>Fehler: {error}</p>;

  return (
    <div className="card">
      <h2>Meine Bewertungen</h2>

      <form onSubmit={form.id ? handleUpdate : handleCreate} style={{ display: 'grid', gap: 12, marginBottom: 16 }}>
        <div className="row">
          <select
            className="select"
            value={form.course_id}
            onChange={e => setForm(f => ({ ...f, course_id: e.target.value ? Number(e.target.value) : '' }))}
            required
          >
            <option value="">Kurs wählen…</option>
            {courses.map(c => (
              <option key={c.course_id} value={c.course_id}>{c.title}</option>
            ))}
          </select>

          <select
            className="select"
            value={form.rating}
            onChange={e => setForm(f => ({ ...f, rating: e.target.value ? Number(e.target.value) : '' }))}
            required
          >
            <option value="">Rating…</option>
            {[1,2,3,4,5].map(r => <option key={r} value={r}>{r} ★</option>)}
          </select>
        </div>

        <textarea
          className="input"
          placeholder="Kurzfeedback…"
          rows={4}
          value={form.content}
          onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
          required
        />

        <div style={{ display: 'flex', gap: 8 }}>
          <button className="button" type="submit">{form.id ? 'Ändern' : 'Anlegen'}</button>
          {form.id && (
            <button type="button" className="button secondary" onClick={() => setForm({ course_id: '', rating: '', content: '' })}>
              Abbrechen
            </button>
          )}
          <span className="badge" title="Deine E-Mail">{meEmail}</span>
        </div>
      </form>

      <ul className="list">
        {items.map(ev => (
          <li key={ev.evaluation_id} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <strong>#{ev.evaluation_id}</strong>
              <span className="badge">{ev.rating} ★</span>
              <span className="badge">Kurs {ev.course_id}</span>
              <span style={{ flex: 1 }} />
              <button className="button secondary" onClick={() => startEdit(ev)}>Bearbeiten</button>
              <button className="button" onClick={() => handleDelete(ev.evaluation_id)}>Löschen</button>
            </div>
            <div style={{ marginTop: 6 }}>{ev.content}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
