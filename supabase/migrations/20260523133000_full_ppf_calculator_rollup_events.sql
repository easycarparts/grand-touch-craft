create or replace view public.admin_session_rollups as
with event_rows as (
  select
    e.session_id,
    max(e.visitor_id) as visitor_id,
    min(e.occurred_at) as started_at,
    max(e.occurred_at) as ended_at,
    max(e.source_platform) as source_platform,
    max(e.landing_page_variant) as landing_page_variant,
    max(e.pathname) as pathname,
    max(e.funnel_name) as funnel_name,
    count(*) as events,
    bool_or(e.event_name = 'lead_form_submitted') as lead_submitted,
    bool_or(e.event_name in ('whatsapp_click', 'selected_price_whatsapp_click', 'general_whatsapp_click')) as whatsapp_clicked,
    bool_or(e.event_name = 'selected_price_whatsapp_click') as selected_price_whatsapp_clicked,
    bool_or(e.event_name = 'general_whatsapp_click') as general_whatsapp_clicked,
    bool_or(e.event_name = 'price_viewed') as price_viewed,
    bool_or(e.event_name in ('calculator_started', 'calculator_setup_changed', 'calculator_selection_changed')) as calculator_touched,
    bool_or(e.event_name = 'save_quote_started') as save_quote_started,
    bool_or(e.event_name in ('save_quote_submitted', 'lead_form_submitted')) as save_quote_submitted,
    max(e.payload ->> 'cta_location') filter (
      where e.event_name in ('whatsapp_click', 'selected_price_whatsapp_click', 'general_whatsapp_click')
        and e.payload ? 'cta_location'
    ) as last_whatsapp_cta_location,
    max(e.payload ->> 'message_type') filter (
      where e.event_name in ('whatsapp_click', 'selected_price_whatsapp_click', 'general_whatsapp_click')
        and e.payload ? 'message_type'
    ) as last_whatsapp_message_type,
    bool_or(e.event_name = 'quote_modal_opened') as quote_modal_opened,
    bool_or(e.event_name = 'quote_unlock_requested' or e.event_name = 'quote_unlocked') as unlock_requested,
    max(coalesce((e.payload ->> 'elapsed_ms')::bigint, 0)) as duration_ms,
    max(
      greatest(
        coalesce((e.payload ->> 'max_scroll_percent')::integer, 0),
        coalesce((e.payload ->> 'scroll_percent')::integer, 0),
        coalesce((e.payload ->> 'current_scroll_percent')::integer, 0)
      )
    ) as max_scroll_percent,
    max(
      greatest(
        coalesce((e.payload ->> 'progress_percent')::integer, 0),
        coalesce((e.payload ->> 'max_progress_percent')::integer, 0)
      )
    ) as video_max_progress_percent,
    max(e.payload ->> 'package_name') filter (where e.payload ? 'package_name') as package_name,
    max(coalesce(e.payload ->> 'vehicle_size', e.payload ->> 'size')) filter (
      where e.payload ? 'vehicle_size' or e.payload ? 'size'
    ) as vehicle_size,
    max(e.payload ->> 'finish') filter (where e.payload ? 'finish') as finish,
    max(e.payload ->> 'coverage') filter (where e.payload ? 'coverage') as coverage,
    max((e.payload ->> 'estimate_value')::numeric) filter (where e.payload ? 'estimate_value') as quote_estimate,
    max(e.payload ->> 'lead_name') filter (where e.payload ? 'lead_name') as event_lead_name,
    max(e.payload ->> 'lead_phone') filter (where e.payload ? 'lead_phone') as event_lead_phone,
    max(e.payload ->> 'vehicle_make') filter (where e.payload ? 'vehicle_make') as event_vehicle_make,
    max(e.payload ->> 'vehicle_model') filter (where e.payload ? 'vehicle_model') as event_vehicle_model,
    max(e.payload ->> 'vehicle_year') filter (where e.payload ? 'vehicle_year') as event_vehicle_year,
    array_remove(array_agg(distinct e.payload ->> 'section_name') filter (where e.event_name = 'section_view'), null) as sections_viewed,
    count(*) filter (where e.event_name = 'faq_opened') as faq_open_count,
    max(e.payload ->> 'checkpoint_reason') filter (where e.event_name = 'page_checkpoint') as last_checkpoint_reason,
    max(coalesce((e.payload ->> 'intent_score')::integer, 0)) as intent_score
  from public.lead_events e
  group by e.session_id
),
snapshot_rows as (
  select
    s.session_id,
    max(s.full_name) filter (where s.full_name is not null and s.full_name <> '') as lead_name,
    max(s.phone) filter (where s.phone is not null and s.phone <> '') as lead_phone,
    max(s.vehicle_make) filter (where s.vehicle_make is not null and s.vehicle_make <> '') as vehicle_make,
    max(s.vehicle_model) filter (where s.vehicle_model is not null and s.vehicle_model <> '') as vehicle_model,
    max(s.vehicle_year) filter (where s.vehicle_year is not null and s.vehicle_year <> '') as vehicle_year
  from public.lead_contact_snapshots s
  group by s.session_id
)
select
  e.session_id,
  e.visitor_id,
  e.started_at,
  e.ended_at,
  e.source_platform,
  e.landing_page_variant,
  e.pathname,
  e.funnel_name,
  e.events,
  e.lead_submitted,
  e.whatsapp_clicked,
  e.quote_modal_opened,
  e.unlock_requested,
  e.duration_ms,
  e.max_scroll_percent,
  e.video_max_progress_percent,
  e.package_name,
  e.vehicle_size,
  e.finish,
  e.coverage,
  e.quote_estimate,
  coalesce(s.lead_name, e.event_lead_name, l.full_name) as lead_name,
  coalesce(s.lead_phone, e.event_lead_phone, l.phone) as lead_phone,
  coalesce(s.vehicle_make, e.event_vehicle_make, l.vehicle_make) as vehicle_make,
  coalesce(s.vehicle_model, e.event_vehicle_model, l.vehicle_model) as vehicle_model,
  coalesce(s.vehicle_year, e.event_vehicle_year, l.vehicle_year) as vehicle_year,
  coalesce(e.sections_viewed, array[]::text[]) as sections_viewed,
  e.faq_open_count,
  e.last_checkpoint_reason,
  greatest(e.intent_score, coalesce(l.intent_score, 0)) as intent_score,
  l.id as lead_id,
  e.selected_price_whatsapp_clicked,
  e.general_whatsapp_clicked,
  e.price_viewed,
  e.calculator_touched,
  e.save_quote_started,
  e.save_quote_submitted,
  e.last_whatsapp_cta_location,
  e.last_whatsapp_message_type
from event_rows e
left join snapshot_rows s on s.session_id = e.session_id
left join lateral (
  select l.*
  from public.leads l
  where l.primary_session_id = e.session_id
    or (
      public.normalize_phone(coalesce(s.lead_phone, e.event_lead_phone)) is not null
      and l.normalized_phone = public.normalize_phone(coalesce(s.lead_phone, e.event_lead_phone))
    )
  order by
    case when l.primary_session_id = e.session_id then 0 else 1 end,
    l.created_at asc
  limit 1
) l on true;
