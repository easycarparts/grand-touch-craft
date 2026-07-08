-- Tint booking confirmation links and weekly booking board.
-- Customer flow is token-based and deliberately low-friction: pick/confirm one
-- of three fixed daily tint slots, no signature and no payment collection.

create extension if not exists pgcrypto;

create or replace function public.generate_tint_booking_token()
returns text
language plpgsql
as $$
declare
  v_token text;
  v_exists boolean;
begin
  loop
    v_token := encode(extensions.gen_random_bytes(18), 'base64');
    v_token := replace(replace(v_token, '+', '-'), '/', '_');
    v_token := replace(v_token, '=', '');
    v_token := substring(v_token from 1 for 24);

    select exists(select 1 from public.tint_bookings where token = v_token)
    into v_exists;

    exit when not v_exists;
  end loop;

  return v_token;
end;
$$;

create or replace function public.tint_booking_slot_start(p_slot_date date, p_slot_key text)
returns timestamptz
language sql
immutable
as $$
  select (
    p_slot_date::timestamp +
    case p_slot_key
      when '09_12' then time '09:00'
      when '12_15' then time '12:00'
      when '15_18' then time '15:00'
      else time '09:00'
    end
  ) at time zone 'Asia/Dubai';
$$;

create or replace function public.tint_booking_slot_end(p_slot_date date, p_slot_key text)
returns timestamptz
language sql
immutable
as $$
  select (
    p_slot_date::timestamp +
    case p_slot_key
      when '09_12' then time '12:00'
      when '12_15' then time '15:00'
      when '15_18' then time '18:00'
      else time '12:00'
    end
  ) at time zone 'Asia/Dubai';
$$;

create table if not exists public.tint_bookings (
  id uuid primary key default gen_random_uuid(),
  token text unique not null default public.generate_tint_booking_token(),
  lead_id uuid references public.leads(id) on delete set null,
  status text not null default 'sent' check (status in ('sent', 'opened', 'confirmed', 'completed', 'cancelled')),
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  vehicle_make text,
  vehicle_model text,
  vehicle_year text,
  vehicle_label text,
  tint_package text not null default 'STEK Smart Ceramic',
  add_ons jsonb not null default '[]'::jsonb,
  quoted_price_aed numeric(12,2),
  slot_date date not null,
  slot_key text not null check (slot_key in ('09_12', '12_15', '15_18')),
  slot_start_at timestamptz not null,
  slot_end_at timestamptz not null,
  location_name text not null default 'Grand Touch Studio',
  location_address text not null default 'Dubai Investments Park 2, Dubai',
  location_maps_url text not null default 'https://maps.app.goo.gl/aT7PsGYHYv5kg8L77',
  customer_notes text,
  internal_notes text,
  customer_confirmed_name text,
  created_by uuid references public.admin_users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  opened_at timestamptz,
  confirmed_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz
);

create index if not exists tint_bookings_slot_idx on public.tint_bookings (slot_start_at, status);
create index if not exists tint_bookings_lead_idx on public.tint_bookings (lead_id);
create index if not exists tint_bookings_token_idx on public.tint_bookings (token);

create unique index if not exists tint_bookings_active_slot_unique
on public.tint_bookings (slot_start_at)
where status in ('sent', 'opened', 'confirmed');

drop trigger if exists tint_bookings_set_updated_at on public.tint_bookings;
create trigger tint_bookings_set_updated_at
before update on public.tint_bookings
for each row
execute function public.set_updated_at();

create or replace function public.prepare_tint_booking_row()
returns trigger
language plpgsql
as $$
begin
  new.vehicle_label = nullif(trim(concat_ws(' ', new.vehicle_year, new.vehicle_make, new.vehicle_model)), '');
  new.slot_start_at = public.tint_booking_slot_start(new.slot_date, new.slot_key);
  new.slot_end_at = public.tint_booking_slot_end(new.slot_date, new.slot_key);
  new.completed_at = case when new.status = 'completed' then coalesce(new.completed_at, timezone('utc', now())) else new.completed_at end;
  new.cancelled_at = case when new.status = 'cancelled' then coalesce(new.cancelled_at, timezone('utc', now())) else new.cancelled_at end;
  return new;
end;
$$;

drop trigger if exists tint_bookings_prepare_row on public.tint_bookings;
create trigger tint_bookings_prepare_row
before insert or update on public.tint_bookings
for each row
execute function public.prepare_tint_booking_row();

create table if not exists public.tint_booking_events (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.tint_bookings(id) on delete cascade,
  event_type text not null,
  actor text not null default 'admin' check (actor in ('admin', 'customer', 'system')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists tint_booking_events_booking_idx
on public.tint_booking_events (booking_id, created_at desc);

create or replace function public.admin_upsert_tint_booking(p_booking_id uuid, p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking_id uuid := p_booking_id;
  v_slot_date date := (p_payload ->> 'slot_date')::date;
  v_slot_key text := p_payload ->> 'slot_key';
  v_start_at timestamptz;
  v_result jsonb;
begin
  if not public.is_admin() then
    raise exception 'Only admins can manage tint bookings';
  end if;

  if v_slot_date is null or v_slot_key not in ('09_12', '12_15', '15_18') then
    raise exception 'Choose a valid tint slot';
  end if;

  v_start_at := public.tint_booking_slot_start(v_slot_date, v_slot_key);

  if exists (
    select 1
    from public.tint_bookings b
    where b.slot_start_at = v_start_at
      and b.status in ('sent', 'opened', 'confirmed')
      and (v_booking_id is null or b.id <> v_booking_id)
  ) then
    raise exception 'That tint slot is already booked';
  end if;

  if v_booking_id is null then
    insert into public.tint_bookings (
      lead_id,
      status,
      customer_name,
      customer_phone,
      customer_email,
      vehicle_make,
      vehicle_model,
      vehicle_year,
      tint_package,
      add_ons,
      quoted_price_aed,
      slot_date,
      slot_key,
      location_name,
      location_address,
      location_maps_url,
      customer_notes,
      internal_notes,
      created_by
    )
    values (
      nullif(p_payload ->> 'lead_id', '')::uuid,
      coalesce(nullif(p_payload ->> 'status', ''), 'sent'),
      nullif(trim(p_payload ->> 'customer_name'), ''),
      nullif(trim(p_payload ->> 'customer_phone'), ''),
      nullif(trim(p_payload ->> 'customer_email'), ''),
      nullif(trim(p_payload ->> 'vehicle_make'), ''),
      nullif(trim(p_payload ->> 'vehicle_model'), ''),
      nullif(trim(p_payload ->> 'vehicle_year'), ''),
      coalesce(nullif(trim(p_payload ->> 'tint_package'), ''), 'STEK Smart Ceramic'),
      coalesce(p_payload -> 'add_ons', '[]'::jsonb),
      nullif(p_payload ->> 'quoted_price_aed', '')::numeric,
      v_slot_date,
      v_slot_key,
      coalesce(nullif(trim(p_payload ->> 'location_name'), ''), 'Grand Touch Studio'),
      coalesce(nullif(trim(p_payload ->> 'location_address'), ''), 'Dubai Investments Park 2, Dubai'),
      coalesce(nullif(trim(p_payload ->> 'location_maps_url'), ''), 'https://maps.app.goo.gl/aT7PsGYHYv5kg8L77'),
      nullif(trim(p_payload ->> 'customer_notes'), ''),
      nullif(trim(p_payload ->> 'internal_notes'), ''),
      auth.uid()
    )
    returning id into v_booking_id;

    insert into public.tint_booking_events (booking_id, event_type, actor, metadata)
    values (v_booking_id, 'CREATED', 'admin', jsonb_build_object('created_from', coalesce(p_payload ->> 'created_from', 'admin')));
  else
    update public.tint_bookings
    set lead_id = nullif(p_payload ->> 'lead_id', '')::uuid,
        status = coalesce(nullif(p_payload ->> 'status', ''), status),
        customer_name = nullif(trim(p_payload ->> 'customer_name'), ''),
        customer_phone = nullif(trim(p_payload ->> 'customer_phone'), ''),
        customer_email = nullif(trim(p_payload ->> 'customer_email'), ''),
        vehicle_make = nullif(trim(p_payload ->> 'vehicle_make'), ''),
        vehicle_model = nullif(trim(p_payload ->> 'vehicle_model'), ''),
        vehicle_year = nullif(trim(p_payload ->> 'vehicle_year'), ''),
        tint_package = coalesce(nullif(trim(p_payload ->> 'tint_package'), ''), tint_package),
        add_ons = coalesce(p_payload -> 'add_ons', add_ons),
        quoted_price_aed = nullif(p_payload ->> 'quoted_price_aed', '')::numeric,
        slot_date = v_slot_date,
        slot_key = v_slot_key,
        location_name = coalesce(nullif(trim(p_payload ->> 'location_name'), ''), location_name),
        location_address = coalesce(nullif(trim(p_payload ->> 'location_address'), ''), location_address),
        location_maps_url = coalesce(nullif(trim(p_payload ->> 'location_maps_url'), ''), location_maps_url),
        customer_notes = nullif(trim(p_payload ->> 'customer_notes'), ''),
        internal_notes = nullif(trim(p_payload ->> 'internal_notes'), '')
    where id = v_booking_id;

    insert into public.tint_booking_events (booking_id, event_type, actor, metadata)
    values (v_booking_id, 'UPDATED', 'admin', '{}'::jsonb);
  end if;

  select to_jsonb(b.*)
  into v_result
  from public.tint_bookings b
  where b.id = v_booking_id;

  return v_result;
end;
$$;

create or replace function public.tint_booking_get_public(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.tint_bookings%rowtype;
begin
  select *
  into v_booking
  from public.tint_bookings
  where token = p_token
    and status <> 'cancelled';

  if v_booking.id is null then
    raise exception 'Booking not found';
  end if;

  if v_booking.status = 'sent' then
    update public.tint_bookings
    set status = 'opened',
        opened_at = coalesce(opened_at, timezone('utc', now()))
    where id = v_booking.id
    returning * into v_booking;

    insert into public.tint_booking_events (booking_id, event_type, actor, metadata)
    values (v_booking.id, 'OPENED', 'customer', '{}'::jsonb);
  end if;

  return jsonb_build_object(
    'id', v_booking.id,
    'token', v_booking.token,
    'status', v_booking.status,
    'customer_name', v_booking.customer_name,
    'customer_phone', v_booking.customer_phone,
    'customer_email', v_booking.customer_email,
    'vehicle_make', v_booking.vehicle_make,
    'vehicle_model', v_booking.vehicle_model,
    'vehicle_year', v_booking.vehicle_year,
    'vehicle_label', v_booking.vehicle_label,
    'tint_package', v_booking.tint_package,
    'add_ons', v_booking.add_ons,
    'quoted_price_aed', v_booking.quoted_price_aed,
    'slot_date', v_booking.slot_date,
    'slot_key', v_booking.slot_key,
    'slot_start_at', v_booking.slot_start_at,
    'slot_end_at', v_booking.slot_end_at,
    'location_name', v_booking.location_name,
    'location_address', v_booking.location_address,
    'location_maps_url', v_booking.location_maps_url,
    'customer_notes', v_booking.customer_notes,
    'customer_confirmed_name', v_booking.customer_confirmed_name,
    'confirmed_at', v_booking.confirmed_at
  );
end;
$$;

create or replace function public.tint_booking_get_availability(p_token text, p_slot_date date)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking_id uuid;
begin
  select id into v_booking_id
  from public.tint_bookings
  where token = p_token
    and status <> 'cancelled';

  if v_booking_id is null then
    raise exception 'Booking not found';
  end if;

  return (
    with slots(slot_key, label, start_label) as (
      values
        ('09_12', '9 AM - 12 PM', '09:00'),
        ('12_15', '12 PM - 3 PM', '12:00'),
        ('15_18', '3 PM - 6 PM', '15:00')
    )
    select jsonb_agg(
      jsonb_build_object(
        'slot_key', s.slot_key,
        'label', s.label,
        'start_label', s.start_label,
        'available', not exists (
          select 1
          from public.tint_bookings b
          where b.slot_start_at = public.tint_booking_slot_start(p_slot_date, s.slot_key)
            and b.status in ('sent', 'opened', 'confirmed')
            and b.id <> v_booking_id
        )
      )
      order by s.start_label
    )
    from slots s
  );
end;
$$;

create or replace function public.tint_booking_confirm(
  p_token text,
  p_customer_name text,
  p_slot_date date,
  p_slot_key text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.tint_bookings%rowtype;
  v_start_at timestamptz;
begin
  select *
  into v_booking
  from public.tint_bookings
  where token = p_token
    and status <> 'cancelled';

  if v_booking.id is null then
    raise exception 'Booking not found';
  end if;

  if v_booking.status = 'completed' then
    raise exception 'This booking has already been completed';
  end if;

  if p_customer_name is null or length(trim(p_customer_name)) < 2 then
    raise exception 'Enter your name to confirm';
  end if;

  if p_slot_date is null or p_slot_key not in ('09_12', '12_15', '15_18') then
    raise exception 'Choose a valid tint slot';
  end if;

  v_start_at := public.tint_booking_slot_start(p_slot_date, p_slot_key);

  if exists (
    select 1
    from public.tint_bookings b
    where b.slot_start_at = v_start_at
      and b.status in ('sent', 'opened', 'confirmed')
      and b.id <> v_booking.id
  ) then
    raise exception 'That tint slot has just been booked. Please choose another time.';
  end if;

  update public.tint_bookings
  set status = 'confirmed',
      customer_confirmed_name = trim(p_customer_name),
      confirmed_at = coalesce(confirmed_at, timezone('utc', now())),
      slot_date = p_slot_date,
      slot_key = p_slot_key
  where id = v_booking.id
  returning * into v_booking;

  insert into public.tint_booking_events (booking_id, event_type, actor, metadata)
  values (
    v_booking.id,
    'CONFIRMED',
    'customer',
    jsonb_build_object('slot_date', p_slot_date, 'slot_key', p_slot_key)
  );

  insert into public.crm_alert_queue (
    alert_type,
    lead_id,
    title,
    body,
    payload
  )
  values (
    'tint_booking_confirmed',
    v_booking.lead_id,
    concat('Tint booking confirmed: ', v_booking.customer_name),
    concat_ws(
      ' | ',
      coalesce(v_booking.customer_phone, 'No phone'),
      coalesce(v_booking.vehicle_label, 'No vehicle'),
      concat('Package: ', v_booking.tint_package),
      concat('Slot: ', to_char(v_booking.slot_start_at at time zone 'Asia/Dubai', 'Dy DD Mon HH12:MI AM'))
    ),
    jsonb_build_object(
      'booking_id', v_booking.id,
      'token', v_booking.token,
      'customer_name', v_booking.customer_name,
      'customer_phone', v_booking.customer_phone,
      'vehicle_label', v_booking.vehicle_label,
      'tint_package', v_booking.tint_package,
      'slot_start_at', v_booking.slot_start_at
    )
  );

  if v_booking.lead_id is not null then
    update public.leads
    set status = case when status in ('new', 'contacted') then 'qualified' else status end,
        last_activity_at = timezone('utc', now())
    where id = v_booking.lead_id;
  end if;

  return to_jsonb(v_booking);
end;
$$;

alter table public.tint_bookings enable row level security;
alter table public.tint_booking_events enable row level security;

drop policy if exists "admins can manage tint bookings" on public.tint_bookings;
create policy "admins can manage tint bookings"
on public.tint_bookings
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admins can manage tint booking events" on public.tint_booking_events;
create policy "admins can manage tint booking events"
on public.tint_booking_events
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

grant execute on function public.admin_upsert_tint_booking(uuid, jsonb) to anon, authenticated;
grant execute on function public.tint_booking_slot_start(date, text) to anon, authenticated;
grant execute on function public.tint_booking_slot_end(date, text) to anon, authenticated;
grant execute on function public.tint_booking_get_public(text) to anon, authenticated;
grant execute on function public.tint_booking_get_availability(text, date) to anon, authenticated;
grant execute on function public.tint_booking_confirm(text, text, date, text) to anon, authenticated;

alter table public.crm_alert_queue
drop constraint if exists crm_alert_queue_alert_type_check;

alter table public.crm_alert_queue
add constraint crm_alert_queue_alert_type_check
check (alert_type in ('new_lead', 'partial_lead', 'followup_created', 'followup_morning_digest', 'tint_booking_confirmed'));

create or replace function public.dispatch_crm_alert_queue()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.delivery_status <> 'pending' then
    return new;
  end if;

  if new.alert_type not in ('new_lead', 'partial_lead', 'followup_created', 'tint_booking_confirmed') then
    return new;
  end if;

  perform net.http_post(
    url := 'https://lkikhrrzhddrdjfbbwjk.functions.supabase.co/telegram-crm-alerts',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := '{"mode":"deliver_queue_public"}'::jsonb
  );

  return new;
end;
$$;
