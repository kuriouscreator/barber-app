import React, { createContext, useContext, useEffect, useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from '../lib/supabase';
import { redirectTo } from '../lib/linking';
import { RewardsService } from '../services/RewardsService';

WebBrowser.maybeCompleteAuthSession(); // important on iOS

type Ctx = {
  session: any;
  user: any;
  loading: boolean;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUpWithPassword: (email: string, password: string, fullName: string, phone?: string, referralCode?: string) => Promise<{ needsEmailConfirmation: boolean }>;
  signInWithMagicLink: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthCtx = createContext<Ctx>(null as any);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Subscribe to auth changes + restore session
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      console.log('Auth session check timed out, continuing without session');
      setLoading(false);
    }, 5000); // 5 second timeout

    supabase.auth.getSession()
      .then(({ data }) => {
        clearTimeout(timeoutId);
        setSession(data.session ?? null);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error getting session:', error);
        clearTimeout(timeoutId);
        setSession(null);
        setLoading(false);
      });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => {
      clearTimeout(timeoutId);
      sub.subscription.unsubscribe();
    };
  }, []);

  // Handle deep-link auth (magic links / OAuth)
  useEffect(() => {
    const onUrl = async (event: Linking.EventType) => {
      const { url } = event as any;
      // Supabase can parse tokens from URL fragments, but in Expo we typically
      // let supabase-js handle session via its PKCE flow when using signInWithOAuth.
      // Keep this handler if you need custom parsing; otherwise, no-op is fine.
    };
    const sub = Linking.addEventListener('url', onUrl);
    return () => sub.remove();
  }, []);

  const signInWithPassword = async (email: string, password: string) => {
    console.log('🔐 Attempting sign in with password...', { email });
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      console.error('❌ Sign in error:', {
        message: error.message,
        status: error.status,
        name: error.name,
      });
      throw error;
    }

    console.log('✅ Sign in successful', { userId: data?.user?.id });
  };

  const signUpWithPassword = async (
    email: string,
    password: string,
    fullName: string,
    phone?: string,
    referralCode?: string
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone || null,
        },
        emailRedirectTo: redirectTo,
      },
    });

    if (error) throw error;

    // Process referral code if provided
    if (referralCode && data.user) {
      try {
        console.log('Processing referral code:', referralCode);
        const success = await RewardsService.processReferral(referralCode, data.user.id);
        if (success) {
          console.log('✅ Referral processed successfully');
        } else {
          console.log('❌ Referral code was invalid or already used');
        }
      } catch (referralError) {
        // Don't fail sign-up if referral processing fails
        console.error('Error processing referral:', referralError);
      }
    }

    // Return whether email confirmation is needed
    // If session exists immediately, email confirmation is disabled
    // If no session, user needs to confirm email
    return {
      needsEmailConfirmation: !data.session,
    };
  };

  const signInWithMagicLink = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });
    if (error) throw error;
  };

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, skipBrowserRedirect: false },
    });
    if (error) throw error;
    // supabase-js + WebBrowser will handle; nothing else needed
  };

  const signInWithApple = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: { redirectTo, skipBrowserRedirect: false },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthCtx.Provider value={{
      session,
      user: session?.user ?? null,
      loading,
      signInWithPassword,
      signUpWithPassword,
      signInWithMagicLink,
      signInWithGoogle,
      signInWithApple,
      signOut,
    }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
