# GT Protection Program — Design Spec

**Date:** 2026-08-05
**Scope:** the bible pages (`/ppf-dubai` pillar, warranty, process, films) + wa-cards. Build target for all page implementation work; every build gets screenshot-verified against this doc before it ships.
**Foundation:** the existing design system in `src/index.css` — deep graphite (`--background: 0 0% 8%`), electric gold primary (`38 92% 58%`), lava orange accent, Poppins, display-scale headings, premium gradients/glow shadows. **We extend and discipline it, we don't replace it.**

---

## 1. Design intent

A page that *feels* like a 12,900 AED decision being made easy — calm, confident, documented. The customer arriving from a reel or ad should sense within 3 seconds: real prices, real warranty, real shop, no games.

**Goals:** trust-first · price-transparent · spacious (whitespace is the luxury cue) · mobile-native (most traffic is ads → phones → WhatsApp).
**Anti-goals (hard don'ts):** countdown timers · discount badges/strikethrough prices · red urgency accents · emoji-heavy copy · generic stock photography · anything that patterns like a lead-gen landing page from 2019. This page competes with Topaz, not with the 6.9k shops.

## 2. Using the existing tokens — the discipline layer

- **Gold (`--primary`) is scarce.** Per viewport: at most ONE gold-filled element (the primary CTA) + small gold accents (the "Most chosen" badge, the warranty seal, icons). Gold never colors body text or large surfaces. Scarcity is what makes it read as premium instead of loud.
- **Lava orange (`--accent`)**: rarer still — reserved for the no-fault panel-replacement highlight chip and nothing else on the pillar. One idea = one color.
- **Graphite depth instead of borders:** separate sections with the existing `--gradient-dark` / `--gradient-card` and elevation (`--shadow-card`), not visible rules. Cards float on glow (`--shadow-elegant`), never outline-boxed — except the Signature card (see §4).
- **Type:** Poppins stays. Display headings use the existing h1/h2 scale but max out at `lg:text-7xl` on this page (the 8xl scale shouts). Weights: 700 display / 600 sub / 400 body, `--muted-foreground` for supporting text. **Prices are typographic events:** large, 600, white — never gold, never small.
- **Radius/motion:** existing `--radius` and transition tokens. Motion is subtle: fade-up on scroll (once, 300ms), no parallax, max one glow animation per viewport.

## 3. Art direction

- **Photography = proof, not decoration.** Real cars from the portfolio, real bay, real hands. Now: the `guided-*` set (`guided-sean-with-911`, `guided-rolls-install`, `guided-install-detail`, `guided-cullinan-ppf`). After the batch shoot: edge-wrap macros, panel-gap film shots, delivery walkaround stills, warranty-signing moment.
- Images sit **in** the theme: dark-graded, bottom gradient into `--background` so photos dissolve into the page rather than sitting in bright boxes.
- **Sean appears at trust moments** — hero of the process section, the warranty signature, the FAQ intro. Face builds the persona; don't scatter it everywhere.
- Brand logos (films roster): monochrome/desaturated at ~50% opacity, uniform height — present as credentials, not advertisements.

## 3b. Hard rules learned from the first build (2026-08-05 review)

Sean rejected v1 on visual/UX grounds. These are now non-negotiable:

- **No video heroes.** Static, dark-graded image only. ("That video of me should not be on the HERO page.") Video belongs in the Handover Days grid as click-to-play social proof, never as a background.
- **Hero pattern = two columns**, matching the PPF Dubai calculator page: LEFT eyebrow + H1 + sub + 2–3 proof bullets + one gold CTA + one ghost link + trust row; RIGHT a compact card carrying the offer at a glance (price + warranty + entitlements). **Price and risk-reversal must be above the fold** — that is the conversion mechanism, not decoration.
- **One gold line per element.** Never a ring *and* a drawn pinstripe on the same card. Featured tier card = crisp `ring-1 ring-primary/80`; the drawn pinstripe + smoke is reserved for the certificate.
- **Badges/pills that straddle an edge mount on the wrapper**, not inside the card — otherwise they anchor to the inner content box and get clipped.
- **Cards in a row must have reserved-height blocks** (tagline, price, chip) so prices align on one line and bullet lists start at the same y. Uneven card rhythm reads cheap.
- **Brand names are typographic wordmarks, not logo images.** Mismatched logo PNGs at different aspect ratios were the single cheapest-looking element on the page. Roster: STEK · Diamond Pro · Supreme · Gyeon. **Never Avery Dennison — GT does not use it.**
- **Documents are viewers, not page sections.** The certificate is capped in height with internal scroll; the gold frame stays fixed while the content scrolls.
- **Router must reset scroll on navigation** (`ScrollToTop` in App.tsx) — without it every internal link lands mid-page. Honour `#anchors`, leave browser back/forward (POP) alone.

### Verification rule (the process failure that caused all of the above)

Text extraction is **not** visual verification. A clipped badge, a stray SVG box, a broken logo and a 1071px card all pass a text check. Before claiming a page is verified: take a screenshot, or — when the Browser pane can't composite — **measure the DOM** (`getBoundingClientRect`, `getComputedStyle`, `naturalWidth`, `scrollWidth vs innerWidth`) and report the numbers. If neither is possible, say so plainly instead of claiming verification.

## 4. Pillar page — section-by-section

1. **Hero** — full-bleed dark-graded car image (portfolio hero, not a render). Eyebrow: "The Grand Touch Protection Program". H1: outcome line ("PPF in Dubai, backed for life."). Subline carries the price anchor ("Three programs. Real prices. A written lifetime warranty."). One gold CTA: *WhatsApp Sean*. Ghost secondary: *See exact prices*. Trust row under CTAs: ★ rating · cars protected · "warranty in writing — download it below". No carousel, no video autoplay in hero.
2. **Tier cards** — the money section. Desktop: 3-up, **Signature center, scaled ~1.05, gold border + "Most chosen" badge** — the only outlined card on the page. Mobile: stacked, Signature first (not swipe-hidden). Card anatomy: tier name → price (large) → warranty line as the first bullet (bold) → 4–5 outcome bullets (tier sheet card copy verbatim) → panel-replacement chip in accent orange where applicable → ghost CTA per card. Below the cards: "Compare everything" progressive-disclosure HTML table (crawlable, collapsed by default on mobile only visually — text always in DOM).
3. **The GT Install Standard strip** — single quiet full-width line under the cards (the universal quality sentence). No card styling; it belongs to all three.
4. **Warranty block** — visual centerpiece: the certificate itself rendered as a graphic (numbered, signed, seal motif in gold). 5 plain-English bullets + two buttons: *Read the full terms* / *Download PDF*. This section must feel like a document, not a promise.
5. **Films roster strip** — one honest sentence + desaturated logo row (STEK, Diamond Pro, Supreme, Gyeon) + link to films page.
6. **Process teaser** — 4 steps horizontal (icons + one macro photo), outcome language only, link to process page.
7. **Proof** — Google review cards (real text, real names), install counter, one delivery-day video embed (click-to-play, poster frame from portfolio).
8. **FAQ** — accordion, but every answer present in DOM/SSR (prerender requirement). 8–12 questions.
9. **Closing CTA** — "~15 cars a month. Reserve your install week." WhatsApp gold CTA. No fee language (no booking deposit — decided).
10. **Sticky mobile bar** — WhatsApp CTA + "From AED 7,900" price anchor, appears after the hero scrolls out, 56px, safe-area padded.

## 5. Component inventory

`TierCard` (variant: featured) · `CompareTable` (SSR text, mobile collapse) · `WarrantyCertificate` (graphic block) · `LogoStrip` · `ProcessStep` · `ProofBar` / `ReviewCard` · `FaqItem` (DOM-visible answers) · `StickyWhatsAppBar` · `SectionEyebrow` (uppercase, tracking-wide, muted). Reuse shadcn primitives underneath; no new UI library.

## 6. Accessibility & performance

- Gold on graphite passes contrast for large text only — small text stays white/muted, never gold.
- Tap targets ≥44px; sticky bar never overlaps content ends.
- Route is code-split (the tint-funnel lesson: 3MB → 521KB entry). Hero image: AVIF/WebP ≤180KB, explicit dimensions (LCP element). Poppins: preload the two weights actually used, `font-display: swap`.
- Every image: meaningful `alt` (SEO + AI crawlers read these).

## 7. Workflow (how we use this spec)

1. Build section → screenshot in browser preview (mobile 375px first, then desktop) → check against this doc → iterate.
2. Anything not covered here gets decided *in the spec first* (one-line addition), then built — the spec stays the source of truth.
3. Optional upgrade: Sean drops 2–3 reference screenshots he likes (Topaz pages, watch-brand sites) into `docs/design-refs/` and we calibrate against them before the pillar build.
