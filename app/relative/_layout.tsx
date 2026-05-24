import { Stack } from 'expo-router';
import React from 'react';

import { RoleSwitchButton } from '@/components/RoleSwitchButton';
import { colors } from '@/theme/theme';

/** Pårørendes navigasjonsstabel. Mer informasjonstett enn senior-siden. */
export default function RelativeLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.surface },
        headerShadowVisible: false,
        headerTintColor: colors.brandDark,
        headerTitleStyle: { fontWeight: '700', fontSize: 18 },
        headerBackTitle: 'Tilbake',
        headerRight: () => <RoleSwitchButton />,
        contentStyle: { backgroundColor: colors.bgScreen },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Oversikt', headerBackVisible: false }} />
      <Stack.Screen name="request/[id]" options={{ title: 'Forespørsel' }} />
      <Stack.Screen name="calendar" options={{ title: 'Kalender' }} />
      <Stack.Screen name="event" options={{ title: 'Avtale' }} />
      <Stack.Screen name="history" options={{ title: 'Historikk' }} />
      <Stack.Screen name="settings" options={{ title: 'Innstillinger' }} />
    </Stack>
  );
}
