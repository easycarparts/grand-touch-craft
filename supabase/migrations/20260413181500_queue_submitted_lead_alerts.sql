create or replace function public.enqueue_new_lead_alert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Only notify Telegram for leads that have actually been submitted.
  if new.submitted_at is null then
    return new;
  end if;

  if exists (
    select 1
    from public.crm_alert_queue
    where alert_type = 'new_lead'
      and lead_id = new.id
  ) then
    return new;
  end if;

  insert into public.crm_alert_queue (
    alert_type,
    lead_id,
    title,
    body,
    payload
  )
  values (
    'new_lead',
    new.id,
    concat('New lead: ', coalesce(new.full_name, new.phone, 'Unnamed lead')),
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
    )
  );

  return new;
end;
$$;

drop trigger if exists leads_enqueue_submitted_alert on public.leads;

create trigger leads_enqueue_submitted_alert
after update of submitted_at on public.leads
for each row
when (old.submitted_at is null and new.submitted_at is not null)
execute function public.enqueue_new_lead_alert();
