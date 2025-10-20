import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (mounted) {
        setAuthed(Boolean(session));
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (loading) return <p>Lade…</p>;
  if (!authed) return <Navigate to="/login" replace />;
  return children;
}
