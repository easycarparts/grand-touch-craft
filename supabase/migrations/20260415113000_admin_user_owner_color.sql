alter table public.admin_users
add column if not exists owner_color text not null default '#60a5fa';

alter table public.admin_users
drop constraint if exists admin_users_owner_color_format;

alter table public.admin_users
add constraint admin_users_owner_color_format
check (owner_color ~ '^#[0-9A-Fa-f]{6}$');
