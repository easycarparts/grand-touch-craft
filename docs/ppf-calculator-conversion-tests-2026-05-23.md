# Full PPF Calculator Conversion Tests - 2026-05-23

## Current Concern

Google users are clicking, consuming parts of the page, and some are seeing or building a price, but WhatsApp and form follow-through is still soft. The immediate risk is not that price transparency is wrong. The risk is that the calculator gives enough information to compare, but not enough momentum or reassurance to message Sean.

## What Changed Now

- Paused the generic exact `ppf` keyword in the calculator campaign because it spent too much for weak intent.
- Added tighter calculator keywords from the May 2026 keyword-volume CSV:
  - `best ppf in dubai` exact
  - `best ppf dubai` phrase
  - `ppf dubai price` phrase
  - `full body ppf dubai` phrase
  - `full body ppf price dubai` phrase
  - `full car ppf dubai` phrase
  - `full ppf price dubai` phrase
  - `ppf installation dubai` phrase
  - `xpel ppf dubai` phrase
  - `stek ppf dubai` phrase
- Added `watch` as a campaign negative after `watch ppf dubai` appeared.
- Updated the calculator result block to show the value stack beside the price.
- Changed the selected-price CTA from a harder “Send Price on WhatsApp” action to the softer “Check This Price With Sean.”

## Value Stack To Keep Near Price

These items should sit close to the calculator result because they justify the AED 8k-15k conversation:

- Multi-stage paint correction
- Full interior and exterior detailing
- Headlights + door sills protection
- Interior leather ceramic coating
- Rims ceramic coating
- Lifetime PPF inspection support

The page should not make this feel like a cheap package bundle. It should feel like the reason Grand Touch can charge premium money without sounding vague.

## Competitor Takeaways

### Apex Detail Studio

Screenshot: `audit-screenshots/ppf-competitors-2026-05-23/apex-hero.png`

Apex stacks premium trust immediately: XPEL certified, factory-trained, 500+ vehicles, 28+ specialists, 4.9 Google rating, 10-year manufacturer warranty, free pickup/drop-off, and WhatsApp/call CTAs. Their page also shows pricing later: sedan from AED 14,500, SUV from AED 15,500, supercars from AED 15,000.

Grand Touch can beat this on owner-led trust and clarity, but we need the value stack near the price so the number does not feel naked.

### Pentagon Auto

Screenshot: `audit-screenshots/ppf-competitors-2026-05-23/pentagon-hero.png`

Pentagon leads with urgency and offer framing: “1,000 AED cash back,” WhatsApp-first CTA, Al Quoz specialist positioning, 3M/STEK, 10-year warranty, zero damage guarantee, climate-controlled studio. This is more offer-led than Apex.

Grand Touch should not copy the cashback angle, but the visible benefit bullets and strong WhatsApp CTA are useful.

### The Detailing Xperts

Screenshot: `audit-screenshots/ppf-competitors-2026-05-23/detailing-xperts-hero.png`

They use a clean, direct hero: “best paint protection film service in Dubai,” 10-year warranty, XPEL certified installer, precision installation, and a prominent Book Now button. It is less price-transparent but simple to understand.

Grand Touch can stay more premium and personal, but the above-the-fold message should remain very obvious on mobile.

## Price Transparency vs Gated Flow

Do not panic and hide the price immediately. The point of Google PPC is to qualify serious buyers, and full PPF buyers should not be shocked that proper work costs real money.

However, there is a valid test hypothesis:

If users get the full answer too easily, they may use the page as a comparison tool and leave. A short 3-step flow can create more micro-commitment before the price reveal.

## Tests To Run If Price Views Keep Failing

### Test A - Current Open Calculator, Improved Value Stack

Keep the current model:

1. Choose vehicle size
2. Choose finish
3. Choose warranty
4. Price appears
5. CTA: Check This Price With Sean

Success metric:

- price_viewed to selected_price_whatsapp_click

Run this first because it is the cleanest and least disruptive.

### Test B - Soft Gate Before Price

Require one low-friction field before showing price:

- “What car is this for?”

Then show price and WhatsApp CTA. Do not require phone yet.

Reason:

This can reduce wrong-size uncertainty and makes the WhatsApp message more useful without feeling like a lead wall.

Risk:

Some users will bounce before price.

### Test C - WhatsApp Gate After Setup

After size, finish, warranty:

- Show a range or “Your setup is ready”
- CTA: “Send to Sean to confirm exact price”

Reason:

This may increase WhatsApp clicks because the price becomes the reward inside the conversation.

Risk:

It can feel like bait if the ad promises instant price.

### Test D - Full Lead Gate Before Exact Price

Ask for name/phone before exact price.

Recommendation:

Avoid this for Google PPC unless the open calculator fails after enough traffic. It may improve lead capture numbers but lower trust and lead quality. In a WhatsApp-first Dubai market, this may feel too corporate.

## Decision Rule

Do not change the gating model until there is enough data.

Watch for:

- 30+ price_viewed sessions with fewer than 3 selected-price WhatsApp clicks
- 50+ calculator campaign clicks with no qualified WhatsApp conversations
- high section timing on calculator/value sections but no WhatsApp

If that happens, test B first. It is the least risky next step.

## Current Best Hypothesis

The calculator was under-selling the value at the moment the price appeared. The user saw a number but did not immediately see enough included value and human reassurance beside it. The improved price block should make the number feel more justified and make WhatsApp feel like a quick check with Sean rather than a commitment.
