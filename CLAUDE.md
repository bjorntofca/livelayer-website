# LiveLayer website — notes for Claude Code

Marketing site for LiveLayer (livelayer.dk). Write the name as LiveLayer. Small static multi-page site: Danish is the default, and English sits under /en/ from day one.

## Stack
- Vite 7 multi-page build. `base: './'` means every path is relative, so the build works from any folder or host.
- The HTML pages are **generated**. `scripts/build-pages.mjs` reads `content/da.mjs`, `content/en.mjs` and `content/data.mjs` and writes `site/**/index.html`. Edit the content modules or the generator, never the generated HTML.
- Motion: GSAP 3 + ScrollTrigger. Scrolling is native (no Lenis or other smooth-scroll library — this was tried and rejected).
- Font: Mona Sans Variable (`@fontsource-variable/mona-sans`), self-hosted, using the width axis (font-stretch ~112%) for display type.

## Commands
- `npm run dev` — generate the pages, then start Vite.
- `npm run build` — generate the pages and build to `dist/`.
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

## Deploy (live since 29 Oct 2026)
- Hosted on Netlify, site `livelayer` (id bc622e18-422f-42c0-9ef1-b2c63efa125a) in Bjørn's Netlify team. Primary domain livelayer.dk; aliases www.livelayer.dk, livelayer.si, www.livelayer.si. Let's Encrypt certificate, HTTPS forced.
- Deploy: `npm run build` then `npx netlify-cli deploy --prod --dir dist --site bc622e18-422f-42c0-9ef1-b2c63efa125a` (after `netlify login`). Never deploy a `LINK_INDEX=1` build.
- `public/_redirects` sends livelayer.si and www.livelayer.si to livelayer.dk (301). `public/404.html` is the not-found page.
- DNS stays at one.com: A @ → 75.2.60.5 and CNAME www → livelayer.netlify.app on both domains. **Never touch the Google Workspace MX, SPF/TXT, DKIM and DMARC records on livelayer.dk.**
- Netlify turned on team login protection by default; it is switched off (`sso_login: false`) so the site is public.
