-- Ask Grand Touch — website AI assistant.
-- Stores every conversation and message, and promotes a chat into the existing
-- CRM `leads` table the moment a phone number is captured, so an assistant lead
-- lands in exactly the same pipeline (and Telegram alerting) as a funnel lead.

create table if not exists public.gt_assistant_conversations (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  visitor_id text,
  -- captured during the chat
  phone text,
  normalized_phone text,
  full_name text,
  vehicle_make text,
  vehicle_model text,
  vehicle_year text,
  service_interest text,
  program_interest text check (program_interest in ('essential', 'signature', 'concours')),
  timeline text,
  -- lifecycle
  lead_id uuid references public.leads(id) on delete set null,
  message_count integer not null default 0,
  intent_score integer not null default 0 check (intent_score >= 0 and intent_score <= 100),
  handoff_requested boolean not null default false,
  off_topic text,
  -- attribution, mirrored from the funnel tracking context
  page_path text,
  source_platform text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  gclid text,
  fbclid text,
  ttclid text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  last_message_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists gt_assistant_conversations_session_idx
  on public.gt_assistant_conversations (session_id);
create index if not exists gt_assistant_conversations_phone_idx
  on public.gt_assistant_conversations (normalized_phone);
create index if not exists gt_assistant_conversations_lead_idx
  on public.gt_assistant_conversations (lead_id);
create index if not exists gt_assistant_conversations_last_message_idx
  on public.gt_assistant_conversations (last_message_at desc);

create table if not exists public.gt_assistant_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.gt_assistant_conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  -- what the model extracted on this turn, for debugging and for lead scoring
  extracted jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists gt_assistant_messages_conversation_idx
  on public.gt_assistant_messages (conversation_id, created_at);

drop trigger if exists gt_assistant_conversations_set_updated_at on public.gt_assistant_conversations;
create trigger gt_assistant_conversations_set_updated_at
before update on public.gt_assistant_conversations
for each row
execute function public.set_updated_at();

-- Keep the normalized phone in step with the CRM's own normalisation, so a
-- chat lead dedupes against a funnel lead from the same number.
create or replace function public.prepare_gt_assistant_conversation()
returns trigger
language plpgsql
as $$
begin
  new.normalized_phone = public.normalize_phone(new.phone);
  return new;
end;
$$;

drop trigger if exists gt_assistant_conversations_prepare on public.gt_assistant_conversations;
create trigger gt_assistant_conversations_prepare
before insert or update on public.gt_assistant_conversations
for each row
execute function public.prepare_gt_assistant_conversation();

alter table public.gt_assistant_conversations enable row level security;
alter table public.gt_assistant_messages enable row level security;

-- Writes happen only through the edge function (service role). Admins read.
drop policy if exists "gt_assistant_conversations_admin_read" on public.gt_assistant_conversations;
create policy "gt_assistant_conversations_admin_read"
  on public.gt_assistant_conversations for select
  using (exists (select 1 from public.admin_users a where a.id = auth.uid() and a.is_active));

drop policy if exists "gt_assistant_messages_admin_read" on public.gt_assistant_messages;
create policy "gt_assistant_messages_admin_read"
  on public.gt_assistant_messages for select
  using (exists (select 1 from public.admin_users a where a.id = auth.uid() and a.is_active));
