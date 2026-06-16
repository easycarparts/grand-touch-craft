import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

type GoogleAdsConfig = {
  apiVersion: string;
  developerToken: string;
  customerId: string;
  loginCustomerId: string;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  serviceAccountEmail: string;
  serviceAccountPrivateKey: string;
};

type DashboardRequest = {
  startDate?: string;
  endDate?: string;
  campaignId?: string;
};

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing Supabase environment variables.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });

const sanitizeCustomerId = (value: string | null | undefined) => (value ?? "").replace(/-/g, "").trim();

const readServiceAccount = () => {
  const separateEmail = Deno.env.get("GOOGLE_ADS_SERVICE_ACCOUNT_EMAIL") || "";
  const separatePrivateKey = (Deno.env.get("GOOGLE_ADS_SERVICE_ACCOUNT_PRIVATE_KEY") || "").replace(/\\n/g, "\n");
  if (separateEmail && separatePrivateKey) {
    return {
      email: separateEmail,
      privateKey: separatePrivateKey,
    };
  }

  const rawJson = Deno.env.get("GOOGLE_ADS_SERVICE_ACCOUNT_JSON");
  if (rawJson) {
    try {
      const parsed = JSON.parse(rawJson);
      return {
        email: String(parsed.client_email || ""),
        privateKey: String(parsed.private_key || ""),
      };
    } catch (error) {
      throw new Error(
        `GOOGLE_ADS_SERVICE_ACCOUNT_JSON is not valid JSON: ${
          error instanceof Error ? error.message : "unknown parse error"
        }`,
      );
    }
  }

  return {
    email: "",
    privateKey: "",
  };
};

const loadGoogleAdsConfig = (): GoogleAdsConfig => {
  const serviceAccount = readServiceAccount();
  const config = {
    apiVersion: Deno.env.get("GOOGLE_ADS_API_VERSION") || "v23",
    developerToken: Deno.env.get("GOOGLE_ADS_DEVELOPER_TOKEN") || "",
    customerId: sanitizeCustomerId(Deno.env.get("GOOGLE_ADS_CUSTOMER_ID")),
    loginCustomerId: sanitizeCustomerId(Deno.env.get("GOOGLE_ADS_LOGIN_CUSTOMER_ID")),
    clientId: Deno.env.get("GOOGLE_ADS_CLIENT_ID") || "",
    clientSecret: Deno.env.get("GOOGLE_ADS_CLIENT_SECRET") || "",
    refreshToken: Deno.env.get("GOOGLE_ADS_REFRESH_TOKEN") || "",
    serviceAccountEmail: serviceAccount.email,
    serviceAccountPrivateKey: serviceAccount.privateKey,
  };

  const missing = [
    ["GOOGLE_ADS_DEVELOPER_TOKEN", config.developerToken],
    ["GOOGLE_ADS_CUSTOMER_ID", config.customerId],
  ].filter(([, value]) => !value);

  if (missing.length) {
    throw new Error(`Missing Google Ads secrets: ${missing.map(([key]) => key).join(", ")}`);
  }

  const hasOAuthRefreshToken = Boolean(config.clientId && config.clientSecret && config.refreshToken);
  const hasServiceAccount = Boolean(config.serviceAccountEmail && config.serviceAccountPrivateKey);
  if (!hasOAuthRefreshToken && !hasServiceAccount) {
    throw new Error(
      "Missing Google Ads auth secrets. Set GOOGLE_ADS_CLIENT_ID, GOOGLE_ADS_CLIENT_SECRET, and GOOGLE_ADS_REFRESH_TOKEN, or set GOOGLE_ADS_SERVICE_ACCOUNT_JSON.",
    );
  }

  return config;
};

const base64UrlEncode = (input: ArrayBuffer | string) => {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : new Uint8Array(input);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

const pemToArrayBuffer = (pem: string) => {
  const base64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s+/g, "");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes.buffer;
};

const getAccessToken = async (config: GoogleAdsConfig) => {
  if (config.clientId && config.clientSecret && config.refreshToken) {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        refresh_token: config.refreshToken,
        grant_type: "refresh_token",
      }),
    });

    const body = await response.json();
    if (!response.ok || !body.access_token) {
      throw new Error(`Google OAuth refresh failed: ${JSON.stringify(body)}`);
    }

    return String(body.access_token);
  }

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: config.serviceAccountEmail,
    scope: "https://www.googleapis.com/auth/adwords",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };
  const unsigned = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(JSON.stringify(payload))}`;
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(config.serviceAccountPrivateKey),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(unsigned),
  );
  const jwt = `${unsigned}.${base64UrlEncode(signature)}`;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  const body = await response.json();
  if (!response.ok || !body.access_token) {
    throw new Error(`Google OAuth failed: ${JSON.stringify(body)}`);
  }

  return String(body.access_token);
};

const formatGoogleAdsError = (payload: unknown) => {
  const body = payload as Record<string, any>;
  const details = body?.error?.details as Array<Record<string, any>> | undefined;
  const failure = details?.find((detail) => String(detail["@type"] || "").includes("google.ads.googleads"));
  const errors = failure?.errors as Array<Record<string, any>> | undefined;
  if (errors?.length) {
    return errors
      .map((error) => [Object.values(error.errorCode || {}).join("."), error.message].filter(Boolean).join(" | "))
      .join("\n");
  }
  return body?.error?.message || JSON.stringify(payload);
};

const searchStream = async (config: GoogleAdsConfig, query: string) => {
  const accessToken = await getAccessToken(config);
  const headers: Record<string, string> = {
    authorization: `Bearer ${accessToken}`,
    "content-type": "application/json",
    "developer-token": config.developerToken,
  };

  if (config.loginCustomerId) headers["login-customer-id"] = config.loginCustomerId;

  const response = await fetch(
    `https://googleads.googleapis.com/${config.apiVersion}/customers/${config.customerId}/googleAds:searchStream`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({ query }),
    },
  );
  const body = await response.json();
  if (!response.ok) throw new Error(formatGoogleAdsError(body));
  return Array.isArray(body) ? body.flatMap((chunk) => chunk.results || []) : [];
};

const quoteGaql = (value: string) => `'${String(value).replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
const micros = (value: unknown) => Number(value || 0) / 1_000_000;
const numberValue = (value: unknown) => Number(value || 0);

const parseDate = (value: string | undefined, fallback: Date) => {
  if (!value) return fallback.toISOString().slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : fallback.toISOString().slice(0, 10);
};

const defaultRange = () => {
  const end = new Date();
  const start = new Date();
  start.setUTCDate(end.getUTCDate() - 6);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
};

type MetricAggregate = {
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  conversionValue: number;
};

const aggregateRows = <T extends Record<string, any> & MetricAggregate>(
  rows: Array<Record<string, any>>,
  keyFor: (row: Record<string, any>) => string,
  seedFor: (row: Record<string, any>) => T,
) => {
  const grouped = new Map<string, T>();
  for (const row of rows) {
    const key = keyFor(row);
    const current = grouped.get(key) ?? seedFor(row);
    current.impressions += numberValue(row.metrics?.impressions);
    current.clicks += numberValue(row.metrics?.clicks);
    current.cost += micros(row.metrics?.costMicros);
    current.conversions += numberValue(row.metrics?.conversions);
    current.conversionValue += numberValue(row.metrics?.conversionsValue);
    grouped.set(key, current);
  }

  return Array.from(grouped.values())
    .map((row) => ({
      ...row,
      ctr: row.impressions ? row.clicks / row.impressions : 0,
      averageCpc: row.clicks ? row.cost / row.clicks : 0,
      costPerConversion: row.conversions ? row.cost / row.conversions : null,
    }))
    .sort((left, right) => right.cost - left.cost);
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = request.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) return json({ error: "Missing admin auth token." }, 401);

    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) return json({ error: "Invalid admin auth token." }, 401);

    const { data: adminRow, error: adminError } = await supabase
      .from("admin_users")
      .select("id, is_active")
      .eq("id", userData.user.id)
      .maybeSingle();
    if (adminError) throw adminError;
    if (!adminRow?.is_active) return json({ error: "Admin access required." }, 403);

    const requestBody = (await request.json().catch(() => ({}))) as DashboardRequest;
    const fallback = defaultRange();
    const startDate = parseDate(requestBody.startDate, new Date(fallback.startDate));
    const endDate = parseDate(requestBody.endDate, new Date(fallback.endDate));
    const campaignId = String(requestBody.campaignId || "all");
    const campaignFilter =
      campaignId && campaignId !== "all" && /^\d+$/.test(campaignId) ? `AND campaign.id = ${campaignId}` : "";
    const dateFilter = `segments.date BETWEEN ${quoteGaql(startDate)} AND ${quoteGaql(endDate)}`;
    const config = loadGoogleAdsConfig();

    const campaignQuery = `
      SELECT
        campaign.id,
        campaign.name,
        campaign.status,
        campaign.serving_status,
        campaign.advertising_channel_type,
        campaign.bidding_strategy_type,
        campaign_budget.amount_micros,
        metrics.impressions,
        metrics.clicks,
        metrics.ctr,
        metrics.average_cpc,
        metrics.cost_micros,
        metrics.conversions,
        metrics.conversions_value,
        metrics.cost_per_conversion
      FROM campaign
      WHERE campaign.status IN (ENABLED, PAUSED)
        AND ${dateFilter}
        ${campaignFilter}
      ORDER BY metrics.cost_micros DESC
    `;

    const adGroupQuery = `
      SELECT
        campaign.id,
        campaign.name,
        ad_group.id,
        ad_group.name,
        ad_group.status,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.conversions_value
      FROM ad_group
      WHERE campaign.status IN (ENABLED, PAUSED)
        AND ad_group.status != REMOVED
        AND ${dateFilter}
        ${campaignFilter}
      ORDER BY metrics.cost_micros DESC
    `;

    const adQuery = `
      SELECT
        campaign.id,
        campaign.name,
        ad_group.id,
        ad_group.name,
        ad_group_ad.ad.id,
        ad_group_ad.status,
        ad_group_ad.ad.final_urls,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.conversions_value
      FROM ad_group_ad
      WHERE campaign.status IN (ENABLED, PAUSED)
        AND ad_group_ad.status != REMOVED
        AND ${dateFilter}
        ${campaignFilter}
      ORDER BY metrics.cost_micros DESC
    `;

    const searchTermQuery = `
      SELECT
        campaign.id,
        campaign.name,
        ad_group.id,
        ad_group.name,
        search_term_view.search_term,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.conversions_value
      FROM search_term_view
      WHERE campaign.status IN (ENABLED, PAUSED)
        AND ${dateFilter}
        ${campaignFilter}
      ORDER BY metrics.cost_micros DESC
    `;

    const [campaignRows, adGroupRows, adRows, searchTermRows] = await Promise.all([
      searchStream(config, campaignQuery),
      searchStream(config, adGroupQuery),
      searchStream(config, adQuery),
      searchStream(config, searchTermQuery).catch((error) => {
        console.warn("Search term query failed", error);
        return [];
      }),
    ]);

    const campaigns = aggregateRows(
      campaignRows,
      (row) => String(row.campaign?.id || ""),
      (row) => ({
        campaignId: String(row.campaign?.id || ""),
        campaignName: String(row.campaign?.name || ""),
        status: String(row.campaign?.status || ""),
        servingStatus: String(row.campaign?.servingStatus || ""),
        channelType: String(row.campaign?.advertisingChannelType || ""),
        biddingStrategyType: String(row.campaign?.biddingStrategyType || ""),
        budget: micros(row.campaignBudget?.amountMicros),
        impressions: 0,
        clicks: 0,
        cost: 0,
        conversions: 0,
        conversionValue: 0,
      }),
    );

    const adGroups = aggregateRows(
      adGroupRows,
      (row) => `${row.campaign?.id || ""}:${row.adGroup?.id || ""}`,
      (row) => ({
        campaignId: String(row.campaign?.id || ""),
        campaignName: String(row.campaign?.name || ""),
        adGroupId: String(row.adGroup?.id || ""),
        adGroupName: String(row.adGroup?.name || ""),
        status: String(row.adGroup?.status || ""),
        impressions: 0,
        clicks: 0,
        cost: 0,
        conversions: 0,
        conversionValue: 0,
      }),
    );

    const ads = aggregateRows(
      adRows,
      (row) => `${row.campaign?.id || ""}:${row.adGroup?.id || ""}:${row.adGroupAd?.ad?.id || ""}`,
      (row) => ({
        campaignId: String(row.campaign?.id || ""),
        campaignName: String(row.campaign?.name || ""),
        adGroupId: String(row.adGroup?.id || ""),
        adGroupName: String(row.adGroup?.name || ""),
        adId: String(row.adGroupAd?.ad?.id || ""),
        status: String(row.adGroupAd?.status || ""),
        finalUrls: Array.isArray(row.adGroupAd?.ad?.finalUrls) ? row.adGroupAd.ad.finalUrls : [],
        impressions: 0,
        clicks: 0,
        cost: 0,
        conversions: 0,
        conversionValue: 0,
      }),
    );

    const searchTerms = aggregateRows(
      searchTermRows,
      (row) => `${row.campaign?.id || ""}:${row.adGroup?.id || ""}:${row.searchTermView?.searchTerm || ""}`,
      (row) => ({
        campaignId: String(row.campaign?.id || ""),
        campaignName: String(row.campaign?.name || ""),
        adGroupId: String(row.adGroup?.id || ""),
        adGroupName: String(row.adGroup?.name || ""),
        searchTerm: String(row.searchTermView?.searchTerm || ""),
        impressions: 0,
        clicks: 0,
        cost: 0,
        conversions: 0,
        conversionValue: 0,
      }),
    );

    return json({
      startDate,
      endDate,
      customerId: config.customerId,
      campaigns,
      adGroups,
      ads,
      searchTerms,
    });
  } catch (error) {
    console.error("google-ads-dashboard failed", error);
    return json({ error: error instanceof Error ? error.message : "Unknown Google Ads dashboard error." }, 500);
  }
});
