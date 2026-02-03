import { Link, useLocation } from 'react-router-dom';
import RoutesConfig from './routes.jsx';
import NavBar from './components/NavBar.jsx';
import { useAuth } from './context/AuthContext';

export default function App() {
  const location = useLocation();
  const { userEmail } = useAuth();

  const isHome = location.pathname === '/';
  const containerClassName = isHome ? 'container container--full' : 'container';

  return (
    <div className={containerClassName}>
      <NavBar />
      <RoutesConfig />
      <footer className="footer">
        <div className="footer__nav">
          <Link to="/">Home</Link>
          <Link to="/evaluation-schreiben">Evaluation schreiben</Link>
          {userEmail && <Link to="/me">Meine Evaluationen</Link>}
          {!userEmail && <Link to="/login">Login</Link>}
        </div>
      </footer>
    </div>
  );
}
