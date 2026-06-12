import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Card } from '@/components/Card';
import { RelativeTabs } from '@/components/RelativeTabs';
import { Screen } from '@/components/Screen';
import { selectCurrentUser, selectSenior, useAppStore } from '@/store/useAppStore';
import { colors, fontSize, radius, spacing } from '@/theme/theme';
import type { GroupInvitation } from '@/types/models';
import { createAppUrl } from '@/utils/appLinks';
import { normalizePhone } from '@/utils/phone';

const SCOPE_LABEL: Record<string, string> = {
  help_requests: 'Forespørsler',
  calendar: 'Kalender',
  activity: 'Aktivitetsstatus',
};

const ROLE_LABEL: Record<string, string> = {
  senior: 'Senior',
  primary_contact: 'Primær',
  secondary_contact: 'Pårørende',
};

const INVITE_STATUS_LABEL: Record<string, string> = {
  pending: 'Aktiv',
  accepted: 'Brukt',
  revoked: 'Trukket tilbake',
  expired: 'Utløpt',
};

const fmtDate = (iso: string): string => {
  const d = new Date(iso);
  return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
};

function Toggle({ on, onPress, label }: { on: boolean; onPress: () => void; label: string }) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
      accessibilityLabel={label}
      style={[styles.toggle, on && styles.toggleOn]}
      onPress={onPress}
    >
      <View style={[styles.knob, on && styles.knobOn]} />
    </Pressable>
  );
}

export default function RelativeSettings() {
  const router = useRouter();
  const group = useAppStore((s) => s.group);
  const members = useAppStore((s) => s.members);
  const users = useAppStore((s) => s.users);
  const settings = useAppStore((s) => s.settings);
  const consents = useAppStore((s) => s.consents);
  const senior = useAppStore(selectSenior);
  const setPrimaryContact = useAppStore((s) => s.setPrimaryContact);
  const toggleSetting = useAppStore((s) => s.toggleSetting);
  const signOut = useAppStore((s) => s.signOut);
  const currentUserId = useAppStore((s) => s.currentUserId);
  const createInvite = useAppStore((s) => s.createInvite);
  const invitations = useAppStore((s) => s.invitations);
  const loadInvitations = useAppStore((s) => s.loadInvitations);
  const revokeInvite = useAppStore((s) => s.revokeInvite);
  const pushAvailable = useAppStore((s) => s.pushAvailable);
  const currentUser = useAppStore(selectCurrentUser);
  const setActivitySharing = useAppStore((s) => s.setActivitySharing);

  const consentByUser = (userId: string) =>
    consents
      .filter((c) => c.grantedToUserId === userId && !c.revokedAt)
      .map((c) => SCOPE_LABEL[c.scope] ?? c.scope);

  const myMember = members.find((m) => m.userId === currentUserId);
  const iAmPrimary = !!myMember?.isPrimaryContact;
  const activitySharing = currentUser?.activitySharingEnabled ?? true;

  const setMyPhone = useAppStore((s) => s.setMyPhone);
  const requestDeletion = useAppStore((s) => s.requestAccountDeletion);
  const cancelDeletion = useAppStore((s) => s.cancelAccountDeletion);
  const [deletionBusy, setDeletionBusy] = useState(false);
  const [deletionError, setDeletionError] = useState<string | null>(null);

  const deletionDate = currentUser?.deletionRequestedAt
    ? fmtDate(new Date(new Date(currentUser.deletionRequestedAt).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString())
    : null;

  const confirmDeletion = () => {
    Alert.alert(
      'Slette kontoen din?',
      'Kontoen og dataene dine slettes om 30 dager. Du kan angre når som helst frem til da.',
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Slett kontoen min',
          style: 'destructive',
          onPress: () => {
            setDeletionBusy(true);
            setDeletionError(null);
            requestDeletion()
              .catch(() => setDeletionError('Fikk ikke registrert slettingen. Prøv igjen.'))
              .finally(() => setDeletionBusy(false));
          },
        },
      ],
    );
  };

  const undoDeletion = () => {
    setDeletionBusy(true);
    setDeletionError(null);
    cancelDeletion()
      .catch(() => setDeletionError('Fikk ikke angret slettingen. Prøv igjen.'))
      .finally(() => setDeletionBusy(false));
  };
  const createPairingCode = useAppStore((s) => s.createPairingCode);
  const [pairingCode, setPairingCode] = useState<{ code: string; expiresAt: string } | null>(null);
  const [pairingBusy, setPairingBusy] = useState(false);
  const [pairingError, setPairingError] = useState<string | null>(null);

  const makePairingCode = async () => {
    if (pairingBusy) return;
    setPairingBusy(true);
    setPairingError(null);
    try {
      const res = await createPairingCode(inviteRole);
      setPairingCode({ code: res.code, expiresAt: res.expiresAt });
    } catch (e) {
      setPairingError((e as Error)?.message ?? 'Fikk ikke laget koden. Prøv igjen.');
    } finally {
      setPairingBusy(false);
    }
  };
  const [phoneInput, setPhoneInput] = useState(currentUser?.phone ?? '');
  const [phoneStatus, setPhoneStatus] = useState<string | null>(null);
  const [savingPhone, setSavingPhone] = useState(false);

  const savePhone = async () => {
    if (savingPhone) return;
    const normalized = normalizePhone(phoneInput);
    if (phoneInput.trim() && !normalized) {
      setPhoneStatus('Skriv et gyldig telefonnummer.');
      return;
    }
    setSavingPhone(true);
    setPhoneStatus(null);
    try {
      await setMyPhone(normalized);
      setPhoneStatus(normalized ? 'Lagret ✓' : 'Nummeret er fjernet.');
    } catch {
      setPhoneStatus('Fikk ikke lagret nummeret. Prøv igjen.');
    } finally {
      setSavingPhone(false);
    }
  };

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'senior' | 'secondary_contact'>('secondary_contact');
  const [inviteResult, setInviteResult] = useState<GroupInvitation | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [sendingInvite, setSendingInvite] = useState(false);

  const inviteLink = inviteResult
    ? createAppUrl('invite', { queryParams: { token: inviteResult.token } })
    : '';

  const sendInvite = async () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!email.includes('@')) {
      setInviteError('Skriv en gyldig e-postadresse.');
      return;
    }
    setSendingInvite(true);
    setInviteError(null);
    try {
      const inv = await createInvite({ email, role: inviteRole });
      setInviteResult(inv);
      setInviteEmail('');
    } catch (e) {
      setInviteError((e as Error)?.message ?? 'Kunne ikke sende invitasjonen.');
    } finally {
      setSendingInvite(false);
    }
  };

  useEffect(() => {
    if (iAmPrimary) void loadInvitations();
  }, [iAmPrimary, loadInvitations]);

  const handleRevoke = (id: string) => {
    revokeInvite(id).catch((e) =>
      setInviteError((e as Error)?.message ?? 'Kunne ikke trekke tilbake invitasjonen.'),
    );
  };

  const switchRole = async () => {
    await signOut();
    router.replace('/');
  };

  return (
    <Screen>
      {/* Familiegruppe */}
      <Text style={styles.sectionLabel}>FAMILIEGRUPPE</Text>
      <Card>
        <Text style={styles.groupName}>{group.name}</Text>
        {members.map((m) => {
          const u = users.find((x) => x.id === m.userId);
          if (!u) return null;
          const isPrimary = settings.primaryContactUserId === u.id;
          return (
            <View key={m.id} style={styles.memberRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.memberName}>
                  {u.name} <Text style={styles.memberRel}>· {m.relationship}{u.role === 'senior' ? ' (senior)' : ''}</Text>
                </Text>
                {u.role === 'relative' ? (
                  <Text style={styles.consent}>
                    Tilgang: {consentByUser(u.id).join(', ') || 'ingen'}
                  </Text>
                ) : null}
              </View>
              {u.role === 'relative' ? (
                <Pressable
                  style={[styles.smallBtn, isPrimary && styles.smallBtnActive]}
                  onPress={() => setPrimaryContact(u.id)}
                >
                  <Text style={[styles.smallBtnText, isPrimary && styles.smallBtnTextActive]}>
                    {isPrimary ? 'Primær ✓' : 'Gjør primær'}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          );
        })}
      </Card>

      {/* Inviter (kun primærkontakt) */}
      {iAmPrimary ? (
        <>
          <Text style={styles.sectionLabel}>INVITER FAMILIEMEDLEM</Text>
          <Card>
            <Text style={styles.inviteHelp}>Send en invitasjon til en du stoler på.</Text>
            <TextInput
              style={styles.inviteInput}
              value={inviteEmail}
              onChangeText={setInviteEmail}
              placeholder="navn@example.no"
              placeholderTextColor={colors.inkFaint}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              inputMode="email"
              accessibilityLabel="E-post til invitasjon"
            />
            <View style={styles.roleRow}>
              <Pressable
                accessibilityRole="button"
                style={[styles.roleChip, inviteRole === 'secondary_contact' && styles.roleChipOn]}
                onPress={() => setInviteRole('secondary_contact')}
              >
                <Text style={[styles.roleChipText, inviteRole === 'secondary_contact' && styles.roleChipTextOn]}>
                  Pårørende
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                style={[styles.roleChip, inviteRole === 'senior' && styles.roleChipOn]}
                onPress={() => setInviteRole('senior')}
              >
                <Text style={[styles.roleChipText, inviteRole === 'senior' && styles.roleChipTextOn]}>
                  Senior
                </Text>
              </Pressable>
            </View>
            {inviteError ? <Text style={styles.inviteError}>{inviteError}</Text> : null}
            <Pressable
              style={[styles.inviteBtn, sendingInvite && styles.inviteBtnDisabled]}
              disabled={sendingInvite}
              onPress={sendInvite}
            >
              <Text style={styles.inviteBtnText}>{sendingInvite ? 'Sender …' : 'Send invitasjon'}</Text>
            </Pressable>
            {inviteResult ? (
              <View style={styles.inviteResult}>
                <Text style={styles.inviteResultTitle}>Invitasjon opprettet ✓</Text>
                <Text style={styles.inviteResultLabel}>Lenke (for testing):</Text>
                <Text selectable style={styles.inviteLink}>{inviteLink}</Text>
                <Text style={styles.inviteResultLabel}>Token:</Text>
                <Text selectable style={styles.inviteToken}>{inviteResult.token}</Text>
                <Text style={styles.inviteNote}>
                  I full versjon sendes denne lenken på e-post. Nå kan du teste ved å åpne den selv.
                </Text>
              </View>
            ) : null}

            <View style={styles.pairingBox}>
              <Text style={styles.inviteResultLabel}>Eller bruk en paringskode</Text>
              <Text style={styles.inviteHelp}>
                Lag en 6-sifret kode og les den opp. Den andre logger inn med sin e-post og
                taster koden på velkomstskjermen. Koden gjelder i 15 minutter.
              </Text>
              {pairingError ? <Text style={styles.inviteError}>{pairingError}</Text> : null}
              <Pressable
                style={[styles.inviteBtn, pairingBusy && styles.inviteBtnDisabled]}
                disabled={pairingBusy}
                onPress={() => void makePairingCode()}
              >
                <Text style={styles.inviteBtnText}>
                  {pairingBusy ? 'Lager kode …' : `Lag paringskode (${inviteRole === 'senior' ? 'senior' : 'pårørende'})`}
                </Text>
              </Pressable>
              {pairingCode ? (
                <View style={styles.pairingResult}>
                  <Text selectable style={styles.pairingCodeText}>{pairingCode.code}</Text>
                  <Text style={styles.inviteNote}>
                    Gjelder i 15 minutter. Lager du en ny kode, slutter denne å virke.
                  </Text>
                </View>
              ) : null}
            </View>

            {invitations.length > 0 ? (
              <View style={styles.inviteList}>
                <Text style={styles.inviteResultLabel}>Sendte invitasjoner</Text>
                {invitations.map((inv) => (
                  <View key={inv.id} style={styles.inviteRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inviteRowEmail}>{inv.invitedEmail}</Text>
                      <Text style={styles.inviteRowMeta}>
                        {ROLE_LABEL[inv.invitedRole] ?? inv.invitedRole} · {INVITE_STATUS_LABEL[inv.status]} · utløper {fmtDate(inv.expiresAt)}
                      </Text>
                    </View>
                    {inv.status === 'pending' ? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Trekk tilbake invitasjon til ${inv.invitedEmail}`}
                        style={styles.revokeBtn}
                        onPress={() => handleRevoke(inv.id)}
                      >
                        <Text style={styles.revokeBtnText}>Trekk tilbake</Text>
                      </Pressable>
                    ) : null}
                  </View>
                ))}
              </View>
            ) : null}
          </Card>
        </>
      ) : null}

      {/* Mitt telefonnummer */}
      <Text style={styles.sectionLabel}>MITT TELEFONNUMMER</Text>
      <Card>
        <Text style={styles.inviteHelp}>
          Med nummer lagret kan {senior?.name ?? 'senior'} ringe deg rett fra appen.
        </Text>
        <TextInput
          style={styles.inviteInput}
          value={phoneInput}
          onChangeText={setPhoneInput}
          placeholder="F.eks. +47 912 34 567"
          placeholderTextColor={colors.inkFaint}
          keyboardType="phone-pad"
          inputMode="tel"
          autoComplete="tel"
          accessibilityLabel="Mitt telefonnummer"
        />
        {phoneStatus ? <Text style={styles.phoneStatus}>{phoneStatus}</Text> : null}
        <Pressable
          style={[styles.inviteBtn, savingPhone && styles.inviteBtnDisabled]}
          disabled={savingPhone}
          onPress={() => void savePhone()}
        >
          <Text style={styles.inviteBtnText}>{savingPhone ? 'Lagrer …' : 'Lagre nummer'}</Text>
        </Pressable>
      </Card>

      {/* Varsling */}
      <Text style={styles.sectionLabel}>VARSLING</Text>
      <Card>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Push-varsel når {senior?.name} ber om hjelp</Text>
          <Toggle on={settings.notifyPush} onPress={() => toggleSetting('notifyPush')} label="Push-varsel" />
        </View>
        <View style={[styles.settingRow, styles.noBorder]}>
          <Text style={styles.settingLabel}>Også SMS-varsel</Text>
          <Toggle on={settings.notifySms} onPress={() => toggleSetting('notifySms')} label="SMS-varsel" />
        </View>
        {pushAvailable === false ? (
          <Text style={styles.pushNote}>
            Varsler er ikke aktivert på denne enheten ennå. Du ser fortsatt forespørsler når du åpner appen.
          </Text>
        ) : null}
      </Card>

      {/* Personvern og samtykke */}
      <Text style={styles.sectionLabel}>PERSONVERN OG SAMTYKKE</Text>
      <Card>
        <Text style={styles.privacyLine}>
          • Familieknappen gir støtte fra pårørende – ikke en garanti eller en automatisk vurdering.
        </Text>
        <Text style={styles.privacyLine}>
          • Bilder og meldinger du sender, deles med familiegruppen din.
        </Text>
        <Text style={styles.privacyLine}>• Appen bruker ikke GPS eller stedssporing.</Text>
        <Text style={styles.privacyLine}>• Push-varsler brukes bare for forespørsler og svar.</Text>
        <Text style={styles.privacyLine}>
          • Aktivitetsstatus («sist aktiv») deles bare hvis du har samtykket.
        </Text>
        <Text style={styles.privacyLine}>
          • Du kan når som helst be om at kontoen og dataene dine slettes.
        </Text>

        <View style={[styles.settingRow, styles.privacyToggleRow]}>
          <Text style={styles.settingLabel}>Del min aktivitetsstatus med familien</Text>
          <Toggle
            on={activitySharing}
            onPress={() => setActivitySharing(!activitySharing)}
            label="Del aktivitetsstatus"
          />
        </View>
      </Card>

      {/* Forbehold */}
      <Text style={styles.sectionLabel}>OM HJELPEN</Text>
      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerStrong}>Dette er assistanse, ikke en garanti.</Text>
        <Text style={styles.disclaimerText}>
          Familieknappen hjelper {senior?.name} med å spørre noen man stoler på før man svarer eller
          handler. Appen kan ikke love å avsløre svindel sikkert. Bruk den som en ekstra trygghet –
          ikke som en fasit. Er dere i tvil, ta kontakt med banken, Posten eller politiet direkte.
        </Text>
      </View>

      {/* Konto (F-036) */}
      <Text style={styles.sectionLabel}>KONTO</Text>
      <Card>
        {currentUser?.deletionRequestedAt ? (
          <>
            <Text style={styles.deletionPending}>
              Kontoen din slettes {deletionDate}. Frem til da kan du angre.
            </Text>
            {deletionError ? <Text style={styles.inviteError}>{deletionError}</Text> : null}
            <Pressable
              style={[styles.inviteBtn, deletionBusy && styles.inviteBtnDisabled]}
              disabled={deletionBusy}
              onPress={undoDeletion}
            >
              <Text style={styles.inviteBtnText}>{deletionBusy ? 'Et øyeblikk …' : 'Angre sletting'}</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.inviteHelp}>
              Du kan be om at kontoen og dataene dine slettes. Slettingen skjer etter 30 dager,
              og du kan angre frem til da.
            </Text>
            {deletionError ? <Text style={styles.inviteError}>{deletionError}</Text> : null}
            <Pressable
              style={[styles.deleteAccountBtn, deletionBusy && styles.inviteBtnDisabled]}
              disabled={deletionBusy}
              onPress={confirmDeletion}
            >
              <Text style={styles.deleteAccountBtnText}>
                {deletionBusy ? 'Et øyeblikk …' : 'Slett kontoen min'}
              </Text>
            </Pressable>
          </>
        )}
      </Card>

      <Pressable style={styles.switchBtn} onPress={switchRole}>
        <Text style={styles.switchBtnText}>Logg ut</Text>
      </Pressable>

      <Text style={styles.versionText}>
        Familieknappen v{Constants.expoConfig?.version ?? '1.0.0'}
      </Text>

      <RelativeTabs />
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    letterSpacing: 0.7,
    color: colors.inkFaint,
    marginTop: spacing(5),
    marginBottom: spacing(2.5),
  },
  groupName: { fontSize: fontSize.lg, fontWeight: '800', color: colors.ink, marginBottom: spacing(2) },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing(3),
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  memberName: { fontSize: fontSize.md, fontWeight: '600', color: colors.ink },
  memberRel: { fontWeight: '400', color: colors.inkFaint },
  consent: { fontSize: fontSize.sm, color: colors.inkFaint, marginTop: spacing(0.5) },
  smallBtn: { backgroundColor: colors.surfaceSoft, borderRadius: 10, paddingVertical: spacing(2), paddingHorizontal: spacing(3) },
  smallBtnActive: { backgroundColor: colors.brand },
  smallBtnText: { fontSize: fontSize.sm, fontWeight: '700', color: colors.brandDark },
  smallBtnTextActive: { color: colors.white },
  ghostBtn: { borderWidth: 2, borderColor: colors.brand, borderRadius: radius.m, paddingVertical: spacing(3.5), alignItems: 'center', marginTop: spacing(3) },
  ghostBtnText: { color: colors.brandDark, fontSize: fontSize.md, fontWeight: '700' },

  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing(3.5),
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    gap: spacing(3),
  },
  noBorder: { borderBottomWidth: 0 },
  settingLabel: { flex: 1, fontSize: fontSize.md, fontWeight: '600', color: colors.ink },

  toggle: { width: 50, height: 30, borderRadius: 15, backgroundColor: colors.line, justifyContent: 'center', padding: 3 },
  toggleOn: { backgroundColor: colors.brand },
  knob: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.white },
  knobOn: { alignSelf: 'flex-end' },

  consentText: { fontSize: fontSize.sm, color: colors.inkSoft, lineHeight: 22 },
  privacyLine: { fontSize: fontSize.sm, color: colors.inkSoft, lineHeight: 22, marginBottom: spacing(2) },
  privacyToggleRow: { borderTopWidth: 1, borderTopColor: colors.line, borderBottomWidth: 0, marginTop: spacing(2) },
  pushNote: { fontSize: fontSize.sm, color: colors.inkFaint, marginTop: spacing(3), lineHeight: 20 },

  disclaimer: { backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.line, borderRadius: radius.m, padding: spacing(4) },
  disclaimerStrong: { fontSize: fontSize.md, fontWeight: '800', color: colors.ink, marginBottom: spacing(1.5) },
  disclaimerText: { fontSize: fontSize.sm, color: colors.inkSoft, lineHeight: 22 },

  switchBtn: { alignItems: 'center', paddingVertical: spacing(4), marginTop: spacing(4) },
  inviteHelp: { fontSize: fontSize.sm, color: colors.inkSoft, marginBottom: spacing(2.5) },
  inviteInput: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.s,
    paddingVertical: spacing(3.5),
    paddingHorizontal: spacing(3.5),
    fontSize: fontSize.md,
    color: colors.ink,
    backgroundColor: colors.surface,
  },
  roleRow: { flexDirection: 'row', gap: spacing(2.5), marginTop: spacing(3) },
  roleChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing(3),
    borderRadius: radius.s,
    borderWidth: 2,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  roleChipOn: { borderColor: colors.brand, backgroundColor: colors.brandSoft },
  roleChipText: { fontSize: fontSize.md, fontWeight: '700', color: colors.inkSoft },
  roleChipTextOn: { color: colors.brandDark },
  inviteError: { color: colors.attention, fontSize: fontSize.sm, marginTop: spacing(3) },
  phoneStatus: { color: colors.inkSoft, fontSize: fontSize.sm, marginTop: spacing(2.5) },
  pairingBox: { marginTop: spacing(4), borderTopWidth: 1, borderTopColor: colors.line, paddingTop: spacing(3) },
  pairingResult: { alignItems: 'center', marginTop: spacing(3) },
  pairingCodeText: {
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: 10,
    color: colors.brandDark,
  },
  deletionPending: { fontSize: fontSize.md, fontWeight: '700', color: colors.ink, marginBottom: spacing(3), lineHeight: 26 },
  deleteAccountBtn: {
    backgroundColor: colors.attentionSoft,
    borderRadius: radius.m,
    paddingVertical: spacing(4),
    alignItems: 'center',
    marginTop: spacing(3),
  },
  deleteAccountBtnText: { color: colors.attention, fontSize: fontSize.md, fontWeight: '700' },
  versionText: {
    fontSize: fontSize.sm,
    color: colors.inkFaint,
    textAlign: 'center',
    paddingBottom: spacing(4),
  },
  inviteBtn: {
    backgroundColor: colors.brand,
    borderRadius: radius.m,
    paddingVertical: spacing(4),
    alignItems: 'center',
    marginTop: spacing(3.5),
  },
  inviteBtnDisabled: { opacity: 0.6 },
  inviteBtnText: { color: colors.white, fontSize: fontSize.md, fontWeight: '700' },
  inviteResult: {
    marginTop: spacing(4),
    padding: spacing(3.5),
    borderRadius: radius.s,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.line,
  },
  inviteResultTitle: { fontSize: fontSize.md, fontWeight: '800', color: colors.calmGreen, marginBottom: spacing(2) },
  inviteResultLabel: { fontSize: fontSize.sm, fontWeight: '700', color: colors.inkSoft, marginTop: spacing(2) },
  inviteLink: { fontSize: fontSize.sm, color: colors.brandDark, marginTop: spacing(0.5) },
  inviteToken: { fontSize: fontSize.sm, color: colors.ink, marginTop: spacing(0.5) },
  inviteNote: { fontSize: fontSize.sm, color: colors.inkFaint, marginTop: spacing(2.5), lineHeight: 20 },
  inviteList: { marginTop: spacing(4), borderTopWidth: 1, borderTopColor: colors.line, paddingTop: spacing(3) },
  inviteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(3),
    paddingVertical: spacing(2.5),
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  inviteRowEmail: { fontSize: fontSize.md, fontWeight: '600', color: colors.ink },
  inviteRowMeta: { fontSize: fontSize.sm, color: colors.inkFaint, marginTop: spacing(0.5) },
  revokeBtn: { backgroundColor: colors.attentionSoft, borderRadius: 10, paddingVertical: spacing(2), paddingHorizontal: spacing(3) },
  revokeBtnText: { fontSize: fontSize.sm, fontWeight: '700', color: colors.attention },
  switchBtnText: { fontSize: fontSize.md, fontWeight: '700', color: colors.brandDark, textDecorationLine: 'underline' },
});
