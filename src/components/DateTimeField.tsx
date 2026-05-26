import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fontSize, radius, spacing } from '@/theme/theme';

export interface DateTimeFieldProps {
  /** 'date' gir/forventer 'YYYY-MM-DD', 'time' gir/forventer 'HH:mm'. */
  mode: 'date' | 'time';
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

// DOM-stil for <input> (kun web). Speiler utseendet til appens tekstfelt.
const webInputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  border: `1px solid ${colors.line}`,
  borderRadius: radius.s,
  padding: spacing(3.5),
  fontSize: fontSize.md,
  color: colors.ink,
  backgroundColor: colors.surface,
};

/**
 * Web-variant: en standard HTML date/time-input. <input type="date"> gir verdi
 * som 'YYYY-MM-DD' og <input type="time"> som 'HH:mm' – samme format som lagres
 * fra for, sa Supabase/datamodell er uendret. (Native-variant: .native.tsx)
 */
export function DateTimeField({ mode, value, onChange, label }: DateTimeFieldProps) {
  return (
    <View>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      {React.createElement('input', {
        type: mode,
        value,
        onChange: (e: { target: { value: string } }) => onChange(e.target.value),
        style: webInputStyle,
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: fontSize.sm, fontWeight: '700', color: colors.inkSoft, marginBottom: spacing(1.5) },
});
