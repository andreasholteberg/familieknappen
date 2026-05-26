import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { RelativeTabs } from '@/components/RelativeTabs';
import { Screen } from '@/components/Screen';
import { selectSenior, useAppStore } from '@/store/useAppStore';
import { colors, fontSize, radius, spacing } from '@/theme/theme';
import { shortDateFromISO } from '@/utils/format';

const todayISO = () => {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
};

export default function RelativeCalendar() {
  const router = useRouter();
  const events = useAppStore((s) => s.events);
  const deleteEvent = useAppStore((s) => s.deleteEvent);
  const senior = useAppStore(selectSenior);

  const sorted = [...events].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  return (
    <Screen>
      <Text style={styles.intro}>
        Avtaler for {senior?.name}. Disse vises stort under «Min dag».
      </Text>

      {sorted.length > 0 ? (
        sorted.map((e) => {
          const isToday = e.date === todayISO();
          return (
            <View key={e.id} style={styles.row}>
              <View style={styles.timeCol}>
                <Text style={styles.time}>{e.time}</Text>
                <Text style={styles.date}>{isToday ? 'I dag' : shortDateFromISO(e.date)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{e.title}</Text>
                {e.description ? <Text style={styles.desc}>{e.description}</Text> : null}
              </View>
              <View style={styles.actions}>
                <Pressable style={styles.iconBtn} onPress={() => router.push({ pathname: '/relative/event', params: { id: e.id } })}>
                  <Text style={styles.iconBtnText}>Rediger</Text>
                </Pressable>
                <Pressable style={[styles.iconBtn, styles.del]} onPress={() => deleteEvent(e.id)}>
                  <Text style={[styles.iconBtnText, styles.delText]}>Slett</Text>
                </Pressable>
              </View>
            </View>
          );
        })
      ) : (
        <Text style={styles.muted}>Ingen avtaler lagt inn.</Text>
      )}

      <Pressable style={styles.addBtn} onPress={() => router.push('/relative/event')}>
        <Text style={styles.addBtnText}>＋ Legg til avtale</Text>
      </Pressable>

      <RelativeTabs />
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { fontSize: fontSize.md, color: colors.inkSoft, marginBottom: spacing(4) },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(3),
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.s,
    padding: spacing(3),
    marginBottom: spacing(2.5),
  },
  timeCol: { minWidth: 56 },
  time: { fontSize: fontSize.lg, fontWeight: '800', color: colors.brandDark },
  date: { fontSize: fontSize.sm, fontWeight: '600', color: colors.inkFaint },
  title: { fontSize: fontSize.md, fontWeight: '700', color: colors.ink },
  desc: { fontSize: fontSize.sm, color: colors.inkFaint, marginTop: spacing(0.5) },
  actions: { gap: spacing(1.5) },
  iconBtn: { backgroundColor: colors.surfaceSoft, borderRadius: 10, paddingVertical: spacing(2), paddingHorizontal: spacing(2.5) },
  iconBtnText: { fontSize: fontSize.sm, fontWeight: '700', color: colors.brandDark },
  del: { backgroundColor: colors.attentionSoft },
  delText: { color: colors.attention },
  addBtn: {
    backgroundColor: colors.brand,
    borderRadius: radius.m,
    paddingVertical: spacing(4),
    alignItems: 'center',
    marginTop: spacing(3),
  },
  addBtnText: { color: colors.white, fontSize: fontSize.md, fontWeight: '700' },
  muted: { fontSize: fontSize.md, color: colors.inkFaint, paddingVertical: spacing(2) },
});
