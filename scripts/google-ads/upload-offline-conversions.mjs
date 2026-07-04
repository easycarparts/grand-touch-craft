import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { loadWorkflowConfig, mutate, searchStream } from "./api.mjs";

/**
 * Offline conversion upload: CRM (Supabase) -> Google Ads.
 * Plan: docs/google-fresh-start-plan-2026-07-04.md §4 / handoff §4.
 *
 * Uploads via the DATA MANAGER API (datamanager.googleapis.com/v1/events:ingest).
 * The Google Ads API's ConversionUploadService rejected us with
 * CUSTOMER_NOT_ALLOWLISTED_FOR_THIS_FEATURE — new integrations must use Data
 * Manager: https://developers.google.com/data-manager/api/devguides/events/google-ads/offline
 *
 * What it uploads (Google-attributed leads only):
 *   - status reached qualified/quoted  -> "CRM Qualified Lead"
 *   - status reached won               -> "CRM Closed Won" (+ latest_quote_estimate as value)
 *
 * A lead counts as Google-attributed when it has a gclid OR utm_source/source_platform
 * says google. Two matching paths per conversion:
 *   - gclid (exact click match) when the funnel captured one
 *   - hashed phone (enhanced conversions for leads) ALWAYS included when a phone
 *     exists — this is how WhatsApp-first leads with no gclid get matched back
 *     to their ad click. Requires "Enhanced conversions for leads" ON in
 *     Google Ads (Goals -> Settings) + customer data terms accepted.
 *
 * Both conversion actions are created as SECONDARY (primaryForGoal=false) so they
 * do NOT change what campaign 23996324292 bids toward during the 14-day freeze.
 * Promotion later = add "CRM Qualified Lead" to custom goal 6458221953.
 *
 * Re-runs are safe: transactionId = lead id, so Google dedupes repeats.
 * Ingest is ASYNC — per-event outcomes are checked later:
 *   node scripts/google-ads/upload-offline-conversions.mjs --env=.env.google-ads --check=<requestId>
 *
 * SAFE BY DEFAULT: dry-run (validateOnly ingest, writes nothing) unless `--apply`.
 * Usage:
 *   node scripts/google-ads/upload-offline-conversions.mjs --env=.env.google-ads
 *   node scripts/google-ads/upload-offline-conversions.mjs --env=.env.google-ads --apply
 *
 * Needs in .env.supabase (or --supabase-env=...):
 *   VITE_SUPABASE_URL=...            (already there)
 *   SUPABASE_SERVICE_ROLE_KEY=...    (Supabase dashboard -> Settings -> API -> service_role)
 *
 * Prereq (one-time): enable "Data Manager API" on the Google Cloud project that
 * owns the service account — the error message links straight to the enable page
 * if it is off.
 */

const DATA_MANAGER_ENDPOINT = "https://datamanager.googleapis.com/v1";
const DATA_MANAGER_SCOPE = "https://www.googleapis.com/auth/datamanager";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

const QUALIFIED_ACTION_NAME = "CRM Qualified Lead";
const WON_ACTION_NAME = "CRM Closed Won";
const DUBAI_OFFSET = "+04:00";
const DUBAI_OFFSET_MS = 4 * 60 * 60 * 1000;

function parseOptions(argv) {
  const options = { apply: false, supabaseEnv: ".env.supabase", check: "" };
  for (const arg of argv) {
    if (arg === "--apply") options.apply = true;
    if (arg.startsWith("--supabase-env=")) options.supabaseEnv = arg.split("=")[1];
    if (arg.startsWith("--check=")) options.check = arg.split("=")[1];
  }
  return options;
}

// --- Data Manager API auth (same service account, different scope) ---
const base64Url = (input) =>
  Buffer.from(input).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");

async function getDataManagerToken(config) {
  const keyData = JSON.parse(fs.readFileSync(config.serviceAccountKeyPath, "utf8"));
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }))}.${base64Url(
    JSON.stringify({
      iss: keyData.client_email,
      scope: DATA_MANAGER_SCOPE,
      aud: TOKEN_URL,
      exp: now + 3600,
      iat: now,
    }),
  )}`;
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(unsigned);
  const jwt = `${unsigned}.${base64Url(signer.sign(keyData.private_key))}`;

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok || !json.access_token) {
    throw new Error(`Data Manager token request failed (${response.status}): ${JSON.stringify(json).slice(0, 400)}`);
  }
  return json.access_token;
}

async function dataManagerPost(config, method, body) {
  const token = await getDataManagerToken(config);
  const response = await fetch(`${DATA_MANAGER_ENDPOINT}/${method}`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Data Manager returned non-JSON (${response.status}): ${text.slice(0, 400)}`);
  }
  if (!response.ok) {
    throw new Error(`Data Manager ${method} failed (${response.status}): ${JSON.stringify(json, null, 2).slice(0, 2000)}`);
  }
  return json;
}

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const env = {};
  for (const rawLine of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i === -1) continue;
    let value = line.slice(i + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[line.slice(0, i).trim()] = value;
  }
  return env;
}

function loadSupabaseConfig(options) {
  const envPath = path.resolve(process.cwd(), options.supabaseEnv);
  const env = parseEnvFile(envPath);
  const url = process.env.SUPABASE_URL || env.SUPABASE_URL || env.VITE_SUPABASE_URL || "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url) throw new Error(`No Supabase URL in ${envPath} (VITE_SUPABASE_URL).`);
  if (!serviceKey) {
    throw new Error(
      `SUPABASE_SERVICE_ROLE_KEY missing. Add it to ${envPath} — Supabase dashboard -> Project Settings -> API -> service_role key. ` +
        `(The anon key cannot SELECT leads because of RLS.)`,
    );
  }
  return { url: url.replace(/\/$/, ""), serviceKey };
}

async function supabaseGet(sb, pathAndQuery) {
  const response = await fetch(`${sb.url}/rest/v1/${pathAndQuery}`, {
    headers: { apikey: sb.serviceKey, authorization: `Bearer ${sb.serviceKey}` },
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`Supabase ${response.status}: ${text.slice(0, 400)}`);
  return JSON.parse(text);
}

// --- Phone -> E.164 -> SHA-256 (enhanced conversions for leads) ---
function toE164(rawPhone) {
  if (!rawPhone) return null;
  let digits = String(rawPhone).replace(/[^\d+]/g, "");
  if (digits.startsWith("00")) digits = `+${digits.slice(2)}`;
  if (digits.startsWith("+")) return /^\+\d{8,15}$/.test(digits) ? digits : null;
  if (digits.startsWith("971")) return `+${digits}`;
  if (digits.startsWith("05") && digits.length === 10) return `+971${digits.slice(1)}`;
  if (digits.startsWith("5") && digits.length === 9) return `+971${digits}`;
  return digits.length >= 8 ? `+971${digits.replace(/^0+/, "")}` : null;
}

const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");

function toDubaiDateTime(isoTimestamp) {
  const utcMs = new Date(isoTimestamp).getTime();
  if (!Number.isFinite(utcMs)) return null;
  const local = new Date(utcMs + DUBAI_OFFSET_MS);
  const pad = (n) => String(n).padStart(2, "0");
  // RFC 3339 with Dubai offset, as Data Manager expects
  return (
    `${local.getUTCFullYear()}-${pad(local.getUTCMonth() + 1)}-${pad(local.getUTCDate())}T` +
    `${pad(local.getUTCHours())}:${pad(local.getUTCMinutes())}:${pad(local.getUTCSeconds())}${DUBAI_OFFSET}`
  );
}

const isGoogleLead = (lead) =>
  Boolean(lead.gclid) ||
  String(lead.utm_source || "").toLowerCase().includes("google") ||
  String(lead.source_platform || "").toLowerCase().includes("google");

const maskPhone = (phone) => (phone ? `${phone.slice(0, 6)}…${phone.slice(-2)}` : "(none)");

// --- Google Ads: account prerequisites + conversion actions ---
async function checkEnhancedConversionsSetting(config) {
  const rows = await searchStream(
    config,
    `SELECT customer.conversion_tracking_setting.accepted_customer_data_terms,
            customer.conversion_tracking_setting.enhanced_conversions_for_leads_enabled
     FROM customer LIMIT 1`,
  );
  const setting = rows[0]?.customer?.conversionTrackingSetting || {};
  return {
    acceptedCustomerDataTerms: Boolean(setting.acceptedCustomerDataTerms),
    eclEnabled: Boolean(setting.enhancedConversionsForLeadsEnabled),
  };
}

async function ensureConversionActions(config, options) {
  const rows = await searchStream(
    config,
    `SELECT conversion_action.id, conversion_action.name, conversion_action.resource_name
     FROM conversion_action
     WHERE conversion_action.status != 'REMOVED'
       AND conversion_action.name IN ('${QUALIFIED_ACTION_NAME}', '${WON_ACTION_NAME}')`,
  );
  const byName = new Map(rows.map((r) => [r.conversionAction.name, r.conversionAction.resourceName]));

  const wanted = [
    { name: QUALIFIED_ACTION_NAME, category: "QUALIFIED_LEAD", defaultValue: 0 },
    { name: WON_ACTION_NAME, category: "PURCHASE", defaultValue: 0 },
  ];

  const operations = [];
  for (const action of wanted) {
    if (byName.has(action.name)) continue;
    operations.push({
      conversionActionOperation: {
        create: {
          name: action.name,
          type: "UPLOAD_CLICKS",
          category: action.category,
          status: "ENABLED",
          primaryForGoal: false, // secondary — does not affect campaign bidding/freeze
          countingType: "ONE_PER_CLICK",
          clickThroughLookbackWindowDays: 90,
          valueSettings: {
            defaultValue: action.defaultValue,
            defaultCurrencyCode: "AED",
            alwaysUseDefaultValue: false,
          },
        },
      },
    });
  }

  if (operations.length && !options.apply) {
    console.log(`Would create ${operations.length} conversion action(s): ${wanted
      .filter((w) => !byName.has(w.name))
      .map((w) => w.name)
      .join(", ")} (apply mode only)`);
    return null;
  }

  if (operations.length) {
    const result = await mutate(config, operations, { partialFailure: false, validateOnly: false });
    const created = result.mutateOperationResponses || [];
    for (const response of created) {
      const rn = response.conversionActionResult?.resourceName;
      if (rn) console.log(`Created conversion action: ${rn}`);
    }
    // Re-read to map names -> resource names
    return ensureConversionActions(config, options);
  }

  return byName;
}

// --- CRM: pull Google-attributed status transitions ---
async function fetchCrmConversions(sb) {
  const history = await supabaseGet(
    sb,
    `lead_status_history?select=lead_id,to_status,created_at&to_status=in.(qualified,quoted,won)&order=created_at.asc&limit=10000`,
  );

  // Earliest transition per lead per bucket (qualified|won)
  const transitions = new Map(); // lead_id -> { qualified: iso, won: iso }
  for (const row of history) {
    const bucket = row.to_status === "won" ? "won" : "qualified";
    const entry = transitions.get(row.lead_id) || {};
    if (!entry[bucket]) entry[bucket] = row.created_at;
    transitions.set(row.lead_id, entry);
  }

  // Leads currently in a target status with no history row (edge case)
  const current = await supabaseGet(
    sb,
    `leads?select=id,status,updated_at&status=in.(qualified,quoted,won)&limit=10000`,
  );
  for (const lead of current) {
    const bucket = lead.status === "won" ? "won" : "qualified";
    const entry = transitions.get(lead.id) || {};
    if (!entry[bucket]) entry[bucket] = lead.updated_at;
    transitions.set(lead.id, entry);
  }

  // A win implies the lead was qualified — count both signals.
  for (const entry of transitions.values()) {
    if (entry.won && !entry.qualified) entry.qualified = entry.won;
  }

  const ids = [...transitions.keys()];
  const leads = [];
  for (let i = 0; i < ids.length; i += 100) {
    const chunk = ids.slice(i, i + 100);
    const rows = await supabaseGet(
      sb,
      `leads?select=id,phone,normalized_phone,gclid,utm_source,source_platform,funnel_name,latest_quote_estimate,status,vehicle_label&id=in.(${chunk.join(",")})`,
    );
    leads.push(...rows);
  }

  return { transitions, leads };
}

const actionIdFrom = (resourceName) => String(resourceName || "").split("/").pop();

function buildUploads(actionResourceNames, transitions, leads) {
  const uploads = []; // { actionName, actionId, event, display }
  const skipped = { notGoogle: 0, noIdentifiers: 0 };

  for (const lead of leads) {
    if (!isGoogleLead(lead)) {
      skipped.notGoogle += 1;
      continue;
    }

    const e164 = toE164(lead.normalized_phone || lead.phone);
    const gclid = (lead.gclid || "").trim();
    if (!gclid && !e164) {
      skipped.noIdentifiers += 1;
      continue;
    }

    const entry = transitions.get(lead.id) || {};
    const buckets = [
      entry.qualified && {
        actionName: QUALIFIED_ACTION_NAME,
        actionId: actionIdFrom(actionResourceNames.get(QUALIFIED_ACTION_NAME)),
        time: entry.qualified,
        value: null,
      },
      entry.won && {
        actionName: WON_ACTION_NAME,
        actionId: actionIdFrom(actionResourceNames.get(WON_ACTION_NAME)),
        time: entry.won,
        value: Number(lead.latest_quote_estimate) > 0 ? Number(lead.latest_quote_estimate) : null,
      },
    ].filter(Boolean);

    for (const bucket of buckets) {
      const eventTimestamp = toDubaiDateTime(bucket.time);
      if (!eventTimestamp || !bucket.actionId) continue;

      const event = {
        eventTimestamp,
        transactionId: lead.id, // dedupe key across re-runs
        eventSource: "WEB",
      };
      if (gclid) event.adIdentifiers = { gclid };
      if (e164) event.userData = { userIdentifiers: [{ phoneNumber: sha256(e164) }] };
      if (bucket.value) {
        event.conversionValue = bucket.value;
        event.currency = "AED";
      }

      uploads.push({
        actionName: bucket.actionName,
        actionId: bucket.actionId,
        event,
        display: {
          leadId: lead.id,
          action: bucket.actionName,
          time: eventTimestamp,
          gclid: gclid ? "yes" : "no (phone match)",
          phone: maskPhone(e164),
          value: bucket.value || "",
          funnel: lead.funnel_name || lead.source_platform || "",
        },
      });
    }
  }

  return { uploads, skipped };
}

async function ingestForAction(config, actionId, actionName, events, options) {
  const request = {
    destinations: [
      {
        operatingAccount: { accountType: "GOOGLE_ADS", accountId: config.customerId },
        productDestinationId: actionId,
      },
    ],
    events,
    consent: { adUserData: "CONSENT_GRANTED", adPersonalization: "CONSENT_GRANTED" },
    encoding: "HEX",
    validateOnly: !options.apply,
  };

  const result = await dataManagerPost(config, "events:ingest", request);
  const label = options.apply ? "INGESTED" : "VALIDATED (dry-run)";
  console.log(`${label} ${events.length} event(s) -> ${actionName} (action ${actionId}). requestId: ${result.requestId || "(none)"}`);
  return result.requestId;
}

try {
  const options = parseOptions(process.argv.slice(2));
  const config = loadWorkflowConfig(process.argv.slice(2));

  if (options.check) {
    const token = await getDataManagerToken(config);
    const response = await fetch(
      `${DATA_MANAGER_ENDPOINT}/requestStatus:retrieve?requestId=${encodeURIComponent(options.check)}`,
      { headers: { authorization: `Bearer ${token}` } },
    );
    console.log(JSON.stringify(await response.json(), null, 2));
    process.exit(0);
  }

  const sb = loadSupabaseConfig(options);

  console.log(`Mode: ${options.apply ? "APPLY" : "DRY-RUN (validateOnly — nothing recorded)"}`);

  const ecl = await checkEnhancedConversionsSetting(config);
  if (!ecl.eclEnabled || !ecl.acceptedCustomerDataTerms) {
    console.warn(
      `⚠ Enhanced conversions for leads not fully enabled (terms accepted: ${ecl.acceptedCustomerDataTerms}, ` +
        `ECL enabled: ${ecl.eclEnabled}). Phone-only matches will be dropped by Google until this is ON: ` +
        `Google Ads -> Goals -> Settings -> Enhanced conversions for leads. gclid-based rows still work.`,
    );
  } else {
    console.log("Enhanced conversions for leads: enabled ✓");
  }

  const actionResourceNames = await ensureConversionActions(config, options);

  const { transitions, leads } = await fetchCrmConversions(sb);
  console.log(`CRM: ${leads.length} lead(s) reached qualified/quoted/won.`);

  if (!actionResourceNames) {
    console.log("Dry-run stops here (conversion actions not created yet). Run with --apply.");
    process.exit(0);
  }

  const { uploads, skipped } = buildUploads(actionResourceNames, transitions, leads);
  console.log(
    `Eligible: ${uploads.length} conversion(s) | skipped: ${skipped.notGoogle} non-Google lead(s), ` +
      `${skipped.noIdentifiers} Google lead(s) with no gclid AND no usable phone.`,
  );

  if (uploads.length) {
    console.table(uploads.map((u) => u.display));
  }

  if (!uploads.length) {
    console.log("Nothing to upload.");
    process.exit(0);
  }

  const requestIds = [];
  for (const actionName of [QUALIFIED_ACTION_NAME, WON_ACTION_NAME]) {
    const group = uploads.filter((u) => u.actionName === actionName);
    if (!group.length) continue;
    const requestId = await ingestForAction(
      config,
      group[0].actionId,
      actionName,
      group.map((u) => u.event),
      options,
    );
    if (requestId) requestIds.push(requestId);
  }

  if (!options.apply) {
    console.log("Dry-run complete — Google validated the payload, nothing recorded. Re-run with --apply.");
  } else {
    console.log(
      `Done. Ingest is async — check processing later with --check=<requestId>. ` +
        `Conversions appear in Google Ads within ~3h, reported at click date.`,
    );
    if (requestIds.length) console.log(`requestIds: ${requestIds.join(", ")}`);
  }
} catch (error) {
  console.error("upload-offline-conversions failed.");
  console.error(error.message);
  process.exitCode = 1;
}
