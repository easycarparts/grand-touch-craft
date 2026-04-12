with seeded_lead as (
  insert into public.leads (
    full_name,
    phone,
    vehicle_model,
    source_platform,
    landing_page_variant,
    funnel_name,
    lead_source_type,
    status,
    quality_label,
    notes_summary,
    external_lead_id,
    external_form_id,
    external_page_id,
    external_ad_id,
    external_adset_id,
    external_campaign_id,
    external_ad_name,
    external_adset_name,
    external_campaign_name,
    first_captured_at,
    source_received_at,
    submitted_at,
    last_activity_at,
    import_metadata
  )
  values (
    'Mohammad Alhayali',
    '+971526477611',
    'Lynk & Co 900',
    'ig',
    'meta_lead_form',
    'meta_lead_ads',
    'meta_lead_form',
    'new',
    'unreviewed',
    'Package: Stek Premium (8.5k+) | Timing: Delivery Soon',
    '1433576067915825',
    '4412975612322901',
    '815039368367475',
    '120242255837630380',
    '120242255837620380',
    '120240616377510380',
    'Jetour Ad01',
    'G700 Ads - Qauli Form',
    'Sean Test Campaign',
    '2026-04-12T04:22:06-05:00'::timestamptz,
    '2026-04-12T04:22:06-05:00'::timestamptz,
    '2026-04-12T04:22:06-05:00'::timestamptz,
    timezone('utc', now()),
    jsonb_build_object(
      'provider', 'meta',
      'platform', 'ig',
      'is_organic', false,
      'delivery_status', 'delivery_soon',
      'protection_level', 'stek_premium_(8.5k+)',
      'combined_vehicle', 'Lynk & Co 900',
      'field_data', jsonb_build_object(
        'delivery_status', jsonb_build_array('delivery_soon'),
        'protection_level', jsonb_build_array('stek_premium_(8.5k+)'),
        'your_car_(make-model-year)', jsonb_build_array('Lynk & Co 900'),
        'full_name', jsonb_build_array('Mohammad Alhayali'),
        'phone', jsonb_build_array('+971526477611')
      )
    )
  )
  on conflict (lead_source_type, external_lead_id)
  do update set
    full_name = excluded.full_name,
    phone = excluded.phone,
    vehicle_model = excluded.vehicle_model,
    source_platform = excluded.source_platform,
    landing_page_variant = excluded.landing_page_variant,
    funnel_name = excluded.funnel_name,
    notes_summary = excluded.notes_summary,
    external_form_id = excluded.external_form_id,
    external_page_id = excluded.external_page_id,
    external_ad_id = excluded.external_ad_id,
    external_adset_id = excluded.external_adset_id,
    external_campaign_id = excluded.external_campaign_id,
    external_ad_name = excluded.external_ad_name,
    external_adset_name = excluded.external_adset_name,
    external_campaign_name = excluded.external_campaign_name,
    source_received_at = excluded.source_received_at,
    submitted_at = excluded.submitted_at,
    last_activity_at = excluded.last_activity_at,
    import_metadata = excluded.import_metadata
  returning id
)
insert into public.crm_alert_queue (
  alert_type,
  lead_id,
  title,
  body,
  payload,
  delivery_status,
  delivery_attempts,
  available_at
)
select
  'new_lead',
  id,
  'Preview Meta lead imported',
  'Seeded preview lead for CRM layout review.',
  jsonb_build_object('seeded_by_migration', true),
  'pending',
  0,
  timezone('utc', now())
from seeded_lead;
