import { loadWorkflowConfig, mutate, searchStream } from "./api.mjs";

/**
 * Repoints the Final URLs of every ENABLED responsive search ad in a campaign
 * to a new landing page. Built to move the proven May campaign from the V1
 * guided funnel to the V2 funnel without creating a new campaign (preserves
 * Quality Score, ad rank, and bidding history).
 *
 * SAFE BY DEFAULT: runs as a Google Ads `validateOnly` dry-run unless you pass
 * `--apply`. Always prints the current URLs first so you have a rollback record.
 *
 * Usage:
 *   node scripts/google-ads/repoint-final-urls.mjs --env=.env.google-ads \
 *     "--campaign=PPF Search UAE - WhatsApp - May 2026"            # dry-run
 *
 *   node scripts/google-ads/repoint-final-urls.mjs --env=.env.google-ads \
 *     "--campaign=PPF Search UAE - WhatsApp - May 2026" --apply     # live
 *
 *   ... --url="https://www.grandtouchauto.ae/whatever?utm_..."      # override URL
 */

const DEFAULT_CAMPAIGN = "PPF Search UAE - WhatsApp - May 2026";
const DEFAULT_URL =
  "https://www.grandtouchauto.ae/ppf-full-ppf-calculator-guided-v2" +
  "?utm_source=google&utm_medium=paid_search&utm_campaign=ppf_whatsapp_search_may_2026";

function parseExtraArgs(argv) {
  const apply = argv.includes("--apply");
  const urlArg = argv.find((a) => a.startsWith("--url="));
  const url = urlArg ? urlArg.slice("--url=".length) : DEFAULT_URL;
  return { apply, url };
}

async function getEnabledRsas(config, campaignName) {
  const query = `
    SELECT
      ad_group.name,
      ad_group_ad.ad.resource_name,
      ad_group_ad.ad.final_urls,
      ad_group_ad.status
    FROM ad_group_ad
    WHERE campaign.name = '${campaignName.replace(/'/g, "\\'")}'
      AND ad_group_ad.status = 'ENABLED'
      AND ad_group_ad.ad.type = RESPONSIVE_SEARCH_AD
    ORDER BY ad_group.name
  `;
  return searchStream(config, query);
}

async function getSitelinkAssets(config, campaignName) {
  const query = `
    SELECT
      campaign.name,
      asset.resource_name,
      asset.sitelink_asset.link_text,
      asset.final_urls
    FROM campaign_asset
    WHERE campaign.name = '${campaignName.replace(/'/g, "\\'")}'
      AND asset.type = SITELINK
  `;
  return searchStream(config, query);
}

try {
  const argv = process.argv.slice(2);
  const config = loadWorkflowConfig(argv);
  const campaignName = config.campaign || DEFAULT_CAMPAIGN;
  const { apply, url } = parseExtraArgs(argv);

  const rows = await getEnabledRsas(config, campaignName);
  if (!rows.length) {
    throw new Error(`No enabled RSAs found in campaign "${campaignName}".`);
  }

  console.log(`Campaign: ${campaignName}`);
  console.log(`Mode: ${apply ? "APPLY (live mutate)" : "DRY-RUN (validateOnly)"}`);
  console.log(`New Final URL: ${url}\n`);

  const sitelinks = await getSitelinkAssets(config, campaignName);

  console.log("Current Final URLs (rollback record):");
  for (const row of rows) {
    const adGroup = row.adGroup?.name ?? "(unknown ad group)";
    const current = row.adGroupAd?.ad?.finalUrls?.join(", ") ?? "(none)";
    console.log(`- RSA  [${adGroup}] ${current}`);
  }
  for (const row of sitelinks) {
    const text = row.asset?.sitelinkAsset?.linkText ?? "(sitelink)";
    const current = row.asset?.finalUrls?.join(", ") ?? "(none)";
    console.log(`- LINK [${text}] ${current}`);
  }

  const operations = [
    ...rows.map((row) => ({
      adOperation: {
        update: {
          resourceName: row.adGroupAd.ad.resourceName,
          finalUrls: [url],
        },
        updateMask: "final_urls",
      },
    })),
    ...sitelinks.map((row) => ({
      assetOperation: {
        update: {
          resourceName: row.asset.resourceName,
          finalUrls: [url],
        },
        updateMask: "final_urls",
      },
    })),
  ];

  await mutate(config, operations, {
    partialFailure: false,
    validateOnly: !apply,
  });

  console.log(
    `\n${apply ? "Updated" : "Validated (no changes written)"} ${operations.length} ` +
      `entity(ies): ${rows.length} RSA(s) + ${sitelinks.length} sitelink(s).`,
  );
  if (!apply) {
    console.log("Re-run with --apply to write the change.");
  }
} catch (error) {
  console.error("repoint-final-urls failed.");
  console.error(error.message);
  process.exitCode = 1;
}
