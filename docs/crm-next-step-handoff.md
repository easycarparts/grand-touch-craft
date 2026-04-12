# CRM Next-Step Handoff

Last updated: `2026-04-12` (Asia/Dubai)

This document is the clean handoff for the next session.

The goal of the next session is to build the CRM layer properly without re-discovering the funnel, tracking, and Supabase context from scratch.

## 1. Mission

The business is trying to:

- generate fewer but better PPF leads
- understand exactly how users behave inside the paid funnel
- capture partial leads before they fully submit
- manage leads inside `/admin`
- later send lead quality feedback back into Meta so ad delivery improves toward high-quality leads

The product direction is:

- premium positioning
- high-trust funnel
- strong proof and risk-reduction messaging
- direct response with a lightweight CRM, not an enterprise sales system

## 2. Current live system

### Funnel / landing page

Current live paid funnel:

- `/ppf-dubai-quote`

Main file:

- [src/pages/PpfDubaiQuote.tsx](C:/Users/seane/Desktop/GTA%20Website/grand-touch-craft/src/pages/PpfDubaiQuote.tsx)

Important supporting files:

- [src/components/PpfCostCalculatorWidget.tsx](C:/Users/seane/Desktop/GTA%20Website/grand-touch-craft/src/components/PpfCostCalculatorWidget.tsx)
- [src/components/PpfQuoteSummary.tsx](C:/Users/seane/Desktop/GTA%20Website/grand-touch-craft/src/components/PpfQuoteSummary.tsx)

### Admin routes

Current admin surfaces:

- `/admin/login`
- `/admin/leads`
- `/admin/funnel-dashboard`

Important files:

- [src/pages/AdminLogin.tsx](C:/Users/seane/Desktop/GTA%20Website/grand-touch-craft/src/pages/AdminLogin.tsx)
- [src/pages/AdminLeads.tsx](C:/Users/seane/Desktop/GTA%20Website/grand-touch-craft/src/pages/AdminLeads.tsx)
- [src/pages/AdminFunnelDashboard.tsx](C:/Users/seane/Desktop/GTA%20Website/grand-touch-craft/src/pages/AdminFunnelDashboard.tsx)
- [src/components/admin/AdminAuthProvider.tsx](C:/Users/seane/Desktop/GTA%20Website/grand-touch-craft/src/components/admin/AdminAuthProvider.tsx)
- [src/components/admin/RequireAdmin.tsx](C:/Users/seane/Desktop/GTA%20Website/grand-touch-craft/src/components/admin/RequireAdmin.tsx)
- [src/components/admin/AdminShell.tsx](C:/Users/seane/Desktop/GTA%20Website/grand-touch-craft/src/components/admin/AdminShell.tsx)

### Supabase client

- [src/lib/supabase.ts](C:/Users/seane/Desktop/GTA%20Website/grand-touch-craft/src/lib/supabase.ts)

## 3. Tracking and analytics status

Shared analytics layer:

- [src/lib/funnel-analytics.ts](C:/Users/seane/Desktop/GTA%20Website/grand-touch-craft/src/lib/funnel-analytics.ts)

Shared intent scoring:

- [src/lib/funnel-intent.ts](C:/Users/seane/Desktop/GTA%20Website/grand-touch-craft/src/lib/funnel-intent.ts)

Intent score documentation:

- [docs/intent-score-model.md](C:/Users/seane/Desktop/GTA%20Website/grand-touch-craft/docs/intent-score-model.md)

### What is currently tracked

The funnel currently tracks:

- page views
- CTA clicks
- quote modal opens
- calculator / configurator interactions
- package selection
- size selection
- finish selection
- coverage selection
- quote unlock requests
- quote reveal / estimate unlock
- contact capture
- vehicle capture
- form submit
- WhatsApp click
- scroll depth
- section views
- section timing
- page checkpoints
- FAQ opens
- video started
- video milestones
- video completion

### Attribution currently captured

- `utm_source`
- `utm_medium`
- `utm_campaign`
- `utm_content`
- `utm_term`
- `gclid`
- `fbclid`
- `ttclid`
- `source_platform`
- `landing_page_variant`

### Important implementation detail

Event writes now use plain `insert`, not `upsert`, for `lead_events`.

Reason:

- anonymous insert works under current RLS
- `upsert` caused the funnel dashboard to appear empty because events were not landing

This bug has already been fixed in:

- [src/lib/funnel-analytics.ts](C:/Users/seane/Desktop/GTA%20Website/grand-touch-craft/src/lib/funnel-analytics.ts)

## 4. Supabase status

### Migration foundation

Core migration:

- [supabase/migrations/20260412190000_paid_funnel_crm_foundation.sql](C:/Users/seane/Desktop/GTA%20Website/grand-touch-craft/supabase/migrations/20260412190000_paid_funnel_crm_foundation.sql)

### Tables / view already created

- `admin_users`
- `leads`
- `lead_events`
- `lead_contact_snapshots`
- `lead_notes`
- `lead_followups`
- `lead_status_history`
- `ad_platform_feedback`
- `admin_session_rollups` view

### Auth status

Supabase Auth is already wired for admin login.

Local testing is aligned to:

- `http://localhost:8080`

### Important current behavior

`lead_contact_snapshots` stores partial lead capture.

That means:

- if the user enters name + phone but never fully submits, we still store that
- if they later add vehicle details, that is also stored
- this is intentional and must be preserved in the CRM

## 5. What is already working

### Lead desk

The lead desk already:

- loads real leads from Supabase
- computes intent using live session rollups
- allows search and status filtering
- shows name, phone, vehicle, source, estimate, and last activity
- supports expandable lead rows

Expanded lead rows now show:

- package
- vehicle size
- finish
- coverage
- estimate
- matching sessions count
- quote activity
- lead actions
- time on page
- scroll depth
- video state
- sections viewed

### Funnel dashboard

The funnel dashboard already:

- reads Supabase events
- groups users into sessions
- shows session-by-session journeys
- shows most recent sessions by default
- shows filters and session count limits
- shows step-based milestone cards
- shows drop-off hints
- shows page performance
- shows event breakdown
- shows focused session detail

## 6. Important current limitations

These are known limitations and should not be mistaken for bugs unless behavior changed:

### 1. `leads.intent_score` database column is not yet the source of truth

The admin UI currently computes the best visible intent score from session rollups and funnel behavior.

That means:

- the lead desk can show the right score
- the raw `leads.intent_score` column may still lag or stay lower than the UI

Future improvement:

- create a database-side rollup/update so `leads.intent_score` is kept in sync automatically

### 2. Video tracking nuance

The dashboard now distinguishes:

- no video activity
- `Played <25%`
- real percentage milestones

But the session rollup view is still milestone-oriented.

Future improvement:

- explicitly add a `video_started` boolean to the database rollup if needed

### 3. CRM is still an early surface

It is useful now, but not yet a complete working sales workflow.

## 7. What the CRM needs next

The next session should focus on turning `/admin/leads` into a real lightweight CRM.

### Minimum CRM requirements

Each lead needs to be manageable.

We need to be able to:

- see all lead details clearly
- see what they wanted to buy
- mark whether we spoke to them
- change their lead status
- assign quality / intent judgment
- add notes
- track follow-up status
- see whether the lead was partial or fully submitted
- preserve attribution and source context

### Recommended next CRM fields in the UI

Per lead:

- name
- phone
- vehicle make
- vehicle model
- vehicle year
- package
- finish
- coverage
- vehicle size
- quote estimate
- source platform
- landing page variant
- latest activity time
- submitted time
- WhatsApp clicked or not
- form submitted or not
- intent score
- current CRM status
- quality label
- owner / assignee

### Recommended next CRM actions

For each lead:

- change status
- set quality label
- add internal note
- create follow-up
- mark contacted
- mark qualified
- mark quoted
- mark won
- mark lost
- mark junk

### Recommended next CRM pages or panels

Do not overbuild. Keep it tight.

Recommended next surfaces:

1. Improve `/admin/leads`
- turn the expandable rows into more complete lead cards or detail panels
- add inline status and quality controls
- add note creation
- add basic assignment if needed

2. Add a simple lead detail route later if needed
- `/admin/leads/:id`

Only do this if the inline lead desk becomes too cramped.

## 8. Meta API / feedback planning

This matters for the next stage and should be designed now even if full implementation happens later.

### Goal

We want to be able to tell Meta which leads are:

- real / good
- poor quality
- junk
- won jobs
- lost jobs

This should improve Meta learning over time.

### Current schema support

There is already a table for this:

- `ad_platform_feedback`

This should become the bridge for:

- Meta Conversions API / offline conversion feedback
- possibly Google / TikTok later

### Important business rule

Meta-originated leads should be identifiable automatically from attribution.

That means:

- if `fbclid` exists, or `source_platform = meta`, or later Meta lead-form metadata is present, the lead should be classed as Meta-originated

### Future CRM requirement tied to Meta

Inside the CRM, there should be a simple way to mark:

- high quality
- low quality
- spam / junk
- sold / won
- lost

And then later pass that status back to Meta in a controlled way.

### Recommended future flow

1. lead enters CRM with source attribution
2. CRM user reviews and updates status / quality
3. a feedback job writes a pending record into `ad_platform_feedback`
4. a backend process sends that to Meta
5. response / failure state is stored

Important:

- do not send directly from the browser
- keep the UI action separate from the sending mechanism

## 9. Recommended next build order

The next session should probably work in this order:

1. strengthen `/admin/leads` into a usable CRM surface
2. add inline status / quality updates
3. add notes and follow-ups
4. make database-side lead rollups stronger
5. improve `ad_platform_feedback` workflow for later Meta feedback sending

## 10. What not to redo

Do not spend the next session rebuilding these from scratch:

- Supabase auth setup
- core tables
- partial lead capture concept
- funnel dashboard foundations
- session tracking foundations
- intent score helper shape

Those already exist and should be extended, not replaced.

## 11. Key files for the next session

Most important files:

- [src/pages/AdminLeads.tsx](C:/Users/seane/Desktop/GTA%20Website/grand-touch-craft/src/pages/AdminLeads.tsx)
- [src/pages/AdminFunnelDashboard.tsx](C:/Users/seane/Desktop/GTA%20Website/grand-touch-craft/src/pages/AdminFunnelDashboard.tsx)
- [src/lib/funnel-analytics.ts](C:/Users/seane/Desktop/GTA%20Website/grand-touch-craft/src/lib/funnel-analytics.ts)
- [src/lib/funnel-intent.ts](C:/Users/seane/Desktop/GTA%20Website/grand-touch-craft/src/lib/funnel-intent.ts)
- [src/pages/PpfDubaiQuote.tsx](C:/Users/seane/Desktop/GTA%20Website/grand-touch-craft/src/pages/PpfDubaiQuote.tsx)
- [src/lib/supabase.ts](C:/Users/seane/Desktop/GTA%20Website/grand-touch-craft/src/lib/supabase.ts)
- [supabase/migrations/20260412190000_paid_funnel_crm_foundation.sql](C:/Users/seane/Desktop/GTA%20Website/grand-touch-craft/supabase/migrations/20260412190000_paid_funnel_crm_foundation.sql)

Supporting docs:

- [docs/memory.md](C:/Users/seane/Desktop/GTA%20Website/grand-touch-craft/docs/memory.md)
- [docs/intent-score-model.md](C:/Users/seane/Desktop/GTA%20Website/grand-touch-craft/docs/intent-score-model.md)
- [docs/meta-funnel-roadmap.md](C:/Users/seane/Desktop/GTA%20Website/grand-touch-craft/docs/meta-funnel-roadmap.md)
- [docs/lead-desk-and-paid-funnel-plan.md](C:/Users/seane/Desktop/GTA%20Website/grand-touch-craft/docs/lead-desk-and-paid-funnel-plan.md)
