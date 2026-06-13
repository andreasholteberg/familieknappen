/**
 * Bildevalg via expo-image-picker, med trygg fallback og nedskalering.
 *
 * Senior skal kunne ta bilde (kamera) eller velge et eksisterende bilde. Hvis
 * kameraet ikke er tilgjengelig eller tillatelse avslås, returnerer vi `null`,
 * og UI-et viser en placeholder i stedet for å blokkere flyten.
 *
 * Lagringsoptimalisering: bilder nedskaleres til maks 1280 px bredde før
 * opplasting (~150–300 KB i stedet for 1–3 MB). Feiler nedskaleringen,
 * brukes originalbildet – flyten skal aldri stoppe på grunn av dette.
 */

import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

const MAX_WIDTH = 1280;
const COMPRESS = 0.6;

async function downscale(asset: ImagePicker.ImagePickerAsset): Promise<string> {
  try {
    if (!asset.width || asset.width <= MAX_WIDTH) return asset.uri;
    const result = await ImageManipulator.manipulateAsync(
      asset.uri,
      [{ resize: { width: MAX_WIDTH } }],
      { compress: COMPRESS, format: ImageManipulator.SaveFormat.JPEG },
    );
    return result.uri || asset.uri;
  } catch {
    return asset.uri;
  }
}

export async function takePhoto(): Promise<string | null> {
  try {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return null;
    const result = await ImagePicker.launchCameraAsync({ quality: 0.6 });
    if (result.canceled || result.assets.length === 0) return null;
    return downscale(result.assets[0]);
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
    return downscale(result.assets[0]);
  } catch {
    return null;
  }
}
