import { Redirect } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BigButton } from '@/components/BigButton';
import * as svc from '@/services';
import { useAppStore } from '@/store/useAppStore';
import { colors, fontSize, radius, spacing } from '@/theme/theme';

/**
 * Innlogging med magisk lenke (passordløst). Pårørende skriver inn e-posten,
 * får en lenke, og åpner den på enheten. Etter første gang holder den lagrede
 * økten brukeren innlogget «automatisk».
 */
export default function SignIn() {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const authStatus = useAppStore((s) => s.status);

  if (authStatus === 'ready') {
    return <Redirect href="/" />;
  }

  const send = async () => {
    const value = email.trim().toLowerCase();
    if (!value.includes('@')) {
      setError('Skriv inn en gyldig e-postadresse.');
      return;
    }
    setSending(true);
    setError(null);
    try {
      await svc.auth.sendMagicLink(value);
      setSentTo(value);
    } catch (e) {
      setError((e as Error)?.message ?? 'Kunne ikke sende lenken. Prøv igjen.');
    } finally {
      setSending(false);
    }
  };

  if (sentTo) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <Text style={styles.check}>📧</Text>
          <Text style={styles.title}>Sjekk e-posten din</Text>
          <Text style={styles.subtitle}>
            Vi har sendt en innloggingslenke til {sentTo}. Åpne e-posten på denne enheten og trykk
            på lenken for å logge inn.
          </Text>
          <BigButton label="Bruk en annen e-post" variant="day" compact onPress={() => setSentTo(null)} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Familieknappen</Text>
        <Text style={styles.subtitle}>
          Logg inn med e-posten din. Du får en lenke – ingen passord å huske.
        </Text>

        <Text style={styles.label}>E-post</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="navn@example.no"
          placeholderTextColor={colors.inkFaint}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          inputMode="email"
          accessibilityLabel="E-postadresse"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {sending ? (
          <View style={styles.sending}>
            <ActivityIndicator color={colors.brand} />
            <Text style={styles.muted}>Sender lenke …</Text>
          </View>
        ) : (
          <BigButton label="Send innloggingslenke" variant="primary" onPress={send} />
        )}

        <Text style={styles.note}>
          Familieknappen er assistanse, ikke en garanti. Er du usikker på noe – spør noen du stoler på.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgScreen },
  container: { flex: 1, paddingHorizontal: spacing(6), justifyContent: 'center' },
  check: { fontSize: 52, textAlign: 'center', marginBottom: spacing(2) },
  title: { fontSize: fontSize.title, fontWeight: '800', color: colors.brandDark, textAlign: 'center' },
  subtitle: {
    fontSize: fontSize.body,
    color: colors.inkSoft,
    textAlign: 'center',
    marginTop: spacing(2),
    marginBottom: spacing(7),
    lineHeight: 28,
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
  sending: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing(3), paddingVertical: spacing(4) },
  muted: { fontSize: fontSize.body, color: colors.inkSoft },
  note: {
    marginTop: spacing(6),
    fontSize: fontSize.sm,
    color: colors.inkFaint,
    textAlign: 'center',
    lineHeight: 20,
  },
});
