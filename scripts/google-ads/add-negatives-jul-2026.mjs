import { loadWorkflowConfig, mutate, searchStream } from "./api.mjs";

/**
 * July 2026 negatives sweep for the live May campaign.
 *
 * Source: last-14-day search terms (2026-06-17..07-01) — the Maximize Clicks
 * period pulled in competitor/navigational, informational, and colour-change
 * queries that spent with zero conversions. Own films (STEK, KDX, GYEON,
 * Diamond Pro, Supreme) are deliberately NOT negatived.
 *
 * SAFE BY DEFAULT: validateOnly dry-run unless you pass `--apply`.
 * Dedupes against existing campaign negatives.
 */

const CAMPAIGN_NAME = "PPF Search UAE - WhatsApp - May 2026";

const NEGATIVES = [
  // Competitor / navigational shops seen in search terms
  "rma ppf",
  "nvn motorworks",
  "al sewar",
  "smart auto",
  "ipd ae",
  "global ppf",
  "rapid detailing",
  // Film brands GTA does NOT install (research traffic)
  "gswf",
  "saint gobain",
  // Informational / research intent
  "what is",
  "types of",
  // Colour-change PPF (not a GTA service)
  "color ppf",
  "colour ppf",
  "ppf color",
  "ppf colour",
  // Deal hunters / small jobs
  "deals",
  "door edge",
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
  console.error("add-negatives-jul-2026 failed.");
  console.error(error.message);
  process.exitCode = 1;
}
