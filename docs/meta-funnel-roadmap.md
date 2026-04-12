# Meta Funnel, Tracking, Dashboard, and Admin Roadmap

Last updated: `2026-04-12` (Asia/Dubai)

This is the execution order for the next stage of the project.

The goal is not to build three separate systems at once.
The goal is to build them in the right dependency order so we get:

- a real Meta funnel
- trustworthy event data
- a useful drop-off dashboard
- a lightweight `/admin` lead desk

## 1. Current repo reality

Based on the current codebase:

- the live paid funnel is still centered on [src/pages/PpfDubaiQuote.tsx](C:/Users/seane/Desktop/GTA%20Website/grand-touch-craft/src/pages/PpfDubaiQuote.tsx)
- route handling is still simple in [src/App.tsx](C:/Users/seane/Desktop/GTA%20Website/grand-touch-craft/src/App.tsx)
- `index.html` already loads Google tags, GTM, and the Meta Pixel
- the live PPF quote page has an inline `trackEvent()` helper and Google Ads conversion firing
- the live quote page currently captures `utm_*` and `gclid`, but not the broader multi-platform attribution structure we want
- there is no real shared analytics module yet
- there is no `/admin` area yet
- the pulled Supabase migration file is currently empty, so we should assume the real CRM schema is not established yet

## 2. Critical sequencing decision

Do **not** start with the CRM UI.

Do **not** start with the dashboard UI.

Do **not** start by cloning the whole Google page into a totally separate Meta codebase.

The correct order is:

1. tracking foundation
2. source-aware landing page architecture
3. event persistence
4. dashboard
5. `/admin` lead desk

Reason:

- without stable tracking, the dashboard lies
- without stable data capture, the CRM starts blind
- without a shared funnel architecture, Meta becomes another duplicated page to maintain

## 3. What matters most right now

The highest-value work is:

### First priority

Build a shared tracking and attribution layer.

This is the blocker for everything else because we need:

- consistent event names
- one place to fire GA / GTM / Meta events
- one place to capture `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`
- support for `gclid`, `fbclid`, and later `ttclid`
- a durable `landing_page_variant`
- a durable `source_platform`

### Second priority

Create the Meta route as a wrapper around the same core funnel, not a forked duplicate.

Recommended route:

- `/ppf-meta-quote`

Recommended architecture:

- keep one shared funnel shell
- allow per-channel overrides for hero copy, CTA wording, proof emphasis, and source tags

### Third priority

Persist event and lead data into Supabase.

Without this, the dashboard and `/admin` are just front-end shells.

### Fourth priority

Build the dashboard view for funnel diagnostics.

This should answer:

- which landing page variant is leaking people
- where in the funnel they stop
- how Meta traffic behaves vs Google traffic
- which CTA paths are producing form starts, submits, or only WhatsApp clicks

### Fifth priority

Build the lightweight `/admin` lead desk.

This should consume the data model we already trust, not define it retroactively.

## 4. Recommended build phases

## Phase 1: Tracking foundation

Deliverables:

- create a shared analytics module under `src/lib` or `src/services`
- move event firing logic out of page-local inline helpers
- standardize event names across funnel pages
- capture full attribution params from URL
- include:
  - `source_platform`
  - `landing_page_variant`
  - `gclid`
  - `fbclid`
  - `ttclid`
  - `utm_source`
  - `utm_medium`
  - `utm_campaign`
  - `utm_content`
  - `utm_term`
- define which events are:
  - analytics-only
  - platform optimization events

Required first-pass analytics events:

- `lp_view`
- `hero_cta_click`
- `hero_whatsapp_click`
- `quote_config_started`
- `package_selected`
- `vehicle_size_selected`
- `finish_selected`
- `coverage_selected`
- `quote_unlocked`
- `lead_form_started`
- `lead_form_submitted`
- `whatsapp_click`

Required platform events:

- Google: lead submit conversion
- Meta: `Lead` on successful website form submit
- Meta secondary: WhatsApp or contact-style measurement only

Exit condition:

- one event schema
- one attribution schema
- one reusable event utility

## Phase 2: Meta funnel route

Deliverables:

- create `/ppf-meta-quote`
- keep the calculator and lead logic shared
- adjust only:
  - hero framing
  - CTA language
  - proof emphasis
  - source metadata

Do not:

- duplicate the whole `PpfDubaiQuote.tsx` page unless there is a very specific reason

Exit condition:

- Meta has its own route and tracking identity without creating a maintenance fork

## Phase 3: Supabase schema and event ingestion

Deliverables:

- define migrations for:
  - `profiles`
  - `leads`
  - `lead_events`
  - `lead_notes`
  - `lead_followups`
  - `lead_status_history`
- add auth plan for internal `/admin` users
- write lead + event records on successful form submit
- persist anonymous funnel events where useful

Minimum schema emphasis:

- lead source metadata must be first-class
- event payloads must keep raw context when helpful
- keep statuses and quality labels exactly as defined in the lead-desk plan unless there is a strong reason to change them

Exit condition:

- the site writes trustworthy lead and event records to Supabase

## Phase 4: Funnel diagnostics dashboard

Deliverables:

- dashboard page under `/admin` or a protected analytics route
- summary cards for:
  - landing page views
  - quote starts
  - form starts
  - form submits
  - WhatsApp clicks
- breakdowns by:
  - page
  - source platform
  - landing page variant
  - campaign
- step-drop chart showing where people fall out
- page and event filters

This dashboard is for optimization, not vanity.

It should make it obvious:

- where people stall
- whether Meta traffic is weaker before or after quote intent
- whether the leak is page-level, CTA-level, or form-level

Exit condition:

- we can diagnose drop-off without guessing

## Phase 5: Lightweight `/admin` lead desk

Deliverables:

- `/admin/login`
- `/admin/leads`
- lead table
- lead detail drawer
- notes
- status updates
- quality labels
- follow-up date

This should feel like:

- one inbox
- one board
- one lead drawer

Not:

- a full enterprise CRM

Exit condition:

- internal users can work leads without leaving the app

## 5. Exact order for the next working sessions

### Session A

Implement the shared tracking layer and attribution parsing.

### Session B

Refactor the live Google funnel to use the shared tracking layer without breaking current Google Ads conversion behavior.

### Session C

Create the Meta funnel route using the shared funnel structure.

### Session D

Add Supabase migrations and write lead / event ingestion.

### Session E

Build the funnel diagnostics dashboard.

### Session F

Build the `/admin` lead desk MVP.

## 6. What should not happen yet

Do **not** do these first:

- build TikTok funnel variants
- build CAPI feedback loops
- build complicated sales pipelines
- optimize Meta for WhatsApp clicks
- create lots of low-signal conversion events in ad platforms

Those are later-stage upgrades after the base tracking and lead desk are stable.

## 7. Immediate implementation target

If work starts right now, the best first implementation target is:

`Phase 1: shared tracking + attribution foundation`

That gives the rest of the roadmap something solid to stand on.
