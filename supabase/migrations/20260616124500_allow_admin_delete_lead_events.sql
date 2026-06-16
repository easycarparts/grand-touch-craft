do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'lead_events'
      and policyname = 'admins can delete lead events'
  ) then
    create policy "admins can delete lead events"
    on public.lead_events
    for delete
    to authenticated
    using (public.is_admin());
  end if;
end;
$$;
