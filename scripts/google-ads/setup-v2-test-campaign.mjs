import { loadWorkflowConfig, mutate, searchStream } from "./api.mjs";

const CAMPAIGN_NAME = "PPF V2 Funnel Test - June 2026";
const DAILY_BUDGET_MICROS = "50000000";
const CPC_BID_CEILING_MICROS = "18000000";
const FINAL_URL =
  "https://www.grandtouchauto.ae/ppf-full-ppf-calculator-guided-v2?utm_source=google&utm_medium=paid_search&utm_campaign=ppf_v2_funnel_test";
const UAE_GEO_TARGET_CONSTANT = "geoTargetConstants/2784";

const AD_GROUP = {
  name: "V2 Test - PPF Core",
  path1: "ppf",
  path2: "dubai",
  keywords: [
    ["ppf dubai", "PHRASE"],
    ["paint protection film dubai", "PHRASE"],
    ["ppf price dubai", "PHRASE"],
    ["ppf dubai", "EXACT"],
  ],
  headlines: [
    "PPF Dubai You Can Trust",
    "Protect Your Car In Dubai",
    "Get A Real PPF Quote",
    "Direct With Sean",
    "Warranty You Can Trace",
    "Premium Paint Protection",
    "For New Cars And SUVs",
    "Genuine STEK Film",
    "Dubai PPF Done Properly",
    "Real Handover Proof",
    "Gloss Or Matte PPF",
    "Ask Sean On WhatsApp",
    "PPF Price In Dubai",
    "Proper Prep Before Film",
    "Grand Touch Auto",
  ],
  descriptions: [
    "Get a proper PPF quote for your car with genuine film, clean prep, and clear handover.",
    "Sean guides the quote so you can choose the right PPF setup before booking.",
    "Premium paint protection film in Dubai for new cars, SUVs, and luxury vehicles.",
    "Message Sean on WhatsApp or use the quote flow to compare the right PPF setup.",
  ],
};

function parseOptions(argv) {
  return {
    validateOnly: argv.includes("--validate-only"),
  };
}

function escapeGaql(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function campaignBudgetTempResourceName(customerId) {
  return `customers/${customerId}/campaignBudgets/-1`;
}

function campaignTempResourceName(customerId) {
  return `customers/${customerId}/campaigns/-2`;
}

function adGroupTempResourceName(customerId, tempId) {
  return `customers/${customerId}/adGroups/${tempId}`;
}

function responsiveSearchAssets(values) {
  return values.map((text) => ({ text }));
}

function validateTextLengths() {
  for (const headline of AD_GROUP.headlines) {
    if (headline.length > 30) {
      throw new Error(`Headline too long: "${headline}" (${headline.length})`);
    }
  }

  for (const description of AD_GROUP.descriptions) {
    if (description.length > 90) {
      throw new Error(`Description too long: "${description}" (${description.length})`);
    }
  }
}

async function campaignExists(config) {
  const query = `
    SELECT
      campaign.resource_name,
      campaign.name,
      campaign.status
    FROM campaign
    WHERE campaign.name = '${escapeGaql(CAMPAIGN_NAME)}'
    LIMIT 1
  `;

  const rows = await searchStream(config, query);
  return rows[0]?.campaign || null;
}

function buildCampaignBudgetOperation(customerId) {
  return {
    campaignBudgetOperation: {
      create: {
        resourceName: campaignBudgetTempResourceName(customerId),
        name: `${CAMPAIGN_NAME} Budget`,
        amountMicros: DAILY_BUDGET_MICROS,
        deliveryMethod: "STANDARD",
        explicitlyShared: false,
      },
    },
  };
}

function buildCampaignOperation(customerId) {
  return {
    campaignOperation: {
      create: {
        resourceName: campaignTempResourceName(customerId),
        name: CAMPAIGN_NAME,
        status: "PAUSED",
        advertisingChannelType: "SEARCH",
        containsEuPoliticalAdvertising: "DOES_NOT_CONTAIN_EU_POLITICAL_ADVERTISING",
        campaignBudget: campaignBudgetTempResourceName(customerId),
        targetSpend: {
          cpcBidCeilingMicros: CPC_BID_CEILING_MICROS,
        },
        networkSettings: {
          targetGoogleSearch: true,
          targetSearchNetwork: false,
          targetContentNetwork: false,
          targetPartnerSearchNetwork: false,
        },
        geoTargetTypeSetting: {
          positiveGeoTargetType: "PRESENCE",
        },
      },
    },
  };
}

function buildLocationOperation(customerId) {
  return {
    campaignCriterionOperation: {
      create: {
        campaign: campaignTempResourceName(customerId),
        location: {
          geoTargetConstant: UAE_GEO_TARGET_CONSTANT,
        },
      },
    },
  };
}

function buildAdGroupOperation(customerId, tempId, name) {
  return {
    adGroupOperation: {
      create: {
        resourceName: adGroupTempResourceName(customerId, tempId),
        campaign: campaignTempResourceName(customerId),
        name,
        status: "ENABLED",
        type: "SEARCH_STANDARD",
      },
    },
  };
}

function buildKeywordOperation(adGroupResourceName, text, matchType) {
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

function buildResponsiveSearchAdOperation(adGroupResourceName, group) {
  return {
    adGroupAdOperation: {
      create: {
        adGroup: adGroupResourceName,
        status: "ENABLED",
        ad: {
          finalUrls: [FINAL_URL],
          responsiveSearchAd: {
            headlines: responsiveSearchAssets(group.headlines),
            descriptions: responsiveSearchAssets(group.descriptions),
            path1: group.path1,
            path2: group.path2,
          },
        },
      },
    },
  };
}

try {
  validateTextLengths();

  const options = parseOptions(process.argv.slice(2));
  const config = loadWorkflowConfig(process.argv.slice(2));
  const existingCampaign = await campaignExists(config);

  if (existingCampaign?.resourceName) {
    console.log(`Campaign already exists: ${existingCampaign.name} (${existingCampaign.status})`);
    console.log(existingCampaign.resourceName);
    process.exit(0);
  }

  const adGroupTempId = -3;
  const adGroupResourceName = adGroupTempResourceName(config.customerId, adGroupTempId);

  const operations = [
    buildCampaignBudgetOperation(config.customerId),
    buildCampaignOperation(config.customerId),
    buildLocationOperation(config.customerId),
    buildAdGroupOperation(config.customerId, adGroupTempId, AD_GROUP.name),
  ];

  for (const [text, matchType] of AD_GROUP.keywords) {
    operations.push(buildKeywordOperation(adGroupResourceName, text, matchType));
  }

  operations.push(buildResponsiveSearchAdOperation(adGroupResourceName, AD_GROUP));

  await mutate(config, operations, {
    partialFailure: false,
    validateOnly: options.validateOnly,
  });

  if (options.validateOnly) {
    console.log(`Validated creation of ${CAMPAIGN_NAME}.`);
    console.log(`Status (intended): PAUSED`);
    console.log(`Budget: AED 50/day`);
    console.log(`CPC cap: AED 18`);
    console.log(`Location: United Arab Emirates (${UAE_GEO_TARGET_CONSTANT}), PRESENCE`);
    console.log(`Ad group: ${AD_GROUP.name} (${AD_GROUP.keywords.length} keywords)`);
    console.log(`Final URL: ${FINAL_URL}`);
    process.exit(0);
  }

  const createdCampaign = await campaignExists(config);
  if (!createdCampaign) {
    throw new Error("Campaign was created but could not be retrieved.");
  }

  console.log(`Created ${CAMPAIGN_NAME}.`);
  console.log(`Resource: ${createdCampaign.resourceName}`);
  console.log(`Status: ${createdCampaign.status}`);
  console.log(`Budget: AED 50/day (${DAILY_BUDGET_MICROS} micros), not shared`);
  console.log(`Bidding: Maximize conversions (targetSpend), CPC cap AED 18`);
  console.log(`Location: United Arab Emirates (${UAE_GEO_TARGET_CONSTANT}), PRESENCE`);
  console.log(`Networks: Google Search only`);
  console.log(`Ad group: ${AD_GROUP.name}`);
  for (const [text, matchType] of AD_GROUP.keywords) {
    console.log(`- ${matchType}: ${text}`);
  }
  console.log(`Final URL: ${FINAL_URL}`);
} catch (error) {
  console.error("ads:setup-v2-test-campaign failed.");
  console.error(error.message);
  process.exitCode = 1;
}
