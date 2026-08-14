import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

type JsonObject = Record<string, unknown>;

type EasyAutoMessage = {
  id?: unknown;
  role?: unknown;
  text?: unknown;
  ts?: unknown;
};

type EasyAutoConversation = {
  id?: unknown;
  wa_phone?: unknown;
  persona?: unknown;
  status?: unknown;
  stage?: unknown;
  messages?: unknown;
  gt?: unknown;
  referral_source_id?: unknown;
  referral_headline?: unknown;
  referral_body?: unknown;
  ctwa_clid?: unknown;
  created_at?: unknown;
  updated_at?: unknown;
  last_message_at?: unknown;
};

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const intakeSecret = Deno.env.get("EASYAUTO_PPF_INTAKE_SECRET");

if (!supabaseUrl || !serviceRoleKey) throw new Error("Missing Supabase environment variables.");

const supabase = createClient(supabaseUrl, serviceRoleKey);

const json = (body: JsonObject, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const asObject = (value: unknown): JsonObject =>
  value !== null && typeof value === "object" && !Array.isArray(value) ? (value as JsonObject) : {};

const textOrNull = (value: unknown) => {
  const valueText = typeof value === "string" ? value.trim() : "";
  return valueText && valueText.toLowerCase() !== "unknown" ? valueText : null;
};

const normalizePhone = (value: unknown) => String(value ?? "").replace(/\D/g, "");

const normalizeTimestamp = (value: unknown, fallback = new Date().toISOString()) => {
  const parsed = new Date(String(value ?? ""));
  return Number.isNaN(parsed.getTime()) ? fallback : parsed.toISOString();
};

const PPF_SERVICES = new Set(["ppf_full", "ppf_partial", "mixed"]);
const PPF_INTENT_RE = /\b(ppf|paint protection|full[- ]?body|full protection|stone chip)\b|حماية الطلاء/i;
const JOB_RE = /\b(vacanc(?:y|ies)|job opening|looking for (?:a )?job|need (?:a )?job|apply for|my cv|resume|hiring|ppf installer|tint installer|polisher job|work with you)\b/i;
const HUMAN_RE = /\b(hamza|human|real person|actual person|agent|call me|talk to (?:a )?(?:person|human|someone))\b/i;

const eligibleConversation = (conversation: EasyAutoConversation) => {
  const gt = asObject(conversation.gt);
  const messages = Array.isArray(conversation.messages) ? (conversation.messages as EasyAutoMessage[]) : [];
  const userMessages = messages.filter((message) => message.role === "user" && textOrNull(message.text));
  const userText = userMessages.map((message) => String(message.text)).join("\n");
  const serviceType = textOrNull(gt.service_type);
  const offTopic = textOrNull(gt.off_topic);

  if (conversation.persona !== "gt_studio") return { eligible: false, reason: "wrong_persona" };
  if (!serviceType || !PPF_SERVICES.has(serviceType)) return { eligible: false, reason: "not_ppf" };
  if (offTopic) return { eligible: false, reason: `off_topic:${offTopic}` };
  if (JOB_RE.test(userText)) return { eligible: false, reason: "job_language" };

  const vehicleKnown = Boolean(textOrNull(gt.make) || textOrNull(gt.model_name));
  const quoteKnown = Boolean(textOrNull(gt.quoted_line) || textOrNull(gt.pkg_card_sent));
  const handoffKnown = Boolean(gt.handed_off || gt.customer_accepted || HUMAN_RE.test(userText));
  const paidPrefill = Boolean(textOrNull(conversation.referral_source_id) || textOrNull(conversation.ctwa_clid));
  const organicExplicitPpf = !paidPrefill && PPF_INTENT_RE.test(userText);
  const engaged = userMessages.length >= 2 || vehicleKnown || quoteKnown || handoffKnown || organicExplicitPpf;

  return { eligible: engaged, reason: engaged ? "engaged_ppf" : "prefill_or_unproven" };
};

const extractQuote = (gt: JsonObject, messages: EasyAutoMessage[]) => {
  const candidates = [textOrNull(gt.pkg_card_sent), ...messages.slice().reverse().map((message) => textOrNull(message.text))]
    .filter((value): value is string => Boolean(value));

  for (const candidate of candidates) {
    const preferred = candidate.match(/(?:🔥\s*\*?\s*|TOTAL\s+)AED\s*([0-9][0-9,]{2,})/i);
    const allAmounts = Array.from(candidate.matchAll(/AED\s*([0-9][0-9,]{2,})/gi));
    const chosen = preferred?.[1] ?? (allAmounts.length === 1 ? allAmounts[0][1] : null);
    if (!chosen) continue;
    const amount = Number(chosen.replaceAll(",", ""));
    if (Number.isFinite(amount) && amount >= 1000 && amount <= 100000) return amount;
  }

  return null;
};

const buildNotes = (input: {
  gt: JsonObject;
  latestCustomerMessage: string | null;
  quoteAmount: number | null;
}) => {
  const car = [textOrNull(input.gt.year), textOrNull(input.gt.make), textOrNull(input.gt.model_name)]
    .filter(Boolean)
    .join(" ");
  const packageLabel = [textOrNull(input.gt.quoted_line), textOrNull(input.gt.quoted_years) ? `${textOrNull(input.gt.quoted_years)}yr` : null]
    .filter(Boolean)
    .join(" ");

  return [
    "EasyAuto AI-qualified PPF enquiry",
    car ? `Vehicle: ${car}` : null,
    packageLabel ? `Package: ${packageLabel}` : null,
    input.quoteAmount ? `Quote: AED ${input.quoteAmount.toLocaleString("en-US")}` : null,
    textOrNull(input.gt.possession) ? `Possession: ${textOrNull(input.gt.possession)}` : null,
    textOrNull(input.gt.delivery_eta) ? `Delivery: ${textOrNull(input.gt.delivery_eta)}` : null,
    input.latestCustomerMessage ? `Latest: ${input.latestCustomerMessage.slice(0, 500)}` : null,
  ]
    .filter(Boolean)
    .join(" | ");
};

Deno.serve(async (request) => {
  try {
    if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
    if (!intakeSecret) return json({ error: "Intake secret is not configured" }, 503);
    if (request.headers.get("x-easyauto-ppf-secret") !== intakeSecret) return json({ error: "Unauthorized" }, 401);

    const payload = (await request.json()) as JsonObject;
    const conversation = asObject(payload.conversation) as EasyAutoConversation;
    const externalConversationId = textOrNull(conversation.id);
    const phoneDigits = normalizePhone(conversation.wa_phone);
    if (!externalConversationId || !phoneDigits) return json({ error: "Missing conversation id or phone" }, 400);

    const eligibility = eligibleConversation(conversation);
    if (!eligibility.eligible) return json({ ok: true, imported: false, reason: eligibility.reason });

    const gt = asObject(conversation.gt);
    const messages = Array.isArray(conversation.messages) ? (conversation.messages as EasyAutoMessage[]) : [];
    const validMessages = messages
      .map((message) => ({
        external_message_id: textOrNull(message.id),
        role: message.role === "assistant" ? "assistant" : message.role === "user" ? "user" : null,
        body: textOrNull(message.text),
        occurred_at: normalizeTimestamp(message.ts),
      }))
      .filter((message) => message.external_message_id && message.role && message.body);
    const latestCustomerMessage = validMessages.filter((message) => message.role === "user").at(-1)?.body ?? null;
    const sourceUpdatedAt = normalizeTimestamp(conversation.updated_at ?? conversation.last_message_at);

    const { data: existingConversation, error: conversationLookupError } = await supabase
      .from("easyauto_ppf_conversations")
      .select("lead_id, source_updated_at")
      .eq("external_conversation_id", externalConversationId)
      .maybeSingle();
    if (conversationLookupError) throw conversationLookupError;

    if (existingConversation?.source_updated_at && new Date(existingConversation.source_updated_at) > new Date(sourceUpdatedAt)) {
      return json({ ok: true, imported: false, reason: "stale_snapshot", leadId: existingConversation.lead_id });
    }

    let leadId = (existingConversation?.lead_id as string | undefined) ?? null;
    if (!leadId) {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: matchingLeads, error: matchingLeadError } = await supabase
        .from("leads")
        .select("id")
        .eq("normalized_phone", phoneDigits)
        .eq("funnel_name", "easyauto_whatsapp_ppf")
        .in("status", ["new", "contacted", "qualified", "quoted"])
        .gte("last_activity_at", sevenDaysAgo)
        .order("last_activity_at", { ascending: false })
        .limit(1);
      if (matchingLeadError) throw matchingLeadError;
      leadId = (matchingLeads?.[0]?.id as string | undefined) ?? null;
    }

    const quoteAmount = extractQuote(gt, messages);
    const quoted = Boolean(quoteAmount || textOrNull(gt.quoted_line) || textOrNull(gt.pkg_card_sent));
    const accepted = Boolean(gt.customer_accepted);
    const handedOff = Boolean(gt.handed_off);
    const userText = validMessages.filter((message) => message.role === "user").map((message) => message.body).join("\n");
    const humanRequested = HUMAN_RE.test(userText);
    const vehicleYear = textOrNull(gt.year);
    const vehicleMake = textOrNull(gt.make);
    const vehicleModel = textOrNull(gt.model_name);
    const sourceStatus = quoted ? "quoted" : "qualified";
    const sourceQualityLabel = accepted || handedOff || humanRequested ? "high" : "medium";
    const intentScore = accepted || handedOff ? 95 : humanRequested ? 90 : quoted ? 75 : 55;
    const sourceCreatedAt = normalizeTimestamp(conversation.created_at ?? validMessages[0]?.occurred_at);
    const phone = `+${phoneDigits}`;
    const notesSummary = buildNotes({ gt, latestCustomerMessage, quoteAmount });
    const importMetadata = {
      provider: "easyauto",
      source: "whatsapp_ai",
      external_conversation_id: externalConversationId,
      service_type: textOrNull(gt.service_type),
      finish: textOrNull(gt.finish),
      quoted_line: textOrNull(gt.quoted_line),
      quoted_years: textOrNull(gt.quoted_years),
      possession: textOrNull(gt.possession),
      delivery_eta: textOrNull(gt.delivery_eta),
      timeline: textOrNull(gt.timeline),
      buyer_focus: textOrNull(gt.buyer_focus),
      customer_accepted: accepted,
      handed_off: handedOff,
      human_requested: humanRequested,
      latest_customer_message: latestCustomerMessage,
      referral_source_id: textOrNull(conversation.referral_source_id),
      referral_headline: textOrNull(conversation.referral_headline),
      ctwa_clid: textOrNull(conversation.ctwa_clid),
    };

    let status = sourceStatus;
    let qualityLabel = sourceQualityLabel;
    if (leadId) {
      const { data: existingLeadState, error: existingLeadStateError } = await supabase
        .from("leads")
        .select("status, quality_label")
        .eq("id", leadId)
        .maybeSingle();
      if (existingLeadStateError) throw existingLeadStateError;

      if (existingLeadState && ["contacted", "won", "lost", "junk"].includes(existingLeadState.status)) {
        status = existingLeadState.status;
      }
      if (existingLeadState && ["high", "spam"].includes(existingLeadState.quality_label)) {
        qualityLabel = existingLeadState.quality_label;
      }
    }

    const leadUpdate = {
      phone,
      vehicle_make: vehicleMake,
      vehicle_model: vehicleModel,
      vehicle_year: vehicleYear,
      source_platform: textOrNull(conversation.referral_source_id) ? "meta" : "whatsapp",
      landing_page_variant: "easyauto_ai_whatsapp",
      funnel_name: "easyauto_whatsapp_ppf",
      lead_source_type: "api_import",
      status,
      quality_label: qualityLabel,
      intent_score: intentScore,
      latest_quote_estimate: quoteAmount,
      utm_source: textOrNull(conversation.referral_source_id) ? "meta" : "easyauto",
      utm_medium: textOrNull(conversation.referral_source_id) ? "paid_social" : "whatsapp",
      utm_campaign: textOrNull(conversation.referral_headline),
      external_ad_id: textOrNull(conversation.referral_source_id),
      external_ad_name: textOrNull(conversation.referral_headline),
      external_campaign_name: textOrNull(conversation.referral_headline),
      source_received_at: sourceCreatedAt,
      last_activity_at: sourceUpdatedAt,
      notes_summary: notesSummary,
      import_metadata: importMetadata,
    };

    if (!leadId) {
      const { data: insertedLead, error: insertLeadError } = await supabase
        .from("leads")
        .insert({
          ...leadUpdate,
          external_lead_id: `easyauto:${externalConversationId}`,
          first_captured_at: sourceCreatedAt,
          submitted_at: sourceCreatedAt,
        })
        .select("id")
        .single();
      if (insertLeadError) throw insertLeadError;
      leadId = insertedLead.id as string;
    } else {
      const { error: updateLeadError } = await supabase.from("leads").update(leadUpdate).eq("id", leadId);
      if (updateLeadError) throw updateLeadError;
    }

    const { error: upsertConversationError } = await supabase.from("easyauto_ppf_conversations").upsert({
      external_conversation_id: externalConversationId,
      lead_id: leadId,
      wa_phone: phoneDigits,
      source_status: textOrNull(conversation.status),
      source_stage: textOrNull(conversation.stage),
      service_type: textOrNull(gt.service_type),
      latest_customer_message: latestCustomerMessage,
      referral_source_id: textOrNull(conversation.referral_source_id),
      referral_headline: textOrNull(conversation.referral_headline),
      referral_body: textOrNull(conversation.referral_body),
      ctwa_clid: textOrNull(conversation.ctwa_clid),
      gt_state: gt,
      source_created_at: sourceCreatedAt,
      source_updated_at: sourceUpdatedAt,
      received_at: new Date().toISOString(),
    });
    if (upsertConversationError) throw upsertConversationError;

    if (validMessages.length) {
      const { error: upsertMessagesError } = await supabase.from("easyauto_ppf_messages").upsert(
        validMessages.map((message) => ({
          external_conversation_id: externalConversationId,
          lead_id: leadId,
          external_message_id: message.external_message_id,
          role: message.role,
          body: message.body,
          occurred_at: message.occurred_at,
        })),
        { onConflict: "external_conversation_id,external_message_id", ignoreDuplicates: false },
      );
      if (upsertMessagesError) throw upsertMessagesError;
    }

    return json({ ok: true, imported: true, leadId, messageCount: validMessages.length });
  } catch (error) {
    console.error("easyauto-ppf-intake failed", error);
    return json({ error: error instanceof Error ? error.message : "Unknown intake error" }, 500);
  }
});
