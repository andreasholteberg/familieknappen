/**
 * Tier- og funksjonsstyring for Familieknappen.
 *
 * Standardversjonen er en enkel, lavrisiko kommunikasjons- og familieapp.
 * Premium-funksjoner (rikere aktivitetsdeling, automatisk eskalering,
 * videosamtale m.m.) er BEVISST PARKERT og slås på først når et premium-spor
 * lanseres – med egen DPIA og eget samtykke (se Premium_modell_og_tiering).
 *
 * Dette er ett sentralt sted å styre hva som er på. Klientkoden spør
 * `hasFeature(group, '...')`.
 *
 * VIKTIG: dette er kun UI-styring. Funksjoner som rører data må også håndheves
 * server-side (RLS / edge functions) – ellers kan en standardbruker hente
 * premium-data utenom appen.
 */

import type { FamilyGroup } from '@/types/models';

export type Tier = 'standard' | 'premium';

export type FeatureKey =
  // Standard
  | 'askFamily'
  | 'callFamily'
  | 'calendar'
  | 'familyPhotos'
  | 'appUsageIndicator' // «brukt i dag» – nærvær, ikke fravær
  // Premium (parkert)
  | 'timestampedActivity' // «sist aktiv for X», historikk
  | 'autoEscalation' // tidsbasert eskalering ved manglende svar
  | 'videoCall'
  | 'richActivityHistory';

const STANDARD_FEATURES: Record<FeatureKey, boolean> = {
  askFamily: true,
  callFamily: true,
  calendar: true,
  familyPhotos: true,
  appUsageIndicator: true,
  timestampedActivity: false,
  autoEscalation: false,
  videoCall: false,
  richActivityHistory: false,
};

const PREMIUM_FEATURES: Record<FeatureKey, boolean> = {
  ...STANDARD_FEATURES,
  timestampedActivity: true,
  autoEscalation: true,
  videoCall: true,
  richActivityHistory: true,
};

/**
 * Avgjør tier for en gruppe. Premium er foreløpig PARKERT, så denne returnerer
 * alltid 'standard'. Når premium lanseres, utled tier her fra
 * subscriptionStatus (+ et premium-produktflagg) – ett sted å endre.
 */
export function tierForGroup(_group: FamilyGroup | null | undefined): Tier {
  return 'standard';
}

export function featuresForTier(tier: Tier): Record<FeatureKey, boolean> {
  return tier === 'premium' ? PREMIUM_FEATURES : STANDARD_FEATURES;
}

export function hasFeature(group: FamilyGroup | null | undefined, key: FeatureKey): boolean {
  return featuresForTier(tierForGroup(group))[key];
}
