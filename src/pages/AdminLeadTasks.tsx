import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, RefreshCw } from "lucide-react";

import { AdminShell } from "@/components/admin/AdminShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  AdminUserOption,
  LeadStatus,
  LeadTaskItem,
  buildWhatsAppUrl,
  followupChannelOptions,
  formatTimestamp,
  formatTokenLabel,
  getLeadVehicleText,
  getSourceBadgeClass,
  getStatusBadgeClass,
  leadStatusOptions,
  makeDefaultFollowupDraft,
  makeLeadScheduleDraft,
  useLeadTaskBoardData,
} from "@/lib/admin-lead-tasks";

type TaskFilter = "all" | "first_touch" | "phone_calls" | "call_overdue" | "overdue" | "due_today" | "open_later";

const taskFilterOptions: Array<{ value: TaskFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "first_touch", label: "First touch" },
  { value: "phone_calls", label: "Phone calls" },
  { value: "call_overdue", label: "Call overdue" },
  { value: "overdue", label: "Overdue" },
  { value: "due_today", label: "Due today" },
  { value: "open_later", label: "Open later" },
];

const getTaskDomId = (taskId: string) => `task-card-${taskId.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
const getOwnerFilterLabel = (ownerFilter: string, adminUsers: AdminUserOption[]) => {
  if (ownerFilter === "all") return "All owners";
  if (ownerFilter === "unassigned") return "Unassigned only";
  const assignee = adminUsers.find((user) => user.id === ownerFilter);
  return assignee ? assignee.full_name || assignee.email : "Selected owner";
};
const formatLoudTaskDate = (value: string) =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dubai",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(value));

const isDubaiToday = (value: string) => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dubai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(new Date(value)) === formatter.format(new Date());
};

const TaskCard = ({
  task,
  isExpanded,
  isHighlighted,
  onToggle,
  noteDraft,
  onNoteChange,
  followupDraft,
  onFollowupDraftChange,
  scheduleValue,
  onScheduleChange,
  onLogOutreach,
  onStatusChange,
  onSaveNote,
  onCreateFollowup,
  onSaveExpectedDelivery,
  onMarkDone,
  savingKeys,
  adminUsers,
}: {
  task: LeadTaskItem;
  isExpanded: boolean;
  isHighlighted: boolean;
  onToggle: () => void;
  noteDraft: string;
  onNoteChange: (value: string) => void;
  followupDraft: { channel: string; dueAt: string; notes: string };
  onFollowupDraftChange: (patch: { channel?: string; dueAt?: string; notes?: string }) => void;
  scheduleValue: string;
  onScheduleChange: (value: string) => void;
  onLogOutreach: (channel: "whatsapp" | "call") => void;
  onStatusChange: (nextStatus: LeadStatus) => void;
  onSaveNote: () => void;
  onCreateFollowup: () => void;
  onSaveExpectedDelivery: () => void;
  onMarkDone: (() => void) | null;
  savingKeys: Record<string, boolean>;
  adminUsers: AdminUserOption[];
}) => {
  const whatsappUrl = buildWhatsAppUrl(task.phone);
  const lead = task.lead;
  const canUsePhoneActions = Boolean(task.phone);
  const assignedUser = lead.assigned_to ? adminUsers.find((user) => user.id === lead.assigned_to) ?? null : null;
  const assignedLabel = assignedUser ? assignedUser.full_name || assignedUser.email : "Unassigned";

  return (
    <Card
      id={getTaskDomId(task.taskId)}
      className={`border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(10,10,10,0.96))] p-4 transition ${
        isHighlighted ? "border-primary/40 shadow-[0_0_0_1px_rgba(245,181,43,0.22)]" : ""
      }`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={task.taskBadgeClass}>
              {task.taskLabel}
            </Badge>
            <Badge variant="outline" className={getStatusBadgeClass(lead.status)}>
              {formatTokenLabel(lead.status)}
            </Badge>
            <Badge variant="outline" className={getSourceBadgeClass(lead.sourceGroup)}>
              {formatTokenLabel(lead.sourceGroup)}
            </Badge>
            {task.packageLabel ? (
              <Badge variant="outline" className="border-white/10 bg-white/5 text-slate-200">
                {task.packageLabel}
              </Badge>
            ) : null}
          </div>

          <div className="space-y-1">
            <p className="text-lg font-semibold text-white">{lead.full_name || "Unnamed lead"}</p>
            {task.phone ? (
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <a href={`tel:${task.phone}`} className="text-slate-300 transition hover:text-white">
                  {task.phone}
                </a>
                {whatsappUrl ? (
                  <a href={whatsappUrl} target="_blank" rel="noreferrer" className="text-emerald-300 transition hover:text-emerald-200">
                    WhatsApp
                  </a>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-slate-400">{lead.email || "No contact route captured"}</p>
            )}
            <p className="text-xs text-slate-400">
              <span className="text-slate-500">Assigned to:</span> <span className="text-slate-200">{assignedLabel}</span>
            </p>
          </div>

          <div className="grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
            <p><span className="text-slate-500">Vehicle:</span> {task.vehicle || "Not captured"}</p>
            <div className="rounded-2xl border border-primary/20 bg-primary/10 p-3 sm:col-span-2">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className="text-[10px] uppercase tracking-[0.16em] text-primary/90">{task.timingLabel}</span>
                {task.timingAt &&
                task.timingLabel !== "Created" &&
                isDubaiToday(task.timingAt) ? (
                  <Badge variant="outline" className="border-amber-400/30 bg-amber-500/15 text-amber-200">
                    TODAY
                  </Badge>
                ) : null}
              </div>
              <p className="text-base font-semibold text-white">
                {task.timingAt ? formatLoudTaskDate(task.timingAt) : task.dueLabel}
              </p>
            </div>
            {lead.expected_delivery_at ? (
              <p><span className="text-slate-500">Expected delivery:</span> {formatTimestamp(lead.expected_delivery_at)}</p>
            ) : null}
            <p><span className="text-slate-500">Urgency:</span> {task.urgencyLabel}</p>
          </div>

          <p className="text-sm text-slate-300">{task.summary || "No quick context yet."}</p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2 lg:w-[220px] lg:justify-end">
          <Button type="button" size="sm" variant="outline" className="border-white/10 bg-black/20 text-white hover:bg-white/10" onClick={onToggle}>
            {isExpanded ? "Hide quick update" : "Quick update"}
          </Button>
          {onMarkDone ? (
            <Button type="button" size="sm" variant="outline" className="border-emerald-400/20 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20" onClick={onMarkDone} disabled={Boolean(savingKeys[`followup-status:${task.followupId}`])}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Mark done
            </Button>
          ) : null}
          <Button asChild type="button" size="sm" variant="outline" className="border-white/10 bg-black/20 text-white hover:bg-white/10">
            <Link to={`/admin/leads?lead=${lead.id}`}>Open full lead</Link>
          </Button>
        </div>
      </div>

      {isExpanded ? (
        <div className="mt-5 grid gap-4 rounded-2xl border border-white/10 bg-black/20 p-4 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                <Checkbox checked={Boolean(lead.first_whatsapp_contacted_at)} disabled={!canUsePhoneActions || Boolean(lead.first_whatsapp_contacted_at) || Boolean(savingKeys[`whatsapp:${lead.id}`])} onCheckedChange={(checked) => { if (checked && !lead.first_whatsapp_contacted_at) onLogOutreach("whatsapp"); }} className="mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-white">WhatsApp sent</p>
                  <p className="mt-1 text-xs text-slate-400">Use when first outreach is done.</p>
                </div>
              </label>

              <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                <Checkbox checked={Boolean(lead.first_called_at)} disabled={!canUsePhoneActions || Boolean(lead.first_called_at) || Boolean(savingKeys[`call:${lead.id}`])} onCheckedChange={(checked) => { if (checked && !lead.first_called_at) onLogOutreach("call"); }} className="mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-white">Customer called</p>
                  <p className="mt-1 text-xs text-slate-400">Use when the first call is completed.</p>
                </div>
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <div>
                <p className="mb-2 text-xs uppercase tracking-[0.16em] text-slate-500">Status</p>
                <Select value={lead.status} onValueChange={(value) => onStatusChange(value as LeadStatus)}>
                  <SelectTrigger className="h-9 border-white/10 bg-black/20 px-3 text-sm text-white">
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
                <p className="mb-2 text-xs uppercase tracking-[0.16em] text-slate-500">Expected delivery</p>
                <div className="flex gap-2">
                  <Input type="datetime-local" value={scheduleValue} onChange={(event) => onScheduleChange(event.target.value)} className="h-9 border-white/10 bg-black/20 px-3 text-sm text-white" />
                  <Button type="button" variant="outline" className="h-9 border-white/10 bg-black/20 px-3 text-sm text-white hover:bg-white/10" onClick={onSaveExpectedDelivery} disabled={Boolean(savingKeys[`delivery:${lead.id}`])}>
                    Save
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.16em] text-slate-500">Internal note</p>
              <Textarea value={noteDraft} onChange={(event) => onNoteChange(event.target.value)} placeholder="Call outcome, objection, budget note..." className="min-h-[96px] border-white/10 bg-black/20 text-sm text-white placeholder:text-slate-500" />
              <div className="mt-3 flex justify-end">
                <Button type="button" variant="outline" className="h-9 border-white/10 bg-black/20 px-3 text-sm text-white hover:bg-white/10" onClick={onSaveNote} disabled={Boolean(savingKeys[`note:${lead.id}`])}>
                  Save note
                </Button>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.16em] text-slate-500">Create follow-up</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Select value={followupDraft.channel} onValueChange={(value) => onFollowupDraftChange({ channel: value })}>
                  <SelectTrigger className="h-9 border-white/10 bg-black/20 px-3 text-sm text-white">
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
                <Input type="datetime-local" value={followupDraft.dueAt} onChange={(event) => onFollowupDraftChange({ dueAt: event.target.value })} className="h-9 border-white/10 bg-black/20 px-3 text-sm text-white" />
              </div>
              <Textarea value={followupDraft.notes} onChange={(event) => onFollowupDraftChange({ notes: event.target.value })} placeholder="What needs to happen next?" className="mt-3 min-h-[84px] border-white/10 bg-black/20 text-sm text-white placeholder:text-slate-500" />
              <div className="mt-3 flex justify-end">
                <Button type="button" variant="outline" className="h-9 border-white/10 bg-black/20 px-3 text-sm text-white hover:bg-white/10" onClick={onCreateFollowup} disabled={Boolean(savingKeys[`followup-create:${lead.id}`])}>
                  Create follow-up
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </Card>
  );
};

const AdminLeadTasks = () => {
  const {
    followupDrafts,
    adminUsers,
    handleAddNote,
    handleCreateFollowup,
    handleExpectedDeliverySave,
    handleFollowupStatusChange,
    handleLeadAssignment,
    handleLogOutreach,
    handleStatusChange,
    isLoading,
    isRefreshing,
    leadScheduleDrafts,
    loadLeadDesk,
    noteDrafts,
    savingKeys,
    setNoteDrafts,
    stagingLeads,
    taskItems,
    taskSummary,
    updateFollowupDraft,
    updateLeadScheduleDraft,
  } = useLeadTaskBoardData();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [taskFilter, setTaskFilter] = useState<TaskFilter>("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  const highlightedTaskId = useMemo(() => {
    const followupId = searchParams.get("followup");
    const leadId = searchParams.get("lead");
    if (followupId) return taskItems.find((task) => task.followupId === followupId)?.taskId ?? null;
    if (leadId) return taskItems.find((task) => task.leadId === leadId)?.taskId ?? null;
    return null;
  }, [searchParams, taskItems]);

  useEffect(() => {
    if (!highlightedTaskId) return;
    setExpandedTaskId(highlightedTaskId);
    window.setTimeout(() => {
      document.getElementById(getTaskDomId(highlightedTaskId))?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 120);
  }, [highlightedTaskId]);

  const filteredTasks = useMemo(() => {
    return taskItems.filter((task) => {
      const matchesFilter =
        taskFilter === "all" ||
        (taskFilter === "first_touch" && task.taskKind === "first_touch") ||
        (taskFilter === "phone_calls" && task.taskKind === "call") ||
        (taskFilter === "call_overdue" && task.priorityBand === "call_overdue") ||
        (taskFilter === "overdue" && ["call_overdue", "overdue"].includes(task.priorityBand)) ||
        (taskFilter === "due_today" &&
          (["call_due_today", "due_today"].includes(task.priorityBand) ||
            (task.timingAt &&
              ["Response due", "Call due", "Due"].includes(task.timingLabel) &&
              isDubaiToday(task.timingAt)))) ||
        (taskFilter === "open_later" && ["call_open", "open_later"].includes(task.priorityBand));

      const haystack = [task.title, task.summary, task.lead.full_name, task.phone, task.vehicle, task.packageLabel]
        .join(" ")
        .toLowerCase();
      const matchesSearch = haystack.includes(searchQuery.trim().toLowerCase());
      const matchesOwner =
        ownerFilter === "all" ||
        (ownerFilter === "unassigned" && !task.lead.assigned_to) ||
        task.lead.assigned_to === ownerFilter;
      return matchesFilter && matchesSearch && matchesOwner;
    });
  }, [ownerFilter, searchQuery, taskFilter, taskItems]);

  const filteredStagingLeads = useMemo(() => {
    return stagingLeads.filter((lead) => {
      if (ownerFilter === "all") return true;
      if (ownerFilter === "unassigned") return !lead.assigned_to;
      return lead.assigned_to === ownerFilter;
    });
  }, [ownerFilter, stagingLeads]);

  return (
    <AdminShell
      title="Task Board"
      description="This is the daily action queue for sales. New leads that still need first touch, pending phone calls, and open follow-ups stay here so the team can clear the desk fast without getting buried in full CRM detail."
    >
      <div className="grid gap-4 xl:grid-cols-5">
        <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(10,10,10,0.96))] p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Needs first touch</p>
          <p className="mt-3 text-3xl font-semibold text-white">{taskSummary.firstTouch}</p>
          <p className="mt-2 text-sm text-slate-400">Contactable leads still waiting for first outreach.</p>
        </Card>
        <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(10,10,10,0.96))] p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Phone calls</p>
          <p className="mt-3 text-3xl font-semibold text-white">{taskSummary.phoneCalls}</p>
          <p className="mt-2 text-sm text-slate-400">Leads that still need the first customer call.</p>
        </Card>
        <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(10,10,10,0.96))] p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Calls overdue</p>
          <p className="mt-3 text-3xl font-semibold text-white">{taskSummary.callOverdue}</p>
          <p className="mt-2 text-sm text-slate-400">First calls already outside the response window.</p>
        </Card>
        <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(10,10,10,0.96))] p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Due today</p>
          <p className="mt-3 text-3xl font-semibold text-white">{taskSummary.dueToday}</p>
          <p className="mt-2 text-sm text-slate-400">Calls and follow-ups that should be cleared before the day ends.</p>
        </Card>
        <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(10,10,10,0.96))] p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Open follow-ups</p>
          <p className="mt-3 text-3xl font-semibold text-white">{taskSummary.openFollowups}</p>
          <p className="mt-2 text-sm text-slate-400">All open follow-up tasks still sitting in the queue.</p>
        </Card>
      </div>

      <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(10,10,10,0.96))] p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Lead staging</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Assign unowned leads before queue work</h2>
            <p className="mt-2 text-sm text-slate-400">
              Any unassigned lead lands here first. Assign an owner so every lead has clear accountability in CRM and tasks.
            </p>
          </div>
          <Badge variant="outline" className="w-fit border-white/10 bg-black/20 text-slate-300">
            {filteredStagingLeads.length} unassigned lead{filteredStagingLeads.length === 1 ? "" : "s"}
          </Badge>
        </div>

        <div className="mt-5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Received</TableHead>
                <TableHead>Assign to</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-slate-400">Loading staging leads...</TableCell>
                </TableRow>
              ) : filteredStagingLeads.length ? (
                filteredStagingLeads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium text-white">{lead.full_name || "Unnamed lead"}</p>
                        <p className="text-xs text-slate-400">{lead.phone || lead.email || "No direct contact captured"}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getSourceBadgeClass(lead.sourceGroup)}>
                        {formatTokenLabel(lead.sourceGroup)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-300">{getLeadVehicleText(lead) || "Not captured"}</TableCell>
                    <TableCell className="text-slate-300">{formatTimestamp(lead.source_received_at || lead.submitted_at || lead.first_captured_at || lead.created_at)}</TableCell>
                    <TableCell>
                      <Select
                        value={lead.assigned_to || "unassigned"}
                        onValueChange={(value) => void handleLeadAssignment(lead.id, value)}
                      >
                        <SelectTrigger className="h-9 w-[220px] border-white/10 bg-black/20 text-white">
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
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-slate-400">
                    No unassigned leads right now.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(10,10,10,0.96))] p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Daily action queue</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Clear what matters next</h2>
            <p className="mt-2 text-sm text-slate-400">
              First-touch leads are ranked first, then overdue phone calls, then overdue follow-ups, then today's work, then the rest.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search name, phone, vehicle..." className="h-9 w-full border-white/10 bg-black/20 px-3 text-sm text-white placeholder:text-slate-500 sm:w-[260px]" />
            <Select value={ownerFilter} onValueChange={setOwnerFilter}>
              <SelectTrigger className="h-9 w-full border-white/10 bg-black/20 text-white sm:w-[220px]">
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
            <Button type="button" variant="outline" className="border-white/10 bg-black/20 text-white hover:bg-white/10" onClick={() => void loadLeadDesk(true)} disabled={isRefreshing}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Badge variant="outline" className="border-white/10 bg-black/20 text-slate-300">
            {getOwnerFilterLabel(ownerFilter, adminUsers)}
          </Badge>
          {taskFilterOptions.map((option) => (
            <Button key={option.value} type="button" size="sm" variant="outline" className={taskFilter === option.value ? "border-primary/30 bg-primary/10 text-primary" : "border-white/10 bg-black/20 text-slate-300 hover:bg-white/10"} onClick={() => setTaskFilter(option.value)}>
              {option.label}
            </Button>
          ))}
        </div>

        <div className="mt-6 space-y-4">
          {isLoading ? (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-sm text-slate-400">Loading task board...</div>
          ) : filteredTasks.length ? (
            filteredTasks.map((task) => {
              const followupDraft = followupDrafts[task.lead.id] ?? makeDefaultFollowupDraft(task.lead.assigned_to, undefined);
              const scheduleDraft = leadScheduleDrafts[task.lead.id] ?? makeLeadScheduleDraft(task.lead);
              return (
                <TaskCard
                  key={task.taskId}
                  task={task}
                  isExpanded={expandedTaskId === task.taskId}
                  isHighlighted={highlightedTaskId === task.taskId}
                  onToggle={() => setExpandedTaskId(expandedTaskId === task.taskId ? null : task.taskId)}
                  noteDraft={noteDrafts[task.lead.id] ?? ""}
                  onNoteChange={(value) => setNoteDrafts((current) => ({ ...current, [task.lead.id]: value }))}
                  followupDraft={followupDraft}
                  onFollowupDraftChange={(patch) => updateFollowupDraft(task.lead.id, patch, task.lead.assigned_to)}
                  scheduleValue={scheduleDraft.expectedDeliveryAt}
                  onScheduleChange={(value) => updateLeadScheduleDraft(task.lead, { expectedDeliveryAt: value })}
                  onLogOutreach={(channel) => void handleLogOutreach(task.lead, channel)}
                  onStatusChange={(nextStatus) => void handleStatusChange(task.lead, nextStatus)}
                  onSaveNote={() => void handleAddNote(task.lead)}
                  onCreateFollowup={() => void handleCreateFollowup(task.lead)}
                  onSaveExpectedDelivery={() => void handleExpectedDeliverySave(task.lead)}
                  onMarkDone={task.followup ? () => void handleFollowupStatusChange(task.lead.id, task.followup.id, "done") : null}
                  savingKeys={savingKeys}
                  adminUsers={adminUsers}
                />
              );
            })
          ) : (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-sm text-slate-400">
              No matching tasks right now. Adjust the filter or search, or come back after the next lead refresh.
            </div>
          )}
        </div>
      </Card>
    </AdminShell>
  );
};

export default AdminLeadTasks;
