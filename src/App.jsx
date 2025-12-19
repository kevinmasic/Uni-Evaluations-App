import { Link } from 'react-router-dom';
import RoutesConfig from './routes.jsx';
import NavBar from './components/NavBar.jsx';

export default function App() {
  return (
    <div className="container">
      <h1>🎓 Uni Evaluations App</h1>
      <NavBar />
      <RoutesConfig />
      <footer style={{ marginTop: 32, opacity: 0.6 }}>
        <small>
          <Link to="/">Home</Link> · <Link to="/courses">Kurse</Link> · <Link to="/me">Meine Bewertungen</Link>
        </small>
      </footer>
    </div>
  );
}
