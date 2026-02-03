import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../utils/supabase';

export type AuthProfile = {
  studiengang_id: string | null;
} | null;

type AuthContextValue = {
  loading: boolean;
  session: Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session'] | null;
  user: Awaited<ReturnType<typeof supabase.auth.getUser>>['data']['user'] | null;
  userEmail: string | null;
  profile: AuthProfile;
  profileLoading: boolean;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  loading: true,
  session: null,
  user: null,
  userEmail: null,
  profile: null,
  profileLoading: true,
  refreshProfile: async () => {}
});

async function fetchProfile(email: string | null): Promise<AuthProfile> {
  if (!email) return null;
  const { data, error } = await supabase
    .from('users')
    .select('studiengang_id')
    .eq('email', email)
    .maybeSingle();
  if (error) return null;
  return (data ?? null) as AuthProfile;
}

async function applyPendingStudiengang(session: AuthContextValue['session']) {
  const pendingStudiengang = localStorage.getItem('pendingStudiengangId');
  if (!pendingStudiengang || !session?.user?.email) return;
  const { error } = await supabase
    .from('users')
    .update({ studiengang_id: pendingStudiengang })
    .eq('email', session.user.email);
  if (!error) localStorage.removeItem('pendingStudiengangId');
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthContextValue['session']>(null);
  const [user, setUser] = useState<AuthContextValue['user']>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<AuthProfile>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadSession() {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);
      setLoading(false);
      await applyPendingStudiengang(data.session ?? null);
    }

    loadSession();
    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!active) return;
      setSession(nextSession ?? null);
      setUser(nextSession?.user ?? null);
      setLoading(false);
      await applyPendingStudiengang(nextSession ?? null);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let active = true;
    if (!user?.email) {
      setProfile(null);
      setProfileLoading(false);
      return () => {};
    }
    setProfileLoading(true);
    fetchProfile(user.email).then(data => {
      if (!active) return;
      setProfile(data);
      setProfileLoading(false);
    });
    return () => {
      active = false;
    };
  }, [user?.email]);

  const refreshProfile = async () => {
    if (!user?.email) return;
    setProfileLoading(true);
    const data = await fetchProfile(user.email);
    setProfile(data);
    setProfileLoading(false);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      loading,
      session,
      user,
      userEmail: user?.email ?? null,
      profile,
      profileLoading,
      refreshProfile
    }),
    [loading, session, user, profile, profileLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
