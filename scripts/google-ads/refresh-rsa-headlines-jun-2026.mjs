import { loadWorkflowConfig, mutate, searchStream } from "./api.mjs";

/**
 * June 2026 RSA refresh for the two LIVE ad groups in the May campaign.
 * Swaps generic filler headlines for the differentiators we actually have
 * (free pickup, 4.9 Google rating, new-car protection). NO prices in copy.
 *
 * Only updates headlines + descriptions (via field mask) — leaves path and the
 * V2 final URLs untouched. Near Me is paused, so it's skipped.
 *
 * SAFE BY DEFAULT: validateOnly dry-run unless you pass `--apply`.
 */

const CAMPAIGN = "PPF Search UAE - WhatsApp - May 2026";

const SETS = {
  "PPF Paint Protection": {
    headlines: [
      "Paint Protection Film",
      "Premium PPF For Your Car",
      "Message Sean On WhatsApp",
      "Free Pickup Across Dubai",
      "Get A Real PPF Quote",
      "Warranty You Can Trace",
      "Proper PPF Install",
      "Genuine STEK Film",
      "Dubai PPF Specialists",
      "For Luxury Cars And SUVs",
      "Direct With Sean",
      "Rated 4.9 On Google",
      "Gloss Or Matte Finish",
      "Protect Your New Car",
      "No Vague Handoffs",
    ],
    descriptions: [
      "Free pickup across Dubai, genuine film, and warranty you can trace. Message Sean direct.",
      "Speak directly with Sean and get a clear recommendation for your car.",
      "Genuine STEK paint protection film installed properly at Grand Touch Auto.",
      "Use WhatsApp or the quote flow to compare the right PPF setup for your car.",
    ],
  },
  "PPF Dubai Quote": {
    headlines: [
      "PPF Dubai You Can Trust",
      "Get A Dubai PPF Quote",
      "Message Sean On WhatsApp",
      "PPF Price For Your Car",
      "Best PPF Setup Advice",
      "Warranty You Can Trace",
      "Premium Paint Protection",
      "Genuine STEK Film",
      "Direct With Sean",
      "For New Cars And SUVs",
      "Real Buyer Handovers",
      "Free Pickup Across Dubai",
      "Gloss Or Matte PPF",
      "Rated 4.9 On Google",
      "Protect Your New Car",
    ],
    descriptions: [
      "Get a clear PPF quote for your car and speak directly with Sean on WhatsApp.",
      "Free pickup across Dubai, genuine film, and warranty you can trace. Message Sean direct.",
      "Premium PPF in Dubai for new cars, SUVs, and luxury vehicles.",
      "Grand Touch gives direct guidance from first message to final handover.",
    ],
  },
};

const esc = (v) => String(v).replace(/\\/g, "\\\\").replace(/'/g, "\\'");

function validate() {
  for (const [ag, set] of Object.entries(SETS)) {
    set.headlines.forEach((h) => {
      if (h.length > 30) throw new Error(`[${ag}] headline >30: "${h}" (${h.length})`);
    });
    set.descriptions.forEach((d) => {
      if (d.length > 90) throw new Error(`[${ag}] description >90: "${d}" (${d.length})`);
    });
  }
}

try {
  validate();
  const argv = process.argv.slice(2);
  const config = loadWorkflowConfig(argv);
  const apply = argv.includes("--apply");

  const rows = await searchStream(
    config,
    `SELECT ad_group.name, ad_group_ad.ad.resource_name
     FROM ad_group_ad
     WHERE campaign.name = '${esc(CAMPAIGN)}' AND ad_group_ad.status = 'ENABLED'
       AND ad_group_ad.ad.type = RESPONSIVE_SEARCH_AD`,
  );

  console.log(`Campaign: ${CAMPAIGN}`);
  console.log(`Mode: ${apply ? "APPLY" : "DRY-RUN (validateOnly)"}\n`);

  const ops = [];
  for (const row of rows) {
    const ag = row.adGroup.name;
    const set = SETS[ag];
    if (!set) {
      console.log(`- ${ag}: no set defined, skipping (left untouched).`);
      continue;
    }
    console.log(`- ${ag}: updating ${set.headlines.length} headlines + ${set.descriptions.length} descriptions.`);
    ops.push({
      adOperation: {
        update: {
          resourceName: row.adGroupAd.ad.resourceName,
          responsiveSearchAd: {
            headlines: set.headlines.map((text) => ({ text })),
            descriptions: set.descriptions.map((text) => ({ text })),
          },
        },
        updateMask: "responsive_search_ad.headlines,responsive_search_ad.descriptions",
      },
    });
  }

  if (!ops.length) {
    console.log("No matching ad groups found.");
    process.exit(0);
  }

  await mutate(config, ops, { partialFailure: false, validateOnly: !apply });
  console.log(apply ? "\nApplied." : "\nValidated (no changes written). Re-run with --apply.");
} catch (error) {
  console.error("refresh-rsa-headlines-jun-2026 failed.");
  console.error(error.message);
  process.exitCode = 1;
}
