# G700 Customizer Dev Update Spec

## Objective

Turn `/g700-customizer` into a proper high-intent, mobile-first landing page and lead capture asset for paid traffic, organic traffic, and owner-specific model campaigns.

This page should stop behaving like a polished WhatsApp handoff and start behaving like a measurable sales funnel with strong mobile UX, CRM capture, event tracking, pricing guidance, and cleaner attribution.

Primary use cases:

- model-specific Meta ads
- model-specific TikTok ads
- Google Search for exact-intent queries
- organic social / link-in-bio traffic
- retargeting for users who engaged with G700 content

This page is not intended to replace the broader PPF lead funnel. It is intended to sit beside it as a higher-intent niche page for G700 owners or buyers.

---

## Current Problems

### 1. Lead capture is weak

The current page mostly routes users into WhatsApp with a prefilled message. That is useful for conversations, but it is weak for:

- CRM capture
- attribution
- retargeting
- platform optimization
- understanding buyer intent by build selection

### 2. Mobile UX is not strong enough yet

Most traffic will be mobile. The page currently looks visually strong, but it still needs to be optimized for:

- thumb-driven interaction
- scroll pacing
- button visibility
- section compression
- form completion
- fast loading on mobile networks

### 3. Metadata / SEO rendering is effectively generic in live HTML

The live fetched HTML still shows generic site-wide title, description, and canonical tags rather than G700-specific metadata. This weakens:

- exact-match search intent
- page relevance
- link previews
- ad to landing-page consistency

### 4. No clear pricing guidance

The page currently asks for a quote without helping buyers self-qualify on price direction. This likely increases:

- vague enquiries
- low-intent WhatsApp messages
- price-shock conversations later

### 5. No structured build data is being captured end-to-end

The selected color, finish, trim package, and accessories should be treated as sales data, not just UI state.

---

## Core Product Decision

This page should become:

- a mobile-first build configurator
- a CRM-tracked lead asset
- a pricing-orientation page
- a quote engine
- an optional deposit funnel later

This page should not become a full ecommerce storefront in phase 1.

Phase 1 goal:

- improve lead quality
- improve measurement
- improve mobile completion
- improve model-specific ad relevance

Phase 2 goal:

- test deposit / checkout flow for standardized products or booking slots

---

## Primary Conversion Flow

### Main desired flow

1. User lands on `/g700-customizer`
2. User understands what the page is for within 3 to 5 seconds
3. User starts configurator immediately
4. User selects:
   - color
   - gloss or matte
   - standard / blackout / paint-matched trim
   - optional accessories
5. User sees pricing direction or starting-price guidance
6. User submits details
7. Build summary + lead details are saved into backend and CRM
8. User can then:
   - open WhatsApp with full build attached
   - request quote
   - optionally reserve slot / deposit in a later phase

### Secondary flow

Some users will not configure fully. We still want to capture:

- quick quote enquiries
- accessory interest
- partial selections
- source data

---

## Mobile-First UX Requirements

This page must be designed for mobile first, not responsive as an afterthought.

Assume:

- 99% of traffic is mobile
- much of the paid traffic is thumb-scrolling
- some traffic will come from in-app browsers
- users may not tolerate long, dense sections

### Mobile principles

- compress vertical space aggressively
- reduce text density
- prioritize one action per view
- keep interactive controls visible without requiring explanation-heavy reading
- avoid giant decorative blocks before first action
- reduce “pretty but passive” space
- make the page feel like a guided build process, not a brochure

### Mobile-specific implementation requirements

#### Hero / first screen

The top mobile viewport must communicate:

- what this is
- who it is for
- why it is useful
- what to do next

Required above or near first fold:

- clear H1
- 1 short supporting line
- primary CTA: `Start My G700 Build`
- secondary CTA: `Get pricing on WhatsApp` or similar
- 2 to 3 trust/value chips only

Do not overload the hero with too many badges or paragraphs.

#### Configurator controls

The configurator should feel touch-first:

- larger touch targets
- reduced control clutter
- fast state changes
- no tiny labels
- no need to scroll back up to understand current selection

Recommended mobile behavior:

- sticky build summary chip or compact bar once user starts
- horizontal pill controls where appropriate
- collapse non-essential explanatory text behind `More info`

#### CTA strategy on mobile

There should be repeated, context-aware CTAs without feeling spammy.

Required CTA placements:

- hero
- after configuration summary / pricing block
- after accessories selection
- final CTA near bottom

CTA language should be concise and direct:

- `Get My G700 Quote`
- `Price This Build`
- `Send This Build to Sean`
- `Ask About Accessories`

Avoid generic:

- `Submit`
- `Learn more`
- `Contact us`

#### Form modal / capture flow

The modal must be optimized for mobile completion:

- minimal fields visible at once
- strong spacing
- easy keyboard progression
- correct input types
- sticky action button on smaller screens if needed
- no ambiguous field labels

Recommended field order:

1. name
2. phone / WhatsApp
3. vehicle details
4. notes

If possible:

- split long forms into short steps on mobile
- auto-include selected build details in payload
- do not ask the user to repeat what the page already knows

#### Accessories section

The accessory catalogue is valuable, but on mobile it can become too long and visually heavy.

Required:

- compress grid for mobile
- support category filtering if accessory count grows
- show selection state clearly
- keep accessory CTA visible after selections are made
- avoid making users scroll through dozens of equal-weight tiles without structure

If there are many accessories, use:

- top tabs or chips
- exterior / functional / interior / styling groupings

#### Performance

Mobile performance is a conversion feature.

Required:

- strong image compression
- lazy loading below fold
- optimized video handling
- no heavy autoplay video before user intent unless intentionally tested
- preload only critical assets
- avoid layout shift in configurator image area

---

## Page Content / Messaging Updates

### Recommended message hierarchy

#### Hero

Goal: orient a G700 owner in seconds.

Suggested structure:

- Eyebrow: `G700 PPF + customization`
- H1: `Build your G700 finish before you book`
- Supporting line:
  `Compare gloss or matte PPF, blackout or paint-matched trim, and get pricing on the exact direction you want.`

#### Value points

Keep to 3 short mobile-friendly points:

- `Gloss or matte PPF`
- `Blackout or paint-matched trim`
- `Accessories priced around your build`

#### Quote framing

Make it clear:

- this is not a vague enquiry form
- the build summary goes through with the lead
- buyers get a more accurate recommendation because they already chose a direction

### Reduce informational bloat

Keep the page useful, but compress all non-essential copy on mobile.

Anything not helping the user:

- understand the build
- choose options
- see pricing direction
- submit a quote

should be collapsed, shortened, or moved lower.

---

## Pricing Strategy

### Recommendation

Add pricing guidance, not full bespoke final pricing in phase 1.

This page should not hide pricing completely.

It should also not pretend a fully bespoke customization job has one exact universal final price.

### Display format

Use:

- `from` pricing
- `starting at`
- `popular builds from`
- accessory `from` pricing

Examples:

- `Gloss PPF builds from X AED`
- `Matte PPF builds from X AED`
- `Blackout trim package from X AED`
- `Paint-matched trim from X AED`
- `Selected accessories priced separately`

### Pricing UX rules

- show pricing after user has engaged with the build
- tie pricing to their current selected direction
- explain what changes price
- keep final quote language honest

Suggested note:

`Guide pricing only. Final quote depends on selected finish, trim scope, and accessories.`

### Why pricing should be added

Expected benefits:

- better self-qualification
- fewer vague price-check messages
- stronger buyer confidence
- better model-specific lead quality

Possible trade-off:

- slightly lower raw lead volume

This is acceptable if lead quality improves.

---

## CRM / Backend Requirements

This page must be connected to backend and CRM before ad spend is meaningfully scaled.

### Required lead fields

Store all of the following:

- source page URL
- source platform
- campaign id / ad id / ad name if available
- UTM parameters
- click IDs where available
- lead timestamp
- name
- phone
- vehicle details
- notes
- selected color
- selected finish
- selected trim package
- selected accessories array
- build summary string
- whether user saw pricing
- whether user clicked WhatsApp
- whether user submitted quote modal

### CRM behavior

When a lead is created:

- create CRM lead immediately
- attach source as `g700_customizer`
- attach page as `/g700-customizer`
- attach full build summary
- attach selected accessories
- attach UTM/source data

### Telegram / internal alert behavior

Send structured alert with:

- source
- name
- phone
- vehicle
- build summary
- accessory selections
- notes
- campaign / ad attribution if available

### Partial capture

If possible in phase 1.5:

- save partial build state after meaningful engagement
- recover draft if user returns
- optionally capture partial lead after user enters phone but exits before complete send

This is optional for phase 1, but valuable.

---

## Event Tracking Requirements

The page should be fully measurable across:

- Meta Pixel / CAPI if applicable
- TikTok Pixel / Events API if applicable
- GA4
- internal session tracking

### Required tracked events

- `page_view_g700_customizer`
- `g700_build_started`
- `g700_color_selected`
- `g700_finish_selected`
- `g700_trim_selected`
- `g700_accessory_selected`
- `g700_pricing_viewed`
- `g700_quote_modal_opened`
- `g700_quote_submitted`
- `g700_whatsapp_clicked`
- `g700_accessories_cta_clicked`

### Event payloads

Include where possible:

- selected color
- selected finish
- selected trim package
- accessory count
- accessory titles
- source platform
- page path
- UTM source / campaign / ad identifiers

### Platform optimization note

Do not optimize directly to every micro-event in ads platforms immediately.

Use them first for:

- reporting
- attribution
- audience creation
- quality segmentation

Then decide later whether a deeper event should be used for optimization.

---

## SEO / Metadata Fixes

The live fetched HTML currently appears to ship generic site-level metadata.

This needs fixing if the page will be used for:

- Google Search traffic
- link sharing
- social previews
- search indexing

### Required fixes

- page-specific title in server-rendered or statically output HTML if possible
- page-specific description
- page-specific canonical
- G700-specific OG image
- G700-specific OG title and description
- page-specific Twitter metadata

### Suggested metadata

Title:

`G700 PPF & Customization Dubai | Grand Touch Auto`

Description:

`Compare gloss or matte PPF, blackout or paint-matched trim, accessories, and pricing direction for your G700 before you request a quote in Dubai.`

Canonical:

`https://www.grandtouchauto.ae/g700-customizer`

---

## Ad Fit Strategy

### Best traffic sources for this page

- Google Search for exact model queries
- TikTok / Meta ads with explicit G700 owner hooks
- retargeting from G700 content viewers
- WhatsApp / link-in-bio / direct sharing

### Bad traffic sources for this page

- broad generic luxury SUV interest traffic
- generic PPF ads to cold users
- creatives that attract car fans more than G700 owners

### Creative direction

Ads sent here should be owner-specific, not curiosity-specific.

Examples:

- `Own a G700 in Dubai? Build the finish before you book.`
- `Compare gloss vs matte PPF on the G700 and price the right direction.`
- `Blackout, paint-matched trim, accessories, and PPF. Build your G700 properly.`

Avoid:

- generic luxury car flex
- pure aesthetic reels with no customization angle

---

## Conversion Path Recommendations

### Phase 1 conversion priority

Primary:

- quote request captured into CRM

Secondary:

- WhatsApp click with full structured build summary

### Phase 2 conversion priority

Optional later:

- consultation deposit
- booking deposit
- accessory-only deposit
- fixed-price item checkout

### Do not do in phase 1

- full bespoke package checkout with fake precision
- heavy ecommerce complexity before lead + attribution systems are solved

---

## Technical Implementation Requirements

### Frontend

- keep mobile-first layout as primary
- compress vertical spacing on mobile
- reduce oversized section blocks
- ensure configurator feels responsive
- ensure selected state is obvious
- prevent layout shift when swapping build images
- open WhatsApp in a new tab only

### Form handling

- validate name and phone
- preserve selected build automatically
- submit build payload to backend before or alongside WhatsApp handoff
- show success state clearly

### Persistence

Consider storing in local state + localStorage:

- selected color
- selected finish
- selected trim package
- selected accessories
- partially entered form fields

This helps return users and reduces drop-off.

---

## Mobile QA Checklist

Developer must test on real mobile devices or realistic emulation for:

- iPhone size viewport
- Android Chrome
- TikTok in-app browser style behavior
- Meta in-app browser style behavior

### Required mobile QA items

- hero CTA visible without awkward dead space
- no oversized text blocks dominating small screens
- no tiny or hard-to-hit controls
- configurator usable one-handed
- image area stable and fast
- modal fields not hidden behind keyboard
- accessory section does not feel endless or chaotic
- sticky CTA behavior does not cover critical UI
- all buttons visually distinct and thumb-friendly
- quote flow works start to finish on mobile

---

## Success Criteria

This update is successful if the page:

- captures all quote submissions into CRM
- preserves full build selection data
- records analytics events reliably
- presents clear pricing direction
- feels faster and more usable on mobile
- produces higher-quality G700 enquiries than a generic page
- supports owner-specific ad traffic cleanly

---

## Phase Plan

### Phase 1: Tracking + mobile UX + quote capture

Deliver:

- backend submission
- CRM integration
- Telegram/internal alert payload
- event tracking
- mobile compression and usability pass
- pricing guidance block
- metadata fix

### Phase 2: Optimization

Deliver:

- partial capture / draft restore
- better accessory grouping
- deeper attribution
- A/B test CTA wording
- optional sticky mobile summary bar

### Phase 3: Monetization

Deliver:

- optional deposit flow
- accessory-only checkout or booking slot deposit

---

## Nice-to-Haves

- save/share build link
- load popular presets faster
- “most popular G700 builds” cards with one-tap apply
- before/after or recent completed G700 work gallery with quote CTA nearby
- compare gloss vs matte with drag slider

---

## Developer Notes

- Do not overbuild ecommerce logic first.
- Mobile UX is the priority over decorative desktop polish.
- The page should act like a sales tool, not just a showcase.
- Every selection should become usable sales data.
- Any WhatsApp handoff should happen after backend capture where possible.

