import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { colors, fontFamily, fontSize, radius, shadow, spacing } from '@/theme/theme';

type Variant = 'primary' | 'call' | 'day' | 'attention';

interface BigButtonProps {
  label: string;
  hint?: string;
  icon?: string;
  variant?: Variant;
  onPress: () => void;
  style?: ViewStyle;
  /** Mindre variant (brukt på sekundære «Tilbake/Ferdig»-knapper). */
  compact?: boolean;
  /** Større «hero»-variant for den ene hovedhandlingen på en skjerm. */
  size?: 'normal' | 'hero';
}

const VARIANT_BG: Record<Variant, string> = {
  primary: colors.brand,
  call: colors.calmGreen,
  day: '#50608f',
  attention: colors.attention,
};

/**
 * Stor, tilgjengelig knapp for seniorgrensesnittet.
 * Stor tekst, høy kontrast, romslig trykkflate.
 */
export function BigButton({
  label,
  hint,
  icon,
  variant = 'primary',
  onPress,
  style,
  compact = false,
  size = 'normal',
}: BigButtonProps) {
  const hero = size === 'hero';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={hint ? `${label}. ${hint}` : label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: VARIANT_BG[variant] },
        compact && styles.compact,
        hero && styles.hero,
        shadow.card,
        pressed && styles.pressed,
        style,
      ]}
    >
      {icon ? <Text style={[styles.icon, compact && styles.iconCompact, hero && styles.iconHero]}>{icon}</Text> : null}
      <Text style={[styles.label, compact && styles.labelCompact, hero && styles.labelHero]}>{label}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: '100%',
    borderRadius: radius.l,
    paddingVertical: spacing(7),
    paddingHorizontal: spacing(5),
    alignItems: 'center',
    marginBottom: spacing(4),
  },
  compact: {
    paddingVertical: spacing(5),
  },
  hero: {
    paddingVertical: spacing(9),
  },
  pressed: { opacity: 0.92, transform: [{ scale: 0.99 }] },
  icon: { fontSize: 40, marginBottom: spacing(2) },
  iconCompact: { fontSize: 28, marginBottom: spacing(1) },
  iconHero: { fontSize: 52 },
  label: {
    color: colors.white,
    fontFamily: fontFamily.heavy,
    fontSize: fontSize.button,
    fontWeight: '800',
    textAlign: 'center',
  },
  labelCompact: { fontSize: fontSize.body },
  labelHero: { fontSize: fontSize.huge },
  hint: {
    color: colors.white,
    opacity: 0.92,
    fontFamily: fontFamily.bold,
    fontSize: fontSize.md,
    fontWeight: '600',
    marginTop: spacing(2),
    textAlign: 'center',
  },
});
