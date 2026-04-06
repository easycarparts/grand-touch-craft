import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, MessageCircle, Sparkles, ArrowRight, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  getPpfPriceRange,
  isFrontCoverageAvailable,
  normalizeWarrantyYearsForBrand,
  stekSeriesName,
  warrantyYearsForBrand,
  type PpfPricingBrand,
  type PpfPricingSize,
  type PpfPricingCoverage,
} from "@/data/ppf-calculator-pricing";

type Brand = PpfPricingBrand;
type Finish = "Gloss" | "Matte";
type CarSize = PpfPricingSize;
type Coverage = PpfPricingCoverage;

const sizes: CarSize[] = ["Sports", "Small", "Medium", "SUV"];
const coverageOptions: Coverage[] = ["Full Body", "Front"];

const sizeImageGlossByCategory: Record<CarSize, string> = {
  Sports: "/ppf-size-sports-porsche-gt3.png",
  Small: "/ppf-size-small-mercedes-a45-amg.png",
  Medium: "/ppf-size-medium-mercedes-e63s.png",
  SUV: "/ppf-size-suv-nissan-patrol-gloss.png",
};

const sizeImageMatteByCategory: Record<CarSize, string> = {
  Sports: "/ppf-size-sports-porsche-gt3-matte.png",
  Small: "/ppf-size-small-mercedes-a45-amg-matte.png",
  Medium: "/ppf-size-medium-mercedes-e63s-matte.png",
  SUV: "/ppf-size-suv-nissan-patrol-matte.png",
};

function previewImageFor(size: CarSize, finish: Finish): string {
  return finish === "Matte" ? sizeImageMatteByCategory[size] : sizeImageGlossByCategory[size];
}

const sizeLabels: Record<CarSize, { title: string; subtitle: string }> = {
  Sports: { title: "Sports", subtitle: "Porsche 911 GT3" },
  Small: { title: "Small", subtitle: "Mercedes-AMG A45" },
  Medium: { title: "Medium", subtitle: "Mercedes-AMG E63 S" },
  SUV: { title: "SUV", subtitle: "Nissan Patrol" },
};

const formatAED = (value: number) => `AED ${value.toLocaleString("en-AE")}`;

export type PpfCostCalculatorWidgetProps = {
  /** `standalone`: page layout with top padding and h1. `embedded`: home section with h2 and tighter spacing. */
  variant?: "standalone" | "embedded";
};

const PpfCostCalculatorWidget = ({ variant = "standalone" }: PpfCostCalculatorWidgetProps) => {
  const [brand, setBrand] = useState<Brand>("STEK");
  const [warrantyYears, setWarrantyYears] = useState<number>(10);
  const [finish, setFinish] = useState<Finish>("Gloss");
  const [size, setSize] = useState<CarSize>("Medium");
  const [coverage, setCoverage] = useState<Coverage>("Full Body");

  const effectiveWarrantyYears = useMemo(
    () => normalizeWarrantyYearsForBrand(brand, warrantyYears),
    [brand, warrantyYears]
  );

  const frontAvailable = isFrontCoverageAvailable(brand, effectiveWarrantyYears);

  useEffect(() => {
    if (!frontAvailable && coverage === "Front") {
      setCoverage("Full Body");
    }
  }, [frontAvailable, coverage]);

  const estimate = useMemo(
    () => getPpfPriceRange(brand, effectiveWarrantyYears, size, coverage, finish),
    [brand, effectiveWarrantyYears, finish, size, coverage]
  );

  const stekLine = brand === "STEK" ? stekSeriesName(effectiveWarrantyYears) : null;

  const whatsAppUrl = useMemo(() => {
    const message = [
      "Hi Sean, I used the PPF Cost Calculator.",
      `Brand: ${brand}`,
      `Warranty: ${effectiveWarrantyYears} years${stekLine ? ` (${stekLine})` : ""}`,
      `Finish: ${finish}`,
      `Car size: ${size}`,
      `Coverage: ${coverage}`,
      `From: ${formatAED(estimate.min)}`,
      "",
      "Please confirm final pricing and earliest availability.",
    ].join("\n");

    return `https://wa.me/971567191045?text=${encodeURIComponent(message)}`;
  }, [brand, effectiveWarrantyYears, finish, size, coverage, estimate.min, stekLine]);

  const intro = (
    <>
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-primary">PPF Cost Calculator Dubai</span>
      </div>
      {variant === "standalone" ? (
        <h1 className="mb-4">Get your PPF estimate in under 30 seconds</h1>
      ) : (
        <h2 className="mb-4 text-3xl md:text-4xl font-bold tracking-tight">
          Get your PPF estimate in under 30 seconds
        </h2>
      )}
      <p className="text-lg text-muted-foreground max-w-3xl">
        Choose brand, warranty term, car size, and coverage. Use the preview panel for gloss or matte
        finish. Get an instant estimated range, then message Sean on WhatsApp to confirm final pricing.
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Badge variant="secondary">STEK Certified</Badge>
        <Badge variant="secondary">GYEON Certified</Badge>
        <Badge variant="outline">No make/model needed</Badge>
      </div>
    </>
  );

  return (
    <>
      {variant === "standalone" ? (
        <section className="pt-32 pb-10 px-4 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-6xl">{intro}</div>
        </section>
      ) : (
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-12 pb-6">{intro}</div>
      )}

      <section
        className={`px-4 sm:px-6 lg:px-8 ${variant === "standalone" ? "pb-16" : "pb-16 md:pb-20"}`}
      >
        <div className="container mx-auto max-w-6xl grid gap-6 lg:grid-cols-2">
          <Card className="p-6 sm:p-8 space-y-8">
            <div>
              <p className="text-sm text-muted-foreground mb-3">1) Choose film brand</p>
              <div className="grid grid-cols-2 gap-3">
                {(["STEK", "GYEON"] as Brand[]).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setBrand(option);
                      setWarrantyYears((y) => normalizeWarrantyYearsForBrand(option, y));
                    }}
                    className={`rounded-lg border px-4 py-3 text-left transition ${
                      brand === option
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <p className="font-semibold">{option}</p>
                    <p className="text-xs text-muted-foreground mt-1">Premium film option</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-3">2) Choose warranty term</p>
              <p className="text-xs text-muted-foreground mb-3">
                {brand === "STEK"
                  ? "STEK: 5 yr F3, 10 yr ForceShield, 12 yr DynoShield."
                  : "GYEON: 10 year warranty (Q² PPF)."}
              </p>
              <div
                className={`grid gap-3 ${
                  warrantyYearsForBrand(brand).length === 3
                    ? "grid-cols-3"
                    : warrantyYearsForBrand(brand).length === 2
                      ? "grid-cols-2"
                      : "grid-cols-1 max-w-xs"
                }`}
              >
                {warrantyYearsForBrand(brand).map((years) => {
                  const series = brand === "STEK" ? stekSeriesName(years) : null;
                  return (
                    <button
                      key={years}
                      type="button"
                      onClick={() => setWarrantyYears(years)}
                      className={`rounded-lg border px-3 py-3 text-center transition ${
                        effectiveWarrantyYears === years
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <p className="text-lg font-bold leading-none">{years}</p>
                      <p className="text-xs text-muted-foreground mt-1">years</p>
                      {series ? (
                        <p className="text-[11px] font-medium text-primary mt-1 leading-tight">
                          {series}
                        </p>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-3">3) Choose car size</p>
              <div className="grid grid-cols-2 gap-3">
                {sizes.map((option) => {
                  const { title, subtitle } = sizeLabels[option];
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setSize(option)}
                      className={`group relative overflow-hidden rounded-lg border text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                        size === option
                          ? "border-primary ring-2 ring-primary/40"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="aspect-video w-full bg-muted">
                        <img
                          src={sizeImageGlossByCategory[option]}
                          alt={`${title} — ${subtitle}`}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <div
                        className={`px-3 py-2.5 ${
                          size === option ? "bg-primary/10" : "bg-card/95"
                        }`}
                      >
                        <p className="text-sm font-semibold leading-tight">{title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
                          {subtitle}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-3">4) Choose coverage</p>
              <div className="grid grid-cols-2 gap-3">
                {coverageOptions.map((option) => {
                  const isFront = option === "Front";
                  const disabled = isFront && !frontAvailable;
                  return (
                    <button
                      key={option}
                      type="button"
                      disabled={disabled}
                      onClick={() => {
                        if (!disabled) setCoverage(option);
                      }}
                      className={`rounded-lg border px-4 py-3 text-left transition ${
                        disabled
                          ? "border-border/60 bg-muted/40 text-muted-foreground cursor-not-allowed opacity-70"
                          : coverage === option
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {disabled ? (
                          <Lock
                            className="w-4 h-4 shrink-0 mt-0.5 text-muted-foreground"
                            aria-hidden
                          />
                        ) : null}
                        <div className="min-w-0">
                          <p className="font-semibold">{option}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {disabled
                              ? "Only available with STEK 5-year (F3)."
                              : isFront
                                ? "High impact front-area protection"
                                : "Complete all-around paint protection"}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>

          <Card className="p-6 sm:p-8">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">Visual preview</p>
              <Badge variant="outline">UI preview only</Badge>
            </div>

            <div className="mb-5">
              <p className="text-sm text-muted-foreground mb-3">Finish</p>
              <div className="grid grid-cols-2 gap-3">
                {(["Gloss", "Matte"] as Finish[]).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setFinish(option)}
                    className={`rounded-lg border px-4 py-3 text-left transition ${
                      finish === option
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <p className="font-semibold">{option}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {option === "Gloss" ? "Deep glossy look" : "Satin matte look"}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border bg-card/50 p-5">
              <div className="relative aspect-video overflow-hidden rounded-2xl border border-border bg-muted">
                <img
                  src={previewImageFor(size, finish)}
                  alt={`Preview — ${sizeLabels[size].subtitle} (${finish})`}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-5">
              <p className="text-sm text-muted-foreground mb-2">Starting from</p>
              <p className="text-3xl font-bold mb-2">{formatAED(estimate.min)}</p>
              <p className="text-sm text-muted-foreground">
                {brand}
                {stekLine ? ` (${stekLine})` : ""} • {effectiveWarrantyYears} yr • {finish} • {size} •{" "}
                {coverage}
              </p>
              <p className="text-xs text-muted-foreground mt-3">
                Final quote depends on condition, panel complexity, and inspection.
              </p>
            </div>

            <div className="mt-5 flex flex-col sm:flex-row gap-3">
              <a href={whatsAppUrl} target="_blank" rel="noreferrer" className="w-full">
                <Button className="w-full">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Talk to Sean on WhatsApp
                </Button>
              </a>
              <Link to="/portfolio" className="w-full">
                <Button variant="outline" className="w-full">
                  View Our PPF Portfolio
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>

            <div className="mt-8 pt-6 border-t border-border">
              <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                Learn before you decide
              </p>
              <div className="space-y-2 text-sm">
                <Link to="/blog/ppf-vs-ceramic-dubai" className="text-primary hover:underline block">
                  PPF vs Ceramic in Dubai
                </Link>
                <Link
                  to="/blog/ppf-dubai-full-front-vs-full-body"
                  className="text-primary hover:underline block"
                >
                  Front vs Full Body PPF Guide
                </Link>
                <Link
                  to="/blog/ppf-longevity-dubai-heat"
                  className="text-primary hover:underline block"
                >
                  How long does PPF last in Dubai heat?
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </>
  );
};

export default PpfCostCalculatorWidget;
