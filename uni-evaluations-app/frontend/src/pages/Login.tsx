import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setStatus('Sende Magic Link…');
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin }
    });
    setStatus(error ? `Fehler: ${error.message}` : 'Check deine E-Mail (Magic Link)!');
  }

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) location.href = '/me';
    });
    return () => { sub.subscription.unsubscribe(); };
  }, []);

  return (
    <div className="card">
      <h2>Login (Magic Link)</h2>
      <form onSubmit={sendMagicLink} style={{ display: 'grid', gap: 12, maxWidth: 420 }}>
        <input
          className="input"
          type="email"
          placeholder="Hochschul-E-Mail"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <button className="button" type="submit">Link senden</button>
      </form>
      {status && <p style={{ marginTop: 12 }}>{status}</p>}
    </div>
  );
}
