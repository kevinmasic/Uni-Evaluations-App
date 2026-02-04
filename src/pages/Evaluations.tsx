import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { useAuth } from '../context/AuthContext';

type Modul = { id: string; name: string; professor: string | null; studiengang_id: string | null };
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
  return Math.abs((item.upvotes ?? 0) - (item.downvotes ?? 0));
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

function getHeatColorFromScore(score: number) {
  const minScore = -5;
  const maxScore = 5;
  const clamped = clamp(score, minScore, maxScore);
  const ratio = (clamped - minScore) / (maxScore - minScore);
  const hue = 120 * (1 - ratio);
  return `hsl(${hue}, 70%, 42%)`;
}

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

export default function Evaluations() {
  const { modulId } = useParams();
  const [modul, setModul] = useState<Modul | null>(null);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [votesByEval, setVotesByEval] = useState<Record<number, number>>({});
  const [voteError, setVoteError] = useState<string | null>(null);
  const [votingId, setVotingId] = useState<number | null>(null);
  const [listSort, setListSort] = useState<'date' | 'activity' | 'upvotes' | 'downvotes'>('date');
  const { user, profile } = useAuth();
  const userId = user?.id ?? null;
  const userStudiengangId = profile?.studiengang_id ?? null;

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
          .select('id, name, professor, studiengang_id')
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

  const evaluationsByDate = useMemo(() => {
    const list = [...evaluations];
    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return list;
  }, [evaluations]);

  const listEvaluations = useMemo(() => {
    const list = [...evaluations];
    list.sort((a, b) => {
      if (listSort === 'date') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }

      if (listSort === 'activity') {
        const diff = Math.abs(getScore(b)) - Math.abs(getScore(a));
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
  }, [evaluations, listSort]);

  async function handleVote(evaluationId: number, vote: 1 | -1) {
    if (!userId) return;
    if (votesByEval[evaluationId]) return;
    if (!userStudiengangId || modul?.studiengang_id !== userStudiengangId) return;

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
      <div className="evaluations-title">
        {modul ? (
          <>
            <span className="evaluations-title__label">Modul</span>
            <span className="evaluations-title__value">{modul.name || 'Modul'}</span>
            {modul.professor && (
              <>
                <span className="evaluations-title__label">Professor / Dozent</span>
                <span className="evaluations-title__value">{modul.professor}</span>
              </>
            )}
          </>
        ) : (
          <span className="evaluations-title__value">Modul nicht gefunden</span>
        )}
      </div>
      <p className="muted">Evaluationen aus diesem Modul.</p>

      {evaluations.length === 0 ? (
        <p>Noch keine Evaluationen vorhanden.</p>
      ) : (
        <div className="evaluations-split">
          <section className="evaluations-panel evaluations-panel--notes">
            <ul className="notes-grid notes-grid--bento notes-grid--compact">
              {sortedEvaluations.map((item, index) => {
                const score = getScore(item);
            const intensity = getIntensityFromScore(score);
            const grow = getGrowFromScore(score);
            const sizeClass = getSizeClass(index, sortedEvaluations.length, item.content.length);
            const heatColor = getHeatColorFromScore(score);

            return (
              <li
                key={item.evaluation_id}
                className={`note ${sizeClass}`}
                style={
                  { '--note-intensity': intensity, '--note-grow': grow, '--note-base': heatColor } as CSSProperties
                }
              >
                    <div className="note__content">{item.content}</div>
                    <div className="note__footer">
                      <span className="note__meta">{formatDate(item.created_at)}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="evaluations-panel evaluations-panel--list">
            <div className="evaluations-filter">
              <label className="evaluations-filter__label" htmlFor="list-sort">
                Sortieren nach
              </label>
              <select
                id="list-sort"
                className="select evaluations-filter__select"
                value={listSort}
                onChange={event => setListSort(event.target.value as typeof listSort)}
              >
                <option value="date">Datum (neueste zuerst)</option>
                <option value="activity">Voting-Aktivität (höchste zuerst)</option>
                <option value="upvotes">Meiste Upvotes</option>
                <option value="downvotes">Meiste Downvotes</option>
              </select>
            </div>
            <ul className="list list--cards evaluations-list">
              {listEvaluations.map(item => {
                const hasVoted = votesByEval[item.evaluation_id] !== undefined;
                const canVote = Boolean(userId && userStudiengangId && modul?.studiengang_id === userStudiengangId);
                const isDisabled = !canVote || hasVoted || votingId === item.evaluation_id;
                const hint = !userId
                  ? 'Bitte einloggen, um zu bewerten.'
                  : !userStudiengangId
                    ? 'Kein Studiengang hinterlegt.'
                    : modul?.studiengang_id !== userStudiengangId
                      ? 'Nur für den eigenen Studiengang erlaubt.'
                  : hasVoted
                    ? 'Du hast bereits gevotet.'
                    : 'Bewertung abgeben';

                return (
                  <li key={item.evaluation_id} className="evaluations-list__item">
                    <div className="evaluations-list__content">{item.content}</div>
                    <div className="evaluations-list__meta">
                      <span>{formatDate(item.created_at)}</span>
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
            {voteError && <p className="error-text">Fehler beim Bewerten: {voteError}</p>}
          </section>
        </div>
      )}
    </div>
  );
}
