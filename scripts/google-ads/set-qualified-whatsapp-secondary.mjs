import { loadWorkflowConfig, mutate, searchStream } from "./api.mjs";

const TARGET_ID = "7649703525";
const TARGET_NAME = "Qualified WhatsApp (post-quote)";
const KEEP_PRIMARY_ID = "7569208694";
const GENERIC_WHATSAPP_ID = "7617388951";

function parseOptions(argv) {
  return {
    validateOnly: argv.includes("--validate-only"),
  };
}

async function readActions(config) {
  const query = `
    SELECT
      conversion_action.id,
      conversion_action.name,
      conversion_action.status,
      conversion_action.category,
      conversion_action.origin,
      conversion_action.primary_for_goal,
      conversion_action.include_in_conversions_metric,
      conversion_action.resource_name
    FROM conversion_action
    WHERE conversion_action.id IN (${TARGET_ID}, ${KEEP_PRIMARY_ID}, ${GENERIC_WHATSAPP_ID})
  `;

  const rows = await searchStream(config, query);
  const byId = new Map();
  for (const row of rows) {
    const a = row.conversionAction || {};
    byId.set(String(a.id), a);
  }
  return byId;
}

function printAction(label, a) {
  if (!a) {
    console.log(`${label}: NOT FOUND`);
    return;
  }
  console.log(
    `${label}: ${a.name} (id ${a.id}) | status=${a.status} | category=${a.category}/${a.origin} | primaryForGoal=${a.primaryForGoal} | includeInConversionsMetric=${a.includeInConversionsMetric}`,
  );
}

function buildDemoteOperation(resourceName) {
  return {
    conversionActionOperation: {
      update: {
        resourceName,
        primaryForGoal: false,
      },
      updateMask: "primary_for_goal",
    },
  };
}

try {
  const options = parseOptions(process.argv.slice(2));
  const config = loadWorkflowConfig(process.argv.slice(2));

  const before = await readActions(config);
  const target = before.get(TARGET_ID);
  const keepPrimary = before.get(KEEP_PRIMARY_ID);
  const generic = before.get(GENERIC_WHATSAPP_ID);

  console.log("=== BEFORE ===");
  printAction("Submit lead form", keepPrimary);
  printAction("Qualified WhatsApp (post-quote)", target);
  printAction("WhatsApp contact click (generic)", generic);

  if (!target?.resourceName) {
    throw new Error(`Target conversion action ${TARGET_ID} not found.`);
  }

  if (target.primaryForGoal === false) {
    console.log("\nTarget is already secondary (primaryForGoal=false). Nothing to do.");
    process.exit(0);
  }

  const genericPrimaryBefore = generic?.primaryForGoal;

  await mutate(config, [buildDemoteOperation(target.resourceName)], {
    partialFailure: false,
    validateOnly: options.validateOnly,
  });

  if (options.validateOnly) {
    console.log(`\nValidated demotion of "${TARGET_NAME}" to secondary (primary_for_goal=false).`);
    process.exit(0);
  }

  const after = await readActions(config);
  const targetAfter = after.get(TARGET_ID);
  const keepPrimaryAfter = after.get(KEEP_PRIMARY_ID);
  const genericAfter = after.get(GENERIC_WHATSAPP_ID);

  console.log("\n=== AFTER ===");
  printAction("Submit lead form", keepPrimaryAfter);
  printAction("Qualified WhatsApp (post-quote)", targetAfter);
  printAction("WhatsApp contact click (generic)", genericAfter);

  console.log("\n=== VERIFICATION ===");
  const targetOk =
    targetAfter?.primaryForGoal === false && targetAfter?.includeInConversionsMetric === false;
  const leadOk =
    keepPrimaryAfter?.primaryForGoal === true &&
    keepPrimaryAfter?.includeInConversionsMetric === true;
  const genericUnchanged =
    genericAfter?.primaryForGoal === genericPrimaryBefore &&
    genericAfter?.primaryForGoal === true;

  console.log(`Qualified WhatsApp is now SECONDARY: ${targetOk ? "YES" : "NO"}`);
  console.log(`Submit lead form still PRIMARY/counted: ${leadOk ? "YES" : "NO"}`);
  console.log(`Generic WhatsApp contact click UNCHANGED (still primary): ${genericUnchanged ? "YES" : "NO"}`);

  if (!targetOk || !leadOk || !genericUnchanged) {
    throw new Error("Post-change verification failed. Review the AFTER state above.");
  }

  console.log("\nDone. Clean single-action demotion succeeded.");
} catch (error) {
  console.error("ads:set-qualified-whatsapp-secondary failed.");
  console.error(error.message);
  process.exitCode = 1;
}
