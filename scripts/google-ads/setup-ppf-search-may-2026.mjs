import { loadWorkflowConfig, mutate, searchStream } from "./api.mjs";

const CAMPAIGN_NAME = "PPF Search Dubai - High Intent - May 2026";
const DAILY_BUDGET_MICROS = "150000000";
const CPC_BID_CEILING_MICROS = "18000000";
const FINAL_URL =
  "https://www.grandtouchauto.ae/ppf-dubai-quote?utm_source=google&utm_medium=paid_search&utm_campaign=ppf_search_may_2026";
const UAE_GEO_TARGET_CONSTANT = "geoTargetConstants/2784";
const AD_SCHEDULE_DAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

const AD_GROUPS = [
  {
    name: "PPF Dubai Core",
    path1: "ppf",
    path2: "dubai",
    keywords: [
      ["ppf dubai", "EXACT"],
      ["ppf dubai", "PHRASE"],
      ["car ppf dubai", "EXACT"],
      ["car ppf dubai", "PHRASE"],
    ],
    headlines: [
      "PPF Dubai You Can Trust",
      "Protect Your Car In Dubai",
      "Proper PPF Install",
      "Direct With Sean",
      "Warranty You Can Trace",
      "Premium Paint Protection",
      "Get A Real PPF Quote",
      "For New Cars And SUVs",
      "Genuine STEK Film",
      "Dubai PPF Done Properly",
      "Real Handover Proof",
      "Gloss Or Matte PPF",
      "No Vague Handoffs",
      "Ask Sean On WhatsApp",
      "Grand Touch Auto",
    ],
    descriptions: [
      "Get a proper PPF quote for your car with genuine film, clean prep, and clear handover.",
      "Sean guides the quote so you can choose the right PPF setup before booking.",
      "Premium paint protection film in Dubai for new cars, SUVs, and luxury vehicles.",
      "Message Sean on WhatsApp or use the quote flow to compare the right PPF setup.",
    ],
  },
  {
    name: "Paint Protection Film Dubai",
    path1: "paint",
    path2: "protection",
    keywords: [
      ["paint protection film dubai", "EXACT"],
      ["paint protection film dubai", "PHRASE"],
      ["car paint protection dubai", "EXACT"],
      ["car paint protection dubai", "PHRASE"],
    ],
    headlines: [
      "Paint Protection Film",
      "Paint Protection Dubai",
      "Protect Your Car Paint",
      "Warranty You Can Trace",
      "Direct With Sean",
      "Proper Prep Before Film",
      "Premium PPF In Dubai",
      "For Luxury Cars And SUVs",
      "Genuine STEK Film",
      "Clean Install Process",
      "Real Buyer Handovers",
      "Ask Sean For A Quote",
      "Gloss Or Matte Finish",
      "Grand Touch Auto",
      "PPF Done Properly",
    ],
    descriptions: [
      "Protect your car paint with premium PPF, proper prep, and a handover you can check.",
      "Grand Touch installs warranty-registered film for Dubai drivers who care about quality.",
      "Get direct guidance from Sean before choosing the right paint protection setup.",
      "Use the quote flow or WhatsApp Sean for a real recommendation for your car.",
    ],
  },
  {
    name: "PPF Price Quote",
    path1: "ppf",
    path2: "quote",
    keywords: [
      ["ppf price dubai", "EXACT"],
      ["ppf price dubai", "PHRASE"],
      ["ppf cost dubai", "EXACT"],
      ["ppf cost dubai", "PHRASE"],
      ["ppf quote dubai", "EXACT"],
      ["ppf quote dubai", "PHRASE"],
    ],
    headlines: [
      "Get A Real PPF Quote",
      "PPF Price In Dubai",
      "PPF Cost For Your Car",
      "Quote Based On Your Car",
      "Direct With Sean",
      "Premium PPF Quote",
      "Warranty You Can Trace",
      "Compare PPF Options",
      "Ask Sean On WhatsApp",
      "No Vague Handoffs",
      "Genuine STEK Film",
      "Proper Install Process",
      "For New Cars And SUVs",
      "Dubai PPF Quote",
      "Grand Touch Auto",
    ],
    descriptions: [
      "Get a PPF quote based on your car, finish preference, and the setup that actually fits.",
      "Compare PPF options without chasing the cheapest number or guessing the right package.",
      "Sean guides the quote and handover, so the price reflects proper prep and genuine film.",
      "Use the quote flow or WhatsApp Sean to get a clear recommendation for your car.",
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
  "car wash",
  "mobile car wash",
  "interior cleaning",
  "window tint only",
  "wrap only",
  "modcare",
  "apex",
  "nvn",
  "zguard",
  "dluxe",
  "cars studio",
  "motorworks",
  "district autocare",
  "wrp",
  "7 detail inn",
];

const SITELINKS = [
  {
    linkText: "PPF Quote",
    description1: "Build the right setup",
    description2: "Message Sean directly",
    finalUrl: `${FINAL_URL}#quote-calculator`,
  },
  {
    linkText: "Why Grand Touch",
    description1: "Proper prep and handover",
    description2: "See why buyers trust us",
    finalUrl: `${FINAL_URL}#why-grand-touch`,
  },
  {
    linkText: "Why We Use STEK",
    description1: "Warranty you can trace",
    description2: "Genuine film matters",
    finalUrl: `${FINAL_URL}#why-stek`,
  },
  {
    linkText: "Real Handovers",
    description1: "See finished installs",
    description2: "Real cars, real buyers",
    finalUrl: `${FINAL_URL}#real-handovers`,
  },
];

const CALLOUTS = [
  "Direct With Sean",
  "Warranty You Can Trace",
  "Proper Prep Before Film",
  "Genuine STEK Film",
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
    if (sitelink.linkText.length > 25) {
      throw new Error(`Sitelink text too long: "${sitelink.linkText}" (${sitelink.linkText.length})`);
    }
    if (sitelink.description1.length > 35) {
      throw new Error(`Sitelink description1 too long: "${sitelink.description1}"`);
    }
    if (sitelink.description2.length > 35) {
      throw new Error(`Sitelink description2 too long: "${sitelink.description2}"`);
    }
  }

  for (const callout of CALLOUTS) {
    if (callout.length > 25) {
      throw new Error(`Callout too long: "${callout}" (${callout.length})`);
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

async function getExistingAdSchedules(config) {
  const query = `
    SELECT
      campaign_criterion.ad_schedule.day_of_week,
      campaign_criterion.ad_schedule.start_hour,
      campaign_criterion.ad_schedule.end_hour,
      campaign_criterion.ad_schedule.start_minute,
      campaign_criterion.ad_schedule.end_minute
    FROM campaign_criterion
    WHERE campaign.name = '${escapeGaql(CAMPAIGN_NAME)}'
      AND campaign_criterion.type = AD_SCHEDULE
      AND campaign_criterion.status != 'REMOVED'
  `;

  const rows = await searchStream(config, query);
  return new Set(
    rows.map((row) => {
      const schedule = row.campaignCriterion?.adSchedule || {};
      return [
        schedule.dayOfWeek,
        schedule.startHour,
        schedule.endHour,
        schedule.startMinute,
        schedule.endMinute,
      ].join(":");
    }),
  );
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

function buildAdScheduleOperation(campaignResourceName, dayOfWeek) {
  return {
    campaignCriterionOperation: {
      create: {
        campaign: campaignResourceName,
        adSchedule: {
          dayOfWeek,
          startHour: 8,
          startMinute: "ZERO",
          endHour: 24,
          endMinute: "ZERO",
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
        name: `may_2026_${sitelink.linkText.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
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
        name: `may_2026_callout_${text.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
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
    const existingSchedules = await getExistingAdSchedules(config);
    const scheduleOperations = [];

    for (const day of AD_SCHEDULE_DAYS) {
      const key = [day, 8, 24, "ZERO", "ZERO"].join(":");
      if (existingSchedules.has(key)) continue;
      scheduleOperations.push(buildAdScheduleOperation(existingCampaign.resourceName, day));
    }

    if (scheduleOperations.length) {
      await mutate(config, scheduleOperations, {
        partialFailure: false,
        validateOnly: options.validateOnly,
      });
    }

    console.log(`Campaign already exists: ${existingCampaign.name} (${existingCampaign.status})`);
    console.log(existingCampaign.resourceName);
    console.log(`${options.validateOnly ? "Validated" : "Added"} ad schedules: ${scheduleOperations.length}`);
    for (const day of AD_SCHEDULE_DAYS) console.log(`- ${day}: 08:00-24:00`);
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

  for (const day of AD_SCHEDULE_DAYS) {
    operations.push(buildAdScheduleOperation(campaignTempResourceName(config.customerId), day));
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
  console.log(`Status: PAUSED`);
  console.log(`Budget: AED 150/day`);
  console.log(`CPC cap: AED 18`);
  console.log(`Location: United Arab Emirates (${UAE_GEO_TARGET_CONSTANT})`);
  console.log(`Ad groups: ${AD_GROUPS.length}`);
  for (const group of AD_GROUPS) {
    console.log(`- ${group.name}: ${group.keywords.length} keywords`);
  }
  console.log(`Campaign negatives: ${NEGATIVES.length}`);
  console.log(`Sitelinks: ${SITELINKS.length}`);
  console.log(`Callouts: ${CALLOUTS.length}`);
} catch (error) {
  console.error("ads:setup-ppf-search-may-2026 failed.");
  console.error(error.message);
  process.exitCode = 1;
}
