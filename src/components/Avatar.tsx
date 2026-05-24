import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/theme';

interface AvatarProps {
  name: string;
  size?: number;
  /** Lys variant for bruk på farget bakgrunn. */
  onDark?: boolean;
}

/** Rund initial-avatar. */
export function Avatar({ name, size = 56, onDark = false }: AvatarProps) {
  return (
    <View
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: onDark ? 'rgba(255,255,255,0.22)' : colors.brand,
        },
      ]}
    >
      <Text style={[styles.letter, { fontSize: size * 0.42 }]}>
        {name.charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
  letter: { color: colors.white, fontWeight: '800' },
});
