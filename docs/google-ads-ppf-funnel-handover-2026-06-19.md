# Google Ads PPF Funnel Handover - June 2026

Last updated: 2026-06-19, Asia/Dubai.

This is the current Google-only paid-search and funnel handover for Grand Touch Auto PPF. It covers where the Google Ads CLI/API setup lives, which campaigns/funnels are live, what has been tested, current findings, and what not to touch without a clear reason.

This document intentionally does not include secret values. It names local files and env vars only.

## Current Position

The working Google Ads engine is still the May WhatsApp search campaign. The V2 funnel is being tested through a clean 50/50 Google Ads experiment, not through the old standalone V2 campaign.

Current recommendation as of 2026-06-19:

- Leave the clean V2 experiment running over the weekend.
- Do not add keywords, remove negatives, change goals, or change budgets during the early test unless something is obviously broken.
- If V2 spends roughly AED 250-400 with no real leads, WhatsApp conversations, or form submits, end the test and move spend back to the working May guided funnel.
- Keep the old standalone V2 campaign paused.

## Live Google Ads Campaigns

### Control Campaign

- Campaign ID: `23869007416`
- Name: `PPF Search UAE - WhatsApp - May 2026`
- Status: `ENABLED`
- Primary status: `ELIGIBLE`
- Experiment type: `BASE`
- Budget: AED 250/day
- Bidding: `MAXIMIZE_CONVERSIONS`
- Final URL:
  - `https://www.grandtouchauto.ae/ppf-full-ppf-calculator-guided?utm_source=google&utm_medium=paid_search&utm_campaign=ppf_whatsapp_search_may_2026`
- Funnel route:
  - `/ppf-full-ppf-calculator-guided`
- Page file:
  - `src/pages/PpfFullPpfGuidedCalculator.tsx`
- Tracking bucket:
  - `ppf_full_ppf_guided_calculator`
  - `google_full_ppf_guided_calculator`

This is the current proven funnel. It is WhatsApp-first, lower friction, and less restrictive than V2.

### Clean V2 Experiment Treatment

- Campaign ID: `23953541408`
- Name: `PPF Search UAE - WhatsApp - May 2026 Funnel V2 Clean 50-50`
- Status: `ENABLED`
- Primary status: `LEARNING`
- Experiment type: `EXPERIMENT`
- Budget object: shared/inherited from the May campaign budget, AED 250/day
- Bidding: `MAXIMIZE_CONVERSIONS`
- Enabled final URL:
  - `https://www.grandtouchauto.ae/ppf-full-ppf-calculator-guided-v2?utm_source=google&utm_medium=paid_search&utm_campaign=ppf_may_structure_v2_experiment_clean_50_50`
- Funnel route:
  - `/ppf-full-ppf-calculator-guided-v2`
- Page file:
  - `src/pages/PpfFullPpfGuidedCalculatorV2.tsx`
- Tracking bucket:
  - `ppf_full_ppf_guided_calculator_v2`
  - `google_full_ppf_guided_calculator_v2`

Notes:

- This treatment campaign has paused inherited ads that still point to the original guided URL. That is expected from the experiment clone.
- The enabled treatment ads point to the V2 URL above.
- V2 has a softer pre-WhatsApp nudge now:
  - `Build my price first`
  - `Message Sean now`
- V2 is not a hard WhatsApp gate. It adds one soft step before direct WhatsApp if the visitor has not completed the calculator.

### Old Standalone V2 Campaign

- Campaign ID: `23948166913`
- Name: `PPF V2 Funnel Test - June 2026`
- Status: `PAUSED`
- Primary status: `PAUSED`
- Budget: AED 150/day
- Bidding: `MAXIMIZE_CONVERSIONS`
- Final URL:
  - `https://www.grandtouchauto.ae/ppf-full-ppf-calculator-guided-v2?utm_source=google&utm_medium=paid_search&utm_campaign=ppf_v2_funnel_test`

This is the standalone V2 campaign that was created separately and performed poorly. Keep it paused. It is not the active test.

## Google Ads Experiment

- Experiment resource:
  - `customers/5268213497/experiments/10061141676`
- Name:
  - `Funnel V2 Experiment - Clean 50-50 - Jun 2026`
- Status:
  - `ENABLED`
- Type:
  - `SEARCH_CUSTOM`
- Start date:
  - `2026-06-18`
- End date:
  - `2026-07-10`

Arms:

- Control arm:
  - Name: `Control - May WhatsApp Funnel`
  - Campaign: `23869007416`
  - Traffic split: `50`
- Treatment arm:
  - Name: `Treatment - V2 Funnel`
  - Campaign: `23953541408`
  - Traffic split: `50`

Important interpretation:

- Even though the budget object says AED 250/day on both arms, the experiment is split traffic. It should not be treated as two independent AED 250/day campaigns.
- Early delivery can still be uneven. Watch actual spend/click distribution, not just the intended split.

## Recent Performance Snapshot

Pulled through Google Ads API on 2026-06-19 at roughly 15:16 Dubai time.

### Yesterday - 2026-06-18

| Campaign | Cost | Impr. | Clicks | Avg CPC | Conv. | CPA |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| May WhatsApp control | AED 187.85 | 251 | 12 | AED 15.65 | 1 | AED 187.85 |
| Clean V2 treatment | AED 84.77 | 165 | 4 | AED 21.19 | 0 | n/a |
| Old standalone V2 | AED 96.39 | 16 | 1 | AED 96.39 | 0 | n/a |

The standalone V2 spend on 2026-06-18 likely happened before or around pause timing. Watch that it remains AED 0 after pause.

### Today So Far - 2026-06-19

| Campaign | Cost | Impr. | Clicks | Avg CPC | Conv. |
| --- | ---: | ---: | ---: | ---: | ---: |
| May WhatsApp control | AED 128.04 | 81 | 6 | AED 21.34 | 0 |
| Clean V2 treatment | AED 79.13 | 143 | 4 | AED 19.78 | 0 |

### Last 7 Days Including Today - 2026-06-12 to 2026-06-19

| Campaign | Cost | Impr. | Clicks | Avg CPC | Conv. | CPA |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| May WhatsApp control | AED 1,286.82 | 1,702 | 67 | AED 19.21 | 15 | AED 85.79 |
| Clean V2 treatment | AED 163.90 | 308 | 8 | AED 20.49 | 0 | n/a |
| Old standalone V2 | AED 586.76 | 200 | 15 | AED 39.12 | 0 | n/a |

The control campaign has real conversion history. The clean V2 treatment is too early to judge but must be watched closely.

## Ad Group Findings

Last 7 days including 2026-06-19:

- `PPF Paint Protection` in May control:
  - AED 946.94, 55 clicks, 11 conversions, about AED 86 CPA.
  - This is the largest volume ad group and should be protected.
- `PPF Dubai Quote` in May control:
  - AED 206.03, 9 clicks, 4 conversions, about AED 51.51 CPA.
  - This has been one of the cleaner performers.
- `PPF Near Me Local` in May control:
  - AED 133.85, 3 clicks, 0 conversions, high average CPC.
  - Monitor closely. Do not expand this until it proves itself.
- Clean V2 treatment currently has spend mainly in `PPF Paint Protection`:
  - AED 157.67, 7 clicks, 0 conversions.

## Search Term Findings

Important terms recently seen:

- `car ppf dubai`
  - Expensive, but produced conversions in the May control.
  - Do not blindly remove all Dubai-modifier terms.
- `ppf wrap`
  - Produced a conversion on 2026-06-18.
- `car protection ppf`
  - Produced a conversion on 2026-06-15.
- `ppf coating`
  - Mixed. Produced conversions on one day, spent without conversions on another.
- `suntek ppf dubai`
  - Appeared in the old standalone V2 campaign.
  - Do not blindly negative brand terms because Sean reported an actual customer came from a SunTek-type search.
  - Treat competitor/film-brand terms as case-by-case, not automatic negatives.
- `dluxe car care xpel ppf certified dubai`
  - Old standalone V2 spent against this and did not convert.
  - This kind of competitor-specific search needs caution.
- `ppf shop near me`
  - Costly in `PPF Near Me Local`, no conversions in the recent pull.

## Conversion Actions

Pulled through API on 2026-06-19.

| ID | Name | Status | Category | Primary |
| --- | --- | --- | --- | --- |
| `7569208694` | `Submit lead form` | ENABLED | SUBMIT_LEAD_FORM | true |
| `7617388951` | `WhatsApp contact click` | ENABLED | CONTACT | true |
| `7649703525` | `WhatsApp before lead form (V2)` | ENABLED | CONTACT | false |
| `7576759600` | `Clicks to call` | ENABLED | CONTACT | true |
| `7569549326` | `Local actions - Directions` | ENABLED | GET_DIRECTIONS | true |
| `7575550723` | `Local actions - Other engagements` | ENABLED | ENGAGEMENT | true |

Code constants:

- V2 submit-lead conversion:
  - `src/pages/PpfFullPpfGuidedCalculatorV2.tsx`
  - `GOOGLE_ADS_SUBMIT_LEAD_SEND_TO`
  - `AW-17684563059/5R6tCPbqo5kcEPOI1PBB`
- V2 pre-form WhatsApp conversion:
  - `src/pages/PpfFullPpfGuidedCalculatorV2.tsx`
  - `GOOGLE_ADS_PRE_FORM_WHATSAPP_SEND_TO`
  - `AW-17684563059/q_bgCOXs1L8cEPOI1PBB`
- Original guided submit-lead conversion:
  - `src/pages/PpfFullPpfGuidedCalculator.tsx`
  - `GOOGLE_ADS_SUBMIT_LEAD_SEND_TO`
- Original guided WhatsApp conversion:
  - `src/pages/PpfFullPpfGuidedCalculator.tsx`
  - `GOOGLE_ADS_WHATSAPP_CONTACT_SEND_TO`

Important: V2 intentionally avoids pushing every WhatsApp click as a primary Google conversion. The business reason is to stop Google from optimizing only for unqualified WhatsApp taps.

## Funnel Difference - Original Guided vs V2

Original guided:

- More WhatsApp-first.
- Direct WhatsApp opens immediately.
- Lower friction.
- More likely to generate conversation volume.
- Less qualified because users can skip calculator logic.

V2 guided:

- Calculator-first.
- Direct WhatsApp before completion shows a soft choice popup.
- Form submit and discount unlock are the primary conversion path.
- After the user completes the setup, WhatsApp handoff is direct.
- More qualified, but potentially lower volume.

As of commit `1798ed9`, the V2 popup is intentionally softer:

- Title: `Want a more accurate WhatsApp quote?`
- Buttons:
  - `Build my price first`
  - `Message Sean now`

This was changed because the previous popup felt like too much of a stop for high-intent Google Search users.

## Relevant Funnel Code Files

Routing:

- `src/App.tsx`

Original guided funnel:

- `src/pages/PpfFullPpfGuidedCalculator.tsx`

V2 guided funnel:

- `src/pages/PpfFullPpfGuidedCalculatorV2.tsx`

Funnel analytics:

- `src/lib/funnel-analytics.ts`

Local/admin funnel dashboard:

- `src/pages/AdminFunnelDashboard.tsx`

SEO/prerender route list:

- `scripts/prerender.js`

Google Ads scripts:

- `scripts/google-ads/api.mjs`
- `scripts/google-ads/config.mjs`
- `scripts/google-ads/campaigns.mjs`
- `scripts/google-ads/review.mjs`
- `scripts/google-ads/inspect-campaign.mjs`
- `scripts/google-ads/conversions.mjs`
- `scripts/google-ads/conversion-review.mjs`
- `scripts/google-ads/setup-ppf-search-whatsapp-may-2026.mjs`
- `scripts/google-ads/setup-v2-test-campaign.mjs`
- `scripts/google-ads/set-qualified-whatsapp-secondary.mjs`

Keyword research master CSV:

- `docs/google-ads/keyword-planner-master-2026-06-18.csv`
  - May not exist in every checkout if untracked/local.
  - It was generated from Sean's Keyword Planner exports and deduped to 2,094 unique keywords.

## Local Secrets And Config Locations

Do not commit these values.

Google Ads env file:

- `.env.google-ads`

Required env vars:

- `GOOGLE_ADS_DEVELOPER_TOKEN`
- `GOOGLE_ADS_CUSTOMER_ID`
- `GOOGLE_ADS_LOGIN_CUSTOMER_ID`
- `GOOGLE_ADS_SERVICE_ACCOUNT_KEY_PATH`
- `GOOGLE_ADS_API_VERSION`

Google Ads service-account key:

- `Secrets/google-ads-service-account.json`

Note:

- `.env.google-ads` currently points at `./secrets/google-ads-service-account.json`.
- Windows is case-insensitive, so this works locally even though the folder is shown as `Secrets`.
- If running on a case-sensitive environment, match the folder casing or update the env path.

Supabase/funnel dashboard env file:

- `.env.supabase`

Supabase env vars:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Used for:

- `lead_events`
- `lead_contact_snapshots`
- `admin_session_rollups`
- local/admin funnel dashboard reads

## Safe Read-Only CLI Commands

Run from repo root:

```powershell
cd "C:\Users\seane\Desktop\GTA Web\grand-touch-craft"
```

Verify Google Ads API auth:

```powershell
npm run ads:doctor -- --env=.env.google-ads
```

List visible customers:

```powershell
npm run ads:list-customers -- --env=.env.google-ads
```

Campaign summary:

```powershell
npm run ads:campaigns -- --env=.env.google-ads --days=7
```

Inspect the May control campaign:

```powershell
npm run ads:inspect-campaign -- --env=.env.google-ads --campaign="PPF Search UAE - WhatsApp - May 2026"
```

Inspect the clean V2 treatment campaign:

```powershell
npm run ads:inspect-campaign -- --env=.env.google-ads --campaign="PPF Search UAE - WhatsApp - May 2026 Funnel V2 Clean 50-50"
```

Inspect the old standalone V2 campaign:

```powershell
npm run ads:inspect-campaign -- --env=.env.google-ads --campaign="PPF V2 Funnel Test - June 2026"
```

List conversion actions:

```powershell
npm run ads:conversions -- --env=.env.google-ads
```

Conversion review:

```powershell
npm run ads:conversion-review -- --env=.env.google-ads
```

General review/search-term pull:

```powershell
npm run ads:review -- --env=.env.google-ads --days=7
```

Build/check app:

```powershell
npm run build
```

Local dev server:

```powershell
npm run dev -- --host 127.0.0.1 --port 5174
```

Then test:

- `http://127.0.0.1:5174/ppf-full-ppf-calculator-guided`
- `http://127.0.0.1:5174/ppf-full-ppf-calculator-guided-v2`

## Mutating Scripts - Do Not Run Casually

These scripts can change the live Google Ads account:

- `scripts/google-ads/add-approved-ppf-negatives-may-2026.mjs`
- `scripts/google-ads/add-may-2026-cleanup-negatives.mjs`
- `scripts/google-ads/add-ppf-search-ab-negatives.mjs`
- `scripts/google-ads/apply-expansion.mjs`
- `scripts/google-ads/rebuild-structure.mjs`
- `scripts/google-ads/setup-ppf-search-whatsapp-may-2026.mjs`
- `scripts/google-ads/setup-v2-test-campaign.mjs`
- `scripts/google-ads/set-qualified-whatsapp-secondary.mjs`
- `scripts/google-ads/update-rsa-copy.mjs`
- `scripts/google-ads/add-assets.mjs`

Only run mutation scripts after confirming:

- exact account/customer ID,
- campaign name or ID,
- intended changes,
- whether `validateOnly` is available,
- and whether Sean explicitly asked for changes.

## Current Strategy Notes

### Do Not Add Keywords During The Experiment

Adding keywords now would mix two tests:

- funnel test: original guided vs V2 guided
- keyword test: old search demand vs new search demand

If keywords are added later, mirror them to both arms so the funnel remains the main variable.

### Do Not Blindly Negative Brand Terms

Sean reported an actual customer from a SunTek-type term. Brand/competitor/film-brand terms can be expensive, but they are not automatically junk. Review them by cost, query intent, and lead quality.

### Keep Near-Me Terms Under Watch

`PPF Near Me Local` has been weak recently. It can be high-intent in theory, but recent cost has not justified expansion.

### If Cash Pressure Is High

If lead volume matters more than experimental purity, the safest short-term move is to favor the May control funnel because it has conversion history.

The clean V2 test is useful, but it should not be allowed to silently consume spend if it produces no real conversations after a fair initial sample.

## Decision Rules

Suggested weekend rule:

- Leave clean V2 running through the weekend.
- Check actual spend, clicks, form submits, WhatsApp clicks, and real Sean conversations.
- If V2 has roughly AED 250-400 spend with no real signals, stop the experiment and route spend back to the working May funnel.
- If V2 produces meaningful form submits or better-quality conversations, continue the test.

Suggested daily checks:

- Old standalone V2 has AED 0 spend.
- Control vs treatment spend/click split is not wildly unfair.
- No obvious junk search terms.
- `PPF Paint Protection` and `PPF Dubai Quote` continue to drive useful traffic.
- Funnel dashboard shows V2 users progressing through calculator steps, not just bouncing.

## History

- May 2026:
  - Built the current working Google Search structure around the guided WhatsApp funnel.
  - Main campaign: `PPF Search UAE - WhatsApp - May 2026`.
  - Three ad groups: `PPF Paint Protection`, `PPF Dubai Quote`, `PPF Near Me Local`.
- June 2026:
  - A separate `PPF V2 Funnel Test - June 2026` campaign was created outside the May structure.
  - It used a smaller, more competitive keyword set and spent poorly.
  - It is now paused.
- 2026-06-18:
  - Clean 50/50 experiment started using the May campaign as control and a V2 treatment clone.
  - Experiment start was moved to 2026-06-18 so it could run immediately instead of waiting until 2026-06-19.
- 2026-06-19:
  - V2 WhatsApp pre-chat nudge was softened so it is not an aggressive blocker.
  - Meta-specific V2 route exists, but Meta is outside this Google-only handover.

## Known Non-Google Context

Meta exists separately and should not be mixed into Google conclusions:

- Route:
  - `/ppf-meta-full-car-ppf-v2`
- Funnel:
  - `ppf_meta_guided_calculator_v2`
- Meta page was changed to calculator-first on mobile.

Do not use Meta results to judge the Google Search experiment without separating traffic source and funnel name.

