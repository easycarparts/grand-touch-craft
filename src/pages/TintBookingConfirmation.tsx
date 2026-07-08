import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { CalendarDays, CheckCircle2, MapPin, MessageCircle, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  TintBooking,
  TintBookingSlotKey,
  TintSlotAvailability,
  addDaysToDateString,
  buildCustomerWhatsAppUrl,
  confirmTintBooking,
  formatAed,
  formatDubaiDate,
  formatDubaiDateTime,
  getSlotLabel,
  loadPublicTintBooking,
  loadTintSlotAvailability,
  tintBookingSlots,
  todayDubaiDate,
} from "@/lib/tint-bookings";

const shopWhatsApp = "https://wa.me/971567191045";

const titleCase = (value: string) =>
  value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const getVehicle = (booking: TintBooking) =>
  booking.vehicle_label || [booking.vehicle_year, booking.vehicle_make, booking.vehicle_model].filter(Boolean).join(" ");

const getAddOnLabels = (booking: TintBooking) =>
  (booking.add_ons || [])
    .map((item) => (typeof item === "string" ? item : (item as { title?: string }).title || ""))
    .filter(Boolean);

const statusCopy = (status: TintBooking["status"]) => {
  if (status === "confirmed") return "Your tint slot is confirmed.";
  if (status === "completed") return "This tint booking has been completed.";
  if (status === "opened") return "Your tint slot is held. Confirm below.";
  return "Your tint slot is ready to confirm.";
};

function LoadingState() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#090909] text-white">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-primary" />
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#090909] px-4 text-white">
      <div className="max-w-md rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center">
        <h1 className="text-2xl font-bold">Link unavailable</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">{message}</p>
        <Button className="mt-5 bg-emerald-600 text-white hover:bg-emerald-500" asChild>
          <a href={shopWhatsApp} target="_blank" rel="noreferrer">
            Message Sean on WhatsApp
          </a>
        </Button>
      </div>
    </div>
  );
}

function ConfirmedView({ booking }: { booking: TintBooking }) {
  const vehicle = getVehicle(booking);
  const waUrl = buildCustomerWhatsAppUrl(booking.customer_phone, window.location.href, booking.customer_name) || shopWhatsApp;

  return (
    <div className="min-h-screen bg-[#090909] px-4 py-10 text-white">
      <main className="mx-auto max-w-2xl">
        <div className="rounded-[28px] border border-emerald-400/20 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.22),transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(10,10,10,0.98))] p-6 text-center shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:p-8">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-500/15">
            <CheckCircle2 className="h-10 w-10 text-emerald-300" />
          </div>
          <h1 className="mt-6 text-3xl font-black tracking-tight sm:text-4xl">You're locked in.</h1>
          <p className="mt-3 text-slate-300">{statusCopy(booking.status)}</p>

          <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-4 text-left">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Date</p>
                <p className="mt-1 font-semibold">{formatDubaiDateTime(booking.slot_start_at)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Slot</p>
                <p className="mt-1 font-semibold">{getSlotLabel(booking.slot_key)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Vehicle</p>
                <p className="mt-1 font-semibold">{vehicle || "Your vehicle"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Package</p>
                <p className="mt-1 font-semibold">{booking.tint_package}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button className="bg-emerald-600 text-white hover:bg-emerald-500" asChild>
              <a href={waUrl} target="_blank" rel="noreferrer">
                <MessageCircle className="mr-2 h-4 w-4" />
                Message us
              </a>
            </Button>
            <Button variant="outline" className="border-white/10 bg-black/20 text-white hover:bg-white/10" asChild>
              <a href={booking.location_maps_url} target="_blank" rel="noreferrer">
                <MapPin className="mr-2 h-4 w-4" />
                Open location
              </a>
            </Button>
          </div>
        </div>

        <section className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <h2 className="font-semibold">What happens next</h2>
          <ol className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
            <li>1. Sean keeps this tint slot assigned to your car.</li>
            <li>2. Final legal shade is confirmed before installation.</li>
            <li>3. Full tint install normally takes about 3 hours.</li>
          </ol>
        </section>
      </main>
    </div>
  );
}

const TintBookingConfirmation = () => {
  const { token } = useParams<{ token: string }>();
  const [booking, setBooking] = useState<TintBooking | null>(null);
  const [availability, setAvailability] = useState<TintSlotAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(todayDubaiDate());
  const [selectedSlot, setSelectedSlot] = useState<TintBookingSlotKey>("09_12");
  const [customerName, setCustomerName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<TintBooking | null>(null);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const data = await loadPublicTintBooking(token);
        setBooking(data);
        setSelectedDate(data.slot_date);
        setSelectedSlot(data.slot_key);
        setCustomerName(data.customer_confirmed_name || data.customer_name || "");
        if (data.status === "confirmed" || data.status === "completed") setConfirmedBooking(data);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "This confirmation link is invalid or expired.");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  useEffect(() => {
    if (!token || !booking || confirmedBooking) return;
    setAvailabilityLoading(true);
    loadTintSlotAvailability(token, selectedDate)
      .then((slots) => {
        setAvailability(slots);
        const selected = slots.find((slot) => slot.slot_key === selectedSlot);
        if (selected && !selected.available) {
          const firstAvailable = slots.find((slot) => slot.available);
          if (firstAvailable) setSelectedSlot(firstAvailable.slot_key);
        }
      })
      .catch((availabilityError) => {
        setSubmitError(availabilityError instanceof Error ? availabilityError.message : "Could not check slot availability.");
      })
      .finally(() => setAvailabilityLoading(false));
  }, [booking, confirmedBooking, selectedDate, selectedSlot, token]);

  const vehicle = booking ? getVehicle(booking) : "";
  const addOns = booking ? getAddOnLabels(booking) : [];
  const canConfirm = customerName.trim().length >= 2 && agreed && Boolean(selectedDate && selectedSlot);
  const selectedAvailability = availability.find((slot) => slot.slot_key === selectedSlot);
  const selectedUnavailable = selectedAvailability ? !selectedAvailability.available : false;
  const minDate = todayDubaiDate();
  const maxDate = useMemo(() => addDaysToDateString(minDate, 45), [minDate]);

  const handleConfirm = async () => {
    if (!token || !canConfirm || selectedUnavailable || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const nextBooking = await confirmTintBooking(token, customerName.trim(), selectedDate, selectedSlot);
      setConfirmedBooking(nextBooking);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (confirmError) {
      setSubmitError(confirmError instanceof Error ? confirmError.message : "Could not confirm this slot. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingState />;
  if (error || !booking) return <ErrorState message={error || "This confirmation link is invalid or expired."} />;
  if (confirmedBooking) return <ConfirmedView booking={confirmedBooking} />;

  return (
    <div className="min-h-screen bg-[#090909] pb-24 text-white">
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(245,181,43,0.24),transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.07),rgba(9,9,9,0.96))]" />
        <div className="relative mx-auto max-w-3xl px-4 pb-8 pt-12 sm:px-6 sm:pt-16">
          <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
            Tint slot reserved for {booking.customer_name}
          </Badge>
          <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight sm:text-5xl">
            Confirm your ceramic tint booking
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
            Review the details, keep this slot, or choose another available tint slot before confirming.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <p className="mt-2 text-sm font-semibold">STEK film</p>
              <p className="text-xs text-slate-400">Sean confirms final shade.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <CalendarDays className="h-5 w-5 text-primary" />
              <p className="mt-2 text-sm font-semibold">3 hour flow</p>
              <p className="text-xs text-slate-400">For most tint installs.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <MapPin className="h-5 w-5 text-primary" />
              <p className="mt-2 text-sm font-semibold">DIP 2 studio</p>
              <p className="text-xs text-slate-400">Location below.</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-4 px-4 sm:px-6">
        <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <h2 className="text-xl font-bold">Your tint details</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Vehicle</p>
              <p className="mt-1 font-semibold">{vehicle || "Your vehicle"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Package</p>
              <p className="mt-1 font-semibold">{booking.tint_package}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Price</p>
              <p className="mt-1 font-semibold text-primary">{formatAed(booking.quoted_price_aed)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Current slot</p>
              <p className="mt-1 font-semibold">{formatDubaiDateTime(booking.slot_start_at)}</p>
            </div>
          </div>
          {addOns.length ? (
            <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3">
              <p className="text-xs uppercase tracking-[0.16em] text-emerald-200">Add-ons</p>
              <p className="mt-1 text-sm text-emerald-50">{addOns.join(", ")}</p>
            </div>
          ) : null}
          {booking.customer_notes ? (
            <div className="mt-4 rounded-xl border border-primary/20 bg-primary/10 p-3 text-sm leading-6 text-slate-200">
              {booking.customer_notes}
            </div>
          ) : null}
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <h2 className="text-xl font-bold">Choose your slot</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            We run tint in three daily windows. If your current slot no longer works, choose another available one.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1.4fr]">
            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.16em] text-slate-500">Date</p>
              <Input
                type="date"
                min={minDate}
                max={maxDate}
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="border-white/10 bg-black/30 text-white"
              />
              <p className="mt-2 text-xs text-slate-500">{formatDubaiDate(`${selectedDate}T08:00:00+04:00`)}</p>
            </div>
            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.16em] text-slate-500">
                Slot {availabilityLoading ? "(checking...)" : ""}
              </p>
              <div className="grid gap-2 sm:grid-cols-3">
                {tintBookingSlots.map((slot) => {
                  const slotAvailability = availability.find((item) => item.slot_key === slot.key);
                  const available = slotAvailability?.available ?? true;
                  const selected = selectedSlot === slot.key;
                  return (
                    <Button
                      key={slot.key}
                      type="button"
                      variant="outline"
                      disabled={!available}
                      className={
                        selected
                          ? "border-primary/40 bg-primary/15 text-primary"
                          : "border-white/10 bg-black/20 text-slate-200 hover:bg-white/10 disabled:opacity-35"
                      }
                      onClick={() => setSelectedSlot(slot.key)}
                    >
                      {slot.shortLabel}
                    </Button>
                  );
                })}
              </div>
              {selectedUnavailable ? (
                <p className="mt-2 text-sm text-rose-300">That slot has been taken. Please choose another available time.</p>
              ) : (
                <p className="mt-2 text-sm text-slate-400">Selected: {getSlotLabel(selectedSlot)}</p>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-primary/25 bg-[linear-gradient(180deg,rgba(245,181,43,0.12),rgba(255,255,255,0.04))] p-5">
          <h2 className="text-xl font-bold">Confirm your booking</h2>
          <div className="mt-4">
            <p className="mb-2 text-xs uppercase tracking-[0.16em] text-slate-500">Your name</p>
            <Input value={customerName} onChange={(event) => setCustomerName(event.target.value)} className="border-white/10 bg-black/30 text-white" />
          </div>
          <label className="mt-4 flex items-start gap-3 rounded-xl border border-white/10 bg-black/20 p-3 text-sm leading-6 text-slate-300">
            <Checkbox checked={agreed} onCheckedChange={(checked) => setAgreed(Boolean(checked))} className="mt-1" />
            <span>
              I confirm this tint appointment for {formatDubaiDate(`${selectedDate}T08:00:00+04:00`)} at {getSlotLabel(selectedSlot)}.
              I understand Sean will confirm the final legal shade before installation.
            </span>
          </label>
          {submitError ? <p className="mt-3 text-sm text-rose-300">{submitError}</p> : null}
          <Button
            type="button"
            disabled={!canConfirm || selectedUnavailable || submitting}
            className="mt-5 w-full bg-primary py-6 text-base font-black text-black hover:bg-primary/90"
            onClick={handleConfirm}
          >
            {submitting ? "Confirming..." : `Confirm ${titleCase(booking.tint_package)} slot`}
          </Button>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <h2 className="text-xl font-bold">Location</h2>
          <p className="mt-2 text-sm text-slate-300">{booking.location_name}</p>
          <p className="text-sm text-slate-400">{booking.location_address}</p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" className="border-white/10 bg-black/20 text-white hover:bg-white/10" asChild>
              <a href={booking.location_maps_url} target="_blank" rel="noreferrer">
                <MapPin className="mr-2 h-4 w-4" />
                Open Google Maps
              </a>
            </Button>
            <Button className="bg-emerald-600 text-white hover:bg-emerald-500" asChild>
              <a href={shopWhatsApp} target="_blank" rel="noreferrer">
                <MessageCircle className="mr-2 h-4 w-4" />
                Questions? WhatsApp us
              </a>
            </Button>
          </div>
        </section>
      </main>

      <div className="fixed inset-x-0 bottom-0 border-t border-white/10 bg-black/80 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <div>
            <p className="text-xs text-slate-400">Selected slot</p>
            <p className="text-sm font-semibold">{getSlotLabel(selectedSlot)} · {formatDubaiDate(`${selectedDate}T08:00:00+04:00`)}</p>
          </div>
          <a href="#confirm" className="hidden" />
          <Button
            type="button"
            disabled={!canConfirm || selectedUnavailable || submitting}
            className="bg-primary text-black hover:bg-primary/90"
            onClick={handleConfirm}
          >
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TintBookingConfirmation;
