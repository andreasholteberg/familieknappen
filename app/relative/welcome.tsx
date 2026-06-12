import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BigButton } from '@/components/BigButton';
import { Screen } from '@/components/Screen';
import { colors, fontSize, radius, spacing } from '@/theme/theme';

/**
 * Onboarding-veiviser for pårørende (F-032): tre korte steg etter at
 * familiegruppen er opprettet. Ingen ny funksjonalitet – bare trygg
 * forklaring av hva man gjør først.
 */
const STEPS = [
  {
    icon: '💙',
    title: 'Velkommen til Familieknappen',
    text:
      'Når noen i familien er usikre på en melding eller et brev, kan de spørre deg før ' +
      'de svarer. Du får beskjed, ser bildet, og svarer med ett trykk.',
  },
  {
    icon: '✉️',
    title: 'Inviter familien først',
    text:
      'Gå til Innstillinger og inviter med e-post eller en 6-sifret paringskode. ' +
      'Velg rollen «Senior» for den som skal ha den enkle utgaven av appen.',
  },
  {
    icon: '📞',
    title: 'Legg inn telefonnummeret ditt',
    text:
      'Med nummeret ditt lagret kan senior ringe deg rett fra appen. ' +
      'Det gjør du også i Innstillinger – det tar ti sekunder.',
  },
];

export default function RelativeWelcome() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const last = step === STEPS.length - 1;

  return (
    <Screen contentStyle={styles.screen}>
      <View style={styles.dots} accessibilityLabel={`Steg ${step + 1} av ${STEPS.length}`}>
        {STEPS.map((_, i) => (
          <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.icon}>{current.icon}</Text>
        <Text style={styles.title}>{current.title}</Text>
        <Text style={styles.text}>{current.text}</Text>
      </View>

      {last ? (
        <>
          <BigButton
            label="Gå til innstillinger"
            variant="primary"
            compact
            onPress={() => router.replace('/relative/settings')}
          />
          <BigButton label="Til oversikten" variant="day" compact onPress={() => router.replace('/relative')} />
        </>
      ) : (
        <BigButton label="Neste" variant="primary" compact onPress={() => setStep(step + 1)} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flexGrow: 1, justifyContent: 'center' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: spacing(2), marginBottom: spacing(5) },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.line },
  dotActive: { backgroundColor: colors.brand },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.l,
    padding: spacing(6),
    alignItems: 'center',
    marginBottom: spacing(5),
  },
  icon: { fontSize: 48, marginBottom: spacing(3) },
  title: { fontSize: fontSize.title, fontWeight: '800', color: colors.ink, textAlign: 'center', marginBottom: spacing(3) },
  text: { fontSize: fontSize.body, color: colors.inkSoft, textAlign: 'center', lineHeight: 30 },
});
