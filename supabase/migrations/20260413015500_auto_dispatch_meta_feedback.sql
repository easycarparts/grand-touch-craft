create extension if not exists pg_net;

create or replace function public.dispatch_meta_feedback_queue()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.platform <> 'meta' then
    return new;
  end if;

  if new.feedback_status <> 'pending' then
    return new;
  end if;

  if new.feedback_type not in ('qualified_lead', 'won_job') then
    return new;
  end if;

  perform net.http_post(
    url := 'https://lkikhrrzhddrdjfbbwjk.functions.supabase.co/meta-feedback-dispatch',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := '{"mode":"deliver_pending_public"}'::jsonb
  );

  return new;
end;
$$;

drop trigger if exists ad_platform_feedback_auto_dispatch on public.ad_platform_feedback;

create trigger ad_platform_feedback_auto_dispatch
after insert on public.ad_platform_feedback
for each row
execute function public.dispatch_meta_feedback_queue();
