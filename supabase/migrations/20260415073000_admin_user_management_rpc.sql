create or replace function public.admin_create_user(
  input_email text,
  input_password text,
  input_full_name text default null,
  input_role text default 'sales',
  input_is_active boolean default true
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_email text := lower(trim(coalesce(input_email, '')));
  next_role text := lower(trim(coalesce(input_role, 'sales')));
  next_user_id uuid := gen_random_uuid();
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_admin() then
    raise exception 'Only admins can create users';
  end if;

  if normalized_email = '' then
    raise exception 'Email is required';
  end if;

  if length(coalesce(input_password, '')) < 6 then
    raise exception 'Password must be at least 6 characters';
  end if;

  if next_role not in ('owner', 'manager', 'sales') then
    raise exception 'Role must be owner, manager, or sales';
  end if;

  if exists (select 1 from auth.users where lower(email) = normalized_email) then
    raise exception 'A user with this email already exists';
  end if;

  insert into auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  )
  values (
    next_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    normalized_email,
    crypt(input_password, gen_salt('bf')),
    timezone('utc', now()),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('full_name', nullif(trim(coalesce(input_full_name, '')), '')),
    timezone('utc', now()),
    timezone('utc', now()),
    '',
    '',
    '',
    ''
  );

  insert into auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  values (
    gen_random_uuid(),
    next_user_id,
    jsonb_build_object('sub', next_user_id::text, 'email', normalized_email),
    'email',
    normalized_email,
    timezone('utc', now()),
    timezone('utc', now()),
    timezone('utc', now())
  );

  insert into public.admin_users (id, email, full_name, role, is_active)
  values (
    next_user_id,
    normalized_email,
    nullif(trim(coalesce(input_full_name, '')), ''),
    next_role,
    coalesce(input_is_active, true)
  )
  on conflict (id) do update
  set email = excluded.email,
      full_name = excluded.full_name,
      role = excluded.role,
      is_active = excluded.is_active;

  return next_user_id;
end;
$$;

grant execute on function public.admin_create_user(text, text, text, text, boolean) to authenticated;
