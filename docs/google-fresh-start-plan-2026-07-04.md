# Google Fresh Start — New Campaign + New Funnel Plan (2026-07-04)

Owner decisions locked in: **restore-style funnel with soft capture · 200–250 AED/day · pause the May campaign the day the new one launches · no Arabic ad group yet (revisit after stabilization).**

This plan is written to be executed with Claude Code (CLI has Google Ads API access there). Companion docs: `google-ads-strategy-2026-07-04.md` (analysis), `google-ads-ppf-funnel-handover-2026-06-22.md` (account state), `docs/google-ads/export-2026-07-04.txt` (account actuals), `docs/google-ads/keyword-planner-master-2026-06-18.csv` (keyword research).

---

## 1. Why a fresh campaign (and what we keep)

The 06-22 handover argued "keep the campaign — history is an asset." That was right then; it is wrong now. Since mid-June the May campaign has absorbed: an experiment split and removal, two funnel repoints (V2→V3), a Maximize Clicks detour that bought junk (78% of spend on zero-conv terms), a reversion, a Maximize Conversions switch, and a counted-conversion redefinition (07-02). The "history" now encodes contradictory optimization targets — and delivery is collapsing (impressions ~300/day → 29 on 07-03). The asset has become a liability. Fresh start.

**What we keep (the actual assets):**
- All negative keyword lists (competitor shops, informational, matte/colour-change, deals, door edge).
- The keyword research (2,095 keywords, themed, with volumes and bids).
- The search-term learnings: converters are "stek ppf price", "ppf", "ppf للسيارات", price/brand intent. Junk is informational + competitor-shop names.
- The conversion actions (IDs stay; we re-wire what counts).
- The CLI tooling (`scripts/google-ads/*` — setup scripts exist as patterns: `setup-ppf-search-may-2026.mjs`, `setup-ppf-search-whatsapp-may-2026.mjs`).
- The close-rate data in the CRM — now feeding back via offline conversion import.

## 2. Evidence driving the design

| Funnel (Google traffic) | Sessions | Captures | Wins | Design |
|---|---|---|---|---|
| Legacy dubai-quote (Apr 15–May 19) | 141 | 12 (5 form + 7 WA) | **3 (41k AED)** | Informational, price shown, calculator optional |
| V1/V2 calculators (May–Jun) | ~200 | ~33 leads | 2 | Guided calculator, price shown, popup |
| V3 gated (Jun 22–Jul 4) | 58 (49 real) | 2 real | 0 | Gamified, price hidden behind phone gate |

Why: **intent match.** Google traffic arrives from searches like "stek ppf price" — they want a price. The gamified gate (built for cold Meta/TikTok traffic, where it works — 8.1% close on the Meta website funnel) reads as a trick to a high-intent searcher. Industry guidance agrees: for local-service search ads, match the page to the query, load fast, keep forms minimal, qualify *after* capture; quiz/gamified funnels are for cold social traffic ([WordStream](https://www.wordstream.com/adwords-landing-page), [Google LP guidance](https://support.google.com/google-ads/answer/6238826), [local-service LP structure](https://aliraza.co/best-performing-landing-page-structure-for-local-service-google-ads-electricians-plumbers-contractors/), [high-ticket qualification](https://www.newzenler.com/blog/high-ticket-sales-funnel-qualification)).

Account actuals (30d): 274 clicks, 4,418 AED, CPC ~16 → at 200–250/day expect **~14–17 clicks/day**. Economics to beat: ~150 AED per CRM capture, ≤2.2k per win.

## 3. The new funnel — "Dubai Quote, reborn with soft capture"

**Route:** `/ppf-dubai-price` (new, clean). **Funnel name:** `ppf_google_price_2026h2` (fresh key for clean measurement). **Component:** revive the legacy `PpfDubaiQuote.tsx` structure (still in repo, serving the TikTok route) as the base — new variant, not a fork of the V2 gamified component.

**Page structure (proven order from the winning page):**
1. **Hero** — intent-matched H1: "PPF in Dubai — See Your Exact Price". Sub: STEK-certified, 4.9★ (77 reviews), free pickup across Dubai. One CTA: "Build my exact price" (scrolls to calculator). Sticky WhatsApp button (direct, no popup — never block it).
2. **Quote calculator** — same steps as legacy (vehicle → coverage → finish). **Price SHOWN on completion. No gate.**
3. **Soft capture immediately under the revealed price** (this is the new part):
   - Primary: **"WhatsApp me this exact quote"** — one phone field + button. Saves the lead to the CRM *first* (full quote context), then opens WhatsApp with the quote pre-filled. Captured AND they start the conversation they wanted anyway.
   - Secondary: **"Lock this price for 14 days"** — same phone field, no WhatsApp, for quiet researchers.
   - Every calculator completion also fires a partial capture (session + vehicle + quote) even without a phone — retargeting/intent data.
4. **Why Grand Touch / Why STEK / Real handovers / Speak to Sean** — carry over from legacy (trust did the closing).
5. **Qualification without a gate:** completing the calculator IS the qualification (vehicle, coverage, budget signal all captured). WhatsApp taps *after* price = qualified conversions; taps *before* = observe-only. Same philosophy as the 07-02 rewire, minus the hostage price.

**Engineering requirements (blocking):**
- **Fix the silent-save bug** (`handleUnlockDiscount` pattern — save failures must show a real error and retry; a Google conversion on 07-03 has no CRM lead). Applies to the new page's capture too: WhatsApp-open must await/queue the CRM write.
- Page weight: target LCP < 2.5s on mobile (lazy-load below-fold sections; the winning page was long but the calculator must paint fast).
- UTM template: `?utm_source=google&utm_medium=paid_search&utm_campaign=ppf_price_search_jul_2026`.
- End-to-end test on launch day: real phone → CRM row + Telegram alert verified, then junk the test lead.

## 4. Conversion tracking (minimal, honest)

| Action | Counts? | Fires when |
|---|---|---|
| Submit lead form (`7569208694`) | **Primary** | Phone captured (either soft-capture path) |
| WhatsApp contact click (`7617388951`) | **Primary** | WhatsApp tap AFTER price revealed |
| WhatsApp before lead form (`7649703525`) | Observe-only | WhatsApp tap before calculator complete |
| **NEW: Qualified lead (offline import)** | **Primary (becomes the bidding target)** | Sean marks qualified/quoted in CRM — uploaded daily with gclid |
| **NEW: Closed won (offline import, with value)** | Secondary/reporting | CRM won + billed amount |

**Offline import job (build in Claude Code, runs locally/scheduled):** reads CRM leads where `gclid is not null` and status changed to qualified/quoted/won, uploads via the Ads API (pattern: `scripts/google-ads/conversions.mjs` + [Google OCI docs](https://support.google.com/google-ads/answer/2998031), prefer [enhanced conversions for leads](https://support.google.com/google-ads/answer/14274408)). This is what finally points Smart Bidding at closers instead of tyre-kickers.

## 5. New campaign structure (execute via Claude Code)

**Campaign:** `PPF Price Search Dubai - Jul 2026`
- Budget: **200 AED/day** (250 ceiling after first win). Search only, no Display/Search-partner expansion.
- Bidding: **Maximize Clicks with a 20 AED max CPC cap** for weeks 1–2 (delivery + data first — junk risk is handled by carried-over negatives and phrase/exact match, which the June Max-Clicks detour lacked). Switch to Maximize Conversions only when ≥15 counted conversions/30d exist.
- Location: Dubai + Sharjah (where the wins came from); Language: English (Arabic revisit later).
- **Automatically created assets: OFF** (UI step — this is what hijacked the sitelinks last time).

**Ad groups (from keyword research themes, phrase + exact only, no broad):**
1. **PPF Price/Quote intent** (~1,000/mo theme) — `ppf price dubai`, `ppf cost dubai`, `car ppf cost`, `stek ppf price`, `ppf quote`. Perfect page match — expected best CPA.
2. **Core PPF Dubai** (~5,820/mo theme) — `ppf dubai`, `paint protection film dubai`, `ppf car`, `ppf near me` (watch terms weekly).
3. **STEK / carried films** — `stek ppf`, `stek dubai`, `stek dynoshield` (we install STEK — top converting term family; competitor films stay negative).
4. **New car / vehicle-specific** (~910/mo theme) — `new car paint protection dubai`, `jetour g700 ppf`, `byd ppf`, `ppf for new car`. All five historic Google wins are this buyer.

**RSAs (3 per ad group):** headlines lean into the page promise — "See Your Exact PPF Price", "Genuine STEK Film", "Free Pickup Across Dubai", "Rated 4.9 By Dubai Drivers", "Direct With The Owner". No numeric prices in ads (10k+ tickets; avoid price-shoppers). Descriptions mirror ad-group intent.

**Assets:** campaign-level sitelinks only, all → the new funnel (+2 navigational: Portfolio, Contact). Callouts carried from May campaign. Call asset with 9am–9pm schedule (UI).

**Negatives:** attach the full existing negative lists on day one + add the June zero-conv informational terms.

**Launch sequence (same day):** deploy funnel → verify end-to-end capture → enable new campaign → **pause `PPF Search UAE - WhatsApp - May 2026`** → confirm auto-assets OFF.

## 6. Guardrails (the lessons, enforced)

- **No changes for 14 days** after launch except negative keywords from search-term review (weekly).
- **No experiments / no A/B splits** at this budget. Sequential tests only.
- **Judge weekly on CRM numbers**: captures per 100 clicks, cost per capture (target <250 AED), speed-to-first-touch. Google's conversion column is directional only until offline import matures.
- **4-week verdict:** ≥8 captures + ≥1 win = scale to 250 and duplicate horizontally. Below that: iterate the *page* (headline/capture copy), not the campaign.
- Never block the WhatsApp button. Never hide the price from search traffic again.
- Scale horizontally at the sweet spot, never vertically (the Meta lesson).

## 7. Execution checklist

**Cowork (here, no Google API needed):**
- [ ] Build `/ppf-dubai-price` funnel page (revive legacy component, add soft-capture block, new funnel name, conversion wiring incl. qualified-only WhatsApp counting)
- [ ] Fix silent-save error handling (all capture paths)
- [ ] CRM: confirm new funnel name flows into Close Rates dashboard automatically (it will — classification is text-based)

**Claude Code (Google Ads CLI):**
- [ ] Write + run `setup-ppf-price-search-jul-2026.mjs` (campaign, ad groups, keywords, RSAs, sitelinks, negatives — clone the May setup script pattern; `--apply` after dry-run review)
- [ ] Build `upload-offline-conversions.mjs` (qualified + won w/ value, by gclid; daily)
- [ ] Launch day: enable new campaign, pause May campaign
- [ ] Weekly: `ads:review` search terms → add negatives

**Sean (Google Ads UI, 5 minutes):**
- [ ] Settings → turn OFF automatically created assets (sitelinks)
- [ ] Call asset schedule 9am–9pm
- [ ] Confirm new campaign's conversion goals = the two primaries + qualified-lead action once created

## 8. Sources
- [Google: landing page & ad optimization](https://support.google.com/google-ads/answer/6238826) · [WordStream: high-quality Ads landing pages](https://www.wordstream.com/adwords-landing-page) · [Local-service LP structure](https://aliraza.co/best-performing-landing-page-structure-for-local-service-google-ads-electricians-plumbers-contractors/) · [High-ticket qualification funnels](https://www.newzenler.com/blog/high-ticket-sales-funnel-qualification) · [Google: offline conversion imports](https://support.google.com/google-ads/answer/2998031) · [Enhanced conversions for leads](https://support.google.com/google-ads/answer/14274408)
