import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Lock, ShieldCheck, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import PpfQuoteSummaryV1 from "@/components/PpfQuoteSummaryV1";
import { cn } from "@/lib/utils";
import {
  getPpfPriceRange,
  isFrontCoverageAvailable,
  normalizeWarrantyYearsForBrand,
  stekSeriesName,
  warrantyYearsForBrand,
  type PpfPricingBrand,
  type PpfPricingCoverage,
  type PpfPricingSize,
} from "@/data/ppf-calculator-pricing";

type Brand = PpfPricingBrand;
type Finish = "Gloss" | "Matte";
type CarSize = PpfPricingSize;
type Coverage = PpfPricingCoverage;

const sizes: CarSize[] = ["Sports", "Small", "Medium", "SUV"];
const coverageOptions: Coverage[] = ["Full Body", "Front"];

const sizeImageGlossByCategory: Record<CarSize, string> = {
  Sports: "/calculator-gt3-gloss.jpg",
  Small: "/calculator-a45-gloss.jpg",
  Medium: "/calculator-e63s-gloss.jpg",
  SUV: "/calculator-patrol-gloss.jpg",
};

const sizeImageMatteByCategory: Record<CarSize, string> = {
  Sports: "/calculator-gt3-matte.jpg",
  Small: "/calculator-a45-matte.jpg",
  Medium: "/calculator-e63s-matte.jpg",
  SUV: "/calculator-patrol-matte.jpg",
};

function previewImageFor(size: CarSize, finish: Finish | null): string {
  if (finish === "Matte") return sizeImageMatteByCategory[size];
  return sizeImageGlossByCategory[size];
}

const sizeLabels: Record<CarSize, { title: string; subtitle: string }> = {
  Sports: { title: "Sports", subtitle: "Porsche 911 GT3" },
  Small: { title: "Small", subtitle: "Mercedes-AMG A45" },
  Medium: { title: "Medium", subtitle: "Mercedes-AMG E63 S" },
  SUV: { title: "SUV", subtitle: "Nissan Patrol" },
};

const warrantyOptionMeta: Record<number, { subtitle: string; helper: string; badge?: string }> = {
  5: {
    subtitle: "F3",
    helper: "Entry point",
  },
  10: {
    subtitle: "ForceShield",
    helper: "Best balance",
    badge: "Most popular",
  },
  12: {
    subtitle: "DynoShield",
    helper: "Maximum protection",
  },
};

type CalculatorSelection = {
  brand: Brand;
  warrantyYears: number;
  finish: Finish;
  size: CarSize;
  coverage: Coverage;
  estimateMin: number;
  stekLine: string | null;
};

export type PpfCostCalculatorWidgetProps = {
  variant?: "standalone" | "embedded";
  showIntro?: boolean;
  showBrandSelector?: boolean;
  showActionButtons?: boolean;
  priceUnlocked?: boolean;
  brandOptions?: Brand[];
  defaultBrand?: Brand;
  defaultWarrantyYears?: number;
  onSelectionChange?: (selection: CalculatorSelection | null) => void;
  onWhatsAppRequest?: (selection: CalculatorSelection) => void;
  onPriceUnlockRequest?: () => void;
  vehicleSummary?: string;
};

const panelClass =
  "relative isolate overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(245,181,43,0.1),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.055),rgba(18,18,18,0.92)_24%,rgba(9,9,9,0.98)_100%)] shadow-[0_30px_90px_rgba(0,0,0,0.34)] backdrop-blur-xl";

const cardBaseClass =
  "rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(11,11,11,0.94))] transition duration-300";

const selectedCardClass =
  "border-[#f7b52b] bg-[radial-gradient(circle_at_top_left,rgba(245,181,43,0.18),transparent_40%),linear-gradient(180deg,rgba(245,181,43,0.12),rgba(14,14,14,0.96))] shadow-[0_0_0_1px_rgba(245,181,43,0.22),0_24px_56px_rgba(245,181,43,0.1)]";

const PpfCostCalculatorWidgetV1 = ({
  variant = "standalone",
  showIntro = true,
  showBrandSelector = true,
  showActionButtons = true,
  priceUnlocked = true,
  brandOptions = ["STEK", "GYEON"],
  defaultBrand = "STEK",
  onSelectionChange,
  onWhatsAppRequest,
  onPriceUnlockRequest,
  vehicleSummary,
}: PpfCostCalculatorWidgetProps) => {
  /** Embedded in a page that already uses `container` (e.g. PPF quote) — avoid nested section padding + second container. */
  const isEmbeddedInPage = variant === "embedded" && !showIntro;

  const [brand, setBrand] = useState<Brand>(defaultBrand);
  const [warrantyYears, setWarrantyYears] = useState<number | null>(null);
  const [size, setSize] = useState<CarSize | null>(null);
  const [finish, setFinish] = useState<Finish | null>(null);
  const [coverage, setCoverage] = useState<Coverage | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);

  const stageTwoRef = useRef<HTMLDivElement | null>(null);
  const hasAutoOpenedStageTwo = useRef(false);
  /** Mobile Safari scrolls focused controls into view; capture Y on pointerdown then restore after paint. */
  const finishScrollLockY = useRef<number | null>(null);

  const effectiveWarrantyYears = useMemo(
    () => (warrantyYears === null ? null : normalizeWarrantyYearsForBrand(brand, warrantyYears)),
    [brand, warrantyYears]
  );

  const frontAvailable = useMemo(
    () => (effectiveWarrantyYears === null ? false : isFrontCoverageAvailable(brand, effectiveWarrantyYears)),
    [brand, effectiveWarrantyYears]
  );

  const isPrimaryReady = effectiveWarrantyYears !== null && size !== null;
  const isPriceReady = effectiveWarrantyYears !== null && size !== null && finish !== null && coverage !== null;
  const canShowEstimate = isPriceReady && priceUnlocked;

  useEffect(() => {
    if (!isPrimaryReady) {
      setFinish(null);
      setCoverage(null);
      hasAutoOpenedStageTwo.current = false;
      return;
    }

    if (coverage === null) {
      setCoverage("Full Body");
    }
  }, [coverage, isPrimaryReady]);

  useEffect(() => {
    if (!frontAvailable && coverage === "Front") {
      setCoverage("Full Body");
    }
  }, [coverage, frontAvailable]);

  useEffect(() => {
    if (!isPrimaryReady || hasAutoOpenedStageTwo.current) return;
    hasAutoOpenedStageTwo.current = true;
    const isCoarsePointer =
      typeof window !== "undefined" &&
      window.matchMedia?.("(pointer: coarse)").matches === true;
    // Smooth scroll-into-view feels right on desktop; on touch it fights finish-tap scroll locks.
    window.setTimeout(() => {
      stageTwoRef.current?.scrollIntoView({
        behavior: isCoarsePointer ? "auto" : "smooth",
        block: "start",
      });
    }, 220);
  }, [isPrimaryReady]);

  useLayoutEffect(() => {
    if (finishScrollLockY.current === null) return;
    const y = finishScrollLockY.current;
    finishScrollLockY.current = null;
    const restore = () => window.scrollTo({ top: y, left: 0, behavior: "auto" });
    restore();
    requestAnimationFrame(() => {
      restore();
      requestAnimationFrame(restore);
    });
  }, [finish]);

  const estimate = useMemo(() => {
    if (!isPriceReady || effectiveWarrantyYears === null || size === null || finish === null || coverage === null) {
      return null;
    }
    return getPpfPriceRange(brand, effectiveWarrantyYears, size, coverage, finish);
  }, [brand, coverage, effectiveWarrantyYears, finish, isPriceReady, size]);

  const stekLine = useMemo(
    () => (effectiveWarrantyYears !== null && brand === "STEK" ? stekSeriesName(effectiveWarrantyYears) : null),
    [brand, effectiveWarrantyYears]
  );

  const currentSelection = useMemo<CalculatorSelection | null>(() => {
    if (!isPriceReady || !estimate || effectiveWarrantyYears === null || size === null || finish === null || coverage === null) {
      return null;
    }

    return {
      brand,
      warrantyYears: effectiveWarrantyYears,
      finish,
      size,
      coverage,
      estimateMin: estimate.min,
      stekLine,
    };
  }, [brand, coverage, effectiveWarrantyYears, estimate, finish, isPriceReady, size, stekLine]);

  const visibleSelection = canShowEstimate ? currentSelection : null;

  const onSelectionChangeRef = useRef(onSelectionChange);
  onSelectionChangeRef.current = onSelectionChange;

  useEffect(() => {
    onSelectionChangeRef.current?.(hasInteracted ? currentSelection : null);
  }, [currentSelection, hasInteracted]);

  const intro = (
    <>
      <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-primary">PPF Calculator</span>
      </div>
      {variant === "standalone" ? (
        <h1 className="mb-4 mt-6">Build the right PPF setup for your car</h1>
      ) : (
        <h2 className="mb-4 mt-6 text-3xl font-bold tracking-tight md:text-4xl">
          Build the right PPF setup for your car
        </h2>
      )}
      <p className="max-w-3xl text-lg text-muted-foreground">
        Choose the warranty and car size first, then we open the rest of the setup below.
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Badge variant="secondary">STEK Certified</Badge>
        <Badge variant="outline">Studio preview imagery</Badge>
        <Badge variant="outline">Guided setup flow</Badge>
      </div>
    </>
  );

  return (
    <>
      {showIntro ? (
        variant === "standalone" ? (
          <section className="px-4 pb-10 pt-32 sm:px-6 lg:px-8">
            <div className="container mx-auto max-w-6xl">{intro}</div>
          </section>
        ) : (
          <div className="container mx-auto max-w-6xl px-4 pb-6 pt-12 sm:px-6 lg:px-8">{intro}</div>
        )
      ) : null}

      <section
        className={cn(
          isEmbeddedInPage ? "px-0" : "px-4 sm:px-6 lg:px-8",
          variant === "standalone"
            ? showIntro
              ? "pb-16"
              : "pt-0 pb-16"
            : "pb-16 md:pb-20"
        )}
      >
        <div className={isEmbeddedInPage ? "w-full max-w-none" : "container mx-auto max-w-6xl"}>
          <div className="relative space-y-5 [overflow-anchor:none]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_top_left,rgba(245,181,43,0.12),transparent_28%),radial-gradient(circle_at_top_right,rgba(255,255,255,0.04),transparent_24%)]" />

            <div className="relative space-y-5 [overflow-anchor:none]">
              <Card className={cn(panelClass, isEmbeddedInPage ? "p-4 sm:p-5" : "p-5 sm:p-6")}>
                <div className="pointer-events-none absolute inset-x-0 top-0 h-12 rounded-t-[30px] bg-[linear-gradient(180deg,rgba(255,255,255,0.06),transparent)]" />

                <div className="space-y-5">
                  {showBrandSelector ? (
                    <div>
                      <p className="mb-3 text-sm text-muted-foreground">Film brand</p>
                      <div className={`grid gap-3 ${brandOptions.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                        {brandOptions.map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => {
                              setHasInteracted(true);
                              setBrand(option);
                              if (warrantyYears !== null) {
                                setWarrantyYears(normalizeWarrantyYearsForBrand(option, warrantyYears));
                              }
                            }}
                            className={cn(
                              cardBaseClass,
                              "px-4 py-4 text-left",
                              brand === option ? selectedCardClass : "hover:border-primary/40"
                            )}
                          >
                            <p className="font-semibold text-white">{option}</p>
                            <p className="mt-1 text-xs text-slate-400">Premium film option</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div>
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.22em] text-white/52">
                          {showBrandSelector ? "Warranty term" : "Choose protection package"}
                        </p>
                        {!showBrandSelector ? (
                          <p className="mt-1 text-sm leading-6 text-slate-300">
                            Choose the STEK package that matches how long you plan to keep the car.
                          </p>
                        ) : null}
                      </div>
                      {showBrandSelector ? (
                        <p className="text-[11px] leading-snug text-slate-400 sm:max-w-[58%] sm:text-right sm:text-xs">
                          {brand === "STEK"
                            ? "5 yr F3, 10 yr ForceShield, 12 yr DynoShield"
                            : "10 year warranty"}
                        </p>
                      ) : null}
                    </div>
                    <div
                      className={`grid gap-2 sm:gap-3 ${
                        warrantyYearsForBrand(brand).length === 3
                          ? "grid-cols-3"
                          : warrantyYearsForBrand(brand).length === 2
                            ? "grid-cols-2"
                            : "grid-cols-1 max-w-xs"
                      }`}
                    >
                      {warrantyYearsForBrand(brand).map((years) => {
                        const series = brand === "STEK" ? stekSeriesName(years) : null;
                        const meta = warrantyOptionMeta[years];
                        return (
                          <button
                            key={years}
                            type="button"
                            onClick={() => {
                              setHasInteracted(true);
                              setWarrantyYears(years);
                            }}
                            className={cn(
                              cardBaseClass,
                              "min-w-0 px-3 py-3 text-left sm:px-4 sm:py-3.5",
                              effectiveWarrantyYears === years ? selectedCardClass : "hover:border-primary/40"
                            )}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-3xl font-black leading-none text-white">{years}</p>
                                <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-slate-400">
                                  Years
                                </p>
                              </div>
                              {meta?.badge ? (
                                <span className="rounded-full border border-primary/16 bg-primary/12 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#ffd47a]">
                                  {meta.badge}
                                </span>
                              ) : null}
                            </div>
                            {series ? (
                              <p className="mt-3 text-sm font-semibold uppercase tracking-[0.14em] text-white">
                                {meta?.subtitle ?? series}
                              </p>
                            ) : null}
                            <p className="mt-1 text-xs text-slate-400">{meta?.helper ?? "Protection package"}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="mb-3 text-sm text-muted-foreground">Choose car size</p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {sizes.map((option) => {
                        const { title, subtitle } = sizeLabels[option];
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => {
                              setHasInteracted(true);
                              setSize(option);
                            }}
                            className={cn(
                              "overflow-hidden rounded-[22px] border text-left transition duration-300",
                              size === option
                                ? selectedCardClass
                                : "border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(0,0,0,0.16))] hover:border-primary/40"
                            )}
                          >
                            <div
                              className={cn(
                                "relative w-full overflow-hidden bg-black",
                                isEmbeddedInPage ? "aspect-[3/2] sm:aspect-video" : "aspect-video"
                              )}
                            >
                              <img
                                src={sizeImageGlossByCategory[option]}
                                alt={`${title} - ${subtitle}`}
                                className="absolute inset-0 h-full w-full object-cover object-center"
                                loading="lazy"
                              />
                            </div>
                            <div className="px-3 py-3">
                              <p className="text-sm font-semibold text-white">{title}</p>
                              <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </Card>

              <div
                ref={stageTwoRef}
                className={cn(
                  "[overflow-anchor:none] overflow-hidden transition-all duration-500 ease-out",
                  isPrimaryReady ? "max-h-[2400px] opacity-100" : "max-h-0 opacity-0"
                )}
              >
                <div className="grid gap-5">
                  <Card
                    className={cn(
                      panelClass,
                      "[overflow-anchor:none]",
                      isEmbeddedInPage ? "p-4 sm:p-5" : "p-5 sm:p-6"
                    )}
                  >
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-12 rounded-t-[30px] bg-[linear-gradient(180deg,rgba(255,255,255,0.06),transparent)]" />

                    <div className="space-y-4 [overflow-anchor:none]">
                      <div>
                        <div className="mb-3 flex items-end justify-between gap-3">
                          <p className="text-[11px] uppercase tracking-[0.22em] text-white/52">Choose finish</p>
                          <p className="text-xs text-slate-400">Gloss keeps the factory shine. Matte gives a satin look.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {(["Gloss", "Matte"] as Finish[]).map((option) => (
                            <button
                              key={option}
                              type="button"
                              onPointerDown={(event) => {
                                finishScrollLockY.current = window.scrollY;
                                event.preventDefault();
                              }}
                              onClick={() => {
                                if (finish === option) {
                                  finishScrollLockY.current = null;
                                  return;
                                }
                                setHasInteracted(true);
                                setFinish(option);
                              }}
                              className={cn(
                                cardBaseClass,
                                "px-4 py-3.5 text-left",
                                finish === option ? selectedCardClass : "hover:border-primary/40"
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <span
                                  className={cn(
                                    "h-10 w-10 shrink-0 rounded-full border",
                                    option === "Gloss"
                                      ? "border-white/20 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.95),rgba(255,255,255,0.16)_30%,rgba(120,120,120,0.18)_55%,rgba(10,10,10,0.85)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]"
                                      : "border-white/12 bg-[linear-gradient(145deg,#7b7b84_0%,#4f4f56_38%,#2c2c31_100%)]"
                                  )}
                                />
                                <div>
                                  <p className="text-base font-semibold text-white">{option}</p>
                                  <p className="mt-0.5 text-xs text-slate-400">
                                    {option === "Gloss" ? "Factory shine" : "Satin look"}
                                  </p>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {size ? (
                        <div
                          className={cn(
                            "rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(0,0,0,0.14))]",
                            isEmbeddedInPage ? "p-2 sm:p-4" : "p-4"
                          )}
                        >
                          <div
                            className={cn(
                              "relative overflow-hidden rounded-[22px] border border-white/10 bg-black",
                              isEmbeddedInPage ? "aspect-[3/2] sm:aspect-video" : "aspect-video"
                            )}
                          >
                            <img
                              src={previewImageFor(size, finish)}
                              alt={`Preview - ${sizeLabels[size].subtitle}${finish ? ` (${finish})` : ""}`}
                              className="absolute inset-0 h-full w-full object-cover object-center"
                            />
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent px-3 pb-3 pt-8 sm:px-4 sm:pb-4 sm:pt-10">
                              <div className="flex items-end justify-between gap-2 sm:gap-3">
                                <div className="min-w-0 flex-1 pr-1">
                                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/60 sm:text-[11px] sm:tracking-[0.22em]">
                                    {sizeLabels[size].title}
                                  </p>
                                  <p className="mt-1 flex flex-wrap gap-x-1.5 gap-y-0.5 text-[15px] font-semibold leading-snug text-white sm:text-lg">
                                    {sizeLabels[size].subtitle.split(/\s+/).map((word, i) => (
                                      <span key={`${word}-${i}`} className="whitespace-nowrap">
                                        {word}
                                      </span>
                                    ))}
                                  </p>
                                </div>
                                {finish ? (
                                  <div className="shrink-0 rounded-full border border-white/12 bg-black/30 px-2.5 py-1 text-[11px] font-medium text-white/85 backdrop-blur-sm sm:px-3 sm:text-xs">
                                    {finish}
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : null}

                      {effectiveWarrantyYears === 5 ? (
                        <div>
                          <p className="mb-3 text-[11px] uppercase tracking-[0.22em] text-white/52">Choose coverage</p>
                          <div className="grid gap-3 sm:grid-cols-2">
                            {coverageOptions.map((option) => {
                              const isFront = option === "Front";
                              const disabled = isFront && !frontAvailable;

                              return (
                                <button
                                  key={option}
                                  type="button"
                                  disabled={disabled}
                                  onClick={() => {
                                    if (!disabled) {
                                      setHasInteracted(true);
                                      setCoverage(option);
                                    }
                                  }}
                                  className={cn(
                                    "rounded-[20px] border px-4 py-4 text-left transition duration-300",
                                    disabled
                                      ? "cursor-not-allowed border-white/8 bg-white/[0.03] text-white/35 opacity-70"
                                      : coverage === option
                                        ? selectedCardClass
                                        : "border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(0,0,0,0.16))] hover:border-primary/40"
                                  )}
                                >
                                  <div className="flex items-start gap-2">
                                    {disabled ? <Lock className="mt-0.5 h-4 w-4 shrink-0 text-white/35" /> : null}
                                    <div>
                                      <p className="font-semibold text-white">{option}</p>
                                      <p className="mt-1 text-xs text-slate-400">
                                        {disabled
                                          ? "Only available with STEK 5-year"
                                          : isFront
                                            ? "Front-end impact areas"
                                            : "Complete all-around paint protection"}
                                      </p>
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}

                      <div className={cn("[overflow-anchor:none]", !isPriceReady && "hidden")}>
                        {visibleSelection ? (
                          <div className="space-y-4">
                            <PpfQuoteSummaryV1
                              selection={visibleSelection}
                              vehicleSummary={vehicleSummary}
                              onWhatsAppClick={() => onWhatsAppRequest?.(visibleSelection)}
                            />
                          </div>
                        ) : isPriceReady ? (
                          <div className="rounded-[24px] border border-primary/18 bg-[radial-gradient(circle_at_top_left,rgba(245,181,43,0.16),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(20,20,20,0.95))] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl">
                            <p className="text-[11px] uppercase tracking-[0.22em] text-white/50">Ready to see the price?</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {[
                                stekLine ? `${brand} ${stekLine}` : brand,
                                effectiveWarrantyYears ? `${effectiveWarrantyYears}-year` : null,
                                finish,
                                size,
                                coverage,
                              ]
                                .filter(Boolean)
                                .map((item) => (
                                  <span
                                    key={item as string}
                                    className="rounded-full border border-white/10 bg-black/18 px-3 py-1.5 text-xs font-medium text-white/88"
                                  >
                                    {item}
                                  </span>
                                ))}
                            </div>
                            <p className="mt-4 text-2xl font-semibold tracking-tight text-white sm:text-[1.95rem]">
                              Reveal the live estimate for this setup
                            </p>
                            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                              Enter your name, mobile number, and vehicle details to reveal the estimate and send this setup through to Sean.
                            </p>
                            <div className="mt-4">
                              <Button
                                className="w-full bg-[#f7b52b] text-black shadow-[0_16px_42px_rgba(247,181,43,0.24)] hover:bg-[#ffc54d]"
                                type="button"
                                onClick={onPriceUnlockRequest}
                              >
                                Reveal My Estimate
                              </Button>
                            </div>
                            <p className="mt-3 text-xs leading-5 text-white/45">
                              Name, mobile, and vehicle only. Then the calculator stays open.
                            </p>
                          </div>
                        ) : null}
                      </div>

                      {!isPriceReady ? (
                        <p className="text-sm text-slate-400">
                          {effectiveWarrantyYears === 5
                            ? "Choose finish and coverage to reveal the price."
                            : "Choose finish to reveal the price."}
                        </p>
                      ) : null}
                    </div>
                  </Card>
                </div>
              </div>

              {showActionButtons ? (
                <div className="rounded-[24px] border border-white/10 bg-white/[0.02] px-5 py-5">
                  <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    Learn before you decide
                  </p>
                  <div className="space-y-2 text-sm">
                    <Link to="/blog/ppf-vs-ceramic-dubai" className="block text-primary hover:underline">
                      PPF vs Ceramic in Dubai
                    </Link>
                    <Link
                      to="/blog/ppf-dubai-full-front-vs-full-body"
                      className="block text-primary hover:underline"
                    >
                      Front vs Full Body PPF Guide
                    </Link>
                    <Link
                      to="/blog/ppf-longevity-dubai-heat"
                      className="block text-primary hover:underline"
                    >
                      How long does PPF last in Dubai heat?
                    </Link>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default PpfCostCalculatorWidgetV1;
