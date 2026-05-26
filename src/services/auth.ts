/**
 * Auth-tjeneste – passordløs innlogging med magisk lenke (Supabase OTP/PKCE).
 *
 * Senior skal slippe å håndtere passord. Pårørende setter opp kontoen; etter
 * første innlogging holder den vedvarende økten brukeren innlogget «automatisk».
 */

import type { Session } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';

import { supabase } from '@/lib/supabase';

/** Sender en magisk lenke til e-posten. emailRedirectTo må være en app-deep-link. */
export async function sendMagicLink(email: string): Promise<void> {
  const emailRedirectTo = Linking.createURL('auth-callback');
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

/** Fullfør innlogging fra en åpnet deep link (?code=… for PKCE). */
export async function completeSignInFromUrl(url: string): Promise<boolean> {
  const parsed = Linking.parse(url);
  const code = parsed.queryParams?.code;
  if (!code) return false;
  const { error } = await supabase.auth.exchangeCodeForSession(String(code));
  if (error) throw error;
  return true;
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
