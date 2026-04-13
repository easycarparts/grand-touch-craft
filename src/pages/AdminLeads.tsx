import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, ChevronDown, ChevronUp, RefreshCw, Trash2 } from "lucide-react";

import { useAdminAuth } from "@/components/admin/AdminAuthProvider";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { getIntentScore } from "@/lib/funnel-intent";
import { supabase } from "@/lib/supabase";

type LeadStatus = "new" | "contacted" | "qualified" | "quoted" | "won" | "lost" | "junk";
type LeadQuality = "unreviewed" | "high" | "medium" | "low" | "spam";
type FollowupStatus = "open" | "done" | "cancelled";
type FollowupChannel = "call" | "whatsapp" | "sms" | "email" | "manual";
type FeedbackType = "qualified_lead" | "disqualified_lead" | "won_job" | "lost_job";

type LeadRow = {
  id: string;
  primary_session_id: string | null;
  visitor_id: string | null;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_year: string | null;
  vehicle_label: string | null;
  source_platform: string | null;
  landing_page_variant: string | null;
  funnel_name: string | null;
  lead_source_type: string;
  status: LeadStatus;
  quality_label: LeadQuality;
  intent_score: number;
  latest_quote_estimate: number | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  external_campaign_name: string | null;
  external_adset_name: string | null;
  external_ad_name: string | null;
  utm_content: string | null;
  utm_term: string | null;
  gclid: string | null;
  fbclid: string | null;
  ttclid: string | null;
  notes_summary: string | null;
  import_metadata: Record<string, unknown> | null;
  expected_delivery_at: string | null;
  assigned_to: string | null;
  first_captured_at: string | null;
  last_activity_at: string | null;
  submitted_at: string | null;
  whatsapp_clicked_at: string | null;
  source_received_at: string | null;
  first_whatsapp_contacted_at: string | null;
  first_whatsapp_contacted_by: string | null;
  first_called_at: string | null;
  first_called_by: string | null;
  created_at: string;
};

type SessionRollupRow = {
  session_id: string;
  lead_id: string | null;
  lead_name: string | null;
  lead_phone: string | null;
  lead_submitted: boolean;
  whatsapp_clicked: boolean;
  quote_modal_opened: boolean;
  unlock_requested: boolean;
  duration_ms: number | null;
  max_scroll_percent: number | null;
  video_max_progress_percent: number | null;
  package_name: string | null;
  vehicle_size: string | null;
  finish: string | null;
  coverage: string | null;
  quote_estimate: number | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_year: string | null;
  sections_viewed: string[] | null;
  faq_open_count: number | null;
  ended_at: string;
};

type LeadNoteRow = {
  id: string;
  lead_id: string;
  author_admin_user_id: string;
  body: string;
  created_at: string;
};

type LeadFollowupRow = {
  id: string;
  lead_id: string;
  assigned_to: string | null;
  status: FollowupStatus;
  channel: FollowupChannel;
  due_at: string | null;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type LeadStatusHistoryRow = {
  id: string;
  lead_id: string;
  changed_by: string | null;
  from_status: string | null;
  to_status: LeadStatus;
  reason: string | null;
  created_at: string;
};

type AdPlatformFeedbackRow = {
  id: string;
  lead_id: string;
  platform: "meta" | "google" | "tiktok";
  feedback_type: FeedbackType;
  feedback_status: "pending" | "sent" | "failed";
  external_identifier_type: string | null;
  external_identifier_value: string | null;
  payload: Record<string, unknown>;
  response_payload: Record<string, unknown>;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
};

type CrmAlertQueueRow = {
  id: string;
  alert_type: "new_lead" | "followup_created" | "followup_morning_digest";
  lead_id: string | null;
  followup_id: string | null;
  title: string;
  body: string;
  payload: Record<string, unknown>;
  delivery_status: "pending" | "sent" | "failed" | "skipped";
  delivery_attempts: number;
  last_error: string | null;
  sent_at: string | null;
  available_at: string;
  created_at: string;
  updated_at: string;
};

type AdminUserOption = {
  id: string;
  email: string;
  full_name: string | null;
  role: "owner" | "manager" | "sales";
  is_active: boolean;
  last_login_at: string | null;
};

type FollowupDraft = {
  assignedTo: string;
  channel: FollowupChannel;
  dueAt: string;
  notes: string;
};

type ManualLeadDraft = {
  fullName: string;
  phone: string;
  email: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: string;
  sourcePlatform: string;
  leadSourceType: "manual" | "api_import" | "google_sheet_import";
  assignedTo: string;
  notes: string;
  followupDueAt: string;
  followupChannel: FollowupChannel;
};

type LeadDetailsDraft = {
  fullName: string;
  phone: string;
  email: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: string;
  vehicleLabel: string;
};

type LeadScheduleDraft = {
  expectedDeliveryAt: string;
};

type DisplayLeadRow = LeadRow & {
  assignedAdmin: AdminUserOption | null;
  displayIntentScore: number;
  latestRollup: SessionRollupRow | null;
  matchingSessions: number;
  sourceGroup: "meta" | "google" | "tiktok" | "website" | "manual";
  isMetaOriginated: boolean;
  lifecycleLabel: "submitted" | "partial";
  notes: LeadNoteRow[];
  followups: LeadFollowupRow[];
  statusHistory: LeadStatusHistoryRow[];
  feedback: AdPlatformFeedbackRow[];
  nextOpenFollowup: LeadFollowupRow | null;
  followupState: "none" | "open" | "due_today" | "overdue" | "done";
};

const leadStatusOptions: LeadStatus[] = [
  "new",
  "contacted",
  "qualified",
  "quoted",
  "won",
  "lost",
  "junk",
];

const leadQualityOptions: LeadQuality[] = ["unreviewed", "high", "medium", "low", "spam"];
const followupChannelOptions: FollowupChannel[] = ["call", "whatsapp", "sms", "email", "manual"];

const formatTokenLabel = (value: string) =>
  value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const formatTimestamp = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("en-AE", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "Not yet";

const formatDubaiTimestamp = (value: string | Date) =>
  new Intl.DateTimeFormat("en-AE", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: BUSINESS_TIMEZONE,
  }).format(new Date(value));

const toDatetimeLocalValue = (value: string | null) => {
  if (!value) return "";

  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const formatDurationMs = (value: number | null) => {
  if (!value || value <= 0) return "0s";

  const totalSeconds = Math.round(value / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes <= 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
};

const formatCurrency = (value: number | null) =>
  value === null ? "Not unlocked" : `AED ${Math.round(value).toLocaleString("en-AE")}`;

const collapseRepeatedPhrase = (value: string | null | undefined) => {
  const trimmed = value?.trim() || "";
  if (!trimmed) return "";

  const normalized = trimmed.replace(/\s+/g, " ");
  const words = normalized.split(" ").filter(Boolean);

  if (words.length >= 2 && words.length % 2 === 0) {
    const half = words.length / 2;
    const left = words.slice(0, half).join(" ");
    const right = words.slice(half).join(" ");

    if (left.toLowerCase() === right.toLowerCase()) {
      return left;
    }
  }

  return normalized;
};

const getLeadVehicleText = (
  lead: Pick<LeadRow, "vehicle_label" | "vehicle_year" | "vehicle_make" | "vehicle_model">,
) =>
  collapseRepeatedPhrase(
    lead.vehicle_label ||
      [lead.vehicle_year, lead.vehicle_make, lead.vehicle_model].filter(Boolean).join(" "),
  );

const formatSectionName = (value: string) =>
  value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const readImportMetadataValue = (metadata: Record<string, unknown> | null | undefined, key: string) => {
  const value = metadata?.[key];
  return typeof value === "string" ? value : null;
};

const getLeadCampaignLabel = (
  lead: Pick<LeadRow, "external_ad_name" | "utm_campaign" | "external_campaign_name" | "import_metadata">,
) =>
  lead.external_ad_name ||
  lead.utm_campaign ||
  lead.external_campaign_name ||
  readImportMetadataValue(lead.import_metadata, "ad_name") ||
  readImportMetadataValue(lead.import_metadata, "campaign_name") ||
  null;

const formatMetaLeadChoice = (value: string | null | undefined) =>
  (value ?? "")
    .replace(/[()]/g, " ")
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => {
      if (/^\d/.test(part)) return part;
      if (part.toLowerCase() === "stek") return "STEK";
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(" ");

const normalizePhone = (value: string | null) => (value ? value.replace(/[^0-9+]/g, "") : "");

const toWhatsAppPhone = (value: string | null) => {
  let digits = (value ?? "").replace(/\D/g, "");
  if (!digits) return null;

  if (digits.startsWith("00")) {
    digits = digits.slice(2);
  }

  if (digits.startsWith("05") && digits.length === 10) {
    return `971${digits.slice(1)}`;
  }

  if (digits.startsWith("5") && digits.length === 9) {
    return `971${digits}`;
  }

  if (digits.startsWith("9710")) {
    digits = `971${digits.slice(4)}`;
  }

  return digits || null;
};

const buildWhatsAppUrl = (value: string | null) => {
  const whatsappPhone = toWhatsAppPhone(value);
  return whatsappPhone ? `https://wa.me/${whatsappPhone}` : null;
};

const readMetaFeedbackError = (payload: Record<string, unknown> | null | undefined) => {
  const rawError = payload?.error;
  if (typeof rawError !== "string" || !rawError.trim()) return null;

  try {
    const parsed = JSON.parse(rawError) as {
      error_user_msg?: string;
      message?: string;
      error_user_title?: string;
    };
    return parsed.error_user_msg || parsed.message || parsed.error_user_title || rawError;
  } catch {
    return rawError;
  }
};

const BUSINESS_TIMEZONE = "Asia/Dubai";

const formatDubaiMetaTokenShort = (value: string | Date) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: BUSINESS_TIMEZONE,
  }).format(new Date(value));

const BUSINESS_START_HOUR = 9;
const BUSINESS_START_MINUTE = 30;
const BUSINESS_OPEN_DAYS = new Set([1, 2, 3, 4, 5, 6]);

const getDubaiDateParts = (value: Date) => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    weekday: "short",
  });

  const parts = formatter.formatToParts(value);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  const weekdayLabel = read("weekday");
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  return {
    year: Number(read("year")),
    month: Number(read("month")),
    day: Number(read("day")),
    hour: Number(read("hour")),
    minute: Number(read("minute")),
    second: Number(read("second")),
    weekday: weekdayMap[weekdayLabel] ?? 0,
  };
};

const makeDubaiDate = (
  year: number,
  month: number,
  day: number,
  hour: number,
  minute = 0,
  second = 0,
) => {
  return new Date(Date.UTC(year, month - 1, day, hour - 4, minute, second));
};

const addDubaiDays = (value: Date, days: number) => {
  const parts = getDubaiDateParts(value);
  return makeDubaiDate(parts.year, parts.month, parts.day + days, parts.hour, parts.minute, parts.second);
};

const isSameDubaiDay = (left: Date, right: Date) => {
  const leftParts = getDubaiDateParts(left);
  const rightParts = getDubaiDateParts(right);
  return (
    leftParts.year === rightParts.year &&
    leftParts.month === rightParts.month &&
    leftParts.day === rightParts.day
  );
};

const getBusinessWindow = (channel: "whatsapp" | "call") => {
  if (channel === "whatsapp") {
    return {
      startHour: BUSINESS_START_HOUR,
      startMinute: BUSINESS_START_MINUTE,
      endHour: 20,
      endMinute: 0,
      slaMinutes: 30,
    };
  }

  return {
    startHour: BUSINESS_START_HOUR,
    startMinute: BUSINESS_START_MINUTE,
    endHour: 18,
    endMinute: 0,
    slaMinutes: 60,
  };
};

const getLeadReceivedAt = (lead: LeadRow) =>
  lead.source_received_at ||
  lead.submitted_at ||
  lead.first_captured_at ||
  lead.created_at ||
  null;

const getSlaDueAt = (lead: LeadRow, channel: "whatsapp" | "call") => {
  const receivedAt = getLeadReceivedAt(lead);
  if (!receivedAt) return null;

  const receivedDate = new Date(receivedAt);
  const receivedParts = getDubaiDateParts(receivedDate);
  const window = getBusinessWindow(channel);
  const receivedMinutes = receivedParts.hour * 60 + receivedParts.minute;
  const startMinutes = window.startHour * 60 + window.startMinute;
  const endMinutes = window.endHour * 60 + window.endMinute;

  const receivedDuringBusinessHours =
    BUSINESS_OPEN_DAYS.has(receivedParts.weekday) &&
    receivedMinutes >= startMinutes &&
    receivedMinutes < endMinutes;

  if (receivedDuringBusinessHours) {
    return new Date(receivedDate.getTime() + window.slaMinutes * 60_000);
  }

  let startDate = makeDubaiDate(
    receivedParts.year,
    receivedParts.month,
    receivedParts.day,
    window.startHour,
    window.startMinute,
    0,
  );

  if (
    !BUSINESS_OPEN_DAYS.has(receivedParts.weekday) ||
    receivedMinutes >= endMinutes
  ) {
    startDate = addDubaiDays(startDate, 1);
  }

  while (!BUSINESS_OPEN_DAYS.has(getDubaiDateParts(startDate).weekday)) {
    startDate = addDubaiDays(startDate, 1);
  }

  return new Date(startDate.getTime() + window.slaMinutes * 60_000);
};

const formatMinutes = (value: number) => {
  if (value < 1) return "<1m";
  if (value < 60) return `${Math.round(value)}m`;
  const hours = Math.floor(value / 60);
  const minutes = Math.round(value % 60);
  return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
};

const getResponseSlaState = (lead: LeadRow, channel: "whatsapp" | "call") => {
  const receivedAt = getLeadReceivedAt(lead);
  if (!receivedAt) {
    return {
      done: false,
      state: "none" as const,
      elapsedLabel: "No intake time",
      dueLabel: "No SLA",
      badgeClass: "border-white/10 bg-white/5 text-slate-300",
      score: null as number | null,
    };
  }

  const completedAt =
    channel === "whatsapp" ? lead.first_whatsapp_contacted_at : lead.first_called_at;
  const dueAt = getSlaDueAt(lead, channel);
  if (!dueAt) {
    return {
      done: Boolean(completedAt),
      state: "none" as const,
      elapsedLabel: completedAt ? "Done" : "No SLA",
      dueLabel: "No SLA",
      badgeClass: "border-white/10 bg-white/5 text-slate-300",
      score: null as number | null,
    };
  }

  const now = new Date();
  if (completedAt) {
    const completedDate = new Date(completedAt);
    const elapsedMinutes = (completedDate.getTime() - new Date(receivedAt).getTime()) / 60_000;
    const withinSla = completedDate.getTime() <= dueAt.getTime();
    const ratio = (completedDate.getTime() - new Date(receivedAt).getTime()) / (dueAt.getTime() - new Date(receivedAt).getTime() || 1);
    const score = Math.max(0, Math.min(100, Math.round(100 - Math.max(0, ratio) * 70)));

    return {
      done: true,
      state: withinSla ? ("good" as const) : ("late" as const),
      elapsedLabel: formatMinutes(elapsedMinutes),
      dueLabel: withinSla ? "On time" : "Late",
      badgeClass: withinSla
        ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
        : "border-rose-400/20 bg-rose-500/10 text-rose-200",
      score,
    };
  }

  const overdue = now.getTime() > dueAt.getTime();
  const minutesUntilDue = (dueAt.getTime() - now.getTime()) / 60_000;
  const dueTomorrow = !overdue && !isSameDubaiDay(now, dueAt);
  const dueLaterToday = !overdue && isSameDubaiDay(now, dueAt);

  return {
    done: false,
    state: overdue ? ("late" as const) : ("pending" as const),
    elapsedLabel: overdue
      ? "Overdue"
      : dueTomorrow
        ? "Due tomorrow"
        : dueLaterToday
          ? `Due in ${formatMinutes(minutesUntilDue)}`
          : "Due next window",
    dueLabel: formatTimestamp(dueAt.toISOString()),
    badgeClass: overdue
      ? "border-rose-400/20 bg-rose-500/10 text-rose-200"
      : "border-amber-400/20 bg-amber-500/10 text-amber-200",
    score: overdue ? 0 : null,
  };
};

const getStatusBadgeClass = (status: LeadStatus) => {
  switch (status) {
    case "new":
      return "border-sky-400/20 bg-sky-500/10 text-sky-200";
    case "contacted":
      return "border-white/10 bg-white/5 text-slate-200";
    case "qualified":
      return "border-primary/25 bg-primary/10 text-primary";
    case "quoted":
      return "border-amber-400/20 bg-amber-500/10 text-amber-200";
    case "won":
      return "border-emerald-400/20 bg-emerald-500/10 text-emerald-200";
    case "lost":
      return "border-rose-400/20 bg-rose-500/10 text-rose-200";
    case "junk":
      return "border-slate-400/20 bg-slate-500/10 text-slate-300";
  }
};

const getQualityBadgeClass = (quality: LeadQuality) => {
  switch (quality) {
    case "high":
      return "border-emerald-400/20 bg-emerald-500/10 text-emerald-200";
    case "medium":
      return "border-primary/25 bg-primary/10 text-primary";
    case "low":
      return "border-amber-400/20 bg-amber-500/10 text-amber-200";
    case "spam":
      return "border-rose-400/20 bg-rose-500/10 text-rose-200";
    case "unreviewed":
      return "border-white/10 bg-white/5 text-slate-300";
  }
};

const getFeedbackBadgeClass = (status: "pending" | "sent" | "failed") => {
  switch (status) {
    case "pending":
      return "border-amber-400/20 bg-amber-500/10 text-amber-200";
    case "sent":
      return "border-emerald-400/20 bg-emerald-500/10 text-emerald-200";
    case "failed":
      return "border-rose-400/20 bg-rose-500/10 text-rose-200";
  }
};

const getFollowupBadgeClass = (state: DisplayLeadRow["followupState"]) => {
  switch (state) {
    case "overdue":
      return "border-rose-400/20 bg-rose-500/10 text-rose-200";
    case "due_today":
      return "border-amber-400/20 bg-amber-500/10 text-amber-200";
    case "open":
      return "border-primary/25 bg-primary/10 text-primary";
    case "done":
      return "border-emerald-400/20 bg-emerald-500/10 text-emerald-200";
    case "none":
      return "border-white/10 bg-white/5 text-slate-300";
  }
};

const getSourceBadgeClass = (sourceGroup: DisplayLeadRow["sourceGroup"]) => {
  switch (sourceGroup) {
    case "meta":
      return "border-sky-400/20 bg-sky-500/10 text-sky-200";
    case "google":
      return "border-emerald-400/20 bg-emerald-500/10 text-emerald-200";
    case "tiktok":
      return "border-white/10 bg-white/5 text-slate-200";
    case "manual":
      return "border-amber-400/20 bg-amber-500/10 text-amber-200";
    case "website":
      return "border-primary/25 bg-primary/10 text-primary";
  }
};

const getLeadRowAccentClass = (lead: Pick<LeadRow, "status" | "quality_label">) => {
  if (lead.status === "won") {
    return "bg-emerald-500/8 shadow-[inset_0_0_0_1px_rgba(52,211,153,0.22)]";
  }

  if (lead.quality_label === "high") {
    return "bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.12),rgba(251,146,60,0.05)_45%,rgba(0,0,0,0)_80%)] shadow-[inset_0_0_0_1px_rgba(251,191,36,0.18)]";
  }

  return "";
};

const buildSourceGroup = (lead: LeadRow) => {
  const sourceText = [
    lead.source_platform,
    lead.utm_source,
    lead.utm_medium,
    lead.landing_page_variant,
    lead.lead_source_type,
  ]
    .join(" ")
    .toLowerCase();

  if (lead.lead_source_type === "manual") return "manual";
  if (lead.fbclid || sourceText.includes("meta") || sourceText.includes("facebook") || sourceText.includes("instagram")) {
    return "meta";
  }
  if (lead.gclid || sourceText.includes("google")) return "google";
  if (lead.ttclid || sourceText.includes("tiktok") || sourceText.includes("tt")) return "tiktok";
  return "website";
};

const sortFollowups = (items: LeadFollowupRow[]) =>
  [...items].sort((left, right) => {
    const leftPriority = left.status === "open" ? 0 : 1;
    const rightPriority = right.status === "open" ? 0 : 1;
    if (leftPriority !== rightPriority) return leftPriority - rightPriority;

    const leftTime = left.due_at || left.created_at;
    const rightTime = right.due_at || right.created_at;
    return new Date(leftTime).getTime() - new Date(rightTime).getTime();
  });

const getRecommendedFeedbackType = (
  nextState: Pick<LeadRow, "status" | "quality_label">,
): FeedbackType | null => {
  if (nextState.status === "won") return "won_job";
  if (
    nextState.status === "qualified" ||
    nextState.status === "quoted" ||
    nextState.quality_label === "high"
  ) {
    return "qualified_lead";
  }
  return null;
};

const fromDateTimeInputValue = (value: string) => (value ? new Date(value).toISOString() : null);

const formatDueLabel = (followup: LeadFollowupRow | null) => {
  if (!followup) return "No follow-up set";
  if (!followup.due_at) return "Open without deadline";
  return formatTimestamp(followup.due_at);
};

const makeDefaultFollowupDraft = (assignedTo: string | null, currentAdminId?: string): FollowupDraft => ({
  assignedTo: assignedTo || currentAdminId || "unassigned",
  channel: "call",
  dueAt: "",
  notes: "",
});

const makeDefaultManualLeadDraft = (currentAdminId?: string): ManualLeadDraft => ({
  fullName: "",
  phone: "",
  email: "",
  vehicleMake: "",
  vehicleModel: "",
  vehicleYear: "",
  sourcePlatform: "walk_in",
  leadSourceType: "manual",
  assignedTo: currentAdminId || "unassigned",
  notes: "",
  followupDueAt: "",
  followupChannel: "call",
});

const makeLeadDetailsDraft = (
  lead: Pick<
    LeadRow,
    "full_name" | "phone" | "email" | "vehicle_make" | "vehicle_model" | "vehicle_year" | "vehicle_label"
  >,
): LeadDetailsDraft => ({
  fullName: lead.full_name || "",
  phone: lead.phone || "",
  email: lead.email || "",
  vehicleMake: lead.vehicle_make || "",
  vehicleModel: lead.vehicle_model || "",
  vehicleYear: lead.vehicle_year || "",
  vehicleLabel: lead.vehicle_label || "",
});

const makeLeadScheduleDraft = (lead: Pick<LeadRow, "expected_delivery_at">): LeadScheduleDraft => ({
  expectedDeliveryAt: toDatetimeLocalValue(lead.expected_delivery_at),
});

const META_ACCESS_TOKEN_EXPIRES_AT = "2026-06-12T09:26:22.000Z";

const baseLeadSelect =
  "id, primary_session_id, visitor_id, full_name, phone, email, vehicle_make, vehicle_model, vehicle_year, vehicle_label, source_platform, landing_page_variant, funnel_name, lead_source_type, status, quality_label, intent_score, latest_quote_estimate, utm_source, utm_medium, utm_campaign, external_campaign_name, external_adset_name, external_ad_name, utm_content, utm_term, gclid, fbclid, ttclid, notes_summary, import_metadata, expected_delivery_at, assigned_to, first_captured_at, last_activity_at, submitted_at, whatsapp_clicked_at, source_received_at, created_at";

const responseTrackingLeadSelect =
  `${baseLeadSelect}, first_whatsapp_contacted_at, first_whatsapp_contacted_by, first_called_at, first_called_by`;

const AdminLeads = () => {
  const { adminProfile } = useAdminAuth();
  const { toast } = useToast();

  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [sessionRollups, setSessionRollups] = useState<SessionRollupRow[]>([]);
  const [notes, setNotes] = useState<LeadNoteRow[]>([]);
  const [followups, setFollowups] = useState<LeadFollowupRow[]>([]);
  const [statusHistory, setStatusHistory] = useState<LeadStatusHistoryRow[]>([]);
  const [feedbackRows, setFeedbackRows] = useState<AdPlatformFeedbackRow[]>([]);
  const [alertQueueRows, setAlertQueueRows] = useState<CrmAlertQueueRow[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUserOption[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [qualityFilter, setQualityFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [progressFilter, setProgressFilter] = useState("all");
  const [followupFilter, setFollowupFilter] = useState("all");
  const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [followupDrafts, setFollowupDrafts] = useState<Record<string, FollowupDraft>>({});
  const [estimateDrafts, setEstimateDrafts] = useState<Record<string, string>>({});
  const [leadDetailsDrafts, setLeadDetailsDrafts] = useState<Record<string, LeadDetailsDraft>>({});
  const [leadScheduleDrafts, setLeadScheduleDrafts] = useState<Record<string, LeadScheduleDraft>>({});
  const [manualLeadDraft, setManualLeadDraft] = useState<ManualLeadDraft>(() =>
    makeDefaultManualLeadDraft(adminProfile?.id),
  );
  const [leadPendingDelete, setLeadPendingDelete] = useState<DisplayLeadRow | null>(null);
  const [isTelegramDialogOpen, setIsTelegramDialogOpen] = useState(false);
  const [isManualLeadDialogOpen, setIsManualLeadDialogOpen] = useState(false);
  const [savingKeys, setSavingKeys] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [metaTokenWatchPinned, setMetaTokenWatchPinned] = useState(false);
  const [metaTokenWatchHover, setMetaTokenWatchHover] = useState(false);

  const setSaving = (key: string, value: boolean) => {
    setSavingKeys((current) => {
      if (value) {
        return {
          ...current,
          [key]: true,
        };
      }

      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const adminUsersById = useMemo(
    () => new Map(adminUsers.map((user) => [user.id, user])),
    [adminUsers],
  );

  const notesByLeadId = useMemo(() => {
    const map = new Map<string, LeadNoteRow[]>();

    for (const note of notes) {
      const bucket = map.get(note.lead_id) ?? [];
      bucket.push(note);
      map.set(note.lead_id, bucket);
    }

    for (const bucket of map.values()) {
      bucket.sort(
        (left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
      );
    }

    return map;
  }, [notes]);

  const followupsByLeadId = useMemo(() => {
    const map = new Map<string, LeadFollowupRow[]>();

    for (const item of followups) {
      const bucket = map.get(item.lead_id) ?? [];
      bucket.push(item);
      map.set(item.lead_id, bucket);
    }

    for (const [leadId, bucket] of map.entries()) {
      map.set(leadId, sortFollowups(bucket));
    }

    return map;
  }, [followups]);

  const statusHistoryByLeadId = useMemo(() => {
    const map = new Map<string, LeadStatusHistoryRow[]>();

    for (const entry of statusHistory) {
      const bucket = map.get(entry.lead_id) ?? [];
      bucket.push(entry);
      map.set(entry.lead_id, bucket);
    }

    for (const bucket of map.values()) {
      bucket.sort(
        (left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
      );
    }

    return map;
  }, [statusHistory]);

  const feedbackByLeadId = useMemo(() => {
    const map = new Map<string, AdPlatformFeedbackRow[]>();

    for (const entry of feedbackRows) {
      const bucket = map.get(entry.lead_id) ?? [];
      bucket.push(entry);
      map.set(entry.lead_id, bucket);
    }

    for (const bucket of map.values()) {
      bucket.sort(
        (left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
      );
    }

    return map;
  }, [feedbackRows]);

  const loadLeadDesk = useCallback(
    async (options?: { refresh?: boolean }) => {
      if (!supabase) {
        setIsLoading(false);
        return;
      }

      if (options?.refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const adminUsersQuery = supabase
        .from("admin_users")
        .select("id, email, full_name, role, is_active, last_login_at")
        .eq("is_active", true)
        .order("full_name", { ascending: true });

      const loadLeads = (selectClause: string) =>
        supabase
          .from("leads")
          .select(selectClause)
          .order("last_activity_at", { ascending: false, nullsFirst: false })
          .limit(150);

      const rollupsQuery = supabase
        .from("admin_session_rollups")
        .select(
          "session_id, lead_id, lead_name, lead_phone, lead_submitted, whatsapp_clicked, quote_modal_opened, unlock_requested, duration_ms, max_scroll_percent, video_max_progress_percent, package_name, vehicle_size, finish, coverage, quote_estimate, vehicle_make, vehicle_model, vehicle_year, sections_viewed, faq_open_count, ended_at",
        )
        .order("ended_at", { ascending: false })
        .limit(700);

      const notesQuery = supabase
        .from("lead_notes")
        .select("id, lead_id, author_admin_user_id, body, created_at")
        .order("created_at", { ascending: false })
        .limit(700);

      const followupsQuery = supabase
        .from("lead_followups")
        .select("id, lead_id, assigned_to, status, channel, due_at, completed_at, notes, created_at, updated_at")
        .order("created_at", { ascending: false })
        .limit(700);

      const statusHistoryQuery = supabase
        .from("lead_status_history")
        .select("id, lead_id, changed_by, from_status, to_status, reason, created_at")
        .order("created_at", { ascending: false })
        .limit(700);

      const feedbackQuery = supabase
        .from("ad_platform_feedback")
        .select(
          "id, lead_id, platform, feedback_type, feedback_status, external_identifier_type, external_identifier_value, payload, response_payload, sent_at, created_at, updated_at",
        )
        .order("created_at", { ascending: false })
        .limit(700);

      const alertQueueQuery = supabase
        .from("crm_alert_queue")
        .select(
          "id, alert_type, lead_id, followup_id, title, body, payload, delivery_status, delivery_attempts, last_error, sent_at, available_at, created_at, updated_at",
        )
        .order("created_at", { ascending: false })
        .limit(200);

      let [
        adminUsersResult,
        leadsResult,
        rollupsResult,
        notesResult,
        followupsResult,
        statusHistoryResult,
        feedbackResult,
        alertQueueResult,
      ] = await Promise.all([
        adminUsersQuery,
        loadLeads(responseTrackingLeadSelect),
        rollupsQuery,
        notesQuery,
        followupsQuery,
        statusHistoryQuery,
        feedbackQuery,
        alertQueueQuery,
      ]);

      if (leadsResult.error?.code === "42703") {
        console.warn("Lead response tracking columns not available yet, falling back.", leadsResult.error);
        [
          adminUsersResult,
          leadsResult,
          rollupsResult,
          notesResult,
          followupsResult,
          statusHistoryResult,
          feedbackResult,
          alertQueueResult,
        ] = await Promise.all([
          adminUsersQuery,
          loadLeads(baseLeadSelect),
          rollupsQuery,
          notesQuery,
          followupsQuery,
          statusHistoryQuery,
          feedbackQuery,
          alertQueueQuery,
        ]);
      }

      if (adminUsersResult.error) {
        console.warn("Failed to load admin users", adminUsersResult.error);
        setAdminUsers([]);
      } else {
        setAdminUsers((adminUsersResult.data as AdminUserOption[]) ?? []);
      }

      if (leadsResult.error) {
        console.warn("Failed to load leads", leadsResult.error);
        setLeads([]);
      } else {
        setLeads(
          (((leadsResult.data as Partial<LeadRow>[]) ?? []).map((lead) => ({
            first_whatsapp_contacted_at: null,
            first_whatsapp_contacted_by: null,
            first_called_at: null,
            first_called_by: null,
            source_received_at: null,
            created_at: "",
            ...lead,
          })) as LeadRow[]) ?? [],
        );
      }

      if (rollupsResult.error) {
        console.warn("Failed to load session rollups", rollupsResult.error);
        setSessionRollups([]);
      } else {
        setSessionRollups((rollupsResult.data as SessionRollupRow[]) ?? []);
      }

      if (notesResult.error) {
        console.warn("Failed to load lead notes", notesResult.error);
        setNotes([]);
      } else {
        setNotes((notesResult.data as LeadNoteRow[]) ?? []);
      }

      if (followupsResult.error) {
        console.warn("Failed to load lead followups", followupsResult.error);
        setFollowups([]);
      } else {
        setFollowups((followupsResult.data as LeadFollowupRow[]) ?? []);
      }

      if (statusHistoryResult.error) {
        console.warn("Failed to load status history", statusHistoryResult.error);
        setStatusHistory([]);
      } else {
        setStatusHistory((statusHistoryResult.data as LeadStatusHistoryRow[]) ?? []);
      }

      if (feedbackResult.error) {
        console.warn("Failed to load ad platform feedback", feedbackResult.error);
        setFeedbackRows([]);
      } else {
        setFeedbackRows((feedbackResult.data as AdPlatformFeedbackRow[]) ?? []);
      }

      if (alertQueueResult.error) {
        console.warn("Failed to load CRM alert queue", alertQueueResult.error);
        setAlertQueueRows([]);
      } else {
        setAlertQueueRows((alertQueueResult.data as CrmAlertQueueRow[]) ?? []);
      }

      setIsLoading(false);
      setIsRefreshing(false);
    },
    [],
  );

  useEffect(() => {
    void loadLeadDesk();
  }, [loadLeadDesk]);

  useEffect(() => {
    setManualLeadDraft((current) =>
      current.assignedTo !== "unassigned" || !adminProfile?.id
        ? current
        : {
            ...current,
            assignedTo: adminProfile.id,
          },
    );
  }, [adminProfile?.id]);

  const queueRecommendedMetaFeedback = useCallback(
    async (
      lead: LeadRow,
      nextState: Pick<LeadRow, "status" | "quality_label">,
      existingFeedback: AdPlatformFeedbackRow[],
    ) => {
      if (!supabase) return;
      if (buildSourceGroup(lead) !== "meta") return;

      const feedbackType = getRecommendedFeedbackType(nextState);

      const pendingMetaFeedbackIds = existingFeedback
        .filter((entry) => entry.platform === "meta" && entry.feedback_status === "pending")
        .map((entry) => entry.id);

      if (pendingMetaFeedbackIds.length) {
        const { error: clearPendingError } = await supabase
          .from("ad_platform_feedback")
          .delete()
          .in("id", pendingMetaFeedbackIds);

        if (clearPendingError) {
          console.warn("Failed to clear stale Meta feedback", clearPendingError);
          toast({
            title: "Meta feedback could not be refreshed",
            description: "The old pending Meta feedback row could not be replaced yet.",
            variant: "destructive",
          });
          return;
        }
      }

      if (!feedbackType) return;

      const hasMatchingSentFeedback = existingFeedback.some(
        (entry) =>
          entry.platform === "meta" &&
          entry.feedback_type === feedbackType &&
          entry.feedback_status === "sent",
      );

      if (hasMatchingSentFeedback) return;

      const payload = {
        lead_status: nextState.status,
        quality_label: nextState.quality_label,
        source_platform: lead.source_platform,
        landing_page_variant: lead.landing_page_variant,
        queued_from: "admin_leads",
        queued_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("ad_platform_feedback").insert({
        lead_id: lead.id,
        platform: "meta",
        feedback_type: feedbackType,
        feedback_status: "pending",
        external_identifier_type: lead.fbclid ? "fbclid" : null,
        external_identifier_value: lead.fbclid ?? null,
        payload,
      });

      if (error) {
        console.warn("Failed to queue Meta feedback", error);
        toast({
          title: "Meta feedback was not queued",
          description: "The CRM update still saved, but the pending feedback row needs another try.",
          variant: "destructive",
        });
      }
    },
    [toast],
  );

  const leadsWithIntent = useMemo<DisplayLeadRow[]>(() => {
    return leads.map((lead) => {
      const matchingRollups = sessionRollups.filter((rollup) => {
        if (lead.primary_session_id && rollup.session_id === lead.primary_session_id) {
          return true;
        }

        if (rollup.lead_id && rollup.lead_id === lead.id) {
          return true;
        }

        return Boolean(
          lead.phone && rollup.lead_phone && normalizePhone(lead.phone) === normalizePhone(rollup.lead_phone),
        );
      });

      const computedIntentScore = matchingRollups.reduce((highest, rollup) => {
        const nextScore = getIntentScore({
          leadSubmitted: rollup.lead_submitted,
          whatsappClicked: rollup.whatsapp_clicked,
          leadName: rollup.lead_name || lead.full_name || "",
          leadPhone: rollup.lead_phone || lead.phone || "",
          vehicleMake: rollup.vehicle_make || lead.vehicle_make || "",
          vehicleModel: rollup.vehicle_model || lead.vehicle_model || "",
          vehicleYear: rollup.vehicle_year || lead.vehicle_year || "",
          quoteModalOpened: rollup.quote_modal_opened,
          unlockRequested: rollup.unlock_requested,
          quoteEstimate: rollup.quote_estimate,
          packageName: rollup.package_name || "",
          vehicleSize: rollup.vehicle_size || "",
          finish: rollup.finish || "",
          coverage: rollup.coverage || "",
          durationMs: rollup.duration_ms ?? 0,
          maxScrollPercent: rollup.max_scroll_percent ?? 0,
          videoMaxProgressPercent: rollup.video_max_progress_percent ?? 0,
          videoStarted: (rollup.video_max_progress_percent ?? 0) > 0,
          sectionsViewed: rollup.sections_viewed ?? [],
          faqOpenCount: rollup.faq_open_count ?? 0,
        });

        return Math.max(highest, nextScore);
      }, 0);

      const fallbackIntentScore = getIntentScore({
        leadSubmitted: Boolean(lead.submitted_at),
        whatsappClicked: Boolean(lead.whatsapp_clicked_at),
        leadName: lead.full_name || "",
        leadPhone: lead.phone || "",
        vehicleMake: lead.vehicle_make || "",
        vehicleModel: lead.vehicle_model || "",
        vehicleYear: lead.vehicle_year || "",
        quoteModalOpened: false,
        unlockRequested: false,
        quoteEstimate: lead.latest_quote_estimate,
        packageName: "",
        vehicleSize: "",
        finish: "",
        coverage: "",
        durationMs: 0,
        maxScrollPercent: 0,
        videoMaxProgressPercent: 0,
        videoStarted: false,
        sectionsViewed: [],
        faqOpenCount: 0,
      });

      const sourceGroup = buildSourceGroup(lead);
      const leadNotes = notesByLeadId.get(lead.id) ?? [];
      const leadFollowups = followupsByLeadId.get(lead.id) ?? [];
      const openFollowups = leadFollowups.filter((item) => item.status === "open");
      const openFollowupsWithDueDates = openFollowups.filter((item) => item.due_at);
      const nextOpenFollowup = openFollowupsWithDueDates[0] ?? openFollowups[0] ?? null;

      const now = new Date();
      const hasOverdueFollowup = openFollowups.some(
        (item) => item.due_at && new Date(item.due_at).getTime() < now.getTime(),
      );
      const hasTodayFollowup = openFollowups.some((item) => {
        if (!item.due_at) return false;
        const dueDate = new Date(item.due_at);
        return dueDate.toDateString() === now.toDateString();
      });

      const followupState: DisplayLeadRow["followupState"] = hasOverdueFollowup
        ? "overdue"
        : hasTodayFollowup
          ? "due_today"
          : openFollowups.length
            ? "open"
            : leadFollowups.some((item) => item.status === "done")
              ? "done"
              : "none";

      return {
        ...lead,
        assignedAdmin: lead.assigned_to ? adminUsersById.get(lead.assigned_to) ?? null : null,
        displayIntentScore: Math.max(lead.intent_score, computedIntentScore, fallbackIntentScore),
        latestRollup: matchingRollups[0] ?? null,
        matchingSessions: matchingRollups.length,
        sourceGroup,
        isMetaOriginated: sourceGroup === "meta",
        lifecycleLabel: lead.submitted_at ? "submitted" : "partial",
        notes: leadNotes,
        followups: leadFollowups,
        statusHistory: statusHistoryByLeadId.get(lead.id) ?? [],
        feedback: feedbackByLeadId.get(lead.id) ?? [],
        nextOpenFollowup,
        followupState,
      };
    });
  }, [
    adminUsersById,
    feedbackByLeadId,
    followupsByLeadId,
    leads,
    notesByLeadId,
    sessionRollups,
    statusHistoryByLeadId,
  ]);

  const filteredLeads = useMemo(() => {
    return leadsWithIntent.filter((lead) => {
      const vehicle = getLeadVehicleText(lead);
      const haystack = [
        lead.full_name,
        lead.phone,
        lead.email,
        vehicle,
        lead.source_platform,
        lead.landing_page_variant,
        getLeadCampaignLabel(lead),
        lead.status,
        lead.quality_label,
        lead.assignedAdmin?.full_name,
        lead.assignedAdmin?.email,
        lead.notes_summary,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = haystack.includes(searchQuery.trim().toLowerCase());
      const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
      const matchesQuality = qualityFilter === "all" || lead.quality_label === qualityFilter;
      const matchesSource = sourceFilter === "all" || lead.sourceGroup === sourceFilter;
      const matchesProgress = progressFilter === "all" || lead.lifecycleLabel === progressFilter;
      const matchesFollowup =
        followupFilter === "all" ||
        (followupFilter === "needs_attention" &&
          ["overdue", "due_today", "open"].includes(lead.followupState)) ||
        (followupFilter === "overdue" && lead.followupState === "overdue") ||
        (followupFilter === "due_today" && lead.followupState === "due_today") ||
        (followupFilter === "none" && lead.followupState === "none");

      return (
        matchesSearch &&
        matchesStatus &&
        matchesQuality &&
        matchesSource &&
        matchesProgress &&
        matchesFollowup
      );
    });
  }, [
    followupFilter,
    leadsWithIntent,
    progressFilter,
    qualityFilter,
    searchQuery,
    sourceFilter,
    statusFilter,
  ]);

  const summary = useMemo(() => {
    const metaLeads = leadsWithIntent.filter((lead) => lead.isMetaOriginated);
    const pendingMetaFeedback = metaLeads.filter((lead) =>
      lead.feedback.some((entry) => entry.platform === "meta" && entry.feedback_status === "pending"),
    );

    return {
      newLeads: leadsWithIntent.filter((lead) => lead.status === "new").length,
      dueFollowups: leadsWithIntent.filter((lead) =>
        ["overdue", "due_today"].includes(lead.followupState),
      ).length,
      partialLeads: leadsWithIntent.filter((lead) => lead.lifecycleLabel === "partial").length,
      pendingMetaFeedback: pendingMetaFeedback.length,
      metaLeads: metaLeads.length,
    };
  }, [leadsWithIntent]);

  const followupBoardRows = useMemo(() => {
    return leadsWithIntent
      .flatMap((lead) =>
        lead.followups
          .filter((followup) => followup.status === "open")
          .map((followup) => ({
            lead,
            followup,
            dueTime: new Date(followup.due_at || followup.created_at).getTime(),
            urgency:
              lead.followupState === "overdue"
                ? 0
                : lead.followupState === "due_today"
                  ? 1
                  : 2,
          })),
      )
      .sort((left, right) => {
        if (left.urgency !== right.urgency) return left.urgency - right.urgency;
        return left.dueTime - right.dueTime;
      });
  }, [leadsWithIntent]);

  const alertQueueSummary = useMemo(
    () => ({
      pending: alertQueueRows.filter((row) => row.delivery_status === "pending").length,
      sent: alertQueueRows.filter((row) => row.delivery_status === "sent").length,
      failed: alertQueueRows.filter((row) => row.delivery_status === "failed").length,
    }),
    [alertQueueRows],
  );

  const updateFollowupDraft = (
    leadId: string,
    patch: Partial<FollowupDraft>,
    assignedTo: string | null,
  ) => {
    setFollowupDrafts((current) => ({
      ...current,
      [leadId]: {
        ...(current[leadId] ?? makeDefaultFollowupDraft(assignedTo, adminProfile?.id)),
        ...patch,
      },
    }));
  };

  const updateLeadDetailsDraft = (
    lead: Pick<
      LeadRow,
      "id" | "full_name" | "phone" | "email" | "vehicle_make" | "vehicle_model" | "vehicle_year" | "vehicle_label"
    >,
    patch: Partial<LeadDetailsDraft>,
  ) => {
    setLeadDetailsDrafts((current) => ({
      ...current,
      [lead.id]: {
        ...(current[lead.id] ?? makeLeadDetailsDraft(lead)),
        ...patch,
      },
    }));
  };

  const updateLeadScheduleDraft = (
    lead: Pick<LeadRow, "id" | "expected_delivery_at">,
    patch: Partial<LeadScheduleDraft>,
  ) => {
    setLeadScheduleDrafts((current) => ({
      ...current,
      [lead.id]: {
        ...(current[lead.id] ?? makeLeadScheduleDraft(lead)),
        ...patch,
      },
    }));
  };

  const handleLeadAssignment = async (lead: DisplayLeadRow, nextAssignedTo: string) => {
    if (!supabase) return;

    const saveKey = `assign:${lead.id}`;
    setSaving(saveKey, true);

    const assignedTo = nextAssignedTo === "unassigned" ? null : nextAssignedTo;

    const { error } = await supabase.from("leads").update({ assigned_to: assignedTo }).eq("id", lead.id);

    setSaving(saveKey, false);

    if (error) {
      toast({
        title: "Assignment failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Lead owner updated",
      description: assignedTo ? "The lead is now assigned inside the desk." : "The lead is now unassigned.",
    });

    void loadLeadDesk({ refresh: true });
  };

  const handleLogOutreach = async (lead: DisplayLeadRow, channel: "whatsapp" | "call") => {
    if (!supabase || !adminProfile?.id) return;

    const saveKey = `${channel}:${lead.id}`;
    setSaving(saveKey, true);

    const completedColumn =
      channel === "whatsapp" ? "first_whatsapp_contacted_at" : "first_called_at";
    const byColumn = channel === "whatsapp" ? "first_whatsapp_contacted_by" : "first_called_by";
    const completedAt = new Date().toISOString();

    const updatePayload: Record<string, string> = {
      [completedColumn]: completedAt,
      [byColumn]: adminProfile.id,
    };

    if (lead.status === "new") {
      updatePayload.status = "contacted";
    }

    const { error } = await supabase.from("leads").update(updatePayload).eq("id", lead.id);

    if (!error && lead.status === "new") {
      const reason =
        channel === "whatsapp"
          ? "Marked contacted when WhatsApp outreach was logged"
          : "Marked contacted when customer call was logged";

      const { error: historyError } = await supabase.from("lead_status_history").insert({
        lead_id: lead.id,
        changed_by: adminProfile.id,
        from_status: lead.status,
        to_status: "contacted",
        reason,
      });

      if (historyError) {
        console.warn("Failed to write outreach contact history", historyError);
      }
    }

    setSaving(saveKey, false);

    if (error) {
      toast({
        title: `Could not log ${channel === "whatsapp" ? "WhatsApp" : "call"}`,
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: `${channel === "whatsapp" ? "WhatsApp" : "Call"} logged`,
      description:
        channel === "whatsapp"
          ? "First WhatsApp outreach has been recorded for this lead."
          : "First customer call has been recorded for this lead.",
    });

    void loadLeadDesk({ refresh: true });
  };

  const handleEstimateSave = async (lead: DisplayLeadRow) => {
    if (!supabase) return;

    const rawValue = (estimateDrafts[lead.id] ?? "").trim();
    const nextEstimate = rawValue ? Number(rawValue.replace(/,/g, "")) : null;

    if (rawValue && Number.isNaN(nextEstimate)) {
      toast({
        title: "Quoted amount is invalid",
        description: "Enter a valid AED amount before saving.",
        variant: "destructive",
      });
      return;
    }

    const saveKey = `estimate:${lead.id}`;
    setSaving(saveKey, true);

    const { error } = await supabase
      .from("leads")
      .update({ latest_quote_estimate: nextEstimate })
      .eq("id", lead.id);

    setSaving(saveKey, false);

    if (error) {
      toast({
        title: "Estimate update failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Quoted amount updated",
      description:
        nextEstimate === null
          ? "The quoted amount was cleared."
          : `Estimate saved as AED ${Math.round(nextEstimate).toLocaleString("en-AE")}.`,
    });

    void loadLeadDesk({ refresh: true });
  };

  const handleLeadDetailsSave = async (lead: DisplayLeadRow) => {
    if (!supabase) return;

    const draft = leadDetailsDrafts[lead.id] ?? makeLeadDetailsDraft(lead);
    const fullName = draft.fullName.trim() || null;
    const phone = draft.phone.trim() ? normalizePhone(draft.phone.trim()) : null;
    const email = draft.email.trim() || null;
    const vehicleMake = draft.vehicleMake.trim() || null;
    const vehicleModel = draft.vehicleModel.trim() || null;
    const vehicleYear = draft.vehicleYear.trim() || null;
    const manualVehicleLabel = draft.vehicleLabel.trim();
    const derivedVehicleLabel = [vehicleYear, vehicleMake, vehicleModel].filter(Boolean).join(" ");
    const vehicleLabel = manualVehicleLabel || derivedVehicleLabel || null;

    const saveKey = `details:${lead.id}`;
    setSaving(saveKey, true);

    const { error } = await supabase
      .from("leads")
      .update({
        full_name: fullName,
        phone,
        email,
        vehicle_make: vehicleMake,
        vehicle_model: vehicleModel,
        vehicle_year: vehicleYear,
        vehicle_label: vehicleLabel,
      })
      .eq("id", lead.id);

    setSaving(saveKey, false);

    if (error) {
      toast({
        title: "Customer details update failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Customer details updated",
      description: "The lead name, contact details, and vehicle info were saved.",
    });

    setLeadDetailsDrafts((current) => {
      const next = { ...current };
      delete next[lead.id];
      return next;
    });

    void loadLeadDesk({ refresh: true });
  };

  const handleExpectedDeliverySave = async (lead: DisplayLeadRow) => {
    if (!supabase) return;

    const draft = leadScheduleDrafts[lead.id] ?? makeLeadScheduleDraft(lead);
    const expectedDeliveryAt = draft.expectedDeliveryAt ? new Date(draft.expectedDeliveryAt).toISOString() : null;

    const saveKey = `delivery:${lead.id}`;
    setSaving(saveKey, true);

    const { error } = await supabase
      .from("leads")
      .update({
        expected_delivery_at: expectedDeliveryAt,
      })
      .eq("id", lead.id);

    setSaving(saveKey, false);

    if (error) {
      toast({
        title: "Expected delivery update failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Expected delivery updated",
      description: expectedDeliveryAt
        ? `Expected delivery saved for ${formatTimestamp(expectedDeliveryAt)}.`
        : "Expected delivery was cleared.",
    });

    setLeadScheduleDrafts((current) => {
      const next = { ...current };
      delete next[lead.id];
      return next;
    });

    void loadLeadDesk({ refresh: true });
  };

  const handleStatusChange = async (lead: DisplayLeadRow, nextStatus: LeadStatus, reason?: string) => {
    if (!supabase || nextStatus === lead.status) return;

    const saveKey = `status:${lead.id}`;
    setSaving(saveKey, true);

    const { error } = await supabase.from("leads").update({ status: nextStatus }).eq("id", lead.id);

    if (!error) {
      const { error: historyError } = await supabase.from("lead_status_history").insert({
        lead_id: lead.id,
        changed_by: adminProfile?.id ?? null,
        from_status: lead.status,
        to_status: nextStatus,
        reason: reason ?? null,
      });

      if (historyError) {
        console.warn("Failed to write status history", historyError);
      }

      await queueRecommendedMetaFeedback(
        lead,
        { status: nextStatus, quality_label: lead.quality_label },
        lead.feedback,
      );
    }

    setSaving(saveKey, false);

    if (error) {
      toast({
        title: "Status update failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Lead status updated",
      description: `This lead is now marked ${formatTokenLabel(nextStatus).toLowerCase()}.`,
    });

    void loadLeadDesk({ refresh: true });
  };

  const handleQualityChange = async (lead: DisplayLeadRow, nextQuality: LeadQuality) => {
    if (!supabase || nextQuality === lead.quality_label) return;

    const saveKey = `quality:${lead.id}`;
    setSaving(saveKey, true);

    const { error } = await supabase
      .from("leads")
      .update({ quality_label: nextQuality })
      .eq("id", lead.id);

    if (!error) {
      await queueRecommendedMetaFeedback(
        lead,
        { status: lead.status, quality_label: nextQuality },
        lead.feedback,
      );
    }

    setSaving(saveKey, false);

    if (error) {
      toast({
        title: "Quality update failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Quality label updated",
      description: `This lead is now marked ${formatTokenLabel(nextQuality).toLowerCase()}.`,
    });

    void loadLeadDesk({ refresh: true });
  };

  const handleAddNote = async (lead: DisplayLeadRow) => {
    if (!supabase || !adminProfile?.id) return;

    const noteBody = (noteDrafts[lead.id] ?? "").trim();
    if (!noteBody) return;

    const saveKey = `note:${lead.id}`;
    setSaving(saveKey, true);

    const { error } = await supabase.from("lead_notes").insert({
      lead_id: lead.id,
      author_admin_user_id: adminProfile.id,
      body: noteBody,
    });

    if (!error) {
      const { error: summaryError } = await supabase
        .from("leads")
        .update({ notes_summary: noteBody.slice(0, 180) })
        .eq("id", lead.id);

      if (summaryError) {
        console.warn("Failed to update notes summary", summaryError);
      }
    }

    setSaving(saveKey, false);

    if (error) {
      toast({
        title: "Note not saved",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setNoteDrafts((current) => ({
      ...current,
      [lead.id]: "",
    }));

    toast({
      title: "Note saved",
      description: "The internal note is now attached to the lead.",
    });

    void loadLeadDesk({ refresh: true });
  };

  const handleCreateFollowup = async (lead: DisplayLeadRow) => {
    if (!supabase) return;

    const draft = followupDrafts[lead.id] ?? makeDefaultFollowupDraft(lead.assigned_to, adminProfile?.id);
    const saveKey = `followup-create:${lead.id}`;
    setSaving(saveKey, true);

    const { error } = await supabase.from("lead_followups").insert({
      lead_id: lead.id,
      assigned_to: draft.assignedTo === "unassigned" ? null : draft.assignedTo,
      channel: draft.channel,
      due_at: fromDateTimeInputValue(draft.dueAt),
      notes: draft.notes.trim() || null,
    });

    setSaving(saveKey, false);

    if (error) {
      toast({
        title: "Follow-up not created",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setFollowupDrafts((current) => ({
      ...current,
      [lead.id]: makeDefaultFollowupDraft(lead.assigned_to, adminProfile?.id),
    }));

    toast({
      title: "Follow-up created",
      description: "This lead now has a follow-up task inside the CRM.",
    });

    void loadLeadDesk({ refresh: true });
  };

  const handleFollowupStatusChange = async (
    leadId: string,
    followupId: string,
    nextStatus: FollowupStatus,
  ) => {
    if (!supabase) return;

    const saveKey = `followup-status:${followupId}`;
    setSaving(saveKey, true);

    const { error } = await supabase
      .from("lead_followups")
      .update({
        status: nextStatus,
        completed_at: nextStatus === "done" ? new Date().toISOString() : null,
      })
      .eq("id", followupId)
      .eq("lead_id", leadId);

    setSaving(saveKey, false);

    if (error) {
      toast({
        title: "Follow-up update failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Follow-up updated",
      description: `This follow-up is now ${formatTokenLabel(nextStatus).toLowerCase()}.`,
    });

    void loadLeadDesk({ refresh: true });
  };

  const handleOpenLeadFromBoard = (leadId: string) => {
    setSearchQuery("");
    setStatusFilter("all");
    setQualityFilter("all");
    setSourceFilter("all");
    setProgressFilter("all");
    setFollowupFilter("all");
    setExpandedLeadId(leadId);

    window.setTimeout(() => {
      const leadRow = document.getElementById(`lead-row-${leadId}`);
      leadRow?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 120);
  };

  const handleCreateManualLead = async () => {
    if (!supabase || !adminProfile?.id) return;

    const hasPrimaryIdentity = manualLeadDraft.fullName.trim() || manualLeadDraft.phone.trim() || manualLeadDraft.email.trim();
    if (!hasPrimaryIdentity) {
      toast({
        title: "Lead details are too thin",
        description: "Add at least a name, phone, or email before creating the lead.",
        variant: "destructive",
      });
      return;
    }

    const saveKey = "manual-lead";
    setSaving(saveKey, true);

    const now = new Date().toISOString();
    const leadInsert = {
      full_name: manualLeadDraft.fullName.trim() || null,
      phone: manualLeadDraft.phone.trim() || null,
      email: manualLeadDraft.email.trim() || null,
      vehicle_make: manualLeadDraft.vehicleMake.trim() || null,
      vehicle_model: manualLeadDraft.vehicleModel.trim() || null,
      vehicle_year: manualLeadDraft.vehicleYear.trim() || null,
      source_platform: manualLeadDraft.sourcePlatform.trim() || "manual",
      lead_source_type: manualLeadDraft.leadSourceType,
      assigned_to: manualLeadDraft.assignedTo === "unassigned" ? null : manualLeadDraft.assignedTo,
      status: "new" as LeadStatus,
      quality_label: "unreviewed" as LeadQuality,
      first_captured_at: now,
      last_activity_at: now,
      source_received_at: now,
    };

    const { data: insertedLead, error } = await supabase
      .from("leads")
      .insert(leadInsert)
      .select("id")
      .single();

    if (!error && insertedLead?.id && manualLeadDraft.notes.trim()) {
      const { error: noteError } = await supabase.from("lead_notes").insert({
        lead_id: insertedLead.id,
        author_admin_user_id: adminProfile.id,
        body: manualLeadDraft.notes.trim(),
      });

      if (noteError) {
        console.warn("Failed to create initial lead note", noteError);
      }

      const { error: summaryError } = await supabase
        .from("leads")
        .update({ notes_summary: manualLeadDraft.notes.trim().slice(0, 180) })
        .eq("id", insertedLead.id);

      if (summaryError) {
        console.warn("Failed to update manual lead notes summary", summaryError);
      }
    }

    if (!error && insertedLead?.id && manualLeadDraft.followupDueAt) {
      const { error: followupError } = await supabase.from("lead_followups").insert({
        lead_id: insertedLead.id,
        assigned_to: manualLeadDraft.assignedTo === "unassigned" ? null : manualLeadDraft.assignedTo,
        channel: manualLeadDraft.followupChannel,
        due_at: fromDateTimeInputValue(manualLeadDraft.followupDueAt),
        notes: manualLeadDraft.notes.trim() || "Initial follow-up from manual lead intake",
      });

      if (followupError) {
        console.warn("Failed to create initial follow-up for manual lead", followupError);
      }
    }

    setSaving(saveKey, false);

    if (error) {
      toast({
        title: "Lead creation failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setManualLeadDraft(makeDefaultManualLeadDraft(adminProfile.id));
    toast({
      title: "Lead created",
      description: "The manual lead is now inside the CRM and will flow through the same sales process.",
    });
    setExpandedLeadId(insertedLead?.id ?? null);
    setIsManualLeadDialogOpen(false);
    void loadLeadDesk({ refresh: true });
  };

  const handleDeleteLead = async (lead: DisplayLeadRow) => {
    if (!supabase) return;

    const saveKey = `delete:${lead.id}`;
    setSaving(saveKey, true);

    const { error } = await supabase.from("leads").delete().eq("id", lead.id);

    setSaving(saveKey, false);
    setLeadPendingDelete(null);

    if (error) {
      toast({
        title: "Lead delete failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    if (expandedLeadId === lead.id) {
      setExpandedLeadId(null);
    }

    toast({
      title: "Lead deleted",
      description: "The lead and its linked CRM records were removed.",
    });

    void loadLeadDesk({ refresh: true });
  };

  const metaTokenWatchExpanded = metaTokenWatchPinned || metaTokenWatchHover;

  return (
    <AdminShell
      title="Lead Desk"
      description="This is now the working sales inbox for website leads. It keeps partial captures, notes, follow-ups, and source context together, while preparing Meta-originated leads for later quality feedback sending from a backend job."
    >
      <div className="grid gap-4 xl:grid-cols-4">
        <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(10,10,10,0.96))] p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Needs first touch</p>
          <p className="mt-3 text-3xl font-semibold text-white">{summary.newLeads}</p>
          <p className="mt-2 text-sm text-slate-400">Leads still sitting in the `new` status.</p>
        </Card>
        <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(10,10,10,0.96))] p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Follow-ups due</p>
          <p className="mt-3 text-3xl font-semibold text-white">{summary.dueFollowups}</p>
          <p className="mt-2 text-sm text-slate-400">Open reminders due today or already overdue.</p>
        </Card>
        <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(10,10,10,0.96))] p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Partial captures</p>
          <p className="mt-3 text-3xl font-semibold text-white">{summary.partialLeads}</p>
          <p className="mt-2 text-sm text-slate-400">Contacts who have not fully submitted yet.</p>
        </Card>
        <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(10,10,10,0.96))] p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Meta feedback queue</p>
          <p className="mt-3 text-3xl font-semibold text-white">{summary.pendingMetaFeedback}</p>
          <p className="mt-2 text-sm text-slate-400">
            Pending Meta feedback rows across {summary.metaLeads} Meta-originated leads.
          </p>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(10,10,10,0.96))] p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Follow-up board</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Who needs attention next</h2>
              <p className="mt-2 text-sm text-slate-400">
                This is the action queue for sales: overdue first, due today second, then the rest.
              </p>
            </div>
            <Badge variant="outline" className="border-white/10 bg-black/20 text-slate-300">
              {followupBoardRows.length} open follow-up{followupBoardRows.length === 1 ? "" : "s"}
            </Badge>
          </div>

          <div className="mt-6 space-y-3">
            {followupBoardRows.length ? (
              followupBoardRows.slice(0, 10).map(({ lead, followup }) => {
                const whatsappUrl = buildWhatsAppUrl(lead.phone);

                return (
                  <div
                    key={followup.id}
                    className="rounded-2xl border border-white/10 bg-black/20 p-4"
                  >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className={getFollowupBadgeClass(lead.followupState)}>
                          {formatTokenLabel(lead.followupState)}
                        </Badge>
                        <Badge variant="outline" className="border-white/10 bg-white/5 text-slate-200">
                          {formatTokenLabel(followup.channel)}
                        </Badge>
                        <Badge variant="outline" className={getSourceBadgeClass(lead.sourceGroup)}>
                          {formatTokenLabel(lead.sourceGroup)}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-white">{lead.full_name || "Unnamed lead"}</p>
                        {whatsappUrl && lead.phone ? (
                          <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm text-emerald-300 transition hover:text-emerald-200 hover:underline"
                            onClick={(event) => event.stopPropagation()}
                          >
                            {lead.phone}
                          </a>
                        ) : (
                          <p className="text-sm text-slate-400">{lead.phone || "No phone captured"}</p>
                        )}
                      </div>
                      <p className="text-sm text-slate-300">
                        <span className="text-slate-500">Due:</span> {formatDueLabel(followup)}
                      </p>
                      <p className="text-sm text-slate-300">
                        <span className="text-slate-500">Summary:</span> {followup.notes || "No follow-up notes yet."}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="border-white/10 bg-black/20 text-white hover:bg-white/10"
                        onClick={() => handleOpenLeadFromBoard(lead.id)}
                      >
                        Open lead
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="border-emerald-400/20 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20"
                        onClick={() => void handleFollowupStatusChange(lead.id, followup.id, "done")}
                        disabled={Boolean(savingKeys[`followup-status:${followup.id}`])}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Mark done
                      </Button>
                    </div>
                  </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-sm text-slate-400">
                No open follow-ups yet. Create them from lead cards or the manual intake form.
              </div>
            )}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="hidden border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(10,10,10,0.96))] p-5 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Telegram alerts</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Notification queue</h2>
                <p className="mt-2 text-sm text-slate-400">
                  New leads and created follow-ups can now queue server-side alerts. A Telegram edge
                  function can deliver these instantly and send a morning digest for that day’s open follow-ups.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="border-amber-400/20 bg-amber-500/10 text-amber-200">
                  Pending {alertQueueSummary.pending}
                </Badge>
                <Badge variant="outline" className="border-emerald-400/20 bg-emerald-500/10 text-emerald-200">
                  Sent {alertQueueSummary.sent}
                </Badge>
                <Badge variant="outline" className="border-rose-400/20 bg-rose-500/10 text-rose-200">
                  Failed {alertQueueSummary.failed}
                </Badge>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
              <p className="font-medium text-white">What still needs setup</p>
              <p className="mt-2">
                Add `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` as Supabase function secrets, then deploy
                the Telegram delivery function so these queued alerts actually ping your bot or channel.
              </p>
            </div>

            <div className="mt-5 space-y-3">
              {alertQueueRows.length ? (
                alertQueueRows.slice(0, 6).map((alert) => (
                  <div key={alert.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="border-white/10 bg-white/5 text-slate-200">
                            {formatTokenLabel(alert.alert_type)}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={getFeedbackBadgeClass(
                              alert.delivery_status === "skipped" ? "failed" : alert.delivery_status,
                            )}
                          >
                            {formatTokenLabel(alert.delivery_status)}
                          </Badge>
                        </div>
                        <p className="mt-3 text-sm font-medium text-white">{alert.title}</p>
                        <p className="mt-1 text-sm text-slate-400">{alert.body}</p>
                      </div>
                      <p className="text-xs text-slate-500">{formatTimestamp(alert.created_at)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-400">
                  No queued alerts yet. New leads and new follow-ups will start appearing here once created.
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      <Card className="mb-6 border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(10,10,10,0.96))] p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Alerts</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Telegram delivery</h2>
            <p className="mt-2 text-sm text-slate-400">
              Queue details are available on demand instead of living inside the main CRM workspace.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-amber-400/20 bg-amber-500/10 text-amber-200">
              Pending {alertQueueSummary.pending}
            </Badge>
            <Badge variant="outline" className="border-emerald-400/20 bg-emerald-500/10 text-emerald-200">
              Sent {alertQueueSummary.sent}
            </Badge>
            <Badge variant="outline" className="border-rose-400/20 bg-rose-500/10 text-rose-200">
              Failed {alertQueueSummary.failed}
            </Badge>
            <Dialog open={isTelegramDialogOpen} onOpenChange={setIsTelegramDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="border-white/10 bg-black/20 text-white hover:bg-white/10"
                >
                  View queue
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl border-white/10 bg-[#111111] text-white">
                <DialogHeader>
                  <DialogTitle>Telegram alert queue</DialogTitle>
                  <DialogDescription className="text-slate-400">
                    Live lead and follow-up alert history without crowding the day-to-day sales desk.
                  </DialogDescription>
                </DialogHeader>

                <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
                  {alertQueueRows.length ? (
                    alertQueueRows.slice(0, 20).map((alert) => (
                      <div key={alert.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="outline" className="border-white/10 bg-white/5 text-slate-200">
                                {formatTokenLabel(alert.alert_type)}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={getFeedbackBadgeClass(
                                  alert.delivery_status === "skipped" ? "failed" : alert.delivery_status,
                                )}
                              >
                                {formatTokenLabel(alert.delivery_status)}
                              </Badge>
                            </div>
                            <p className="mt-3 text-sm font-medium text-white">{alert.title}</p>
                            <p className="mt-1 text-sm text-slate-400">{alert.body}</p>
                          </div>
                          <p className="text-xs text-slate-500">{formatTimestamp(alert.created_at)}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-400">
                      No queued alerts yet. New leads and follow-ups will appear here automatically.
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </Card>

      <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(10,10,10,0.96))] p-5 sm:p-6">
        <div
          className="mb-4"
          onMouseEnter={() => setMetaTokenWatchHover(true)}
          onMouseLeave={() => setMetaTokenWatchHover(false)}
        >
          <button
            type="button"
            aria-expanded={metaTokenWatchExpanded}
            className="flex w-full max-w-md items-center gap-2 rounded-full border border-amber-400/25 bg-[linear-gradient(135deg,rgba(245,158,11,0.1),rgba(120,53,15,0.05))] px-3 py-1.5 text-left transition hover:border-amber-400/40 hover:bg-[linear-gradient(135deg,rgba(245,158,11,0.16),rgba(120,53,15,0.09))] sm:max-w-lg"
            onClick={() => setMetaTokenWatchPinned((current) => !current)}
          >
            <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-amber-200/90">
              Meta token
            </span>
            <span className="text-sm text-white">
              Expires {formatDubaiMetaTokenShort(META_ACCESS_TOKEN_EXPIRES_AT)}
            </span>
            <ChevronDown
              className={`ml-auto h-4 w-4 shrink-0 text-amber-200/80 transition-transform ${metaTokenWatchExpanded ? "rotate-180" : ""}`}
              aria-hidden
            />
          </button>
          {metaTokenWatchExpanded ? (
            <div className="mt-2 rounded-2xl border border-amber-400/20 bg-[linear-gradient(135deg,rgba(245,158,11,0.14),rgba(120,53,15,0.08))] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-amber-200">Meta token watch</p>
                  <p className="mt-2 text-sm font-semibold text-white">
                    Current validated long-lived Meta Page token expires on{" "}
                    {formatDubaiTimestamp(META_ACCESS_TOKEN_EXPIRES_AT)}.
                  </p>
                  <p className="mt-2 text-sm text-slate-300">
                    If you rotate the token earlier, update this banner and{" "}
                    <code className="text-white">docs/meta-token-lifecycle-and-alerts.md</code> so the team
                    can see the next expiry at a glance.
                  </p>
                </div>
                <Badge variant="outline" className="w-fit border-amber-300/30 bg-black/20 text-amber-100">
                  Expires {formatDubaiTimestamp(META_ACCESS_TOKEN_EXPIRES_AT)}
                </Badge>
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">CRM inbox</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Unified lead management</h2>
            <p className="mt-2 max-w-3xl text-sm text-slate-400">
              Website leads are already landing here. Source filters and Meta-origin detection are in
              place so this same desk can become the home for future Meta, TikTok, and imported leads
              instead of another spreadsheet.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Dialog open={isManualLeadDialogOpen} onOpenChange={setIsManualLeadDialogOpen}>
              <DialogTrigger asChild>
                <Button type="button" className="bg-primary text-black hover:bg-primary/90">
                  Add lead
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl border-white/10 bg-[#111111] text-white">
                <DialogHeader>
                  <DialogTitle>Walk-in or organic intake</DialogTitle>
                  <DialogDescription className="text-slate-400">
                    Use this when a lead comes in by phone, WhatsApp, walk-in, referral, or anything
                    that did not originate from the website form.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    value={manualLeadDraft.fullName}
                    onChange={(event) =>
                      setManualLeadDraft((current) => ({ ...current, fullName: event.target.value }))
                    }
                    placeholder="Full name"
                    className="border-white/10 bg-black/20 text-white placeholder:text-slate-500"
                  />
                  <Input
                    value={manualLeadDraft.phone}
                    onChange={(event) =>
                      setManualLeadDraft((current) => ({ ...current, phone: event.target.value }))
                    }
                    placeholder="Phone"
                    className="border-white/10 bg-black/20 text-white placeholder:text-slate-500"
                  />
                  <Input
                    value={manualLeadDraft.email}
                    onChange={(event) =>
                      setManualLeadDraft((current) => ({ ...current, email: event.target.value }))
                    }
                    placeholder="Email"
                    className="border-white/10 bg-black/20 text-white placeholder:text-slate-500"
                  />
                  <Input
                    value={manualLeadDraft.sourcePlatform}
                    onChange={(event) =>
                      setManualLeadDraft((current) => ({ ...current, sourcePlatform: event.target.value }))
                    }
                    placeholder="walk_in, organic_call, referral..."
                    className="border-white/10 bg-black/20 text-white placeholder:text-slate-500"
                  />
                  <Input
                    value={manualLeadDraft.vehicleMake}
                    onChange={(event) =>
                      setManualLeadDraft((current) => ({ ...current, vehicleMake: event.target.value }))
                    }
                    placeholder="Vehicle make"
                    className="border-white/10 bg-black/20 text-white placeholder:text-slate-500"
                  />
                  <Input
                    value={manualLeadDraft.vehicleModel}
                    onChange={(event) =>
                      setManualLeadDraft((current) => ({ ...current, vehicleModel: event.target.value }))
                    }
                    placeholder="Vehicle model"
                    className="border-white/10 bg-black/20 text-white placeholder:text-slate-500"
                  />
                  <Input
                    value={manualLeadDraft.vehicleYear}
                    onChange={(event) =>
                      setManualLeadDraft((current) => ({ ...current, vehicleYear: event.target.value }))
                    }
                    placeholder="Vehicle year"
                    className="border-white/10 bg-black/20 text-white placeholder:text-slate-500"
                  />
                  <Select
                    value={manualLeadDraft.leadSourceType}
                    onValueChange={(value) =>
                      setManualLeadDraft((current) => ({
                        ...current,
                        leadSourceType: value as ManualLeadDraft["leadSourceType"],
                      }))
                    }
                  >
                    <SelectTrigger className="border-white/10 bg-black/20 text-white">
                      <SelectValue placeholder="Lead type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual intake</SelectItem>
                      <SelectItem value="google_sheet_import">Google Sheet import</SelectItem>
                      <SelectItem value="api_import">API import</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={manualLeadDraft.assignedTo}
                    onValueChange={(value) =>
                      setManualLeadDraft((current) => ({ ...current, assignedTo: value }))
                    }
                  >
                    <SelectTrigger className="border-white/10 bg-black/20 text-white">
                      <SelectValue placeholder="Assign to" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {adminUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.full_name || user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={manualLeadDraft.followupChannel}
                    onValueChange={(value) =>
                      setManualLeadDraft((current) => ({
                        ...current,
                        followupChannel: value as FollowupChannel,
                      }))
                    }
                  >
                    <SelectTrigger className="border-white/10 bg-black/20 text-white">
                      <SelectValue placeholder="Follow-up channel" />
                    </SelectTrigger>
                    <SelectContent>
                      {followupChannelOptions.map((channel) => (
                        <SelectItem key={channel} value={channel}>
                          {formatTokenLabel(channel)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="sm:col-span-2">
                    <Input
                      type="datetime-local"
                      value={manualLeadDraft.followupDueAt}
                      onChange={(event) =>
                        setManualLeadDraft((current) => ({ ...current, followupDueAt: event.target.value }))
                      }
                      className="border-white/10 bg-black/20 text-white"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Textarea
                      value={manualLeadDraft.notes}
                      onChange={(event) =>
                        setManualLeadDraft((current) => ({ ...current, notes: event.target.value }))
                      }
                      placeholder="Call notes, walk-in summary, requested package, objections..."
                      className="border-white/10 bg-black/20 text-white placeholder:text-slate-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-slate-500">
                    Creating the lead here also lets you attach the first note and optional follow-up in one move.
                  </p>
                  <Button
                    type="button"
                    onClick={() => void handleCreateManualLead()}
                    disabled={Boolean(savingKeys["manual-lead"])}
                  >
                    Create lead
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              type="button"
              variant="outline"
              className="border-white/10 bg-black/20 text-white hover:bg-white/10"
              onClick={() => void loadLeadDesk({ refresh: true })}
              disabled={isLoading || isRefreshing}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search lead, phone, vehicle, campaign"
            className="border-white/10 bg-black/20 text-white placeholder:text-slate-500 xl:col-span-2"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="border-white/10 bg-black/20 text-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {leadStatusOptions.map((status) => (
                <SelectItem key={status} value={status}>
                  {formatTokenLabel(status)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={qualityFilter} onValueChange={setQualityFilter}>
            <SelectTrigger className="border-white/10 bg-black/20 text-white">
              <SelectValue placeholder="Quality" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All quality labels</SelectItem>
              {leadQualityOptions.map((quality) => (
                <SelectItem key={quality} value={quality}>
                  {formatTokenLabel(quality)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="border-white/10 bg-black/20 text-white">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sources</SelectItem>
              <SelectItem value="website">Website</SelectItem>
              <SelectItem value="meta">Meta</SelectItem>
              <SelectItem value="google">Google</SelectItem>
              <SelectItem value="tiktok">TikTok</SelectItem>
              <SelectItem value="manual">Manual</SelectItem>
            </SelectContent>
          </Select>
          <Select value={progressFilter} onValueChange={setProgressFilter}>
            <SelectTrigger className="border-white/10 bg-black/20 text-white">
              <SelectValue placeholder="Submission" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All progress</SelectItem>
              <SelectItem value="submitted">Submitted leads</SelectItem>
              <SelectItem value="partial">Partial captures</SelectItem>
            </SelectContent>
          </Select>
          <Select value={followupFilter} onValueChange={setFollowupFilter}>
            <SelectTrigger className="border-white/10 bg-black/20 text-white">
              <SelectValue placeholder="Follow-up" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All follow-up states</SelectItem>
              <SelectItem value="needs_attention">Needs attention</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="due_today">Due today</SelectItem>
              <SelectItem value="none">No follow-up</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-400">
          <span>
            Showing {filteredLeads.length} of {leadsWithIntent.length} recent leads.
          </span>
          <Badge variant="outline" className="border-white/10 bg-black/20 text-slate-300">
            Partial capture preserved
          </Badge>
          <Badge variant="outline" className="border-white/10 bg-black/20 text-slate-300">
            Meta feedback stays queued, not sent from browser
          </Badge>
        </div>

        <div className="mt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>CRM</TableHead>
                <TableHead>Response</TableHead>
                <TableHead>Follow-up</TableHead>
                <TableHead>Intent</TableHead>
                <TableHead>Estimate</TableHead>
                <TableHead>Last activity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-slate-400">
                    Loading leads...
                  </TableCell>
                </TableRow>
              ) : filteredLeads.length ? (
                filteredLeads.map((lead) => {
                  const vehicle = getLeadVehicleText(lead);
                  const requestedProtection =
                    readImportMetadataValue(lead.import_metadata, "protection_level") ||
                    null;
                  const deliveryStatus =
                    readImportMetadataValue(lead.import_metadata, "delivery_status") ||
                    null;
                  const whatsappUrl = buildWhatsAppUrl(lead.phone);
                  const latestNote = lead.notes[0] ?? null;
                  const isExpanded = expandedLeadId === lead.id;
                  const leadDetailsDraft = leadDetailsDrafts[lead.id] ?? makeLeadDetailsDraft(lead);
                  const leadScheduleDraft = leadScheduleDrafts[lead.id] ?? makeLeadScheduleDraft(lead);
                  const pendingMetaFeedback = lead.feedback.filter(
                    (entry) => entry.platform === "meta" && entry.feedback_status === "pending",
                  );
                  const savingStatus = Boolean(savingKeys[`status:${lead.id}`]);
                  const savingQuality = Boolean(savingKeys[`quality:${lead.id}`]);
                  const savingAssign = Boolean(savingKeys[`assign:${lead.id}`]);
                  const savingWhatsapp = Boolean(savingKeys[`whatsapp:${lead.id}`]);
                  const savingCall = Boolean(savingKeys[`call:${lead.id}`]);
                  const savingDelete = Boolean(savingKeys[`delete:${lead.id}`]);
                  const whatsappSla = getResponseSlaState(lead, "whatsapp");
                  const callSla = getResponseSlaState(lead, "call");
                  const rowAccentClass = getLeadRowAccentClass(lead);
                  const followupLabel =
                    lead.followupState === "overdue"
                      ? "Overdue"
                      : lead.followupState === "due_today"
                        ? "Due today"
                        : lead.followupState === "open"
                          ? "Open"
                          : lead.followupState === "done"
                            ? "Done"
                            : "None";

                  return (
                    <Fragment key={lead.id}>
                      <TableRow
                        id={`lead-row-${lead.id}`}
                        className={`cursor-pointer transition-colors ${rowAccentClass}`}
                        onClick={() => setExpandedLeadId(isExpanded ? null : lead.id)}
                      >
                        <TableCell className={rowAccentClass}>
                          <div className="space-y-1">
                            <p className="font-medium text-white">{lead.full_name || "Unnamed lead"}</p>
                            {whatsappUrl && lead.phone ? (
                              <a
                                href={whatsappUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-block text-sm text-emerald-300 transition hover:text-emerald-200 hover:underline"
                                onClick={(event) => event.stopPropagation()}
                              >
                                {lead.phone}
                              </a>
                            ) : (
                              <p className="text-sm text-slate-400">{lead.phone || "No phone captured"}</p>
                            )}
                            <p className="text-xs text-slate-500">{vehicle || "No vehicle yet"}</p>
                          </div>
                        </TableCell>
                        <TableCell className={rowAccentClass}>
                          <div className="space-y-2">
                            <Badge variant="outline" className={getSourceBadgeClass(lead.sourceGroup)}>
                              {formatTokenLabel(lead.sourceGroup)}
                            </Badge>
                            <p className="text-xs text-slate-400">
                              {lead.landing_page_variant || lead.source_platform || "default"}
                            </p>
                            <p className="text-xs text-slate-500">
                              {lead.lifecycleLabel === "submitted" ? "Submitted lead" : "Partial capture"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className={rowAccentClass}>
                          <div className="space-y-2">
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="outline" className={getStatusBadgeClass(lead.status)}>
                                {formatTokenLabel(lead.status)}
                              </Badge>
                              <Badge variant="outline" className={getQualityBadgeClass(lead.quality_label)}>
                                {formatTokenLabel(lead.quality_label)}
                              </Badge>
                            </div>
                            <p className="text-xs text-slate-400">
                              {lead.assignedAdmin
                                ? `Owner: ${lead.assignedAdmin.full_name || lead.assignedAdmin.email}`
                                : "Unassigned"}
                            </p>
                            {pendingMetaFeedback.length ? (
                              <p className="text-xs text-amber-200">
                                {pendingMetaFeedback.length} Meta feedback item
                                {pendingMetaFeedback.length === 1 ? "" : "s"} queued
                              </p>
                            ) : null}
                            {savingStatus || savingQuality || savingAssign || savingWhatsapp || savingCall ? (
                              <p className="text-xs text-slate-500">Saving CRM changes...</p>
                            ) : null}
                            {savingDelete ? (
                              <p className="text-xs text-slate-500">Deleting lead...</p>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className={rowAccentClass}>
                          <div className="space-y-2">
                            <Badge variant="outline" className={whatsappSla.badgeClass}>
                              WA {whatsappSla.elapsedLabel}
                            </Badge>
                            <Badge variant="outline" className={callSla.badgeClass}>
                              Call {callSla.elapsedLabel}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className={rowAccentClass}>
                          <div className="space-y-2">
                            <Badge variant="outline" className={getFollowupBadgeClass(lead.followupState)}>
                              {followupLabel}
                            </Badge>
                            <p className="text-xs text-slate-400">{formatDueLabel(lead.nextOpenFollowup)}</p>
                          </div>
                        </TableCell>
                        <TableCell className={rowAccentClass}>{lead.displayIntentScore}/100</TableCell>
                        <TableCell className={rowAccentClass}>{formatCurrency(lead.latest_quote_estimate)}</TableCell>
                        <TableCell className={rowAccentClass}>
                          <div className="flex items-center justify-between gap-3">
                            <span>{formatTimestamp(lead.last_activity_at || lead.submitted_at)}</span>
                            {lead.status === "won" ? (
                              <div className="rotate-[-6deg] rounded-2xl border border-emerald-300/30 bg-[linear-gradient(135deg,rgba(16,185,129,0.28),rgba(16,185,129,0.08))] px-3 py-1 text-right shadow-[0_0_30px_rgba(16,185,129,0.16)]">
                                <p className="text-[10px] uppercase tracking-[0.35em] text-emerald-100/80">
                                  Closed
                                </p>
                                <p className="text-lg font-black leading-none text-emerald-200">WON</p>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-500">{isExpanded ? "Expanded" : "Tap row"}</span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>

                      {isExpanded ? (
                        <TableRow>
                          <TableCell colSpan={8} className="bg-black/15">
                            <div className="py-2">
                              <Tabs defaultValue="overview" className="space-y-4">
                                <TabsList className="border border-white/10 bg-black/20">
                                  <TabsTrigger value="overview">Overview</TabsTrigger>
                                  <TabsTrigger value="actions">Update CRM</TabsTrigger>
                                  <TabsTrigger value="history">Activity</TabsTrigger>
                                </TabsList>

                                <TabsContent value="overview" className="space-y-4">
                                  <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr_1fr]">
                                    <Card className="border-white/10 bg-black/20 p-4">
                                      <p className="text-sm uppercase tracking-[0.18em] text-slate-400">
                                        Sales Snapshot
                                      </p>
                                      <div className="mt-4 flex flex-wrap gap-2">
                                        <Badge variant="outline" className={getStatusBadgeClass(lead.status)}>
                                          {formatTokenLabel(lead.status)}
                                        </Badge>
                                        <Badge variant="outline" className={getQualityBadgeClass(lead.quality_label)}>
                                          {formatTokenLabel(lead.quality_label)}
                                        </Badge>
                                        <Badge
                                          variant="outline"
                                          className={getFollowupBadgeClass(lead.followupState)}
                                        >
                                          {followupLabel}
                                        </Badge>
                                      </div>
                                      <div className="mt-4 grid gap-3 text-sm text-slate-300">
                                        <p>
                                          <span className="text-slate-500">Contact:</span>{" "}
                                          {whatsappUrl && lead.phone ? (
                                            <a
                                              href={whatsappUrl}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="text-emerald-300 transition hover:text-emerald-200 hover:underline"
                                            >
                                              {lead.phone}
                                            </a>
                                          ) : (
                                            <span className="text-white">{lead.phone || "No phone captured"}</span>
                                          )}
                                        </p>
                                        <p>
                                          <span className="text-slate-500">Owner:</span>{" "}
                                          <span className="text-white">
                                            {lead.assignedAdmin?.full_name ||
                                              lead.assignedAdmin?.email ||
                                              "Unassigned"}
                                          </span>
                                        </p>
                                        <p>
                                          <span className="text-slate-500">Next follow-up:</span>{" "}
                                          <span className="text-white">{formatDueLabel(lead.nextOpenFollowup)}</span>
                                        </p>
                                        <p>
                                          <span className="text-slate-500">Intent score:</span>{" "}
                                          <span className="text-white">{lead.displayIntentScore}/100</span>
                                        </p>
                                        <p>
                                          <span className="text-slate-500">Estimate:</span>{" "}
                                          <span className="text-white">{formatCurrency(lead.latest_quote_estimate)}</span>
                                        </p>
                                        <p>
                                          <span className="text-slate-500">Last activity:</span>{" "}
                                          <span className="text-white">
                                            {formatTimestamp(lead.last_activity_at || lead.submitted_at)}
                                          </span>
                                        </p>
                                        <p>
                                          <span className="text-slate-500">WhatsApp response:</span>{" "}
                                          <span className={whatsappSla.done ? "text-white" : "text-slate-300"}>
                                            {whatsappSla.elapsedLabel}
                                          </span>
                                        </p>
                                        <p>
                                          <span className="text-slate-500">Call response:</span>{" "}
                                          <span className={callSla.done ? "text-white" : "text-slate-300"}>
                                            {callSla.elapsedLabel}
                                          </span>
                                        </p>
                                      </div>
                                      {pendingMetaFeedback.length ? (
                                        <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-3">
                                          <p className="text-xs uppercase tracking-[0.16em] text-amber-200">
                                            Meta feedback pending
                                          </p>
                                          <div className="mt-2 flex flex-wrap gap-2">
                                            {pendingMetaFeedback.map((entry) => (
                                              <Badge
                                                key={entry.id}
                                                variant="outline"
                                                className={getFeedbackBadgeClass(entry.feedback_status)}
                                              >
                                                {formatTokenLabel(entry.feedback_type)}
                                              </Badge>
                                            ))}
                                          </div>
                                        </div>
                                      ) : null}
                                    </Card>

                                    <Card className="border-white/10 bg-black/20 p-4">
                                      <p className="text-sm uppercase tracking-[0.18em] text-slate-400">
                                        What They Want
                                      </p>
                                      <div className="mt-4 flex flex-wrap gap-2">
                                        {lead.latestRollup?.package_name ? (
                                          <Badge variant="outline" className="border-primary/20 bg-primary/10 text-primary">
                                            {lead.latestRollup.package_name}
                                          </Badge>
                                        ) : null}
                                        {requestedProtection ? (
                                          <Badge variant="outline" className="border-amber-400/20 bg-amber-500/10 text-amber-200">
                                            Package: {formatMetaLeadChoice(requestedProtection)}
                                          </Badge>
                                        ) : null}
                                        {deliveryStatus ? (
                                          <Badge variant="outline" className="border-sky-400/20 bg-sky-500/10 text-sky-200">
                                            Timing: {formatMetaLeadChoice(deliveryStatus)}
                                          </Badge>
                                        ) : null}
                                        {lead.latestRollup?.vehicle_size ? (
                                          <Badge variant="outline" className="border-white/10 bg-white/5 text-slate-200">
                                            Size: {lead.latestRollup.vehicle_size}
                                          </Badge>
                                        ) : null}
                                        {lead.latestRollup?.finish ? (
                                          <Badge variant="outline" className="border-white/10 bg-white/5 text-slate-200">
                                            Finish: {lead.latestRollup.finish}
                                          </Badge>
                                        ) : null}
                                        {lead.latestRollup?.coverage ? (
                                          <Badge variant="outline" className="border-white/10 bg-white/5 text-slate-200">
                                            Coverage: {lead.latestRollup.coverage}
                                          </Badge>
                                        ) : null}
                                        <Badge variant="outline" className="border-emerald-400/20 bg-emerald-500/10 text-emerald-200">
                                          {formatCurrency(
                                            lead.latestRollup?.quote_estimate ?? lead.latest_quote_estimate,
                                          )}
                                        </Badge>
                                      </div>
                                      <div className="mt-4 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
                                        <p>
                                          <span className="text-slate-500">Vehicle:</span>{" "}
                                          <span className="text-white">{vehicle || "Not captured yet"}</span>
                                        </p>
                                        <p>
                                          <span className="text-slate-500">Matching sessions:</span>{" "}
                                          <span className="text-white">{lead.matchingSessions}</span>
                                        </p>
                                        <p>
                                          <span className="text-slate-500">Lead state:</span>{" "}
                                          <span className="text-white">
                                            {lead.lifecycleLabel === "submitted"
                                              ? "Submitted"
                                              : "Partial capture kept alive"}
                                          </span>
                                        </p>
                                        <p>
                                          <span className="text-slate-500">Protection:</span>{" "}
                                          <span className="text-white">
                                            {requestedProtection ? formatMetaLeadChoice(requestedProtection) : "Not captured"}
                                          </span>
                                        </p>
                                        <p>
                                          <span className="text-slate-500">Timing:</span>{" "}
                                          <span className="text-white">
                                            {deliveryStatus ? formatMetaLeadChoice(deliveryStatus) : "Not captured"}
                                          </span>
                                        </p>
                                        <p>
                                          <span className="text-slate-500">Expected delivery:</span>{" "}
                                          <span className="text-white">
                                            {lead.expected_delivery_at
                                              ? formatTimestamp(lead.expected_delivery_at)
                                              : "Not scheduled"}
                                          </span>
                                        </p>
                                        <p>
                                          <span className="text-slate-500">WhatsApp:</span>{" "}
                                          <span className="text-white">
                                            {lead.whatsapp_clicked_at ? "Clicked" : "No click recorded"}
                                          </span>
                                        </p>
                                      </div>
                                    </Card>

                                    <Card className="border-white/10 bg-black/20 p-4">
                                      <p className="text-sm uppercase tracking-[0.18em] text-slate-400">
                                        Source & Feedback Readiness
                                      </p>
                                      <div className="mt-4 flex flex-wrap gap-2">
                                        <Badge variant="outline" className={getSourceBadgeClass(lead.sourceGroup)}>
                                          {formatTokenLabel(lead.sourceGroup)}
                                        </Badge>
                                        <Badge variant="outline" className="border-white/10 bg-white/5 text-slate-200">
                                          {formatTokenLabel(lead.lead_source_type)}
                                        </Badge>
                                        {lead.isMetaOriginated ? (
                                          <Badge variant="outline" className="border-sky-400/20 bg-sky-500/10 text-sky-200">
                                            Meta-originated
                                          </Badge>
                                        ) : null}
                                      </div>
                                      <div className="mt-4 space-y-2 text-sm text-slate-300">
                                        <p>
                                          <span className="text-slate-500">Source platform:</span>{" "}
                                          <span className="text-white">{lead.source_platform || "direct / website"}</span>
                                        </p>
                                        <p>
                                          <span className="text-slate-500">Variant:</span>{" "}
                                          <span className="text-white">{lead.landing_page_variant || "default"}</span>
                                        </p>
                                        <p>
                                          <span className="text-slate-500">Campaign:</span>{" "}
                                          <span className="text-white">
                                            {getLeadCampaignLabel(lead) || "Not captured"}
                                          </span>
                                        </p>
                                        <p>
                                          <span className="text-slate-500">UTM source:</span>{" "}
                                          <span className="text-white">{lead.utm_source || "Not captured"}</span>
                                        </p>
                                        <p>
                                          <span className="text-slate-500">fbclid:</span>{" "}
                                          <span className="text-white">{lead.fbclid || "Not captured"}</span>
                                        </p>
                                      </div>
                                      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3">
                                        <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                                          Meta feedback queue
                                        </p>
                                        {lead.feedback.length ? (
                                          <div className="mt-3 space-y-3">
                                            <div className="flex flex-wrap gap-2">
                                              {lead.feedback
                                                .filter((entry) => entry.platform === "meta")
                                                .slice(0, 4)
                                                .map((entry) => (
                                                  <Badge
                                                    key={entry.id}
                                                    variant="outline"
                                                    className={getFeedbackBadgeClass(entry.feedback_status)}
                                                  >
                                                    {formatTokenLabel(entry.feedback_type)}:{" "}
                                                    {formatTokenLabel(entry.feedback_status)}
                                                  </Badge>
                                                ))}
                                            </div>
                                            {lead.feedback
                                              .filter(
                                                (entry) =>
                                                  entry.platform === "meta" &&
                                                  entry.feedback_status === "failed" &&
                                                  readMetaFeedbackError(entry.response_payload),
                                              )
                                              .slice(0, 1)
                                              .map((entry) => (
                                                <p key={`${entry.id}-error`} className="text-xs text-rose-200">
                                                  Meta error: {readMetaFeedbackError(entry.response_payload)}
                                                </p>
                                              ))}
                                          </div>
                                        ) : (
                                          <p className="mt-2 text-sm text-slate-300">
                                            No Meta feedback row yet. Qualifying, losing, junking, or winning a
                                            Meta lead will queue the recommended feedback state here.
                                          </p>
                                        )}
                                      </div>
                                    </Card>
                                  </div>

                                  <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
                                    <Card className="border-white/10 bg-black/20 p-4">
                                      <div className="flex items-center justify-between gap-3">
                                        <p className="text-sm uppercase tracking-[0.18em] text-slate-400">
                                          Latest Internal Note
                                        </p>
                                        {latestNote ? (
                                          <p className="text-xs text-slate-500">
                                            {formatTimestamp(latestNote.created_at)}
                                          </p>
                                        ) : null}
                                      </div>
                                      {latestNote ? (
                                        <>
                                          <p className="mt-4 text-sm leading-6 text-white">{latestNote.body}</p>
                                          <p className="mt-4 text-xs text-slate-500">
                                            {adminUsersById.get(latestNote.author_admin_user_id)?.full_name ||
                                              adminUsersById.get(latestNote.author_admin_user_id)?.email ||
                                              "Admin"}
                                          </p>
                                        </>
                                      ) : lead.notes_summary ? (
                                        <>
                                          <p className="mt-4 text-sm leading-6 text-white">{lead.notes_summary}</p>
                                          <p className="mt-4 text-xs text-slate-500">
                                            Lead summary saved on the record
                                          </p>
                                        </>
                                      ) : (
                                        <p className="mt-4 text-sm text-slate-400">
                                          No internal note saved yet. Add one from Update CRM to keep the next sales step obvious.
                                        </p>
                                      )}
                                    </Card>

                                    <Card className="border-white/10 bg-black/20 p-4">
                                      <p className="text-sm uppercase tracking-[0.18em] text-slate-400">
                                        Engagement Snapshot
                                      </p>
                                      <div className="mt-4 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
                                        <p>
                                          <span className="text-slate-500">Time on page:</span>{" "}
                                          <span className="text-white">
                                            {formatDurationMs(lead.latestRollup?.duration_ms ?? null)}
                                          </span>
                                        </p>
                                        <p>
                                          <span className="text-slate-500">Scroll depth:</span>{" "}
                                          <span className="text-white">
                                            {lead.latestRollup?.max_scroll_percent ?? 0}%
                                          </span>
                                        </p>
                                        <p>
                                          <span className="text-slate-500">Video:</span>{" "}
                                          <span className="text-white">
                                            {lead.latestRollup
                                              ? lead.latestRollup.video_max_progress_percent
                                                ? `${lead.latestRollup.video_max_progress_percent}% watched`
                                                : "No milestone hit yet"
                                              : "No video activity yet"}
                                          </span>
                                        </p>
                                        <p>
                                          <span className="text-slate-500">Sections viewed:</span>{" "}
                                          <span className="text-white">
                                            {lead.latestRollup?.sections_viewed?.length
                                              ? lead.latestRollup.sections_viewed.map(formatSectionName).join(", ")
                                              : "No tracked sections yet"}
                                          </span>
                                        </p>
                                      </div>
                                    </Card>
                                  </div>

                                  <Card className="border-white/10 bg-black/20 p-4">
                                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                      <div>
                                        <p className="text-sm uppercase tracking-[0.18em] text-slate-400">
                                          Customer details
                                        </p>
                                        <p className="mt-2 text-sm text-slate-300">
                                          Edit the customer identity and vehicle information directly from the CRM.
                                        </p>
                                      </div>
                                      <div className="flex flex-wrap gap-2">
                                        <Button
                                          type="button"
                                          variant="outline"
                                          className="border-white/10 bg-black/20 text-white hover:bg-white/10"
                                          onClick={() =>
                                            setLeadDetailsDrafts((current) => {
                                              const next = { ...current };
                                              delete next[lead.id];
                                              return next;
                                            })
                                          }
                                        >
                                          Reset
                                        </Button>
                                        <Button
                                          type="button"
                                          onClick={() => void handleLeadDetailsSave(lead)}
                                          disabled={Boolean(savingKeys[`details:${lead.id}`])}
                                        >
                                          Save customer details
                                        </Button>
                                      </div>
                                    </div>

                                    <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                      <div className="space-y-2">
                                        <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Full name</p>
                                        <Input
                                          value={leadDetailsDraft.fullName}
                                          onChange={(event) =>
                                            updateLeadDetailsDraft(lead, { fullName: event.target.value })
                                          }
                                          placeholder="Customer name"
                                          className="border-white/10 bg-black/20 text-white placeholder:text-slate-500"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Phone</p>
                                        <Input
                                          value={leadDetailsDraft.phone}
                                          onChange={(event) =>
                                            updateLeadDetailsDraft(lead, { phone: event.target.value })
                                          }
                                          placeholder="+971..."
                                          className="border-white/10 bg-black/20 text-white placeholder:text-slate-500"
                                        />
                                      </div>
                                      <div className="space-y-2 sm:col-span-2">
                                        <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Email</p>
                                        <Input
                                          value={leadDetailsDraft.email}
                                          onChange={(event) =>
                                            updateLeadDetailsDraft(lead, { email: event.target.value })
                                          }
                                          placeholder="name@example.com"
                                          className="border-white/10 bg-black/20 text-white placeholder:text-slate-500"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Vehicle make</p>
                                        <Input
                                          value={leadDetailsDraft.vehicleMake}
                                          onChange={(event) =>
                                            updateLeadDetailsDraft(lead, { vehicleMake: event.target.value })
                                          }
                                          placeholder="Mercedes"
                                          className="border-white/10 bg-black/20 text-white placeholder:text-slate-500"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Vehicle model</p>
                                        <Input
                                          value={leadDetailsDraft.vehicleModel}
                                          onChange={(event) =>
                                            updateLeadDetailsDraft(lead, { vehicleModel: event.target.value })
                                          }
                                          placeholder="G700"
                                          className="border-white/10 bg-black/20 text-white placeholder:text-slate-500"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Vehicle year</p>
                                        <Input
                                          value={leadDetailsDraft.vehicleYear}
                                          onChange={(event) =>
                                            updateLeadDetailsDraft(lead, { vehicleYear: event.target.value })
                                          }
                                          placeholder="2026"
                                          className="border-white/10 bg-black/20 text-white placeholder:text-slate-500"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Vehicle label</p>
                                        <Input
                                          value={leadDetailsDraft.vehicleLabel}
                                          onChange={(event) =>
                                            updateLeadDetailsDraft(lead, { vehicleLabel: event.target.value })
                                          }
                                          placeholder="2026 Mercedes G700"
                                          className="border-white/10 bg-black/20 text-white placeholder:text-slate-500"
                                        />
                                      </div>
                                    </div>
                                  </Card>
                                </TabsContent>

                                <TabsContent value="actions" className="space-y-4">
                                  <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
                                    <Card className="border-white/10 bg-black/20 p-4">
                                      <p className="text-sm uppercase tracking-[0.18em] text-slate-400">
                                        Sales Workflow
                                      </p>
                                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                        <div>
                                          <p className="mb-2 text-xs uppercase tracking-[0.16em] text-slate-500">
                                            Status
                                          </p>
                                          <Select
                                            value={lead.status}
                                            onValueChange={(value) =>
                                              void handleStatusChange(lead, value as LeadStatus)
                                            }
                                          >
                                            <SelectTrigger className="border-white/10 bg-black/20 text-white">
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {leadStatusOptions.map((status) => (
                                                <SelectItem key={status} value={status}>
                                                  {formatTokenLabel(status)}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>

                                        <div>
                                          <p className="mb-2 text-xs uppercase tracking-[0.16em] text-slate-500">
                                            Quality
                                          </p>
                                          <Select
                                            value={lead.quality_label}
                                            onValueChange={(value) =>
                                              void handleQualityChange(lead, value as LeadQuality)
                                            }
                                          >
                                            <SelectTrigger className="border-white/10 bg-black/20 text-white">
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {leadQualityOptions.map((quality) => (
                                                <SelectItem key={quality} value={quality}>
                                                  {formatTokenLabel(quality)}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>

                                        <div className="sm:col-span-2">
                                          <p className="mb-2 text-xs uppercase tracking-[0.16em] text-slate-500">
                                            Owner / Assignee
                                          </p>
                                          <Select
                                            value={lead.assigned_to || "unassigned"}
                                            onValueChange={(value) => void handleLeadAssignment(lead, value)}
                                          >
                                            <SelectTrigger className="border-white/10 bg-black/20 text-white">
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="unassigned">Unassigned</SelectItem>
                                              {adminUsers.map((user) => (
                                                <SelectItem key={user.id} value={user.id}>
                                                  {user.full_name || user.email}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>

                                        <div className="sm:col-span-2">
                                          <p className="mb-2 text-xs uppercase tracking-[0.16em] text-slate-500">
                                            Quoted amount (AED)
                                          </p>
                                          <div className="flex flex-col gap-3 sm:flex-row">
                                            <Input
                                              inputMode="decimal"
                                              value={
                                                estimateDrafts[lead.id] ??
                                                (lead.latest_quote_estimate !== null
                                                  ? String(Math.round(lead.latest_quote_estimate))
                                                  : "")
                                              }
                                              onChange={(event) =>
                                                setEstimateDrafts((current) => ({
                                                  ...current,
                                                  [lead.id]: event.target.value,
                                                }))
                                              }
                                              placeholder="12600"
                                              className="border-white/10 bg-black/20 text-white placeholder:text-slate-500"
                                            />
                                            <Button
                                              type="button"
                                              variant="outline"
                                              className="border-white/10 bg-black/20 text-white hover:bg-white/10"
                                              onClick={() => void handleEstimateSave(lead)}
                                              disabled={Boolean(savingKeys[`estimate:${lead.id}`])}
                                            >
                                              Save amount
                                            </Button>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
                                        <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                                          First-response tracking
                                        </p>
                                        <div className="mt-4 space-y-4">
                                          <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-3">
                                            <Checkbox
                                              checked={Boolean(lead.first_whatsapp_contacted_at)}
                                              disabled={
                                                Boolean(lead.first_whatsapp_contacted_at) ||
                                                Boolean(savingKeys[`whatsapp:${lead.id}`])
                                              }
                                              onCheckedChange={(checked) => {
                                                if (checked && !lead.first_whatsapp_contacted_at) {
                                                  void handleLogOutreach(lead, "whatsapp");
                                                }
                                              }}
                                              className="mt-0.5"
                                            />
                                            <div className="min-w-0">
                                              <p className="text-sm font-medium text-white">WhatsApp sent</p>
                                              <p className="mt-1 text-sm text-slate-400">
                                                Target: within 30 minutes during business hours.
                                              </p>
                                              <div className="mt-2 flex flex-wrap gap-2">
                                                <Badge variant="outline" className={whatsappSla.badgeClass}>
                                                  {whatsappSla.elapsedLabel}
                                                </Badge>
                                                <Badge
                                                  variant="outline"
                                                  className="border-white/10 bg-white/5 text-slate-300"
                                                >
                                                  {whatsappSla.dueLabel}
                                                </Badge>
                                                {whatsappSla.score !== null ? (
                                                  <Badge
                                                    variant="outline"
                                                    className="border-primary/25 bg-primary/10 text-primary"
                                                  >
                                                    Score {whatsappSla.score}/100
                                                  </Badge>
                                                ) : null}
                                              </div>
                                            </div>
                                          </label>

                                          <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-3">
                                            <Checkbox
                                              checked={Boolean(lead.first_called_at)}
                                              disabled={
                                                Boolean(lead.first_called_at) ||
                                                Boolean(savingKeys[`call:${lead.id}`])
                                              }
                                              onCheckedChange={(checked) => {
                                                if (checked && !lead.first_called_at) {
                                                  void handleLogOutreach(lead, "call");
                                                }
                                              }}
                                              className="mt-0.5"
                                            />
                                            <div className="min-w-0">
                                              <p className="text-sm font-medium text-white">Customer called</p>
                                              <p className="mt-1 text-sm text-slate-400">
                                                Target: within 1 hour during business hours.
                                              </p>
                                              <div className="mt-2 flex flex-wrap gap-2">
                                                <Badge variant="outline" className={callSla.badgeClass}>
                                                  {callSla.elapsedLabel}
                                                </Badge>
                                                <Badge
                                                  variant="outline"
                                                  className="border-white/10 bg-white/5 text-slate-300"
                                                >
                                                  {callSla.dueLabel}
                                                </Badge>
                                                {callSla.score !== null ? (
                                                  <Badge
                                                    variant="outline"
                                                    className="border-primary/25 bg-primary/10 text-primary"
                                                  >
                                                    Score {callSla.score}/100
                                                  </Badge>
                                                ) : null}
                                              </div>
                                            </div>
                                          </label>
                                        </div>
                                      </div>

                                      <div className="mt-5">
                                        <p className="mb-2 text-xs uppercase tracking-[0.16em] text-slate-500">
                                          Quick actions
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                          {lead.status !== "contacted" ? (
                                            <Button
                                              type="button"
                                              size="sm"
                                              variant="outline"
                                              className="border-white/10 bg-black/20 text-white hover:bg-white/10"
                                              onClick={() =>
                                                void handleStatusChange(lead, "contacted", "Marked contacted from lead desk")
                                              }
                                            >
                                              Mark contacted
                                            </Button>
                                          ) : null}
                                          {lead.status !== "qualified" ? (
                                            <Button
                                              type="button"
                                              size="sm"
                                              variant="outline"
                                              className="border-white/10 bg-black/20 text-white hover:bg-white/10"
                                              onClick={() =>
                                                void handleStatusChange(lead, "qualified", "Qualified from lead desk")
                                              }
                                            >
                                              Mark qualified
                                            </Button>
                                          ) : null}
                                          {lead.status !== "quoted" ? (
                                            <Button
                                              type="button"
                                              size="sm"
                                              variant="outline"
                                              className="border-white/10 bg-black/20 text-white hover:bg-white/10"
                                              onClick={() =>
                                                void handleStatusChange(lead, "quoted", "Quote sent or prepared")
                                              }
                                            >
                                              Mark quoted
                                            </Button>
                                          ) : null}
                                          {lead.status !== "won" ? (
                                            <Button
                                              type="button"
                                              size="sm"
                                              variant="outline"
                                              className="border-emerald-400/20 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20"
                                              onClick={() =>
                                                void handleStatusChange(lead, "won", "Won from lead desk")
                                              }
                                            >
                                              Mark won
                                            </Button>
                                          ) : null}
                                          {lead.status !== "lost" ? (
                                            <Button
                                              type="button"
                                              size="sm"
                                              variant="outline"
                                              className="border-rose-400/20 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20"
                                              onClick={() =>
                                                void handleStatusChange(lead, "lost", "Lost from lead desk")
                                              }
                                            >
                                              Mark lost
                                            </Button>
                                          ) : null}
                                          {lead.status !== "junk" ? (
                                            <Button
                                              type="button"
                                              size="sm"
                                              variant="outline"
                                              className="border-slate-400/20 bg-slate-500/10 text-slate-300 hover:bg-slate-500/20"
                                              onClick={() =>
                                                void handleStatusChange(lead, "junk", "Marked junk from lead desk")
                                              }
                                            >
                                              Mark junk
                                            </Button>
                                          ) : null}
                                          <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            className="border-rose-500/30 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20"
                                            onClick={() => setLeadPendingDelete(lead)}
                                            disabled={savingDelete}
                                          >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Delete lead
                                          </Button>
                                        </div>
                                      </div>

                                      <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-slate-300">
                                        <p className="font-medium text-white">Meta feedback rule in this desk</p>
                                        <p className="mt-2">
                                          Meta-originated leads automatically queue a pending feedback row when you
                                          move them into a meaningful sales outcome like `qualified`, `won`, `lost`,
                                          or `junk`, or when you mark quality as high / low / spam.
                                        </p>
                                      </div>
                                    </Card>

                                    <div className="space-y-4">
                                      <Card className="border-white/10 bg-black/20 p-4">
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                          <div>
                                            <p className="text-sm uppercase tracking-[0.18em] text-slate-400">
                                              Delivery Planning
                                            </p>
                                            <p className="mt-2 text-sm text-slate-300">
                                              Save when the customer expects the car so the team can time follow-up properly.
                                            </p>
                                          </div>
                                          {deliveryStatus ? (
                                            <Badge variant="outline" className="border-sky-400/20 bg-sky-500/10 text-sky-200">
                                              Meta timing: {formatMetaLeadChoice(deliveryStatus)}
                                            </Badge>
                                          ) : null}
                                        </div>

                                        <div className="mt-4">
                                          <p className="mb-2 text-xs uppercase tracking-[0.16em] text-slate-500">
                                            Expected delivery
                                          </p>
                                          <Input
                                            type="datetime-local"
                                            value={leadScheduleDraft.expectedDeliveryAt}
                                            onChange={(event) =>
                                              updateLeadScheduleDraft(lead, {
                                                expectedDeliveryAt: event.target.value,
                                              })
                                            }
                                            className="border-white/10 bg-black/20 text-white"
                                          />
                                          <p className="mt-2 text-xs text-slate-500">
                                            Current:{" "}
                                            <span className="text-slate-300">
                                              {lead.expected_delivery_at
                                                ? formatTimestamp(lead.expected_delivery_at)
                                                : "Not scheduled"}
                                            </span>
                                          </p>
                                        </div>

                                        <div className="mt-3 flex items-center justify-between gap-3">
                                          <p className="text-xs text-slate-500">
                                            Keep this updated whenever the customer gives a clearer handover date.
                                          </p>
                                          <div className="flex flex-wrap gap-2">
                                            <Button
                                              type="button"
                                              variant="outline"
                                              className="border-white/10 bg-black/20 text-white hover:bg-white/10"
                                              onClick={() =>
                                                setLeadScheduleDrafts((current) => {
                                                  const next = { ...current };
                                                  delete next[lead.id];
                                                  return next;
                                                })
                                              }
                                            >
                                              Reset
                                            </Button>
                                            <Button
                                              type="button"
                                              onClick={() => void handleExpectedDeliverySave(lead)}
                                              disabled={Boolean(savingKeys[`delivery:${lead.id}`])}
                                            >
                                              Save delivery
                                            </Button>
                                          </div>
                                        </div>
                                      </Card>

                                      <Card className="border-white/10 bg-black/20 p-4">
                                        <p className="text-sm uppercase tracking-[0.18em] text-slate-400">
                                          Add Internal Note
                                        </p>
                                        <Textarea
                                          value={noteDrafts[lead.id] ?? ""}
                                          onChange={(event) =>
                                            setNoteDrafts((current) => ({
                                              ...current,
                                              [lead.id]: event.target.value,
                                            }))
                                          }
                                          placeholder="Call result, objections, vehicle details, budget notes..."
                                          className="mt-4 border-white/10 bg-black/20 text-white placeholder:text-slate-500"
                                        />
                                        <div className="mt-3 flex items-center justify-between gap-3">
                                          <p className="text-xs text-slate-500">
                                            Latest note summary updates the lead row automatically.
                                          </p>
                                          <Button
                                            type="button"
                                            onClick={() => void handleAddNote(lead)}
                                            disabled={Boolean(savingKeys[`note:${lead.id}`])}
                                          >
                                            Save note
                                          </Button>
                                        </div>
                                      </Card>

                                      <Card className="border-white/10 bg-black/20 p-4">
                                        <p className="text-sm uppercase tracking-[0.18em] text-slate-400">
                                          Create Follow-up
                                        </p>
                                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                          <div>
                                            <p className="mb-2 text-xs uppercase tracking-[0.16em] text-slate-500">
                                              Channel
                                            </p>
                                            <Select
                                              value={
                                                (
                                                  followupDrafts[lead.id] ??
                                                  makeDefaultFollowupDraft(lead.assigned_to, adminProfile?.id)
                                                ).channel
                                              }
                                              onValueChange={(value) =>
                                                updateFollowupDraft(
                                                  lead.id,
                                                  { channel: value as FollowupChannel },
                                                  lead.assigned_to,
                                                )
                                              }
                                            >
                                              <SelectTrigger className="border-white/10 bg-black/20 text-white">
                                                <SelectValue />
                                              </SelectTrigger>
                                              <SelectContent>
                                                {followupChannelOptions.map((channel) => (
                                                  <SelectItem key={channel} value={channel}>
                                                    {formatTokenLabel(channel)}
                                                  </SelectItem>
                                                ))}
                                              </SelectContent>
                                            </Select>
                                          </div>

                                          <div>
                                            <p className="mb-2 text-xs uppercase tracking-[0.16em] text-slate-500">
                                              Assign to
                                            </p>
                                            <Select
                                              value={
                                                (
                                                  followupDrafts[lead.id] ??
                                                  makeDefaultFollowupDraft(lead.assigned_to, adminProfile?.id)
                                                ).assignedTo
                                              }
                                              onValueChange={(value) =>
                                                updateFollowupDraft(lead.id, { assignedTo: value }, lead.assigned_to)
                                              }
                                            >
                                              <SelectTrigger className="border-white/10 bg-black/20 text-white">
                                                <SelectValue />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="unassigned">Unassigned</SelectItem>
                                                {adminUsers.map((user) => (
                                                  <SelectItem key={user.id} value={user.id}>
                                                    {user.full_name || user.email}
                                                  </SelectItem>
                                                ))}
                                              </SelectContent>
                                            </Select>
                                          </div>

                                          <div className="sm:col-span-2">
                                            <p className="mb-2 text-xs uppercase tracking-[0.16em] text-slate-500">
                                              Due at
                                            </p>
                                            <Input
                                              type="datetime-local"
                                              value={
                                                (
                                                  followupDrafts[lead.id] ??
                                                  makeDefaultFollowupDraft(lead.assigned_to, adminProfile?.id)
                                                ).dueAt
                                              }
                                              onChange={(event) =>
                                                updateFollowupDraft(lead.id, { dueAt: event.target.value }, lead.assigned_to)
                                              }
                                              className="border-white/10 bg-black/20 text-white"
                                            />
                                          </div>
                                        </div>

                                        <Textarea
                                          value={
                                            (
                                              followupDrafts[lead.id] ??
                                              makeDefaultFollowupDraft(lead.assigned_to, adminProfile?.id)
                                            ).notes
                                          }
                                          onChange={(event) =>
                                            updateFollowupDraft(lead.id, { notes: event.target.value }, lead.assigned_to)
                                          }
                                          placeholder="What should happen on this follow-up?"
                                          className="mt-4 border-white/10 bg-black/20 text-white placeholder:text-slate-500"
                                        />

                                        <div className="mt-3 flex justify-end">
                                          <Button
                                            type="button"
                                            onClick={() => void handleCreateFollowup(lead)}
                                            disabled={Boolean(savingKeys[`followup-create:${lead.id}`])}
                                          >
                                            Create follow-up
                                          </Button>
                                        </div>
                                      </Card>
                                    </div>
                                  </div>

                                  <Card className="border-white/10 bg-black/20 p-4">
                                    <div className="flex items-center justify-between gap-3">
                                      <div>
                                        <p className="text-sm uppercase tracking-[0.18em] text-slate-400">
                                          Open Follow-ups
                                        </p>
                                        <p className="mt-1 text-sm text-slate-500">
                                          Keep the next action obvious so sales is not working from memory.
                                        </p>
                                      </div>
                                      <Badge variant="outline" className={getFollowupBadgeClass(lead.followupState)}>
                                        {formatTokenLabel(lead.followupState)}
                                      </Badge>
                                    </div>

                                    <div className="mt-4 space-y-3">
                                      {lead.followups.length ? (
                                        lead.followups.map((followup) => {
                                          const assignee = followup.assigned_to
                                            ? adminUsersById.get(followup.assigned_to) ?? null
                                            : null;

                                          return (
                                            <div
                                              key={followup.id}
                                              className="rounded-2xl border border-white/10 bg-white/5 p-4"
                                            >
                                              <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                                                <div className="space-y-2 text-sm text-slate-300">
                                                  <div className="flex flex-wrap gap-2">
                                                    <Badge variant="outline" className="border-white/10 bg-black/20 text-slate-200">
                                                      {formatTokenLabel(followup.channel)}
                                                    </Badge>
                                                    <Badge
                                                      variant="outline"
                                                      className={
                                                        followup.status === "done"
                                                          ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
                                                          : followup.status === "cancelled"
                                                            ? "border-slate-400/20 bg-slate-500/10 text-slate-300"
                                                            : "border-primary/25 bg-primary/10 text-primary"
                                                      }
                                                    >
                                                      {formatTokenLabel(followup.status)}
                                                    </Badge>
                                                  </div>
                                                  <p>
                                                    <span className="text-slate-500">Due:</span>{" "}
                                                    <span className="text-white">{formatDueLabel(followup)}</span>
                                                  </p>
                                                  <p>
                                                    <span className="text-slate-500">Assignee:</span>{" "}
                                                    <span className="text-white">
                                                      {assignee?.full_name || assignee?.email || "Unassigned"}
                                                    </span>
                                                  </p>
                                                  <p className="text-white">{followup.notes || "No notes added."}</p>
                                                </div>

                                                <div className="flex flex-wrap gap-2">
                                                  {followup.status !== "done" ? (
                                                    <Button
                                                      type="button"
                                                      size="sm"
                                                      variant="outline"
                                                      className="border-emerald-400/20 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20"
                                                      onClick={() =>
                                                        void handleFollowupStatusChange(lead.id, followup.id, "done")
                                                      }
                                                      disabled={Boolean(savingKeys[`followup-status:${followup.id}`])}
                                                    >
                                                      <CheckCircle2 className="mr-2 h-4 w-4" />
                                                      Done
                                                    </Button>
                                                  ) : null}
                                                  {followup.status === "open" ? (
                                                    <Button
                                                      type="button"
                                                      size="sm"
                                                      variant="outline"
                                                      className="border-white/10 bg-black/20 text-white hover:bg-white/10"
                                                      onClick={() =>
                                                        void handleFollowupStatusChange(
                                                          lead.id,
                                                          followup.id,
                                                          "cancelled",
                                                        )
                                                      }
                                                      disabled={Boolean(savingKeys[`followup-status:${followup.id}`])}
                                                    >
                                                      Cancel
                                                    </Button>
                                                  ) : null}
                                                  {followup.status !== "open" ? (
                                                    <Button
                                                      type="button"
                                                      size="sm"
                                                      variant="outline"
                                                      className="border-white/10 bg-black/20 text-white hover:bg-white/10"
                                                      onClick={() =>
                                                        void handleFollowupStatusChange(lead.id, followup.id, "open")
                                                      }
                                                      disabled={Boolean(savingKeys[`followup-status:${followup.id}`])}
                                                    >
                                                      Reopen
                                                    </Button>
                                                  ) : null}
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        })
                                      ) : (
                                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-400">
                                          No follow-ups yet for this lead.
                                        </div>
                                      )}
                                    </div>
                                  </Card>
                                </TabsContent>

                                <TabsContent value="history" className="space-y-4">
                                  <div className="grid gap-4 xl:grid-cols-[1fr_1fr_0.9fr]">
                                    <Card className="border-white/10 bg-black/20 p-4">
                                      <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Notes Archive</p>
                                      <ScrollArea className="mt-4 h-[320px] pr-4">
                                        <div className="space-y-3">
                                          {lead.notes.length ? (
                                            lead.notes.map((note) => {
                                              const author =
                                                adminUsersById.get(note.author_admin_user_id) ?? null;
                                              return (
                                                <div
                                                  key={note.id}
                                                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                                                >
                                                  <p className="text-sm leading-6 text-white">{note.body}</p>
                                                  <p className="mt-3 text-xs text-slate-500">
                                                    {author?.full_name || author?.email || "Admin"} •{" "}
                                                    {formatTimestamp(note.created_at)}
                                                  </p>
                                                </div>
                                              );
                                            })
                                          ) : (
                                            <p className="text-sm text-slate-400">No notes saved yet.</p>
                                          )}
                                        </div>
                                      </ScrollArea>
                                    </Card>

                                    <Card className="border-white/10 bg-black/20 p-4">
                                      <p className="text-sm uppercase tracking-[0.18em] text-slate-400">
                                        Status & Follow-up Log
                                      </p>
                                      <ScrollArea className="mt-4 h-[320px] pr-4">
                                        <div className="space-y-3">
                                          {lead.statusHistory.length ? (
                                            lead.statusHistory.map((entry) => {
                                              const author = entry.changed_by
                                                ? adminUsersById.get(entry.changed_by) ?? null
                                                : null;
                                              return (
                                                <div
                                                  key={entry.id}
                                                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                                                >
                                                  <div className="flex flex-wrap gap-2">
                                                    {entry.from_status ? (
                                                      <Badge
                                                        variant="outline"
                                                        className="border-white/10 bg-black/20 text-slate-200"
                                                      >
                                                        {formatTokenLabel(entry.from_status)}
                                                      </Badge>
                                                    ) : null}
                                                    <Badge
                                                      variant="outline"
                                                      className={getStatusBadgeClass(entry.to_status)}
                                                    >
                                                      {formatTokenLabel(entry.to_status)}
                                                    </Badge>
                                                  </div>
                                                  {entry.reason ? (
                                                    <p className="mt-3 text-sm text-white">{entry.reason}</p>
                                                  ) : null}
                                                  <p className="mt-3 text-xs text-slate-500">
                                                    {author?.full_name || author?.email || "Admin"} •{" "}
                                                    {formatTimestamp(entry.created_at)}
                                                  </p>
                                                </div>
                                              );
                                            })
                                          ) : (
                                            <p className="text-sm text-slate-400">
                                              No status changes recorded yet.
                                            </p>
                                          )}
                                        </div>
                                      </ScrollArea>
                                    </Card>

                                    <Card className="border-white/10 bg-black/20 p-4">
                                      <p className="text-sm uppercase tracking-[0.18em] text-slate-400">
                                        Platform Feedback
                                      </p>
                                      <ScrollArea className="mt-4 h-[320px] pr-4">
                                        <div className="space-y-3">
                                          {lead.feedback.length ? (
                                            lead.feedback.map((entry) => (
                                              <div
                                                key={entry.id}
                                                className="rounded-2xl border border-white/10 bg-white/5 p-4"
                                              >
                                                <div className="flex flex-wrap gap-2">
                                                  <Badge
                                                    variant="outline"
                                                    className="border-white/10 bg-black/20 text-slate-200"
                                                  >
                                                    {formatTokenLabel(entry.platform)}
                                                  </Badge>
                                                  <Badge
                                                    variant="outline"
                                                    className="border-primary/25 bg-primary/10 text-primary"
                                                  >
                                                    {formatTokenLabel(entry.feedback_type)}
                                                  </Badge>
                                                  <Badge
                                                    variant="outline"
                                                    className={getFeedbackBadgeClass(entry.feedback_status)}
                                                  >
                                                    {formatTokenLabel(entry.feedback_status)}
                                                  </Badge>
                                                </div>
                                                <p className="mt-3 text-xs text-slate-500">
                                                  Queued {formatTimestamp(entry.created_at)}
                                                </p>
                                                {entry.feedback_status === "failed" &&
                                                readMetaFeedbackError(entry.response_payload) ? (
                                                  <p className="mt-2 text-sm text-rose-200">
                                                    {readMetaFeedbackError(entry.response_payload)}
                                                  </p>
                                                ) : null}
                                                {entry.sent_at ? (
                                                  <p className="mt-1 text-xs text-slate-500">
                                                    Sent {formatTimestamp(entry.sent_at)}
                                                  </p>
                                                ) : null}
                                              </div>
                                            ))
                                          ) : (
                                            <p className="text-sm text-slate-400">
                                              No platform feedback rows yet.
                                            </p>
                                          )}
                                        </div>
                                      </ScrollArea>
                                    </Card>
                                  </div>
                                </TabsContent>
                              </Tabs>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </Fragment>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-slate-400">
                    No leads match the current filters yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <AlertDialog
        open={Boolean(leadPendingDelete)}
        onOpenChange={(open) => {
          if (!open) {
            setLeadPendingDelete(null);
          }
        }}
      >
        <AlertDialogContent className="border-white/10 bg-[#111111] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this lead?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              {leadPendingDelete
                ? `${leadPendingDelete.full_name || leadPendingDelete.phone || "This lead"} will be permanently removed from the CRM. This cannot be restored.`
                : "This lead will be permanently removed from the CRM. This cannot be restored."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 bg-black/20 text-white hover:bg-white/10">
              Keep lead
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 text-white hover:bg-rose-700"
              onClick={(event) => {
                event.preventDefault();
                if (leadPendingDelete) {
                  void handleDeleteLead(leadPendingDelete);
                }
              }}
            >
              Delete permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminShell>
  );
};

export default AdminLeads;
