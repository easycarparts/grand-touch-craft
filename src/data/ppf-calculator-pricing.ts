/**
 * PPF calculator — Grand Touch reference pricing (AED)
 *
 * Full Body minimums are entered explicitly (gloss + matte). The calculator shows this minimum
 * only (no upper range).
 *
 * Front coverage (STEK F3 / 5 yr only): fixed retail from COGS — same materials + fitting cost
 * regardless of car size. Not offered for STEK 10/12 or GYEON in the calculator.
 *
 * STEK warranty tiers (series names):
 *   5 yr → F3
 *   10 yr → ForceShield
 *   12 yr → DynoShield
 */

export type PpfPricingBrand = "STEK" | "GYEON";
export type PpfPricingSize = "Sports" | "Small" | "Medium" | "SUV";
export type PpfPricingCoverage = "Front" | "Full Body";
export type PpfPricingFinish = "Gloss" | "Matte";

export type PpfPriceRange = { min: number; max: number };

export type PpfGlossMatteMins = { glossMin: number; matteMin: number };

/** STEK F3 front — COGS (materials + fitting), same for any car size. */
const FRONT_STEK_F3_COGS_AED = 2000 + 1000;

/**
 * Sell price from COGS: default ~50% profit on cost (price = COGS × (1 + this)).
 * For 50% gross margin on sale instead, use price = COGS / (1 - 0.5).
 */
const FRONT_STEK_F3_MARKUP_ON_COGS = 0.5;

/** Full Body — STEK (AED minimums). Sports = Medium + 5% (gloss and matte). */
const STEK_FULL_BODY_MINS: Record<5 | 10 | 12, Record<PpfPricingSize, PpfGlossMatteMins>> = {
  5: {
    Small: { glossMin: 7990, matteMin: 8490 },
    Medium: { glossMin: 8500, matteMin: 8999 },
    SUV: { glossMin: 8990, matteMin: 9500 },
    Sports: { glossMin: 8925, matteMin: 9450 },
  },
  10: {
    Small: { glossMin: 9990, matteMin: 10490 },
    Medium: { glossMin: 11500, matteMin: 12000 },
    SUV: { glossMin: 12500, matteMin: 13000 },
    Sports: { glossMin: 12075, matteMin: 12600 },
  },
  12: {
    Small: { glossMin: 13000, matteMin: 13500 },
    Medium: { glossMin: 13500, matteMin: 14000 },
    SUV: { glossMin: 14500, matteMin: 15000 },
    Sports: { glossMin: 14175, matteMin: 14700 },
  },
};

/** Full Body — GYEON (AED minimums). Sports = Medium + 5%. Ten-year warranty only in calculator. */
const GYEON_FULL_BODY_MINS: Record<10, Record<PpfPricingSize, PpfGlossMatteMins>> = {
  10: {
    Small: { glossMin: 10000, matteMin: 10500 },
    Medium: { glossMin: 11000, matteMin: 11500 },
    SUV: { glossMin: 12500, matteMin: 13000 },
    Sports: { glossMin: 11550, matteMin: 12075 },
  },
};

export const WARRANTY_YEARS_STEK = [5, 10, 12] as const;
export const WARRANTY_YEARS_GYEON = [10] as const;

export function warrantyYearsForBrand(brand: PpfPricingBrand): readonly number[] {
  return brand === "STEK" ? WARRANTY_YEARS_STEK : WARRANTY_YEARS_GYEON;
}

/** Maps a warranty year to a valid option for the brand (avoids crashes when brand switches). */
export function normalizeWarrantyYearsForBrand(
  brand: PpfPricingBrand,
  years: number
): number {
  const allowed = warrantyYearsForBrand(brand);
  if (allowed.includes(years)) return years;
  if (allowed.includes(10)) return 10;
  return allowed[0];
}

/** STEK film line name for warranty length (for UI / WhatsApp). */
export function stekSeriesName(warrantyYears: number): string | null {
  if (warrantyYears === 5) return "F3";
  if (warrantyYears === 10) return "ForceShield";
  if (warrantyYears === 12) return "DynoShield";
  return null;
}

function roundToNearest50(value: number): number {
  return Math.round(value / 50) * 50;
}

function getFullBodyMins(
  brand: PpfPricingBrand,
  warrantyYears: number,
  size: PpfPricingSize
): PpfGlossMatteMins {
  const yNorm = normalizeWarrantyYearsForBrand(brand, warrantyYears);
  if (brand === "STEK") {
    const y = yNorm as 5 | 10 | 12;
    return STEK_FULL_BODY_MINS[y][size];
  }
  const y = yNorm as 10;
  return GYEON_FULL_BODY_MINS[y][size];
}

function frontStekF3RetailAed(): number {
  return roundToNearest50(FRONT_STEK_F3_COGS_AED * (1 + FRONT_STEK_F3_MARKUP_ON_COGS));
}

/** Front PPF is only quoted for STEK 5-year (F3); same price any car size / finish. */
export function isFrontCoverageAvailable(brand: PpfPricingBrand, warrantyYears: number): boolean {
  const y = normalizeWarrantyYearsForBrand(brand, warrantyYears);
  return brand === "STEK" && y === 5;
}

/**
 * Display pricing (AED) for the current selections — minimum only. `max` equals `min` for callers
 * that still expect a range shape.
 */
export function getPpfPriceRange(
  brand: PpfPricingBrand,
  warrantyYears: number,
  size: PpfPricingSize,
  coverage: PpfPricingCoverage,
  finish: PpfPricingFinish
): PpfPriceRange {
  const cell = getFullBodyMins(brand, warrantyYears, size);
  const minFB = finish === "Gloss" ? cell.glossMin : cell.matteMin;
  if (coverage === "Full Body") {
    return { min: minFB, max: minFB };
  }
  if (!isFrontCoverageAvailable(brand, warrantyYears)) {
    return { min: minFB, max: minFB };
  }
  const min = frontStekF3RetailAed();
  return { min, max: min };
}
