import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';

import { BigButton } from '@/components/BigButton';
import { DateTimeField } from '@/components/DateTimeField';
import { Screen } from '@/components/Screen';
import { useAppStore } from '@/store/useAppStore';
import { colors, fontSize, radius, spacing } from '@/theme/theme';

const todayISO = () => {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
};

/**
 * Senior legger til en avtale (F-026): tre store felt – hva, dato, klokke.
 * Senior kan ikke endre eller slette avtaler; det gjør familien.
 */
export default function SeniorAddEvent() {
  const router = useRouter();
  const addEvent = useAppStore((s) => s.addEvent);
  const currentUserId = useAppStore((s) => s.currentUserId);

  const [title, setTitle] = useState('');
  const [date, setDate] = useState(todayISO());
  const [time, setTime] = useState('12:00');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    if (saving) return;
    if (!title.trim()) {
      setError('Skriv hva som skal skje først.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await addEvent({
        seniorId: currentUserId ?? '',
        createdBy: currentUserId ?? '',
        title: title.trim(),
        date,
        time,
        recurrence: 'none',
      });
      setSaved(true);
    } catch {
      setError('Vi fikk ikke lagret avtalen. Prøv igjen.');
    } finally {
      setSaving(false);
    }
  };

  if (saved) {
    return (
      <Screen contentStyle={styles.confirmScreen}>
        <View style={styles.confirmWrap}>
          <Text style={styles.confirmIcon}>📅</Text>
          <Text style={styles.confirmTitle}>Avtalen er lagret</Text>
          <Text style={styles.confirmText}>
            «{title.trim()}» vises under «Min dag».{'\n'}Familien ser den også.
          </Text>
          <BigButton label="Tilbake til Min dag" variant="day" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={styles.label}>Hva skal skje?</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="F.eks. Legetime"
        placeholderTextColor={colors.inkFaint}
        accessibilityLabel="Hva skal skje"
      />

      <DateTimeField mode="date" label="Hvilken dag?" value={date} onChange={setDate} />
      <DateTimeField mode="time" label="Når på dagen?" value={time} onChange={setTime} />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {saving ? (
        <View style={styles.savingBox}>
          <ActivityIndicator color={colors.brand} />
          <Text style={styles.savingText}>Lagrer …</Text>
        </View>
      ) : (
        <BigButton label="Lagre avtalen" variant="primary" onPress={() => void save()} style={{ marginTop: spacing(4) }} />
      )}
      <BigButton label="Avbryt" variant="day" compact onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: fontSize.body,
    fontWeight: '700',
    color: colors.ink,
    marginTop: spacing(3),
    marginBottom: spacing(2),
  },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.m,
    padding: spacing(4.5),
    fontSize: fontSize.body,
    color: colors.ink,
    backgroundColor: colors.surface,
  },
  error: { fontSize: fontSize.md, color: colors.attention, marginTop: spacing(3), lineHeight: 26 },
  savingBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing(3), paddingVertical: spacing(5) },
  savingText: { fontSize: fontSize.body, fontWeight: '700', color: colors.brandDark },

  confirmScreen: { flexGrow: 1, justifyContent: 'center' },
  confirmWrap: { alignItems: 'center' },
  confirmIcon: { fontSize: 56, marginBottom: spacing(3) },
  confirmTitle: { fontSize: fontSize.title, fontWeight: '800', color: colors.ink, marginBottom: spacing(3) },
  confirmText: {
    fontSize: fontSize.body,
    color: colors.inkSoft,
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: spacing(6),
  },
});
