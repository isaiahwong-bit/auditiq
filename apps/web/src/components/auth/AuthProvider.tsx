import { useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import type { UserProfile } from '@auditiq/types';
import { supabase } from '../../lib/supabase';
import { AuthContext } from '../../lib/auth-context';

const DEMO_MODE = !import.meta.env.VITE_SUPABASE_URL;

const DEMO_PROFILE: UserProfile = {
  id: 'demo-user-id',
  organisation_id: 'demo',
  role: 'qa_manager',
  full_name: 'QA Manager (Demo)',
  created_at: new Date().toISOString(),
};

const DEMO_SESSION = { access_token: 'demo', refresh_token: 'demo' } as unknown as Session;
const DEMO_USER = { id: 'demo-user-id', email: 'demo@auditiq.com.au' } as unknown as User;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(DEMO_MODE ? DEMO_SESSION : null);
  const [user, setUser] = useState<User | null>(DEMO_MODE ? DEMO_USER : null);
  const [profile, setProfile] = useState<UserProfile | null>(DEMO_MODE ? DEMO_PROFILE : null);
  const [orgSlug, setOrgSlug] = useState<string | null>(DEMO_MODE ? 'demo' : null);
  const [loading, setLoading] = useState(!DEMO_MODE);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    setProfile(data);

    if (data?.organisation_id) {
      const { data: org } = await supabase
        .from('organisations')
        .select('slug')
        .eq('id', data.organisation_id)
        .single();
      setOrgSlug(org?.slug ?? null);
    }
  }, []);

  useEffect(() => {
    if (DEMO_MODE) return;

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        fetchProfile(s.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        fetchProfile(s.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (DEMO_MODE) {
      setSession(DEMO_SESSION);
      setUser(DEMO_USER);
      setProfile(DEMO_PROFILE);
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    if (!DEMO_MODE) {
      await supabase.auth.signOut();
    }
    setSession(null);
    setUser(null);
    setProfile(null);
  }, []);

  return (
    <AuthContext.Provider value={{ session, user, profile, orgSlug, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
