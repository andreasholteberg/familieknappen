import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { useRouter } from 'expo-router';

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
  const router = useRouter();
  const currentUser = useAppStore(selectCurrentUser);
  const setActivitySharing = useAppStore((s) => s.setActivitySharing);
  const requestDeletion = useAppStore((s) => s.requestAccountDeletion);
  const cancelDeletion = useAppStore((s) => s.cancelAccountDeletion);
  const sharing = currentUser?.activitySharingEnabled ?? true;
  const [busy, setBusy] = useState(false);

  const confirmDeletion = () => {
    Alert.alert(
      'Slette kontoen din?',
      'Alt du har sendt blir borte om 30 dager. Du kan angre frem til da. Snakk gjerne med familien først.',
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Ja, slett',
          style: 'destructive',
          onPress: () => {
            setBusy(true);
            requestDeletion().catch(() => undefined).finally(() => setBusy(false));
          },
        },
      ],
    );
  };

  const undoDeletion = () => {
    setBusy(true);
    cancelDeletion().catch(() => undefined).finally(() => setBusy(false));
  };

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

      <Pressable
        accessibilityRole="button"
        style={styles.fullDocLink}
        onPress={() => router.push('/privacy-policy')}
      >
        <Text style={styles.fullDocLinkText}>Les hele personvernerklæringen</Text>
      </Pressable>

      {currentUser?.deletionRequestedAt ? (
        <View style={[styles.card, shadow.card]}>
          <Text style={styles.deletionTitle}>Kontoen din blir slettet om 30 dager.</Text>
          <Pressable
            accessibilityRole="button"
            style={styles.undoBtn}
            disabled={busy}
            onPress={undoDeletion}
          >
            <Text style={styles.undoBtnText}>{busy ? 'Et øyeblikk …' : 'Angre sletting'}</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          style={styles.deleteLink}
          disabled={busy}
          onPress={confirmDeletion}
        >
          <Text style={styles.deleteLinkText}>Slett kontoen og dataene mine</Text>
        </Pressable>
      )}
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
  fullDocLink: { alignItems: 'center', paddingVertical: spacing(4) },
  fullDocLinkText: { fontSize: fontSize.md, color: colors.brandDark, textDecorationLine: 'underline' },
  deletionTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.ink, textAlign: 'center', lineHeight: 30 },
  undoBtn: {
    backgroundColor: colors.brand,
    borderRadius: radius.m,
    paddingVertical: spacing(4),
    alignItems: 'center',
    marginTop: spacing(4),
  },
  undoBtnText: { color: colors.white, fontSize: fontSize.lg, fontWeight: '800' },
  deleteLink: { alignItems: 'center', paddingVertical: spacing(5), marginTop: spacing(2) },
  deleteLinkText: { fontSize: fontSize.md, color: colors.inkFaint, textDecorationLine: 'underline' },
});
