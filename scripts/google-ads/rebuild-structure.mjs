import { loadWorkflowConfig, mutate, searchStream } from "./api.mjs";

const FINAL_URL = "https://grandtouchauto.ae/ppf-dubai-quote";
const LEGACY_AD_GROUP_NAMES = ["Ad group 1"];
const CPC_BID_CEILING_MICROS = "18000000";
const EXTRA_NEGATIVES = ["modcare", "sharjah", "cars studio", "motorworks"];

const AD_GROUP_PLANS = [
  {
    name: "Core Generic",
    path1: "ppf",
    path2: "dubai",
    keywords: [
      ["ppf dubai", "EXACT"],
      ["ppf dubai", "PHRASE"],
      ["paint protection film dubai", "EXACT"],
      ["paint protection film dubai", "PHRASE"],
      ["paint protection dubai", "EXACT"],
      ["paint protection dubai", "PHRASE"],
      ["car paint protection dubai", "EXACT"],
      ["car paint protection dubai", "PHRASE"],
      ["car ppf dubai", "EXACT"],
      ["car ppf dubai", "PHRASE"],
      ["ppf installation dubai", "EXACT"],
      ["ppf installation dubai", "PHRASE"],
      ["clear ppf dubai", "EXACT"],
      ["clear ppf dubai", "PHRASE"],
      ["clear bra dubai", "EXACT"],
      ["clear bra dubai", "PHRASE"],
    ],
    headlines: [
      "PPF Dubai You Can Trust",
      "Paint Protection Film Dubai",
      "Dubai PPF Done Properly",
      "Proper Install. Clear Process.",
      "Direct With Sean",
      "Warranty You Can Trace",
      "Get A Real PPF Quote",
      "Real Buyer Handover",
      "Genuine STEK. Registered.",
      "See Finish Before Sign-Off",
      "Built Around Your Car",
      "No Vague Handoffs",
      "Compare PPF Options",
      "Sean-Led Quote & Handover",
      "Gloss Or Matte That Fits",
    ],
    descriptions: [
      "Get a real PPF quote with proper install, genuine STEK, and warranty you can trace.",
      "Sean guides the quote and handover, so the standard promised is the standard delivered.",
      "Built for Dubai drivers who care about clean prep, finish quality, and no vague handoff.",
      "Compare coverage, finish, and package options for your car in one quote flow.",
    ],
  },
  {
    name: "Price Quote",
    path1: "ppf",
    path2: "quote",
    keywords: [
      ["ppf quote dubai", "EXACT"],
      ["ppf quote dubai", "PHRASE"],
      ["ppf cost dubai", "EXACT"],
      ["ppf cost dubai", "PHRASE"],
      ["ppf price dubai", "EXACT"],
      ["ppf price dubai", "PHRASE"],
      ["paint protection film cost dubai", "EXACT"],
      ["paint protection film cost dubai", "PHRASE"],
      ["paint protection film price dubai", "EXACT"],
      ["paint protection film price dubai", "PHRASE"],
    ],
    headlines: [
      "Get PPF Pricing In Dubai",
      "Get A Real PPF Quote",
      "Quote Based On Your Car",
      "Proper Install. Clear Process.",
      "Warranty You Can Trace",
      "Direct With Sean",
      "No Vague Handoffs",
      "See Finish Before Sign-Off",
      "Built Around Your Car",
      "PPF Dubai You Can Trust",
      "Clear PPF Pricing",
      "Dubai PPF Done Properly",
      "Honest Quote, Proper Fit",
      "Know The Starting Price",
      "Real Buyer Handover",
    ],
    descriptions: [
      "See the starting price only when you're ready, with proper install and clear handover.",
      "Sean guides the quote and handover, so the price reflects real prep and genuine STEK.",
      "Build the right package for your car instead of chasing the cheapest number.",
      "Compare coverage and finish options, then ask Sean directly on WhatsApp.",
    ],
  },
  {
    name: "Front Full Body",
    path1: "ppf",
    path2: "coverage",
    keywords: [
      ["full front ppf dubai", "EXACT"],
      ["full front ppf dubai", "PHRASE"],
      ["full front ppf price dubai", "EXACT"],
      ["full front ppf price dubai", "PHRASE"],
      ["front ppf dubai", "EXACT"],
      ["front ppf dubai", "PHRASE"],
      ["front ppf price dubai", "EXACT"],
      ["front ppf price dubai", "PHRASE"],
      ["full body ppf dubai", "EXACT"],
      ["full body ppf dubai", "PHRASE"],
      ["full body ppf price dubai", "EXACT"],
      ["full body ppf price dubai", "PHRASE"],
      ["matte ppf dubai", "EXACT"],
      ["matte ppf dubai", "PHRASE"],
    ],
    headlines: [
      "Full Front Or Full Body",
      "Choose The Right Coverage",
      "Build The Right PPF Setup",
      "Gloss Or Matte That Fits",
      "Get A Real PPF Quote",
      "Direct With Sean",
      "Proper Install. Clear Process.",
      "Warranty You Can Trace",
      "Compare Front Vs Full Body",
      "Built Around Your Car",
      "PPF Dubai You Can Trust",
      "No Vague Handoffs",
      "Coverage That Fits Your Car",
      "Front Or Full Body Quote",
      "Real Buyer Handover",
    ],
    descriptions: [
      "Compare full front and full body options, then choose the finish and coverage that fit.",
      "The quote flow helps you choose the right setup, not just the cheapest package.",
      "Proper prep, genuine STEK, and warranty you can trace are part of the recommendation.",
      "Sean guides the quote so coverage and finish match how you plan to use the car.",
    ],
  },
  {
    name: "STEK",
    path1: "stek",
    path2: "dubai",
    keywords: [
      ["stek dubai", "EXACT"],
      ["stek dubai", "PHRASE"],
      ["stek ppf dubai", "EXACT"],
      ["stek ppf dubai", "PHRASE"],
    ],
    headlines: [
      "Why Sean Recommends STEK",
      "Genuine STEK. Registered.",
      "Warranty You Can Trace",
      "Finish That Suits The Car",
      "Direct With Sean",
      "Proper Install. Clear Process.",
      "Sean-Led Quote & Handover",
      "See Finish Before Sign-Off",
      "Dubai PPF Done Properly",
      "Real Buyer Handover",
      "Sean Explains Why STEK",
      "Genuine Film, Clear Warranty",
      "Not Hype. Properly Registered.",
      "PPF Dubai You Can Trust",
      "Get A Real PPF Quote",
    ],
    descriptions: [
      "Watch Sean explain why genuine STEK, finish choice, and registered warranty must line up.",
      "Not hype. The right film only works if the install and warranty process are done properly.",
      "Compare gloss or matte options, then get a quote based on your car and ownership plans.",
      "Built for drivers who care about finish quality, clean prep, and warranty traceability.",
    ],
  },
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

function headlineObjects(values) {
  return values.map((text) => ({ text }));
}

function descriptionObjects(values) {
  return values.map((text) => ({ text }));
}

async function getCampaign(config, campaignName) {
  const query = `
    SELECT
      campaign.id,
      campaign.resource_name,
      campaign.name,
      campaign.target_spend.cpc_bid_ceiling_micros
    FROM campaign
    WHERE campaign.name = '${escapeGaql(campaignName)}'
    LIMIT 1
  `;

  const rows = await searchStream(config, query);
  const row = rows[0];
  if (!row?.campaign?.resourceName) {
    throw new Error(`Campaign ${campaignName} was not found.`);
  }

  return row.campaign;
}

async function getAdGroups(config, campaignName) {
  const query = `
    SELECT
      ad_group.id,
      ad_group.resource_name,
      ad_group.name,
      ad_group.status
    FROM ad_group
    WHERE campaign.name = '${escapeGaql(campaignName)}'
      AND ad_group.status != 'REMOVED'
  `;

  const rows = await searchStream(config, query);
  return new Map(rows.map((row) => [row.adGroup.name, row.adGroup]));
}

async function getKeywordsByAdGroup(config, campaignName) {
  const query = `
    SELECT
      ad_group.name,
      ad_group_criterion.keyword.text,
      ad_group_criterion.keyword.match_type
    FROM keyword_view
    WHERE campaign.name = '${escapeGaql(campaignName)}'
      AND ad_group.status != 'REMOVED'
      AND ad_group_criterion.status != 'REMOVED'
  `;

  const rows = await searchStream(config, query);
  const byGroup = new Map();

  for (const row of rows) {
    const groupName = row.adGroup?.name;
    if (!groupName) continue;
    if (!byGroup.has(groupName)) {
      byGroup.set(groupName, new Set());
    }
    byGroup.get(groupName).add(
      keywordKey(row.adGroupCriterion?.keyword?.text || "", row.adGroupCriterion?.keyword?.matchType || ""),
    );
  }

  return byGroup;
}

async function getExistingAdsByGroup(config, campaignName) {
  const query = `
    SELECT
      ad_group.name,
      ad_group_ad.resource_name,
      ad_group_ad.status,
      ad_group_ad.ad.resource_name,
      ad_group_ad.ad.id
    FROM ad_group_ad
    WHERE campaign.name = '${escapeGaql(campaignName)}'
      AND ad_group.status != 'REMOVED'
      AND ad_group_ad.status != 'REMOVED'
  `;

  const rows = await searchStream(config, query);
  const byGroup = new Map();
  for (const row of rows) {
    if (!row.adGroup?.name) continue;
    byGroup.set(row.adGroup.name, row.adGroupAd);
  }
  return byGroup;
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

function buildCreateAdGroupOperation(campaignResourceName, customerId, tempId, name) {
  return {
    adGroupOperation: {
      create: {
        resourceName: adGroupTempResourceName(customerId, tempId),
        campaign: campaignResourceName,
        name,
        status: "ENABLED",
        type: "SEARCH_STANDARD",
      },
    },
  };
}

function adGroupTempResourceName(customerId, tempId) {
  return `customers/${customerId}/adGroups/${tempId}`;
}

function buildCreateKeywordOperation(adGroupResourceName, text, matchType) {
  return {
    adGroupCriterionOperation: {
      create: {
        adGroup: adGroupResourceName,
        status: "ENABLED",
        keyword: {
          text,
          matchType,
        },
      },
    },
  };
}

function buildCreateRsaOperation(adGroupResourceName, plan) {
  return {
    adGroupAdOperation: {
      create: {
        adGroup: adGroupResourceName,
        status: "ENABLED",
        ad: {
          finalUrls: [FINAL_URL],
          responsiveSearchAd: {
            headlines: headlineObjects(plan.headlines),
            descriptions: descriptionObjects(plan.descriptions),
            path1: plan.path1,
            path2: plan.path2,
          },
        },
      },
    },
  };
}

function buildUpdateRsaOperation(adResourceName, plan) {
  return {
    adOperation: {
      update: {
        resourceName: adResourceName,
        finalUrls: [FINAL_URL],
        responsiveSearchAd: {
          headlines: headlineObjects(plan.headlines),
          descriptions: descriptionObjects(plan.descriptions),
          path1: plan.path1,
          path2: plan.path2,
        },
      },
      updateMask:
        "responsive_search_ad.headlines,responsive_search_ad.descriptions,responsive_search_ad.path1,responsive_search_ad.path2,final_urls",
    },
  };
}

function buildPauseAdGroupOperation(resourceName) {
  return {
    adGroupOperation: {
      update: {
        resourceName,
        status: "PAUSED",
      },
      updateMask: "status",
    },
  };
}

function buildAddCampaignNegativeOperation(campaignResourceName, text) {
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

function buildSetBidCeilingOperation(campaignResourceName) {
  return {
    campaignOperation: {
      update: {
        resourceName: campaignResourceName,
        targetSpend: {
          cpcBidCeilingMicros: CPC_BID_CEILING_MICROS,
        },
      },
      updateMask: "target_spend.cpc_bid_ceiling_micros",
    },
  };
}

function validateTextLengths() {
  for (const plan of AD_GROUP_PLANS) {
    for (const headline of plan.headlines) {
      if (headline.length > 30) {
        throw new Error(`Headline too long in ${plan.name}: "${headline}" (${headline.length})`);
      }
    }

    for (const description of plan.descriptions) {
      if (description.length > 90) {
        throw new Error(`Description too long in ${plan.name}: "${description}" (${description.length})`);
      }
    }
  }
}

try {
  validateTextLengths();

  const options = parseOptions(process.argv.slice(2));
  const config = loadWorkflowConfig(process.argv.slice(2));
  const campaignName = config.campaign || "Leads-Search-1";
  const campaign = await getCampaign(config, campaignName);

  const initialAdGroups = await getAdGroups(config, campaignName);
  const keywordsByGroup = await getKeywordsByAdGroup(config, campaignName);
  const adsByGroup = await getExistingAdsByGroup(config, campaignName);
  const existingNegatives = await getExistingCampaignNegatives(config, campaignName);

  const mutateOperations = [];
  const summary = {
    createdGroups: [],
    updatedAds: [],
    createdAds: [],
    addedKeywords: [],
    pausedLegacyGroups: [],
    addedNegatives: [],
  };
  const adGroupResourceNames = new Map();
  let tempId = -1;

  for (const plan of AD_GROUP_PLANS) {
    const existingGroup = initialAdGroups.get(plan.name);
    if (existingGroup?.resourceName) {
      adGroupResourceNames.set(plan.name, existingGroup.resourceName);
      continue;
    }

    const tempResourceName = adGroupTempResourceName(config.customerId, tempId);
    mutateOperations.push(
      buildCreateAdGroupOperation(campaign.resourceName, config.customerId, tempId, plan.name),
    );
    adGroupResourceNames.set(plan.name, tempResourceName);
    summary.createdGroups.push(plan.name);
    tempId -= 1;
  }

  for (const plan of AD_GROUP_PLANS) {
    const existingKeywords = keywordsByGroup.get(plan.name) || new Set();
    for (const [text, matchType] of plan.keywords) {
      const key = keywordKey(text, matchType);
      if (existingKeywords.has(key)) continue;
      mutateOperations.push(
        buildCreateKeywordOperation(adGroupResourceNames.get(plan.name), text, matchType),
      );
      summary.addedKeywords.push(`${plan.name}: ${text} [${matchType}]`);
    }

    const existingAd = adsByGroup.get(plan.name);
    if (existingAd?.ad?.resourceName) {
      mutateOperations.push(buildUpdateRsaOperation(existingAd.ad.resourceName, plan));
      summary.updatedAds.push(plan.name);
    } else {
      mutateOperations.push(buildCreateRsaOperation(adGroupResourceNames.get(plan.name), plan));
      summary.createdAds.push(plan.name);
    }
  }

  for (const legacyName of LEGACY_AD_GROUP_NAMES) {
    const legacyGroup = initialAdGroups.get(legacyName);
    if (legacyGroup?.resourceName && legacyGroup.status !== "PAUSED") {
      mutateOperations.push(buildPauseAdGroupOperation(legacyGroup.resourceName));
      summary.pausedLegacyGroups.push(legacyName);
    }
  }

  for (const negative of EXTRA_NEGATIVES) {
    const key = keywordKey(negative, "PHRASE");
    if (existingNegatives.has(key)) continue;
    mutateOperations.push(buildAddCampaignNegativeOperation(campaign.resourceName, negative));
    summary.addedNegatives.push(negative);
  }

  if (campaign.targetSpend?.cpcBidCeilingMicros !== CPC_BID_CEILING_MICROS) {
    mutateOperations.push(buildSetBidCeilingOperation(campaign.resourceName));
  }

  if (mutateOperations.length) {
    await mutate(config, mutateOperations, {
      partialFailure: false,
      validateOnly: options.validateOnly,
    });
  }

  console.log(
    `${options.validateOnly ? "Validated" : "Applied"} Google Ads structure rebuild for ${campaignName}.`,
  );
  console.log(`Created ad groups: ${summary.createdGroups.length}`);
  for (const item of summary.createdGroups) console.log(`- ${item}`);
  console.log(`Created RSAs: ${summary.createdAds.length}`);
  for (const item of summary.createdAds) console.log(`- ${item}`);
  console.log(`Updated RSAs: ${summary.updatedAds.length}`);
  for (const item of summary.updatedAds) console.log(`- ${item}`);
  console.log(`Added keywords: ${summary.addedKeywords.length}`);
  for (const item of summary.addedKeywords) console.log(`- ${item}`);
  console.log(`Paused legacy ad groups: ${summary.pausedLegacyGroups.length}`);
  for (const item of summary.pausedLegacyGroups) console.log(`- ${item}`);
  console.log(`Added campaign negatives: ${summary.addedNegatives.length}`);
  for (const item of summary.addedNegatives) console.log(`- ${item}`);
  console.log(`CPC ceiling target preserved at AED 18.00`);
} catch (error) {
  console.error("ads:rebuild-structure failed.");
  console.error(error.message);
  process.exitCode = 1;
}
