import { loadWorkflowConfig, mutate, searchStream } from "./api.mjs";

/**
 * Enable or pause an ad group by campaign + ad-group name.
 *
 * SAFE BY DEFAULT: validateOnly dry-run unless you pass `--apply`. Reports the
 * current status first and skips if it's already in the target state.
 *
 * Usage:
 *   node scripts/google-ads/set-ad-group-status.mjs --env=.env.google-ads \
 *     "--campaign=PPF Search UAE - WhatsApp - May 2026" \
 *     "--ad-group=PPF Near Me Local" --status=PAUSED            # dry-run
 *   ... --status=PAUSED --apply                                  # live
 */

function parseExtra(argv) {
  const get = (k) => {
    const a = argv.find((x) => x.startsWith(`--${k}=`));
    return a ? a.slice(`--${k}=`.length) : "";
  };
  return {
    adGroup: get("ad-group"),
    status: (get("status") || "PAUSED").toUpperCase(),
    apply: argv.includes("--apply"),
  };
}

try {
  const argv = process.argv.slice(2);
  const config = loadWorkflowConfig(argv);
  const campaign = config.campaign;
  const { adGroup, status, apply } = parseExtra(argv);
  const validateOnly = !apply;

  if (!campaign || !adGroup) {
    throw new Error('Pass --campaign="..." and --ad-group="..."');
  }
  if (!["ENABLED", "PAUSED"].includes(status)) {
    throw new Error("--status must be ENABLED or PAUSED");
  }

  const rows = await searchStream(
    config,
    `SELECT ad_group.resource_name, ad_group.name, ad_group.status
     FROM ad_group
     WHERE campaign.name = '${campaign.replace(/'/g, "\\'")}'
       AND ad_group.name = '${adGroup.replace(/'/g, "\\'")}'`,
  );
  const ag = rows[0]?.adGroup;
  if (!ag) throw new Error(`Ad group "${adGroup}" not found in "${campaign}".`);

  console.log(`Mode: ${apply ? "APPLY" : "DRY-RUN (validateOnly)"}`);
  console.log(`Ad group "${ag.name}" current status: ${ag.status} -> target: ${status}`);

  if (ag.status === status) {
    console.log("Already in target status. Nothing to do.");
    process.exit(0);
  }

  await mutate(
    config,
    [
      {
        adGroupOperation: {
          update: { resourceName: ag.resourceName, status },
          updateMask: "status",
        },
      },
    ],
    { partialFailure: false, validateOnly },
  );

  console.log(validateOnly ? "Validated (no change written). Re-run with --apply." : `Done — ad group is now ${status}.`);
} catch (error) {
  console.error("set-ad-group-status failed.");
  console.error(error.message);
  process.exitCode = 1;
}
