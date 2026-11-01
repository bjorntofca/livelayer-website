// Writes public/admin/config.json for the admin at /admin/ (Decap CMS, self-hosted in public/admin/decap/).
// The form fields are derived from the JSON files in content/, so every text, number, image and video
// on the site is editable and new content keys show up automatically.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const base = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => JSON.parse(readFileSync(join(base, p), 'utf8'));

const TOKENS = 'Du kan bruge {navn}, {festival}, {interval}, {kø-interval}, {bod-interval}, {gæster}, {dage} og {køer}. Tekst i [ ] vises kun, hvis det inde i den er udfyldt, fx "Hej[ {navn}],". Tom linje = nyt afsnit.';

// Danish labels. Path-specific labels ("section.key") win over general ones ("key").
const LABEL = {
  title: 'Sidetitel (fanen og Google)', description: 'Beskrivelse til Google', hero: 'Toppen af siden',
  h1: 'Overskrift', h2: 'Overskrift', h: 'Overskrift', sub: 'Tekst under overskriften', p: 'Tekst', lead: 'Indledning',
  cta: 'Knaptekst', more: 'Knaptekst 2', items: 'Punkter', t: 'Titel', d: 'Tekst', k: 'Etiket', v: 'Værdi',
  s: 'Undertekst', q: 'Spørgsmål', a: 'Svar', alt: 'Billedbeskrivelse (til skærmlæsere)', note: 'Note',
  steps: 'Trin', faq: 'Spørgsmål og svar', contact: 'Kontakt', link: 'Linktekst', name: 'Navn', key: 'Teknisk nøgle (lad stå)',
  statement: 'Udsagn over billedet', relay: 'Relay (rul-historien)', layer: 'Et lag af tal', night: 'Fredag aften (rul-scenen)',
  products: 'To ting, I får', changes: 'Mindre gætværk', partner: 'Partner-boksen', captions: 'Tekster pr. tidspunkt',
  tags: 'Mærkater', get: 'Det får I', heat: 'Hele festivalen på én side', demand: 'Efterspørgsel mod kapacitet',
  lenses: 'Det kigger vi på', ledger: 'Listen med anbefalinger', anatomy: 'Én anbefaling i detaljer', staffing: 'Frivillige',
  vendors: 'Boder', terminals: 'Betalingsterminaler', rows: 'Rækker', cols: 'Kolonner', total: 'I alt', value: 'Værdi',
  common: 'Menu, sidefod og fælles ord', nav: 'Menu', footer: 'Sidefod', ui: 'Skærmbillederne (mockups)', explorer: 'Bod-estimater med begrundelse',
  reasons: 'Begrundelser', unit: 'Enhed', unc: 'Usikkerhed', base: 'Udgangspunkt', src: 'Kilder', otherLabel: 'Navn på det andet sprog',
  who: 'Hvem det passer til', read: 'Tal ved siden af', margin: 'Beslutningsmargin-eksemplet', vis: 'Grafens tekster', months: 'Måneder',
  others: 'Andre ændringer', days: 'Dage', moments: 'Situationer',
  // calculator
  'beregner.h': 'Overskrift på beregneren', 'beregner.guests': 'Felt: gæster', 'beregner.days': 'Felt: dage', 'beregner.day1': 'Ordet "dag"',
  'beregner.dayN': 'Ordet "dage"', 'beregner.queue': 'Felt: køer', 'beregner.q': 'Valgmuligheder for køer (tre)', 'beregner.out': 'Tekst over intervallet',
  'beregner.email': 'E-mailfeltets navn (skjult, til skærmlæsere)', 'beregner.ph': 'Eksempel i e-mailfeltet', 'beregner.send': 'Knaptekst',
  'beregner.sending': 'Knaptekst mens den sender', 'beregner.fine': 'Lille tekst under feltet', 'beregner.invalid': 'Fejl: ugyldig e-mail',
  'beregner.ok': 'Tak-tekst (efterfølges af e-mailen)', 'beregner.preview': 'Link til at se mailen', 'beregner.error': 'Fejl: mailen kunne ikke sendes',
  'beregner.mail': 'Mailen med beregningen', 'beregner.step2': 'Trin 2: overskrift', 'beregner.step2Text': 'Trin 2: tekst',
  'beregner.name': 'Trin 2: navnefeltets navn (skjult)', 'beregner.namePh': 'Trin 2: eksempel i navnefeltet', 'beregner.festival': 'Trin 2: festivalfeltets navn (skjult)',
  'beregner.festivalPh': 'Trin 2: eksempel i festivalfeltet', 'beregner.send2': 'Trin 2: knaptekst',
  'mail.subject': 'Emne', 'mail.hello': 'Hilsen', 'mail.intro': 'Indledning', 'mail.inputs': 'Linje med deres svar',
  'mail.rangeLabel': 'Tekst under intervallet', 'mail.peakTitle': 'Afsnit 1: overskrift', 'mail.peakText': 'Afsnit 1: tekst',
  'mail.vendTitle': 'Afsnit 2: overskrift', 'mail.vendText': 'Afsnit 2: tekst', 'mail.whyTitle': 'Afsnit 3: overskrift', 'mail.whyText': 'Afsnit 3: tekst',
  'mail.nextLead': 'Næste skridt: fed start', 'mail.nextText': 'Næste skridt: tekst', 'mail.cta': 'Knaptekst', 'mail.ctaLink': 'Knappens link',
  'mail.signoff': 'Underskrift', 'mail.notifySubject': 'Emne på kopien til jer',
  // numbers
  beregner: 'Beregneren', spendPerGuestDay: 'Forbrug pr. gæst pr. dag (kr.)', foodShare: 'Madens andel af forbruget (0–1)',
  peakLoss: 'Tabt salg i spidstimer pr. kø-valg (andel, lav–høj)', low: 'Lav', high: 'Høj', recoverLow: 'Andel, der kan hentes – lav',
  recoverHigh: 'Andel, der kan hentes – høj', vendorLossLow: 'Bodernes tab – lav', vendorLossHigh: 'Bodernes tab – høj',
  vendorCutLow: 'Andel, I kan påvirke – lav', vendorCutHigh: 'Andel, I kan påvirke – høj', guestsMin: 'Gæster: mindst', guestsMax: 'Gæster: højst',
  guestsStep: 'Gæster: trin', guestsDefault: 'Gæster: start', daysMin: 'Dage: mindst', daysMax: 'Dage: højst', daysDefault: 'Dage: start',
  queueDefault: 'Kø-valg ved start (0, 1 eller 2)', roundTo: 'Afrund til (kr.)',
  hours: 'Timer', bars: 'Barernes placering på kortet', grids: 'Kø-kort pr. dag (k = kø, o = passer, t = tom)', rates: 'Tabt salg pr. kø-time pr. bar (kr.)',
  queueMinutes: 'Kø-minutter fredag (bar-time)', bar4: 'Bar 4 fredag', capacity: 'Kapacitet', basket: 'Gennemsnitligt køb (kr.)',
  decisions: 'Anbefalingernes værdi (samme rækkefølge som teksterne)', conf: 'Sikkerhed (high/medium)', slots: 'Tidsrum',
  last: 'Sidste år', next: 'Næste år', brought: 'Medbragt', deltas: 'Ændringer pr. begrundelse', aerial: 'Barernes placering på luftfotoet (%)',
  left: 'Fra venstre (%)', top: 'Fra toppen (%)', flip: 'Etiket til venstre', relaySources: 'Relay-kilder',
  // media
  heroVideo: 'Forside: video i toppen', heroVideoMobile: 'Forside: video i toppen på mobil (mindre fil)', heroPoster: 'Forside: stillbillede før videoen starter',
  statementImage: 'Forside: billede bag udsagnet', relayImage: 'Forside: baggrund i Relay', layerImage: 'Forside: billede i "Et lag af tal"',
  aerialImage: 'Forside: luftfoto i fredag aften', nightVideo: 'Forside: video i bunden', nightPoster: 'Forside: stillbillede til videoen i bunden',
  auditCtaImage: 'Indsigt: billede i bunden', planCtaImage: 'Plan: billede i bunden', partnerHeroImage: 'Bliv partner: billede i toppen',
  shareImage: 'Billede, når siden deles (fx på LinkedIn)',
};
const HINT = {
  'beregner.q': 'Rækkefølgen betyder noget: sjældent, nogle aftener, de fleste aftener.',
  'mail.ctaLink': 'Fx mailto:hello@livelayer.dk eller et link til en kalender.',
  'mail.subject': TOKENS, 'mail.hello': TOKENS, 'mail.notifySubject': 'Du kan bruge {email}, {navn} og {festival}. Tekst i [ ] vises kun, hvis det er udfyldt.', 'mail.inputs': TOKENS, 'mail.intro': TOKENS, 'mail.peakText': TOKENS, 'mail.vendText': TOKENS,
  'mail.whyText': TOKENS, 'mail.nextText': TOKENS, 'mail.signoff': 'Hver linje står på sin egen linje i mailen.',
  peakLoss: 'Tre rækker: sjældent, nogle aftener, de fleste aftener. 0,03 = 3 % af salget.',
  heroVideo: 'MP4 uden lyd, helst under 10 MB.', heroVideoMobile: 'MP4, helst under 3 MB.', nightVideo: 'MP4 uden lyd, helst under 10 MB.',
};
const IMAGE_HINT = 'JPG eller PNG. Store billeder bliver automatisk gjort mindre til mobil.';
const human = (k) => k.charAt(0).toUpperCase() + k.slice(1).replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
const label = (path, k) => LABEL[`${path.at(-1)}.${k}`] || LABEL[k] || human(k);
const hint = (path, k) => HINT[`${path.at(-1)}.${k}`] || HINT[k];
const isLong = (s) => typeof s === 'string' && (s.length > 70 || s.includes('\n'));

function field(name, sample, path, samples = [sample]) {
  // Required unless the field is empty somewhere today, so a save can't silently blank a text on the site.
  const empty = samples.some((x) => x === '' || x === null || (Array.isArray(x) && !x.length));
  const f = { name, label: label(path, name), required: !empty };
  const h = hint(path, name);
  if (h) f.hint = h;
  if (typeof sample === 'string' && /^\/media\/.+\.(jpe?g|png|webp|gif|svg)$/i.test(sample)) return { ...f, widget: 'image', hint: h || IMAGE_HINT, choose_url: false };
  if (typeof sample === 'string' && /^\/media\/.+\.(mp4|webm|mov)$/i.test(sample)) return { ...f, widget: 'file', choose_url: false };
  if (typeof sample === 'string') return { ...f, widget: samples.some(isLong) ? 'text' : 'string' };
  if (typeof sample === 'number') return { ...f, widget: 'number', value_type: samples.every(Number.isInteger) ? 'int' : 'float', step: samples.every(Number.isInteger) ? 1 : 0.01 };
  if (typeof sample === 'boolean') return { ...f, widget: 'boolean' };
  if (Array.isArray(sample)) {
    const all = samples.flatMap((s) => (Array.isArray(s) ? s : []));
    const first = all.find((x) => x !== undefined && x !== null);
    if (first && typeof first === 'object' && !Array.isArray(first)) {
      const keys = [...new Set(all.flatMap(Object.keys))];
      const fields = keys.map((k) => field(k, all.find((x) => x[k] !== undefined)[k], [...path, name], all.map((x) => x[k]).filter((x) => x !== undefined)));
      const sum = ['t', 'q', 'name', 'k', 'n', 'value'].find((k) => keys.includes(k));
      return { ...f, widget: 'list', collapsed: true, ...(sum ? { summary: `{{fields.${sum}}}` } : {}), fields };
    }
    if (Array.isArray(first)) return { ...f, widget: 'list', field: { name: 'raekke', label: 'Række', widget: 'string' } }; // not used today
    return { ...f, widget: 'list', collapsed: false, summary: '{{fields.item}}', field: { ...field('item', first ?? '', [...path, name], all), label: label(path, name) } };
  }
  if (sample && typeof sample === 'object') {
    return { ...f, widget: 'object', collapsed: path.length > 0, fields: Object.keys(sample).map((k) => field(k, sample[k], [...path, name], samples.map((s) => s?.[k]).filter((x) => x !== undefined))) };
  }
  return { ...f, widget: 'string' };
}

function fileEntry(name, lbl, file, { hidden = [] } = {}) {
  const data = read(file);
  const stem = file.replace(/^.*\/|\.json$/g, '');
  return {
    name, label: lbl, file,
    fields: Object.keys(data).map((k) => hidden.includes(k)
      ? { name: k, label: k, widget: 'hidden', default: data[k] }
      : field(k, data[k], [stem])),
  };
}

const pages = (L) => [
  fileEntry('forside', 'Forside', `content/${L}/forside.json`),
  fileEntry('beregner', 'Beregner og mail', `content/${L}/beregner.json`),
  fileEntry('indsigt', 'Indsigt', `content/${L}/indsigt.json`),
  fileEntry('plan', 'Plan', `content/${L}/plan.json`),
  fileEntry('partner', 'Bliv partner', `content/${L}/partner.json`),
  fileEntry('faelles', 'Menu, sidefod og skærmbilleder', `content/${L}/faelles.json`, { hidden: ['lang', 'other'] }),
];

const config = {
  load_config_file: false,
  locale: 'da',
  backend: { name: 'github', repo: 'bjorntofca/livelayer-website', branch: 'main', base_url: 'https://livelayer.dk', auth_endpoint: 'api/auth', commit_messages: { update: 'Opdatér {{slug}}', uploadMedia: 'Upload {{path}}', deleteMedia: 'Slet {{path}}' } },
  local_backend: true,
  publish_mode: 'simple',
  site_url: 'https://livelayer.dk',
  display_url: 'https://livelayer.dk',
  logo_url: '/admin/logo.svg',
  media_folder: 'public/media',
  public_folder: '/media',
  collections: [
    { name: 'dansk', label: 'Dansk', editor: { preview: false }, files: pages('da') },
    { name: 'english', label: 'English', editor: { preview: false }, files: pages('en') },
    { name: 'medier', label: 'Billeder og video', editor: { preview: false }, files: [fileEntry('medier', 'Billeder og video', 'content/medier.json')] },
    { name: 'tal', label: 'Tal og beregner', editor: { preview: false }, files: [fileEntry('tal', 'Tal bag graferne og beregneren', 'content/tal.json')] },
  ],
};
writeFileSync(join(base, 'public/admin/config.json'), JSON.stringify(config, null, 2) + '\n');
console.log('wrote public/admin/config.json');
