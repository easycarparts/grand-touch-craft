# Codex Notes

## Current branch
- Branch: `codex-ppf-google-funnel-v1`
- Latest pushed commit: `9a6a411` (`Add Grand Touch PPF quote funnel`)

## Goal
- Build a first Google Ads landing funnel for Grand Touch PPF in Dubai.
- Use a dedicated route for PPC traffic: `/ppf-dubai-quote`
- Keep Grand Touch as the only customer-facing brand.
- Lead with STEK as the main commercial offer.
- Keep GYEON visible as a supporting trust signal, not a primary decision at the top of the funnel.

## Strategy decisions already made
- This is a paid-search funnel, so navigation is intentionally removed from the funnel page.
- The page should feel premium and trust-led, not bargain-led.
- Trust matters heavily in this market because of fake material / fake warranty concerns.
- Sean should be positioned as the expert contact, but the page should still sell proof and process first.
- We kept the visual calculator because the user strongly prefers it and believes it helps buyers understand what they are choosing.
- The top form should capture lead details before the calculator is usable.
- Submitting the top form should immediately send the lead details by email so partial drop-off still leaves a lead in the system.

## Current implementation
- New route added:
  - `/ppf-dubai-quote`
- Main funnel page:
  - `src/pages/PpfDubaiQuote.tsx`
- Calculator component used by funnel:
  - `src/components/PpfCostCalculatorWidget.tsx`
- Supporting route / pricing files:
  - `src/App.tsx`
  - `src/data/ppf-calculator-pricing.ts`
  - `src/pages/PpfCostCalculator.tsx`
  - `scripts/prerender.js`
  - `public/sitemap.xml`

## What the current funnel does
- Uses a compact single-page funnel layout.
- No nav or footer on the funnel page.
- Uses Grand Touch branding and logo.
- Hero includes:
  - Grand Touch logo
  - Google-style 4.9-star trust badge
  - STEK and GYEON trust pills
  - warranty-registered film pill
- Top capture form asks for:
  - name
  - mobile number
  - vehicle make/model
  - ownership stage
- Ownership stage options:
  - `I have the car now`
  - `Delivery soon`
  - `Just researching`
- Form submit:
  - validates phone
  - sends lead email through existing EmailJS config
  - unlocks the calculator and lower funnel
  - tracks funnel events
- Calculator behavior:
  - visually rich, image-led
  - STEK-only on this funnel
  - keeps warranty options
  - keeps size images / finish preview
  - lower funnel is softened/locked until top form is submitted
- WhatsApp CTA:
  - builds a detailed prefilled message with lead details and current calculator selections

## Tracking currently included
- `page_view_funnel`
- `ppf_quote_form_start`
- `ppf_quote_form_submit`
- `ppf_estimate_shown`
- `ppf_whatsapp_click`

## Email capture details
- Funnel form uses existing EmailJS credentials already present in project code.
- Current service/template/public key used in funnel page:
  - `service_f2na96a`
  - `template_bs1inle`
  - `PBrHmtX3m6KZRrwiC`

## Current user feedback to preserve
- The user liked the condensed single-page funnel layout.
- The user did not want nav on the funnel because people may leave.
- The user wants the page styled like Grand Touch, not a generic separate theme.
- The user wants the calculator visuals and warranty options kept.
- The user wants less text and harder-hitting copy.
- The user wants placeholders for:
  - customer testimonials
  - Google review snippets/count
  - transformation videos
- The user wants STEK and GYEON logos eventually added if assets are available.

## Known limitations / next improvements
- Current `Google` badge is a styled text wordmark, not an official Google asset.
- Current `STEK` and `GYEON` trust pills are text badges, not official logos, because no logo files were found in the repo.
- Review/testimonial/video sections are placeholders and should be replaced with real content.
- Copy can still be tightened further after visual review.
- If the user provides screenshots, next Codex session should refine spacing, hierarchy, and emphasis rather than changing the overall funnel structure.

## Build status
- `npm run build` passes.
- Prerender includes:
  - `dist/ppf-dubai-quote/index.html`

## Important repo context
- There are unrelated local changes in this repo that were intentionally not bundled into the funnel commit.
- Only the funnel-related committed work was pushed on this branch.

## Suggested next steps
- Review `/ppf-dubai-quote` visually on desktop and mobile.
- Replace placeholders with:
  - real Google review count/snippets
  - testimonial copy
  - transformation video embeds
  - official STEK/GYEON logo assets if available
- Tighten hero and trust copy based on screenshots and user taste.
- Then build funnel variant 2 later if needed.
