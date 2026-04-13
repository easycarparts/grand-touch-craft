import { loadWorkflowConfig, mutate, searchStream } from "./api.mjs";

const SITELINKS = [
  {
    linkText: "PPF Quote",
    description1: "Build the right package",
    description2: "Unlock your estimate",
    finalUrl: "https://grandtouchauto.ae/ppf-dubai-quote#quote-calculator",
  },
  {
    linkText: "Why Grand Touch",
    description1: "Sean-led quote and handover",
    description2: "Prep before film",
    finalUrl: "https://grandtouchauto.ae/ppf-dubai-quote#why-grand-touch",
  },
  {
    linkText: "Why We Use STEK",
    description1: "Genuine film and warranty",
    description2: "Watch Sean explain it",
    finalUrl: "https://grandtouchauto.ae/ppf-dubai-quote#why-stek",
  },
  {
    linkText: "Real Handovers",
    description1: "Buyer reviews and videos",
    description2: "See finished handovers",
    finalUrl: "https://grandtouchauto.ae/ppf-dubai-quote#real-handovers",
  },
];

const CALLOUTS = [
  "Direct With Sean",
  "Warranty You Can Trace",
  "Proper Prep Before Film",
  "Genuine STEK Film",
];

function escapeGaql(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function parseOptions(argv) {
  return {
    validateOnly: argv.includes("--validate-only"),
  };
}

function validateTextLengths() {
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

async function getCampaign(config, campaignName) {
  const query = `
    SELECT
      campaign.resource_name,
      campaign.name
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

async function getExistingCampaignAssets(config, campaignName) {
  const query = `
    SELECT
      campaign.name,
      campaign_asset.field_type,
      campaign_asset.status,
      asset.resource_name,
      asset.sitelink_asset.link_text,
      asset.callout_asset.callout_text
    FROM campaign_asset
    WHERE campaign.name = '${escapeGaql(campaignName)}'
      AND campaign_asset.status != 'REMOVED'
  `;

  return searchStream(config, query);
}

function buildCreateSitelinkAssetOperation(customerId, sitelink, tempId) {
  return {
    assetOperation: {
      create: {
        resourceName: `customers/${customerId}/assets/${tempId}`,
        name: `ppf_quote_${sitelink.linkText.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
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

function buildAttachAssetOperation(campaignResourceName, customerId, tempId, fieldType) {
  return {
    campaignAssetOperation: {
      create: {
        campaign: campaignResourceName,
        asset: `customers/${customerId}/assets/${tempId}`,
        fieldType,
      },
    },
  };
}

function buildCreateCalloutAssetOperation(customerId, text, tempId) {
  return {
    assetOperation: {
      create: {
        resourceName: `customers/${customerId}/assets/${tempId}`,
        name: `ppf_quote_callout_${text.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
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
  const campaignName = config.campaign || "Leads-Search-1";
  const campaign = await getCampaign(config, campaignName);
  const existingAssets = await getExistingCampaignAssets(config, campaignName);

  const existingSitelinks = new Set(
    existingAssets
      .filter((row) => row.campaignAsset?.fieldType === "SITELINK")
      .map((row) => row.asset?.sitelinkAsset?.linkText)
      .filter(Boolean),
  );
  const existingCallouts = new Set(
    existingAssets
      .filter((row) => row.campaignAsset?.fieldType === "CALLOUT")
      .map((row) => row.asset?.calloutAsset?.calloutText)
      .filter(Boolean),
  );

  const mutateOperations = [];
  const addedSitelinks = [];
  const addedCallouts = [];
  let tempId = -1;

  for (const sitelink of SITELINKS) {
    if (existingSitelinks.has(sitelink.linkText)) continue;
    mutateOperations.push(buildCreateSitelinkAssetOperation(config.customerId, sitelink, tempId));
    mutateOperations.push(buildAttachAssetOperation(campaign.resourceName, config.customerId, tempId, "SITELINK"));
    addedSitelinks.push(sitelink.linkText);
    tempId -= 1;
  }

  for (const callout of CALLOUTS) {
    if (existingCallouts.has(callout)) continue;
    mutateOperations.push(buildCreateCalloutAssetOperation(config.customerId, callout, tempId));
    mutateOperations.push(buildAttachAssetOperation(campaign.resourceName, config.customerId, tempId, "CALLOUT"));
    addedCallouts.push(callout);
    tempId -= 1;
  }

  if (mutateOperations.length) {
    await mutate(config, mutateOperations, {
      partialFailure: false,
      validateOnly: options.validateOnly,
    });
  }

  console.log(`${options.validateOnly ? "Validated" : "Applied"} assets for ${campaignName}.`);
  console.log(`Sitelinks added: ${addedSitelinks.length}`);
  for (const item of addedSitelinks) console.log(`- ${item}`);
  console.log(`Callouts added: ${addedCallouts.length}`);
  for (const item of addedCallouts) console.log(`- ${item}`);
} catch (error) {
  console.error("ads:add-assets failed.");
  console.error(error.message);
  process.exitCode = 1;
}
