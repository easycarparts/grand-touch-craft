import { supabase } from "@/lib/supabase";

export type CeramicBookingStatus = "sent" | "opened" | "confirmed" | "completed" | "cancelled";

export type CeramicLeadOption = {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_year: string | null;
  vehicle_label: string | null;
  landing_page_variant: string | null;
  funnel_name: string | null;
  source_platform: string | null;
  latest_quote_estimate: number | null;
  status: string;
  created_at: string;
  submitted_at: string | null;
  latest_snapshot_payload?: Record<string, unknown> | null;
};

const ceramicPackageIdToName: Record<string, string> = {
  basic: "GYEON Basic Ceramic",
  correction: "GYEON Showroom Ceramic",
  signature: "GYEON Signature Ceramic",
};

const ceramicPaintConditionLabels: Record<string, string> = {
  clean: "New or very clean",
  light_swirls: "Light swirls / wash marks",
  heavy_swirls: "Heavy swirls or dull paint",
  not_sure: "Not sure — inspect it",
};

const ceramicAddOnLabels: Record<string, string> = {
  glass: "GYEON glass coating",
  wheel_face: "Wheel-face ceramic",
  interior: "GYEON interior ceramic",
  trim: "Trim + plastic ceramic detail",
  wheels_off: "Wheels-off ceramic (barrels coated)",
};

const readPayloadString = (payload: Record<string, unknown> | null | undefined, ...keys: string[]) => {
  for (const key of keys) {
    const value = payload?.[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
};

const readPayloadNumber = (payload: Record<string, unknown> | null | undefined, ...keys: string[]) => {
  for (const key of keys) {
    const value = payload?.[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
};

const resolveCeramicPackageName = (payload: Record<string, unknown> | null | undefined) => {
  const packageName = readPayloadString(payload, "package_name");
  if (packageName) return packageName;
  const packageId = readPayloadString(payload, "package_id");
  return packageId ? ceramicPackageIdToName[packageId] || "" : "";
};

const resolveCeramicPaintCondition = (payload: Record<string, unknown> | null | undefined) => {
  const raw = readPayloadString(payload, "paint_condition");
  if (!raw) return "";
  return ceramicPaintConditionLabels[raw] || raw;
};

const resolveCeramicAddOnsText = (payload: Record<string, unknown> | null | undefined) => {
  const selected = payload?.selected_addons;
  if (!Array.isArray(selected) || !selected.length) return "";
  return selected
    .map((item) => {
      if (typeof item !== "string") return "";
      return ceramicAddOnLabels[item] || item;
    })
    .filter(Boolean)
    .join(", ");
};

const resolveCeramicQuotedPrice = (
  lead: Pick<CeramicLeadOption, "latest_quote_estimate">,
  payload: Record<string, unknown> | null | undefined,
) =>
  lead.latest_quote_estimate ??
  readPayloadNumber(payload, "final_price", "service_price", "estimate_value");

const resolveCeramicVehicleYear = (
  lead: Pick<CeramicLeadOption, "vehicle_year">,
  payload: Record<string, unknown> | null | undefined,
) => {
  if (lead.vehicle_year?.trim()) return lead.vehicle_year.trim();
  const fromPayload = readPayloadString(payload, "vehicle_year", "car_year");
  return fromPayload;
};

export type CeramicBooking = {
  id: string;
  token: string;
  lead_id: string | null;
  status: CeramicBookingStatus;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_year: string | null;
  vehicle_label: string | null;
  package_name: string;
  paint_condition: string | null;
  add_ons: unknown[];
  quoted_price_aed: number | null;
  slot_date: string;
  slot_start_at: string;
  slot_end_at: string;
  location_name: string;
  location_address: string;
  location_maps_url: string;
  customer_notes: string | null;
  internal_notes: string | null;
  customer_confirmed_name: string | null;
  opened_at: string | null;
  confirmed_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CeramicBookingFormDraft = {
  leadId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: string;
  packageName: string;
  paintCondition: string;
  addOnsText: string;
  quotedPriceAed: string;
  slotDate: string;
  customerNotes: string;
  internalNotes: string;
};

export type CeramicDateAvailability = {
  slot_key: "day";
  label: string;
  start_label: string;
  available: boolean;
};

export const ceramicPackageOptions = [
  "GYEON Basic Ceramic",
  "GYEON Showroom Ceramic",
  "GYEON Signature Ceramic",
  "Custom GYEON package",
];

export const CERAMIC_BOOKING_DEFAULTS = {
  locationName: "Grand Touch Studio",
  locationAddress: "Dubai Investments Park 2, Dubai",
  locationMapsUrl: "https://maps.app.goo.gl/aT7PsGYHYv5kg8L77",
};

export const todayDubaiDate = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dubai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

export const addDaysToDateString = (value: string, days: number) => {
  const [year, month, day] = value.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days, 12, 0, 0));
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}-${String(
    next.getUTCDate(),
  ).padStart(2, "0")}`;
};

export const formatAed = (value: number | null | undefined) =>
  value == null ? "Not set" : `AED ${Math.round(Number(value)).toLocaleString("en-AE")}`;

export const formatDubaiDate = (value: string | Date) =>
  new Intl.DateTimeFormat("en-AE", {
    timeZone: "Asia/Dubai",
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

export const formatDubaiDateTime = (value: string | Date) =>
  new Intl.DateTimeFormat("en-AE", {
    timeZone: "Asia/Dubai",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));

export const buildCeramicBookingUrl = (token: string) => `${window.location.origin}/ceramic-booking/${token}`;

export const buildCustomerWhatsAppUrl = (phone: string, link: string, customerName?: string) => {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("05") && digits.length === 10) digits = `971${digits.slice(1)}`;
  if (digits.startsWith("5") && digits.length === 9) digits = `971${digits}`;
  if (digits.startsWith("9710")) digits = `971${digits.slice(4)}`;
  const firstName = customerName?.trim().split(/\s+/)[0] || "there";
  const message = encodeURIComponent(
    `Hi ${firstName}, your GYEON ceramic booking at Grand Touch is ready to confirm. Please review and confirm here: ${link}`,
  );
  return digits ? `https://wa.me/${digits}?text=${message}` : null;
};

export const makeEmptyCeramicBookingDraft = (): CeramicBookingFormDraft => ({
  leadId: "",
  customerName: "",
  customerPhone: "",
  customerEmail: "",
  vehicleMake: "",
  vehicleModel: "",
  vehicleYear: "",
  packageName: "GYEON Showroom Ceramic",
  paintCondition: "Paint inspection needed",
  addOnsText: "",
  quotedPriceAed: "",
  slotDate: todayDubaiDate(),
  customerNotes:
    "No deposit is required right now. Sean confirms the final ceramic package after paint inspection. Drop-off is usually 9-11 AM.",
  internalNotes: "",
});

export const makeCeramicBookingDraftFromLead = (lead: CeramicLeadOption): CeramicBookingFormDraft => {
  const payload = lead.latest_snapshot_payload ?? {};
  const packageName = resolveCeramicPackageName(payload);
  const quotedPrice = resolveCeramicQuotedPrice(lead, payload);

  return {
    ...makeEmptyCeramicBookingDraft(),
    leadId: lead.id,
    customerName: lead.full_name || "",
    customerPhone: lead.phone || "",
    customerEmail: lead.email || "",
    vehicleMake: lead.vehicle_make || "",
    vehicleModel: lead.vehicle_model || readPayloadString(payload, "vehicle_model"),
    vehicleYear: resolveCeramicVehicleYear(lead, payload),
    packageName:
      packageName && ceramicPackageOptions.includes(packageName)
        ? packageName
        : packageName || "GYEON Showroom Ceramic",
    paintCondition: resolveCeramicPaintCondition(payload) || "Paint inspection needed",
    addOnsText: resolveCeramicAddOnsText(payload),
    quotedPriceAed: quotedPrice != null ? String(Math.round(quotedPrice)) : "",
  };
};

export const makeCeramicBookingDraftFromBooking = (booking: CeramicBooking): CeramicBookingFormDraft => ({
  leadId: booking.lead_id || "",
  customerName: booking.customer_name || "",
  customerPhone: booking.customer_phone || "",
  customerEmail: booking.customer_email || "",
  vehicleMake: booking.vehicle_make || "",
  vehicleModel: booking.vehicle_model || "",
  vehicleYear: booking.vehicle_year || "",
  packageName: booking.package_name || "GYEON Showroom Ceramic",
  paintCondition: booking.paint_condition || "",
  addOnsText: (booking.add_ons || [])
    .map((item) => (typeof item === "string" ? item : (item as { title?: string }).title || ""))
    .filter(Boolean)
    .join(", "),
  quotedPriceAed: booking.quoted_price_aed ? String(Math.round(booking.quoted_price_aed)) : "",
  slotDate: booking.slot_date,
  customerNotes: booking.customer_notes || "",
  internalNotes: booking.internal_notes || "",
});

const draftToPayload = (draft: CeramicBookingFormDraft, status?: CeramicBookingStatus) => ({
  lead_id: draft.leadId || null,
  status,
  customer_name: draft.customerName.trim(),
  customer_phone: draft.customerPhone.trim(),
  customer_email: draft.customerEmail.trim() || null,
  vehicle_make: draft.vehicleMake.trim() || null,
  vehicle_model: draft.vehicleModel.trim() || null,
  vehicle_year: draft.vehicleYear.trim() || null,
  package_name: draft.packageName.trim() || "GYEON Showroom Ceramic",
  paint_condition: draft.paintCondition.trim() || null,
  add_ons: draft.addOnsText
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean),
  quoted_price_aed: draft.quotedPriceAed.trim() || null,
  slot_date: draft.slotDate,
  location_name: CERAMIC_BOOKING_DEFAULTS.locationName,
  location_address: CERAMIC_BOOKING_DEFAULTS.locationAddress,
  location_maps_url: CERAMIC_BOOKING_DEFAULTS.locationMapsUrl,
  customer_notes: draft.customerNotes.trim() || null,
  internal_notes: draft.internalNotes.trim() || null,
});

export async function loadCeramicLeads(): Promise<CeramicLeadOption[]> {
  if (!supabase) throw new Error("Supabase is not configured");

  const { data, error } = await supabase
    .from("leads")
    .select(
      "id, full_name, phone, email, vehicle_make, vehicle_model, vehicle_year, vehicle_label, landing_page_variant, funnel_name, source_platform, latest_quote_estimate, status, created_at, submitted_at",
    )
    .or("funnel_name.ilike.%ceramic%,landing_page_variant.ilike.%ceramic%,utm_campaign.ilike.%ceramic%")
    .not("status", "in", '("lost","junk")')
    .order("created_at", { ascending: false })
    .limit(80);

  if (error) throw error;

  const leads = (data || []) as CeramicLeadOption[];
  if (!leads.length) return leads;

  const leadIds = leads.map((lead) => lead.id);
  const { data: snapshotRows, error: snapshotError } = await supabase
    .from("lead_contact_snapshots")
    .select("lead_id, payload, vehicle_year, captured_at")
    .in("lead_id", leadIds)
    .order("captured_at", { ascending: false });

  if (snapshotError) throw snapshotError;

  const latestSnapshotByLead = new Map<string, { payload: Record<string, unknown>; vehicle_year: string | null }>();
  for (const row of snapshotRows || []) {
    if (!row.lead_id || latestSnapshotByLead.has(row.lead_id)) continue;
    latestSnapshotByLead.set(row.lead_id, {
      payload: (row.payload as Record<string, unknown>) ?? {},
      vehicle_year: row.vehicle_year ?? null,
    });
  }

  return leads.map((lead) => {
    const snapshot = latestSnapshotByLead.get(lead.id);
    return {
      ...lead,
      vehicle_year: lead.vehicle_year || snapshot?.vehicle_year || null,
      latest_snapshot_payload: snapshot?.payload ?? null,
    };
  });
}

export async function loadCeramicBookings(): Promise<CeramicBooking[]> {
  if (!supabase) throw new Error("Supabase is not configured");

  const { data, error } = await supabase
    .from("ceramic_bookings")
    .select("*")
    .order("slot_start_at", { ascending: true });

  if (error) throw error;
  return (data || []) as CeramicBooking[];
}

export async function saveCeramicBooking(
  draft: CeramicBookingFormDraft,
  bookingId?: string | null,
  status: CeramicBookingStatus = "sent",
): Promise<CeramicBooking> {
  if (!supabase) throw new Error("Supabase is not configured");
  const { data, error } = await supabase.rpc("admin_upsert_ceramic_booking", {
    p_booking_id: bookingId || null,
    p_payload: draftToPayload(draft, status),
  });
  if (error) throw error;
  return data as CeramicBooking;
}

export async function updateCeramicBookingStatus(
  booking: CeramicBooking,
  status: CeramicBookingStatus,
): Promise<CeramicBooking> {
  const draft = makeCeramicBookingDraftFromBooking(booking);
  return saveCeramicBooking(draft, booking.id, status);
}

export async function loadPublicCeramicBooking(token: string): Promise<CeramicBooking> {
  if (!supabase) throw new Error("Supabase is not configured");
  const { data, error } = await supabase.rpc("ceramic_booking_get_public", { p_token: token });
  if (error) throw error;
  return data as CeramicBooking;
}

export async function loadCeramicDateAvailability(
  token: string,
  slotDate: string,
): Promise<CeramicDateAvailability[]> {
  if (!supabase) throw new Error("Supabase is not configured");
  const { data, error } = await supabase.rpc("ceramic_booking_get_availability", {
    p_token: token,
    p_slot_date: slotDate,
  });
  if (error) throw error;
  return (data || []) as CeramicDateAvailability[];
}

export async function confirmCeramicBooking(
  token: string,
  customerName: string,
  slotDate: string,
): Promise<CeramicBooking> {
  if (!supabase) throw new Error("Supabase is not configured");
  const { data, error } = await supabase.rpc("ceramic_booking_confirm", {
    p_token: token,
    p_customer_name: customerName,
    p_slot_date: slotDate,
  });
  if (error) throw error;
  return data as CeramicBooking;
}
