import { BadgeCheck, Gift, Lock, MessageCircle, ShieldCheck, Sparkles, Truck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInputWithCountry } from "@/components/PhoneInputWithCountry";
import { cn } from "@/lib/utils";
import {
  getPpfPriceRange,
  stekSeriesName,
  type PpfPricingFinish,
  type PpfPricingSize,
} from "@/data/ppf-calculator-pricing";

/**
 * Free-play price configurator (G700-customizer style) for the `builder`
 * variant of the Google price funnel. Every control is always visible and the
 * exact price updates live — no step lock-in, so a visitor who flinches at the
 * 12-year price can flip to 5-year and stay instead of bouncing (the stepper
 * funnel lost ~75% of starters before the price).
 *
 * State and handlers live in PpfFullPpfGuidedCalculatorV2 — this component is
 * layout only, so the proven capture/conversion wiring stays in one place.
 */

const formatAED = (value: number) => `AED ${value.toLocaleString("en-US")}`;

/** Mirrors the funnel's 20% online-discount anchor math. */
const listPriceFor = (target: number) => Math.round(target / 0.8 / 10) * 10;

const sizeChoices: Array<{ value: PpfPricingSize; label: string; example: string }> = [
  { value: "Small", label: "Small", example: "A45 / Golf / 3 Series" },
  { value: "Medium", label: "Medium", example: "E-Class / 5 Series" },
  { value: "SUV", label: "SUV / 4x4", example: "Patrol / Defender / Cayenne" },
  { value: "Sports", label: "Sports", example: "911 / GT3 / R8" },
];

const finishChoices: Array<{ value: PpfPricingFinish; label: string; helper: string }> = [
  { value: "Gloss", label: "Gloss", helper: "Factory paint look" },
  { value: "Matte", label: "Matte", helper: "Satin stealth" },
];

const warrantyChoices: Array<{ years: 5 | 10 | 12; label: string; badge?: string }> = [
  { years: 5, label: "Essential" },
  { years: 10, label: "Most chosen", badge: "POPULAR" },
  { years: 12, label: "Ultimate" },
];

const lockedBonuses = [
  { icon: Sparkles, text: "Free window tint upgrade" },
  { icon: Truck, text: "Free pickup & drop-off across Dubai" },
  { icon: BadgeCheck, text: "20% online discount locked to this build" },
];

type PpfPriceBuilderProps = {
  size: PpfPricingSize;
  finish: PpfPricingFinish;
  warrantyYears: 5 | 10 | 12;
  vehicle: string;
  phone: string;
  phoneCaptured: boolean;
  onSelectSize: (size: PpfPricingSize) => void;
  onSelectFinish: (finish: PpfPricingFinish) => void;
  onSelectWarranty: (years: 5 | 10 | 12) => void;
  onVehicleChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onLockBonuses: () => void;
  onWhatsApp: (placement: string) => void;
};

export const PpfPriceBuilder = ({
  size,
  finish,
  warrantyYears,
  vehicle,
  phone,
  phoneCaptured,
  onSelectSize,
  onSelectFinish,
  onSelectWarranty,
  onVehicleChange,
  onPhoneChange,
  onLockBonuses,
  onWhatsApp,
}: PpfPriceBuilderProps) => {
  const target = getPpfPriceRange("STEK", warrantyYears, size, "Full Body", finish).min;
  const list = listPriceFor(target);
  const savings = list - target;
  const series = stekSeriesName(warrantyYears);

  return (
    <div>
      {/* Live price panel — the headline act, updates with every tap. */}
      <div className="rounded-2xl border border-[#f7b52b]/30 bg-[linear-gradient(180deg,rgba(247,181,43,0.10),rgba(0,0,0,0.25))] p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#f7b52b] sm:text-xs">
            Your exact price — live
          </p>
          {series ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/30 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-200">
              <ShieldCheck className="h-3 w-3 text-[#f7b52b]" />
              STEK {series}
            </span>
          ) : null}
        </div>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-4xl font-black tracking-tight text-white sm:text-5xl" aria-live="polite">
            {formatAED(target)}
          </span>
          <span className="text-base font-bold text-slate-500 line-through sm:text-lg">{formatAED(list)}</span>
        </div>
        <p className="mt-1.5 text-[11px] font-semibold text-slate-300 sm:text-xs">
          20% online discount applied — you save {formatAED(savings)}. Full body, genuine STEK, excl. VAT.
        </p>
      </div>

      {/* Controls — everything visible, nothing locked behind steps. */}
      <div className="mt-4 space-y-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/55">Car size</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {sizeChoices.map((choice) => (
              <button
                key={choice.value}
                type="button"
                onClick={() => onSelectSize(choice.value)}
                className={cn(
                  "rounded-xl border px-3 py-2.5 text-left transition",
                  size === choice.value
                    ? "border-[#f7b52b] bg-[#f7b52b]/15"
                    : "border-white/15 bg-white/[0.04] hover:border-[#f7b52b]/50",
                )}
              >
                <span className={cn("block text-sm font-black", size === choice.value ? "text-[#f7b52b]" : "text-white")}>
                  {choice.label}
                </span>
                <span className="mt-0.5 block text-[10px] font-semibold text-slate-400">{choice.example}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/55">Finish</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {finishChoices.map((choice) => (
              <button
                key={choice.value}
                type="button"
                onClick={() => onSelectFinish(choice.value)}
                className={cn(
                  "rounded-xl border px-3 py-2.5 text-left transition",
                  finish === choice.value
                    ? "border-[#f7b52b] bg-[#f7b52b]/15"
                    : "border-white/15 bg-white/[0.04] hover:border-[#f7b52b]/50",
                )}
              >
                <span
                  className={cn("block text-sm font-black", finish === choice.value ? "text-[#f7b52b]" : "text-white")}
                >
                  {choice.label}
                </span>
                <span className="mt-0.5 block text-[10px] font-semibold text-slate-400">{choice.helper}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/55">STEK warranty</p>
          <div className="mt-2 space-y-2">
            {warrantyChoices.map((choice) => {
              const optionPrice = getPpfPriceRange("STEK", choice.years, size, "Full Body", finish).min;
              const active = warrantyYears === choice.years;
              return (
                <button
                  key={choice.years}
                  type="button"
                  onClick={() => onSelectWarranty(choice.years)}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-3 text-left transition",
                    active
                      ? "border-[#f7b52b] bg-[#f7b52b]/15"
                      : "border-white/15 bg-white/[0.04] hover:border-[#f7b52b]/50",
                  )}
                >
                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      <span className={cn("text-sm font-black", active ? "text-[#f7b52b]" : "text-white")}>
                        {choice.years}-year · {stekSeriesName(choice.years)}
                      </span>
                      {choice.badge ? (
                        <span className="rounded-full bg-[#25D366]/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-[#25D366]">
                          {choice.badge}
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-0.5 block text-[10px] font-semibold text-slate-400">{choice.label}</span>
                  </span>
                  <span className={cn("shrink-0 text-sm font-black", active ? "text-[#f7b52b]" : "text-slate-200")}>
                    {formatAED(optionPrice)}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-1.5 text-[10px] font-semibold text-slate-500">
            Flip between warranties — the price above updates instantly. No number needed to see it.
          </p>
        </div>

        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/55">
            Your car <span className="normal-case tracking-normal text-slate-500">(optional — sharpens the quote)</span>
          </p>
          <Input
            value={vehicle}
            onChange={(event) => onVehicleChange(event.target.value)}
            placeholder="e.g. 2026 Range Rover Sport, 2025 Patrol"
            aria-label="Your car"
            className="mt-2 h-12 border-white/20 bg-white/[0.05] text-white placeholder:text-slate-500 focus-visible:border-[#f7b52b]/70 focus-visible:ring-[#f7b52b]/30"
          />
        </div>

        {/* Bonus lock — the capture mechanic that produced 100% of week-1 leads. */}
        <div className="rounded-2xl border border-[#f7b52b]/35 bg-black/30 p-4">
          <p className="flex items-center gap-2 text-sm font-black text-white">
            <Gift className="h-4 w-4 text-[#f7b52b]" />
            Lock these bonuses onto this exact build
          </p>
          <ul className="mt-2.5 space-y-1.5">
            {lockedBonuses.map((bonus) => (
              <li key={bonus.text} className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <bonus.icon className="h-3.5 w-3.5 shrink-0 text-[#25D366]" />
                {bonus.text}
              </li>
            ))}
          </ul>
          {phoneCaptured ? (
            <p className="mt-3 flex items-center gap-2 rounded-xl border border-[#25D366]/40 bg-[#25D366]/10 px-3 py-2.5 text-xs font-bold text-[#25D366]">
              <BadgeCheck className="h-4 w-4 shrink-0" />
              Bonuses locked to this build — Sean will WhatsApp you today to confirm.
            </p>
          ) : (
            <>
              <div className="mt-3">
                <PhoneInputWithCountry
                  value={phone}
                  onChange={onPhoneChange}
                  onBlur={onLockBonuses}
                  placeholder="50 123 4567"
                  className="border-[#f7b52b]/30 bg-white/[0.04]"
                  ariaLabel="Phone to lock bonuses"
                />
              </div>
              <Button
                type="button"
                onClick={onLockBonuses}
                className="mt-2.5 h-12 w-full gap-2 bg-[#f7b52b] text-sm font-black text-black hover:bg-[#e5a622]"
              >
                <Lock className="h-4 w-4" />
                Lock my bonuses & price
              </Button>
              <p className="mt-2 text-center text-[10px] font-semibold text-slate-500">
                WhatsApp number only — no calls unless you ask. The price stays visible either way.
              </p>
            </>
          )}
        </div>

        <Button
          type="button"
          onClick={() => onWhatsApp("builder_panel")}
          className="h-13 w-full gap-2 bg-[#25D366] py-3.5 text-base font-black text-white hover:bg-[#20bf5d]"
        >
          <MessageCircle className="h-5 w-5" />
          WhatsApp Sean this exact build
        </Button>
        <p className="text-center text-[10px] font-semibold text-slate-500">
          Opens WhatsApp with your setup and price pre-written — Sean confirms availability same day.
        </p>
      </div>
    </div>
  );
};
