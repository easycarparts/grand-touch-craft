-- Bug: sync_lead_from_snapshot() inserted attribution values without nullif,
-- so missing click ids were stored as '' instead of NULL. Since source
-- classification checks `fbclid is not null`, every funnel lead (including
-- Google and TikTok) was classified as Meta. Fix data + trigger.
-- (Applied remotely on 2026-07-04; see remote migration fix_empty_string_click_ids.)

-- 1) Clean existing rows: empty-string attribution values become NULL.
update public.leads set
  gclid = nullif(gclid, ''),
  fbclid = nullif(fbclid, ''),
  ttclid = nullif(ttclid, ''),
  utm_source = nullif(utm_source, ''),
  utm_medium = nullif(utm_medium, ''),
  utm_campaign = nullif(utm_campaign, ''),
  utm_content = nullif(utm_content, ''),
  utm_term = nullif(utm_term, '')
where coalesce(gclid, 'x') = '' or coalesce(fbclid, 'x') = '' or coalesce(ttclid, 'x') = ''
   or coalesce(utm_source, 'x') = '' or coalesce(utm_medium, 'x') = '' or coalesce(utm_campaign, 'x') = ''
   or coalesce(utm_content, 'x') = '' or coalesce(utm_term, 'x') = '';

-- 2) Recreate the trigger function with nullif on the insert path
--    (the update path already had it). Identical otherwise to
--    20260427152000_prevent_funnel_lead_overwrite_by_visitor.sql.
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
      nullif(snapshot_attr ->> 'utm_source', ''),
      nullif(snapshot_attr ->> 'utm_medium', ''),
      nullif(snapshot_attr ->> 'utm_campaign', ''),
      nullif(snapshot_attr ->> 'utm_content', ''),
      nullif(snapshot_attr ->> 'utm_term', ''),
      nullif(snapshot_attr ->> 'gclid', ''),
      nullif(snapshot_attr ->> 'fbclid', ''),
      nullif(snapshot_attr ->> 'ttclid', ''),
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
