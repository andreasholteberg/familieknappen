import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import * as svc from '@/services';
import { useAppStore } from '@/store/useAppStore';
import { colors, fontSize, spacing } from '@/theme/theme';

const firstParam = (value: string | string[] | undefined): string | null => {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  return null;
};

const callbackUrlFromParams = (params: Record<string, string | string[] | undefined>): string | null => {
  const query = new URLSearchParams();
  const code = firstParam(params.code);
  const accessToken = firstParam(params.access_token);
  const refreshToken = firstParam(params.refresh_token);

  if (code) query.set('code', code);
  if (accessToken) query.set('access_token', accessToken);
  if (refreshToken) query.set('refresh_token', refreshToken);

  const queryString = query.toString();
  return queryString ? `familieknappen:///auth-callback?${queryString}` : null;
};

/**
 * Landingsskjerm for magisk lenke. Denne ruten eier callback-prosesseringen,
 * slik at auth-gaten ikke sender brukeren tilbake til login foer sessionen er
 * ferdig etablert.
 */
export default function AuthCallback() {
  const router = useRouter();
  const incomingUrl = Linking.useURL();
  const params = useLocalSearchParams();
  const routeCallbackUrl = callbackUrlFromParams(
    params as Record<string, string | string[] | undefined>,
  );
  const started = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (started.current) return;
    const callbackUrl =
      typeof window !== 'undefined' ? window.location.href : incomingUrl ?? routeCallbackUrl;
    if (!callbackUrl) return;

    started.current = true;
    void (async () => {
      try {
        const session = await svc.auth.completeSignInFromUrl(callbackUrl);
        if (!session) {
          throw new Error('Innloggingslenken mangler auth-kode.');
        }

        useAppStore.setState({
          session,
          currentUserId: session.user.id,
          status: 'loading',
          errorMessage: null,
        });
        await useAppStore.getState().refresh();

        const confirmedSession = await svc.auth.getSession();
        if (!confirmedSession) {
          throw new Error('Kunne ikke bekrefte innlogget sesjon.');
        }

        router.replace('/');
      } catch (err) {
        if (__DEV__) {
          // Logg bare feilmelding, aldri tokens eller full callback-URL.
          // eslint-disable-next-line no-console
          console.warn('[Familieknappen] Auth callback feilet:', (err as Error)?.message);
        }
        useAppStore.setState({ status: 'signedOut', session: null, currentUserId: null });
        setError((err as Error)?.message ?? 'Kunne ikke fullfoere innloggingen.');
      }
    })();
  }, [incomingUrl, routeCallbackUrl, router]);

  if (error) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.title}>Innloggingen stoppet</Text>
        <Text style={styles.muted}>{error}</Text>
        <Pressable style={styles.button} onPress={() => router.replace('/sign-in')}>
          <Text style={styles.buttonText}>Proev igjen</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.center}>
      <ActivityIndicator size="large" color={colors.brand} />
      <Text style={styles.muted}>Logger inn ...</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: colors.bgScreen, alignItems: 'center', justifyContent: 'center', gap: spacing(3), paddingHorizontal: spacing(6) },
  title: { fontSize: fontSize.title, fontWeight: '800', color: colors.brandDark, textAlign: 'center' },
  muted: { fontSize: fontSize.body, color: colors.inkSoft, textAlign: 'center', lineHeight: 28 },
  button: { marginTop: spacing(2), backgroundColor: colors.brand, paddingHorizontal: spacing(5), paddingVertical: spacing(3), borderRadius: 12 },
  buttonText: { color: colors.white, fontSize: fontSize.md, fontWeight: '700' },
});
