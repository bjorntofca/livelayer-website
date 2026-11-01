import { clampInputs, cleanText, estimate, krRange, nf, values, emailBody } from './shared/calc.mjs';
import '@fontsource-variable/mona-sans/standard.css';
import './styles.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/*
  Motion thesis (Impeccable / Emil / Taste)
  - Signature: "the layer" – a scan line passes over a real photo and turns it into numbers (scrubbed by scroll).
  - Scroll scene: Friday night on the aerial photo; a short pin moves the clock from 17:00 to 02:00.
  - Relay: a sticky year that changes state as you read the three steps (problem → other events → translated to you).
  - Data illustrations draw themselves once: strips, the staircase, the ledger, the estimate reasoning.
  - Native scrolling only. Content is visible without JS. Reduced motion: no travel, no scrub, no pin, no video.
*/

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const ease = 'expo.out';
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

/* A new page always opens at the top (unless the link points at a section) */
if (!location.hash) {
  ScrollTrigger.clearScrollMemory('manual');
  window.scrollTo(0, 0);
}

/* Header: hairline after the first bit of scroll; mobile menu */
const header = $('[data-header]');
const mediaHero = document.body.dataset.hero === 'media' ? $('.mhero') : null;
const solid = () => {
  if (!header) return;
  header.classList.toggle('is-solid', window.scrollY > 24);
  if (mediaHero) header.classList.toggle('is-over', window.scrollY < mediaHero.offsetHeight - 80);
};
solid();
window.addEventListener('scroll', solid, { passive: true });
const menu = $('[data-menu]');
if (menu) {
  const set = (open) => {
    header.classList.toggle('is-open', open);
    menu.setAttribute('aria-expanded', String(open));
    menu.textContent = open ? menu.dataset.closeLabel : menu.dataset.openLabel;
  };
  menu.addEventListener('click', () => set(!header.classList.contains('is-open')));
  $$('#nav-links a').forEach((a) => a.addEventListener('click', () => set(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') set(false); });
}

/* Videos: play only while visible, never for reduced motion */
$$('video[data-video]').forEach((v) => {
  if (reduce) { v.removeAttribute('autoplay'); v.pause(); return; }
  const io = new IntersectionObserver(([e]) => {
    if (e.isIntersecting && document.visibilityState === 'visible') v.play().catch(() => {});
    else v.pause();
  }, { threshold: 0.1 });
  io.observe(v);
});

/* Hero: masked line reveal, then the supporting copy */
gsap.from('[data-lines] .line-inner', { yPercent: reduce ? 0 : 110, opacity: reduce ? 0 : 1, duration: reduce ? 0.6 : 1.15, ease, stagger: 0.12, delay: 0.15 });
gsap.from('[data-hero-fade]', { y: reduce ? 0 : 16, opacity: 0, duration: 0.9, ease, stagger: 0.1, delay: reduce ? 0.2 : 0.55 });

/* Hero numbers count up once */
$$('[data-count]').forEach((el) => {
  const to = Number(el.dataset.count);
  const fmt = (n) => `${el.dataset.pre}${Math.round(n).toLocaleString(el.dataset.lang === 'da' ? 'da-DK' : 'en-GB')}${el.dataset.suf}`;
  if (reduce) return;
  const o = { v: 0 };
  el.textContent = fmt(0);
  gsap.to(o, { v: to, duration: 1.8, delay: 0.9, ease: 'power3.out', onUpdate: () => { el.textContent = fmt(o.v); } });
});

/* Entrances: each element once, as it enters */
const items = $$('[data-r], [data-reveal-one]');
gsap.set(items, { opacity: 0, y: reduce ? 0 : 24 });
ScrollTrigger.batch(items, {
  start: 'top 88%',
  once: true,
  onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: reduce ? 0.5 : 0.9, ease, stagger: 0.07, overwrite: true }),
});

if (!reduce) {
  $$('.statement-pic img').forEach((img) => {
    gsap.fromTo(img, { scale: 1.1 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  $$('.mhero-media').forEach((m) => {
    gsap.fromTo(m, { scale: 1 }, { scale: 1.08, yPercent: 6, ease: 'none', scrollTrigger: { trigger: m.parentElement, start: 'top top', end: 'bottom top', scrub: true } });
  });
}

/* Signature: the layer */
const layer = $('[data-layer]');
if (layer && !reduce) {
  const over = $('[data-layer-over]', layer);
  const edge = $('[data-layer-edge]', layer);
  const paint = (p) => {
    over.style.clipPath = `inset(0 ${((1 - p) * 100).toFixed(2)}% 0 0)`;
    edge.style.left = `${(p * 100).toFixed(2)}%`;
    edge.style.opacity = p > 0.002 && p < 0.998 ? '1' : '0';
  };
  paint(0);
  ScrollTrigger.create({ trigger: layer, start: 'top 72%', end: 'bottom 42%', scrub: 0.6, onUpdate: (s) => paint(s.progress) });
}

/* Relay: a short pinned scene – four steps, one year view that changes with them */
const relay = $('[data-relay]');
if (relay) {
  const vis = $('[data-relay-vis]', relay);
  const steps = $$('[data-step-item]', relay);
  const dots = $$('.relay-dots i', relay);
  let drawn = false;
  const drawArcs = (sel) => {
    if (reduce) return;
    $$(sel, vis).forEach((p, i) => {
      if (p.dataset.drawn) return;
      p.dataset.drawn = '1';
      const l = p.getTotalLength();
      gsap.fromTo(p, { strokeDasharray: l, strokeDashoffset: l }, { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut', delay: i * 0.07 });
    });
  };
  const go = (n) => {
    if (vis.dataset.step === String(n)) return;
    vis.dataset.step = String(n);
    steps.forEach((x) => x.classList.toggle('is-active', x.dataset.stepItem === String(n)));
    dots.forEach((d, i) => d.classList.toggle('on', i === n - 1));
    if (n >= 2) drawArcs('.rv-l2 .rv-arc');
    if (n >= 3) drawArcs('.rv-l3 .rv-arc');
  };
  if (reduce) {
    relay.classList.add('is-static');
    vis.dataset.step = '4';
  } else {
    vis.dataset.step = '0';
    go(1);
    ScrollTrigger.create({
      trigger: relay,
      pin: $('[data-relay-stage]', relay),
      start: 'top top',
      end: () => `+=${Math.round(window.innerHeight * 2.4)}`,
      onUpdate: (s) => go(Math.min(4, Math.floor(s.progress * 4) + 1)),
    });
  }
}

/* Friday night on the aerial photo: the scroll is the clock (short pin) */
const night = $('[data-night]');
if (night) {
  const S = JSON.parse(night.dataset.night);
  const L = S.lang;
  const nf = (n) => n.toLocaleString(L === 'da' ? 'da-DK' : 'en-GB');
  const kr = (n) => (L === 'da' ? `${nf(n)} kr.` : `DKK ${nf(n)}`);
  const marks = $$('.mk', night);
  const clock = $('[data-clock]', night);
  const cap = $('[data-caption]', night);
  const lostEl = $('[data-lost]', night);
  const emptyEl = $('[data-empty]', night);
  const range = $('[data-range]', night);
  let lastIdx = -1;

  const update = (h) => {
    const idx = Math.max(0, Math.min(9, Math.floor(h)));
    const frac = Math.max(0, Math.min(1, h - idx));
    const mins = Math.min(45, Math.floor((frac * 60) / 15) * 15);
    clock.textContent = `${S.hours[idx]}:${String(mins).padStart(2, '0')}`;
    const prev = idx ? S.tl[idx - 1] : { lost: 0, empty: 0 };
    const cur = S.tl[idx];
    lostEl.textContent = kr(Math.round((prev.lost + (cur.lost - prev.lost) * frac) / 1000) * 1000);
    emptyEl.textContent = String(Math.round(prev.empty + (cur.empty - prev.empty) * frac));
    if (idx !== lastIdx) {
      marks.forEach((m, b) => {
        m.dataset.s = S.grid[b][idx];
        const q = S.q[`${b}-${idx}`];
        $('[data-q]', m).textContent = q ? `${S.state.k} ${q} min` : '';
      });
      cap.textContent = S.captions[idx];
      if (!reduce) gsap.fromTo(cap, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' });
      range.value = String(idx);
      lastIdx = idx;
    }
  };

  if (reduce) {
    update(4);
    range.value = '4';
    range.addEventListener('input', () => update(Number(range.value)));
  } else {
    update(0);
    const st = ScrollTrigger.create({
      trigger: night,
      pin: $('[data-night-stage]', night),
      start: 'top top',
      end: () => `+=${Math.round(window.innerHeight * 1.6)}`,
      scrub: 0.4,
      onUpdate: (s) => update(Math.min(9.999, s.progress * 10)),
    });
    range.addEventListener('input', () => {
      const p = (Number(range.value) + 0.5) / 10;
      window.scrollTo({ top: st.start + p * (st.end - st.start), behavior: 'instant' });
    });
  }
}

/* Strip heat: segments sweep in by hour, then the annotations arrive */
$$('svg.sh').forEach((svg) => {
  if (reduce) return;
  const segs = $$('.sh-s', svg);
  const anns = $$('[data-ann]', svg);
  gsap.set(segs, { opacity: 0 });
  gsap.set(anns, { opacity: 0 });
  ScrollTrigger.create({
    trigger: svg, start: 'top 85%', once: true,
    onEnter: () => {
      gsap.to(segs, { opacity: 1, duration: 0.5, ease: 'power1.out', stagger: (i, el) => Number(el.dataset.col) * 0.03 });
      gsap.to(anns, { opacity: 1, duration: 0.7, ease: 'power2.out', delay: 1.0, stagger: 0.25 });
    },
  });
});

/* Staircase: each decision rises in turn */
$$('svg[data-stair]').forEach((svg) => {
  if (reduce) return;
  const rises = $$('.st-rise', svg);
  const line = $('.st-line', svg);
  const anns = $$('[data-ann]', svg);
  const len = line.getTotalLength();
  gsap.set(line, { strokeDasharray: len, strokeDashoffset: len });
  gsap.set(rises, { opacity: 0 });
  gsap.set(anns, { opacity: 0 });
  ScrollTrigger.create({
    trigger: svg, start: 'top 85%', once: true,
    onEnter: () => {
      gsap.to(line, { strokeDashoffset: 0, duration: 1.8, ease: 'power1.inOut', delay: 0.2 });
      gsap.to(rises, { opacity: 1, duration: 0.3, stagger: 1.6 / rises.length, delay: 0.25 });
      gsap.to(anns, { opacity: 1, duration: 0.6, stagger: 0.3, delay: 1.4 });
    },
  });
});

/* Estimate explorer: tabs, and bars that build the estimate step by step */
$$('[data-explorer]').forEach((ex) => {
  const tabs = $$('[role="tab"]', ex);
  const panels = $$('[role="tabpanel"]', ex);
  const grow = (panel) => {
    if (reduce) return;
    gsap.fromTo($$('.ex-bar, .ex-band', panel), { scaleX: 0 }, { scaleX: 1, duration: 0.7, ease, stagger: 0.12, transformOrigin: 'left center' });
  };
  const select = (i, focus) => {
    tabs.forEach((t, k) => { t.setAttribute('aria-selected', String(k === i)); t.tabIndex = k === i ? 0 : -1; });
    panels.forEach((p, k) => { p.hidden = k !== i; });
    if (focus) tabs[i].focus();
    grow(panels[i]);
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(i));
    t.addEventListener('keydown', (e) => {
      const n = tabs.length;
      if (['ArrowRight', 'ArrowDown'].includes(e.key)) { e.preventDefault(); select((i + 1) % n, true); }
      if (['ArrowLeft', 'ArrowUp'].includes(e.key)) { e.preventDefault(); select((i - 1 + n) % n, true); }
    });
  });
  if (!reduce) {
    gsap.set($$('.ex-bar, .ex-band', panels[0]), { scaleX: 0 });
    ScrollTrigger.create({ trigger: ex, start: 'top 75%', once: true, onEnter: () => grow(panels[0]) });
  }
});

/* Heatmap: day switch */
const heat = $('[data-heat]');
if (heat) {
  const H = JSON.parse(heat.dataset.heat);
  const L = heat.dataset.lang;
  const nf = (n) => n.toLocaleString(L === 'da' ? 'da-DK' : 'en-GB');
  const kr = (n) => (L === 'da' ? `${nf(n)} kr.` : `DKK ${nf(n)}`);
  const rows = $$('[data-row]', heat);
  const lostEl = $('[data-heat-lost]');
  const emptyEl = $('[data-heat-empty]');
  const show = (day) => {
    let lost = 0; let empty = 0;
    rows.forEach((row, b) => {
      const code = H.grids[day][b];
      $$('.cell', row).forEach((c, i) => { c.dataset.c = code[i]; });
      const k = [...code].filter((c) => c === 'k').length;
      empty += [...code].filter((c) => c === 't').length;
      const v = k * H.rates[b];
      lost += v;
      $('[data-val]', row).textContent = v ? kr(v) : '–';
    });
    lostEl.textContent = kr(lost);
    emptyEl.textContent = String(empty);
  };
  $$('[data-day]').forEach((btn) => btn.addEventListener('click', () => {
    $$('[data-day]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    show(btn.dataset.day);
  }));
  if (!reduce) {
    rows.forEach((row, r) => {
      gsap.from($$('.cell', row), { opacity: 0, duration: 0.5, ease, stagger: 0.035, delay: r * 0.05, scrollTrigger: { trigger: heat, start: 'top 80%', once: true } });
    });
  }
}

/* Charts draw their own data once */
const onEnter = (el, fn) => ScrollTrigger.create({ trigger: el, start: 'top 80%', once: true, onEnter: fn });
const draw = (path, dur = 1.6, delay = 0) => {
  const len = path.getTotalLength();
  gsap.fromTo(path, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: dur, delay, ease: 'power2.inOut', onComplete: () => path.style.removeProperty('stroke-dasharray') });
};

if (!reduce) {
  $$('[data-chart="demand"]').forEach((svg) => {
    const gap = $('[data-gap]', svg); const note = $('[data-note]', svg);
    gsap.set([gap, note], { opacity: 0 });
    onEnter(svg, () => { draw($('[data-line]', svg)); gsap.to(gap, { opacity: 0.22, duration: 0.6, delay: 1.2 }); gsap.to(note, { opacity: 1, duration: 0.6, delay: 1.5 }); });
  });
  $$('[data-chart="staffing"]').forEach((svg) => {
    const bars = $$('rect', svg);
    gsap.set(bars, { scaleY: 0, transformOrigin: '50% 100%', transformBox: 'fill-box' });
    onEnter(svg, () => gsap.to(bars, { scaleY: 1, duration: 0.9, ease, stagger: 0.06 }));
  });
  $$('[data-chart="ledger"]').forEach((tb) => {
    const bars = $$('.lg-bar span', tb);
    gsap.set(bars, { scaleX: 0 });
    onEnter(tb, () => gsap.to(bars, { scaleX: 1, duration: 0.8, ease, stagger: 0.06 }));
  });
  $$('[data-chart="terminals"]').forEach((c) => {
    onEnter(c, () => {
      $$('[data-next]', c).forEach((dot, i) => {
        const track = dot.parentElement.getBoundingClientRect().width;
        const dx = ((Number(dot.dataset.from) - parseFloat(dot.style.left)) / 100) * track;
        gsap.from(dot, { x: dx, duration: 1, ease, delay: i * 0.07 });
      });
      gsap.from($$('.dot-link', c), { opacity: 0, duration: 0.6, delay: 0.5 });
    });
  });
}

window.addEventListener('load', () => {
  if (!location.hash) window.scrollTo(0, 0);
  ScrollTrigger.refresh();
});

/* Hero calculator: three inputs → range → the email with the short breakdown (sent by /api/beregning) */
const hc = $('[data-calc]');
if (hc) {
  const { L, m, c } = JSON.parse($('[data-calc-cfg]', hc).textContent);
  const g = $('#hc-g'), d = $('#hc-d'), em = $('#hc-e'), fine = $('[data-fine]', hc), btn = $('.hc-mail .btn', hc);
  const segs = $$('.hc-seg button', hc);
  let q = m.queueDefault;
  const inputs = () => clampInputs(m, { guests: g.value, days: d.value, queues: q });
  const fill = (el) => el.style.setProperty('--p', `${((el.value - el.min) / (el.max - el.min)) * 100}%`);
  const render = () => {
    fill(g); fill(d);
    const i = inputs();
    $('#hc-og').textContent = nf(i.guests, L);
    $('#hc-od').textContent = `${i.days} ${i.days === 1 ? c.day1 : c.dayN}`;
    $('#hc-r').textContent = krRange(estimate(m, i).total, L);
  };
  [g, d].forEach((el) => el.addEventListener('input', render));
  segs.forEach((b) => b.addEventListener('click', () => {
    segs.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    q = Number(b.dataset.v); render();
  }));
  render();

  const nm = $('#hc-n'), fe = $('#hc-fe'), step2 = $('[data-step2]', hc), mailRow = $('[data-mail]', hc);
  const who = () => ({ navn: cleanText(nm.value), festival: cleanText(fe.value) });
  const body = () => emailBody(c, values(c, m, inputs(), L, who()));
  const dlg = $('[data-dialog]');
  let stage = 1;
  hc.addEventListener('submit', async (e) => {
    e.preventDefault();
    const addr = em.value.trim();
    if (stage === 1) {
      // Step 1: check the email, then ask for name and festival before sending.
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addr);
      em.setAttribute('aria-invalid', String(!ok));
      if (!ok) { fine.textContent = c.invalid; em.focus(); return; }
      stage = 2; mailRow.hidden = true; fine.hidden = true; step2.hidden = false;
      nm.focus();
      return;
    }
    const b2 = $('.hc-send2', hc);
    b2.disabled = true; const label = b2.textContent; b2.textContent = c.sending;
    try {
      const res = await fetch('/api/beregning', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: addr, lang: L, website: hc.website.value, ...who(), ...inputs() }),
      });
      if (!res.ok) throw new Error(String(res.status));
      $('[data-to]', hc).textContent = addr;
      step2.hidden = true; fine.hidden = true; $('[data-ok]', hc).hidden = false;
    } catch {
      fine.hidden = false; fine.textContent = c.error;
    } finally {
      b2.disabled = false; b2.textContent = label;
    }
  });
  $('[data-preview]', hc).addEventListener('click', () => { $('[data-mailbody]').innerHTML = body(); dlg.showModal(); });
  $('[data-close]', dlg).addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
}
