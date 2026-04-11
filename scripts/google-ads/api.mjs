import crypto from "node:crypto";
import fs from "node:fs";
import { loadConfig } from "./config.mjs";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_ADS_SCOPE = "https://www.googleapis.com/auth/adwords";

function base64UrlEncode(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function formatGoogleAdsError(errorJson) {
  if (!errorJson || typeof errorJson !== "object") {
    return "Unknown Google Ads API error.";
  }

  if (errorJson.error?.message) {
    return errorJson.error.message;
  }

  return JSON.stringify(errorJson, null, 2);
}

function quoteGaql(value) {
  return `'${String(value).replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
}

export function buildDateRange(days) {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - (days - 1));

  const format = (value) => value.toISOString().slice(0, 10);
  return {
    start: format(start),
    end: format(end),
  };
}

export async function getAccessToken(config) {
  const raw = fs.readFileSync(config.serviceAccountKeyPath, "utf8");
  const keyData = JSON.parse(raw);
  const now = Math.floor(Date.now() / 1000);

  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: keyData.client_email,
    scope: GOOGLE_ADS_SCOPE,
    aud: TOKEN_URL,
    exp: now + 3600,
    iat: now,
  };

  const unsignedJwt = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(
    JSON.stringify(payload),
  )}`;

  const signer = crypto.createSign("RSA-SHA256");
  signer.update(unsignedJwt);
  const signature = signer.sign(keyData.private_key);
  const jwt = `${unsignedJwt}.${base64UrlEncode(signature)}`;

  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion: jwt,
  });

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Token request failed (${response.status}): ${text}`);
  }

  const json = await response.json();
  if (!json.access_token) {
    throw new Error("Token request succeeded but no access token was returned.");
  }

  return json.access_token;
}

export async function searchStream(config, query) {
  const accessToken = await getAccessToken(config);
  const endpoint = `https://googleads.googleapis.com/${config.apiVersion}/customers/${config.customerId}/googleAds:searchStream`;

  const headers = {
    authorization: `Bearer ${accessToken}`,
    "content-type": "application/json",
    "developer-token": config.developerToken,
  };

  if (config.loginCustomerId) {
    headers["login-customer-id"] = config.loginCustomerId;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({ query }),
  });

  const text = await response.text();
  let json;

  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Google Ads API returned non-JSON response (${response.status}): ${text}`);
  }

  if (!response.ok) {
    throw new Error(formatGoogleAdsError(json));
  }

  if (!Array.isArray(json)) {
    return [];
  }

  return json.flatMap((chunk) => chunk.results || []);
}

export async function listAccessibleCustomers(config) {
  const accessToken = await getAccessToken(config);
  const endpoint = `https://googleads.googleapis.com/${config.apiVersion}/customers:listAccessibleCustomers`;

  const headers = {
    authorization: `Bearer ${accessToken}`,
    "content-type": "application/json",
    "developer-token": config.developerToken,
  };

  if (config.loginCustomerId) {
    headers["login-customer-id"] = config.loginCustomerId;
  }

  const response = await fetch(endpoint, {
    method: "GET",
    headers,
  });

  const text = await response.text();
  let json;

  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Google Ads API returned non-JSON response (${response.status}): ${text}`);
  }

  if (!response.ok) {
    throw new Error(formatGoogleAdsError(json));
  }

  return json.resourceNames || [];
}

export async function mutate(config, mutateOperations, options = {}) {
  const accessToken = await getAccessToken(config);
  const endpoint = `https://googleads.googleapis.com/${config.apiVersion}/customers/${config.customerId}/googleAds:mutate`;

  const headers = {
    authorization: `Bearer ${accessToken}`,
    "content-type": "application/json",
    "developer-token": config.developerToken,
  };

  if (config.loginCustomerId) {
    headers["login-customer-id"] = config.loginCustomerId;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({
      mutateOperations,
      partialFailure: options.partialFailure ?? true,
      validateOnly: options.validateOnly ?? false,
    }),
  });

  const text = await response.text();
  let json;

  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Google Ads API returned non-JSON response (${response.status}): ${text}`);
  }

  if (!response.ok) {
    throw new Error(formatGoogleAdsError(json));
  }

  return json;
}

export async function getCustomerInfo(config) {
  const query = `
    SELECT
      customer.id,
      customer.descriptive_name,
      customer.currency_code,
      customer.time_zone,
      customer.manager
    FROM customer
    LIMIT 1
  `;

  const results = await searchStream(config, query);
  return results[0]?.customer || null;
}

export async function getCampaignPerformance(config) {
  const { start, end } = buildDateRange(config.days);
  const filters = [
    "campaign.status != 'REMOVED'",
    "campaign.advertising_channel_type = 'SEARCH'",
    `segments.date BETWEEN ${quoteGaql(start)} AND ${quoteGaql(end)}`,
  ];

  if (config.campaign) {
    filters.push(`campaign.name = ${quoteGaql(config.campaign)}`);
  }

  const query = `
    SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      metrics.impressions,
      metrics.clicks,
      metrics.ctr,
      metrics.average_cpc,
      metrics.cost_micros,
      metrics.conversions,
      metrics.cost_per_conversion
    FROM campaign
    WHERE ${filters.join("\n      AND ")}
    ORDER BY metrics.cost_micros DESC
  `;

  return searchStream(config, query);
}

export async function getSearchTerms(config) {
  const { start, end } = buildDateRange(config.days);
  const filters = [
    "campaign.advertising_channel_type = 'SEARCH'",
    `segments.date BETWEEN ${quoteGaql(start)} AND ${quoteGaql(end)}`,
  ];

  if (config.campaign) {
    filters.push(`campaign.name = ${quoteGaql(config.campaign)}`);
  }

  const query = `
    SELECT
      campaign.name,
      ad_group.name,
      search_term_view.search_term,
      metrics.impressions,
      metrics.clicks,
      metrics.ctr,
      metrics.average_cpc,
      metrics.cost_micros,
      metrics.conversions,
      metrics.cost_per_conversion
    FROM search_term_view
    WHERE ${filters.join("\n      AND ")}
    ORDER BY metrics.cost_micros DESC
  `;

  return searchStream(config, query);
}

export async function getConversionActions(config) {
  const query = `
    SELECT
      conversion_action.id,
      conversion_action.name,
      conversion_action.status,
      conversion_action.type,
      conversion_action.origin,
      conversion_action.category,
      conversion_action.primary_for_goal,
      conversion_action.include_in_conversions_metric,
      conversion_action.counting_type,
      conversion_action.owner_customer,
      conversion_action.resource_name,
      conversion_action.tag_snippets
    FROM conversion_action
    WHERE conversion_action.status != 'REMOVED'
    ORDER BY conversion_action.name
  `;

  return searchStream(config, query);
}

export function microsToCurrency(value) {
  return Number(value || 0) / 1_000_000;
}

export function groupSearchTerms(rows) {
  const grouped = new Map();

  for (const row of rows) {
    const term = row.searchTermView?.searchTerm || "(unknown)";
    const existing = grouped.get(term) || {
      searchTerm: term,
      campaignName: row.campaign?.name || "",
      adGroupName: row.adGroup?.name || "",
      impressions: 0,
      clicks: 0,
      cost: 0,
      conversions: 0,
    };

    existing.impressions += Number(row.metrics?.impressions || 0);
    existing.clicks += Number(row.metrics?.clicks || 0);
    existing.cost += microsToCurrency(row.metrics?.costMicros);
    existing.conversions += Number(row.metrics?.conversions || 0);
    grouped.set(term, existing);
  }

  return [...grouped.values()].sort((a, b) => b.cost - a.cost);
}

export function suggestNegativeKeywords(terms) {
  const patternGroups = [
    { label: "cheap/free intent", patterns: ["cheap", "cheapest", "free"] },
    { label: "jobs/training intent", patterns: ["job", "jobs", "career", "careers", "training", "course", "courses"] },
    { label: "wrap/tint intent", patterns: ["wrap", "wrapping", "vinyl", "tint", "ceramic coating"] },
    { label: "supplier intent", patterns: ["supplier", "suppliers", "wholesale", "roll"] },
    { label: "competitor mismatch", patterns: ["xpel", "3m", "suntek"] },
  ];

  const suggestions = [];

  for (const term of terms) {
    const haystack = term.searchTerm.toLowerCase();
    const matched = patternGroups.find((group) =>
      group.patterns.some((pattern) => haystack.includes(pattern)),
    );

    if (!matched) {
      continue;
    }

    suggestions.push({
      searchTerm: term.searchTerm,
      reason: matched.label,
      cost: term.cost,
      clicks: term.clicks,
      conversions: term.conversions,
    });
  }

  return suggestions.sort((a, b) => b.cost - a.cost);
}

export function loadWorkflowConfig(argv = process.argv.slice(2)) {
  const { config, missing } = loadConfig(argv);

  if (missing.length) {
    throw new Error(
      `Missing required config: ${missing.join(", ")}. Copy .env.google-ads.example to .env.google-ads and fill it in.`,
    );
  }

  if (!fs.existsSync(config.serviceAccountKeyPath)) {
    throw new Error(
      `Service account JSON not found at ${config.serviceAccountKeyPath}. Check GOOGLE_ADS_SERVICE_ACCOUNT_KEY_PATH.`,
    );
  }

  return config;
}
