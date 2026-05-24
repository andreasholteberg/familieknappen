import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { selectCurrentUser, useAppStore } from '@/store/useAppStore';
import { colors, fontSize, radius, shadow, spacing } from '@/theme/theme';

/**
 * Seniorens personvern- og samtykkeskjerm. Rolig, stor tekst, enkelt språk.
 * Lar senioren selv bestemme om familien får se aktivitetsstatusen sin
 * (bruker samme setActivitySharing som pårørende-innstillingen).
 */
const POINTS = [
  'Familieknappen gir deg hjelp fra familien. Det er en støtte, ikke en garanti.',
  'Bildene og meldingene du sender, ser familien din.',
  'Appen vet ikke hvor du er. Vi bruker ikke GPS eller stedssporing.',
  'Familien får et varsel når du spør om hjelp, og når de svarer deg.',
  'Familien ser at du har vært aktiv bare hvis du sier ja nedenfor.',
  'Du kan be om at kontoen og dataene dine slettes når som helst.',
];

export default function SeniorPrivacy() {
  const currentUser = useAppStore(selectCurrentUser);
  const setActivitySharing = useAppStore((s) => s.setActivitySharing);
  const sharing = currentUser?.activitySharingEnabled ?? true;

  return (
    <Screen>
      <Text style={styles.intro}>Slik fungerer Familieknappen</Text>

      {POINTS.map((p, i) => (
        <View key={i} style={styles.pointRow}>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.point}>{p}</Text>
        </View>
      ))}

      <View style={[styles.card, shadow.card]}>
        <Text style={styles.toggleLabel}>Skal familien få se at du har vært aktiv?</Text>
        <View style={styles.choices}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ja, del aktivitetsstatus"
            accessibilityState={{ selected: sharing }}
            style={[styles.choice, sharing && styles.choiceYes]}
            onPress={() => setActivitySharing(true)}
          >
            <Text style={[styles.choiceText, sharing && styles.choiceTextOn]}>Ja</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Nei, ikke del aktivitetsstatus"
            accessibilityState={{ selected: !sharing }}
            style={[styles.choice, !sharing && styles.choiceNo]}
            onPress={() => setActivitySharing(false)}
          >
            <Text style={[styles.choiceText, !sharing && styles.choiceTextOn]}>Nei</Text>
          </Pressable>
        </View>
        <Text style={styles.toggleHint}>
          {sharing
            ? 'Familien ser at du har vært aktiv i dag.'
            : 'Familien ser ikke aktiviteten din.'}
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { fontSize: fontSize.title, fontWeight: '800', color: colors.ink, marginBottom: spacing(5) },
  pointRow: { flexDirection: 'row', gap: spacing(2.5), marginBottom: spacing(4) },
  dot: { fontSize: fontSize.body, color: colors.brand, lineHeight: 30 },
  point: { flex: 1, fontSize: fontSize.body, color: colors.ink, lineHeight: 30 },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.l,
    padding: spacing(5),
    marginTop: spacing(4),
  },
  toggleLabel: { fontSize: fontSize.lg, fontWeight: '700', color: colors.ink, marginBottom: spacing(4), lineHeight: 30 },
  choices: { flexDirection: 'row', gap: spacing(3) },
  choice: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing(4.5),
    borderRadius: radius.m,
    borderWidth: 2,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  choiceYes: { borderColor: colors.calmGreen, backgroundColor: colors.calmGreen },
  choiceNo: { borderColor: colors.inkSoft, backgroundColor: colors.inkSoft },
  choiceText: { fontSize: fontSize.title, fontWeight: '800', color: colors.inkSoft },
  choiceTextOn: { color: colors.white },
  toggleHint: { fontSize: fontSize.md, color: colors.inkSoft, marginTop: spacing(4), textAlign: 'center', lineHeight: 26 },
});
