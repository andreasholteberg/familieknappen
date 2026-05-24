import { Stack } from 'expo-router';
import * as Linking from 'expo-linking';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import * as svc from '@/services';
import { useAppStore } from '@/store/useAppStore';
import { colors } from '@/theme/theme';

/**
 * Rot-oppsett. Starter auth-livssyklusen én gang, og fanger opp deep links fra
 * den magiske lenken (?code=…) for å fullføre innlogging. Nested layouts
 * (senior/ og relative/) styrer egne topplinjer.
 */
export default function RootLayout() {
  const incomingUrl = Linking.useURL();

  useEffect(() => {
    void useAppStore.getState().init();
  }, []);

  useEffect(() => {
    if (!incomingUrl) return;
    svc.auth.completeSignInFromUrl(incomingUrl).catch(() => {
      /* ugyldig/utløpt lenke – brukeren kan be om en ny */
    });
  }, [incomingUrl]);

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
