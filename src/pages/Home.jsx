import { useState } from 'react';
import { Link } from 'react-router-dom';
import SelectEvaluationModal from '../components/SelectEvaluationModal.jsx';

export default function Home() {
  const [isSelectOpen, setIsSelectOpen] = useState(false);

  const openSelectModal = () => setIsSelectOpen(true);
  const closeSelectModal = () => setIsSelectOpen(false);

  return (
    <div style={{ display: 'grid', gap: 20, width: '100%' }}>
      <header>
        <h1 style={{ marginBottom: 8, textAlign: 'center' , fontSize: 50}}>Willkommen im offiziellen Evaluationsportal der Hochschule</h1>
        <p style={{ margin: 0, fontSize: 30, fontWeight: 500, color: '#333', textAlign: 'center' }}>
          Ihre Meinung zählt – gestalten Sie die Lehre aktiv mit.
        </p>
      </header>

      <div style={{ display: 'grid', gap: 50, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <section>
          <h3>Zweck des Portals</h3>
          <p>
            Dieses Portal ist das zentrale Tool der Hochschule zur Evaluation von Lehrveranstaltungen und Dozierenden.
            Studierende k??nnen hier w??hrend der offiziellen Evaluationszeitr??ume ihre Erfahrungen teilen und Unterst??tzungsbedarf benennen.
          </p>
        </section>

        <section>
          <h3>Ihr Feedback macht einen Unterschied</h3>
          <p>
            Ehrliche, sachliche und respektvolle R??ckmeldungen liefern wertvolle Hinweise f??r die Weiterentwicklung von Lehrformaten und Studienangeboten.
            Jede Stimme tr??gt dazu bei, St??rken zu festigen und Verbesserungspotenziale aufzudecken.
          </p>
        </section>

        <section>
          <h3>Datenschutz und Anonymit??t</h3>
          <p>
            Die Hochschule gew??hrleistet den Schutz Ihrer Daten sowie die Anonymit??t aller Teilnehmenden.
            Bewertungsergebnisse werden ausschlie?Ylich in aggregierter Form ausgewertet und verantwortungsbewusst genutzt.
          </p>
        </section>
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          type="button"
          className="button secondary"
          style={{ padding: '18px 28px', fontSize: 18, minWidth: 220, textAlign: 'center' }}
          onClick={openSelectModal}
        >
          Angucken
        </button>
        <Link
          to="/me"
          className="button"
          style={{ padding: '18px 28px', fontSize: 18, minWidth: 220, textAlign: 'center' }}
        >
          Evaluieren
        </Link>
      </div>

      <SelectEvaluationModal isOpen={isSelectOpen} onClose={closeSelectModal} />

    </div>
  );
}
