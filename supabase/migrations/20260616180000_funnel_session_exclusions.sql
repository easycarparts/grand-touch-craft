create table if not exists public.funnel_session_exclusions (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  landing_page_variant text not null default '',
  pathname text not null default '',
  reason text,
  excluded_by uuid references public.admin_users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (session_id, landing_page_variant, pathname)
);

create index if not exists funnel_session_exclusions_session_idx
  on public.funnel_session_exclusions (session_id);

alter table public.funnel_session_exclusions enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'funnel_session_exclusions'
      and policyname = 'admins can read funnel session exclusions'
  ) then
    create policy "admins can read funnel session exclusions"
    on public.funnel_session_exclusions
    for select
    to authenticated
    using (public.is_admin());
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'funnel_session_exclusions'
      and policyname = 'admins can manage funnel session exclusions'
  ) then
    create policy "admins can manage funnel session exclusions"
    on public.funnel_session_exclusions
    for all
    to authenticated
    using (public.is_admin())
    with check (public.is_admin());
  end if;
end;
$$;
