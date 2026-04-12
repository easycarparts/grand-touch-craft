# Session Handoff - 2026-04-12

This file is a working handoff for the next session. It captures what was changed, why it was changed, what is currently working, what still needs checking, and where the main risks are.

## Main Outcomes

- The CRM at `/admin/leads` was turned into a practical sales desk instead of a simple list.
- Meta lead intake was wired into the CRM and confirmed working.
- Telegram lead alerts were wired and confirmed working.
- Meta positive feedback send-back was wired and confirmed working for `Qualified`.
- The paid funnel dashboard now has proper shared date filtering near the top.
- Production-facing Meta pixel setup in `index.html` was updated to the correct live pixel.

## Important Meta Pixel Change

This was one of the most important production changes in the session.

### What changed

`index.html` was updated from the old Meta pixel:

- Old pixel / dataset ID: `665277526426486`

to the live website pixel:

- Current pixel / dataset ID: `2842874119378140`

### Where it was changed

- File: [C:\Users\seane\Desktop\GTA Website\grand-touch-craft\index.html](C:\Users\seane\Desktop\GTA Website\grand-touch-craft\index.html)

### Why it was changed

Earlier in the session, the website was still loading the old pixel ID in `index.html`, while the actual Events Manager / website Conversions API flow the user exposed later was using pixel ID `2842874119378140`.

That mismatch mattered because:

- the browser-side website tracking would have been attributed to the wrong Meta data source
- CRM feedback send-back was being configured against the real website pixel / dataset
- keeping the old pixel in HTML risked splitting data across two Meta sources

### Risk note

This change was made because the old pixel looked stale relative to the current live setup and the user later supplied the real pixel snippet with `2842874119378140`.

However, if the old pixel `665277526426486` was still intentionally used by another process, campaign, or legacy reporting flow, then removing it from `index.html` could affect that older flow.

### What to verify after deploy

In Meta Events Manager, confirm:

- page views are appearing under `2842874119378140`
- the website data source is the one intended for active campaigns
- no business-critical automation still depends on `665277526426486`

If there is a legacy dependency, decide whether:

- the old pixel should be restored in parallel
- or the old process should be migrated to the new pixel

## CRM / Admin Leads Work

Primary file:

- [C:\Users\seane\Desktop\GTA Website\grand-touch-craft\src\pages\AdminLeads.tsx](C:\Users\seane\Desktop\GTA Website\grand-touch-craft\src\pages\AdminLeads.tsx)

Main CRM changes completed:

- expandable lead rows
- row click expands the lead instead of relying on the old `Details` button
- dedicated follow-up board
- open-lead action scrolls to the target lead
- quick CRM actions
- notes
- activity log
- follow-up creation and completion
- WhatsApp links on phone numbers
- delete-lead confirmation modal
- manual lead creation restored as a popup dialog
- quoted amount editing inside CRM
- SLA tracking for first WhatsApp and first call
- better Meta feedback status display
- clearer lead overview layout
- latest internal note surfaced in overview
- better visual treatment for `High` quality and `Won` leads

### Manual Lead Popup

This was restored near the end of the session.

Current behavior:

- there is an `Add lead` button in the CRM inbox header
- clicking it opens the manual lead form in a popup
- the older inline/manual card approach was removed so it does not sit on the page permanently

### Notes

Notes are saved and visible. The layout was changed so the latest note is easier to see in the lead overview instead of only being buried in history/activity.

### Delete Lead

Delete now requires confirmation. It is no longer one-click destructive.

## Meta Lead Intake

Main function:

- [C:\Users\seane\Desktop\GTA Website\grand-touch-craft\supabase\functions\meta-lead-intake\index.ts](C:\Users\seane\Desktop\GTA Website\grand-touch-craft\supabase\functions\meta-lead-intake\index.ts)

Docs:

- [C:\Users\seane\Desktop\GTA Website\grand-touch-craft\docs\meta-lead-intake.md](C:\Users\seane\Desktop\GTA Website\grand-touch-craft\docs\meta-lead-intake.md)

Current state:

- Meta webhook intake is working
- Page subscription and `leadgen` subscription were set up
- real Meta leads can be inserted into the CRM

Field mapping work included support for real Meta form fields such as:

- `delivery_status`
- `protection_level`
- `your_car_(make-model-year)`
- `full_name`
- `phone`

These values were surfaced into the CRM so protection level and timing are visible.

## Telegram CRM Alerts

Main function:

- [C:\Users\seane\Desktop\GTA Website\grand-touch-craft\supabase\functions\telegram-crm-alerts\index.ts](C:\Users\seane\Desktop\GTA Website\grand-touch-craft\supabase\functions\telegram-crm-alerts\index.ts)

Docs:

- [C:\Users\seane\Desktop\GTA Website\grand-touch-craft\docs\telegram-crm-alerts.md](C:\Users\seane\Desktop\GTA Website\grand-touch-craft\docs\telegram-crm-alerts.md)

Current state:

- Telegram bot and group connection were established
- new lead alerts can send
- follow-up alerts can send
- queue dispatch automation was wired

CRM UI note:

- the large Telegram queue block was reduced so it no longer takes too much space in the CRM layout

## Meta Feedback Send-Back

Main function:

- [C:\Users\seane\Desktop\GTA Website\grand-touch-craft\supabase\functions\meta-feedback-dispatch\index.ts](C:\Users\seane\Desktop\GTA Website\grand-touch-craft\supabase\functions\meta-feedback-dispatch\index.ts)

Docs:

- [C:\Users\seane\Desktop\GTA Website\grand-touch-craft\docs\meta-feedback-dispatch.md](C:\Users\seane\Desktop\GTA Website\grand-touch-craft\docs\meta-feedback-dispatch.md)

### Final working state reached in this session

Positive-only phase 1 feedback is working.

Enabled feedback states:

- `Qualified`
- `Won`

Not currently sent back:

- `Lost`
- `Junk`
- negative or disqualification signals

### Important debugging history

This took several rounds to get right.

Key issues found during debugging:

1. Wrong Meta target confusion
- `GTS-2` app is for webhook / lead intake
- website Conversions API feedback had to target the website pixel / dataset instead

2. Wrong website dataset assumption
- an older dataset/pixel was initially assumed
- later corrected to the real website pixel `2842874119378140`

3. Invalid auth helper
- the CRM showed the real failure message:
  - `Invalid appsecret_proof provided in the API argument`
- `appsecret_proof` was removed from the feedback sender

4. Payload tuning
- sender payload was adjusted during debugging
- the final confirmed success came after aligning the sender correctly and removing the invalid proof

### Current truth

The user later retried from the CRM and got:

- `Qualified Lead: Sent`

That is the first confirmed successful end-to-end Meta feedback send in this session.

### Important behavior note

This is append-style positive feedback right now.

Meaning:

- sending `Qualified` works
- sending `Won` should work
- changing a lead later to `Lost` does not currently overwrite the earlier positive signal in Meta

That was intentional for phase 1.

## Response SLA Tracking

CRM now tracks:

- first WhatsApp contact time
- first call time

Business logic added:

- WhatsApp target window: `9:30 AM` to `8:00 PM` Dubai time
- Call target window: `9:30 AM` to `6:00 PM` Dubai time

Display behavior:

- cleaner labels like `Due tomorrow` instead of awkward overnight countdowns
- green when completed within SLA
- red when late

## Paid Funnel Dashboard

Main file:

- [C:\Users\seane\Desktop\GTA Website\grand-touch-craft\src\pages\AdminFunnelDashboard.tsx](C:\Users\seane\Desktop\GTA Website\grand-touch-craft\src\pages\AdminFunnelDashboard.tsx)

This was updated to add a proper top-level date filter bar above the summary cards.

Supported ranges:

- `All time`
- `Today`
- `Yesterday`
- `Last 7 days`
- `Last 30 days`
- `Specific dates`

Important implementation note:

- the new date filter is shared across the dashboard
- cards, charts, tables, and session detail all follow the same selected date range
- the older duplicate session-only date selector was removed to avoid conflicting filters

## Vercel / Production Readiness

Checklist doc:

- [C:\Users\seane\Desktop\GTA Website\grand-touch-craft\docs\vercel-production-checklist.md](C:\Users\seane\Desktop\GTA Website\grand-touch-craft\docs\vercel-production-checklist.md)

Production notes covered:

- Vercel client env vars
- Supabase Auth site URL
- Supabase redirect URLs for both localhost and live domain
- explanation that `supabase/config.toml` localhost settings are for local CLI/dev only

Live domain intended:

- `https://www.grandtouchauto.ae`
- `https://grandtouchauto.ae`

Local dev still expected to work alongside that.

## Known Remaining Risks / Follow-Up Items

These are not necessarily broken, but they are worth checking in the next session.

### 1. Old Meta pixel dependency risk

Need to confirm whether old pixel `665277526426486` was used by any live process outside this codebase.

### 2. Meta negative feedback signals

Not implemented yet.

Current recommendation was to:

- keep positive signals live first
- later decide whether `Lost` / `Not qualified` should be sent experimentally

### 3. Real-world Meta feedback validation

`Qualified` has been confirmed as sent successfully.

Still worth validating:

- `Won` end-to-end on a real Meta lead
- whether quoted amount should be included when available

### 4. Google form / Google Sheet consolidation

The CRM can handle multi-source leads, but a full automatic Google Sheet / Google Form importer was not finished in this session.

### 5. Daily Telegram digest schedule

Telegram delivery and queueing exist, but a separate daily digest scheduling pass may still need final polish depending on how the production scheduler is wired.

## Useful Files To Open First In The Next Session

- [C:\Users\seane\Desktop\GTA Website\grand-touch-craft\src\pages\AdminLeads.tsx](C:\Users\seane\Desktop\GTA Website\grand-touch-craft\src\pages\AdminLeads.tsx)
- [C:\Users\seane\Desktop\GTA Website\grand-touch-craft\src\pages\AdminFunnelDashboard.tsx](C:\Users\seane\Desktop\GTA Website\grand-touch-craft\src\pages\AdminFunnelDashboard.tsx)
- [C:\Users\seane\Desktop\GTA Website\grand-touch-craft\supabase\functions\meta-lead-intake\index.ts](C:\Users\seane\Desktop\GTA Website\grand-touch-craft\supabase\functions\meta-lead-intake\index.ts)
- [C:\Users\seane\Desktop\GTA Website\grand-touch-craft\supabase\functions\meta-feedback-dispatch\index.ts](C:\Users\seane\Desktop\GTA Website\grand-touch-craft\supabase\functions\meta-feedback-dispatch\index.ts)
- [C:\Users\seane\Desktop\GTA Website\grand-touch-craft\supabase\functions\telegram-crm-alerts\index.ts](C:\Users\seane\Desktop\GTA Website\grand-touch-craft\supabase\functions\telegram-crm-alerts\index.ts)
- [C:\Users\seane\Desktop\GTA Website\grand-touch-craft\index.html](C:\Users\seane\Desktop\GTA Website\grand-touch-craft\index.html)

## Quick Summary For The Next Session

If starting cold, the practical mental model is:

- `GTS-2 app` = Meta webhook / lead intake
- `2842874119378140` = website pixel / dataset for Conversions API feedback
- CRM is the main control center now
- Telegram is the operational notification layer
- Meta positive feedback is live
- the old pixel `665277526426486` was removed from `index.html`, so verify no legacy dependency was relying on it

