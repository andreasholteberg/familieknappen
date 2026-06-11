import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import { Avatar } from '@/components/Avatar';
import { BigButton } from '@/components/BigButton';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { SmsPreview } from '@/components/SmsPreview';
import {
  selectPrimaryContact,
  selectRelativeMembers,
  useAppStore,
} from '@/store/useAppStore';
import { colors, fontSize, radius, spacing } from '@/theme/theme';
import { pickFromLibrary, takePhoto } from '@/utils/pickImage';

const MESSAGE_PLACEHOLDER = 'F.eks. «Er denne ekte?»';

/** Stegindikator (3 trinn). */
function Steps({ step }: { step: number }) {
  return (
    <View style={styles.steps} accessibilityLabel={`Trinn ${step} av 3`}>
      {[1, 2, 3].map((n) => (
        <View key={n} style={[styles.step, step >= n && styles.stepDone]} />
      ))}
    </View>
  );
}

/**
 * «Spør familien»-flyten (F-005/F-006/F-007).
 *
 * - Kamera er hovedvalget: stor «Ta bilde»-knapp øverst, galleri er sekundært.
 * - Handlingsknappen («Neste» / «SEND TIL FAMILIEN») ligger fast nederst,
 *   tydelig adskilt fra innholdet.
 * - Etter sending vises en stor, rolig bekreftelse som ikke forsvinner av
 *   seg selv.
 */
export default function AskFamily() {
  const router = useRouter();
  const params = useLocalSearchParams<{ contact?: string }>();
  const relatives = useAppStore(useShallow(selectRelativeMembers));
  const users = useAppStore((s) => s.users);
  const primary = useAppStore(selectPrimaryContact);
  const createHelpRequest = useAppStore((s) => s.createHelpRequest);

  const [step, setStep] = useState(1);
  const [hasPhoto, setHasPhoto] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [contactId, setContactId] = useState<string | undefined>(
    typeof params.contact === 'string' && params.contact ? params.contact : primary?.id,
  );
  const [sentToName, setSentToName] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [imageFailed, setImageFailed] = useState(false);
  const [message, setMessage] = useState('');

  const userById = (id?: string) => users.find((u) => u.id === id);

  const handleTake = async () => {
    const uri = await takePhoto();
    if (uri) {
      setImageUri(uri);
      setHasPhoto(true);
    } else {
      Alert.alert('Fikk ikke åpnet kameraet', 'Du kan velge et bilde fra telefonen i stedet.');
    }
  };

  const handlePick = async () => {
    const uri = await pickFromLibrary();
    if (uri) {
      setImageUri(uri);
      setHasPhoto(true);
    }
  };

  const useExample = () => {
    setImageUri(null);
    setHasPhoto(true);
  };

  const next = () => {
    if (step === 1 && !message.trim() && !hasPhoto) {
      Alert.alert('Legg til noe først', 'Ta et bilde eller skriv en kort melding.');
      return;
    }
    setStep((s) => Math.min(3, s + 1));
  };
  const prev = () => {
    if (step === 1) router.back();
    else setStep((s) => s - 1);
  };

  const send = async () => {
    if (sending) return;
    if (!contactId) {
      Alert.alert('Velg hvem du vil spørre', 'Gå tilbake og velg en i familien først.');
      setStep(2);
      return;
    }
    setSending(true);
    setSendError(null);
    const result = await createHelpRequest({
      recipientId: contactId,
      message: message.trim(),
      imageUri: imageUri ?? undefined,
    });
    setSending(false);
    if (!result.ok) {
      setSendError('Vi fikk ikke sendt meldingen. Prøv igjen.');
      return;
    }
    setImageFailed(!!result.imageFailed);
    setSentToName(userById(contactId)?.name ?? 'familien');
    setStep(4);
  };

  /* ---------- Stor bekreftelse (etter sending) – forsvinner ikke selv ---------- */
  if (step === 4) {
    return (
      <Screen contentStyle={styles.confirmScreen}>
        <View style={styles.confirmWrap}>
          <View style={styles.check}>
            <Text style={styles.checkMark}>✓</Text>
          </View>
          <Text style={styles.confirmTitle}>Meldingen er sendt</Text>
          <View style={styles.waitBox}>
            <Text style={styles.waitText}>Vent på svar før du gjør noe.</Text>
          </View>
          <Text style={styles.help}>{sentToName} har fått meldingen og svarer deg her.</Text>
          {imageFailed ? (
            <Text style={styles.imageWarn}>
              Bildet ble ikke med, men spørsmålet er sendt.{'\n'}
              {sentToName} kan ringe deg om noe er uklart.
            </Text>
          ) : null}
          <BigButton label="Tilbake til hjem" variant="day" onPress={() => router.replace('/senior')} />
        </View>
      </Screen>
    );
  }

  const contactName = userById(contactId)?.name ?? 'familien';

  return (
    <View style={styles.flow}>
      <ScrollView
        style={styles.flowScroll}
        contentContainerStyle={styles.flowContent}
        keyboardShouldPersistTaps="handled"
      >
        <Steps step={step} />

        {step === 1 ? (
          <View>
            <Text style={styles.stepTitle}>Hva lurer du på?</Text>
            <Text style={styles.stepHelp}>Ta et bilde av meldingen eller brevet.</Text>

            {hasPhoto ? (
              <View>
                {imageUri ? (
                  <Image source={{ uri: imageUri }} style={styles.photo} resizeMode="cover" />
                ) : (
                  <SmsPreview />
                )}
                {!imageUri ? (
                  <Text style={styles.caption}>Eksempelbilde brukt (kun for utvikling)</Text>
                ) : null}
                <Pressable style={styles.retake} onPress={handleTake}>
                  <Text style={styles.retakeText}>📷 Ta nytt bilde</Text>
                </Pressable>
              </View>
            ) : (
              <View>
                {/* Kamera er hovedvalget – stor knapp (F-007). */}
                <BigButton icon="📷" label="Ta bilde" variant="primary" onPress={handleTake} />
                {/* Galleri er sekundært – liten lenke. */}
                <Pressable
                  style={styles.galleryLink}
                  onPress={handlePick}
                  accessibilityRole="button"
                  accessibilityLabel="Velg et bilde fra telefonen"
                >
                  <Text style={styles.galleryLinkText}>Eller velg et bilde fra telefonen</Text>
                </Pressable>
                {__DEV__ ? (
                  <Pressable style={styles.exampleLink} onPress={useExample}>
                    <Text style={styles.exampleText}>Bruk eksempelbilde (kun for utvikling)</Text>
                  </Pressable>
                ) : null}
              </View>
            )}

            <Text style={styles.label}>Du kan også skrive en melding:</Text>
            <TextInput
              style={styles.messageInput}
              value={message}
              onChangeText={setMessage}
              placeholder={MESSAGE_PLACEHOLDER}
              placeholderTextColor={colors.inkFaint}
              multiline
              textAlignVertical="top"
              accessibilityLabel="Melding til familien"
            />
          </View>
        ) : null}

        {step === 2 ? (
          <View>
            <Text style={styles.stepTitle}>Hvem vil du spørre?</Text>
            <Text style={styles.stepHelp}>Velg en du stoler på.</Text>

            {relatives.map((m) => {
              const u = userById(m.userId);
              if (!u) return null;
              const selected = contactId === u.id;
              return (
                <Pressable
                  key={m.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${u.name}, ${m.relationship}`}
                  style={[styles.contact, selected && styles.contactSelected]}
                  onPress={() => setContactId(u.id)}
                >
                  <Avatar name={u.name} size={56} />
                  <View style={styles.contactBody}>
                    <Text style={styles.contactName}>{u.name}</Text>
                    <Text style={styles.contactRel}>{m.relationship}</Text>
                  </View>
                  {m.isPrimaryContact ? <Text style={styles.primaryTag}>Fast kontakt</Text> : null}
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {step === 3 ? (
          <View>
            <Text style={styles.stepTitle}>Se over og send</Text>
            <Text style={styles.stepHelp}>{contactName} får dette og svarer deg.</Text>

            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.photo} resizeMode="cover" />
            ) : null}

            {message.trim() ? (
              <Card style={{ marginTop: spacing(3) }}>
                <Text style={styles.messagePreview}>«{message.trim()}»</Text>
              </Card>
            ) : null}

            <Card style={{ marginTop: spacing(3) }}>
              <Text style={styles.sendTo}>
                Sendes til <Text style={styles.bold}>{contactName}</Text>
              </Text>
            </Card>

            {sendError ? <Text style={styles.sendError}>{sendError}</Text> : null}
          </View>
        ) : null}
      </ScrollView>

      {/* Fast handlingsfelt nederst (F-005): tydelig adskilt fra innholdet. */}
      <View style={styles.footer}>
        {sending ? (
          <View style={styles.sendingBox}>
            <ActivityIndicator color={colors.brand} />
            <Text style={styles.sendingText}>Sender …</Text>
          </View>
        ) : step === 3 ? (
          <BigButton
            icon="📨"
            label={sendError ? 'PRØV IGJEN' : 'SEND TIL FAMILIEN'}
            variant="primary"
            onPress={() => void send()}
            style={styles.footerButton}
          />
        ) : (
          <BigButton label="Neste" variant="primary" compact onPress={next} style={styles.footerButton} />
        )}
        <Pressable style={styles.back} onPress={prev} accessibilityRole="button" accessibilityLabel="Tilbake">
          <Text style={styles.backText}>‹ Tilbake</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flow: { flex: 1, backgroundColor: colors.bgScreen },
  flowScroll: { flex: 1 },
  flowContent: { padding: spacing(5), paddingBottom: spacing(6) },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing(5),
    paddingTop: spacing(4),
    paddingBottom: spacing(5),
  },
  footerButton: { marginBottom: spacing(2) },

  steps: { flexDirection: 'row', gap: spacing(2), marginBottom: spacing(5) },
  step: { flex: 1, height: 8, borderRadius: 4, backgroundColor: colors.line },
  stepDone: { backgroundColor: colors.brand },

  stepTitle: { fontSize: fontSize.title, fontWeight: '800', color: colors.ink, marginBottom: spacing(1.5) },
  stepHelp: { fontSize: fontSize.body, color: colors.inkSoft, marginBottom: spacing(5), lineHeight: 28 },

  label: {
    fontSize: fontSize.body,
    fontWeight: '700',
    color: colors.ink,
    marginTop: spacing(4),
    marginBottom: spacing(2),
  },
  messageInput: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.m,
    padding: spacing(4),
    fontSize: fontSize.body,
    color: colors.ink,
    backgroundColor: colors.surface,
    minHeight: 110,
    lineHeight: 28,
  },
  messagePreview: { fontSize: fontSize.lg, color: colors.ink, lineHeight: 28 },

  photo: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: radius.m,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  caption: { textAlign: 'center', color: colors.inkFaint, fontSize: fontSize.sm, marginTop: spacing(2) },

  retake: {
    borderWidth: 2,
    borderColor: colors.brand,
    borderRadius: radius.m,
    paddingVertical: spacing(4),
    alignItems: 'center',
    marginTop: spacing(3),
  },
  retakeText: { color: colors.brandDark, fontSize: fontSize.lg, fontWeight: '700' },

  galleryLink: { alignItems: 'center', paddingVertical: spacing(3) },
  galleryLinkText: {
    color: colors.brandDark,
    fontSize: fontSize.md,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  exampleLink: { alignItems: 'center', paddingVertical: spacing(2) },
  exampleText: { color: colors.inkFaint, fontSize: fontSize.sm, textDecorationLine: 'underline' },

  contact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(4),
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.line,
    borderRadius: radius.m,
    padding: spacing(4),
    marginBottom: spacing(3.5),
  },
  contactSelected: { borderColor: colors.brand, backgroundColor: colors.brandSoft },
  contactBody: { flex: 1 },
  contactName: { fontSize: fontSize.body, fontWeight: '700', color: colors.ink },
  contactRel: { fontSize: fontSize.md, color: colors.inkSoft },
  primaryTag: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.brandDark,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.brandSoft,
    paddingHorizontal: spacing(2.5),
    paddingVertical: spacing(1),
    borderRadius: radius.l,
    overflow: 'hidden',
  },

  sendTo: { fontSize: fontSize.lg, color: colors.ink, textAlign: 'center' },
  bold: { fontWeight: '800' },

  sendError: {
    fontSize: fontSize.md,
    color: colors.attention,
    textAlign: 'center',
    marginTop: spacing(3),
    lineHeight: 26,
  },
  sendingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing(3),
    paddingVertical: spacing(5),
  },
  sendingText: { fontSize: fontSize.body, fontWeight: '700', color: colors.brandDark },

  back: { alignItems: 'center', paddingVertical: spacing(2) },
  backText: { color: colors.brandDark, fontSize: fontSize.lg, fontWeight: '600' },

  confirmScreen: { flexGrow: 1, justifyContent: 'center' },
  confirmWrap: { alignItems: 'center', paddingVertical: spacing(6) },
  check: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: colors.calmGreenSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing(5),
  },
  checkMark: { fontSize: 56, color: colors.calmGreen, fontWeight: '800' },
  confirmTitle: { fontSize: fontSize.title, fontWeight: '800', color: colors.ink, marginBottom: spacing(4) },
  waitBox: {
    backgroundColor: colors.calmGreenSoft,
    borderRadius: radius.m,
    padding: spacing(5),
    marginBottom: spacing(5),
    width: '100%',
  },
  waitText: {
    fontSize: fontSize.body,
    fontWeight: '800',
    color: colors.ink,
    textAlign: 'center',
    lineHeight: 30,
  },
  help: { fontSize: fontSize.body, color: colors.inkSoft, textAlign: 'center', marginBottom: spacing(6), lineHeight: 28 },
  imageWarn: {
    fontSize: fontSize.md,
    color: colors.inkSoft,
    textAlign: 'center',
    marginBottom: spacing(4),
    lineHeight: 24,
  },
});
