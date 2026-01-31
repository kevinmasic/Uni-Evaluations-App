import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="card card--narrow">
      <span className="bubble bubble--lav bubble--sm">404</span>
      <h2>Seite nicht gefunden</h2>
      <p className="muted">Zurück zur Startseite.</p>
      <Link to="/" className="button">Home</Link>
    </div>
  );
}
