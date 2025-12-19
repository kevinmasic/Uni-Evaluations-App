import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../utils/supabase';

export default function NavBar() {
  const [userEmail, setUserEmail] = useState(null);

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

  return (
    <nav className="nav">
      <Link to="/">Home</Link>
      <Link to="/courses">Kurse</Link>
      <Link to="/me">Meine Bewertungen</Link>
      <span style={{ flex: 1 }} />
      {userEmail ? (
        <>
          <span className="badge" title={userEmail}>{userEmail}</span>
          <button className="button" onClick={handleLogout}>Logout</button>
        </>
      ) : (
        <Link to="/login" className="button secondary">Login</Link>
      )}
    </nav>
  );
}
