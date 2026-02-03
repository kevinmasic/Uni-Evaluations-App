import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';

type Studiengang = {
  id: string;
  name: string;
  abschluss: string;
  standort?: { name?: string }[] | null;
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [matriculation, setMatriculation] = useState('');
  const [studiengaenge, setStudiengaenge] = useState<Studiengang[]>([]);
  const [studiengangId, setStudiengangId] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [mode, setMode] = useState<'login' | 'register'>('login');

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from('studiengang')
        .select('id, name, abschluss, standort:standort_id (name)')
        .order('name', { ascending: true });
      if (!active) return;
      if (error) {
        setStatus(`Fehler: ${error.message}`);
        return;
      }
      setStudiengaenge(data || []);
    })();
    return () => {
      active = false;
    };
  }, []);

  async function sendMagicLink(cleanEmail: string) {
    setStatus('Sende Link...');
    const { error } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
      options: { emailRedirectTo: window.location.origin, shouldCreateUser: true }
    });
    setStatus(error ? `Fehler: ${error.message}` : 'Check deine E-Mail!');
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const hshlEmailPattern = /^[^@\s]+@stud\.hshl\.de$/;

    if (!hshlEmailPattern.test(cleanEmail)) {
      setStatus('Bitte eine Hochschul-E-Mail mit @stud.hshl.de verwenden.');
      return;
    }

    setStatus('Prüfe Registrierung...');
    const { data: isRegistered, error } = await supabase.rpc('is_email_registered', {
      p_email: cleanEmail
    });

    if (error) {
      const details = error.details ? ` (${error.details})` : '';
      setStatus(`Fehler: ${error.message}${details}`);
      return;
    }

    if (!isRegistered) {
      setMode('register');
      setStatus('Du bist noch nicht registriert. Bitte registrieren.');
      return;
    }

    await sendMagicLink(cleanEmail);
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanMatriculation = matriculation.trim();
    const cleanStudiengangId = studiengangId.trim();
    const hshlEmailPattern = /^[^@\s]+@stud\.hshl\.de$/;

    if (!hshlEmailPattern.test(cleanEmail)) {
      setStatus('Bitte eine Hochschul-E-Mail mit @stud.hshl.de verwenden.');
      return;
    }
    if (!cleanMatriculation) {
      setStatus('Bitte Matrikelnummer angeben.');
      return;
    }
    if (!cleanStudiengangId) {
      setStatus('Bitte Studiengang auswählen.');
      return;
    }

    setStatus('Registriere...');
    const { data, error } = await supabase.rpc('register_student', {
      p_email: cleanEmail,
      p_matriculation: cleanMatriculation,
      p_studiengang_id: cleanStudiengangId
    });

    if (error || !data) {
      const details = error?.details ? ` (${error.details})` : '';
      setStatus(`Fehler: ${error?.message || 'Registrierung fehlgeschlagen.'}${details}`);
      return;
    }

    await sendMagicLink(cleanEmail);
  }

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) return;
      const pendingStudiengang = localStorage.getItem('pendingStudiengangId');
      if (pendingStudiengang) {
        const { error } = await supabase
          .from('users')
          .update({ studiengang_id: pendingStudiengang })
          .eq('email', session.user.email);
        if (error) {
          setStatus(`Fehler: ${error.message}`);
          return;
        }
        localStorage.removeItem('pendingStudiengangId');
      }
      location.href = '/me';
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="card card--narrow">
      <h2>Login per Link</h2>
      <p className="muted">Schnell, sicher, ohne Passwort.</p>
      {mode === 'login' && (
        <>
          <form onSubmit={handleLogin} className="form-grid">
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
          <div className="login-register-hint">
            <p className="muted">Hey, ist das deine erste Evaluation?</p>
            <button
              type="button"
              className="button secondary login-register-pill"
              onClick={() => setMode('register')}
            >
              Registriere dich
            </button>
          </div>
        </>
      )}

      {mode === 'register' && (
        <>
          <h3>Registrierung</h3>
          <form onSubmit={handleRegister} className="form-grid">
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
            <select
              className="select"
              value={studiengangId}
              onChange={event => setStudiengangId(event.target.value)}
              required
            >
              <option value="">Studiengang wählen...</option>
              {studiengaenge.map(item => {
                const standortName = item.standort?.[0]?.name;
                const standortLabel = standortName ? `, ${standortName}` : '';
                return (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.abschluss}{standortLabel})
                  </option>
                );
              })}
            </select>
            <button className="button" type="submit">Registrieren & Link senden</button>
          </form>
          <button
            type="button"
            className="button secondary login-register-pill"
            onClick={() => setMode('login')}
          >
            Zurück zum Login
          </button>
        </>
      )}
      {status && <p style={{ marginTop: 12 }}>{status}</p>}
    </div>
  );
}
