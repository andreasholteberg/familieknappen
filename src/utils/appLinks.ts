import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

const GITHUB_PAGES_BASE_PATH = '/familieknappen';

type CreateUrlOptions = Parameters<typeof Linking.createURL>[1];

export function createAppUrl(path: string, options?: CreateUrlOptions): string {
  const url =
    Platform.OS === 'web'
      ? Linking.createURL(path, options)
      : Linking.createURL(path, { ...(options ?? {}), isTripleSlashed: true });

  if (
    Platform.OS !== 'web' ||
    typeof window === 'undefined' ||
    !window.location.pathname.startsWith(GITHUB_PAGES_BASE_PATH)
  ) {
    return url;
  }

  const parsed = new URL(url, window.location.href);
  if (
    parsed.pathname === GITHUB_PAGES_BASE_PATH ||
    parsed.pathname.startsWith(`${GITHUB_PAGES_BASE_PATH}/`)
  ) {
    return parsed.toString();
  }

  parsed.pathname = `${GITHUB_PAGES_BASE_PATH}${parsed.pathname}`;
  return parsed.toString();
}
