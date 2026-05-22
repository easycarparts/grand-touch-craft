import { loadWorkflowConfig, mutate, searchStream } from "./api.mjs";

const CAMPAIGN_NAME = "PPF Search UAE - Calculator AB - May 2026";
const DAILY_BUDGET_MICROS = "150000000";
const FINAL_URL =
  "https://www.grandtouchauto.ae/ppf-full-ppf-calculator?utm_source=google&utm_medium=paid_search&utm_campaign=ppf_calculator_ab_may_2026";
const UAE_GEO_TARGET_CONSTANT = "geoTargetConstants/2784";

const AD_GROUPS = [
  {
    name: "PPF Near Me Local",
    path1: "ppf",
    path2: "near-me",
    keywords: [
      ["ppf near me", "EXACT"],
      ["ppf near me", "PHRASE"],
      ["paint protection film near me", "EXACT"],
      ["paint protection film near me", "PHRASE"],
      ["ppf shop near me", "PHRASE"],
      ["ppf installer near me", "PHRASE"],
    ],
    headlines: [
      "PPF Near Me",
      "Paint Protection Near Me",
      "Message Sean On WhatsApp",
      "Get A Real PPF Quote",
      "Warranty You Can Trace",
      "Premium PPF In Dubai",
      "Proper Prep Before Film",
      "Genuine STEK Film",
      "For New Cars And SUVs",
      "Grand Touch Auto",
      "Direct With Sean",
      "Gloss Or Matte PPF",
      "Trusted PPF Installers",
      "Book PPF In Dubai",
      "Protect Your Car Paint",
    ],
    descriptions: [
      "Message Sean for a real PPF quote and the right setup for your car.",
      "Premium paint protection film with proper prep and warranty-registered film.",
      "Get direct advice before booking PPF for your car, SUV, or luxury vehicle.",
      "Grand Touch installs genuine STEK film with clean handover proof.",
    ],
  },
  {
    name: "PPF Paint Protection",
    path1: "paint",
    path2: "protection",
    keywords: [
      ["ppf", "EXACT"],
      ["paint protection film", "EXACT"],
      ["paint protection film", "PHRASE"],
      ["ppf car", "PHRASE"],
      ["ppf on car", "PHRASE"],
      ["car paint protection film", "PHRASE"],
      ["ppf automotive", "PHRASE"],
      ["ppf auto", "PHRASE"],
      ["ppf coating", "PHRASE"],
    ],
    headlines: [
      "Paint Protection Film",
      "Premium PPF For Your Car",
      "Message Sean On WhatsApp",
      "Protect Your Car Paint",
      "Get A Real PPF Quote",
      "Warranty You Can Trace",
      "Proper PPF Install",
      "Genuine STEK Film",
      "Dubai PPF Specialists",
      "For Luxury Cars And SUVs",
      "Direct With Sean",
      "No Vague Handoffs",
      "Gloss Or Matte Finish",
      "Grand Touch Auto",
      "PPF Done Properly",
    ],
    descriptions: [
      "Protect your car paint with premium PPF, proper prep, and traceable warranty.",
      "Speak directly with Sean and get a clear recommendation for your car.",
      "Genuine STEK paint protection film installed properly at Grand Touch Auto.",
      "Use WhatsApp or the quote flow to compare the right PPF setup for your car.",
    ],
  },
  {
    name: "PPF Dubai Quote",
    path1: "ppf",
    path2: "dubai",
    keywords: [
      ["ppf dubai", "EXACT"],
      ["ppf dubai", "PHRASE"],
      ["ppf in dubai", "EXACT"],
      ["ppf in dubai", "PHRASE"],
      ["car ppf dubai", "EXACT"],
      ["car ppf dubai", "PHRASE"],
      ["best ppf in dubai", "PHRASE"],
      ["paint protection film dubai price", "PHRASE"],
      ["ppf price dubai", "PHRASE"],
      ["ppf cost dubai", "PHRASE"],
    ],
    headlines: [
      "PPF Dubai You Can Trust",
      "Get A Dubai PPF Quote",
      "Message Sean On WhatsApp",
      "PPF Price For Your Car",
      "Best PPF Setup Advice",
      "Warranty You Can Trace",
      "Premium Paint Protection",
      "Genuine STEK Film",
      "Direct With Sean",
      "For New Cars And SUVs",
      "Real Buyer Handovers",
      "No Vague Handoffs",
      "Gloss Or Matte PPF",
      "Grand Touch Auto",
      "Dubai PPF Done Properly",
    ],
    descriptions: [
      "Get a clear PPF quote for your car and speak directly with Sean on WhatsApp.",
      "Compare the right PPF setup before booking. Genuine film and proper prep.",
      "Premium PPF in Dubai for new cars, SUVs, and luxury vehicles.",
      "Grand Touch gives direct guidance from first message to final handover.",
    ],
  },
];

const NEGATIVES = [
  "free",
  "cheap",
  "cheapest",
  "diy",
  "do it yourself",
  "training",
  "course",
  "job",
  "jobs",
  "salary",
  "supplier",
  "wholesale",
  "roll",
  "film roll",
  "amazon",
  "temu",
  "aliexpress",
  "sticker",
  "vinyl roll",
  "window tint",
  "car storage",
  "car wash",
  "mobile car wash",
  "interior cleaning",
  "sharjah",
  "mkn garage",
  "warehouse 6 street 25",
];

const SITELINKS = [
  {
    linkText: "WhatsApp Sean",
    description1: "Ask for the right setup",
    description2: "Direct PPF advice",
    finalUrl: FINAL_URL,
  },
  {
    linkText: "PPF Quote",
    description1: "Build the right setup",
    description2: "Get a clear estimate",
    finalUrl: `${FINAL_URL}#calculator`,
  },
  {
    linkText: "Why Grand Touch",
    description1: "Proper prep and handover",
    description2: "See why buyers trust us",
    finalUrl: `${FINAL_URL}#owner-standard`,
  },
  {
    linkText: "Save Your Quote",
    description1: "Warranty you can trace",
    description2: "Send setup to Sean",
    finalUrl: `${FINAL_URL}#save-quote`,
  },
];

const CALLOUTS = [
  "Direct With Sean",
  "Warranty You Can Trace",
  "Genuine STEK Film",
  "Proper Prep Before Film",
];

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

function assetTempResourceName(customerId, tempId) {
  return `customers/${customerId}/assets/${tempId}`;
}

function responsiveSearchAssets(values) {
  return values.map((text) => ({ text }));
}

function validateTextLengths() {
  for (const group of AD_GROUPS) {
    for (const headline of group.headlines) {
      if (headline.length > 30) {
        throw new Error(`Headline too long in ${group.name}: "${headline}" (${headline.length})`);
      }
    }

    for (const description of group.descriptions) {
      if (description.length > 90) {
        throw new Error(`Description too long in ${group.name}: "${description}" (${description.length})`);
      }
    }
  }

  for (const sitelink of SITELINKS) {
    if (sitelink.linkText.length > 25) throw new Error(`Sitelink text too long: ${sitelink.linkText}`);
    if (sitelink.description1.length > 35) throw new Error(`Sitelink description1 too long: ${sitelink.description1}`);
    if (sitelink.description2.length > 35) throw new Error(`Sitelink description2 too long: ${sitelink.description2}`);
  }

  for (const callout of CALLOUTS) {
    if (callout.length > 25) throw new Error(`Callout too long: ${callout}`);
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
        maximizeConversions: {},
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

function buildNegativeOperation(customerId, text) {
  return {
    campaignCriterionOperation: {
      create: {
        campaign: campaignTempResourceName(customerId),
        negative: true,
        keyword: {
          text,
          matchType: "PHRASE",
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

function buildSitelinkAssetOperation(customerId, sitelink, tempId) {
  return {
    assetOperation: {
      create: {
        resourceName: assetTempResourceName(customerId, tempId),
        name: `whatsapp_ppf_${sitelink.linkText.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
        finalUrls: [sitelink.finalUrl],
        sitelinkAsset: {
          linkText: sitelink.linkText,
          description1: sitelink.description1,
          description2: sitelink.description2,
        },
      },
    },
  };
}

function buildCampaignAssetOperation(customerId, tempId, fieldType) {
  return {
    campaignAssetOperation: {
      create: {
        campaign: campaignTempResourceName(customerId),
        asset: assetTempResourceName(customerId, tempId),
        fieldType,
      },
    },
  };
}

function buildCalloutAssetOperation(customerId, text, tempId) {
  return {
    assetOperation: {
      create: {
        resourceName: assetTempResourceName(customerId, tempId),
        name: `whatsapp_ppf_callout_${text.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
        calloutAsset: {
          calloutText: text,
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

  const operations = [
    buildCampaignBudgetOperation(config.customerId),
    buildCampaignOperation(config.customerId),
    buildLocationOperation(config.customerId),
  ];

  for (const negative of NEGATIVES) {
    operations.push(buildNegativeOperation(config.customerId, negative));
  }

  let adGroupTempId = -3;
  for (const group of AD_GROUPS) {
    const adGroupResourceName = adGroupTempResourceName(config.customerId, adGroupTempId);
    operations.push(buildAdGroupOperation(config.customerId, adGroupTempId, group.name));

    for (const [text, matchType] of group.keywords) {
      operations.push(buildKeywordOperation(adGroupResourceName, text, matchType));
    }

    operations.push(buildResponsiveSearchAdOperation(adGroupResourceName, group));
    adGroupTempId -= 1;
  }

  let assetTempId = -100;
  for (const sitelink of SITELINKS) {
    operations.push(buildSitelinkAssetOperation(config.customerId, sitelink, assetTempId));
    operations.push(buildCampaignAssetOperation(config.customerId, assetTempId, "SITELINK"));
    assetTempId -= 1;
  }

  for (const callout of CALLOUTS) {
    operations.push(buildCalloutAssetOperation(config.customerId, callout, assetTempId));
    operations.push(buildCampaignAssetOperation(config.customerId, assetTempId, "CALLOUT"));
    assetTempId -= 1;
  }

  await mutate(config, operations, {
    partialFailure: false,
    validateOnly: options.validateOnly,
  });

  console.log(`${options.validateOnly ? "Validated" : "Created"} ${CAMPAIGN_NAME}.`);
  console.log("Status: PAUSED");
  console.log("Budget: AED 150/day");
  console.log("Bidding: Maximize conversions");
  console.log(`Location: United Arab Emirates (${UAE_GEO_TARGET_CONSTANT})`);
  console.log(`Final URL: ${FINAL_URL}`);
  console.log(`Ad groups: ${AD_GROUPS.length}`);
  for (const group of AD_GROUPS) {
    console.log(`- ${group.name}: ${group.keywords.length} keywords`);
  }
  console.log(`Campaign negatives: ${NEGATIVES.length}`);
  console.log(`Sitelinks: ${SITELINKS.length}`);
  console.log(`Callouts: ${CALLOUTS.length}`);
} catch (error) {
  console.error("ads:setup-ppf-calculator-ab-may-2026 failed.");
  console.error(error.message);
  process.exitCode = 1;
}
