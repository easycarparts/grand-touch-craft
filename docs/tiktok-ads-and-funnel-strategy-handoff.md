# TikTok Ads And Funnel Strategy Handoff

This document captures the TikTok ads/funnel strategy discussed so far.

It is not a perfect attribution report. Several CRM/database lookups were skipped or blocked, and TikTok/WhatsApp/link-in-bio attribution is naturally messy. Treat this as the working strategy and decision log.

## Business Context

Grand Touch sells premium PPF in Dubai.

The user is strong on camera and has good creative assets. TikTok CPM/CPC has been much cheaper than Google PPC and recently cheaper than Meta.

Main tension:

- TikTok traffic is cheap and high-volume
- TikTok user intent is lower
- the funnel must add enough friction/education to qualify people
- but too much friction blocks valuable WhatsApp leads

The goal is not simply cheap leads.

The goal is:

```text
More qualified PPF conversations at a profitable cost.
```

## Channel Learnings

### Google PPC

Observed:

- very low click volume
- CPC around 20 AED or more
- slow to learn/test

Current recommendation:

Park Google PPC for now unless using very specific high-intent campaigns.

Reason:

TikTok is providing much cheaper traffic and enough lead quality to justify funnel testing.

### Meta

Observed:

- Meta used to produce leads around 25-30 AED
- recently rose toward 50-60 AED CPL
- regional tension/market softness may be affecting intent and CPM/CPL
- Meta lead forms can bring price shoppers

Current recommendation:

Keep Meta running at reduced budget as a stability channel, but do not over-invest while CPL/quality is worse than TikTok.

### TikTok

Observed:

- CPC often near or below 2 AED
- CPM low
- early CPL on winners around 30-45 AED
- several leads were high intent
- at least one closed job came from the activity
- user reported roughly 30k AED revenue potential/closed value from around 1.5k AED spent

Current recommendation:

TikTok deserves focus, but needs disciplined creative/ad set management and a better guided funnel.

## TikTok Creative Learnings

Working/worth keeping based on screenshots/discussion:

- Defender 3
- Defender 44
- Patrol
- G700

Problematic / paused / suspected broad-attraction traffic:

- Rolls
- Cullinan
- some pure luxury car edits

Reason:

Rolls/Cullinan creative may attract people who like luxury cars but are not actual PPF buyers or decision makers. This can hurt lead quality and pull delivery toward a broader entertainment audience.

Important nuance:

Do not assume a creative is bad just because TikTok initially did not spend on it. Some winning Meta creatives may need time or separate testing. But when a creative gets spend and produces poor conversion quality, separate or pause it.

## Ad Set Learning Notes

TikTok optimizes at the ad group/ad set level, using conversion signals from the selected optimization event.

It does not need each individual video to get 10-20 conversions before learning, but each creative needs enough spend/clicks before judging.

Low conversion volume means:

- day-to-day volatility is normal
- one bad day does not prove the funnel broke
- adding/removing creatives can shift delivery
- major changes can destabilize learning

## What Likely Happened With Rolls/Cullinan

Hypothesis:

Adding broad luxury car creatives changed the audience signal and delivery pattern. TikTok may have started finding cheap engagement from people interested in expensive cars rather than people considering PPF work.

This does not permanently poison the pixel, but it can disturb the ad group learning for a while.

Best response:

- do not panic-reset every few hours
- pause the obvious broad/low-quality creatives
- keep proven/converting creatives active
- let the ad group run long enough to re-stabilize
- if it does not recover after enough spend/time, duplicate a cleaner ad group with only proven creatives

## Budget Strategy Discussed

At one point:

- Meta: 150 AED/day
- TikTok: 200 AED/day
- total: 350 AED/day

This was a sensible test split given:

- Meta CPL had risen
- TikTok CPL was lower
- TikTok funnel generated qualified leads

Do not jump budget too aggressively.

Recommended scale pattern:

- increase by 20-30% after stable performance
- or duplicate into a controlled test ad group
- avoid doubling/tripling spend after only a few conversions

## Dayparting

User observed leads often arrive after 6pm or overnight.

Recommendation:

Do not daypart too early in learning unless daytime spend is clearly wasteful over multiple days.

Reason:

- TikTok needs room to learn
- early data is thin
- daytime clicks may still assist later conversions

Possible future test:

Run a separate evening/weekend ad group instead of editing the main one.

## Funnel Lessons

### Normal Landing Page

The full `/ppf-tiktok-quote_2` page improved a lot on mobile after redesign.

Better current hero direction:

- short headline
- primary quote CTA
- WhatsApp text/escape
- trust stamps
- recent install proof
- calculator link after trust stamps

Old problems:

- too much text
- oversized sections
- phone mockup taking too much space
- duplicate/sticky CTAs competing
- users lost before understanding the next step

### Guided Funnel

The guided funnel exists because TikTok cold traffic needs less choice and more direction.

Goal:

- fewer decisions
- clearer step-by-step progression
- capture useful info faster
- make users feel each step gives value

Current issue:

The guided funnel result sends people into the old full page, losing continuity.

Next build:

Create a separate guided result/detail page.

See:

```text
docs/tiktok-guided-result-page-plan.md
```

## WhatsApp Friction Lesson

Blocking WhatsApp entirely was too aggressive.

Reason:

User closed real business from people who bypassed the funnel and went straight to WhatsApp.

Best compromise:

- show a lightweight capture modal first
- include a clear skip option:

```text
In a hurry? Skip and talk to Sean on WhatsApp
```

- if user has already filled details, prefill WhatsApp message with those details
- open WhatsApp in new tab/window
- track `Contact` as secondary event
- keep `SubmitForm` as main optimization event

## Friction Strategy

Not enough friction:

- low-intent users submit instantly
- they have not seen pricing/trust/proof
- may become price shoppers

Too much friction:

- serious buyers who want WhatsApp leave
- fewer conversations
- TikTok has fewer conversion signals

Recommended current balance:

- keep main quote flow friction moderate
- allow WhatsApp escape
- make guided flow simpler, not heavier
- do not hide all contact routes behind long education
- use post-submit guided details page to educate after capture

## Pricing Strategy

Question:

Would showing prices hurt conversions?

Answer:

It can reduce raw enquiries but improve quality.

For premium PPF, this is usually acceptable if:

- prices are framed as starting estimates/ranges
- value is shown before/near price
- users understand film, prep, warranty, and handover standards
- WhatsApp remains available for exact quote

Recommended:

- show estimate/range after user gives basic details
- do not blast full prices immediately above the fold
- use calculator reveal as intent signal

## G700 Customizer Strategy

Route:

```text
/g700-customizer
```

Potential:

- very niche
- high relevance for Jetour G700 owners
- can include accessories, colour options, PPF, pricing, checkout/enquiry CTA
- should be hooked into CRM

Recommendation:

Build specific creative for G700 and send to the G700 page.

Likely outcome:

- lower volume
- maybe higher CPL
- potentially much stronger intent

Need:

- mobile optimization
- CRM capture
- Telegram alerting
- TikTok/Meta tracking
- optional accessory/PPF pricing

Existing spec:

```text
docs/g700-customizer-dev-spec.md
```

## Campaign Management Rules

### Do Not Judge Too Fast

Avoid making big decisions on:

- less than 24 hours
- fewer than 30-50 clicks per creative
- fewer than 3-5 conversions per ad group

But do act quickly if:

- creative has high spend and zero conversions
- CTR collapses
- CPC doubles/triples
- comments/leads show wrong audience

### Pausing vs Deleting

Switch off losers. Do not delete them.

Reasons:

- preserves history
- lets you analyze later
- less destructive
- deletion does not magically reset learning in a useful way

### When To Duplicate

Duplicate a cleaner ad group when:

- original ad group is unstable after obvious bad creatives are paused
- you want a clean learning environment
- you have 3-5 proven creatives
- you can give it enough budget

Do not duplicate endlessly. Too many ad groups split learning.

### Suggested Clean Test Structure

Ad group A:

- proven PPF buyer/problem-solution creatives
- Defender/Patrol/G700 style
- main guided or normal funnel

Ad group B:

- luxury/lifestyle creatives
- lower budget
- exploratory

Ad group C:

- G700-specific page
- G700-specific creative
- niche audience/angle

## Next Strategic Recommendation

Do not abandon TikTok because of a bad 48 hours.

But do not keep feeding the same unstable setup blindly.

Best next move:

1. Fix CRM overwrite/Telegram so tracking is trustworthy.
2. Build guided result/detail page.
3. Run clean TikTok ad group with only proven buyer-intent creatives.
4. Keep luxury broad creatives separated at low budget.
5. Keep Meta reduced but active if it still produces jobs.
6. Park Google PPC unless a high-intent campaign is built.
7. Review after 48-72 hours of stable tracking, not during broken tracking/cache churn.

## Key Philosophy

TikTok can work here because:

- creative is strong
- local Dubai audience is on TikTok
- CPC is cheap
- the funnel adds qualification
- the product has enough margin for imperfect lead quality

But TikTok needs:

- clean tracking
- clean creative signals
- mobile-first funnel
- fast but not panicked iteration

The goal is not to make TikTok leads behave like Google Search leads.

The goal is to turn cheap cold attention into qualified PPF conversations before competitors do.
