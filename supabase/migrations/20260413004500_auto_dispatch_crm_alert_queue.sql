create extension if not exists pg_net;

create or replace function public.dispatch_crm_alert_queue()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.delivery_status <> 'pending' then
    return new;
  end if;

  if new.alert_type not in ('new_lead', 'followup_created') then
    return new;
  end if;

  perform net.http_post(
    url := 'https://lkikhrrzhddrdjfbbwjk.functions.supabase.co/telegram-crm-alerts',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := '{"mode":"deliver_queue_public"}'::jsonb
  );

  return new;
end;
$$;

drop trigger if exists crm_alert_queue_auto_dispatch on public.crm_alert_queue;

create trigger crm_alert_queue_auto_dispatch
after insert on public.crm_alert_queue
for each row
execute function public.dispatch_crm_alert_queue();
