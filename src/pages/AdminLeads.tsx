import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
// Lead desk uses server-side pagination + whole-table search via admin_search_leads.
import { CheckCircle2, ChevronDown, ChevronUp, RefreshCw, Trash2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";

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
import { AdminLeadExpandedPanel } from "@/components/admin/AdminLeadExpandedPanel";
import { getLeadVehicleText, type LeadTaskLead } from "@/lib/admin-lead-tasks";
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
  owner_color: string;
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
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  externalCampaignName: string;
  gclid: string;
  leadSourceType: "manual" | "api_import" | "google_sheet_import";
  assignedTo: string;
  notes: string;
  followupDueAt: string;
  followupChannel: FollowupChannel;
};

type LeadSourceDraft = {
  sourcePlatform: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  externalCampaignName: string;
  gclid: string;
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
const leadSourcePlatformOptions = [
  { value: "google", label: "Google Ads" },
  { value: "meta", label: "Meta" },
  { value: "tiktok", label: "TikTok" },
  { value: "website", label: "Website" },
  { value: "whatsapp", label: "WhatsApp direct" },
  { value: "phone", label: "Phone call" },
  { value: "walk_in", label: "Walk-in" },
  { value: "referral", label: "Referral" },
  { value: "manual", label: "Manual / other" },
];

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

const compactSelectTriggerClass =
  "h-9 border-white/10 bg-black/20 px-3 text-sm text-white";
const compactInputClass =
  "h-9 border-white/10 bg-black/20 px-3 text-sm text-white placeholder:text-slate-500";
const compactTextareaClass =
  "min-h-[96px] border-white/10 bg-black/20 text-sm text-white placeholder:text-slate-500";
const compactButtonClass =
  "h-9 border-white/10 bg-black/20 px-3 text-sm text-white hover:bg-white/10";

const getLeadIntentPresentation = (lead: DisplayLeadRow) => {
  if (lead.isMetaOriginated && !lead.latestRollup) {
    return {
      tableLabel: "Meta lead",
      tableClass: "border-sky-400/20 bg-sky-500/10 text-sky-200",
      valueLabel: "Meta form only",
      helper:
        "This lead came from Meta directly, so website behaviour scoring is not available yet.",
    };
  }

  return {
    tableLabel: `${lead.displayIntentScore}/100`,
    tableClass: "border-white/10 bg-white/5 text-slate-200",
    valueLabel: `${lead.displayIntentScore}/100`,
    helper: lead.latestRollup
      ? "Based on tracked website behaviour."
      : "Using the current CRM fallback score.",
  };
};

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
  const isCall = channel === "call";
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
      elapsedLabel: withinSla ? `Done ${formatMinutes(elapsedMinutes)}` : `Done late ${formatMinutes(elapsedMinutes)}`,
      dueLabel: withinSla ? "Completed on time" : "Completed after SLA",
      badgeClass: isCall
        ? "border-emerald-400/25 bg-emerald-500/12 text-emerald-100"
        : withinSla
          ? "border-amber-300/25 bg-amber-400/15 text-amber-100"
          : "border-emerald-400/25 bg-emerald-500/12 text-emerald-100",
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
          ? `Within ${formatMinutes(minutesUntilDue)}`
          : "Next window",
    dueLabel: `Due ${formatTimestamp(dueAt.toISOString())}`,
    badgeClass: overdue
      ? "border-rose-400/30 bg-rose-500/16 text-rose-100"
      : isCall
        ? "border-rose-400/30 bg-rose-500/16 text-rose-100"
        : "border-violet-400/25 bg-violet-500/12 text-violet-100",
    score: null,
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

const withAlpha = (hexColor: string, alphaHex: string) => {
  if (!/^#[0-9A-Fa-f]{6}$/.test(hexColor)) return hexColor;
  return `${hexColor}${alphaHex}`;
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

const fetchLeadScopedRows = async <T,>(
  table: string,
  selectClause: string,
  leadIds: string[],
  orderColumn = "created_at",
) => {
  if (!supabase || !leadIds.length) return { data: [] as T[], error: null };

  const pageSize = 1000;
  const rows: T[] = [];

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from(table)
      .select(selectClause)
      .in("lead_id", leadIds)
      .order(orderColumn, { ascending: false })
      .range(from, from + pageSize - 1);

    if (error) return { data: rows, error };
    rows.push(...((data as T[] | null) ?? []));
    if (!data || data.length < pageSize) break;
  }

  return { data: rows, error: null };
};

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
  utmSource: "",
  utmMedium: "",
  utmCampaign: "",
  externalCampaignName: "",
  gclid: "",
  leadSourceType: "manual",
  assignedTo: currentAdminId || "unassigned",
  notes: "",
  followupDueAt: "",
  followupChannel: "call",
});

const makeLeadSourceDraft = (
  lead: Pick<
    LeadRow,
    "source_platform" | "utm_source" | "utm_medium" | "utm_campaign" | "external_campaign_name" | "gclid"
  >,
): LeadSourceDraft => ({
  sourcePlatform: lead.source_platform || "manual",
  utmSource: lead.utm_source || "",
  utmMedium: lead.utm_medium || "",
  utmCampaign: lead.utm_campaign || "",
  externalCampaignName: lead.external_campaign_name || "",
  gclid: lead.gclid || "",
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

const LEAD_PAGE_SIZE_OPTIONS = [25, 50, 100];
const LEAD_PAGE_SIZE_STORAGE_KEY = "adminLeadsPageSize";

const baseLeadSelect =
  "id, primary_session_id, visitor_id, full_name, phone, email, vehicle_make, vehicle_model, vehicle_year, vehicle_label, source_platform, landing_page_variant, funnel_name, lead_source_type, status, quality_label, intent_score, latest_quote_estimate, utm_source, utm_medium, utm_campaign, external_campaign_name, external_adset_name, external_ad_name, utm_content, utm_term, gclid, fbclid, ttclid, notes_summary, import_metadata, expected_delivery_at, assigned_to, first_captured_at, last_activity_at, submitted_at, whatsapp_clicked_at, source_received_at, created_at";

const responseTrackingLeadSelect =
  `${baseLeadSelect}, first_whatsapp_contacted_at, first_whatsapp_contacted_by, first_called_at, first_called_by`;

const AdminLeads = () => {
  const { adminProfile } = useAdminAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

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
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [progressFilter, setProgressFilter] = useState("all");
  const [followupFilter, setFollowupFilter] = useState("all");
  const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [followupDrafts, setFollowupDrafts] = useState<Record<string, FollowupDraft>>({});
  const [estimateDrafts, setEstimateDrafts] = useState<Record<string, string>>({});
  const [leadDetailsDrafts, setLeadDetailsDrafts] = useState<Record<string, LeadDetailsDraft>>({});
  const [leadSourceDrafts, setLeadSourceDrafts] = useState<Record<string, LeadSourceDraft>>({});
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

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<number>(() => {
    const stored = Number(window.localStorage.getItem(LEAD_PAGE_SIZE_STORAGE_KEY));
    return LEAD_PAGE_SIZE_OPTIONS.includes(stored) ? stored : 50;
  });
  const [sortMode, setSortMode] = useState<"received" | "activity">("received");
  const [totalLeadCount, setTotalLeadCount] = useState(0);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [deepLinkLeadId, setDeepLinkLeadId] = useState<string | null>(null);
  const [summaryCounts, setSummaryCounts] = useState({
    newLeads: 0,
    dueFollowups: 0,
    partialLeads: 0,
    pendingMetaFeedback: 0,
    metaLeads: 0,
  });

  const leadTableRef = useRef<HTMLDivElement | null>(null);
  const lastDeepLinkedLeadRef = useRef<string | null>(null);
  const hasLoadedOnceRef = useRef(false);

  // Debounce the search input so the database is queried only after typing pauses.
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearchQuery(searchQuery), 300);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  // Any filter/sort/page-size change returns to the first page.
  useEffect(() => {
    setPage(0);
  }, [
    debouncedSearchQuery,
    statusFilter,
    qualityFilter,
    sourceFilter,
    ownerFilter,
    progressFilter,
    followupFilter,
    sortMode,
    pageSize,
  ]);

  useEffect(() => {
    window.localStorage.setItem(LEAD_PAGE_SIZE_STORAGE_KEY, String(pageSize));
  }, [pageSize]);

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

      if (options?.refresh || hasLoadedOnceRef.current) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const adminUsersQuery = supabase
        .from("admin_users")
        .select("id, email, full_name, role, is_active, owner_color, last_login_at")
        .eq("is_active", true)
        .order("full_name", { ascending: true });

      // Server-side pagination + whole-table search/filtering. The database
      // function also returns the true total count for the current filters.
      const leadsQuery = supabase.rpc("admin_search_leads", {
        p_search: debouncedSearchQuery.trim() || null,
        p_status: statusFilter === "all" ? "active" : statusFilter,
        p_quality: qualityFilter,
        p_source: sourceFilter,
        p_owner: ownerFilter,
        p_progress: progressFilter,
        p_followup: followupFilter,
        p_sort: sortMode,
        p_lead_id: deepLinkLeadId,
        p_limit: pageSize,
        p_offset: page * pageSize,
      });

      const summaryQuery = supabase.rpc("admin_lead_summary");

      const feedbackSelect =
        "id, lead_id, platform, feedback_type, feedback_status, external_identifier_type, external_identifier_value, payload, response_payload, sent_at, created_at, updated_at";

      const alertQueueQuery = supabase
        .from("crm_alert_queue")
        .select(
          "id, alert_type, lead_id, followup_id, title, body, payload, delivery_status, delivery_attempts, last_error, sent_at, available_at, created_at, updated_at",
        )
        .order("created_at", { ascending: false })
        .limit(200);

      const [adminUsersResult, leadsResult, alertQueueResult, summaryResult] = await Promise.all([
        adminUsersQuery,
        leadsQuery,
        alertQueueQuery,
        summaryQuery,
      ]);

      const withLeadDefaults = (lead: Partial<LeadRow>): LeadRow =>
        ({
          first_whatsapp_contacted_at: null,
          first_whatsapp_contacted_by: null,
          first_called_at: null,
          first_called_by: null,
          source_received_at: null,
          created_at: "",
          ...lead,
        }) as LeadRow;

      let loadedLeads: LeadRow[] = [];
      let leadTotal = 0;
      let leadLoadFailed = false;

      if (leadsResult.error) {
        // Safety net for environments where the migration has not run yet:
        // fall back to a plain paginated query (no server-side filters).
        console.warn("admin_search_leads unavailable, using fallback lead query.", leadsResult.error);
        const runFallback = (selectClause: string) =>
          supabase
            .from("leads")
            .select(selectClause, { count: "exact" })
            .order("last_activity_at", { ascending: false, nullsFirst: false })
            .range(page * pageSize, page * pageSize + pageSize - 1);

        let fallbackResult = await runFallback(responseTrackingLeadSelect);
        if (fallbackResult.error?.code === "42703") {
          fallbackResult = await runFallback(baseLeadSelect);
        }

        if (fallbackResult.error) {
          console.warn("Failed to load leads", fallbackResult.error);
          leadLoadFailed = true;
        } else {
          loadedLeads = ((fallbackResult.data as Partial<LeadRow>[]) ?? []).map(withLeadDefaults);
          leadTotal = fallbackResult.count ?? loadedLeads.length;
        }
      } else {
        const rows = (leadsResult.data ?? []) as { lead_data: Partial<LeadRow>; total_count: number }[];
        loadedLeads = rows.map((row) => withLeadDefaults(row.lead_data));
        leadTotal = Number(rows[0]?.total_count ?? 0);
      }

      const leadIds = loadedLeads.map((lead) => lead.id).filter(Boolean);

      // Session rollups scoped to the leads on this page instead of a global
      // "newest 700 rollups" pull.
      const quoteFilterValue = (value: string) => `"${value.replace(/["\\,]/g, "")}"`;
      const rollupSessionIds = loadedLeads
        .map((lead) => lead.primary_session_id)
        .filter((value): value is string => Boolean(value));
      const rollupPhones = loadedLeads
        .map((lead) => (lead.phone ?? "").trim())
        .filter(Boolean);

      let rollupsResult: { data: unknown; error: { message: string } | null } = { data: [], error: null };
      if (leadIds.length) {
        const rollupOrParts = [
          `lead_id.in.(${leadIds.map(quoteFilterValue).join(",")})`,
          rollupSessionIds.length ? `session_id.in.(${rollupSessionIds.map(quoteFilterValue).join(",")})` : null,
          rollupPhones.length ? `lead_phone.in.(${rollupPhones.map(quoteFilterValue).join(",")})` : null,
        ]
          .filter(Boolean)
          .join(",");

        rollupsResult = await supabase
          .from("admin_session_rollups")
          .select(
            "session_id, lead_id, lead_name, lead_phone, lead_submitted, whatsapp_clicked, quote_modal_opened, unlock_requested, duration_ms, max_scroll_percent, video_max_progress_percent, package_name, vehicle_size, finish, coverage, quote_estimate, vehicle_make, vehicle_model, vehicle_year, sections_viewed, faq_open_count, ended_at",
          )
          .or(rollupOrParts)
          .order("ended_at", { ascending: false })
          .limit(1000);
      }
      const [notesResult, followupsResult, statusHistoryResult, feedbackResult] = await Promise.all([
        fetchLeadScopedRows<LeadNoteRow>("lead_notes", "id, lead_id, author_admin_user_id, body, created_at", leadIds),
        fetchLeadScopedRows<LeadFollowupRow>(
          "lead_followups",
          "id, lead_id, assigned_to, status, channel, due_at, completed_at, notes, created_at, updated_at",
          leadIds,
        ),
        fetchLeadScopedRows<LeadStatusHistoryRow>(
          "lead_status_history",
          "id, lead_id, changed_by, from_status, to_status, reason, created_at",
          leadIds,
        ),
        fetchLeadScopedRows<AdPlatformFeedbackRow>("ad_platform_feedback", feedbackSelect, leadIds),
      ]);

      if (adminUsersResult.error) {
        console.warn("Failed to load admin users", adminUsersResult.error);
        setAdminUsers([]);
      } else {
        setAdminUsers((adminUsersResult.data as AdminUserOption[]) ?? []);
      }

      if (leadLoadFailed) {
        setLeads([]);
        setTotalLeadCount(0);
      } else {
        setLeads(loadedLeads);
        setTotalLeadCount(leadTotal);
      }

      if (summaryResult.error) {
        console.warn("Failed to load lead summary counts", summaryResult.error);
      } else {
        const rawSummary = (summaryResult.data ?? {}) as Record<string, number>;
        setSummaryCounts({
          newLeads: rawSummary.new_leads ?? 0,
          dueFollowups: rawSummary.due_followups ?? 0,
          partialLeads: rawSummary.partial_leads ?? 0,
          pendingMetaFeedback: rawSummary.pending_meta_feedback ?? 0,
          metaLeads: rawSummary.meta_leads ?? 0,
        });
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

      hasLoadedOnceRef.current = true;
      setIsLoading(false);
      setIsRefreshing(false);
    },
    [
      debouncedSearchQuery,
      statusFilter,
      qualityFilter,
      sourceFilter,
      ownerFilter,
      progressFilter,
      followupFilter,
      sortMode,
      page,
      pageSize,
      deepLinkLeadId,
    ],
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

  // Filtering, search, and sorting all happen in the database now — the rows
  // in state are exactly the rows for the current page, already ordered.
  const filteredLeads = leadsWithIntent;

  // Global summary counts come from the admin_lead_summary database function
  // instead of being derived from whichever leads happen to be loaded.
  const summary = summaryCounts;

  const alertQueueSummary = useMemo(
    () => ({
      pending: alertQueueRows.filter((row) => row.delivery_status === "pending").length,
      sent: alertQueueRows.filter((row) => row.delivery_status === "sent").length,
      failed: alertQueueRows.filter((row) => row.delivery_status === "failed").length,
    }),
    [alertQueueRows],
  );

  const totalPages = Math.max(1, Math.ceil(totalLeadCount / pageSize));
  const pageStart = totalLeadCount === 0 ? 0 : page * pageSize + 1;
  const pageEnd = Math.min(totalLeadCount, page * pageSize + filteredLeads.length);

  // If the current page falls out of range (e.g. after deletions), snap back.
  useEffect(() => {
    if (page > 0 && page * pageSize >= totalLeadCount && totalLeadCount > 0) {
      setPage(Math.max(0, Math.ceil(totalLeadCount / pageSize) - 1));
    }
  }, [page, pageSize, totalLeadCount]);

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

  const updateLeadSourceDraft = (
    lead: Pick<
      LeadRow,
      "id" | "source_platform" | "utm_source" | "utm_medium" | "utm_campaign" | "external_campaign_name" | "gclid"
    >,
    patch: Partial<LeadSourceDraft>,
  ) => {
    setLeadSourceDrafts((current) => {
      const nextDraft = {
        ...(current[lead.id] ?? makeLeadSourceDraft(lead)),
        ...patch,
      };

      if (patch.sourcePlatform === "google") {
        nextDraft.utmSource = nextDraft.utmSource || "google";
        nextDraft.utmMedium = nextDraft.utmMedium || "paid_search";
      }

      return {
        ...current,
        [lead.id]: nextDraft,
      };
    });
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

  const handleLeadSourceSave = async (lead: DisplayLeadRow) => {
    if (!supabase) return;

    const draft = leadSourceDrafts[lead.id] ?? makeLeadSourceDraft(lead);
    const sourcePlatform = draft.sourcePlatform.trim() || null;
    const isGoogle = sourcePlatform?.toLowerCase() === "google";
    const utmSource = draft.utmSource.trim() || (isGoogle ? "google" : null);
    const utmMedium = draft.utmMedium.trim() || (isGoogle ? "paid_search" : null);
    const utmCampaign = draft.utmCampaign.trim() || null;
    const externalCampaignName = draft.externalCampaignName.trim() || utmCampaign;
    const gclid = draft.gclid.trim() || null;

    const saveKey = `source:${lead.id}`;
    setSaving(saveKey, true);

    const { error } = await supabase
      .from("leads")
      .update({
        source_platform: sourcePlatform,
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
        external_campaign_name: externalCampaignName,
        gclid,
        last_activity_at: new Date().toISOString(),
      })
      .eq("id", lead.id);

    setSaving(saveKey, false);

    if (error) {
      toast({
        title: "Source update failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Lead source updated",
      description: isGoogle
        ? "This lead will now be included in Google Ads reporting."
        : "The source attribution was saved.",
    });

    setLeadSourceDrafts((current) => {
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
    const now = new Date().toISOString();

    const { error } = await supabase.from("lead_notes").insert({
      lead_id: lead.id,
      author_admin_user_id: adminProfile.id,
      body: noteBody,
    });

    if (!error) {
      const { error: summaryError } = await supabase
        .from("leads")
        .update({ notes_summary: noteBody.slice(0, 180), last_activity_at: now })
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
    const now = new Date().toISOString();

    const { error } = await supabase.from("lead_followups").insert({
      lead_id: lead.id,
      assigned_to: draft.assignedTo === "unassigned" ? null : draft.assignedTo,
      channel: draft.channel,
      due_at: fromDateTimeInputValue(draft.dueAt),
      notes: draft.notes.trim() || null,
    });
    if (!error) {
      const { error: activityError } = await supabase.from("leads").update({ last_activity_at: now }).eq("id", lead.id);
      if (activityError) console.warn("Failed to update lead activity timestamp", activityError);
    }

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
    const now = new Date().toISOString();

    const { error } = await supabase
      .from("lead_followups")
      .update({
        status: nextStatus,
        completed_at: nextStatus === "done" ? now : null,
      })
      .eq("id", followupId)
      .eq("lead_id", leadId);
    if (!error) {
      const { error: activityError } = await supabase.from("leads").update({ last_activity_at: now }).eq("id", leadId);
      if (activityError) console.warn("Failed to update lead activity timestamp", activityError);
    }

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

  const handleNeedsFirstTouchClick = () => {
    setSearchQuery("");
    setDebouncedSearchQuery("");
    setDeepLinkLeadId(null);
    setStatusFilter("new");
    setQualityFilter("all");
    setSourceFilter("all");
    setOwnerFilter("all");
    setProgressFilter("all");
    setFollowupFilter("all");
    setExpandedLeadId(null);

    window.setTimeout(() => {
      leadTableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  const handleClearLeadFilters = () => {
    setSearchQuery("");
    setDebouncedSearchQuery("");
    setStatusFilter("all");
    setQualityFilter("all");
    setSourceFilter("all");
    setOwnerFilter("all");
    setProgressFilter("all");
    setFollowupFilter("all");
    setDeepLinkLeadId(null);
    setPage(0);
    setExpandedLeadId(null);
  };

  useEffect(() => {
    const deepLinkedLeadId = searchParams.get("lead");

    if (!deepLinkedLeadId) {
      lastDeepLinkedLeadRef.current = null;
      setDeepLinkLeadId(null);
      return;
    }

    if (lastDeepLinkedLeadRef.current === deepLinkedLeadId) {
      return;
    }

    lastDeepLinkedLeadRef.current = deepLinkedLeadId;
    setSearchQuery("");
    setDebouncedSearchQuery("");
    setStatusFilter("all");
    setQualityFilter("all");
    setSourceFilter("all");
    setOwnerFilter("all");
    setProgressFilter("all");
    setFollowupFilter("all");
    setPage(0);
    setDeepLinkLeadId(deepLinkedLeadId);
    setExpandedLeadId(deepLinkedLeadId);
  }, [searchParams]);

  useEffect(() => {
    if (!deepLinkLeadId || isLoading || isRefreshing) return;

    const timer = window.setTimeout(() => {
      const leadRow = document.getElementById(`lead-row-${deepLinkLeadId}`);
      leadRow?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 120);

    return () => window.clearTimeout(timer);
  }, [deepLinkLeadId, isLoading, isRefreshing]);

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
    const isGoogleLead = manualLeadDraft.sourcePlatform === "google";
    const utmCampaign = manualLeadDraft.utmCampaign.trim() || null;
    const leadInsert = {
      full_name: manualLeadDraft.fullName.trim() || null,
      phone: manualLeadDraft.phone.trim() || null,
      email: manualLeadDraft.email.trim() || null,
      vehicle_make: manualLeadDraft.vehicleMake.trim() || null,
      vehicle_model: manualLeadDraft.vehicleModel.trim() || null,
      vehicle_year: manualLeadDraft.vehicleYear.trim() || null,
      source_platform: manualLeadDraft.sourcePlatform.trim() || "manual",
      utm_source: manualLeadDraft.utmSource.trim() || (isGoogleLead ? "google" : null),
      utm_medium: manualLeadDraft.utmMedium.trim() || (isGoogleLead ? "paid_search" : null),
      utm_campaign: utmCampaign,
      external_campaign_name: manualLeadDraft.externalCampaignName.trim() || utmCampaign,
      gclid: manualLeadDraft.gclid.trim() || null,
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

  const metaTokenWatchExpanded = metaTokenWatchPinned;

  return (
    <AdminShell
      title="Lead Desk"
      description="This is now the working sales inbox for website leads. It keeps partial captures, notes, follow-ups, and source context together, while preparing Meta-originated leads for later quality feedback sending from a backend job."
    >
      <div className="grid gap-4 xl:grid-cols-4">
        <Card
          className="cursor-pointer border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(10,10,10,0.96))] p-5 transition hover:border-white/20 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(10,10,10,0.96))]"
          role="button"
          tabIndex={0}
          onClick={handleNeedsFirstTouchClick}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              handleNeedsFirstTouchClick();
            }
          }}
        >
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Needs first touch</p>
          <p className="mt-3 text-3xl font-semibold text-white">{summary.newLeads}</p>
          <p className="mt-2 text-sm text-slate-400">Contactable leads still waiting for first outreach.</p>
        </Card>
        <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(10,10,10,0.96))] p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Tasks due</p>
          <p className="mt-3 text-3xl font-semibold text-white">{summary.dueFollowups}</p>
          <p className="mt-2 text-sm text-slate-400">Calls and follow-ups due today or already overdue.</p>
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
        <div className="mb-4">
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
                  <Select
                    value={manualLeadDraft.sourcePlatform}
                    onValueChange={(value) =>
                      setManualLeadDraft((current) => ({
                        ...current,
                        sourcePlatform: value,
                        utmSource: value === "google" && !current.utmSource ? "google" : current.utmSource,
                        utmMedium: value === "google" && !current.utmMedium ? "paid_search" : current.utmMedium,
                      }))
                    }
                  >
                    <SelectTrigger className="border-white/10 bg-black/20 text-white">
                      <SelectValue placeholder="Source" />
                    </SelectTrigger>
                    <SelectContent>
                      {leadSourcePlatformOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    value={manualLeadDraft.utmCampaign}
                    onChange={(event) =>
                      setManualLeadDraft((current) => ({ ...current, utmCampaign: event.target.value }))
                    }
                    placeholder="Google campaign name (optional)"
                    className="border-white/10 bg-black/20 text-white placeholder:text-slate-500"
                  />
                  <Input
                    value={manualLeadDraft.externalCampaignName}
                    onChange={(event) =>
                      setManualLeadDraft((current) => ({ ...current, externalCampaignName: event.target.value }))
                    }
                    placeholder="External campaign override (optional)"
                    className="border-white/10 bg-black/20 text-white placeholder:text-slate-500"
                  />
                  <Input
                    value={manualLeadDraft.gclid}
                    onChange={(event) =>
                      setManualLeadDraft((current) => ({ ...current, gclid: event.target.value }))
                    }
                    placeholder="GCLID (optional)"
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

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search all leads — name, phone, vehicle, campaign"
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
          <Select value={ownerFilter} onValueChange={setOwnerFilter}>
            <SelectTrigger className="border-white/10 bg-black/20 text-white">
              <SelectValue placeholder="Owner" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All owners</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {adminUsers.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.full_name || user.email}
                </SelectItem>
              ))}
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
            {totalLeadCount === 0
              ? "No leads match the current filters."
              : `Showing ${pageStart}–${pageEnd} of ${totalLeadCount} leads.`}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 border-white/10 bg-black/20 px-3 text-xs text-slate-300 hover:bg-white/10"
            onClick={handleClearLeadFilters}
          >
            Clear filters
          </Button>
          <Select value={sortMode} onValueChange={(value) => setSortMode(value as "received" | "activity")}>
            <SelectTrigger className="h-7 w-auto gap-2 border-white/10 bg-black/20 px-3 text-xs text-slate-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="received">Sort: Lead received (newest)</SelectItem>
              <SelectItem value="activity">Sort: Last activity</SelectItem>
            </SelectContent>
          </Select>
          <Select value={String(pageSize)} onValueChange={(value) => setPageSize(Number(value))}>
            <SelectTrigger className="h-7 w-auto gap-2 border-white/10 bg-black/20 px-3 text-xs text-slate-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LEAD_PAGE_SIZE_OPTIONS.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option} per page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge variant="outline" className="border-white/10 bg-black/20 text-slate-300">
            Partial capture preserved
          </Badge>
          <Badge variant="outline" className="border-white/10 bg-black/20 text-slate-300">
            Meta feedback stays queued, not sent from browser
          </Badge>
        </div>

        <div ref={leadTableRef} className="mt-6">
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
                <TableHead>Lead received</TableHead>
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
                  const vehicle = getLeadVehicleText(lead, { rollup: lead.latestRollup });
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
                  const intentPresentation = getLeadIntentPresentation(lead);
                  const rowAccentClass = getLeadRowAccentClass(lead);
                  const leadReceivedAt = getLeadReceivedAt(lead);
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
                              {lead.assignedAdmin ? (
                                <span
                                  className="inline-flex items-center rounded-full border px-2 py-0.5 font-medium"
                                  style={{
                                    borderColor: withAlpha(lead.assignedAdmin.owner_color, "55"),
                                    backgroundColor: withAlpha(lead.assignedAdmin.owner_color, "1A"),
                                    color: lead.assignedAdmin.owner_color,
                                  }}
                                >
                                  Owner: {lead.assignedAdmin.full_name || lead.assignedAdmin.email}
                                </span>
                              ) : (
                                "Unassigned"
                              )}
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
                        <TableCell className={rowAccentClass}>
                          <Badge variant="outline" className={intentPresentation.tableClass}>
                            {intentPresentation.tableLabel}
                          </Badge>
                        </TableCell>
                        <TableCell className={rowAccentClass}>{formatCurrency(lead.latest_quote_estimate)}</TableCell>
                        <TableCell className={rowAccentClass}>
                          <div className="flex items-center justify-between gap-3">
                            <span>{formatTimestamp(leadReceivedAt)}</span>
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
                            <AdminLeadExpandedPanel
                              lead={lead as LeadTaskLead}
                              adminUsers={adminUsers}
                              adminUsersById={adminUsersById}
                              adminProfile={adminProfile}
                              estimateDrafts={estimateDrafts}
                              setEstimateDrafts={setEstimateDrafts}
                              noteDrafts={noteDrafts}
                              setNoteDrafts={setNoteDrafts}
                              followupDrafts={followupDrafts}
                              updateFollowupDraft={updateFollowupDraft}
                              leadDetailsDrafts={leadDetailsDrafts}
                              setLeadDetailsDrafts={setLeadDetailsDrafts}
                              updateLeadDetailsDraft={updateLeadDetailsDraft}
                              leadSourceDrafts={leadSourceDrafts}
                              updateLeadSourceDraft={updateLeadSourceDraft}
                              leadScheduleDrafts={leadScheduleDrafts}
                              updateLeadScheduleDraft={updateLeadScheduleDraft}
                              setLeadScheduleDrafts={setLeadScheduleDrafts}
                              savingKeys={savingKeys}
                              onStatusChange={handleStatusChange}
                              onQualityChange={handleQualityChange}
                              onLogOutreach={handleLogOutreach}
                              onLeadAssignment={handleLeadAssignment}
                              onEstimateSave={handleEstimateSave}
                              onExpectedDeliverySave={handleExpectedDeliverySave}
                              onAddNote={handleAddNote}
                              onCreateFollowup={handleCreateFollowup}
                              onFollowupStatusChange={handleFollowupStatusChange}
                              onLeadDetailsSave={handleLeadDetailsSave}
                              onLeadSourceSave={handleLeadSourceSave}
                              onRequestDeleteLead={setLeadPendingDelete}
                            />
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

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
            <p className="text-sm text-slate-400">
              Page {Math.min(page + 1, totalPages)} of {totalPages}
              {isRefreshing ? " · Updating..." : ""}
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-white/10 bg-black/20 text-slate-300 hover:bg-white/10"
                disabled={page === 0 || isLoading}
                onClick={() => {
                  setPage((current) => Math.max(0, current - 1));
                  leadTableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-white/10 bg-black/20 text-slate-300 hover:bg-white/10"
                disabled={page + 1 >= totalPages || isLoading}
                onClick={() => {
                  setPage((current) => current + 1);
                  leadTableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              >
                Next
              </Button>
            </div>
          </div>
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
