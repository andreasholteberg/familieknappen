/**
 * Datamodell for Familieknappen.
 *
 * Modellen følger styringsdokumentet (kap. 8) og dekker både MVP-flyten og
 * fremtidige moduler (eskalering, samtykke, varsling, historikk). Dataene
 * hentes fra Supabase via service-laget (src/services).
 */

export type UserRole = 'senior' | 'relative';

/** Pårørendes rolle i en familiegruppe (styringsdokument 4.2). */
export type MemberRole = 'primary' | 'secondary' | 'observer';

/**
 * Livssyklus for en forespørsel (styringsdokument 5.1.3).
 * MVP bruker primært CREATED → SENT → DELIVERED → VIEWED → ANSWERED → CLOSED.
 * ESCALATED er forberedt for eskaleringsmotoren (5.2).
 */
export type RequestStatus =
  | 'CREATED'
  | 'SENT'
  | 'DELIVERED'
  | 'VIEWED'
  | 'ANSWERED'
  | 'ESCALATED'
  | 'CLOSED';

/** Forhåndsdefinerte hurtigsvar + fritekst (styringsdokument 5.3). */
export type ResponseType = 'do_not_reply' | 'looks_ok' | 'calling_you' | 'custom';

export type NotificationPriority = 'normal' | 'high';
export type NotificationStatus = 'queued' | 'sent' | 'delivered' | 'failed';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  phone?: string;
  email?: string;
  /** Om brukeren deler aktivitetsstatus med gruppa (samtykke). */
  activitySharingEnabled?: boolean;
  createdAt: string;
}

export interface FamilyGroup {
  id: string;
  name: string;
  createdAt: string;
}

export interface FamilyMember {
  id: string;
  groupId: string;
  userId: string;
  /** Fritekst-relasjon vist i UI, f.eks. «Datter», «Sønn». */
  relationship: string;
  memberRole: MemberRole;
  isPrimaryContact: boolean;
  createdAt: string;
}

export interface HelpRequest {
  id: string;
  seniorId: string;
  groupId: string;
  /** Hvem forespørselen først ble sendt til (primærkontakt som standard). */
  recipientId: string;
  /** Lokal bilde-URI i MVP; blir Supabase Storage-URL senere. */
  imageUri?: string;
  message: string;
  status: RequestStatus;
  createdAt: string;
  deliveredAt?: string;
  viewedAt?: string;
  answeredAt?: string;
  escalatedAt?: string;
  closedAt?: string;
  /** Hvorvidt senior har sett svaret (driver «nytt svar»-kortet på hjem). */
  seenBySenior?: boolean;
  /** Når senior eksplisitt kvitterte med «Jeg har sett svaret» (F-021). */
  acknowledgedAt?: string;
}

export interface HelpResponse {
  id: string;
  requestId: string;
  relativeId: string;
  responseType: ResponseType;
  /** Fritekst (valgfritt for hurtigsvar, brukes for type 'custom'). */
  responseText?: string;
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  seniorId: string;
  createdBy: string;
  title: string;
  description?: string;
  /** ISO-dato, f.eks. '2026-05-21'. */
  date: string;
  /** 'HH:mm'. */
  time: string;
  /** Forberedt for gjentakelser (styringsdokument 5.6.1). */
  recurrence?: 'none' | 'daily' | 'weekly';
  createdAt: string;
}

export interface ActivityStatus {
  seniorId: string;
  lastSeenAt: string;
  lastAppOpenedAt: string;
  updatedAt: string;
}

/** Samtykkeregister (styringsdokument 5.9 / datamodell ConsentRecords). */
export interface ConsentRecord {
  id: string;
  seniorId: string;
  grantedToUserId: string;
  /** Hva som deles, f.eks. 'help_requests' | 'calendar' | 'activity'. */
  scope: string;
  grantedAt: string;
  revokedAt?: string;
}

/** Varslingsobjekt (styringsdokument 5.4). I MVP kun in-app/logget. */
export interface AppNotification {
  id: string;
  recipientUserId: string;
  requestId?: string;
  title: string;
  body: string;
  priority: NotificationPriority;
  status: NotificationStatus;
  createdAt: string;
}

/** Innstillinger for familiegruppen (varsling m.m.). */
export interface GroupSettings {
  notifyPush: boolean;
  notifySms: boolean;
  primaryContactUserId: string;
  /** Minutter før eskalering ved manglende svar (styringsdokument 5.2.2). */
  escalationDelayMinutes: number;
}

/** Etiketter og tone for hurtigsvar – brukt i UI. */
export interface ResponseMeta {
  short: string;
  big: string;
  tone: 'attention' | 'ok' | 'neutral';
}

export const RESPONSE_META: Record<ResponseType, ResponseMeta> = {
  do_not_reply: {
    short: 'Ikke svar på dette',
    big: 'Ikke svar på denne meldingen',
    tone: 'attention',
  },
  looks_ok: {
    short: 'Dette ser greit ut',
    big: 'Dette ser greit ut',
    tone: 'ok',
  },
  calling_you: {
    short: 'Jeg ringer deg',
    big: 'Jeg ringer deg nå',
    tone: 'neutral',
  },
  custom: {
    short: 'Svar',
    big: '',
    tone: 'neutral',
  },
};

/** Rolle en invitasjon kan tildele (aldri primærkontakt – settes separat). */
export type InvitedRole = 'senior' | 'primary_contact' | 'secondary_contact';

/** Invitasjon til en familiegruppe (Lag 4/5). */
export interface GroupInvitation {
  id: string;
  groupId: string;
  invitedEmail: string;
  invitedRole: InvitedRole;
  token: string;
  expiresAt: string;
  acceptedAt?: string;
  revokedAt?: string;
  createdBy?: string;
  createdAt: string;
  status: 'pending' | 'accepted' | 'revoked' | 'expired';
}
