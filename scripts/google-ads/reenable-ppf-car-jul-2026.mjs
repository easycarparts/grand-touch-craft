import { loadWorkflowConfig, mutate, searchStream } from "./api.mjs";

/**
 * Post-rescue correction (2026-07-08):
 * - Re-enable "ppf car" PHRASE with a 13 AED keyword CPC cap (below the
 *   campaign's 20). click_view attribution proved it produced 2 of the 6
 *   launch-week CRM captures (~204 AED/capture, inside the <250 target);
 *   its junk variants are now negatived (ppf coating, ppf for car, near me,
 *   difference between, competitor shops).
 * - Remove the [ppf] EXACT campaign negative: the bare query converted on
 *   the May campaign and geo PRESENCE targeting already excludes the
 *   overseas curiosity traffic it was meant to block.
 *
 * SAFE BY DEFAULT: validateOnly dry-run unless `--apply`.
 */

const CAMPAIGN_NAME = "PPF Price Search Dubai - Jul 2026";
const AD_GROUP = "Core PPF Dubai";
const KEYWORD_TEXT = "ppf car";
const KEYWORD_MATCH = "PHRASE";
const KEYWORD_CPC_MICROS = "13000000"; // 13 AED cap for this keyword only
const NEGATIVE_TO_REMOVE = { text: "ppf", matchType: "EXACT" };

function parseOptions(argv) {
  return { apply: argv.includes("--apply") };
}

const esc = (v) => String(v).replace(/\\/g, "\\\\").replace(/'/g, "\\'");

try {
  const options = parseOptions(process.argv.slice(2));
  const config = loadWorkflowConfig(process.argv.slice(2));
  const operations = [];

  const kwRows = await searchStream(
    config,
    `SELECT ad_group_criterion.resource_name, ad_group_criterion.status, ad_group_criterion.cpc_bid_micros
     FROM ad_group_criterion
     WHERE campaign.name = '${esc(CAMPAIGN_NAME)}'
       AND ad_group.name = '${esc(AD_GROUP)}'
       AND ad_group_criterion.type = KEYWORD
       AND ad_group_criterion.negative = false
       AND ad_group_criterion.status != 'REMOVED'
       AND ad_group_criterion.keyword.text = '${esc(KEYWORD_TEXT)}'
       AND ad_group_criterion.keyword.match_type = '${KEYWORD_MATCH}'
     LIMIT 1`,
  );
  const keyword = kwRows[0]?.adGroupCriterion;
  if (!keyword?.resourceName) throw new Error(`Keyword not found: ${KEYWORD_TEXT} [${KEYWORD_MATCH}]`);

  if (keyword.status === "ENABLED" && keyword.cpcBidMicros === KEYWORD_CPC_MICROS) {
    console.log(`Keyword already ENABLED with 13 AED cap — nothing to do.`);
  } else {
    operations.push({
      adGroupCriterionOperation: {
        update: {
          resourceName: keyword.resourceName,
          status: "ENABLED",
          cpcBidMicros: KEYWORD_CPC_MICROS,
        },
        updateMask: "status,cpcBidMicros",
      },
    });
    console.log(
      `RE-ENABLE ${AD_GROUP} / "${KEYWORD_TEXT}" [${KEYWORD_MATCH}] (was ${keyword.status}) with keyword CPC cap 13 AED`,
    );
  }

  const negRows = await searchStream(
    config,
    `SELECT campaign_criterion.resource_name
     FROM campaign_criterion
     WHERE campaign.name = '${esc(CAMPAIGN_NAME)}'
       AND campaign_criterion.negative = true
       AND campaign_criterion.type = KEYWORD
       AND campaign_criterion.status != 'REMOVED'
       AND campaign_criterion.keyword.text = '${esc(NEGATIVE_TO_REMOVE.text)}'
       AND campaign_criterion.keyword.match_type = '${NEGATIVE_TO_REMOVE.matchType}'
     LIMIT 1`,
  );
  const negative = negRows[0]?.campaignCriterion;
  if (!negative?.resourceName) {
    console.log(`Negative [${NEGATIVE_TO_REMOVE.text}] EXACT not present — nothing to remove.`);
  } else {
    operations.push({
      campaignCriterionOperation: { remove: negative.resourceName },
    });
    console.log(`REMOVE negative: [${NEGATIVE_TO_REMOVE.text}] EXACT`);
  }

  console.log(`\nMode: ${options.apply ? "APPLY" : "DRY-RUN (validateOnly)"} | operations: ${operations.length}`);
  if (operations.length) {
    await mutate(config, operations, { partialFailure: false, validateOnly: !options.apply });
    console.log(options.apply ? "Applied." : "Validated. Re-run with --apply.");
  }
} catch (error) {
  console.error("reenable-ppf-car-jul-2026 failed.");
  console.error(error.message);
  process.exitCode = 1;
}
