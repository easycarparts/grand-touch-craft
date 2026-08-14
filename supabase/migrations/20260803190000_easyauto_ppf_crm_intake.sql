create table if not exists public.easyauto_ppf_conversations (
  external_conversation_id text primary key,
  lead_id uuid not null references public.leads(id) on delete cascade,
  wa_phone text not null,
  source_status text,
  source_stage text,
  service_type text not null,
  latest_customer_message text,
  referral_source_id text,
  referral_headline text,
  referral_body text,
  ctwa_clid text,
  gt_state jsonb not null default '{}'::jsonb,
  source_created_at timestamptz,
  source_updated_at timestamptz not null,
  received_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists easyauto_ppf_conversations_lead_idx
on public.easyauto_ppf_conversations (lead_id, source_updated_at desc);

create index if not exists easyauto_ppf_conversations_phone_idx
on public.easyauto_ppf_conversations (wa_phone, source_updated_at desc);

drop trigger if exists easyauto_ppf_conversations_set_updated_at
on public.easyauto_ppf_conversations;

create trigger easyauto_ppf_conversations_set_updated_at
before update on public.easyauto_ppf_conversations
for each row
execute function public.set_updated_at();

create table if not exists public.easyauto_ppf_messages (
  id uuid primary key default gen_random_uuid(),
  external_conversation_id text not null
    references public.easyauto_ppf_conversations(external_conversation_id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  external_message_id text not null,
  role text not null check (role in ('user', 'assistant')),
  body text not null,
  occurred_at timestamptz not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (external_conversation_id, external_message_id)
);

create index if not exists easyauto_ppf_messages_lead_idx
on public.easyauto_ppf_messages (lead_id, occurred_at);

alter table public.easyauto_ppf_conversations enable row level security;
alter table public.easyauto_ppf_messages enable row level security;

drop policy if exists "admins can view easyauto ppf conversations"
on public.easyauto_ppf_conversations;

create policy "admins can view easyauto ppf conversations"
on public.easyauto_ppf_conversations
for select
to authenticated
using (public.is_admin());

drop policy if exists "admins can view easyauto ppf messages"
on public.easyauto_ppf_messages;

create policy "admins can view easyauto ppf messages"
on public.easyauto_ppf_messages
for select
to authenticated
using (public.is_admin());
