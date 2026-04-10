import { getConversionActions, loadWorkflowConfig } from "./api.mjs";

function formatSnippet(snippet) {
  if (!snippet) {
    return "";
  }

  const parts = [];
  if (snippet.type) parts.push(`type=${snippet.type}`);
  if (snippet.pageFormat) parts.push(`pageFormat=${snippet.pageFormat}`);
  if (snippet.globalSiteTag) parts.push("globalSiteTag=yes");
  if (snippet.eventSnippet) {
    const compact = snippet.eventSnippet.replace(/\s+/g, " ").trim();
    parts.push(`eventSnippet=${compact.slice(0, 140)}${compact.length > 140 ? "..." : ""}`);
  }

  return parts.join(" | ");
}

try {
  const config = loadWorkflowConfig(process.argv.slice(2));
  const rows = await getConversionActions(config);

  if (config.json) {
    console.log(JSON.stringify(rows, null, 2));
    process.exit(0);
  }

  if (rows.length === 0) {
    console.log("No conversion actions were returned.");
    process.exit(0);
  }

  const formatted = rows.map((row) => ({
    id: row.conversionAction?.id || "",
    name: row.conversionAction?.name || "",
    status: row.conversionAction?.status || "",
    type: row.conversionAction?.type || "",
    origin: row.conversionAction?.origin || "",
    category: row.conversionAction?.category || "",
    primary: row.conversionAction?.primaryForGoal ?? "",
    includedInConversions: row.conversionAction?.includeInConversionsMetric ?? "",
    countingType: row.conversionAction?.countingType || "",
    ownerCustomer: row.conversionAction?.ownerCustomer || "",
    tagSnippetPreview: (row.conversionAction?.tagSnippets || []).map(formatSnippet).join(" || "),
  }));

  console.table(formatted);
} catch (error) {
  console.error("ads:conversions failed.");
  console.error(error.message);
  process.exitCode = 1;
}
