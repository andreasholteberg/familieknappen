import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { DateTimeField } from '@/components/DateTimeField';
import { Screen } from '@/components/Screen';
import { selectSenior, useAppStore } from '@/store/useAppStore';
import { colors, fontSize, radius, spacing } from '@/theme/theme';

const todayISO = () => {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
};

/** Legg til / rediger en kalenderavtale (pårørende har full kontroll). */
export default function EventForm() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const events = useAppStore((s) => s.events);
  const addEvent = useAppStore((s) => s.addEvent);
  const updateEvent = useAppStore((s) => s.updateEvent);
  const deleteEvent = useAppStore((s) => s.deleteEvent);
  const currentUserId = useAppStore((s) => s.currentUserId);
  const senior = useAppStore(selectSenior);

  const editing = id ? events.find((e) => e.id === id) : undefined;

  const [title, setTitle] = useState(editing?.title ?? '');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [date, setDate] = useState(editing?.date ?? todayISO());
  const [time, setTime] = useState(editing?.time ?? '12:00');

  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (busy) return;
    if (!title.trim()) {
      Alert.alert('Skriv hva som skal skje');
      return;
    }
    setBusy(true);
    try {
      if (editing) {
        await updateEvent(editing.id, { title: title.trim(), description: description.trim(), date, time });
      } else {
        await addEvent({
          seniorId: senior?.id ?? '',
          createdBy: currentUserId ?? '',
          title: title.trim(),
          description: description.trim(),
          date,
          time,
          recurrence: 'none',
        });
      }
      router.back();
    } catch {
      Alert.alert('Fikk ikke lagret avtalen', 'Sjekk nettet og prøv igjen.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!editing || busy) return;
    setBusy(true);
    try {
      await deleteEvent(editing.id);
      router.back();
    } catch {
      Alert.alert('Fikk ikke slettet avtalen', 'Sjekk nettet og prøv igjen.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Text style={styles.label}>Hva skal skje?</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="F.eks. Legetime" placeholderTextColor={colors.inkFaint} />

      <Text style={styles.label}>Mer info (valgfritt)</Text>
      <TextInput style={styles.input} value={description} onChangeText={setDescription} placeholder="F.eks. Dr. Hansen, legekontoret" placeholderTextColor={colors.inkFaint} />

      <View style={styles.rowFields}>
        <View style={{ flex: 1 }}>
          <DateTimeField mode="date" label="Dato" value={date} onChange={setDate} />
        </View>
        <View style={{ flex: 1 }}>
          <DateTimeField mode="time" label="Klokkeslett" value={time} onChange={setTime} />
        </View>
      </View>

      <Pressable style={[styles.primaryBtn, busy && styles.busyBtn]} disabled={busy} onPress={() => void save()}>
        <Text style={styles.primaryBtnText}>{busy ? 'Lagrer …' : editing ? 'Lagre endringer' : 'Legg til avtale'}</Text>
      </Pressable>

      {editing ? (
        <Pressable style={[styles.deleteBtn, busy && styles.busyBtn]} disabled={busy} onPress={() => void remove()}>
          <Text style={styles.deleteBtnText}>Slett avtale</Text>
        </Pressable>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: fontSize.sm, fontWeight: '700', color: colors.inkSoft, marginTop: spacing(3), marginBottom: spacing(1.5) },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.s,
    paddingVertical: spacing(3.5),
    paddingHorizontal: spacing(3.5),
    fontSize: fontSize.md,
    color: colors.ink,
    backgroundColor: colors.surface,
  },
  rowFields: { flexDirection: 'row', gap: spacing(3) },
  primaryBtn: {
    backgroundColor: colors.brand,
    borderRadius: radius.m,
    paddingVertical: spacing(4),
    alignItems: 'center',
    marginTop: spacing(5),
  },
  primaryBtnText: { color: colors.white, fontSize: fontSize.md, fontWeight: '700' },
  deleteBtn: { backgroundColor: colors.attentionSoft, borderRadius: radius.m, paddingVertical: spacing(4), alignItems: 'center', marginTop: spacing(2.5) },
  deleteBtnText: { color: colors.attention, fontSize: fontSize.md, fontWeight: '700' },
  busyBtn: { opacity: 0.6 },
});
