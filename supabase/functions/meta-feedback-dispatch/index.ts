import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

type FeedbackRow = {
  id: string;
  lead_id: string;
  platform: "meta";
  feedback_type: "qualified_lead" | "disqualified_lead" | "won_job" | "lost_job";
  feedback_status: "pending" | "sent" | "failed";
  payload: Record<string, unknown>;
  response_payload: Record<string, unknown>;
  created_at: string;
  leads: {
    id: string;
    full_name: string | null;
    phone: string | null;
    email: string | null;
    source_platform: string | null;
    landing_page_variant: string | null;
    latest_quote_estimate: number | null;
    fbclid: string | null;
    external_lead_id: string | null;
    external_campaign_name: string | null;
    source_received_at: string | null;
    submitted_at: string | null;
    created_at: string;
  } | null;
};

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const metaConversionsAccessToken =
  Deno.env.get("META_CONVERSIONS_ACCESS_TOKEN") || Deno.env.get("META_ACCESS_TOKEN");
const metaDatasetId = Deno.env.get("META_DATASET_ID");
const metaTestEventCode = Deno.env.get("META_TEST_EVENT_CODE");
const metaFeedbackSecret = Deno.env.get("META_FEEDBACK_SECRET");

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing Supabase environment variables.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });

const normalizePhone = (value: string | null | undefined) => (value ?? "").replace(/\D/g, "");
const normalizeEmail = (value: string | null | undefined) => (value ?? "").trim().toLowerCase();

const sha256 = async (value: string) => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

const toUnixSeconds = (value: string | null | undefined) =>
  Math.floor(new Date(value ?? new Date().toISOString()).getTime() / 1000);

const toFbc = (fbclid: string | null | undefined, occurredAt: string | null | undefined) => {
  if (!fbclid) return null;
  return `fb.1.${toUnixSeconds(occurredAt)}.${fbclid}`;
};

const isPositiveFeedback = (type: FeedbackRow["feedback_type"]) =>
  type === "qualified_lead" || type === "won_job";

const buildEventName = (feedbackType: FeedbackRow["feedback_type"]) => {
  if (feedbackType === "won_job") return "Purchase";
  return "Lead";
};

const buildUserData = async (lead: NonNullable<FeedbackRow["leads"]>) => {
  const phone = normalizePhone(lead.phone);
  const email = normalizeEmail(lead.email);
  const externalId = lead.external_lead_id || lead.id;

  const userData: Record<string, unknown> = {};

  if (phone) {
    userData.ph = [await sha256(phone)];
  }

  if (email) {
    userData.em = [await sha256(email)];
  }

  if (externalId) {
    userData.external_id = [await sha256(externalId)];
  }

  const fbc = toFbc(fbclidOrNull(lead.fbclid), lead.source_received_at || lead.submitted_at || lead.created_at);
  if (fbc) {
    userData.fbc = fbc;
  }

  return userData;
};

const fbclidOrNull = (value: string | null | undefined) => (value?.trim() ? value.trim() : null);

const buildCustomData = (row: FeedbackRow) => {
  const lead = row.leads;
  if (!lead) return {};

  const base = {
    crm_feedback_type: row.feedback_type,
    crm_source_platform: lead.source_platform,
    landing_page_variant: lead.landing_page_variant,
    campaign_name: lead.external_campaign_name,
  };

  if (row.feedback_type === "won_job" && lead.latest_quote_estimate !== null) {
    return {
      ...base,
      currency: "AED",
      value: Number(lead.latest_quote_estimate),
    };
  }

  return base;
};

const fetchPendingFeedback = async () => {
  const { data, error } = await supabase
    .from("ad_platform_feedback")
    .select(
      "id, lead_id, platform, feedback_type, feedback_status, payload, response_payload, created_at, leads:lead_id(id, full_name, phone, email, source_platform, landing_page_variant, latest_quote_estimate, fbclid, external_lead_id, external_campaign_name, source_received_at, submitted_at, created_at)",
    )
    .eq("platform", "meta")
    .eq("feedback_status", "pending")
    .order("created_at", { ascending: true })
    .limit(25);

  if (error) throw error;
  return (data as FeedbackRow[]) ?? [];
};

const logSyncRun = async (input: {
  status: "processed" | "failed" | "skipped";
  externalId: string;
  leadId?: string | null;
  requestPayload?: Record<string, unknown>;
  responsePayload?: Record<string, unknown>;
  errorMessage?: string | null;
}) => {
  const { error } = await supabase.from("source_sync_runs").insert({
    provider: "meta",
    source_kind: "poll",
    status: input.status,
    external_id: input.externalId,
    lead_id: input.leadId ?? null,
    request_payload: input.requestPayload ?? {},
    response_payload: input.responsePayload ?? {},
    error_message: input.errorMessage ?? null,
  });

  if (error) {
    console.warn("Failed to log Meta feedback sync run", error);
  }
};

const updateFeedbackRow = async (
  id: string,
  payload: Partial<Pick<FeedbackRow, "feedback_status" | "response_payload">> & {
    sent_at?: string | null;
  },
) => {
  const { error } = await supabase.from("ad_platform_feedback").update(payload).eq("id", id);
  if (error) throw error;
};

const sendEventToMeta = async (event: Record<string, unknown>) => {
  if (!metaConversionsAccessToken) {
    throw new Error("META_CONVERSIONS_ACCESS_TOKEN is not configured.");
  }

  if (!metaDatasetId) {
    throw new Error("META_DATASET_ID is not configured.");
  }

  const url = new URL(`https://graph.facebook.com/v22.0/${metaDatasetId}/events`);
  url.searchParams.set("access_token", metaConversionsAccessToken);

  const body: Record<string, unknown> = {
    data: [event],
  };

  if (metaTestEventCode) {
    body.test_event_code = metaTestEventCode;
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const responseText = await response.text();
  let parsed: Record<string, unknown> = {};

  try {
    parsed = responseText ? (JSON.parse(responseText) as Record<string, unknown>) : {};
  } catch {
    parsed = { raw: responseText };
  }

  if (!response.ok) {
    throw new Error(typeof parsed.error === "object" ? JSON.stringify(parsed.error) : responseText);
  }

  return parsed;
};

const processFeedbackRow = async (row: FeedbackRow) => {
  if (!isPositiveFeedback(row.feedback_type)) {
    await logSyncRun({
      status: "skipped",
      externalId: row.id,
      leadId: row.lead_id,
      requestPayload: row.payload,
      responsePayload: { reason: "phase_1_positive_signals_only" },
    });
    return { status: "skipped" as const };
  }

  if (!row.leads) {
    throw new Error("Lead not found for feedback row.");
  }

  const user_data = await buildUserData(row.leads);
  if (!Object.keys(user_data).length) {
    throw new Error("Lead is missing matchable data for Meta (phone/email/external_id).");
  }

  const event = {
    event_name: buildEventName(row.feedback_type),
    event_time: toUnixSeconds(row.created_at),
    event_id: row.id,
    action_source: "system_generated",
    user_data,
    custom_data: buildCustomData(row),
  };

  const responsePayload = await sendEventToMeta(event);

  await updateFeedbackRow(row.id, {
    feedback_status: "sent",
    response_payload: responsePayload,
    sent_at: new Date().toISOString(),
  });

  await logSyncRun({
    status: "processed",
    externalId: row.id,
    leadId: row.lead_id,
    requestPayload: event,
    responsePayload,
  });

  return { status: "sent" as const, responsePayload };
};

const deliverPendingFeedback = async () => {
  const rows = await fetchPendingFeedback();
  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const row of rows) {
    try {
      const result = await processFeedbackRow(row);
      if (result.status === "sent") sent += 1;
      if (result.status === "skipped") skipped += 1;
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : "Unknown error";
      await updateFeedbackRow(row.id, {
        feedback_status: "failed",
        response_payload: { error: message },
        sent_at: null,
      });
      await logSyncRun({
        status: "failed",
        externalId: row.id,
        leadId: row.lead_id,
        requestPayload: row.payload,
        responsePayload: { error: message },
        errorMessage: message,
      });
    }
  }

  return { processed: rows.length, sent, failed, skipped };
};

Deno.serve(async (request) => {
  try {
    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405);
    }

    const body = await request.json().catch(() => ({}));
    const mode = typeof body.mode === "string" ? body.mode : "deliver_pending";
    const secretHeader = request.headers.get("x-meta-feedback-secret");

    if (mode === "deliver_pending_public") {
      const result = await deliverPendingFeedback();
      return json({ ok: true, mode, ...result });
    }

    if (!metaFeedbackSecret || secretHeader !== metaFeedbackSecret) {
      return json({ error: "Unauthorized internal request" }, 401);
    }

    if (mode === "test") {
      return json({
        ok: true,
        mode,
        dataset_id_configured: Boolean(metaDatasetId),
        access_token_configured: Boolean(metaConversionsAccessToken),
        test_event_code_configured: Boolean(metaTestEventCode),
      });
    }

    const result = await deliverPendingFeedback();
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
