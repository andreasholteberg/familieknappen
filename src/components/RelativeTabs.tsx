import { usePathname, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontSize, radius, spacing } from '@/theme/theme';

type TabKey = '/relative' | '/relative/calendar' | '/relative/history' | '/relative/settings';

const TABS: { key: TabKey; label: string }[] = [
  { key: '/relative', label: 'Hjem' },
  { key: '/relative/calendar', label: 'Kalender' },
  { key: '/relative/history', label: 'Logg' },
  { key: '/relative/settings', label: 'Mer' },
];

const HOME_PATH = '/relative';

/** Fjerner query/hash og trailing slash. */
const normalizePath = (raw: string | null | undefined): string => {
  if (!raw) return '/';
  const withoutQuery = raw.split('?')[0].split('#')[0];
  if (withoutQuery.length > 1 && withoutQuery.endsWith('/')) {
    return withoutQuery.slice(0, -1);
  }
  return withoutQuery;
};

/**
 * Sammenligner pathname med fane-key på en robust måte:
 * - `/relative` matcher kun eksakt rot, ikke underruter.
 * - Andre faner matcher eksakt eller underruter (f.eks. /relative/request/123).
 */
const isActiveTab = (pathname: string, key: TabKey): boolean => {
  if (key === HOME_PATH) return pathname === HOME_PATH;
  return pathname === key || pathname.startsWith(`${key}/`);
};

/** Enkel fane-rad nederst på pårørendes hovedskjermer. */
export function RelativeTabs() {
  const router = useRouter();
  const pathname = normalizePath(usePathname());

  return (
    <View style={styles.row}>
      {TABS.map((t) => {
        const active = isActiveTab(pathname, t.key);
        return (
          <Pressable
            key={t.key}
            accessibilityRole="button"
            accessibilityLabel={t.label}
            accessibilityState={{ selected: active }}
            style={[styles.tab, active && styles.tabActive]}
            onPress={() => router.replace(t.key)}
          >
            <Text
              style={[styles.label, active && styles.labelActive]}
              numberOfLines={1}
              ellipsizeMode="tail"
              allowFontScaling
            >
              {t.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing(2),
    marginTop: spacing(5),
  },
  tab: {
    flex: 1,
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.s,
    paddingVertical: spacing(3.5),
    paddingHorizontal: spacing(1.5),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  tabActive: { backgroundColor: colors.brand },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.brandDark,
    flexShrink: 1,
    textAlign: 'center',
  },
  labelActive: { color: colors.white },
});
