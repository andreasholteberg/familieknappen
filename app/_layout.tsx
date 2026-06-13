import {
  Nunito_400Regular,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/nunito';
import * as Notifications from 'expo-notifications';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { configureForegroundNotifications, routeForNotificationData } from '@/services/push';
import { useAppStore } from '@/store/useAppStore';
import { colors, fontFamily } from '@/theme/theme';

void SplashScreen.preventAutoHideAsync().catch(() => undefined);
configureForegroundNotifications();

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
 * Rot-oppsett. Starter auth-livssyklusen én gang. Pilotinnloggingen bruker
 * e-postkode, mens callback-ruten beholdes som magic-link-backup. Logoen vises
 * i hver Stack sitt header og som visuelt anker på sign-in/onboarding.
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

  // Deep-link fra push-varsler (F-058): trykk på varsel åpner riktig skjerm.
  useEffect(() => {
    const navigate = (data: Record<string, unknown> | undefined) => {
      const route = routeForNotificationData(data);
      if (route) {
        // Liten utsettelse så auth-gaten rekker å rute først ved kaldstart.
        setTimeout(() => router.push(route as never), 400);
      }
    };

    // Varsel trykket mens appen var lukket (kaldstart).
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) navigate(response.notification.request.content.data as Record<string, unknown>);
    });

    // Varsel trykket mens appen kjører.
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      navigate(response.notification.request.content.data as Record<string, unknown>);
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (fontsLoaded) void SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bgScreen },
          }}
        />
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
