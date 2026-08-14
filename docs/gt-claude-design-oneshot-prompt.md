<!-- PASTE EVERYTHING BELOW THIS LINE INTO CLAUDE DESIGN. -->
<!-- Tip: your synced "Design System" project (graphite/gold GT system) is in your org — select it so the build inherits the tokens. The prompt also inlines them so it works standalone. -->

Design and build a single premium landing page: **The Grand Touch Protection Program** — the flagship PPF (paint protection film) page for Grand Touch Auto, a high-end automotive protection studio in Al Quoz, Dubai. One page, production-quality, mobile-first. This page's only job: make a 12,900+ AED decision feel easy and start WhatsApp conversations with serious buyers. It must look like the most expensive PPF studio in Dubai built it — and repel bargain hunters by design.

## Brand system (use exactly — no other colors)

- Background: deep graphite `hsl(0 0% 8%)`, cards `hsl(0 0% 12%)` with gradient `135deg, hsl(0 0% 12%) → hsl(0 0% 8%)`, borders `hsl(0 0% 20%)`
- Primary: electric gold `hsl(38 92% 58%)` (text-on-gold: `hsl(0 0% 10%)`) — **gold is scarce: one gold-filled CTA per viewport, plus small accents (badge, seal, icons). Never body text, never large surfaces.**
- Accent: lava orange `hsl(18 95% 58%)` — used ONCE per card, only for the "free panel replacement" chip. Nothing else.
- Text: white `hsl(0 0% 98%)`, muted `hsl(0 0% 65%)`
- Font: Poppins (700 display, 600 sub/prices, 400 body). H1 ≤ 72px desktop / 40px mobile, tracking tight.
- Radius 12px. Shadows: cards `0 8px 32px hsl(0 0% 0% / .4)`; featured card glow `0 0 40px hsl(38 92% 58% / .3)` (only element on the page with a glow). Hero CTA gradient: `135deg gold → lava`.
- Depth over lines: separate sections with darkness gradients and elevation, never visible rules. Whitespace is the luxury cue — let sections breathe.
- Motion: fade-up on scroll once, 300ms. No parallax, no floating particles, no marquees.
- **Prices are typographic events: large, weight 600, always white. Never gold, never small, never hidden.**

## Voice (all copy in this voice)

Sean — the installer-owner who tells you the truth even when it costs him the sale. Premium without arrogance, technical without jargon, prices said out loud. Never salesy. Canonical lines to use verbatim where they fit: "We're not the cheapest PPF studio in Dubai. On purpose." · "Forget the film. It's covered for life." · "Stone through the film? That panel's on us." · "Ask any shop to show you their workmanship warranty. It's usually one year."

## Page structure & copy (use this copy — refine rhythm, don't change facts or prices)

**1. HERO** — full-bleed background video (muted, looping, dark-graded with a bottom gradient into the page background): `https://res.cloudinary.com/diw6rekpm/video/upload/q_auto:eco,vc_auto,w_720,c_limit/v1775639271/0408_3_gjnsep.mp4` (poster/fallback image: `https://www.grandtouchauto.ae/guided-cullinan-ppf.png`).
- Eyebrow (gold, tracked, uppercase): THE GRAND TOUCH PROTECTION PROGRAM
- H1: "PPF in Dubai, backed for life."
- Sub: "Three programs. Real prices. A written lifetime warranty — signed before you leave the bay."
- Primary CTA (gold gradient): "WhatsApp Sean" → `https://wa.me/971567191045?text=Hi%20Sean%20—%20I%27d%20like%20to%20protect%20my%20car.%20Which%20program%20fits%3F`
- Ghost CTA: "See the three programs" (anchor scroll)
- Trust row beneath: ★ 4.9 Google rating · 1,400+ cars protected · Warranty in writing — download it below

**2. THE THREE PROGRAMS** — the money section. Desktop 3-up with the middle card scaled ~1.03, gold 1px border, glow, and a gold "MOST CHOSEN" pill; mobile stacked with Signature first. Every card: tier name (tracked uppercase), italic tagline, big white price, bullets, ghost CTA (gold CTA on Signature only).

- **GT ESSENTIAL** — *Protected, properly.* — **AED 7,900** (full body, from) · full front from 4,900
  • GT 5-Year Warranty — film and workmanship, in writing
  • Self-healing gloss TPU film, GT-certified
  • Every painted exterior panel + headlights
  • Health check at month 12
  • 2 days in the studio
- **GT SIGNATURE** ⭐ — *Forget the film. It's covered for life.* — **AED 12,900** (full body, from) · full front from 6,900
  chip (lava): "1 free panel replacement — any damage, any cause, ever"
  • **GT Lifetime Warranty** — as long as you own the car, film **and** labour, in writing
  • Our flagship film — thicker, self-healing, hydrophobic top-coat
  • Every painted panel + headlights, door jambs, boot strip, interior screens
  • Edges wrapped out of sight — the film disappears into the panel gaps
  • Wash + inspection at 6 and 12 months, then yearly — free, for as long as you own it
  • 3 days in the studio — we don't rush film
- **GT CONCOURS** — *For the cars that deserve everything.* — **AED 18,900** (full vehicle, from)
  chip (lava): "3 free panel replacements — any damage, any cause"
  • Everything in Signature, plus:
  • Concours preparation — completely seamless, invisible finish
  • Paint perfected before film; ceramic over film and every uncovered surface
  • Every visit: inspection, wash + full ceramic refresh over the film — free, every time
  • Full photo/video protection dossier of your exact car
  • Priority booking, collection & delivery · 5 days in the studio

Under all three, one quiet full-width line: *"Every car, every tier: the GT Install Standard — paint prepared to showroom standard, dust-controlled bay, precision-cut for your exact model, triple-checked before handover."*
Below: a small "SUV and exotic pricing" expandable table — SUV: 8,900 / 14,500 / 20,900 · Large SUV (G-Class, RR, Patrol): 9,900 / 15,900 / 22,900 · Exotics: from 17,900, Signature and above only. All prices +VAT.

**3. THE GT LIFETIME WARRANTY** — visual centerpiece: render the warranty as a document — a numbered certificate graphic (gold seal motif, signature line, "Certificate Nº 0001") — not a marketing blurb. Copy beside it:
- H2: "Covered for as long as you own it."
- "Film AND labour — most shops' workmanship warranty is one year. Ours is a lifetime, and it's a signed document, not a promise."
- "Underneath it: the film manufacturer's warranty, registered to your car. You get both."
- "Stone through the film? That's not a warranty claim — that's your free panel replacement." 
- "Free inspections at 6 and 12 months, then yearly — they keep your cover active and your car perfect."
- Buttons: "Read the full terms" · "Download the warranty (PDF)"

**4. THE FILMS WE USE** — one honest sentence + desaturated logo row (uniform height, ~50% opacity): STEK `https://www.grandtouchauto.ae/stek-white.png`, Gyeon `https://www.grandtouchauto.ae/gyeon-logo-purple.png` (desaturate), Diamond Pro `https://www.grandtouchauto.ae/ppf-logo-diamond-pro.webp`, Avery `https://www.grandtouchauto.ae/ppf-logo-avery.png`. Copy: "Every shop in Dubai buys film from the same handful of factories. Results differ because installs differ. We fit genuine film from our certified roster, register the manufacturer's warranty to your car — and back the whole job with ours."

**5. HOW WE INSTALL** — 4 steps horizontal (mobile: vertical), each with a photo:
1. "Paint prepared to showroom standard" — `https://www.grandtouchauto.ae/guided-install-detail.png`
2. "Precision-cut for your exact model" — `https://www.grandtouchauto.ae/guided-911-stek-roll.png`
3. "Edges wrapped out of sight" — `https://www.grandtouchauto.ae/guided-rolls-install.png`
4. "The delivery walkaround — we walk YOU around every edge" — `https://www.grandtouchauto.ae/guided-sean-with-911.png`
No process jargon (never say "disassembly" or "parts-off") — outcomes only.

**6. HANDOVER DAYS (proof)** — H2: "Delivery day, every week." A 4-tile video grid (click-to-play, poster frames, muted preview on hover): 
- `https://res.cloudinary.com/diw6rekpm/video/upload/q_auto/v1781333287/911_MATTE_aaomcw.mp4` (911, matte)
- `https://res.cloudinary.com/diw6rekpm/video/upload/q_auto/v1781333432/G7_BLUE_wlvxks.mp4` (G700, blue)
- `https://res.cloudinary.com/diw6rekpm/video/upload/q_auto/f_auto/v1775562589/Mark_Zeekr_conzdp.mp4` (Mark's Zeekr — pair with face `https://www.grandtouchauto.ae/mark-zeekr-001.png`)
- `https://res.cloudinary.com/diw6rekpm/video/upload/q_auto/v1781333953/Aston_Martin_Rapide_S_rstzr2.mp4` (Aston Rapide S)
Plus one customer-voice tile: `https://res.cloudinary.com/diw6rekpm/video/upload/q_auto/v1781334893/customer_roqujv.mp4`.

**7. THE HONEST BIT** — short dark section, Sean speaking (photo: `https://www.grandtouchauto.ae/guided-sean-with-patrols-v2.jpg`):
- H2: "We're not the cheapest. On purpose."
- "A 7,000 dirham full-body quote is real — for what it is: value film, tucked edges, a one-year workmanship warranty, often no registered manufacturer warranty at all. It's a different product. If price is the deciding factor, take it, genuinely. If the car matters, read our warranty first."
- Link: "How to judge any shop's PPF in 5 minutes →"

**8. FAQ** (accordion, but ALL answers visible to crawlers in the DOM):
- How much does PPF cost in Dubai? → "At Grand Touch: full body from AED 7,900 (Essential), 12,900 (Signature), 18,900 (Concours), +VAT. Full fronts from 4,900. Bigger vehicles ~10–25% more. Those are real prices, not bait."
- What film brands do you use? → roster answer from section 4, plus "we choose the film that fits your car and tier — your warranty is with us either way."
- What does the lifetime warranty actually cover? → "Yellowing, cracking, peeling, bubbling, edge-lift and installation defects — film and labour — for as long as you own the car, kept active by free yearly inspections. The full terms are published, word for word."
- What's a no-fault panel replacement? → "Any damage, any cause — a stone, a trolley, a bad wash. We replace that panel's film free: once on Signature, three times on Concours."
- Why not just take the 7,000 quote? → condensed Honest Bit answer.
- How long does it take? → "Essential 2 days, Signature 3, Concours 5. We don't rush film."
- Do you work on exotics? → "Signature level and above only — exotics deserve the flagship spec."
- What happens at inspections? → "20 minutes, free: wash, edge check, cover stays active. Concours cars get a full ceramic refresh over the film every visit."

**9. CLOSING CTA** — H2: "~15 cars a month. That's the point." Sub: "Send your car and your week — Sean will tell you honestly which program fits." Gold CTA: "WhatsApp Sean" (same link). No forms, no booking fee, no countdown.

**10. STICKY MOBILE BAR** — appears after hero scrolls out: left "From AED 7,900 · Full-body programs", right gold "WhatsApp Sean" button. 60px, safe-area padded, backdrop blur.

## Hard don'ts

No countdown timers · no discount language, strikethrough prices or "offer ends" · no red urgency · no emoji in headings · no stock photography (only the URLs above) · no film-brand names in headlines (logos live in section 4 only) · no "DM for price" patterns — every price visible · no lorem ipsum · don't invent prices, warranty terms, or review quotes beyond what's here.

## Technical

Mobile-first (375px), then desktop. Videos: hero muted/loop/playsinline with poster; grid videos click-to-play. Explicit width/height on media. Meaningful alt text on every image. Semantic HTML (h1→h2 hierarchy, real `<table>` for the pricing expansion). Target: nothing above the fold heavier than the hero video; page feels instant on 4G.
