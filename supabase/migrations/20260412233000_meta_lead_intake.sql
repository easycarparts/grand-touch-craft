alter table public.leads
add column if not exists external_page_id text,
add column if not exists external_ad_id text,
add column if not exists external_adset_id text,
add column if not exists external_campaign_id text;

create unique index if not exists leads_external_source_unique_idx
on public.leads (lead_source_type, external_lead_id);

create table if not exists public.source_sync_runs (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('meta', 'google', 'tiktok')),
  source_kind text not null check (source_kind in ('webhook', 'poll', 'manual_retry')),
  status text not null check (status in ('received', 'processed', 'skipped', 'failed')),
  external_id text,
  lead_id uuid references public.leads(id) on delete set null,
  request_payload jsonb not null default '{}'::jsonb,
  response_payload jsonb not null default '{}'::jsonb,
  error_message text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists source_sync_runs_provider_status_idx
on public.source_sync_runs (provider, status, created_at desc);

create index if not exists source_sync_runs_external_id_idx
on public.source_sync_runs (external_id);

create trigger source_sync_runs_set_updated_at
before update on public.source_sync_runs
for each row
execute function public.set_updated_at();

alter table public.source_sync_runs enable row level security;

create policy "admins can manage source sync runs"
on public.source_sync_runs
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
