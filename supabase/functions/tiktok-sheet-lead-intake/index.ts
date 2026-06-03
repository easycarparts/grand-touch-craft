import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

type SheetLeadPayload = {
  row?: Record<string, unknown>;
  row_number?: number;
  sheet_name?: string;
  spreadsheet_id?: string;
  imported_at?: string;
};

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const syncSecret = Deno.env.get("TIKTOK_SHEETS_SYNC_SECRET");

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

const normalizePhone = (value: unknown) => String(value ?? "").replace(/[^0-9+]/g, "");

const normalizeKey = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const normalizeValue = (value: unknown) => {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text || null;
};

const getValue = (row: Record<string, unknown>, keys: string[]) => {
  const normalizedRow = new Map<string, unknown>();
  for (const [key, value] of Object.entries(row)) {
    normalizedRow.set(normalizeKey(key), value);
  }

  for (const key of keys) {
    const value = normalizedRow.get(normalizeKey(key));
    const normalized = normalizeValue(value);
    if (normalized) return normalized;
  }

  for (const [key, value] of normalizedRow.entries()) {
    if (keys.some((candidate) => key.includes(normalizeKey(candidate)))) {
      const normalized = normalizeValue(value);
      if (normalized) return normalized;
    }
  }

  return null;
};

const parseTimestamp = (value: string | null) => {
  if (!value) return new Date().toISOString();

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString();
  return parsed.toISOString();
};

const formatTokenLabel = (value: string | null | undefined) =>
  (value ?? "")
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const buildExternalLeadId = (input: {
  explicitId: string | null;
  phone: string | null;
  createdAt: string;
  rowNumber?: number;
  spreadsheetId?: string;
}) => {
  if (input.explicitId) return input.explicitId;

  return [
    "sheet",
    input.spreadsheetId || "unknown_sheet",
    input.rowNumber ? `row_${input.rowNumber}` : null,
    input.phone ? normalizePhone(input.phone) : null,
    input.createdAt,
  ]
    .filter(Boolean)
    .join(":");
};

const logSyncRun = async (input: {
  status: "received" | "processed" | "skipped" | "failed";
  externalId?: string | null;
  leadId?: string | null;
  requestPayload?: Record<string, unknown>;
  responsePayload?: Record<string, unknown>;
  errorMessage?: string | null;
}) => {
  const { error } = await supabase.from("source_sync_runs").insert({
    provider: "tiktok",
    source_kind: "webhook",
    status: input.status,
    external_id: input.externalId ?? null,
    lead_id: input.leadId ?? null,
    request_payload: input.requestPayload ?? {},
    response_payload: input.responsePayload ?? {},
    error_message: input.errorMessage ?? null,
  });

  if (error) {
    console.warn("Failed to log TikTok sheet sync run", error);
  }
};

const upsertTikTokSheetLead = async (payload: SheetLeadPayload) => {
  const row = payload.row ?? {};
  const fullName = getValue(row, ["name", "full_name", "full name", "first name"]);
  const email = getValue(row, ["email", "email address"]);
  const phone = normalizePhone(getValue(row, ["phone", "phone number", "mobile", "mobile number", "contact number"]));
  const vehicle =
    getValue(row, [
      "what car needs ppf",
      "what car",
      "car",
      "vehicle",
      "vehicle model",
      "what vehicle",
    ]) ?? null;
  const installTiming = getValue(row, ["when are you looking to install", "when", "install timing", "timing"]);
  const budgetAnswer = getValue(row, ["premium full body ppf", "intent", "budget", "10k", "price", "is that okay"]);
  const leadIdFromSheet = getValue(row, ["lead id", "lead_id", "id", "tiktok lead id", "leadid"]);
  const campaignName = getValue(row, ["campaign name", "campaign"]);
  const adGroupName = getValue(row, ["ad group name", "adgroup name", "ad set name", "adset name"]);
  const adName = getValue(row, ["ad name", "creative name"]);
  const formName = getValue(row, ["form name", "instant form name", "lead form name"]);
  const createdAt = parseTimestamp(getValue(row, ["created time", "created_time", "submit time", "submission time", "time"]));
  const externalLeadId = buildExternalLeadId({
    explicitId: leadIdFromSheet,
    phone,
    createdAt,
    rowNumber: payload.row_number,
    spreadsheetId: payload.spreadsheet_id,
  });

  await logSyncRun({
    status: "received",
    externalId: externalLeadId,
    requestPayload: payload as Record<string, unknown>,
  });

  const notesSummary = [
    vehicle ? `Car: ${vehicle}` : null,
    installTiming ? `Timing: ${formatTokenLabel(installTiming)}` : null,
    budgetAnswer ? `Budget: ${formatTokenLabel(budgetAnswer)}` : null,
  ]
    .filter(Boolean)
    .join(" | ");

  const commonUpdate = {
    full_name: fullName,
    phone,
    email,
    vehicle_label: vehicle,
    source_platform: "tiktok",
    landing_page_variant: "tiktok_instant_lead_form",
    funnel_name: "tiktok_instant_form_ppf",
    lead_source_type: "tiktok_lead_form",
    utm_source: "tiktok",
    utm_medium: "paid_social",
    utm_campaign: campaignName,
    external_lead_id: externalLeadId,
    external_form_id: formName,
    external_ad_name: adName,
    external_adset_name: adGroupName,
    external_campaign_name: campaignName,
    source_received_at: createdAt,
    submitted_at: createdAt,
    last_activity_at: new Date().toISOString(),
    notes_summary: notesSummary || null,
    import_metadata: {
      provider: "tiktok",
      source: "google_sheets",
      spreadsheet_id: payload.spreadsheet_id ?? null,
      sheet_name: payload.sheet_name ?? null,
      row_number: payload.row_number ?? null,
      form_name: formName,
      campaign_name: campaignName,
      ad_group_name: adGroupName,
      ad_name: adName,
      vehicle,
      install_timing: installTiming,
      budget_answer: budgetAnswer,
      raw_row: row,
    },
  };

  const { data: existingLead, error: existingLeadError } = await supabase
    .from("leads")
    .select("id")
    .eq("lead_source_type", "tiktok_lead_form")
    .eq("external_lead_id", externalLeadId)
    .maybeSingle();

  if (existingLeadError) throw existingLeadError;

  if (existingLead?.id) {
    const { error: updateError } = await supabase.from("leads").update(commonUpdate).eq("id", existingLead.id);
    if (updateError) throw updateError;

    await logSyncRun({
      status: "processed",
      externalId: externalLeadId,
      leadId: existingLead.id,
      requestPayload: payload as Record<string, unknown>,
      responsePayload: { operation: "updated" },
    });

    return { leadId: existingLead.id, operation: "updated" };
  }

  const { data: insertedLead, error: insertError } = await supabase
    .from("leads")
    .insert({
      ...commonUpdate,
      status: "new",
      quality_label: "unreviewed",
      first_captured_at: createdAt,
    })
    .select("id")
    .single();

  if (insertError) throw insertError;

  await logSyncRun({
    status: "processed",
    externalId: externalLeadId,
    leadId: insertedLead.id,
    requestPayload: payload as Record<string, unknown>,
    responsePayload: { operation: "inserted" },
  });

  return { leadId: insertedLead.id as string, operation: "inserted" };
};

Deno.serve(async (request) => {
  try {
    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405);
    }

    const secret = request.headers.get("x-tiktok-sheet-secret");
    if (!syncSecret || !secret || secret !== syncSecret) {
      return json({ ok: false, error: "Unauthorized" }, 401);
    }

    const body = (await request.json()) as SheetLeadPayload;
    if (!body.row || typeof body.row !== "object") {
      return json({ ok: false, error: "Missing row payload" }, 400);
    }

    const result = await upsertTikTokSheetLead(body);
    return json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    try {
      const body = await request.clone().json();
      await logSyncRun({
        status: "failed",
        requestPayload: body,
        errorMessage: message,
      });
    } catch {
      // Ignore logging errors after response parsing failures.
    }

    return json({ ok: false, error: message }, 500);
  }
});
