# TikTok Guided Result Page Plan

This is the build plan for the next session.

The goal is to stop sending users from the guided TikTok quote flow into the old `/ppf-tiktok-quote_2` page and instead create a dedicated guided continuation page that keeps their captured information, keeps the experience focused, and lets TikTok learn from better-quality actions.

## Problem

Current guided flow:

```text
/ppf-tiktok-quote-guided
  -> user completes finish / vehicle / contact
  -> stage 4 result screen
  -> buttons send user to /ppf-tiktok-quote_2 or /ppf-tiktok-quote_2#quote-calculator
```

This is causing issues:

- guided answers do not carry across cleanly
- calculator is not preselected from the guided answers
- contact details may need to be entered again
- clicking "Get Quote" on the old page opens the old modal, not the guided flow
- users can feel like they are starting again
- analytics becomes mixed between guided and normal funnel
- TikTok attribution may still work, but the user experience is not coherent

## Desired Outcome

Build a separate guided continuation page:

```text
/ppf-tiktok-quote-guided/details
```

Alternative acceptable route:

```text
/ppf-tiktok-guide/page
```

Recommended route:

```text
/ppf-tiktok-quote-guided/details
```

Reason:

- keeps the route semantically attached to the guided funnel
- avoids TikTok cache confusion with the old `_2` page
- easy to cache-bust later:

```text
/ppf-tiktok-quote-guided/details?v=20260427
```

## Core Principle

Do not make the user restart.

If the user has already given:

- name
- phone
- vehicle
- finish preference

Then every next screen must feel like:

```text
We remembered this. Here is the next useful thing.
```

Not:

```text
Please fill in the same form again.
```

## Proposed User Journey

### Step 1: Guided Capture

Route:

```text
/ppf-tiktok-quote-guided
```

User gives:

- finish preference: gloss, matte, colour, not sure
- vehicle make/model/year
- name/phone

On successful submit:

- write CRM snapshot
- fire `lead_form_submitted`
- fire TikTok `SubmitForm`
- store a local guided draft
- move to result screen

### Step 2: Result Screen

Still on:

```text
/ppf-tiktok-quote-guided
```

Show:

- "Sean has it"
- summarized vehicle
- summarized finish preference
- one primary button
- one secondary WhatsApp button

Primary CTA:

```text
See PPF options for my car
```

Secondary CTA:

```text
Message Sean on WhatsApp
```

Primary CTA should go to:

```text
/ppf-tiktok-quote-guided/details
```

with all original query params preserved.

### Step 3: Guided Details Page

Route:

```text
/ppf-tiktok-quote-guided/details
```

This page should:

- read the guided draft
- show a compact summary card
- preselect calculator choices where possible
- explain the key trust points in short mobile sections
- allow the user to unlock/compare price without re-entering details
- allow WhatsApp with prefilled message containing the already captured details

## Guided Draft Storage

Create a shared storage helper.

Suggested file:

```text
src/lib/tiktok-guided-draft.ts
```

Suggested storage key:

```text
grand-touch-ppf-guided-draft-v1
```

Storage should use localStorage with sessionStorage fallback.

Do not store anything highly sensitive beyond what the user already submitted to the CRM:

- name
- phone
- country code
- local phone
- vehicle make
- vehicle model
- vehicle year
- finish preference
- flow variant
- submitted timestamp
- session id if useful
- source attribution

Suggested type:

```ts
export type TikTokGuidedDraft = {
  version: 1;
  savedAt: string;
  flowVariant: "intent_first" | "phone_first";
  fullName: string;
  phone: string;
  countryCode: string;
  localPhone: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: string;
  vehicleLabel: string;
  finishPreference: "Gloss clear PPF" | "Matte clear PPF" | "Colour PPF" | "Not sure yet";
  attribution: Record<string, string>;
};
```

Helper functions:

```ts
saveTikTokGuidedDraft(draft)
readTikTokGuidedDraft()
clearTikTokGuidedDraft()
hasUsableTikTokGuidedDraft()
```

## URL / Attribution Rules

When moving between guided pages:

- preserve `utm_source`
- preserve `utm_medium`
- preserve `utm_campaign`
- preserve `utm_content`
- preserve `utm_term`
- preserve `utm_id`
- preserve `ttclid`
- preserve any cache-bust param like `v`

Do not put phone/name in the URL.

If adding a draft id later, use a non-PII generated id.

## Details Page UX Plan

This is mobile-first. 99% of traffic is expected to be mobile.

### Above The Fold

Keep it short.

Recommended structure:

```text
Grand Touch logo
Small trust pills
Your PPF setup
[Vehicle] [Finish]
Sean has your details. Compare options while he checks the quote.
[See my estimate]
[Message Sean]
```

Rules:

- no massive phone mockup
- no long hero paragraph
- no duplicate form
- no big wall of trust copy
- no repeated "Get quote" CTA that opens the old modal

### Summary Card

Show:

```text
Vehicle: 2024 Nissan Patrol
Finish: Gloss clear PPF
Contact: Sean / +971...
```

Allow edit links:

- edit vehicle
- edit finish
- edit contact

Editing should open a compact inline panel or return to guided flow with state restored.

### Calculator Section

This should be simplified versus the full `/ppf-tiktok-quote_2` calculator.

Preselect:

- package: 10-year ForceShield by default
- finish: from guided finish preference
- car size: infer from make/model where possible, otherwise ask one simple question
- coverage: Full Body by default or visually prominent

Important note from user:

Most buyers ask for full body. Do not overcomplicate package selection early.

If finish preference is:

- `Gloss clear PPF`: preselect gloss
- `Matte clear PPF`: preselect matte
- `Colour PPF`: route toward colour PPF enquiry, not standard clear PPF pricing
- `Not sure yet`: default gloss and explain Sean can adjust

### Trust Sections

Keep each section small.

Suggested order:

1. Real install proof
2. Why prep matters
3. STEK warranty registration
4. Recent handover

Each should have:

- one short heading
- one visual or proof point
- max 1-2 lines of copy
- CTA after every 1-2 sections

### WhatsApp

WhatsApp should not be blocked entirely.

Rules:

- If draft exists, WhatsApp opens with full details in the message.
- If draft does not exist, show a small capture modal but include a skip option.
- Open WhatsApp in a new tab/window, not the current page.

Suggested message:

```text
Hi Sean, I came from the TikTok PPF quote.

Name: Sean
Car: 2024 Nissan Patrol
Finish: Gloss clear PPF
Phone: +971...

Can you advise the best setup and price?
```

## Tracking Plan

Use the same `funnel-analytics.ts` system.

New funnel names:

```text
ppf_tiktok_guided_quote
ppf_tiktok_guided_details
```

Or keep one funnel name and use page variants:

```text
funnelName: ppf_tiktok_guided_quote
landingPageVariant: tiktok_guided_capture
landingPageVariant: tiktok_guided_details
```

Recommended:

Use same funnel name with different variants so CRM/reporting groups the journey.

### Events To Track

On guided capture:

- `lp_view`
- `guided_finish_completed`
- `guided_vehicle_completed`
- `guided_contact_completed`
- `lead_form_submitted`

On guided details:

- `guided_details_view`
- `guided_details_draft_loaded`
- `guided_details_draft_missing`
- `guided_summary_edit_click`
- `guided_calculator_started`
- `guided_calculator_price_revealed`
- `guided_details_whatsapp_click`
- `guided_details_full_page_click` only if we still offer old full page as an escape hatch

### TikTok Pixel

Keep:

- `PageView` on page load
- `SubmitForm` on real lead submit
- optional `Contact` on WhatsApp click
- optional `ClickButton` for calculator/details CTAs

Do not fire duplicate `SubmitForm` when the user only opens the details page after already submitting.

If they reveal price on details page, consider a secondary custom event:

```text
ViewContent
```

or:

```text
ClickButton
```

Do not change the optimization event in Ads Manager without a deliberate test.

## CRM Behaviour

The guided capture page must create/update a CRM lead.

The guided details page must not create duplicate leads.

It can enrich the same lead if user edits:

- vehicle
- finish
- quote estimate
- WhatsApp clicked

Lead identity rules:

- phone is the main identity
- no phone = partial lead only
- never overwrite a different phone because of `visitor_id`

## Implementation Steps

### 1. Add Shared Guided Draft Helper

Create:

```text
src/lib/tiktok-guided-draft.ts
```

Responsibilities:

- save draft after each completed step
- read draft on result/details page
- normalize version
- handle storage errors

### 2. Update Guided Capture Page

File:

```text
src/pages/PpfTikTokGuidedQuote.tsx
```

Changes:

- save draft after finish step
- save draft after vehicle step
- save draft after contact step
- save final draft after submit
- result primary button should navigate to `/ppf-tiktok-quote-guided/details`
- preserve query params
- do not navigate to `/ppf-tiktok-quote_2` for calculator by default

### 3. Add New Details Page

Create:

```text
src/pages/PpfTikTokGuidedDetails.tsx
```

Responsibilities:

- read draft
- display summary
- provide compact calculator/options
- provide WhatsApp CTA
- provide edit affordances
- track page/detail events
- keep mobile extremely tight

### 4. Add Route

File:

```text
src/App.tsx
```

Add:

```tsx
<Route path="/ppf-tiktok-quote-guided/details" element={<PpfTikTokGuidedDetails />} />
```

### 5. Prerender Route

File:

```text
scripts/prerender.js
```

Add:

```text
/ppf-tiktok-quote-guided/details
```

### 6. Test

Run:

```powershell
npm.cmd run build
```

Manual test:

1. Open `/ppf-tiktok-quote-guided?utm_source=tiktok&utm_medium=paid_social&utm_campaign=test`.
2. Complete guided flow.
3. Confirm CRM lead exists.
4. Click "See PPF options for my car".
5. Confirm new details page opens.
6. Confirm vehicle/finish/name/phone are remembered.
7. Click WhatsApp.
8. Confirm WhatsApp opens in a new tab with details.
9. Confirm no duplicate CRM row.
10. Confirm TikTok `SubmitForm` only fired once.

## What Not To Do

- Do not send guided result users into `/ppf-tiktok-quote_2#quote-calculator` as the main path.
- Do not ask for name/phone again if we already have it.
- Do not create a second disconnected quote modal.
- Do not fire another `SubmitForm` just because they entered the details page.
- Do not put phone/name in URL params.
- Do not make mobile sections huge.
- Do not bury the calculator under long trust copy.
- Do not remove WhatsApp escape entirely.

## Open Questions For User

These can be decided in the next session:

1. Exact route name:

Recommended:

```text
/ppf-tiktok-quote-guided/details
```

2. Default calculator assumption:

Recommended:

```text
10-year ForceShield, Full Body, Gloss unless user selected Matte/Colour.
```

3. Whether colour PPF should show a price range or force enquiry:

Recommended:

```text
Colour PPF should say "Sean will price this manually" and push WhatsApp/CRM, because colour choices change pricing too much.
```

4. Whether details page should have video:

Recommended:

Use one lightweight install clip lower down, not above the fold.

## Design Direction

The details page should feel like:

```text
You already started. Here is the useful next step.
```

Not:

```text
Here is another landing page.
```

Tone:

- short
- direct
- premium
- low reading load
- good for non-native English speakers
- mobile-first

Suggested hero copy:

```text
Your PPF setup

Sean has your details. Compare the main options while he checks the quote.
```

Primary CTA:

```text
See my estimate
```

Secondary:

```text
Message Sean
```

Summary label:

```text
Saved from your quick quote
```

If draft missing:

```text
Let's rebuild your setup
```

Then show a compact mini guided form instead of dumping them into the old page.
