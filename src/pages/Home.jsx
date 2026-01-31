import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import InfiniteMenu from '../components/menudummy.jsx';
import SelectEvaluationModal from '../components/SelectEvaluationModal.jsx';
import { supabase } from '../utils/supabase';

const MENU_PALETTE = [
  { bg: 'rgb(69, 6, 147)', text: '#ffffff' },
  { bg: 'rgb(140, 0, 255)', text: '#ffffff' },
  { bg: 'rgb(255, 63, 127)', text: '#ffffff' },
  { bg: 'rgb(255, 196, 0)', text: '#1b1226' }
];

const cleanText = text => (text || '').replace(/\s+/g, ' ').trim();

const clipText = (text, maxLength) => {
  const cleaned = cleanText(text);
  if (cleaned.length <= maxLength) return cleaned;
  return `${cleaned.slice(0, Math.max(0, maxLength - 3))}...`;
};

const shuffle = values => {
  const data = [...values];
  for (let i = data.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [data[i], data[j]] = [data[j], data[i]];
  }
  return data;
};

const wrapText = (ctx, text, maxWidth) => {
  const words = text.split(' ');
  const lines = [];
  let line = '';

  words.forEach(word => {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      line = candidate;
    } else {
      if (line) lines.push(line);
      line = word;
    }
  });

  if (line) lines.push(line);
  return lines;
};

const drawRoundedRect = (ctx, x, y, width, height, radius) => {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
};

const buildMenuImage = ({ content, palette }) => {
  const canvas = document.createElement('canvas');
  const size = 720;
  const padding = 48;
  const cornerRadius = 56;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const rectX = padding;
  const rectY = padding;
  const rectSize = size - padding * 2;
  const textPadding = 36;

  ctx.fillStyle = palette.bg;
  drawRoundedRect(ctx, rectX, rectY, rectSize, rectSize, cornerRadius);
  ctx.fill();

  ctx.fillStyle = palette.text;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.font = '600 32px "DM Sans", sans-serif';
  const cleanContent = clipText(content, 260) || 'Kurz und klar.';
  const maxWidth = rectSize - textPadding * 2;
  const contentLines = wrapText(ctx, cleanContent, maxWidth);
  const maxLines = 7;
  const visibleLines = contentLines.slice(0, maxLines);
  if (contentLines.length > maxLines && visibleLines.length) {
    const lastIndex = visibleLines.length - 1;
    visibleLines[lastIndex] = `${visibleLines[lastIndex].replace(/\.*$/, '')}...`;
  }

  const lineHeight = 40;
  const totalHeight = visibleLines.length * lineHeight;
  let y = rectY + rectSize / 2 - (totalHeight - lineHeight) / 2;
  const x = rectX + rectSize / 2;
  visibleLines.forEach(line => {
    ctx.fillText(line, x, y);
    y += lineHeight;
  });

  return canvas.toDataURL('image/png');
};

export default function Home() {
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [menuItems, setMenuItems] = useState(null);
  const [menuError, setMenuError] = useState('');

  const openSelectModal = () => setIsSelectOpen(true);
  const closeSelectModal = () => setIsSelectOpen(false);

  useEffect(() => {
    let isActive = true;

    const loadMenuItems = async () => {
      setMenuError('');
      const { data, error } = await supabase
        .from('evaluations')
        .select('evaluation_id, content, modul_id, upvotes, downvotes, modul:modul_id (name, professor, studiengang_id)')
        .limit(200);

      if (!isActive) return;

      if (error) {
        setMenuError('Bewertungen konnten nicht geladen werden.');
        setMenuItems([]);
        return;
      }

      const safeData = Array.isArray(data) ? data : [];
      if (!safeData.length) {
        setMenuItems([]);
        return;
      }

      const scores = safeData.map(item => (item.upvotes ?? 0) - (item.downvotes ?? 0));
      const minScore = Math.min(...scores);
      const maxScore = Math.max(...scores);

      const pickPalette = score => {
        if (maxScore === minScore) return MENU_PALETTE[1];
        const ratio = (score - minScore) / (maxScore - minScore);
        const index = Math.min(MENU_PALETTE.length - 1, Math.floor(ratio * MENU_PALETTE.length));
        return MENU_PALETTE[index];
      };

      const grouped = new Map();
      safeData.forEach(item => {
        const modulInfo = Array.isArray(item.modul) ? item.modul[0] : item.modul;
        const studiengangId = modulInfo?.studiengang_id || 'unknown';
        if (!grouped.has(studiengangId)) grouped.set(studiengangId, []);
        grouped.get(studiengangId).push(item);
      });

      const targetTotal = 24;
      const groups = Array.from(grouped.values()).map(group => shuffle(group));
      const groupCount = Math.max(1, groups.length);
      const perGroup = Math.max(1, Math.floor(targetTotal / groupCount));
      const remainder = targetTotal - perGroup * groupCount;

      const selected = [];
      groups.forEach((group, index) => {
        const take = perGroup + (index < remainder ? 1 : 0);
        selected.push(...group.slice(0, take));
      });

      if (selected.length < targetTotal) {
        const leftovers = groups.flatMap((group, index) => group.slice(perGroup + (index < remainder ? 1 : 0)));
        selected.push(...leftovers.slice(0, targetTotal - selected.length));
      }

      const items = shuffle(selected)
        .map(item => {
          const modulInfo = Array.isArray(item.modul) ? item.modul[0] : item.modul;
          const modulName = cleanText(modulInfo?.name) || 'Modul';
          const palette = pickPalette((item.upvotes ?? 0) - (item.downvotes ?? 0));
          const image = buildMenuImage({ content: item.content, palette });
          return {
            image,
            link: item.modul_id ? `/evaluations/${item.modul_id}` : '/',
            title: modulName,
            description: ''
          };
        });

      setMenuItems(items);
    };

    loadMenuItems();

    return () => {
      isActive = false;
    };
  }, []);

  return (
    <div className="home home--deck">
      <header className="hero hero--deck">
        <div className="hero__grid">
          <div className="hero__copy">
            <span className="kicker">EVALUATIONSPORTAL</span>
            <h1 className="hero__title">Dein Feedback. Direkt.</h1>
            <p className="hero__lead">
              Kurze Rückmeldungen für bessere Lehre. Schnell, anonym, klar.
            </p>
            <div className="hero__actions">
              <button type="button" className="button button--hero secondary" onClick={openSelectModal}>
                Evaluation ansehen
              </button>
              <Link to="/me" className="button button--hero">Jetzt bewerten</Link>
            </div>
            <span className="hero__tag">Anonym - 2 Minuten - Ehrlich & fair</span>
          </div>

          <div className="hero__aside hero__visual">
            <div className="brand-panel brand-panel--plain">
              <div className="brand-claims brand-claims--pills">
                <span className="brand-pill brand-pill--yellow">Deine Stimme</span>
                <span className="brand-pill brand-pill--purple">Klar & kompakt</span>
                <span className="brand-pill brand-pill--pink">Besser studieren</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="ticker" aria-hidden="true">
        <div className="ticker__track">
          <div className="ticker__content">
            <span>Feedback live - schnell - anonym - klar - direkt - fair</span>
            <span>Feedback live - schnell - anonym - klar - direkt - fair</span>
            <span>Feedback live - schnell - anonym - klar - direkt - fair</span>
          </div>
          <div className="ticker__content" aria-hidden="true">
            <span>Feedback live - schnell - anonym - klar - direkt - fair</span>
            <span>Feedback live - schnell - anonym - klar - direkt - fair</span>
            <span>Feedback live - schnell - anonym - klar - direkt - fair</span>
          </div>
        </div>
      </div>

      <section className="deck-section">
        <span className="kicker">START HERE</span>
        <h2>In 4 Schritten zur Evaluation.</h2>
        <p className="deck-text">
          Standort, Studiengang, Semester, Modul. Mehr brauchst du nicht.
        </p>
        <div className="deck-visual">
          <ol className="step-list">
            <li><span className="step-num">01</span> Standort</li>
            <li><span className="step-num">02</span> Studiengang</li>
            <li><span className="step-num">03</span> Semester</li>
            <li><span className="step-num">04</span> Modul</li>
          </ol>
        </div>
        <div className="deck-actions">
          <button type="button" className="button secondary" onClick={openSelectModal}>
            Evaluation ansehen
          </button>
          <Link to="/me" className="button">Jetzt bewerten</Link>
        </div>
      </section>

      <section className="deck-section">
        <span className="kicker">SIMPLE, DIRECT</span>
        <h2>Kurze Antworten. Klare Signale.</h2>
        <p className="deck-text">
          Bewertungen sind schnell erstellt und sofort sichtbar. Dein Feedback zählt.
        </p>
        <div className="deck-visual">
          <div className="stat-grid">
            <div className="stat-card">
              <strong>7</strong>
              <span>Semester</span>
            </div>
            <div className="stat-card">
              <strong>3</strong>
              <span>Module je Semester</span>
            </div>
            <div className="stat-card">
              <strong>2</strong>
              <span>Minuten</span>
            </div>
          </div>
        </div>
      </section>

      <section className="deck-section">
        <span className="kicker">SAFE, PRIVATE</span>
        <h2>Anonym, fair, aggregiert.</h2>
        <p className="deck-text">
          Wir zeigen Zusammenfassungen, keine Einzelpersonen. So bleibt es sicher.
        </p>
        <div className="deck-visual">
          <div className="tag-list">
            <span className="tag">Anonym</span>
            <span className="tag">Datenschutz</span>
            <span className="tag">Kurz & klar</span>
            <span className="tag">Für alle</span>
          </div>
        </div>
      </section>

      <section className="deck-section testimonials">
        <span className="kicker">STUDENTS SAY</span>
        <h2>Stimmen aus dem Studium.</h2>
        <p className="deck-text menu-hint">
          Zieh die Kugel und lass sie los, um zufällige Bewertungen zu entdecken.
        </p>
        <div className="testimonial-menu">
          {Array.isArray(menuItems) && menuItems.length ? (
            <InfiniteMenu items={menuItems} scale={0.95} />
          ) : (
            <div className="menu-placeholder">
              {menuError || (menuItems ? 'Keine Bewertungen vorhanden.' : 'Lade Stimmen...')}
            </div>
          )}
        </div>
      </section>

      <section className="cta-band">
        <div className="cta-band__inner">
          <span className="kicker">READY</span>
          <h2>Feedback geben, wenn es zählt.</h2>
          <p className="deck-text">Starte jetzt und hilf, Lehre messbar zu verbessern.</p>
          <div className="hero__actions">
            <button type="button" className="button button--hero secondary" onClick={openSelectModal}>
              Evaluation ansehen
            </button>
            <Link to="/me" className="button button--hero">Jetzt bewerten</Link>
          </div>
        </div>
      </section>

      <SelectEvaluationModal isOpen={isSelectOpen} onClose={closeSelectModal} />
    </div>
  );
}
