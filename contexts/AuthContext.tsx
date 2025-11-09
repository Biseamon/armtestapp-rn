/**
 * Authentication Context
 *
 * This file manages user authentication and profile data throughout the app.
 * It provides login, signup, logout functionality and maintains the current user's session.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, Profile } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';

/**
 * Type definition for the authentication context
 * Defines all available authentication functions and state
 */
type AuthContextType = {
  session: Session | null;           // Current user session from Supabase
  profile: Profile | null;            // User profile data from database
  loading: boolean;                   // Loading state during initial auth check
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signInWithApple: () => Promise<{ error: any }>;
  signInWithFacebook: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  isPremium: boolean;                 // Whether user has premium access
  refreshProfile: () => Promise<void>; // Manually refresh profile data
};

// Create the authentication context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider Component
 *
 * Wraps the app to provide authentication state and functions to all child components.
 * Automatically handles session persistence and profile fetching.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // State: Current Supabase session (contains user ID, email, etc.)
  const [session, setSession] = useState<Session | null>(null);

  // State: User profile from database (contains full_name, is_premium, weight_unit, etc.)
  const [profile, setProfile] = useState<Profile | null>(null);

  // State: Loading indicator for initial authentication check
  const [loading, setLoading] = useState(true);

  /**
   * Fetch user profile from database
   * Called after successful authentication to load user data
   */
  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle(); // Returns null if no profile found (won't throw error)

    if (data) {
      setProfile(data);
    }
  };

  /**
   * Effect: Initialize authentication on app startup
   *
   * 1. Retrieves existing session from storage (if user was previously logged in)
   * 2. Sets up a listener for auth state changes (login, logout, token refresh)
   * 3. Fetches user profile when session is available
   */
  useEffect(() => {
    // Get existing session from local storage on app start
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Session error:', error);
        // Clear invalid session
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

    // Listen for authentication state changes
    // This fires when user logs in, logs out, or token is refreshed
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setSession(session);
        if (session?.user) {
          // User logged in - fetch their profile
          await fetchProfile(session.user.id);
        } else {
          // User logged out - clear profile
          setProfile(null);
        }
        setLoading(false);
      })();
    });

    // Cleanup: Unsubscribe from auth listener when component unmounts
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  /**
   * Sign in an existing user
   * @param email - User's email address
   * @param password - User's password
   * @returns Object containing error if sign in failed
   */
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  /**
   * Register a new user
   * @param email - New user's email
   * @param password - New user's password
   * @param fullName - New user's full name
   * @returns Object containing error if signup failed
   *
   * The profile is automatically created by a database trigger
   */
  const signUp = async (email: string, password: string, fullName: string) => {
    // Create authentication user in Supabase Auth
    // The database trigger will automatically create the profile
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName, // Pass full name to user metadata
        }
      }
    });

    return { error };
  };

  /**
   * Sign in with Google
   * Uses Supabase OAuth with Google provider
   */
  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'armwrestlingpro:///(tabs)',
      },
    });
    return { error };
  };

  /**
   * Sign in with Apple
   * Uses Supabase OAuth with Apple provider
   */
  const signInWithApple = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: 'armwrestlingpro:///(tabs)',
      },
    });
    return { error };
  };

  /**
   * Sign in with Facebook
   * Uses Supabase OAuth with Facebook provider
   */
  const signInWithFacebook = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo: 'armwrestlingpro:///(tabs)',
      },
    });
    return { error };
  };

  /**
   * Sign out the current user
   * Clears session and profile data
   */
  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  /**
   * Manually refresh the user's profile data
   * Useful after updating profile settings
   */
  const refreshProfile = async () => {
    if (session?.user) {
      await fetchProfile(session.user.id);
    }
  };

  // Determine if user has premium access (either paid premium or test user)
  const isPremium = profile?.is_premium || profile?.is_test_user || false;

  // Provide all auth state and functions to child components
  return (
    <AuthContext.Provider
      value={{
        session,          // Current user session
        profile,          // User profile data
        loading,          // Loading state
        signIn,           // Login function
        signUp,           // Registration function
        signInWithGoogle, // Google OAuth login
        signInWithApple,  // Apple OAuth login
        signInWithFacebook, // Facebook OAuth login
        signOut,          // Logout function
        isPremium,        // Premium status
        refreshProfile,   // Refresh profile function
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * useAuth Hook
 *
 * Custom hook to access authentication context from any component.
 * Must be used within an AuthProvider.
 *
 * @example
 * const { session, profile, signIn, signOut } = useAuth();
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
