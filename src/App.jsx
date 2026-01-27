import { Link, useLocation } from 'react-router-dom';
import RoutesConfig from './routes.jsx';
import NavBar from './components/NavBar.jsx';

export default function App() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const containerClassName = isHome ? 'container container--full' : 'container';

  return (
    <div className={containerClassName}>
      {!isHome && <NavBar />}
      <RoutesConfig />
      <footer style={{ marginTop: 32, opacity: 0.6 }}>
        <small>
          <Link to="/">Home</Link> · <Link to="/courses">Kurse</Link> · <Link to="/me">Meine Bewertungen</Link>
        </small>
      </footer>
    </div>
  );
}
