// Renders every page (DA at the root, EN under /en/) into site/, from the JSON files in content/
// (edited through the admin at /admin/).
// LINK_INDEX=1 makes internal links point at .../index.html (for previews that don't resolve folders).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as D from './data.mjs';

const base = join(dirname(fileURLToPath(import.meta.url)), '..');
const root = join(base, 'site');
const J = (p) => JSON.parse(readFileSync(join(base, 'content', p), 'utf8'));
const M = J('medier.json');
const language = (L) => ({ ...J(`${L}/faelles.json`), home: J(`${L}/forside.json`), audit: J(`${L}/indsigt.json`), plan: J(`${L}/plan.json`), partner: J(`${L}/partner.json`), calc: J(`${L}/beregner.json`) });
const da = language('da');
const en = language('en');
const LINK_INDEX = !!process.env.LINK_INDEX;
const SITE = 'https://livelayer.dk/';

const routes = {
  home: { da: '', en: 'en/' },
  audit: { da: 'indsigt/', en: 'en/insight/' },
  plan: { da: 'plan/', en: 'en/plan/' },
  partner: { da: 'partner/', en: 'en/partner/' },
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const depth = (p) => p.split('/').filter(Boolean).length;
const up = (from) => '../'.repeat(depth(from));
const href = (from, to) => {
  const target = up(from) + to + (LINK_INDEX ? 'index.html' : '');
  return target === '' ? './' : target;
};
// Media paths come from content/medier.json as "/media/name.jpg".
const media = (from, f) => `${up(from)}${String(f).replace(/^\//, '')}`;
const json = (o) => JSON.stringify(o).replace(/'/g, '&#39;');
const sign = (n, L) => `${n > 0 ? '+' : '−'}${D.nf(Math.abs(n), L)}`;

// A smaller "-sm" copy is used on phones when it exists (scripts/media.mjs makes one for new uploads).
function picture(from, path, alt, cls = '', sizes = '100vw', loading = 'lazy') {
  const sm = String(path).replace(/(\.[a-z0-9]+)$/i, '-sm$1');
  const srcset = existsSync(join(base, 'public', sm)) ? ` srcset="${media(from, sm)} 960w, ${media(from, path)} 2000w" sizes="${sizes}"` : '';
  return `<img class="${cls}" src="${media(from, path)}"${srcset} alt="${esc(alt || '')}" loading="${loading}" decoding="async">`;
}

/* The mark: two L's that frame a live point – LiveLayer as a frame laid over an event. */
const MARK = `<svg class="mark" viewBox="0 0 32 32" aria-hidden="true" focusable="false"><path fill="currentColor" d="M3 8.5V29h15.5v-4.5H7.5V8.5z"/><path fill="currentColor" d="M29 23.5V3H13.5v4.5h11v16z"/><circle class="mark-dot" cx="16" cy="16" r="3.2"/></svg>`;

function header(t, key, from) {
  const n = t.common.nav;
  const cur = (k) => (k === key ? ' aria-current="page"' : '');
  const L = t.lang;
  return `<a class="skip" href="#main">${t.common.skip}</a>
<header class="site-header" data-header>
  <div class="wrap nav">
    <a class="brand" href="${href(from, routes.home[L])}" aria-label="${esc(n.home)}">${MARK}<span>LiveLayer</span></a>
    <button class="menu-btn" type="button" aria-expanded="false" aria-controls="nav-links" data-menu data-open-label="${esc(n.menu)}" data-close-label="${esc(n.close)}">${n.menu}</button>
    <nav class="nav-links" id="nav-links" aria-label="Main">
      <a href="${href(from, routes.audit[L])}"${cur('audit')}>${n.audit}</a>
      <a href="${href(from, routes.plan[L])}"${cur('plan')}>${n.plan}</a>
      <a href="${href(from, routes.partner[L])}"${cur('partner')}>${n.partner}</a>
      <a href="${href(from, routes[key][t.other])}" hreflang="${t.other}" lang="${t.other}">${t.otherLabel}</a>
      <a class="btn btn-sm" href="${href(from, routes.partner[L])}#kontakt">${n.cta}</a>
    </nav>
  </div>
</header>`;
}

function footer(t, key, from) {
  const L = t.lang;
  const n = t.common.nav;
  const f = t.common.footer;
  return `<footer class="site-footer">
  <div class="wrap">
    <p class="footer-tag">${f.tagline}</p>
    <p class="footer-soon muted">${f.soon}</p>
    <a class="wordmark" href="${href(from, routes.home[L])}" aria-label="${esc(n.home)}">${MARK}<span>LiveLayer</span></a>
    <div class="footer-row">
      <nav aria-label="${esc(f.pages)}">
        <a href="${href(from, routes.audit[L])}">${n.audit}</a>
        <a href="${href(from, routes.plan[L])}">${n.plan}</a>
        <a href="${href(from, routes.partner[L])}">${n.partner}</a>
        <a href="${href(from, routes[key][t.other])}" hreflang="${t.other}" lang="${t.other}">${t.otherLabel}</a>
        <a href="mailto:${f.contact}">${f.contact}</a>
      </nav>
    </div>
  </div>
</footer>`;
}

function layout(t, key, page, body) {
  const from = routes[key][t.lang];
  const alt = routes[key][t.other];
  return `<!doctype html>
<html lang="${t.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(page.title)}</title>
<meta name="description" content="${esc(page.description)}">
<meta name="theme-color" content="#ffffff">
<link rel="canonical" href="${SITE}${from}">
<link rel="alternate" hreflang="${t.lang}" href="${SITE}${from}">
<link rel="alternate" hreflang="${t.other}" href="${SITE}${alt}">
<link rel="alternate" hreflang="x-default" href="${SITE}${routes[key].da}">
<meta property="og:title" content="${esc(page.title)}">
<meta property="og:description" content="${esc(page.description)}">
<meta property="og:image" content="${SITE}${String(M.shareImage).replace(/^\//, '')}">
<meta property="og:locale" content="${t.lang === 'da' ? 'da_DK' : 'en_GB'}">
<link rel="icon" href="${up(from)}favicon.svg" type="image/svg+xml">
<link rel="icon" href="${up(from)}favicon.ico" sizes="48x48">
<link rel="apple-touch-icon" href="${up(from)}apple-touch-icon.png">
<script>if('scrollRestoration' in history&&!location.hash){history.scrollRestoration='manual';}</script>
<script type="module" src="${up(from)}src/main.js"></script>
</head>
<body data-page="${key}"${key === 'home' || key === 'partner' ? ' data-hero="media"' : ''}>
${header(t, key, from)}
<main id="main">
${body}
</main>
${footer(t, key, from)}
</body>
</html>
`;
}

const lines = (arr) => arr.map((l) => `<span class="line"><span class="line-inner">${l}</span></span>`).join('');

/* ---------- illustrations ---------- */

const SIG = '#3b55e6', SIG2 = '#8b5cf6';
const grad = (id, vertical = false) => `<linearGradient id="${id}" x1="0" y1="${vertical ? 1 : 0}" x2="${vertical ? 0 : 1}" y2="0"><stop offset="0" stop-color="${SIG}"/><stop offset="1" stop-color="${SIG2}"/></linearGradient>`;

// Heat as rounded strips: one strip per bar, one segment per state.
function stripHeat(t, days, { labels = true, cls = 'sh-a', rh = 20, rg = 12, hw = 30 } = {}) {
  const lw = labels ? 120 : 0;
  const dayGap = 30;
  const dayW = 10 * hw;
  const top = labels ? 34 : 0;
  const gridH = 7 * rh + 6 * rg;
  const bottom = labels ? 30 : 0;
  const W = lw + days.length * dayW + (days.length - 1) * dayGap;
  const H = top + gridH + bottom;
  const x0 = (di) => lw + di * (dayW + dayGap);
  const ry = (b) => top + b * (rh + rg);
  let out = `<defs>${grad(`gq-${cls}`)}</defs>`;
  days.forEach((day, di) => {
    if (labels) {
      if (days.length > 1) out += `<text class="sh-day" x="${x0(di)}" y="${top - 14}">${t.common.days[['fri', 'sat', 'sun'].indexOf(day)]}</text>`;
      [0, 4, 9].forEach((h) => { out += `<text class="sh-hr" x="${x0(di) + h * hw + 2}" y="${top + gridH + 22}">${D.hours[h]}</text>`; });
    }
    D.grids[day].forEach((row, b) => {
      let h = 0;
      while (h < row.length) {
        let e = h;
        while (e + 1 < row.length && row[e + 1] === row[h]) e++;
        const c = row[h];
        const fill = c === 'k' ? `url(#gq-${cls})` : c === 'o' ? 'var(--fit)' : 'none';
        out += `<rect class="sh-s sh-${c}" data-col="${di * 10 + h}" x="${x0(di) + h * hw + 2}" y="${ry(b) + (c === 't' ? 1 : 0)}" width="${(e - h + 1) * hw - 4}" height="${rh - (c === 't' ? 2 : 0)}" rx="${rh / 2}" fill="${fill}"></rect>`;
        h = e + 1;
      }
    });
  });
  if (labels) t.common.barNames.forEach((n, b) => { out += `<text class="sh-bar" x="0" y="${ry(b) + rh * 0.72}">${t.common.bar} ${b + 1}</text>`; });
  return `<svg class="sh ${cls}" viewBox="0 0 ${W} ${H}" aria-hidden="true">${out}</svg>`;
}

/* Product shots: what you actually get, shown as the real screens */
function uiBar(t, active, meta) {
  return `<div class="ui-bar"><span class="ui-brand">${MARK}LiveLayer</span><span class="ui-tabs">${t.ui.tabs.map((x, i) => `<span${i === active ? ' class="on"' : ''}>${x}</span>`).join('')}</span><span class="ui-meta">${meta}</span></div>`;
}

function insightScreen(t) {
  const u = t.ui;
  const L = t.lang;
  let lost = 0, empty = 0;
  ['fri', 'sat', 'sun'].forEach((d) => { const x = D.dayTotals(d); lost += x.lost; empty += x.empty; });
  return `<div class="ui">
    ${uiBar(t, 0, u.season)}
    <div class="ui-main">
      <div class="ui-head"><b>${u.season}</b><span>${u.days}</span></div>
      <div class="ui-kpis">
        <div><span>${u.lost}</span><b>${D.kr(lost, L)}</b></div>
        <div><span>${u.empty}</span><b>${empty}</b></div>
        <div><span>${u.top}</span><b>${u.topV}</b><em>${u.topS}</em></div>
      </div>
      <div class="ui-grid">
        <div class="ui-card"><p class="ui-cap">${u.panel}</p>${stripHeat(t, ['fri'], { cls: 'sh-ui', rh: 16, rg: 9, hw: 34 })}</div>
        <div class="ui-card ui-list">${u.findings.map((f) => `<div class="ui-row"><span><b>${f.t}</b><em>${f.s}</em></span><strong>${f.v}</strong></div>`).join('')}</div>
      </div>
    </div>
  </div>`;
}

function planScreen(t) {
  const u = t.ui;
  const L = t.lang;
  const items = t.plan.ledger.items;
  const maxV = Math.max(...D.decisions.map((d) => d.value));
  const pick = [0, 4, 1, 2, 5, 7];
  const N = D.explorer[0];
  const pct = (n) => (((n - 1600) / (2800 - 1600)) * 100).toFixed(1);
  return `<div class="ui">
    ${uiBar(t, 1, u.plan)}
    <div class="ui-main">
      <div class="ui-head ui-head-split"><span><b>${u.plan}</b><span>${u.recs}</span></span><span class="ui-total"><em>${u.total}</em><b>+${D.kr(D.planTotal, L)}</b></span></div>
      <div class="ui-grid ui-grid-plan">
        <div class="ui-card ui-recs">${pick.map((i, k) => `<div class="ui-rec"><i class="${k < 4 ? 'on' : ''}"></i><span>${esc(items[i])}</span><span class="ui-bar-v"><span style="width:${((D.decisions[i].value / maxV) * 100).toFixed(0)}%"></span></span><strong>+${D.nf(D.decisions[i].value, L)}</strong></div>`).join('')}</div>
        <div class="ui-card ui-vendor"><p class="ui-cap">${u.vendor}</p><b>${u.vendorV}</b><span>${u.vendorU}</span>
          <div class="ui-band"><span style="left:${pct(N.low)}%;width:${(pct(N.high) - pct(N.low))}%"></span><i style="left:${pct(Math.round(1975 * 1.125))}%"></i></div>
          <div class="ui-why"><div><span>${t.explorer.base}</span><b>${D.nf(N.base, L)}</b></div>${t.explorer.vendors[0].reasons.map((r, k) => `<div><span>${r.t}</span><b class="${N.deltas[k] < 0 ? 'dn' : 'up'}">${sign(N.deltas[k], L)}</b></div>`).join('')}</div>
          <em>${u.vendorS}</em></div>
      </div>
    </div>
  </div>`;
}

function shot(screen, cls = '') {
  return `<div class="shot ${cls}"><div class="device"><div class="screen">${screen}</div></div></div>`;
}

/* Relay: year over year, plus other festivals modelled to your context */
function relaySVG(t, compact = false) {
  const v = t.home.relay.vis;
  const R = D.relayYear();
  const W = compact ? 720 : 1200, H = compact ? 560 : 540;
  const x0 = compact ? 120 : 170, x1 = compact ? 520 : 900;
  const dx = (x1 - x0) / 365;
  const X = (i) => x0 + i * dx + dx / 2;
  const rows = compact ? [130, 210, 290] : [120, 200, 280];
  const oy = compact ? 430 : 410;
  const nx = compact ? 660 : 1110, ny = rows[2];
  const cx = compact ? 600 : 1000, cy = rows[2] + (compact ? 70 : 60);
  const you = R.days.filter((d) => d.kind === 'you').map((d) => d.i);
  const yx = X(you[1]);
  let years = '';
  rows.forEach((y, k) => {
    const cls = k === 2 ? 'rv-y rv-y-now' : 'rv-y rv-y-old';
    years += `<g class="${cls}"><line class="rv-row" x1="${x0}" x2="${x1}" y1="${y}" y2="${y}"></line><text class="rv-yl" x="${x0 - 24}" y="${y + 7}" text-anchor="end">${v.years[k]}</text>
      ${you.map((i) => `<rect class="rv-you" x="${X(i) - 2.5}" y="${y - 18}" width="5" height="36" rx="2.5"></rect>`).join('')}</g>`;
  });
  const chain = `<g class="rv-l2">
    <path class="rv-arc rv-arc-you" d="M${yx + 6} ${rows[0]} C ${yx + 70} ${rows[0]}, ${yx + 70} ${rows[1]}, ${yx + 6} ${rows[1]}"></path>
    <path class="rv-arc rv-arc-you" d="M${yx + 6} ${rows[1]} C ${yx + 70} ${rows[1]}, ${yx + 70} ${rows[2]}, ${yx + 6} ${rows[2]}"></path>
    <path class="rv-arc rv-arc-you" d="M${yx + 8} ${rows[2]} C ${yx + 240} ${rows[2] - 110}, ${nx - 220} ${ny}, ${nx - 22} ${ny}"></path>
    <circle class="rv-node" cx="${nx}" cy="${ny}" r="${compact ? 16 : 18}"></circle>
    <text class="rv-lab" x="${compact ? nx : nx + 20}" y="${ny - 34}" text-anchor="${compact ? 'middle' : 'end'}">${compact ? '2027' : v.next}</text>
  </g>`;
  let others = '';
  R.days.forEach((d) => {
    if (d.kind === 'fest' || d.kind === 'concert') {
      const h = d.kind === 'fest' ? 30 : 16;
      others += `<rect class="rv-o rv-o-${d.kind}" x="${X(d.i) - 1.6}" y="${oy - h / 2}" width="3.2" height="${h}" rx="1.6"></rect>`;
    }
  });
  const srcs = [...D.relaySources.map((c) => R.clusters[c]), R.concertSource];
  const oarcs = srcs.map((s) => `<path class="rv-arc rv-arc-o" d="M${X(s)} ${oy - 18} C ${X(s)} ${oy - 90}, ${cx - 80} ${cy + 40}, ${cx - 18} ${cy}"></path>`).join('');
  const months = t.home.relay.months.map((m, k) => {
    const doy = Math.round((Date.UTC(2026, k, 1) - Date.UTC(2026, 0, 1)) / 86400000);
    return compact && k % 2 ? '' : `<text class="rv-m" x="${X(doy)}" y="${oy + 52}">${m}</text>`;
  }).join('');
  const l3 = `<g class="rv-l3">
    <line class="rv-row" x1="${x0}" x2="${x1}" y1="${oy}" y2="${oy}"></line>
    <text class="rv-lab rv-lab-sig" x="${x0}" y="${compact ? oy + 92 : oy - 44}">${v.others}</text>
    ${others}${oarcs}
    <circle class="rv-ctx" cx="${cx}" cy="${cy}" r="18"></circle>
    <path class="rv-arc rv-arc-ctx" d="M${cx + 14} ${cy - 12} C ${cx + 50} ${cy - 40}, ${nx - 30} ${ny + 30}, ${nx - 12} ${ny + 12}"></path>
    <text class="rv-sub" x="${cx}" y="${cy + 48}" text-anchor="middle">${v.ctx}</text>
  </g>`;
  return `<svg class="rv ${compact ? 'rv-compact' : 'rv-wide'}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(t.home.relay.h2)}">
    <text class="rv-lab" x="${x0}" y="${rows[0] - 46}">${v.you}</text>
    ${years}${chain}${l3}${months}
  </svg>`;
}

function relayRead(t) {
  const r = t.home.relay;
  const m = r.margin;
  return `<div class="rv-read">
    ${r.read.map((x, i) => `<div class="rr" data-read="${i + 1}"><b>${x.v}</b><span>${x.s}</span></div>`).join('')}
    <div class="rr rr-m" data-read="4">
      <p class="rr-k">${m.k}</p>
      <div class="rr-line"><span>${m.est}</span><b>${m.estV}</b></div>
      <div class="rr-line"><span>${m.m}</span><b>${m.mV}</b></div>
      <div class="rr-line rr-rec"><span>${m.rec}</span><b>${m.recV}</b></div>
      <p class="rr-f">${m.f}</p>
    </div>
  </div>`;
}

// The layer: marks drawn straight onto the photo (queue trail, a sparkline, one big number), no boxes.
function layerMarks(t) {
  const g = t.home.layer.tags;
  const heads = [[722, 462], [814, 436], [1066, 528], [1152, 504]];
  const q = [0, 3, 8, 6, 4, 2, 1];
  const sx = (i) => 72 + i * 70, sy = (v) => 742 - v * 12;
  const pts = q.map((v, i) => [sx(i), sy(v)]);
  const line = smooth(pts);
  const area = `${line} L${sx(q.length - 1)} 742 L${sx(0)} 742 Z`;
  return `<svg class="lm" viewBox="0 0 1200 800" aria-hidden="true">
      <defs>${grad('lm-g')}<linearGradient id="lm-a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
      <path class="lm-trail" d="M${heads.map((h) => h.join(' ')).join(' L')}"></path>
      ${heads.map(([x, y], i) => `<circle class="lm-head${i === 0 ? ' is-first' : ''}" cx="${x}" cy="${y}" r="${i === 0 ? 15 : 11}"></circle>`).join('')}
      <path d="${area}" fill="url(#lm-a)"></path>
      <path class="lm-spark" d="${line}"></path>
      <circle cx="${sx(2)}" cy="${sy(8)}" r="11" fill="url(#lm-g)" stroke="#fff" stroke-width="3"></circle>
      ${[0, 2, 6].map((i) => `<text class="lm-t" x="${sx(i)}" y="772" text-anchor="middle">${17 + i}</text>`).join('')}
    </svg>
    <span class="lm-pill" style="left:${(722 / 12 + 1.5).toFixed(1)}%;top:${(462 / 8 - 3).toFixed(1)}%"><i></i>${g[1].k} ${g[1].v}</span>
    <p class="lm-place">${g[0].k} · ${g[0].v}</p>
    <div class="lm-big"><b>${g[3].v}</b><span>${g[3].k} · ${g[2].v} ${g[2].k.toLowerCase()}</span><small>${t.home.layer.spark}</small></div>`;
}

function aerialScene(t) {
  const h = t.home.night;
  const L = t.lang;
  const names = t.common.barNames;
  const scene = { grid: D.grids.fri, q: D.queueMinutes, tl: D.fridayTimeline(), hours: D.hours, captions: h.captions, lang: L, state: t.common.state };
  const marks = D.aerial.map((p, i) => `<div class="mk${p.flip ? ' mk-flip' : ''}" data-bar="${i}" data-s="o" style="left:${p.left}%;top:${p.top}%">
      <span class="mk-pin" aria-hidden="true"></span>
      <span class="mk-tag"><b>${t.common.bar} ${i + 1}</b><span class="mk-name">${esc(names[i])}</span><span class="mk-q tnum" data-q></span></span>
    </div>`).join('');
  return `<section class="aer" id="fredag" aria-labelledby="night-title" data-night='${json(scene)}'>
  <div class="aer-stage" data-night-stage>
    <div class="aer-frame">
      <div class="aer-box">
        ${picture(routes.home[L], M.aerialImage, h.alt, 'aer-img', '100vw')}
        <div class="aer-marks">${marks}</div>
      </div>
      <div class="aer-panel">
        <h2 id="night-title" class="aer-h">${h.h2}</h2>
        <p class="aer-clock tnum"><span data-clock>17:00</span></p>
        <p class="aer-cap" data-caption aria-live="polite">${h.captions[0]}</p>
        <div class="aer-counters">
          <p><b class="tnum" data-lost>${D.kr(0, L)}</b><span>${h.lost}</span></p>
          <p><b class="tnum" data-empty>0</b><span>${h.empty}</span></p>
        </div>
        <div class="aer-ctrl">
          <label for="night-range" class="sr">${h.slider}</label>
          <input class="range" id="night-range" type="range" min="0" max="9" step="1" value="0" data-range>
        </div>
        <p class="legend"><span><i class="lg-k"></i>${t.common.state.k}</span><span><i class="lg-o"></i>${t.common.state.o}</span><span><i class="lg-t"></i>${t.common.state.t}</span></p>
      </div>
    </div>
  </div>
</section>`;
}

/* Vendor estimates with their reasoning (the "why" behind every range) */
function explorer(t, idBase) {
  const X = t.explorer;
  const L = t.lang;
  const tabs = X.vendors.map((v, i) => `<button type="button" role="tab" id="${idBase}-t${i}" aria-controls="${idBase}-p${i}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${v.name}</button>`).join('');
  const panels = X.vendors.map((v, i) => {
    const N = D.explorer[i];
    const mid = N.base + N.deltas.reduce((a, b) => a + b, 0);
    let run = N.base;
    let peak = N.base, low = N.base;
    N.deltas.forEach((dl) => { run += dl; peak = Math.max(peak, run); low = Math.min(low, run); });
    // Zoomed axis so each reason is visible: from a little under the lowest value to a little over the highest.
    const hi = Math.max(N.brought, N.high, peak), lo = Math.min(N.low, low);
    const pad = (hi - lo) * 0.25;
    const a0 = Math.max(0, lo - pad), a1 = hi + pad * 0.6;
    const pct = (n) => (((n - a0) / (a1 - a0)) * 100).toFixed(2);
    let cum = N.base;
    const rows = v.reasons.map((r, k) => {
      const dl = N.deltas[k];
      const a = Math.min(cum, cum + dl), b = Math.max(cum, cum + dl);
      cum += dl;
      return `<details class="ex-row"${k === 0 ? ' open' : ''}>
        <summary><span class="ex-t">${r.t}</span><span class="ex-track" aria-hidden="true"><span class="ex-bar ${dl > 0 ? 'is-up' : 'is-down'}" style="left:${pct(a)}%;width:${(pct(b) - pct(a)).toFixed(2)}%"></span></span><span class="ex-n tnum">${sign(dl, L)}</span></summary>
        <div class="ex-d"><p>${r.d}</p><p class="ex-src">${X.src[r.src]}</p></div>
      </details>`;
    }).join('');
    return `<div class="ex-panel" role="tabpanel" id="${idBase}-p${i}" aria-labelledby="${idBase}-t${i}"${i ? ' hidden' : ''}>
      <div class="ex-head">
        <p class="ex-k">${v.name} · ${X.day}</p>
        <p class="ex-v"><b class="tnum">${D.nf(N.low, L)}–${D.nf(N.high, L)}</b> <span>${v.unit}</span></p>
        <p class="ex-unc">${X.unc} ${v.unc}</p>
      </div>
      <div class="ex-body">
        <p class="ex-why">${X.why}</p>
        <div class="ex-row ex-base"><span class="ex-t">${X.base}<small>${v.base}</small></span><span class="ex-track" aria-hidden="true"><span class="ex-bar is-base" style="left:0;width:${pct(N.base)}%"></span><span class="ex-cut"></span></span><span class="ex-n tnum">${D.nf(N.base, L)}</span></div>
        ${rows}
        <div class="ex-row ex-result"><span class="ex-t">${X.est}<small>${X.brought}: ${D.nf(N.brought, L)}</small></span><span class="ex-track" aria-hidden="true"><span class="ex-band" style="left:${pct(N.low)}%;width:${(pct(N.high) - pct(N.low)).toFixed(2)}%"></span><span class="ex-mid" style="left:${pct(mid)}%"></span><span class="ex-brought" style="left:${pct(N.brought)}%"></span></span><span class="ex-n tnum">${D.nf(N.low, L)}–${D.nf(N.high, L)}</span></div>
      </div>
    </div>`;
  }).join('');
  return `<div class="ex" data-explorer>
    <div class="ex-tabs" role="tablist" aria-label="${esc(X.tabs)}">${tabs}</div>
    ${panels}
  </div>`;
}

/* ---------- charts ---------- */

function heatmap(t) {
  const L = t.lang;
  const names = t.common.barNames;
  const day = 'fri';
  const tot = D.dayTotals(day);
  const rows = D.grids[day].map((row, b) => `
    <div class="heat-row" data-row="${b}">
      <span class="heat-name">${t.common.bar} ${b + 1}<small>${esc(names[b])}</small></span>
      ${[...row].map((c) => `<span class="cell" data-c="${c}"></span>`).join('')}
      <span class="heat-val tnum" data-val>${tot.perBar[b] ? D.kr(tot.perBar[b], L) : '–'}</span>
    </div>`).join('');
  const payload = { grids: D.grids, rates: D.rates };
  return `<div class="heat" data-heat='${JSON.stringify(payload)}' data-lang="${L}" role="img" aria-label="${esc(t.audit.heat.h2)}">
    <div class="heat-row heat-hours tnum"><span></span>${D.hours.map((h) => `<span>${h}</span>`).join('')}<span></span></div>
    ${rows}
  </div>
  <div class="heat-total">
    <p><b class="tnum" data-heat-lost>${D.kr(tot.lost, L)}</b> <span class="muted">${t.audit.heat.total}</span></p>
    <p class="muted"><span class="tnum" data-heat-empty>${tot.empty}</span> ${t.audit.heat.empty}</p>
  </div>`;
}

function ledger(t) {
  const w = t.plan.ledger;
  const L = t.lang;
  const maxV = Math.max(...D.decisions.map((d) => d.value));
  const rows = D.decisions.map((d, i) => `<tr data-r>
      <td class="lg-dec">${esc(w.items[i])}</td>
      <td class="lg-conf conf-${d.conf}">${t.common.conf[d.conf]}</td>
      <td class="lg-bar" aria-hidden="true"><span style="width:${((d.value / maxV) * 100).toFixed(1)}%"></span></td>
      <td class="lg-val">+${D.nf(d.value, L)}</td>
    </tr>`).join('');
  return `<table class="ledger" data-chart="ledger">
    <thead><tr><th scope="col">${w.cols[0]}</th><th scope="col">${w.cols[1]}</th><th scope="col"><span class="sr">${w.cols[2]}</span></th><th scope="col" class="lg-val">${w.cols[2]}</th></tr></thead>
    <tbody>${rows}</tbody>
    <tfoot><tr><th scope="row" colspan="3">${w.total}</th><td class="lg-val">+${D.kr(D.planTotal, L)}</td></tr></tfoot>
  </table>`;
}

// Smooth path through points (Catmull-Rom → Bézier)
function smooth(pts) {
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${c1[0].toFixed(1)} ${c1[1].toFixed(1)}, ${c2[0].toFixed(1)} ${c2[1].toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

function demandChart(t) {
  const c = t.audit.demand;
  const W = 1000, H = 440, pl = 56, pr = 24, pt = 48, pb = 48, max = 800;
  const x = (i) => pl + (i * (W - pl - pr)) / (D.hours.length - 1);
  const y = (v) => pt + (1 - v / max) * (H - pt - pb);
  const d = D.bar4.demand;
  const pts = d.map((v, i) => [x(i), y(v)]);
  const line = smooth(pts);
  const area = `${line} L${x(d.length - 1)} ${y(0)} L${x(0)} ${y(0)} Z`;
  const cap = y(D.bar4.capacity);
  const ticks = [0, 400, 800].map((v) => `<text class="ax" x="${pl - 14}" y="${y(v) + 5}" text-anchor="end">${v}</text>`).join('');
  const grid = [200, 400, 600, 800].map((v) => `<line class="grid" x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}"></line>`).join('');
  const xt = D.hours.map((h, i) => `<text class="ax" x="${x(i)}" y="${H - 12}" text-anchor="middle">${h}</text>`).join('');
  const lost = Math.round(((D.bar4.demand[4] - D.bar4.capacity) + (D.bar4.demand[5] - D.bar4.capacity)) * D.bar4.basket / 1000) * 1000;
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(c.p)} ${esc(c.note)}" data-chart="demand">
    <defs>${grad('gd-line')}<linearGradient id="gd-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${SIG}" stop-opacity="0.22"/><stop offset="1" stop-color="${SIG}" stop-opacity="0"/></linearGradient>
      <clipPath id="gd-over"><rect x="0" y="0" width="${W}" height="${cap}"></rect></clipPath></defs>
    ${grid}${ticks}${xt}
    <path d="${area}" fill="url(#gd-area)" data-gap></path>
    <path d="${area}" fill="${SIG2}" opacity="0.28" clip-path="url(#gd-over)" data-gap></path>
    <line class="c-cap" x1="${pl}" x2="${W - pr}" y1="${cap}" y2="${cap}"></line>
    <text class="c-lab" x="${W - pr}" y="${cap + 28}" text-anchor="end">${c.capacity} · 520</text>
    <path class="c-line" d="${line}" stroke="url(#gd-line)" data-line></path>
    <circle cx="${x(5)}" cy="${y(d[5])}" r="7" fill="${SIG2}" stroke="#fff" stroke-width="3" data-note></circle>
    <text class="c-note" x="${(x(4) + x(5)) / 2}" y="${y(d[5]) - 24}" text-anchor="middle" data-note>${c.note.replace('32.000', D.nf(lost, t.lang)).replace('32,000', D.nf(lost, t.lang))}</text>
  </svg>`;
}

function staffingChart(t) {
  const s = t.plan.staffing;
  const W = 1000, H = 450, pl = 20, pr = 20, pt = 56, pb = 78, max = 7;
  const n = D.staffing.slots.length;
  const colW = (W - pl - pr) / n;
  const bw = Math.min(64, colW * 0.3);
  const y = (v) => pt + (1 - v / max) * (H - pt - pb);
  const base = y(0);
  let bars = '';
  D.staffing.slots.forEach((sl, i) => {
    const cx = pl + i * colW + colW / 2;
    const l = D.staffing.last[i], nx = D.staffing.next[i];
    bars += `<rect class="c-bar-last" x="${cx - bw - 5}" y="${y(l)}" width="${bw}" height="${base - y(l)}" rx="10"></rect>
      <rect class="c-bar-next" x="${cx + 5}" y="${y(nx)}" width="${bw}" height="${base - y(nx)}" rx="10" fill="url(#gs-v)"></rect>
      <text class="c-val" x="${cx + 5 + bw / 2}" y="${y(nx) - 14}" text-anchor="middle">${nx}</text>
      <text class="c-val c-val-last" x="${cx - 5 - bw / 2}" y="${y(l) - 14}" text-anchor="middle">${l}</text>
      <text class="ax ax-m" x="${cx}" y="${H - 34}" text-anchor="middle">${esc(s.moments[i])}</text>
      <text class="ax" x="${cx}" y="${H - 10}" text-anchor="middle">${sl}</text>`;
  });
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(s.p)}" data-chart="staffing">
    <defs>${grad('gs-v', true)}</defs>
    <line class="grid" x1="${pl}" x2="${W - pr}" y1="${base}" y2="${base}"></line>
    ${bars}
  </svg>
  <p class="key"><span><i class="k-last"></i>${s.last}</span><span><i class="k-next"></i>${s.next}</span></p>`;
}

function terminalChart(t) {
  const tr = t.plan.terminals;
  const max = 8;
  const pct = (n) => ((n / max) * 100).toFixed(2);
  const rows = D.terminals.last.map((last, i) => {
    const next = D.terminals.next[i];
    const a = Math.min(last, next), b = Math.max(last, next);
    return `<div class="dot-row" data-r>
      <span class="heat-name">${t.common.bar} ${i + 1}<small>${esc(t.common.barNames[i])}</small></span>
      <span class="dot-track" aria-hidden="true">
        <span class="dot-link" style="left:${pct(a)}%;width:${(pct(b) - pct(a)).toFixed(2)}%"></span>
        <span class="dot dot-last" style="left:${pct(last)}%"></span>
        <span class="dot dot-next" data-next style="left:${pct(next)}%" data-from="${pct(last)}"></span>
      </span>
      <span class="dot-val tnum">${last} → ${next}</span>
    </div>`;
  }).join('');
  return `<div class="dots" data-chart="terminals" role="img" aria-label="${esc(tr.p)}">${rows}</div>
  <p class="legend"><span><i class="lg-last"></i>${tr.last}</span><span><i class="lg-k lg-round"></i>${tr.next}</span></p>`;
}


/* Hero calculator: three inputs, a range, and an email with the short breakdown.
   Copy comes from content/<lang>/beregner.json, the model from content/tal.json (beregner). */
function calcCard(t) {
  const c = t.calc;
  const m = D.beregner;
  const cfg = JSON.stringify({ L: t.lang, m, c });
  return `<form class="hcalc" data-calc data-lang="${t.lang}" novalidate data-hero-fade>
    <p class="hc-h">${c.h}</p>
    <div class="hc-f"><div class="hc-top"><label for="hc-g">${c.guests}</label><output id="hc-og"></output></div><input type="range" id="hc-g" min="${m.guestsMin}" max="${m.guestsMax}" step="${m.guestsStep}" value="${m.guestsDefault}"></div>
    <div class="hc-f"><div class="hc-top"><label for="hc-d">${c.days}</label><output id="hc-od"></output></div><input type="range" id="hc-d" min="${m.daysMin}" max="${m.daysMax}" step="1" value="${m.daysDefault}"></div>
    <div class="hc-f"><p class="hc-l" id="hc-ql">${c.queue}</p><div class="hc-seg" role="group" aria-labelledby="hc-ql">${c.q.map((x, i) => `<button type="button" data-v="${i}" aria-pressed="${i === m.queueDefault}">${x}</button>`).join('')}</div></div>
    <div class="hc-out"><span>${c.out}</span><b id="hc-r" aria-live="polite"></b></div>
    <div class="hc-mail" data-mail>
      <label for="hc-e" class="sr">${c.email}</label>
      <input type="email" id="hc-e" name="email" placeholder="${esc(c.ph)}" autocomplete="email" required>
      <input type="text" name="website" class="hc-hp" tabindex="-1" autocomplete="off" aria-hidden="true">
      <button type="submit" class="btn">${c.send}</button>
    </div>
    <div class="hc-step2" data-step2 hidden>
      <p class="hc-s2h">${c.step2}</p>
      <p class="hc-s2p">${c.step2Text}</p>
      <div class="hc-s2f">
        <label class="sr" for="hc-n">${c.name}</label><input type="text" id="hc-n" name="navn" placeholder="${esc(c.namePh)}" autocomplete="given-name" maxlength="80">
        <label class="sr" for="hc-fe">${c.festival}</label><input type="text" id="hc-fe" name="festival" placeholder="${esc(c.festivalPh)}" autocomplete="organization" maxlength="80">
      </div>
      <button type="submit" class="btn hc-send2">${c.send2}</button>
    </div>
    <p class="hc-fine" data-fine aria-live="polite">${c.fine}</p>
    <div class="hc-ok" data-ok hidden><p>${c.ok} <b data-to></b></p><button type="button" class="hc-link" data-preview>${c.preview} ›</button></div>
    <script type="application/json" data-calc-cfg>${cfg.replace(/</g, '\\u003c')}</script>
  </form>
  <dialog class="mailprev" data-dialog aria-label="E-mail">
    <div class="mp-chrome"><span class="mp-from"><b>LiveLayer</b> &lt;hello@livelayer.dk&gt;</span><button type="button" class="mp-x" data-close aria-label="${t.lang === 'da' ? 'Luk' : 'Close'}">×</button></div>
    <div class="mp-body" data-mailbody></div>
  </dialog>`;
}

/* ---------- pages ---------- */

function introHero(t, hero, mediaHtml, cls = '') {
  return `<section class="ihero ${cls}" aria-labelledby="page-title">
  <div class="wrap">
    <h1 id="page-title" class="display h1" data-lines>${lines(Array.isArray(hero.h1) ? hero.h1 : [hero.h1])}</h1>
    <p class="lead" data-hero-fade>${hero.sub}</p>
  </div>
  <div class="wrap ihero-media" data-hero-fade>${mediaHtml}</div>
</section>`;
}

// Full-bleed media with a warm dusk tint and the headline on top.
function mediaHero(t, hero, mediaHtml, actions = '', extra = '') {
  return `<section class="mhero" aria-labelledby="page-title">
  <div class="mhero-media">${mediaHtml}</div>
  <div class="mhero-tint" aria-hidden="true"></div>
  <div class="wrap mhero-content${extra ? ' mhero-split' : ''}">
    <div class="mhero-text">
      <h1 id="page-title" class="display h1" data-lines>${lines(Array.isArray(hero.h1) ? hero.h1 : [hero.h1])}</h1>
      <p class="lead" data-hero-fade>${hero.sub}</p>
      ${actions}
    </div>
    ${extra}
  </div>
</section>`;
}

const ctile = (html, cls = '') => `<div class="ctile ${cls}" data-r>${html}</div>`;

function homePage(t) {
  const h = t.home;
  const from = routes.home[t.lang];
  const L = t.lang;
  const r = h.relay;
  const actions = `<div class="hero-actions" data-hero-fade>
      <a class="btn btn-light" href="${href(from, routes.partner[L])}">${h.hero.cta}</a>
      <a class="btn btn-glass" href="#hvordan">${h.hero.more}</a>
    </div>`;
  const video = `<video class="mhero-video" data-video autoplay muted loop playsinline preload="auto" poster="${media(from, M.heroPoster)}" aria-hidden="true">
    ${M.heroVideoMobile ? `<source src="${media(from, M.heroVideoMobile)}" type="video/mp4" media="(max-width: 700px)">` : ''}
    <source src="${media(from, M.heroVideo)}" type="video/mp4">
  </video>`;
  return `
${mediaHero(t, h.hero, video, actions, calcCard(t))}

<section class="statement-pic" aria-label="${esc(h.statement)}">
  ${picture(from, M.statementImage, '', '', '100vw')}
  <div class="wrap"><p class="statement" data-reveal-one>${h.statement}</p></div>
</section>

<section class="relay-sec" id="hvordan" aria-labelledby="relay-title" data-relay>
  <div class="relay-stage" data-relay-stage>
    <div class="relay-bg" aria-hidden="true">${picture(from, M.relayImage, '', '', '100vw')}</div>
    <div class="wrap relay-grid">
      <div class="relay-copy">
        <h2 id="relay-title" class="display h2">${r.h2}</h2>
        <div class="relay-steps">
          ${r.steps.map((s, i) => `<div class="rs${i === 0 ? ' is-active' : ''}" data-step-item="${i + 1}"><p class="rs-n">${i + 1} / ${r.steps.length}</p><h3 class="h3">${s.t}</h3><p class="muted">${s.d}</p></div>`).join('')}
        </div>
        <div class="relay-dots" aria-hidden="true">${r.steps.map((s, i) => `<i${i === 0 ? ' class="on"' : ''}></i>`).join('')}</div>
      </div>
      <div class="relay-vis" data-relay-vis data-step="1">
        ${relaySVG(t)}${relaySVG(t, true)}
        ${relayRead(t)}
      </div>
    </div>
  </div>
</section>

<section class="section who-sec" data-reveal>
  <div class="wrap">
    <div class="who">
      ${r.who.map((w) => `<div data-r><h3 class="h4">${w.t}</h3><p class="muted">${w.d}</p></div>`).join('')}
    </div>
  </div>
</section>

<section class="section section-2" data-reveal>
  <div class="wrap layer-grid">
    <div>
      <h2 class="display h2 h2-col" data-r>${h.layer.h2}</h2>
      <p class="lead muted" data-r>${h.layer.p}</p>
    </div>
    <figure class="layer-fig" data-layer>
      ${picture(from, M.layerImage, h.layer.alt, '', '(max-width: 900px) 100vw, 60vw')}
      <div class="layer-over" data-layer-over>
        ${picture(from, M.layerImage, '', '', '(max-width: 900px) 100vw, 60vw')}
        ${layerMarks(t)}
      </div>
      <span class="layer-edge" data-layer-edge aria-hidden="true"></span>
    </figure>
  </div>
</section>

${aerialScene(t)}

<section class="section" data-reveal>
  <div class="wrap">
    <h2 class="display h2" data-r>${h.products.h2}</h2>
    <div class="tiles">
      ${h.products.items.map((p) => `<a class="tile" data-r href="${href(from, routes[p.key][L])}">
        ${shot(p.key === 'audit' ? insightScreen(t) : planScreen(t), 'shot-tile')}
        <span class="tile-name display">${p.name}</span>
        <span class="tile-q">${p.q}</span>
        <span class="muted">${p.text}</span>
        <span class="more">${p.link}</span>
      </a>`).join('')}
    </div>
  </div>
</section>

<section class="section section-2 guess" data-reveal>
  <div class="wrap">
    <div class="split-head">
      <h2 class="display h2" data-r>${h.changes.h2}</h2>
      <p class="lead" data-r>${h.changes.lead}</p>
    </div>
    ${ctile(explorer(t, 'exh'), 'ctile-white chart-full')}
    <p class="guess-note statement" data-r>${h.changes.note}</p>
    <div class="who guess-others">
      ${h.changes.others.map((c) => `<div data-r><h3 class="h4">${c.t}</h3><p class="muted">${c.d}</p></div>`).join('')}
    </div>
  </div>
</section>

<section class="band-wrap" aria-labelledby="partner-title">
  <div class="band">
    <video data-video muted loop playsinline preload="metadata" poster="${media(from, M.nightPoster)}" aria-hidden="true"><source src="${media(from, M.nightVideo)}" type="video/mp4"></video>
    <div class="band-in" data-reveal>
      <h2 id="partner-title" class="display h2" style="max-width:14em" data-r>${h.partner.h2}</h2>
      <p class="lead" data-r>${h.partner.p}</p>
      <a class="btn btn-light" data-r href="${href(from, routes.partner[L])}">${h.partner.cta}</a>
    </div>
  </div>
</section>`;
}

function band(from, img, title, cta, link) {
  return `<section class="band-wrap" aria-labelledby="cta-title">
  <div class="band">
    ${picture(from, img, '', '', '100vw')}
    <div class="band-in" data-reveal>
      <h2 id="cta-title" class="display h2" style="max-width:13em" data-r>${title}</h2>
      <a class="btn btn-light" data-r href="${link}">${cta}</a>
    </div>
  </div>
</section>`;
}

function auditPage(t) {
  const a = t.audit;
  const from = routes.audit[t.lang];
  const L = t.lang;
  return `${introHero(t, a.hero, shot(insightScreen(t), 'shot-lg'))}

<section class="section section-2" data-reveal>
  <div class="wrap">
    <h2 class="display h2" data-r>${a.get.h2}</h2>
    <div class="trio">
      ${a.get.items.map((g) => `<div data-r><h3 class="h3">${g.t}</h3><p class="muted">${g.d}</p></div>`).join('')}
    </div>
  </div>
</section>

<section class="section" data-reveal>
  <div class="wrap">
    <div class="heat-head">
      <div><h2 class="display h2" data-r>${a.heat.h2}</h2><p class="lead muted" data-r style="margin-top:20px">${a.heat.p}</p></div>
      <div class="seg" role="group" aria-label="${esc(a.heat.dayGroup)}" data-r>
        ${['fri', 'sat', 'sun'].map((d, i) => `<button type="button" data-day="${d}" aria-pressed="${i === 0}">${t.common.days[i]}</button>`).join('')}
      </div>
    </div>
    ${ctile(`${heatmap(t)}<p class="legend legend-sq"><span><i class="lg-k"></i>${a.heat.legend[0]}</span><span><i class="lg-o"></i>${a.heat.legend[1]}</span><span><i class="lg-t"></i>${a.heat.legend[2]}</span></p>`, 'chart-full')}
  </div>
</section>

<section class="section section-2" data-reveal>
  <div class="wrap">
    <div class="split-head">
      <h2 class="display h2" data-r>${a.demand.h2}</h2>
      <p class="lead muted" data-r>${a.demand.p}</p>
    </div>
    ${ctile(`${demandChart(t)}<p class="key"><span><i class="k-next"></i>${a.demand.demand} (${a.demand.unit})</span><span><i class="k-cap"></i>${a.demand.capacity}</span></p>`, 'ctile-white chart-full')}
  </div>
</section>

<section class="section" data-reveal>
  <div class="wrap">
    <h2 class="display h2" data-r>${a.lenses.h2}</h2>
    <ol class="lenses">
      ${a.lenses.items.map((f, i) => `<li data-r><span class="lens-n">${String(i + 1).padStart(2, '0')}</span><h3 class="h3">${f.t}</h3><p class="muted">${f.d}</p></li>`).join('')}
    </ol>
  </div>
</section>

${band(from, M.auditCtaImage, a.cta.h2, a.cta.cta, href(from, routes.partner[L]))}`;
}

function planPage(t) {
  const p = t.plan;
  const from = routes.plan[t.lang];
  const L = t.lang;
  return `${introHero(t, p.hero, shot(planScreen(t), 'shot-lg'))}

<section class="section section-2" data-reveal>
  <div class="wrap">
    <h2 class="display h2" style="max-width:22em" data-r>${p.ledger.h2}</h2>
    <p class="lead muted" data-r style="margin-top:24px">${p.ledger.p}</p>
    ${ctile(ledger(t), 'ctile-white chart-full')}
  </div>
</section>

<section class="section" data-reveal>
  <div class="wrap">
    <div class="split-head">
      <h2 class="display h2" data-r>${p.anatomy.h2}</h2>
      <p class="lead muted" data-r>${p.anatomy.p}</p>
    </div>
    <div class="anatomy" data-r>
      <dl>${p.anatomy.rows.map((r, i) => `<div class="an-${i}"><dt>${r.k}</dt><dd>${r.v}</dd></div>`).join('')}</dl>
      <div class="anatomy-value"><span>${p.anatomy.valueLabel}</span><b>${p.anatomy.value}</b></div>
    </div>
  </div>
</section>

<section class="section section-2" data-reveal>
  <div class="wrap">
    <div class="split-head">
      <h2 class="display h2" data-r>${p.vendors.h2}</h2>
      <p class="lead muted" data-r>${p.vendors.p}</p>
    </div>
    ${ctile(explorer(t, 'exp'), 'ctile-white chart-full')}
    <p class="guess-note statement" data-r>${t.home.changes.note}</p>
  </div>
</section>

<section class="section" data-reveal>
  <div class="wrap">
    <div class="split-head">
      <h2 class="display h2" data-r>${p.staffing.h2}</h2>
      <p class="lead muted" data-r>${p.staffing.p}</p>
    </div>
    ${ctile(staffingChart(t), 'chart-full')}
  </div>
</section>

<section class="section section-2" data-reveal>
  <div class="wrap">
    <div class="split-head">
      <h2 class="display h2" data-r>${p.terminals.h2}</h2>
      <p class="lead muted" data-r>${p.terminals.p}</p>
    </div>
    ${ctile(terminalChart(t), 'ctile-white chart-full')}
  </div>
</section>

${band(from, M.planCtaImage, p.cta.h2, p.cta.cta, href(from, routes.partner[L]))}`;
}

function partnerPage(t) {
  const p = t.partner;
  const from = routes.partner[t.lang];
  const mail = `mailto:hello@livelayer.dk?subject=${encodeURIComponent(t.common.mailSubject)}`;
  return `${mediaHero(t, p.hero, picture(from, M.partnerHeroImage, p.hero.alt, 'mhero-img', '100vw', 'eager'))}

<section class="section section-2" data-reveal>
  <div class="wrap">
    <h2 class="display h2" data-r>${p.steps.h2}</h2>
    <ol class="steps">
      ${p.steps.items.map((s) => `<li data-r><h3 class="h3">${s.t}</h3><p class="muted">${s.d}</p></li>`).join('')}
    </ol>
  </div>
</section>

<section class="section" data-reveal>
  <div class="wrap">
    <h2 class="display h2" data-r>${p.faq.h2}</h2>
    <div class="faq">
      ${p.faq.items.map((f, i) => `<details data-r${i === 0 ? ' open' : ''}><summary>${f.q}</summary><p>${f.a}</p></details>`).join('')}
    </div>
  </div>
</section>

<section class="section section-2" id="kontakt" data-reveal>
  <div class="wrap center-cta">
    <h2 class="display h1" data-r>${p.contact.h2}</h2>
    <p class="lead muted" data-r style="margin-top:24px">${p.contact.p}</p>
    <a class="btn" data-r href="${mail}">${p.contact.cta}</a>
    <p class="contact-alt muted" data-r>${p.contact.or} <a href="mailto:hello@livelayer.dk">hello@livelayer.dk</a></p>
  </div>
</section>`;
}

const renderers = { home: homePage, audit: auditPage, plan: planPage, partner: partnerPage };

// sitemap.xml: every page in both languages, with its translation linked.
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${Object.keys(routes).flatMap((key) => ['da', 'en'].map((L) => `  <url>
    <loc>${SITE}${routes[key][L]}</loc>
    <xhtml:link rel="alternate" hreflang="da" href="${SITE}${routes[key].da}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${SITE}${routes[key].en}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE}${routes[key].da}"/>
  </url>`)).join('\n')}
</urlset>
`;
writeFileSync(join(base, 'public', 'sitemap.xml'), sitemap);

for (const t of [da, en]) {
  for (const key of Object.keys(routes)) {
    const path = routes[key][t.lang];
    const html = layout(t, key, t[key], renderers[key](t));
    const file = join(root, path, 'index.html');
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, html);
    console.log('wrote', join(path, 'index.html'));
  }
}
