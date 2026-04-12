alter table public.leads
add column if not exists first_whatsapp_contacted_at timestamptz,
add column if not exists first_whatsapp_contacted_by uuid references public.admin_users(id) on delete set null,
add column if not exists first_called_at timestamptz,
add column if not exists first_called_by uuid references public.admin_users(id) on delete set null;
