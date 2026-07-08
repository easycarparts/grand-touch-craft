import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Copy, ExternalLink, MessageCircle, Plus, RefreshCw, RotateCcw, XCircle } from "lucide-react";

import { AdminShell } from "@/components/admin/AdminShell";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import {
  TintBooking,
  TintBookingFormDraft,
  TintBookingSlotKey,
  TintBookingStatus,
  TintLeadOption,
  addDaysToDateString,
  buildCustomerWhatsAppUrl,
  buildTintBookingUrl,
  formatAed,
  formatDubaiDate,
  formatDubaiDateTime,
  getSlotLabel,
  loadTintBookings,
  loadTintLeads,
  makeEmptyTintBookingDraft,
  makeTintBookingDraftFromBooking,
  makeTintBookingDraftFromLead,
  saveTintBooking,
  tintBookingSlots,
  todayDubaiDate,
  updateTintBookingStatus,
} from "@/lib/tint-bookings";

const statusOptions: TintBookingStatus[] = ["sent", "opened", "confirmed", "completed", "cancelled"];

const statusBadgeClass: Record<TintBookingStatus, string> = {
  sent: "border-sky-400/20 bg-sky-500/10 text-sky-200",
  opened: "border-primary/25 bg-primary/10 text-primary",
  confirmed: "border-emerald-400/20 bg-emerald-500/10 text-emerald-200",
  completed: "border-white/10 bg-white/5 text-slate-200",
  cancelled: "border-rose-400/20 bg-rose-500/10 text-rose-200",
};

const titleCase = (value: string) =>
  value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const getLeadVehicle = (lead: TintLeadOption) =>
  lead.vehicle_label || [lead.vehicle_year, lead.vehicle_make, lead.vehicle_model].filter(Boolean).join(" ");

const getBookingVehicle = (booking: TintBooking) =>
  booking.vehicle_label || [booking.vehicle_year, booking.vehicle_make, booking.vehicle_model].filter(Boolean).join(" ");

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
};

const isSameDate = (left: string, right: string) => left.slice(0, 10) === right.slice(0, 10);

const getWeekStart = (dateText: string) => {
  const [year, month, day] = dateText.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const dayIndex = date.getUTCDay();
  const mondayOffset = dayIndex === 0 ? -6 : 1 - dayIndex;
  return addDaysToDateString(dateText, mondayOffset);
};

const makeWeekDates = (weekStart: string) => Array.from({ length: 7 }, (_, index) => addDaysToDateString(weekStart, index));

const cleanPhone = (value: string | null) => value || "No phone";

type BookingDialogState =
  | { mode: "closed" }
  | { mode: "create"; draft: TintBookingFormDraft; sourceLabel: string }
  | { mode: "edit"; draft: TintBookingFormDraft; booking: TintBooking };

function BookingEditorDialog({
  state,
  onOpenChange,
  onSaved,
}: {
  state: BookingDialogState;
  onOpenChange: (open: boolean) => void;
  onSaved: (booking: TintBooking) => void;
}) {
  const { toast } = useToast();
  const [draft, setDraft] = useState<TintBookingFormDraft>(makeEmptyTintBookingDraft());
  const [status, setStatus] = useState<TintBookingStatus>("sent");
  const [saving, setSaving] = useState(false);
  const [savedBooking, setSavedBooking] = useState<TintBooking | null>(null);

  useEffect(() => {
    if (state.mode === "closed") return;
    setDraft(state.draft);
    setStatus(state.mode === "edit" ? state.booking.status : "sent");
    setSavedBooking(null);
  }, [state]);

  const set = (patch: Partial<TintBookingFormDraft>) => setDraft((current) => ({ ...current, ...patch }));
  const booking = state.mode === "edit" ? state.booking : savedBooking;
  const link = booking ? buildTintBookingUrl(booking.token) : null;
  const waUrl = link ? buildCustomerWhatsAppUrl(draft.customerPhone, link, draft.customerName) : null;

  const handleSave = async () => {
    if (!draft.customerName.trim() || !draft.customerPhone.trim()) {
      toast({
        title: "Name and phone needed",
        description: "Add the customer name and WhatsApp number before creating the link.",
        variant: "destructive",
      });
      return;
    }
    if (!draft.slotDate || !draft.slotKey) {
      toast({ title: "Choose a slot", description: "Pick a date and one of the three tint slots.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const nextBooking = await saveTintBooking(draft, state.mode === "edit" ? state.booking.id : null, status);
      setSavedBooking(nextBooking);
      onSaved(nextBooking);
      toast({
        title: state.mode === "edit" ? "Booking updated" : "Confirmation link created",
        description: state.mode === "edit" ? "The tint booking was saved." : "Copy it or send it straight on WhatsApp.",
      });
    } catch (error) {
      toast({
        title: "Could not save booking",
        description: getErrorMessage(error, "Please try another slot."),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={state.mode !== "closed"} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto border-white/10 bg-[#101010] text-white sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{state.mode === "edit" ? "Edit tint booking" : "Create tint confirmation link"}</DialogTitle>
          <DialogDescription className="text-slate-400">
            {state.mode === "create"
              ? `Source: ${state.sourceLabel}. Choose the slot, check the customer details, then send the link.`
              : "Update the booking details or copy the confirmation link again."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="mb-3 text-xs uppercase tracking-[0.16em] text-slate-500">Customer</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input value={draft.customerName} onChange={(event) => set({ customerName: event.target.value })} placeholder="Customer name" className="border-white/10 bg-black/20 text-white" />
              <Input value={draft.customerPhone} onChange={(event) => set({ customerPhone: event.target.value })} placeholder="+971..." className="border-white/10 bg-black/20 text-white" />
              <Input value={draft.customerEmail} onChange={(event) => set({ customerEmail: event.target.value })} placeholder="Email optional" className="border-white/10 bg-black/20 text-white" />
              <Select value={status} onValueChange={(value) => setStatus(value as TintBookingStatus)}>
                <SelectTrigger className="border-white/10 bg-black/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {titleCase(option)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="mb-3 text-xs uppercase tracking-[0.16em] text-slate-500">Vehicle and tint</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <Input value={draft.vehicleMake} onChange={(event) => set({ vehicleMake: event.target.value })} placeholder="Make" className="border-white/10 bg-black/20 text-white" />
              <Input value={draft.vehicleModel} onChange={(event) => set({ vehicleModel: event.target.value })} placeholder="Model" className="border-white/10 bg-black/20 text-white" />
              <Input value={draft.vehicleYear} onChange={(event) => set({ vehicleYear: event.target.value })} placeholder="Year" className="border-white/10 bg-black/20 text-white" />
              <Select value={draft.tintPackage} onValueChange={(value) => set({ tintPackage: value })}>
                <SelectTrigger className="border-white/10 bg-black/20 text-white sm:col-span-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STEK Action">STEK Action</SelectItem>
                  <SelectItem value="STEK Smart Ceramic">STEK Smart Ceramic</SelectItem>
                  <SelectItem value="STEK NEX">STEK NEX</SelectItem>
                  <SelectItem value="Custom tint package">Custom tint package</SelectItem>
                </SelectContent>
              </Select>
              <Input value={draft.quotedPriceAed} onChange={(event) => set({ quotedPriceAed: event.target.value })} placeholder="Price AED" className="border-white/10 bg-black/20 text-white" />
              <Input value={draft.addOnsText} onChange={(event) => set({ addOnsText: event.target.value })} placeholder="Add-ons, comma separated" className="border-white/10 bg-black/20 text-white sm:col-span-3" />
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="mb-3 text-xs uppercase tracking-[0.16em] text-slate-500">Slot</p>
            <div className="grid gap-3 sm:grid-cols-[1fr_1.2fr]">
              <Input type="date" value={draft.slotDate} onChange={(event) => set({ slotDate: event.target.value })} className="border-white/10 bg-black/20 text-white" />
              <div className="grid grid-cols-3 gap-2">
                {tintBookingSlots.map((slot) => (
                  <Button
                    key={slot.key}
                    type="button"
                    variant="outline"
                    className={
                      draft.slotKey === slot.key
                        ? "border-primary/40 bg-primary/15 text-primary"
                        : "border-white/10 bg-black/20 text-slate-200 hover:bg-white/10"
                    }
                    onClick={() => set({ slotKey: slot.key })}
                  >
                    {slot.shortLabel}
                  </Button>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="mb-3 text-xs uppercase tracking-[0.16em] text-slate-500">Notes</p>
            <Textarea value={draft.customerNotes} onChange={(event) => set({ customerNotes: event.target.value })} placeholder="Shown on customer confirmation page" className="min-h-[90px] border-white/10 bg-black/20 text-white" />
            <Textarea value={draft.internalNotes} onChange={(event) => set({ internalNotes: event.target.value })} placeholder="Internal only" className="mt-3 min-h-[80px] border-white/10 bg-black/20 text-white" />
          </section>
        </div>

        {link ? (
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4">
            <p className="text-sm font-medium text-emerald-100">Confirmation link ready</p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <code className="min-w-0 flex-1 overflow-hidden rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-slate-200">
                {link}
              </code>
              <Button type="button" variant="outline" className="border-white/10 bg-black/20" onClick={() => void navigator.clipboard.writeText(link)}>
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </Button>
              {waUrl ? (
                <Button type="button" className="bg-emerald-600 text-white hover:bg-emerald-500" asChild>
                  <a href={waUrl} target="_blank" rel="noreferrer">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Send
                  </a>
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" className="border-white/10 bg-black/20 text-white" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button type="button" className="bg-primary text-black hover:bg-primary/90" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : state.mode === "edit" ? "Save booking" : "Create link"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const AdminTintBookings = () => {
  const { toast } = useToast();
  const [leads, setLeads] = useState<TintLeadOption[]>([]);
  const [bookings, setBookings] = useState<TintBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dialogState, setDialogState] = useState<BookingDialogState>({ mode: "closed" });
  const [weekStart, setWeekStart] = useState(() => getWeekStart(todayDubaiDate()));
  const [updatingBookingId, setUpdatingBookingId] = useState<string | null>(null);

  const load = async (quiet = false) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);
    try {
      const [nextLeads, nextBookings] = await Promise.all([loadTintLeads(), loadTintBookings()]);
      setLeads(nextLeads);
      setBookings(nextBookings);
    } catch (error) {
      toast({
        title: "Could not load tint bookings",
        description: error instanceof Error ? error.message : "Check Supabase setup.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const weekDates = useMemo(() => makeWeekDates(weekStart), [weekStart]);
  const bookedLeadIds = useMemo(
    () => new Set(bookings.filter((booking) => booking.lead_id && booking.status !== "cancelled").map((booking) => booking.lead_id as string)),
    [bookings],
  );
  const unbookedTintLeads = useMemo(() => leads.filter((lead) => !bookedLeadIds.has(lead.id)), [bookedLeadIds, leads]);
  const activeBookings = useMemo(() => bookings.filter((booking) => booking.status !== "cancelled"), [bookings]);
  const cancelledBookings = useMemo(
    () => bookings.filter((booking) => booking.status === "cancelled").sort((a, b) => b.updated_at.localeCompare(a.updated_at)),
    [bookings],
  );
  const upcomingBookings = useMemo(
    () => activeBookings.filter((booking) => booking.status !== "completed").slice(0, 10),
    [activeBookings],
  );
  const confirmedCount = activeBookings.filter((booking) => booking.status === "confirmed").length;
  const awaitingCount = activeBookings.filter((booking) => booking.status === "sent" || booking.status === "opened").length;
  const completedCount = activeBookings.filter((booking) => booking.status === "completed").length;

  const openManualDialog = (slotDate?: string, slotKey?: TintBookingSlotKey) => {
    const draft = makeEmptyTintBookingDraft();
    if (slotDate) draft.slotDate = slotDate;
    if (slotKey) draft.slotKey = slotKey;
    setDialogState({ mode: "create", draft, sourceLabel: "Manual / walk-in" });
  };

  const openLeadDialog = (lead: TintLeadOption) => {
    setDialogState({ mode: "create", draft: makeTintBookingDraftFromLead(lead), sourceLabel: "Tint funnel lead" });
  };

  const openEditDialog = (booking: TintBooking) => {
    setDialogState({ mode: "edit", draft: makeTintBookingDraftFromBooking(booking), booking });
  };

  const handleSaved = (booking: TintBooking) => {
    setBookings((current) => {
      const exists = current.some((item) => item.id === booking.id);
      return exists ? current.map((item) => (item.id === booking.id ? booking : item)) : [booking, ...current];
    });
    void load(true);
  };

  const handleStatusQuickUpdate = async (booking: TintBooking, status: TintBookingStatus) => {
    setUpdatingBookingId(booking.id);
    try {
      const nextBooking = await updateTintBookingStatus(booking, status);
      handleSaved(nextBooking);
      toast({
        title: status === "cancelled" ? "Booking cancelled" : "Booking updated",
        description:
          status === "cancelled"
            ? `${booking.customer_name}'s slot is now free.`
            : `${booking.customer_name} is now ${titleCase(status).toLowerCase()}.`,
      });
    } catch (error) {
      toast({
        title: "Could not update booking",
        description: getErrorMessage(error, "Please try again."),
        variant: "destructive",
      });
    } finally {
      setUpdatingBookingId(null);
    }
  };

  return (
    <AdminShell
      title="Tint Bookings"
      description="A focused tint booking board: tint funnel leads only, manual walk-ins, three daily install slots, and customer confirmation links."
    >
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(10,10,10,0.96))] p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Tint leads ready</p>
          <p className="mt-3 text-3xl font-semibold text-white">{unbookedTintLeads.length}</p>
          <p className="mt-2 text-sm text-slate-400">Not yet linked to a tint booking.</p>
        </Card>
        <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(10,10,10,0.96))] p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Awaiting confirm</p>
          <p className="mt-3 text-3xl font-semibold text-white">{awaitingCount}</p>
          <p className="mt-2 text-sm text-slate-400">Links sent or opened.</p>
        </Card>
        <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(10,10,10,0.96))] p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Confirmed</p>
          <p className="mt-3 text-3xl font-semibold text-white">{confirmedCount}</p>
          <p className="mt-2 text-sm text-slate-400">Customer has locked the slot.</p>
        </Card>
        <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(10,10,10,0.96))] p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Completed</p>
          <p className="mt-3 text-3xl font-semibold text-white">{completedCount}</p>
          <p className="mt-2 text-sm text-slate-400">Marked done here only.</p>
        </Card>
      </div>

      <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(10,10,10,0.96))] p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Tint lead staging</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Create booking links from tint leads only</h2>
            <p className="mt-2 text-sm text-slate-400">
              This keeps the booking panel clean: only `/tint-dubai` leads appear here, plus manual bookings you create for walk-ins.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" className="border-white/10 bg-black/20 text-white hover:bg-white/10" onClick={() => void load(true)} disabled={refreshing}>
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button type="button" className="bg-primary text-black hover:bg-primary/90" onClick={() => openManualDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Manual booking
            </Button>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Estimate</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Received</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-slate-400">Loading tint leads...</TableCell>
                </TableRow>
              ) : unbookedTintLeads.length ? (
                unbookedTintLeads.slice(0, 12).map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <p className="font-medium text-white">{lead.full_name || "Unnamed tint lead"}</p>
                      <p className="text-sm text-slate-400">{cleanPhone(lead.phone)}</p>
                    </TableCell>
                    <TableCell className="text-slate-300">{getLeadVehicle(lead) || "Not captured"}</TableCell>
                    <TableCell className="text-slate-300">{formatAed(lead.latest_quote_estimate)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-sky-400/20 bg-sky-500/10 text-sky-200">
                        {lead.funnel_name || lead.landing_page_variant || "tint"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-300">{formatDubaiDateTime(lead.submitted_at || lead.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <Button type="button" size="sm" className="bg-primary text-black hover:bg-primary/90" onClick={() => openLeadDialog(lead)}>
                        Create booking
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-slate-400">No unbooked tint leads right now.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(10,10,10,0.96))] p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Weekly calendar</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              Week of {formatDubaiDate(`${weekStart}T08:00:00+04:00`)}
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" className="border-white/10 bg-black/20 text-white hover:bg-white/10" onClick={() => setWeekStart(addDaysToDateString(weekStart, -7))}>
              Previous week
            </Button>
            <Button type="button" variant="outline" className="border-white/10 bg-black/20 text-white hover:bg-white/10" onClick={() => setWeekStart(getWeekStart(todayDubaiDate()))}>
              This week
            </Button>
            <Button type="button" variant="outline" className="border-white/10 bg-black/20 text-white hover:bg-white/10" onClick={() => setWeekStart(addDaysToDateString(weekStart, 7))}>
              Next week
            </Button>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <div className="min-w-[980px] rounded-2xl border border-white/10">
            <div className="grid grid-cols-[96px_repeat(7,1fr)] border-b border-white/10">
              <div className="p-3 text-xs uppercase tracking-[0.16em] text-slate-500">Slot</div>
              {weekDates.map((date) => (
                <div key={date} className="border-l border-white/10 p-3 text-sm font-medium text-white">
                  {formatDubaiDate(`${date}T08:00:00+04:00`)}
                </div>
              ))}
            </div>
            {tintBookingSlots.map((slot) => (
              <div key={slot.key} className="grid grid-cols-[96px_repeat(7,1fr)] border-b border-white/10 last:border-b-0">
                <div className="p-3 text-sm font-semibold text-primary">{slot.shortLabel}</div>
                {weekDates.map((date) => {
                  const booking = activeBookings.find(
                    (item) => isSameDate(item.slot_date, date) && item.slot_key === slot.key,
                  );
                  return (
                    <div key={`${date}:${slot.key}`} className="min-h-[116px] border-l border-white/10 p-2">
                      {booking ? (
                        <button
                          type="button"
                          className="h-full w-full rounded-xl border border-white/10 bg-white/[0.04] p-3 text-left transition hover:border-primary/30 hover:bg-primary/10"
                          onClick={() => openEditDialog(booking)}
                        >
                          <Badge variant="outline" className={statusBadgeClass[booking.status]}>
                            {titleCase(booking.status)}
                          </Badge>
                          <p className="mt-2 text-sm font-semibold text-white">{booking.customer_name}</p>
                          <p className="text-xs text-slate-400">{getBookingVehicle(booking) || booking.customer_phone}</p>
                          <p className="mt-1 text-xs text-slate-500">{booking.tint_package}</p>
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="flex h-full min-h-[96px] w-full items-center justify-center rounded-xl border border-dashed border-white/10 text-xs text-slate-500 transition hover:border-primary/30 hover:text-primary"
                          onClick={() => openManualDialog(date, slot.key)}
                        >
                          + Add
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(10,10,10,0.96))] p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <CalendarDays className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-semibold text-white">Upcoming tint bookings</h2>
        </div>
        <div className="mt-5 space-y-3">
          {upcomingBookings.length ? (
            upcomingBookings.map((booking) => {
                const link = buildTintBookingUrl(booking.token);
                const waUrl = buildCustomerWhatsAppUrl(booking.customer_phone, link, booking.customer_name);
                return (
                  <div key={booking.id} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className={statusBadgeClass[booking.status]}>
                          {titleCase(booking.status)}
                        </Badge>
                        <p className="text-sm text-slate-400">{formatDubaiDateTime(booking.slot_start_at)} · {getSlotLabel(booking.slot_key)}</p>
                      </div>
                      <p className="mt-2 font-semibold text-white">{booking.customer_name}</p>
                      <p className="text-sm text-slate-400">
                        {booking.customer_phone} · {getBookingVehicle(booking) || "No vehicle"} · {booking.tint_package}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="outline" size="sm" className="border-white/10 bg-black/20 text-white hover:bg-white/10" onClick={() => void navigator.clipboard.writeText(link)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy
                      </Button>
                      <Button type="button" variant="outline" size="sm" className="border-white/10 bg-black/20 text-white hover:bg-white/10" asChild>
                        <a href={link} target="_blank" rel="noreferrer">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Preview
                        </a>
                      </Button>
                      {waUrl ? (
                        <Button type="button" size="sm" className="bg-emerald-600 text-white hover:bg-emerald-500" asChild>
                          <a href={waUrl} target="_blank" rel="noreferrer">
                            <MessageCircle className="mr-2 h-4 w-4" />
                            Send
                          </a>
                        </Button>
                      ) : null}
                      {booking.status === "confirmed" ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="border-white/10 bg-black/20 text-white hover:bg-white/10"
                          onClick={() => void handleStatusQuickUpdate(booking, "completed")}
                          disabled={updatingBookingId === booking.id}
                        >
                          Complete
                        </Button>
                      ) : null}
                      <Button type="button" size="sm" variant="outline" className="border-white/10 bg-black/20 text-white hover:bg-white/10" onClick={() => openEditDialog(booking)}>
                        Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="border-rose-400/30 bg-rose-500/10 text-rose-100 hover:bg-rose-500/20"
                            disabled={updatingBookingId === booking.id}
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Cancel
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="border-white/10 bg-[#101010] text-white">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Cancel this tint booking?</AlertDialogTitle>
                            <AlertDialogDescription className="text-slate-400">
                              This will free up {getSlotLabel(booking.slot_key)} on {formatDubaiDate(`${booking.slot_date}T08:00:00+04:00`)} and keep the booking in cancelled history.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="border-white/10 bg-black/20 text-white hover:bg-white/10">
                              Keep booking
                            </AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-rose-600 text-white hover:bg-rose-500"
                              onClick={() => void handleStatusQuickUpdate(booking, "cancelled")}
                            >
                              Cancel booking
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                );
              })
          ) : (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-slate-400">
              No tint bookings yet. Create one from a tint lead or add a manual walk-in.
            </div>
          )}
        </div>
      </Card>

      {cancelledBookings.length ? (
        <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(10,10,10,0.96))] p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <XCircle className="h-5 w-5 text-rose-300" />
            <h2 className="text-2xl font-semibold text-white">Cancelled bookings</h2>
          </div>
          <div className="mt-5 space-y-3">
            {cancelledBookings.slice(0, 8).map((booking) => (
              <div key={booking.id} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className={statusBadgeClass.cancelled}>
                      Cancelled
                    </Badge>
                    <p className="text-sm text-slate-400">
                      {formatDubaiDateTime(booking.slot_start_at)} Â· {getSlotLabel(booking.slot_key)}
                    </p>
                  </div>
                  <p className="mt-2 font-semibold text-white">{booking.customer_name}</p>
                  <p className="text-sm text-slate-400">
                    {booking.customer_phone} Â· {getBookingVehicle(booking) || "No vehicle"} Â· {booking.tint_package}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="border-white/10 bg-black/20 text-white hover:bg-white/10"
                    onClick={() => void handleStatusQuickUpdate(booking, "sent")}
                    disabled={updatingBookingId === booking.id}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reopen
                  </Button>
                  <Button type="button" size="sm" variant="outline" className="border-white/10 bg-black/20 text-white hover:bg-white/10" onClick={() => openEditDialog(booking)}>
                    Edit
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      <BookingEditorDialog
        state={dialogState}
        onOpenChange={(open) => {
          if (!open) setDialogState({ mode: "closed" });
        }}
        onSaved={handleSaved}
      />
    </AdminShell>
  );
};

export default AdminTintBookings;
