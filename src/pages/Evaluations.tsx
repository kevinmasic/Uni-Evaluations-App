import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../utils/supabase';

type Modul = { id: string; name: string; professor: string | null };
type Evaluation = {
  evaluation_id: number;
  content: string;
  created_at: string;
  upvotes: number;
  downvotes: number;
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('de-DE', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function getScore(item: Evaluation) {
  return (item.upvotes ?? 0) - (item.downvotes ?? 0);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getIntensityFromScore(score: number) {
  return clamp(0.3 + score * 0.12, 0.08, 1);
}

function getGrowFromScore(score: number) {
  return clamp(score, 0, 8);
}

const colorClasses = ['note--1', 'note--2', 'note--3', 'note--4'];

function getSizeClass(index: number, total: number, contentLength: number) {
  const xlCount = Math.max(1, Math.round(total * 0.12));
  const wideCount = Math.max(2, Math.round(total * 0.3));
  const tallCount = Math.max(3, Math.round(total * 0.5));
  const isLong = contentLength > 140;

  if (index < xlCount) return 'note--xl';
  if (index < wideCount) return 'note--wide';
  if (index < tallCount || isLong) return 'note--tall';
  return '';
}

function getColorClass(index: number, total: number) {
  if (total <= 1) return colorClasses[0];
  const ratio = index / Math.max(1, total - 1);
  if (ratio <= 0.25) return colorClasses[0];
  if (ratio <= 0.5) return colorClasses[1];
  if (ratio <= 0.75) return colorClasses[2];
  return colorClasses[3];
}

export default function Evaluations() {
  const { modulId } = useParams();
  const [modul, setModul] = useState<Modul | null>(null);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [votesByEval, setVotesByEval] = useState<Record<number, number>>({});
  const [voteError, setVoteError] = useState<string | null>(null);
  const [votingId, setVotingId] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (active) setUserId(session?.user.id ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

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
          .select('evaluation_id, content, created_at, upvotes, downvotes')
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

  useEffect(() => {
    if (!userId || evaluations.length === 0) {
      setVotesByEval({});
      return;
    }

    let active = true;
    (async () => {
      const evaluationIds = evaluations.map(item => item.evaluation_id);
      if (evaluationIds.length === 0) return;

      const { data, error } = await supabase
        .from('evaluation_votes')
        .select('evaluation_id, vote')
        .eq('voter_id', userId)
        .in('evaluation_id', evaluationIds);

      if (!active) return;
      if (error) {
        setVoteError(error.message);
        return;
      }

      const map: Record<number, number> = {};
      data?.forEach(item => {
        map[item.evaluation_id] = item.vote;
      });
      setVotesByEval(map);
    })();

    return () => {
      active = false;
    };
  }, [userId, evaluations]);

  const sortedEvaluations = useMemo(() => {
    const list = [...evaluations];
    list.sort((a, b) => {
      const scoreDiff = getScore(b) - getScore(a);
      if (scoreDiff !== 0) return scoreDiff;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    return list;
  }, [evaluations]);

  async function handleVote(evaluationId: number, vote: 1 | -1) {
    if (!userId) return;
    if (votesByEval[evaluationId]) return;

    setVotingId(evaluationId);
    setVoteError(null);

    const { error } = await supabase.rpc('cast_evaluation_vote', {
      p_evaluation_id: evaluationId,
      p_vote: vote
    });

    if (error) {
      setVoteError(error.message);
      setVotingId(null);
      return;
    }

    setVotesByEval(prev => ({ ...prev, [evaluationId]: vote }));
    setEvaluations(prev =>
      prev.map(item => {
        if (item.evaluation_id !== evaluationId) return item;
        return {
          ...item,
          upvotes: item.upvotes + (vote === 1 ? 1 : 0),
          downvotes: item.downvotes + (vote === -1 ? 1 : 0)
        };
      })
    );
    setVotingId(null);
  }

  if (loading) return <p>Lade...</p>;
  if (error) return <p className="error-text">Fehler: {error}</p>;

  return (
    <div className="card">
      <span className="bubble bubble--mint bubble--sm">Modul</span>
      <h2>
        {modul ? `${modul.name}${modul.professor ? ` - ${modul.professor}` : ''}` : 'Modul nicht gefunden'}
      </h2>
      <p className="muted">Evaluationen aus diesem Modul.</p>

      {evaluations.length === 0 ? (
        <p>Noch keine Evaluationen vorhanden.</p>
      ) : (
        <ul className="notes-grid notes-grid--bento">
          {sortedEvaluations.map((item, index) => {
            const score = getScore(item);
            const intensity = getIntensityFromScore(score);
            const grow = getGrowFromScore(score);
            const sizeClass = getSizeClass(index, sortedEvaluations.length, item.content.length);
            const colorClass = getColorClass(index, sortedEvaluations.length);
            const hasVoted = votesByEval[item.evaluation_id] !== undefined;
            const isDisabled = !userId || hasVoted || votingId === item.evaluation_id;
            const hint = !userId
              ? 'Bitte einloggen, um zu bewerten.'
              : hasVoted
                ? 'Du hast bereits gevotet.'
                : 'Bewertung abgeben';

            return (
              <li
                key={item.evaluation_id}
                className={`note ${colorClass} ${sizeClass}`}
                style={{ '--note-intensity': intensity, '--note-grow': grow } as CSSProperties}
              >
                <div className="note__content">{item.content}</div>
                <div className="note__footer">
                  <span className="note__meta">{formatDate(item.created_at)}</span>
                  <div className="note__votes">
                    <span className="vote-tooltip" title={hint}>
                      <button
                        className="vote-button"
                        type="button"
                        disabled={isDisabled}
                        onClick={() => handleVote(item.evaluation_id, 1)}
                        aria-label="Upvote"
                      >
                        <span className="vote-icon vote-icon--up" aria-hidden="true" />
                      </button>
                    </span>
                    <span className="vote-count">{item.upvotes}</span>
                    <span className="vote-tooltip" title={hint}>
                      <button
                        className="vote-button"
                        type="button"
                        disabled={isDisabled}
                        onClick={() => handleVote(item.evaluation_id, -1)}
                        aria-label="Downvote"
                      >
                        <span className="vote-icon vote-icon--down" aria-hidden="true" />
                      </button>
                    </span>
                    <span className="vote-count">{item.downvotes}</span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {voteError && <p className="error-text">Fehler beim Bewerten: {voteError}</p>}
    </div>
  );
}
