import { loadWorkflowConfig, mutate, searchStream } from "./api.mjs";

const CONVERSION_NAME = "Qualified WhatsApp (post-quote)";

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
      conversion_action.primary_for_goal,
      conversion_action.include_in_conversions_metric,
      conversion_action.counting_type,
      conversion_action.value_settings.default_value,
      conversion_action.value_settings.default_currency_code,
      conversion_action.value_settings.always_use_default_value,
      conversion_action.resource_name,
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
          defaultValue: 5000,
          defaultCurrencyCode: "AED",
          alwaysUseDefaultValue: false,
        },
      },
    },
  };
}

function extractSendTo(conversion) {
  const snippets = conversion.tagSnippets ?? [];
  for (const snippet of snippets) {
    const text = `${snippet.eventSnippet ?? ""}\n${snippet.globalSiteTag ?? ""}`;
    const match = text.match(/send_to['"]?\s*:\s*['"]([^'"]+)['"]/);
    if (match?.[1]) {
      return match[1];
    }
  }
  return null;
}

function printConversion(conversion) {
  console.log(`${conversion.name} (${conversion.status})`);
  console.log(`Id: ${conversion.id}`);
  console.log(`Resource: ${conversion.resourceName ?? "(resource unavailable)"}`);
  console.log(`Type: ${conversion.type}`);
  console.log(`Category: ${conversion.category}`);
  console.log(`Primary for goal: ${conversion.primaryForGoal}`);
  console.log(`Included in conversions: ${conversion.includeInConversionsMetric}`);
  console.log(`Counting type: ${conversion.countingType}`);

  const valueSettings = conversion.valueSettings ?? {};
  console.log(
    `Value settings: defaultValue=${valueSettings.defaultValue} ${valueSettings.defaultCurrencyCode} alwaysUseDefaultValue=${valueSettings.alwaysUseDefaultValue}`,
  );

  const sendTo = extractSendTo(conversion);
  if (sendTo) {
    console.log(`send_to: ${sendTo}`);
  } else {
    const snippets = conversion.tagSnippets ?? [];
    const preview = snippets[0]?.eventSnippet ?? "";
    if (preview) {
      console.log("Tag snippet (send_to not parsed):");
      console.log(preview);
    } else {
      console.log("send_to: (tag snippet not yet available)");
    }
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
  console.error("ads:setup-qualified-whatsapp-conversion failed.");
  console.error(error.message);
  process.exitCode = 1;
}
