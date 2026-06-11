import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import { Avatar } from '@/components/Avatar';
import { Screen } from '@/components/Screen';
import { selectRelativeMembers, useAppStore } from '@/store/useAppStore';
import { colors, fontSize, radius, shadow, spacing } from '@/theme/theme';
import { callPhone, telUrl } from '@/utils/phone';

/**
 * «Min familie» (F-025): en varm flate med store kontaktkort per pårørende.
 * Hvert kort har ring-knapp (vises bare hvis nummer finnes) og en
 * «Spør om hjelp»-knapp som starter spør-flyten med kontakten forhåndsvalgt.
 */
export default function MyFamily() {
  const router = useRouter();
  const members = useAppStore(useShallow(selectRelativeMembers));
  const users = useAppStore((s) => s.users);

  const sorted = [...members].sort(
    (a, b) => Number(b.isPrimaryContact) - Number(a.isPrimaryContact),
  );

  return (
    <Screen>
      {sorted.length === 0 ? (
        <Text style={styles.empty}>Familien din dukker opp her når de er med.</Text>
      ) : null}

      {sorted.map((m) => {
        const u = users.find((x) => x.id === m.userId);
        if (!u) return null;
        const canCall = !!telUrl(u.phone);
        return (
          <View key={m.id} style={[styles.card, shadow.card]}>
            <View style={styles.cardHead}>
              <Avatar name={u.name} size={64} />
              <View style={styles.headBody}>
                <Text style={styles.name}>{u.name}</Text>
                <Text style={styles.rel}>
                  {m.relationship || (m.isPrimaryContact ? 'Fast kontakt' : 'Familie')}
                </Text>
              </View>
            </View>

            <View style={styles.actions}>
              {canCall ? (
                <Pressable
                  style={[styles.actionBtn, styles.callBtn]}
                  accessibilityRole="button"
                  accessibilityLabel={`Ring ${u.name}`}
                  onPress={() => void callPhone(u.phone)}
                >
                  <Text style={styles.actionText}>📞 Ring</Text>
                </Pressable>
              ) : null}
              <Pressable
                style={[styles.actionBtn, styles.askBtn]}
                accessibilityRole="button"
                accessibilityLabel={`Spør ${u.name} om hjelp`}
                onPress={() =>
                  router.push({ pathname: '/senior/ask', params: { contact: u.id } })
                }
              >
                <Text style={styles.actionText}>💬 Spør om hjelp</Text>
              </Pressable>
            </View>
          </View>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  empty: { fontSize: fontSize.body, color: colors.inkFaint, textAlign: 'center', marginVertical: spacing(10), lineHeight: 30 },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.l,
    padding: spacing(5),
    marginBottom: spacing(4),
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: spacing(4) },
  headBody: { flex: 1 },
  name: { fontSize: fontSize.title, fontWeight: '800', color: colors.ink },
  rel: { fontSize: fontSize.body, color: colors.inkSoft, marginTop: spacing(0.5) },
  actions: { flexDirection: 'row', gap: spacing(3), marginTop: spacing(4) },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing(4),
    borderRadius: radius.m,
  },
  callBtn: { backgroundColor: colors.calmGreen },
  askBtn: { backgroundColor: colors.brand },
  actionText: { color: colors.white, fontSize: fontSize.lg, fontWeight: '800' },
});
