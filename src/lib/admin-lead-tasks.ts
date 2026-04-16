import { useCallback, useEffect, useMemo, useState } from "react";

import { useAdminAuth } from "@/components/admin/AdminAuthProvider";
import { useToast } from "@/components/ui/use-toast";
import { getIntentScore } from "@/lib/funnel-intent";
import { supabase } from "@/lib/supabase";

export type LeadStatus = "new" | "contacted" | "qualified" | "quoted" | "won" | "lost" | "junk";
export type LeadQuality = "unreviewed" | "high" | "medium" | "low" | "spam";
export type FollowupStatus = "open" | "done" | "cancelled";
export type FollowupChannel = "call" | "whatsapp" | "sms" | "email" | "manual";
type FeedbackType = "qualified_lead" | "disqualified_lead" | "won_job" | "lost_job";

export type LeadRow = {
  id: string;
  primary_session_id: string | null;
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
  external_ad_name: string | null;
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
  first_called_at: string | null;
  created_at: string;
};

export type SessionRollupRow = {
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

export type LeadNoteRow = {
  id: string;
  lead_id: string;
  author_admin_user_id: string;
  body: string;
  created_at: string;
};

export type LeadFollowupRow = {
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

type AdPlatformFeedbackRow = {
  id: string;
  lead_id: string;
  platform: "meta" | "google" | "tiktok";
  feedback_type: FeedbackType;
  feedback_status: "pending" | "sent" | "failed";
};

export type LeadTaskLead = LeadRow & {
  latestRollup: SessionRollupRow | null;
  sourceGroup: "meta" | "google" | "tiktok" | "website" | "manual";
  isMetaOriginated: boolean;
  notes: LeadNoteRow[];
  followups: LeadFollowupRow[];
  feedback: AdPlatformFeedbackRow[];
  followupState: "none" | "open" | "due_today" | "overdue" | "done";
};

export type AdminUserOption = {
  id: string;
  email: string;
  full_name: string | null;
  role: "owner" | "manager" | "sales";
  is_active: boolean;
  owner_color: string;
};

export type FollowupDraft = {
  assignedTo: string;
  channel: FollowupChannel;
  dueAt: string;
  notes: string;
};

export type LeadScheduleDraft = {
  expectedDeliveryAt: string;
};

export type LeadTaskPriorityBand =
  | "first_touch"
  | "call_overdue"
  | "call_due_today"
  | "call_open"
  | "overdue"
  | "due_today"
  | "open_later";

export type LeadTaskItem = {
  taskId: string;
  taskKind: "first_touch" | "call" | "followup";
  leadId: string;
  followupId: string | null;
  lead: LeadTaskLead;
  followup: LeadFollowupRow | null;
  priorityBand: LeadTaskPriorityBand;
  sortAt: number;
  title: string;
  summary: string;
  packageLabel: string | null;
  vehicle: string;
  phone: string | null;
  timingAt: string | null;
  timingLabel: string;
  dueLabel: string;
  urgencyLabel: string;
  taskLabel: string;
  taskBadgeClass: string;
};

export const leadStatusOptions: LeadStatus[] = ["new", "contacted", "qualified", "quoted", "won", "lost", "junk"];
export const followupChannelOptions: FollowupChannel[] = ["call", "whatsapp", "sms", "email", "manual"];

export const formatTokenLabel = (value: string) =>
  value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export const formatTimestamp = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("en-AE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
    : "Not yet";

export const toDatetimeLocalValue = (value: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}T${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
};

const collapseRepeatedPhrase = (value: string | null | undefined) => {
  const normalized = (value ?? "").trim().replace(/\s+/g, " ");
  if (!normalized) return "";
  const words = normalized.split(" ");
  if (words.length >= 2 && words.length % 2 === 0) {
    const half = words.length / 2;
    const left = words.slice(0, half).join(" ");
    const right = words.slice(half).join(" ");
    if (left.toLowerCase() === right.toLowerCase()) return left;
  }
  return normalized;
};

export const getLeadVehicleText = (
  lead: Pick<LeadRow, "vehicle_label" | "vehicle_year" | "vehicle_make" | "vehicle_model">,
) =>
  collapseRepeatedPhrase(
    lead.vehicle_label ||
      [lead.vehicle_year, lead.vehicle_make, lead.vehicle_model].filter(Boolean).join(" "),
  );

export const readImportMetadataValue = (metadata: Record<string, unknown> | null | undefined, key: string) => {
  const value = metadata?.[key];
  return typeof value === "string" ? value : null;
};

export const formatMetaLeadChoice = (value: string | null | undefined) =>
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

export const normalizePhone = (value: string | null) => (value ? value.replace(/[^0-9+]/g, "") : "");

export const buildWhatsAppUrl = (value: string | null) => {
  let digits = (value ?? "").replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("05") && digits.length === 10) digits = `971${digits.slice(1)}`;
  if (digits.startsWith("5") && digits.length === 9) digits = `971${digits}`;
  if (digits.startsWith("9710")) digits = `971${digits.slice(4)}`;
  return digits ? `https://wa.me/${digits}` : null;
};

const BUSINESS_TIMEZONE = "Asia/Dubai";
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
  const read = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  const weekdayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

  return {
    year: Number(read("year")),
    month: Number(read("month")),
    day: Number(read("day")),
    hour: Number(read("hour")),
    minute: Number(read("minute")),
    second: Number(read("second")),
    weekday: weekdayMap[read("weekday")] ?? 0,
  };
};

const makeDubaiDate = (year: number, month: number, day: number, hour: number, minute = 0, second = 0) =>
  new Date(Date.UTC(year, month - 1, day, hour - 4, minute, second));

const addDubaiDays = (value: Date, days: number) => {
  const parts = getDubaiDateParts(value);
  return makeDubaiDate(parts.year, parts.month, parts.day + days, parts.hour, parts.minute, parts.second);
};

const isSameDubaiDay = (left: Date, right: Date) => {
  const leftParts = getDubaiDateParts(left);
  const rightParts = getDubaiDateParts(right);
  return leftParts.year === rightParts.year && leftParts.month === rightParts.month && leftParts.day === rightParts.day;
};

export const getLeadReceivedAt = (lead: LeadRow) =>
  lead.source_received_at || lead.submitted_at || lead.first_captured_at || lead.created_at || null;

export const getSlaDueAt = (lead: LeadRow, channel: "whatsapp" | "call") => {
  const receivedAt = getLeadReceivedAt(lead);
  if (!receivedAt) return null;

  const receivedDate = new Date(receivedAt);
  const receivedParts = getDubaiDateParts(receivedDate);
  const window =
    channel === "whatsapp"
      ? { startHour: 9, startMinute: 30, endHour: 20, endMinute: 0, slaMinutes: 30 }
      : { startHour: 9, startMinute: 30, endHour: 18, endMinute: 0, slaMinutes: 60 };
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

  let startDate = makeDubaiDate(receivedParts.year, receivedParts.month, receivedParts.day, window.startHour, window.startMinute, 0);
  if (!BUSINESS_OPEN_DAYS.has(receivedParts.weekday) || receivedMinutes >= endMinutes) {
    startDate = addDubaiDays(startDate, 1);
  }
  while (!BUSINESS_OPEN_DAYS.has(getDubaiDateParts(startDate).weekday)) {
    startDate = addDubaiDays(startDate, 1);
  }

  return new Date(startDate.getTime() + window.slaMinutes * 60_000);
};

export const getStatusBadgeClass = (status: LeadStatus) => {
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

export const getSourceBadgeClass = (sourceGroup: LeadTaskLead["sourceGroup"]) => {
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

export const makeDefaultFollowupDraft = (assignedTo: string | null, currentAdminId?: string): FollowupDraft => ({
  assignedTo: assignedTo || currentAdminId || "unassigned",
  channel: "call",
  dueAt: "",
  notes: "",
});

export const makeLeadScheduleDraft = (lead: Pick<LeadRow, "expected_delivery_at">): LeadScheduleDraft => ({
  expectedDeliveryAt: toDatetimeLocalValue(lead.expected_delivery_at),
});

const buildSourceGroup = (lead: LeadRow) => {
  const sourceText = [lead.source_platform, lead.utm_source, lead.utm_medium, lead.landing_page_variant, lead.lead_source_type]
    .join(" ")
    .toLowerCase();
  if (lead.lead_source_type === "manual") return "manual" as const;
  if (lead.fbclid || sourceText.includes("meta") || sourceText.includes("facebook") || sourceText.includes("instagram")) return "meta" as const;
  if (lead.gclid || sourceText.includes("google")) return "google" as const;
  if (lead.ttclid || sourceText.includes("tiktok") || sourceText.includes("tt")) return "tiktok" as const;
  return "website" as const;
};

const sortFollowups = (items: LeadFollowupRow[]) =>
  [...items].sort((left, right) => new Date(left.due_at || left.created_at).getTime() - new Date(right.due_at || right.created_at).getTime());

const getRecommendedFeedbackType = (nextState: Pick<LeadRow, "status" | "quality_label">): FeedbackType | null => {
  if (nextState.status === "won") return "won_job";
  if (nextState.status === "qualified" || nextState.status === "quoted" || nextState.quality_label === "high") return "qualified_lead";
  return null;
};

const fromDateTimeInputValue = (value: string) => (value ? new Date(value).toISOString() : null);
const truncateText = (value: string | null | undefined, maxLength = 140) => {
  const normalized = (value ?? "").trim().replace(/\s+/g, " ");
  if (!normalized) return "";
  return normalized.length <= maxLength ? normalized : `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
};

const getDuePriorityBand = (
  dueAt: Date | null,
  kind: "call" | "followup",
  now: Date,
): LeadTaskPriorityBand => {
  if (!dueAt) return kind === "call" ? "call_open" : "open_later";
  if (dueAt.getTime() < now.getTime()) return kind === "call" ? "call_overdue" : "overdue";
  if (isSameDubaiDay(dueAt, now)) return kind === "call" ? "call_due_today" : "due_today";
  return kind === "call" ? "call_open" : "open_later";
};

export const getLeadTaskPackageLabel = (lead: Pick<LeadTaskLead, "latestRollup" | "import_metadata">) => {
  const protection = readImportMetadataValue(lead.import_metadata, "protection_level");
  if (lead.latestRollup?.package_name) return lead.latestRollup.package_name;
  if (protection) return formatMetaLeadChoice(protection);
  const fallback = [lead.latestRollup?.finish, lead.latestRollup?.coverage].filter(Boolean);
  return fallback.length ? fallback.join(" · ") : null;
};

export const buildLeadTasks = (leads: LeadTaskLead[]) => {
  const now = new Date();
  const tasks: LeadTaskItem[] = [];

  for (const lead of leads) {
    const firstTouch =
      lead.status === "new" &&
      Boolean((lead.phone || "").trim() || (lead.email || "").trim()) &&
      !lead.first_whatsapp_contacted_at &&
      !lead.first_called_at;

    if (firstTouch) {
      const receivedAt = getLeadReceivedAt(lead);
      const dueAt = lead.phone ? getSlaDueAt(lead, "whatsapp") : null;
      const overdue = dueAt ? Date.now() > dueAt.getTime() : false;
      tasks.push({
        taskId: `first-touch:${lead.id}`,
        taskKind: "first_touch",
        leadId: lead.id,
        followupId: null,
        lead,
        followup: null,
        priorityBand: "first_touch",
        sortAt: dueAt?.getTime() ?? (receivedAt ? new Date(receivedAt).getTime() : Date.now()),
        title: "Needs first touch",
        summary: truncateText(lead.notes_summary || "New lead waiting for first outreach."),
        packageLabel: getLeadTaskPackageLabel(lead),
        vehicle: getLeadVehicleText(lead),
        phone: lead.phone,
        timingAt: dueAt ? dueAt.toISOString() : receivedAt,
        timingLabel: dueAt ? "Response due" : "Received",
        dueLabel: dueAt ? `Response due ${formatTimestamp(dueAt.toISOString())}` : `Received ${formatTimestamp(receivedAt)}`,
        urgencyLabel: overdue ? "First touch overdue" : dueAt ? "Needs first touch" : "Email follow-up needed",
        taskLabel: "First touch",
        taskBadgeClass: overdue ? "border-rose-400/20 bg-rose-500/10 text-rose-200" : "border-sky-400/20 bg-sky-500/10 text-sky-200",
      });
      continue;
    }

    const needsFirstCall = Boolean((lead.phone || "").trim()) && !lead.first_called_at;
    if (needsFirstCall) {
      const receivedAt = getLeadReceivedAt(lead);
      const dueAt = getSlaDueAt(lead, "call");
      const priorityBand = getDuePriorityBand(dueAt, "call", now);
      tasks.push({
        taskId: `call:${lead.id}`,
        taskKind: "call",
        leadId: lead.id,
        followupId: null,
        lead,
        followup: null,
        priorityBand,
        sortAt: dueAt?.getTime() ?? (receivedAt ? new Date(receivedAt).getTime() : Date.now()),
        title: "First call needed",
        summary: truncateText(lead.notes_summary || "Lead still needs the first customer call."),
        packageLabel: getLeadTaskPackageLabel(lead),
        vehicle: getLeadVehicleText(lead),
        phone: lead.phone,
        timingAt: dueAt ? dueAt.toISOString() : receivedAt,
        timingLabel: dueAt ? "Call due" : "Received",
        dueLabel: dueAt ? `Call due ${formatTimestamp(dueAt.toISOString())}` : `Received ${formatTimestamp(receivedAt)}`,
        urgencyLabel:
          priorityBand === "call_overdue"
            ? "Call overdue"
            : priorityBand === "call_due_today"
              ? "Call due today"
              : "First call still needed",
        taskLabel:
          priorityBand === "call_overdue"
            ? "Call overdue"
            : priorityBand === "call_due_today"
              ? "Call today"
              : "Phone call",
        taskBadgeClass:
          priorityBand === "call_overdue"
            ? "border-rose-400/20 bg-rose-500/10 text-rose-200"
            : priorityBand === "call_due_today"
              ? "border-amber-400/20 bg-amber-500/10 text-amber-200"
              : "border-white/10 bg-white/5 text-slate-200",
      });
    }

    for (const followup of lead.followups.filter((item) => item.status === "open")) {
      const dueDate = followup.due_at ? new Date(followup.due_at) : null;
      const priorityBand = getDuePriorityBand(dueDate, "followup", now);
      const channelLabel = formatTokenLabel(followup.channel);
      tasks.push({
        taskId: `followup:${followup.id}`,
        taskKind: "followup",
        leadId: lead.id,
        followupId: followup.id,
        lead,
        followup,
        priorityBand,
        sortAt: new Date(followup.due_at || followup.created_at).getTime(),
        title: `${formatTokenLabel(followup.channel)} follow-up`,
        summary: truncateText(followup.notes || lead.notes_summary || "No follow-up note yet."),
        packageLabel: getLeadTaskPackageLabel(lead),
        vehicle: getLeadVehicleText(lead),
        phone: lead.phone,
        timingAt: followup.due_at || followup.created_at,
        timingLabel: followup.due_at ? "Due" : "Created",
        dueLabel: followup.due_at ? `Due ${formatTimestamp(followup.due_at)}` : `Created ${formatTimestamp(followup.created_at)}`,
        urgencyLabel:
          priorityBand === "overdue"
            ? `Overdue ${channelLabel}`
            : priorityBand === "due_today"
              ? `${channelLabel} due today`
              : `${channelLabel} follow-up`,
        taskLabel:
          priorityBand === "overdue"
            ? `Overdue ${channelLabel} follow-up`
            : priorityBand === "due_today"
              ? `${channelLabel} due today`
              : `${channelLabel} follow-up`,
        taskBadgeClass: priorityBand === "overdue" ? "border-rose-400/20 bg-rose-500/10 text-rose-200" : priorityBand === "due_today" ? "border-amber-400/20 bg-amber-500/10 text-amber-200" : "border-primary/25 bg-primary/10 text-primary",
      });
    }
  }

  const order: Record<LeadTaskPriorityBand, number> = {
    first_touch: 0,
    call_overdue: 1,
    overdue: 2,
    call_due_today: 3,
    due_today: 4,
    call_open: 5,
    open_later: 6,
  };
  return tasks.sort((left, right) => order[left.priorityBand] - order[right.priorityBand] || left.sortAt - right.sortAt);
};

const baseLeadSelect =
  "id, primary_session_id, full_name, phone, email, vehicle_make, vehicle_model, vehicle_year, vehicle_label, source_platform, landing_page_variant, funnel_name, lead_source_type, status, quality_label, intent_score, latest_quote_estimate, utm_source, utm_medium, utm_campaign, external_campaign_name, external_ad_name, gclid, fbclid, ttclid, notes_summary, import_metadata, expected_delivery_at, assigned_to, first_captured_at, last_activity_at, submitted_at, whatsapp_clicked_at, source_received_at, created_at";
const responseTrackingLeadSelect =
  `${baseLeadSelect}, first_whatsapp_contacted_at, first_called_at`;

export const useLeadTaskBoardData = () => {
  const { adminProfile } = useAdminAuth();
  const { toast } = useToast();

  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [sessionRollups, setSessionRollups] = useState<SessionRollupRow[]>([]);
  const [notes, setNotes] = useState<LeadNoteRow[]>([]);
  const [followups, setFollowups] = useState<LeadFollowupRow[]>([]);
  const [feedbackRows, setFeedbackRows] = useState<AdPlatformFeedbackRow[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUserOption[]>([]);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [followupDrafts, setFollowupDrafts] = useState<Record<string, FollowupDraft>>({});
  const [leadScheduleDrafts, setLeadScheduleDrafts] = useState<Record<string, LeadScheduleDraft>>({});
  const [savingKeys, setSavingKeys] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const setSaving = useCallback((key: string, value: boolean) => {
    setSavingKeys((current) => {
      if (value) return { ...current, [key]: true };
      const next = { ...current };
      delete next[key];
      return next;
    });
  }, []);

  const loadLeadDesk = useCallback(async (refresh = false) => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);

    const loadLeads = (selectClause: string) =>
      supabase.from("leads").select(selectClause).order("last_activity_at", { ascending: false, nullsFirst: false }).limit(150);

    let [leadsResult, rollupsResult, notesResult, followupsResult, feedbackResult, adminUsersResult] = await Promise.all([
      loadLeads(responseTrackingLeadSelect),
      supabase.from("admin_session_rollups").select("session_id, lead_id, lead_name, lead_phone, lead_submitted, whatsapp_clicked, quote_modal_opened, unlock_requested, duration_ms, max_scroll_percent, video_max_progress_percent, package_name, vehicle_size, finish, coverage, quote_estimate, vehicle_make, vehicle_model, vehicle_year, sections_viewed, faq_open_count, ended_at").order("ended_at", { ascending: false }).limit(700),
      supabase.from("lead_notes").select("id, lead_id, author_admin_user_id, body, created_at").order("created_at", { ascending: false }).limit(700),
      supabase.from("lead_followups").select("id, lead_id, assigned_to, status, channel, due_at, completed_at, notes, created_at, updated_at").order("created_at", { ascending: false }).limit(700),
      supabase.from("ad_platform_feedback").select("id, lead_id, platform, feedback_type, feedback_status").order("created_at", { ascending: false }).limit(700),
      supabase.from("admin_users").select("id, email, full_name, role, is_active, owner_color").eq("is_active", true).order("full_name", { ascending: true, nullsFirst: false }),
    ]);

    if (leadsResult.error?.code === "42703") {
      [leadsResult, rollupsResult, notesResult, followupsResult, feedbackResult, adminUsersResult] = await Promise.all([
        loadLeads(baseLeadSelect),
        supabase.from("admin_session_rollups").select("session_id, lead_id, lead_name, lead_phone, lead_submitted, whatsapp_clicked, quote_modal_opened, unlock_requested, duration_ms, max_scroll_percent, video_max_progress_percent, package_name, vehicle_size, finish, coverage, quote_estimate, vehicle_make, vehicle_model, vehicle_year, sections_viewed, faq_open_count, ended_at").order("ended_at", { ascending: false }).limit(700),
        supabase.from("lead_notes").select("id, lead_id, author_admin_user_id, body, created_at").order("created_at", { ascending: false }).limit(700),
        supabase.from("lead_followups").select("id, lead_id, assigned_to, status, channel, due_at, completed_at, notes, created_at, updated_at").order("created_at", { ascending: false }).limit(700),
        supabase.from("ad_platform_feedback").select("id, lead_id, platform, feedback_type, feedback_status").order("created_at", { ascending: false }).limit(700),
        supabase.from("admin_users").select("id, email, full_name, role, is_active, owner_color").eq("is_active", true).order("full_name", { ascending: true, nullsFirst: false }),
      ]);
    }

    if (leadsResult.error) console.warn("Failed to load leads", leadsResult.error);
    if (rollupsResult.error) console.warn("Failed to load session rollups", rollupsResult.error);
    if (notesResult.error) console.warn("Failed to load lead notes", notesResult.error);
    if (followupsResult.error) console.warn("Failed to load lead followups", followupsResult.error);
    if (feedbackResult.error) console.warn("Failed to load feedback rows", feedbackResult.error);
    if (adminUsersResult.error) console.warn("Failed to load admin users", adminUsersResult.error);

    setLeads((((leadsResult.data as Partial<LeadRow>[]) ?? []).map((lead) => ({ first_whatsapp_contacted_at: null, first_called_at: null, source_received_at: null, created_at: "", ...lead })) as LeadRow[]) ?? []);
    setSessionRollups((rollupsResult.data as SessionRollupRow[]) ?? []);
    setNotes((notesResult.data as LeadNoteRow[]) ?? []);
    setFollowups((followupsResult.data as LeadFollowupRow[]) ?? []);
    setFeedbackRows((feedbackResult.data as AdPlatformFeedbackRow[]) ?? []);
    setAdminUsers((adminUsersResult.data as AdminUserOption[]) ?? []);
    setIsLoading(false);
    setIsRefreshing(false);
  }, []);

  useEffect(() => {
    void loadLeadDesk();
  }, [loadLeadDesk]);

  const notesByLeadId = useMemo(() => {
    const map = new Map<string, LeadNoteRow[]>();
    for (const note of notes) {
      const bucket = map.get(note.lead_id) ?? [];
      bucket.push(note);
      map.set(note.lead_id, bucket);
    }
    for (const bucket of map.values()) bucket.sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime());
    return map;
  }, [notes]);

  const followupsByLeadId = useMemo(() => {
    const map = new Map<string, LeadFollowupRow[]>();
    for (const item of followups) {
      const bucket = map.get(item.lead_id) ?? [];
      bucket.push(item);
      map.set(item.lead_id, bucket);
    }
    for (const [leadId, bucket] of map.entries()) map.set(leadId, sortFollowups(bucket));
    return map;
  }, [followups]);

  const feedbackByLeadId = useMemo(() => {
    const map = new Map<string, AdPlatformFeedbackRow[]>();
    for (const item of feedbackRows) {
      const bucket = map.get(item.lead_id) ?? [];
      bucket.push(item);
      map.set(item.lead_id, bucket);
    }
    return map;
  }, [feedbackRows]);

  const taskLeads = useMemo<LeadTaskLead[]>(() => {
    return leads
      .filter((lead) => !["lost", "junk"].includes(lead.status))
      .map((lead) => {
        const matchingRollups = sessionRollups.filter((rollup) => {
          if (lead.primary_session_id && rollup.session_id === lead.primary_session_id) return true;
          if (rollup.lead_id && rollup.lead_id === lead.id) return true;
          return Boolean(lead.phone && rollup.lead_phone && normalizePhone(lead.phone) === normalizePhone(rollup.lead_phone));
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

        const leadFollowups = followupsByLeadId.get(lead.id) ?? [];
        const openFollowups = leadFollowups.filter((item) => item.status === "open");
        const hasOverdueFollowup = openFollowups.some((item) => item.due_at && new Date(item.due_at).getTime() < Date.now());
        const hasTodayFollowup = openFollowups.some((item) => item.due_at && isSameDubaiDay(new Date(item.due_at), new Date()));

        return {
          ...lead,
          intent_score: Math.max(lead.intent_score, computedIntentScore),
          latestRollup: matchingRollups[0] ?? null,
          sourceGroup: buildSourceGroup(lead),
          isMetaOriginated: buildSourceGroup(lead) === "meta",
          notes: notesByLeadId.get(lead.id) ?? [],
          followups: leadFollowups,
          feedback: feedbackByLeadId.get(lead.id) ?? [],
          followupState: hasOverdueFollowup ? "overdue" : hasTodayFollowup ? "due_today" : openFollowups.length ? "open" : leadFollowups.some((item) => item.status === "done") ? "done" : "none",
        };
      });
  }, [feedbackByLeadId, followupsByLeadId, leads, notesByLeadId, sessionRollups]);

  const taskItems = useMemo(() => buildLeadTasks(taskLeads), [taskLeads]);
  const stagingLeads = useMemo(
    () =>
      taskLeads
        .filter((lead) => !lead.assigned_to)
        .sort((left, right) => {
          const leftTime = getLeadReceivedAt(left);
          const rightTime = getLeadReceivedAt(right);
          return new Date(rightTime || 0).getTime() - new Date(leftTime || 0).getTime();
        }),
    [taskLeads],
  );
  const taskSummary = useMemo(() => ({
    firstTouch: taskItems.filter((task) => task.taskKind === "first_touch").length,
    phoneCalls: taskItems.filter((task) => task.taskKind === "call").length,
    callOverdue: taskItems.filter((task) => task.priorityBand === "call_overdue").length,
    overdue: taskItems.filter((task) => ["call_overdue", "overdue"].includes(task.priorityBand)).length,
    dueToday: taskItems.filter((task) => ["call_due_today", "due_today"].includes(task.priorityBand)).length,
    openFollowups: taskItems.filter((task) => task.taskKind === "followup").length,
  }), [taskItems]);

  const queueRecommendedMetaFeedback = useCallback(async (lead: LeadTaskLead, nextState: Pick<LeadRow, "status" | "quality_label">) => {
    if (!supabase || lead.sourceGroup !== "meta") return;
    const feedbackType = getRecommendedFeedbackType(nextState);
    const existingFeedback = lead.feedback;
    const pendingIds = existingFeedback.filter((entry) => entry.platform === "meta" && entry.feedback_status === "pending").map((entry) => entry.id);
    if (pendingIds.length) {
      const { error } = await supabase.from("ad_platform_feedback").delete().in("id", pendingIds);
      if (error) console.warn("Failed to clear stale Meta feedback", error);
    }
    if (!feedbackType) return;
    const alreadySent = existingFeedback.some((entry) => entry.platform === "meta" && entry.feedback_type === feedbackType && entry.feedback_status === "sent");
    if (alreadySent) return;
    const { error } = await supabase.from("ad_platform_feedback").insert({
      lead_id: lead.id,
      platform: "meta",
      feedback_type: feedbackType,
      feedback_status: "pending",
      external_identifier_type: lead.fbclid ? "fbclid" : null,
      external_identifier_value: lead.fbclid ?? null,
      payload: { lead_status: nextState.status, quality_label: nextState.quality_label, queued_from: "task_board", queued_at: new Date().toISOString() },
    });
    if (error) console.warn("Failed to queue Meta feedback", error);
  }, []);

  const updateFollowupDraft = useCallback((leadId: string, patch: Partial<FollowupDraft>, assignedTo: string | null) => {
    setFollowupDrafts((current) => ({
      ...current,
      [leadId]: { ...(current[leadId] ?? makeDefaultFollowupDraft(assignedTo, adminProfile?.id)), ...patch },
    }));
  }, [adminProfile?.id]);

  const updateLeadScheduleDraft = useCallback((lead: Pick<LeadRow, "id" | "expected_delivery_at">, patch: Partial<LeadScheduleDraft>) => {
    setLeadScheduleDrafts((current) => ({
      ...current,
      [lead.id]: { ...(current[lead.id] ?? makeLeadScheduleDraft(lead)), ...patch },
    }));
  }, []);

  const handleLogOutreach = useCallback(async (lead: LeadTaskLead, channel: "whatsapp" | "call") => {
    if (!supabase || !adminProfile?.id) return;
    const saveKey = `${channel}:${lead.id}`;
    setSaving(saveKey, true);
    const updatePayload: Record<string, string> = channel === "whatsapp" ? { first_whatsapp_contacted_at: new Date().toISOString() } : { first_called_at: new Date().toISOString() };
    if (lead.status === "new") updatePayload.status = "contacted";
    const { error } = await supabase.from("leads").update(updatePayload).eq("id", lead.id);
    setSaving(saveKey, false);
    if (error) {
      toast({ title: `Could not log ${channel === "whatsapp" ? "WhatsApp" : "call"}`, description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: `${channel === "whatsapp" ? "WhatsApp" : "Call"} logged`, description: channel === "whatsapp" ? "First WhatsApp outreach has been recorded for this lead." : "First customer call has been recorded for this lead." });
    void loadLeadDesk(true);
  }, [adminProfile?.id, loadLeadDesk, setSaving, toast]);

  const handleStatusChange = useCallback(async (lead: LeadTaskLead, nextStatus: LeadStatus) => {
    if (!supabase || nextStatus === lead.status) return;
    const saveKey = `status:${lead.id}`;
    setSaving(saveKey, true);
    const { error } = await supabase.from("leads").update({ status: nextStatus }).eq("id", lead.id);
    if (!error) await queueRecommendedMetaFeedback(lead, { status: nextStatus, quality_label: lead.quality_label });
    setSaving(saveKey, false);
    if (error) {
      toast({ title: "Status update failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Lead status updated", description: `This lead is now marked ${formatTokenLabel(nextStatus).toLowerCase()}.` });
    void loadLeadDesk(true);
  }, [loadLeadDesk, queueRecommendedMetaFeedback, setSaving, toast]);

  const handleAddNote = useCallback(async (lead: LeadTaskLead) => {
    if (!supabase || !adminProfile?.id) return;
    const noteBody = (noteDrafts[lead.id] ?? "").trim();
    if (!noteBody) return;
    const saveKey = `note:${lead.id}`;
    setSaving(saveKey, true);
    const { error } = await supabase.from("lead_notes").insert({ lead_id: lead.id, author_admin_user_id: adminProfile.id, body: noteBody });
    if (!error) await supabase.from("leads").update({ notes_summary: noteBody.slice(0, 180) }).eq("id", lead.id);
    setSaving(saveKey, false);
    if (error) {
      toast({ title: "Note not saved", description: error.message, variant: "destructive" });
      return;
    }
    setNoteDrafts((current) => ({ ...current, [lead.id]: "" }));
    toast({ title: "Note saved", description: "The internal note is now attached to the lead." });
    void loadLeadDesk(true);
  }, [adminProfile?.id, loadLeadDesk, noteDrafts, setSaving, toast]);

  const handleCreateFollowup = useCallback(async (lead: LeadTaskLead) => {
    if (!supabase) return;
    const draft = followupDrafts[lead.id] ?? makeDefaultFollowupDraft(lead.assigned_to, adminProfile?.id);
    const saveKey = `followup-create:${lead.id}`;
    setSaving(saveKey, true);
    const { error } = await supabase.from("lead_followups").insert({ lead_id: lead.id, assigned_to: draft.assignedTo === "unassigned" ? null : draft.assignedTo, channel: draft.channel, due_at: fromDateTimeInputValue(draft.dueAt), notes: draft.notes.trim() || null });
    setSaving(saveKey, false);
    if (error) {
      toast({ title: "Follow-up not created", description: error.message, variant: "destructive" });
      return;
    }
    setFollowupDrafts((current) => ({ ...current, [lead.id]: makeDefaultFollowupDraft(lead.assigned_to, adminProfile?.id) }));
    toast({ title: "Follow-up created", description: "This lead now has a follow-up task inside the CRM." });
    void loadLeadDesk(true);
  }, [adminProfile?.id, followupDrafts, loadLeadDesk, setSaving, toast]);

  const handleExpectedDeliverySave = useCallback(async (lead: LeadTaskLead) => {
    if (!supabase) return;
    const draft = leadScheduleDrafts[lead.id] ?? makeLeadScheduleDraft(lead);
    const expectedDeliveryAt = draft.expectedDeliveryAt ? new Date(draft.expectedDeliveryAt).toISOString() : null;
    const saveKey = `delivery:${lead.id}`;
    setSaving(saveKey, true);
    const { error } = await supabase.from("leads").update({ expected_delivery_at: expectedDeliveryAt }).eq("id", lead.id);
    setSaving(saveKey, false);
    if (error) {
      toast({ title: "Expected delivery update failed", description: error.message, variant: "destructive" });
      return;
    }
    setLeadScheduleDrafts((current) => {
      const next = { ...current };
      delete next[lead.id];
      return next;
    });
    toast({ title: "Expected delivery updated", description: expectedDeliveryAt ? `Expected delivery saved for ${formatTimestamp(expectedDeliveryAt)}.` : "Expected delivery was cleared." });
    void loadLeadDesk(true);
  }, [leadScheduleDrafts, loadLeadDesk, setSaving, toast]);

  const handleFollowupStatusChange = useCallback(async (leadId: string, followupId: string, nextStatus: FollowupStatus) => {
    if (!supabase) return;
    const saveKey = `followup-status:${followupId}`;
    setSaving(saveKey, true);
    const { error } = await supabase.from("lead_followups").update({ status: nextStatus, completed_at: nextStatus === "done" ? new Date().toISOString() : null }).eq("id", followupId).eq("lead_id", leadId);
    setSaving(saveKey, false);
    if (error) {
      toast({ title: "Follow-up update failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Follow-up updated", description: `This follow-up is now ${formatTokenLabel(nextStatus).toLowerCase()}.` });
    void loadLeadDesk(true);
  }, [loadLeadDesk, setSaving, toast]);

  const handleLeadAssignment = useCallback(async (leadId: string, assignedTo: string) => {
    if (!supabase) return;
    const saveKey = `assign:${leadId}`;
    const assigneeId = assignedTo === "unassigned" ? null : assignedTo;
    setSaving(saveKey, true);
    const { error } = await supabase.from("leads").update({ assigned_to: assigneeId }).eq("id", leadId);
    setSaving(saveKey, false);
    if (error) {
      toast({ title: "Lead assignment failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({
      title: "Lead owner updated",
      description: assigneeId ? "Lead was assigned successfully." : "Lead is now unassigned.",
    });
    void loadLeadDesk(true);
  }, [loadLeadDesk, setSaving, toast]);

  return {
    adminUsers,
    stagingLeads,
    isLoading,
    isRefreshing,
    leadScheduleDrafts,
    noteDrafts,
    savingKeys,
    taskItems,
    taskLeads,
    taskSummary,
    followupDrafts,
    setNoteDrafts,
    updateFollowupDraft,
    updateLeadScheduleDraft,
    loadLeadDesk,
    handleAddNote,
    handleCreateFollowup,
    handleExpectedDeliverySave,
    handleFollowupStatusChange,
    handleLeadAssignment,
    handleLogOutreach,
    handleStatusChange,
  };
};
