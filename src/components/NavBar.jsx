import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import SelectEvaluationModal from './SelectEvaluationModal.jsx';

export default function NavBar() {
  const [userEmail, setUserEmail] = useState(null);
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [theme, setTheme] = useState('light');

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
    let active = true;

    async function loadSession() {
      const { data } = await supabase.auth.getSession();
      if (active) {
        setUserEmail(data.session?.user?.email ?? null);
      }
    }

    loadSession();
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) {
        setUserEmail(session?.user?.email ?? null);
      }
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

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
          Evaluation ansehen
        </button>
        <Link to="/me" className="nav-link">Meine Bewertungen</Link>
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
