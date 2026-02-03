import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import SelectEvaluationModal from './SelectEvaluationModal.jsx';
import { useAuth } from '../context/AuthContext';

export default function NavBar() {
  const { userEmail } = useAuth();
  const [isSelectOpen, setIsSelectOpen] = useState(false);
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

  async function handleLogout() {
    await supabase.auth.signOut();
    location.href = '/';
  }

  function toggleTheme() {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  }

  return (
    <>
      <nav className="nav">
        <Link to="/" className="nav-link">Home</Link>
        <button type="button" className="button secondary" onClick={() => setIsSelectOpen(true)}>
          Evaluationen ansehen
        </button>
        <Link
          to="/evaluation-schreiben"
          className={`button secondary nav-pill${isWriteActive ? ' nav-pill--active' : ''}`}
        >
          Evaluation schreiben
        </Link>
        {userEmail && (
          <Link to="/me" className={`button secondary nav-pill${isMeActive ? ' nav-pill--active' : ''}`}>
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
            <span className="badge" title={userEmail}>{userEmail}</span>
            <button className="button" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <Link to="/login" className="button secondary">Login</Link>
        )}
      </nav>
      <SelectEvaluationModal isOpen={isSelectOpen} onClose={() => setIsSelectOpen(false)} />
    </>
  );
}
