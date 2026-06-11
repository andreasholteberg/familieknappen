import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import { BigButton } from '@/components/BigButton';
import { Screen } from '@/components/Screen';
import { selectPrimaryContact, selectTodaysEvents, useAppStore } from '@/store/useAppStore';
import { colors, fontSize, radius, shadow, spacing } from '@/theme/theme';
import { longDate } from '@/utils/format';
import { telUrl } from '@/utils/phone';

/** Seniorens dagsoversikt: store kort med klokkeslett og tekst. */
export default function MyDay() {
  const router = useRouter();
  const events = useAppStore(useShallow(selectTodaysEvents));
  const primary = useAppStore(selectPrimaryContact);

  const canCall = !!telUrl(primary?.phone);

  return (
    <Screen>
      <Text style={styles.date}>{longDate()}</Text>

      {events.length > 0 ? (
        events.map((e) => (
          <View key={e.id} style={[styles.card, shadow.card]}>
            <Text style={styles.time}>{e.time}</Text>
            <View style={styles.body}>
              <Text style={styles.title}>{e.title}</Text>
              {e.description ? <Text style={styles.desc}>{e.description}</Text> : null}
            </View>
          </View>
        ))
      ) : (
        <Text style={styles.empty}>Ingen avtaler i dag.{'\n'}Du kan slappe av. 🌿</Text>
      )}

      <BigButton
        icon="＋"
        label="Legg til avtale"
        variant="primary"
        compact
        onPress={() => router.push('/senior/add-event')}
        style={{ marginTop: spacing(4) }}
      />

      {canCall ? (
        <BigButton
          icon="📞"
          label="Ring familien"
          variant="call"
          compact
          onPress={() => router.push('/senior/call')}
          style={{ marginTop: spacing(2) }}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  date: { fontSize: fontSize.body, color: colors.inkSoft, textTransform: 'capitalize', marginBottom: spacing(5) },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(4),
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.m,
    padding: spacing(5),
    marginBottom: spacing(4),
  },
  time: { fontSize: fontSize.title, fontWeight: '800', color: colors.brandDark, minWidth: 82 },
  body: { flex: 1 },
  title: { fontSize: fontSize.body, fontWeight: '700', color: colors.ink },
  desc: { fontSize: fontSize.md, color: colors.inkSoft, marginTop: spacing(1) },
  empty: { fontSize: fontSize.body, color: colors.inkFaint, textAlign: 'center', marginVertical: spacing(10), lineHeight: 30 },
});
