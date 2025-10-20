export default function Home() {
  return (
    <div className="card" style={{ display: 'grid', gap: 20 }}>
      <header>
        <h1 style={{ marginBottom: 8 }}>Willkommen im offiziellen Evaluationsportal der Hochschule</h1>
        <p style={{ margin: 0, fontSize: 18, fontWeight: 500, color: '#333' }}>
          Ihre Meinung zählt – gestalten Sie die Lehre aktiv mit.
        </p>
      </header>

      <section>
        <h3>Zweck des Portals</h3>
        <p>
          Dieses Portal ist das zentrale Tool der Hochschule zur Evaluation von Lehrveranstaltungen und Dozierenden.
          Studierende können hier während der offiziellen Evaluationszeiträume ihre Erfahrungen teilen und Unterstützungsbedarf benennen.
        </p>
      </section>

      <section>
        <h3>Ihr Feedback macht einen Unterschied</h3>
        <p>
          Ehrliche, sachliche und respektvolle Rückmeldungen liefern wertvolle Hinweise für die Weiterentwicklung von Lehrformaten und Studienangeboten.
          Jede Stimme trägt dazu bei, Stärken zu festigen und Verbesserungspotenziale aufzudecken.
        </p>
      </section>

      <section>
        <h3>Datenschutz und Anonymität</h3>
        <p>
          Die Hochschule gewährleistet den Schutz Ihrer Daten sowie die Anonymität aller Teilnehmenden.
          Bewertungsergebnisse werden ausschließlich in aggregierter Form ausgewertet und verantwortungsbewusst genutzt.
        </p>
      </section>

      <aside
        style={{
          border: '1px solid #d9e2ec',
          borderRadius: 10,
          background: '#f0f4f8',
          padding: 16,
          fontSize: 14
        }}
      >
        <strong>Hinweis:</strong> Die Evaluationsphase findet jeweils zum Ende des Semesters statt. Bitte beachten Sie die offiziellen
        Termine der Hochschule.
      </aside>
    </div>
  );
}
