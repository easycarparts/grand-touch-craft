import { loadWorkflowConfig, mutate, searchStream } from "./api.mjs";

/**
 * July 2026 PPF price campaign rescue.
 *
 * Evidence:
 * - Live keyword report: "ppf car" phrase spent ~AED 340 with 0 conversions.
 * - Keyword Planner CSVs from 2026-07-07: premium model exact terms mostly have
 *   unknown volume; usable supply is local PPF + price intent.
 *
 * SAFE BY DEFAULT: validateOnly dry-run unless `--apply`.
 *
 * Usage:
 *   node scripts/google-ads/rescue-ppf-price-jul-2026.mjs --env=.env.google-ads
 *   node scripts/google-ads/rescue-ppf-price-jul-2026.mjs --env=.env.google-ads --apply
 */

const DEFAULT_CAMPAIGN_NAME = "PPF Price Search Dubai - Jul 2026";

const KEYWORDS_TO_PAUSE = [
  {
    adGroup: "Core PPF Dubai",
    text: "ppf car",
    matchType: "PHRASE",
    reason: "20 clicks / AED 340.63 / 0 conversions in Jul 2026 launch window",
  },
  {
    adGroup: "Core PPF Dubai",
    text: "ppf near me",
    matchType: "PHRASE",
    reason: "May campaign proved near-me intent weak: PPF Near Me Local spent AED 169.23 / 7 clicks / 0 conversions",
  },
];

const CAMPAIGN_NEGATIVES = [
  {
    text: "ppf coating",
    matchType: "PHRASE",
    reason: "Bought ppf coating variants; coating intent is consistently weaker than film/install intent",
  },
  {
    text: "ppf",
    matchType: "EXACT",
    reason: "Single-token generic query took spend with no conversion; keep longer local/price variants live",
  },
  {
    text: "ppf for car",
    matchType: "EXACT",
    reason: "Generic close variant seen from ppf car, without Dubai/price/install intent",
  },
  {
    text: "near me",
    matchType: "PHRASE",
    reason: "Near-me cluster was isolated in May and paused after AED 169.23 / 0 conversions",
  },
];

const EXACT_KEYWORDS_TO_ADD = [
  // Price intent: low volume, highest message match with /ppf-dubai-price.
  { adGroup: "PPF Price Quote", text: "paint protection film dubai price" },
  { adGroup: "PPF Price Quote", text: "ppf price dubai" },
  { adGroup: "PPF Price Quote", text: "ppf cost dubai" },
  { adGroup: "PPF Price Quote", text: "ppf dubai cost" },
  { adGroup: "PPF Price Quote", text: "car ppf cost" },
  { adGroup: "PPF Price Quote", text: "stek ppf price" },

  // Local intent with enough planner volume to replace broad "ppf car" spend.
  { adGroup: "Core PPF Dubai", text: "ppf dubai" },
  { adGroup: "Core PPF Dubai", text: "paint protection film dubai" },
  { adGroup: "Core PPF Dubai", text: "best ppf in dubai" },
  { adGroup: "Core PPF Dubai", text: "ppf in dubai" },
  { adGroup: "Core PPF Dubai", text: "car ppf dubai" },
  { adGroup: "Core PPF Dubai", text: "ppf car protection dubai" },
  { adGroup: "Core PPF Dubai", text: "car paint protection dubai" },
  { adGroup: "Core PPF Dubai", text: "paint protection dubai" },

  // STEK intent: small but strategically useful, exact-only.
  { adGroup: "STEK Film", text: "stek ppf dubai" },
  { adGroup: "STEK Film", text: "stek dynoshield price" },
];

function parseOptions(argv) {
  return { apply: argv.includes("--apply") };
}

const esc = (value) => String(value).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
const key = (...parts) => parts.map((part) => String(part || "").toLowerCase()).join("::");

async function getCampaign(config, campaignName) {
  const rows = await searchStream(
    config,
    `SELECT campaign.resource_name, campaign.name
     FROM campaign
     WHERE campaign.name = '${esc(campaignName)}'
     LIMIT 1`,
  );
  const campaign = rows[0]?.campaign;
  if (!campaign?.resourceName) throw new Error(`Campaign not found: ${campaignName}`);
  return campaign;
}

async function getAdGroups(config, campaignName) {
  const rows = await searchStream(
    config,
    `SELECT ad_group.resource_name, ad_group.name, ad_group.status
     FROM ad_group
     WHERE campaign.name = '${esc(campaignName)}'
       AND ad_group.status != 'REMOVED'`,
  );
  return new Map(rows.map((row) => [row.adGroup?.name, row.adGroup]));
}

async function getKeywordCriteria(config, campaignName) {
  return searchStream(
    config,
    `SELECT
       ad_group.name,
       ad_group_criterion.resource_name,
       ad_group_criterion.status,
       ad_group_criterion.keyword.text,
       ad_group_criterion.keyword.match_type
     FROM ad_group_criterion
     WHERE campaign.name = '${esc(campaignName)}'
       AND ad_group_criterion.type = KEYWORD
       AND ad_group_criterion.negative = false
       AND ad_group_criterion.status != 'REMOVED'`,
  );
}

async function getCampaignNegatives(config, campaignName) {
  return searchStream(
    config,
    `SELECT
       campaign_criterion.keyword.text,
       campaign_criterion.keyword.match_type
     FROM campaign_criterion
     WHERE campaign.name = '${esc(campaignName)}'
       AND campaign_criterion.negative = true
       AND campaign_criterion.type = KEYWORD
       AND campaign_criterion.status != 'REMOVED'`,
  );
}

try {
  const argv = process.argv.slice(2);
  const options = parseOptions(argv);
  const config = loadWorkflowConfig(argv);
  const campaignName = config.campaign || DEFAULT_CAMPAIGN_NAME;
  const validateOnly = !options.apply;

  const [campaign, adGroups, keywordRows, negativeRows] = await Promise.all([
    getCampaign(config, campaignName),
    getAdGroups(config, campaignName),
    getKeywordCriteria(config, campaignName),
    getCampaignNegatives(config, campaignName),
  ]);

  const keywordMap = new Map(
    keywordRows.map((row) => [
      key(row.adGroup?.name, row.adGroupCriterion?.keyword?.text, row.adGroupCriterion?.keyword?.matchType),
      row,
    ]),
  );
  const existingNegatives = new Set(
    negativeRows.map((row) =>
      key(row.campaignCriterion?.keyword?.text, row.campaignCriterion?.keyword?.matchType),
    ),
  );

  const operations = [];
  const pauseLog = [];
  const negativeLog = [];
  const keywordLog = [];

  for (const item of KEYWORDS_TO_PAUSE) {
    const row = keywordMap.get(key(item.adGroup, item.text, item.matchType));
    if (!row?.adGroupCriterion?.resourceName) {
      pauseLog.push(`SKIP missing: ${item.adGroup} / ${item.text} [${item.matchType}]`);
      continue;
    }
    if (row.adGroupCriterion.status === "PAUSED") {
      pauseLog.push(`SKIP already paused: ${item.adGroup} / ${item.text} [${item.matchType}]`);
      continue;
    }
    operations.push({
      adGroupCriterionOperation: {
        update: {
          resourceName: row.adGroupCriterion.resourceName,
          status: "PAUSED",
        },
        updateMask: "status",
      },
    });
    pauseLog.push(`PAUSE ${item.adGroup} / ${item.text} [${item.matchType}] - ${item.reason}`);
  }

  for (const item of CAMPAIGN_NEGATIVES) {
    if (existingNegatives.has(key(item.text, item.matchType))) {
      negativeLog.push(`SKIP existing negative: ${item.text} [${item.matchType}]`);
      continue;
    }
    operations.push({
      campaignCriterionOperation: {
        create: {
          campaign: campaign.resourceName,
          negative: true,
          keyword: { text: item.text, matchType: item.matchType },
        },
      },
    });
    negativeLog.push(`ADD negative: ${item.text} [${item.matchType}] - ${item.reason}`);
  }

  for (const item of EXACT_KEYWORDS_TO_ADD) {
    const adGroup = adGroups.get(item.adGroup);
    if (!adGroup?.resourceName) {
      keywordLog.push(`SKIP missing ad group: ${item.adGroup} / ${item.text} [EXACT]`);
      continue;
    }
    if (keywordMap.has(key(item.adGroup, item.text, "EXACT"))) {
      keywordLog.push(`SKIP existing keyword: ${item.adGroup} / ${item.text} [EXACT]`);
      continue;
    }
    operations.push({
      adGroupCriterionOperation: {
        create: {
          adGroup: adGroup.resourceName,
          status: "ENABLED",
          keyword: { text: item.text, matchType: "EXACT" },
        },
      },
    });
    keywordLog.push(`ADD keyword: ${item.adGroup} / ${item.text} [EXACT]`);
  }

  console.log(`Campaign: ${campaignName}`);
  console.log(`Mode: ${options.apply ? "APPLY" : "DRY-RUN (validateOnly)"}`);
  console.log(`Operations: ${operations.length}`);
  console.log("\nKeyword pauses");
  console.log(pauseLog.join("\n") || "(none)");
  console.log("\nCampaign negatives");
  console.log(negativeLog.join("\n") || "(none)");
  console.log("\nExact keyword additions");
  console.log(keywordLog.join("\n") || "(none)");

  if (operations.length) {
    await mutate(config, operations, {
      partialFailure: false,
      validateOnly,
    });
    console.log(validateOnly ? "\nValidated. Re-run with --apply to write changes." : "\nApplied.");
  }
} catch (error) {
  console.error("rescue-ppf-price-jul-2026 failed.");
  console.error(error.message);
  process.exitCode = 1;
}
