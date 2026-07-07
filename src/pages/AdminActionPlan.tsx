import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  BriefcaseBusiness,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from "lucide-react";

import { AdminShell } from "@/components/admin/AdminShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type ChecklistItem = {
  id: string;
  title: string;
  detail: string;
  owner: "Sean" | "Sales" | "Ops" | "Marketing" | "Installer";
  cadence: "Once" | "Daily" | "Weekly" | "Trigger";
  priority: "Critical" | "High" | "Normal";
};

type ChecklistSection = {
  id: string;
  title: string;
  subtitle: string;
  icon: typeof Target;
  items: ChecklistItem[];
};

const STORAGE_KEY = "adminActionPlan50kChecklist:v1";

const money = new Intl.NumberFormat("en-AE", {
  style: "currency",
  currency: "AED",
  maximumFractionDigits: 0,
});

const formatMoney = (value: number) => money.format(value);

const targetMetrics = [
  { label: "Owner profit target", value: "AED 50k", detail: "Needs about AED 82k contribution before fixed overhead" },
  { label: "Revenue target", value: "AED 220k+", detail: "30-60 day target across PPF, tint, ceramic, and add-ons" },
  { label: "PPF target", value: "10-15 cars", detail: "Keep PPF as premium revenue, not panic-discount work" },
  { label: "Tint target", value: "35-45 cars", detail: "Smart Ceramic default, Action only as entry price" },
  { label: "Ceramic target", value: "10-12 cars", detail: "Use bay gaps and upsell from tint/PPF bookings" },
  { label: "New hire", value: "1 tint/PPF hybrid", detail: "Add booking assistant only when lead volume chokes sales" },
];

const serviceTargets = [
  {
    service: "PPF",
    volume: "12 cars",
    avgTicket: 9000,
    revenue: 108000,
    contribution: "AED 25k-36k",
    notes: "Sell ForceShield full body around AED 8.5k-9.5k, then bundle tint or ceramic. Keep premium STEK/Dyno at AED 11.5k+.",
  },
  {
    service: "Window tint",
    volume: "40 cars",
    avgTicket: 1650,
    revenue: 66000,
    contribution: "AED 25k-34k",
    notes: "Default to STEK Smart, push windshield add-on, use Action as decoy and NEX as premium upgrade.",
  },
  {
    service: "Ceramic",
    volume: "12 cars",
    avgTicket: 2600,
    revenue: 31200,
    contribution: "AED 15k-22k",
    notes: "Sell proper paint correction plus coating from AED 2.5k. Basic AED 1.5k only fills dead time.",
  },
  {
    service: "Add-ons",
    volume: "10-15 jobs",
    avgTicket: 850,
    revenue: 12750,
    contribution: "AED 6k-10k",
    notes: "Windshield tint, panoramic roof, interior ceramic, rim ceramic, detailing, and pickup/drop convenience.",
  },
];

const checklistSections: ChecklistSection[] = [
  {
    id: "launch-foundation",
    title: "Launch Foundation",
    subtitle: "Do these before scaling spend. They protect the first week from bad tracking and messy ops.",
    icon: ClipboardCheck,
    items: [
      {
        id: "verify-tint-route",
        title: "Open /tint-dubai on mobile and complete the full funnel.",
        detail: "Build a Smart tint quote, add windshield, enter a real test phone, and confirm the thank-you/WhatsApp flow behaves cleanly.",
        owner: "Sean",
        cadence: "Once",
        priority: "Critical",
      },
      {
        id: "verify-meta-lead-event",
        title: "Test Meta Pixel Lead event from the tint funnel.",
        detail: "Use Events Manager test events. A completed phone capture must fire Lead once per session with AED value.",
        owner: "Marketing",
        cadence: "Once",
        priority: "Critical",
      },
      {
        id: "verify-crm-tint-lead",
        title: "Confirm a tint lead appears in CRM with price, package, car size, add-ons, and source.",
        detail: "The lead should show funnel tint_meta_2026h2 or the tint route attribution, with phone and selected package visible.",
        owner: "Sales",
        cadence: "Once",
        priority: "Critical",
      },
      {
        id: "create-tint-booking-sheet",
        title: "Create a simple tint booking view for the week.",
        detail: "Track date, customer, car, package, add-ons, deposit, installer, status, and handover time. CRM is truth, but the day board must be visible.",
        owner: "Ops",
        cadence: "Once",
        priority: "High",
      },
      {
        id: "set-offer-rules",
        title: "Lock the offer rules before ads go live.",
        detail: "Action is entry only. Smart is default. NEX is premium. Windshield is offered on every quote. No random discounting outside the 20% funnel anchor.",
        owner: "Sean",
        cadence: "Once",
        priority: "Critical",
      },
    ],
  },
  {
    id: "meta-tint-campaign",
    title: "Meta Tint Campaign",
    subtitle: "Build the tint demand engine. Start controlled, judge by booked CPA and average ticket.",
    icon: BarChart3,
    items: [
      {
        id: "create-tint-campaign",
        title: "Create campaign: Tint Website Leads - Dubai.",
        detail: "Objective Website Leads. Conversion location website. Pixel event Lead. Destination URL https://www.grandtouchauto.ae/tint-dubai with UTMs.",
        owner: "Marketing",
        cadence: "Once",
        priority: "Critical",
      },
      {
        id: "set-tint-budget",
        title: "Start tint cold campaign at AED 200/day.",
        detail: "Do not launch at AED 600/day immediately. First goal is signal quality: CPL, booked CPA, average ticket, and show rate.",
        owner: "Marketing",
        cadence: "Once",
        priority: "High",
      },
      {
        id: "use-broad-uae-or-dubai",
        title: "Use Dubai/UAE broad targeting first, no tiny stacked interests.",
        detail: "Meta already has automotive signal. Keep learning clean. Split only if you have enough budget and clear creative reasons.",
        owner: "Marketing",
        cadence: "Once",
        priority: "Normal",
      },
      {
        id: "upload-vehicle-specific-creatives",
        title: "Upload vehicle-specific tint creatives.",
        detail: "Minimum set: Patrol, Defender/G-Wagon, Tesla/BYD, Jetour/G700, plus one general heat-rejection video. Your history shows vehicle-specific beats generic.",
        owner: "Marketing",
        cadence: "Once",
        priority: "High",
      },
      {
        id: "write-tint-ad-copy",
        title: "Use direct offer copy, not generic detailing copy.",
        detail: "Angles: STEK Smart Ceramic from AED 1,499, installed in about 3 hours, Dubai heat rejection, legal shades, price in 60 seconds.",
        owner: "Marketing",
        cadence: "Once",
        priority: "High",
      },
      {
        id: "tint-kill-rules",
        title: "Apply tint ad kill rules after spend threshold.",
        detail: "Kill an ad after AED 250-300 spend with zero leads. If CPL is over AED 120 after 3 days, review creative/offer. If booked CPA is under AED 350, prepare scale.",
        owner: "Marketing",
        cadence: "Daily",
        priority: "High",
      },
      {
        id: "scale-tint-by-duplicate",
        title: "Scale winners by duplication, not constant editing.",
        detail: "If the ad set is stable under AED 350 booked CPA and avg ticket is above AED 1,500, duplicate another AED 100-200/day ad set.",
        owner: "Marketing",
        cadence: "Trigger",
        priority: "High",
      },
    ],
  },
  {
    id: "ceramic-campaign",
    title: "Ceramic Campaign",
    subtitle: "Use ceramic as margin filler and upsell first. Do not let it eat all sales attention too early.",
    icon: Sparkles,
    items: [
      {
        id: "define-ceramic-offers",
        title: "Lock three ceramic offers.",
        detail: "Basic from AED 1,500, proper correction plus coating from AED 2,500, full bundle AED 2,999-3,499 with interior/rims/glass options.",
        owner: "Sean",
        cadence: "Once",
        priority: "Critical",
      },
      {
        id: "make-ceramic-retargeting",
        title: "Create ceramic retargeting campaign at AED 50-100/day.",
        detail: "Retarget tint visitors, PPF visitors, IG engagers, and WhatsApp clickers. Offer correction plus ceramic, not cheap coating only.",
        owner: "Marketing",
        cadence: "Once",
        priority: "High",
      },
      {
        id: "create-ceramic-creative",
        title: "Prepare ceramic creatives from real workshop work.",
        detail: "Use before/after correction, water behavior, gloss shots, interior/rim ceramic clips, and a Sean explanation video.",
        owner: "Marketing",
        cadence: "Once",
        priority: "High",
      },
      {
        id: "upsell-ceramic-from-tint",
        title: "Offer ceramic to every tint booking.",
        detail: "Script: Since the car is already in, we can add ceramic from AED 1,500, or proper correction plus coating from AED 2,500.",
        owner: "Sales",
        cadence: "Daily",
        priority: "Critical",
      },
      {
        id: "upsell-ceramic-from-ppf",
        title: "Offer ceramic top coat or wheel/interior ceramic on PPF jobs.",
        detail: "PPF jobs should not leave as bare low-margin jobs when the client can add a small protection bundle.",
        owner: "Sales",
        cadence: "Daily",
        priority: "High",
      },
    ],
  },
  {
    id: "sales-process",
    title: "Sales And Booking Process",
    subtitle: "This is where the CPL advantage becomes profit. Speed, deposits, and package discipline matter more than more leads.",
    icon: Users,
    items: [
      {
        id: "reply-under-five",
        title: "Reply to every new tint/ceramic lead within 5 minutes during working hours.",
        detail: "If response time slips, lead quality will look worse than it is. Fast reply is the cheapest close-rate improvement.",
        owner: "Sales",
        cadence: "Daily",
        priority: "Critical",
      },
      {
        id: "sales-script-smart-default",
        title: "Use Smart Ceramic as the default tint recommendation.",
        detail: "Ask car model, confirm legal shade, recommend Smart, then offer windshield. Action is for price resistance, NEX is for heat-sensitive/luxury owners.",
        owner: "Sales",
        cadence: "Daily",
        priority: "Critical",
      },
      {
        id: "deposit-rule",
        title: "Take AED 100-200 deposit for tint slots.",
        detail: "No deposit means no serious booking when volume rises. Use it to protect installer time and reduce no-shows.",
        owner: "Sales",
        cadence: "Daily",
        priority: "High",
      },
      {
        id: "crm-status-discipline",
        title: "Update CRM status after every touch.",
        detail: "New, contacted, quoted, booked, won, lost, or junk. Without this, CPL and CPA become lies and you cannot scale confidently.",
        owner: "Sales",
        cadence: "Daily",
        priority: "Critical",
      },
      {
        id: "follow-up-cadence",
        title: "Run the 3-touch follow-up cadence.",
        detail: "Touch 1 within 5 min. Touch 2 after 2-3 hours. Touch 3 next morning with a specific slot. Then mark warm/lost correctly.",
        owner: "Sales",
        cadence: "Daily",
        priority: "High",
      },
      {
        id: "booking-assistant-trigger",
        title: "Hire booking assistant when tint/ceramic leads exceed 8-10 per day for 5 straight days.",
        detail: "Assistant handles first reply, booking, deposits, reminders, CRM updates, and passes PPF/ceramic upsells to the main sales guy.",
        owner: "Sean",
        cadence: "Trigger",
        priority: "High",
      },
    ],
  },
  {
    id: "ops-capacity",
    title: "Operations And Capacity",
    subtitle: "Five bays can handle this mix, but only if tint is treated as flow work and PPF keeps dedicated space.",
    icon: BriefcaseBusiness,
    items: [
      {
        id: "hire-tint-installer",
        title: "Hire one tint installer who can help PPF.",
        detail: "Target AED 5k-6k/month for someone real. They should handle 2 tint cars/day and assist with PPF prep or easier film work.",
        owner: "Sean",
        cadence: "Trigger",
        priority: "Critical",
      },
      {
        id: "bay-plan",
        title: "Assign bay roles for the 30-60 day push.",
        detail: "Bay 1 tint flow, bay 2 ceramic/detail/prep, bays 3-4 PPF, bay 5 delivery/rework/overflow.",
        owner: "Ops",
        cadence: "Once",
        priority: "High",
      },
      {
        id: "daily-capacity-check",
        title: "Check tomorrow's bay load before leaving each day.",
        detail: "Confirm PPF cars, tint slots, ceramic cure time, delivery promises, and who owns each vehicle.",
        owner: "Ops",
        cadence: "Daily",
        priority: "Critical",
      },
      {
        id: "quality-check-tint",
        title: "Inspect every tint job before handover.",
        detail: "Check edges, dust, legal shade, windshield clarity, defroster area, and customer-visible warranty explanation.",
        owner: "Installer",
        cadence: "Daily",
        priority: "High",
      },
      {
        id: "photo-every-car",
        title: "Capture handover media for every tint, ceramic, and PPF job.",
        detail: "Minimum: 3 photos and 1 short video. Label car, service, package, and any add-ons for reuse in ads and retargeting.",
        owner: "Marketing",
        cadence: "Daily",
        priority: "High",
      },
      {
        id: "ppf-inhouse-trigger",
        title: "Review in-house PPF hiring after 2 months at 10+ PPF cars/month.",
        detail: "Senior plus junior makes sense when contractor spend is consistently above staff cost and quality can be controlled.",
        owner: "Sean",
        cadence: "Trigger",
        priority: "Normal",
      },
    ],
  },
  {
    id: "ppf-protection",
    title: "PPF Protection Plan",
    subtitle: "Keep PPF premium while tint and ceramic take pressure off the month.",
    icon: ShieldCheck,
    items: [
      {
        id: "keep-ppf-live",
        title: "Keep current PPF lead funnel live and avoid unnecessary rebuilds.",
        detail: "Current CPL around AED 22-30 is strong. The issue is margin and close discipline, not lead cost.",
        owner: "Marketing",
        cadence: "Daily",
        priority: "High",
      },
      {
        id: "ppf-price-ladder",
        title: "Use a PPF price ladder in sales conversations.",
        detail: "Track pack AED 2,999-3,999, full front AED 4,500-5,500, ForceShield full body AED 8,499-9,499, matte AED 9,499-10,500, STEK/Dyno AED 11,500+.",
        owner: "Sales",
        cadence: "Daily",
        priority: "Critical",
      },
      {
        id: "no-panic-discount",
        title: "Do not panic-discount full PPF below margin floor.",
        detail: "If a full body deal needs a low price, attach tint or ceramic. Bare discounted PPF should be avoided unless the bay is empty and cashflow requires it.",
        owner: "Sean",
        cadence: "Daily",
        priority: "Critical",
      },
      {
        id: "bundle-ppf",
        title: "Bundle PPF with Smart tint or ceramic top coat.",
        detail: "Line: Full PPF starts from AED 8,499, but most clients package it with Smart tint or ceramic top coat while the car is already in.",
        owner: "Sales",
        cadence: "Daily",
        priority: "High",
      },
      {
        id: "track-ppf-lead-quality",
        title: "Track PPF lead quality separately from tint volume.",
        detail: "PPF should be judged by qualified rate, quote rate, booked rate, and margin, not just CPL or raw leads.",
        owner: "Sales",
        cadence: "Weekly",
        priority: "High",
      },
    ],
  },
  {
    id: "daily-weekly-checkins",
    title: "Daily And Weekly Check-ins",
    subtitle: "These are the rhythm tasks that keep the 50k target from drifting into hope.",
    icon: CalendarCheck,
    items: [
      {
        id: "daily-10am",
        title: "10:00 daily: review yesterday's leads and missed replies.",
        detail: "Count tint, ceramic, and PPF leads. Check no lead is older than 24 hours without a real first touch.",
        owner: "Sales",
        cadence: "Daily",
        priority: "Critical",
      },
      {
        id: "daily-2pm",
        title: "14:00 daily: check booked slots and deposits.",
        detail: "Confirm today's arrivals, tomorrow's slots, unpaid deposits, and customer pickup/drop details.",
        owner: "Ops",
        cadence: "Daily",
        priority: "High",
      },
      {
        id: "daily-6pm",
        title: "18:00 daily: update revenue booked and jobs delivered.",
        detail: "Record actual invoices, service mix, add-ons sold, no-shows, and open follow-ups before leaving.",
        owner: "Sean",
        cadence: "Daily",
        priority: "Critical",
      },
      {
        id: "weekly-meta-review",
        title: "Weekly: review Meta CPL, booked CPA, close rate, and average ticket.",
        detail: "Scale only if booked CPA and average ticket are healthy. Do not scale a cheap CPL that creates admin noise and no jobs.",
        owner: "Marketing",
        cadence: "Weekly",
        priority: "Critical",
      },
      {
        id: "weekly-profit-review",
        title: "Weekly: review contribution by service.",
        detail: "PPF margin, tint margin, ceramic margin, ad spend, sales commission, and rework cost. Revenue alone is not enough.",
        owner: "Sean",
        cadence: "Weekly",
        priority: "Critical",
      },
      {
        id: "weekly-content-review",
        title: "Weekly: pick the best 5 workshop clips for ads and retargeting.",
        detail: "Prioritize real jobs: tint heat rejection, PPF handovers, ceramic gloss, customer cars, and Sean explaining package choices.",
        owner: "Marketing",
        cadence: "Weekly",
        priority: "Normal",
      },
    ],
  },
];

const readStoredChecklist = () => {
  if (typeof window === "undefined") return {};
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}") as Record<string, boolean>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const allItems = checklistSections.flatMap((section) => section.items);

const priorityClass: Record<ChecklistItem["priority"], string> = {
  Critical: "border-rose-400/25 bg-rose-500/10 text-rose-100",
  High: "border-amber-400/25 bg-amber-500/10 text-amber-100",
  Normal: "border-white/10 bg-white/5 text-slate-200",
};

const ownerClass: Record<ChecklistItem["owner"], string> = {
  Sean: "border-primary/25 bg-primary/10 text-primary",
  Sales: "border-sky-400/25 bg-sky-500/10 text-sky-100",
  Ops: "border-emerald-400/25 bg-emerald-500/10 text-emerald-100",
  Marketing: "border-violet-400/25 bg-violet-500/10 text-violet-100",
  Installer: "border-orange-400/25 bg-orange-500/10 text-orange-100",
};

const AdminActionPlan = () => {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>(() => readStoredChecklist());

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(checkedItems));
  }, [checkedItems]);

  const completedCount = allItems.filter((item) => checkedItems[item.id]).length;
  const progress = allItems.length ? Math.round((completedCount / allItems.length) * 100) : 0;

  const totalRevenueTarget = serviceTargets.reduce((total, row) => total + row.revenue, 0);

  const sectionProgress = useMemo(
    () =>
      checklistSections.map((section) => {
        const done = section.items.filter((item) => checkedItems[item.id]).length;
        return {
          id: section.id,
          done,
          total: section.items.length,
          percent: section.items.length ? Math.round((done / section.items.length) * 100) : 0,
        };
      }),
    [checkedItems],
  );

  const toggleItem = (id: string, checked: boolean) =>
    setCheckedItems((current) => ({
      ...current,
      [id]: checked,
    }));

  const resetChecklist = () => {
    setCheckedItems({});
  };

  return (
    <AdminShell
      title="50k Profit Action Plan"
      description="Execution checklist for the 30-60 day push: keep PPF strong, launch Meta tint, use ceramic as margin filler, protect bay capacity, and build toward AED 50k/month owner profit."
    >
      <div className="space-y-6">
        <Card className="border-white/10 bg-black/25 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="border-primary/25 bg-primary/10 text-primary">
                  30-60 day operating board
                </Badge>
                <Badge variant="outline" className="border-white/10 bg-white/5 text-slate-200">
                  {completedCount} of {allItems.length} tasks done
                </Badge>
              </div>
              <h2 className="mt-3 text-2xl font-semibold text-white">Progress to launch-ready execution</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                Use this page as the daily checklist. It is intentionally detailed so small operational tasks do not
                get lost while PPF, tint, and ceramic are running at the same time.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="border-white/10 bg-black/20 text-slate-200 hover:bg-white/10"
              onClick={resetChecklist}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset checklist
            </Button>
          </div>
          <div className="mt-5">
            <Progress value={progress} className="h-2 bg-white/10" />
            <p className="mt-2 text-sm text-slate-400">{progress}% complete on this browser.</p>
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {targetMetrics.map((metric) => (
            <Card key={metric.label} className="border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(8,8,8,0.96))] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{metric.label}</p>
              <p className="mt-2 text-2xl font-bold text-white">{metric.value}</p>
              <p className="mt-1 text-sm leading-6 text-slate-400">{metric.detail}</p>
            </Card>
          ))}
        </div>

        <Card className="border-white/10 bg-black/20 p-5">
          <div className="flex items-start gap-3">
            <Target className="mt-1 h-5 w-5 text-primary" />
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Monthly target model</p>
              <h2 className="mt-1 text-xl font-semibold text-white">
                Target revenue: {formatMoney(totalRevenueTarget)}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                This is the practical mix for AED 50k/month owner profit: PPF stays meaningful, tint creates daily
                cashflow, and ceramic adds margin in free bay space.
              </p>
            </div>
          </div>
          <div className="mt-5 grid gap-4 xl:grid-cols-4">
            {serviceTargets.map((row) => (
              <div key={row.service} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-white">{row.service}</h3>
                  <Badge variant="outline" className="border-white/10 bg-black/20 text-slate-200">
                    {row.volume}
                  </Badge>
                </div>
                <p className="mt-3 text-sm text-slate-400">Avg ticket</p>
                <p className="text-lg font-bold text-white">{formatMoney(row.avgTicket)}</p>
                <p className="mt-2 text-sm text-slate-400">Revenue target</p>
                <p className="text-lg font-bold text-white">{formatMoney(row.revenue)}</p>
                <p className="mt-2 text-sm text-slate-400">Contribution</p>
                <p className="text-sm font-semibold text-emerald-200">{row.contribution}</p>
                <p className="mt-3 text-xs leading-5 text-slate-500">{row.notes}</p>
              </div>
            ))}
          </div>
        </Card>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {sectionProgress.map((row) => {
            const section = checklistSections.find((candidate) => candidate.id === row.id);
            return (
              <Card key={row.id} className="border-white/10 bg-black/20 p-4">
                <p className="text-sm font-semibold text-white">{section?.title}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {row.done}/{row.total} done
                </p>
                <Progress value={row.percent} className="mt-3 h-1.5 bg-white/10" />
              </Card>
            );
          })}
        </div>

        <div className="space-y-5">
          {checklistSections.map((section) => {
            const Icon = section.icon;
            const sectionDone = section.items.every((item) => checkedItems[item.id]);

            return (
              <Card key={section.id} className="border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(9,9,9,0.96))] p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
                      {sectionDone ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                      ) : (
                        <Icon className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-white">{section.title}</h2>
                      <p className="mt-1 max-w-4xl text-sm leading-6 text-slate-400">{section.subtitle}</p>
                    </div>
                  </div>
                  {sectionDone ? (
                    <Badge variant="outline" className="w-fit border-emerald-400/20 bg-emerald-500/10 text-emerald-100">
                      Section complete
                    </Badge>
                  ) : null}
                </div>

                <div className="mt-5 space-y-3">
                  {section.items.map((item) => {
                    const isDone = Boolean(checkedItems[item.id]);
                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "rounded-lg border p-4 transition-colors",
                          isDone ? "border-emerald-400/20 bg-emerald-500/5" : "border-white/10 bg-black/20",
                        )}
                      >
                        <div className="flex gap-3">
                          <Checkbox
                            checked={isDone}
                            onCheckedChange={(value) => toggleItem(item.id, value === true)}
                            aria-label={`Mark ${item.title} as done`}
                            className="mt-1 border-white/30 data-[state=checked]:border-emerald-400 data-[state=checked]:bg-emerald-500"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                              <h3 className={cn("font-semibold", isDone ? "text-emerald-100 line-through decoration-emerald-300/50" : "text-white")}>
                                {item.title}
                              </h3>
                              <div className="flex flex-wrap gap-2">
                                <Badge variant="outline" className={priorityClass[item.priority]}>
                                  {item.priority}
                                </Badge>
                                <Badge variant="outline" className={ownerClass[item.owner]}>
                                  {item.owner}
                                </Badge>
                                <Badge variant="outline" className="border-white/10 bg-white/5 text-slate-200">
                                  {item.cadence}
                                </Badge>
                              </div>
                            </div>
                            <p className="mt-2 text-sm leading-6 text-slate-400">{item.detail}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </AdminShell>
  );
};

export default AdminActionPlan;
