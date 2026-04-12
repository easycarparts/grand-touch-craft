# Telegram CRM Alerts

Last updated: `2026-04-12` (Asia/Dubai)

This is the lightweight alert path for the CRM.

## What it does

- queues a `new_lead` alert whenever a lead is inserted
- queues a `followup_created` alert whenever an open follow-up is created
- supports a morning digest of open follow-ups due in the next 24 hours
- formats Telegram messages for mobile scanning with emoji sections and WhatsApp quick links
- supports Telegram commands:
  - `/start`
  - `/help`
  - `/today`

## Files

- queue + triggers:
  - [supabase/migrations/20260412221500_crm_telegram_alerts.sql](C:/Users/seane/Desktop/GTA%20Website/grand-touch-craft/supabase/migrations/20260412221500_crm_telegram_alerts.sql)
- delivery function:
  - [supabase/functions/telegram-crm-alerts/index.ts](C:/Users/seane/Desktop/GTA%20Website/grand-touch-craft/supabase/functions/telegram-crm-alerts/index.ts)

## Required Supabase function secrets

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- optional: `TELEGRAM_THREAD_ID`
- `CRM_ALERTS_SECRET`
- `TELEGRAM_WEBHOOK_SECRET`

## Suggested flow

1. Deploy the edge function.
2. Set the Telegram secrets.
3. Set Telegram webhook to the deployed function URL using `TELEGRAM_WEBHOOK_SECRET`.
4. Call the function on a short interval for queued alerts with `x-crm-alerts-secret`.
5. Call the same function once each morning with `{"mode":"morning_digest"}` and `x-crm-alerts-secret`.

## Daily brief contents

- live CRM counts:
  - open leads
  - new / uncontacted
  - warm leads
  - high-quality open leads
  - qualified or quoted but not closed
  - overdue follow-ups
  - due today
  - due tomorrow
- leads needing first contact
- overdue follow-ups
- follow-ups due today
- follow-ups due tomorrow

## Example invocations

Queued alerts:

```bash
POST /functions/v1/telegram-crm-alerts
x-crm-alerts-secret: <CRM_ALERTS_SECRET>
{
  "mode": "deliver_queue"
}
```

Morning digest:

```bash
POST /functions/v1/telegram-crm-alerts
x-crm-alerts-secret: <CRM_ALERTS_SECRET>
{
  "mode": "morning_digest"
}
```

## Important note

The browser should not send Telegram notifications directly.
Keep delivery in the edge function so tokens stay server-side and use the webhook + internal secret split for safety.
