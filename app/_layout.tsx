import {
  Nunito_400Regular,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/nunito';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useAppStore } from '@/store/useAppStore';
import { colors, fontFamily } from '@/theme/theme';

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

type TextWithDefaultProps = typeof Text & {
  defaultProps?: {
    style?: unknown;
  };
};

let defaultTextFontApplied = false;

function applyDefaultTextFont() {
  if (defaultTextFontApplied) return;

  const text = Text as TextWithDefaultProps;
  text.defaultProps = text.defaultProps ?? {};
  text.defaultProps.style = [text.defaultProps.style, { fontFamily: fontFamily.regular }];
  defaultTextFontApplied = true;
}

/**
 * Rot-oppsett. Starter auth-livssyklusen én gang. Callback-ruten
 * (app/auth-callback.tsx) fullfører magisk lenke. Logoen vises i hver Stack
 * sitt header (via HeaderTitle) og som visuelt anker på sign-in/onboarding.
 */
export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  if (fontsLoaded) {
    applyDefaultTextFont();
  }

  useEffect(() => {
    void useAppStore.getState().init();
  }, []);

  useEffect(() => {
    if (fontsLoaded) void SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

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
