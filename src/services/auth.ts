/**
 * Auth-tjeneste – passordløs innlogging med 6-sifret e-postkode.
 *
 * Senior skal slippe å håndtere passord. Pårørende setter opp kontoen; etter
 * første innlogging holder den vedvarende økten brukeren innlogget «automatisk».
 * Magisk lenke/deep link er beholdt som backup, men er ikke hovedflyt i pilot.
 */

import type { Session } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';
import { createAppUrl } from '@/utils/appLinks';

type AuthParams = {
  code: string | null;
  accessToken: string | null;
  refreshToken: string | null;
};

const firstString = (value: unknown): string | null => {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  return null;
};

const readAuthParams = (url: string): AuthParams => {
  try {
    const parsed = new URL(url);
    const hashParams = new URLSearchParams(parsed.hash.startsWith('#') ? parsed.hash.slice(1) : '');
    return {
      code: parsed.searchParams.get('code') ?? hashParams.get('code'),
      accessToken: hashParams.get('access_token') ?? parsed.searchParams.get('access_token'),
      refreshToken: hashParams.get('refresh_token') ?? parsed.searchParams.get('refresh_token'),
    };
  } catch {
    const parsed = Linking.parse(url);
    const hashParams = new URLSearchParams(url.split('#')[1] ?? '');
    return {
      code: firstString(parsed.queryParams?.code) ?? hashParams.get('code'),
      accessToken: hashParams.get('access_token') ?? firstString(parsed.queryParams?.access_token),
      refreshToken: hashParams.get('refresh_token') ?? firstString(parsed.queryParams?.refresh_token),
    };
  }
};

const logAuthDebug = (message: string, detail?: string): void => {
  if (!__DEV__) return;
  // Keep auth logs token-free. Only log flow type / path-level information.
  // eslint-disable-next-line no-console
  console.log(`[Familieknappen] Auth: ${message}${detail ? ` (${detail})` : ''}`);
};

/** Sender en 6-sifret e-postkode. Bruker ikke redirectTo i hovedflyten. */
export async function sendEmailCode(email: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: { shouldCreateUser: true },
  });
  if (error) throw error;
}

/** Sender en magisk lenke til e-posten. Beholdt som deep-link-backup. */
export async function sendMagicLink(email: string): Promise<void> {
  const emailRedirectTo = createAppUrl('auth-callback');
  if (__DEV__) {
    // Skriv ut noyaktig redirect-URI slik at den kan legges i
    // Supabase -> Authentication -> URL Configuration -> Redirect URLs.
    // eslint-disable-next-line no-console
    console.log('[Familieknappen] Magisk lenke redirect-URI:', emailRedirectTo);
  }
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: { emailRedirectTo },
  });
  if (error) throw error;
}

/** Verifiser 6-sifret OTP-kode fra e-post. */
export async function verifyEmailCode(email: string, code: string): Promise<Session | null> {
  const { data, error } = await supabase.auth.verifyOtp({
    email: email.trim().toLowerCase(),
    token: code.trim(),
    type: 'email',
  });
  if (error) throw error;
  return data.session ?? (await getSession());
}

/** Midlertidig testinnlogging for preview/development. Bruker ikke service role. */
export async function signInWithPassword(email: string, password: string): Promise<Session | null> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) throw error;
  return data.session ?? (await getSession());
}

/** Fullfor innlogging fra callback-lenke: PKCE ?code=... eller hash-tokenflow. */
export async function completeSignInFromUrl(url: string): Promise<Session | null> {
  const { code, accessToken, refreshToken } = readAuthParams(url);

  if (code) {
    logAuthDebug('behandler PKCE code callback');
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
    return data.session ?? (await getSession());
  }

  if (accessToken && refreshToken) {
    logAuthDebug('behandler hash-token callback');
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) throw error;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.history.replaceState(null, document.title, window.location.pathname + window.location.search);
    }
    return data.session ?? (await getSession());
  }

  logAuthDebug('callback uten auth-parametere');
  return null;
}

export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export function onAuthStateChange(cb: (session: Session | null) => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => cb(session));
  return () => data.subscription.unsubscribe();
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

/** Bakoverkompatibelt alias for tidligere navn. */
export async function verifyEmailOtp(email: string, token: string): Promise<Session | null> {
  return verifyEmailCode(email, token);
}
