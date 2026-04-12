export type IntentLikeRow = {
  leadSubmitted: boolean;
  whatsappClicked: boolean;
  leadName: string;
  leadPhone: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: string;
  quoteModalOpened: boolean;
  unlockRequested: boolean;
  quoteEstimate: number | null;
  packageName: string;
  vehicleSize: string;
  finish: string;
  coverage: string;
  durationMs: number;
  maxScrollPercent: number;
  videoMaxProgressPercent: number;
  videoStarted?: boolean;
  sectionsViewed: string[];
  faqOpenCount: number;
};

export const countQuoteSelections = (
  row: Pick<IntentLikeRow, "packageName" | "vehicleSize" | "finish" | "coverage">,
) => [row.packageName, row.vehicleSize, row.finish, row.coverage].filter(Boolean).length;

export const getVehicleIdentityLabel = (
  row: Pick<IntentLikeRow, "vehicleYear" | "vehicleMake" | "vehicleModel">,
) => [row.vehicleYear, row.vehicleMake, row.vehicleModel].filter(Boolean).join(" ");

export const getIntentScore = (row: IntentLikeRow) => {
  let score = 0;

  if (row.durationMs >= 60_000) score += 6;
  if (row.durationMs >= 120_000) score += 12;

  if (row.maxScrollPercent >= 70) {
    score += 10;
  } else if (row.maxScrollPercent >= 50) {
    score += 5;
  }

  if (row.sectionsViewed.length >= 5) {
    score += 10;
  } else if (row.sectionsViewed.length >= 3) {
    score += 5;
  }

  if (row.videoStarted) score += 4;
  if (row.videoMaxProgressPercent >= 50) score += 7;
  if (row.videoMaxProgressPercent >= 90) score += 4;

  if (row.quoteModalOpened) score += 4;

  const quoteSelections = countQuoteSelections(row);
  if (quoteSelections >= 3) {
    score += 10;
  } else if (quoteSelections >= 1) {
    score += 5;
  }

  if (row.quoteEstimate !== null || row.unlockRequested) score += 5;
  if (row.leadName && row.leadPhone) score += 8;
  if (row.vehicleMake && row.vehicleModel && row.vehicleYear) score += 7;
  if (row.leadSubmitted) score += 15;
  if (row.whatsappClicked) score += 8;
  if (row.leadSubmitted && row.whatsappClicked) score += 5;

  return Math.min(100, score);
};

export const formatVideoEngagement = ({
  videoMaxProgressPercent,
  videoStarted,
}: Pick<IntentLikeRow, "videoMaxProgressPercent" | "videoStarted">) => {
  if (videoMaxProgressPercent > 0) {
    return `${videoMaxProgressPercent}%`;
  }

  if (videoStarted) {
    return "Played <25%";
  }

  return "Not played";
};
