import { Redirect } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BigButton } from '@/components/BigButton';
import { Logo } from '@/components/Logo';
import * as svc from '@/services';
import { useAppStore } from '@/store/useAppStore';
import { colors, fontSize, radius, spacing } from '@/theme/theme';
import { humanizeAuthError } from '@/utils/authErrors';

const appEnv = process.env.EXPO_PUBLIC_APP_ENV?.toLowerCase();
const testLoginEmails = (process.env.EXPO_PUBLIC_TEST_LOGIN_EMAILS ?? '')
  .split(',')
  .map((item) => item.trim().toLowerCase())
  .filter(Boolean);
const testLoginEnabled =
  process.env.EXPO_PUBLIC_ENABLE_TEST_LOGIN === 'true' &&
  (__DEV__ || appEnv === 'preview' || appEnv === 'development');
const previewBuildLabel = process.env.EXPO_PUBLIC_PREVIEW_BUILD_LABEL ?? 'Preview build';

/**
 * Innlogging med 6-sifret kode på e-post (passordløst). Pårørende skriver
 * inn e-posten, mottar en kode, og taster den inn i appen. Mer pålitelig enn
 * å klikke på en lenke i mobilen (ingen link-forhåndshenting / PKCE-feil).
 */
export default function SignIn() {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [testEmail, setTestEmail] = useState('');
  const [testPassword, setTestPassword] = useState('');
  const [testSigningIn, setTestSigningIn] = useState(false);
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const authStatus = useAppStore((s) => s.status);

  if (authStatus === 'ready') {
    return <Redirect href="/" />;
  }

  const send = async () => {
    if (sending) return;
    const value = email.trim().toLowerCase();
    if (!value.includes('@')) {
      setError('Skriv inn en gyldig e-postadresse.');
      return;
    }
    setSending(true);
    setError(null);
    setCode('');
    try {
      await svc.auth.sendEmailCode(value);
      setSentTo(value);
    } catch (e) {
      setError(humanizeAuthError(e, 'Noe gikk galt med innloggingen. Prøv igjen.'));
    } finally {
      setSending(false);
    }
  };

  const testSignIn = async () => {
    if (!testLoginEnabled || testSigningIn) return;

    const value = testEmail.trim().toLowerCase();
    if (!value.includes('@')) {
      setError('Skriv inn e-postadressen til en testbruker.');
      return;
    }
    if (testLoginEmails.length === 0) {
      setError('Testinnlogging er aktivert, men ingen testbrukere er konfigurert.');
      return;
    }
    if (!testLoginEmails.includes(value)) {
      setError('Denne e-postadressen er ikke konfigurert som testbruker.');
      return;
    }
    if (!testPassword) {
      setError('Skriv inn testpassordet.');
      return;
    }

    setTestSigningIn(true);
    setError(null);
    try {
      const session = await svc.auth.signInWithPassword(value, testPassword);
      if (!session) throw new Error('Testinnloggingen ble ikke fullført. Prøv igjen.');

      useAppStore.setState({
        session,
        currentUserId: session.user.id,
        status: 'loading',
        errorMessage: null,
      });
      await useAppStore.getState().refresh();
    } catch (e) {
      setError(humanizeAuthError(e, 'Kunne ikke logge inn med testbruker.'));
    } finally {
      setTestSigningIn(false);
    }
  };


  const verify = async () => {
    if (verifying) return;
    const trimmed = code.replace(/\D/g, '');
    if (trimmed.length !== 6) {
      setError('Koden er 6 siffer. Sjekk e-posten igjen.');
      return;
    }
    if (!sentTo) {
      setError('Be om en ny kode først.');
      return;
    }
    setVerifying(true);
    setError(null);
    try {
      const session = await svc.auth.verifyEmailCode(sentTo, trimmed);
      if (!session) throw new Error('Innloggingen ble ikke fullført. Prøv igjen.');
      useAppStore.setState({
        session,
        currentUserId: session.user.id,
        status: 'loading',
        errorMessage: null,
      });
      await useAppStore.getState().refresh();
    } catch (e) {
      setError(humanizeAuthError(e, 'Koden er feil eller utløpt. Be om en ny kode og prøv igjen.'));
    } finally {
      setVerifying(false);
    }
  };

  const resend = async () => {
    if (sending || !sentTo) return;
    setSending(true);
    setError(null);
    setCode('');
    try {
      await svc.auth.sendEmailCode(sentTo);
    } catch (e) {
      setError(humanizeAuthError(e, 'Noe gikk galt med innloggingen. Prøv igjen.'));
    } finally {
      setSending(false);
    }
  };

  if (sentTo) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.check}>📧</Text>
          <Text style={styles.title}>Skriv inn koden</Text>
          <Text style={styles.subtitle}>
            Vi har sendt en 6-sifret kode til e-posten din. Skriv koden inn her.
          </Text>

          <Text style={styles.label}>Kode</Text>
          <TextInput
            style={[styles.input, styles.codeInput]}
            value={code}
            onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
            placeholder="123456"
            placeholderTextColor={colors.inkFaint}
            keyboardType="number-pad"
            inputMode="numeric"
            maxLength={6}
            autoFocus
            autoComplete="one-time-code"
            onSubmitEditing={verify}
            accessibilityLabel="6-sifret kode"
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {verifying ? (
            <View style={styles.sending}>
              <ActivityIndicator color={colors.brand} />
              <Text style={styles.muted}>Logger inn …</Text>
            </View>
          ) : (
            <BigButton label="Logg inn" variant="primary" onPress={verify} />
          )}

          {sending ? (
            <View style={styles.sending}>
              <ActivityIndicator color={colors.brand} />
              <Text style={styles.muted}>Sender ny kode …</Text>
            </View>
          ) : (
            <BigButton label="Send ny kode" variant="day" compact onPress={resend} />
          )}

          <BigButton
            label="Endre e-post"
            variant="day"
            compact
            onPress={() => { setSentTo(null); setCode(''); setError(null); }}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoBlock}>
          <Logo size={88} />
        </View>
        <Text style={styles.title}>Familieknappen</Text>
        <Text style={styles.subtitle}>
          Logg inn med e-posten din. Du får en 6-sifret kode på e-post – ingen passord å huske.
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
            <Text style={styles.muted}>Sender kode …</Text>
          </View>
        ) : (
          <BigButton label="Send kode" variant="primary" onPress={send} />
        )}

        {testLoginEnabled ? (
          <View style={styles.testPanel}>
            <Text style={styles.testTitle}>Testinnlogging – kun preview</Text>
            <Text style={styles.buildLabel}>{previewBuildLabel}</Text>
            <Text style={styles.testHelp}>
              Bruk bare definerte testbrukere. E-postkode er hovedinnloggingen i pilot.
            </Text>

            <Text style={styles.testLabel}>Test e-post</Text>
            <TextInput
              style={styles.testInput}
              value={testEmail}
              onChangeText={setTestEmail}
              placeholder="test@example.no"
              placeholderTextColor={colors.inkFaint}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              inputMode="email"
              accessibilityLabel="Test e-postadresse"
            />

            <Text style={styles.testLabel}>Testpassord</Text>
            <TextInput
              style={styles.testInput}
              value={testPassword}
              onChangeText={setTestPassword}
              placeholder="Testpassord"
              placeholderTextColor={colors.inkFaint}
              secureTextEntry
              accessibilityLabel="Testpassord"
            />

            {testSigningIn ? (
              <View style={styles.sending}>
                <ActivityIndicator color={colors.brand} />
                <Text style={styles.muted}>Logger inn testbruker ...</Text>
              </View>
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Logg inn med testbruker"
                onPress={testSignIn}
                style={({ pressed }) => [styles.testButton, pressed && styles.pressed]}
              >
                <Text style={styles.testButtonText}>Logg inn med testbruker</Text>
              </Pressable>
            )}
          </View>
        ) : null}

        <Text style={styles.note}>
          Familieknappen er assistanse, ikke en garanti. Er du usikker på noe – spør noen du stoler på.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgScreen },
  scroll: { flex: 1, backgroundColor: colors.bgScreen },
  logoBlock: { alignItems: 'center', marginBottom: spacing(4) },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing(6),
    paddingVertical: spacing(8),
  },
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
  codeInput: { fontSize: 28, letterSpacing: 10, textAlign: 'center', fontWeight: '800' },
  sending: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing(3), paddingVertical: spacing(4) },
  muted: { fontSize: fontSize.body, color: colors.inkSoft },
  testPanel: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: radius.s,
    borderWidth: 1,
    marginTop: spacing(2),
    padding: spacing(4),
  },
  testTitle: { color: colors.attention, fontSize: fontSize.md, fontWeight: '800' },
  buildLabel: { color: colors.inkFaint, fontSize: fontSize.sm, marginTop: spacing(0.5) },
  testHelp: { color: colors.inkSoft, fontSize: fontSize.sm, lineHeight: 20, marginTop: spacing(1.5), marginBottom: spacing(3) },
  testLabel: { color: colors.inkSoft, fontSize: fontSize.sm, fontWeight: '700', marginBottom: spacing(1) },
  testInput: {
    backgroundColor: colors.bgScreen,
    borderColor: colors.line,
    borderRadius: radius.s,
    borderWidth: 1,
    color: colors.ink,
    fontSize: fontSize.md,
    marginBottom: spacing(3),
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(3),
  },
  testButton: {
    alignItems: 'center',
    backgroundColor: colors.brandDark,
    borderRadius: radius.s,
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(3),
  },
  testButtonText: { color: colors.white, fontSize: fontSize.md, fontWeight: '700' },
  pressed: { opacity: 0.92, transform: [{ scale: 0.99 }] },
  note: {
    marginTop: spacing(6),
    fontSize: fontSize.sm,
    color: colors.inkFaint,
    textAlign: 'center',
    lineHeight: 20,
  },
});
