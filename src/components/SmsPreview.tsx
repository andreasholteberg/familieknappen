import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

import { colors, radius, spacing } from '@/theme/theme';

/**
 * Et enkelt «skjermbilde» av en mistenkelig SMS, tegnet med View/Text.
 * Brukes som realistisk placeholder når det ikke finnes et ekte foto
 * (f.eks. i nettleser-demo der kameraet ikke er tilgjengelig).
 */
export function SmsPreview({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.frame, style]}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Ukjent nummer</Text>
      </View>
      <View style={styles.bubble}>
        <Text style={styles.bubbleText}>
          Pakken din kan ikke leveres. Betal toll på 29 kr for å motta den. Trykk her:
        </Text>
        <Text style={styles.link}>posten-toll-betal.info/xQ7</Text>
      </View>
      <View style={styles.bubble}>
        <Text style={styles.bubbleText}>
          Saken avsluttes om 12 timer hvis betaling ikke mottas.
        </Text>
      </View>
      <View style={styles.inputBar}>
        <Text style={styles.inputText}>Skriv melding …</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: '100%',
    aspectRatio: 3 / 4,
    backgroundColor: '#f1f3f6',
    borderRadius: radius.m,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
    padding: spacing(3),
    justifyContent: 'flex-start',
  },
  header: {
    backgroundColor: colors.white,
    borderRadius: radius.s,
    paddingVertical: spacing(2),
    alignItems: 'center',
    marginBottom: spacing(3),
  },
  headerText: { fontWeight: '700', color: colors.ink },
  bubble: {
    backgroundColor: colors.white,
    borderRadius: radius.m,
    borderWidth: 1,
    borderColor: '#e3e6ea',
    padding: spacing(3),
    marginBottom: spacing(2.5),
    maxWidth: '92%',
  },
  bubbleText: { color: colors.ink, fontSize: 14, lineHeight: 19 },
  link: { color: colors.brand, fontSize: 14, marginTop: spacing(1), textDecorationLine: 'underline' },
  inputBar: {
    marginTop: 'auto',
    backgroundColor: colors.white,
    borderRadius: radius.l,
    borderWidth: 1,
    borderColor: '#e3e6ea',
    paddingVertical: spacing(2.5),
    paddingHorizontal: spacing(3),
  },
  inputText: { color: '#9aa3ad', fontSize: 14 },
});
