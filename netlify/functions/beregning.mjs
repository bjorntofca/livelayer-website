// POST /api/beregning – sends the visitor their estimate from hello@livelayer.dk (via Resend)
// and a copy of the lead to LiveLayer. Text: content/<lang>/beregner.json. Model: content/tal.json.
import tal from '../../content/tal.json' with { type: 'json' };
import da from '../../content/da/beregner.json' with { type: 'json' };
import en from '../../content/en/beregner.json' with { type: 'json' };
import { clampInputs, emailDocument, emailSubject, emailText, krRange, estimate, values } from '../../site/src/shared/calc.mjs';

const COPY = { da, en };
const FROM = process.env.MAIL_FROM || 'LiveLayer <hello@livelayer.dk>';
const REPLY_TO = process.env.MAIL_REPLY_TO || 'hello@livelayer.dk';
const NOTIFY = process.env.MAIL_NOTIFY || 'hello@livelayer.dk';
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const send = (msg) => fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
  body: JSON.stringify(msg),
});

export default async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  let b;
  try { b = await req.json(); } catch { return new Response('Bad request', { status: 400 }); }
  const email = String(b.email || '').trim().slice(0, 200);
  if (b.website) return Response.json({ ok: true }); // honeypot: quietly ignore bots
  if (!EMAIL.test(email)) return new Response('Invalid email', { status: 422 });
  if (!process.env.RESEND_API_KEY) return new Response('Email is not configured', { status: 503 });

  const L = b.lang === 'en' ? 'en' : 'da';
  const c = COPY[L];
  const m = tal.beregner;
  const inp = clampInputs(m, b);
  const v = values(c, m, inp, L, { email });

  const res = await send({
    from: FROM, to: [email], reply_to: REPLY_TO,
    subject: emailSubject(c, v), html: emailDocument(c, v, L), text: emailText(c, v),
  });
  if (!res.ok) {
    console.error('resend', res.status, await res.text());
    return new Response('Could not send', { status: 502 });
  }

  const e = estimate(m, inp);
  const lead = [
    `E-mail: ${email}`, `Sprog: ${L}`,
    `Gæster pr. dag: ${inp.guests}`, `Dage: ${inp.days}`, `Lange køer: ${c.q[inp.queues]}`,
    `Interval: ${krRange(e.total, L)} (køer ${krRange(e.peak, L)}, boder ${krRange(e.vend, L)})`,
  ].join('\n');
  await send({ from: FROM, to: [NOTIFY], reply_to: email, subject: String(c.mail.notifySubject || 'Ny beregning: {email}').replace('{email}', email), text: lead })
    .catch((err) => console.error('notify', err));

  return Response.json({ ok: true });
};

export const config = { path: '/api/beregning' };
