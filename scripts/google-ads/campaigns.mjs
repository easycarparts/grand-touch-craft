import {
  getCampaignPerformance,
  loadWorkflowConfig,
  microsToCurrency,
} from "./api.mjs";

function printTable(rows) {
  const formatted = rows.map((row) => ({
    campaign: row.campaign?.name || "",
    status: row.campaign?.status || "",
    impressions: Number(row.metrics?.impressions || 0),
    clicks: Number(row.metrics?.clicks || 0),
    ctr: `${Number(row.metrics?.ctr || 0).toFixed(2)}%`,
    avgCpcAed: microsToCurrency(row.metrics?.averageCpc).toFixed(2),
    costAed: microsToCurrency(row.metrics?.costMicros).toFixed(2),
    conversions: Number(row.metrics?.conversions || 0).toFixed(2),
    costPerConvAed: microsToCurrency(row.metrics?.costPerConversion).toFixed(2),
  }));

  console.table(formatted);
}

try {
  const config = loadWorkflowConfig(process.argv.slice(2));
  const rows = await getCampaignPerformance(config);

  if (config.json) {
    console.log(JSON.stringify(rows, null, 2));
  } else if (rows.length === 0) {
    console.log("No campaign rows returned for the selected date range.");
  } else {
    printTable(rows);
  }
} catch (error) {
  console.error("ads:campaigns failed.");
  console.error(error.message);
  process.exitCode = 1;
}
