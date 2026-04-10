import {
  getCampaignPerformance,
  getSearchTerms,
  groupSearchTerms,
  loadWorkflowConfig,
  microsToCurrency,
  suggestNegativeKeywords,
} from "./api.mjs";

function sumCampaigns(rows) {
  return rows.reduce(
    (acc, row) => {
      acc.impressions += Number(row.metrics?.impressions || 0);
      acc.clicks += Number(row.metrics?.clicks || 0);
      acc.cost += microsToCurrency(row.metrics?.costMicros);
      acc.conversions += Number(row.metrics?.conversions || 0);
      return acc;
    },
    { impressions: 0, clicks: 0, cost: 0, conversions: 0 },
  );
}

function printCurrency(value) {
  return `AED ${value.toFixed(2)}`;
}

function printTopTerms(title, rows) {
  console.log(`\n${title}`);
  if (rows.length === 0) {
    console.log("  None.");
    return;
  }

  for (const row of rows) {
    console.log(
      `  - ${row.searchTerm} | cost ${printCurrency(row.cost)} | clicks ${row.clicks} | conversions ${row.conversions}`,
    );
  }
}

try {
  const config = loadWorkflowConfig(process.argv.slice(2));
  const [campaignRows, searchTermRows] = await Promise.all([
    getCampaignPerformance(config),
    getSearchTerms(config),
  ]);

  const totals = sumCampaigns(campaignRows);
  const ctr = totals.impressions ? (totals.clicks / totals.impressions) * 100 : 0;
  const avgCpc = totals.clicks ? totals.cost / totals.clicks : 0;
  const convRate = totals.clicks ? (totals.conversions / totals.clicks) * 100 : 0;
  const costPerConv = totals.conversions ? totals.cost / totals.conversions : 0;

  const groupedTerms = groupSearchTerms(searchTermRows);
  const wastedSpendTerms = groupedTerms
    .filter((term) => term.cost > 0 && term.conversions === 0)
    .slice(0, 10);
  const negativeCandidates = suggestNegativeKeywords(groupedTerms).slice(0, 10);
  const winningTerms = groupedTerms
    .filter((term) => term.conversions > 0)
    .sort((a, b) => b.conversions - a.conversions)
    .slice(0, 10);

  if (config.json) {
    console.log(
      JSON.stringify(
        {
          windowDays: config.days,
          campaignFilter: config.campaign || null,
          summary: {
            impressions: totals.impressions,
            clicks: totals.clicks,
            costAed: totals.cost,
            conversions: totals.conversions,
            ctr,
            avgCpcAed: avgCpc,
            conversionRate: convRate,
            costPerConversionAed: costPerConv,
          },
          wastedSpendTerms,
          negativeCandidates,
          winningTerms,
        },
        null,
        2,
      ),
    );
    process.exit(0);
  }

  console.log(`Google Ads review for the last ${config.days} day(s)`);
  if (config.campaign) {
    console.log(`Campaign filter: ${config.campaign}`);
  }

  console.log("\nSummary");
  console.log(`  Impressions: ${totals.impressions}`);
  console.log(`  Clicks: ${totals.clicks}`);
  console.log(`  Cost: ${printCurrency(totals.cost)}`);
  console.log(`  Conversions: ${totals.conversions.toFixed(2)}`);
  console.log(`  CTR: ${ctr.toFixed(2)}%`);
  console.log(`  Avg CPC: ${printCurrency(avgCpc)}`);
  console.log(`  Conversion rate: ${convRate.toFixed(2)}%`);
  console.log(
    `  Cost per conversion: ${costPerConv ? printCurrency(costPerConv) : "n/a"}`,
  );

  printTopTerms("Highest-cost search terms with zero conversions", wastedSpendTerms);
  printTopTerms("Likely negative keyword candidates", negativeCandidates);
  printTopTerms("Top converting search terms", winningTerms);
} catch (error) {
  console.error("ads:review failed.");
  console.error(error.message);
  process.exitCode = 1;
}
