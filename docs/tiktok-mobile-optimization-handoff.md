# TikTok Mobile Optimization Handoff

Last updated: `2026-04-14` (Asia/Dubai)

This document is the handoff for the current `TikTok -> /ppf-tiktok-quote` work.

It is focused on one question:

`How do we improve mobile conversion rate on the TikTok funnel when traffic is cheap, attention is low, and most users are not moving beyond the hero section?`

## 1. Current situation

### What is working

- TikTok traffic is reaching the website.
- TikTok `Submit form` optimization event became selectable and `Active` in Ads Manager on the original working data connection.
- The funnel is capturing TikTok leads into the CRM.
- Telegram lead dispatch was repaired during this session.
- CPC is cheap on TikTok compared with Google PPC.
- Early signal suggests TikTok is a better short-term learning channel than Google PPC for this offer.

### What is not working well

- Most users are not progressing far beyond the hero section.
- Mobile presentation feels too large, too dense, and too heavy.
- The sticky WhatsApp CTA is visually competing with other CTAs on mobile.
- The quote unlock modal feels oversized on mobile.
- Keyboard behavior makes the mobile form feel cramped.
- Phone-number input UX is weak and inconsistent for non-UAE numbers.
- Section hierarchy is unclear on mobile, especially once users move past the hero.

## 2. Business read so far

### Short conclusion

TikTok looks promising enough to keep testing.

Why:

- CPC is very low.
- Creative quality is strong.
- Traffic is coming in fast enough to test the funnel cheaply.
- Even with a weak mobile experience, the funnel is still producing leads.

### Risk

Cheap traffic can still waste money if the landing page does not convert cold mobile users cleanly.

The current bottleneck is no longer just media buying.
It is mostly `mobile landing-page friction`.

## 3. Funnel and campaign snapshot

These numbers are the working snapshot discussed in this session and should be refreshed in the next one.

### CRM / funnel snapshot

From roughly `2026-04-13 19:00 GST` onward, the observed funnel activity was:

- `69` TikTok funnel sessions
- `68` `lp_view`
- `10` sessions reached `25%` scroll
- `6` sessions reached `50%` scroll
- `1` submitted lead
- `2` WhatsApp clicks

Interpretation:

- Traffic is landing.
- Hero interaction is weak.
- Very few people are advancing into meaningful engagement.
- The drop is happening very early.

### Ad-performance snapshot

User-reported campaign observations:

- very cheap CPC, often around `AED 1` or below
- approximately `AED 42` total spend for one lead on the current test
- strong confidence that creatives are not the main bottleneck

Interpretation:

- TikTok is doing its job as a traffic generator.
- The next efficiency gains should come from funnel improvement before major scaling.

## 4. Main hypothesis

The funnel is currently much better tuned for desktop than for mobile.

For TikTok traffic, mobile is the critical environment.

The likely reason for low progression is not just low intent.
It is a combination of:

- cold social traffic
- oversized hero and typography
- too much visual weight too early
- duplicate CTA pressure
- modal friction
- poor phone-input ergonomics
- weak section pacing after the hero

## 5. Confirmed mobile UX issues from this session

These came directly from review and screenshots of the live mobile experience.

### Hero section

- Hero text is too large on mobile.
- The page feels visually heavy before the user understands the offer.
- The phone mockup/media competes with the main message.
- The hero CTA stack feels cluttered.
- There are effectively two WhatsApp CTAs visible because the sticky CTA overlaps the hero CTA behavior.

### Quote modal

- The quote modal content is too large on mobile.
- Step hierarchy is not tight enough.
- The keyboard takes over too much of the screen and makes the form feel cramped.
- Buttons and inputs feel oversized.
- The close / step progress / content stack uses too much vertical space.

### Phone number input

- Current experience makes users think they should type `+` themselves.
- It encourages inconsistent formatting.
- Users may enter a leading `0` after the country code.
- UAE `+971` should remain the default, but common alternative countries should be easy to select.

Most likely top options needed:

- `UAE (+971)`
- `UK (+44)`
- `India (+91)`
- `Pakistan (+92)`
- `Saudi Arabia (+966)`
- `Qatar (+974)`

### Mid-page sections

- Many sections feel too big on mobile.
- Section hierarchy is unclear.
- Users do not quickly understand which part is the heading, which part is the proof, and which part is the action.
- The `Why we use STEK` section feels visually dominated by the video.
- Later cards and text blocks feel oversized and repetitive on mobile.

### Post-submit screen

- Completion modal still feels large on mobile.
- There is CTA competition here too.

## 6. TikTok-specific optimization principle

Do not treat this funnel like Google Search traffic.

TikTok users need:

- faster clarity
- lower visual friction
- tighter copy
- simpler mobile progression
- proof without overload
- a page that feels easy to scan

This means:

- fewer competing actions above the fold
- smaller mobile typography in many sections
- clearer section hierarchy
- less clutter from sticky bars and repeated CTAs
- faster mobile form completion

## 7. Changes already made in code in this session

These changes were made locally in:

- [C:\Users\seane\Desktop\GTA Web\grand-touch-craft\src\pages\PpfDubaiQuote.tsx](C:/Users/seane/Desktop/GTA%20Web/grand-touch-craft/src/pages/PpfDubaiQuote.tsx)

### Mobile cleanup pass already implemented locally

- reduced hero text size and hero spacing on mobile
- reduced many later section headings and body text sizes on mobile
- reduced mobile button heights and input heights
- reduced quote modal spacing and mobile content bulk
- added country-code dropdown based phone input
- defaulted phone code to `+971`
- normalized local number entry so users do not keep the leading `0`
- hid hero WhatsApp button on mobile
- made sticky mobile WhatsApp CTA appear only after the hero is no longer substantially in view
- hid sticky CTA while the form modal is open
- hid sticky CTA while the mobile keyboard is open
- reordered `Why we use STEK` on mobile so the copy lands before the video

### Important status

These changes compile locally.

Build status:

- `npm run build` passes

At the time of writing this handoff, these mobile funnel refinements are `local code changes` and should be checked/deployed intentionally in the next session.

## 8. What should happen next

### Priority 1: Deploy and evaluate the first mobile cleanup pass

Before adding new popups or new funnel logic:

1. review the local mobile changes in `PpfDubaiQuote.tsx`
2. deploy them
3. let TikTok traffic hit the updated mobile funnel
4. compare progression against the current baseline

Reason:

- the current page has obvious mobile friction
- that needs to be reduced before adding more conversion mechanics

### Priority 2: Re-check hero section performance after deployment

Focus on:

- `lp_view`
- first meaningful scroll
- quote modal opens
- step 1 completion
- step 2 completion
- lead submit rate
- WhatsApp click rate

The main question:

`Did the updated mobile hero help more users leave the first screen and begin the quote flow?`

### Priority 3: Tighten the hero specifically for TikTok traffic

If the first mobile cleanup pass is not enough, the hero should be simplified further.

Likely next hero moves:

- reduce headline height further
- shorten hero paragraph even more
- reduce media footprint or reposition the phone mockup
- consider pushing the main proof/video lower
- remove any extra visual weight that does not help first-click conversion

### Priority 4: Rework the video/proof balance on mobile

Current open question:

`Is the phone/video asset helping trust, or is it using too much vertical space before the user understands what to do?`

Best next-session evaluation:

- test smaller media treatment in the hero
- keep video proof, but make it subordinate to the first CTA
- treat media as support, not as the main event

### Priority 5: Consider a timed nudge only after the above

The idea raised in this session:

- after `20-30 seconds`, show a nudge like:
  - `Want to chat with Sean? Leave your details and we’ll tell you what fits your car.`

Recommendation:

- do `not` add this yet
- first fix the obvious mobile layout friction
- only test a timed prompt after the mobile cleanup pass has had traffic

Why:

- a popup on top of a crowded mobile experience can easily make things worse
- the current page needs simplification before interruption-based conversion tactics

## 9. Data review checklist for the next session

### In TikTok Ads Manager

Review:

- spend
- CPC
- CTR
- destination clicks
- submit-form conversions
- cost per conversion
- ad-level creative performance

Questions:

- which creatives generate the cheapest quality sessions?
- which creatives generate actual submits?
- are some creatives producing lots of clicks but almost no depth?

### In CRM / Admin leads

Filter by:

- source/platform = `tiktok`
- recent date range around the new traffic window

Check:

- how many new submitted leads
- lead quality notes
- whether WhatsApp-first behaviors appear
- whether contact details are formatted cleanly

### In funnel analytics

The most important review is progression by section / step.

Look at:

- `lp_view`
- hero-to-scroll progression
- quote modal open rate
- `lead_form_started`
- step progression
- `lead_form_submitted`
- WhatsApp clicks

Key diagnostic question:

`Are users bouncing because of low intent, or because the mobile page is too heavy before they even understand the next step?`

## 10. Useful repo locations for the next session

### Main funnel page

- [C:\Users\seane\Desktop\GTA Web\grand-touch-craft\src\pages\PpfDubaiQuote.tsx](C:/Users/seane/Desktop/GTA%20Web/grand-touch-craft/src/pages/PpfDubaiQuote.tsx)

### Route setup

- [C:\Users\seane\Desktop\GTA Web\grand-touch-craft\src\App.tsx](C:/Users/seane/Desktop/GTA%20Web/grand-touch-craft/src/App.tsx)

### Funnel analytics / attribution

- [C:\Users\seane\Desktop\GTA Web\grand-touch-craft\src\lib\funnel-analytics.ts](C:/Users/seane/Desktop/GTA%20Web/grand-touch-craft/src/lib/funnel-analytics.ts)

### TikTok pixel helper

- [C:\Users\seane\Desktop\GTA Web\grand-touch-craft\src\lib\tiktok-pixel.ts](C:/Users/seane/Desktop/GTA%20Web/grand-touch-craft/src/lib/tiktok-pixel.ts)

### Existing broader paid-funnel plan

- [C:\Users\seane\Desktop\GTA Web\grand-touch-craft\docs\lead-desk-and-paid-funnel-plan.md](C:/Users/seane/Desktop/GTA%20Web/grand-touch-craft/docs/lead-desk-and-paid-funnel-plan.md)

## 11. TikTok event / tracking notes

What matters for campaign learning right now:

- the original working TikTok data connection had `Submit form` marked `Active`
- that is enough to let the campaign optimize

Important:

- do not keep rebuilding pixels/events unless something actually breaks
- keep the optimization event stable while the campaign gathers more learning
- use the funnel/mobile improvements to improve conversion rate rather than constantly resetting tracking

## 12. Recommendation for budget and testing cadence

The position from this session was:

- TikTok is currently more useful than Google PPC for cheap funnel learning
- traffic is cheap enough that funnel iteration is worthwhile
- scaling should be controlled rather than reckless

Suggested approach:

- keep budget moderate while hero/mobile fixes are rolling out
- do not immediately throw large additional budget at a still-friction-heavy mobile funnel
- improve the page, then scale harder once progression improves

## 13. Plain-English task summary for the next session

If a new session needs the shortest possible brief, it is this:

`TikTok traffic is cheap and promising, but the mobile funnel is too heavy. Most users are not getting beyond the hero. The next job is to deploy and refine the mobile UX of /ppf-tiktok-quote, especially the hero, modal sizing, CTA competition, phone input, and mid-page section hierarchy, then measure whether more users progress into the quote flow and convert.`

