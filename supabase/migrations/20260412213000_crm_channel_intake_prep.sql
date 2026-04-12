alter table public.leads
drop constraint if exists leads_lead_source_type_check;

alter table public.leads
add constraint leads_lead_source_type_check
check (
  lead_source_type in (
    'form',
    'whatsapp',
    'manual',
    'meta_lead_form',
    'tiktok_lead_form',
    'google_sheet_import',
    'api_import'
  )
);

alter table public.leads
add column if not exists external_lead_id text,
add column if not exists external_form_id text,
add column if not exists external_campaign_name text,
add column if not exists external_adset_name text,
add column if not exists external_ad_name text,
add column if not exists source_received_at timestamptz,
add column if not exists import_metadata jsonb not null default '{}'::jsonb;

create index if not exists leads_external_lead_id_idx on public.leads (external_lead_id);
create index if not exists leads_source_received_at_idx on public.leads (source_received_at desc);
