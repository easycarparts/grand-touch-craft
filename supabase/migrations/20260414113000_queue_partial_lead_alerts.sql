alter table public.crm_alert_queue
drop constraint if exists crm_alert_queue_alert_type_check;

alter table public.crm_alert_queue
add constraint crm_alert_queue_alert_type_check
check (alert_type in ('new_lead', 'partial_lead', 'followup_created', 'followup_morning_digest'));

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
    timezone('utc', now()) + interval '2 minutes'
  );

  return new;
end;
$$;

drop trigger if exists leads_enqueue_partial_alert_on_insert on public.leads;
create trigger leads_enqueue_partial_alert_on_insert
after insert on public.leads
for each row
when (new.submitted_at is null and (new.full_name is not null or new.phone is not null))
execute function public.enqueue_partial_lead_alert();

drop trigger if exists leads_enqueue_partial_alert_on_contact_update on public.leads;
create trigger leads_enqueue_partial_alert_on_contact_update
after update of full_name, phone on public.leads
for each row
when (
  new.submitted_at is null
  and (
    old.full_name is distinct from new.full_name
    or old.phone is distinct from new.phone
  )
  and (new.full_name is not null or new.phone is not null)
)
execute function public.enqueue_partial_lead_alert();

