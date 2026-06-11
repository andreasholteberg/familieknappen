import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { BigButton } from '@/components/BigButton';
import { Screen } from '@/components/Screen';
import { useAppStore } from '@/store/useAppStore';
import { colors, fontSize, radius, spacing } from '@/theme/theme';
import { RESPONSE_META } from '@/types/models';
import { clock, timeAgo } from '@/utils/format';

/**
 * «Tidligere svar» for senior (F-023): de siste 10 besvarte spørsmålene,
 * store kort, trykk for å se hele svaret igjen.
 */
export default function SeniorHistory() {
  const router = useRouter();
  const requests = useAppStore((s) => s.requests);
  const responses = useAppStore((s) => s.responses);
  const users = useAppStore((s) => s.users);

  const answered = requests
    .filter((r) => r.status === 'ANSWERED' || r.status === 'CLOSED')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 10);

  const responseFor = (rid: string) =>
    responses
      .filter((r) => r.requestId === rid)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];

  return (
    <Screen>
      {answered.length === 0 ? (
        <Text style={styles.empty}>
          Her finner du svar du har fått tidligere.{'\n'}Ingen ennå.
        </Text>
      ) : null}

      {answered.map((r) => {
        const resp = responseFor(r.id);
        if (!resp) return null;
        const by = users.find((u) => u.id === resp.relativeId);
        const label =
          resp.responseType === 'custom'
            ? resp.responseText
            : RESPONSE_META[resp.responseType].short;
        return (
          <Pressable
            key={r.id}
            style={styles.item}
            accessibilityRole="button"
            accessibilityLabel={`Se svar fra ${by?.name ?? 'familien'}`}
            onPress={() => router.push({ pathname: '/senior/answer', params: { id: r.id } })}
          >
            <Text style={styles.when}>
              {timeAgo(r.createdAt)} · {clock(r.createdAt)}
            </Text>
            {r.message ? <Text style={styles.question}>«{r.message}»</Text> : null}
            <Text style={styles.answer}>
              {by?.name ?? 'Familien'} svarte: <Text style={styles.answerBold}>{label}</Text>
            </Text>
          </Pressable>
        );
      })}

      <BigButton label="Tilbake til hjem" variant="day" compact onPress={() => router.replace('/senior')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  empty: { fontSize: fontSize.body, color: colors.inkFaint, textAlign: 'center', marginVertical: spacing(8), lineHeight: 30 },
  item: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.m,
    padding: spacing(4.5),
    marginBottom: spacing(3),
  },
  when: { fontSize: fontSize.sm, color: colors.inkFaint, marginBottom: spacing(1.5) },
  question: { fontSize: fontSize.md, color: colors.inkSoft, marginBottom: spacing(1.5) },
  answer: { fontSize: fontSize.body, color: colors.ink, lineHeight: 28 },
  answerBold: { fontWeight: '800' },
});
