import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../services/supabase';
import { AuthState, User } from '../types';
import * as AuthSession from 'expo-auth-session';
import * as AppleAuthentication from 'expo-apple-authentication';

interface AuthContextType extends AuthState {
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
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
  });

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setAuthState({
        user: session?.user ? { id: session.user.id, email: session.user.email! } : null,
        session,
        loading: false,
      });
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setAuthState({
          user: session?.user ? { id: session.user.id, email: session.user.email! } : null,
          session,
          loading: false,
        });
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string) => {
    console.log('AuthContext.signUp called with email:', email);
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      console.log('Supabase signUp response:', { data, error });
      if (error) {
        console.error('Supabase signUp error:', error);
        throw error;
      }
      console.log('SignUp successful, user data:', data.user);
    } catch (error) {
      console.error('SignUp exception:', error);
      throw error;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const signInWithGoogle = async () => {
    // `useProxy` is not part of the TypeScript definition, so we omit it or cast
    const redirectUri = AuthSession.makeRedirectUri({});
    const request = new AuthSession.AuthRequest({
      clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID!, // Need to add this env var
      scopes: ['openid', 'profile', 'email'],
      responseType: AuthSession.ResponseType.Token,
      redirectUri,
      // `additionalParameters` not part of AuthRequestConfig in the typings
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
      if (error) throw error;
    }
  };

  const signInWithApple = async () => {
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
    if (error) throw error;
  };

  const value: AuthContextType = {
    ...authState,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    signInWithApple,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};