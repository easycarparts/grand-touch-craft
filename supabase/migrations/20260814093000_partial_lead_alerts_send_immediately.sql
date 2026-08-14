-- Partial-lead alerts send the moment a number lands (Sean, 2026-08-14:
-- "anytime we get a number send it"). The old 2-minute hold existed so a
-- follow-through full submission could supersede the partial alert — but in
-- practice partials sat pending until some other action swept the queue.
-- Speed-to-lead wins: the occasional double alert is an accepted trade.
create or replace function public.enqueue_partial_lead_alert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.submitted_at is not null then
    return new;
  end if;

  if coalesce(nullif(new.full_name, ''), nullif(new.phone, '')) is null then
    return new;
  end if;

  if exists (
    select 1
    from public.crm_alert_queue
    where alert_type = 'partial_lead'
      and lead_id = new.id
      and delivery_status in ('pending', 'sent')
  ) then
    return new;
  end if;

  insert into public.crm_alert_queue (
    alert_type,
    lead_id,
    title,
    body,
    payload,
    available_at
  )
  values (
    'partial_lead',
    new.id,
    concat('Partial lead: ', coalesce(new.full_name, new.phone, 'Unnamed lead')),
    concat_ws(
      ' | ',
      coalesce(new.phone, 'No phone'),
      coalesce(new.vehicle_label, 'No vehicle yet'),
      concat('Source: ', coalesce(new.source_platform, new.lead_source_type, 'website')),
      concat('Status: ', new.status)
    ),
    jsonb_build_object(
      'lead_id', new.id,
      'full_name', new.full_name,
      'phone', new.phone,
      'vehicle_label', new.vehicle_label,
      'source_platform', new.source_platform,
      'lead_source_type', new.lead_source_type
    ),
    timezone('utc', now())
  );

  return new;
end;
$$;
