# CRM, Telegram, And Supabase Architecture

This document explains how `/admin/leads`, funnel tracking, Supabase, and Telegram alerts are meant to work.

Use this before changing migrations, lead capture, Telegram queueing, or CRM display logic.

## High-Level Flow

```text
User visits funnel
  -> frontend creates tracking context
  -> frontend writes lead_events for behaviour
  -> frontend writes lead_contact_snapshots for contact/vehicle/submission
  -> Supabase trigger syncs snapshot/event into leads
  -> CRM reads leads + rollups + alerts
  -> database queues Telegram alert
  -> pg_net calls telegram-crm-alerts edge function
  -> edge function sends Telegram message and marks queue row sent
```

## Frontend Tracking Context

File:

```text
src/lib/funnel-analytics.ts
```

Main functions:

- `createFunnelTrackingContext()`
- `trackFunnelEvent()`
- `captureLeadSnapshot()`
- `resetFunnelBrowserState()`

### Context Fields

Each funnel has:

- `funnelName`
- `landingPageVariant`
- `sourcePlatform`
- `pathname`
- `hash`
- `entrySection`
- `sessionId`
- `visitorId`
- `attribution`

### Storage Behaviour

`sessionId` lives in sessionStorage:

```text
grand-touch-funnel-session-id
```

`visitorId` lives in localStorage:

```text
grand-touch-funnel-visitor-id
```

This is useful for analytics but dangerous for CRM identity if used too broadly.

### Critical Identity Rule

`visitorId` must not be used as the primary merge key for submitted leads.

Reason:

TikTok in-app browser and repeated tests can reuse browser identity while the person/phone changes.

Current frontend mitigation:

`captureLeadSnapshot()` scopes `session_id` and `visitor_id` by phone when a phone is present.

## Supabase Tables

### `public.leads`

This is the CRM source of truth.

Important fields:

- `id`
- `primary_session_id`
- `visitor_id`
- `full_name`
- `phone`
- `normalized_phone`
- `vehicle_make`
- `vehicle_model`
- `vehicle_year`
- `vehicle_label`
- `source_platform`
- `landing_page_variant`
- `funnel_name`
- `lead_source_type`
- `status`
- `quality_label`
- `latest_quote_estimate`
- `submitted_at`
- `whatsapp_clicked_at`
- `created_at`
- `last_activity_at`

Lead rows can come from:

- TikTok website funnels
- guided TikTok funnel
- G700 customizer
- Meta lead forms
- manual CRM entry
- future imports

### `public.lead_contact_snapshots`

This stores lead capture moments.

Snapshot types:

- `contact`
- `vehicle`
- `submit`

Used for:

- partial lead capture
- submitted lead capture
- progressive enrichment
- CRM lead creation/update

Frontend writes here through:

```ts
captureLeadSnapshot()
```

### `public.lead_events`

This stores behavioural events.

Examples:

- `lp_view`
- `section_view`
- `section_engagement`
- `page_checkpoint`
- `lead_form_started`
- `lead_contact_captured`
- `lead_vehicle_captured`
- `lead_form_submitted`
- `whatsapp_click`
- `quote_unlocked`
- `guided_finish_completed`

Frontend writes here through:

```ts
trackFunnelEvent()
```

Important:

Use insert, not upsert.

### `public.crm_alert_queue`

This stores alerts to be sent to Telegram.

Important fields:

- `id`
- `alert_type`
- `lead_id`
- `followup_id`
- `title`
- `body`
- `payload`
- `delivery_status`
- `delivery_attempts`
- `available_at`
- `sent_at`
- `last_error`

Alert statuses:

- `pending`
- `sent`
- `failed`
- `skipped`

## Core Migrations

### `20260412190000_paid_funnel_crm_foundation.sql`

Initial CRM/funnel foundation.

Creates:

- `leads`
- `lead_contact_snapshots`
- `lead_events`
- lead notes/follow-up/status/feedback support tables
- admin rollup views
- RLS policies
- basic sync triggers

Important caution:

The original sync functions in this migration matched leads by `visitor_id`. This later caused overwrite risk and should be superseded by the 2026-04-27 migration.

### `20260412213000_crm_channel_intake_prep.sql`

Prepares CRM for multi-channel intake.

Adds/adjusts external lead source fields.

### `20260412221500_crm_telegram_alerts.sql`

Creates initial Telegram queue table/functions/triggers.

### `20260412233000_meta_lead_intake.sql`

Prepares Meta lead intake and unique external lead identity.

### `20260413004500_auto_dispatch_crm_alert_queue.sql`

Adds automatic database dispatch for CRM alert queue via `pg_net`.

### `20260413012000_lead_response_tracking.sql`

Adds first-contact/response tracking fields.

### `20260413181500_queue_submitted_lead_alerts.sql`

Queues Telegram alerts when a lead becomes submitted.

### `20260414113000_queue_partial_lead_alerts.sql`

Queues delayed partial lead alerts.

Intended behaviour:

- if user enters contact details but does not finish
- wait briefly
- send partial lead alert unless the lead becomes submitted first

### `20260416200000_telegram_queue_on_lead_insert_submitted.sql`

Fixes the case where a lead is inserted with `submitted_at` already set.

Without this, insert-with-submitted could skip submitted alert queueing.

### `20260427143000_queue_submitted_lead_alert_on_any_submitted_update.sql`

Queues submitted lead alert when an existing submitted lead gets important details updated.

Needed for guided flows because contact/vehicle/finish can arrive progressively.

### `20260427152000_prevent_funnel_lead_overwrite_by_visitor.sql`

Critical overwrite fix.

Replaces:

- `sync_lead_from_snapshot()`
- `sync_lead_from_event()`

New safe matching:

- match by same `normalized_phone`
- else match phone-empty partial row from same `session_id`
- do not match a phone-bearing lead by persistent `visitor_id`

This migration should be treated as required before scaling TikTok spend again.

## CRM Page

Route:

```text
/admin/leads
```

File:

```text
src/pages/AdminLeads.tsx
```

The CRM loads:

- `leads`
- `admin_session_rollups`
- `lead_notes`
- `lead_followups`
- `lead_status_history`
- `ad_platform_feedback`
- `crm_alert_queue`
- active `admin_users`

The list orders by:

```text
last_activity_at desc
```

This means a rewritten lead can look like "the top row changed" because the mutated row bubbles up.

## Lead Tasks Page

Route:

```text
/admin/leads/tasks
```

File:

```text
src/pages/AdminLeadTasks.tsx
```

This is the operational sales queue:

- unassigned leads
- first-touch leads
- overdue calls
- overdue follow-ups
- today/tomorrow follow-ups

## Telegram Function

File:

```text
supabase/functions/telegram-crm-alerts/index.ts
```

Environment variables:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `TELEGRAM_THREAD_ID`
- `CRM_ALERTS_SECRET`
- `TELEGRAM_WEBHOOK_SECRET`

Modes:

### `deliver_queue`

Requires internal secret header:

```text
x-crm-alerts-secret
```

### `deliver_queue_public`

Does not require internal secret.

This is needed for database-triggered queue delivery because the DB `net.http_post` setup does not currently include the secret header.

### `test`

Sends a test Telegram message.

Requires internal secret.

### `morning_digest`

Sends daily lead brief.

Requires internal secret.

### Telegram webhook commands

Supported commands:

- `/start`
- `/help`
- `/today`
- `/health`

Telegram webhook requests must include:

```text
x-telegram-bot-api-secret-token
```

matching `TELEGRAM_WEBHOOK_SECRET`.

## Telegram Queue Delivery

The edge function:

1. Reads pending queue rows.
2. Fetches lead/followup details.
3. Builds HTML Telegram message.
4. Sends message via Telegram API.
5. Marks queue row `sent`.
6. If partial lead became submitted before delay, marks `skipped`.
7. If Telegram fails, marks `failed` with `last_error`.

Important:

If live queue rows stay pending, first suspect stale edge function deployment.

## Meta Lead Intake

File:

```text
supabase/functions/meta-lead-intake/index.ts
```

Purpose:

- receives Meta lead webhook
- verifies signature
- fetches lead details from Graph API
- writes/upserts into `public.leads`
- queues Telegram alert
- has backfill/direct import capabilities

Do not confuse Meta lead intake with TikTok website funnel intake.

Meta leads are external lead forms.

TikTok leads are website-generated `lead_contact_snapshots` and `lead_events`.

## TikTok Pixel

File:

```text
src/lib/tiktok-pixel.ts
```

Default pixels:

```text
D7EDTI3C77UF89IGHIHG
D7EFCR3C77UF89IGHL5G
```

Functions:

- `initTikTokPixel()`
- `trackTikTokSubmitForm()`
- `trackTikTokEvent()`

Pixel rules:

- Do not load pixels repeatedly.
- `PageView` should fire once per page load.
- `SubmitForm` should fire after real lead submission.
- `Contact` can fire on WhatsApp click.
- Do not use messy auto-event GTM setup for this funnel unless intentionally reintroduced.

## Normal TikTok Funnel

File:

```text
src/pages/PpfDubaiQuote.tsx
```

Route:

```text
/ppf-tiktok-quote_2
```

This is the full page and current paid TikTok funnel.

Key behaviour:

- creates funnel context with variant `tiktok`
- tracks page view
- tracks section views and engagement
- tracks scroll depth
- captures contact after step one
- captures vehicle after step two
- captures submit snapshot on final submit
- fires TikTok `SubmitForm`
- can gate WhatsApp until details are captured
- opens WhatsApp in a new tab after deliberate click

Known risk:

Because this is a long page, TikTok users may bounce early or submit without enough education. Some leads are good, but many cold users need stronger guidance.

## Guided TikTok Funnel

File:

```text
src/pages/PpfTikTokGuidedQuote.tsx
```

Route:

```text
/ppf-tiktok-quote-guided
```

Purpose:

- reduce overwhelm
- make each step simple
- guide low-context TikTok traffic
- capture useful contact/vehicle/finish data
- still allow WhatsApp escape for high-intent users who hate forms

Current stages:

- `finish`
- `vehicle`
- `contact`
- `result`

Or phone-first:

- `contact`
- `vehicle`
- `finish`
- `result`

Current issue:

The result buttons link into `/ppf-tiktok-quote_2`, which loses the guided context and lands users in the old full funnel experience.

This should be replaced with a separate guided result/detail page.

## Testing Rules

Before pushing funnel changes:

1. Run build:

```powershell
npm.cmd run build
```

2. Test a unique phone submission in guided funnel.
3. Test a second unique phone in same browser.
4. Confirm two CRM rows exist.
5. Test same phone again.
6. Confirm it updates/attaches rather than duplicating.
7. Confirm Telegram queue is created.
8. Confirm Telegram queue sends after edge function deploy.
9. Confirm TikTok Events Manager sees `SubmitForm`.

## Emergency Rollback Guidance

If CRM overwriting returns:

1. Stop paid traffic temporarily or switch to instant WhatsApp only.
2. Check whether migration `20260427152000_prevent_funnel_lead_overwrite_by_visitor.sql` is deployed.
3. Check whether `captureLeadSnapshot()` still phone-scopes identity.
4. Check `/admin/leads` ordering by `last_activity_at`.
5. Inspect `lead_contact_snapshots` for different phones sharing the same raw visitor/session pattern.
6. Do not delete existing leads unless manually verified.

If Telegram fails:

1. Check `crm_alert_queue.delivery_status`.
2. If `pending`, edge dispatch likely not running.
3. If `failed`, inspect `last_error`.
4. Redeploy `telegram-crm-alerts`.
5. Confirm `/health` works.
6. Confirm `deliver_queue_public` works.
