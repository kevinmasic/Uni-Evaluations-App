import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import SelectEvaluationModal from './SelectEvaluationModal.jsx';
import { useAuth } from '../context/AuthContext';

export default function NavBar() {
  const { userEmail } = useAuth();
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [theme, setTheme] = useState('light');
  const location = useLocation();
  const isWriteActive = location.pathname === '/evaluation-schreiben';
  const isMeActive = location.pathname === '/me';

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    const initialTheme = storedTheme || (prefersDark ? 'dark' : 'light');
    setTheme(initialTheme);
    document.documentElement.dataset.theme = initialTheme;
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  async function handleLogout() {
    await supabase.auth.signOut();
    location.href = '/';
  }

  function toggleTheme() {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  }

  return (
    <>
      <nav className={`nav${isMenuOpen ? ' nav--open' : ''}`}>
        <button
          type="button"
          className="button secondary nav-toggle"
          onClick={() => setIsMenuOpen(prev => !prev)}
          aria-expanded={isMenuOpen}
          aria-controls="main-navigation"
        >
          <span className="nav-toggle__icon" aria-hidden="true" />
          <span className="nav-toggle__label">{isMenuOpen ? 'Menü schließen' : 'Menü'}</span>
        </button>
        <div className="nav-menu" id="main-navigation">
          <Link to="/" className="nav-link" onClick={() => setIsMenuOpen(false)}>Home</Link>
          <button
            type="button"
            className="button secondary"
            onClick={() => {
              setIsSelectOpen(true);
              setIsMenuOpen(false);
            }}
          >
            Evaluationen ansehen
          </button>
          <Link
            to="/evaluation-schreiben"
            className={`button secondary nav-pill${isWriteActive ? ' nav-pill--active' : ''}`}
            onClick={() => setIsMenuOpen(false)}
          >
            Evaluation schreiben
          </Link>
          {userEmail && (
            <Link
              to="/me"
              className={`button secondary nav-pill${isMeActive ? ' nav-pill--active' : ''}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Meine Evaluationen
            </Link>
          )}
          <span className="nav-spacer" />
          <button
            type="button"
            className="button secondary"
            onClick={toggleTheme}
            aria-pressed={theme === 'dark'}
          >
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
          {userEmail ? (
            <>
              <span className="badge badge--truncate" title={userEmail}>{userEmail}</span>
              <button className="button" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <Link to="/login" className="button secondary" onClick={() => setIsMenuOpen(false)}>Login</Link>
          )}
        </div>
      </nav>
      <SelectEvaluationModal isOpen={isSelectOpen} onClose={() => setIsSelectOpen(false)} />
    </>
  );
}
