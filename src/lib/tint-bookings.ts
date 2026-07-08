import { supabase } from "@/lib/supabase";

export type TintBookingStatus = "sent" | "opened" | "confirmed" | "completed" | "cancelled";
export type TintBookingSlotKey = "09_12" | "12_15" | "15_18";

export const tintBookingSlots: Array<{ key: TintBookingSlotKey; label: string; shortLabel: string }> = [
  { key: "09_12", label: "9 AM - 12 PM", shortLabel: "9-12" },
  { key: "12_15", label: "12 PM - 3 PM", shortLabel: "12-3" },
  { key: "15_18", label: "3 PM - 6 PM", shortLabel: "3-6" },
];

export type TintLeadOption = {
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
};

export type TintBooking = {
  id: string;
  token: string;
  lead_id: string | null;
  status: TintBookingStatus;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_year: string | null;
  vehicle_label: string | null;
  tint_package: string;
  add_ons: unknown[];
  quoted_price_aed: number | null;
  slot_date: string;
  slot_key: TintBookingSlotKey;
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

export type TintBookingFormDraft = {
  leadId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: string;
  tintPackage: string;
  addOnsText: string;
  quotedPriceAed: string;
  slotDate: string;
  slotKey: TintBookingSlotKey;
  customerNotes: string;
  internalNotes: string;
};

export type TintSlotAvailability = {
  slot_key: TintBookingSlotKey;
  label: string;
  start_label: string;
  available: boolean;
};

export const TINT_BOOKING_DEFAULTS = {
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

export const getSlotLabel = (slotKey: TintBookingSlotKey) =>
  tintBookingSlots.find((slot) => slot.key === slotKey)?.label ?? slotKey;

export const buildTintBookingUrl = (token: string) => `${window.location.origin}/tint-booking/${token}`;

export const buildCustomerWhatsAppUrl = (phone: string, link: string, customerName?: string) => {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("05") && digits.length === 10) digits = `971${digits.slice(1)}`;
  if (digits.startsWith("5") && digits.length === 9) digits = `971${digits}`;
  if (digits.startsWith("9710")) digits = `971${digits.slice(4)}`;
  const firstName = customerName?.trim().split(/\s+/)[0] || "there";
  const message = encodeURIComponent(
    `Hi ${firstName}, your tint slot at Grand Touch is ready to confirm. Please review and confirm here: ${link}`,
  );
  return digits ? `https://wa.me/${digits}?text=${message}` : null;
};

export const makeEmptyTintBookingDraft = (): TintBookingFormDraft => ({
  leadId: "",
  customerName: "",
  customerPhone: "",
  customerEmail: "",
  vehicleMake: "",
  vehicleModel: "",
  vehicleYear: "",
  tintPackage: "STEK Smart Ceramic",
  addOnsText: "",
  quotedPriceAed: "",
  slotDate: todayDubaiDate(),
  slotKey: "09_12",
  customerNotes: "No deposit is required right now. Sean confirms final shade before installation.",
  internalNotes: "",
});

export const makeTintBookingDraftFromLead = (lead: TintLeadOption): TintBookingFormDraft => ({
  ...makeEmptyTintBookingDraft(),
  leadId: lead.id,
  customerName: lead.full_name || "",
  customerPhone: lead.phone || "",
  customerEmail: lead.email || "",
  vehicleMake: lead.vehicle_make || "",
  vehicleModel: lead.vehicle_model || "",
  vehicleYear: lead.vehicle_year || "",
  quotedPriceAed: lead.latest_quote_estimate ? String(Math.round(lead.latest_quote_estimate)) : "",
});

export const makeTintBookingDraftFromBooking = (booking: TintBooking): TintBookingFormDraft => ({
  leadId: booking.lead_id || "",
  customerName: booking.customer_name || "",
  customerPhone: booking.customer_phone || "",
  customerEmail: booking.customer_email || "",
  vehicleMake: booking.vehicle_make || "",
  vehicleModel: booking.vehicle_model || "",
  vehicleYear: booking.vehicle_year || "",
  tintPackage: booking.tint_package || "STEK Smart Ceramic",
  addOnsText: (booking.add_ons || [])
    .map((item) => (typeof item === "string" ? item : (item as { title?: string }).title || ""))
    .filter(Boolean)
    .join(", "),
  quotedPriceAed: booking.quoted_price_aed ? String(Math.round(booking.quoted_price_aed)) : "",
  slotDate: booking.slot_date,
  slotKey: booking.slot_key,
  customerNotes: booking.customer_notes || "",
  internalNotes: booking.internal_notes || "",
});

const draftToPayload = (draft: TintBookingFormDraft, status?: TintBookingStatus) => ({
  lead_id: draft.leadId || null,
  status,
  customer_name: draft.customerName.trim(),
  customer_phone: draft.customerPhone.trim(),
  customer_email: draft.customerEmail.trim() || null,
  vehicle_make: draft.vehicleMake.trim() || null,
  vehicle_model: draft.vehicleModel.trim() || null,
  vehicle_year: draft.vehicleYear.trim() || null,
  tint_package: draft.tintPackage.trim() || "STEK Smart Ceramic",
  add_ons: draft.addOnsText
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean),
  quoted_price_aed: draft.quotedPriceAed.trim() || null,
  slot_date: draft.slotDate,
  slot_key: draft.slotKey,
  location_name: TINT_BOOKING_DEFAULTS.locationName,
  location_address: TINT_BOOKING_DEFAULTS.locationAddress,
  location_maps_url: TINT_BOOKING_DEFAULTS.locationMapsUrl,
  customer_notes: draft.customerNotes.trim() || null,
  internal_notes: draft.internalNotes.trim() || null,
});

export async function loadTintLeads(): Promise<TintLeadOption[]> {
  if (!supabase) throw new Error("Supabase is not configured");

  const { data, error } = await supabase
    .from("leads")
    .select(
      "id, full_name, phone, email, vehicle_make, vehicle_model, vehicle_year, vehicle_label, landing_page_variant, funnel_name, source_platform, latest_quote_estimate, status, created_at, submitted_at",
    )
    .or("funnel_name.ilike.%tint%,landing_page_variant.ilike.%tint%,utm_campaign.ilike.%tint%")
    .not("status", "in", '("lost","junk")')
    .order("created_at", { ascending: false })
    .limit(80);

  if (error) throw error;
  return (data || []) as TintLeadOption[];
}

export async function loadTintBookings(): Promise<TintBooking[]> {
  if (!supabase) throw new Error("Supabase is not configured");

  const { data, error } = await supabase
    .from("tint_bookings")
    .select("*")
    .order("slot_start_at", { ascending: true });

  if (error) throw error;
  return (data || []) as TintBooking[];
}

export async function saveTintBooking(
  draft: TintBookingFormDraft,
  bookingId?: string | null,
  status: TintBookingStatus = "sent",
): Promise<TintBooking> {
  if (!supabase) throw new Error("Supabase is not configured");
  const { data, error } = await supabase.rpc("admin_upsert_tint_booking", {
    p_booking_id: bookingId || null,
    p_payload: draftToPayload(draft, status),
  });
  if (error) throw error;
  return data as TintBooking;
}

export async function updateTintBookingStatus(booking: TintBooking, status: TintBookingStatus): Promise<TintBooking> {
  const draft = makeTintBookingDraftFromBooking(booking);
  return saveTintBooking(draft, booking.id, status);
}

export async function loadPublicTintBooking(token: string): Promise<TintBooking> {
  if (!supabase) throw new Error("Supabase is not configured");
  const { data, error } = await supabase.rpc("tint_booking_get_public", { p_token: token });
  if (error) throw error;
  return data as TintBooking;
}

export async function loadTintSlotAvailability(token: string, slotDate: string): Promise<TintSlotAvailability[]> {
  if (!supabase) throw new Error("Supabase is not configured");
  const { data, error } = await supabase.rpc("tint_booking_get_availability", {
    p_token: token,
    p_slot_date: slotDate,
  });
  if (error) throw error;
  return (data || []) as TintSlotAvailability[];
}

export async function confirmTintBooking(
  token: string,
  customerName: string,
  slotDate: string,
  slotKey: TintBookingSlotKey,
): Promise<TintBooking> {
  if (!supabase) throw new Error("Supabase is not configured");
  const { data, error } = await supabase.rpc("tint_booking_confirm", {
    p_token: token,
    p_customer_name: customerName,
    p_slot_date: slotDate,
    p_slot_key: slotKey,
  });
  if (error) throw error;
  return data as TintBooking;
}
