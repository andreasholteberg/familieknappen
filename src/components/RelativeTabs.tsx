import { usePathname, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontSize, radius, spacing } from '@/theme/theme';

type TabKey = '/relative' | '/relative/calendar' | '/relative/history' | '/relative/settings';

const TABS: { key: TabKey; label: string }[] = [
  { key: '/relative', label: '🏠 Hjem' },
  { key: '/relative/calendar', label: '📅 Kalender' },
  { key: '/relative/history', label: '🕓 Historikk' },
  { key: '/relative/settings', label: '⚙️ Mer' },
];

/** Enkel fane-rad nederst på pårørendes hovedskjermer. */
export function RelativeTabs() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View style={styles.row}>
      {TABS.map((t) => {
        const active = pathname === t.key;
        return (
          <Pressable
            key={t.key}
            accessibilityRole="button"
            accessibilityLabel={t.label}
            style={[styles.tab, active && styles.tabActive]}
            onPress={() => router.replace(t.key)}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{t.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing(2), marginTop: spacing(5) },
  tab: {
    flex: 1,
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.s,
    paddingVertical: spacing(3),
    alignItems: 'center',
  },
  tabActive: { backgroundColor: colors.brand },
  label: { fontSize: fontSize.sm, fontWeight: '700', color: colors.brandDark },
  labelActive: { color: colors.white },
});
