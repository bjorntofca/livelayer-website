# LiveLayer website — notes for Claude Code

Marketing site for LiveLayer (livelayer.dk). Write the name as LiveLayer. Small static multi-page site: Danish is the default, and English sits under /en/ from day one.

## Stack
- Vite 7 multi-page build. `base: './'` means every path is relative, so the build works from any folder or host.
- The HTML pages are **generated**. `scripts/build-pages.mjs` reads the JSON in `content/` (`da/*.json`, `en/*.json`, `tal.json` for numbers and the calculator model, `medier.json` for images and video) and writes `site/**/index.html`. Edit the JSON or the generator, never the generated HTML. `scripts/data.mjs` adds derived totals and helpers.
- **Admin at /admin/** (Decap CMS 3.17.1, self-hosted in `public/admin/decap/`). Its form is generated from the JSON by `scripts/build-cms.mjs` → `public/admin/config.json`, so new content keys appear automatically; Danish labels and hints live in that script. Login is GitHub OAuth through our own functions (`/api/auth`, `/api/callback`, app "LiveLayer" on bjorntofca). Saving commits to `main`, which rebuilds the site. Local testing: `npx decap-server` + serve `dist/` on localhost.
- `scripts/media.mjs` (sharp) makes `-sm` copies of uploaded images and, on Netlify, shrinks oversized originals.
- **Hero calculator** (front page, 3 inputs): logic and email template in `site/src/shared/calc.mjs`, shared by the page and `netlify/functions/beregning.mjs` (POST `/api/beregning`). That function sends the visitor's email via Resend from hello@livelayer.dk and a copy of the lead to hello@livelayer.dk (alias of bjorn@livelayer.dk). The text is in `content/<lang>/beregner.json`, the model in `content/tal.json` → `beregner`.
- Motion: GSAP 3 + ScrollTrigger. Scrolling is native (no Lenis or other smooth-scroll library — this was tried and rejected).
- Font: Mona Sans Variable (`@fontsource-variable/mona-sans`), self-hosted, using the width axis (font-stretch ~112%) for display type.

## Commands
- `npm run dev` — generate the pages, then start Vite.
- `npm run build` — generate the admin config, the image copies and the pages, then build to `dist/`.
- `LINK_INDEX=1 npm run build` — preview build in which internal links end in `index.html`. Use it for hosts that do not resolve folder URLs, such as the claude.ai artifact preview.

## Design skills
- Emil Kowalski: `npx skills@latest add emilkowalski/skills`
- Impeccable: `/plugin marketplace add pbakaus/impeccable`, then install it from `/plugin`. Alternatively `npx impeccable install`. Scan with `npx impeccable detect http://localhost:5173`.
- Taste (design-taste-frontend, "tasteskill v2"): install from its own repository, following its README.

**The approved brief (DESIGN.md, PRODUCT.md) overrides skill defaults.** In particular, Taste tells the agent to "stop asking permission". Override that here: ask Bjørn before changing the offer, the copy's claims or the visual direction.

## Rules that must hold
- Show only the two current offers, **Indsigt / Insight** (the audit) and **Plan** (the recommendations), plus what they enable. Relay is the engine that carries lessons between events. Forecasting may be hinted at, never sold.
- Festivals lead the story, but the copy stays open to venues and event agencies that run many events a year.
- Dark ink on warm white, with dusk warmth from the sunset photo (see DESIGN.md). Colour is for data only: never orange or yellow, never coloured or gradient text, never coloured buttons. No alcohol-led imagery.
- Charts follow Apple's style (rounded tiles, rounded bars, one signal gradient). "What you get" is shown as device mockups of the real screens. No monospace-looking figures.
- The free offer is only for the first 4–5 partners. Never show made-up findings presented as real results.
- Routes: /indsigt/, /plan/, /partner/, and /en/insight/, /en/plan/, /en/partner/.
- Volunteers staff most bars, so an empty bar is not lost wages. Never frame idle capacity as wage cost.
- Never mention the exports or data files festivals have.
- Figures are marked as indicative ("Vejledende tal"), never "eksempelfestival", and must stay internally consistent (`content/data.mjs`, where the recommendations sum to 420,000).
- Plan talks about recommendations (anbefalinger): LiveLayer recommends, the festival decides.
- Recommendations are tied to situations, not clock times: we predict when a situation (line-up, crowd age and spending power, what that crowd buys, ticket sales) happens again. Staffing is shown per situation too.
- Motion stays calm: ease-out curves, no bounce. Respect `prefers-reduced-motion`: no pinning, scrubbing or video autoplay, fades only, and a slider replaces the scroll scene.
- Headlines are at most 2 lines on desktop. No eyebrows, no monospace, no thin decorative rules.
- Never use the long em dash (—) in copy; use the short dash (–). The footer has no CVR and no photo credits. The partner offer says "Lige nu" (not "I vinter").
- Artifact preview hosting: no path may start with `_`, and no file may contain U+FFFD.

## Deploy (live since 29 Oct 2026; built from GitHub since 1 Nov 2026)
- Source: GitHub `bjorntofca/livelayer-website`, branch `main`. Netlify site `livelayer` (id bc622e18-422f-42c0-9ef1-b2c63efa125a, team bjorn-tofterup) builds every push with `netlify.toml` (`npm run build` → `dist`, functions in `netlify/functions`). Pushing to `main` = going live.
- Environment variables on Netlify: `RESEND_API_KEY` and `GITHUB_CLIENT_SECRET` (secret), `GITHUB_CLIENT_ID`. Optional: `MAIL_FROM`, `MAIL_REPLY_TO`, `MAIL_NOTIFY`. Never put keys in the repo.
- Primary domain livelayer.dk; aliases www.livelayer.dk, livelayer.si, www.livelayer.si. Let's Encrypt certificate, HTTPS forced. Never deploy a `LINK_INDEX=1` build.
- `public/_redirects` sends livelayer.si and www.livelayer.si to livelayer.dk (301). `public/404.html` is the not-found page.
- DNS stays at one.com: A @ → 75.2.60.5 and CNAME www → livelayer.netlify.app on both domains. Resend (EU, eu-west-1) uses TXT `resend._domainkey`, CNAME `send` and CNAME `rsend` on livelayer.dk. **Never touch the Google Workspace MX, SPF/TXT, DKIM and DMARC records, and never add Resend's receiving MX on @.**
- Netlify turned on team login protection by default; it is switched off (`sso_login: false`) so the site is public.
