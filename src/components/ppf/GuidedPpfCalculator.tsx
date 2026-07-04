import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  BadgeCheck,
  Check,
  Gift,
  MessageCircle,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  getPpfPriceRange,
  stekSeriesName,
  type PpfPricingFinish,
  type PpfPricingSize,
} from "@/data/ppf-calculator-pricing";

/* ────────────────────────────────────────────────────────────────────────────
 * Guided PPF calculator — an UNGATED, self-contained version of the V3 guided
 * flow (size → finish → warranty → live "from" price), built as a reusable
 * widget for the WhatsApp-first page. Same pricing data and gold/dark visual
 * language as V3, but no phone-gate: the price always shows and every CTA is a
 * direct WhatsApp tap. The live V2/V3 funnel is untouched.
 *
 * `onWhatsApp(placement, message)` is provided by the host page so the calculator
 * reuses the page's counted-conversion firing.
 * ──────────────────────────────────────────────────────────────────────────── */

type Years = 5 | 10 | 12;
type Step = "size" | "finish" | "package" | "result";
const STEP_ORDER: Step[] = ["size", "finish", "package", "result"];

const GOLD = "#f7b52b";
const formatAED = (value: number) => `AED ${value.toLocaleString("en-AE")}`;

const sizeOptions: Array<{ value: PpfPricingSize; label: string; example: string; imgPrefix: string }> = [
  { value: "Small", label: "Small", example: "A45 / Golf / 3 Series", imgPrefix: "a45" },
  { value: "Medium", label: "Medium", example: "E-Class / 5 Series", imgPrefix: "e63s" },
  { value: "SUV", label: "SUV / 4x4", example: "Patrol / Defender / Cayenne", imgPrefix: "patrol" },
  { value: "Sports", label: "Sports", example: "911 / GT3 / R8", imgPrefix: "gt3" },
];

const finishOptions: Array<{ value: PpfPricingFinish; label: string; helper: string }> = [
  { value: "Gloss", label: "Gloss", helper: "Keeps the factory paint look" },
  { value: "Matte", label: "Matte", helper: "Satin stealth finish" },
];

const packageOptions: Array<{ years: Years; label: string; value: string; badge?: string }> = [
  { years: 5, label: "Essential", value: "Confident chip & paint cover" },
  { years: 10, label: "Most chosen", value: "Best protection-to-price balance", badge: "POPULAR" },
  { years: 12, label: "Ultimate", value: "Maximum long-term cover" },
];

const freeExtras = [
  "Multi-stage paint correction",
  "Full interior & exterior detail",
  "Leather & wheel ceramic coating",
  "Free pickup & drop-off across Dubai",
  "Lifetime PPF edge inspections",
];

const imageFor = (size: PpfPricingSize, finish: PpfPricingFinish) => {
  const prefix = sizeOptions.find((s) => s.value === size)?.imgPrefix ?? "a45";
  return `/calculator-${prefix}-${finish.toLowerCase()}.jpg`;
};

const StepDots = ({ index }: { index: number }) => (
  <div className="flex items-center gap-1.5">
    {STEP_ORDER.map((_, i) => (
      <span
        key={i}
        className={cn("h-1.5 rounded-full transition-all", i <= index ? "w-6" : "w-2 bg-white/20")}
        style={i <= index ? { background: GOLD } : undefined}
      />
    ))}
  </div>
);

export default function GuidedPpfCalculator({
  onWhatsApp,
  onEvent,
}: {
  onWhatsApp: (placement: string, message: string) => void;
  /** Optional funnel-event sink (host page writes these to the CRM dashboard). */
  onEvent?: (name: string, payload?: Record<string, unknown>) => void;
}) {
  const [step, setStep] = useState<Step>("size");
  const [size, setSize] = useState<PpfPricingSize | null>(null);
  const [finish, setFinish] = useState<PpfPricingFinish | null>(null);
  const [years, setYears] = useState<Years | null>(null);
  const [animatedPrice, setAnimatedPrice] = useState(0);
  const rafRef = useRef<number | null>(null);

  const stepIndex = STEP_ORDER.indexOf(step);

  const price = useMemo(
    () =>
      size && finish && years
        ? getPpfPriceRange("STEK", years, size, "Full Body", finish).min
        : null,
    [size, finish, years],
  );

  const goTo = (next: Step) => setStep(next);
  const back = () => {
    const i = STEP_ORDER.indexOf(step);
    if (i > 0) setStep(STEP_ORDER[i - 1]);
  };
  const reset = () => {
    setSize(null);
    setFinish(null);
    setYears(null);
    setStep("size");
  };

  // Count up to the final price when the result lands.
  useEffect(() => {
    if (step !== "result" || price === null) return;
    if (typeof window === "undefined" || window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) {
      setAnimatedPrice(price);
      return;
    }
    const from = Math.round(price * 0.82);
    const start = performance.now();
    const duration = 900;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setAnimatedPrice(Math.round(from + (price - from) * eased));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [step, price]);

  const sendWhatsApp = useCallback(() => {
    const series = years ? stekSeriesName(years) : null;
    const sizeLabel = sizeOptions.find((s) => s.value === size)?.label ?? size;
    // "I found you on Google" tags the channel in Sean's inbox — this calculator
    // is used only on the Google funnel page (PpfWhatsAppDirect).
    const message =
      `Hi Sean, I found you on Google — I'm interested in PPF for my ${sizeLabel} car ` +
      `(${finish}, ${years}-year STEK${series ? ` ${series}` : ""}). ` +
      `Your site shows from ${price !== null ? formatAED(price) : "—"} — ` +
      `could you send me a bit more detail?`;
    onWhatsApp("guided_calculator", message);
  }, [finish, onWhatsApp, price, size, years]);

  return (
    <div className="overflow-hidden rounded-[28px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(8,8,8,0.5))] shadow-[0_30px_90px_rgba(0,0,0,0.5)]">
      {/* header */}
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          {step !== "size" ? (
            <button
              onClick={back}
              aria-label="Back"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/15 text-white/80 transition hover:border-[#f7b52b]/55 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          ) : (
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#f7b52b]/15 ring-1 ring-[#f7b52b]/30">
              <Sparkles className="h-4 w-4" style={{ color: GOLD }} />
            </span>
          )}
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: GOLD }}>
              Build your price
            </p>
            <p className="text-xs text-white/55">Step {stepIndex + 1} of 4</p>
          </div>
        </div>
        <StepDots index={stepIndex} />
      </div>

      <div className="p-5 sm:p-6">
        {/* STEP: SIZE */}
        {step === "size" ? (
          <div>
            <h3 className="text-lg font-black">What are we protecting?</h3>
            <p className="mt-1 text-sm text-white/55">Pick the closest size — we confirm exact on WhatsApp.</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {sizeOptions.map((s) => (
                <button
                  key={s.value}
                  onClick={() => {
                    setSize(s.value);
                    onEvent?.("guided_step_completed", { step: "size", size: s.value });
                    goTo("finish");
                  }}
                  className={cn(
                    "group overflow-hidden rounded-2xl border text-left transition hover:-translate-y-0.5",
                    size === s.value ? "border-[#f7b52b]/60" : "border-white/10 hover:border-white/30",
                  )}
                >
                  <div className="relative aspect-video w-full overflow-hidden bg-[#0a0a0a]">
                    <img
                      src={`/calculator-${s.imgPrefix}-gloss.jpg`}
                      alt={s.label}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-bold">{s.label}</p>
                    <p className="text-[11px] text-white/50">{s.example}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {/* STEP: FINISH */}
        {step === "finish" ? (
          <div>
            <h3 className="text-lg font-black">Gloss or matte?</h3>
            <p className="mt-1 text-sm text-white/55">Both give full-body protection.</p>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {finishOptions.map((f) => (
                <button
                  key={f.value}
                  onClick={() => {
                    setFinish(f.value);
                    onEvent?.("guided_step_completed", { step: "finish", size, finish: f.value });
                    goTo("package");
                  }}
                  className={cn(
                    "overflow-hidden rounded-2xl border text-left transition hover:-translate-y-0.5",
                    finish === f.value ? "border-[#f7b52b]/60" : "border-white/10 hover:border-white/30",
                  )}
                >
                  <div className="relative aspect-video w-full overflow-hidden bg-[#0a0a0a]">
                    <img
                      src={`/calculator-${(size ? sizeOptions.find((s) => s.value === size)?.imgPrefix : "gt3") ?? "gt3"}-${f.value.toLowerCase()}.jpg`}
                      alt={f.label}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-4">
                    <p className="text-sm font-bold">{f.label}</p>
                    <p className="text-[12px] text-white/55">{f.helper}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {/* STEP: PACKAGE */}
        {step === "package" ? (
          <div>
            <h3 className="text-lg font-black">How long should it last?</h3>
            <p className="mt-1 text-sm text-white/55">Longer warranty = higher-grade STEK film.</p>
            <div className="mt-4 grid gap-3">
              {packageOptions.map((p) => (
                <button
                  key={p.years}
                  onClick={() => {
                    const est =
                      size && finish
                        ? getPpfPriceRange("STEK", p.years, size, "Full Body", finish).min
                        : null;
                    setYears(p.years);
                    onEvent?.("guided_step_completed", { step: "package", size, finish, warranty_years: p.years, estimate_value: est });
                    onEvent?.("guided_price_revealed", { size, finish, warranty_years: p.years, estimate_value: est });
                    goTo("result");
                  }}
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 text-left transition hover:-translate-y-0.5",
                    years === p.years ? "border-[#f7b52b]/60 bg-[#f7b52b]/[0.06]" : "border-white/10 hover:border-white/30",
                  )}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-base font-black">{p.years}-year warranty</p>
                      {p.badge ? (
                        <span className="rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-black" style={{ background: GOLD }}>
                          {p.badge}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-[12px] text-white/55">
                      {p.label} · {p.value} · STEK {stekSeriesName(p.years)}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 flex-none text-white/40" />
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {/* STEP: RESULT */}
        {step === "result" && size && finish && years && price !== null ? (
          <div className="grid gap-5 sm:grid-cols-[0.95fr_1.05fr] sm:items-stretch">
            <div className="relative overflow-hidden rounded-2xl border border-white/10">
              <img src={imageFor(size, finish)} alt={`${size} ${finish} PPF`} className="h-full min-h-[180px] w-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-black/55 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white backdrop-blur">
                  <ShieldCheck className="h-3 w-3" style={{ color: GOLD }} /> STEK {stekSeriesName(years)}
                </span>
                <p className="mt-2 text-sm font-bold text-white">
                  {sizeOptions.find((s) => s.value === size)?.label} · {finish} · {years}-year
                </p>
              </div>
            </div>

            <div className="flex flex-col">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/55">Full-body PPF · from</p>
              <p className="mt-1 text-4xl font-black leading-none" style={{ color: GOLD }}>
                {formatAED(animatedPrice || price)}
              </p>
              <p className="mt-1 text-[12px] text-white/45">Indicative starting price · excl. VAT</p>

              <div className="mt-4 rounded-2xl border border-[#f7b52b]/25 bg-[#f7b52b]/[0.05] p-3.5">
                <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.14em]" style={{ color: GOLD }}>
                  <Gift className="h-3.5 w-3.5" /> AED 4,550+ in free extras included
                </p>
                <ul className="mt-2 space-y-1">
                  {freeExtras.map((x) => (
                    <li key={x} className="flex items-start gap-2 text-[12px] leading-5 text-white/75">
                      <Check className="mt-0.5 h-3.5 w-3.5 flex-none text-[#25D366]" /> {x}
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={sendWhatsApp}
                className="group mt-4 inline-flex items-center justify-center gap-2.5 rounded-2xl bg-[#25D366] px-6 py-3.5 text-base font-bold text-[#04210f] shadow-[0_10px_30px_rgba(37,211,102,0.32)] transition hover:-translate-y-0.5 hover:brightness-105"
              >
                <MessageCircle className="h-5 w-5" />
                Get this quote on WhatsApp
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </button>
              <button
                onClick={reset}
                className="mt-2 inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-white/45 transition hover:text-white/70"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Start over
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {/* trust strip footer */}
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 border-t border-white/10 px-5 py-3 text-[11px] text-white/50">
        <span className="inline-flex items-center gap-1.5"><BadgeCheck className="h-3.5 w-3.5" style={{ color: GOLD }} /> Genuine STEK</span>
        <span className="inline-flex items-center gap-1.5"><Truck className="h-3.5 w-3.5" style={{ color: GOLD }} /> Free Dubai pickup</span>
        <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" style={{ color: GOLD }} /> Traceable warranty</span>
      </div>
    </div>
  );
}
