import { loadWorkflowConfig, mutate, searchStream, microsToCurrency } from "./api.mjs";

/**
 * Switch a campaign's bidding strategy between Maximize Clicks (TARGET_SPEND) and
 * Maximize Conversions (MAXIMIZE_CONVERSIONS).
 *
 * WHY (June 2026): the live campaign sat on Maximize Conversions but was fed 0
 * conversions for several days (the funnel popup/gate suppressed the WhatsApp
 * tap). With no conversion signal, conversion-based Smart Bidding starves
 * delivery. Moving to Maximize Clicks keeps the traffic flowing while the new
 * WhatsApp-first funnel recovers the conversion volume; switch back once the
 * counted WhatsApp conversions are coming through again.
 *
 * SAFE BY DEFAULT: validateOnly dry-run unless you pass `--apply`.
 *
 * Usage:
 *   node scripts/google-ads/switch-bidding.mjs --env=.env.google-ads \
 *     "--campaign=PPF Search UAE - WhatsApp - May 2026" --strategy=clicks            # dry-run
 *   ... --strategy=clicks --cpc-ceiling-aed=35 --apply                                # live
 *   ... --strategy=conversions --apply                                                # revert
 */

function parseExtra(argv) {
  const get = (k) => {
    const a = argv.find((x) => x.startsWith(`--${k}=`));
    return a ? a.slice(`--${k}=`.length) : "";
  };
  return {
    strategy: (get("strategy") || "clicks").toLowerCase(),
    cpcCeilingAed: get("cpc-ceiling-aed") ? Number(get("cpc-ceiling-aed")) : 35,
    apply: argv.includes("--apply"),
  };
}

try {
  const argv = process.argv.slice(2);
  const config = loadWorkflowConfig(argv);
  const campaign = config.campaign;
  const { strategy, cpcCeilingAed, apply } = parseExtra(argv);
  const validateOnly = !apply;

  if (!campaign) throw new Error('Pass --campaign="..."');
  if (!["clicks", "conversions"].includes(strategy)) {
    throw new Error("--strategy must be 'clicks' (Maximize Clicks) or 'conversions' (Maximize Conversions)");
  }

  const rows = await searchStream(
    config,
    `SELECT campaign.resource_name, campaign.name, campaign.bidding_strategy_type
     FROM campaign
     WHERE campaign.name = '${campaign.replace(/'/g, "\\'")}' AND campaign.status = 'ENABLED'`,
  );
  const c = rows[0]?.campaign;
  if (!c) throw new Error(`Enabled campaign "${campaign}" not found.`);

  console.log(`Mode: ${apply ? "APPLY" : "DRY-RUN (validateOnly)"}`);
  console.log(`Campaign "${c.name}" current bidding: ${c.biddingStrategyType}`);

  let update;
  let updateMask;
  let targetType;
  if (strategy === "clicks") {
    const ceilingMicros = Math.round(cpcCeilingAed * 1_000_000);
    update = {
      resourceName: c.resourceName,
      targetSpend: { cpcBidCeilingMicros: String(ceilingMicros) },
    };
    // Masking the subfield both sets the ceiling and switches the bidding oneof
    // to TARGET_SPEND (Maximize Clicks). Masking the bare parent is rejected.
    updateMask = "target_spend.cpc_bid_ceiling_micros";
    targetType = "TARGET_SPEND (Maximize Clicks)";
    console.log(`Target: ${targetType}, CPC ceiling AED ${cpcCeilingAed} (${ceilingMicros} micros)`);
  } else {
    update = { resourceName: c.resourceName, maximizeConversions: {} };
    updateMask = "maximize_conversions";
    targetType = "MAXIMIZE_CONVERSIONS";
    console.log(`Target: ${targetType}`);
  }

  if (
    (strategy === "clicks" && c.biddingStrategyType === "TARGET_SPEND") ||
    (strategy === "conversions" && c.biddingStrategyType === "MAXIMIZE_CONVERSIONS")
  ) {
    console.log("Already on the target strategy. Nothing to do.");
    process.exit(0);
  }

  await mutate(
    config,
    [{ campaignOperation: { update, updateMask } }],
    { partialFailure: false, validateOnly },
  );

  console.log(
    validateOnly
      ? "Validated (no change written). Re-run with --apply."
      : `Done — campaign bidding is now ${targetType}.`,
  );
} catch (error) {
  console.error("switch-bidding failed.");
  console.error(error.message);
  process.exitCode = 1;
}
