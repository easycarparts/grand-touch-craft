import { loadWorkflowConfig, mutate, searchStream } from "./api.mjs";

const HEADLINES = [
  "PPF Dubai You Can Trust",
  "PPF Dubai Quote",
  "PPF Price Dubai",
  "Paint Protection Film Dubai",
  "Premium PPF In Dubai",
  "Get A Real PPF Quote",
  "Warranty You Can Trace",
  "Proper Install. Clear Process.",
  "Dubai Paint Protection",
  "Certified STEK Installs",
  "Genuine STEK Film",
  "Direct With Sean",
  "Grand Touch PPF Dubai",
  "Get Your PPF Estimate",
  "Premium Film. Proper Install.",
];

const DESCRIPTIONS = [
  "Get a real PPF quote in Dubai with clear pricing, proper install, and traceable warranty.",
  "Premium paint protection film for drivers who value trust, finish quality, and clean work.",
  "Deal directly with Sean at Grand Touch and compare the right protection for your car.",
  "Certified STEK installs, genuine materials, and a cleaner experience than PPF shops.",
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
