import { loadWorkflowConfig, mutate, searchStream } from "./api.mjs";

const CAMPAIGN_NAMES = [
  "PPF Search UAE - WhatsApp - May 2026",
  "PPF Search UAE - Calculator AB - May 2026",
];

const NEGATIVES = [
  "suntek",
  "watch",
  "smart repair",
  "aar luxe",
  "ajman",
  "sharjah",
  "xpel ceramic",
  "ceramic coating vs ppf",
  "chrome ppf wrap",
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

async function getCampaigns(config) {
  const names = CAMPAIGN_NAMES.map((name) => `'${escapeGaql(name)}'`).join(", ");
  const query = `
    SELECT
      campaign.resource_name,
      campaign.name,
      campaign.status
    FROM campaign
    WHERE campaign.name IN (${names})
  `;

  const rows = await searchStream(config, query);
  return rows
    .map((row) => row.campaign)
    .filter((campaign) => campaign?.resourceName);
}

async function getExistingCampaignNegatives(config, campaignName) {
  const query = `
    SELECT
      campaign_criterion.keyword.text,
      campaign_criterion.keyword.match_type
    FROM campaign_criterion
    WHERE campaign.name = '${escapeGaql(campaignName)}'
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
  const campaigns = await getCampaigns(config);

  const missing = CAMPAIGN_NAMES.filter((name) => !campaigns.some((campaign) => campaign.name === name));
  if (missing.length) {
    throw new Error(`Campaigns not found: ${missing.join(", ")}`);
  }

  const operations = [];
  const addedByCampaign = new Map();

  for (const campaign of campaigns) {
    const existingNegatives = await getExistingCampaignNegatives(config, campaign.name);
    const added = [];

    for (const negative of NEGATIVES) {
      const key = keywordKey(negative, "PHRASE");
      if (existingNegatives.has(key)) continue;
      operations.push(buildNegativeOperation(campaign.resourceName, negative));
      added.push(negative);
    }

    addedByCampaign.set(campaign.name, added);
  }

  if (operations.length) {
    await mutate(config, operations, {
      partialFailure: false,
      validateOnly: options.validateOnly,
    });
  }

  console.log(`${options.validateOnly ? "Validated" : "Added"} approved PPF negatives.`);
  console.log(`Operations: ${operations.length}`);
  for (const [campaignName, added] of addedByCampaign.entries()) {
    console.log(`\n${campaignName}`);
    console.log(`Negatives ${options.validateOnly ? "to add" : "added"}: ${added.length}`);
    for (const item of added) {
      console.log(`- ${item}`);
    }
  }
} catch (error) {
  console.error("add-approved-ppf-negatives-may-2026 failed.");
  console.error(error.message);
  process.exitCode = 1;
}
