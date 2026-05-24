import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
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

const DEFAULT_MESSAGE = 'Er denne meldingen ekte?';

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

export default function AskFamily() {
  const router = useRouter();
  const relatives = useAppStore(useShallow(selectRelativeMembers));
  const users = useAppStore((s) => s.users);
  const primary = useAppStore(selectPrimaryContact);
  const createHelpRequest = useAppStore((s) => s.createHelpRequest);

  const [step, setStep] = useState(1);
  const [hasPhoto, setHasPhoto] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [contactId, setContactId] = useState<string | undefined>(primary?.id);
  const [sentToName, setSentToName] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [imageFailed, setImageFailed] = useState(false);

  const userById = (id?: string) => users.find((u) => u.id === id);

  const handleTake = async () => {
    const uri = await takePhoto();
    if (uri) {
      setImageUri(uri);
      setHasPhoto(true);
    } else {
      Alert.alert(
        'Fikk ikke åpnet kameraet',
        'Du kan velge et bilde fra telefonen i stedet.',
      );
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
    if (step === 1 && !hasPhoto) {
      Alert.alert('Ta et bilde først', 'Ta bilde av meldingen du lurer på.');
      return;
    }
    setStep((s) => Math.min(3, s + 1));
  };
  const prev = () => {
    if (step === 1) router.back();
    else setStep((s) => s - 1);
  };

  const send = async () => {
    if (!contactId) {
      Alert.alert('Velg hvem du vil spørre', 'Gå tilbake og velg en i familien først.');
      setStep(2);
      return;
    }
    setSending(true);
    setSendError(null);
    const result = await createHelpRequest({
      recipientId: contactId,
      message: DEFAULT_MESSAGE,
      imageUri: imageUri ?? undefined,
    });
    setSending(false);
    if (!result.ok) {
      setSendError('Vi fikk ikke sendt forespørselen. Sjekk at du har internett, og prøv igjen.');
      return;
    }
    setImageFailed(!!result.imageFailed);
    setSentToName(userById(contactId)?.name ?? 'familien');
    setStep(4);
  };

  /* ---------- Bekreftelse (etter sending) ---------- */
  if (step === 4) {
    return (
      <Screen>
        <View style={styles.confirmWrap}>
          <View style={styles.check}>
            <Text style={styles.checkMark}>✓</Text>
          </View>
          <Text style={styles.confirmTitle}>Sendt til {sentToName}</Text>
          <View style={styles.waitBox}>
            <Text style={styles.waitText}>Vent på svar før du gjør noe. 🙏</Text>
          </View>
          <Text style={styles.help}>
            Du får beskjed her når {sentToName} har svart. Du trenger ikke gjøre noe nå.
          </Text>
          {imageFailed ? (
            <Text style={styles.imageWarn}>
              Vi sendte spørsmålet ditt, men fikk ikke med bildet. Det går fint – {sentToName} kan ringe deg om noe er uklart.
            </Text>
          ) : null}
          <BigButton label="Tilbake til hjem" variant="day" compact onPress={() => router.replace('/senior')} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <Steps step={step} />

      {step === 1 ? (
        <View>
          <Text style={styles.stepTitle}>Trinn 1: Ta bilde</Text>
          <Text style={styles.stepHelp}>
            Ta et bilde av meldingen, brevet eller skjermen du lurer på.
          </Text>

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
              <BigButton label="Neste →" variant="primary" compact onPress={next} />
            </View>
          ) : (
            <View>
              <BigButton icon="📷" label="Ta bilde" variant="primary" onPress={handleTake} />
              <BigButton icon="🖼️" label="Velg bilde" variant="day" onPress={handlePick} />
              {__DEV__ ? (
                <Pressable style={styles.exampleLink} onPress={useExample}>
                  <Text style={styles.exampleText}>Bruk eksempelbilde (kun for utvikling)</Text>
                </Pressable>
              ) : null}
            </View>
          )}
        </View>
      ) : null}

      {step === 2 ? (
        <View>
          <Text style={styles.stepTitle}>Trinn 2: Hvem vil du spørre?</Text>
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
                {m.isPrimaryContact ? (
                  <Text style={styles.primaryTag}>Fast kontakt</Text>
                ) : null}
              </Pressable>
            );
          })}

          <BigButton label="Neste →" variant="primary" compact onPress={next} style={{ marginTop: spacing(2) }} />
        </View>
      ) : null}

      {step === 3 ? (
        <View>
          <Text style={styles.stepTitle}>Trinn 3: Send</Text>
          <Text style={styles.stepHelp}>
            Vi sender bildet til {userById(contactId)?.name}. {userById(contactId)?.name} ser på det og svarer deg.
          </Text>

          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.photo} resizeMode="cover" />
          ) : (
            <SmsPreview />
          )}

          <Card style={{ marginTop: spacing(3) }}>
            <Text style={styles.sendTo}>
              Sendes til <Text style={styles.bold}>{userById(contactId)?.name}</Text>
            </Text>
          </Card>

          {sendError ? <Text style={styles.sendError}>{sendError}</Text> : null}
          {sending ? (
            <View style={styles.sendingBox}>
              <ActivityIndicator color={colors.brand} />
              <Text style={styles.sendingText}>Sender …</Text>
            </View>
          ) : (
            <BigButton
              icon="📨"
              label={sendError ? 'Prøv å sende igjen' : `Send til ${userById(contactId)?.name ?? 'familien'}`}
              variant="primary"
              onPress={send}
            />
          )}
        </View>
      ) : null}

      <Pressable style={styles.back} onPress={prev}>
        <Text style={styles.backText}>‹ Tilbake</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  steps: { flexDirection: 'row', gap: spacing(2), marginBottom: spacing(5) },
  sendError: { fontSize: fontSize.md, color: colors.attention, textAlign: 'center', marginBottom: spacing(3), lineHeight: 26 },
  sendingBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing(3), paddingVertical: spacing(5) },
  sendingText: { fontSize: fontSize.body, fontWeight: '700', color: colors.brandDark },
  imageWarn: { fontSize: fontSize.md, color: colors.inkSoft, textAlign: 'center', marginBottom: spacing(4), lineHeight: 24 },
  step: { flex: 1, height: 8, borderRadius: 4, backgroundColor: colors.line },
  stepDone: { backgroundColor: colors.brand },

  stepTitle: { fontSize: fontSize.title, fontWeight: '800', color: colors.ink, marginBottom: spacing(1.5) },
  stepHelp: { fontSize: fontSize.body, color: colors.inkSoft, marginBottom: spacing(5), lineHeight: 28 },

  photo: { width: '100%', aspectRatio: 3 / 4, borderRadius: radius.m, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  caption: { textAlign: 'center', color: colors.inkFaint, fontSize: fontSize.sm, marginTop: spacing(2) },

  retake: {
    borderWidth: 2,
    borderColor: colors.brand,
    borderRadius: radius.m,
    paddingVertical: spacing(4),
    alignItems: 'center',
    marginTop: spacing(3),
    marginBottom: spacing(3),
  },
  retakeText: { color: colors.brandDark, fontSize: fontSize.lg, fontWeight: '700' },

  exampleLink: { alignItems: 'center', paddingVertical: spacing(3) },
  exampleText: { color: colors.brandDark, fontSize: fontSize.md, fontWeight: '600', textDecorationLine: 'underline' },

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

  back: { alignItems: 'center', paddingVertical: spacing(4), marginTop: spacing(2) },
  backText: { color: colors.brandDark, fontSize: fontSize.lg, fontWeight: '600' },

  confirmWrap: { alignItems: 'center', paddingVertical: spacing(6) },
  check: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: colors.calmGreenSoft,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing(5),
  },
  checkMark: { fontSize: 48, color: colors.calmGreen, fontWeight: '800' },
  confirmTitle: { fontSize: fontSize.title, fontWeight: '800', color: colors.ink, marginBottom: spacing(4) },
  waitBox: {
    backgroundColor: colors.brandSoft,
    borderRadius: radius.m,
    padding: spacing(5),
    marginBottom: spacing(5),
    width: '100%',
  },
  waitText: { fontSize: fontSize.body, fontWeight: '700', color: colors.brandDark, textAlign: 'center', lineHeight: 30 },
  help: { fontSize: fontSize.md, color: colors.inkSoft, textAlign: 'center', marginBottom: spacing(6), lineHeight: 24 },
});
