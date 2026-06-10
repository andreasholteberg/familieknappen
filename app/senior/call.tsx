import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import { Avatar } from '@/components/Avatar';
import { BigButton } from '@/components/BigButton';
import { Screen } from '@/components/Screen';
import { selectRelativeMembers, useAppStore } from '@/store/useAppStore';
import { colors, fontSize, radius, spacing } from '@/theme/theme';
import { callPhone, telUrl } from '@/utils/phone';

/**
 * «Ring familien» for senior (F-008/F-009).
 *
 * Ringer primærkontakten med vanlig telefon (tel:). Hvis hen ikke svarer,
 * kan senior trykke «Prøv neste» for å ringe neste i familien som har
 * telefonnummer. Skjermen vises bare hvis minst én pårørende kan ringes
 * (hjem-skjermen skjuler knappen ellers).
 */
export default function CallFamily() {
  const router = useRouter();
  const members = useAppStore(useShallow(selectRelativeMembers));
  const users = useAppStore((s) => s.users);

  // Pårørende som faktisk kan ringes – primærkontakt først.
  const callable = useMemo(() => {
    const withPhone = members
      .map((m) => ({ member: m, user: users.find((u) => u.id === m.userId) }))
      .filter((x) => x.user && telUrl(x.user.phone));
    return withPhone.sort((a, b) => Number(b.member.isPrimaryContact) - Number(a.member.isPrimaryContact));
  }, [members, users]);

  const [index, setIndex] = useState(0);
  const [hasCalled, setHasCalled] = useState(false);

  const current = callable[index];
  const next = callable[index + 1];

  if (!current?.user) {
    return (
      <Screen>
        <Text style={styles.empty}>Ingen i familien kan ringes herfra ennå.</Text>
        <BigButton label="Tilbake" variant="day" compact onPress={() => router.back()} />
      </Screen>
    );
  }

  const callCurrent = async () => {
    const ok = await callPhone(current.user?.phone);
    if (ok) setHasCalled(true);
  };

  const tryNext = async () => {
    if (!next?.user) return;
    setIndex(index + 1);
    setHasCalled(false);
    await callPhone(next.user.phone);
    setHasCalled(true);
  };

  return (
    <Screen>
      <Text style={styles.title}>Ring familien</Text>

      <View style={styles.contactCard}>
        <Avatar name={current.user.name} size={72} />
        <Text style={styles.contactName}>{current.user.name}</Text>
        <Text style={styles.contactRel}>{current.member.relationship}</Text>
      </View>

      <BigButton
        icon="📞"
        label={`Ring ${current.user.name}`}
        variant="call"
        onPress={() => void callCurrent()}
      />

      {hasCalled && next?.user ? (
        <View style={styles.nextBox}>
          <Text style={styles.nextText}>Fikk du ikke svar?</Text>
          <BigButton
            icon="📞"
            label={`Prøv neste: ${next.user.name}`}
            variant="primary"
            onPress={() => void tryNext()}
          />
        </View>
      ) : null}

      {hasCalled && !next ? (
        <Text style={styles.calmNote}>
          Fikk du ikke svar? Du kan prøve igjen om litt.
        </Text>
      ) : null}

      <BigButton label="Tilbake til hjem" variant="day" compact onPress={() => router.replace('/senior')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: fontSize.title, fontWeight: '800', color: colors.ink, marginBottom: spacing(5) },
  contactCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.l,
    padding: spacing(6),
    marginBottom: spacing(5),
  },
  contactName: { fontSize: fontSize.title, fontWeight: '800', color: colors.ink, marginTop: spacing(3) },
  contactRel: { fontSize: fontSize.body, color: colors.inkSoft, marginTop: spacing(1) },
  nextBox: { marginTop: spacing(2) },
  nextText: {
    fontSize: fontSize.body,
    fontWeight: '700',
    color: colors.ink,
    textAlign: 'center',
    marginBottom: spacing(3),
  },
  calmNote: {
    fontSize: fontSize.body,
    color: colors.inkSoft,
    textAlign: 'center',
    lineHeight: 30,
    marginVertical: spacing(4),
  },
  empty: { fontSize: fontSize.body, color: colors.inkFaint, textAlign: 'center', marginVertical: spacing(10) },
});
