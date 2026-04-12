# Intent Score Model

Last updated: `2026-04-12` (Asia/Dubai)

This document explains how the paid-funnel `intent score` is weighted today and what it is meant to represent.

The goal is not to reward a single click too heavily.
The goal is to identify people who behaved like serious buyers:

- they spent time on the page
- they consumed proof and trust content
- they interacted with the quote flow
- they gave usable contact details
- they took a final conversion action

The score is capped at `100`.

## Principles

- `Form submit` matters more than `WhatsApp click`
- `WhatsApp click` still matters, but it should not look like maximum intent on its own
- `Deep page engagement` matters
- `Calculator / quote exploration` matters
- `Partial lead capture` matters
- `Doing multiple strong actions together` matters more than doing one isolated action

## Weighting

### 1. Time on page

- `+6` if they stay at least `60 seconds`
- `+12` more if they stay at least `120 seconds`

Max from time: `18`

### 2. Scroll depth

- `+5` if they reach at least `50%`
- `+10` if they reach at least `70%`

Max from scroll: `10`

### 3. Section depth

- `+5` if they view at least `3` tracked sections
- `+10` if they view at least `5` tracked sections

Max from sections: `10`

### 4. Video engagement

- `+4` if they start the video
- `+7` if they reach `50%`
- `+4` more if they reach `90%`

Max from video: `15`

Notes:

- If a user plays the video but does not hit the first progress milestone, the dashboard shows this as `Played <25%`
- This is meant to separate `clicked the video` from `actually watched a meaningful amount`

### 5. Quote exploration

- `+4` if they open the calculator / quote flow
- `+5` if they make at least `1` core quote selection
- `+10` if they make at least `3` core quote selections
- `+5` if they request or reveal the estimate

Core quote selections are:

- package
- vehicle size
- finish
- coverage

Max from quote exploration: `19`

### 6. Lead data capture

- `+8` if name and phone are captured
- `+7` if vehicle make, model, and year are captured

Max from lead data capture: `15`

### 7. Final conversion actions

- `+15` if the lead form is submitted
- `+8` if WhatsApp is clicked
- `+5` extra if they do both

Max from final actions: `28`

## Interpretation

The score intentionally rewards layered intent.

Examples:

- Someone who only clicks WhatsApp should not look like a perfect lead
- Someone who reads, scrolls, watches, configures the quote, reveals price, submits the form, and also clicks WhatsApp should score the highest
- Someone who gives contact details but drops before the final step should still score meaningfully because they are not a dead session

## Current Implementation

The shared logic lives in:

- [src/lib/funnel-intent.ts](C:/Users/seane/Desktop/GTA%20Website/grand-touch-craft/src/lib/funnel-intent.ts)

It is used by:

- [src/pages/AdminFunnelDashboard.tsx](C:/Users/seane/Desktop/GTA%20Website/grand-touch-craft/src/pages/AdminFunnelDashboard.tsx)
- [src/pages/AdminLeads.tsx](C:/Users/seane/Desktop/GTA%20Website/grand-touch-craft/src/pages/AdminLeads.tsx)

## Future refinement ideas

- split `calculator opened` from `modal opened` if the flow becomes more complex
- weight section timing, not just section count
- give different weights to specific sections if the user decides some are more commercially important
- persist a database-side rollup so `leads.intent_score` is updated automatically, not only the admin UI view
