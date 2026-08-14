create or replace function public.prepare_lead_row()
returns trigger
language plpgsql
as $$
begin
  new.normalized_phone = public.normalize_phone(new.phone);
  new.vehicle_label = coalesce(
    nullif(trim(new.vehicle_label), ''),
    nullif(trim(concat_ws(' ', new.vehicle_year, new.vehicle_make, new.vehicle_model)), '')
  );
  return new;
end;
$$;

create or replace function public.prepare_lead_snapshot_row()
returns trigger
language plpgsql
as $$
begin
  new.normalized_phone = public.normalize_phone(new.phone);
  new.vehicle_label = coalesce(
    nullif(trim(new.vehicle_label), ''),
    nullif(trim(concat_ws(' ', new.vehicle_year, new.vehicle_make, new.vehicle_model)), '')
  );
  return new;
end;
$$;
