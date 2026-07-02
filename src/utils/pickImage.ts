/**
 * Bildevalg via expo-image-picker, med trygg fallback og metadata-fjerning.
 *
 * Senior skal kunne ta bilde (kamera) eller velge et eksisterende bilde. Hvis
 * kameraet ikke er tilgjengelig eller tillatelse avslås, returnerer vi `null`,
 * og UI-et viser en placeholder i stedet for å blokkere flyten.
 *
 * PERSONVERN: Alle bilder RE-ENKODES til JPEG via expo-image-manipulator før de
 * brukes/lastes opp. Re-enkoding produserer en NY fil uten EXIF/metadata
 * (inkl. GPS og kamerainfo), også når bildet ikke nedskaleres. Original-URI
 * lastes ALDRI opp direkte. Klarer vi ikke re-enkode, returnerer vi `null` i
 * stedet for å laste opp originalen. Nedskalering skjer kun hvis bredde > 1280 px.
 */

import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

const MAX_WIDTH = 1280;
const COMPRESS = 0.6;

/**
 * Re-enkoder bildet til JPEG (fjerner EXIF/metadata) og nedskalerer ved behov.
 * Returnerer URI til den nye, metadata-frie fila – eller `null` ved feil, slik
 * at originalen aldri lastes opp.
 */
async function reencodeStripMetadata(asset: ImagePicker.ImagePickerAsset): Promise<string | null> {
  const actions =
    asset.width && asset.width > MAX_WIDTH ? [{ resize: { width: MAX_WIDTH } }] : [];
  try {
    const result = await ImageManipulator.manipulateAsync(asset.uri, actions, {
      compress: COMPRESS,
      format: ImageManipulator.SaveFormat.JPEG,
    });
    // result.uri er en ny fil uten EXIF. Faller ALDRI tilbake til asset.uri.
    return result.uri || null;
  } catch {
    // Klarte ikke re-enkode → ikke last opp originalen (kan inneholde EXIF/GPS).
    return null;
  }
}

export async function takePhoto(): Promise<string | null> {
  try {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return null;
    const result = await ImagePicker.launchCameraAsync({ quality: 0.6 });
    if (result.canceled || result.assets.length === 0) return null;
    return reencodeStripMetadata(result.assets[0]);
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
    return reencodeStripMetadata(result.assets[0]);
  } catch {
    return null;
  }
}
