export type IntentLikeRow = {
  leadSubmitted: boolean;
  whatsappClicked: boolean;
  selectedPriceWhatsappClicked?: boolean;
  generalWhatsappClicked?: boolean;
  leadName: string;
  leadPhone: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: string;
  quoteModalOpened: boolean;
  unlockRequested: boolean;
  priceViewed?: boolean;
  calculatorTouched?: boolean;
  saveQuoteStarted?: boolean;
  saveQuoteSubmitted?: boolean;
  resultScreenViewed?: boolean;
  resultScreenDurationMs?: number;
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

  const quoteSelections = countQuoteSelections(row);
  const sawPrice = Boolean(row.priceViewed || row.quoteEstimate !== null || row.unlockRequested);
  const calculatorTouched = Boolean(
    row.calculatorTouched ||
      row.quoteModalOpened ||
      row.unlockRequested ||
      quoteSelections > 0 ||
      sawPrice,
  );
  const resultScreenDurationMs = row.resultScreenDurationMs ?? 0;

  if (row.durationMs >= 15_000) score += 4;
  if (row.durationMs >= 45_000) score += 6;
  if (row.durationMs >= 120_000) score += 6;

  if (row.maxScrollPercent >= 70) {
    score += 8;
  } else if (row.maxScrollPercent >= 50) {
    score += 4;
  }

  if (row.sectionsViewed.length >= 5) {
    score += 8;
  } else if (row.sectionsViewed.length >= 3) {
    score += 4;
  }

  if (row.videoStarted) score += 3;
  if (row.videoMaxProgressPercent >= 50) score += 5;
  if (row.videoMaxProgressPercent >= 90) score += 3;

  if (calculatorTouched) score += 6;
  if (quoteSelections >= 1) score += 7;
  if (quoteSelections >= 2) score += 8;
  if (quoteSelections >= 3) score += 10;
  if (sawPrice) score += 16;
  if (row.resultScreenViewed) score += 6;
  if (resultScreenDurationMs >= 10_000) score += 6;
  if (resultScreenDurationMs >= 30_000) score += 8;
  if (resultScreenDurationMs >= 60_000) score += 6;

  if (row.saveQuoteStarted) score += 6;
  if (row.leadName) score += 4;
  if (row.leadPhone) score += 8;
  if (row.vehicleMake || row.vehicleModel || row.vehicleYear) score += 5;
  if (row.saveQuoteSubmitted || row.leadSubmitted) score += 22;
  if (row.whatsappClicked) score += 20;
  if (row.selectedPriceWhatsappClicked) score += 10;
  if (row.generalWhatsappClicked) score += 4;
  if ((row.leadSubmitted || row.saveQuoteSubmitted) && row.whatsappClicked) score += 8;

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
