// Shared by the page (live range + email preview) and the server function that sends the email,
// so the visitor sees exactly what they receive. Model: content/tal.json → beregner.

export const nf = (n, L) => Math.round(n).toLocaleString(L === 'da' ? 'da-DK' : 'en-GB');
export const krRange = ([a, b], L) => (L === 'da' ? `${nf(a, L)}–${nf(b, L)} kr.` : `DKK ${nf(a, L)}–${nf(b, L)}`);

export function clampInputs(m, { guests, days, queues }) {
  const g = Math.min(m.guestsMax, Math.max(m.guestsMin, Math.round(Number(guests) || m.guestsDefault)));
  const d = Math.min(m.daysMax, Math.max(m.daysMin, Math.round(Number(days) || m.daysDefault)));
  const q = [0, 1, 2].includes(Number(queues)) ? Number(queues) : m.queueDefault;
  return { guests: g, days: d, queues: q };
}

export function estimate(m, { guests, days, queues }) {
  const r = (n) => Math.round(n / m.roundTo) * m.roundTo;
  const base = guests * days * m.spendPerGuestDay;
  const pk = m.peakLoss[queues];
  const peak = [r(base * pk.low * m.recoverLow), r(base * pk.high * m.recoverHigh)];
  const food = base * m.foodShare;
  const vend = [r(food * m.vendorLossLow * m.vendorCutLow), r(food * m.vendorLossHigh * m.vendorCutHigh)];
  return { peak, vend, total: [peak[0] + vend[0], peak[1] + vend[1]] };
}

// {token} is replaced by its value. Text in [brackets] is only shown when every token inside it has a value,
// e.g. "Hej[ {navn}]," becomes "Hej Anna," or just "Hej,".
const fill = (s, v) => String(s || '')
  .replace(/\[([^[\]]*)\]/g, (x, inner) => ((inner.match(/\{([^{}]+)\}/g) || []).every((t) => String(v[t.slice(1, -1)] ?? '').trim()) ? inner : ''))
  .replace(/\{([^{}]+)\}/g, (x, k) => (k in v ? v[k] : x));
export const fillText = fill;
export const cleanText = (s, max = 80) => String(s ?? '').replace(/[\r\n\t]+/g, ' ').replace(/[<>]/g, '').trim().slice(0, max);

export function values(c, m, inp, L, extra = {}) {
  const e = estimate(m, inp);
  return {
    navn: '',
    festival: '',
    interval: krRange(e.total, L),
    'kø-interval': krRange(e.peak, L),
    'bod-interval': krRange(e.vend, L),
    'gæster': nf(inp.guests, L),
    dage: `${inp.days} ${inp.days === 1 ? c.day1 : c.dayN}`,
    'køer': String(c.q[inp.queues] || '').toLowerCase(),
    ...extra,
  };
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// Blank line = new paragraph, single line break = <br>.
const paras = (s, style) => String(s || '').trim().split(/\n\s*\n/).filter(Boolean)
  .map((p) => `<p style="${style}">${esc(p).replace(/\n/g, '<br>')}</p>`).join('');

const INK = '#1d1a17', MUTED = '#6f655c', FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";
const P = `margin:0 0 14px;font-size:16px;line-height:1.6;color:${INK};`;

// Email body with inline styles (works in mail clients and in the on-page preview).
export function emailBody(c, v) {
  const t = c.mail;
  const f = (s) => fill(s, v);
  const block = (title, sub, text) => `<p style="margin:24px 0 4px;font-size:16px;font-weight:700;color:${INK};">${esc(f(title))} <span style="color:${MUTED};font-weight:600;">${esc(sub)}</span></p>${paras(f(text), P)}`;
  return `<div style="font-family:${FONT};color:${INK};">
<p style="margin:0 0 22px;font-size:18px;font-weight:700;letter-spacing:-0.01em;">LiveLayer</p>
${paras(f(t.hello), P)}${paras(f(t.intro), P)}
<p style="margin:18px 0 0;font-size:14px;color:${MUTED};">${esc(f(t.inputs))}</p>
<p style="margin:6px 0 2px;font-size:30px;line-height:1.2;font-weight:700;letter-spacing:-0.01em;">${esc(v.interval)}</p>
<p style="margin:0 0 8px;font-size:14px;color:${MUTED};">${esc(f(t.rangeLabel))}</p>
${block(t.peakTitle, v['kø-interval'], t.peakText)}
${block(t.vendTitle, v['bod-interval'], t.vendText)}
<p style="margin:24px 0 4px;font-size:16px;font-weight:700;">${esc(f(t.whyTitle))}</p>${paras(f(t.whyText), P)}
<p style="${P}margin-top:24px;"><b>${esc(f(t.nextLead))}</b> ${esc(f(t.nextText))}</p>
<p style="margin:8px 0 26px;"><a href="${esc(t.ctaLink)}" style="display:inline-block;padding:14px 24px;border-radius:999px;background:${INK};color:#ffffff;text-decoration:none;font-weight:600;font-size:16px;">${esc(f(t.cta))}</a></p>
${paras(f(t.signoff), `margin:0;font-size:15px;line-height:1.6;color:${MUTED};`)}
</div>`;
}

export function emailSubject(c, v) { return fill(c.mail.subject, v); }

export function emailText(c, v) {
  const t = c.mail, f = (s) => fill(s, v);
  return [f(t.hello), f(t.intro), f(t.inputs), `${v.interval} – ${f(t.rangeLabel)}`,
    `${f(t.peakTitle)}: ${v['kø-interval']}\n${f(t.peakText)}`, `${f(t.vendTitle)}: ${v['bod-interval']}\n${f(t.vendText)}`,
    `${f(t.whyTitle)}\n${f(t.whyText)}`, `${f(t.nextLead)} ${f(t.nextText)}`, `${f(t.cta)}: ${t.ctaLink}`, f(t.signoff)].join('\n\n');
}

export function emailDocument(c, v, L) {
  return `<!doctype html><html lang="${L}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f6f2ec;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f2ec;"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background:#ffffff;border-radius:20px;"><tr><td style="padding:32px 32px 30px;">${emailBody(c, v)}</td></tr></table>
</td></tr></table></body></html>`;
}
