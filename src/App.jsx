import { Link, useLocation } from 'react-router-dom';
import RoutesConfig from './routes.jsx';
import NavBar from './components/NavBar.jsx';

export default function App() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const containerClassName = isHome ? 'container container--full' : 'container';

  return (
    <div className={containerClassName}>
      <NavBar />
      <RoutesConfig />
      <footer className="footer">
        <div className="footer__nav">
          <Link to="/">Home</Link>
          <Link to="/me">Meine Bewertungen</Link>
          <Link to="/login">Login</Link>
        </div>
        <small>Copyright 2026 Hochschule</small>
      </footer>
    </div>
  );
}
