import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  const [isCampusOpen, setIsCampusOpen] = useState(false);
  const openCampusModal = () => setIsCampusOpen(true);
  const closeCampusModal = () => setIsCampusOpen(false);

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
          onClick={openCampusModal}
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

      {isCampusOpen && (
        <div
          role="presentation"
          onClick={closeCampusModal}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(17, 17, 17, 0.35)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            zIndex: 50
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={event => event.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: 16,
              padding: 28,
              minWidth: 280,
              maxWidth: 420,
              width: '100%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: 16, textAlign: 'center' }}>Standort waehlen</h3>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link
                to="/courses?campus=lippstadt"
                className="button secondary"
                style={{ padding: '16px 20px', fontSize: 16, textAlign: 'center', borderRadius: 0, minWidth: 140 }}
                onClick={closeCampusModal}
              >
                Lippstadt
              </Link>
              <Link
                to="/courses?campus=hamm"
                className="button"
                style={{ padding: '16px 20px', fontSize: 16, textAlign: 'center', borderRadius: 0, minWidth: 140 }}
                onClick={closeCampusModal}
              >
                Hamm
              </Link>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
