import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';

import { colors, fontSize, radius, spacing } from '@/theme/theme';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Error Boundary (F-034): fanger uventede JS-krasj og viser en rolig norsk
 * skjerm i stedet for hvit skjerm. «Prøv igjen» nullstiller grensen slik at
 * appen rendres på nytt. Ingen tekniske detaljer vises til brukeren.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown): void {
    // Holdes lokal og token-fri. Sentralisert logging (Sentry) kommer i F-035.
    // eslint-disable-next-line no-console
    if (__DEV__) console.error('[Familieknappen] Uventet feil:', error);
  }

  private reset = (): void => {
    this.setState({ hasError: false });
  };

  render(): React.ReactNode {
    if (!this.state.hasError) return this.props.children;
    return (
      <View style={styles.center}>
        <Text style={styles.emoji}>🌥️</Text>
        <Text style={styles.title}>Noe gikk galt</Text>
        <Text style={styles.text}>
          Det var ikke din feil. Prøv igjen – det pleier å ordne seg.
        </Text>
        <Pressable accessibilityRole="button" style={styles.btn} onPress={this.reset}>
          <Text style={styles.btnText}>Prøv igjen</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: colors.bgScreen,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing(7),
    gap: spacing(3),
  },
  emoji: { fontSize: 48 },
  title: { fontSize: fontSize.title, fontWeight: '800', color: colors.ink, textAlign: 'center' },
  text: { fontSize: fontSize.body, color: colors.inkSoft, textAlign: 'center', lineHeight: 30 },
  btn: {
    backgroundColor: colors.brand,
    borderRadius: radius.m,
    paddingVertical: spacing(4.5),
    paddingHorizontal: spacing(8),
    marginTop: spacing(3),
  },
  btnText: { color: colors.white, fontSize: fontSize.lg, fontWeight: '800' },
});
