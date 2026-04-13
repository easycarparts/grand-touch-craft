alter table public.leads
add column if not exists expected_delivery_at timestamptz;

create index if not exists leads_expected_delivery_at_idx
on public.leads (expected_delivery_at desc);
