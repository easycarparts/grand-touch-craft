import { loadWorkflowConfig, mutate, searchStream } from "./api.mjs";

/**
 * Fresh-start campaign for the open-price funnel (/ppf-dubai-price).
 * Spec: docs/claude-code-handoff-google-fresh-start-2026-07-04.md §2.
 *
 * - Search only, Dubai + Sharjah, English, Maximize Clicks w/ 20 AED CPC cap.
 * - 4 ad groups, phrase + exact only. Campaign-level sitelinks ONLY
 *   (ad-group sitelinks leaked ~60% of clicks off-funnel on the May campaign).
 * - Negatives = the May campaign's live list (pulled 2026-07-04) minus
 *   "sharjah" (this campaign targets Sharjah), plus June zero-conv terms.
 * - Reuses the existing callout + call assets by ID (no duplicates).
 * - Campaign conversion goals set to EXACTLY Submit lead form + WhatsApp
 *   contact click via a custom conversion goal (apply mode only).
 *
 * SAFE BY DEFAULT: validateOnly dry-run unless you pass `--apply`.
 * Creates the campaign PAUSED. To go live after verification:
 *   node scripts/google-ads/setup-ppf-price-search-jul-2026.mjs --env=.env.google-ads --enable --apply
 */

const CAMPAIGN_NAME = "PPF Price Search Dubai - Jul 2026";
const DAILY_BUDGET_MICROS = "200000000"; // 200 AED/day
const CPC_BID_CEILING_MICROS = "20000000"; // 20 AED max CPC
const FINAL_URL =
  "https://www.grandtouchauto.ae/ppf-dubai-price?utm_source=google&utm_medium=paid_search&utm_campaign=ppf_price_search_jul_2026";
const UTM = "utm_source=google&utm_medium=paid_search&utm_campaign=ppf_price_search_jul_2026";

// Provinces (emirates), PRESENCE targeting — matches "Dubai + Sharjah".
const GEO_TARGETS = [
  "geoTargetConstants/9041083", // Dubai (province)
  "geoTargetConstants/9047099", // Sharjah (province)
];
const LANGUAGE_ENGLISH = "languageConstants/1000";

const CONVERSION_ACTION_IDS = ["7569208694", "7617388951"]; // Submit lead form, WhatsApp contact click
const CUSTOM_GOAL_NAME = "Lead + Qualified WhatsApp (Jul 2026)";

// Existing account assets, verified live 2026-07-04 (same set the May campaign used).
const CALLOUT_ASSET_IDS = [
  "362561460965", // Direct With Sean
  "362643502183", // Warranty You Can Trace
  "362722285665", // Genuine STEK Film
  "362722285692", // Proper Prep Before Film
  "374843486876", // Free Pickup Across Dubai
  "374843486879", // New Car Protection
  "374948249284", // Premium Films Available
  "374948256520", // Trusted By Dubai Drivers
];
const CALL_ASSET_ID = "374948252251"; // +971 56 719 1045

const SHARED_HEADLINES = [
  "See Your Exact PPF Price",
  "Full Car PPF Price In 60 Secs",
  "Genuine STEK Film",
  "Free Pickup Across Dubai",
  "Rated 4.9 By Dubai Drivers",
  "Direct With The Owner",
  "Price Shown Instantly",
];

const TRUST_DESCRIPTION =
  "Free pickup across Dubai. Rated 4.9 by Dubai drivers. Direct with the owner.";

const AD_GROUPS = [
  {
    name: "PPF Price Quote",
    mirrorHeadline: "PPF Price Dubai",
    path1: "ppf",
    path2: "price",
    keywords: [
      ["ppf price dubai", "PHRASE"],
      ["ppf cost dubai", "PHRASE"],
      ["car ppf cost", "PHRASE"],
      ["ppf quote dubai", "PHRASE"],
      ["how much is ppf dubai", "PHRASE"],
      // Highest-volume price term in keyword-planner-master-2026-06-18.csv
      // (90/mo, bids 16.40-47.34) — theme price_quote_intent.
      ["paint protection film dubai price", "PHRASE"],
      ["stek ppf price", "EXACT"],
    ],
    descriptions: [
      "Build your exact PPF price in 60 seconds. Real price shown on screen, no callbacks.",
      "See what full car PPF costs for your exact car, then WhatsApp Sean with the quote.",
      "Genuine STEK film, proper prep, and a price you can see before you talk to anyone.",
      TRUST_DESCRIPTION,
    ],
  },
  {
    name: "Core PPF Dubai",
    mirrorHeadline: "PPF Dubai",
    path1: "ppf",
    path2: "dubai",
    keywords: [
      ["ppf dubai", "PHRASE"],
      ["paint protection film dubai", "PHRASE"],
      ["ppf car", "PHRASE"],
      ["ppf near me", "PHRASE"],
    ],
    descriptions: [
      "Premium paint protection film in Dubai. See your exact price online in 60 seconds.",
      "Genuine STEK film, proper prep, traceable warranty. Build your price online now.",
      "Full car or front end. See the exact PPF price for your car before you commit.",
      TRUST_DESCRIPTION,
    ],
  },
  {
    name: "STEK Film",
    mirrorHeadline: "STEK PPF Dubai",
    path1: "stek",
    path2: "ppf",
    keywords: [
      ["stek ppf", "PHRASE"],
      ["stek dubai", "PHRASE"],
      ["stek paint protection", "PHRASE"],
      ["stek dynoshield", "PHRASE"],
    ],
    descriptions: [
      "Genuine STEK film installed properly. See your exact STEK PPF price in 60 seconds.",
      "STEK-certified installation with a warranty you can trace. Price shown instantly.",
      "Compare STEK coverage options for your car and see the exact price on screen.",
      TRUST_DESCRIPTION,
    ],
  },
  {
    name: "New Car Protection",
    mirrorHeadline: "New Car PPF Dubai",
    path1: "new-car",
    path2: "ppf",
    keywords: [
      ["new car paint protection dubai", "PHRASE"],
      ["new car ppf", "PHRASE"],
      ["jetour g700 ppf", "PHRASE"],
      ["byd ppf dubai", "PHRASE"],
      ["chinese car ppf dubai", "PHRASE"],
    ],
    descriptions: [
      "Protect your new car from day one. See your exact PPF price in 60 seconds.",
      "New car PPF with genuine STEK film and proper prep. Price shown instantly.",
      "Jetour, BYD, or any new car. Build your exact PPF price before the first scratch.",
      TRUST_DESCRIPTION,
    ],
  },
];

// Three RSAs per ad group: full pool, price-led subset, trust-led subset.
function rsaVariantsFor(group) {
  const m = group.mirrorHeadline;
  return [
    [m, ...SHARED_HEADLINES],
    [
      m,
      "See Your Exact PPF Price",
      "Full Car PPF Price In 60 Secs",
      "Price Shown Instantly",
      "Free Pickup Across Dubai",
      "Direct With The Owner",
    ],
    [
      m,
      "Rated 4.9 By Dubai Drivers",
      "Genuine STEK Film",
      "Direct With The Owner",
      "Free Pickup Across Dubai",
      "See Your Exact PPF Price",
    ],
  ];
}

// May campaign live negatives (pulled 2026-07-04), minus "sharjah" — this
// campaign targets Sharjah, so carrying it over would block all Sharjah queries.
const CARRIED_NEGATIVES = [
  "aar luxe", "abu dhabi", "ajman", "al sewar", "aliexpress", "amazon",
  "approved detailing", "bangalore", "best ppf brands", "bike", "bikes",
  "car storage", "car wash", "ceramic coating vs ppf", "cheap", "cheapest",
  "china", "chrome ppf wrap", "color ppf", "colour ppf", "course", "covrgard",
  "deals", "detailing experts", "diy", "dluxe", "do it yourself", "door edge",
  "door edge guard", "film roll", "free", "global ppf", "gswf", "headlight",
  "headlights", "hexis", "interior cleaning", "ipd ae", "job", "jobs",
  "manufacturers", "mkn garage", "mobile car wash", "nvn motorworks",
  "paint protection film vs ceramic coating", "photochromic", "plastic film",
  "ppf color", "ppf colour", "ppf door edge guard", "ppf headlights",
  "ppf material", "ppf tape", "ppf website", "rapid detailing", "rma ppf",
  "roll", "royal shield", "saint gobain", "salary", "should i do",
  "should i do ceramic coating or ppf", "smart auto", "smart repair",
  "sticker", "suntek", "supplier", "temu", "top 10 ppf brands",
  "top ppf brands", "training", "types of", "vinyl roll", "vs ceramic coating",
  "warehouse 6 street 25", "watch", "website", "what is", "what is ppf",
  "wholesale", "window tint", "xpel", "xpel ceramic",
];

// June zero-conv terms from docs/google-ads/export-2026-07-04.txt, plus two
// competitor films the strategy lists as negatives but the May list lacked.
const NEW_NEGATIVES = [
  "3m", // competitor film (June: "3m ppf dubai")
  "llumar", // competitor film, listed in strategy but missing live
  "al nisar", // competitor shop (June search term)
  "car plaza", // competitor shop (June search term)
  "matte wrap", // vinyl-wrap intent; keeps "matte ppf" (a real GTA service)
  "which is best", // informational comparison
  "ceramic coating or ppf", // informational comparison ("vs" variant already covered)
  "car protective wrap", // generic wrap intent
  "black diamond ppf", // film brand GTA does not install (Diamond Pro is different)
];

const NEGATIVES = [...CARRIED_NEGATIVES, ...NEW_NEGATIVES];

const SITELINKS = [
  {
    linkText: "Build My PPF Price",
    description1: "3 quick questions",
    description2: "Exact price on screen",
    finalUrl: FINAL_URL,
  },
  {
    linkText: "Real Customer Handovers",
    description1: "See finished installs",
    description2: "Real cars, real buyers",
    finalUrl: `${FINAL_URL}#real-handovers`,
  },
  {
    linkText: "Portfolio",
    description1: "Browse recent installs",
    description2: "Gloss and matte finishes",
    finalUrl: `https://www.grandtouchauto.ae/portfolio?${UTM}`,
  },
  {
    linkText: "Contact",
    description1: "Speak to Sean directly",
    description2: "Quick WhatsApp response",
    finalUrl: `https://www.grandtouchauto.ae/contact?${UTM}`,
  },
];

function parseOptions(argv) {
  return {
    apply: argv.includes("--apply"),
    enable: argv.includes("--enable"),
  };
}

const esc = (v) => String(v).replace(/\\/g, "\\\\").replace(/'/g, "\\'");

function validateTextLengths() {
  for (const group of AD_GROUPS) {
    for (const headline of [group.mirrorHeadline, ...SHARED_HEADLINES]) {
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
}

const budgetTemp = (cid) => `customers/${cid}/campaignBudgets/-1`;
const campaignTemp = (cid) => `customers/${cid}/campaigns/-2`;
const adGroupTemp = (cid, id) => `customers/${cid}/adGroups/${id}`;
const assetTemp = (cid, id) => `customers/${cid}/assets/${id}`;
const rsaAssets = (values) => values.map((text) => ({ text }));

async function findCampaign(config) {
  const rows = await searchStream(
    config,
    `SELECT campaign.resource_name, campaign.id, campaign.name, campaign.status
     FROM campaign WHERE campaign.name = '${esc(CAMPAIGN_NAME)}' LIMIT 1`,
  );
  return rows[0]?.campaign || null;
}

async function enableCampaign(config, campaign, options) {
  await mutate(
    config,
    [
      {
        campaignOperation: {
          update: { resourceName: campaign.resourceName, status: "ENABLED" },
          updateMask: "status",
        },
      },
    ],
    { partialFailure: false, validateOnly: !options.apply },
  );
  console.log(
    `${options.apply ? "Enabled" : "Would enable (dry-run)"}: ${campaign.name} (was ${campaign.status})`,
  );
}

async function applyConversionGoals(config, campaign, options) {
  const actionResourceNames = CONVERSION_ACTION_IDS.map(
    (id) => `customers/${config.customerId}/conversionActions/${id}`,
  );

  const goalRows = await searchStream(
    config,
    `SELECT custom_conversion_goal.resource_name, custom_conversion_goal.name,
            custom_conversion_goal.conversion_actions, custom_conversion_goal.status
     FROM custom_conversion_goal WHERE custom_conversion_goal.status = 'ENABLED'`,
  );

  const wanted = [...actionResourceNames].sort().join(",");
  let goalResourceName = goalRows.find(
    (r) => [...(r.customConversionGoal.conversionActions || [])].sort().join(",") === wanted,
  )?.customConversionGoal?.resourceName;

  if (goalResourceName) {
    console.log(`Reusing existing custom conversion goal: ${goalResourceName}`);
  } else if (!options.apply) {
    console.log(
      `Would create custom conversion goal "${CUSTOM_GOAL_NAME}" with actions ${CONVERSION_ACTION_IDS.join(", ")}`,
    );
  } else {
    const result = await mutate(
      config,
      [
        {
          customConversionGoalOperation: {
            create: {
              resourceName: `customers/${config.customerId}/customConversionGoals/-1`,
              name: CUSTOM_GOAL_NAME,
              conversionActions: actionResourceNames,
              status: "ENABLED",
            },
          },
        },
      ],
      { partialFailure: false, validateOnly: false },
    );
    goalResourceName = result.mutateOperationResponses?.[0]?.customConversionGoalResult?.resourceName;
    if (!goalResourceName) throw new Error("Custom conversion goal creation returned no resource name.");
    console.log(`Created custom conversion goal: ${goalResourceName}`);
  }

  if (!options.apply) {
    console.log("Would set campaign goal config to CUSTOM with that goal (apply mode only).");
    return;
  }

  await mutate(
    config,
    [
      {
        conversionGoalCampaignConfigOperation: {
          update: {
            resourceName: `customers/${config.customerId}/conversionGoalCampaignConfigs/${campaign.id}`,
            goalConfigLevel: "CAMPAIGN",
            customConversionGoal: goalResourceName,
          },
          updateMask: "goalConfigLevel,customConversionGoal",
        },
      },
    ],
    { partialFailure: false, validateOnly: false },
  );
  console.log(
    `Campaign conversion goals set to CUSTOM: Submit lead form + WhatsApp contact click only.`,
  );
}

function buildCreateOperations(cid) {
  const operations = [
    {
      campaignBudgetOperation: {
        create: {
          resourceName: budgetTemp(cid),
          name: `${CAMPAIGN_NAME} Budget`,
          amountMicros: DAILY_BUDGET_MICROS,
          deliveryMethod: "STANDARD",
          explicitlyShared: false,
        },
      },
    },
    {
      campaignOperation: {
        create: {
          resourceName: campaignTemp(cid),
          name: CAMPAIGN_NAME,
          status: "PAUSED",
          advertisingChannelType: "SEARCH",
          containsEuPoliticalAdvertising: "DOES_NOT_CONTAIN_EU_POLITICAL_ADVERTISING",
          campaignBudget: budgetTemp(cid),
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
    },
  ];

  for (const geo of GEO_TARGETS) {
    operations.push({
      campaignCriterionOperation: {
        create: { campaign: campaignTemp(cid), location: { geoTargetConstant: geo } },
      },
    });
  }

  operations.push({
    campaignCriterionOperation: {
      create: { campaign: campaignTemp(cid), language: { languageConstant: LANGUAGE_ENGLISH } },
    },
  });

  for (const text of NEGATIVES) {
    operations.push({
      campaignCriterionOperation: {
        create: {
          campaign: campaignTemp(cid),
          negative: true,
          keyword: { text, matchType: "PHRASE" },
        },
      },
    });
  }

  let adGroupTempId = -10;
  for (const group of AD_GROUPS) {
    const adGroupResourceName = adGroupTemp(cid, adGroupTempId);
    operations.push({
      adGroupOperation: {
        create: {
          resourceName: adGroupResourceName,
          campaign: campaignTemp(cid),
          name: group.name,
          status: "ENABLED",
          type: "SEARCH_STANDARD",
        },
      },
    });

    for (const [text, matchType] of group.keywords) {
      operations.push({
        adGroupCriterionOperation: {
          create: {
            adGroup: adGroupResourceName,
            status: "ENABLED",
            keyword: { text, matchType },
          },
        },
      });
    }

    for (const headlines of rsaVariantsFor(group)) {
      operations.push({
        adGroupAdOperation: {
          create: {
            adGroup: adGroupResourceName,
            status: "ENABLED",
            ad: {
              finalUrls: [FINAL_URL],
              responsiveSearchAd: {
                headlines: rsaAssets(headlines),
                descriptions: rsaAssets(group.descriptions),
                path1: group.path1,
                path2: group.path2,
              },
            },
          },
        },
      });
    }

    adGroupTempId -= 1;
  }

  // Campaign-level sitelinks ONLY — no ad-group sitelinks, ever.
  let assetTempId = -100;
  for (const sitelink of SITELINKS) {
    operations.push({
      assetOperation: {
        create: {
          resourceName: assetTemp(cid, assetTempId),
          name: `jul_2026_${sitelink.linkText.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
          finalUrls: [sitelink.finalUrl],
          sitelinkAsset: {
            linkText: sitelink.linkText,
            description1: sitelink.description1,
            description2: sitelink.description2,
          },
        },
      },
    });
    operations.push({
      campaignAssetOperation: {
        create: {
          campaign: campaignTemp(cid),
          asset: assetTemp(cid, assetTempId),
          fieldType: "SITELINK",
        },
      },
    });
    assetTempId -= 1;
  }

  for (const calloutId of CALLOUT_ASSET_IDS) {
    operations.push({
      campaignAssetOperation: {
        create: {
          campaign: campaignTemp(cid),
          asset: `customers/${cid}/assets/${calloutId}`,
          fieldType: "CALLOUT",
        },
      },
    });
  }

  operations.push({
    campaignAssetOperation: {
      create: {
        campaign: campaignTemp(cid),
        asset: `customers/${cid}/assets/${CALL_ASSET_ID}`,
        fieldType: "CALL",
      },
    },
  });

  return operations;
}

function printSummary(options) {
  console.log(`\n=== ${CAMPAIGN_NAME} ===`);
  console.log(`Mode: ${options.apply ? "APPLY" : "DRY-RUN (validateOnly — nothing written)"}`);
  console.log(`Status on create: PAUSED (enable separately with --enable --apply)`);
  console.log(`Budget: AED 200/day | Bidding: Maximize Clicks, CPC cap AED 20`);
  console.log(`Network: Google Search only (no partners, no display)`);
  console.log(`Geo (PRESENCE): Dubai province (9041083) + Sharjah province (9047099)`);
  console.log(`Language: English`);
  console.log(`Final URL: ${FINAL_URL}`);
  console.log(`\nAd groups (${AD_GROUPS.length}):`);
  for (const group of AD_GROUPS) {
    console.log(`- ${group.name}: ${group.keywords.length} keywords, 3 RSAs`);
    for (const [text, matchType] of group.keywords) {
      console.log(`    ${matchType === "EXACT" ? "[exact]" : '"phrase"'} ${text}`);
    }
  }
  console.log(`\nNegatives: ${NEGATIVES.length} (${CARRIED_NEGATIVES.length} carried from May campaign minus "sharjah", +${NEW_NEGATIVES.length} new)`);
  console.log(`New negatives: ${NEW_NEGATIVES.join(", ")}`);
  console.log(`\nSitelinks (campaign-level only): ${SITELINKS.map((s) => s.linkText).join(" · ")}`);
  console.log(`Callouts: ${CALLOUT_ASSET_IDS.length} existing assets reattached`);
  console.log(`Call asset: existing ${CALL_ASSET_ID} (+971 56 719 1045 — set 9am-9pm schedule in UI)`);
  console.log(`Conversion goals: CUSTOM — Submit lead form (7569208694) + WhatsApp contact click (7617388951)`);
}

try {
  validateTextLengths();

  const options = parseOptions(process.argv.slice(2));
  const config = loadWorkflowConfig(process.argv.slice(2));
  const existing = await findCampaign(config);

  if (existing?.resourceName) {
    console.log(`Campaign already exists: ${existing.name} (${existing.status})`);

    if (options.enable && existing.status !== "ENABLED") {
      await enableCampaign(config, existing, options);
    } else if (options.enable) {
      console.log("Already ENABLED — nothing to do.");
    }

    await applyConversionGoals(config, existing, options);
    process.exit(0);
  }

  if (options.enable) {
    throw new Error("--enable passed but the campaign does not exist yet. Create it first.");
  }

  const operations = buildCreateOperations(config.customerId);
  const result = await mutate(config, operations, {
    partialFailure: false,
    validateOnly: !options.apply,
  });

  printSummary(options);

  if (!options.apply) {
    console.log(`\nValidated ${operations.length} operations — no changes written. Re-run with --apply.`);
    process.exit(0);
  }

  console.log(`\nApplied ${operations.length} operations.`);
  const campaignResourceName = result.mutateOperationResponses?.find(
    (r) => r.campaignResult,
  )?.campaignResult?.resourceName;
  console.log(`Campaign: ${campaignResourceName || "(resource name not returned)"}`);

  const created = await findCampaign(config);
  if (created) {
    console.log(`Campaign ID: ${created.id} (status ${created.status})`);
    await applyConversionGoals(config, created, options);
  } else {
    console.warn("Could not re-read the created campaign — set conversion goals by re-running the script.");
  }
} catch (error) {
  console.error("setup-ppf-price-search-jul-2026 failed.");
  console.error(error.message);
  process.exitCode = 1;
}
