import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { BigButton } from '@/components/BigButton';
import { Screen } from '@/components/Screen';
import { useAppStore } from '@/store/useAppStore';
import { colors, fontSize, radius, shadow, spacing } from '@/theme/theme';
import { timeAgo } from '@/utils/format';

/**
 * «Bilder fra familien» – seniorens side (F-063). Store, varme bildekort
 * med hilsen og avsender. Ingen valg å ta – bare å glede seg over.
 */
export default function SeniorPhotos() {
  const router = useRouter();
  const photos = useAppStore((s) => s.photos);
  const users = useAppStore((s) => s.users);

  const nameOf = (id: string) => users.find((u) => u.id === id)?.name ?? 'Familien';

  return (
    <Screen>
      {photos.length === 0 ? (
        <Text style={styles.empty}>
          Her kommer bilder fra familien din.{'\n'}Ingen ennå – men de kommer! 💙
        </Text>
      ) : (
        photos.map((p) => (
          <View key={p.id} style={[styles.card, shadow.card]}>
            {p.imageUri ? (
              <Image source={{ uri: p.imageUri }} style={styles.photo} resizeMode="cover" />
            ) : null}
            <View style={styles.body}>
              {p.caption ? <Text style={styles.caption}>«{p.caption}»</Text> : null}
              <Text style={styles.meta}>
                Fra {nameOf(p.uploadedBy)} · {timeAgo(p.createdAt)}
              </Text>
            </View>
          </View>
        ))
      )}

      <BigButton label="Tilbake" variant="day" compact onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  empty: {
    fontSize: fontSize.body,
    color: colors.inkFaint,
    textAlign: 'center',
    marginVertical: spacing(10),
    lineHeight: 32,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.l,
    overflow: 'hidden',
    marginBottom: spacing(5),
  },
  photo: { width: '100%', aspectRatio: 4 / 3 },
  body: { padding: spacing(4.5) },
  caption: { fontSize: fontSize.lg, fontWeight: '700', color: colors.ink, lineHeight: 30 },
  meta: { fontSize: fontSize.md, color: colors.inkSoft, marginTop: spacing(1.5) },
});
