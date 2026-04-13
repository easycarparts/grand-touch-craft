import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

type QueueRow = {
  id: string;
  alert_type: "new_lead" | "followup_created" | "followup_morning_digest";
  lead_id: string | null;
  followup_id: string | null;
  title: string;
  body: string;
};

type LeadAlertRow = {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  vehicle_label: string | null;
  source_platform: string | null;
  landing_page_variant: string | null;
  lead_source_type: string;
  status: string;
  quality_label: string;
  latest_quote_estimate: number | null;
  submitted_at: string | null;
  whatsapp_clicked_at: string | null;
  created_at: string | null;
  last_activity_at: string | null;
  utm_campaign: string | null;
  external_ad_name: string | null;
  external_campaign_name: string | null;
};

type FollowupAlertRow = {
  id: string;
  due_at: string | null;
  channel: string;
  notes: string | null;
  leads: LeadAlertRow | null;
};

type LeadSummaryRow = {
  id: string;
  full_name: string | null;
  phone: string | null;
  vehicle_label: string | null;
  source_platform: string | null;
  quality_label: string;
  latest_quote_estimate: number | null;
  created_at: string | null;
  last_activity_at: string | null;
};

type DigestFollowupRow = {
  id: string;
  due_at: string | null;
  channel: string;
  notes: string | null;
  leads: LeadSummaryRow | null;
};

type TelegramMessage = {
  message_id: number;
  text?: string;
  chat: {
    id: number;
    type: string;
    title?: string;
    username?: string;
    first_name?: string;
  };
};

type TelegramUpdate = {
  update_id: number;
  message?: TelegramMessage;
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const telegramBotToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
const defaultTelegramChatId = Deno.env.get("TELEGRAM_CHAT_ID");
const defaultTelegramThreadId = Deno.env.get("TELEGRAM_THREAD_ID");
const crmAlertsSecret = Deno.env.get("CRM_ALERTS_SECRET");
const telegramWebhookSecret = Deno.env.get("TELEGRAM_WEBHOOK_SECRET");

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing Supabase environment variables.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const escapeHtml = (value: string | null | undefined) =>
  (value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

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

const formatTimestamp = (value: string | null) => {
  if (!value) return "Not set";

  return new Intl.DateTimeFormat("en-AE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Dubai",
  }).format(new Date(value));
};

const formatCurrency = (value: number | null) =>
  value === null ? "Not unlocked" : `AED ${Math.round(value).toLocaleString("en-AE")}`;

const normalizePhone = (value: string | null) => (value ?? "").replace(/\D/g, "");

const toWhatsAppPhone = (value: string | null) => {
  let digits = normalizePhone(value);
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

const getWhatsAppLink = (phone: string | null) => {
  const normalized = toWhatsAppPhone(phone);
  if (!normalized) return null;
  return `https://wa.me/${normalized}`;
};

const formatSourceLabel = (sourcePlatform: string | null, leadSourceType?: string | null) => {
  const source = sourcePlatform || leadSourceType || "website";
  return source
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const getCampaignLabel = (lead: Pick<LeadAlertRow, "external_ad_name" | "utm_campaign" | "external_campaign_name">) =>
  lead.external_ad_name || lead.utm_campaign || lead.external_campaign_name || "No campaign captured";

const openLeadStatuses = ["new", "contacted", "qualified", "quoted"];

const getDubaiDayBounds = (daysFromToday = 0) => {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dubai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const year = Number(parts.find((part) => part.type === "year")?.value ?? "1970");
  const month = Number(parts.find((part) => part.type === "month")?.value ?? "01");
  const day = Number(parts.find((part) => part.type === "day")?.value ?? "01");

  const startUtc = new Date(Date.UTC(year, month - 1, day + daysFromToday, -4, 0, 0));
  const endUtc = new Date(startUtc.getTime() + 24 * 60 * 60 * 1000);

  return { startUtc, endUtc };
};

const sendTelegramMessage = async (
  html: string,
  options?: {
    chatId?: number | string;
    threadId?: number | string;
  },
) => {
  if (!telegramBotToken) {
    throw new Error("Missing TELEGRAM_BOT_TOKEN.");
  }

  const chatId = options?.chatId ?? defaultTelegramChatId;
  if (!chatId) {
    throw new Error("Missing TELEGRAM_CHAT_ID.");
  }

  const payload: Record<string, unknown> = {
    chat_id: chatId,
    text: html,
    parse_mode: "HTML",
    disable_web_page_preview: true,
  };

  const threadId = options?.threadId ?? defaultTelegramThreadId;
  if (threadId) {
    payload.message_thread_id = Number(threadId);
  }

  const response = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Telegram send failed with ${response.status}`);
  }
};

const fetchLeadAlertDetails = async (leadId: string) => {
  const { data, error } = await supabase
    .from("leads")
    .select(
      "id, full_name, phone, email, vehicle_label, source_platform, landing_page_variant, lead_source_type, status, quality_label, latest_quote_estimate, submitted_at, whatsapp_clicked_at, created_at, last_activity_at, utm_campaign, external_ad_name, external_campaign_name",
    )
    .eq("id", leadId)
    .maybeSingle();

  if (error) throw error;
  return (data as LeadAlertRow | null) ?? null;
};

const fetchFollowupAlertDetails = async (followupId: string) => {
  const { data, error } = await supabase
    .from("lead_followups")
    .select(
      "id, due_at, channel, notes, leads:lead_id(id, full_name, phone, email, vehicle_label, source_platform, landing_page_variant, lead_source_type, status, quality_label, latest_quote_estimate, submitted_at, whatsapp_clicked_at, created_at, last_activity_at, utm_campaign, external_ad_name, external_campaign_name)",
    )
    .eq("id", followupId)
    .maybeSingle();

  if (error) throw error;
  return (data as FollowupAlertRow | null) ?? null;
};

const buildWhatsAppCta = (phone: string | null) => {
  const link = getWhatsAppLink(phone);
  return link ? `\n<a href="${escapeHtml(link)}">💬 Open WhatsApp</a>` : "";
};

const buildNewLeadMessage = (lead: LeadAlertRow, titleFallback: string) => {
  const leadName = escapeHtml(lead.full_name || "Unnamed lead");
  const phone = escapeHtml(lead.phone || "No phone captured");
  const email = escapeHtml(lead.email || "No email captured");
  const vehicle = escapeHtml(collapseRepeatedPhrase(lead.vehicle_label) || "Vehicle not captured yet");
  const source = escapeHtml(formatSourceLabel(lead.source_platform, lead.lead_source_type));
  const estimate = escapeHtml(formatCurrency(lead.latest_quote_estimate));
  const campaign = escapeHtml(getCampaignLabel(lead));
  const leadState = lead.submitted_at ? "✅ Submitted lead" : "📝 Partial / manual lead";
  const whatsappState = lead.whatsapp_clicked_at ? "💬 WhatsApp clicked" : "💬 No WhatsApp click yet";

  return [
    `🆕 <b>${escapeHtml(titleFallback)}</b>`,
    "",
    `👤 <b>${leadName}</b>`,
    `📞 ${phone}`,
    `📧 ${email}`,
    `🚘 ${vehicle}`,
    "",
    `📍 <b>Source</b>: ${source}`,
    `🎯 <b>Campaign</b>: ${campaign}`,
    `💎 <b>Quality</b>: ${escapeHtml(lead.quality_label)}`,
    `📌 <b>Status</b>: ${escapeHtml(lead.status)}`,
    `💰 <b>Estimate</b>: ${estimate}`,
    "",
    `${leadState}`,
    `${whatsappState}`,
    `🕒 <b>Last activity</b>: ${escapeHtml(formatTimestamp(lead.last_activity_at || lead.created_at))}`,
    buildWhatsAppCta(lead.phone),
  ]
    .filter(Boolean)
    .join("\n");
};

const buildFollowupCreatedMessage = (followup: FollowupAlertRow, titleFallback: string) => {
  const lead = followup.leads;
  const leadName = escapeHtml(lead?.full_name || lead?.phone || "Unnamed lead");
  const phone = escapeHtml(lead?.phone || "No phone captured");
  const vehicle = escapeHtml(collapseRepeatedPhrase(lead?.vehicle_label) || "Vehicle not captured yet");
  const source = escapeHtml(formatSourceLabel(lead?.source_platform || null, lead?.lead_source_type || null));
  const notes = escapeHtml(followup.notes || "No follow-up notes");

  return [
    `📅 <b>${escapeHtml(titleFallback)}</b>`,
    "",
    `👤 <b>${leadName}</b>`,
    `📞 ${phone}`,
    `🚘 ${vehicle}`,
    `📍 ${source}`,
    "",
    `⏰ <b>Due</b>: ${escapeHtml(formatTimestamp(followup.due_at))}`,
    `📣 <b>Channel</b>: ${escapeHtml(followup.channel)}`,
    `📝 <b>Notes</b>: ${notes}`,
    buildWhatsAppCta(lead?.phone || null),
  ]
    .filter(Boolean)
    .join("\n");
};

const fetchLeadCount = async (statusFilter?: string, qualityFilter?: string) => {
  let query = supabase.from("leads").select("id", { count: "exact", head: true });

  query = query.not("status", "in", '("won","lost","junk")');

  if (statusFilter) {
    query = query.eq("status", statusFilter);
  }

  if (qualityFilter) {
    query = query.eq("quality_label", qualityFilter);
  }

  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
};

const fetchWarmLeadCount = async () => {
  const { count, error } = await supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .in("status", ["contacted", "qualified", "quoted"]);

  if (error) throw error;
  return count ?? 0;
};

const fetchQualifiedOpenCount = async () => {
  const { count, error } = await supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .in("status", ["qualified", "quoted"]);

  if (error) throw error;
  return count ?? 0;
};

const fetchUncontactedLeads = async () => {
  const { data, error } = await supabase
    .from("leads")
    .select(
      "id, full_name, phone, vehicle_label, source_platform, quality_label, latest_quote_estimate, created_at, last_activity_at",
    )
    .eq("status", "new")
    .order("last_activity_at", { ascending: false, nullsFirst: false })
    .limit(6);

  if (error) throw error;
  return (data as LeadSummaryRow[]) ?? [];
};

const fetchFollowupWindow = async (window: "overdue" | "today" | "tomorrow") => {
  const { startUtc, endUtc } = getDubaiDayBounds();
  const tomorrow = getDubaiDayBounds(1);

  let query = supabase
    .from("lead_followups")
    .select(
      "id, due_at, channel, notes, leads:lead_id(id, full_name, phone, vehicle_label, source_platform, quality_label, latest_quote_estimate, created_at, last_activity_at)",
    )
    .eq("status", "open")
    .not("due_at", "is", null);

  if (window === "overdue") {
    query = query.lt("due_at", startUtc.toISOString());
  } else if (window === "today") {
    query = query.gte("due_at", startUtc.toISOString()).lt("due_at", endUtc.toISOString());
  } else {
    query = query.gte("due_at", tomorrow.startUtc.toISOString()).lt("due_at", tomorrow.endUtc.toISOString());
  }

  const { data, error } = await query.order("due_at", { ascending: true }).limit(6);
  if (error) throw error;
  return (data as DigestFollowupRow[]) ?? [];
};

const renderLeadLine = (lead: LeadSummaryRow, index: number) => {
  const name = escapeHtml(lead.full_name || lead.phone || "Unnamed lead");
  const phone = escapeHtml(lead.phone || "No phone");
  const vehicle = escapeHtml(collapseRepeatedPhrase(lead.vehicle_label) || "No vehicle");
  const source = escapeHtml(formatSourceLabel(lead.source_platform, null));
  const estimate = escapeHtml(formatCurrency(lead.latest_quote_estimate));
  const whatsapp = getWhatsAppLink(lead.phone);

  return [
    `${index + 1}. <b>${name}</b>`,
    `   📞 ${phone}`,
    `   🚘 ${vehicle}`,
    `   📍 ${source} • 💎 ${escapeHtml(lead.quality_label)} • 💰 ${estimate}`,
    whatsapp ? `   <a href="${escapeHtml(whatsapp)}">💬 WhatsApp now</a>` : "",
  ]
    .filter(Boolean)
    .join("\n");
};

const renderFollowupLine = (followup: DigestFollowupRow, index: number, emoji: string) => {
  const lead = followup.leads;
  const name = escapeHtml(lead?.full_name || lead?.phone || "Unnamed lead");
  const vehicle = escapeHtml(collapseRepeatedPhrase(lead?.vehicle_label) || "No vehicle");
  const source = escapeHtml(formatSourceLabel(lead?.source_platform || null, null));
  const notes = escapeHtml(followup.notes || "No notes");
  const whatsapp = getWhatsAppLink(lead?.phone || null);

  return [
    `${index + 1}. <b>${name}</b> ${emoji}`,
    `   ⏰ ${escapeHtml(formatTimestamp(followup.due_at))}`,
    `   🚘 ${vehicle}`,
    `   📍 ${source} • 📣 ${escapeHtml(followup.channel)}`,
    `   📝 ${notes}`,
    whatsapp ? `   <a href="${escapeHtml(whatsapp)}">💬 WhatsApp now</a>` : "",
  ]
    .filter(Boolean)
    .join("\n");
};

const buildDailyDigestMessage = async () => {
  const [
    totalOpenLeads,
    uncontactedCount,
    highQualityOpen,
    warmLeadCount,
    qualifiedOpenCount,
    uncontactedLeads,
    overdueFollowups,
    todayFollowups,
    tomorrowFollowups,
  ] = await Promise.all([
    fetchLeadCount(),
    fetchLeadCount("new"),
    fetchLeadCount(undefined, "high"),
    fetchWarmLeadCount(),
    fetchQualifiedOpenCount(),
    fetchUncontactedLeads(),
    fetchFollowupWindow("overdue"),
    fetchFollowupWindow("today"),
    fetchFollowupWindow("tomorrow"),
  ]);

  const sections = [
    `🌅 <b>Grand Touch Daily Lead Brief</b>`,
    `📅 ${escapeHtml(formatTimestamp(new Date().toISOString()))}`,
    "",
    `📊 <b>Live stats</b>`,
    `• 🧲 Open leads: <b>${totalOpenLeads}</b>`,
    `• 📞 New / uncontacted: <b>${uncontactedCount}</b>`,
    `• 🔥 Warm leads: <b>${warmLeadCount}</b>`,
    `• 💎 High-quality open: <b>${highQualityOpen}</b>`,
    `• ✅ Qualified / quoted not closed: <b>${qualifiedOpenCount}</b>`,
    `• ⚠️ Overdue follow-ups: <b>${overdueFollowups.length}</b>`,
    `• 📅 Due today: <b>${todayFollowups.length}</b>`,
    `• ⏭️ Due tomorrow: <b>${tomorrowFollowups.length}</b>`,
    "",
    `📞 <b>Leads needing first contact</b>`,
    uncontactedLeads.length
      ? uncontactedLeads.map(renderLeadLine).join("\n\n")
      : "• No uncontacted leads right now.",
    "",
    `⚠️ <b>Overdue follow-ups</b>`,
    overdueFollowups.length
      ? overdueFollowups.map((item, index) => renderFollowupLine(item, index, "⚠️")).join("\n\n")
      : "• No overdue follow-ups.",
    "",
    `📅 <b>Follow-ups due today</b>`,
    todayFollowups.length
      ? todayFollowups.map((item, index) => renderFollowupLine(item, index, "📍")).join("\n\n")
      : "• No follow-ups due today.",
    "",
    `⏭️ <b>Follow-ups due tomorrow</b>`,
    tomorrowFollowups.length
      ? tomorrowFollowups.map((item, index) => renderFollowupLine(item, index, "⏭️")).join("\n\n")
      : "• No follow-ups due tomorrow.",
  ];

  return sections.join("\n");
};

const deliverQueuedAlerts = async () => {
  const { data, error } = await supabase
    .from("crm_alert_queue")
    .select("id, alert_type, lead_id, followup_id, title, body")
    .eq("delivery_status", "pending")
    .lte("available_at", new Date().toISOString())
    .order("created_at", { ascending: true })
    .limit(25);

  if (error) throw error;

  const alerts = (data as QueueRow[]) ?? [];
  let sent = 0;
  let failed = 0;

  for (const alert of alerts) {
    try {
      let message = `🔔 <b>${escapeHtml(alert.title)}</b>\n${escapeHtml(alert.body)}`;

      if (alert.alert_type === "new_lead" && alert.lead_id) {
        const lead = await fetchLeadAlertDetails(alert.lead_id);
        if (lead) {
          message = buildNewLeadMessage(lead, alert.title);
        }
      }

      if (alert.alert_type === "followup_created" && alert.followup_id) {
        const followup = await fetchFollowupAlertDetails(alert.followup_id);
        if (followup) {
          message = buildFollowupCreatedMessage(followup, alert.title);
        }
      }

      await sendTelegramMessage(message);

      const { error: updateError } = await supabase
        .from("crm_alert_queue")
        .update({
          delivery_status: "sent",
          delivery_attempts: 1,
          sent_at: new Date().toISOString(),
          last_error: null,
        })
        .eq("id", alert.id);

      if (updateError) throw updateError;
      sent += 1;
    } catch (deliveryError) {
      failed += 1;
      await supabase
        .from("crm_alert_queue")
        .update({
          delivery_status: "failed",
          delivery_attempts: 1,
          last_error:
            deliveryError instanceof Error ? deliveryError.message.slice(0, 500) : "Unknown error",
        })
        .eq("id", alert.id);
    }
  }

  return { processed: alerts.length, sent, failed };
};

const sendMorningDigest = async () => {
  const message = await buildDailyDigestMessage();

  try {
    await sendTelegramMessage(message);
    await supabase.from("crm_alert_queue").insert({
      alert_type: "followup_morning_digest",
      title: "Daily lead brief",
      body: message,
      payload: {},
      delivery_status: "sent",
      delivery_attempts: 1,
      sent_at: new Date().toISOString(),
    });

    return { sent: true };
  } catch (digestError) {
    await supabase.from("crm_alert_queue").insert({
      alert_type: "followup_morning_digest",
      title: "Daily lead brief",
      body: message,
      payload: {},
      delivery_status: "failed",
      delivery_attempts: 1,
      last_error: digestError instanceof Error ? digestError.message.slice(0, 500) : "Unknown error",
    });

    throw digestError;
  }
};

const parseCommand = (text: string | undefined) => {
  if (!text?.startsWith("/")) return null;
  return text.trim().split(/\s+/)[0].split("@")[0].toLowerCase();
};

const handleTelegramCommand = async (update: TelegramUpdate) => {
  const message = update.message;
  const command = parseCommand(message?.text);

  if (!message || !command) {
    return json({ ok: true, ignored: true });
  }

  const chatId = message.chat.id;

  if (command === "/start") {
    await sendTelegramMessage(
      "🤝 <b>Grand Touch Lead Agent is live</b>\n\nI can send instant CRM alerts and daily briefings.\n\nCommands:\n• /help\n• /today",
      { chatId },
    );
    return json({ ok: true, command });
  }

  if (command === "/help") {
    await sendTelegramMessage(
      "🧭 <b>Grand Touch Lead Agent commands</b>\n\n• /start - confirm the bot is connected\n• /help - show commands\n• /today - show the daily lead brief right now",
      { chatId },
    );
    return json({ ok: true, command });
  }

  if (command === "/today") {
    const summary = await buildDailyDigestMessage();
    await sendTelegramMessage(summary, { chatId });
    return json({ ok: true, command });
  }

  await sendTelegramMessage(
    "🤖 I know <b>/start</b>, <b>/help</b>, and <b>/today</b>.",
    { chatId },
  );

  return json({ ok: true, command: "unknown" });
};

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const body = await request.json().catch(() => ({}));
  const telegramSecretHeader = request.headers.get("x-telegram-bot-api-secret-token");
  const internalSecretHeader = request.headers.get("x-crm-alerts-secret");

  const isTelegramUpdate =
    typeof body === "object" &&
    body !== null &&
    "update_id" in body &&
    "message" in body;

  try {
    if (isTelegramUpdate) {
      if (!telegramWebhookSecret || telegramSecretHeader !== telegramWebhookSecret) {
        return json({ error: "Unauthorized telegram webhook" }, 401);
      }

      return await handleTelegramCommand(body as TelegramUpdate);
    }

    const mode = typeof body.mode === "string" ? body.mode : "deliver_queue";

    if (mode === "deliver_queue_public") {
      const result = await deliverQueuedAlerts();
      return json({ ok: true, mode, ...result });
    }

    if (!crmAlertsSecret || internalSecretHeader !== crmAlertsSecret) {
      return json({ error: "Unauthorized internal request" }, 401);
    }

    if (mode === "test") {
      await sendTelegramMessage(
        "✅ <b>Grand Touch CRM test</b>\nTelegram alerts are connected and ready.",
      );
      return json({ ok: true, mode, sent: true });
    }

    if (mode === "morning_digest") {
      const result = await sendMorningDigest();
      return json({ ok: true, mode, ...result });
    }

    const result = await deliverQueuedAlerts();
    return json({ ok: true, mode, ...result });
  } catch (error) {
    return json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});
