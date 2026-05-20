import { googleAdsPost, loadWorkflowConfig } from "./api.mjs";

const UAE_GEO_TARGET = "geoTargetConstants/2784";
const ENGLISH_LANGUAGE = "languageConstants/1000";

const SEED_KEYWORDS = [
  "ppf dubai",
  "car ppf dubai",
  "paint protection film dubai",
  "car paint protection dubai",
  "ppf price dubai",
  "ppf cost dubai",
  "ppf quote dubai",
  "ppf near me",
  "ppf installation dubai",
  "paint protection film price",
  "ppf coating dubai",
  "stek ppf dubai",
  "car ppf uae",
  "ppf uae",
];

function microsToAed(value) {
  return Number(value || 0) / 1_000_000;
}

function competitionIndex(result) {
  return Number(result.keywordIdeaMetrics?.competitionIndex ?? 0);
}

function avgMonthlySearches(result) {
  return Number(result.keywordIdeaMetrics?.avgMonthlySearches ?? 0);
}

function lowBid(result) {
  return microsToAed(result.keywordIdeaMetrics?.lowTopOfPageBidMicros);
}

function highBid(result) {
  return microsToAed(result.keywordIdeaMetrics?.highTopOfPageBidMicros);
}

function formatAed(value) {
  return value ? `AED ${value.toFixed(2)}` : "-";
}

function sortResults(results) {
  return [...results].sort((a, b) => {
    const volumeDelta = avgMonthlySearches(b) - avgMonthlySearches(a);
    if (volumeDelta) return volumeDelta;
    return highBid(b) - highBid(a);
  });
}

try {
  const config = loadWorkflowConfig(process.argv.slice(2));
  const body = {
    customerId: config.customerId,
    language: ENGLISH_LANGUAGE,
    geoTargetConstants: [UAE_GEO_TARGET],
    includeAdultKeywords: false,
    keywordPlanNetwork: "GOOGLE_SEARCH",
    keywordSeed: {
      keywords: SEED_KEYWORDS,
    },
  };

  const json = await googleAdsPost(config, `customers/${config.customerId}:generateKeywordIdeas`, body);
  const results = sortResults(json.results || []);

  const filtered = results
    .filter((result) => {
      const keyword = String(result.text || "").toLowerCase();
      return (
        keyword.includes("ppf") ||
        keyword.includes("paint protection") ||
        keyword.includes("car protection")
      );
    })
    .slice(0, 80);

  const rows = filtered.map((result) => ({
    keyword: result.text,
    avgMonthlySearches: avgMonthlySearches(result),
    competition: result.keywordIdeaMetrics?.competition || "-",
    competitionIndex: competitionIndex(result),
    lowTopOfPageBidAed: lowBid(result),
    highTopOfPageBidAed: highBid(result),
    monthlySearchVolumes: result.keywordIdeaMetrics?.monthlySearchVolumes || [],
  }));

  if (process.argv.includes("--json")) {
    console.log(JSON.stringify(rows, null, 2));
    process.exit(0);
  }

  console.log("Keyword Planner ideas for UAE / Google Search");
  console.log(`Seed keywords: ${SEED_KEYWORDS.join(", ")}`);
  console.log("");
  console.table(
    rows.map((row) => ({
      keyword: row.keyword,
      monthly: row.avgMonthlySearches,
      competition: row.competition,
      compIndex: row.competitionIndex,
      lowBid: formatAed(row.lowTopOfPageBidAed),
      highBid: formatAed(row.highTopOfPageBidAed),
    })),
  );
} catch (error) {
  console.error("ads:keyword-planner-ppf failed.");
  console.error(error.message);
  process.exitCode = 1;
}
