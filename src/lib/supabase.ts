/**
 * Supabase-klient for Familieknappen.
 *
 * Én sann datakilde: Supabase. Det finnes ingen mock-fallback. Hvis miljøet
 * ikke er konfigurert, feiler vi tydelig (kaster) i stedet for å starte i en
 * uklar tilstand – dette gjør feilsøking enklere i utvikling.
 *
 * Auth-økten lagres i AsyncStorage slik at brukeren (særlig senior) forblir
 * innlogget etter første gang. autoRefreshToken holder økten gyldig.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';
import 'react-native-url-polyfill/auto';

import type { Database } from '@/types/database.types';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Tydelig, hard feil i stedet for stille fallback til mockdata.
  throw new Error(
    '[Familieknappen] Supabase er ikke konfigurert.\n' +
      'Sett EXPO_PUBLIC_SUPABASE_URL og EXPO_PUBLIC_SUPABASE_ANON_KEY i .env ' +
      '(se .env.example), og start Expo på nytt med «npx expo start -c».',
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // Vi bruker PKCE + manuell deep link-håndtering i appen, ikke URL i nettleser.
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
});

// På native: pause/fortsett auto-refresh når appen går i bakgrunnen/forgrunnen.
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
