-- Ceramic booking confirmation links and one-bay-per-day booking board.

create extension if not exists pgcrypto;

create or replace function public.generate_ceramic_booking_token()
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

    select exists(select 1 from public.ceramic_bookings where token = v_token)
    into v_exists;

    exit when not v_exists;
  end loop;

  return v_token;
end;
$$;

create or replace function public.ceramic_booking_day_start(p_slot_date date)
returns timestamptz
language sql
immutable
as $$
  select (p_slot_date::timestamp + time '09:00') at time zone 'Asia/Dubai';
$$;

create or replace function public.ceramic_booking_day_end(p_slot_date date)
returns timestamptz
language sql
immutable
as $$
  select (p_slot_date::timestamp + time '18:00') at time zone 'Asia/Dubai';
$$;

create table if not exists public.ceramic_bookings (
  id uuid primary key default gen_random_uuid(),
  token text unique not null default public.generate_ceramic_booking_token(),
  lead_id uuid references public.leads(id) on delete set null,
  status text not null default 'sent' check (status in ('sent', 'opened', 'confirmed', 'completed', 'cancelled')),
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  vehicle_make text,
  vehicle_model text,
  vehicle_year text,
  vehicle_label text,
  package_name text not null default 'GYEON Correction + Ceramic',
  paint_condition text,
  add_ons jsonb not null default '[]'::jsonb,
  quoted_price_aed numeric(12,2),
  slot_date date not null,
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

create index if not exists ceramic_bookings_slot_idx on public.ceramic_bookings (slot_start_at, status);
create index if not exists ceramic_bookings_lead_idx on public.ceramic_bookings (lead_id);
create index if not exists ceramic_bookings_token_idx on public.ceramic_bookings (token);

create unique index if not exists ceramic_bookings_active_day_unique
on public.ceramic_bookings (slot_date)
where status in ('sent', 'opened', 'confirmed');

drop trigger if exists ceramic_bookings_set_updated_at on public.ceramic_bookings;
create trigger ceramic_bookings_set_updated_at
before update on public.ceramic_bookings
for each row
execute function public.set_updated_at();

create or replace function public.prepare_ceramic_booking_row()
returns trigger
language plpgsql
as $$
begin
  new.vehicle_label = nullif(trim(concat_ws(' ', new.vehicle_year, new.vehicle_make, new.vehicle_model)), '');
  new.slot_start_at = public.ceramic_booking_day_start(new.slot_date);
  new.slot_end_at = public.ceramic_booking_day_end(new.slot_date);
  new.completed_at = case when new.status = 'completed' then coalesce(new.completed_at, timezone('utc', now())) else new.completed_at end;
  new.cancelled_at = case when new.status = 'cancelled' then coalesce(new.cancelled_at, timezone('utc', now())) else new.cancelled_at end;
  return new;
end;
$$;

drop trigger if exists ceramic_bookings_prepare_row on public.ceramic_bookings;
create trigger ceramic_bookings_prepare_row
before insert or update on public.ceramic_bookings
for each row
execute function public.prepare_ceramic_booking_row();

create table if not exists public.ceramic_booking_events (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.ceramic_bookings(id) on delete cascade,
  event_type text not null,
  actor text not null default 'admin' check (actor in ('admin', 'customer', 'system')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists ceramic_booking_events_booking_idx
on public.ceramic_booking_events (booking_id, created_at desc);

create or replace function public.admin_upsert_ceramic_booking(p_booking_id uuid, p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking_id uuid := p_booking_id;
  v_slot_date date := (p_payload ->> 'slot_date')::date;
  v_result jsonb;
begin
  if not public.is_admin() then
    raise exception 'Only admins can manage ceramic bookings';
  end if;

  if v_slot_date is null then
    raise exception 'Choose a ceramic bay date';
  end if;

  if exists (
    select 1
    from public.ceramic_bookings b
    where b.slot_date = v_slot_date
      and b.status in ('sent', 'opened', 'confirmed')
      and (v_booking_id is null or b.id <> v_booking_id)
  ) then
    raise exception 'That ceramic bay day is already booked';
  end if;

  if v_booking_id is null then
    insert into public.ceramic_bookings (
      lead_id, status, customer_name, customer_phone, customer_email,
      vehicle_make, vehicle_model, vehicle_year, package_name, paint_condition,
      add_ons, quoted_price_aed, slot_date, location_name, location_address,
      location_maps_url, customer_notes, internal_notes, created_by
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
      coalesce(nullif(trim(p_payload ->> 'package_name'), ''), 'GYEON Correction + Ceramic'),
      nullif(trim(p_payload ->> 'paint_condition'), ''),
      coalesce(p_payload -> 'add_ons', '[]'::jsonb),
      nullif(p_payload ->> 'quoted_price_aed', '')::numeric,
      v_slot_date,
      coalesce(nullif(trim(p_payload ->> 'location_name'), ''), 'Grand Touch Studio'),
      coalesce(nullif(trim(p_payload ->> 'location_address'), ''), 'Dubai Investments Park 2, Dubai'),
      coalesce(nullif(trim(p_payload ->> 'location_maps_url'), ''), 'https://maps.app.goo.gl/aT7PsGYHYv5kg8L77'),
      nullif(trim(p_payload ->> 'customer_notes'), ''),
      nullif(trim(p_payload ->> 'internal_notes'), ''),
      auth.uid()
    )
    returning id into v_booking_id;

    insert into public.ceramic_booking_events (booking_id, event_type, actor, metadata)
    values (v_booking_id, 'CREATED', 'admin', jsonb_build_object('created_from', coalesce(p_payload ->> 'created_from', 'admin')));
  else
    update public.ceramic_bookings
    set lead_id = nullif(p_payload ->> 'lead_id', '')::uuid,
        status = coalesce(nullif(p_payload ->> 'status', ''), status),
        customer_name = nullif(trim(p_payload ->> 'customer_name'), ''),
        customer_phone = nullif(trim(p_payload ->> 'customer_phone'), ''),
        customer_email = nullif(trim(p_payload ->> 'customer_email'), ''),
        vehicle_make = nullif(trim(p_payload ->> 'vehicle_make'), ''),
        vehicle_model = nullif(trim(p_payload ->> 'vehicle_model'), ''),
        vehicle_year = nullif(trim(p_payload ->> 'vehicle_year'), ''),
        package_name = coalesce(nullif(trim(p_payload ->> 'package_name'), ''), package_name),
        paint_condition = nullif(trim(p_payload ->> 'paint_condition'), ''),
        add_ons = coalesce(p_payload -> 'add_ons', add_ons),
        quoted_price_aed = nullif(p_payload ->> 'quoted_price_aed', '')::numeric,
        slot_date = v_slot_date,
        location_name = coalesce(nullif(trim(p_payload ->> 'location_name'), ''), location_name),
        location_address = coalesce(nullif(trim(p_payload ->> 'location_address'), ''), location_address),
        location_maps_url = coalesce(nullif(trim(p_payload ->> 'location_maps_url'), ''), location_maps_url),
        customer_notes = nullif(trim(p_payload ->> 'customer_notes'), ''),
        internal_notes = nullif(trim(p_payload ->> 'internal_notes'), '')
    where id = v_booking_id;

    insert into public.ceramic_booking_events (booking_id, event_type, actor, metadata)
    values (v_booking_id, 'UPDATED', 'admin', '{}'::jsonb);
  end if;

  select to_jsonb(b.*) into v_result from public.ceramic_bookings b where b.id = v_booking_id;
  return v_result;
end;
$$;

create or replace function public.ceramic_booking_get_public(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.ceramic_bookings%rowtype;
begin
  select * into v_booking
  from public.ceramic_bookings
  where token = p_token and status <> 'cancelled';

  if v_booking.id is null then
    raise exception 'Booking not found';
  end if;

  if v_booking.status = 'sent' then
    update public.ceramic_bookings
    set status = 'opened', opened_at = coalesce(opened_at, timezone('utc', now()))
    where id = v_booking.id
    returning * into v_booking;

    insert into public.ceramic_booking_events (booking_id, event_type, actor, metadata)
    values (v_booking.id, 'OPENED', 'customer', '{}'::jsonb);
  end if;

  return to_jsonb(v_booking);
end;
$$;

create or replace function public.ceramic_booking_get_availability(p_token text, p_slot_date date)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking_id uuid;
begin
  select id into v_booking_id
  from public.ceramic_bookings
  where token = p_token and status <> 'cancelled';

  if v_booking_id is null then
    raise exception 'Booking not found';
  end if;

  return jsonb_build_array(
    jsonb_build_object(
      'slot_key', 'day',
      'label', 'Ceramic bay day',
      'start_label', '09:00',
      'available', not exists (
        select 1
        from public.ceramic_bookings b
        where b.slot_date = p_slot_date
          and b.status in ('sent', 'opened', 'confirmed')
          and b.id <> v_booking_id
      )
    )
  );
end;
$$;

create or replace function public.ceramic_booking_confirm(
  p_token text,
  p_customer_name text,
  p_slot_date date
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.ceramic_bookings%rowtype;
begin
  select * into v_booking
  from public.ceramic_bookings
  where token = p_token and status <> 'cancelled';

  if v_booking.id is null then
    raise exception 'Booking not found';
  end if;

  if v_booking.status = 'completed' then
    raise exception 'This booking has already been completed';
  end if;

  if p_customer_name is null or length(trim(p_customer_name)) < 2 then
    raise exception 'Enter your name to confirm';
  end if;

  if p_slot_date is null then
    raise exception 'Choose a ceramic bay date';
  end if;

  if exists (
    select 1
    from public.ceramic_bookings b
    where b.slot_date = p_slot_date
      and b.status in ('sent', 'opened', 'confirmed')
      and b.id <> v_booking.id
  ) then
    raise exception 'That ceramic bay day has just been booked. Please choose another date.';
  end if;

  update public.ceramic_bookings
  set status = 'confirmed',
      customer_confirmed_name = trim(p_customer_name),
      confirmed_at = coalesce(confirmed_at, timezone('utc', now())),
      slot_date = p_slot_date
  where id = v_booking.id
  returning * into v_booking;

  insert into public.ceramic_booking_events (booking_id, event_type, actor, metadata)
  values (v_booking.id, 'CONFIRMED', 'customer', jsonb_build_object('slot_date', p_slot_date));

  insert into public.crm_alert_queue (alert_type, lead_id, title, body, payload)
  values (
    'ceramic_booking_confirmed',
    v_booking.lead_id,
    concat('Ceramic booking confirmed: ', v_booking.customer_name),
    concat_ws(
      ' | ',
      coalesce(v_booking.customer_phone, 'No phone'),
      coalesce(v_booking.vehicle_label, 'No vehicle'),
      concat('Package: ', v_booking.package_name),
      concat('Bay day: ', to_char(v_booking.slot_start_at at time zone 'Asia/Dubai', 'Dy DD Mon'))
    ),
    jsonb_build_object(
      'booking_id', v_booking.id,
      'token', v_booking.token,
      'customer_name', v_booking.customer_name,
      'customer_phone', v_booking.customer_phone,
      'vehicle_label', v_booking.vehicle_label,
      'package_name', v_booking.package_name,
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

alter table public.ceramic_bookings enable row level security;
alter table public.ceramic_booking_events enable row level security;

drop policy if exists "admins can manage ceramic bookings" on public.ceramic_bookings;
create policy "admins can manage ceramic bookings"
on public.ceramic_bookings
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admins can manage ceramic booking events" on public.ceramic_booking_events;
create policy "admins can manage ceramic booking events"
on public.ceramic_booking_events
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

grant execute on function public.admin_upsert_ceramic_booking(uuid, jsonb) to anon, authenticated;
grant execute on function public.ceramic_booking_day_start(date) to anon, authenticated;
grant execute on function public.ceramic_booking_day_end(date) to anon, authenticated;
grant execute on function public.ceramic_booking_get_public(text) to anon, authenticated;
grant execute on function public.ceramic_booking_get_availability(text, date) to anon, authenticated;
grant execute on function public.ceramic_booking_confirm(text, text, date) to anon, authenticated;

alter table public.crm_alert_queue
drop constraint if exists crm_alert_queue_alert_type_check;

alter table public.crm_alert_queue
add constraint crm_alert_queue_alert_type_check
check (alert_type in ('new_lead', 'partial_lead', 'followup_created', 'followup_morning_digest', 'tint_booking_confirmed', 'ceramic_booking_confirmed'));

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

  if new.alert_type not in ('new_lead', 'partial_lead', 'followup_created', 'tint_booking_confirmed', 'ceramic_booking_confirmed') then
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
