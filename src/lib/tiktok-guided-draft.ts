import type { AttributionParams } from "@/lib/funnel-analytics";

export type TikTokGuidedFinishPreference =
  | "Gloss clear PPF"
  | "Matte clear PPF"
  | "Colour PPF"
  | "Not sure yet";

export type TikTokGuidedFlowVariant = "intent_first" | "phone_first";

export type TikTokGuidedCalculatorSelection = {
  brand: "STEK" | "GYEON";
  warrantyYears: number;
  finish: "Gloss" | "Matte";
  size: "Sports" | "Small" | "Medium" | "SUV";
  coverage: "Front" | "Full Body";
  estimateMin: number;
  stekLine: string | null;
  priceRevealed: boolean;
  updatedAt: string;
};

export type TikTokGuidedDraft = {
  version: 1;
  savedAt: string;
  flowVariant: TikTokGuidedFlowVariant;
  fullName: string;
  phone: string;
  countryCode: string;
  localPhone: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: string;
  vehicleLabel: string;
  finishPreference: TikTokGuidedFinishPreference | "";
  calculatorSelection?: TikTokGuidedCalculatorSelection;
  sessionId?: string;
  attribution: AttributionParams;
};

const STORAGE_KEY = "grand-touch-ppf-guided-draft-v1";

const emptyAttribution = (): AttributionParams => ({
  utm_source: "",
  utm_medium: "",
  utm_campaign: "",
  utm_term: "",
  utm_content: "",
  utm_id: "",
  gclid: "",
  fbclid: "",
  ttclid: "",
});

const getStorageRefs = (): Storage[] => {
  if (typeof window === "undefined") return [];

  const stores: Storage[] = [];
  try {
    stores.push(window.localStorage);
  } catch {
    // Ignore unavailable storage.
  }

  try {
    stores.push(window.sessionStorage);
  } catch {
    // Ignore unavailable storage.
  }

  return stores;
};

const normalizeDraft = (value: unknown): TikTokGuidedDraft | null => {
  if (!value || typeof value !== "object") return null;

  const raw = value as Partial<TikTokGuidedDraft>;
  if (raw.version !== 1) return null;
  const rawCalculator = raw.calculatorSelection;
  const calculatorSelection =
    rawCalculator &&
    (rawCalculator.brand === "STEK" || rawCalculator.brand === "GYEON") &&
    (rawCalculator.finish === "Gloss" || rawCalculator.finish === "Matte") &&
    ["Sports", "Small", "Medium", "SUV"].includes(rawCalculator.size) &&
    (rawCalculator.coverage === "Front" || rawCalculator.coverage === "Full Body") &&
    typeof rawCalculator.warrantyYears === "number" &&
    typeof rawCalculator.estimateMin === "number"
      ? {
          brand: rawCalculator.brand,
          warrantyYears: rawCalculator.warrantyYears,
          finish: rawCalculator.finish,
          size: rawCalculator.size,
          coverage: rawCalculator.coverage,
          estimateMin: rawCalculator.estimateMin,
          stekLine: typeof rawCalculator.stekLine === "string" ? rawCalculator.stekLine : null,
          priceRevealed: Boolean(rawCalculator.priceRevealed),
          updatedAt: typeof rawCalculator.updatedAt === "string" ? rawCalculator.updatedAt : new Date().toISOString(),
        }
      : undefined;

  return {
    version: 1,
    savedAt: typeof raw.savedAt === "string" ? raw.savedAt : new Date().toISOString(),
    flowVariant: raw.flowVariant === "phone_first" ? "phone_first" : "intent_first",
    fullName: typeof raw.fullName === "string" ? raw.fullName : "",
    phone: typeof raw.phone === "string" ? raw.phone : "",
    countryCode: typeof raw.countryCode === "string" ? raw.countryCode : "971",
    localPhone: typeof raw.localPhone === "string" ? raw.localPhone : "",
    vehicleMake: typeof raw.vehicleMake === "string" ? raw.vehicleMake : "",
    vehicleModel: typeof raw.vehicleModel === "string" ? raw.vehicleModel : "",
    vehicleYear: typeof raw.vehicleYear === "string" ? raw.vehicleYear : "",
    vehicleLabel: typeof raw.vehicleLabel === "string" ? raw.vehicleLabel : "",
    finishPreference: raw.finishPreference || "",
    calculatorSelection,
    sessionId: typeof raw.sessionId === "string" ? raw.sessionId : undefined,
    attribution: raw.attribution || emptyAttribution(),
  };
};

export const saveTikTokGuidedDraft = (draft: Omit<TikTokGuidedDraft, "version" | "savedAt">) => {
  const existing = readTikTokGuidedDraft();
  const record: TikTokGuidedDraft = {
    version: 1,
    savedAt: new Date().toISOString(),
    ...draft,
    calculatorSelection: draft.calculatorSelection ?? existing?.calculatorSelection,
  };
  const serialized = JSON.stringify(record);

  for (const storage of getStorageRefs()) {
    try {
      storage.setItem(STORAGE_KEY, serialized);
      return record;
    } catch {
      // Try the next storage provider.
    }
  }

  return record;
};

export const readTikTokGuidedDraft = (): TikTokGuidedDraft | null => {
  for (const storage of getStorageRefs()) {
    try {
      const raw = storage.getItem(STORAGE_KEY);
      if (!raw) continue;
      const parsed = normalizeDraft(JSON.parse(raw));
      if (parsed) return parsed;
    } catch {
      // Try the next storage provider.
    }
  }

  return null;
};

export const clearTikTokGuidedDraft = () => {
  for (const storage of getStorageRefs()) {
    try {
      storage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage failures.
    }
  }
};

export const hasUsableTikTokGuidedDraft = (draft = readTikTokGuidedDraft()) =>
  Boolean(
    draft &&
      (draft.fullName.trim() ||
        draft.phone.trim() ||
        draft.vehicleLabel.trim() ||
        draft.finishPreference),
  );
