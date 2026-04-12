# Google Ads Handoff And Operating Notes

Last updated: `2026-04-12` (Asia/Dubai)

This document is the practical handoff for the Google Ads setup in this repo.
It is meant to let a future Codex session recover the current state quickly without re-discovering:

- how the Google Ads API is wired
- which local scripts are safe to run
- which files power the live PPF landing page
- where Google Ads conversion tracking lives
- what live account changes have already been made
- what the main campaign problem currently is

This file intentionally does **not** store developer tokens, JSON keys, or other secrets.

## 1. Current goal

The active workflow is:

- run Google Ads reporting and inspection from the repo
- diagnose Search campaign performance from local scripts
- make controlled live edits from local scripts when needed
- keep the live page for Google Ads at `/ppf-dubai-quote`

The current paid landing-page strategy is:

- live page uses the newer `V1` content/layout improvements
- live page keeps the **older calculator quote reveal and modal**
- Google Ads / UTM tracking from the old live page is preserved

## 2. Live routes and page files

Routes in [src/App.tsx](C:/Users/seane/Desktop/GTA%20Web/grand-touch-craft/src/App.tsx):

- `/ppf-dubai-quote` -> live page
- `/ppf-dubai-quote-v1` -> test page

Relevant page files:

- Live page: [src/pages/PpfDubaiQuote.tsx](C:/Users/seane/Desktop/GTA%20Web/grand-touch-craft/src/pages/PpfDubaiQuote.tsx)
- Test page: [src/pages/PpfDubaiQuoteV1.tsx](C:/Users/seane/Desktop/GTA%20Web/grand-touch-craft/src/pages/PpfDubaiQuoteV1.tsx)
- Backup of pre-merge live page: [src/pages/PpfDubaiQuoteBackupPreV1Merge.tsx](C:/Users/seane/Desktop/GTA%20Web/grand-touch-craft/src/pages/PpfDubaiQuoteBackupPreV1Merge.tsx)

Current component state:

- Live page uses `PpfCostCalculatorWidget` and `PpfQuoteSummary`
- Test page still uses `PpfCostCalculatorWidgetV1` and `PpfQuoteSummaryV1`

This is intentional.
The `V1` page sections were stronger, but the older calculator price reveal and modal were better.

## 3. Google Ads tracking on the live page

The live Google Ads conversion action is wired in [src/pages/PpfDubaiQuote.tsx](C:/Users/seane/Desktop/GTA%20Web/grand-touch-craft/src/pages/PpfDubaiQuote.tsx).

Important markers:

- `GOOGLE_ADS_SUBMIT_LEAD_SEND_TO` is defined in the live page
- `trackGoogleAdsLeadConversion()` fires on successful lead submit
- `gclid` and `utm_*` are captured and passed through the lead payload

Important lines in the live page:

- send_to constant: line `60`
- `gclid` capture: line `713`
- conversion fire helper: line `804`
- standard lead payload includes `gclid`: line `952`
- calculator reveal / quote payload includes `gclid`: line `1007`
- actual conversion fire on submit: line `1028`

If the page is ever refactored again, these need to survive.

## 4. Google Ads API env setup

The local env file is:

- `.env.google-ads`

Template:

- [.env.google-ads.example](C:/Users/seane/Desktop/GTA%20Web/grand-touch-craft/.env.google-ads.example)

Required env vars:

- `GOOGLE_ADS_DEVELOPER_TOKEN`
- `GOOGLE_ADS_CUSTOMER_ID`
- `GOOGLE_ADS_LOGIN_CUSTOMER_ID`
- `GOOGLE_ADS_SERVICE_ACCOUNT_KEY_PATH`
- `GOOGLE_ADS_API_VERSION`

Notes:

- API version should be `v23`
- customer IDs should be stored without dashes
- `GOOGLE_ADS_LOGIN_CUSTOMER_ID` can be blank if the service account has direct access to the target customer
- the service-account JSON must stay outside git

## 5. Local Google Ads scripts

The scripts live in [scripts/google-ads](C:/Users/seane/Desktop/GTA%20Web/grand-touch-craft/scripts/google-ads).

### Read / inspect

- `npm run ads:doctor -- --env=.env.google-ads`
  - validate account access and auth
- `npm run ads:list-customers -- --env=.env.google-ads`
  - list customers visible to the current API identity
- `npm run ads:campaigns -- --env=.env.google-ads --days=7`
  - campaign summary
- `npm run ads:review -- --env=.env.google-ads --days=7`
  - summary + negative keyword suggestions + search-term review
- `npm run ads:conversions -- --env=.env.google-ads`
  - list conversion actions
- `npm run ads:conversion-review -- --env=.env.google-ads`
  - conversion-action detail review

### Live mutation scripts

- `npm run ads:apply-expansion -- --env=.env.google-ads`
  - adds a preset keyword expansion
  - adds baseline campaign negatives
  - **important:** this script still hardcodes the CPC ceiling to `AED 12`, so it is **not** a full record of the latest live bidding state

- `npm run ads:update-rsa-copy -- --env=.env.google-ads`
  - updates the live RSA headlines and descriptions
  - this script **does** currently match the latest live RSA set

## 6. Files that matter for the Ads tooling

Core Google Ads API wrapper:

- [scripts/google-ads/api.mjs](C:/Users/seane/Desktop/GTA%20Web/grand-touch-craft/scripts/google-ads/api.mjs)

Env and CLI arg parsing:

- [scripts/google-ads/config.mjs](C:/Users/seane/Desktop/GTA%20Web/grand-touch-craft/scripts/google-ads/config.mjs)

Campaign summary:

- [scripts/google-ads/campaigns.mjs](C:/Users/seane/Desktop/GTA%20Web/grand-touch-craft/scripts/google-ads/campaigns.mjs)

Review summary:

- [scripts/google-ads/review.mjs](C:/Users/seane/Desktop/GTA%20Web/grand-touch-craft/scripts/google-ads/review.mjs)

Keyword expansion / negatives:

- [scripts/google-ads/apply-expansion.mjs](C:/Users/seane/Desktop/GTA%20Web/grand-touch-craft/scripts/google-ads/apply-expansion.mjs)

RSA updates:

- [scripts/google-ads/update-rsa-copy.mjs](C:/Users/seane/Desktop/GTA%20Web/grand-touch-craft/scripts/google-ads/update-rsa-copy.mjs)

## 7. Conversion setup notes

Important conversion facts already verified through the API:

- the main conversion action is `Submit lead form`
- it exists and is enabled
- it is a website lead action
- it is the primary goal action
- the live page send_to was corrected earlier to:
  - `AW-17684563059/5R6tCPbqo5kcEPOI1PBB`

Important note:

- the Google Ads-side conversion counting setting was previously seen as `MANY_PER_CLICK`
- for lead generation, `ONE_PER_CLICK` is probably the better setting
- that change is a Google Ads UI/account-side change, not a repo change

## 8. Current live campaign diagnosis

Campaign:

- `Leads-Search-1`

As of `2026-04-12`, the main problem is **under-delivery because of rank**, not budget.

Pulled metrics:

- impressions: `61`
- clicks: `1`
- CTR: `1.64%`
- average CPC: `AED 5.94`
- search impression share: `14.1%`
- lost impression share (rank): `81.9%`
- lost impression share (budget): `4.0%`

Interpretation:

- budget is **not** the main bottleneck
- the campaign is missing auctions because ad rank is too weak
- some phrase traffic is still matching messy competitor/detailer searches

## 9. Keyword and search-term findings

The keyword view showed that most delivery was coming from only a few phrase-match terms:

- `paint protection film dubai` (phrase)
- `ppf dubai` (phrase)
- `car paint protection dubai` (phrase)

Most of the rest of the keyword set had zero impressions.

Search-term review showed competitor/detailer noise such as:

- `dluxe car care xpel ppf certified dubai`
- `autozcrave dubai the art of car protection`
- `rma ppf`
- `smart repair ppf dubai`
- `nano auto care ppf dubai`
- `supakoto japanese paint protection films dubai`

## 10. Live account changes already applied

The following live changes have already been made.

### Keywords and negatives

Baseline expansion:

- broader generic exact/phrase keywords were added earlier
- baseline negatives like `xpel`, `window tint`, `ceramic coating`, `wrap`, `detailing`, etc. were added earlier

Additional negatives added on `2026-04-12`:

- `autozcrave`
- `rma ppf`
- `smart repair`
- `3b st`
- `7 detail inn`
- `apex detail studio`
- `nano auto care`
- `supakoto`

### Bidding

The live Maximize Clicks CPC ceiling was manually increased to:

- `AED 18`

Important:

- this manual increase was applied live outside `ads:apply-expansion`
- the `ads:apply-expansion` script still contains `AED 12`
- if you run that script again without updating it, it may overwrite the live cap back down

### RSA copy

The live RSA was updated to remove repetitive stacked-intent headlines and replace them with a more balanced set.

Current enabled headline direction includes:

- intent
- trust
- process
- human accountability
- warranty / handover proof

Examples from the current live set:

- `PPF Dubai You Can Trust`
- `Paint Protection Film Dubai`
- `Get A Real PPF Quote`
- `Proper Install. Clear Process.`
- `Direct With Sean`
- `Sean-Led Quote & Handover`
- `See Finish Before Sign-Off`
- `Real Buyer Handover`

The update script for this is:

- [scripts/google-ads/update-rsa-copy.mjs](C:/Users/seane/Desktop/GTA%20Web/grand-touch-craft/scripts/google-ads/update-rsa-copy.mjs)

## 11. Landing-page state

The live page at `/ppf-dubai-quote` currently uses:

- newer `V1` content/layout for the hero and page sections
- old calculator quote reveal and old modal flow
- preserved Google Ads / UTM tracking from the old live page

This hybrid is intentional and should not be “cleaned up” casually.

Summary:

- page sections: use the newer `V1` improvements
- calculator / price reveal / modal: use the older live components

## 12. Safe workflow for a future session

If starting fresh in another session, do this:

1. Read this file first.
2. Read [docs/google-ads-workflow.md](C:/Users/seane/Desktop/GTA%20Web/grand-touch-craft/docs/google-ads-workflow.md) for the basic setup flow.
3. Confirm the live route still points to [src/pages/PpfDubaiQuote.tsx](C:/Users/seane/Desktop/GTA%20Web/grand-touch-craft/src/pages/PpfDubaiQuote.tsx).
4. Confirm tracking markers still exist in the live page.
5. Run:

```powershell
npm run ads:campaigns -- --env=.env.google-ads --days=7
npm run ads:review -- --env=.env.google-ads --days=7
```

6. If delivery is still poor, check:
   - impression share
   - rank loss
   - keyword-level impressions
   - search-term noise
7. Before running `ads:apply-expansion`, decide whether the script should be updated first so it does not reset the CPC cap to `AED 12`.

## 13. Recommended next investigative step

If the campaign is still under-serving after the latest CPC and RSA updates, the next likely improvement is:

- split the campaign into tighter ad groups instead of keeping everything inside one mixed ad group

That would likely help:

- intent clarity
- ad relevance
- headline fit
- search-term control

## 14. Non-secret reminders

- do not commit developer tokens
- do not commit service-account JSON
- do not paste private keys into chat
- keep account IDs and tokens in the local env, not markdown docs, unless there is a deliberate reason to document them
