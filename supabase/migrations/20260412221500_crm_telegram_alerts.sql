create table if not exists public.crm_alert_queue (
  id uuid primary key default gen_random_uuid(),
  alert_type text not null check (alert_type in ('new_lead', 'followup_created', 'followup_morning_digest')),
  lead_id uuid references public.leads(id) on delete cascade,
  followup_id uuid references public.lead_followups(id) on delete cascade,
  title text not null,
  body text not null,
  payload jsonb not null default '{}'::jsonb,
  delivery_status text not null default 'pending' check (delivery_status in ('pending', 'sent', 'failed', 'skipped')),
  delivery_attempts integer not null default 0,
  last_error text,
  sent_at timestamptz,
  available_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists crm_alert_queue_status_idx
on public.crm_alert_queue (delivery_status, available_at, created_at desc);

create index if not exists crm_alert_queue_lead_idx
on public.crm_alert_queue (lead_id, created_at desc);

create trigger crm_alert_queue_set_updated_at
before update on public.crm_alert_queue
for each row
execute function public.set_updated_at();

create or replace function public.enqueue_new_lead_alert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
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

drop trigger if exists leads_enqueue_new_alert on public.leads;

create trigger leads_enqueue_new_alert
after insert on public.leads
for each row
execute function public.enqueue_new_lead_alert();

create or replace function public.enqueue_followup_created_alert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  lead_row public.leads%rowtype;
begin
  select *
  into lead_row
  from public.leads
  where id = new.lead_id;

  if new.status = 'open' then
    insert into public.crm_alert_queue (
      alert_type,
      lead_id,
      followup_id,
      title,
      body,
      payload
    )
    values (
      'followup_created',
      new.lead_id,
      new.id,
      concat('Follow-up created: ', coalesce(lead_row.full_name, lead_row.phone, 'Unnamed lead')),
      concat_ws(
        ' | ',
        concat('Due: ', coalesce(to_char(new.due_at at time zone 'Asia/Dubai', 'DD Mon YYYY HH24:MI'), 'No deadline')),
        concat('Channel: ', new.channel),
        coalesce(new.notes, 'No notes')
      ),
      jsonb_build_object(
        'lead_id', new.lead_id,
        'followup_id', new.id,
        'channel', new.channel,
        'due_at', new.due_at,
        'notes', new.notes
      )
    );
  end if;

  return new;
end;
$$;

drop trigger if exists lead_followups_enqueue_created_alert on public.lead_followups;

create trigger lead_followups_enqueue_created_alert
after insert on public.lead_followups
for each row
execute function public.enqueue_followup_created_alert();

alter table public.crm_alert_queue enable row level security;

create policy "admins can manage crm alert queue"
on public.crm_alert_queue
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
