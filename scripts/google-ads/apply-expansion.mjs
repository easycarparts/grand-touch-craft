import { loadWorkflowConfig, mutate, searchStream } from "./api.mjs";

const GENERIC_KEYWORDS = [
  ["ppf dubai", "EXACT"],
  ["ppf dubai", "PHRASE"],
  ["car ppf dubai", "EXACT"],
  ["car ppf dubai", "PHRASE"],
  ["paint protection dubai", "EXACT"],
  ["paint protection dubai", "PHRASE"],
  ["car paint protection dubai", "EXACT"],
  ["car paint protection dubai", "PHRASE"],
  ["ppf installation dubai", "EXACT"],
  ["ppf installation dubai", "PHRASE"],
  ["clear bra dubai", "EXACT"],
  ["clear bra dubai", "PHRASE"],
  ["clear ppf dubai", "EXACT"],
  ["clear ppf dubai", "PHRASE"],
  ["matte ppf dubai", "EXACT"],
  ["matte ppf dubai", "PHRASE"],
  ["ppf cost dubai", "EXACT"],
  ["ppf cost dubai", "PHRASE"],
  ["paint protection film cost dubai", "EXACT"],
  ["paint protection film cost dubai", "PHRASE"],
  ["full front ppf dubai", "EXACT"],
  ["full front ppf dubai", "PHRASE"],
  ["full front ppf price dubai", "EXACT"],
  ["full front ppf price dubai", "PHRASE"],
];

const CAMPAIGN_NEGATIVES = [
  "xpel",
  "window tint",
  "tinting",
  "ceramic coating",
  "wrapping",
  "wrap",
  "color change",
  "detailing",
  "dluxe",
  "nvn",
  "vintage",
];

function toKeywordKey(text, matchType) {
  return `${text.toLowerCase()}::${matchType}`;
}

async function getCampaignAndAdGroup(config, campaignName) {
  const query = `
    SELECT
      campaign.id,
      campaign.resource_name,
      campaign.name,
      ad_group.id,
      ad_group.resource_name,
      ad_group.name
    FROM ad_group
    WHERE campaign.name = '${campaignName.replace(/'/g, "\\'")}'
    LIMIT 1
  `;

  const rows = await searchStream(config, query);
  if (!rows[0]?.campaign || !rows[0]?.adGroup) {
    throw new Error(`Could not find campaign/ad group for ${campaignName}.`);
  }

  return rows[0];
}

async function getExistingKeywords(config, campaignName) {
  const query = `
    SELECT
      ad_group_criterion.keyword.text,
      ad_group_criterion.keyword.match_type
    FROM keyword_view
    WHERE campaign.name = '${campaignName.replace(/'/g, "\\'")}'
  `;

  const rows = await searchStream(config, query);
  return new Set(
    rows.map((row) =>
      toKeywordKey(
        row.adGroupCriterion?.keyword?.text || "",
        row.adGroupCriterion?.keyword?.matchType || "",
      ),
    ),
  );
}

async function getExistingCampaignNegatives(config, campaignName) {
  const query = `
    SELECT
      campaign_criterion.keyword.text,
      campaign_criterion.keyword.match_type
    FROM campaign_criterion
    WHERE campaign.name = '${campaignName.replace(/'/g, "\\'")}'
      AND campaign_criterion.negative = true
      AND campaign_criterion.type = KEYWORD
  `;

  const rows = await searchStream(config, query);
  return new Set(
    rows.map((row) =>
      toKeywordKey(
        row.campaignCriterion?.keyword?.text || "",
        row.campaignCriterion?.keyword?.matchType || "",
      ),
    ),
  );
}

try {
  const config = loadWorkflowConfig(process.argv.slice(2));
  const campaignName = config.campaign || "Leads-Search-1";
  const campaignRow = await getCampaignAndAdGroup(config, campaignName);
  const existingKeywords = await getExistingKeywords(config, campaignName);
  const existingNegatives = await getExistingCampaignNegatives(config, campaignName);

  const mutateOperations = [];
  const addedKeywords = [];
  const addedNegatives = [];

  for (const [text, matchType] of GENERIC_KEYWORDS) {
    const key = toKeywordKey(text, matchType);
    if (existingKeywords.has(key)) {
      continue;
    }

    mutateOperations.push({
      adGroupCriterionOperation: {
        create: {
          adGroup: campaignRow.adGroup.resourceName,
          status: "ENABLED",
          keyword: {
            text,
            matchType,
          },
        },
      },
    });
    addedKeywords.push({ text, matchType });
  }

  for (const text of CAMPAIGN_NEGATIVES) {
    const key = toKeywordKey(text, "PHRASE");
    if (existingNegatives.has(key)) {
      continue;
    }

    mutateOperations.push({
      campaignCriterionOperation: {
        create: {
          campaign: campaignRow.campaign.resourceName,
          negative: true,
          keyword: {
            text,
            matchType: "PHRASE",
          },
        },
      },
    });
    addedNegatives.push(text);
  }

  mutateOperations.push({
    campaignOperation: {
      update: {
        resourceName: campaignRow.campaign.resourceName,
        targetSpend: {
          cpcBidCeilingMicros: "12000000",
        },
      },
      updateMask: "target_spend.cpc_bid_ceiling_micros",
    },
  });

  const result = await mutate(config, mutateOperations, {
    partialFailure: true,
    validateOnly: false,
  });

  console.log(`Applied Google Ads expansion to ${campaignName}.`);
  console.log(`Ad group: ${campaignRow.adGroup.name}`);
  console.log(`Keywords added: ${addedKeywords.length}`);
  for (const keyword of addedKeywords) {
    console.log(`- ${keyword.text} [${keyword.matchType}]`);
  }
  console.log(`Campaign negatives added: ${addedNegatives.length}`);
  for (const negative of addedNegatives) {
    console.log(`- ${negative}`);
  }
  console.log("Max CPC bid ceiling updated to AED 12.00");

  if (result.partialFailureError) {
    console.log("\nPartial failures returned:");
    console.log(JSON.stringify(result.partialFailureError, null, 2));
  }
} catch (error) {
  console.error("ads:apply-expansion failed.");
  console.error(error.message);
  process.exitCode = 1;
}
