import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BigButton } from '@/components/BigButton';
import { Logo } from '@/components/Logo';
import { LEGAL_VERSIONS } from '@/content/legal';
import { useAppStore } from '@/store/useAppStore';
import { colors, fontSize, spacing } from '@/theme/theme';

/**
 * Samtykkeskjerm (F-041). Vises én gang etter innlogging – og på nytt hvis
 * vilkårene eller personvernerklæringen endres vesentlig. Rolig og kort:
 * lenker til dokumentene + én stor godta-knapp.
 */
export default function Consent() {
  const router = useRouter();
  const acceptLegal = useAppStore((s) => s.acceptLegal);
  const signOut = useAppStore((s) => s.signOut);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accept = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await acceptLegal();
      router.replace('/');
    } catch {
      setError('Fikk ikke lagret samtykket. Prøv igjen.');
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    await signOut();
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Logo size={72} />
        <Text style={styles.title}>Før du fortsetter</Text>
        <Text style={styles.text}>
          Familieknappen er hjelp fra familien din – ikke en garanti. For å bruke appen må du
          godta vilkårene og personvernerklæringen.
        </Text>

        <Pressable style={styles.link} onPress={() => router.push('/terms')}>
          <Text style={styles.linkText}>Les brukervilkårene</Text>
        </Pressable>
        <Pressable style={styles.link} onPress={() => router.push('/privacy-policy')}>
          <Text style={styles.linkText}>Les personvernerklæringen</Text>
        </Pressable>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {busy ? (
          <View style={styles.busy}>
            <ActivityIndicator color={colors.brand} />
            <Text style={styles.muted}>Lagrer …</Text>
          </View>
        ) : (
          <BigButton label="Jeg godtar" variant="primary" onPress={() => void accept()} />
        )}

        <Pressable style={styles.logout} onPress={() => void logout()}>
          <Text style={styles.logoutText}>Logg ut</Text>
        </Pressable>

        <Text style={styles.versions}>
          Vilkår {LEGAL_VERSIONS.terms} · Personvern {LEGAL_VERSIONS.privacy}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgScreen },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing(6) },
  title: { fontSize: fontSize.title, fontWeight: '800', color: colors.ink, marginTop: spacing(4) },
  text: {
    fontSize: fontSize.body,
    color: colors.inkSoft,
    textAlign: 'center',
    lineHeight: 30,
    marginTop: spacing(3),
    marginBottom: spacing(5),
  },
  link: { paddingVertical: spacing(2.5) },
  linkText: { fontSize: fontSize.lg, color: colors.brandDark, fontWeight: '700', textDecorationLine: 'underline' },
  error: { fontSize: fontSize.md, color: colors.attention, marginTop: spacing(3) },
  busy: { flexDirection: 'row', alignItems: 'center', gap: spacing(3), paddingVertical: spacing(5), marginTop: spacing(4) },
  muted: { fontSize: fontSize.body, color: colors.inkSoft },
  logout: { paddingVertical: spacing(3) },
  logoutText: { fontSize: fontSize.md, color: colors.inkFaint, textDecorationLine: 'underline' },
  versions: { fontSize: fontSize.sm, color: colors.inkFaint, marginTop: spacing(4) },
});
