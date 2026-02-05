import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../context/AuthContext';

type Modul = { id: string; name: string; professor: string | null };
type Evaluation = {
  evaluation_id: number;
  content: string;
  modul_id: string;
  user_email: string;
  created_at: string;
  upvotes: number;
  downvotes: number;
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('de-DE', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

export default function MyEvaluations() {
  const [modules, setModules] = useState<Modul[]>([]);
  const [items, setItems] = useState<Evaluation[]>([]);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draftContent, setDraftContent] = useState('');
  const [savingId, setSavingId] = useState<number | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [listSort, setListSort] = useState<'date' | 'activity' | 'upvotes' | 'downvotes'>('date');
  const { userEmail, loading: authLoading } = useAuth();

  const moduleById = useMemo(() => new Map(modules.map(item => [item.id, item])), [modules]);
  const sortedItems = useMemo(() => {
    const list = [...items];
    list.sort((a, b) => {
      if (listSort === 'date') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }

      if (listSort === 'activity') {
        const scoreA = Math.abs((a.upvotes ?? 0) - (a.downvotes ?? 0));
        const scoreB = Math.abs((b.upvotes ?? 0) - (b.downvotes ?? 0));
        const diff = scoreB - scoreA;
        if (diff !== 0) return diff;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }

      if (listSort === 'upvotes') {
        const diff = (b.upvotes ?? 0) - (a.upvotes ?? 0);
        if (diff !== 0) return diff;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }

      const diff = (b.downvotes ?? 0) - (a.downvotes ?? 0);
      if (diff !== 0) return diff;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    return list;
  }, [items, listSort]);

  useEffect(() => {
    (async () => {
      if (authLoading) return;
      setLoading(true);
      setError(null);

      if (!userEmail) {
        setError('Nicht eingeloggt');
        setLoading(false);
        return;
      }

      const [modulesRes, evalRes] = await Promise.all([
        supabase.from('modul').select('id,name,professor').order('name', { ascending: true }),
        supabase
          .from('evaluations')
          .select('evaluation_id, content, modul_id, user_email, created_at, upvotes, downvotes')
          .eq('user_email', userEmail)
          .order('created_at', { ascending: false })
      ]);

      if (modulesRes.error) setError(modulesRes.error.message);
      else setModules(modulesRes.data || []);

      if (evalRes.error) setError(evalRes.error.message);
      else setItems(evalRes.data || []);

      setLoading(false);
    })();
  }, [authLoading, userEmail]);

  async function handleDelete(id: number) {
    const { error } = await supabase.from('evaluations').delete().eq('evaluation_id', id);
    if (error) return setError(error.message);
    setItems(prev => prev.filter(item => item.evaluation_id !== id));
  }

  function startEdit(item: Evaluation) {
    setEditingId(item.evaluation_id);
    setDraftContent(item.content || '');
    setError(null);
    setStatus(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setDraftContent('');
  }

  async function handleSaveEdit(id: number) {
    if (!userEmail) return setError('Nicht eingeloggt');
    const nextContent = draftContent.trim();
    if (!nextContent) {
      setError('Bitte einen Text angeben.');
      setStatus(null);
      return;
    }

    setSavingId(id);
    setError(null);
    setStatus(null);
    const { data, error } = await supabase
      .from('evaluations')
      .update({ content: nextContent })
      .eq('evaluation_id', id)
      .select('evaluation_id, content');

    if (error) {
      setError(error.message);
      setStatus(null);
      setSavingId(null);
      return;
    }

    if (!data || data.length === 0) {
      setError('Update nicht erlaubt oder Eintrag nicht gefunden.');
      setStatus(null);
      setSavingId(null);
      return;
    }

    const updated = data[0];
    setItems(prev =>
      prev.map(item =>
        item.evaluation_id === id ? { ...item, content: updated.content } : item
      )
    );
    setSavingId(null);
    cancelEdit();
    setStatus('Evaluation erfolgreich aktualisiert.');
  }

  if (loading) return <p>Lade...</p>;
  if (error) return <p className="error-text">Fehler: {error}</p>;

  return (
    <div className="card">
      <h2>Meine Evaluationen</h2>
      <p className="muted">Deine abgegebenen Evaluationen im Überblick.</p>

      {items.length === 0 ? (
        <p>Noch keine Evaluationen vorhanden.</p>
      ) : (
        <div className="evaluations-panel evaluations-panel--list">
          <div className="evaluations-filter">
            <label className="evaluations-filter__label" htmlFor="my-evaluations-sort">
              Sortieren nach
            </label>
            <select
              id="my-evaluations-sort"
              className="select evaluations-filter__select"
              value={listSort}
              onChange={event => setListSort(event.target.value as typeof listSort)}
            >
              <option value="date">Datum (neueste zuerst)</option>
              <option value="activity">Voting-Aktivität (Betrag der Voting-Differenz)</option>
              <option value="upvotes">Meiste Upvotes</option>
              <option value="downvotes">Meiste Downvotes</option>
            </select>
          </div>
          <ul className="list list--cards evaluations-list">
            {sortedItems.map(item => {
              const modul = moduleById.get(item.modul_id);
              const modulLabel = modul
                ? `${modul.name}${modul.professor ? ` - ${modul.professor}` : ''}`
                : `Modul ${item.modul_id}`;

              return (
                <li key={item.evaluation_id} className="evaluations-list__item">
                  {editingId === item.evaluation_id ? (
                    <textarea
                      className="input"
                      rows={3}
                      value={draftContent}
                      onChange={event => setDraftContent(event.target.value)}
                    />
                  ) : (
                    <div className="evaluations-list__content">{item.content}</div>
                  )}
                  <div className="evaluations-list__meta evaluations-list__meta--inline">
                    <span className="badge badge--truncate">{modulLabel}</span>
                    <span className="badge">{formatDate(item.created_at)}</span>
                    <div className="note__votes note__votes--static">
                      <span className="vote-icon vote-icon--up" aria-hidden="true" />
                      <span className="vote-count">{item.upvotes}</span>
                      <span className="vote-icon vote-icon--down" aria-hidden="true" />
                      <span className="vote-count">{item.downvotes}</span>
                    </div>
                    <div className="evaluations-actions">
                      {editingId === item.evaluation_id ? (
                        <>
                          <button
                            className="button"
                            onClick={() => handleSaveEdit(item.evaluation_id)}
                            disabled={savingId === item.evaluation_id}
                          >
                            {savingId === item.evaluation_id ? 'Speichere...' : 'Speichern'}
                          </button>
                          <button className="button secondary" onClick={cancelEdit}>Abbrechen</button>
                        </>
                      ) : (
                        <>
                          <button className="button secondary" onClick={() => startEdit(item)}>Bearbeiten</button>
                          <button className="button" onClick={() => setConfirmId(item.evaluation_id)}>Löschen</button>
                        </>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {status && <p className="muted">{status}</p>}

      {confirmId !== null && (
        <div className="modal-overlay" role="presentation" onClick={() => setConfirmId(null)}>
          <div className="modal" role="dialog" aria-modal="true" onClick={event => event.stopPropagation()}>
            <h3>Eintrag löschen?</h3>
            <p className="muted">Willst du diese Evaluation wirklich löschen? Dieser Vorgang kann nicht rückgängig gemacht werden.</p>
            <div className="modal__footer">
              <button className="button secondary" onClick={() => setConfirmId(null)}>Abbrechen</button>
              <button
                className="button"
                onClick={() => {
                  const id = confirmId;
                  setConfirmId(null);
                  if (id !== null) handleDelete(id);
                }}
              >
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
