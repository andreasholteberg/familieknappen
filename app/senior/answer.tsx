import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BigButton } from '@/components/BigButton';
import { Screen } from '@/components/Screen';
import { selectResponseForRequest, useAppStore } from '@/store/useAppStore';
import { colors, fontSize, radius, shadow, spacing } from '@/theme/theme';
import { RESPONSE_META } from '@/types/models';
import { callPhone, telUrl } from '@/utils/phone';

const EMOJI = { do_not_reply: '✋', looks_ok: '👍', calling_you: '📞', custom: '💬' } as const;
const BORDER = {
  attention: colors.attention,
  ok: colors.calmGreen,
  neutral: colors.brand,
} as const;

/**
 * Viser familiens svar stort og tydelig.
 *
 * Svaret forsvinner IKKE av seg selv (F-010): senior må trykke
 * «Jeg har sett svaret» for at kortet på hjem-skjermen skal bli borte.
 * Å bare åpne og lukke skjermen endrer ingenting.
 */
export default function SeniorAnswer() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const requests = useAppStore((s) => s.requests);
  const users = useAppStore((s) => s.users);
  const markAnswerSeen = useAppStore((s) => s.markAnswerSeen);
  const undoAnswerSeen = useAppStore((s) => s.undoAnswerSeen);
  const [acked, setAcked] = useState(false);

  const request =
    requests.find((r) => r.id === params.id) ??
    requests.find((r) => r.status === 'ANSWERED');

  const response = useAppStore(selectResponseForRequest(request?.id));

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
  const canCallBy = !!telUrl(by?.phone);

  const note =
    response.responseType === 'do_not_reply'
      ? 'Du trenger ikke svare på meldingen. La den ligge.'
      : response.responseType === 'looks_ok'
        ? `${by?.name ?? 'Familien'} synes dette ser greit ut.`
        : response.responseType === 'calling_you'
          ? 'Vent litt – telefonen ringer snart.'
          : '';

  const acknowledge = () => {
    markAnswerSeen(request.id);
    setAcked(true);
  };

  const undo = () => {
    undoAnswerSeen(request.id);
    setAcked(false);
  };

  return (
    <Screen>
      <View style={[styles.card, shadow.raised, { borderTopColor: BORDER[meta.tone] }]}>
        <Text style={styles.emoji}>{EMOJI[response.responseType]}</Text>
        <Text style={styles.from}>{by?.name ?? 'Familien'} sier:</Text>
        <Text style={styles.big}>{bigText}</Text>
        {note ? <Text style={styles.note}>{note}</Text> : null}
      </View>

      {canCallBy ? (
        <BigButton
          icon="📞"
          label={`Ring ${by?.name ?? 'familien'}`}
          variant="call"
          onPress={() => void callPhone(by?.phone)}
        />
      ) : null}

      {acked ? (
        <View style={styles.ackBox}>
          <Text style={styles.ackText}>Sett ✓ Du finner svaret igjen under «Tidligere svar».</Text>
          <BigButton label="Til hjem" variant="primary" compact onPress={() => router.replace('/senior')} />
          <BigButton label="Angre" variant="day" compact onPress={undo} />
        </View>
      ) : (
        <>
          <BigButton label="Jeg har sett svaret" variant="primary" onPress={acknowledge} />
          <BigButton label="Tilbake" variant="day" compact onPress={() => router.back()} />
        </>
      )}
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
  ackBox: { marginTop: spacing(1) },
  ackText: {
    fontSize: fontSize.body,
    fontWeight: '700',
    color: colors.calmGreen,
    textAlign: 'center',
    marginBottom: spacing(4),
    lineHeight: 28,
  },
});
