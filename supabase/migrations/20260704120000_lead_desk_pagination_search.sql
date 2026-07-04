-- Lead desk: server-side pagination, whole-table search, task board support
create extension if not exists pg_trgm;

-- Canonical "lead received" timestamp (matches getLeadReceivedAt in the app)
alter table public.leads
  add column received_at timestamptz generated always as (
    coalesce(source_received_at, submitted_at, first_captured_at, created_at)
  ) stored;

-- Digits-only phone for robust phone search
alter table public.leads
  add column phone_digits text generated always as (
    regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g')
  ) stored;

create index if not exists idx_leads_received_at on public.leads (received_at desc);
create index if not exists idx_leads_last_activity_at on public.leads (last_activity_at desc);
create index if not exists idx_leads_status on public.leads (status);
create index if not exists idx_leads_full_name_trgm on public.leads using gin (full_name gin_trgm_ops);
create index if not exists idx_leads_email_trgm on public.leads using gin (email gin_trgm_ops);
create index if not exists idx_leads_vehicle_label_trgm on public.leads using gin (vehicle_label gin_trgm_ops);
create index if not exists idx_leads_phone_digits_trgm on public.leads using gin (phone_digits gin_trgm_ops);
create index if not exists idx_lead_followups_status_due on public.lead_followups (status, due_at);

-- Paginated, filtered, whole-table lead search.
-- Security invoker: RLS on public.leads still applies to the caller.
create or replace function public.admin_search_leads(
  p_search text default null,
  p_status text default 'active',
  p_quality text default null,
  p_source text default null,
  p_owner text default null,
  p_progress text default null,
  p_followup text default null,
  p_sort text default 'received',
  p_lead_id uuid default null,
  p_limit integer default 50,
  p_offset integer default 0
)
returns table (lead_data jsonb, total_count bigint)
language sql
stable
set search_path = public
as $$
  with classified as (
    select
      l.*,
      lower(concat_ws(' ', l.source_platform, l.utm_source, l.utm_medium, l.landing_page_variant, l.lead_source_type)) as source_text,
      case
        when l.lead_source_type = 'manual' then 'manual'
        when l.fbclid is not null
          or lower(concat_ws(' ', l.source_platform, l.utm_source, l.utm_medium, l.landing_page_variant, l.lead_source_type)) ~ '(meta|facebook|instagram)' then 'meta'
        when l.gclid is not null
          or lower(concat_ws(' ', l.source_platform, l.utm_source, l.utm_medium, l.landing_page_variant, l.lead_source_type)) like '%google%' then 'google'
        when l.ttclid is not null
          or lower(concat_ws(' ', l.source_platform, l.utm_source, l.utm_medium, l.landing_page_variant, l.lead_source_type)) ~ '(tiktok|tt)' then 'tiktok'
        else 'website'
      end as source_group
    from public.leads l
  ),
  params as (
    select
      nullif(trim(coalesce(p_search, '')), '') as search_text,
      nullif(regexp_replace(coalesce(p_search, ''), '[^0-9]', '', 'g'), '') as search_digits
  ),
  filtered as (
    select c.*
    from classified c, params p
    where
      (p_lead_id is null or c.id = p_lead_id)
      and (
        p_lead_id is not null
        or (
          -- status: default 'active' hides lost/junk, but search looks at everything
          (case
            when p_status is null or p_status = 'active' or p_status = 'all'
              then (p_status = 'all' or c.status not in ('lost', 'junk') or p.search_text is not null)
            else c.status::text = p_status
          end)
          and (p_quality is null or p_quality = 'all' or c.quality_label::text = p_quality)
          and (p_source is null or p_source = 'all' or c.source_group = p_source)
          and (
            p_owner is null or p_owner = 'all'
            or (p_owner = 'unassigned' and c.assigned_to is null)
            or c.assigned_to::text = p_owner
          )
          and (
            p_progress is null or p_progress = 'all'
            or (p_progress = 'submitted' and c.submitted_at is not null)
            or (p_progress = 'partial' and c.submitted_at is null)
          )
          and (
            p_followup is null or p_followup = 'all'
            or (p_followup = 'needs_attention' and exists (
                  select 1 from public.lead_followups f
                  where f.lead_id = c.id and f.status = 'open'))
            or (p_followup = 'overdue' and exists (
                  select 1 from public.lead_followups f
                  where f.lead_id = c.id and f.status = 'open' and f.due_at is not null and f.due_at < now()))
            or (p_followup = 'due_today' and exists (
                  select 1 from public.lead_followups f
                  where f.lead_id = c.id and f.status = 'open' and f.due_at is not null
                    and (f.due_at at time zone 'Asia/Dubai')::date = (now() at time zone 'Asia/Dubai')::date))
            or (p_followup = 'none' and not exists (
                  select 1 from public.lead_followups f
                  where f.lead_id = c.id))
          )
          and (
            p.search_text is null
            or c.full_name ilike '%' || p.search_text || '%'
            or c.email ilike '%' || p.search_text || '%'
            or c.vehicle_label ilike '%' || p.search_text || '%'
            or c.vehicle_make ilike '%' || p.search_text || '%'
            or c.vehicle_model ilike '%' || p.search_text || '%'
            or c.utm_campaign ilike '%' || p.search_text || '%'
            or c.external_campaign_name ilike '%' || p.search_text || '%'
            or c.external_ad_name ilike '%' || p.search_text || '%'
            or c.notes_summary ilike '%' || p.search_text || '%'
            or c.source_platform ilike '%' || p.search_text || '%'
            or c.landing_page_variant ilike '%' || p.search_text || '%'
            or c.status::text ilike '%' || p.search_text || '%'
            or c.quality_label::text ilike '%' || p.search_text || '%'
            or (
              p.search_digits is not null and length(p.search_digits) >= 4
              and (
                c.phone_digits like '%' || p.search_digits || '%'
                or (p.search_digits like '0%' and c.phone_digits like '%' || ltrim(p.search_digits, '0') || '%')
              )
            )
          )
        )
      )
  )
  select
    to_jsonb(f.*) - 'source_text' as lead_data,
    count(*) over () as total_count
  from filtered f
  order by
    case when p_sort = 'activity' then f.last_activity_at end desc nulls last,
    case when p_sort is null or p_sort <> 'activity' then f.received_at end desc nulls last,
    f.created_at desc
  limit greatest(coalesce(p_limit, 50), 1)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

-- Global summary counts for the Lead Desk header cards (previously computed
-- from only the 150 most recent leads).
create or replace function public.admin_lead_summary()
returns jsonb
language sql
stable
set search_path = public
as $$
  select jsonb_build_object(
    'new_leads', (
      select count(*) from public.leads l
      where l.status = 'new'
        and (coalesce(l.phone, '') <> '' or coalesce(l.email, '') <> '')
        and l.first_whatsapp_contacted_at is null
        and l.first_called_at is null
    ),
    'due_followups', (
      select count(*) from public.lead_followups f
      join public.leads l on l.id = f.lead_id
      where f.status = 'open'
        and l.status not in ('lost', 'junk')
        and f.due_at is not null
        and (
          f.due_at < now()
          or (f.due_at at time zone 'Asia/Dubai')::date = (now() at time zone 'Asia/Dubai')::date
        )
    ) + (
      select count(*) from public.leads l
      where l.status not in ('lost', 'junk')
        and l.status <> 'new'
        and coalesce(l.phone, '') <> ''
        and l.first_called_at is null
    ),
    'partial_leads', (
      select count(*) from public.leads l
      where l.status not in ('lost', 'junk') and l.submitted_at is null
    ),
    'meta_leads', (
      select count(*) from public.leads l
      where l.status not in ('lost', 'junk')
        and l.lead_source_type <> 'manual'
        and (
          l.fbclid is not null
          or lower(concat_ws(' ', l.source_platform, l.utm_source, l.utm_medium, l.landing_page_variant, l.lead_source_type)) ~ '(meta|facebook|instagram)'
        )
    ),
    'pending_meta_feedback', (
      select count(distinct f.lead_id) from public.ad_platform_feedback f
      join public.leads l on l.id = f.lead_id
      where f.platform = 'meta'
        and f.feedback_status = 'pending'
        and l.status not in ('lost', 'junk')
    )
  );
$$;
