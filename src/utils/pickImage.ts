/**
 * Bildevalg via expo-image-picker, med trygg fallback.
 *
 * Senior skal kunne ta bilde (kamera) eller velge et eksisterende bilde. Hvis
 * kameraet ikke er tilgjengelig (f.eks. i nettleser-demo) eller tillatelse
 * avslås, returnerer vi `null`, og UI-et viser en placeholder i stedet for å
 * blokkere flyten. Kjerneprinsippet er at det aldri skal stoppe opp.
 */

import * as ImagePicker from 'expo-image-picker';

export async function takePhoto(): Promise<string | null> {
  try {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return null;
    const result = await ImagePicker.launchCameraAsync({ quality: 0.6 });
    if (result.canceled || result.assets.length === 0) return null;
    return result.assets[0].uri;
  } catch {
    return null;
  }
}

export async function pickFromLibrary(): Promise<string | null> {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.6,
    });
    if (result.canceled || result.assets.length === 0) return null;
    return result.assets[0].uri;
  } catch {
    return null;
  }
}
