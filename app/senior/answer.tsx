import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { BigButton } from '@/components/BigButton';
import { Screen } from '@/components/Screen';
import { selectResponseForRequest, useAppStore } from '@/store/useAppStore';
import { colors, fontSize, radius, shadow, spacing } from '@/theme/theme';
import { RESPONSE_META } from '@/types/models';

const EMOJI = { do_not_reply: '✋', looks_ok: '👍', calling_you: '📞', custom: '💬' } as const;
const BORDER = {
  attention: colors.attention,
  ok: colors.calmGreen,
  neutral: colors.brand,
} as const;

/** Viser familiens svar stort og tydelig, med «Ring [navn]»-knapp. */
export default function SeniorAnswer() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const requests = useAppStore((s) => s.requests);
  const users = useAppStore((s) => s.users);
  const markAnswerSeen = useAppStore((s) => s.markAnswerSeen);

  const request =
    requests.find((r) => r.id === params.id) ??
    requests.find((r) => r.status === 'ANSWERED');

  const response = useAppStore(selectResponseForRequest(request?.id));

  const requestId = request?.id;
  useFocusEffect(
    useCallback(() => {
      if (requestId) markAnswerSeen(requestId);
    }, [requestId, markAnswerSeen]),
  );

  if (!request || !response) {
    return (
      <Screen>
        <Text style={styles.empty}>Ingen svar ennå.</Text>
        <BigButton label="Tilbake til hjem" variant="day" compact onPress={() => router.replace('/senior')} />
      </Screen>
    );
  }

  const by = users.find((u) => u.id === response.relativeId);
  const meta = RESPONSE_META[response.responseType];
  const bigText = response.responseType === 'custom' ? response.responseText ?? '' : meta.big;

  const note =
    response.responseType === 'do_not_reply'
      ? 'Du trenger ikke svare på meldingen. La den ligge.'
      : response.responseType === 'looks_ok'
        ? `${by?.name ?? 'Familien'} synes dette ser greit ut.`
        : response.responseType === 'calling_you'
          ? 'Vent litt – telefonen ringer snart.'
          : '';

  const callBack = () =>
    Alert.alert(`Ringer ${by?.name ?? 'familien'} …`, 'Ringefunksjonen er ikke koblet på ennå.', [{ text: 'Avslutt' }]);

  return (
    <Screen>
      <View style={[styles.card, shadow.raised, { borderTopColor: BORDER[meta.tone] }]}>
        <Text style={styles.emoji}>{EMOJI[response.responseType]}</Text>
        <Text style={styles.from}>{by?.name ?? 'Familien'} sier:</Text>
        <Text style={styles.big}>{bigText}</Text>
        {note ? <Text style={styles.note}>{note}</Text> : null}
      </View>

      <BigButton icon="📞" label={`Ring ${by?.name ?? 'familien'}`} variant="call" onPress={callBack} />
      <BigButton label="Ferdig" variant="day" compact onPress={() => router.replace('/senior')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.l,
    borderTopWidth: 8,
    padding: spacing(6),
    alignItems: 'center',
    marginBottom: spacing(5),
  },
  emoji: { fontSize: 52, marginBottom: spacing(2) },
  from: { fontSize: fontSize.body, color: colors.inkSoft, marginBottom: spacing(3) },
  big: { fontSize: fontSize.title, fontWeight: '800', color: colors.ink, textAlign: 'center', lineHeight: 36 },
  note: { fontSize: fontSize.body, color: colors.inkSoft, textAlign: 'center', marginTop: spacing(3), lineHeight: 28 },
  empty: { fontSize: fontSize.body, color: colors.inkFaint, textAlign: 'center', marginVertical: spacing(10) },
});
