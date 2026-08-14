-- Qualification fields the assistant reads during a conversation.
-- These are the answers that actually change the recommendation (how the car
-- lives, whether they have it yet) plus the assistant's silent read of whether
-- the visitor is buying on price or on quality — which is the single most useful
-- thing to know before Sean picks up the phone.

alter table public.gt_assistant_conversations
  add column if not exists usage text check (usage in ('outdoors_highway', 'mixed', 'garaged')),
  add column if not exists possession text check (possession in ('yes', 'on_order')),
  add column if not exists buyer_focus text check (buyer_focus in ('price', 'quality', 'unsure'));

create index if not exists gt_assistant_conversations_buyer_focus_idx
  on public.gt_assistant_conversations (buyer_focus);
