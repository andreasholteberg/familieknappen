import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Card } from '@/components/Card';
import { RelativeTabs } from '@/components/RelativeTabs';
import { Screen } from '@/components/Screen';
import { selectSenior, useAppStore } from '@/store/useAppStore';
import { colors, fontSize, radius, spacing } from '@/theme/theme';
import { timeAgo } from '@/utils/format';
import { pickFromLibrary, takePhoto } from '@/utils/pickImage';

/**
 * «Bilder fra familien» – pårørendes side (F-063). Send et bilde med en kort
 * hilsen; senior ser det stort. Egne bilder kan slettes.
 */
export default function RelativePhotos() {
  const photos = useAppStore((s) => s.photos);
  const users = useAppStore((s) => s.users);
  const currentUserId = useAppStore((s) => s.currentUserId);
  const addPhoto = useAppStore((s) => s.addPhoto);
  const deletePhoto = useAppStore((s) => s.deletePhoto);
  const senior = useAppStore(selectSenior);

  const [pendingUri, setPendingUri] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nameOf = (id: string) => users.find((u) => u.id === id)?.name ?? 'Familien';

  const pick = async (fromCamera: boolean) => {
    const uri = fromCamera ? await takePhoto() : await pickFromLibrary();
    if (uri) setPendingUri(uri);
  };

  const send = async () => {
    if (!pendingUri || sending) return;
    setSending(true);
    setError(null);
    try {
      await addPhoto({ localUri: pendingUri, caption });
      setPendingUri(null);
      setCaption('');
    } catch {
      setError('Fikk ikke sendt bildet. Sjekk nettet og prøv igjen.');
    } finally {
      setSending(false);
    }
  };

  const confirmDelete = (photoId: string) => {
    const photo = photos.find((p) => p.id === photoId);
    if (!photo) return;
    Alert.alert('Slette bildet?', 'Det blir borte for hele familien.', [
      { text: 'Avbryt', style: 'cancel' },
      {
        text: 'Slett',
        style: 'destructive',
        onPress: () => {
          deletePhoto(photo).catch(() =>
            Alert.alert('Fikk ikke slettet bildet', 'Sjekk nettet og prøv igjen.'),
          );
        },
      },
    ]);
  };

  return (
    <Screen>
      <Text style={styles.intro}>
        Del et øyeblikk med {senior?.name ?? 'familien'} – det vises stort i appen.
      </Text>

      {/* Send nytt bilde */}
      <Card>
        {pendingUri ? (
          <>
            <Image source={{ uri: pendingUri }} style={styles.preview} resizeMode="cover" />
            <TextInput
              style={styles.captionInput}
              value={caption}
              onChangeText={setCaption}
              placeholder="Kort hilsen, f.eks. «Hilsen fra hytta!»"
              placeholderTextColor={colors.inkFaint}
              maxLength={120}
              accessibilityLabel="Hilsen til bildet"
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            {sending ? (
              <View style={styles.sendingBox}>
                <ActivityIndicator color={colors.brand} />
                <Text style={styles.sendingText}>Sender …</Text>
              </View>
            ) : (
              <View style={styles.row}>
                <Pressable style={[styles.btn, styles.btnGhost]} onPress={() => setPendingUri(null)}>
                  <Text style={styles.btnGhostText}>Avbryt</Text>
                </Pressable>
                <Pressable style={[styles.btn, styles.btnPrimary]} onPress={() => void send()}>
                  <Text style={styles.btnPrimaryText}>Send bildet</Text>
                </Pressable>
              </View>
            )}
          </>
        ) : (
          <>
            <View style={styles.row}>
              <Pressable style={[styles.btn, styles.btnPrimary]} onPress={() => void pick(false)}>
                <Text style={styles.btnPrimaryText}>🖼️ Velg bilde</Text>
              </Pressable>
              <Pressable style={[styles.btn, styles.btnGhost]} onPress={() => void pick(true)}>
                <Text style={styles.btnGhostText}>📷 Ta bilde</Text>
              </Pressable>
            </View>
            <Text style={styles.note}>Del bare bilder du har lov til å dele.</Text>
          </>
        )}
      </Card>

      {/* Strømmen */}
      {photos.length === 0 ? (
        <Text style={styles.muted}>Ingen bilder delt ennå. Bli den første!</Text>
      ) : (
        photos.map((p) => (
          <View key={p.id} style={styles.photoCard}>
            {p.imageUri ? (
              <Image source={{ uri: p.imageUri }} style={styles.photo} resizeMode="cover" />
            ) : null}
            <View style={styles.photoMetaRow}>
              <View style={{ flex: 1 }}>
                {p.caption ? <Text style={styles.caption}>«{p.caption}»</Text> : null}
                <Text style={styles.meta}>
                  {nameOf(p.uploadedBy)} · {timeAgo(p.createdAt)}
                </Text>
              </View>
              {p.uploadedBy === currentUserId ? (
                <Pressable
                  style={styles.deleteBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Slett bildet"
                  onPress={() => confirmDelete(p.id)}
                >
                  <Text style={styles.deleteBtnText}>Slett</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        ))
      )}

      <RelativeTabs />
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { fontSize: fontSize.md, color: colors.inkSoft, marginBottom: spacing(4) },
  row: { flexDirection: 'row', gap: spacing(3) },
  btn: { flex: 1, alignItems: 'center', paddingVertical: spacing(4), borderRadius: radius.m },
  btnPrimary: { backgroundColor: colors.brand },
  btnPrimaryText: { color: colors.white, fontSize: fontSize.md, fontWeight: '700' },
  btnGhost: { borderWidth: 2, borderColor: colors.line, backgroundColor: colors.surface },
  btnGhostText: { color: colors.brandDark, fontSize: fontSize.md, fontWeight: '700' },
  note: { fontSize: fontSize.sm, color: colors.inkFaint, marginTop: spacing(3), textAlign: 'center' },
  preview: { width: '100%', aspectRatio: 4 / 3, borderRadius: radius.s, marginBottom: spacing(3) },
  captionInput: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.s,
    padding: spacing(3.5),
    fontSize: fontSize.md,
    color: colors.ink,
    backgroundColor: colors.surface,
    marginBottom: spacing(3),
  },
  error: { fontSize: fontSize.sm, color: colors.attention, marginBottom: spacing(2.5) },
  sendingBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing(3), paddingVertical: spacing(3) },
  sendingText: { fontSize: fontSize.md, fontWeight: '700', color: colors.brandDark },

  photoCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.m,
    overflow: 'hidden',
    marginTop: spacing(4),
  },
  photo: { width: '100%', aspectRatio: 4 / 3 },
  photoMetaRow: { flexDirection: 'row', alignItems: 'center', padding: spacing(3.5), gap: spacing(3) },
  caption: { fontSize: fontSize.md, fontWeight: '700', color: colors.ink },
  meta: { fontSize: fontSize.sm, color: colors.inkFaint, marginTop: spacing(0.5) },
  deleteBtn: { backgroundColor: colors.attentionSoft, borderRadius: 10, paddingVertical: spacing(2), paddingHorizontal: spacing(3) },
  deleteBtnText: { fontSize: fontSize.sm, fontWeight: '700', color: colors.attention },
  muted: { fontSize: fontSize.md, color: colors.inkFaint, paddingVertical: spacing(4), textAlign: 'center' },
});
