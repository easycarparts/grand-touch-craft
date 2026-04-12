create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.normalize_phone(input text)
returns text
language sql
immutable
as $$
  select nullif(regexp_replace(coalesce(input, ''), '[^0-9+]', '', 'g'), '')
$$;

create table if not exists public.admin_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  role text not null default 'owner' check (role in ('owner', 'manager', 'sales')),
  is_active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger admin_users_set_updated_at
before update on public.admin_users
for each row
execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where id = auth.uid()
      and is_active = true
  )
$$;

create or replace function public.can_bootstrap_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (select 1 from public.admin_users)
$$;

create or replace function public.bootstrap_current_admin(display_name text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  current_email text := auth.jwt() ->> 'email';
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if exists (select 1 from public.admin_users where id = current_user_id) then
    return current_user_id;
  end if;

  if exists (select 1 from public.admin_users) then
    raise exception 'Bootstrap already completed';
  end if;

  insert into public.admin_users (id, email, full_name, role, is_active)
  values (current_user_id, coalesce(current_email, ''), display_name, 'owner', true);

  return current_user_id;
end;
$$;

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  primary_session_id text,
  visitor_id text,
  full_name text,
  phone text,
  normalized_phone text,
  email text,
  vehicle_make text,
  vehicle_model text,
  vehicle_year text,
  vehicle_label text,
  source_platform text,
  landing_page_variant text,
  funnel_name text,
  lead_source_type text not null default 'form' check (lead_source_type in ('form', 'whatsapp', 'manual')),
  status text not null default 'new' check (status in ('new', 'contacted', 'qualified', 'quoted', 'won', 'lost', 'junk')),
  quality_label text not null default 'unreviewed' check (quality_label in ('unreviewed', 'high', 'medium', 'low', 'spam')),
  intent_score integer not null default 0 check (intent_score >= 0 and intent_score <= 100),
  latest_quote_estimate numeric(12,2),
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  gclid text,
  fbclid text,
  ttclid text,
  notes_summary text,
  assigned_to uuid references public.admin_users(id) on delete set null,
  first_captured_at timestamptz,
  last_activity_at timestamptz,
  submitted_at timestamptz,
  whatsapp_clicked_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists leads_normalized_phone_idx on public.leads (normalized_phone);
create index if not exists leads_primary_session_idx on public.leads (primary_session_id);
create index if not exists leads_visitor_idx on public.leads (visitor_id);
create index if not exists leads_status_idx on public.leads (status);
create index if not exists leads_last_activity_idx on public.leads (last_activity_at desc);

create trigger leads_set_updated_at
before update on public.leads
for each row
execute function public.set_updated_at();

create or replace function public.prepare_lead_row()
returns trigger
language plpgsql
as $$
begin
  new.normalized_phone = public.normalize_phone(new.phone);
  new.vehicle_label = nullif(trim(concat_ws(' ', new.vehicle_year, new.vehicle_make, new.vehicle_model)), '');
  return new;
end;
$$;

create trigger leads_prepare_row
before insert or update on public.leads
for each row
execute function public.prepare_lead_row();

create table if not exists public.lead_contact_snapshots (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete set null,
  session_id text,
  visitor_id text,
  snapshot_type text not null check (snapshot_type in ('contact', 'vehicle', 'submit')),
  full_name text,
  phone text,
  normalized_phone text,
  vehicle_make text,
  vehicle_model text,
  vehicle_year text,
  vehicle_label text,
  source_platform text,
  landing_page_variant text,
  funnel_name text,
  attribution jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  captured_at timestamptz not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists lead_contact_snapshots_phone_idx on public.lead_contact_snapshots (normalized_phone);
create index if not exists lead_contact_snapshots_session_idx on public.lead_contact_snapshots (session_id);
create index if not exists lead_contact_snapshots_visitor_idx on public.lead_contact_snapshots (visitor_id);
create index if not exists lead_contact_snapshots_captured_idx on public.lead_contact_snapshots (captured_at desc);

create or replace function public.prepare_lead_snapshot_row()
returns trigger
language plpgsql
as $$
begin
  new.normalized_phone = public.normalize_phone(new.phone);
  new.vehicle_label = nullif(trim(concat_ws(' ', new.vehicle_year, new.vehicle_make, new.vehicle_model)), '');
  return new;
end;
$$;

create trigger lead_contact_snapshots_prepare_row
before insert or update on public.lead_contact_snapshots
for each row
execute function public.prepare_lead_snapshot_row();

create table if not exists public.lead_events (
  id uuid primary key default gen_random_uuid(),
  external_event_id text unique,
  lead_id uuid references public.leads(id) on delete set null,
  session_id text not null,
  visitor_id text,
  event_name text not null,
  funnel_name text not null,
  landing_page_variant text,
  source_platform text,
  pathname text,
  attribution jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists lead_events_session_idx on public.lead_events (session_id);
create index if not exists lead_events_lead_idx on public.lead_events (lead_id);
create index if not exists lead_events_event_name_idx on public.lead_events (event_name);
create index if not exists lead_events_occurred_idx on public.lead_events (occurred_at desc);

create table if not exists public.lead_notes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  author_admin_user_id uuid not null references public.admin_users(id) on delete restrict,
  body text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.lead_followups (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  assigned_to uuid references public.admin_users(id) on delete set null,
  status text not null default 'open' check (status in ('open', 'done', 'cancelled')),
  channel text not null default 'manual' check (channel in ('call', 'whatsapp', 'sms', 'email', 'manual')),
  due_at timestamptz,
  completed_at timestamptz,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger lead_followups_set_updated_at
before update on public.lead_followups
for each row
execute function public.set_updated_at();

create table if not exists public.lead_status_history (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  changed_by uuid references public.admin_users(id) on delete set null,
  from_status text,
  to_status text not null,
  reason text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.ad_platform_feedback (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  platform text not null check (platform in ('meta', 'google', 'tiktok')),
  feedback_type text not null check (feedback_type in ('qualified_lead', 'disqualified_lead', 'won_job', 'lost_job')),
  feedback_status text not null default 'pending' check (feedback_status in ('pending', 'sent', 'failed')),
  external_identifier_type text check (external_identifier_type in ('fbclid', 'gclid', 'ttclid', 'hashed_email', 'hashed_phone')),
  external_identifier_value text,
  payload jsonb not null default '{}'::jsonb,
  response_payload jsonb not null default '{}'::jsonb,
  sent_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger ad_platform_feedback_set_updated_at
before update on public.ad_platform_feedback
for each row
execute function public.set_updated_at();

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
  end if;

  if matched_lead_id is null and new.session_id is not null then
    select id
    into matched_lead_id
    from public.leads
    where primary_session_id = new.session_id
       or visitor_id = new.visitor_id
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
        visitor_id = coalesce(new.visitor_id, visitor_id),
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

create trigger lead_contact_snapshots_sync_lead
after insert on public.lead_contact_snapshots
for each row
execute function public.sync_lead_from_snapshot();

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
  end if;

  if matched_lead_id is null and new.session_id is not null then
    select id
    into matched_lead_id
    from public.leads
    where primary_session_id = new.session_id
       or visitor_id = new.visitor_id
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

create trigger lead_events_sync_lead
after insert on public.lead_events
for each row
execute function public.sync_lead_from_event();

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
    bool_or(e.event_name = 'whatsapp_click') as whatsapp_clicked,
    bool_or(e.event_name = 'quote_modal_opened') as quote_modal_opened,
    bool_or(e.event_name = 'quote_unlock_requested') as unlock_requested,
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
  coalesce(s.lead_name, l.full_name) as lead_name,
  coalesce(s.lead_phone, l.phone) as lead_phone,
  coalesce(s.vehicle_make, l.vehicle_make) as vehicle_make,
  coalesce(s.vehicle_model, l.vehicle_model) as vehicle_model,
  coalesce(s.vehicle_year, l.vehicle_year) as vehicle_year,
  coalesce(e.sections_viewed, array[]::text[]) as sections_viewed,
  e.faq_open_count,
  e.last_checkpoint_reason,
  greatest(e.intent_score, coalesce(l.intent_score, 0)) as intent_score,
  l.id as lead_id
from event_rows e
left join snapshot_rows s on s.session_id = e.session_id
left join public.leads l on l.primary_session_id = e.session_id;

alter table public.admin_users enable row level security;
alter table public.leads enable row level security;
alter table public.lead_events enable row level security;
alter table public.lead_contact_snapshots enable row level security;
alter table public.lead_notes enable row level security;
alter table public.lead_followups enable row level security;
alter table public.lead_status_history enable row level security;
alter table public.ad_platform_feedback enable row level security;

create policy "admin users can view their profile"
on public.admin_users
for select
to authenticated
using (auth.uid() = id or public.is_admin());

create policy "admins can manage admin users"
on public.admin_users
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "admins can read leads"
on public.leads
for select
to authenticated
using (public.is_admin());

create policy "admins can manage leads"
on public.leads
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "admins can read lead events"
on public.lead_events
for select
to authenticated
using (public.is_admin());

create policy "public can insert lead events"
on public.lead_events
for insert
to anon, authenticated
with check (true);

create policy "admins can manage lead events"
on public.lead_events
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "admins can read lead snapshots"
on public.lead_contact_snapshots
for select
to authenticated
using (public.is_admin());

create policy "public can insert lead snapshots"
on public.lead_contact_snapshots
for insert
to anon, authenticated
with check (true);

create policy "admins can manage lead snapshots"
on public.lead_contact_snapshots
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "admins can manage lead notes"
on public.lead_notes
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "admins can manage lead followups"
on public.lead_followups
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "admins can manage lead status history"
on public.lead_status_history
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "admins can manage ad platform feedback"
on public.ad_platform_feedback
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

grant execute on function public.can_bootstrap_admin() to anon, authenticated;
grant execute on function public.bootstrap_current_admin(text) to authenticated;
grant execute on function public.is_admin() to authenticated;
