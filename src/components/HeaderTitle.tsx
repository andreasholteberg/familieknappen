import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Logo } from '@/components/Logo';
import { colors } from '@/theme/theme';

interface HeaderTitleProps {
  children?: React.ReactNode;
  variant?: 'senior' | 'relative';
}

/** Header-tittel med logo til venstre. Brukes via Stack screenOptions.headerTitle. */
export function HeaderTitle({ children, variant = 'relative' }: HeaderTitleProps) {
  const fontSize = variant === 'senior' ? 20 : 18;
  return (
    <View style={styles.row}>
      <Logo size={28} />
      <Text numberOfLines={1} style={[styles.text, { fontSize }]}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  text: { color: colors.brandDark, fontWeight: '700', flexShrink: 1 },
});
