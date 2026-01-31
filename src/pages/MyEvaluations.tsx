import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../utils/supabase';

type Modul = { id: string; name: string; professor: string | null };
type Evaluation = { evaluation_id: number; content: string; rating: number; modul_id: string; user_email: string };

export default function MyEvaluations() {
  const [meEmail, setMeEmail] = useState<string | null>(null);
  const [modules, setModules] = useState<Modul[]>([]);
  const [items, setItems] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<{ id?: number; modul_id: string; rating: number | ''; content: string }>({
    modul_id: '',
    rating: '',
    content: ''
  });
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => Boolean(form.modul_id && form.rating && form.content.trim().length > 0), [form]);
  const moduleById = useMemo(() => new Map(modules.map(item => [item.id, item])), [modules]);

  useEffect(() => {
    (async () => {
      const [{ data: userData }, modulesRes] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from('modul').select('id,name,professor').order('name', { ascending: true })
      ]);

      const email = userData.user?.email ?? null;
      setMeEmail(email);

      if (modulesRes.error) setError(modulesRes.error.message);
      else setModules(modulesRes.data || []);

      if (!email) {
        setError('Nicht eingeloggt');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('evaluations')
        .select('evaluation_id, content, rating, modul_id, user_email')
        .eq('user_email', email)
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
        modul_id: form.modul_id,
        user_email: meEmail
      })
      .select('evaluation_id, content, rating, modul_id, user_email')
      .single();

    if (error) return setError(error.message);
    setItems(prev => (data ? [data, ...prev] : prev));
    setForm({ modul_id: '', rating: '', content: '' });
    setError(null);
  }

  function startEdit(ev: Evaluation) {
    setForm({ id: ev.evaluation_id, modul_id: ev.modul_id, rating: ev.rating, content: ev.content });
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
        modul_id: form.modul_id
      })
      .eq('evaluation_id', form.id)
      .select('evaluation_id, content, rating, modul_id, user_email')
      .single();

    if (error) return setError(error.message);
    setItems(prev => prev.map(item => (item.evaluation_id === form.id ? (data as Evaluation) : item)));
    setForm({ modul_id: '', rating: '', content: '' });
    setError(null);
  }

  async function handleDelete(id: number) {
    if (!confirm('Bewertung wirklich loeschen?')) return;
    const { error } = await supabase.from('evaluations').delete().eq('evaluation_id', id);
    if (error) return setError(error.message);
    setItems(prev => prev.filter(item => item.evaluation_id !== id));
  }

  if (loading) return <p>Lade...</p>;
  if (error) return <p style={{ color: 'crimson' }}>Fehler: {error}</p>;

  return (
    <div className="card">
      <h2>Meine Bewertungen</h2>

      <form onSubmit={form.id ? handleUpdate : handleCreate} style={{ display: 'grid', gap: 12, marginBottom: 16 }}>
        <div className="row">
          <select
            className="select"
            value={form.modul_id}
            onChange={event => setForm(state => ({ ...state, modul_id: event.target.value }))}
            required
          >
            <option value="">Modul waehlen...</option>
            {modules.map(item => (
              <option key={item.id} value={item.id}>
                {item.name}{item.professor ? ` - ${item.professor}` : ''}
              </option>
            ))}
          </select>

          <select
            className="select"
            value={form.rating}
            onChange={event => setForm(state => ({ ...state, rating: event.target.value ? Number(event.target.value) : '' }))}
            required
          >
            <option value="">Rating...</option>
            {[1, 2, 3, 4, 5].map(rating => (
              <option key={rating} value={rating}>{rating}</option>
            ))}
          </select>
        </div>

        <textarea
          className="input"
          placeholder="Kurzfeedback..."
          rows={4}
          value={form.content}
          onChange={event => setForm(state => ({ ...state, content: event.target.value }))}
          required
        />

        <div style={{ display: 'flex', gap: 8 }}>
          <button className="button" type="submit">{form.id ? 'Aendern' : 'Anlegen'}</button>
          {form.id && (
            <button type="button" className="button secondary" onClick={() => setForm({ modul_id: '', rating: '', content: '' })}>
              Abbrechen
            </button>
          )}
          <span className="badge" title="Deine E-Mail">{meEmail}</span>
        </div>
      </form>

      <ul className="list">
        {items.map(item => {
          const modul = moduleById.get(item.modul_id);
          const modulLabel = modul
            ? `${modul.name}${modul.professor ? ` - ${modul.professor}` : ''}`
            : `Modul ${item.modul_id}`;

          return (
            <li key={item.evaluation_id} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <strong>#{item.evaluation_id}</strong>
                <span className="badge">{item.rating}</span>
                <span className="badge">{modulLabel}</span>
                <span style={{ flex: 1 }} />
                <button className="button secondary" onClick={() => startEdit(item)}>Bearbeiten</button>
                <button className="button" onClick={() => handleDelete(item.evaluation_id)}>Loeschen</button>
              </div>
              <div style={{ marginTop: 6 }}>{item.content}</div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
