import { loadWorkflowConfig, getAccessToken, mutate, searchStream } from "./api.mjs";

/**
 * Post-experiment cleanup:
 *   1. Removes the leftover SETUP experiment so it can never auto-start and
 *      re-split the budget.
 *   2. Pauses the halted V2 treatment campaign so it cannot serve.
 *
 * SAFE BY DEFAULT: validateOnly dry-run unless you pass `--apply`. Each action
 * is guarded — it confirms the live state first and skips if it's already done
 * or in an unexpected state (so a wrong id can't nuke a running experiment).
 *
 * Usage:
 *   node scripts/google-ads/cleanup-experiments.mjs --env=.env.google-ads          # dry-run
 *   node scripts/google-ads/cleanup-experiments.mjs --env=.env.google-ads --apply  # live
 */

const SETUP_EXPERIMENT_ID = "10061143925";
const TREATMENT_CAMPAIGN_ID = "23953541408";
const REMOVABLE_EXPERIMENT_STATUSES = new Set(["SETUP", "INITIATED"]);

async function mutateExperiments(config, operations, { validateOnly }) {
  const accessToken = await getAccessToken(config);
  const endpoint = `https://googleads.googleapis.com/${config.apiVersion}/customers/${config.customerId}/experiments:mutate`;
  const headers = {
    authorization: `Bearer ${accessToken}`,
    "content-type": "application/json",
    "developer-token": config.developerToken,
  };
  if (config.loginCustomerId) headers["login-customer-id"] = config.loginCustomerId;

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({ operations, partialFailure: false, validateOnly }),
  });
  const text = await response.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`experiments:mutate returned non-JSON (${response.status}): ${text}`);
  }
  if (!response.ok) {
    throw new Error(JSON.stringify(json.error ?? json, null, 2));
  }
  return json;
}

try {
  const argv = process.argv.slice(2);
  const config = loadWorkflowConfig(argv);
  const apply = argv.includes("--apply");
  const cid = config.customerId;
  const validateOnly = !apply;

  console.log(`Mode: ${apply ? "APPLY (live mutate)" : "DRY-RUN (validateOnly)"}\n`);

  // --- 1. Remove the SETUP experiment -------------------------------------
  const expResource = `customers/${cid}/experiments/${SETUP_EXPERIMENT_ID}`;
  const expRows = await searchStream(
    config,
    `SELECT experiment.resource_name, experiment.name, experiment.status
     FROM experiment WHERE experiment.resource_name = '${expResource}'`,
  );
  const exp = expRows[0]?.experiment;

  if (!exp) {
    console.log(`Experiment ${SETUP_EXPERIMENT_ID}: not found (already removed?). Skipping.`);
  } else if (!REMOVABLE_EXPERIMENT_STATUSES.has(exp.status)) {
    console.log(
      `Experiment "${exp.name}" status is ${exp.status} — NOT in {SETUP, INITIATED}. ` +
        `Refusing to remove automatically. Skipping.`,
    );
  } else {
    console.log(`Removing experiment "${exp.name}" (status ${exp.status})...`);
    await mutateExperiments(config, [{ remove: expResource }], { validateOnly });
    console.log(validateOnly ? "  validated (no change written)." : "  removed.");
  }

  // --- 2. Pause the treatment campaign ------------------------------------
  const campResource = `customers/${cid}/campaigns/${TREATMENT_CAMPAIGN_ID}`;
  const campRows = await searchStream(
    config,
    `SELECT campaign.resource_name, campaign.name, campaign.status, campaign.experiment_type
     FROM campaign WHERE campaign.resource_name = '${campResource}'`,
  );
  const camp = campRows[0]?.campaign;

  if (!camp) {
    console.log(`\nCampaign ${TREATMENT_CAMPAIGN_ID}: not found. Skipping.`);
  } else if (camp.status !== "ENABLED") {
    // Ending the experiment already takes the trial campaign out of service
    // (typically REMOVED). Trial campaigns also can't have status modified, so
    // there's nothing to do here — just report it.
    console.log(`\nCampaign "${camp.name}" status is ${camp.status} — not serving. Nothing to pause.`);
  } else if (camp.experimentType !== "EXPERIMENT") {
    console.log(
      `\nCampaign "${camp.name}" experimentType is ${camp.experimentType}, not EXPERIMENT. ` +
        `Refusing to pause automatically. Skipping.`,
    );
  } else {
    console.log(`\nPausing campaign "${camp.name}" (status ${camp.status})...`);
    await mutate(
      config,
      [
        {
          campaignOperation: {
            update: { resourceName: campResource, status: "PAUSED" },
            updateMask: "status",
          },
        },
      ],
      { partialFailure: false, validateOnly },
    );
    console.log(validateOnly ? "  validated (no change written)." : "  paused.");
  }

  if (validateOnly) {
    console.log("\nRe-run with --apply to write these changes.");
  }
} catch (error) {
  console.error("cleanup-experiments failed.");
  console.error(error.message);
  process.exitCode = 1;
}
