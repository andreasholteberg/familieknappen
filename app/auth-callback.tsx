import { Redirect } from 'expo-router';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppStore } from '@/store/useAppStore';
import { colors, fontSize, spacing } from '@/theme/theme';

/**
 * Landingsskjerm for den magiske lenken. Selve token-utvekslingen skjer i
 * rot-layoutet (app/_layout.tsx). Her venter vi til økten er avklart og sender
 * brukeren videre til auth-gaten, som ruter etter rolle / ventende invitasjon.
 */
export default function AuthCallback() {
  const status = useAppStore((s) => s.status);

  if (status === 'ready' || status === 'signedOut' || status === 'error') {
    return <Redirect href="/" />;
  }

  return (
    <SafeAreaView style={styles.center}>
      <ActivityIndicator size="large" color={colors.brand} />
      <Text style={styles.muted}>Logger inn …</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: colors.bgScreen, alignItems: 'center', justifyContent: 'center', gap: spacing(3) },
  muted: { fontSize: fontSize.body, color: colors.inkSoft },
});
