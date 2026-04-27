# 2026-04-27 TikTok CRM System Handoff

This is the clean handoff for the current TikTok PPF funnel, CRM, Telegram, Supabase, and tracking work.

It exists because the working thread became too large and the next session needs a reliable map of what we built, what broke, and what must not be broken again.

## Current Priority

The immediate production risk is lead capture integrity.

We found a CRM overwrite issue where repeated submissions from the same browser/TikTok in-app browser could update the latest visible CRM row instead of creating a fresh lead. The likely cause was server-side CRM sync logic matching leads by persistent `visitor_id` / `session_id` instead of only matching submitted leads by phone.

The intended fix has two layers:

1. Frontend safety layer in `src/lib/funnel-analytics.ts`.
2. Permanent Supabase migration in `supabase/migrations/20260427152000_prevent_funnel_lead_overwrite_by_visitor.sql`.

The frontend build passed after the safety layer was added, but the Supabase migration and Telegram edge function deployment were blocked in this shell by missing Supabase auth.

## Important Current Files

- `src/App.tsx`
- `src/lib/funnel-analytics.ts`
- `src/lib/tiktok-pixel.ts`
- `src/pages/PpfDubaiQuote.tsx`
- `src/pages/PpfTikTokGuidedQuote.tsx`
- `src/pages/AdminLeads.tsx`
- `src/pages/AdminLeadTasks.tsx`
- `supabase/functions/telegram-crm-alerts/index.ts`
- `supabase/functions/meta-lead-intake/index.ts`
- `supabase/migrations/20260412190000_paid_funnel_crm_foundation.sql`
- `supabase/migrations/20260427143000_queue_submitted_lead_alert_on_any_submitted_update.sql`
- `supabase/migrations/20260427152000_prevent_funnel_lead_overwrite_by_visitor.sql`

## Live Routes

### Normal TikTok PPF Funnel

Current route:

```text
/ppf-tiktok-quote_2
```

Aliases:

```text
/ppf-tiktok-quote
/ppf-tiktok-quote-v2
```

These aliases preserve query string and hash, then redirect to `/ppf-tiktok-quote_2`.

The route renders:

```tsx
<PpfDubaiQuote variant="tiktok" />
```

This is the full landing page with:

- mobile-first hero
- trust stamps
- WhatsApp CTA
- quote modal
- calculator section
- scroll/section tracking
- TikTok pixel events
- CRM lead capture via Supabase snapshots

### Guided TikTok Funnel

Current route:

```text
/ppf-tiktok-quote-guided
```

This route renders:

```tsx
<PpfTikTokGuidedQuote />
```

The guided page is intended to be a low-distraction, TikTok-specific quote flow. It currently collects:

- finish preference
- vehicle details
- contact details

Flow can be switched with query param:

```text
?flow=phone_first
```

Without that param it defaults to an intent-first flow.

## What Broke

### CRM Lead Overwrite

Symptoms:

- submitting a TikTok/guided lead appeared to rewrite the top row in `/admin/leads`
- prior lead seemed to disappear or mutate
- most obvious during testing with repeated browser sessions

Likely cause:

- `sync_lead_from_snapshot()` matched by `normalized_phone`
- if no phone match, it fell back to matching the same `session_id` or `visitor_id`
- TikTok in-app browser, localStorage, and repeated testing can reuse `visitor_id`
- a new person/test with a different phone could therefore be merged into an existing CRM row

Why this is dangerous:

- paid traffic can produce multiple unique users through a browser context that reuses cached identifiers
- same-session partial captures are useful, but same-visitor lead merging is unsafe once a new phone is present

### Telegram Alerts Not Sending

Symptoms:

- CRM row created but no Telegram message
- queue shows pending alerts
- `/health` in Telegram may not respond if webhook deployment/secrets are stale

Observed cause in this session:

- the local `telegram-crm-alerts` function supports `deliver_queue_public`
- the deployed/live function rejected the same request with:

```json
{"error":"Unauthorized internal request"}
```

This means the live Supabase edge function is stale or not deployed with the latest code.

## Changes Already Prepared

### Frontend Lead Identity Safety

File:

```text
src/lib/funnel-analytics.ts
```

`captureLeadSnapshot()` now scopes `session_id` and `visitor_id` by phone when a phone exists.

Intent:

- a submitted phone creates a phone-specific identity
- different phone numbers stop colliding through the same persistent visitor id
- same-phone updates can still merge correctly through database `normalized_phone`

Important rule:

Do not remove this until the database migration has been deployed and verified. Even after the DB migration, keeping this safety layer is acceptable.

### Permanent Database Fix

File:

```text
supabase/migrations/20260427152000_prevent_funnel_lead_overwrite_by_visitor.sql
```

This replaces:

- `public.sync_lead_from_snapshot()`
- `public.sync_lead_from_event()`

New matching rules:

- if phone exists, match by same `normalized_phone`
- if no same phone exists, only merge into a phone-empty partial row from the same tab `session_id`
- no lead-with-phone should be matched by persistent `visitor_id`
- if no safe match exists, insert a new lead

This is the real server-side fix.

### Telegram Submitted Update Queueing

File:

```text
supabase/migrations/20260427143000_queue_submitted_lead_alert_on_any_submitted_update.sql
```

This adds a trigger so updates to an already-created lead can still queue a submitted lead alert when contact/vehicle/source data changes.

Intent:

- guided flows can create partial leads first
- later steps can submit/enrich the same lead
- Telegram should still notify when the lead becomes properly submitted

### Telegram Function Local Fix

File:

```text
supabase/functions/telegram-crm-alerts/index.ts
```

Local code now has:

```ts
let skipped = 0;
```

And returns:

```ts
{ processed, sent, failed, skipped }
```

This avoids a runtime issue in queue delivery logic.

The local function also supports:

```json
{"mode":"deliver_queue_public"}
```

This is required because database auto-dispatch cannot safely pass the internal secret header.

## Required Deploy Commands

Run these from an authenticated Supabase CLI terminal:

```powershell
npm.cmd exec -- supabase db push --project-ref lkikhrrzhddrdjfbbwjk
npm.cmd exec -- supabase functions deploy telegram-crm-alerts --no-verify-jwt --project-ref lkikhrrzhddrdjfbbwjk
```

If the CLI complains:

```powershell
supabase login
```

Or set:

```powershell
$env:SUPABASE_ACCESS_TOKEN="..."
```

If DB push asks for a password:

```powershell
$env:SUPABASE_DB_PASSWORD="..."
```

## Validation Checklist After Deploy

### CRM Capture

1. Open `/ppf-tiktok-quote-guided?test=crm-fresh-1`.
2. Submit a lead with phone A.
3. Confirm `/admin/leads` gets a new row.
4. Submit another lead from the same browser with phone B.
5. Confirm `/admin/leads` gets another new row and does not rewrite phone A.
6. Submit again with phone A.
7. Confirm it updates/attaches to the phone A lead rather than creating a duplicate.

### Telegram

1. Submit a lead.
2. Check `/admin/leads` alert queue panel.
3. Confirm queued alert changes from `pending` to `sent`.
4. Confirm Telegram receives the message.
5. Test bot command:

```text
/health
```

If queue stays pending, redeploy `telegram-crm-alerts` and check Supabase function logs.

### TikTok Pixel

Use TikTok Events Manager test events and confirm:

- `PageView`
- `SubmitForm`
- optional `Contact` when WhatsApp clicked

The page loads two TikTok pixels by default:

```text
D7EDTI3C77UF89IGHIHG
D7EFCR3C77UF89IGHL5G
```

Do not casually remove either while ads are active unless the campaign has been moved to a single verified pixel.

## Rules To Avoid Breaking Lead Capture Again

### CRM Merge Rules

- Never merge a submitted lead by `visitor_id`.
- Never merge a phone-bearing lead into another phone-bearing lead unless the normalized phone is the same.
- It is okay to merge a submitted phone into a phone-empty partial lead from the same short-lived `session_id`.
- Persistent `visitor_id` is useful for analytics, not for deciding CRM identity.

### Funnel Tracking Rules

- `lead_events` should use plain insert, not upsert.
- `external_event_id` should stay unique.
- Private PII can go into Supabase payloads, but do not send raw PII to pixels.
- TikTok `SubmitForm` should only fire when the user actually submits enough useful details.
- TikTok `Contact` can fire for WhatsApp clicks, but do not optimize the main campaign for `Contact` unless we intentionally want lower-friction WhatsApp traffic.

### Form Rules

- Phone must always include a country code.
- UAE `+971` is the default.
- Remove leading local `0`.
- Preserve vehicle make/model/year where possible.
- If a partial lead exists after contact step, later vehicle/finish submissions must enrich that same lead.

### TikTok Cache Rules

- TikTok in-app browser can cache aggressively.
- When launching a major funnel change, use a fresh URL path or query version.
- Query examples:

```text
?v=20260427
?utm_source=tiktok&utm_medium=paid_social&utm_campaign=...
```

- Do not rely on hard refresh inside TikTok app.

## Known Current UX Problem

The guided funnel result step currently sends users to `/ppf-tiktok-quote_2` for the full page/calculator.

This is causing a broken experience:

- cached guided information does not carry over cleanly
- calculator choices are not preselected
- if they click quote again, they can land in the old modal/form
- it mixes guided-funnel intent with the old full landing page flow

This should be fixed by building a separate guided result/detail page. See:

```text
docs/tiktok-guided-result-page-plan.md
```

## Recommended Next Session Order

1. Push/deploy frontend safety fix if not already live.
2. Deploy Supabase migrations.
3. Deploy `telegram-crm-alerts`.
4. Test CRM row creation with two different phone numbers from the same browser.
5. Test Telegram queue delivery.
6. Build the new guided result/detail page.
7. Switch guided step-four buttons to the new page.
8. Only then start another TikTok campaign/cache-bust URL test.
