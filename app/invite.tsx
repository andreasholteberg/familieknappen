import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BigButton } from '@/components/BigButton';
import { useAppStore } from '@/store/useAppStore';
import { colors, fontSize, spacing } from '@/theme/theme';

type Phase = 'idle' | 'accepting' | 'done' | 'error';

/**
 * Minimal aksept-flyt for en invitasjon (ingen full onboarding / nytt design).
 *  - Ikke innlogget: lagre token, send til innlogging. Auth-gaten kommer hit
 *    igjen etter at brukeren har logget inn.
 *  - Innlogget: kall acceptInvite, vis bekreftelse, og rut til riktig startskjerm.
 */
export default function Invite() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string }>();
  const status = useAppStore((s) => s.status);
  const pending = useAppStore((s) => s.pendingInviteToken);
  const setPendingInviteToken = useAppStore((s) => s.setPendingInviteToken);
  const acceptInvite = useAppStore((s) => s.acceptInvite);

  const token = params.token ?? pending ?? null;
  const [phase, setPhase] = useState<Phase>('idle');
  const [message, setMessage] = useState('');
  const [acceptedRole, setAcceptedRole] = useState<string | null>(null);
  const started = useRef(false);

  // Lagre token før innlogging, slik at gaten kan komme tilbake hit etterpå.
  useEffect(() => {
    if (status === 'signedOut' && token) setPendingInviteToken(token);
  }, [status, token, setPendingInviteToken]);

  // Godta når vi er innlogget (kun én gang).
  useEffect(() => {
    if (status !== 'ready' || !token || started.current) return;
    started.current = true;
    setPhase('accepting');
    acceptInvite(token)
      .then((res) => {
        setAcceptedRole(res.role);
        setPhase('done');
      })
      .catch((e) => {
        setMessage((e as Error)?.message ?? 'Kunne ikke godta invitasjonen.');
        setPhase('error');
      });
  }, [status, token, acceptInvite]);

  if (!token) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.title}>Mangler invitasjon</Text>
        <Text style={styles.muted}>Lenken ser ut til å være ufullstendig.</Text>
        <BigButton label="Til forsiden" variant="day" compact onPress={() => router.replace('/')} />
      </SafeAreaView>
    );
  }

  if (status === 'idle' || status === 'loading') {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={colors.brand} />
        <Text style={styles.muted}>Et øyeblikk …</Text>
      </SafeAreaView>
    );
  }

  if (status === 'signedOut') {
    return <Redirect href="/sign-in" />;
  }

  if (status === 'error') {
    return <Redirect href="/" />;
  }

  // status === 'ready'
  if (phase === 'error') {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.emoji}>📨</Text>
        <Text style={styles.title}>Invitasjonen kunne ikke godtas</Text>
        <Text style={styles.muted}>{message}</Text>
        <BigButton label="Til forsiden" variant="day" compact onPress={() => router.replace('/')} />
      </SafeAreaView>
    );
  }

  if (phase === 'done') {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.emoji}>✓</Text>
        <Text style={styles.title}>Du er med i familien</Text>
        <Text style={styles.muted}>Invitasjonen er godtatt. Da er du klar.</Text>
        <BigButton
          label="Fortsett"
          variant="primary"
          compact
          onPress={() =>
            router.replace(
              acceptedRole === 'senior'
                ? '/senior/welcome'
                : acceptedRole
                  ? '/relative/welcome'
                  : '/',
            )
          }
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.center}>
      <ActivityIndicator size="large" color={colors.brand} />
      <Text style={styles.muted}>Blir med i familien …</Text>
      <View />
    </SafeAreaView>
  );
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
  emoji: { fontSize: 48 },
  title: { fontSize: fontSize.title, fontWeight: '800', color: colors.brandDark, textAlign: 'center' },
  muted: { fontSize: fontSize.body, color: colors.inkSoft, textAlign: 'center', lineHeight: 28 },
});
