import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

import { colors, radius, shadow, spacing } from '@/theme/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  /** Lett aksentbakgrunn (f.eks. for ny forespørsel). */
  accent?: 'brand' | 'ok' | 'attention';
}

const ACCENT: Record<NonNullable<CardProps['accent']>, ViewStyle> = {
  brand: { borderColor: colors.brand, backgroundColor: colors.brandSoft },
  ok: { borderColor: colors.calmGreen, backgroundColor: colors.calmGreenSoft },
  attention: { borderColor: colors.attention, backgroundColor: colors.attentionSoft },
};

export function Card({ children, style, accent }: CardProps) {
  return (
    <View style={[styles.card, shadow.card, accent ? ACCENT[accent] : null, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.m,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing(4),
    marginBottom: spacing(3.5),
  },
});
