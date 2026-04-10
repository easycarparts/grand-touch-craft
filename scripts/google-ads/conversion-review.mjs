import { getConversionActions, loadWorkflowConfig } from "./api.mjs";

function extractSendTo(snippet = "") {
  const match = snippet.match(/AW-\d+\/[A-Za-z0-9_-]+/);
  return match ? match[0] : "";
}

try {
  const config = loadWorkflowConfig(process.argv.slice(2));
  const rows = await getConversionActions(config);

  if (rows.length === 0) {
    console.log("No conversion actions were returned.");
    process.exit(0);
  }

  console.log("Google Ads conversion review");

  for (const row of rows) {
    const conversion = row.conversionAction;
    const snippets = conversion?.tagSnippets || [];
    const snippetText = snippets
      .map((snippet) => [snippet.globalSiteTag, snippet.eventSnippet].filter(Boolean).join("\n"))
      .join("\n");
    const sendTo = extractSendTo(snippetText);

    console.log(`\n- ${conversion?.name || "(unnamed conversion)"}`);
    console.log(`  id: ${conversion?.id || ""}`);
    console.log(`  status: ${conversion?.status || ""}`);
    console.log(`  type: ${conversion?.type || ""}`);
    console.log(`  origin: ${conversion?.origin || ""}`);
    console.log(`  category: ${conversion?.category || ""}`);
    console.log(`  primary_for_goal: ${conversion?.primaryForGoal}`);
    console.log(
      `  include_in_conversions_metric: ${conversion?.includeInConversionsMetric}`,
    );
    console.log(`  counting_type: ${conversion?.countingType || ""}`);
    console.log(`  owner_customer: ${conversion?.ownerCustomer || ""}`);
    console.log(`  send_to: ${sendTo || "not found in returned snippet"}`);

    if (conversion?.category === "SUBMIT_LEAD_FORM" && conversion?.primaryForGoal) {
      console.log("  note: lead-form conversion is currently primary.");
    }
  }
} catch (error) {
  console.error("ads:conversion-review failed.");
  console.error(error.message);
  process.exitCode = 1;
}
