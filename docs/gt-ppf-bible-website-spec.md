# The GT PPF Bible — Website Architecture & Content Spec

**Date:** 2026-08-05
**What this is:** the spec for the canonical content layer ("the bible") that everything else derives from — the site pages, the SEO/AI-crawlable bodies, the ad landing flows, the wa-cards, the sales scripts, and eventually the on-site AI concierge. Source content lives in `docs/gt-protection-program-master-plan.md` (strategy) and `docs/gt-tier-sheet-v1.md` (offers). This doc maps that content onto pages, schema, and build phases.

**Core principle:** one source of truth. Any price, warranty term, or claim appears in exactly one canonical place (the tier sheet / warranty T&C) and every surface — page copy, prerender seoBody, JSON-LD, llms.txt, AI agent prompt — is generated or updated *from* it. If a price changes, it changes in one file and propagates.

---

## 1. What we already have (verified in repo, 2026-08-05)

- **Prerendering:** `scripts/prerender.js` clones `dist/index.html` per route post-build with unique title, meta, canonical, OG tags and a **crawlable `seoBody` HTML block** — this is how Google and AI crawlers (which mostly don't execute JS) see real content on an SPA. The bible pages plug into this exact system.
- **Structured data:** `src/lib/business.ts` already builds JSON-LD — `AutoRepair` (with NAP, GeoCoordinates, AggregateRating), `Service`, `FAQPage`. We extend, not invent.
- **robots.txt + sitemap.xml** in `public/`, Vercel hosting (`vercel.json`).
- **Assets already in `public/`:** brand logos (STEK ×4, Gyeon, Diamond Pro, Avery, 3M, Protect Plus, KK Vinyl, Carbins), Sean photos (`guided-sean-with-911.png`, `guided-sean-with-patrols*.jpg`), install shots (`guided-rolls-install`, `guided-install-detail`, `guided-911-stek-roll`, `guided-cullinan-ppf`, `guided-aston-rapide-ppf`), car renders per size class (A45, E63S, GT3, Patrol, G700 — gloss + matte), blog heroes.
- **Existing routes to build on:** `/ppf-dubai` (pillar), `/ppf-dubai-price` (Google conversion funnel), `/best-ppf-studio-dubai`, blog with 8 Dubai posts, `/wa-cards`, portfolio.

---

## 2. Page architecture — hub & spoke

One pillar page sells the program; four spokes go deep on the things buyers (and AI engines) actually ask about. Every spoke links back to the pillar and to `/ppf-dubai-price` for conversion. **No orphan content: every blog post gets an in-body link to the pillar.**

### 2.1 `/ppf-dubai` — PILLAR: The Grand Touch Protection Program *(rebuild existing page)*

Target queries: `ppf dubai`, `paint protection film dubai`, `best ppf dubai`, `ppf packages dubai`.

Section order (also the seoBody order):
1. **Hero:** "PPF in Dubai, backed for life. The Grand Touch Protection Program — three packages, real prices, a written lifetime warranty." Primary CTA: WhatsApp. Secondary: "Get your exact price" → `/ppf-dubai-price`.
2. **The three offers** — cards exactly per tier sheet (Concours → context, Signature center "Most chosen", Essential), real prices visible, the GT Install Standard line under all three. HTML `<table>` for the comparison (AI-extractable), cards for humans.
3. **The GT Lifetime Warranty** — 5 bullets + link to `/ppf-warranty-dubai` + "Download the actual warranty document (PDF)". The no-fault panel replacement gets its own visual moment ("Stone through the film? That panel's on us.").
4. **Why we don't lead with film brands** — the honest explainer (registered manufacturer warranty on every car PLUS the GT warranty on top; roster strip with brand logos linking to `/ppf-films-dubai`).
5. **How we install** — 4 outcome-language highlights + video, link to `/ppf-installation-process`.
6. **Proof** — portfolio strip, Google reviews, install counts, delivery-day video.
7. **Vehicle pricing matrix** — the size-band table, visible text (this is what ranks for "ppf cost dubai" and what AI engines quote).
8. **FAQ** — 8–12 answer-first Q&As (see §5 content rules). FAQPage schema.
9. **Founding 50 + booking:** WhatsApp CTA to reserve an install week (no booking fee — the limited calendar is the commitment; "~15 cars a month" stated).

Schema: `Service` + `OfferCatalog` with 3 `Offer`s (each with `priceSpecification` in AED, `itemOffered`, and `warranty` → `WarrantyPromise` with `durationOfWarranty`), `FAQPage`, `BreadcrumbList`, `VideoObject` per embedded video.

### 2.2 `/ppf-warranty-dubai` — SPOKE: The GT Owner's Warranty

Target queries: `ppf warranty dubai`, `ppf lifetime warranty`, `ppf warranty claim dubai`. **Nobody in Dubai publishes real warranty terms — this page owns the topic.**

Sections: what "lifetime" means (defined precisely — original owner, VIN on invoice) · what's covered (film AND labour) · the two-layer structure (registered manufacturer warranty underneath + GT on top, plain-English) · no-fault panel replacements explained · inspection cadence and why (6/12 then yearly) · the claim process step-by-step (photos → same-week slot → fixed within 14 days) · **full T&C, complete, on-page HTML** (not only PDF — crawlers must read it) + downloadable PDF certificate specimen · exclusions in plain English · FAQ.

Legal note: this page + the PDF satisfy Cabinet Decision 66/2023 Art. 11 (advertised warranty ⇒ delivered document). T&C copy comes from master plan §5 **after legal review** — page ships with lawyer-approved text, EN first, AR version phase 2.

Schema: `WebPage` + `FAQPage`. Terms in visible HTML — never behind JS-only accordions.

### 2.3 `/ppf-installation-process` — SPOKE: How we install

Target queries: `how is ppf installed`, `ppf installation dubai`, `ppf edges peeling`, `bad ppf installation`.

This is where process explanation LIVES (per Sean's rule: never on the price cards). Structure = the journey of one car: arrival & inspection → paint prep to showroom standard → precision-cut patterns for the exact model → the install (edges wrapped out of sight; the film disappears into panel gaps) → triple-check QC → the delivery walkaround ("we walk YOU around every edge") → your first inspection visit. Each step: 2–3 sentences + photo/video. Below: "How to judge ANY shop's PPF work in 5 minutes" (the edge-check challenge — the content magnet) + the free edge-inspection standing offer.

Schema: `HowTo` (steps) + `VideoObject`s + `FAQPage`. Videos: pull from existing funnel assets (guided-* imagery, TikTok funnel videos) until the new batch is shot.

### 2.4 `/ppf-films-dubai` — SPOKE: Films & materials we use

Target queries: `stek dubai`, `stek vs xpel dubai`, `best ppf film brand`, `diamond pro ppf`, `gyeon dubai`. **Captures brand-searchers and converts them to program-buyers.**

Sections: the honest framing ("every shop in Dubai buys from the same handful of film factories — results differ because installs differ") · the GT roster with logos: **STEK, Diamond Pro, Supreme (PPF); Gyeon (coatings)** — 2–3 sentences each, what GT uses it for · **the selection clause in plain English:** "We select the film that best fits your vehicle and tier from our certified roster. Every film is genuine, and we register the manufacturer's warranty to your car — you get that registration *plus* the GT warranty on top." · how to verify genuine film (QR/serial + registration — the education nobody in the market does; direct hit on the 6–7k gray-market shops) · FAQ ("Can I request a specific brand?" — yes, within the tier spec).

Schema: `WebPage` + `FAQPage`. Brand logos = existing `/public` assets.

### 2.5 `/ppf-dubai-price` — existing conversion funnel *(align, don't rebuild)*

Stays the Google Ads landing + quote tool. Changes: quote output presents the three program tiers (never a bare number), Signature pre-selected; warranty line + panel-replacement line in the quote; links to warranty page for trust. The pillar's "Get your exact price" CTA lands here.

### 2.6 Supporting
- `/best-ppf-studio-dubai` — keep; re-point its internal links at the pillar; add program tier strip.
- **Blog** — existing 8 posts get in-body links to pillar/spokes. New posts come from the content engine (each YouTube script = a post).
- `/wa-cards` — rebuild as the 3 program cards (tier sheet card content verbatim) for WhatsApp sends.

---

## 3. SEO + AI-crawlability (AEO) checklist

1. **prerender.js entries for every new/changed route** — with FULL content in `seoBody`, not summaries: the complete tier table with prices, the complete warranty T&C text, the full FAQ text. The seoBody is the page as far as GPTBot/ClaudeBot/PerplexityBot are concerned. This is the single highest-leverage AEO item.
2. **robots.txt:** explicitly `Allow: /` for `GPTBot`, `OAI-SearchBot`, `ClaudeBot`, `Claude-Web`, `PerplexityBot`, `Google-Extended`, `Applebot-Extended`, `meta-externalagent`. (Current file only names Googlebot/Bingbot/social; the wildcard allows the rest, but explicit entries remove ambiguity and survive future tightening.)
3. **`public/llms.txt`** — markdown index: who GT is, the program, prices, warranty summary, links to the canonical pages. Plus **`llms-full.txt`** containing the full bible text (tier sheet + warranty + process + films + FAQ) in clean markdown. Cheap to generate from the docs; AI answer engines increasingly fetch it.
4. **sitemap.xml:** add new routes with realistic `lastmod`; keep admin/funnels excluded.
5. **JSON-LD extensions in `business.ts`:** `OfferCatalog` + 3 `Offer`s with AED `priceSpecification` and `WarrantyPromise` (almost no competitor exposes prices in schema — rich-result + AI-answer advantage), `HowTo` (process page), `VideoObject` (every embedded video), `BreadcrumbList` sitewide. One `FAQPage` per URL, no duplicates.
6. **On-page content rules (every bible page):**
   - Answer-first: first paragraph under every H2 answers the H2's question completely in ≤3 sentences (this is what AI engines quote).
   - Question-form H2s matching real queries ("How much does PPF cost in Dubai?", "What does a lifetime PPF warranty actually cover?").
   - Prices in visible text, not only images/JS.
   - Real HTML `<table>`s for anything comparative.
   - NAP footer identical everywhere (already unified in `business.ts`).
   - Every page: one WhatsApp CTA above the fold, one booking CTA at the end.
7. **Measurement:** Search Console per-page; monthly manual AI-visibility check (ask ChatGPT/Perplexity/Gemini "best PPF shop in Dubai", "PPF cost Dubai", "PPF lifetime warranty Dubai" — log whether GT is cited and from which page).

---

## 4. The GT persona (voice layer — feeds all copy + the AI agent)

**Who's talking:** Sean — the installer-owner who tells you the truth, including when it costs him the sale. Premium without arrogance. Technical without jargon.

**Voice rules:**
- Say prices out loud. Never "DM for price," never "starting from just…".
- Plain verdicts: "That 7k quote is fair — for what it is. It's a different product."
- Never trash a named competitor; dissect *practices*, not names.
- Never discount language, ever. Value is added, not subtracted.
- Process words translated to outcome words (tier sheet translation table is canonical).
- Honesty beats polish: "we turned away three cars this week," "here's the mistake we fixed."
- Every claim carries proof or a document: warranty → PDF; genuine film → registration; quality → the edge-check challenge.

**Sample lines (canonical, reuse everywhere):** "We're not the cheapest PPF studio in Dubai. On purpose." · "Forget the film. It's covered for life." · "Ask any shop to show you their workmanship warranty. It's usually one year." · "Stone through the film? That panel's on us."

---

## 5. The AI concierge (phase 3 — after content ships)

**What:** "Ask GT" chat on the pillar, warranty, and price pages. Answers program questions from the bible, qualifies, and hands off to WhatsApp.

**Architecture (fits existing stack):**
- Supabase Edge Function `gt-concierge` → Anthropic Messages API (`claude-sonnet-5`; drop to `claude-haiku-4-5` if cost matters). 
- **No RAG needed:** the whole bible (tier sheet + warranty T&C + films + process + FAQ + persona rules) is ~15–20k tokens — ship it as the system prompt with prompt caching. Zero retrieval infra, always-consistent answers.
- **Guardrails in the system prompt:** prices quoted verbatim from the tier sheet only; never invent discounts or negotiate; warranty questions answered from T&C text with "the signed document is the authority"; anything unknown or legal-adjacent → offer WhatsApp handoff. Persona = §4.
- **Lead capture built in:** the agent naturally asks car model + which program interests them + timeline; on capture, write to the existing `leads` table (same intake path as funnels) and fire the Telegram alert on Signature-signal answers. The concierge *is* a qualifying funnel that works at 2am.
- **Handoff:** wa.me deep link with a prefilled summary ("Hi Sean — G63, interested in Signature, asking about matte").
- **Ops:** rate-limit per IP/session, log transcripts (they're a content mine — real questions feed the weekly "You asked" video slot), monthly transcript review to patch bible gaps.

---

## 6. Build order

**Phase 1 — Content lockdown (blocks everything):** confirm top-tier name + prices + exotics rule + panel-credit fine print + exact film roster lines → freeze tier sheet v1 → warranty T&C to lawyer (EN, then AR) → write final page copy from master plan + tier sheet.
**Phase 2 — Pages:** pillar rebuild → warranty page → process page → films page → `/ppf-dubai-price` alignment → wa-cards refresh. Each ships with its prerender entry, schema, sitemap line.
**Phase 3 — AEO tech:** robots.txt additions, llms.txt + llms-full.txt, OfferCatalog/WarrantyPromise JSON-LD, AI-visibility baseline log.
**Phase 4 — Concierge:** edge function + widget + lead wiring + transcript logging.
**Phase 5 — Media plumbing:** swap Meta/Google LPs to the new pages per master plan §6; funnels' quote outputs speak program language.

**Assets needed from Sean (the "get it perfect" list):**
1. Sign-offs: top-tier name, price bands, exotics rule, panel fine print, film roster lines.
2. Legal: T&C review (EN/AR) — *blocks advertising the warranty at all* (Art. 11).
3. Warranty certificate design (numbered, signed — print + PDF specimen for the site).
4. Shoot list (one batch day covers it): edge-wrap macro, panel-gap film disappearing, bay wide shot, delivery walkaround clip, warranty signing moment, inspection visit clip, Sean portrait per page hero. Until then: existing guided-* assets carry the pages.
5. Pick 3–5 best existing funnel videos for embedding (VideoObject each).
6. Google Business Profile: description + services aligned to program language; review link used at every delivery.
7. ~~Payment link for slot deposit~~ — dropped; no booking fee (decided 2026-08-05). Booking = WhatsApp slot confirmation with car details.
