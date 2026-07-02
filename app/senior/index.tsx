import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BigButton } from '@/components/BigButton';
import { Screen } from '@/components/Screen';
import {
  selectOpenRequests,
  selectRelativeMembers,
  selectSenior,
  selectUnseenAnswer,
  useAppStore,
} from '@/store/useAppStore';
import { colors, fontSize, radius, spacing } from '@/theme/theme';
import { telUrl } from '@/utils/phone';

/**
 * Seniorens hjemskjerm. Maks tre hovedvalg + et kontekstuelt «nytt svar»-kort
 * når familien har svart. Stor tekst, høy kontrast, rolig tone.
 *
 * «Ring familien» vises bare hvis minst én pårørende har telefonnummer
 * (F-008): knappen skal virke eller være borte – aldri «kommer ennå».
 */
export default function SeniorHome() {
  const router = useRouter();
  const senior = useAppStore(selectSenior);
  const unseen = useAppStore(selectUnseenAnswer);
  const openRequests = useAppStore(useShallow(selectOpenRequests));
  const relatives = useAppStore(useShallow(selectRelativeMembers));
  const users = useAppStore((s) => s.users);
  const touchActivity = useAppStore((s) => s.touchActivity);

  const canCall = relatives.some((m) => telUrl(users.find((u) => u.id === m.userId)?.phone));

  const latestOpen = openRequests[0];
  const isEscalated = latestOpen?.status === 'ESCALATED';
  const statusText = !latestOpen
    ? 'Familien din ser at alt er bra.'
    : isEscalated
      ? 'Vi prøver å få tak i familien.'
      : 'Familien har fått spørsmålet ditt.';

  useFocusEffect(
    useCallback(() => {
      touchActivity();
    }, [touchActivity]),
  );

  return (
    <Screen>
      <Text style={styles.greet}>Hei, {senior?.name ?? 'der'} 👋</Text>
      <Text style={styles.sub}>Hva vil du gjøre i dag?</Text>

      {unseen ? (
        <BigButton
          icon="💬"
          label="Se svar fra familien"
          hint={`${useAppStore.getState().users.find((u) => u.id === unseen.recipientId)?.name ?? 'Familien'} har svart deg`}
          variant="attention"
          onPress={() => router.push({ pathname: '/senior/answer', params: { id: unseen.id } })}
        />
      ) : null}

      {/* Maks tre hovedvalg. «Spør familien» er den tydelige hovedhandlingen. */}
      <BigButton
        icon="📷"
        label="Spør familien"
        hint="Ta bilde og få hjelp før du svarer"
        variant="primary"
        size="hero"
        onPress={() => router.push('/senior/ask')}
      />

      {canCall ? (
        <BigButton icon="📞" label="Ring familien" variant="call" onPress={() => router.push('/senior/call')} />
      ) : null}

      <BigButton icon="📅" label="Min dag" variant="day" onPress={() => router.push('/senior/day')} />

      <View style={styles.statusChip}>
        <View style={[styles.dot, latestOpen ? styles.dotActive : null]} />
        <Text style={styles.statusText}>{statusText}</Text>
      </View>

      <Text style={styles.footnote}>
        Er du usikker på noe? Trykk «Spør familien».{'\n'}Vent på svar før du gjør noe.
      </Text>

      <Pressable style={styles.privacyLink} onPress={() => router.push('/senior/family')}>
        <Text style={styles.privacyLinkText}>Min familie</Text>
      </Pressable>

      <Pressable style={styles.privacyLink} onPress={() => router.push('/senior/history')}>
        <Text style={styles.privacyLinkText}>Tidligere svar</Text>
      </Pressable>

      <Pressable style={styles.privacyLink} onPress={() => router.push('/senior/privacy')}>
        <Text style={styles.privacyLinkText}>Personvern og samtykke</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  greet: { fontSize: fontSize.title, fontWeight: '800', color: colors.ink },
  sub: { fontSize: fontSize.body, color: colors.inkSoft, marginTop: spacing(1), marginBottom: spacing(6) },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(3),
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.m,
    padding: spacing(4),
    marginTop: spacing(2),
  },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.calmGreen },
  dotActive: { backgroundColor: colors.brand },
  statusText: { fontSize: fontSize.lg, color: colors.inkSoft },
  footnote: {
    marginTop: spacing(4),
    fontSize: fontSize.md,
    color: colors.inkFaint,
    textAlign: 'center',
    lineHeight: 24,
  },
  privacyLink: { alignItems: 'center', paddingVertical: spacing(4), marginTop: spacing(2) },
  privacyLinkText: { fontSize: fontSize.md, color: colors.brandDark, textDecorationLine: 'underline' },
});
