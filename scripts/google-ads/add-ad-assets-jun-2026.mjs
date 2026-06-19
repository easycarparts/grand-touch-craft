import { loadWorkflowConfig, mutate, searchStream } from "./api.mjs";

/**
 * June 2026 additive ad assets for the May campaign:
 *   - 1 Call asset (Sean's number, account-level call conversion)
 *   - 4 new callouts
 *   - 2 new sitelinks (pointing to the V2 funnel)
 *
 * Purely additive — does NOT touch RSAs, bidding, budget, or keywords.
 * Dedupes against existing assets. SAFE BY DEFAULT: validateOnly dry-run unless
 * you pass `--apply`.
 *
 * NOTE: the 9am-9pm call schedule must be set on the call asset in the Google
 * Ads UI — per-asset ad scheduling is not exposed in the API asset model.
 */

const CAMPAIGN = "PPF Search UAE - WhatsApp - May 2026";
const V2_URL =
  "https://www.grandtouchauto.ae/ppf-full-ppf-calculator-guided-v2" +
  "?utm_source=google&utm_medium=paid_search&utm_campaign=ppf_whatsapp_search_may_2026";

const CALL = { countryCode: "AE", phoneNumber: "0567191045" };

const CALLOUTS = [
  "Free Pickup Across Dubai",
  "New Car Protection",
  "Premium Films Available",
  "Trusted By Dubai Drivers",
];

const SITELINKS = [
  {
    linkText: "Free Pickup & Delivery",
    description1: "We collect across Dubai",
    description2: "Doorstep PPF service",
    finalUrl: V2_URL,
  },
  {
    linkText: "Real Customer Handovers",
    description1: "See finished cars",
    description2: "Proof before you book",
    finalUrl: V2_URL,
  },
];

const esc = (v) => String(v).replace(/\\/g, "\\\\").replace(/'/g, "\\'");

function validateLengths() {
  for (const s of SITELINKS) {
    if (s.linkText.length > 25) throw new Error(`Sitelink text too long: ${s.linkText}`);
    if (s.description1.length > 35) throw new Error(`desc1 too long: ${s.description1}`);
    if (s.description2.length > 35) throw new Error(`desc2 too long: ${s.description2}`);
  }
  for (const c of CALLOUTS) if (c.length > 25) throw new Error(`Callout too long: ${c}`);
}

try {
  validateLengths();
  const argv = process.argv.slice(2);
  const config = loadWorkflowConfig(argv);
  const apply = argv.includes("--apply");
  const cid = config.customerId;

  const campRows = await searchStream(
    config,
    `SELECT campaign.resource_name, campaign.name FROM campaign WHERE campaign.name = '${esc(CAMPAIGN)}' LIMIT 1`,
  );
  const campaign = campRows[0]?.campaign;
  if (!campaign) throw new Error(`Campaign "${CAMPAIGN}" not found.`);

  const existing = await searchStream(
    config,
    `SELECT campaign.name, campaign_asset.field_type, asset.sitelink_asset.link_text, asset.callout_asset.callout_text
     FROM campaign_asset
     WHERE campaign.name = '${esc(CAMPAIGN)}' AND campaign_asset.status != 'REMOVED'`,
  );
  const haveCallout = new Set(
    existing.filter((r) => r.campaignAsset?.fieldType === "CALLOUT").map((r) => r.asset?.calloutAsset?.calloutText),
  );
  const haveSitelink = new Set(
    existing.filter((r) => r.campaignAsset?.fieldType === "SITELINK").map((r) => r.asset?.sitelinkAsset?.linkText),
  );
  const haveCall = existing.some((r) => r.campaignAsset?.fieldType === "CALL");

  const ops = [];
  const added = { call: false, callouts: [], sitelinks: [] };
  let tempId = -1;
  const tempName = () => `customers/${cid}/assets/${tempId}`;
  const link = (fieldType) => ({
    campaignAssetOperation: { create: { campaign: campaign.resourceName, asset: tempName(), fieldType } },
  });

  if (!haveCall) {
    ops.push({
      assetOperation: {
        create: {
          resourceName: tempName(),
          name: "ppf_call_sean_jun2026",
          callAsset: {
            countryCode: CALL.countryCode,
            phoneNumber: CALL.phoneNumber,
            callConversionReportingState: "USE_ACCOUNT_LEVEL_CALL_CONVERSION_ACTION",
          },
        },
      },
    });
    ops.push(link("CALL"));
    added.call = true;
    tempId -= 1;
  }

  for (const text of CALLOUTS) {
    if (haveCallout.has(text)) continue;
    ops.push({
      assetOperation: {
        create: {
          resourceName: tempName(),
          name: `ppf_callout_${text.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
          calloutAsset: { calloutText: text },
        },
      },
    });
    ops.push(link("CALLOUT"));
    added.callouts.push(text);
    tempId -= 1;
  }

  for (const s of SITELINKS) {
    if (haveSitelink.has(s.linkText)) continue;
    ops.push({
      assetOperation: {
        create: {
          resourceName: tempName(),
          name: `ppf_sitelink_${s.linkText.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
          finalUrls: [s.finalUrl],
          sitelinkAsset: { linkText: s.linkText, description1: s.description1, description2: s.description2 },
        },
      },
    });
    ops.push(link("SITELINK"));
    added.sitelinks.push(s.linkText);
    tempId -= 1;
  }

  console.log(`Campaign: ${CAMPAIGN}`);
  console.log(`Mode: ${apply ? "APPLY" : "DRY-RUN (validateOnly)"}`);
  console.log(`Call asset: ${added.call ? "ADD (" + CALL.phoneNumber + ")" : "already present, skip"}`);
  console.log(`Callouts to add: ${added.callouts.join(", ") || "(none)"}`);
  console.log(`Sitelinks to add: ${added.sitelinks.join(", ") || "(none)"}`);

  if (!ops.length) {
    console.log("Nothing to add.");
    process.exit(0);
  }

  await mutate(config, ops, { partialFailure: false, validateOnly: !apply });
  console.log(apply ? "\nApplied." : "\nValidated (no changes written). Re-run with --apply.");
  if (apply && added.call) {
    console.log("REMINDER: set the call asset's 9am-9pm schedule in the Google Ads UI.");
  }
} catch (error) {
  console.error("add-ad-assets-jun-2026 failed.");
  console.error(error.message);
  process.exitCode = 1;
}
