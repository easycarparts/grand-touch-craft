-- `sync_lead_from_snapshot` can INSERT a `leads` row with `submitted_at` already set when the
-- first qualifying snapshot is type `submit`. Telegram queueing was only wired on
-- UPDATE of `submitted_at`, so those leads never hit `crm_alert_queue`.

drop trigger if exists leads_enqueue_submitted_alert_on_insert on public.leads;

create trigger leads_enqueue_submitted_alert_on_insert
after insert on public.leads
for each row
when (new.submitted_at is not null)
execute function public.enqueue_new_lead_alert();
