import { loadWorkflowConfig, mutate, searchStream } from "./api.mjs";

const CONVERSION_NAME = "WhatsApp contact click";

function parseOptions(argv) {
  return {
    validateOnly: argv.includes("--validate-only"),
  };
}

function escapeGaql(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

async function getExistingConversion(config) {
  const query = `
    SELECT
      conversion_action.id,
      conversion_action.name,
      conversion_action.status,
      conversion_action.type,
      conversion_action.category,
      conversion_action.include_in_conversions_metric,
      conversion_action.counting_type,
      conversion_action.tag_snippets
    FROM conversion_action
    WHERE conversion_action.name = '${escapeGaql(CONVERSION_NAME)}'
      AND conversion_action.status != 'REMOVED'
    LIMIT 1
  `;

  const rows = await searchStream(config, query);
  return rows[0]?.conversionAction || null;
}

function buildConversionActionOperation() {
  return {
    conversionActionOperation: {
      create: {
        name: CONVERSION_NAME,
        type: "WEBPAGE",
        category: "CONTACT",
        status: "ENABLED",
        primaryForGoal: true,
        countingType: "ONE_PER_CLICK",
        valueSettings: {
          defaultValue: 1,
          defaultCurrencyCode: "AED",
          alwaysUseDefaultValue: true,
        },
      },
    },
  };
}

function printConversion(conversion) {
  console.log(`${conversion.name} (${conversion.status})`);
  console.log(`Resource: ${conversion.resourceName ?? "(resource unavailable)"}`);
  console.log(`Category: ${conversion.category}`);
  console.log(`Included in conversions: ${conversion.includeInConversionsMetric}`);
  console.log(`Counting type: ${conversion.countingType}`);

  const snippets = conversion.tagSnippets ?? [];
  const htmlSnippet = snippets.find((snippet) => snippet.pageFormat === "HTML");
  const preview = htmlSnippet?.eventSnippet ?? "";
  const sendToMatch = preview.match(/send_to['"]?\s*:\s*['"]([^'"]+)['"]/);
  if (sendToMatch?.[1]) {
    console.log(`send_to: ${sendToMatch[1]}`);
  } else if (preview) {
    console.log("Tag snippet:");
    console.log(preview);
  }
}

try {
  const options = parseOptions(process.argv.slice(2));
  const config = loadWorkflowConfig(process.argv.slice(2));
  const existingConversion = await getExistingConversion(config);

  if (existingConversion) {
    console.log("Conversion already exists.");
    printConversion(existingConversion);
    process.exit(0);
  }

  await mutate(config, [buildConversionActionOperation()], {
    partialFailure: false,
    validateOnly: options.validateOnly,
  });

  if (options.validateOnly) {
    console.log(`Validated creation of ${CONVERSION_NAME}.`);
    process.exit(0);
  }

  const conversion = await getExistingConversion(config);
  if (!conversion) {
    throw new Error("Conversion action was created but could not be retrieved.");
  }

  console.log(`Created ${CONVERSION_NAME}.`);
  printConversion(conversion);
} catch (error) {
  console.error("ads:setup-whatsapp-contact-conversion failed.");
  console.error(error.message);
  process.exitCode = 1;
}
