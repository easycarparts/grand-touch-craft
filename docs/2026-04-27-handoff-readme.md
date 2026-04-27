# 2026-04-27 Handoff README

Start here in the next session.

## Read In This Order

### 1. Urgent System Handoff

```text
docs/2026-04-27-tiktok-crm-system-handoff.md
```

Use this first. It explains:

- the current urgent CRM overwrite issue
- what broke
- what was prepared to fix it
- what must be deployed
- what not to break again
- current TikTok/guided funnel routes

### 2. CRM / Supabase / Telegram Architecture

```text
docs/crm-telegram-supabase-architecture.md
```

Use this before touching:

- lead capture
- `lead_contact_snapshots`
- `lead_events`
- `leads`
- `/admin/leads`
- Telegram alerts
- Supabase migrations
- edge functions

### 3. Guided Result Page Build Plan

```text
docs/tiktok-guided-result-page-plan.md
```

Use this for the next build task.

Main goal:

Do not send guided funnel users into the old `/ppf-tiktok-quote_2` page as the primary continuation.

Build a dedicated guided details page that remembers:

- name
- phone
- vehicle
- finish preference
- attribution

Recommended route:

```text
/ppf-tiktok-quote-guided/details
```

### 4. TikTok Ads And Funnel Strategy

```text
docs/tiktok-ads-and-funnel-strategy-handoff.md
```

Use this for campaign decisions and funnel strategy.

It covers:

- TikTok vs Meta vs Google PPC
- creative learnings
- Rolls/Cullinan issue
- WhatsApp friction
- guided funnel reasoning
- scaling rules

## Immediate Next Session Checklist

1. Confirm whether frontend changes are deployed.
2. Deploy Supabase migrations if not already deployed.
3. Deploy `telegram-crm-alerts`.
4. Test two different phone numbers from the same browser and confirm two CRM rows.
5. Test Telegram alert queue delivery.
6. Build `/ppf-tiktok-quote-guided/details`.
7. Update guided result buttons to use the new page.
8. Preserve UTMs and TikTok attribution across the guided flow.

## The Most Important Rule

Do not merge submitted CRM leads by persistent `visitor_id`.

Only merge phone-bearing leads by the same normalized phone, or merge a new phone into a phone-empty partial lead from the same short-lived session.
