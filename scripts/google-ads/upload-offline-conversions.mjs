import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { loadWorkflowConfig, mutate, searchStream, googleAdsPost } from "./api.mjs";

/**
 * Offline conversion upload: CRM (Supabase) -> Google Ads.
 * Plan: docs/google-fresh-start-plan-2026-07-04.md §4 / handoff §4.
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
 * Re-runs are safe: orderId = lead id, so Google rejects duplicates.
 *
 * SAFE BY DEFAULT: dry-run (prints, writes nothing) unless you pass `--apply`.
 * Usage:
 *   node scripts/google-ads/upload-offline-conversions.mjs --env=.env.google-ads
 *   node scripts/google-ads/upload-offline-conversions.mjs --env=.env.google-ads --apply
 *
 * Needs in .env.supabase (or --supabase-env=...):
 *   VITE_SUPABASE_URL=...            (already there)
 *   SUPABASE_SERVICE_ROLE_KEY=...    (Supabase dashboard -> Settings -> API -> service_role)
 */

const QUALIFIED_ACTION_NAME = "CRM Qualified Lead";
const WON_ACTION_NAME = "CRM Closed Won";
const DUBAI_OFFSET = "+04:00";
const DUBAI_OFFSET_MS = 4 * 60 * 60 * 1000;

function parseOptions(argv) {
  const options = { apply: false, supabaseEnv: ".env.supabase" };
  for (const arg of argv) {
    if (arg === "--apply") options.apply = true;
    if (arg.startsWith("--supabase-env=")) options.supabaseEnv = arg.split("=")[1];
  }
  return options;
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
  return (
    `${local.getUTCFullYear()}-${pad(local.getUTCMonth() + 1)}-${pad(local.getUTCDate())} ` +
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

function buildUploads(actionResourceNames, transitions, leads) {
  const uploads = [];
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
        action: actionResourceNames.get(QUALIFIED_ACTION_NAME),
        actionName: QUALIFIED_ACTION_NAME,
        time: entry.qualified,
        value: null,
      },
      entry.won && {
        action: actionResourceNames.get(WON_ACTION_NAME),
        actionName: WON_ACTION_NAME,
        time: entry.won,
        value: Number(lead.latest_quote_estimate) > 0 ? Number(lead.latest_quote_estimate) : null,
      },
    ].filter(Boolean);

    for (const bucket of buckets) {
      const conversionDateTime = toDubaiDateTime(bucket.time);
      if (!conversionDateTime || !bucket.action) continue;

      const conversion = {
        conversionAction: bucket.action,
        conversionDateTime,
        orderId: lead.id,
      };
      if (gclid) conversion.gclid = gclid;
      if (e164) conversion.userIdentifiers = [{ hashedPhoneNumber: sha256(e164) }];
      if (bucket.value) {
        conversion.conversionValue = bucket.value;
        conversion.currencyCode = "AED";
      }

      uploads.push({
        conversion,
        display: {
          leadId: lead.id,
          action: bucket.actionName,
          time: conversionDateTime,
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

function summarizePartialFailure(result, uploads) {
  const failure = result.partialFailureError;
  if (!failure) return { uploaded: uploads.length, duplicates: 0, failed: 0 };

  let duplicates = 0;
  let failed = 0;
  const details = failure.details || [];
  for (const detail of details) {
    for (const error of detail.errors || []) {
      const code = Object.values(error.errorCode || {}).join(".");
      const index = error.location?.fieldPathElements?.find((e) => e.fieldName === "conversions")?.index ?? "?";
      if (String(code).includes("DUPLICATE") || String(error.message).toLowerCase().includes("duplicate")) {
        duplicates += 1;
      } else {
        failed += 1;
        console.warn(`  row ${index}: ${code} — ${error.message}`);
      }
    }
  }
  return { uploaded: uploads.length - duplicates - failed, duplicates, failed };
}

try {
  const options = parseOptions(process.argv.slice(2));
  const config = loadWorkflowConfig(process.argv.slice(2));
  const sb = loadSupabaseConfig(options);

  console.log(`Mode: ${options.apply ? "APPLY" : "DRY-RUN (nothing uploaded)"}`);

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

  if (!options.apply) {
    console.log("Dry-run complete — nothing uploaded. Re-run with --apply.");
    process.exit(0);
  }

  if (!uploads.length) {
    console.log("Nothing to upload.");
    process.exit(0);
  }

  const result = await googleAdsPost(config, `customers/${config.customerId}:uploadClickConversions`, {
    conversions: uploads.map((u) => u.conversion),
    partialFailure: true,
  });

  const summary = summarizePartialFailure(result, uploads);
  console.log(
    `Uploaded: ${summary.uploaded} | duplicates (already uploaded before): ${summary.duplicates} | failed: ${summary.failed}`,
  );
  console.log("Note: Google can take up to 3h to show uploaded conversions, reported at click date.");
} catch (error) {
  console.error("upload-offline-conversions failed.");
  console.error(error.message);
  process.exitCode = 1;
}
