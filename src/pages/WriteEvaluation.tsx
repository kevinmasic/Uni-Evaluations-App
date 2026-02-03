import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../context/AuthContext';

type Modul = { id: string; name: string; professor: string | null };

type FormState = {
  modul_id: string;
  content: string;
};

export default function WriteEvaluation() {
  const [modules, setModules] = useState<Modul[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>({
    modul_id: '',
    content: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const { userEmail, profile, loading: authLoading, profileLoading } = useAuth();

  const canSubmit = useMemo(
    () => Boolean(form.modul_id && form.content.trim().length > 0),
    [form]
  );

  useEffect(() => {
    if (authLoading || profileLoading) return;
    (async () => {
      setLoading(true);
      setError(null);
      if (!userEmail) {
        setError('Nicht eingeloggt');
        setLoading(false);
        return;
      }

      const sgId = profile?.studiengang_id ?? null;
      if (!sgId) {
        setError('Kein Studiengang hinterlegt.');
        setLoading(false);
        return;
      }

      const modulesRes = await supabase
        .from('modul')
        .select('id,name,professor')
        .eq('studiengang_id', sgId)
        .order('name', { ascending: true });

      if (modulesRes.error) setError(modulesRes.error.message);
      else setModules(modulesRes.data || []);
      setLoading(false);
    })();
  }, [authLoading, profileLoading, userEmail, profile?.studiengang_id]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!userEmail) return setError('Nicht eingeloggt');
    if (!canSubmit) return;

    setStatus('Speichere...');
    const { error } = await supabase
      .from('evaluations')
      .insert({
        content: String(form.content).trim(),
        modul_id: form.modul_id,
        user_email: userEmail
      })
      .select('evaluation_id')
      .single();

    if (error) {
      setError(error.message);
      setStatus(null);
      return;
    }

    setForm({ modul_id: '', content: '' });
    setError(null);
    setStatus('Evaluation gespeichert.');
  }

  if (loading) return <p>Lade...</p>;
  if (error) return <p className="error-text">Fehler: {error}</p>;

  return (
    <div className="card">
      
      <h2>Evaluation schreiben</h2>
      <p className="muted">Schreibe eine kurze, ehrliche Rückmeldung.</p>

      <form onSubmit={handleCreate} className="form-grid">
        <div className="row">
          <select
            className="select"
            value={form.modul_id}
            onChange={event => setForm(state => ({ ...state, modul_id: event.target.value }))}
            required
          >
            <option value="">Modul wählen...</option>
            {modules.map(item => (
              <option key={item.id} value={item.id}>
                {item.name}{item.professor ? ` - ${item.professor}` : ''}
              </option>
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

        <div className="form-actions">
          <button className="button" type="submit" disabled={!canSubmit}>Evaluation senden</button>
          <span className="badge" title="Deine E-Mail">{userEmail}</span>
        </div>
      </form>

      {status && <p style={{ marginTop: 12 }}>{status}</p>}
    </div>
  );
}
