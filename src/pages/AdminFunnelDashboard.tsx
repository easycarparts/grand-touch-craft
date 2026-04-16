import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  CircleDashed,
  Clock3,
  MessageCircle,
  MousePointerClick,
  RefreshCw,
  Users,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  FUNNEL_EVENTS_UPDATED_EVENT,
  readStoredFunnelEvents,
  resetFunnelBrowserState,
  type FunnelEventRecord,
} from "@/lib/funnel-analytics";
import {
  countQuoteSelections,
  formatVideoEngagement,
  getIntentScore,
  getVehicleIdentityLabel,
} from "@/lib/funnel-intent";
import { supabase } from "@/lib/supabase";

const journeySteps = [
  { label: "Landing View", eventNames: ["lp_view"] },
  { label: "CTA Click", eventNames: ["hero_cta_click", "quote_cta_click"] },
  { label: "Quote Modal", eventNames: ["quote_modal_opened"] },
  {
    label: "Contact Saved",
    eventNames: ["lead_contact_captured"],
  },
  {
    label: "Vehicle Saved",
    eventNames: ["lead_vehicle_captured"],
  },
  { label: "Quote Intent", eventNames: ["quote_unlock_requested", "quote_unlocked"] },
  { label: "Lead Submit", eventNames: ["lead_form_submitted"] },
  { label: "WhatsApp", eventNames: ["whatsapp_click"] },
];

const chartConfig = {
  sessions: {
    label: "Sessions",
    color: "#f7b52b",
  },
  events: {
    label: "Events",
    color: "#25D366",
  },
};

type SessionRow = {
  sessionId: string;
  visitorId: string;
  startedAt: string;
  endedAt: string;
  sourcePlatform: string;
  landingPageVariant: string;
  pathname: string;
  events: number;
  leadSubmitted: boolean;
  whatsappClicked: boolean;
  quoteModalOpened: boolean;
  unlockRequested: boolean;
  durationMs: number;
  maxScrollPercent: number;
  videoMaxProgressPercent: number;
  videoStarted: boolean;
  packageName: string;
  vehicleSize: string;
  finish: string;
  coverage: string;
  quoteEstimate: number | null;
  leadName: string;
  leadPhone: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: string;
  sectionsViewed: string[];
  faqOpenCount: number;
  lastCheckpointReason: string;
  intentScore: number;
};

type SessionMilestone = {
  stepNumber: number;
  label: string;
  detail: string;
  complete: boolean;
};

type SessionAccumulator = Omit<SessionRow, "sectionsViewed" | "intentScore"> & {
  sectionsViewed: Set<string>;
};

const countUnique = (values: string[]) => new Set(values.filter(Boolean)).size;

const formatEventName = (value: string) =>
  value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const formatTimestamp = (value: string) =>
  new Intl.DateTimeFormat("en-AE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

const formatCompactId = (value: string) => value.slice(0, 8);
const formatDurationMs = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) return "0s";

  const totalSeconds = Math.round(value / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes <= 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
};

const formatSectionName = (value: string) =>
  value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const formatCurrency = (value: number | null) =>
  value === null ? "Not unlocked" : `AED ${value.toLocaleString("en-AE")}`;

const normalizePhone = (value: string) => value.replace(/[\s-]/g, "");

const DUBAI_LOCALE = "en-CA";
const DUBAI_TIMEZONE = "Asia/Dubai";
const DASHBOARD_BASELINES_STORAGE_KEY = "grand-touch-funnel-dashboard-baselines-v1";

const SITE_ORIGIN = "https://www.grandtouchauto.ae";

/** TikTok paid social template for the live cache-bust path. Funnel filter: `ppf_tiktok_quote`. TikTok may append `ttclid`. */
const TIKTOK_QUOTE_FUNNEL_TRACKING_URL = `${SITE_ORIGIN}/ppf-tiktok-quote_2?utm_source=tiktok&utm_medium=paid_social&utm_campaign=tiktok_leadfunnel_apr&utm_id=__CAMPAIGN_ID__`;

type DashboardDatePreset =
  | "all"
  | "today"
  | "yesterday"
  | "last_7_days"
  | "last_30_days"
  | "custom";

const getDubaiDateKey = (date: Date) =>
  new Intl.DateTimeFormat(DUBAI_LOCALE, {
    timeZone: DUBAI_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

const shiftDateKey = (dateKey: string, dayOffset: number) => {
  const [year, month, day] = dateKey.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + dayOffset));
  return shifted.toISOString().slice(0, 10);
};

const getDateRangeLabel = (
  preset: DashboardDatePreset,
  customStartDate: string,
  customEndDate: string,
) => {
  switch (preset) {
    case "today":
      return "Today";
    case "yesterday":
      return "Yesterday";
    case "last_7_days":
      return "Last 7 days";
    case "last_30_days":
      return "Last 30 days";
    case "custom":
      if (customStartDate && customEndDate) return `${customStartDate} to ${customEndDate}`;
      if (customStartDate) return `From ${customStartDate}`;
      if (customEndDate) return `Until ${customEndDate}`;
      return "Custom dates";
    default:
      return "All time";
  }
};

type DashboardBaseline = {
  id: string;
  startedAt: string;
  endedAt: string | null;
  label: string;
  funnelKey: string;
};

const getIntentBand = (score: number) => {
  if (score >= 75) {
    return {
      label: "High intent",
      className: "border-emerald-400/20 bg-emerald-500/10 text-emerald-200",
    };
  }

  if (score >= 45) {
    return {
      label: "Medium intent",
      className: "border-primary/25 bg-primary/10 text-primary",
    };
  }

  return {
    label: "Low intent",
    className: "border-white/10 bg-white/5 text-slate-300",
  };
};

const getDropOffHint = (row: SessionRow) => {
  if (row.leadSubmitted || row.whatsappClicked) {
    return "Converted into a direct action.";
  }

  if (!row.quoteModalOpened && !countQuoteSelections(row)) {
    return "Lost before the quote flow really started.";
  }

  if (!row.leadName || !row.leadPhone) {
    return "Opened the flow but never left usable contact details.";
  }

  if (!row.vehicleMake || !row.vehicleModel || !row.vehicleYear) {
    return "Shared contact details but stalled on vehicle details.";
  }

  if (row.quoteEstimate === null && !row.unlockRequested) {
    return "Built some quote intent but never unlocked the estimate.";
  }

  return "Strong engagement, but no final conversion action.";
};

const matchesSessionSearch = (row: SessionRow, query: string) => {
  if (!query.trim()) return true;

  const haystack = [
    row.sessionId,
    row.visitorId,
    row.leadName,
    row.leadPhone,
    normalizePhone(row.leadPhone),
    row.vehicleMake,
    row.vehicleModel,
    row.vehicleYear,
    getVehicleIdentityLabel(row),
    row.packageName,
    row.vehicleSize,
    row.finish,
    row.coverage,
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query.trim().toLowerCase());
};

const getSessionPrimaryLabel = (row: SessionRow) =>
  row.leadName || row.leadPhone || formatCompactId(row.sessionId);

const getSessionSecondaryLabel = (row: SessionRow) => {
  if (row.leadName && row.leadPhone) return row.leadPhone;
  if (row.leadName) return formatCompactId(row.sessionId);
  if (row.leadPhone) return formatCompactId(row.sessionId);
  return row.visitorId ? formatCompactId(row.visitorId) : "Anonymous visitor";
};

const getSessionStatus = (row: SessionRow) => {
  if (row.leadSubmitted || row.whatsappClicked) {
    return {
      label: "Goal hit",
      className: "border-emerald-400/20 bg-emerald-500/10 text-emerald-200",
    };
  }

  if (row.unlockRequested || row.quoteModalOpened || countQuoteSelections(row) >= 2) {
    return {
      label: "Warm lead",
      className: "border-primary/25 bg-primary/10 text-primary",
    };
  }

  if (row.maxScrollPercent >= 50 || row.videoMaxProgressPercent >= 25 || row.videoStarted) {
    return {
      label: "Engaged",
      className: "border-sky-400/20 bg-sky-500/10 text-sky-200",
    };
  }

  return {
    label: "Needs work",
    className: "border-white/10 bg-white/5 text-slate-300",
  };
};

const buildSessionMilestones = (row: SessionRow): SessionMilestone[] => {
  const quoteSelections = countQuoteSelections(row);
  const conversionDetail = row.leadSubmitted
    ? row.whatsappClicked
      ? "Submitted the lead form and also clicked WhatsApp"
      : "Submitted the lead form"
    : row.whatsappClicked
      ? "Clicked WhatsApp instead of the form"
      : "No primary conversion action yet";

  const calculatorTouched = row.quoteModalOpened || row.unlockRequested || quoteSelections > 0;
  const calculatorDetail = calculatorTouched
    ? row.quoteModalOpened
      ? "Opened the quote calculator"
      : "Entered the quote flow through tracked selections"
    : "Never opened the quote calculator";

  const calculatorConfigured = row.unlockRequested || row.quoteEstimate !== null || quoteSelections >= 3;
  const calculatorConfigDetail =
    row.quoteEstimate !== null
      ? `Unlocked ${formatCurrency(row.quoteEstimate)}`
      : quoteSelections > 0
        ? `Made ${quoteSelections} of 4 core quote selections`
        : "No quote selections recorded";

  const deeperEngagement =
    row.videoMaxProgressPercent >= 50 ||
    row.videoStarted ||
    row.maxScrollPercent >= 70 ||
    row.sectionsViewed.length >= 4 ||
    row.faqOpenCount > 0;

  const engagementParts = [
    row.maxScrollPercent ? `${row.maxScrollPercent}% scroll` : "",
    row.videoMaxProgressPercent
      ? `${row.videoMaxProgressPercent}% video`
      : row.videoStarted
        ? "Played <25% video"
        : "",
    row.sectionsViewed.length ? `${row.sectionsViewed.length} sections viewed` : "",
    row.faqOpenCount ? `${row.faqOpenCount} FAQ opens` : "",
  ].filter(Boolean);

  return [
    {
      stepNumber: 1,
      label: "Primary goal",
      detail: conversionDetail,
      complete: row.leadSubmitted || row.whatsappClicked,
    },
    {
      stepNumber: 2,
      label: "Opened calculator",
      detail: calculatorDetail,
      complete: calculatorTouched,
    },
    {
      stepNumber: 3,
      label: "Configured quote",
      detail: calculatorConfigDetail,
      complete: calculatorConfigured,
    },
    {
      stepNumber: 4,
      label: "Consumed trust content",
      detail: engagementParts.length
        ? engagementParts.join(" | ")
        : "Low scroll depth and no strong trust signals yet",
      complete: deeperEngagement,
    },
  ];
};

const StepMilestoneGrid = ({
  milestones,
  compact = false,
}: {
  milestones: SessionMilestone[];
  compact?: boolean;
}) => (
  <div className={compact ? "grid gap-3 md:grid-cols-2" : "grid gap-3 lg:grid-cols-2 2xl:grid-cols-4"}>
    {milestones.map((milestone) => (
      <div
        key={milestone.stepNumber}
        className={`rounded-2xl border p-4 transition-colors ${
          milestone.complete
            ? "border-emerald-400/20 bg-emerald-500/10"
            : "border-white/10 bg-white/5"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
              milestone.complete
                ? "bg-emerald-400/20 text-emerald-100"
                : "bg-white/10 text-slate-200"
            }`}
          >
            {milestone.stepNumber}
          </div>
          {milestone.complete ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-300" />
          ) : (
            <CircleDashed className="h-5 w-5 text-slate-500" />
          )}
        </div>
        <p className="mt-4 text-sm font-semibold text-white">{milestone.label}</p>
        <p className="mt-1 text-xs leading-5 text-slate-300">{milestone.detail}</p>
      </div>
    ))}
  </div>
);

const summarizePayload = (record: FunnelEventRecord) => {
  const payload = record.payload;

  if (typeof payload.lead_name === "string" && typeof payload.lead_phone === "string") {
    return `${payload.lead_name} | ${payload.lead_phone}`;
  }
  if (
    typeof payload.vehicle_make === "string" &&
    typeof payload.vehicle_model === "string" &&
    typeof payload.vehicle_year === "string"
  ) {
    return `${payload.vehicle_year} ${payload.vehicle_make} ${payload.vehicle_model}`;
  }
  if (typeof payload.cta_location === "string") return `CTA: ${payload.cta_location}`;
  if (typeof payload.step_name === "string") return `Step: ${payload.step_name}`;
  if (typeof payload.package_name === "string") return payload.package_name;
  if (typeof payload.vehicle_label === "string") return payload.vehicle_label;
  if (typeof payload.vehicle_size === "string") return `Size: ${payload.vehicle_size}`;
  if (typeof payload.finish === "string") return `Finish: ${payload.finish}`;
  if (typeof payload.coverage === "string") return `Coverage: ${payload.coverage}`;
  if (typeof payload.flow === "string") return `Flow: ${payload.flow}`;

  return "No extra payload";
};

const AdminFunnelDashboard = () => {
  const [records, setRecords] = useState<FunnelEventRecord[]>([]);
  const [selectedFunnel, setSelectedFunnel] = useState<string>("all");
  const [selectedSessionId, setSelectedSessionId] = useState<string>("all");
  const [sessionSearch, setSessionSearch] = useState("");
  const [datePreset, setDatePreset] = useState<DashboardDatePreset>("last_7_days");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [sessionStatusFilter, setSessionStatusFilter] = useState("all");
  const [sessionLimit, setSessionLimit] = useState("5");
  const [baselineLabelInput, setBaselineLabelInput] = useState("");
  const [baselineStartInput, setBaselineStartInput] = useState("");
  const [savedBaselines, setSavedBaselines] = useState<DashboardBaseline[]>([]);
  const [activeBaselineId, setActiveBaselineId] = useState<string>("all");
  const [tiktokTrackingUrlCopied, setTiktokTrackingUrlCopied] = useState(false);

  const refreshRecords = async () => {
    if (!supabase) {
      setRecords(readStoredFunnelEvents());
      return;
    }

    const { data, error } = await supabase
      .from("lead_events")
      .select(
        "id, external_event_id, occurred_at, event_name, funnel_name, landing_page_variant, source_platform, pathname, session_id, visitor_id, attribution, payload",
      )
      .order("occurred_at", { ascending: false })
      .limit(5000);

    if (error) {
      console.warn("Failed to load funnel events from Supabase", error);
      setRecords(readStoredFunnelEvents());
      return;
    }

    setRecords(
      ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
        id: String(row.external_event_id || row.id),
        timestamp: String(row.occurred_at),
        event_name: String(row.event_name),
        funnel_name: String(row.funnel_name),
        landing_page_variant: String(row.landing_page_variant || ""),
        source_platform: String(row.source_platform || ""),
        pathname: String(row.pathname || ""),
        session_id: String(row.session_id),
        visitor_id: String(row.visitor_id || ""),
        attribution: (row.attribution as FunnelEventRecord["attribution"]) || {
          utm_source: "",
          utm_medium: "",
          utm_campaign: "",
          utm_term: "",
          utm_content: "",
          utm_id: "",
          gclid: "",
          fbclid: "",
          ttclid: "",
        },
        payload: (row.payload as FunnelEventRecord["payload"]) || {},
      })),
    );
  };

  useEffect(() => {
    void refreshRecords();

    const onStorage = () => void refreshRecords();
    window.addEventListener("storage", onStorage);
    window.addEventListener(FUNNEL_EVENTS_UPDATED_EVENT, onStorage);
    const intervalId = window.setInterval(() => {
      void refreshRecords();
    }, 15000);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(FUNNEL_EVENTS_UPDATED_EVENT, onStorage);
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = window.localStorage.getItem(DASHBOARD_BASELINES_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as DashboardBaseline[];
      if (!Array.isArray(parsed)) return;
      setSavedBaselines(
        parsed
          .filter(
            (baseline) =>
              baseline &&
              typeof baseline.id === "string" &&
              typeof baseline.startedAt === "string" &&
              typeof baseline.label === "string",
          )
          .map((baseline) => ({
            ...baseline,
            endedAt:
              typeof baseline.endedAt === "string" || baseline.endedAt === null
                ? baseline.endedAt
                : null,
            funnelKey:
              typeof baseline.funnelKey === "string" && baseline.funnelKey
                ? baseline.funnelKey
                : "all",
          })),
      );
    } catch {
      // Ignore malformed storage.
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      window.localStorage.setItem(
        DASHBOARD_BASELINES_STORAGE_KEY,
        JSON.stringify(savedBaselines),
      );
    } catch {
      // Ignore storage failures.
    }
  }, [savedBaselines]);

  const funnelOptions = useMemo(() => {
    const unique = Array.from(new Set(records.map((record) => record.funnel_name))).filter(Boolean);
    return ["all", ...unique];
  }, [records]);

  const allSavedBaselines = useMemo(
    () =>
      savedBaselines
        .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()),
    [savedBaselines],
  );

  const activeBaseline = useMemo(
    () => allSavedBaselines.find((baseline) => baseline.id === activeBaselineId) ?? null,
    [activeBaselineId, allSavedBaselines],
  );
  const dashboardBaseline = activeBaseline;

  const filteredRecords = useMemo(() => {
    const todayDubai = getDubaiDateKey(new Date());
    const yesterdayDubai = shiftDateKey(todayDubai, -1);
    const last7Start = shiftDateKey(todayDubai, -6);
    const last30Start = shiftDateKey(todayDubai, -29);

    return records.filter((record) => {
      const matchesFunnel =
        selectedFunnel === "all" || record.funnel_name === selectedFunnel;

      if (!matchesFunnel) return false;

      if (
        activeBaseline &&
        new Date(record.timestamp).getTime() < new Date(activeBaseline.startedAt).getTime()
      ) {
        return false;
      }

      if (
        activeBaseline?.endedAt &&
        new Date(record.timestamp).getTime() > new Date(activeBaseline.endedAt).getTime()
      ) {
        return false;
      }

      if (datePreset === "all") return true;

      const recordDateKey = getDubaiDateKey(new Date(record.timestamp));

      if (datePreset === "today") return recordDateKey === todayDubai;
      if (datePreset === "yesterday") return recordDateKey === yesterdayDubai;
      if (datePreset === "last_7_days") {
        return recordDateKey >= last7Start && recordDateKey <= todayDubai;
      }
      if (datePreset === "last_30_days") {
        return recordDateKey >= last30Start && recordDateKey <= todayDubai;
      }
      if (datePreset === "custom") {
        const matchesStart = !customStartDate || recordDateKey >= customStartDate;
        const matchesEnd = !customEndDate || recordDateKey <= customEndDate;
        return matchesStart && matchesEnd;
      }

      return true;
    });
  }, [records, selectedFunnel, datePreset, customStartDate, customEndDate, activeBaseline]);

  const sessionRows = useMemo(() => {
    const grouped = new Map<string, SessionAccumulator>();

    for (const record of filteredRecords) {
      const current = grouped.get(record.session_id) || {
        sessionId: record.session_id,
        visitorId: record.visitor_id,
        startedAt: record.timestamp,
        endedAt: record.timestamp,
        sourcePlatform: record.source_platform,
        landingPageVariant: record.landing_page_variant,
        pathname: record.pathname,
        events: 0,
        leadSubmitted: false,
        whatsappClicked: false,
        quoteModalOpened: false,
        unlockRequested: false,
        durationMs: 0,
        maxScrollPercent: 0,
        videoMaxProgressPercent: 0,
        videoStarted: false,
        packageName: "",
        vehicleSize: "",
        finish: "",
        coverage: "",
        quoteEstimate: null,
        leadName: "",
        leadPhone: "",
        vehicleMake: "",
        vehicleModel: "",
        vehicleYear: "",
        sectionsViewed: new Set<string>(),
        faqOpenCount: 0,
        lastCheckpointReason: "",
      };

      current.events += 1;
      if (new Date(record.timestamp).getTime() < new Date(current.startedAt).getTime()) {
        current.startedAt = record.timestamp;
      }
      if (new Date(record.timestamp).getTime() > new Date(current.endedAt).getTime()) {
        current.endedAt = record.timestamp;
      }
      current.leadSubmitted ||= record.event_name === "lead_form_submitted";
      current.whatsappClicked ||= record.event_name === "whatsapp_click";
      current.quoteModalOpened ||= record.event_name === "quote_modal_opened";
      current.unlockRequested ||= record.event_name === "quote_unlock_requested";
      current.videoStarted ||= ["manual_video_play", "video_progress", "video_completed"].includes(
        record.event_name,
      );
      if (typeof record.payload.elapsed_ms === "number") {
        current.durationMs = Math.max(current.durationMs, record.payload.elapsed_ms);
      }
      if (typeof record.payload.max_scroll_percent === "number") {
        current.maxScrollPercent = Math.max(current.maxScrollPercent, record.payload.max_scroll_percent);
      }
      if (typeof record.payload.scroll_percent === "number") {
        current.maxScrollPercent = Math.max(current.maxScrollPercent, record.payload.scroll_percent);
      }
      if (typeof record.payload.current_scroll_percent === "number") {
        current.maxScrollPercent = Math.max(current.maxScrollPercent, record.payload.current_scroll_percent);
      }
      if (typeof record.payload.progress_percent === "number") {
        current.videoMaxProgressPercent = Math.max(
          current.videoMaxProgressPercent,
          record.payload.progress_percent,
        );
      }
      if (typeof record.payload.max_progress_percent === "number") {
        current.videoMaxProgressPercent = Math.max(
          current.videoMaxProgressPercent,
          record.payload.max_progress_percent,
        );
      }
      if (typeof record.payload.package_name === "string") {
        current.packageName = record.payload.package_name;
      }
      if (typeof record.payload.vehicle_size === "string") {
        current.vehicleSize = record.payload.vehicle_size;
      }
      if (!current.vehicleSize && typeof record.payload.size === "string") {
        current.vehicleSize = record.payload.size;
      }
      if (typeof record.payload.finish === "string") {
        current.finish = record.payload.finish;
      }
      if (typeof record.payload.coverage === "string") {
        current.coverage = record.payload.coverage;
      }
      if (typeof record.payload.estimate_value === "number") {
        current.quoteEstimate = record.payload.estimate_value;
      }
      if (typeof record.payload.lead_name === "string") {
        current.leadName = record.payload.lead_name;
      }
      if (typeof record.payload.lead_phone === "string") {
        current.leadPhone = record.payload.lead_phone;
      }
      if (typeof record.payload.vehicle_make === "string") {
        current.vehicleMake = record.payload.vehicle_make;
      }
      if (typeof record.payload.vehicle_model === "string") {
        current.vehicleModel = record.payload.vehicle_model;
      }
      if (typeof record.payload.vehicle_year === "string") {
        current.vehicleYear = record.payload.vehicle_year;
      }
      if (record.event_name === "section_view" && typeof record.payload.section_name === "string") {
        current.sectionsViewed.add(record.payload.section_name);
      }
      if (record.event_name === "faq_opened") {
        current.faqOpenCount += 1;
      }
      if (
        record.event_name === "page_checkpoint" &&
        typeof record.payload.checkpoint_reason === "string"
      ) {
        current.lastCheckpointReason = record.payload.checkpoint_reason;
      }

      grouped.set(record.session_id, current);
    }

    return Array.from(grouped.values())
      .map((row) => ({
        ...row,
        sectionsViewed: Array.from(row.sectionsViewed),
        durationMs:
          row.durationMs ||
          Math.max(0, new Date(row.endedAt).getTime() - new Date(row.startedAt).getTime()),
        intentScore: getIntentScore({
          ...row,
          sectionsViewed: Array.from(row.sectionsViewed),
          durationMs:
            row.durationMs ||
            Math.max(0, new Date(row.endedAt).getTime() - new Date(row.startedAt).getTime()),
        }),
      }))
      .sort((a, b) => new Date(b.endedAt).getTime() - new Date(a.endedAt).getTime());
  }, [filteredRecords]);

  const filteredSessionRows = useMemo(() => {
    const filtered = sessionRows.filter((row) => {
      const matchesSearch = matchesSessionSearch(row, sessionSearch);
      const statusLabel = getSessionStatus(row).label.toLowerCase().replace(/\s+/g, "_");
      const matchesStatus =
        sessionStatusFilter === "all" || statusLabel === sessionStatusFilter;

      return matchesSearch && matchesStatus;
    });

    return filtered.slice(0, Number(sessionLimit));
  }, [sessionLimit, sessionRows, sessionSearch, sessionStatusFilter]);

  const matchingSessionCount = useMemo(() => {
    return sessionRows.filter((row) => {
      const matchesSearch = matchesSessionSearch(row, sessionSearch);
      const statusLabel = getSessionStatus(row).label.toLowerCase().replace(/\s+/g, "_");
      const matchesStatus =
        sessionStatusFilter === "all" || statusLabel === sessionStatusFilter;

      return matchesSearch && matchesStatus;
    }).length;
  }, [sessionRows, sessionSearch, sessionStatusFilter]);

  const focusedSessionId = useMemo(
    () => (selectedSessionId === "all" ? filteredSessionRows[0]?.sessionId ?? "all" : selectedSessionId),
    [filteredSessionRows, selectedSessionId],
  );

  const focusedSession = useMemo(
    () => filteredSessionRows.find((row) => row.sessionId === focusedSessionId) ?? null,
    [filteredSessionRows, focusedSessionId],
  );

  const filteredSessionRecords = useMemo(() => {
    if (focusedSessionId === "all") return filteredRecords;
    return filteredRecords.filter((record) => record.session_id === focusedSessionId);
  }, [filteredRecords, focusedSessionId]);

  const focusedSessionRecords = useMemo(() => {
    if (focusedSessionId === "all") return [];
    return filteredRecords.filter((record) => record.session_id === focusedSessionId);
  }, [filteredRecords, focusedSessionId]);

  useEffect(() => {
    if (selectedSessionId === "all") return;
    if (filteredSessionRows.some((row) => row.sessionId === selectedSessionId)) return;
    setSelectedSessionId("all");
  }, [filteredSessionRows, selectedSessionId]);

  const totals = useMemo(() => {
    const visitors = countUnique(filteredRecords.map((record) => record.visitor_id));
    const sessions = countUnique(filteredRecords.map((record) => record.session_id));
    const leadSubmits = filteredRecords.filter((record) => record.event_name === "lead_form_submitted").length;
    const whatsappClicks = filteredRecords.filter((record) => record.event_name === "whatsapp_click").length;

    return {
      events: filteredRecords.length,
      visitors,
      sessions,
      leadSubmits,
      whatsappClicks,
    };
  }, [filteredRecords]);

  const funnelStepData = useMemo(
    () =>
      journeySteps.map((step) => {
        const matching = filteredRecords.filter((record) => step.eventNames.includes(record.event_name));
        return {
          step: step.label,
          sessions: countUnique(matching.map((record) => record.session_id)),
        };
      }),
    [filteredRecords],
  );

  const eventBreakdown = useMemo(() => {
    const grouped = new Map<
      string,
      { eventName: string; events: number; sessions: Set<string>; visitors: Set<string> }
    >();

    for (const record of filteredRecords) {
      const current = grouped.get(record.event_name) || {
        eventName: record.event_name,
        events: 0,
        sessions: new Set<string>(),
        visitors: new Set<string>(),
      };

      current.events += 1;
      current.sessions.add(record.session_id);
      current.visitors.add(record.visitor_id);
      grouped.set(record.event_name, current);
    }

    return Array.from(grouped.values())
      .map((row) => ({
        eventName: row.eventName,
        events: row.events,
        sessions: row.sessions.size,
        visitors: row.visitors.size,
      }))
      .sort((a, b) => b.events - a.events);
  }, [filteredRecords]);

  const pageBreakdown = useMemo(() => {
    const grouped = new Map<
      string,
      {
        pathname: string;
        events: number;
        visitors: Set<string>;
        leads: number;
        whatsappClicks: number;
      }
    >();

    for (const record of filteredRecords) {
      const current = grouped.get(record.pathname) || {
        pathname: record.pathname,
        events: 0,
        visitors: new Set<string>(),
        leads: 0,
        whatsappClicks: 0,
      };

      current.events += 1;
      current.visitors.add(record.visitor_id);

      if (record.event_name === "lead_form_submitted") {
        current.leads += 1;
      }

      if (record.event_name === "whatsapp_click") {
        current.whatsappClicks += 1;
      }

      grouped.set(record.pathname, current);
    }

    return Array.from(grouped.values()).map((row) => ({
      pathname: row.pathname,
      events: row.events,
      visitors: row.visitors.size,
      leads: row.leads,
      whatsappClicks: row.whatsappClicks,
    }));
  }, [filteredRecords]);

  const recentEvents = useMemo(
    () =>
      [...filteredSessionRecords]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 15),
    [filteredSessionRecords],
  );

  const sectionTimingRows = useMemo(() => {
    const grouped = new Map<string, number>();

    for (const record of focusedSessionRecords) {
      if (record.event_name !== "section_engagement") continue;
      if (typeof record.payload.section_name !== "string") continue;
      if (typeof record.payload.duration_ms !== "number") continue;

      grouped.set(
        record.payload.section_name,
        (grouped.get(record.payload.section_name) ?? 0) + record.payload.duration_ms,
      );
    }

    return Array.from(grouped.entries())
      .map(([sectionName, durationMs]) => ({ sectionName, durationMs }))
      .sort((a, b) => b.durationMs - a.durationMs);
  }, [focusedSessionRecords]);

  const focusedSessionInsights = useMemo(() => {
    const viewedSections = new Set<string>();
    const openedFaqs = new Set<string>();
    let lastCheckpointReason = "";

    for (const record of focusedSessionRecords) {
      if (record.event_name === "section_view" && typeof record.payload.section_name === "string") {
        viewedSections.add(record.payload.section_name);
      }
      if (record.event_name === "faq_opened" && typeof record.payload.faq_question === "string") {
        openedFaqs.add(record.payload.faq_question);
      }
      if (
        record.event_name === "page_checkpoint" &&
        typeof record.payload.checkpoint_reason === "string"
      ) {
        lastCheckpointReason = record.payload.checkpoint_reason;
      }
    }

    return {
      viewedSections: Array.from(viewedSections),
      openedFaqs: Array.from(openedFaqs),
      lastCheckpointReason,
    };
  }, [focusedSessionRecords]);

  const focusedSessionMilestones = useMemo(
    () => (focusedSession ? buildSessionMilestones(focusedSession) : []),
    [focusedSession],
  );

  const topSectionDurationMs = sectionTimingRows[0]?.durationMs ?? 0;

  const startFreshDashboardView = () => {
    const parsedStart =
      baselineStartInput.trim().length > 0
        ? new Date(baselineStartInput)
        : new Date();

    const startedAt = Number.isNaN(parsedStart.getTime())
      ? new Date().toISOString()
      : parsedStart.toISOString();

    const baseline: DashboardBaseline = {
      id:
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `baseline_${Date.now().toString(36)}`,
      startedAt,
      endedAt: null,
      label: baselineLabelInput.trim() || "Fresh view",
      funnelKey: selectedFunnel,
    };

    setSavedBaselines((current) => [baseline, ...current]);
    setActiveBaselineId(baseline.id);
    setBaselineLabelInput("");
    setBaselineStartInput("");
    setSelectedSessionId("all");
  };

  const clearDashboardBaseline = () => {
    setActiveBaselineId("all");
  };

  const deleteActiveBaseline = () => {
    if (activeBaselineId === "all") return;

    setSavedBaselines((current) =>
      current.filter((baseline) => baseline.id !== activeBaselineId),
    );
    setActiveBaselineId("all");
  };

  const closeBaseline = (baselineId: string) => {
    const closedAt = new Date().toISOString();

    setSavedBaselines((current) =>
      current.map((baseline) =>
        baseline.id === baselineId && !baseline.endedAt
          ? { ...baseline, endedAt: closedAt }
          : baseline,
      ),
    );
  };

  const openBaseline = (baselineId: string) => {
    const baseline = savedBaselines.find((item) => item.id === baselineId);
    if (!baseline) return;

    setSelectedFunnel(baseline.funnelKey);
    setActiveBaselineId(baseline.id);
    setSelectedSessionId("all");
  };

  const resetBrowserTrackingOnly = () => {
    resetFunnelBrowserState();
    setSelectedSessionId("all");
    void refreshRecords();
  };

  const exportVisibleEvents = () => {
    if (typeof window === "undefined") return;

    const blob = new Blob([JSON.stringify(filteredRecords, null, 2)], {
      type: "application/json",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateStamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `funnel-events-${dateStamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleCopyTiktokTrackingUrl = async () => {
    try {
      await navigator.clipboard.writeText(TIKTOK_QUOTE_FUNNEL_TRACKING_URL);
      setTiktokTrackingUrlCopied(true);
      window.setTimeout(() => setTiktokTrackingUrlCopied(false), 2000);
    } catch {
      setTiktokTrackingUrlCopied(false);
    }
  };

  return (
    <AdminShell
      title="Paid Funnel Dashboard"
      description="This is the live diagnostic layer for the quote funnel. It now reads from Supabase-backed funnel events so sessions, partial leads, and CRM records can line up in one admin surface."
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-4 rounded-[28px] border border-primary/15 bg-[radial-gradient(circle_at_top_left,rgba(245,181,43,0.12),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(12,12,12,0.96))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Badge variant="outline" className="border-primary/25 bg-primary/10 text-primary">
                Funnel events
              </Badge>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Paid Funnel Dashboard
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                This is the first diagnostics layer for the quote funnel. It shows event flow,
                page breakdowns, and where sessions are falling out.
              </p>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                Loads from Supabase when configured; if the query fails, it falls back to funnel
                events stored in this browser only.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Select value={selectedFunnel} onValueChange={setSelectedFunnel}>
                <SelectTrigger className="w-full border-white/10 bg-black/20 text-white sm:w-[220px]">
                  <SelectValue placeholder="Choose funnel" />
                </SelectTrigger>
                <SelectContent>
                  {funnelOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option === "all" ? "All funnels" : option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" className="border-white/10 bg-black/20" onClick={refreshRecords}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>

          <div className="mt-4 space-y-4 text-sm text-slate-300">
            <div className="rounded-xl border border-white/10 bg-black/25 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                TikTok tracking URL (production)
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-400">
                Use this in TikTok bio or ads. Sessions still bucket under{" "}
                <span className="font-mono text-white">ppf_tiktok_quote</span> in the funnel dropdown;
                <code className="mx-1 text-primary/90">pathname</code> will show{" "}
                <code className="text-primary/90">/ppf-tiktok-quote_2</code>. UTMs and{" "}
                <code className="text-primary/90">ttclid</code> are captured on first paint.
                Replace <code className="text-primary/90">__CAMPAIGN_ID__</code> with TikTok&apos;s dynamic
                token if your ad builder uses a different macro name.
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-stretch">
                <code className="min-h-11 min-w-0 flex-1 break-all rounded-lg border border-white/10 bg-black/50 p-3 text-[11px] leading-relaxed text-slate-200">
                  {TIKTOK_QUOTE_FUNNEL_TRACKING_URL}
                </code>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 shrink-0 border-white/15 bg-black/30 text-white hover:bg-white/10"
                  onClick={() => void handleCopyTiktokTrackingUrl()}
                >
                  {tiktokTrackingUrlCopied ? "Copied" : "Copy URL"}
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              <span>
                Test Google funnel:{" "}
                <Link className="text-primary hover:underline" to="/ppf-dubai-quote">
                  /ppf-dubai-quote
                </Link>
              </span>
              <span>
                Test TikTok funnel:{" "}
                <Link className="text-primary hover:underline" to="/ppf-tiktok-quote_2">
                  /ppf-tiktok-quote_2
                </Link>
              </span>
            </div>
          </div>
        </div>

        <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(10,10,10,0.96))] p-5 sm:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Date filters</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Scope the dashboard</h2>
              <p className="mt-2 text-sm text-slate-400">
                Filter the cards, charts, sessions, and event tables by one shared date range.
              </p>
            </div>

            <Badge variant="outline" className="border-white/10 bg-black/20 text-slate-300">
              {getDateRangeLabel(datePreset, customStartDate, customEndDate)}
            </Badge>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            <Select value={datePreset} onValueChange={(value) => setDatePreset(value as DashboardDatePreset)}>
              <SelectTrigger className="border-white/10 bg-black/20 text-white xl:col-span-2">
                <SelectValue placeholder="Choose date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="last_7_days">Last 7 days</SelectItem>
                <SelectItem value="last_30_days">Last 30 days</SelectItem>
                <SelectItem value="custom">Specific dates</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={customStartDate}
              onChange={(event) => {
                setCustomStartDate(event.target.value);
                setDatePreset("custom");
              }}
              className="border-white/10 bg-black/20 text-white"
            />

            <Input
              type="date"
              value={customEndDate}
              onChange={(event) => {
                setCustomEndDate(event.target.value);
                setDatePreset("custom");
              }}
              className="border-white/10 bg-black/20 text-white"
            />

            <Button
              variant="outline"
              className="border-white/10 bg-black/20 xl:col-span-2"
              onClick={() => {
                setDatePreset("last_7_days");
                setCustomStartDate("");
                setCustomEndDate("");
              }}
            >
              Reset to last 7 days
            </Button>
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Fresh campaign view</p>
                <h3 className="mt-2 text-xl font-semibold text-white">Saved views for each funnel</h3>
                <p className="mt-2 text-sm text-slate-400">
                  Create named fresh views for the selected funnel, switch between them later, or jump back to all tracked data whenever you want.
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">
                  Current funnel: {selectedFunnel === "all" ? "All funnels" : selectedFunnel}
                </p>
              </div>

              {activeBaseline ? (
                <Badge variant="outline" className="border-primary/25 bg-primary/10 text-primary">
                  Active: {dashboardBaseline.label} · {formatTimestamp(dashboardBaseline.startedAt)}
                  {dashboardBaseline.endedAt ? ` to ${formatTimestamp(dashboardBaseline.endedAt)}` : " · Open"}
                </Badge>
              ) : (
                <Badge variant="outline" className="border-white/10 bg-white/5 text-slate-300">
                  Viewing all tracked data
                </Badge>
              )}
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
              <Input
                value={baselineLabelInput}
                onChange={(event) => setBaselineLabelInput(event.target.value)}
                placeholder={`Name this ${selectedFunnel === "all" ? "all-funnel" : selectedFunnel} view`}
                className="border-white/10 bg-black/20 text-white placeholder:text-slate-500"
              />
              <Input
                type="datetime-local"
                value={baselineStartInput}
                onChange={(event) => setBaselineStartInput(event.target.value)}
                className="border-white/10 bg-black/20 text-white xl:col-span-2"
              />
              <Select
                value={activeBaselineId}
                onValueChange={(value) => {
                  if (value === "all") {
                    setActiveBaselineId("all");
                    return;
                  }
                  openBaseline(value);
                }}
              >
                <SelectTrigger className="border-white/10 bg-black/20 text-white">
                  <SelectValue placeholder="Choose saved view" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {selectedFunnel === "all" ? "All funnels · All data" : `${selectedFunnel} · All data`}
                  </SelectItem>
                  {allSavedBaselines.map((baseline) => (
                    <SelectItem key={baseline.id} value={baseline.id}>
                      {baseline.label} · {baseline.funnelKey === "all" ? "All funnels" : baseline.funnelKey} · {formatTimestamp(baseline.startedAt)}
                      {baseline.endedAt ? ` to ${formatTimestamp(baseline.endedAt)}` : " · Open"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" className="border-white/10 bg-black/20" onClick={startFreshDashboardView}>
                Start new view
              </Button>
              <Button variant="outline" className="border-white/10 bg-black/20" onClick={clearDashboardBaseline}>
                View all data
              </Button>
              <Button
                variant="outline"
                className="border-white/10 bg-black/20"
                onClick={() => activeBaseline && closeBaseline(activeBaseline.id)}
                disabled={!activeBaseline || Boolean(activeBaseline.endedAt)}
              >
                End view now
              </Button>
              <Button
                variant="outline"
                className="border-white/10 bg-black/20"
                onClick={deleteActiveBaseline}
                disabled={activeBaselineId === "all"}
              >
                Delete view
              </Button>
              <Button variant="outline" className="border-white/10 bg-black/20" onClick={exportVisibleEvents}>
                Export visible events
              </Button>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Button variant="outline" className="border-white/10 bg-black/20" onClick={resetBrowserTrackingOnly}>
                Reset browser test data
              </Button>
              <p className="text-sm text-slate-400">
                {allSavedBaselines.length === 0
                  ? "No saved views yet."
                  : `${allSavedBaselines.length} saved view${allSavedBaselines.length === 1 ? "" : "s"} across all funnels.`}
              </p>
              <p className="text-sm text-slate-400">
                Browser reset clears local visitor/session IDs and local fallback events only. It does not delete Supabase history.
              </p>
            </div>

            <div className="mt-4 grid gap-3">
              {allSavedBaselines.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-4 text-sm text-slate-400">
                  Pick a funnel above, then click `Start new view` to save a named reporting window for that funnel.
                </div>
              ) : (
                allSavedBaselines.map((baseline) => {
                  const isActive = baseline.id === activeBaselineId;

                  return (
                    <div
                      key={baseline.id}
                      className={`rounded-2xl border p-4 transition-colors ${
                        isActive
                          ? "border-primary/25 bg-primary/10"
                          : "border-white/10 bg-black/20"
                      }`}
                    >
                      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-white">{baseline.label}</span>
                            <Badge variant="outline" className="border-white/10 bg-white/5 text-slate-300">
                              {baseline.funnelKey === "all" ? "All funnels" : baseline.funnelKey}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={
                                baseline.endedAt
                                  ? "border-white/10 bg-white/5 text-slate-300"
                                  : "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
                              }
                            >
                              {baseline.endedAt ? "Closed" : "Open"}
                            </Badge>
                            {isActive ? (
                              <Badge variant="outline" className="border-primary/25 bg-primary/10 text-primary">
                                Selected
                              </Badge>
                            ) : null}
                          </div>
                          <p className="text-sm text-slate-300">
                            Started: {formatTimestamp(baseline.startedAt)}
                          </p>
                          <p className="text-sm text-slate-400">
                            {baseline.endedAt
                              ? `Ended: ${formatTimestamp(baseline.endedAt)}`
                              : "Still open - data keeps accumulating until you end this view."}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            className="border-white/10 bg-black/20"
                            onClick={() => openBaseline(baseline.id)}
                          >
                            View
                          </Button>
                          <Button
                            variant="outline"
                            className="border-white/10 bg-black/20"
                            onClick={() => closeBaseline(baseline.id)}
                            disabled={Boolean(baseline.endedAt)}
                          >
                            End now
                          </Button>
                          <Button
                            variant="outline"
                            className="border-white/10 bg-black/20"
                            onClick={() => {
                              setSavedBaselines((current) =>
                                current.filter((item) => item.id !== baseline.id),
                              );
                              if (activeBaselineId === baseline.id) {
                                setActiveBaselineId("all");
                              }
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(10,10,10,0.96))] p-5">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-primary" />
              <span className="text-sm text-slate-400">Total events</span>
            </div>
            <p className="mt-4 text-3xl font-semibold text-white">{totals.events}</p>
          </Card>
          <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(10,10,10,0.96))] p-5">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-primary" />
              <span className="text-sm text-slate-400">Unique visitors</span>
            </div>
            <p className="mt-4 text-3xl font-semibold text-white">{totals.visitors}</p>
          </Card>
          <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(10,10,10,0.96))] p-5">
            <div className="flex items-center gap-3">
              <MousePointerClick className="h-5 w-5 text-primary" />
              <span className="text-sm text-slate-400">Tracked sessions</span>
            </div>
            <p className="mt-4 text-3xl font-semibold text-white">{totals.sessions}</p>
          </Card>
          <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(10,10,10,0.96))] p-5">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-primary" />
              <span className="text-sm text-slate-400">Lead submits</span>
            </div>
            <p className="mt-4 text-3xl font-semibold text-white">{totals.leadSubmits}</p>
          </Card>
          <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(10,10,10,0.96))] p-5">
            <div className="flex items-center gap-3">
              <MessageCircle className="h-5 w-5 text-primary" />
              <span className="text-sm text-slate-400">WhatsApp clicks</span>
            </div>
            <p className="mt-4 text-3xl font-semibold text-white">{totals.whatsappClicks}</p>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(10,10,10,0.96))] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Drop-off view</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Session progression</h2>
              </div>
              <Badge variant="outline" className="border-white/10 bg-black/20 text-slate-300">
                Unique sessions
              </Badge>
            </div>

            <ChartContainer config={chartConfig} className="mt-6 h-[320px] w-full">
              <BarChart data={funnelStepData} margin={{ left: 0, right: 10, top: 10, bottom: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="step"
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                  angle={-18}
                  height={72}
                  textAnchor="end"
                />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="sessions" fill="var(--color-sessions)" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </Card>

          <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(10,10,10,0.96))] p-5 sm:p-6">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Event mix</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Top tracked events</h2>
            </div>

            <ChartContainer config={chartConfig} className="mt-6 h-[320px] w-full">
              <BarChart
                data={eventBreakdown.slice(0, 8).map((row) => ({
                  event: formatEventName(row.eventName),
                  events: row.events,
                }))}
                layout="vertical"
                margin={{ left: 0, right: 10, top: 10, bottom: 0 }}
              >
                <CartesianGrid horizontal={false} />
                <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
                <YAxis
                  type="category"
                  width={150}
                  dataKey="event"
                  tickLine={false}
                  axisLine={false}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="events" fill="var(--color-events)" radius={[0, 10, 10, 0]} />
              </BarChart>
            </ChartContainer>
          </Card>
        </div>

        <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(10,10,10,0.96))] p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Focused session</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Session detail</h2>
            </div>
            <Badge variant="outline" className="border-white/10 bg-black/20 text-slate-300">
              {focusedSession ? getSessionPrimaryLabel(focusedSession) : "No session selected"}
            </Badge>
          </div>

          {focusedSession ? (
            <div className="mt-6 space-y-6">
              <div className="rounded-[28px] border border-primary/15 bg-[radial-gradient(circle_at_top_left,rgba(245,181,43,0.14),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(10,10,10,0.96))] p-5 sm:p-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className={getSessionStatus(focusedSession).className}>
                        {getSessionStatus(focusedSession).label}
                      </Badge>
                      <Badge variant="outline" className={getIntentBand(focusedSession.intentScore).className}>
                        {getIntentBand(focusedSession.intentScore).label}
                      </Badge>
                      <Badge variant="outline" className="border-white/10 bg-black/20 text-slate-300">
                        Intent {focusedSession.intentScore}/100
                      </Badge>
                      <Badge variant="outline" className="border-white/10 bg-black/20 text-slate-300">
                        {focusedSessionMilestones.filter((milestone) => milestone.complete).length}/4 steps hit
                      </Badge>
                    </div>
                    <h3 className="mt-4 text-2xl font-semibold text-white">Goal path for this session</h3>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
                      This view puts the main business goal first, then shows whether they opened the
                      calculator, configured it, and consumed enough trust content to justify a later
                      conversion push.
                    </p>
                    <p className="mt-3 text-sm text-slate-400">{getDropOffHint(focusedSession)}</p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Card className="border-white/10 bg-black/20 p-4">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Started</p>
                      <p className="mt-2 text-sm font-medium text-white">
                        {formatTimestamp(focusedSession.startedAt)}
                      </p>
                    </Card>
                    <Card className="border-white/10 bg-black/20 p-4">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Last seen</p>
                      <p className="mt-2 text-sm font-medium text-white">
                        {formatTimestamp(focusedSession.endedAt)}
                      </p>
                    </Card>
                  </div>
                </div>

                <div className="mt-6">
                  <StepMilestoneGrid milestones={focusedSessionMilestones} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-7">
                <Card className="border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Intent</p>
                  <p className="mt-2 text-xl font-semibold text-white">
                    {focusedSession.intentScore}/100
                  </p>
                </Card>
                <Card className="border-white/10 bg-black/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Duration</p>
                    <Clock3 className="h-4 w-4 text-slate-500" />
                  </div>
                  <p className="mt-2 text-xl font-semibold text-white">
                    {formatDurationMs(focusedSession.durationMs)}
                  </p>
                </Card>
                <Card className="border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Max scroll</p>
                  <p className="mt-2 text-xl font-semibold text-white">
                    {focusedSession.maxScrollPercent}%
                  </p>
                </Card>
                <Card className="border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Video progress</p>
                  <p className="mt-2 text-xl font-semibold text-white">
                    {formatVideoEngagement(focusedSession)}
                  </p>
                </Card>
                <Card className="border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Sections viewed</p>
                  <p className="mt-2 text-xl font-semibold text-white">
                    {focusedSessionInsights.viewedSections.length}
                  </p>
                </Card>
                <Card className="border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">FAQ opens</p>
                  <p className="mt-2 text-xl font-semibold text-white">
                    {focusedSessionInsights.openedFaqs.length}
                  </p>
                </Card>
                <Card className="border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Quote estimate</p>
                  <p className="mt-2 text-xl font-semibold text-white">
                    {focusedSession.quoteEstimate !== null
                      ? `${Math.round(focusedSession.quoteEstimate / 1000)}k AED`
                      : "Locked"}
                  </p>
                </Card>
              </div>

              <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
                <Card className="border-white/10 bg-black/20 p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Lead details and selections</p>
                  <div className="mt-4 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
                    <p>
                      <span className="text-slate-500">Lead name:</span>{" "}
                      <span className="text-white">{focusedSession.leadName || "Not captured yet"}</span>
                    </p>
                    <p>
                      <span className="text-slate-500">Phone:</span>{" "}
                      <span className="text-white">{focusedSession.leadPhone || "Not captured yet"}</span>
                    </p>
                    <p>
                      <span className="text-slate-500">Vehicle:</span>{" "}
                      <span className="text-white">
                        {getVehicleIdentityLabel(focusedSession) || "Not captured yet"}
                      </span>
                    </p>
                    <p>
                      <span className="text-slate-500">Visitor ID:</span>{" "}
                      <span className="font-mono text-white">{formatCompactId(focusedSession.visitorId)}</span>
                    </p>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {focusedSession.packageName ? (
                      <Badge variant="outline" className="border-primary/20 bg-primary/10 text-primary">
                        {focusedSession.packageName}
                      </Badge>
                    ) : null}
                    {focusedSession.vehicleSize ? (
                      <Badge variant="outline" className="border-white/10 bg-white/5 text-slate-200">
                        Size: {focusedSession.vehicleSize}
                      </Badge>
                    ) : null}
                    {focusedSession.finish ? (
                      <Badge variant="outline" className="border-white/10 bg-white/5 text-slate-200">
                        Finish: {focusedSession.finish}
                      </Badge>
                    ) : null}
                    {focusedSession.coverage ? (
                      <Badge variant="outline" className="border-white/10 bg-white/5 text-slate-200">
                        Coverage: {focusedSession.coverage}
                      </Badge>
                    ) : null}
                    {focusedSession.quoteEstimate !== null ? (
                      <Badge variant="outline" className="border-emerald-400/20 bg-emerald-500/10 text-emerald-200">
                        {formatCurrency(focusedSession.quoteEstimate)}
                      </Badge>
                    ) : null}
                  </div>

                  <div className="mt-5 space-y-3 text-sm text-slate-300">
                    <p>
                      <span className="text-slate-500">Last checkpoint:</span>{" "}
                      <span className="text-white">
                        {focusedSessionInsights.lastCheckpointReason || "No checkpoint yet"}
                      </span>
                    </p>
                    <p>
                      <span className="text-slate-500">Viewed sections:</span>{" "}
                      <span className="text-white">
                        {focusedSessionInsights.viewedSections.length
                          ? focusedSessionInsights.viewedSections.map(formatSectionName).join(", ")
                          : "No section views captured"}
                      </span>
                    </p>
                    <p>
                      <span className="text-slate-500">FAQs opened:</span>{" "}
                      <span className="text-white">
                        {focusedSessionInsights.openedFaqs.length
                          ? focusedSessionInsights.openedFaqs.length
                          : 0}
                      </span>
                    </p>
                    <p>
                      <span className="text-slate-500">Source:</span>{" "}
                      <span className="text-white">{focusedSession.sourcePlatform || "Unknown"}</span>
                    </p>
                    <p>
                      <span className="text-slate-500">Variant:</span>{" "}
                      <span className="text-white">
                        {focusedSession.landingPageVariant || "Default"}
                      </span>
                    </p>
                  </div>
                </Card>

                <Card className="border-white/10 bg-black/20 p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Section timing</p>
                  <div className="mt-4 space-y-3">
                    {sectionTimingRows.length ? (
                      sectionTimingRows.map((row) => {
                        const widthPercent = topSectionDurationMs
                          ? Math.max(12, Math.round((row.durationMs / topSectionDurationMs) * 100))
                          : 12;

                        return (
                          <div key={row.sectionName} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-medium text-white">
                                {formatSectionName(row.sectionName)}
                              </p>
                              <p className="text-xs uppercase tracking-[0.14em] text-slate-400">
                                {formatDurationMs(row.durationMs)}
                              </p>
                            </div>
                            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                              <div
                                className="h-full rounded-full bg-[linear-gradient(90deg,#f7b52b,#25D366)]"
                                style={{ width: `${widthPercent}%` }}
                              />
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-slate-400">
                        No section timing yet for this session.
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          ) : (
            <p className="mt-6 text-slate-400">Run a session to populate detailed analytics.</p>
          )}
        </Card>

        <div className="space-y-6">
          <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(10,10,10,0.96))] p-5 sm:p-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">By session</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">User journey sessions</h2>
                <p className="mt-2 text-sm text-slate-400">
                  Showing {filteredSessionRows.length} of {matchingSessionCount} matching sessions.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Input
                  value={sessionSearch}
                  onChange={(event) => setSessionSearch(event.target.value)}
                  placeholder="Search name, phone, vehicle, session"
                  className="border-white/10 bg-black/20 text-white placeholder:text-slate-500"
                />
                <Select value={sessionStatusFilter} onValueChange={setSessionStatusFilter}>
                  <SelectTrigger className="border-white/10 bg-black/20 text-white">
                    <SelectValue placeholder="Intent filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="goal_hit">Goal hit</SelectItem>
                    <SelectItem value="warm_lead">Warm lead</SelectItem>
                    <SelectItem value="engaged">Engaged</SelectItem>
                    <SelectItem value="needs_work">Needs work</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sessionLimit} onValueChange={setSessionLimit}>
                  <SelectTrigger className="border-white/10 bg-black/20 text-white">
                    <SelectValue placeholder="Visible sessions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">Show 5</SelectItem>
                    <SelectItem value="10">Show 10</SelectItem>
                    <SelectItem value="25">Show 25</SelectItem>
                    <SelectItem value="50">Show 50</SelectItem>
                    <SelectItem value="100">Show 100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-400">
                Sessions fall back to anonymous IDs until a lead name or phone number is captured.
              </p>

              <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
                <SelectTrigger className="w-full border-white/10 bg-black/20 text-white sm:w-[260px]">
                  <SelectValue placeholder="Jump to session" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Most recent matching session</SelectItem>
                  {filteredSessionRows.map((row) => (
                    <SelectItem key={row.sessionId} value={row.sessionId}>
                      {getSessionPrimaryLabel(row)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="mt-6">
              {filteredSessionRows.length ? (
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10 hover:bg-transparent">
                        <TableHead className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Session</TableHead>
                        <TableHead className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Status</TableHead>
                        <TableHead className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Intent</TableHead>
                        <TableHead className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Started</TableHead>
                        <TableHead className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Last seen</TableHead>
                        <TableHead className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Vehicle</TableHead>
                        <TableHead className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Package</TableHead>
                        <TableHead className="text-[11px] uppercase tracking-[0.16em] text-slate-500">WA / Lead</TableHead>
                        <TableHead className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Duration</TableHead>
                        <TableHead className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Estimate</TableHead>
                        <TableHead className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Drop-off</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSessionRows.map((row) => {
                        const milestones = buildSessionMilestones(row);
                        const completedMilestones = milestones.filter((milestone) => milestone.complete).length;
                        const sessionStatus = getSessionStatus(row);
                        const intentBand = getIntentBand(row.intentScore);
                        const vehicleIdentity = getVehicleIdentityLabel(row);
                        const isActive = row.sessionId === focusedSessionId;

                        return (
                          <TableRow
                            key={row.sessionId}
                            className={`cursor-pointer border-white/10 text-xs transition-colors ${
                              isActive
                                ? "bg-primary/10 hover:bg-primary/15"
                                : "hover:bg-white/[0.04]"
                            }`}
                            onClick={() => setSelectedSessionId(row.sessionId)}
                          >
                            <TableCell className="py-3 align-top">
                              <div className="space-y-1">
                                <div className="font-medium text-white">{getSessionPrimaryLabel(row)}</div>
                                <div className="font-mono text-[11px] text-slate-400">
                                  {formatCompactId(row.sessionId)}
                                </div>
                                <div className="text-[11px] text-slate-500">
                                  {getSessionSecondaryLabel(row)}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="py-3 align-top">
                              <div className="flex flex-wrap gap-1.5">
                                <Badge variant="outline" className={`${sessionStatus.className} text-[10px]`}>
                                  {sessionStatus.label}
                                </Badge>
                                <Badge variant="outline" className="border-white/10 bg-white/5 text-[10px] text-slate-300">
                                  {completedMilestones}/4
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className="py-3 align-top">
                              <div className="space-y-1">
                                <Badge variant="outline" className={`${intentBand.className} text-[10px]`}>
                                  {row.intentScore}/100
                                </Badge>
                                <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/10">
                                  <div
                                    className="h-full rounded-full bg-[linear-gradient(90deg,#f7b52b,#25D366)]"
                                    style={{ width: `${Math.max(6, row.intentScore)}%` }}
                                  />
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="py-3 align-top text-[11px] text-slate-300">
                              {formatTimestamp(row.startedAt)}
                            </TableCell>
                            <TableCell className="py-3 align-top text-[11px] text-slate-300">
                              {formatTimestamp(row.endedAt)}
                            </TableCell>
                            <TableCell className="py-3 align-top text-[11px] text-slate-300">
                              {vehicleIdentity || "Not captured"}
                            </TableCell>
                            <TableCell className="py-3 align-top text-[11px] text-slate-300">
                              {row.packageName || "—"}
                            </TableCell>
                            <TableCell className="py-3 align-top">
                              <div className="space-y-1 text-[11px] text-slate-300">
                                <div>{row.whatsappClicked ? "WA clicked" : "No WA"}</div>
                                <div>{row.leadSubmitted ? "Lead submitted" : "No lead"}</div>
                              </div>
                            </TableCell>
                            <TableCell className="py-3 align-top text-[11px] text-slate-300">
                              {formatDurationMs(row.durationMs)}
                            </TableCell>
                            <TableCell className="py-3 align-top text-[11px] text-slate-300">
                              {row.quoteEstimate !== null
                                ? `AED ${row.quoteEstimate.toLocaleString("en-AE")}`
                                : "Locked"}
                            </TableCell>
                            <TableCell className="max-w-[240px] py-3 align-top text-[11px] leading-5 text-slate-400">
                              {getDropOffHint(row)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-slate-400">
                  No sessions match the current search or filter settings.
                </div>
              )}
            </div>
          </Card>

        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(10,10,10,0.96))] p-5 sm:p-6">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">By page</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Page performance</h2>
            </div>

            <div className="mt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Page</TableHead>
                    <TableHead>Events</TableHead>
                    <TableHead>Visitors</TableHead>
                    <TableHead>Leads</TableHead>
                    <TableHead>WhatsApp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageBreakdown.length ? (
                    pageBreakdown.map((row) => (
                      <TableRow key={row.pathname}>
                        <TableCell className="font-medium text-white">{row.pathname || "/"}</TableCell>
                        <TableCell>{row.events}</TableCell>
                        <TableCell>{row.visitors}</TableCell>
                        <TableCell>{row.leads}</TableCell>
                        <TableCell>{row.whatsappClicks}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-slate-400">
                        No stored page events yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>

          <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(10,10,10,0.96))] p-5 sm:p-6">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">By event</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Event breakdown</h2>
            </div>

            <div className="mt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Sessions</TableHead>
                    <TableHead>Visitors</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {eventBreakdown.length ? (
                    eventBreakdown.map((row) => (
                      <TableRow key={row.eventName}>
                        <TableCell className="font-medium text-white">
                          {formatEventName(row.eventName)}
                        </TableCell>
                        <TableCell>{row.events}</TableCell>
                        <TableCell>{row.sessions}</TableCell>
                        <TableCell>{row.visitors}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-slate-400">
                        No stored event data yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>

        <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(10,10,10,0.96))] p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Recent activity</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Latest events</h2>
            </div>
            <Badge variant="outline" className="border-white/10 bg-black/20 text-slate-300">
              {focusedSession
                ? `Focused: ${getSessionPrimaryLabel(focusedSession)}`
                : "All sessions"}
            </Badge>
          </div>

          <div className="mt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Page</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Variant</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentEvents.length ? (
                  recentEvents.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{formatTimestamp(record.timestamp)}</TableCell>
                      <TableCell className="font-medium text-white">
                        {formatEventName(record.event_name)}
                      </TableCell>
                      <TableCell>{record.pathname}</TableCell>
                      <TableCell>{record.source_platform}</TableCell>
                      <TableCell>{record.landing_page_variant}</TableCell>
                      <TableCell>{summarizePayload(record)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-slate-400">
                      No events recorded yet. Visit the funnel page and interact with it first.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </AdminShell>
  );
};

export default AdminFunnelDashboard;
