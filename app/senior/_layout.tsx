import { Stack } from 'expo-router';
import React from 'react';

import { HeaderTitle } from '@/components/HeaderTitle';
import { RoleSwitchButton } from '@/components/RoleSwitchButton';
import { colors } from '@/theme/theme';

/** Seniorens navigasjonsstabel – rolig, lys topplinje med logo + stor tittel. */
export default function SeniorLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.bgScreen },
        headerShadowVisible: false,
        headerTintColor: colors.brandDark,
        headerTitle: ({ children }) => <HeaderTitle variant="senior">{children}</HeaderTitle>,
        headerBackTitle: 'Tilbake',
        headerRight: () => <RoleSwitchButton />,
        contentStyle: { backgroundColor: colors.bgScreen },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Familieknappen', headerBackVisible: false }} />
      <Stack.Screen name="ask" options={{ title: 'Spør familien' }} />
      <Stack.Screen name="answer" options={{ title: 'Svar fra familien' }} />
      <Stack.Screen name="call" options={{ title: 'Ring familien' }} />
      <Stack.Screen name="day" options={{ title: 'Min dag' }} />
      <Stack.Screen name="privacy" options={{ title: 'Personvern' }} />
    </Stack>
  );
}
