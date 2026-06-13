import { Stack } from 'expo-router';
import React from 'react';

import { HeaderTitle } from '@/components/HeaderTitle';
import { RoleSwitchButton } from '@/components/RoleSwitchButton';
import { colors } from '@/theme/theme';

/** Pårørendes navigasjonsstabel. Logo + tittel i headeren. */
export default function RelativeLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.surface },
        headerShadowVisible: false,
        headerTintColor: colors.brandDark,
        headerTitle: ({ children }) => <HeaderTitle variant="relative">{children}</HeaderTitle>,
        headerBackTitle: 'Tilbake',
        headerRight: () => <RoleSwitchButton />,
        contentStyle: { backgroundColor: colors.bgScreen },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Oversikt', headerBackVisible: false }} />
      <Stack.Screen name="request/[id]" options={{ title: 'Forespørsel' }} />
      <Stack.Screen name="photos" options={{ title: 'Bilder fra familien' }} />
      <Stack.Screen name="calendar" options={{ title: 'Kalender' }} />
      <Stack.Screen name="event" options={{ title: 'Avtale' }} />
      <Stack.Screen name="history" options={{ title: 'Historikk' }} />
      <Stack.Screen name="settings" options={{ title: 'Innstillinger' }} />
      <Stack.Screen name="welcome" options={{ title: 'Velkommen', headerBackVisible: false }} />
    </Stack>
  );
}
