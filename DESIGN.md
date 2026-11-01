# Design direction

Inspiration comes from Apple product pages (one idea per screen, moving pictures, scroll-told scenes) and Palantir (data as the hero, restraint). Bjørn asked for black on white.

## Rules
- Dark ink on warm white. The warmth comes from the sunset photo Bjørn loves: warm off-whites and a peach → rose → lavender "dusk" gradient behind product shots and over the hero video.
- The hero is a full-bleed audience video with a warm multiply tint and the headline on top; the header sits over it in light text until you scroll past.
- Charts follow Apple's style: big rounded tiles (28px), rounded bars and caps, one gradient for the signal (indigo `#3b55e6` → violet `#8b5cf6`), rose `#e7a0b6` for reasons that pull an estimate down, warm grey for "last year" and "fits".
- "What you get" is shown as the real product: device mockups of the Indsigt and Plan screens on the dusk gradient, never abstract charts.
- Never coloured text or coloured buttons (no orange, no yellow, no gradient text). Buttons are dark pills, light pills on media.
- Headlines have open tracking (-0.012em) and extra word spacing (0.04em), at most 2 lines on desktop. No eyebrows, no monospace-looking figures.
- No alcohol-led imagery. Never write "eksempelfestival"; figures are marked as indicative ("Vejledende tal").

## Tokens
| Token | Value |
|---|---|
| Background | `#fbf8f3` |
| Background 2 | `#f4eee6` |
| Line | `#e3d9cc` |
| Text | `#1c1814` |
| Muted | `#5f574e` |
| Signal gradient | `#3b55e6` → `#8b5cf6` |
| Down | `#e7a0b6` |
| Fit | `#e9e1d5` |
| Dusk | `#f8dcc0` → `#f3c3a8` → `#e2b2c3` → `#c7c1e8` |

Type is Mona Sans Variable. Display text is set at font-stretch 106%, weight 640.

## Logo
The **Frame** mark is two L's framing a live blue point: LL, a viewfinder over the event, a layer on top of reality. It is the `MARK` constant in `scripts/build-pages.mjs` and is also used in `public/favicon.svg`. Alternatives were shown to Bjørn on a separate options sheet.

## Signature moments
1. **Hero:** full-bleed black-and-white audience video (Mixkit 4188) with a warm dusk tint; headline, lead and buttons on top.
2. **Hero numbers:** +420.000 kr. · 11 recommendations · 30 min to start, as glass cards inside the hero that count up once, marked "Vejledende tal" (indicative).
3. **The sunset statement photo** (kept, full-bleed).
4. **"Én chance om året" (Relay):** a short pinned scene (2.4 screens) over a soft blurred sunset photo. Four steps: your 3 days → year over year (2024–2026 chained into 2027) → other festivals modelled through "your context" → a range from data plus your decision margin (12.5 %) giving the recommendation. A readout under the chart changes with each step.
5. **The layer** and **Friday night on the aerial photo** (kept).
6. **Offer tiles and Indsigt/Plan heroes:** device mockups of the actual screens.
7. **"Mindre gætværk":** the estimate explorer on a white tile.

## Motion
- Ease-out only.
- Illustrations draw themselves once as they enter.
- Videos play only while they are on screen, and never with reduced motion.

## Credits
All media are free for commercial use.

**Video (Mixkit Free License)**

| File | Source |
|---|---|
| crowd-stage(-m).mp4 | Mixkit 4188, festival stage crowd, graded black and white |
| crowd-night.mp4 | Mixkit 4186, dancing festival crowd, graded black and white |

**Photos (Pexels License)**

| File | Source |
|---|---|
| sunset-crowd | Pexels 14267300 |
| food-booth | Pexels 7923907 |
| food-queue | Pexels 11117985 |
| card-payment | Pexels 12935071 |
| tent-crowd | Pexels 3633307 |
| aerial | Pexels 1692695 |
