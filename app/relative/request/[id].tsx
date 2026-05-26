import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Card } from '@/components/Card';
import { QuickReply } from '@/components/QuickReply';
import { Screen } from '@/components/Screen';
import { selectResponseForRequest, useAppStore } from '@/store/useAppStore';
import { colors, fontSize, radius, spacing } from '@/theme/theme';
import type { ResponseType } from '@/types/models';
import { RESPONSE_META } from '@/types/models';
import { clock, timeAgo } from '@/utils/format';

export default function RequestDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const requests = useAppStore((s) => s.requests);
  const users = useAppStore((s) => s.users);
  const currentUserId = useAppStore((s) => s.currentUserId);
  const markRequestViewed = useAppStore((s) => s.markRequestViewed);
  const respondToRequest = useAppStore((s) => s.respondToRequest);

  const request = requests.find((r) => r.id === id);
  const response = useAppStore(selectResponseForRequest(id));
  const senior = users.find((u) => u.id === request?.seniorId);

  const [text, setText] = useState('');
  const [responding, setResponding] = useState(false);
  const [respondError, setRespondError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (id) markRequestViewed(id);
    }, [id, markRequestViewed]),
  );

  if (!request) {
    return (
      <Screen>
        <Text style={styles.muted}>Fant ikke forespørselen.</Text>
      </Screen>
    );
  }

  const relativeId = currentUserId ?? request.recipientId;
  const answered = request.status === 'ANSWERED' && response;

  const sendQuick = async (type: Exclude<ResponseType, 'custom'>) => {
    if (responding) return;
    setResponding(true);
    setRespondError(null);
    try {
      await respondToRequest({ requestId: request.id, relativeId, responseType: type });
      if (type === 'calling_you') {
        Alert.alert(`Ringer ${senior?.name ?? 'senior'} …`, 'Ringefunksjonen er ikke koblet på ennå.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        router.back();
      }
    } catch {
      setRespondError('Vi fikk ikke sendt svaret. Sjekk nettet og prøv igjen.');
    } finally {
      setResponding(false);
    }
  };

  const sendCustom = async () => {
    if (responding) return;
    if (!text.trim()) {
      Alert.alert('Skriv et svar først');
      return;
    }
    setResponding(true);
    setRespondError(null);
    try {
      await respondToRequest({ requestId: request.id, relativeId, responseType: 'custom', responseText: text.trim() });
      router.back();
    } catch {
      setRespondError('Vi fikk ikke sendt svaret. Sjekk nettet og prøv igjen.');
    } finally {
      setResponding(false);
    }
  };

  const startVideo = () =>
    Alert.alert(
      `Videosamtale med ${senior?.name ?? 'senior'}`,
      'Videosamtale er ikke tilgjengelig ennå.',
      [{ text: 'Avslutt' }],
    );

  return (
    <Screen>
      <Text style={styles.meta}>
        Fra <Text style={styles.bold}>{senior?.name}</Text> · {timeAgo(request.createdAt)} ({clock(request.createdAt)})
      </Text>

      {request.imageUri ? (
        <Image source={{ uri: request.imageUri }} style={styles.image} resizeMode="cover" />
      ) : null}

      {request.message ? (
        <Card style={{ marginTop: spacing(3.5) }}>
          <Text style={styles.muted}>{senior?.name} spør:</Text>
          <Text style={styles.question}>«{request.message}»</Text>
        </Card>
      ) : null}

      {answered ? (
        <Card accent="ok">
          <Text style={styles.answeredTitle}>
            Du har svart:{' '}
            {response.responseType === 'custom'
              ? response.responseText
              : RESPONSE_META[response.responseType].short}
          </Text>
          <Text style={styles.muted}>{senior?.name} ser svaret på sin skjerm.</Text>
        </Card>
      ) : (
        <Text style={[styles.muted, { marginBottom: spacing(2) }]}>
          Trykk på et hurtigsvar, eller skriv en melding:
        </Text>
      )}

      {respondError ? <Text style={styles.respondError}>{respondError}</Text> : null}
      {responding ? (
        <View style={styles.respondingBox}>
          <ActivityIndicator color={colors.brand} />
          <Text style={styles.respondingText}>Sender svar …</Text>
        </View>
      ) : null}

      <Text style={styles.sectionLabel}>HURTIGSVAR</Text>
      <QuickReply type="do_not_reply" selected={answered ? response.responseType === 'do_not_reply' : false} onPress={() => sendQuick('do_not_reply')} />
      <QuickReply type="looks_ok" selected={answered ? response.responseType === 'looks_ok' : false} onPress={() => sendQuick('looks_ok')} />
      <QuickReply type="calling_you" selected={answered ? response.responseType === 'calling_you' : false} onPress={() => sendQuick('calling_you')} />

      <Text style={styles.sectionLabel}>ELLER SKRIV ET EGET SVAR</Text>
      <TextInput
        style={styles.input}
        multiline
        numberOfLines={3}
        placeholder={`Skriv en rolig, tydelig beskjed til ${senior?.name ?? 'senior'} …`}
        placeholderTextColor={colors.inkFaint}
        value={text}
        onChangeText={setText}
      />
      <Pressable style={styles.primaryBtn} onPress={sendCustom}>
        <Text style={styles.primaryBtnText}>Send svar</Text>
      </Pressable>

      <Pressable style={styles.videoBtn} onPress={startVideo}>
        <Text style={styles.videoBtnText}>🎥 Start videosamtale</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  meta: { fontSize: fontSize.sm, color: colors.inkFaint, marginBottom: spacing(3) },
  bold: { fontWeight: '700', color: colors.ink },
  image: { width: '100%', aspectRatio: 3 / 4, borderRadius: radius.m, borderWidth: 1, borderColor: colors.line },
  question: { fontSize: fontSize.lg, fontWeight: '700', color: colors.ink, marginTop: spacing(1) },
  answeredTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.calmGreen, marginBottom: spacing(1) },

  sectionLabel: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    letterSpacing: 0.7,
    color: colors.inkFaint,
    marginTop: spacing(4),
    marginBottom: spacing(2.5),
  },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.s,
    padding: spacing(3.5),
    fontSize: fontSize.md,
    color: colors.ink,
    backgroundColor: colors.surface,
    minHeight: 90,
    textAlignVertical: 'top',
  },
  primaryBtn: {
    backgroundColor: colors.brand,
    borderRadius: radius.m,
    paddingVertical: spacing(4),
    alignItems: 'center',
    marginTop: spacing(2.5),
  },
  primaryBtnText: { color: colors.white, fontSize: fontSize.md, fontWeight: '700' },
  videoBtn: {
    backgroundColor: colors.calmGreen,
    borderRadius: radius.m,
    paddingVertical: spacing(4),
    alignItems: 'center',
    marginTop: spacing(2.5),
  },
  videoBtnText: { color: colors.white, fontSize: fontSize.md, fontWeight: '700' },
  respondError: { fontSize: fontSize.md, color: colors.attention, marginBottom: spacing(2), lineHeight: 24 },
  respondingBox: { flexDirection: 'row', alignItems: 'center', gap: spacing(3), paddingVertical: spacing(3) },
  respondingText: { fontSize: fontSize.md, fontWeight: '700', color: colors.brandDark },
  muted: { fontSize: fontSize.sm, color: colors.inkFaint },
});
