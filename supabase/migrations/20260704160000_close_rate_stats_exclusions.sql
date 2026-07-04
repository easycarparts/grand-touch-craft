-- Close-rate stats v3: view-level exclusions.
-- p_exclude_sources: source groups to hide (e.g. '{tiktok}').
-- p_exclude_funnels: 'source:funnel' pairs to hide (e.g. '{meta:meta_lead_ads}').
-- Exclusions shape the whole data set (all sections incl. by_owner); nothing is deleted.
drop function if exists public.admin_close_rate_stats(timestamptz, timestamptz, text);

create or replace function public.admin_close_rate_stats(
  p_from timestamptz default null,
  p_to timestamptz default null,
  p_owner text default null,
  p_exclude_sources text[] default null,
  p_exclude_funnels text[] default null
)
returns jsonb
language sql
stable
set search_path = public
as $$
  with base as (
    select
      l.*,
      case
        when l.lead_source_type = 'manual' then 'manual'
        when l.fbclid is not null
          or lower(concat_ws(' ', l.source_platform, l.utm_source, l.utm_medium, l.landing_page_variant, l.lead_source_type)) ~ '(meta|facebook|instagram)' then 'meta'
        when l.gclid is not null
          or lower(concat_ws(' ', l.source_platform, l.utm_source, l.utm_medium, l.landing_page_variant, l.lead_source_type)) like '%google%' then 'google'
        when l.ttclid is not null
          or lower(concat_ws(' ', l.source_platform, l.utm_source, l.utm_medium, l.landing_page_variant, l.lead_source_type)) ~ '(tiktok|tt)' then 'tiktok'
        else 'website'
      end as source_group,
      coalesce(nullif(trim(coalesce(l.funnel_name, '')), ''), nullif(trim(coalesce(l.landing_page_variant, '')), ''), 'unknown') as funnel_key
    from public.leads l
    where l.status <> 'junk'
      and (p_from is null or l.received_at >= p_from)
      and (p_to is null or l.received_at < p_to)
  ),
  won_times as (
    select h.lead_id, min(h.created_at) as won_at
    from public.lead_status_history h
    where h.to_status = 'won'
    group by h.lead_id
  ),
  fu as (
    select f.lead_id, count(*) as n
    from public.lead_followups f
    group by f.lead_id
  ),
  enriched_all as (
    select b.*, coalesce(fu.n, 0) as followup_count, wt.won_at
    from base b
    left join fu on fu.lead_id = b.id
    left join won_times wt on wt.lead_id = b.id
    where (p_exclude_sources is null or not (b.source_group = any(p_exclude_sources)))
      and (p_exclude_funnels is null or not (b.source_group || ':' || b.funnel_key = any(p_exclude_funnels)))
  ),
  enriched as (
    select *
    from enriched_all e
    where p_owner is null or p_owner = 'all'
      or (p_owner = 'unassigned' and e.assigned_to is null)
      or e.assigned_to::text = p_owner
  )
  select jsonb_build_object(
    'overall', (
      select jsonb_build_object(
        'total', count(*),
        'won', count(*) filter (where status = 'won'),
        'lost', count(*) filter (where status = 'lost'),
        'open', count(*) filter (where status not in ('won', 'lost')),
        'revenue', coalesce(sum(latest_quote_estimate) filter (where status = 'won'), 0),
        'avg_deal', round(coalesce(avg(latest_quote_estimate) filter (where status = 'won'), 0), 2),
        'avg_followups_won', round(coalesce(avg(followup_count) filter (where status = 'won'), 0), 1),
        'avg_days_to_close', round(coalesce(avg(extract(epoch from (won_at - received_at)) / 86400.0)
          filter (where status = 'won' and won_at is not null and received_at is not null), 0)::numeric, 1)
      )
      from enriched
    ),
    'by_source', (
      select coalesce(jsonb_agg(to_jsonb(s) order by s.total desc), '[]'::jsonb)
      from (
        select
          source_group,
          count(*) as total,
          count(*) filter (where status = 'won') as won,
          count(*) filter (where status = 'lost') as lost,
          count(*) filter (where status not in ('won', 'lost')) as open,
          coalesce(sum(latest_quote_estimate) filter (where status = 'won'), 0) as revenue,
          round(coalesce(avg(followup_count) filter (where status = 'won'), 0), 1) as avg_followups_won
        from enriched
        group by source_group
      ) s
    ),
    'by_funnel', (
      select coalesce(jsonb_agg(to_jsonb(s) order by s.total desc), '[]'::jsonb)
      from (
        select
          funnel_key,
          source_group,
          count(*) as total,
          count(*) filter (where status = 'won') as won,
          count(*) filter (where status = 'lost') as lost,
          count(*) filter (where status not in ('won', 'lost')) as open,
          coalesce(sum(latest_quote_estimate) filter (where status = 'won'), 0) as revenue
        from enriched
        group by funnel_key, source_group
      ) s
    ),
    'by_owner', (
      select coalesce(jsonb_agg(to_jsonb(s) order by s.total desc), '[]'::jsonb)
      from (
        select
          coalesce(e.assigned_to::text, 'unassigned') as owner_id,
          coalesce(au.full_name, au.email, 'Unassigned') as owner_name,
          count(*) as total,
          count(*) filter (where e.status = 'won') as won,
          count(*) filter (where e.status = 'lost') as lost,
          count(*) filter (where e.status not in ('won', 'lost')) as open,
          coalesce(sum(e.latest_quote_estimate) filter (where e.status = 'won'), 0) as revenue,
          round(coalesce(avg(e.followup_count) filter (where e.status = 'won'), 0), 1) as avg_followups_won,
          round(coalesce(avg(extract(epoch from (e.won_at - e.received_at)) / 86400.0)
            filter (where e.status = 'won' and e.won_at is not null and e.received_at is not null), 0)::numeric, 1) as avg_days_to_close
        from enriched_all e
        left join public.admin_users au on au.id = e.assigned_to
        group by coalesce(e.assigned_to::text, 'unassigned'), coalesce(au.full_name, au.email, 'Unassigned')
      ) s
    ),
    'by_month', (
      select coalesce(jsonb_agg(to_jsonb(s) order by s.month), '[]'::jsonb)
      from (
        select
          to_char(date_trunc('month', received_at), 'YYYY-MM') as month,
          count(*) as total,
          count(*) filter (where status = 'won') as won,
          count(*) filter (where status = 'lost') as lost,
          coalesce(sum(latest_quote_estimate) filter (where status = 'won'), 0) as revenue
        from enriched
        where received_at is not null
        group by date_trunc('month', received_at)
      ) s
    )
  );
$$;
