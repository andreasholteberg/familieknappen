import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BigButton } from '@/components/BigButton';
import { Screen } from '@/components/Screen';
import { selectPrimaryContact, useAppStore } from '@/store/useAppStore';
import { colors, fontSize, radius, spacing } from '@/theme/theme';

/**
 * Velkomstskjerm for senior etter paring/invitasjon (F-066 / plan § 7.2).
 * Én rolig forklaring – ingen valg å ta stilling til.
 */
export default function SeniorWelcome() {
  const router = useRouter();
  const group = useAppStore((s) => s.group);
  const primary = useAppStore(selectPrimaryContact);

  return (
    <Screen contentStyle={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.icon}>💙</Text>
        <Text style={styles.title}>Du er koblet til {group.name || 'familien din'}</Text>
        <Text style={styles.text}>
          Når du lurer på noe – en melding, et brev, en telefon – trykk «Spør familien».
          {primary ? ` ${primary.name} får beskjed med en gang.` : ' Familien får beskjed med en gang.'}
        </Text>
        <Text style={styles.text}>Vent alltid på svar før du gjør noe.</Text>
      </View>
      <BigButton label="Vis meg appen" variant="primary" onPress={() => router.replace('/senior')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flexGrow: 1, justifyContent: 'center' },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.l,
    padding: spacing(6),
    alignItems: 'center',
    marginBottom: spacing(5),
  },
  icon: { fontSize: 52, marginBottom: spacing(3) },
  title: {
    fontSize: fontSize.title,
    fontWeight: '800',
    color: colors.ink,
    textAlign: 'center',
    marginBottom: spacing(3),
  },
  text: {
    fontSize: fontSize.body,
    color: colors.inkSoft,
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: spacing(2),
  },
});
