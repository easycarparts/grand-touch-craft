-- Make Telegram alert queueing resilient for guided flows that update an existing CRM lead.
-- The function already avoids duplicate `new_lead` alerts per lead, so it is safe to call
-- whenever a submitted lead receives fresh contact or vehicle details.

drop trigger if exists leads_enqueue_submitted_alert_on_any_submitted_update on public.leads;

create trigger leads_enqueue_submitted_alert_on_any_submitted_update
after update of submitted_at, full_name, phone, vehicle_make, vehicle_model, vehicle_year, vehicle_label, source_platform, landing_page_variant, funnel_name
on public.leads
for each row
when (new.submitted_at is not null)
execute function public.enqueue_new_lead_alert();
