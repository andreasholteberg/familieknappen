import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useAppStore } from '@/store/useAppStore';
import { colors } from '@/theme/theme';

/**
 * Rot-oppsett. Starter auth-livssyklusen en gang. Callback-ruten
 * (app/auth-callback.tsx) fullfoerer magisk lenke.
 */
export default function RootLayout() {
  useEffect(() => {
    void useAppStore.getState().init();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bgScreen },
        }}
      />
    </SafeAreaProvider>
  );
}
