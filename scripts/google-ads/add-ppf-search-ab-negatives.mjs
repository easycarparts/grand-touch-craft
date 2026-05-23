import { loadWorkflowConfig, mutate, searchStream } from "./api.mjs";

const CAMPAIGN_NAMES = [
  "PPF Search UAE - WhatsApp - May 2026",
  "PPF Search UAE - Calculator AB - May 2026",
];

const NEGATIVES = ["aar luxe", "ajman"];

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
  const quotedNames = CAMPAIGN_NAMES.map((name) => `'${escapeGaql(name)}'`).join(", ");
  const query = `
    SELECT
      campaign.resource_name,
      campaign.name
    FROM campaign
    WHERE campaign.name IN (${quotedNames})
      AND campaign.status != 'REMOVED'
  `;

  const rows = await searchStream(config, query);
  const campaigns = rows.map((row) => row.campaign).filter(Boolean);
  const foundNames = new Set(campaigns.map((campaign) => campaign.name));
  const missingNames = CAMPAIGN_NAMES.filter((name) => !foundNames.has(name));

  if (missingNames.length) {
    throw new Error(`Campaigns not found: ${missingNames.join(", ")}`);
  }

  return campaigns;
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

  const addedByCampaign = [];
  const operations = [];

  for (const campaign of campaigns) {
    const existingNegatives = await getExistingCampaignNegatives(config, campaign.name);
    const added = [];

    for (const negative of NEGATIVES) {
      const key = keywordKey(negative, "PHRASE");
      if (existingNegatives.has(key)) continue;
      operations.push(buildNegativeOperation(campaign.resourceName, negative));
      added.push(negative);
    }

    addedByCampaign.push({ campaignName: campaign.name, added });
  }

  if (operations.length) {
    await mutate(config, operations, {
      partialFailure: false,
      validateOnly: options.validateOnly,
    });
  }

  console.log(`${options.validateOnly ? "Validated" : "Added"} PPF search AB negatives.`);
  for (const { campaignName, added } of addedByCampaign) {
    console.log(`${campaignName}: ${added.length ? added.join(", ") : "already covered"}`);
  }
} catch (error) {
  console.error("ads:add-ppf-search-ab-negatives failed.");
  console.error(error.message);
  process.exitCode = 1;
}
