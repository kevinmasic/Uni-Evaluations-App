import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [matriculation, setMatriculation] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanMatriculation = matriculation.trim();

    setStatus('Prüfe Zugang...');
    const { data: isAllowed, error: verifyError } = await supabase.rpc('verify_user_credentials', {
      p_email: cleanEmail,
      p_matriculation: cleanMatriculation
    });

    if (verifyError) {
      setStatus(`Fehler: ${verifyError.message}`);
      return;
    }

    if (!isAllowed) {
      setStatus('E-Mail oder Matrikelnummer unbekannt.');
      return;
    }

    setStatus('Sende Magic Link...');
    const { error } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
      options: { emailRedirectTo: window.location.origin, shouldCreateUser: false }
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
    <div className="card card--narrow">
      <span className="bubble bubble--mint bubble--sm">Login</span>
      <h2>Login per Magic Link</h2>
      <p className="muted">Schnell, sicher, ohne Passwort.</p>
      <form onSubmit={sendMagicLink} className="form-grid">
        <input
          className="input"
          type="email"
          placeholder="Hochschul-E-Mail"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          className="input"
          type="text"
          placeholder="Matrikelnummer"
          value={matriculation}
          onChange={e => setMatriculation(e.target.value)}
          required
        />
        <button className="button" type="submit">Link senden</button>
      </form>
      {status && <p style={{ marginTop: 12 }}>{status}</p>}
    </div>
  );
}
