import { loadWorkflowConfig, mutate, searchStream } from "./api.mjs";

const CAMPAIGN_NAME = "PPF Search Dubai - High Intent - May 2026";

const NEGATIVES = [
  "ceramic coating",
  "car detailing",
  "tinting",
  "wrapping",
  "reviews",
  "aar luxe",
  "mkn garage",
  "warehouse 6 street 25",
  "maxguard",
  "wrapsters",
  "the detailing experts",
  "system x",
  "elite shine",
  "nanoz",
  "union delta",
  "carpi",
  "detailing",
  "window tint",
  "car storage",
  "topaz",
  "topaz detailing",
  "origin8",
  "jem auto",
  "xpel",
  "smart repair",
  "stek uae",
  "ppf coating",
  "coating price",
  "approved detailing",
  "black diamond ppf",
  "foilack",
  "rma ppf",
];

function parseOptions(argv) {
  return {
    validateOnly: argv.includes("--validate-only"),
  };
}

function escapeGaql(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function keywordKey(text, matchType) {
  return `${String(text).toLowerCase()}::${matchType}`;
}

async function getCampaign(config) {
  const query = `
    SELECT
      campaign.resource_name,
      campaign.name
    FROM campaign
    WHERE campaign.name = '${escapeGaql(CAMPAIGN_NAME)}'
    LIMIT 1
  `;

  const rows = await searchStream(config, query);
  const campaign = rows[0]?.campaign;
  if (!campaign?.resourceName) {
    throw new Error(`Campaign not found: ${CAMPAIGN_NAME}`);
  }
  return campaign;
}

async function getExistingCampaignNegatives(config) {
  const query = `
    SELECT
      campaign_criterion.keyword.text,
      campaign_criterion.keyword.match_type
    FROM campaign_criterion
    WHERE campaign.name = '${escapeGaql(CAMPAIGN_NAME)}'
      AND campaign_criterion.negative = true
      AND campaign_criterion.type = KEYWORD
      AND campaign_criterion.status != 'REMOVED'
  `;

  const rows = await searchStream(config, query);
  return new Set(
    rows.map((row) =>
      keywordKey(row.campaignCriterion?.keyword?.text || "", row.campaignCriterion?.keyword?.matchType || ""),
    ),
  );
}

function buildNegativeOperation(campaignResourceName, text) {
  return {
    campaignCriterionOperation: {
      create: {
        campaign: campaignResourceName,
        negative: true,
        keyword: {
          text,
          matchType: "PHRASE",
        },
      },
    },
  };
}

try {
  const options = parseOptions(process.argv.slice(2));
  const config = loadWorkflowConfig(process.argv.slice(2));
  const campaign = await getCampaign(config);
  const existingNegatives = await getExistingCampaignNegatives(config);

  const added = [];
  const operations = [];

  for (const negative of NEGATIVES) {
    const key = keywordKey(negative, "PHRASE");
    if (existingNegatives.has(key)) continue;
    operations.push(buildNegativeOperation(campaign.resourceName, negative));
    added.push(negative);
  }

  if (operations.length) {
    await mutate(config, operations, {
      partialFailure: false,
      validateOnly: options.validateOnly,
    });
  }

  console.log(`${options.validateOnly ? "Validated" : "Added"} cleanup negatives for ${CAMPAIGN_NAME}.`);
  console.log(`Negatives added: ${added.length}`);
  for (const item of added) {
    console.log(`- ${item}`);
  }
} catch (error) {
  console.error("ads:add-may-2026-cleanup-negatives failed.");
  console.error(error.message);
  process.exitCode = 1;
}
