import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontSize, radius, spacing } from '@/theme/theme';

export interface DateTimeFieldProps {
  mode: 'date' | 'time';
  value: string; // 'YYYY-MM-DD' eller 'HH:mm'
  onChange: (value: string) => void;
  label?: string;
}

const pad = (n: number): string => String(n).padStart(2, '0');

function toDate(mode: 'date' | 'time', value: string): Date {
  const d = new Date();
  if (mode === 'date' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, day] = value.split('-').map(Number);
    d.setFullYear(y, m - 1, day);
    d.setHours(12, 0, 0, 0);
  } else if (mode === 'time' && /^\d{2}:\d{2}$/.test(value)) {
    const [h, mi] = value.split(':').map(Number);
    d.setHours(h, mi, 0, 0);
  }
  return d;
}

function fromDate(mode: 'date' | 'time', d: Date): string {
  return mode === 'date'
    ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    : `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Native-variant: apnet via en knapp -> systemets dato/tid-velger. Returnerer
 * samme strengformat som web-varianten ('YYYY-MM-DD' / 'HH:mm').
 */
export function DateTimeField({ mode, value, onChange, label }: DateTimeFieldProps) {
  const [show, setShow] = useState(false);
  const placeholder = mode === 'date' ? 'Velg dato' : 'Velg klokkeslett';

  return (
    <View>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label ?? placeholder}
        style={styles.field}
        onPress={() => setShow(true)}
      >
        <Text style={value ? styles.value : styles.placeholder}>{value || placeholder}</Text>
      </Pressable>
      {show ? (
        <DateTimePicker
          value={toDate(mode, value)}
          mode={mode}
          is24Hour
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selected) => {
            setShow(false);
            if (event.type !== 'dismissed' && selected) onChange(fromDate(mode, selected));
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: fontSize.sm, fontWeight: '700', color: colors.inkSoft, marginBottom: spacing(1.5) },
  field: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.s,
    paddingVertical: spacing(3.5),
    paddingHorizontal: spacing(3.5),
    backgroundColor: colors.surface,
  },
  value: { fontSize: fontSize.md, color: colors.ink },
  placeholder: { fontSize: fontSize.md, color: colors.inkFaint },
});
