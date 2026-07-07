import { loadWorkflowConfig, mutate, searchStream } from "./api.mjs";

/**
 * Week-1 search-term review negatives for the Jul 2026 campaign.
 * Source: search terms Jul 4-7 (clicked junk only).
 * SAFE BY DEFAULT: validateOnly dry-run unless `--apply`.
 */

const CAMPAIGN_NAME = "PPF Price Search Dubai - Jul 2026";

const NEGATIVES = [
  // Competitor / navigational shops that took clicks
  "easy care", // "easy care auto service..." 2 clicks, 39 AED
  "oscar legacy", // 1 click
  "menzerna", // car-care product brand, 1 click
  // Informational comparison ("vs" variants were covered, this one was not)
  "difference between",
  // Small-job intent (door-only PPF; "door edge" was covered, "door ppf" was not)
  "door ppf",
];

function parseOptions(argv) {
  return { apply: argv.includes("--apply") };
}

const esc = (v) => String(v).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
const keywordKey = (text, matchType) => `${String(text).toLowerCase()}::${matchType}`;

try {
  const options = parseOptions(process.argv.slice(2));
  const config = loadWorkflowConfig(process.argv.slice(2));

  const campRows = await searchStream(
    config,
    `SELECT campaign.resource_name, campaign.name FROM campaign
     WHERE campaign.name = '${esc(CAMPAIGN_NAME)}' LIMIT 1`,
  );
  const campaign = campRows[0]?.campaign;
  if (!campaign?.resourceName) throw new Error(`Campaign not found: ${CAMPAIGN_NAME}`);

  const existingRows = await searchStream(
    config,
    `SELECT campaign.name, campaign_criterion.keyword.text, campaign_criterion.keyword.match_type
     FROM campaign_criterion
     WHERE campaign.name = '${esc(CAMPAIGN_NAME)}'
       AND campaign_criterion.negative = true
       AND campaign_criterion.type = KEYWORD
       AND campaign_criterion.status != 'REMOVED'`,
  );
  const existing = new Set(
    existingRows.map((r) =>
      keywordKey(r.campaignCriterion?.keyword?.text || "", r.campaignCriterion?.keyword?.matchType || ""),
    ),
  );

  const added = [];
  const operations = [];
  for (const text of NEGATIVES) {
    if (existing.has(keywordKey(text, "PHRASE"))) continue;
    operations.push({
      campaignCriterionOperation: {
        create: {
          campaign: campaign.resourceName,
          negative: true,
          keyword: { text, matchType: "PHRASE" },
        },
      },
    });
    added.push(text);
  }

  console.log(`Campaign: ${CAMPAIGN_NAME}`);
  console.log(`Mode: ${options.apply ? "APPLY" : "DRY-RUN (validateOnly)"}`);
  console.log(`New negatives (${added.length}): ${added.join(", ") || "(none — all already present)"}`);

  if (operations.length) {
    await mutate(config, operations, {
      partialFailure: false,
      validateOnly: !options.apply,
    });
    console.log(options.apply ? "Applied." : "Validated (no changes written). Re-run with --apply.");
  }
} catch (error) {
  console.error("add-negatives-jul-2026-week1 failed.");
  console.error(error.message);
  process.exitCode = 1;
}
