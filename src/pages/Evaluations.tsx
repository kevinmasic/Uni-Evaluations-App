import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../utils/supabase';

type Modul = { id: string; name: string; professor: string | null };
type Evaluation = { evaluation_id: number; content: string; created_at: string };

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('de-DE', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

export default function Evaluations() {
  const { modulId } = useParams();
  const [modul, setModul] = useState<Modul | null>(null);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!modulId) {
      setError('Modul fehlt.');
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    (async () => {
      const [modulRes, evalRes] = await Promise.all([
        supabase
          .from('modul')
          .select('id, name, professor')
          .eq('id', modulId)
          .maybeSingle(),
        supabase
          .from('evaluations')
          .select('evaluation_id, content, created_at')
          .eq('modul_id', modulId)
          .order('created_at', { ascending: false })
      ]);

      if (!active) return;

      if (modulRes.error) {
        setError(modulRes.error.message);
      } else {
        setModul(modulRes.data ?? null);
      }

      if (evalRes.error) {
        setError(evalRes.error.message);
      } else {
        setEvaluations(evalRes.data || []);
      }

      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [modulId]);

  if (loading) return <p>Lade...</p>;
  if (error) return <p style={{ color: 'crimson' }}>Fehler: {error}</p>;

  return (
    <div className="card">
      <h2>
        {modul ? `${modul.name}${modul.professor ? ` - ${modul.professor}` : ''}` : 'Modul nicht gefunden'}
      </h2>

      {evaluations.length === 0 ? (
        <p>Noch keine Evaluationen vorhanden.</p>
      ) : (
        <ul className="list">
          {evaluations.map(item => (
            <li key={item.evaluation_id} style={{ marginBottom: 12 }}>
              <div>{item.content}</div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                Erstellt am {formatDate(item.created_at)}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
