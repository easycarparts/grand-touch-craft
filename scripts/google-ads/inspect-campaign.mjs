import { loadWorkflowConfig, searchStream } from "./api.mjs";

function parseOptions(argv) {
  const campaignIndex = argv.findIndex((arg) => arg === "--campaign");
  const campaignEquals = argv.find((arg) => arg.startsWith("--campaign="));
  const campaign =
    campaignEquals?.slice("--campaign=".length) ||
    (campaignIndex >= 0 ? argv[campaignIndex + 1] : "");

  if (!campaign) {
    throw new Error("Pass --campaign=\"Campaign name\"");
  }

  return { campaign };
}

function escapeGaql(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function microsToAed(value) {
  return (Number(value || 0) / 1_000_000).toFixed(2);
}

async function runSection(title, config, query, mapRow) {
  const rows = await searchStream(config, query);
  console.log(`\n${title}`);
  if (!rows.length) {
    console.log("None.");
    return;
  }
  console.table(rows.map(mapRow));
}

try {
  const argv = process.argv.slice(2);
  const config = loadWorkflowConfig(argv);
  const { campaign } = parseOptions(argv);
  const name = escapeGaql(campaign);

  await runSection(
    "Campaign",
    config,
    `
      SELECT
        campaign.name,
        campaign.status,
        campaign.advertising_channel_type,
        campaign.bidding_strategy_type,
        campaign_budget.amount_micros,
        campaign.network_settings.target_google_search,
        campaign.network_settings.target_search_network,
        campaign.network_settings.target_content_network,
        campaign.network_settings.target_partner_search_network,
        campaign.geo_target_type_setting.positive_geo_target_type
      FROM campaign
      WHERE campaign.name = '${name}'
      LIMIT 1
    `,
    (row) => ({
      campaign: row.campaign?.name,
      status: row.campaign?.status,
      channel: row.campaign?.advertisingChannelType,
      bidding: row.campaign?.biddingStrategyType,
      budgetAed: microsToAed(row.campaignBudget?.amountMicros),
      googleSearch: row.campaign?.networkSettings?.targetGoogleSearch,
      searchNetwork: row.campaign?.networkSettings?.targetSearchNetwork,
      display: row.campaign?.networkSettings?.targetContentNetwork,
      partners: row.campaign?.networkSettings?.targetPartnerSearchNetwork,
      locationMode: row.campaign?.geoTargetTypeSetting?.positiveGeoTargetType,
    }),
  );

  await runSection(
    "Ad Groups",
    config,
    `
      SELECT
        ad_group.name,
        ad_group.status,
        ad_group.type
      FROM ad_group
      WHERE campaign.name = '${name}'
      ORDER BY ad_group.name
    `,
    (row) => ({
      adGroup: row.adGroup?.name,
      status: row.adGroup?.status,
      type: row.adGroup?.type,
    }),
  );

  await runSection(
    "Keywords",
    config,
    `
      SELECT
        ad_group.name,
        ad_group_criterion.keyword.text,
        ad_group_criterion.keyword.match_type,
        ad_group_criterion.status,
        ad_group_criterion.approval_status
      FROM keyword_view
      WHERE campaign.name = '${name}'
      ORDER BY ad_group.name, ad_group_criterion.keyword.text
    `,
    (row) => ({
      adGroup: row.adGroup?.name,
      keyword: row.adGroupCriterion?.keyword?.text,
      match: row.adGroupCriterion?.keyword?.matchType,
      status: row.adGroupCriterion?.status,
      approval: row.adGroupCriterion?.approvalStatus,
    }),
  );

  await runSection(
    "Ads",
    config,
    `
      SELECT
        ad_group.name,
        ad_group_ad.status,
        ad_group_ad.policy_summary.approval_status,
        ad_group_ad.policy_summary.review_status,
        ad_group_ad.ad.type
      FROM ad_group_ad
      WHERE campaign.name = '${name}'
      ORDER BY ad_group.name
    `,
    (row) => ({
      adGroup: row.adGroup?.name,
      status: row.adGroupAd?.status,
      approval: row.adGroupAd?.policySummary?.approvalStatus,
      review: row.adGroupAd?.policySummary?.reviewStatus,
      type: row.adGroupAd?.ad?.type,
    }),
  );

  await runSection(
    "Campaign Negatives",
    config,
    `
      SELECT
        campaign_criterion.keyword.text,
        campaign_criterion.keyword.match_type,
        campaign_criterion.status
      FROM campaign_criterion
      WHERE campaign.name = '${name}'
        AND campaign_criterion.negative = true
        AND campaign_criterion.type = KEYWORD
      ORDER BY campaign_criterion.keyword.text
    `,
    (row) => ({
      negative: row.campaignCriterion?.keyword?.text,
      match: row.campaignCriterion?.keyword?.matchType,
      status: row.campaignCriterion?.status,
    }),
  );
} catch (error) {
  console.error("ads:inspect-campaign failed.");
  console.error(error.message);
  process.exitCode = 1;
}
