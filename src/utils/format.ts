/** Små formateringshjelpere for tid og dato (norsk). */

export function timeAgo(iso: string, now: Date = new Date()): string {
  const mins = Math.round((now.getTime() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return 'nå nettopp';
  if (mins < 60) return `for ${mins} min siden`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `for ${hours} t siden`;
  const days = Math.round(hours / 24);
  return `for ${days} d siden`;
}

export function clock(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

const WEEKDAYS = ['søndag', 'mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag', 'lørdag'];
const MONTHS = [
  'januar', 'februar', 'mars', 'april', 'mai', 'juni',
  'juli', 'august', 'september', 'oktober', 'november', 'desember',
];

/** F.eks. «torsdag 21. mai». */
export function longDate(d: Date = new Date()): string {
  return `${WEEKDAYS[d.getDay()]} ${d.getDate()}. ${MONTHS[d.getMonth()]}`;
}

/** Kort dato fra ISO «2026-05-21» → «21. mai». */
export function shortDateFromISO(iso: string): string {
  const [y, m, day] = iso.split('-').map((n) => parseInt(n, 10));
  void y;
  return `${day}. ${MONTHS[(m ?? 1) - 1]}`;
}
