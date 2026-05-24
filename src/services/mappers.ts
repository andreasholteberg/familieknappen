/**
 * Oversettelse mellom database-rader (snake_case, DB-enums) og appens
 * domenemodeller (camelCase – brukt av skjermene). Holder skjermene uendret
 * når datakilden byttes fra mock til Supabase.
 */

import type { Tables } from '@/types/database.types';
import type {
  ActivityStatus,
  CalendarEvent,
  FamilyGroup,
  FamilyMember,
  GroupInvitation,
  HelpRequest,
  HelpResponse,
  MemberRole,
  ResponseType,
  User,
} from '@/types/models';

/* ---------------- enum-oversettelser ---------------- */

const MEMBER_ROLE_TO_DOMAIN: Record<Tables<'family_members'>['member_role'], MemberRole> = {
  primary_contact: 'primary',
  secondary_contact: 'secondary',
  senior: 'observer',
};

export function quickReplyToResponseType(
  q: Tables<'help_responses'>['quick_reply_type'],
): ResponseType {
  switch (q) {
    case 'DO_NOT_REPLY':
      return 'do_not_reply';
    case 'LOOKS_OK':
      return 'looks_ok';
    case 'I_WILL_CALL':
      return 'calling_you';
    default:
      return 'custom';
  }
}

export function responseTypeToQuickReply(
  t: ResponseType,
): Tables<'help_responses'>['quick_reply_type'] {
  switch (t) {
    case 'do_not_reply':
      return 'DO_NOT_REPLY';
    case 'looks_ok':
      return 'LOOKS_OK';
    case 'calling_you':
      return 'I_WILL_CALL';
    default:
      return null; // 'custom' → kun fritekst
  }
}

/* ---------------- dato/tid (lokal tz) ---------------- */

const pad = (n: number): string => String(n).padStart(2, '0');

/** ISO timestamp → lokal dato «YYYY-MM-DD». */
export function localDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** ISO timestamp → lokal tid «HH:mm». */
export function localTime(iso: string): string {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Lokal dato «YYYY-MM-DD» + tid «HH:mm» → ISO timestamp (UTC). */
export function dateTimeToISO(date: string, time: string): string {
  // «2026-05-21T13:00» tolkes som lokal tid av Date-konstruktøren.
  return new Date(`${date}T${time}:00`).toISOString();
}

/* ---------------- rad → domene ---------------- */

export function toUser(r: Tables<'profiles'>): User {
  return {
    id: r.id,
    name: r.name,
    role: r.role,
    phone: r.phone ?? undefined,
    email: r.email ?? undefined,
    activitySharingEnabled: r.activity_sharing_enabled,
    createdAt: r.created_at,
  };
}

export function toFamilyGroup(r: Tables<'family_groups'>): FamilyGroup {
  return { id: r.id, name: r.name, createdAt: r.created_at };
}

export function toFamilyMember(r: Tables<'family_members'>): FamilyMember {
  return {
    id: r.id,
    groupId: r.group_id,
    userId: r.user_id,
    relationship: r.relationship ?? '',
    memberRole: MEMBER_ROLE_TO_DOMAIN[r.member_role],
    isPrimaryContact: r.member_role === 'primary_contact',
    createdAt: r.created_at,
  };
}

export function toHelpRequest(r: Tables<'help_requests'>, imageUri?: string): HelpRequest {
  return {
    id: r.id,
    seniorId: r.senior_id,
    groupId: r.family_group_id,
    recipientId: r.recipient_id ?? '',
    imageUri,
    message: r.message ?? '',
    status: r.status,
    createdAt: r.created_at,
    deliveredAt: r.delivered_at ?? undefined,
    viewedAt: r.viewed_at ?? undefined,
    answeredAt: r.answered_at ?? undefined,
    escalatedAt: r.escalated_at ?? undefined,
    closedAt: r.closed_at ?? undefined,
    seenBySenior: r.seen_by_senior,
  };
}

export function toHelpResponse(r: Tables<'help_responses'>): HelpResponse {
  return {
    id: r.id,
    requestId: r.help_request_id,
    relativeId: r.responder_id,
    responseType: quickReplyToResponseType(r.quick_reply_type),
    responseText: r.free_text ?? undefined,
    createdAt: r.created_at,
  };
}

export function toCalendarEvent(r: Tables<'calendar_events'>, seniorId: string): CalendarEvent {
  return {
    id: r.id,
    seniorId,
    createdBy: r.created_by ?? '',
    title: r.title,
    description: r.description ?? undefined,
    date: localDate(r.start_time),
    time: localTime(r.start_time),
    recurrence: 'none',
    createdAt: r.created_at,
  };
}

export function toActivityStatus(r: Tables<'activity_status'>): ActivityStatus {
  return {
    seniorId: r.user_id,
    lastSeenAt: r.last_seen_at,
    lastAppOpenedAt: r.last_seen_at,
    updatedAt: r.updated_at,
  };
}

export function toGroupInvitation(r: Tables<'group_invitations'>): GroupInvitation {
  const status: GroupInvitation['status'] = r.revoked_at
    ? 'revoked'
    : r.accepted_at
      ? 'accepted'
      : new Date(r.expires_at).getTime() <= Date.now()
        ? 'expired'
        : 'pending';
  return {
    id: r.id,
    groupId: r.family_group_id,
    invitedEmail: r.invited_email,
    invitedRole: r.invited_role,
    token: r.token,
    expiresAt: r.expires_at,
    acceptedAt: r.accepted_at ?? undefined,
    revokedAt: r.revoked_at ?? undefined,
    createdBy: r.created_by ?? undefined,
    createdAt: r.created_at,
    status,
  };
}
