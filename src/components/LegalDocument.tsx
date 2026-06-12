import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { Screen } from '@/components/Screen';
import type { LegalSection } from '@/content/legal';
import { colors, fontSize, spacing } from '@/theme/theme';

interface Props {
  title: string;
  version: string;
  sections: LegalSection[];
}

/** Lesbar visning av et juridisk dokument: stor tekst, rolig layout. */
export function LegalDocument({ title, version, sections }: Props) {
  const router = useRouter();
  return (
    <Screen>
      <Pressable accessibilityRole="button" style={styles.back} onPress={() => router.back()}>
        <Text style={styles.backText}>‹ Tilbake</Text>
      </Pressable>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.version}>Versjon {version} · Utkast</Text>
      {sections.map((s) => (
        <React.Fragment key={s.heading}>
          <Text style={styles.heading}>{s.heading}</Text>
          <Text style={styles.body}>{s.body}</Text>
        </React.Fragment>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { paddingVertical: spacing(2), marginBottom: spacing(2) },
  backText: { fontSize: fontSize.lg, color: colors.brandDark, fontWeight: '700' },
  title: { fontSize: fontSize.title, fontWeight: '800', color: colors.ink },
  version: { fontSize: fontSize.sm, color: colors.inkFaint, marginTop: spacing(1), marginBottom: spacing(4) },
  heading: { fontSize: fontSize.lg, fontWeight: '800', color: colors.ink, marginTop: spacing(4), marginBottom: spacing(1.5) },
  body: { fontSize: fontSize.md, color: colors.inkSoft, lineHeight: 26 },
});
