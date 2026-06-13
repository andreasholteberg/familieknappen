import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Pressable, StyleSheet, Text } from 'react-native';

import { useAppStore } from '@/store/useAppStore';
import { colors, fontSize, radius, spacing } from '@/theme/theme';

/**
 * «Logg ut» i topplinjen. Avslutter Supabase-økten; auth-gaten (app/index.tsx)
 * sender deg deretter til innloggingsskjermen.
 */
export function RoleSwitchButton() {
  const router = useRouter();
  const signOut = useAppStore((s) => s.signOut);

  const handleSignOut = () => {
    // Vern mot feiltrykk (F-066): en utlogget senior trenger hjelp for å
    // komme inn igjen, så vi bekrefter alltid først.
    Alert.alert('Vil du logge ut?', 'Du trenger en ny kode på e-post for å logge inn igjen.', [
      { text: 'Bli innlogget', style: 'cancel' },
      {
        text: 'Logg ut',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            await signOut();
            router.replace('/');
          })();
        },
      },
    ]);
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Logg ut"
      onPress={handleSignOut}
      style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
      hitSlop={8}
    >
      <Text style={styles.text}>Logg ut</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingVertical: spacing(1.5),
    paddingHorizontal: spacing(3),
    borderRadius: radius.s,
    backgroundColor: colors.surfaceSoft,
  },
  pressed: { opacity: 0.7 },
  text: { color: colors.brandDark, fontWeight: '700', fontSize: fontSize.sm },
});
