import type { Dispatch, SetStateAction } from "react";
import { CheckCircle2, Trash2 } from "lucide-react";

import { G700BuildSummaryCard } from "@/components/admin/G700BuildSummaryCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type {
  AdminUserOption,
  FollowupDraft,
  LeadDetailsDraft,
  LeadQuality,
  LeadScheduleDraft,
  LeadStatus,
  LeadTaskLead,
} from "@/lib/admin-lead-tasks";
import {
  buildWhatsAppUrl,
  followupChannelOptions,
  formatCurrency,
  formatDurationMs,
  formatMetaLeadChoice,
  formatSectionName,
  formatTimestamp,
  formatTokenLabel,
  getFeedbackBadgeClass,
  getFollowupBadgeClass,
  getLeadCampaignLabel,
  getLeadIntentPresentation,
  getLeadReceivedAt,
  getLeadVehicleText,
  getQualityBadgeClass,
  getResponseSlaState,
  getSourceBadgeClass,
  getStatusBadgeClass,
  leadQualityOptions,
  leadStatusOptions,
  makeDefaultFollowupDraft,
  makeLeadDetailsDraft,
  makeLeadScheduleDraft,
  readImportMetadataValue,
  readMetaFeedbackError,
  withAlpha,
  formatDueLabel,
} from "@/lib/admin-lead-tasks";

const compactSelectTriggerClass = "h-9 border-white/10 bg-black/20 px-3 text-sm text-white";
const compactInputClass = "h-9 border-white/10 bg-black/20 px-3 text-sm text-white placeholder:text-slate-500";
const compactTextareaClass = "min-h-[96px] border-white/10 bg-black/20 text-sm text-white placeholder:text-slate-500";
const compactButtonClass = "h-9 border-white/10 bg-black/20 px-3 text-sm text-white hover:bg-white/10";

export type AdminLeadExpandedPanelProps = {
  lead: LeadTaskLead;
  adminUsers: AdminUserOption[];
  adminUsersById: Map<string, AdminUserOption>;
  adminProfile: { id: string } | null;
  estimateDrafts: Record<string, string>;
  setEstimateDrafts: Dispatch<SetStateAction<Record<string, string>>>;
  noteDrafts: Record<string, string>;
  setNoteDrafts: Dispatch<SetStateAction<Record<string, string>>>;
  followupDrafts: Record<string, FollowupDraft>;
  updateFollowupDraft: (leadId: string, patch: Partial<FollowupDraft>, assignedTo: string | null) => void;
  leadDetailsDrafts: Record<string, LeadDetailsDraft>;
  setLeadDetailsDrafts: Dispatch<SetStateAction<Record<string, LeadDetailsDraft>>>;
  updateLeadDetailsDraft: (lead: LeadTaskLead, patch: Partial<LeadDetailsDraft>) => void;
  leadScheduleDrafts: Record<string, LeadScheduleDraft>;
  updateLeadScheduleDraft: (lead: LeadTaskLead, patch: Partial<LeadScheduleDraft>) => void;
  setLeadScheduleDrafts: Dispatch<SetStateAction<Record<string, LeadScheduleDraft>>>;
  savingKeys: Record<string, boolean>;
  onStatusChange: (lead: LeadTaskLead, nextStatus: LeadStatus, reason?: string) => void;
  onQualityChange: (lead: LeadTaskLead, nextQuality: LeadQuality) => void;
  onLogOutreach: (lead: LeadTaskLead, channel: "whatsapp" | "call") => void;
  onLeadAssignment: (lead: LeadTaskLead, nextAssignedTo: string) => void;
  onEstimateSave: (lead: LeadTaskLead) => void;
  onExpectedDeliverySave: (lead: LeadTaskLead) => void;
  onAddNote: (lead: LeadTaskLead) => void;
  onCreateFollowup: (lead: LeadTaskLead) => void;
  onFollowupStatusChange: (leadId: string, followupId: string, status: "open" | "done" | "cancelled") => void;
  onLeadDetailsSave: (lead: LeadTaskLead) => void;
  onRequestDeleteLead: (lead: LeadTaskLead) => void;
};

export function AdminLeadExpandedPanel(props: AdminLeadExpandedPanelProps) {
  const {
    lead,
    adminUsers,
    adminUsersById,
    adminProfile,
    estimateDrafts,
    setEstimateDrafts,
    noteDrafts,
    setNoteDrafts,
    followupDrafts,
    updateFollowupDraft,
    leadDetailsDrafts,
    setLeadDetailsDrafts,
    updateLeadDetailsDraft,
    leadScheduleDrafts,
    updateLeadScheduleDraft,
    setLeadScheduleDrafts,
    savingKeys,
    onStatusChange,
    onQualityChange,
    onLogOutreach,
    onLeadAssignment,
    onEstimateSave,
    onExpectedDeliverySave,
    onAddNote,
    onCreateFollowup,
    onFollowupStatusChange,
    onLeadDetailsSave,
    onRequestDeleteLead,
  } = props;

  const vehicle = getLeadVehicleText(lead);
  const requestedProtection = readImportMetadataValue(lead.import_metadata, "protection_level");
  const deliveryStatus = readImportMetadataValue(lead.import_metadata, "delivery_status");
  const whatsappUrl = buildWhatsAppUrl(lead.phone);
  const latestNote = lead.notes[0] ?? null;
  const leadDetailsDraft = leadDetailsDrafts[lead.id] ?? makeLeadDetailsDraft(lead);
  const leadScheduleDraft = leadScheduleDrafts[lead.id] ?? makeLeadScheduleDraft(lead);
  const pendingMetaFeedback = lead.feedback.filter((entry) => entry.platform === "meta" && entry.feedback_status === "pending");
  const savingDelete = Boolean(savingKeys[`delete:${lead.id}`]);
  const whatsappSla = getResponseSlaState(lead, "whatsapp");
  const callSla = getResponseSlaState(lead, "call");
  const intentPresentation = getLeadIntentPresentation(lead);
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
  const leadReceivedAt = getLeadReceivedAt(lead);

  const handleStatusChange = onStatusChange;
  const handleQualityChange = onQualityChange;
  const handleLogOutreach = onLogOutreach;
  const handleLeadAssignment = onLeadAssignment;
  const handleEstimateSave = onEstimateSave;
  const handleExpectedDeliverySave = onExpectedDeliverySave;
  const handleAddNote = onAddNote;
  const handleCreateFollowup = onCreateFollowup;
  const handleFollowupStatusChange = onFollowupStatusChange;
  const handleLeadDetailsSave = onLeadDetailsSave;
  const setLeadPendingDelete = (row: LeadTaskLead) => {
    onRequestDeleteLead(row);
  };

  return (
    <div className="py-2">
﻿                              <Tabs defaultValue="overview" className="space-y-4">
                                <TabsList className="h-10 border border-white/10 bg-black/20 p-1">
                                  <TabsTrigger value="overview" className="text-sm">
                                    Overview
                                  </TabsTrigger>
                                  <TabsTrigger value="actions" className="text-sm">
                                    Update CRM
                                  </TabsTrigger>
                                  <TabsTrigger value="history" className="text-sm">
                                    Activity
                                  </TabsTrigger>
                                </TabsList>

                                <TabsContent value="overview" className="space-y-4">
                                  <Card className="border-white/10 bg-black/20 p-4">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                      <div>
                                        <p className="text-sm uppercase tracking-[0.18em] text-slate-400">
                                          Quick Update
                                        </p>
                                        <p className="mt-2 text-sm text-slate-300">
                                          Keep the sales workflow, ownership, outreach, and next move visible first.
                                        </p>
                                      </div>
                                      <div className="flex flex-wrap gap-2">
                                        <Badge variant="outline" className={getStatusBadgeClass(lead.status)}>
                                          {formatTokenLabel(lead.status)}
                                        </Badge>
                                        <Badge variant="outline" className={getQualityBadgeClass(lead.quality_label)}>
                                          {formatTokenLabel(lead.quality_label)}
                                        </Badge>
                                        <Badge variant="outline" className={getFollowupBadgeClass(lead.followupState)}>
                                          {followupLabel}
                                        </Badge>
                                      </div>
                                    </div>

                                    <div className="mt-4 grid gap-3 lg:grid-cols-3">
                                      <div className="space-y-1.5">
                                        <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Status</p>
                                        <Select value={lead.status} onValueChange={(value) => void handleStatusChange(lead, value as LeadStatus)}>
                                          <SelectTrigger className={compactSelectTriggerClass}>
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

                                      <div className="space-y-1.5">
                                        <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Quality</p>
                                        <Select value={lead.quality_label} onValueChange={(value) => void handleQualityChange(lead, value as LeadQuality)}>
                                          <SelectTrigger className={compactSelectTriggerClass}>
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

                                      <div className="space-y-1.5">
                                        <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Owner</p>
                                        <Select value={lead.assigned_to || "unassigned"} onValueChange={(value) => void handleLeadAssignment(lead, value)}>
                                          <SelectTrigger className={compactSelectTriggerClass}>
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
                                    </div>

                                    <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto_1fr_auto]">
                                      <div className="space-y-1.5">
                                        <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Quoted amount (AED)</p>
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
                                          className={compactInputClass}
                                        />
                                      </div>
                                      <div className="flex items-end">
                                        <Button
                                          type="button"
                                          variant="outline"
                                          className={compactButtonClass}
                                          onClick={() => void handleEstimateSave(lead)}
                                          disabled={Boolean(savingKeys[`estimate:${lead.id}`])}
                                        >
                                          Save
                                        </Button>
                                      </div>

                                      <div className="space-y-1.5">
                                        <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Expected delivery</p>
                                        <Input
                                          type="datetime-local"
                                          value={leadScheduleDraft.expectedDeliveryAt}
                                          onChange={(event) =>
                                            updateLeadScheduleDraft(lead, {
                                              expectedDeliveryAt: event.target.value,
                                            })
                                          }
                                          className={compactInputClass}
                                        />
                                      </div>
                                      <div className="flex items-end">
                                        <Button
                                          type="button"
                                          variant="outline"
                                          className={compactButtonClass}
                                          onClick={() => void handleExpectedDeliverySave(lead)}
                                          disabled={Boolean(savingKeys[`delivery:${lead.id}`])}
                                        >
                                          Save
                                        </Button>
                                      </div>
                                    </div>

                                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                      <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
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
                                          <div className="mt-2 flex flex-wrap gap-2">
                                            <Badge variant="outline" className={whatsappSla.badgeClass}>
                                              {whatsappSla.elapsedLabel}
                                            </Badge>
                                            <Badge variant="outline" className="border-white/10 bg-white/5 text-slate-300">
                                              {whatsappSla.dueLabel}
                                            </Badge>
                                          </div>
                                        </div>
                                      </label>

                                      <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                                        <Checkbox
                                          checked={Boolean(lead.first_called_at)}
                                          disabled={Boolean(lead.first_called_at) || Boolean(savingKeys[`call:${lead.id}`])}
                                          onCheckedChange={(checked) => {
                                            if (checked && !lead.first_called_at) {
                                              void handleLogOutreach(lead, "call");
                                            }
                                          }}
                                          className="mt-0.5"
                                        />
                                        <div className="min-w-0">
                                          <p className="text-sm font-medium text-white">Customer called</p>
                                          <div className="mt-2 flex flex-wrap gap-2">
                                            <Badge variant="outline" className={callSla.badgeClass}>
                                              {callSla.elapsedLabel}
                                            </Badge>
                                            <Badge variant="outline" className="border-white/10 bg-white/5 text-slate-300">
                                              {callSla.dueLabel}
                                            </Badge>
                                          </div>
                                        </div>
                                      </label>
                                    </div>

                                    <div className="mt-4 flex flex-wrap gap-2">
                                      {lead.status !== "contacted" ? (
                                        <Button type="button" size="sm" variant="outline" className={compactButtonClass} onClick={() => void handleStatusChange(lead, "contacted", "Marked contacted from overview")}>
                                          Mark contacted
                                        </Button>
                                      ) : null}
                                      {lead.status !== "qualified" ? (
                                        <Button type="button" size="sm" variant="outline" className={compactButtonClass} onClick={() => void handleStatusChange(lead, "qualified", "Qualified from overview")}>
                                          Mark qualified
                                        </Button>
                                      ) : null}
                                      {lead.status !== "quoted" ? (
                                        <Button type="button" size="sm" variant="outline" className={compactButtonClass} onClick={() => void handleStatusChange(lead, "quoted", "Quote sent or prepared")}>
                                          Mark quoted
                                        </Button>
                                      ) : null}
                                      {lead.status !== "won" ? (
                                        <Button type="button" size="sm" variant="outline" className="h-9 border-emerald-400/20 bg-emerald-500/10 px-3 text-sm text-emerald-200 hover:bg-emerald-500/20" onClick={() => void handleStatusChange(lead, "won", "Won from overview")}>
                                          Mark won
                                        </Button>
                                      ) : null}
                                      {lead.status !== "lost" ? (
                                        <Button type="button" size="sm" variant="outline" className="h-9 border-rose-400/20 bg-rose-500/10 px-3 text-sm text-rose-200 hover:bg-rose-500/20" onClick={() => void handleStatusChange(lead, "lost", "Lost from overview")}>
                                          Mark lost
                                        </Button>
                                      ) : null}
                                    </div>
                                  </Card>

                                  <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
                                    <Card className="border-white/10 bg-black/20 p-4">
                                      <p className="text-sm uppercase tracking-[0.18em] text-slate-400">
                                        Decision Snapshot
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
                                          {lead.assignedAdmin ? (
                                            <span
                                              className="inline-flex items-center rounded-full border px-2 py-0.5 font-medium"
                                              style={{
                                                borderColor: withAlpha(lead.assignedAdmin.owner_color, "55"),
                                                backgroundColor: withAlpha(lead.assignedAdmin.owner_color, "1A"),
                                                color: lead.assignedAdmin.owner_color,
                                              }}
                                            >
                                              {lead.assignedAdmin.full_name || lead.assignedAdmin.email}
                                            </span>
                                          ) : (
                                            <span className="text-white">Unassigned</span>
                                          )}
                                        </p>
                                        <p>
                                          <span className="text-slate-500">Next follow-up:</span>{" "}
                                          <span className="text-white">{formatDueLabel(lead.nextOpenFollowup)}</span>
                                        </p>
                                        <p>
                                          <span className="text-slate-500">Intent:</span>{" "}
                                          <span className="text-white">{intentPresentation.valueLabel}</span>
                                        </p>
                                        <p>
                                          <span className="text-slate-500">Estimate:</span>{" "}
                                          <span className="text-white">{formatCurrency(lead.latest_quote_estimate)}</span>
                                        </p>
                                        <p>
                                          <span className="text-slate-500">Lead received:</span>{" "}
                                          <span className="text-white">{formatTimestamp(leadReceivedAt)}</span>
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
                                        <p className="text-xs text-slate-500">{intentPresentation.helper}</p>
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
                                          <span className="text-white">
                                            {lead.isMetaOriginated && !lead.latestRollup
                                              ? "Meta-only lead"
                                              : lead.matchingSessions}
                                          </span>
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
                                  </div>

                                  <G700BuildSummaryCard lead={lead} />

                                  <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
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
                                        Next Action
                                      </p>
                                      <div className="mt-4 space-y-3 text-sm text-slate-300">
                                        <p>
                                          <span className="text-slate-500">Best next move:</span>{" "}
                                          <span className="text-white">
                                            {lead.nextOpenFollowup
                                              ? `${formatTokenLabel(lead.nextOpenFollowup.channel)} by ${formatDueLabel(lead.nextOpenFollowup)}`
                                              : "No follow-up set yet"}
                                          </span>
                                        </p>
                                        <p>
                                          <span className="text-slate-500">Meta signal:</span>{" "}
                                          <span className="text-white">
                                            {pendingMetaFeedback.length
                                              ? pendingMetaFeedback
                                                  .map((entry) => formatTokenLabel(entry.feedback_type))
                                                  .join(", ")
                                              : "Nothing queued"}
                                          </span>
                                        </p>
                                        <p>
                                          <span className="text-slate-500">Latest note:</span>{" "}
                                          <span className="text-white">
                                            {latestNote?.body || lead.notes_summary || "No note saved yet"}
                                          </span>
                                        </p>
                                        <p className="text-xs text-slate-500">
                                          Source details, browsing behaviour, and technical attribution now live in Activity.
                                        </p>
                                      </div>
                                    </Card>
                                  </div>
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
                                            <SelectTrigger className={compactSelectTriggerClass}>
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
                                            <SelectTrigger className={compactSelectTriggerClass}>
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
                                            <SelectTrigger className={compactSelectTriggerClass}>
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
                                              className={compactInputClass}
                                            />
                                            <Button
                                              type="button"
                                              variant="outline"
                                              className={compactButtonClass}
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
                                              <p className="mt-1 text-xs text-slate-400">
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
                                              <p className="mt-1 text-xs text-slate-400">
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
                                              className={compactButtonClass}
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
                                              className={compactButtonClass}
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
                                              className={compactButtonClass}
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
                                              className="h-8 border-emerald-400/20 bg-emerald-500/10 px-3 text-xs text-emerald-200 hover:bg-emerald-500/20"
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
                                              className="h-8 border-rose-400/20 bg-rose-500/10 px-3 text-xs text-rose-200 hover:bg-rose-500/20"
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
                                              className="h-8 border-slate-400/20 bg-slate-500/10 px-3 text-xs text-slate-300 hover:bg-slate-500/20"
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
                                            className="h-8 border-rose-500/30 bg-rose-500/10 px-3 text-xs text-rose-200 hover:bg-rose-500/20"
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
                                            className={compactInputClass}
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
                                              className={compactButtonClass}
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
                                          className={`mt-4 ${compactTextareaClass}`}
                                        />
                                        <div className="mt-3 flex items-center justify-between gap-3">
                                          <p className="text-xs text-slate-500">
                                            Latest note summary updates the lead row automatically.
                                          </p>
                                          <Button
                                            type="button"
                                            variant="outline"
                                            className={compactButtonClass}
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
                                              <SelectTrigger className={compactSelectTriggerClass}>
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
                                              <SelectTrigger className={compactSelectTriggerClass}>
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
                                              className={compactInputClass}
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
                                          className={`mt-4 ${compactTextareaClass}`}
                                        />

                                        <div className="mt-3 flex justify-end">
                                          <Button
                                            type="button"
                                            variant="outline"
                                            className={compactButtonClass}
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
                                  <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr_1.1fr]">
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
                                          <Badge
                                            variant="outline"
                                            className="border-sky-400/20 bg-sky-500/10 text-sky-200"
                                          >
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
                                          <span className="text-white">{getLeadCampaignLabel(lead) || "Not captured"}</span>
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
                                            No Meta feedback row yet. Qualifying, losing, junking, or winning a Meta
                                            lead will queue the recommended feedback state here.
                                          </p>
                                        )}
                                      </div>
                                    </Card>

                                    <Card className="border-white/10 bg-black/20 p-4">
                                      <p className="text-sm uppercase tracking-[0.18em] text-slate-400">
                                        Engagement Snapshot
                                      </p>
                                      <div className="mt-4 grid gap-3 text-sm text-slate-300">
                                        <p>
                                          <span className="text-slate-500">Intent:</span>{" "}
                                          <span className="text-white">{intentPresentation.valueLabel}</span>
                                        </p>
                                        <p className="text-xs text-slate-500">{intentPresentation.helper}</p>
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

                                    <Card className="border-white/10 bg-black/20 p-4">
                                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                        <div>
                                          <p className="text-sm uppercase tracking-[0.18em] text-slate-400">
                                            Customer details
                                          </p>
                                          <p className="mt-2 text-sm text-slate-300">
                                            Deeper contact and vehicle edits live here, away from the sales triage view.
                                          </p>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                          <Button
                                            type="button"
                                            variant="outline"
                                            className={compactButtonClass}
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
                                            variant="outline"
                                            className={compactButtonClass}
                                            onClick={() => void handleLeadDetailsSave(lead)}
                                            disabled={Boolean(savingKeys[`details:${lead.id}`])}
                                          >
                                            Save details
                                          </Button>
                                        </div>
                                      </div>

                                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                        <div className="space-y-1.5">
                                          <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Full name</p>
                                          <Input
                                            value={leadDetailsDraft.fullName}
                                            onChange={(event) =>
                                              updateLeadDetailsDraft(lead, { fullName: event.target.value })
                                            }
                                            placeholder="Customer name"
                                            className={compactInputClass}
                                          />
                                        </div>
                                        <div className="space-y-1.5">
                                          <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Phone</p>
                                          <Input
                                            value={leadDetailsDraft.phone}
                                            onChange={(event) =>
                                              updateLeadDetailsDraft(lead, { phone: event.target.value })
                                            }
                                            placeholder="+971..."
                                            className={compactInputClass}
                                          />
                                        </div>
                                        <div className="space-y-1.5 sm:col-span-2">
                                          <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Email</p>
                                          <Input
                                            value={leadDetailsDraft.email}
                                            onChange={(event) =>
                                              updateLeadDetailsDraft(lead, { email: event.target.value })
                                            }
                                            placeholder="name@example.com"
                                            className={compactInputClass}
                                          />
                                        </div>
                                        <div className="space-y-1.5">
                                          <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Vehicle make</p>
                                          <Input
                                            value={leadDetailsDraft.vehicleMake}
                                            onChange={(event) =>
                                              updateLeadDetailsDraft(lead, { vehicleMake: event.target.value })
                                            }
                                            placeholder="Mercedes"
                                            className={compactInputClass}
                                          />
                                        </div>
                                        <div className="space-y-1.5">
                                          <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Vehicle model</p>
                                          <Input
                                            value={leadDetailsDraft.vehicleModel}
                                            onChange={(event) =>
                                              updateLeadDetailsDraft(lead, { vehicleModel: event.target.value })
                                            }
                                            placeholder="G700"
                                            className={compactInputClass}
                                          />
                                        </div>
                                        <div className="space-y-1.5">
                                          <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Vehicle year</p>
                                          <Input
                                            value={leadDetailsDraft.vehicleYear}
                                            onChange={(event) =>
                                              updateLeadDetailsDraft(lead, { vehicleYear: event.target.value })
                                            }
                                            placeholder="2026"
                                            className={compactInputClass}
                                          />
                                        </div>
                                        <div className="space-y-1.5">
                                          <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Vehicle label</p>
                                          <Input
                                            value={leadDetailsDraft.vehicleLabel}
                                            onChange={(event) =>
                                              updateLeadDetailsDraft(lead, { vehicleLabel: event.target.value })
                                            }
                                            placeholder="2026 Mercedes G700"
                                            className={compactInputClass}
                                          />
                                        </div>
                                      </div>
                                    </Card>
                                  </div>

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
                                                    {author?.full_name || author?.email || "Admin"} â€¢{" "}
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
                                                    {author?.full_name || author?.email || "Admin"} â€¢{" "}
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
  );
}
