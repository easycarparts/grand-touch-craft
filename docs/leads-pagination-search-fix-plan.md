# Leads Desk & Task Board Fix Plan — 2026-07-04

## Diagnosis (verified against Supabase project `lkikhrrzhddrdjfbbwjk`)

- **No data loss.** 721 leads in `public.leads` (2026-04-13 → 2026-07-04). Statuses: 605 contacted, 92 lost, 17 won, 4 quoted, 2 new, 1 qualified.
- **Why only 134 show:** `AdminLeads.tsx` fetches `.order("last_activity_at", desc).limit(150)`. The 150th lead's activity is ~June 20, so nothing older ever loads. Of those 150, 16 are lost/junk (hidden by default) → exactly 134.
- **Why search misses closed customers:** search is client-side over the 150 loaded rows only.
- **Why tasks "disappeared":** `useLeadTaskBoardData` (`src/lib/admin-lead-tasks.ts`) builds tasks from the same 150-lead fetch. **305 of 455 open follow-ups belong to leads outside that window and are invisible.** They exist in `lead_followups`, untouched.
- Sort is by `last_activity_at`, not lead-received — leads reshuffle whenever touched.

## Decisions (agreed with Sean)

- Task board: show ALL open tasks (all 455 follow-ups reappear; Sean will bulk-review stale ones).
- Default sort: lead received, newest first (toggle to last-activity available).
- Default page size: 50 (options 25 / 50 / 100).

## Phase 1 — Server-side pagination (AdminLeads.tsx)

- Replace `.limit(150)` with `.range(from, to)` + `count: "exact"` for true totals ("Showing 1–50 of 721").
- Page-size selector (25/50/100) + Prev/Next; persist choice in localStorage.
- Sort by `coalesce(source_received_at, submitted_at, first_captured_at, created_at)` desc by default; toggle for last-activity. (May need a computed column or order on `source_received_at` with nulls handling — verify against data.)
- Status filter moves server-side (`not.in.(lost,junk)` by default) so page counts are honest.
- Child data (notes, follow-ups, status history, feedback) already lead-scoped via `fetchLeadScopedRows` — now only for the 50 visible leads. Scope `admin_session_rollups` (currently flat `.limit(700)`) to visible leads' session ids/phones.

## Phase 2 — Whole-table server-side search

- Debounced (~300ms) search that queries the full table: `or(full_name.ilike, email.ilike, phone.ilike, vehicle_label.ilike, utm_campaign.ilike, external_campaign_name.ilike, external_ad_name.ilike)`.
- Normalize phone input (strip to digits, handle 05x / 971 variants) and match against normalized phone.
- Search results are paginated the same way; searching ignores the lost/junk hide so closed/won customers are findable.
- Migration: enable `pg_trgm`, add GIN trigram indexes on `full_name`, `phone`, `email`, `vehicle_label` for speed at scale.

## Phase 3 — Task board rebuilt on direct queries

- Stop deriving tasks from "newest 150 leads". Fetch instead:
  1. All `lead_followups` where `status = 'open'` (455 rows — trivial).
  2. Leads needing first touch / first call: `status = 'new'` OR (`first_called_at is null` AND recent — keep current SLA logic but query-driven).
  3. Then fetch only the leads referenced by those tasks.
- Result: a task can never vanish because its lead aged out of a fetch window.
- Keep existing priority-band sorting (`buildLeadTasks`) unchanged.

## Phase 4 — Indexes & verification

- Migration: index `leads(last_activity_at desc)`, `leads(status)`, `leads(source_received_at desc)`, `lead_followups(status, due_at)`, plus trigram indexes from Phase 2. Run `get_advisors` after.
- Verify: UI total equals SQL count; search finds an April won customer; task board count equals 455 open follow-ups + first-touch/call tasks; page load feels fast (only ~50 leads + scoped children per request).

## Files touched

- `src/pages/AdminLeads.tsx` — pagination, sort toggle, server-side search/filter.
- `src/lib/admin-lead-tasks.ts` — task-first data loading.
- `supabase/migrations/` — new migration for indexes + pg_trgm (via `apply_migration`).
- No schema/data changes to existing rows. No deletes.
