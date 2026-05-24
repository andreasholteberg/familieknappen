import React from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';

import { colors, spacing } from '@/theme/theme';

interface ScreenProps {
  children: React.ReactNode;
  /** Sentrert, scrollbart innhold med rolig bakgrunn. */
  scroll?: boolean;
  contentStyle?: ViewStyle;
}

/** Standard skjermbeholder: rolig bakgrunn, romslig padding, scroll ved behov. */
export function Screen({ children, scroll = true, contentStyle }: ScreenProps) {
  if (scroll) {
    return (
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.content, contentStyle]}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    );
  }
  return <View style={[styles.flex, styles.content, contentStyle]}>{children}</View>;
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bgScreen },
  content: {
    padding: spacing(5),
    paddingBottom: spacing(10),
  },
});
