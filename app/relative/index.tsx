import { useRouter } from 'expo-router';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import { Avatar } from '@/components/Avatar';
import { Card } from '@/components/Card';
import { RelativeTabs } from '@/components/RelativeTabs';
import { Screen } from '@/components/Screen';
import { StatusBadge } from '@/components/StatusBadge';
import {
  selectOpenRequests,
  selectSenior,
  selectTodaysEvents,
  useAppStore,
} from '@/store/useAppStore';
import { colors, fontSize, radius, spacing } from '@/theme/theme';
import { timeAgo } from '@/utils/format';

export default function RelativeDashboard() {
  const router = useRouter();
  const senior = useAppStore(selectSenior);
  const activity = useAppStore((s) => s.activity);
  const requests = useAppStore((s) => s.requests);
  const open = useAppStore(useShallow(selectOpenRequests));
  const events = useAppStore(useShallow(selectTodaysEvents));

  const recent = requests.slice(0, 6);

  return (
    <Screen>
      {/* Senior-banner: navn + trygghetsstatus (ikke-invaderende) */}
      <View style={styles.banner}>
        <Avatar name={senior?.name ?? '?'} size={54} onDark />
        <View style={styles.bannerBody}>
          <Text style={styles.bannerName}>{senior?.name}</Text>
          <Text style={styles.bannerSeen}>
            Sist aktiv {timeAgo(activity.lastSeenAt)} · Åpnet appen i dag ✓
          </Text>
        </View>
      </View>

      {open.length > 0 ? (
        <Card accent="brand">
          <Text style={styles.alertTitle}>
            🔔 {open.length} ny{open.length > 1 ? 'e' : ''} forespørsel{open.length > 1 ? 'er' : ''}
          </Text>
          <Text style={styles.alertBody}>{senior?.name} venter på svar før noe blir gjort.</Text>
        </Card>
      ) : null}

      <Text style={styles.sectionLabel}>FORESPØRSLER</Text>
      {recent.length > 0 ? (
        recent.map((r) => (
          <Pressable
            key={r.id}
            accessibilityRole="button"
            accessibilityLabel={`Forespørsel fra ${senior?.name}, ${timeAgo(r.createdAt)}`}
            style={[styles.reqRow, r.status === 'DELIVERED' && styles.reqRowNew]}
            onPress={() => router.push(`/relative/request/${r.id}`)}
          >
            <View style={styles.thumb}>
              {r.imageUri ? (
                <Image source={{ uri: r.imageUri }} style={styles.thumbImg} resizeMode="cover" />
              ) : (
                <Text style={styles.thumbEmoji}>📩</Text>
              )}
            </View>
            <View style={styles.reqBody}>
              <Text style={styles.reqTitle}>{senior?.name} ber om hjelp</Text>
              <Text style={styles.reqMeta}>
                {timeAgo(r.createdAt)} · «{r.message}»
              </Text>
            </View>
            <StatusBadge status={r.status} />
          </Pressable>
        ))
      ) : (
        <Text style={styles.muted}>Ingen forespørsler ennå.</Text>
      )}

      <Text style={styles.sectionLabel}>DAGENS KALENDER</Text>
      {events.length > 0 ? (
        events.map((e) => (
          <View key={e.id} style={styles.calRow}>
            <Text style={styles.calTime}>{e.time}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.calTitle}>{e.title}</Text>
              {e.description ? <Text style={styles.calDesc}>{e.description}</Text> : null}
            </View>
          </View>
        ))
      ) : (
        <Text style={styles.muted}>Ingen avtaler i dag.</Text>
      )}

      <RelativeTabs />
    </Screen>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(3.5),
    backgroundColor: colors.brand,
    borderRadius: radius.m,
    padding: spacing(4.5),
    marginBottom: spacing(4),
  },
  bannerBody: { flex: 1 },
  bannerName: { fontSize: fontSize.lg, fontWeight: '800', color: colors.white },
  bannerSeen: { fontSize: fontSize.sm, color: colors.white, opacity: 0.92, marginTop: spacing(0.5) },

  alertTitle: { fontSize: fontSize.md, fontWeight: '800', color: colors.brandDark },
  alertBody: { fontSize: fontSize.sm, color: colors.brandDark, marginTop: spacing(1) },

  sectionLabel: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    letterSpacing: 0.7,
    color: colors.inkFaint,
    marginTop: spacing(5),
    marginBottom: spacing(2.5),
  },

  reqRow: {
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
  reqRowNew: { borderColor: colors.brand, backgroundColor: colors.brandSoft },
  thumb: {
    width: 54, height: 54, borderRadius: 10,
    backgroundColor: colors.surfaceSoft,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.line, overflow: 'hidden',
  },
  thumbImg: { width: '100%', height: '100%' },
  thumbEmoji: { fontSize: 24 },
  reqBody: { flex: 1 },
  reqTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.ink },
  reqMeta: { fontSize: fontSize.sm, color: colors.inkFaint, marginTop: spacing(0.5) },

  calRow: {
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
  calTime: { fontSize: fontSize.lg, fontWeight: '800', color: colors.brandDark, minWidth: 56 },
  calTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.ink },
  calDesc: { fontSize: fontSize.sm, color: colors.inkFaint, marginTop: spacing(0.5) },

  muted: { fontSize: fontSize.md, color: colors.inkFaint, paddingVertical: spacing(2) },
});
