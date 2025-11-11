import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, type Profile } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';

type AuthContextType = {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (newPassword: string) => Promise<{ error: any }>;
  isPremium: boolean;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (data) {
      setProfile(data);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Session error:', error);
        supabase.auth.signOut().catch(() => {});
        setSession(null);
        setProfile(null);
        setLoading(false);
        return;
      }
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    }).catch((error) => {
      console.error('Failed to get session:', error);
      supabase.auth.signOut().catch(() => {});
      setSession(null);
      setProfile(null);
      setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setSession(session);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
      })();
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        }
      }
    });

    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const resetPassword = async (email: string) => {
    const redirectTo = `${window.location.origin}/reset-password`;

    console.log('Sending password reset email to:', email, 'with redirect:', redirectTo);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    return { error };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { error };
  };

  const refreshProfile = async () => {
    if (session?.user) {
      await fetchProfile(session.user.id);
    }
  };

  const isPremium = profile?.is_premium || profile?.is_test_user || false;

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updatePassword,
        isPremium,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
