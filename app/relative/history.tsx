import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { RelativeTabs } from '@/components/RelativeTabs';
import { Screen } from '@/components/Screen';
import { StatusBadge } from '@/components/StatusBadge';
import { useAppStore } from '@/store/useAppStore';
import { colors, fontSize, radius, spacing } from '@/theme/theme';
import { RESPONSE_META } from '@/types/models';
import { clock, timeAgo } from '@/utils/format';

/**
 * Historikk – utvidet visning for pårørende (styringsdokument 5.7).
 * Tidslinje over alle forespørsler og svar.
 */
export default function History() {
  const router = useRouter();
  const requests = useAppStore((s) => s.requests);
  const responses = useAppStore((s) => s.responses);
  const users = useAppStore((s) => s.users);

  const sorted = [...requests].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const responseFor = (rid: string) =>
    responses
      .filter((r) => r.requestId === rid)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];

  return (
    <Screen>
      <Text style={styles.intro}>Alle forespørsler og svar.</Text>

      {sorted.map((r) => {
        const resp = responseFor(r.id);
        const by = resp ? users.find((u) => u.id === resp.relativeId) : undefined;
        const answerLabel = resp
          ? resp.responseType === 'custom'
            ? resp.responseText
            : RESPONSE_META[resp.responseType].short
          : null;
        return (
          <Pressable key={r.id} style={styles.item} onPress={() => router.push(`/relative/request/${r.id}`)}>
            <View style={styles.itemHead}>
              <Text style={styles.date}>
                {timeAgo(r.createdAt)} · {clock(r.createdAt)}
              </Text>
              <StatusBadge status={r.status} />
            </View>
            <Text style={styles.msg}>«{r.message}»</Text>
            {answerLabel ? (
              <Text style={styles.answer}>
                {by?.name ?? 'Familien'} svarte: <Text style={styles.answerBold}>{answerLabel}</Text>
              </Text>
            ) : (
              <Text style={styles.pending}>Venter på svar</Text>
            )}
          </Pressable>
        );
      })}

      <RelativeTabs />
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { fontSize: fontSize.md, color: colors.inkSoft, marginBottom: spacing(4) },
  item: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.s,
    padding: spacing(3.5),
    marginBottom: spacing(2.5),
  },
  itemHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing(1.5) },
  date: { fontSize: fontSize.sm, color: colors.inkFaint },
  msg: { fontSize: fontSize.md, fontWeight: '700', color: colors.ink },
  answer: { fontSize: fontSize.sm, color: colors.inkSoft, marginTop: spacing(1.5) },
  answerBold: { fontWeight: '700', color: colors.ink },
  pending: { fontSize: fontSize.sm, color: colors.attention, marginTop: spacing(1.5) },
});
