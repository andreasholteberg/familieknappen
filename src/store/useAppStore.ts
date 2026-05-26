/**
 * Global tilstand for Familieknappen (Zustand) – nå koblet på Supabase.
 *
 * Det finnes INGEN mock-fallback. Hvis Supabase ikke er konfigurert kaster
 * klienten (src/lib/supabase.ts), og store-status settes til 'error'.
 *
 * Datakilde: service-laget i src/services/* (komponenter kaller aldri Supabase
 * direkte). Store eksponerer samme offentlige API som før (state + actions +
 * selektorer) slik at skjermene er uendret. Async-handlinger kjøres «fire and
 * forget»: de oppdaterer tilstanden når de er ferdige, og realtime/polling
 * holder lister friske.
 *
 * Sanntid: Supabase Realtime på help_requests/help_responses, med polling
 * (hvert 20. sek) som fallback hvis realtime ikke er aktivt.
 */

import type { RealtimeChannel, Session } from '@supabase/supabase-js';
import { create } from 'zustand';

import * as svc from '@/services';
import type {
  ActivityStatus,
  CalendarEvent,
  ConsentRecord,
  FamilyGroup,
  FamilyMember,
  GroupInvitation,
  GroupSettings,
  HelpRequest,
  HelpResponse,
  InvitedRole,
  ResponseType,
  User,
  UserRole,
} from '@/types/models';

/* ------------------------------------------------------------------ */
/* Modul-nivå (utenfor React): realtime-kanal og polling-timer.        */
/* ------------------------------------------------------------------ */
let channel: RealtimeChannel | null = null;
let pollTimer: ReturnType<typeof setInterval> | null = null;
const POLL_MS = 20_000;
let pushRegistered = false;
let currentPushToken: string | null = null;

const EMPTY_GROUP: FamilyGroup = { id: '', name: '', createdAt: '' };
const nowISO = (): string => new Date().toISOString();
const EMPTY_ACTIVITY: ActivityStatus = {
  seniorId: '',
  lastSeenAt: nowISO(),
  lastAppOpenedAt: nowISO(),
  updatedAt: nowISO(),
};

const DEFAULT_SETTINGS: GroupSettings = {
  notifyPush: true,
  notifySms: false,
  primaryContactUserId: '',
  escalationDelayMinutes: 10,
};

/** Avled enkle samtykker fra medlemskap (ingen egen consents-tabell i MVP). */
function deriveConsents(members: FamilyMember[], users: User[]): ConsentRecord[] {
  const senior = users.find((u) => u.role === 'senior');
  const scopes = ['help_requests', 'calendar', 'activity'];
  return members
    .filter((m) => users.find((u) => u.id === m.userId)?.role === 'relative')
    .flatMap((m) =>
      scopes.map((scope) => ({
        id: `c_${m.userId}_${scope}`,
        seniorId: senior?.id ?? '',
        grantedToUserId: m.userId,
        scope,
        grantedAt: m.createdAt,
      })),
    );
}

export type AppStatus = 'idle' | 'loading' | 'signedOut' | 'ready' | 'error';

interface CreateRequestInput {
  recipientId: string;
  message: string;
  imageUri?: string;
}

interface CreateRequestResult {
  ok: boolean;
  imageFailed?: boolean;
  error?: string;
}

interface RespondInput {
  requestId: string;
  relativeId: string;
  responseType: ResponseType;
  responseText?: string;
}

interface AppState {
  // auth / livssyklus
  status: AppStatus;
  errorMessage: string | null;
  session: Session | null;
  currentUserId: string | null;
  groupId: string | null;
  pushAvailable: boolean | null;

  // data
  users: User[];
  group: FamilyGroup;
  members: FamilyMember[];
  requests: HelpRequest[];
  responses: HelpResponse[];
  events: CalendarEvent[];
  activity: ActivityStatus;
  consents: ConsentRecord[];
  settings: GroupSettings;
  invitations: GroupInvitation[];

  // referanse til siste opprettede forespørsel (bekreftelsesskjerm)
  lastRequestId: string | null;

  // ventende invitasjons-token (settes før login, godtas etter)
  pendingInviteToken: string | null;

  // --- livssyklus-handlinger ---
  init: () => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
  setPendingInviteToken: (token: string | null) => void;
  createGroup: (name: string) => Promise<void>;
  acceptInvite: (token: string) => Promise<{ familyGroupId: string; role: InvitedRole }>;
  createInvite: (input: { email: string; role: 'senior' | 'secondary_contact' }) => Promise<GroupInvitation>;
  loadInvitations: () => Promise<void>;
  revokeInvite: (id: string) => Promise<void>;

  // --- domene-handlinger (uendret API mot skjermene) ---
  touchActivity: () => void;
  createHelpRequest: (input: CreateRequestInput) => Promise<CreateRequestResult>;
  markRequestViewed: (requestId: string) => void;
  respondToRequest: (input: RespondInput) => Promise<void>;
  markAnswerSeen: (requestId: string) => void;
  closeRequest: (requestId: string) => void;
  addEvent: (event: Omit<CalendarEvent, 'id' | 'createdAt'>) => void;
  updateEvent: (id: string, patch: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;
  setPrimaryContact: (userId: string) => void;
  toggleSetting: (key: 'notifyPush' | 'notifySms') => void;
  setActivitySharing: (enabled: boolean) => void;
}

const logError = (where: string, err: unknown): void => {
  // eslint-disable-next-line no-console
  if (__DEV__) console.error(`[Familieknappen] ${where}:`, err);
};

export const useAppStore = create<AppState>((set, get) => ({
  status: 'idle',
  errorMessage: null,
  session: null,
  currentUserId: null,
  groupId: null,
  pushAvailable: null,

  users: [],
  group: EMPTY_GROUP,
  members: [],
  requests: [],
  responses: [],
  events: [],
  activity: EMPTY_ACTIVITY,
  consents: [],
  settings: DEFAULT_SETTINGS,
  invitations: [],

  lastRequestId: null,
  pendingInviteToken: null,

  /* ---------------- livssyklus ---------------- */

  init: async () => {
    if (get().status === 'loading') return;
    set({ status: 'loading', errorMessage: null });
    try {
      // Lytt på auth-endringer (logg inn/ut) gjennom hele appens levetid.
      svc.auth.onAuthStateChange((session) => {
        const had = get().currentUserId;
        set({ session, currentUserId: session?.user.id ?? null });
        if (session?.user.id && session.user.id !== had) {
          void get().refresh();
        } else if (!session) {
          if (channel) svc.realtime.unsubscribe(channel);
          channel = null;
          if (pollTimer) clearInterval(pollTimer);
          pollTimer = null;
          pushRegistered = false;
          currentPushToken = null;
          set({
            status: 'signedOut',
            users: [],
            group: EMPTY_GROUP,
            members: [],
            requests: [],
            responses: [],
            events: [],
            activity: EMPTY_ACTIVITY,
            consents: [],
            invitations: [],
            groupId: null,
            pushAvailable: null,
          });
        }
      });

      const session = await svc.auth.getSession();
      set({ session, currentUserId: session?.user.id ?? null });
      if (!session) {
        set({ status: 'signedOut' });
        return;
      }
      await get().refresh();
    } catch (err) {
      logError('init', err);
      set({ status: 'error', errorMessage: (err as Error)?.message ?? 'Ukjent feil' });
    }
  },

  signOut: async () => {
    const uid = get().currentUserId;
    if (uid && currentPushToken) {
      try {
        await svc.push.removePushToken(uid, currentPushToken);
      } catch (err) {
        logError('removePushToken', err);
      }
    }
    currentPushToken = null;
    pushRegistered = false;
    try {
      await svc.auth.signOut();
    } catch (err) {
      logError('signOut', err);
    }
    // Øvrig opprydding skjer i onAuthStateChange-callbacken.
  },

  refresh: async () => {
    const userId = get().currentUserId;
    if (!userId) return;
    try {
      const groupId = get().groupId ?? (await svc.group.getMyGroupId(userId));
      if (!groupId) {
        // Bruker uten gruppe ennå (f.eks. nyopprettet konto).
        set({ status: 'ready', groupId: null });
        return;
      }

      const ctx = await svc.group.loadGroupContext(groupId);
      const senior = ctx.users.find((u) => u.role === 'senior');
      const seniorId = senior?.id ?? userId;

      const [requests, events, activity] = await Promise.all([
        svc.helpRequests.listRequests(groupId),
        svc.calendar.listEvents(groupId, seniorId),
        svc.activity.getActivity(seniorId),
      ]);
      const responses = await svc.helpResponses.listResponses(requests.map((r) => r.id));

      const primary = ctx.members.find((m) => m.isPrimaryContact) ?? ctx.members.find((m) => {
        return ctx.users.find((u) => u.id === m.userId)?.role === 'relative';
      });

      set((s) => ({
        status: 'ready',
        groupId,
        users: ctx.users,
        group: ctx.group,
        members: ctx.members,
        requests,
        responses,
        events,
        activity: activity ?? { ...EMPTY_ACTIVITY, seniorId },
        consents: deriveConsents(ctx.members, ctx.users),
        settings: { ...s.settings, primaryContactUserId: primary?.userId ?? '' },
      }));

      // Realtime + polling-fallback (sett opp én gang per gruppe).
      if (!channel) {
        channel = svc.realtime.subscribeToGroupChanges(groupId, () => {
          void get().refresh();
        });
      }
      if (!pollTimer) {
        pollTimer = setInterval(() => {
          void get().refresh();
        }, POLL_MS);
      }

      // Registrer push-token én gang per økt (ikke-blokkerende).
      if (!pushRegistered && userId) {
        pushRegistered = true;
        void svc.push
          .registerForPushNotifications(userId)
          .then((t) => {
            currentPushToken = t;
            set({ pushAvailable: t != null });
          })
          .catch(() => {
            pushRegistered = false;
            set({ pushAvailable: false });
          });
      }
    } catch (err) {
      logError('refresh', err);
      // Ikke kast brukeren ut ved en enkelt henterfeil – behold forrige data.
      if (get().status !== 'ready') {
        set({ status: 'error', errorMessage: (err as Error)?.message ?? 'Kunne ikke hente data' });
      }
    }
  },

  setPendingInviteToken: (token) => set({ pendingInviteToken: token }),

  createGroup: async (name) => {
    const groupId = await svc.group.createFamilyGroup(name);
    set({ groupId });
    await get().refresh();
  },

  acceptInvite: async (token) => {
    const res = await svc.invitations.acceptInvitation(token);
    set({ groupId: res.familyGroupId, pendingInviteToken: null });
    await get().refresh();
    return res;
  },

  createInvite: async ({ email, role }) => {
    const { groupId } = get();
    if (!groupId) throw new Error('Ingen familiegruppe å invitere til');
    const inv = await svc.invitations.createInvitation({ groupId, email, role });
    await get().loadInvitations();
    return inv;
  },

  loadInvitations: async () => {
    const { groupId } = get();
    if (!groupId) return;
    try {
      const list = await svc.invitations.listInvitationsForGroup(groupId);
      set({ invitations: list });
    } catch (err) {
      logError('loadInvitations', err);
    }
  },

  revokeInvite: async (id) => {
    await svc.invitations.revokeInvitation(id);
    await get().loadInvitations();
  },

  /* ---------------- domene-handlinger ---------------- */

  touchActivity: () => {
    const userId = get().currentUserId;
    if (!userId) return;
    void (async () => {
      try {
        await svc.activity.touchActivity(userId);
        // Oppdater visningen hvis innlogget bruker er senior.
        const senior = get().users.find((u) => u.role === 'senior');
        if (senior && senior.id === userId) {
          set((s) => ({
            activity: { ...s.activity, seniorId: userId, lastSeenAt: nowISO(), lastAppOpenedAt: nowISO(), updatedAt: nowISO() },
          }));
        }
      } catch (err) {
        logError('touchActivity', err);
      }
    })();
  },

  createHelpRequest: async ({ recipientId, message, imageUri }) => {
    const { groupId, users, currentUserId } = get();
    if (!groupId) return { ok: false, error: 'Ingen familiegruppe' };
    const seniorId = users.find((u) => u.role === 'senior')?.id ?? currentUserId ?? '';
    try {
      const id = await svc.helpRequests.createRequest({ groupId, seniorId, recipientId, message });
      set({ lastRequestId: id });
      let imageFailed = false;
      if (imageUri) {
        try {
          const path = await svc.storage.uploadHelpImage(groupId, id, imageUri);
          await svc.helpRequests.attachImage(id, path);
        } catch (err) {
          logError('uploadHelpImage', err);
          imageFailed = true;
        }
      }
      // En feilet refresh skal IKKE markere sendingen som mislykket
      // (forespoerselen er allerede lagret) - unngaar duplikat ved nytt forsok.
      try {
        await get().refresh();
      } catch (err) {
        logError('refresh etter createHelpRequest', err);
      }
      return { ok: true, imageFailed };
    } catch (err) {
      logError('createHelpRequest', err);
      return { ok: false, error: (err as Error)?.message };
    }
  },

  markRequestViewed: (requestId) => {
    void (async () => {
      try {
        await svc.helpRequests.markViewed(requestId);
        await get().refresh();
      } catch (err) {
        logError('markRequestViewed', err);
      }
    })();
  },

  respondToRequest: async ({ requestId, relativeId, responseType, responseText }) => {
    const responderId = relativeId || get().currentUserId || '';
    await svc.helpResponses.respond({ requestId, responderId, responseType, responseText });
    // Svaret er lagret; en feilet refresh skal ikke se ut som at svaret feilet.
    try {
      await get().refresh();
    } catch (err) {
      logError('refresh etter respondToRequest', err);
    }
  },

  markAnswerSeen: (requestId) => {
    // Optimistisk lokalt + persistér.
    set((s) => ({
      requests: s.requests.map((r) => (r.id === requestId ? { ...r, seenBySenior: true } : r)),
    }));
    void (async () => {
      try {
        await svc.helpRequests.markAnswerSeen(requestId);
      } catch (err) {
        logError('markAnswerSeen', err);
      }
    })();
  },

  closeRequest: (requestId) => {
    void (async () => {
      try {
        await svc.helpRequests.closeRequest(requestId);
        await get().refresh();
      } catch (err) {
        logError('closeRequest', err);
      }
    })();
  },

  addEvent: (event) => {
    const { groupId, currentUserId } = get();
    if (!groupId) return;
    void (async () => {
      try {
        await svc.calendar.addEvent({
          groupId,
          createdBy: event.createdBy || currentUserId || '',
          title: event.title,
          description: event.description,
          date: event.date,
          time: event.time,
        });
        await get().refresh();
      } catch (err) {
        logError('addEvent', err);
      }
    })();
  },

  updateEvent: (id, patch) => {
    void (async () => {
      try {
        await svc.calendar.updateEvent(id, {
          title: patch.title,
          description: patch.description,
          date: patch.date,
          time: patch.time,
        });
        await get().refresh();
      } catch (err) {
        logError('updateEvent', err);
      }
    })();
  },

  deleteEvent: (id) => {
    set((s) => ({ events: s.events.filter((e) => e.id !== id) }));
    void (async () => {
      try {
        await svc.calendar.deleteEvent(id);
        await get().refresh();
      } catch (err) {
        logError('deleteEvent', err);
      }
    })();
  },

  setPrimaryContact: (userId) => {
    const { groupId } = get();
    if (!groupId) return;
    set((s) => ({ settings: { ...s.settings, primaryContactUserId: userId } }));
    void (async () => {
      try {
        await svc.group.setPrimaryContact(groupId, userId);
        await get().refresh();
      } catch (err) {
        logError('setPrimaryContact', err);
      }
    })();
  },

  toggleSetting: (key) =>
    set((state) => ({ settings: { ...state.settings, [key]: !state.settings[key] } })),

  setActivitySharing: (enabled) => {
    const uid = get().currentUserId;
    if (!uid) return;
    // Optimistisk lokal oppdatering, deretter persistér.
    set((s) => ({
      users: s.users.map((u) => (u.id === uid ? { ...u, activitySharingEnabled: enabled } : u)),
    }));
    void (async () => {
      try {
        await svc.profiles.setActivitySharing(uid, enabled);
        await get().refresh();
      } catch (err) {
        logError('setActivitySharing', err);
        await get().refresh();
      }
    })();
  },
}));

/* ------------------------------------------------------------------ */
/* Selektorer / hjelpere (rene funksjoner over state)                  */
/* ------------------------------------------------------------------ */

export const selectUserById =
  (id: string | null | undefined) =>
  (s: AppState): User | undefined =>
    s.users.find((u) => u.id === id);

export const selectSenior = (s: AppState): User | undefined =>
  s.users.find((u) => u.role === 'senior');

export const selectCurrentUser = (s: AppState): User | undefined =>
  s.users.find((u) => u.id === s.currentUserId);

export const selectRelativeMembers = (s: AppState): FamilyMember[] =>
  s.members.filter((m) => {
    const u = s.users.find((x) => x.id === m.userId);
    return u?.role === 'relative';
  });

export const selectPrimaryContact = (s: AppState): User | undefined => {
  const member = s.members.find((m) => m.isPrimaryContact) ?? selectRelativeMembers(s)[0];
  return member ? s.users.find((u) => u.id === member.userId) : undefined;
};

export const selectMemberByUser =
  (userId: string) =>
  (s: AppState): FamilyMember | undefined =>
    s.members.find((m) => m.userId === userId);

export const selectTodaysEvents = (s: AppState): CalendarEvent[] => {
  const n = new Date();
  const today = `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
  return s.events.filter((e) => e.date === today).sort((a, b) => a.time.localeCompare(b.time));
};

export const selectOpenRequests = (s: AppState): HelpRequest[] =>
  s.requests.filter((r) => r.status !== 'ANSWERED' && r.status !== 'CLOSED');

export const selectUnseenAnswer = (s: AppState): HelpRequest | undefined =>
  s.requests.find((r) => r.status === 'ANSWERED' && !r.seenBySenior);

export const selectResponseForRequest =
  (requestId: string | null | undefined) =>
  (s: AppState): HelpResponse | undefined =>
    s.responses
      .filter((r) => r.requestId === requestId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
