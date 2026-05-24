import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, fontSize, radius, spacing } from '@/theme/theme';
import type { ResponseType } from '@/types/models';
import { RESPONSE_META } from '@/types/models';

interface QuickReplyProps {
  type: Exclude<ResponseType, 'custom'>;
  onPress: () => void;
  selected?: boolean;
}

const ICON: Record<Exclude<ResponseType, 'custom'>, string> = {
  do_not_reply: '✋',
  looks_ok: '👍',
  calling_you: '📞',
};

const TONE_STYLE = {
  attention: { borderColor: colors.attention, color: colors.attention, bg: colors.attentionSoft },
  ok: { borderColor: colors.calmGreen, color: colors.calmGreen, bg: colors.calmGreenSoft },
  neutral: { borderColor: colors.brand, color: colors.brandDark, bg: colors.brandSoft },
} as const;

/** Forhåndsdefinert hurtigsvar for pårørende (styringsdokument 5.3.1). */
export function QuickReply({ type, onPress, selected = false }: QuickReplyProps) {
  const meta = RESPONSE_META[type];
  const tone = TONE_STYLE[meta.tone];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={meta.short}
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        { borderColor: tone.borderColor },
        selected && { backgroundColor: tone.bg },
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.icon}>{ICON[type]}</Text>
      <Text style={[styles.label, { color: tone.color }]}>
        {meta.short}
        {selected ? '  ✓' : ''}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(3),
    borderWidth: 2,
    borderRadius: radius.m,
    paddingVertical: spacing(4),
    paddingHorizontal: spacing(4),
    backgroundColor: colors.surface,
    marginBottom: spacing(2.5),
  },
  pressed: { opacity: 0.85 },
  icon: { fontSize: 24 },
  label: { fontSize: fontSize.lg, fontWeight: '700' },
});
