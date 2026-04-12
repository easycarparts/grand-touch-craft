import { loadWorkflowConfig, mutate, searchStream } from "./api.mjs";

const HEADLINES = [
  "PPF Dubai You Can Trust",
  "Paint Protection Film Dubai",
  "Get A Real PPF Quote",
  "Warranty You Can Trace",
  "Proper Install. Clear Process.",
  "Direct With Sean",
  "Sean-Led Quote & Handover",
  "Genuine STEK. Registered.",
  "Dubai PPF Done Properly",
  "No Vague Handoffs",
  "See Finish Before Sign-Off",
  "Get PPF Pricing In Dubai",
  "Built Around Your Car",
  "Gloss Or Matte That Fits",
  "Real Buyer Handover",
];

const DESCRIPTIONS = [
  "Get a real PPF quote with proper install, genuine STEK, and warranty you can trace.",
  "Sean guides the quote and handover, so the standard promised is the standard delivered.",
  "Compare the right finish and coverage for your car, then ask Sean directly on WhatsApp.",
  "Built for Dubai drivers who care about clean prep, finish quality, and no vague handoff.",
];

async function getRsa(config, campaignName) {
  const query = `
    SELECT
      ad_group_ad.ad.resource_name,
      ad_group_ad.resource_name,
      ad_group_ad.ad.id,
      ad_group_ad.ad.final_urls,
      ad_group_ad.ad.responsive_search_ad.path1,
      ad_group_ad.ad.responsive_search_ad.path2
    FROM ad_group_ad
    WHERE campaign.name = '${campaignName.replace(/'/g, "\\'")}'
    LIMIT 1
  `;

  const rows = await searchStream(config, query);
  const row = rows[0];
  if (!row?.adGroupAd?.ad?.resourceName) {
    throw new Error(`Could not find an RSA in campaign ${campaignName}.`);
  }

  return row;
}

try {
  const config = loadWorkflowConfig(process.argv.slice(2));
  const campaignName = config.campaign || "Leads-Search-1";
  const rsaRow = await getRsa(config, campaignName);

  const operation = {
    adOperation: {
      update: {
        resourceName: rsaRow.adGroupAd.ad.resourceName,
        responsiveSearchAd: {
          headlines: HEADLINES.map((text) => ({ text })),
          descriptions: DESCRIPTIONS.map((text) => ({ text })),
          path1: rsaRow.adGroupAd.ad.responsiveSearchAd?.path1 || "ppf",
          path2: rsaRow.adGroupAd.ad.responsiveSearchAd?.path2 || "dubai-quote",
        },
        finalUrls: rsaRow.adGroupAd.ad.finalUrls || [
          "https://grandtouchauto.ae/ppf-dubai-quote",
        ],
      },
      updateMask:
        "responsive_search_ad.headlines,responsive_search_ad.descriptions,responsive_search_ad.path1,responsive_search_ad.path2,final_urls",
    },
  };

  await mutate(config, [operation], {
    partialFailure: false,
    validateOnly: false,
  });

  console.log(`Updated RSA copy for ${campaignName}.`);
  console.log("Headlines:");
  for (const headline of HEADLINES) {
    console.log(`- ${headline}`);
  }
  console.log("Descriptions:");
  for (const description of DESCRIPTIONS) {
    console.log(`- ${description}`);
  }
} catch (error) {
  console.error("ads:update-rsa-copy failed.");
  console.error(error.message);
  process.exitCode = 1;
}
