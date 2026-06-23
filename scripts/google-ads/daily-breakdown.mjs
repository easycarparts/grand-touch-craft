import { loadWorkflowConfig, searchStream, microsToCurrency } from "./api.mjs";

const config = loadWorkflowConfig(process.argv.slice(2));

// 1. Daily clicks/cost/conversions for the live campaign
const daily = await searchStream(
  config,
  `SELECT segments.date, metrics.clicks, metrics.impressions, metrics.cost_micros, metrics.conversions
   FROM campaign
   WHERE campaign.status = 'ENABLED' AND segments.date DURING LAST_14_DAYS
   ORDER BY segments.date`
);

console.log("\n=== DAILY (enabled campaigns) ===");
const byDate = {};
for (const r of daily) {
  const d = r.segments.date;
  byDate[d] = byDate[d] || { clicks: 0, cost: 0, conv: 0, impr: 0 };
  byDate[d].clicks += Number(r.metrics?.clicks || 0);
  byDate[d].impr += Number(r.metrics?.impressions || 0);
  byDate[d].cost += microsToCurrency(r.metrics?.costMicros || 0);
  byDate[d].conv += Number(r.metrics?.conversions || 0);
}
console.table(
  Object.entries(byDate).map(([date, v]) => ({
    date,
    impr: v.impr,
    clicks: v.clicks,
    costAed: v.cost.toFixed(2),
    conversions: v.conv.toFixed(2),
  }))
);

// 2. Conversions by action by date
const byAction = await searchStream(
  config,
  `SELECT segments.date, segments.conversion_action_name, metrics.conversions
   FROM campaign
   WHERE campaign.status = 'ENABLED' AND segments.date DURING LAST_14_DAYS AND metrics.conversions > 0
   ORDER BY segments.date`
);
console.log("\n=== CONVERSIONS BY ACTION BY DATE ===");
console.table(
  byAction.map((r) => ({
    date: r.segments.date,
    action: r.segments.conversionActionName,
    conv: Number(r.metrics?.conversions || 0).toFixed(2),
  }))
);
