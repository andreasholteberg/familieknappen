import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BigButton } from '@/components/BigButton';
import { Logo } from '@/components/Logo';
import { useAppStore } from '@/store/useAppStore';
import { colors, fontSize, spacing } from '@/theme/theme';

/**
 * Nøytral sperreskjerm (F-019). Vises når familiegruppens lisens ikke er
 * aktiv. Ingen kjøps-UI eller lenker (App Store-policy) – bare rolig
 * informasjon og mulighet til å logge ut eller prøve igjen.
 */
export default function LicenseScreen() {
  const router = useRouter();
  const signOut = useAppStore((s) => s.signOut);
  const refresh = useAppStore((s) => s.refresh);

  const retry = async () => {
    await refresh();
    router.replace('/');
  };

  const logout = async () => {
    await signOut();
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Logo size={88} />
        <Text style={styles.title}>Familieknappen er ikke aktiv</Text>
        <Text style={styles.text}>
          Tilgangen for familien din er ikke aktiv nå.{'\n'}
          Den i familien som administrerer Familieknappen kan hjelpe dere videre.
        </Text>
        <BigButton label="Prøv igjen" variant="primary" compact onPress={() => void retry()} />
        <BigButton label="Logg ut" variant="day" compact onPress={() => void logout()} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgScreen },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing(6),
    gap: spacing(4),
  },
  title: { fontSize: fontSize.title, fontWeight: '800', color: colors.ink, textAlign: 'center' },
  text: { fontSize: fontSize.body, color: colors.inkSoft, textAlign: 'center', lineHeight: 30 },
});
