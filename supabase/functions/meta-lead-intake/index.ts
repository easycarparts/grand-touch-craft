import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

type MetaWebhookBody = {
  object?: string;
  entry?: Array<{
    id?: string;
    changes?: Array<{
      field?: string;
      value?: {
        leadgen_id?: string;
        form_id?: string;
        page_id?: string;
        ad_id?: string;
        created_time?: number;
      };
    }>;
  }>;
};

type MetaLeadField = {
  name: string;
  values?: string[];
};

type MetaLeadResponse = {
  id: string;
  created_time?: string;
  form_id?: string;
  ad_id?: string;
  is_organic?: boolean;
  platform?: string;
  field_data?: MetaLeadField[];
};

type MetaAdResponse = {
  id: string;
  name?: string;
  adset?: {
    id?: string;
    name?: string;
    campaign?: {
      id?: string;
      name?: string;
    };
  };
};

type MetaCollectionResponse<T> = {
  data?: T[];
  paging?: {
    cursors?: {
      before?: string;
      after?: string;
    };
    next?: string;
  };
};

type SyncSourceKind = "webhook" | "poll" | "manual_retry";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const metaAccessToken = Deno.env.get("META_ACCESS_TOKEN");
const metaAppSecret = Deno.env.get("META_APP_SECRET");
const metaVerifyToken = Deno.env.get("META_VERIFY_TOKEN");
const metaSyncSecret = Deno.env.get("META_SYNC_SECRET");
const telegramBotToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
const telegramChatId = Deno.env.get("TELEGRAM_CHAT_ID");
const telegramThreadId = Deno.env.get("TELEGRAM_THREAD_ID");

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

const normalizePhone = (value: string | null | undefined) => (value ?? "").replace(/[^0-9+]/g, "");

const normalizeFieldName = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const formatTokenLabel = (value: string | null | undefined) =>
  (value ?? "")
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const pickFirstValue = (fieldData: MetaLeadField[] | undefined, matcher: (name: string) => boolean) => {
  const match = fieldData?.find((item) => matcher(item.name.toLowerCase()));
  return match?.values?.[0] ?? null;
};

const clampInteger = (value: unknown, fallback: number, min: number, max: number) => {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(value)));
};

const parseIsoDate = (value: unknown, label: string) => {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") {
    throw new Error(`${label} must be an ISO date string.`);
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`${label} must be a valid ISO date string.`);
  }

  return parsed;
};

const makeAppSecretProof = async (token: string, appSecret: string) => {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(appSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(token));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

const verifyMetaSignature = async (rawBody: string, signatureHeader: string | null) => {
  if (!metaAppSecret) {
    throw new Error("META_APP_SECRET is not configured.");
  }

  if (!signatureHeader?.startsWith("sha256=")) {
    throw new Error("Missing Meta signature header.");
  }

  const expected = signatureHeader.replace("sha256=", "");
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(metaAppSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
  const actual = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  if (actual !== expected) {
    throw new Error("Meta webhook signature mismatch.");
  }
};

const graphGet = async <T>(path: string, params: Record<string, string>) => {
  if (!metaAccessToken) {
    throw new Error("META_ACCESS_TOKEN is not configured.");
  }

  const proof = metaAppSecret ? await makeAppSecretProof(metaAccessToken, metaAppSecret) : null;
  const url = new URL(`https://graph.facebook.com/v22.0/${path}`);
  url.searchParams.set("access_token", metaAccessToken);

  if (proof) {
    url.searchParams.set("appsecret_proof", proof);
  }

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Meta Graph request failed for ${path}`);
  }

  return (await response.json()) as T;
};

const fetchLeadFromMeta = async (leadgenId: string) =>
  graphGet<MetaLeadResponse>(leadgenId, {
    fields: "id,created_time,form_id,ad_id,is_organic,platform,field_data",
  });

const fetchFormLeadsPage = async (input: {
  formId: string;
  after?: string | null;
  limit: number;
}) => {
  const params: Record<string, string> = {
    fields: "id,created_time,form_id,ad_id,is_organic,platform,field_data",
    limit: String(input.limit),
  };

  if (input.after) {
    params.after = input.after;
  }

  return graphGet<MetaCollectionResponse<MetaLeadResponse>>(`${input.formId}/leads`, params);
};

const fetchAdContext = async (adId: string | undefined) => {
  if (!adId) return null;

  try {
    return await graphGet<MetaAdResponse>(adId, {
      fields: "id,name,adset{id,name,campaign{id,name}}",
    });
  } catch (error) {
    console.warn("Failed to fetch Meta ad context", error);
    return null;
  }
};

const logSyncRun = async (input: {
  sourceKind?: SyncSourceKind;
  status: "received" | "processed" | "skipped" | "failed";
  externalId?: string | null;
  leadId?: string | null;
  requestPayload?: Record<string, unknown>;
  responsePayload?: Record<string, unknown>;
  errorMessage?: string | null;
}) => {
  const { error } = await supabase.from("source_sync_runs").insert({
    provider: "meta",
    source_kind: input.sourceKind ?? "webhook",
    status: input.status,
    external_id: input.externalId ?? null,
    lead_id: input.leadId ?? null,
    request_payload: input.requestPayload ?? {},
    response_payload: input.responsePayload ?? {},
    error_message: input.errorMessage ?? null,
  });

  if (error) {
    console.warn("Failed to log Meta sync run", error);
  }
};

const escapeHtml = (value: string | null | undefined) =>
  (value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const isMetaTokenExpiryError = (message: string) =>
  message.includes("Error validating access token") ||
  message.includes("\"code\":190") ||
  message.includes("\"error_subcode\":463") ||
  message.includes("Session has expired");

const wasRecentTokenExpiryAlertSent = async () => {
  const since = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("source_sync_runs")
    .select("id")
    .eq("provider", "meta")
    .eq("status", "failed")
    .gte("created_at", since)
    .ilike("error_message", "%Session has expired%")
    .limit(1);

  if (error) {
    console.warn("Failed checking recent token expiry alerts", error);
    return false;
  }

  return Boolean(data?.length);
};

const sendTelegramTokenExpiryAlert = async (errorMessage: string) => {
  if (!telegramBotToken || !telegramChatId) {
    console.warn("Skipping Meta token expiry alert because Telegram secrets are missing.");
    return;
  }

  if (await wasRecentTokenExpiryAlertSent()) {
    return;
  }

  const text =
    `⚠️ <b>Meta lead intake token expired</b>\n` +
    `New Meta leads will not import into the CRM until <code>META_ACCESS_TOKEN</code> is refreshed.\n\n` +
    `<b>Problem:</b> ${escapeHtml(errorMessage)}\n\n` +
    `Action: generate a fresh Page access token for <b>Grand Touch Studio</b> and update the Supabase secret.`;

  const payload: Record<string, unknown> = {
    chat_id: telegramChatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
  };

  if (telegramThreadId) {
    payload.message_thread_id = Number(telegramThreadId);
  }

  const response = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const responseText = await response.text();
    console.warn("Failed to send Meta token expiry alert to Telegram", responseText);
  }
};

const parseLeadFields = (lead: MetaLeadResponse) => {
  const fieldData = lead.field_data ?? [];
  const normalizedFields = fieldData.map((field) => ({
    originalName: field.name,
    normalizedName: normalizeFieldName(field.name),
    values: field.values ?? [],
  }));

  const pickNormalizedValue = (matcher: (name: string) => boolean) =>
    normalizedFields.find((field) => matcher(field.normalizedName))?.values?.[0] ?? null;

  const pickRawValue = (matcher: (name: string) => boolean) =>
    normalizedFields.find((field) => matcher(field.originalName.toLowerCase()))?.values?.[0] ?? null;

  const fullName =
    pickNormalizedValue((name) => ["full_name", "name"].includes(name)) ??
    pickRawValue((name) => ["full name", "name"].includes(name)) ??
    null;
  const email =
    pickNormalizedValue((name) => name.includes("email")) ??
    null;
  const phone =
    pickNormalizedValue((name) => name.includes("phone")) ??
    null;
  const vehicleMake =
    pickNormalizedValue((name) => name === "vehicle_make" || name === "make" || name.includes("car_make")) ??
    null;
  const vehicleModel =
    pickNormalizedValue((name) => name === "vehicle_model" || name === "model" || name.includes("car_model")) ??
    null;
  const vehicleYear =
    pickNormalizedValue((name) => name === "vehicle_year" || name === "year" || name.includes("car_year")) ??
    null;
  const combinedVehicle =
    pickNormalizedValue(
      (name) =>
        name.includes("your_car") ||
        name.includes("vehicle_make_model_year") ||
        name.includes("make_model_year") ||
        name.includes("car_make_model_year"),
    ) ??
    null;
  const deliveryStatus =
    pickNormalizedValue(
      (name) =>
        name === "delivery_status" ||
        name.includes("have_the_car_now") ||
        name.includes("do_you_have_the_car_now") ||
        name.includes("car_now"),
    ) ?? null;
  const protectionLevel =
    pickNormalizedValue(
      (name) =>
        name === "protection_level" ||
        name.includes("package") ||
        name.includes("protection"),
    ) ?? null;

  const combinedVehicleTrimmed = combinedVehicle?.trim() || null;
  const hasStructuredVehicleFields = Boolean(vehicleMake || vehicleModel || vehicleYear);
  const safeVehicleMake = vehicleMake || null;
  const safeVehicleModel = vehicleModel || null;
  const safeVehicleYear = vehicleYear || null;

  const summaryParts = [
    protectionLevel ? `Package: ${formatTokenLabel(protectionLevel)}` : null,
    deliveryStatus ? `Timing: ${formatTokenLabel(deliveryStatus)}` : null,
  ].filter(Boolean);

  return {
    fullName,
    email,
    phone,
    vehicleMake: safeVehicleMake,
    vehicleModel: safeVehicleModel,
    vehicleYear: safeVehicleYear,
    combinedVehicle: combinedVehicleTrimmed,
    structuredVehicleLabel: [safeVehicleYear, safeVehicleMake, safeVehicleModel].filter(Boolean).join(" ").trim() || null,
    preferredVehicleLabel:
      combinedVehicleTrimmed ||
      [safeVehicleYear, safeVehicleMake, safeVehicleModel].filter(Boolean).join(" ").trim() ||
      null,
    hasStructuredVehicleFields,
    deliveryStatus,
    protectionLevel,
    notesSummary: summaryParts.length ? summaryParts.join(" | ") : null,
    rawFields: Object.fromEntries(
      normalizedFields.map((field) => [field.originalName, field.values]),
    ),
  };
};

const processResolvedLead = async (input: {
  lead: MetaLeadResponse;
  adContext: MetaAdResponse | null;
  pageId?: string | null;
  formId?: string | null;
  adId?: string | null;
  webhookPayload: Record<string, unknown>;
  sourceKind: SyncSourceKind;
}) => {
  const result = await upsertMetaLeadIntoCrm({
    lead: {
      ...input.lead,
      form_id: input.lead.form_id ?? input.formId ?? null ?? undefined,
      ad_id: input.lead.ad_id ?? input.adId ?? null ?? undefined,
    },
    adContext: input.adContext,
    pageId: input.pageId,
    webhookPayload: input.webhookPayload,
  });

  await logSyncRun({
    sourceKind: input.sourceKind,
    status: "processed",
    externalId: input.lead.id,
    leadId: result.leadId,
    requestPayload: input.webhookPayload,
    responsePayload: {
      operation: result.operation,
      meta_lead_id: input.lead.id,
      meta_form_id: input.lead.form_id ?? input.formId ?? null,
      meta_ad_id: input.lead.ad_id ?? input.adId ?? null,
    },
  });

  return result;
};

const upsertMetaLeadIntoCrm = async (input: {
  lead: MetaLeadResponse;
  adContext: MetaAdResponse | null;
  pageId?: string | null;
  webhookPayload: Record<string, unknown>;
}) => {
  const parsed = parseLeadFields(input.lead);

  const { data: existingLead, error: existingLeadError } = await supabase
    .from("leads")
    .select("id")
    .eq("lead_source_type", "meta_lead_form")
    .eq("external_lead_id", input.lead.id)
    .maybeSingle();

  if (existingLeadError) {
    throw existingLeadError;
  }

  const commonUpdate = {
    full_name: parsed.fullName,
    phone: normalizePhone(parsed.phone),
    email: parsed.email,
    vehicle_make: parsed.vehicleMake,
    vehicle_model: parsed.vehicleModel,
    vehicle_year: parsed.vehicleYear,
    vehicle_label: parsed.preferredVehicleLabel,
    source_platform: "meta",
    landing_page_variant: "meta_lead_form",
    funnel_name: "meta_lead_ads",
    lead_source_type: "meta_lead_form",
    utm_campaign: input.adContext?.name ?? null,
    notes_summary: parsed.notesSummary,
    external_lead_id: input.lead.id,
    external_form_id: input.lead.form_id ?? null,
    external_page_id: input.pageId ?? null,
    external_ad_id: input.lead.ad_id ?? null,
    external_adset_id: input.adContext?.adset?.id ?? null,
    external_campaign_id: input.adContext?.adset?.campaign?.id ?? null,
    external_ad_name: input.adContext?.name ?? null,
    external_adset_name: input.adContext?.adset?.name ?? null,
    external_campaign_name: input.adContext?.adset?.campaign?.name ?? null,
    source_received_at: input.lead.created_time ?? new Date().toISOString(),
    submitted_at: input.lead.created_time ?? new Date().toISOString(),
    last_activity_at: new Date().toISOString(),
    import_metadata: {
      provider: "meta",
      is_organic: input.lead.is_organic ?? null,
      platform: input.lead.platform ?? null,
      delivery_status: parsed.deliveryStatus,
      protection_level: parsed.protectionLevel,
      combined_vehicle: parsed.combinedVehicle,
      structured_vehicle_label: parsed.structuredVehicleLabel,
      preferred_vehicle_label: parsed.preferredVehicleLabel,
      field_data: parsed.rawFields,
      webhook_payload: input.webhookPayload,
    },
  };

  if (existingLead?.id) {
    const { error: updateError } = await supabase
      .from("leads")
      .update(commonUpdate)
      .eq("id", existingLead.id);

    if (updateError) throw updateError;
    return {
      leadId: existingLead.id,
      operation: "updated",
    };
  }

  const { data: insertedLead, error: insertError } = await supabase
    .from("leads")
    .insert({
      ...commonUpdate,
      status: "new",
      quality_label: "unreviewed",
      first_captured_at: input.lead.created_time ?? new Date().toISOString(),
    })
    .select("id")
    .single();

  if (insertError) throw insertError;

  return {
    leadId: insertedLead.id as string,
    operation: "inserted",
  };
};

const processLeadgenEvent = async (input: {
  leadgenId: string;
  pageId?: string | null;
  formId?: string | null;
  adId?: string | null;
  webhookPayload: Record<string, unknown>;
  sourceKind: SyncSourceKind;
}) => {
  await logSyncRun({
    sourceKind: input.sourceKind,
    status: "received",
    externalId: input.leadgenId,
    requestPayload: input.webhookPayload,
  });

  const lead = await fetchLeadFromMeta(input.leadgenId);
  const adContext = await fetchAdContext(input.adId ?? lead.ad_id);
  return await processResolvedLead({
    lead,
    adContext,
    pageId: input.pageId,
    formId: input.formId,
    adId: input.adId,
    webhookPayload: input.webhookPayload,
    sourceKind: input.sourceKind,
  });
};

const pollFormLeads = async (input: {
  formId: string;
  pageId?: string | null;
  since?: string | null;
  limit?: number;
  pageSize?: number;
  requestPayload: Record<string, unknown>;
}) => {
  const sinceDate = parseIsoDate(input.since, "since");
  const maxLeads = clampInteger(input.limit, 50, 1, 500);
  const pageSize = clampInteger(input.pageSize, 25, 1, 100);
  const adContextCache = new Map<string, MetaAdResponse | null>();

  await logSyncRun({
    sourceKind: "poll",
    status: "received",
    externalId: input.formId,
    requestPayload: {
      ...input.requestPayload,
      form_id: input.formId,
      since: sinceDate?.toISOString() ?? null,
      limit: maxLeads,
      page_size: pageSize,
    },
  });

  let imported = 0;
  let updated = 0;
  let failed = 0;
  let scanned = 0;
  let afterCursor: string | null = null;
  let reachedSinceBoundary = false;

  const processed: Array<Record<string, unknown>> = [];

  while (scanned < maxLeads) {
    const page = await fetchFormLeadsPage({
      formId: input.formId,
      after: afterCursor,
      limit: Math.min(pageSize, maxLeads - scanned),
    });

    const leads = page.data ?? [];
    if (!leads.length) {
      break;
    }

    for (const lead of leads) {
      scanned += 1;

      const createdTime = lead.created_time ? new Date(lead.created_time) : null;
      if (sinceDate && createdTime && createdTime < sinceDate) {
        reachedSinceBoundary = true;
        continue;
      }

      try {
        const cacheKey = lead.ad_id ?? "__no_ad__";
        let adContext = adContextCache.get(cacheKey);

        if (adContext === undefined) {
          adContext = await fetchAdContext(lead.ad_id);
          adContextCache.set(cacheKey, adContext);
        }

        const result = await processResolvedLead({
          lead,
          adContext,
          pageId: input.pageId,
          formId: input.formId,
          webhookPayload: {
            ...input.requestPayload,
            mode: "poll_form",
            form_id: input.formId,
            leadgen_id: lead.id,
            lead_created_time: lead.created_time ?? null,
          },
          sourceKind: "poll",
        });

        if (result.operation === "inserted") {
          imported += 1;
        } else {
          updated += 1;
        }

        processed.push({
          leadgen_id: lead.id,
          operation: result.operation,
        });
      } catch (error) {
        failed += 1;
        const errorMessage = error instanceof Error ? error.message : "Unknown error";

        await logSyncRun({
          sourceKind: "poll",
          status: "failed",
          externalId: lead.id,
          requestPayload: {
            ...input.requestPayload,
            mode: "poll_form",
            form_id: input.formId,
            leadgen_id: lead.id,
          },
          errorMessage,
        });

        if (isMetaTokenExpiryError(errorMessage)) {
          await sendTelegramTokenExpiryAlert(errorMessage);
        }

        processed.push({
          leadgen_id: lead.id,
          error: errorMessage,
        });
      }

      if (scanned >= maxLeads) {
        break;
      }
    }

    afterCursor = page.paging?.cursors?.after ?? null;
    if (!afterCursor || reachedSinceBoundary) {
      break;
    }
  }

  return {
    form_id: input.formId,
    since: sinceDate?.toISOString() ?? null,
    scanned_leads: scanned,
    imported_leads: imported,
    updated_leads: updated,
    failed_leads: failed,
    reached_since_boundary: reachedSinceBoundary,
    next_cursor: afterCursor,
    processed,
  };
};

Deno.serve(async (request) => {
  try {
    const url = new URL(request.url);

    if (request.method === "GET") {
      const mode = url.searchParams.get("hub.mode");
      const verifyToken = url.searchParams.get("hub.verify_token");
      const challenge = url.searchParams.get("hub.challenge");

      if (mode === "subscribe" && verifyToken && challenge && metaVerifyToken && verifyToken === metaVerifyToken) {
        return new Response(challenge, { status: 200 });
      }

      return new Response("Verification failed", { status: 403 });
    }

    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405);
    }

    const rawBody = await request.text();
    const signature = request.headers.get("x-hub-signature-256");
    const internalSecret = request.headers.get("x-meta-sync-secret");

    const body = rawBody ? (JSON.parse(rawBody) as Record<string, unknown>) : {};

    if (internalSecret && metaSyncSecret && internalSecret === metaSyncSecret) {
      const mode = typeof body.mode === "string" ? body.mode : null;
      const leadgenId = typeof body.leadgen_id === "string" ? body.leadgen_id : null;
      const formId = typeof body.form_id === "string" ? body.form_id : null;
      const pageId = typeof body.page_id === "string" ? body.page_id : null;
      const adId = typeof body.ad_id === "string" ? body.ad_id : null;

      if (mode === "poll_form") {
        if (!formId) {
          return json({ error: "Missing form_id" }, 400);
        }

        const result = await pollFormLeads({
          formId,
          pageId,
          since: typeof body.since === "string" ? body.since : null,
          limit: typeof body.limit === "number" ? body.limit : undefined,
          pageSize: typeof body.page_size === "number" ? body.page_size : undefined,
          requestPayload: body,
        });

        return json({ ok: true, mode: "poll_form", ...result });
      }

      if (!leadgenId) {
        return json({ error: "Missing leadgen_id" }, 400);
      }

      const result = await processLeadgenEvent({
        leadgenId,
        pageId,
        formId,
        adId,
        webhookPayload: body,
        sourceKind: "manual_retry",
      });

      return json({ ok: true, mode: "manual_retry", ...result });
    }

    await verifyMetaSignature(rawBody, signature);
    const webhook = body as MetaWebhookBody;

    if (webhook.object !== "page" || !webhook.entry?.length) {
      return json({ ok: true, ignored: true });
    }

    const processed: Array<Record<string, unknown>> = [];

    for (const entry of webhook.entry) {
      for (const change of entry.changes ?? []) {
        if (change.field !== "leadgen" || !change.value?.leadgen_id) {
          continue;
        }

        try {
          const result = await processLeadgenEvent({
            leadgenId: change.value.leadgen_id,
            pageId: change.value.page_id ?? entry.id ?? null,
            formId: change.value.form_id ?? null,
            adId: change.value.ad_id ?? null,
            webhookPayload: {
              entry_id: entry.id ?? null,
              field: change.field,
              value: change.value,
            },
            sourceKind: "webhook",
          });

          processed.push({
            leadgen_id: change.value.leadgen_id,
            ...result,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";

          await logSyncRun({
            sourceKind: "webhook",
            status: "failed",
            externalId: change.value.leadgen_id,
            requestPayload: {
              entry_id: entry.id ?? null,
              field: change.field,
              value: change.value,
            },
            errorMessage,
          });

          if (isMetaTokenExpiryError(errorMessage)) {
            await sendTelegramTokenExpiryAlert(errorMessage);
          }

          processed.push({
            leadgen_id: change.value.leadgen_id,
            error: errorMessage,
          });
        }
      }
    }

    return json({
      ok: true,
      processed,
    });
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
