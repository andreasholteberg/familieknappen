import { Redirect, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BigButton } from '@/components/BigButton';
import { Logo } from '@/components/Logo';
import { selectCurrentUser, useAppStore } from '@/store/useAppStore';
import { colors, fontSize, radius, spacing } from '@/theme/theme';

/**
 * Onboarding for forstegangsbrukere uten familiegruppe. Oppretter en gruppe og
 * gjor brukeren til kontaktperson (primaerkontakt). Familien inviteres etterpa
 * fra innstillinger. Holdt bevisst minimal.
 */
export default function Onboarding() {
  const router = useRouter();
  const status = useAppStore((s) => s.status);
  const currentUser = useAppStore(selectCurrentUser);
  const createGroup = useAppStore((s) => s.createGroup);
  const pairWithCode = useAppStore((s) => s.pairWithCode);
  const signOut = useAppStore((s) => s.signOut);

  const [name, setName] = useState('Min familie');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [pairing, setPairing] = useState(false);
  const [pairError, setPairError] = useState<string | null>(null);

  const submitCode = async () => {
    if (pairing) return;
    const clean = code.replace(/\D/g, '');
    if (clean.length !== 6) {
      setPairError('Koden er 6 siffer.');
      return;
    }
    setPairing(true);
    setPairError(null);
    try {
      const role = await pairWithCode(clean);
      router.replace(role === 'senior' ? '/senior/welcome' : '/relative/welcome');
    } catch (e) {
      setPairError((e as Error)?.message ?? 'Koden virket ikke. Prøv igjen.');
    } finally {
      setPairing(false);
    }
  };

  // Ruting: ikke innlogget -> innlogging; allerede i en gruppe -> hjem.
  if (status === 'idle' || status === 'loading') {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={colors.brand} />
        <Text style={styles.muted}>Laster …</Text>
      </SafeAreaView>
    );
  }
  if (status === 'signedOut') return <Redirect href="/sign-in" />;
  if (status === 'ready' && currentUser) return <Redirect href="/" />;

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await createGroup(name);
      router.replace('/relative/welcome');
    } catch (e) {
      setError((e as Error)?.message ?? 'Kunne ikke opprette familiegruppen. Prøv igjen.');
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
        <View style={styles.logoBlock}>
          <Logo size={88} />
        </View>
        <Text style={styles.title}>Velkommen 👋</Text>

        <Text style={styles.label}>Har du fått en 6-sifret kode fra familien?</Text>
        <TextInput
          style={[styles.input, styles.codeInput]}
          value={code}
          onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
          placeholder="123456"
          placeholderTextColor={colors.inkFaint}
          keyboardType="number-pad"
          inputMode="numeric"
          maxLength={6}
          accessibilityLabel="6-sifret kode fra familien"
        />
        {pairError ? <Text style={styles.error}>{pairError}</Text> : null}
        {pairing ? (
          <View style={styles.busy}>
            <ActivityIndicator color={colors.brand} />
            <Text style={styles.muted}>Kobler til familien …</Text>
          </View>
        ) : (
          <BigButton label="Bli med i familien" variant="primary" compact onPress={() => void submitCode()} />
        )}

        <Text style={styles.divider}>— eller —</Text>

        <Text style={styles.subtitle}>
          Start en ny familiegruppe. Du blir kontaktperson, og kan invitere resten av familien
          etterpå fra innstillinger.
        </Text>

        <Text style={styles.label}>Navn på familiegruppen</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="F.eks. Familien Berg"
          placeholderTextColor={colors.inkFaint}
          accessibilityLabel="Navn på familiegruppen"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {busy ? (
          <View style={styles.busy}>
            <ActivityIndicator color={colors.brand} />
            <Text style={styles.muted}>Oppretter …</Text>
          </View>
        ) : (
          <BigButton label="Opprett familiegruppe" variant="primary" onPress={submit} />
        )}

        <Pressable style={styles.logout} onPress={logout}>
          <Text style={styles.logoutText}>Logg ut</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgScreen },
  logoBlock: { alignItems: 'center', marginBottom: spacing(4) },
  center: {
    flex: 1,
    backgroundColor: colors.bgScreen,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing(3),
  },
  container: { flex: 1, paddingHorizontal: spacing(6), justifyContent: 'center' },
  title: { fontSize: fontSize.title, fontWeight: '800', color: colors.brandDark, textAlign: 'center' },
  subtitle: {
    fontSize: fontSize.body,
    color: colors.inkSoft,
    textAlign: 'center',
    marginTop: spacing(2),
    marginBottom: spacing(4),
    lineHeight: 28,
  },
  codeInput: { textAlign: 'center', fontSize: fontSize.title, letterSpacing: 8, fontWeight: '800' },
  divider: {
    fontSize: fontSize.md,
    color: colors.inkFaint,
    textAlign: 'center',
    marginVertical: spacing(4),
  },
  label: { fontSize: fontSize.sm, fontWeight: '700', color: colors.inkSoft, marginBottom: spacing(1.5) },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.s,
    paddingVertical: spacing(4),
    paddingHorizontal: spacing(4),
    fontSize: fontSize.body,
    color: colors.ink,
    backgroundColor: colors.surface,
    marginBottom: spacing(4),
  },
  error: { color: colors.attention, fontSize: fontSize.md, marginBottom: spacing(3) },
  busy: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing(3), paddingVertical: spacing(4) },
  muted: { fontSize: fontSize.body, color: colors.inkSoft },
  logout: { alignItems: 'center', paddingVertical: spacing(5) },
  logoutText: { fontSize: fontSize.md, color: colors.brandDark, textDecorationLine: 'underline' },
});
