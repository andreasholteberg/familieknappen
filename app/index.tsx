import { Redirect } from 'expo-router';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BigButton } from '@/components/BigButton';
import { selectCurrentUser, useAppStore } from '@/store/useAppStore';
import { colors, fontSize, spacing } from '@/theme/theme';
import { BLOCKED_SUBSCRIPTION_STATUSES } from '@/types/models';

/**
 * Inngangspunkt og auth-gate. Bestemmer hvor brukeren skal:
 *  - laster        → rolig ventevisning
 *  - ikke innlogget → /sign-in (e-postkode)
 *  - innlogget      → /senior eller /relative ut fra profil-rollen
 *  - feil/ikke konfig → tydelig feilmelding (ingen stille mock-fallback)
 */
export default function Index() {
  const status = useAppStore((s) => s.status);
  const currentUser = useAppStore(selectCurrentUser);
  const errorMessage = useAppStore((s) => s.errorMessage);
  const pendingInviteToken = useAppStore((s) => s.pendingInviteToken);

  if (status === 'idle' || status === 'loading') {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={colors.brand} />
        <Text style={styles.muted}>Laster …</Text>
      </SafeAreaView>
    );
  }

  if (status === 'error') {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.title}>Noe gikk galt</Text>
        <Text style={styles.muted}>
          {errorMessage ?? 'Kunne ikke koble til. Sjekk at Supabase er satt opp i .env.'}
        </Text>
        <BigButton label="Prøv igjen" variant="day" compact onPress={() => useAppStore.getState().init()} />
      </SafeAreaView>
    );
  }

  if (status === 'signedOut') {
    return <Redirect href="/sign-in" />;
  }

  // status === 'ready'
  if (pendingInviteToken) {
    return <Redirect href={`/invite?token=${pendingInviteToken}`} />;
  }

  if (!currentUser) {
    return <Redirect href="/onboarding" />;
  }

  // Lisenssjekk (F-020): nøytral sperreskjerm hvis gruppen ikke er aktiv.
  const group = useAppStore.getState().group;
  if (group.id && BLOCKED_SUBSCRIPTION_STATUSES.includes(group.subscriptionStatus)) {
    return <Redirect href="/license" />;
  }

  return <Redirect href={currentUser.role === 'senior' ? '/senior' : '/relative'} />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: colors.bgScreen,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing(6),
    gap: spacing(3),
  },
  title: { fontSize: fontSize.title, fontWeight: '800', color: colors.brandDark, textAlign: 'center' },
  muted: { fontSize: fontSize.body, color: colors.inkSoft, textAlign: 'center', lineHeight: 28 },
});
