# Google Ads & Funnel Strategy — 2026-07-04

Written after the attribution-bug fix (empty-string click IDs, migration `20260704180000`), the job-card reconciliation, and a full read of `google-ads-ppf-funnel-handover-2026-06-22.md`. All numbers below are post-fix CRM truth.

## 1. What the data actually says

**Google was never "getting nothing" — it was invisible.** The empty-string fbclid bug filed every Google lead under Meta. Corrected all-time:

| Source | Leads | Won | Lost | Still open | Close rate (won ÷ all) | Revenue (ex VAT) |
|---|---|---|---|---|---|---|
| Google | 44 | 5 | 24 | 15 | 11.4% | 60,210 |
| Meta (all) | 426 | 8 | 33 | 385 | 1.9% | 93,825 |
| — of which meta_lead_ads | 386 | 5 | 32 | 349 | 1.3% | 57,255 |
| — of which meta website funnel | 37 | 3 | 1 | 33 | 8.1% | 36,570 |
| TikTok | 112 | 6 | 15 | 91 | 5.4% | 56,622 |

(Close rate = won ÷ all leads. Note the "still open" column when comparing: Google's leads are mostly worked through, while Meta's are 90% untouched — so Meta's true rate could rise if the backlog gets worked, but per-lead Google is in a different league regardless: 1 win per 9 leads vs 1 per 53 on meta_lead_ads.)

Google spend ≈ 150/day since mid-April ≈ ~12k AED → 60k ex-VAT revenue ≈ **~5x return**. It is the highest-value-per-lead channel (all 5 wins ≥10k AED).

**The Google wins are a niche:** BYD Leopard 5, Jetour G700 ×3, LX-class — premium Chinese SUVs / new-car deliveries dominate. This matches the g700-customizer business. This is the targeting signal.

**All 3 dubai-quote Google wins (41k) came through the LEGACY `/ppf-dubai-quote` page (April 15 – May 19)** — before it was replaced by the V2-component version on 06-22 (`5a97acb`). The proven closer page no longer exists in production.

**V3 reality check (06-22 → 07-04):** 58 sessions, but 9 of 12 form captures were internal tests (TEST/SEAN4/documented test numbers). **Real captures: 2 in 12 days.** The "8 form submits" in events data is test noise. Real capture rate ≈ 2/49 real sessions ≈ 4%.

**The 07-02 reconfiguration is 2 days old and frozen for 14 days by design** (counted conversions deliberately reduced to qualified-only). "Not working right now" is partly unmeasurable-yet, by plan.

## 1b. Google Ads account actuals (CLI export, 2026-07-04)

From `docs/google-ads/export-2026-07-04.txt` (May campaign, the only live one):

| Window | Clicks | Spend AED | Avg CPC | Google conversions | Cost/conv |
|---|---|---|---|---|---|
| Last 14 days | 168 | 2,354 | 14.01 | 9 (7 WhatsApp + 2 form) | 262 |
| Last 30 days | 274 | 4,418 | 16.12 | 29 | 152 |

What this changes vs earlier assumptions:

1. **Traffic is ~2x what the handover assumed.** CPC is ~14 AED, not 25–35 → **~12–14 clicks/day**, not 5–8. Volume is less of a constraint than believed.
2. **~60% of paid clicks never reach the measured funnel.** 168 clicks in 14d vs ~58 v3 sessions in 12d. The leak: ad-group sitelinks (`/portfolio`, `/services`, `/contact`, `/ppf-dubai-quote`) override the V3 campaign sitelinks, and the **V1 page still receives Google traffic** (47 sessions since 06-20, and 2 CRM leads on 07-01 came through V1). Fixing the sitelink override is now a quantified, free budget reclaim — not cosmetic cleanup.
3. **Delivery is collapsing since the 07-02 switch.** Impressions: ~300/day through June → 190 on 07-02 → **29 on 07-03**. Maximize Conversions with a deliberately starved conversion signal is throttling delivery, exactly the risk the handover flagged. Watch daily through ~07-08; if impressions stay under ~100/day, execute the documented fallback (count all WhatsApp taps again, or Max Clicks + the new negatives).
4. **A paid lead was probably lost to the silent-save bug.** Google recorded a `Submit lead form` conversion attributed to 07-03, but the CRM's last v3 capture is 07-02 (Darryl). No corresponding lead exists. At this volume, the silent-save fix is not a nice-to-have — it is priority one.
5. **True economics are good.** ~4.4k AED spend / 30d against ~30 CRM captures ≈ **~150 AED per captured lead**, with 2 June wins (19.2k revenue) already and 12 June leads still open → cost per win ≤2.2k vs 10k+ average tickets.
6. **Search terms:** converters are high-intent brand/price terms — "stek ppf price", "ppf", **Arabic "ppf للسيارات"**, "what is car ppf coating". Arabic converting with zero Arabic ad copy suggests an easy win: an Arabic RSA/ad group. Waste terms are informational and competitor-shop names (part-covered by the 07-02 negatives batch).

## 2. The three real problems

1. **Google optimizes toward the wrong people.** Smart Bidding only sees clicks/taps, not who closes. Until the close signal reaches Google, it will keep finding tyre-kickers. (This is why Maximize Clicks produced junk in June.)
2. **The proven closer page was retired mid-flight.** The legacy dubai-quote experience closed 3 of 9 Google leads; the pages since (v1/v2/v3 calculators) closed 4 of 66.
3. **Follow-up capacity, not just lead quality.** 349 meta_lead_ads leads sit open and unworked — every one of them drags the close rate down. Close rate improves as much from working leads fast as from better traffic.

## 3. Strategy

### Phase 0 — this week (don't touch the bidding; fix the plumbing)
- **Fix the silent-save bug first** in `handleUnlockDiscount` (V2/V3 show success even when the Supabase write fails). The 07-03 Google form conversion with no CRM lead is direct evidence it is already costing paid leads.
- **Fix the sitelink leak** (quantified: ~60% of clicks miss the funnel): turn OFF automatically-created sitelink assets in the UI, repoint or remove the ad-group sitelinks, and find what still sends traffic to the V1 page.
- **Watch the delivery collapse daily through ~07-08** (29 impressions on 07-03). If it does not recover, execute the fallback (count all WhatsApp taps / Max Clicks) rather than waiting the full 14-day freeze — starving delivery voids the test anyway.
- Delete/junk the documented test leads so dashboards stay honest.
- One end-to-end live test on v3 (real phone, then junk it in CRM).

### Phase 1 — close the loop to Google (highest leverage, do before any funnel debate)
Feed the CRM outcome back into Google Ads so bidding optimizes toward closers, not clickers:
- **Enhanced conversions for leads / offline conversion import.** We already store `gclid` on every lead (fixed), we have won/lost/qualified status, and the repo has full Google Ads CLI + service-account auth. Build a small daily job (script or edge function) that uploads:
  - `Qualified lead` (Sean marks qualified/quoted in CRM) — the *bidding* signal. Google guidance: at low volume, a mid-funnel qualified signal beats closed-won as the optimization target (30–50/month is the healthy floor; closed-won alone is ~2–5/month here).
  - `Closed won` with revenue — for reporting/strategic evaluation (and later tROAS if volume ever supports it).
- This directly implements "I need to qualify these people" — the qualification *is* the ad-platform signal.

### Phase 2 — funnel decision (checkpoint 07-16)
Sean's constraint is right: every lead must enter the system (calculator/form), because raw WhatsApp chats don't close. Keep the gate. The question is only *which* gated page.
- **If v3 has captured ≥4 real leads/week by 07-16:** keep v3, no changes.
- **If not: resurrect the legacy dubai-quote page** (it exists in git history / `PpfDubaiQuoteV1.tsx` lineage) at a fresh route, add the phone-gate before exact price (so it still captures into the CRM), and repoint the campaign to it with `repoint-final-urls.mjs`. Don't A/B split 6 clicks/day — sequential 2-week windows only (the experiment lesson from June).
- Either way, resolve the ad-group sitelink override (handover §5/§10): sitelinks still leak traffic to `/ppf-dubai-quote` (V2 variant) and dilute the measurement.

### Phase 3 — targeting: hunt where the wins are
- Build ad groups/keywords around **premium Chinese SUV + new car protection**: "jetour g700 ppf", "byd ppf dubai", "new car paint protection dubai", "ppf new car delivery" (keyword-planner CSV exists in `docs/google-ads/`). The five Google wins are all this buyer.
- Keep "no prices in ads" (avg ticket 10k+), keep STEK-hero copy, keep competitor-film negatives.
- Budget: stay at 150/day until the qualified-signal loop runs; then scale **horizontally** (duplicate winner at sweet spot) per the Meta lesson — never vertically.

### Cross-channel moves (funded by the same conclusion)
- **Kill meta_lead_ads** (native lead forms): 1.3% close rate (5 won from 386), 349-deep unworked backlog. Shift that budget to the meta *website* funnel (8.1% — 3 won from 37, only 1 lost so far) at its proven ~100/day sweet spot.
- **Restart TikTok small** on `ppf_tiktok_quote` (5.4% — 6 won from 112 historically, second-best per-lead channel) at ~100/day.
- **Work the backlog:** the new task board now shows all 455 open follow-ups; overdue-first. Close rate is made on the phone, not in the ad account.

## 4. Success criteria (next 30 days)
- Google: ≥20 CRM captures/month (30d actual is ~30 at ~150 AED each — hold or beat that), ≥3 qualified/month uploaded to Google, ≥1 win/month, cost per win <5k AED (vs ~10–15k avg ticket).
- Impressions recovered to ≥200/day by 07-08 (or fallback executed).
- Funnel: v3 (or its replacement) ≥6% real session→capture.
- Ops: no lead older than 24h without first touch (SLA board).

## Sources (offline-conversion best practice)
- [Google: About offline conversion imports](https://support.google.com/google-ads/answer/2998031)
- [Google: Enhanced conversions for leads upgrade](https://support.google.com/google-ads/answer/14274408)
- [Offline conversions for lead gen — qualified-lead signal at low volume](https://mycorp.digital/en/blog/offline-conversions-google-ads-leadgen.html)
- [Search Engine Journal: Use offline conversions to tune Google Ads for profit](https://www.searchenginejournal.com/offline-conversions-tune-google-ads-profit/507104/)
