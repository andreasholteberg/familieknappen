/**
 * Push-registrering (Expo Notifications).
 *
 * Ber om tillatelse, henter Expo push-token og lagrer den i notification_tokens.
 * Alt er ikke-blokkerende: hvis brukeren sier nei, eller token ikke kan hentes
 * (Expo Go / simulator / manglende EAS projectId), returnerer vi null og appen
 * fungerer som før – bare uten push.
 */

import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

/**
 * Vis varsler også når appen er i forgrunnen (F-058 / gammelt funn F10).
 * Kalles én gang fra rot-layout.
 */
export function configureForegroundNotifications(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/** Oversett varsel-data til en rute i appen (deep-link fra varsel). */
export function routeForNotificationData(data: Record<string, unknown> | undefined): string | null {
  const type = typeof data?.type === 'string' ? data.type : null;
  const requestId = typeof data?.helpRequestId === 'string' ? data.helpRequestId : null;
  if ((type === 'help_request' || type === 'escalation') && requestId) {
    return `/relative/request/${requestId}`;
  }
  if (type === 'help_response' && requestId) {
    return `/senior/answer?id=${requestId}`;
  }
  if (type === 'call_alert') return '/';
  return null;
}

function getProjectId(): string | undefined {
  const fromExpo = (Constants.expoConfig as { extra?: { eas?: { projectId?: string } } } | null)?.extra?.eas
    ?.projectId;
  const fromEas = (Constants as unknown as { easConfig?: { projectId?: string } }).easConfig?.projectId;
  return fromExpo ?? fromEas;
}

/**
 * Returnerer Expo push-token ved suksess, ellers null (uten å kaste).
 */
export async function registerForPushNotifications(userId: string): Promise<string | null> {
  try {
    const current = await Notifications.getPermissionsAsync();
    let status = current.status;
    if (status !== 'granted') {
      const requested = await Notifications.requestPermissionsAsync();
      status = requested.status;
    }
    if (status !== 'granted') return null; // brukeren sa nei – helt greit

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Familieknappen',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
      });
    }

    const projectId = getProjectId();
    const tokenResponse = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    const token = tokenResponse.data;
    if (!token) return null;

    const { error } = await supabase.from('notification_tokens').upsert(
      {
        user_id: userId,
        expo_push_token: token,
        platform: Platform.OS,
        updated_at: new Date().toISOString(),
        last_used_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,expo_push_token' },
    );
    if (error) return null;
    return token;
  } catch {
    return null;
  }
}

/** Fjern denne enhetens token (kalles ved utlogging). */
export async function removePushToken(userId: string, token: string): Promise<void> {
  try {
    await supabase
      .from('notification_tokens')
      .delete()
      .eq('user_id', userId)
      .eq('expo_push_token', token);
  } catch {
    /* ignorer – ikke kritisk */
  }
}

/**
 * Varsle hele familien om at noen prøver å ringe (F-029). Best effort:
 * feil svelges hos kalleren – ringingen skal aldri stoppes av dette.
 */
export async function notifyCallAttempt(): Promise<void> {
  const { error } = await supabase.functions.invoke('notify-call');
  if (error) throw error;
}
