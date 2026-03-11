import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../services/supabase';
import { User } from '../types';
import * as AuthSession from 'expo-auth-session';
import * as AppleAuthentication from 'expo-apple-authentication';

/**
 * AuthContext provides authentication state and methods
 * loading: boolean - true while checking session, false once session check is complete
 * user: User | null - current authenticated user or null
 * session: any - Supabase session object
 */
export interface AuthContextType {
  loading: boolean;
  user: User | null;
  session: any;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Separate state variables for clarity - never use strings for booleans
  const [loading, setLoading] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<any>(null);

  // Initialize auth on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('[Auth] Initializing auth state');
        setLoading(true);

        // Get current session
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('[Auth] Error getting session:', error);
          setLoading(false);
          return;
        }

        // Set user from session
        if (currentSession?.user) {
          setUser({
            id: currentSession.user.id,
            email: currentSession.user.email || '',
          });
          setSession(currentSession);
        } else {
          setUser(null);
          setSession(null);
        }

        setLoading(false);
        console.log('[Auth] Auth initialization complete. User:', !!currentSession?.user);
      } catch (err) {
        console.error('[Auth] Exception during initialization:', err);
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log('[Auth] Auth state changed:', event);

        if (currentSession?.user) {
          setUser({
            id: currentSession.user.id,
            email: currentSession.user.email || '',
          });
          setSession(currentSession);
        } else {
          setUser(null);
          setSession(null);
        }
      }
    );

    // Cleanup subscription on unmount
    return () => {
      console.log('[Auth] Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<void> => {
    try {
      console.log('[Auth] Signing in user:', email);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      console.log('[Auth] Sign in successful');
    } catch (err) {
      console.error('[Auth] Sign in failed:', err);
      throw err;
    }
  };

  const signUp = async (email: string, password: string): Promise<void> => {
    try {
      console.log('[Auth] Signing up user:', email);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      console.log('[Auth] Sign up successful');
    } catch (err) {
      console.error('[Auth] Sign up failed:', err);
      throw err;
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      console.log('[Auth] Signing out');
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      setUser(null);
      setSession(null);
      console.log('[Auth] Sign out successful');
    } catch (err) {
      console.error('[Auth] Sign out failed:', err);
      throw err;
    }
  };

  const signInWithGoogle = async (): Promise<void> => {
    try {
      console.log('[Auth] Starting Google sign in');
      const redirectUri = AuthSession.makeRedirectUri({});
      const request = new AuthSession.AuthRequest({
        clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID!,
        scopes: ['openid', 'profile', 'email'],
        responseType: AuthSession.ResponseType.Token,
        redirectUri,
        prompt: AuthSession.Prompt.SelectAccount,
      } as any);

      const result = await request.promptAsync({
        authorizationEndpoint: 'https://accounts.google.com/oauth/v2/auth',
      });

      if (result.type === 'success') {
        const { access_token } = result.params;
        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: access_token,
        });

        if (error) {
          throw error;
        }

        console.log('[Auth] Google sign in successful');
      }
    } catch (err) {
      console.error('[Auth] Google sign in failed:', err);
      throw err;
    }
  };

  const signInWithApple = async (): Promise<void> => {
    try {
      console.log('[Auth] Starting Apple sign in');
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const { identityToken } = credential;
      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: identityToken!,
      });

      if (error) {
        throw error;
      }

      console.log('[Auth] Apple sign in successful');
    } catch (err) {
      console.error('[Auth] Apple sign in failed:', err);
      throw err;
    }
  };

  const value: AuthContextType = {
    loading: loading as boolean,
    user,
    session,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    signInWithApple,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};