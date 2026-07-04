# Claude Code Handoff — Google Fresh Start (2026-07-04)

Execute the fresh-start Google campaign. Strategy + evidence: `google-fresh-start-plan-2026-07-04.md` and `google-ads-strategy-2026-07-04.md`. Account state: `google-ads-ppf-funnel-handover-2026-06-22.md`. Account actuals: `docs/google-ads/export-2026-07-04.txt`.

**Decisions already made with the owner:** price shown openly (no gate) · soft capture ("WhatsApp me this exact quote") · budget 200 AED/day (250 ceiling) · pause the May campaign the day the new one goes live · no Arabic ad group yet.

---

## 1. What is ALREADY BUILT (in this working tree — commit + deploy first)

### New funnel: `/ppf-dubai-price` (variant `price` of `PpfFullPpfGuidedCalculatorV2`)
- **Funnel name:** `ppf_google_price_2026h2` · landing variant `google_price_2026h2` (fresh keys — clean measurement in the Funnel/Close Rates dashboards, no code needed there).
- **Behavior vs V3:**
  - Price is **SHOWN** after the 3-step calculator (20% discount anchor with strikethrough — the proven presentation). No gate.
  - **No pre-chat popup ever** — WhatsApp is always direct 1-tap.
  - **Soft capture** under the revealed price: phone-only form (no name field). Primary submit = green **"WhatsApp me this exact quote"** → saves lead to CRM → auto-opens WhatsApp with the quote pre-filled (opens even if the save fails — never lose the human; failure is logged loudly as `lead_save_failed` event). Secondary link = "Just lock this price for 14 days — no WhatsApp yet" (save only).
  - **Google conversions:** `Submit lead form` fires on successful save (value = target price). `WhatsApp contact click` (counted) fires **only on post-price qualified taps**; pre-price taps fire the observe-only action. One counted conversion per session (existing guard).
- **Files changed:** `src/pages/PpfFullPpfGuidedCalculatorV2.tsx` (variant type/config/flags/capture flow), `src/App.tsx` (route).
- **Deploy = push to main** (Vercel). Typechecked clean against the repo.

### Pre-launch verification (after deploy, before campaign)
1. Open `/ppf-dubai-price` on mobile: complete calculator → price shows with strike → enter a real phone → "WhatsApp me this exact quote" → confirm WhatsApp opens with the quote AND a lead lands in the CRM (`ppf_google_price_2026h2`) + Telegram alert. Junk the test lead afterwards.
2. Check the `lead_save_failed` event does NOT appear in lead_events for the test (if it does, the Supabase write failed — stop and investigate before spending).
3. Confirm tag firing: qualified WhatsApp tap after price → `AW-17684563059/KqOWCJfDoLAc…`; save → `AW-17684563059/5R6tCPbq…`.

---

## 2. Campaign build (write `setup-ppf-price-search-jul-2026.mjs`, clone the pattern of `setup-ppf-search-may-2026.mjs`; dry-run, review, then `--apply`)

**Campaign:** `PPF Price Search Dubai - Jul 2026`
- Search only; Display + Search-partner expansion OFF.
- Budget 200 AED/day. Bidding: **Maximize Clicks, max CPC cap 20 AED** (weeks 1–2; switch to Max Conversions only at ≥15 counted conv/30d).
- Geo: Dubai + Sharjah. Language: English.
- Final URL for all RSAs + sitelinks:
  `https://www.grandtouchauto.ae/ppf-dubai-price?utm_source=google&utm_medium=paid_search&utm_campaign=ppf_price_search_jul_2026`

**Ad groups (phrase + exact only — NO broad):**
1. `PPF Price Quote` — "ppf price dubai", "ppf cost dubai", "car ppf cost", "ppf quote dubai", "how much is ppf dubai", [stek ppf price]
2. `Core PPF Dubai` — "ppf dubai", "paint protection film dubai", "ppf car", "ppf near me"
3. `STEK Film` — "stek ppf", "stek dubai", "stek paint protection", "stek dynoshield"
4. `New Car Protection` — "new car paint protection dubai", "new car ppf", "jetour g700 ppf", "byd ppf dubai", "chinese car ppf dubai" (all 5 historic Google wins are this buyer — low volume, watch and expand from search terms)

Pull exact keyword candidates + bids from `docs/google-ads/keyword-planner-master-2026-06-18.csv` (themes: `price_quote_intent`, `core_ppf_intent`, `brand_or_competitor_film` STEK rows only, `vehicle_specific`).

**RSAs (3 per ad group), theme-matched.** Shared headline pool: "See Your Exact PPF Price" · "Full Car PPF Price In 60 Seconds" · "Genuine STEK Film" · "Free Pickup Across Dubai" · "Rated 4.9 By Dubai Drivers" · "Direct With The Owner" · "Price Shown Instantly — No Forms". NO numeric prices in ads. Per-group first headline mirrors the keyword ("PPF Price Dubai", "PPF Dubai", "STEK PPF Dubai", "New Car PPF Dubai").

**Assets:** campaign-level sitelinks only → all to the funnel URL (+ Portfolio `/portfolio`, Contact `/contact` as navigational). Callouts: reuse the 8 live ones. Call asset `+971 56 719 1045`. **No ad-group-level sitelinks** (they overrode campaign sitelinks last time and leaked ~60% of clicks off-funnel).

**Negatives (day one):** attach every existing negative list/set from the May campaign (competitor shops, informational what-is/types, matte wrap, colour change, deals, door edge, competitor films XPEL/SunTek/LLumar/3M/Hexis) + the June zero-conv terms in the export.

**Conversion goals on the campaign:** `Submit lead form` (primary) + `WhatsApp contact click` (primary). Nothing else.

## 3. Launch sequence (one sitting)
1. Deploy funnel (push to main) → run §1 verification.
2. Dry-run the setup script → review output → `--apply`.
3. Enable the new campaign.
4. **Pause `PPF Search UAE - WhatsApp - May 2026`** (`23869007416`).
5. Owner UI steps (5 min): Settings → **Automatically created assets OFF** (sitelinks) · call asset schedule 9am–9pm · confirm campaign conversion goals.

## 4. Next build: offline conversion upload (this week)
`scripts/google-ads/upload-offline-conversions.mjs` — daily job:
- Query CRM (Supabase, service key): leads with `gclid is not null` and status in (`qualified`,`quoted`,`won`) changed since last run (`lead_status_history`).
- Upload `Qualified lead` conversions (create the action if missing) + `Closed won` with `latest_quote_estimate` as value, keyed by gclid, per [OCI docs](https://support.google.com/google-ads/answer/2998031) / [enhanced conversions for leads](https://support.google.com/google-ads/answer/14274408).
- This becomes the real bidding signal — see plan §Phase 1.

## 5. Guardrails (repeat — they were all violated last time)
- No changes for 14 days except weekly search-term negatives.
- No experiments, no A/B splits, no vertical budget raises. Sequential tests; horizontal scaling at the proven sweet spot.
- Judge weekly on CRM captures per 100 clicks and cost/capture (<250 AED target; 30d baseline was ~150). 4-week verdict: ≥8 captures + ≥1 win → scale; else iterate the page copy, not the campaign.
- Never block WhatsApp. Never hide the price from search traffic.

## 6. Monitoring the old campaign's ghost
The May campaign stays paused, not removed. If Google reports conversions on it post-pause, they're lagged attributions — don't reactivate. Watch the new campaign's impressions daily for the first week (`node scripts/google-ads/daily-breakdown.mjs --env=.env.google-ads --days=7`); with Max Clicks + capped CPC, delivery starvation should not occur.
