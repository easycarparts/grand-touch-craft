# Meta Lead Intake

Last updated: `2026-04-12` (Asia/Dubai)

This is the server-side intake path for Meta instant-form leads into the CRM.

## What it does

- accepts Meta Page `leadgen` webhooks
- verifies webhook requests
- fetches the real lead payload from the Meta Graph API
- writes the lead into `public.leads`
- preserves Meta source metadata for CRM filtering and later feedback
- logs each sync attempt in `public.source_sync_runs`

## Files

- schema:
  - [supabase/migrations/20260412233000_meta_lead_intake.sql](C:/Users/seane/Desktop/GTA%20Website/grand-touch-craft/supabase/migrations/20260412233000_meta_lead_intake.sql)
- function:
  - [supabase/functions/meta-lead-intake/index.ts](C:/Users/seane/Desktop/GTA%20Website/grand-touch-craft/supabase/functions/meta-lead-intake/index.ts)

## Required Supabase function secrets

- `META_ACCESS_TOKEN`
- `META_APP_SECRET`
- `META_VERIFY_TOKEN`
- `META_SYNC_SECRET`

## Webhook URL

Use the deployed function URL as the Meta webhook callback:

`https://<project-ref>.functions.supabase.co/meta-lead-intake`

For this project:

`https://lkikhrrzhddrdjfbbwjk.functions.supabase.co/meta-lead-intake`

## Meta setup checklist

1. Create or use the Meta app that owns your lead integration.
2. Put the app in Live Mode before real lead retrieval.
3. Add the `Webhooks` product and subscribe to the `Page` object.
4. Use the callback URL above.
5. Use your `META_VERIFY_TOKEN` value as the verification token in Meta.
6. Subscribe the Page to the `leadgen` field.
7. Store a valid `META_ACCESS_TOKEN` and `META_APP_SECRET` in Supabase secrets.

## Manual retry / test path

The function also supports a protected manual sync mode.

Headers:

- `x-meta-sync-secret: <META_SYNC_SECRET>`

Body:

```json
{
  "leadgen_id": "<meta leadgen id>",
  "page_id": "<page id>",
  "form_id": "<form id>",
  "ad_id": "<ad id>"
}
```

## What lands in the CRM

- `lead_source_type = meta_lead_form`
- `source_platform = meta`
- `landing_page_variant = meta_lead_form`
- external Meta ids:
  - lead
  - page
  - form
  - ad
  - adset
  - campaign
- raw field data inside `import_metadata`
- sync logging in `source_sync_runs`

## Official docs to use during Meta setup

- Lead Ads retrieval:
  - [Meta Lead Ads Retrieving Guide](https://developers.facebook.com/docs/marketing-api/guides/lead-ads/retrieving/)
- Graph Webhooks:
  - [Meta Graph API Webhooks Getting Started](https://developers.facebook.com/docs/graph-api/webhooks/getting-started/)
