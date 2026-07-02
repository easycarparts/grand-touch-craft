# Google Ads + PPF Funnel Handover — 2026-06-23

Supersedes `google-ads-ppf-funnel-handover-2026-06-19.md`. This is the current full state of the Google Ads account, the funnels, the tracking, and the local CLI. No secret values here — only file names and resource IDs.

Customer ID: `5268213497` · Site: `https://www.grandtouchauto.ae` · Deploy: **Vercel auto-deploys from `main`** (push to main = production deploy). Repo: `github.com/easycarparts/grand-touch-craft`.

---

## ⭐⭐ UPDATE 2026-07-02 — QUALIFIED-SIGNAL RECONFIGURATION (current truth)

After a detour (campaign was reverted to V1 + flipped to Maximize Clicks + budget cut to 150 — this produced cheap junk clicks, 78% of spend on zero-conv terms, and unqualified WhatsApp chats that don't close), the account was reconfigured on 2026-07-02 as one coherent batch, then FROZEN for 14 days:

- **Bidding: Maximize Conversions** (user switched in UI). Budget still AED 150/day (consider 250 later).
- **Campaign → V3 gated funnel again** (all 3 RSAs + 6 campaign sitelinks verified).
- **Counted-signal rewire (commit `e5cf8fb`):** on gated funnels, the counted Google `WhatsApp contact click` fires ONLY on qualified taps (calculator complete). Drive-by pre-calculator taps fire the observe-only action. Form submit remains primary. Rationale: owner confirms direct-WhatsApp leads rarely close; counting them trained Smart Bidding to find tyre-kickers.
- **+17 negatives** (`add-negatives-jul-2026.mjs`): competitor shops, informational (what is/types of), colour-change ppf, deals, door edge — the Maximize Clicks junk.
- **Keep the campaign** (do NOT start fresh — history/QS/ad-strength are assets; the wiring was the problem).
- **Meta lesson (owner-confirmed):** gated Meta funnel worked at ~AED 100/day; raising budget broke it. Scale horizontally (duplicate campaigns at the sweet spot), never vertically.
- **Expect fewer counted conversions by design.** Judge by CRM captures × close rate. If delivery starves after 2 weeks (<~15 conv/month), fallback = count all WhatsApp taps again (one-line change in `handleWhatsApp`).

## ⭐ LATEST STATE (2026-06-23) — read this first

**Both paid funnels are now "gated + direct WhatsApp" and live:**
- **Google** (May campaign) → `/ppf-full-ppf-calculator-guided-v3` (variant `v3`).
- **Meta** (AED ~50/day test) → `/ppf-meta-full-car-ppf-v2` (variant `meta`).

**What "gated + direct WhatsApp" means** (one shared code path, flag `isGated = variant === "v3" || variant === "meta"` in `PpfFullPpfGuidedCalculatorV2.tsx`):
- **WhatsApp = direct 1-tap, NO pre-chat popup** (the popup was the real reason V2/V3 conversions cratered vs the proven V1 — it intercepted the WhatsApp impulse and shoved people into the calculator). Google variant fires the counted `WhatsApp contact click`; Meta fires `Contact` + `Lead`.
- **Exact price is GATED behind a phone-only form** (name optional). Pre-unlock shows a struck "Before your discount" price (coral animated strike) + a locked reward bundle (discounted price / 20% / AED 4,550 extras / free pickup), NO exact price. Unlock → animated slash + odometer count-down + "you unlocked AED X of value" stamp + itemized free-extras cascade.
- **The calculator never blocks WhatsApp** — it's the *rewarded* path for people who want their price, not a wall.

**`google` / `dubai_quote` / `tiktok` variants are UNCHANGED** (price shown, soft pre-chat popup). The Google campaign no longer uses the `google`/`-v2` page (it's the rollback target).

**Key recent commits (all live on `main`):**
- `cbc0d22` — Meta funnel gated + direct WhatsApp (`isV3`→`isGated = v3||meta`).
- `1941a23` — V3 WhatsApp direct (popup removed).
- `ec136d6` — V3 variant created; campaign repointed to `-v3`.
- `5a97acb` — `/ppf-dubai-quote` serves V2 funnel (dubai_quote variant).
- `077bf29` — Meta fires Lead (+Contact) on WhatsApp tap.
- `0a7b439` — V2 counts WhatsApp + lead-form, one per session.

**Resolved / clarified since the 06-22 notes:**
- **Supabase write outage = FIXED** (user upgraded the plan). It was free-tier read-only mode. Watch DB size (`lead_events` grows fast) so it doesn't recur.
- **"Tracking/URL broken" was a false alarm** — the CRM logs detailed sessions with correct per-source funnel names, so tracking + routing are fine. The "lots saw price, didn't convert" was **mostly Meta traffic** (which still had the popup + shown price until `cbc0d22`), plus the V2/V3 popup, NOT a bug.
- **Conversion setup audited and correct** (see §8). The recent dip was the popup suppressing WhatsApp, now removed on both gated funnels.

**Still needs a UI action (can't be done via API):**
- **Auto-created sitelinks.** The ad-group sitelinks (`View Portfolio` /portfolio, `Our Services` /services, `Contact Us` /contact, `Get PPF Estimate` /ppf-dubai-quote) are Google **automatically-created assets** — `CANNOT_MODIFY_AUTOMATICALLY_CREATED_ASSET` (not editable/removable via API or manually). They override the manual campaign sitelinks. To make all sitelinks land on V3: **Google Ads → turn OFF "Automatically created assets" (sitelinks)**, then the manual V3 campaign sitelinks serve.
- **Set the call asset's 9am–9pm schedule** (Assets → Calls → schedule).
- Optionally **demote nothing for Maps** — the `Get directions`/`Engagement` goals are already 0-of-5 campaigns (not optimised for).

**Next:** stop changing the funnels; let both run ~2 weeks with the now-working tracking. Judge by **numbers captured per 100 clicks × Sean's close rate** in the CRM (`_v3` and `_meta_…_v2`), not Google's conversion column. Confirm end-to-end once by tapping WhatsApp on each live page and watching it land in the CRM.

---

## 1. Current position (what's live vs local)

- The **May WhatsApp Search campaign is the only live engine**, and it now points at the **V3 price-gated funnel** (`/ppf-full-ppf-calculator-guided-v3`) as of 2026-06-22.
- Both Google Ads **experiments are removed**. `PPF Near Me Local` ad group is **paused**.
- **V3 is LIVE** (commit `ec136d6`, pushed; validated desktop + mobile). The campaign's 3 RSAs + 6 sitelinks all point to it. Rollback = repoint to `-v2`. Monitor V3 capture rate vs the V2 baseline.
- Two live incidents to keep watching: a **Google conversion-reporting stop after 2026-06-18** (account-level, not our code) and a **Supabase write outage** (free-tier limit; user resolved — watch DB size).

---

## 2. Live Google Ads campaigns

### Control / main (LIVE)
- ID `23869007416` · `PPF Search UAE - WhatsApp - May 2026`
- Status ENABLED · Budget AED 250/day · Bidding `MAXIMIZE_CONVERSIONS`
- **Final URLs (3 RSAs + 6 sitelinks) point to the V3 price-gated funnel:**
  `https://www.grandtouchauto.ae/ppf-full-ppf-calculator-guided-v3?utm_source=google&utm_medium=paid_search&utm_campaign=ppf_whatsapp_search_may_2026`
- **Rollback to V2** (proven funnel): `node scripts/google-ads/repoint-final-urls.mjs --env=.env.google-ads "--campaign=PPF Search UAE - WhatsApp - May 2026" --apply` (the script's default URL is the `-v2` one). To V1: pass `--url=.../ppf-full-ppf-calculator-guided?...`.
- Ad groups: `PPF Paint Protection` (ENABLED, volume driver), `PPF Dubai Quote` (ENABLED, best CTA/CPA), `PPF Near Me Local` (**PAUSED** — 30d AED 169 / 0 conv).

### Removed / paused (do not revive without reason)
- Experiment `customers/5268213497/experiments/10061141676` (Clean 50-50) → **REMOVED**.
- Experiment `...experiments/10061143925` (a leftover SETUP experiment, ended 2026-08-01) → **REMOVED** (was a budget-split landmine).
- Treatment campaign `23953541408` → **REMOVED** (by experiment end).
- Old standalone `23948166913` `PPF V2 Funnel Test - June 2026` → **PAUSED** (spent badly, keep paused).

---

## 3. Conversion actions

| ID | Name | Type | Counted? | send_to / notes |
|---|---|---|---|---|
| 7617388951 | WhatsApp contact click | WEBPAGE | **Yes, primary**, ONE_PER_CLICK | `AW-17684563059/KqOWCJfDoLAcEPOI1PBB` |
| 7569208694 | Submit lead form | WEBPAGE | **Yes, primary**, MANY_PER_CLICK | `AW-17684563059/5R6tCPbqo5kcEPOI1PBB` |
| 7649703525 | WhatsApp before lead form (V2) | WEBPAGE | **No** (observe-only) | `AW-17684563059/q_bgCOXs1L8cEPOI1PBB` (dashboard only) |
| 7576759600 | Clicks to call | GOOGLE_HOSTED | primary | feeds the new call asset |
| 7569549326 / 7575550723 | Local actions (Directions / Other) | GOOGLE_HOSTED | primary | Maps/GBP, independent of website |
| 7359338535 | GA4 purchase | GA4 | HIDDEN | ignore |

Base tag in `index.html`: `gtag('config','AW-17684563059')` + GA4 `G-MLMLJ9E79Y` + GTM `GTM-T8RG7D93`. Meta pixels: `2842874119378140`, `665277526426486`.

---

## 4. Funnels & routes

The V2 component (`src/pages/PpfFullPpfGuidedCalculatorV2.tsx`) is **shared** across variants via a `variant` prop. `guidedVariantConfig[variant]` holds copy/SEO/funnel-name. Flags: `isGoogleVariant = google || dubai_quote || v3`, `isMetaVariant = meta`, `isTikTokVariant = tiktok`, `isV3 = v3`.

| Route | Component / variant | Funnel name (dashboard) | Status |
|---|---|---|---|
| `/ppf-full-ppf-calculator-guided` | `PpfFullPpfGuidedCalculator.tsx` (V1) | `ppf_full_ppf_guided_calculator` | live, no longer used by the campaign |
| `/ppf-full-ppf-calculator-guided-v3` | V2 `v3` | `ppf_full_ppf_guided_calculator_v3` | **LIVE — the campaign points here (since 2026-06-22)** |
| `/ppf-full-ppf-calculator-guided-v2` | V2 `google` (default) | `ppf_full_ppf_guided_calculator_v2` | live — **rollback target** (campaign no longer points here) |
| `/ppf-dubai-quote` | V2 `dubai_quote` | `ppf_dubai_quote` | **LIVE** (replaced legacy `PpfDubaiQuote.tsx`) |
| `/ppf-meta-full-car-ppf-v2` | V2 `meta` | `ppf_meta_guided_calculator_v2` | live (Meta) |
| `/ppf-tiktok-quote_2` | legacy `PpfDubaiQuote.tsx` `tiktok` | `ppf_tiktok_quote` | live |
| `/ppf-dubai-quote-v1` | `PpfDubaiQuoteV1.tsx` | — | live (test) |

### V2 conversion wiring (the important bit)
- **One counted Google conversion per session** via a shared guard `googleCountedConversionFiredRef`: either `WhatsApp contact click` (on any WhatsApp tap) **or** `Submit lead form` (on the unlock), whichever fires first.
- Non-counted `WhatsApp before lead form (V2)` still fires (own guard) for the dashboard.
- Post-submit "send my locked-in price" handoff = **analytics only** (no counted conversion) so one user never double-counts.
- Pre-chat popup ("Build my price first / Message Sean now") softly nudges to the calculator on pre-completion WhatsApp taps.

### Meta variant
- **As of `cbc0d22` (2026-06-23) the Meta funnel is GATED + direct WhatsApp, same as V3** (it's part of `isGated = v3 || meta`). Price hidden behind the phone-only form; no pre-chat popup.
- WhatsApp tap fires **both `Contact` and `Lead`** (so the Meta ad set, optimised for `Lead`, counts WhatsApp). Form submit (unlock) fires `Lead`. Keep the ad set Conversion event = **Lead**. Two pixels fire: `2842874119378140`, `665277526426486`.

### V3 — IMPORTANT UPDATE (2026-06-22): WhatsApp is now direct, no popup
- Commit `1941a23`: on V3, `requestWhatsApp` **bypasses the pre-chat popup** and fires WhatsApp directly (counted `WhatsApp contact click` + opens chat) like the proven V1 funnel. The popup was the single real difference vs V1 and was suppressing the WhatsApp taps that drove CPA ~90. Other variants keep their popup.
- So V3 = direct 1-tap WhatsApp (volume) **+** gated price reveal for anyone who builds their quote (capture). Verified desktop + mobile.

### V3 variant (localhost, the price-gate experiment)
- **Locked state:** struck "before" price (coral-red animated strike, labelled "Before your discount") + "−20%" + "your real price is lower — it's locked"; 4 locked reward cards (the discounted-price card is the green hero, others muted); shimmer removed (calm).
- **Unlock:** phone-only (name optional). Reveal = animated slash + odometer count-down + "You unlocked AED X of value" stamp + itemized free-extras cascade.
- Fires the same Google conversions as `google` (isGoogleVariant includes v3). Own funnel name for clean A/B in the dashboard.
- **Shipped** in commit `ec136d6` (`src/App.tsx` route, `src/pages/PpfFullPpfGuidedCalculatorV2.tsx` variant+UI, `tailwind.config.ts` animations `guided-flip-in`/`guided-shimmer`/`guided-stamp-in`). Validated desktop + mobile (0 layout overflow, no console errors).
- **The campaign points here as of 2026-06-22.** Measure `ppf_full_ppf_guided_calculator_v3` capture rate vs the V2 baseline; rollback = repoint to `-v2`.

---

## 5. Ad assets (live on the May campaign)
- **Call asset** added: `+971 56 719 1045` (account-level call conversion). ⚠️ The **9am–9pm schedule must be set in the Google Ads UI** (API can't schedule call assets).
- **Callouts (8):** Direct With Sean · Warranty You Can Trace · Genuine STEK Film · Proper Prep Before Film · Free Pickup Across Dubai · New Car Protection · Premium Films Available · Trusted By Dubai Drivers.
- **Campaign-level sitelinks (6, → the funnel URL):** WhatsApp Sean · Why Grand Touch · Why We Use STEK · PPF Quote · Free Pickup & Delivery · Real Customer Handovers. NOTE: these are **overridden by ad-group-level sitelinks** (below), so they may not serve.
- **Ad-group-level sitelinks (12 = 4 × 3 ad groups), NOT changed to V3:** `/portfolio`, `/services`, `/contact` (navigational — correct to stay) and `/ppf-dubai-quote` (goes to the V2 dubai_quote funnel, not V3). These take precedence over the campaign sitelinks. Optional cleanup: point the `ppf-dubai-quote` ad-group sitelink → V3, or remove ad-group sitelinks so the campaign V3 ones serve. `repoint-final-urls.mjs` only covers RSAs + campaign sitelinks — ad-group sitelinks need a separate update.
- **Conversion destination audit (2026-06-22):** all 3 RSAs + 14 images + 6 campaign sitelinks → V3. Only the ad-group sitelinks above are off-V3 (by design / legacy).
- **RSA headlines refreshed** on `PPF Paint Protection` + `PPF Dubai Quote` — added Free Pickup Across Dubai, Rated 4.9 On Google, Protect Your New Car; removed generic filler. **No prices in ads** (deliberate — avoid price shoppers; avg billing 10k+).

---

## 6. Films, positioning, proof
- **Films GTA installs (never negative these):** STEK, KDX, Diamond Pro, Supreme, GYEON. **STEK is the hero** in ad copy.
- **Competitor films (kept as negatives):** XPEL, SunTek, LLumar, 3M, Hexis, etc.
- Google rating: **4.9 / 77 reviews** (usable in copy; numeric review claims can occasionally be disapproved — fallback "Trusted By Dubai Drivers").
- Free pickup across Dubai = always offered.

---

## 7. Tracking, dashboard, Supabase
- Funnel events + CRM via Supabase project `lkikhrrzhddrdjfbbwjk`. Client = anon key from `.env.supabase` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`), baked into the prod bundle.
- Tables: `lead_events`, `lead_contact_snapshots`, `admin_session_rollups`, `crm_alert_queue`, `leads`.
- **RLS:** anon can **INSERT** (`with check (true)`) but **cannot SELECT** — so direct API reads return `*/0`. The Admin Funnel Dashboard reads via an **authenticated admin session** (`/admin/login`). Don't conclude "empty" from an anon read.
- **Telegram alerts** = Supabase edge function `supabase/functions/telegram-crm-alerts` (downstream of lead insert / `crm_alert_queue`). Needs `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` secrets + the function deployed.
- **Known UX bug:** V2/V3 `handleUnlockDiscount` shows the "success" reveal **even if the Supabase write fails** (silent `console.warn`). A failed save looks successful to the user. Worth fixing (surface a real error).

### Supabase write-outage incident (resolved, watch)
A lead submit silently failed (no DB row, no Telegram). Cause: project healthy + reads OK but **writes rejected** = classic **free-tier read-only mode (DB/egress limit)** — `lead_events` grows fast. User resolved it. Watch DB size; prune `lead_events` or upgrade if it recurs.

---

## 8. Conversion setup AUDIT (2026-06-22) + the recent drop
**Setup is verified correct** — don't re-debug it:
- Code: WhatsApp tap → `WhatsApp contact click` (`KqOWCJfDoLAc`); form unlock → `Submit lead form` (`5R6tCPbq`); one counted per session; pre-form → observe-only (`q_bgCOXs`). All gated to Google variants (incl V3). send_to IDs match the account. Base tag `gtag('config','AW-17684563059')` in index.html.
- Google Ads: `Submit lead form` (Primary, 5-of-5 campaigns, Active) and `Contact` goal incl. `WhatsApp contact click` (Primary, 5-of-5, Active) — both applied to the live campaign. `WhatsApp before lead form (V2)` = Secondary (correct). **Last 30d recorded: WhatsApp 18, Submit 4, Calls 1, Maps 33** → tracking works.
- `Get directions` / `Engagement` (Maps) goals = **0-of-5 campaigns** (NOT applied to any campaign) → they do NOT dilute bidding. No action needed (this corrects an earlier note about demoting them).

**The recent "no conversions" (06-18 → ~06-22) was not a setup break** — it lines up with the **popup-gated V2/V3 suppressing WhatsApp taps** (the main counted conversion) via the experiment then the URL repoints, plus experiment turbulence. The popup was removed from V3 on 2026-06-22 (`1941a23`), so WhatsApp conversions should recover. The Maps "gap" is low-volume/lag, not a systemic break. Watch the daily count over the next few days; Google Ads conversions lag a few hours, the CRM/Telegram are instant.
- **To check (Google Ads UI):** Goals → Conversions → Status column ("Recording" vs "No recent conversions / Inactive"); account notifications dated ~06-18; compare with GA4 real-time.
- If conversions for 06-19+ **backfill**, it was lag. If not, treat as an account tag/attribution issue. If counted conversions stay near zero, consider switching bidding to **Maximize Clicks** so delivery doesn't starve.

---

## 9. CLI access (read-only unless `--apply`)
Env file `.env.google-ads` (`GOOGLE_ADS_DEVELOPER_TOKEN`, `GOOGLE_ADS_CUSTOMER_ID`, `GOOGLE_ADS_LOGIN_CUSTOMER_ID`, `GOOGLE_ADS_SERVICE_ACCOUNT_KEY_PATH`, `GOOGLE_ADS_API_VERSION=v23`). Service-account JSON in `Secrets/`.

Existing read commands:
```
npm run ads:doctor        -- --env=.env.google-ads
npm run ads:campaigns     -- --env=.env.google-ads --days=7
npm run ads:review        -- --env=.env.google-ads --days=7
npm run ads:conversions   -- --env=.env.google-ads
npm run ads:conversion-review -- --env=.env.google-ads
# inspect-campaign: npm mangles spaced args — call node directly:
node scripts/google-ads/inspect-campaign.mjs --env=.env.google-ads "--campaign=PPF Search UAE - WhatsApp - May 2026"
```
Note: GAQL date constant is `LAST_7_DAYS`/`LAST_14_DAYS`/`LAST_30_DAYS`/`TODAY`/`YESTERDAY` (no `LAST_3_DAYS`). `LAST_7_DAYS` excludes today.

### Scripts created this session (all dry-run by default; `--apply` to write)
| Script | Purpose |
|---|---|
| `scripts/google-ads/repoint-final-urls.mjs` | Repoint a campaign's RSAs **and sitelinks** to a new URL. Used to move May campaign → V2. |
| `scripts/google-ads/cleanup-experiments.mjs` | Remove leftover SETUP experiments; report treatment-campaign state. |
| `scripts/google-ads/set-ad-group-status.mjs` | Enable/pause an ad group (`--ad-group=`, `--status=PAUSED\|ENABLED`). Used to pause Near Me. |
| `scripts/google-ads/add-ad-assets-jun-2026.mjs` | Add call asset + callouts + sitelinks (additive, deduped). |
| `scripts/google-ads/refresh-rsa-headlines-jun-2026.mjs` | Refresh RSA headlines/descriptions on the two live ad groups. |

Mutating scripts run `validateOnly` first; the auto-sandbox blocks writes to the production Supabase DB (expected).

---

## 10. Open items / next actions
1. **Decide V3:** commit + run as primary (don't split), measure capture-rate vs V2 baseline + Sean's close rate. Optional polish: confetti, soften "20% online discount" → "your online discount" to blunt price inference.
2. **Set the call asset 9am–9pm schedule** in the Google Ads UI.
3. **Monitor the conversion-stop** (section 8) — backfill = lag; else investigate Status.
4. **Watch Supabase DB size** (section 7) so writes don't hit read-only again.
5. **Fix the silent-save bug** (section 7) so failed lead writes show an error.
6. **`/ppf-dubai-quote` SEO:** prerender static meta description in `scripts/prerender.js` is stale (old page copy) — update on next pass (cosmetic; client-side meta is correct).
7. **Hide test leads in CRM:** `+971501234567` (Conversion Test), `+971502223344`, `+971503334455`, `+971504445566`, `+971505556677` (V3 test unlocks). Real partial leads to actually follow up: `+971585225858` (Haval H9), `+971568362060` (Joseph/BYD), `+971565027733` (Meta/Patrol).
8. **Ad-group sitelinks decision** (section 5): they override the campaign V3 sitelinks and one (`/ppf-dubai-quote`) points to the V2 funnel. Optional: point that one → V3 (keep portfolio/services/contact), or remove ad-group sitelinks so the V3 campaign sitelinks serve.
9. **Demote Maps Local-actions to Secondary** — NOT needed; they're already 0-of-5 campaigns (not optimised for). Ignore the earlier suggestion.

---

## 11. Strategy notes (don't lose these)
- Budget ~AED 250–300/day → **~8 clicks/day**. At this scale, conversion-based Smart Bidding barely functions; **the real goal is capturing contactable leads for Sean, not feeding Google's algorithm.**
- Judge funnels by **numbers captured per 100 clicks × close rate**, not platform conversion count.
- `PPF Paint Protection` (volume) + `PPF Dubai Quote` (best CTA/CPA) are the earners. `ppf coating` is the volume keyword but highest CPA (watch its search terms). `paint protection film` / `ppf car` are the healthiest.
- Don't over-gamify the premium brand (no spin-wheels/scratch). Don't A/B split traffic at this budget (the experiment lesson). Don't show low prices in ads.
</content>
