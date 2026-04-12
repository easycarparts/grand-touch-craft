# Lead Desk And Paid Funnel Plan

Last updated: `2026-04-12` (Asia/Dubai)

This document is the working plan for:

- improving paid lead quality across `Google`, `Meta`, and later `TikTok`
- adding better event tracking on the website
- deciding how many landing pages we actually need
- building a lightweight internal lead desk instead of a bloated CRM
- wiring `Supabase` so the repo can manage auth, tables, and migrations cleanly

This is written to be practical.
The goal is not “build a CRM”.
The goal is:

- see all leads in one place
- keep follow-up simple
- tag quality fast
- send quality signals back into ad platforms later

## 1. Core recommendation

### What we should do

Build a **lightweight internal lead desk** on top of `Supabase`, and use it as:

- a single lead inbox
- a simple follow-up board
- a quality-scoring layer
- a future feedback engine for `Meta`, `Google`, and `TikTok`

### What we should not do

Do **not**:

- jump straight into a heavy CRM like HubSpot unless we prove we need it
- keep living in Google Sheets long-term
- build four completely separate landing pages from scratch on day one

## 2. Landing page strategy

### Short answer

We probably do need **channel-specific routes**, but not four totally different pages.

### Best structure

Use **one shared core landing page component** with channel-specific wrappers / route variants.

Recommended routes:

- `/ppf-dubai-quote`
  - Google paid search
- `/ppf-meta-quote`
  - Meta paid social
- `/ppf-tiktok-quote`
  - TikTok paid social
- `/ppf-dubai`
  - organic / canonical marketing page

### Why this is better

This gives us:

- clean source attribution
- per-channel event grouping
- per-channel messaging differences when needed
- no duplication nightmare

### What should actually vary by channel

Keep the **same core page structure**, but allow these to vary:

- headline / hero framing
- CTA wording
- trust emphasis
- social-proof mix
- intro copy into the configurator
- source tags passed into tracking

### What should stay shared

- main layout
- calculator logic
- lead form logic
- tracking schema
- CRM / lead desk integration
- conversion event logic

### Critical recommendation

Do **not** build a separate organic page variant yet unless we really need one.

Recommended first pass:

- Google route
- Meta route
- TikTok route later
- keep organic on the canonical page

That is enough to get clarity without creating too much maintenance.

## 3. Event tracking recommendation

### Short answer

Yes, we need **more event tracking** on the website.

But the important part is:

- lots of **analytics events**
- only a few **optimization events**

We do **not** want to flood Meta or TikTok with weak conversion signals and teach them to chase low-intent actions.

## 4. Event hierarchy

### Analytics events

These are for internal visibility and lead-desk context.
They do not all need to be optimization goals.

Recommended analytics events:

- `lp_view`
- `lp_view_google`
- `lp_view_meta`
- `lp_view_tiktok`
- `hero_cta_click`
- `hero_whatsapp_click`
- `manual_video_play`
- `quote_config_started`
- `package_selected`
- `vehicle_size_selected`
- `finish_selected`
- `coverage_selected`
- `quote_unlocked`
- `lead_form_started`
- `lead_form_submitted`
- `whatsapp_click`
- `call_click`
- `quote_whatsapp_click`

Optional:

- `scroll_50`
- `scroll_75`

Only add scroll tracking if we will actually use it.

### Optimization events by platform

#### Google Ads

Primary:

- `Lead`
  - successful lead submit

Secondary:

- `WhatsApp click`
  - measurement only

Later:

- qualified lead
- booked job
- won sale

#### Meta

Primary:

- `Lead`
  - successful website form submit

Secondary:

- `Contact` or custom `WhatsAppClick`
  - measurement / audience / diagnostics only

Later:

- qualified lead
- booked job
- won job

#### TikTok

Primary:

- `SubmitForm`
  - or the platform’s closest website lead event

Secondary:

- `Contact`
  - WhatsApp click / inquiry signal

Later:

- qualified lead
- booked job
- won job

### Important rule

Do **not** optimize Meta primarily for WhatsApp clicks.

That will likely teach the system to find easy clickers, not serious buyers.

## 5. Proposed attribution structure

Every website lead should capture:

- source
- medium
- campaign
- adset / ad if available
- keyword if available
- gclid if present
- fbclid if present
- ttclid if present
- landing page variant

Recommended internal fields:

- `source_platform`
  - `google`
  - `meta`
  - `tiktok`
  - `organic`
  - `direct`
- `landing_page_variant`
  - `google`
  - `meta`
  - `tiktok`
  - `organic`
- `campaign_name`
- `adset_name`
- `ad_name`
- `keyword_text`
- `utm_source`
- `utm_medium`
- `utm_campaign`
- `utm_content`
- `utm_term`
- `gclid`
- `fbclid`
- `ttclid`

## 6. Lead desk scope

### This should be lightweight

The lead desk should feel like:

- one inbox
- one table
- one lead drawer
- fast updates

It should **not** feel like a traditional enterprise CRM.

### MVP screens

#### A. Leads table

Columns:

- created at
- customer name
- phone / WhatsApp
- car
- service
- source
- campaign
- quote range
- status
- quality
- next follow-up

#### B. Lead detail drawer

Fields:

- contact details
- vehicle details
- lead source metadata
- notes
- status
- quality label
- quote amount
- follow-up date
- event history

#### C. Simple filters

- all
- new
- follow-up today
- quoted
- booked
- won
- lost
- junk

### Statuses

Use exactly these to start:

- `new`
- `contacted`
- `quoted`
- `follow_up`
- `booked`
- `won`
- `lost`
- `junk`

### Quality labels

Use exactly these to start:

- `premium_fit`
- `price_shopper`
- `not_ready`
- `no_answer`
- `wrong_service`
- `duplicate`

## 7. Minimum viable data model

### Tables

Recommended initial tables:

- `profiles`
- `leads`
- `lead_events`
- `lead_notes`
- `lead_followups`
- `lead_status_history`
- `source_sync_runs`

### Table purposes

#### `profiles`

For auth users who can access the lead desk.

Suggested fields:

- `id`
- `email`
- `full_name`
- `role`
- `created_at`

#### `leads`

Main lead record.

Suggested fields:

- `id`
- `created_at`
- `updated_at`
- `full_name`
- `phone`
- `email`
- `whatsapp_number`
- `vehicle_make`
- `vehicle_model`
- `vehicle_year`
- `service_type`
- `source_platform`
- `landing_page_variant`
- `campaign_name`
- `adset_name`
- `ad_name`
- `keyword_text`
- `utm_source`
- `utm_medium`
- `utm_campaign`
- `utm_content`
- `utm_term`
- `gclid`
- `fbclid`
- `ttclid`
- `quote_estimate`
- `status`
- `quality_label`
- `owner_id`
- `next_follow_up_at`
- `closed_reason`

#### `lead_events`

Stores behavioral events from the site and later CRM feedback events.

Suggested fields:

- `id`
- `lead_id`
- `event_name`
- `event_source`
- `payload_json`
- `created_at`

#### `lead_notes`

- `id`
- `lead_id`
- `author_id`
- `note_body`
- `created_at`

#### `lead_followups`

- `id`
- `lead_id`
- `scheduled_for`
- `completed_at`
- `outcome`
- `created_by`

#### `lead_status_history`

- `id`
- `lead_id`
- `from_status`
- `to_status`
- `changed_by`
- `created_at`

#### `source_sync_runs`

For future ingestion jobs from Meta / Google / TikTok.

## 8. MVP workflow

### Website lead

1. User lands on channel-specific route.
2. Events fire with landing-page variant and source metadata.
3. Lead form submit creates:
   - `Lead` conversion event
   - record in `leads`
   - event row in `lead_events`
4. Sales team sees lead in lead desk.
5. Lead gets tagged:
   - `premium_fit`
   - `price_shopper`
   - etc.
6. Lead status moves through:
   - `new`
   - `contacted`
   - `quoted`
   - `booked`
   - `won` or `lost`

### Later feedback loop

Once this is working, we add:

- Meta Conversions API
- Google offline / enhanced conversion feedback if needed
- TikTok Events API later

And send back:

- qualified lead
- booked job
- won job

## 9. Meta and quality feedback strategy

### Critical point

Meta is likely optimizing for easy submits right now.
That is why low-friction lead forms can create:

- cheap leads
- poor intent
- heavy price shopping

### Better structure

Use:

- website conversion campaign
- primary event = `Lead`
- secondary event = `WhatsApp click` / `Contact`
- later = send back:
  - qualified lead
  - booked job
  - won job

The lead desk is the bridge that makes this possible.

## 10. Should we build this or use a third-party CRM?

### Recommendation

Build the lightweight lead desk.

### Why not a heavy CRM right now

Problems with HubSpot / Pipedrive style tools for this case:

- too much manual upkeep
- too many steps
- too many fields
- too much pipeline admin
- easy for the team to stop using it

### Why not stay on Google Sheets

- weak filtering
- poor attribution structure
- hard to automate quality feedback
- poor history / follow-up handling

### Why Supabase is the right base

Because it gives us:

- Postgres
- auth
- APIs
- migrations
- row-level security
- room to add server-side functions later

without building backend infrastructure from scratch.

## 11. Supabase access: how to give Codex CLI access

### Best setup

Use the official `Supabase CLI` in the repo and link it to the hosted project.

Official docs:

- CLI getting started: [Supabase CLI docs](https://supabase.com/docs/guides/cli/getting-started)
- local development and linking: [Supabase local development docs](https://supabase.com/docs/guides/local-development/overview)
- `supabase link` reference: [Supabase link reference](https://supabase.com/docs/reference/cli/supabase-init)

### What I need to be able to manage the project

To let me set up auth, tables, migrations, and schema changes through the repo, the local environment needs:

1. `Supabase CLI` available in this repo
2. repo initialized with `supabase/`
3. CLI logged in
4. local project linked to your hosted Supabase project
5. db password available for db pull / db push when needed

### Recommended command flow

From the repo root:

```powershell
npm install supabase --save-dev
npx supabase init
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
```

Then, if the remote project already has schema changes you want to pull down:

```powershell
npx supabase db pull
```

Later, when we add migrations locally and want to deploy them:

```powershell
npx supabase db push
```

### Where to get the project ref

It is in your Supabase dashboard URL:

```text
https://supabase.com/dashboard/project/<project-ref>
```

### What else may be needed

Some commands may prompt for the remote DB password.
The official CLI docs note that `supabase link`, `db pull`, and `db push` may require a linked project and, in some cases, the database password.

### Frontend env vars we will eventually need

For app access:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

These are safe for the frontend when used correctly.

### What should NOT go in the frontend

Do **not** expose:

- service role key
- database password
- personal access tokens

Those must stay server-side / local only.

## 12. Recommended implementation order

### Phase 1: foundation

- install and link Supabase CLI
- initialize `supabase/` in repo
- pull current schema if any
- define migrations

### Phase 2: auth and schema

- email/password auth for internal users
- create base tables
- add RLS policies

### Phase 3: website event capture

- add event tracking utilities
- add source-aware route tracking
- persist lead and event data into Supabase

### Phase 4: lead desk UI

- `/admin/leads`
- login page
- lead table
- lead drawer
- status / quality updates
- follow-up dates

### Phase 5: ad-platform feedback

- Meta CAPI
- later Google quality feedback
- later TikTok feedback

## 13. Decision summary

### Do we need more event tracking?

Yes.

### Do we need multiple landing pages?

Yes, but not four fully separate codebases.
Use one shared core with source-specific routes.

### Should we build our own CRM?

Not a full CRM.
But yes, we should build a lightweight lead desk.

### Should we use Supabase?

Yes.
It is the best fit for this repo and this workflow.

### What should happen next?

1. Set up Supabase CLI access in this repo
2. create auth + schema plan
3. implement lead table + event ingestion
4. add source-specific LP routes
5. add Meta/Google/TikTok feedback later
