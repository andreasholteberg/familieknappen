# Teknisk gjennomgang før pilot – Familieknappen

Mål: finne feil før pilot, ikke bygge nytt. Gjennomgangen er en statisk kode-
og dataflyt-revisjon. Jeg har sporet hver hovedflyt mot faktisk kode, validert
all SQL mot Postgres-grammatikken, parset alle 46 TS/TSX-filer + begge Edge
Functions uten syntaksfeil, og bekreftet at alle interne importer løses opp.

> **Begrensning i metoden:** Jeg har ikke kunnet kjøre `tsc`, `expo start` eller
> en ekte Supabase/enhet herfra. Type-nivå-feil, oppsett (Redirect URLs,
> webhooks, cron, EAS) og enhetsspesifikk oppførsel (bildeopplasting, push, deep
> links) må verifiseres på ekte enhet før pilot. Se anbefalt neste steg.

## Status per flyt

**Senior sender forespørsel** – OK. Bilde lastes opp etter at raden er opprettet,
og `escalation_due_at` settes. Rettet under gjennomgangen: «Send» gjorde ingenting
i stillhet hvis ingen kontakt var valgt (se F1).

**Pårørende mottar** – OK. Realtime-abonnement på `help_requests` (filtrert på
gruppe) + polling hvert 20. sek som fallback. Tabellene ligger i
`supabase_realtime`-publikasjonen, og RLS gir gruppemedlemmer lesetilgang.

**Pårørende svarer** – OK. `help_responses` settes inn (RLS krever
`responder_id = auth.uid()`), og forespørselen settes til `ANSWERED`.

**Senior ser svar** – OK. `selectUnseenAnswer` driver «Se svar fra familien»-kortet;
`markAnswerSeen` fjerner det. Mindre kosmetisk svakhet: navnet på hjem-kortet (F7).

**Invitasjon** – OK i koden. Primærkontakt oppretter (RLS), `accept_group_invitation`
validerer token/utløp/revoked/accepted og at `auth.email()` matcher. Avhenger av at
deep link-ruting fungerer på enhet (F2).

**Push** – riktig koblet i koden: tillatelse → token → lagring ved login, fjerning
ved logout; Edge Function `send-push` ved INSERT. Avhenger av oppsett (F4).

**Eskalering** – riktig koblet: `escalate` finner forfalte ubesvarte, varsler
sekundær, setter `ESCALATED`. Krever planlegging (F5). Seniorens hjemskjerm viser
rolig status «Vi prøver å få tak i familien.»

**Auth / deep links** – OK i koden. Magisk lenke (PKCE) → `auth-callback` →
økt-utveksling i rot-layout. Forutsetter whitelistede Redirect URLs og at lenken
åpnes på samme enhet (F3).

## Funn (med risiko)

- **F1 · Middels · RETTET** – «Send» i ask-flyten returnerte stille hvis ingen
  kontakt var valgt (kunne skje hvis primærkontakt ikke var lastet). Lagt til
  varsel + retur til kontaktvalg. (`app/senior/ask.tsx`)
- **F2 · Middels · Verifiser på enhet** – Deep link-ruting for invitasjon
  (`familieknappen://invite?token=…`). Lenken genereres med `Linking.createURL`,
  som normalt parses riktig av Expo Router, men må bekreftes på ekte enhet/dev-build.
- **F3 · Middels · Oppsett/UX** – Magisk lenke krever at deep link-URL-ene er lagt
  inn under Supabase → Auth → Redirect URLs, og PKCE forutsetter at lenken åpnes på
  samme enhet som ba om den (ellers mangler verifier → innlogging feiler).
- **F4 · Middels · Oppsett** – Push krever EAS-build med `projectId`
  (`getExpoPushTokenAsync` feiler ellers → ingen token), manuell Database Webhook,
  og FCM for Android-prod. I Expo Go faller registreringen stille tilbake.
- **F5 · Middels · Oppsett** – Eskalering krever at `escalate` planlegges (pg_cron
  eller Supabase Schedules). Uten planlegging skjer ingen eskalering.
- **F6 · Middels · Test på enhet** – Bildeopplasting bruker
  `fetch(uri).arrayBuffer()`. Dette kan oppføre seg ulikt på iOS/Android; må testes
  på ekte enhet. Feiler opplastingen, opprettes forespørselen likevel uten bilde.
- **F7 · Lav · Kosmetisk** – Hjem-kortet «… har svart deg» bruker navnet på
  opprinnelig mottaker, ikke faktisk svarer. Vises feil navn hvis en sekundærkontakt
  svarer etter eskalering (selve svar-skjermen viser riktig navn).
- **F8 · Lav · Ytelse** – Ved oppstart kjøres `refresh()` to ganger
  (INITIAL_SESSION + eksplisitt kall). Ufarlig, men dobbel henting.
- **F9 · Lav · Herding** – `family_groups` insert er åpen for alle innloggede.
  Ingen UI bruker dette nå; bør strammes før produksjon.
- **F10 · Lav** – Ingen `setNotificationHandler`; push vises ikke i forgrunnen mens
  appen er åpen (OS viser dem i bakgrunnen).
- **F11 · Lav** – Ingen «av-eskalering»: svarer noen etter eskalering, blir status
  `ANSWERED`, men `escalation_level` forblir 1.
- **F12 · Info** – Full `tsc`-typesjekk og kjøring er ikke gjort her. Type-feil kan
  finnes som statisk parsing ikke fanger.

## Samlet risikobilde

Ingen kompilerings- eller logikkblokkere ble funnet i app-koden, og kjerneflyten
henger sammen i kildekoden. De reelle risikoene før pilot er nesten alle
**oppsett** (Redirect URLs, webhooks, cron, EAS-build) eller **enhetsspesifikke**
(bildeopplasting, push, deep links) – ting en statisk gjennomgang ikke kan bekrefte.

## Anbefalt neste konkrete steg

Gjør én ende-til-ende røyktest på en ekte **EAS dev-build** (ikke Expo Go), på to
enheter/økter:

1. Kjør `npx tsc --noEmit` for full typesjekk (fanger F12).
2. Kjør migreringene, deploy `send-push` og `escalate`, sett opp de to Database
   Webhooks og cron-planen for `escalate`, og legg deep link-URL-ene i Auth →
   Redirect URLs.
3. Kjør hele kjeden: logg inn (senior + pårørende), send forespørsel → motta →
   svar → se svar; opprett og godta en invitasjon; verifiser push på begge sider;
   tving en eskalering (sett `escalation_due_at` i fortid) og se varsel + status.

Dette avdekker F2–F6 samlet, og er den raskeste veien til et trygt pilotgrunnlag.
