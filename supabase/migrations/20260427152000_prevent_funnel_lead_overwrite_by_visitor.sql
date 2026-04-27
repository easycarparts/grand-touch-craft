-- Prevent paid-funnel submissions from overwriting an existing lead just because
-- the same browser/device visitor id is reused. A submitted phone should only
-- merge with the same phone, or with an unclaimed partial row from the same tab
-- session. This keeps repeated tests and TikTok in-app browser cache sessions
-- from rewriting the newest visible CRM lead.

create or replace function public.sync_lead_from_snapshot()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  matched_lead_id uuid;
  snapshot_attr jsonb := coalesce(new.attribution, '{}'::jsonb);
begin
  if new.normalized_phone is not null then
    select id
    into matched_lead_id
    from public.leads
    where normalized_phone = new.normalized_phone
    order by created_at asc
    limit 1;

    if matched_lead_id is null and new.session_id is not null then
      select id
      into matched_lead_id
      from public.leads
      where primary_session_id = new.session_id
        and normalized_phone is null
      order by created_at desc
      limit 1;
    end if;
  elsif new.session_id is not null then
    select id
    into matched_lead_id
    from public.leads
    where primary_session_id = new.session_id
    order by created_at desc
    limit 1;
  end if;

  if matched_lead_id is null then
    insert into public.leads (
      primary_session_id,
      visitor_id,
      full_name,
      phone,
      vehicle_make,
      vehicle_model,
      vehicle_year,
      source_platform,
      landing_page_variant,
      funnel_name,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_content,
      utm_term,
      gclid,
      fbclid,
      ttclid,
      first_captured_at,
      last_activity_at,
      submitted_at
    )
    values (
      new.session_id,
      new.visitor_id,
      new.full_name,
      new.phone,
      new.vehicle_make,
      new.vehicle_model,
      new.vehicle_year,
      new.source_platform,
      new.landing_page_variant,
      new.funnel_name,
      snapshot_attr ->> 'utm_source',
      snapshot_attr ->> 'utm_medium',
      snapshot_attr ->> 'utm_campaign',
      snapshot_attr ->> 'utm_content',
      snapshot_attr ->> 'utm_term',
      snapshot_attr ->> 'gclid',
      snapshot_attr ->> 'fbclid',
      snapshot_attr ->> 'ttclid',
      new.captured_at,
      new.captured_at,
      case when new.snapshot_type = 'submit' then new.captured_at else null end
    )
    returning id into matched_lead_id;
  else
    update public.leads
    set primary_session_id = coalesce(primary_session_id, new.session_id),
        visitor_id = coalesce(visitor_id, new.visitor_id),
        full_name = coalesce(nullif(new.full_name, ''), full_name),
        phone = coalesce(nullif(new.phone, ''), phone),
        vehicle_make = coalesce(nullif(new.vehicle_make, ''), vehicle_make),
        vehicle_model = coalesce(nullif(new.vehicle_model, ''), vehicle_model),
        vehicle_year = coalesce(nullif(new.vehicle_year, ''), vehicle_year),
        source_platform = coalesce(nullif(new.source_platform, ''), source_platform),
        landing_page_variant = coalesce(nullif(new.landing_page_variant, ''), landing_page_variant),
        funnel_name = coalesce(nullif(new.funnel_name, ''), funnel_name),
        utm_source = coalesce(nullif(snapshot_attr ->> 'utm_source', ''), utm_source),
        utm_medium = coalesce(nullif(snapshot_attr ->> 'utm_medium', ''), utm_medium),
        utm_campaign = coalesce(nullif(snapshot_attr ->> 'utm_campaign', ''), utm_campaign),
        utm_content = coalesce(nullif(snapshot_attr ->> 'utm_content', ''), utm_content),
        utm_term = coalesce(nullif(snapshot_attr ->> 'utm_term', ''), utm_term),
        gclid = coalesce(nullif(snapshot_attr ->> 'gclid', ''), gclid),
        fbclid = coalesce(nullif(snapshot_attr ->> 'fbclid', ''), fbclid),
        ttclid = coalesce(nullif(snapshot_attr ->> 'ttclid', ''), ttclid),
        first_captured_at = coalesce(first_captured_at, new.captured_at),
        last_activity_at = greatest(coalesce(last_activity_at, new.captured_at), new.captured_at),
        submitted_at = case
          when new.snapshot_type = 'submit' then coalesce(submitted_at, new.captured_at)
          else submitted_at
        end
    where id = matched_lead_id;
  end if;

  update public.lead_contact_snapshots
  set lead_id = matched_lead_id
  where id = new.id;

  update public.lead_events
  set lead_id = matched_lead_id
  where lead_id is null
    and session_id = new.session_id;

  return new;
end;
$$;

create or replace function public.sync_lead_from_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  matched_lead_id uuid;
  event_phone text := public.normalize_phone(new.payload ->> 'lead_phone');
  event_intent integer := nullif(new.payload ->> 'intent_score', '')::integer;
  event_estimate numeric := nullif(new.payload ->> 'estimate_value', '')::numeric;
begin
  if event_phone is not null then
    select id
    into matched_lead_id
    from public.leads
    where normalized_phone = event_phone
    order by created_at asc
    limit 1;

    if matched_lead_id is null and new.session_id is not null then
      select id
      into matched_lead_id
      from public.leads
      where primary_session_id = new.session_id
        and normalized_phone is null
      order by created_at desc
      limit 1;
    end if;
  elsif new.session_id is not null then
    select id
    into matched_lead_id
    from public.leads
    where primary_session_id = new.session_id
    order by created_at desc
    limit 1;
  end if;

  if matched_lead_id is not null then
    update public.lead_events
    set lead_id = matched_lead_id
    where id = new.id;

    update public.leads
    set last_activity_at = greatest(coalesce(last_activity_at, new.occurred_at), new.occurred_at),
        latest_quote_estimate = coalesce(event_estimate, latest_quote_estimate),
        intent_score = greatest(intent_score, coalesce(event_intent, intent_score)),
        whatsapp_clicked_at = case
          when new.event_name = 'whatsapp_click' then coalesce(whatsapp_clicked_at, new.occurred_at)
          else whatsapp_clicked_at
        end,
        submitted_at = case
          when new.event_name = 'lead_form_submitted' then coalesce(submitted_at, new.occurred_at)
          else submitted_at
        end
    where id = matched_lead_id;
  end if;

  return new;
end;
$$;
