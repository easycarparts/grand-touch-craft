import { loadWorkflowConfig, mutate, searchStream } from "./api.mjs";

const CAMPAIGN_NAME = "PPF Search UAE - Calculator AB - May 2026";

const KEYWORDS_TO_PAUSE = [
  { adGroupName: "PPF Paint Protection", text: "ppf", matchType: "EXACT" },
];

const KEYWORDS_TO_ADD = [
  { adGroupName: "PPF Dubai Quote", text: "best ppf in dubai", matchType: "EXACT" },
  { adGroupName: "PPF Dubai Quote", text: "best ppf dubai", matchType: "PHRASE" },
  { adGroupName: "PPF Dubai Quote", text: "ppf dubai price", matchType: "PHRASE" },
  { adGroupName: "PPF Dubai Quote", text: "full body ppf dubai", matchType: "PHRASE" },
  { adGroupName: "PPF Dubai Quote", text: "full body ppf price dubai", matchType: "PHRASE" },
  { adGroupName: "PPF Dubai Quote", text: "full car ppf dubai", matchType: "PHRASE" },
  { adGroupName: "PPF Dubai Quote", text: "full ppf price dubai", matchType: "PHRASE" },
  { adGroupName: "PPF Dubai Quote", text: "ppf installation dubai", matchType: "PHRASE" },
  { adGroupName: "PPF Paint Protection", text: "xpel ppf dubai", matchType: "PHRASE" },
  { adGroupName: "PPF Paint Protection", text: "stek ppf dubai", matchType: "PHRASE" },
];

const NEGATIVES_TO_ADD = ["watch"];

function parseOptions(argv) {
  return {
    validateOnly: argv.includes("--validate-only"),
  };
}

function escapeGaql(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function keywordKey(adGroupName, text, matchType) {
  return `${adGroupName.toLowerCase()}::${String(text).toLowerCase()}::${matchType}`;
}

async function getCampaign(config) {
  const query = `
    SELECT
      campaign.resource_name,
      campaign.name
    FROM campaign
    WHERE campaign.name = '${escapeGaql(CAMPAIGN_NAME)}'
      AND campaign.status != 'REMOVED'
    LIMIT 1
  `;

  const rows = await searchStream(config, query);
  const campaign = rows[0]?.campaign;
  if (!campaign?.resourceName) throw new Error(`Campaign not found: ${CAMPAIGN_NAME}`);
  return campaign;
}

async function getAdGroups(config) {
  const query = `
    SELECT
      ad_group.resource_name,
      ad_group.name
    FROM ad_group
    WHERE campaign.name = '${escapeGaql(CAMPAIGN_NAME)}'
      AND ad_group.status != 'REMOVED'
  `;

  const rows = await searchStream(config, query);
  return new Map(rows.map((row) => [row.adGroup?.name, row.adGroup?.resourceName]).filter(([name, resource]) => name && resource));
}

async function getKeywords(config) {
  const query = `
    SELECT
      ad_group.name,
      ad_group_criterion.resource_name,
      ad_group_criterion.status,
      ad_group_criterion.keyword.text,
      ad_group_criterion.keyword.match_type
    FROM keyword_view
    WHERE campaign.name = '${escapeGaql(CAMPAIGN_NAME)}'
      AND ad_group_criterion.status != 'REMOVED'
  `;

  const rows = await searchStream(config, query);
  return rows.map((row) => ({
    adGroupName: row.adGroup?.name || "",
    resourceName: row.adGroupCriterion?.resourceName || "",
    status: row.adGroupCriterion?.status || "",
    text: row.adGroupCriterion?.keyword?.text || "",
    matchType: row.adGroupCriterion?.keyword?.matchType || "",
  }));
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
      `${String(row.campaignCriterion?.keyword?.text || "").toLowerCase()}::${row.campaignCriterion?.keyword?.matchType || ""}`,
    ),
  );
}

try {
  const options = parseOptions(process.argv.slice(2));
  const config = loadWorkflowConfig(process.argv.slice(2));
  const [campaign, adGroups, keywords, existingNegatives] = await Promise.all([
    getCampaign(config),
    getAdGroups(config),
    getKeywords(config),
    getExistingCampaignNegatives(config),
  ]);

  const keywordMap = new Map(
    keywords.map((keyword) => [
      keywordKey(keyword.adGroupName, keyword.text, keyword.matchType),
      keyword,
    ]),
  );

  const operations = [];
  const paused = [];
  const added = [];
  const negatives = [];

  for (const target of KEYWORDS_TO_PAUSE) {
    const keyword = keywordMap.get(keywordKey(target.adGroupName, target.text, target.matchType));
    if (!keyword || keyword.status === "PAUSED") continue;
    operations.push({
      adGroupCriterionOperation: {
        update: {
          resourceName: keyword.resourceName,
          status: "PAUSED",
        },
        updateMask: "status",
      },
    });
    paused.push(`${target.text} [${target.matchType}] in ${target.adGroupName}`);
  }

  for (const keyword of KEYWORDS_TO_ADD) {
    const existing = keywordMap.get(keywordKey(keyword.adGroupName, keyword.text, keyword.matchType));
    if (existing) continue;

    const adGroup = adGroups.get(keyword.adGroupName);
    if (!adGroup) throw new Error(`Ad group not found: ${keyword.adGroupName}`);

    operations.push({
      adGroupCriterionOperation: {
        create: {
          adGroup,
          status: "ENABLED",
          keyword: {
            text: keyword.text,
            matchType: keyword.matchType,
          },
        },
      },
    });
    added.push(`${keyword.text} [${keyword.matchType}] in ${keyword.adGroupName}`);
  }

  for (const negative of NEGATIVES_TO_ADD) {
    const key = `${negative.toLowerCase()}::PHRASE`;
    if (existingNegatives.has(key)) continue;
    operations.push({
      campaignCriterionOperation: {
        create: {
          campaign: campaign.resourceName,
          negative: true,
          keyword: {
            text: negative,
            matchType: "PHRASE",
          },
        },
      },
    });
    negatives.push(negative);
  }

  if (operations.length) {
    await mutate(config, operations, {
      partialFailure: false,
      validateOnly: options.validateOnly,
    });
  }

  console.log(`${options.validateOnly ? "Validated" : "Applied"} calculator keyword tightening.`);
  console.log(`Paused: ${paused.length ? paused.join(", ") : "none"}`);
  console.log(`Added keywords: ${added.length}`);
  for (const item of added) console.log(`- ${item}`);
  console.log(`Added negatives: ${negatives.length ? negatives.join(", ") : "none"}`);
} catch (error) {
  console.error("tighten-ppf-calculator-keywords failed.");
  console.error(error.message);
  process.exitCode = 1;
}
