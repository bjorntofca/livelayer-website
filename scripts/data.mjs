// Numbers behind the charts. The values live in content/tal.json (editable in the admin);
// this module adds the derived totals and helpers the generator uses.
import { readFileSync } from 'node:fs';
const T = JSON.parse(readFileSync(new URL('../content/tal.json', import.meta.url), 'utf8'));
export const { beregner, hours, bars, grids, rates, queueMinutes, bar4, decisions, staffing, vendors, terminals, aerial, explorer, relaySources } = T;
export const planTotal = decisions.reduce((s, d) => s + d.value, 0);

export function dayTotals(day) {
  let lost = 0;
  let empty = 0;
  const perBar = grids[day].map((row, b) => {
    const k = [...row].filter((c) => c === 'k').length;
    empty += [...row].filter((c) => c === 't').length;
    lost += k * rates[b];
    return k * rates[b];
  });
  return { lost, empty, perBar };
}

// Friday, cumulative per hour (for the scroll scene)
export function fridayTimeline() {
  const out = [];
  let lost = 0;
  let empty = 0;
  for (let h = 0; h < hours.length; h++) {
    grids.fri.forEach((row, b) => {
      if (row[h] === 'k') lost += rates[b];
      if (row[h] === 't') empty += 1;
    });
    out.push({ lost, empty });
  }
  return out;
}

export function nf(n, lang) {
  return n.toLocaleString(lang === 'da' ? 'da-DK' : 'en-GB');
}
export function kr(n, lang) {
  return lang === 'da' ? `${nf(n, lang)} kr.` : `DKK ${nf(n, lang)}`;
}

// One year (2026) for the Relay story: your festival, other festivals (most of the lessons) and concerts.
const fest = [[4, 22, 3], [5, 5, 2], [5, 18, 3], [5, 26, 3], [6, 9, 3], [6, 16, 3], [6, 30, 3], [7, 6, 3], [7, 13, 3], [7, 27, 3], [8, 3, 3]];
const concerts = [[0, 16], [0, 31], [1, 20], [2, 7], [2, 27], [3, 11], [3, 25], [4, 8], [8, 19], [9, 2], [9, 17], [9, 30], [10, 14], [10, 27], [11, 5], [11, 12]];
export function relayYear() {
  const doy = (m, d) => Math.round((Date.UTC(2026, m, d) - Date.UTC(2026, 0, 1)) / 86400000);
  const days = Array.from({ length: 365 }, (_, i) => ({ i, kind: '' }));
  for (let d = 1; d <= 3; d++) days[doy(6, 1 + d)].kind = 'you';
  const clusters = fest.map(([m, d, n]) => { for (let k = 0; k < n; k++) days[doy(m, d + k)].kind = 'fest'; return doy(m, d + Math.floor(n / 2)); });
  concerts.forEach(([m, d]) => { days[doy(m, d)].kind = 'concert'; });
  const other = days.filter((x) => x.kind === 'fest' || x.kind === 'concert').length;
  return { days, clusters, concertSource: doy(9, 17), other };
}

// A year of event days (for "one chance a year"). 2026, Monday-first weeks.
export function yearDays() {
  const start = new Date(Date.UTC(2026, 0, 1));
  const days = [];
  for (let i = 0; i < 365; i++) {
    const d = new Date(start.getTime() + i * 86400000);
    const wd = (d.getUTCDay() + 6) % 7; // 0 = Monday
    const m = d.getUTCMonth();
    const festival = m === 6 && d.getUTCDate() >= 2 && d.getUTCDate() <= 4;
    const venue = m !== 6 && wd >= 3 && wd <= 5 && (i * 7) % 10 < 6;
    days.push({ i, wd, m, festival, venue });
  }
  return days;
}
