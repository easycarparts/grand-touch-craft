import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import emailjs from "@emailjs/browser";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import PpfCostCalculatorWidget from "@/components/PpfCostCalculatorWidget";
import PpfQuoteSummary from "@/components/PpfQuoteSummary";
import { updatePageSEO } from "@/lib/seo";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.svg";
import stekWarrantySticker from "../../Landscape STEK Sticker.png";
import {
  ArrowRight,
  Check,
  ChevronDown,
  MessageCircle,
  Maximize2,
  Play,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Star,
  X,
} from "lucide-react";

type CalculatorSelection = {
  brand: "STEK" | "GYEON";
  warrantyYears: number;
  finish: "Gloss" | "Matte";
  size: "Sports" | "Small" | "Medium" | "SUV";
  coverage: "Front" | "Full Body";
  estimateMin: number;
  stekLine: string | null;
};

type QuoteModalFlow = "standard" | "calculator";
type StoredLeadProfile = {
  submitted: boolean;
  name: string;
  mobile: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: string;
  savedAt: string;
};

const LEAD_PROFILE_STORAGE_KEY = "ppf-dubai-quote-lead-v1";
const WHATSAPP_NUMBER = "971567191045";
const GOOGLE_ADS_SUBMIT_LEAD_SEND_TO = "AW-17684563059/5R6tCPbqo5kcEPOI1PBB";

const EMAILJS_SERVICE_ID = "service_f2na96a";
const EMAILJS_TEMPLATE_ID = "template_bs1inle";
const EMAILJS_PUBLIC_KEY = "PBrHmtX3m6KZRrwiC";
const TRUST_SECTION_VIDEO =
  "https://res.cloudinary.com/diw6rekpm/video/upload/q_auto/f_auto/v1775586709/0407_2_qvuqmp.mp4";
const WHY_STEK_VIDEO =
  "https://res.cloudinary.com/diw6rekpm/video/upload/q_auto/f_auto/v1775639271/0408_3_gjnsep.mp4";

/** Max movement (px) between down/up to count as a tap, not a scroll/drag. */
const WHY_STEK_TAP_SLOP_PX = 14;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: Array<Record<string, unknown>>;
  }
}

const GoogleWordmark = ({ className }: { className?: string }) => (
  <span aria-label="Google" className={cn("font-semibold tracking-tight", className)}>
    <span className="text-[#4285F4]">G</span>
    <span className="text-[#EA4335]">o</span>
    <span className="text-[#FBBC05]">o</span>
    <span className="text-[#4285F4]">g</span>
    <span className="text-[#34A853]">l</span>
    <span className="text-[#EA4335]">e</span>
  </span>
);

const TrustStars = ({ starClassName }: { starClassName?: string }) => (
  <div className="flex shrink-0 items-center gap-0.5 text-[#fbbc05] sm:gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star key={star} className={cn("h-4 w-4 fill-current", starClassName)} />
    ))}
  </div>
);

const VideoModalCard = ({
  title,
  description,
  videoSrc,
  posterSrc,
  eyebrow,
}: {
  title: string;
  description: string;
  videoSrc: string;
  posterSrc: string;
  eyebrow: string;
}) => (
  <div className="mt-4">
    <Dialog>
      <DialogTrigger asChild>
        <button type="button" className="block w-full text-left">
          <div className="overflow-hidden rounded-2xl border border-border/60 bg-black/30 transition hover:border-primary/40">
            <div className="relative aspect-video">
              <img
                src={posterSrc}
                alt={title}
                className="h-full w-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="inline-flex items-center rounded-full border border-white/20 bg-black/55 px-4 py-2 text-white shadow-2xl backdrop-blur-sm">
                  <span className="text-sm font-semibold">Play video</span>
                </div>
              </div>
              <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80">
                  {eyebrow}
                </span>
                <div className="rounded-full border border-white/15 bg-white/10 p-2 text-white backdrop-blur-sm">
                  <Maximize2 className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>
          </div>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-[420px] border-primary/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(18,18,18,0.96))] p-3 shadow-[0_30px_120px_rgba(0,0,0,0.6)] backdrop-blur-xl sm:p-4">
        <DialogHeader className="px-1">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="overflow-hidden rounded-2xl border border-primary/15 bg-black shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
          <video
            className="aspect-[9/16] h-auto w-full bg-black object-cover"
            controls
            playsInline
            preload="metadata"
            autoPlay
          >
            <source src={videoSrc} type="video/mp4" />
          </video>
        </div>
      </DialogContent>
    </Dialog>
  </div>
);

const formatAED = (value: number) => `AED ${value.toLocaleString("en-AE")}`;

const getCalculatorPackageLabel = (calculatorSelection: CalculatorSelection) => {
  return `${calculatorSelection.brand}${calculatorSelection.stekLine ? ` ${calculatorSelection.stekLine}` : ""} ${calculatorSelection.warrantyYears}-year`;
};

const buildWhatsAppUrl = (message: string) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

/**
 * Primary gold CTA — same gradient family as the hero headline, with explicit hover so
 * `Button`’s default `hover:bg-primary/90` does not flatten it to a duller solid.
 */
const primaryPpfCtaButtonClass =
  "border-0 !bg-[linear-gradient(180deg,#ffcc63_0%,#f7b52b_52%,#e79a13_100%)] !text-neutral-950 shadow-[0_12px_40px_rgba(247,181,43,0.28)] transition-all duration-200 ease-out hover:!bg-[linear-gradient(180deg,#ffd47a_0%,#f8bd3d_52%,#f2a318_100%)] hover:!text-neutral-950 hover:shadow-[0_18px_52px_rgba(247,181,43,0.36)] focus-visible:ring-2 focus-visible:ring-[#f7b52b]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.99] disabled:!opacity-60 disabled:active:scale-100";

/** Muted WhatsApp-adjacent green (less neon than official #25D366). */
const whatsappCtaButtonClass =
  "w-full border-0 bg-[#1f8350] text-white shadow-[0_12px_36px_rgba(31,131,80,0.22)] transition-all duration-200 ease-out hover:bg-[#278f5a] hover:text-white hover:shadow-[0_14px_44px_rgba(31,131,80,0.32)] focus-visible:text-white focus-visible:ring-2 focus-visible:ring-[#1f8350]/50 active:scale-[0.99] active:text-white";

/** Stronger hover so the hero WhatsApp CTA is obvious on rollover (still softer base green). */
const heroWhatsAppButtonClass =
  "w-full border-0 bg-[#1f8350] text-white shadow-[0_14px_40px_rgba(31,131,80,0.26)] transition-all duration-200 ease-out hover:scale-[1.02] hover:bg-[#2d9a63] hover:text-white hover:shadow-[0_22px_56px_rgba(31,131,80,0.4)] focus-visible:text-white focus-visible:ring-2 focus-visible:ring-[#1f8350]/55 active:scale-[0.99] active:text-white";

const smokeGlassPanelClass =
  "relative isolate overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.10),rgba(255,255,255,0.045)_18%,rgba(18,18,18,0.62)_42%,rgba(8,8,8,0.84)_100%)] shadow-[0_36px_120px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-[22px]";

const SectionCta = ({
  primaryLabel = "Get My PPF Quote",
  secondaryLabel = "Ask Sean on WhatsApp",
  onPrimaryClick,
  secondaryHref,
  onSecondaryClick,
  disabled = false,
  align = "left",
  note,
  className,
  /** Full-width stacked column (narrow cards). */
  stacked = false,
}: {
  primaryLabel?: string;
  secondaryLabel?: string;
  onPrimaryClick: () => void;
  /** Omit secondary to show only the primary CTA. */
  secondaryHref?: string;
  onSecondaryClick?: () => void;
  disabled?: boolean;
  align?: "left" | "center";
  note?: string;
  className?: string;
  stacked?: boolean;
}) => {
  const showSecondary = Boolean(secondaryHref && onSecondaryClick);

  return (
    <div className={cn("mt-7", align === "center" ? "text-center" : "", className)}>
      <div
        className={cn(
          "flex flex-col gap-3",
          showSecondary && !stacked ? "sm:flex-row" : "",
          showSecondary && !stacked && (align === "center" ? "sm:justify-center" : "sm:justify-start")
        )}
      >
        <Button
          size="lg"
          variant="default"
          className={cn(
            primaryPpfCtaButtonClass,
            "w-full",
            stacked ? "h-auto min-h-11 whitespace-normal py-3 sm:py-3" : showSecondary ? "sm:w-auto" : "sm:max-w-md"
          )}
          onClick={onPrimaryClick}
        >
          {primaryLabel}
          <ArrowRight className="ml-2 h-4 w-4 shrink-0" />
        </Button>
        {showSecondary ? (
          <a
            href={secondaryHref}
            target="_blank"
            rel="noreferrer"
            className={cn("w-full", stacked ? "" : "sm:w-auto")}
          >
            <Button
              type="button"
              variant="default"
              className={cn(
                whatsappCtaButtonClass,
                stacked && "h-auto min-h-11 whitespace-normal py-3 text-center leading-snug sm:py-3"
              )}
              size="lg"
              onClick={onSecondaryClick}
              disabled={disabled}
            >
              <MessageCircle className="mr-2 h-4 w-4 shrink-0" />
              {secondaryLabel}
            </Button>
          </a>
        ) : null}
      </div>
      {note ? (
        <p className={cn("mt-3 text-sm text-slate-400", align === "center" ? "mx-auto max-w-2xl" : "")}>
          {note}
        </p>
      ) : null}
    </div>
  );
};

const QuoteUnlockForm = ({
  variant,
  flow,
  formStep,
  formSubmitted,
  name,
  mobile,
  vehicleMake,
  vehicleModel,
  vehicleYear,
  phoneError,
  vehicleError,
  isSubmitting,
  vehicleSummary,
  onNameChange,
  onMobileChange,
  onVehicleMakeChange,
  onVehicleModelChange,
  onVehicleYearChange,
  onContinue,
  onBack,
  onSubmit,
  onOpenCalculator,
  whatsAppUrl,
  onWhatsAppClick,
  calculatorSelection,
  onCalculatorWhatsAppClick,
}: {
  variant: "modal" | "embedded";
  flow: QuoteModalFlow;
  formStep: 1 | 2 | 3;
  formSubmitted: boolean;
  name: string;
  mobile: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: string;
  phoneError: string;
  vehicleError: string;
  isSubmitting: boolean;
  vehicleSummary: string;
  onNameChange: (value: string) => void;
  onMobileChange: (value: string) => void;
  onVehicleMakeChange: (value: string) => void;
  onVehicleModelChange: (value: string) => void;
  onVehicleYearChange: (value: string) => void;
  onContinue: () => void;
  onBack: () => void;
  onSubmit: () => void;
  onOpenCalculator: () => void;
  whatsAppUrl: string;
  onWhatsAppClick: () => void;
  calculatorSelection: CalculatorSelection | null;
  onCalculatorWhatsAppClick: () => void;
}) => {
  const isModal = variant === "modal";
  const isCalculatorFlow = flow === "calculator";
  const step1CtaRef = useRef<HTMLDivElement>(null);
  const step2CtaRef = useRef<HTMLDivElement>(null);
  const flowSteps = isCalculatorFlow
    ? [
        { step: 1, label: "Contact" },
        { step: 2, label: "Vehicle" },
      ]
    : [
        { step: 1, label: "Contact" },
        { step: 2, label: "Vehicle" },
        { step: 3, label: "Unlock" },
      ];

  /**
   * Modal only: nudge the primary CTA inside the dialog when the on-screen keyboard resizes the
   * visual viewport. Embedded variant must not use this: (1) the lead form sits in an inner
   * `overflow-y-auto` layer, so `scrollIntoView` scrolls that layer and can crop the UI to a
   * single button; (2) `visualViewport.resize` also fires when the browser chrome shows/hides
   * during page scroll, which would fight normal scrolling if we called `scrollIntoView` from the
   * embedded instance (still mounted with shared state).
   */
  const scrollPrimaryCtaAboveKeyboard = useCallback(() => {
    if (typeof window === "undefined" || !isModal) return;
    if (window.matchMedia?.("(pointer: coarse)").matches !== true) return;

    const el =
      formStep === 1 ? step1CtaRef.current : formStep === 2 ? step2CtaRef.current : null;
    if (!el) return;

    const nudge = () => {
      el.scrollIntoView({ block: "end", behavior: "auto", inline: "nearest" });
    };

    requestAnimationFrame(() => {
      requestAnimationFrame(nudge);
    });
    window.setTimeout(nudge, 100);
    window.setTimeout(nudge, 320);
    window.setTimeout(nudge, 520);
  }, [formStep, isModal]);

  useEffect(() => {
    if (!isModal) return;
    if (typeof window === "undefined" || !window.visualViewport) return;
    if (window.matchMedia?.("(pointer: coarse)").matches !== true) return;
    if (formStep !== 1 && formStep !== 2) return;

    const vv = window.visualViewport;
    const onResize = () => {
      /** Ignore chrome-only resizes (e.g. address bar) so we do not scroll the open dialog spuriously. */
      if (vv.height >= window.innerHeight * 0.88) return;
      scrollPrimaryCtaAboveKeyboard();
    };
    vv.addEventListener("resize", onResize);
    return () => {
      vv.removeEventListener("resize", onResize);
    };
  }, [formStep, isModal, scrollPrimaryCtaAboveKeyboard]);

  return (
    <div className={cn(smokeGlassPanelClass, isModal ? "w-full" : "w-full max-w-2xl")}>
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-20 rounded-t-[32px] bg-[linear-gradient(180deg,rgba(255,255,255,0.08),transparent)]" />
        <div className="absolute -left-12 top-10 h-40 w-40 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute right-0 top-16 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="relative border-b border-white/10 px-5 pb-4 pt-5 sm:px-7">
        {isModal ? (
          <DialogClose
            type="button"
            className="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-black/50 text-white shadow-lg backdrop-blur-md transition hover:bg-black/70 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
            aria-label="Close estimate form"
          >
            <X className="h-5 w-5" strokeWidth={2.25} />
          </DialogClose>
        ) : null}
        {isCalculatorFlow && formStep === 3 ? (
          <div className={cn("flex items-center gap-3", isModal && "pr-11 sm:pr-12")}>
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-primary/20 bg-primary/12 text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-[11px] uppercase tracking-[0.24em] text-white/68">
              Your personalised quote
            </span>
          </div>
        ) : (
          <div className={cn("flex flex-wrap items-center gap-3", isModal && "pr-11 sm:pr-12")}>
            {flowSteps.map((item) => {
              const isActive = formStep === item.step;
              const isComplete = formSubmitted || formStep > item.step;

              return (
                <div key={item.step} className="flex items-center gap-2">
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold",
                      isActive
                        ? "border-white/15 bg-white/16 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]"
                        : isComplete
                          ? "border-white/12 bg-white/10 text-white/82"
                          : "border-white/10 bg-black/18 text-white/40"
                    )}
                  >
                    {isComplete && !isActive ? <Check className="h-4 w-4" /> : item.step}
                  </div>
                  <span
                    className={cn(
                      "text-[11px] uppercase tracking-[0.24em]",
                      isActive || isComplete ? "text-white/72" : "text-white/32"
                    )}
                  >
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="relative px-5 pb-5 pt-5 sm:px-7 sm:pb-7">
        {formStep === 1 ? (
          <div className="space-y-5 max-sm:pb-[min(42vh,260px)]">
            <div>
              <p className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Get My PPF Estimate
              </p>
              <p className="mt-2 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
                {isCalculatorFlow
                  ? "Name and number first. Keep this quick, then we reveal your personalised quote."
                  : "Name and number first. We keep this part short so the quote unlock feels fast."}
              </p>
            </div>

            <div className="grid gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-white/78">Name</label>
                <Input
                  value={name}
                  onChange={(event) => onNameChange(event.target.value)}
                  onFocus={isModal ? scrollPrimaryCtaAboveKeyboard : undefined}
                  placeholder="Your name"
                  autoComplete="name"
                  className="h-12 border-white/10 bg-[rgba(255,255,255,0.06)] text-white placeholder:text-white/35"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white/78">Mobile number</label>
                <Input
                  value={mobile}
                  onChange={(event) => onMobileChange(event.target.value)}
                  onFocus={isModal ? scrollPrimaryCtaAboveKeyboard : undefined}
                  placeholder="+971 50 123 4567"
                  inputMode="tel"
                  autoComplete="tel"
                  className="h-12 border-white/10 bg-[rgba(255,255,255,0.06)] text-white placeholder:text-white/35"
                />
                {phoneError ? <p className="mt-2 text-sm text-red-400">{phoneError}</p> : null}
              </div>
            </div>

            <div ref={step1CtaRef} className="scroll-mt-3">
              <Button className={cn(primaryPpfCtaButtonClass, "w-full")} size="lg" variant="default" onClick={onContinue}>
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : null}

        {formStep === 2 ? (
          <div className="space-y-5 max-sm:pb-[min(42vh,260px)]">
            <div>
              <p className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Tell us about your car
              </p>
              <p className="mt-2 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
                Add the make, model, and year so Sean gets something useful, not a vague lead.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-[1fr_1fr_120px]">
              <div>
                <label className="mb-2 block text-sm font-medium text-white/78">Make</label>
                <Input
                  value={vehicleMake}
                  onChange={(event) => onVehicleMakeChange(event.target.value)}
                  onFocus={isModal ? scrollPrimaryCtaAboveKeyboard : undefined}
                  placeholder="Porsche"
                  autoComplete="off"
                  className="h-12 border-white/10 bg-[rgba(255,255,255,0.06)] text-white placeholder:text-white/35"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white/78">Model</label>
                <Input
                  value={vehicleModel}
                  onChange={(event) => onVehicleModelChange(event.target.value)}
                  onFocus={isModal ? scrollPrimaryCtaAboveKeyboard : undefined}
                  placeholder="911 Turbo S"
                  autoComplete="off"
                  className="h-12 border-white/10 bg-[rgba(255,255,255,0.06)] text-white placeholder:text-white/35"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white/78">Year</label>
                <Input
                  value={vehicleYear}
                  onChange={(event) => onVehicleYearChange(event.target.value)}
                  onFocus={isModal ? scrollPrimaryCtaAboveKeyboard : undefined}
                  placeholder="2024"
                  inputMode="numeric"
                  autoComplete="off"
                  className="h-12 border-white/10 bg-[rgba(255,255,255,0.06)] text-white placeholder:text-white/35"
                />
              </div>
            </div>

            {vehicleError ? <p className="text-sm text-red-400">{vehicleError}</p> : null}

            <div ref={step2CtaRef} className="flex scroll-mt-3 flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full border-white/10 bg-[rgba(255,255,255,0.04)] text-white hover:bg-[rgba(255,255,255,0.07)] sm:w-auto"
                onClick={onBack}
              >
                Back
              </Button>
              <Button
                className={cn(primaryPpfCtaButtonClass, "w-full")}
                size="lg"
                variant="default"
                onClick={onSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Submitting your enquiry..."
                  : isCalculatorFlow
                    ? "Show My Quote"
                    : "Unlock My Estimate"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : null}

        {formStep === 3 ? (
          isCalculatorFlow && calculatorSelection ? (
            <div className="space-y-4">
              <div>
                <p className="text-[2rem] font-semibold tracking-tight text-white sm:text-[2.4rem]">
                  Your personalised quote
                </p>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                  Your setup and starting price, with the included value built in.
                </p>
              </div>

              <PpfQuoteSummary
                selection={calculatorSelection}
                vehicleSummary={vehicleSummary}
                onWhatsAppClick={onCalculatorWhatsAppClick}
              />
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <p className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  Your enquiry is in
                </p>
                <p className="mt-2 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
                  {isModal
                    ? "Thanks. Your details have been sent. Would you like to open the calculator and compare the options?"
                    : "We have your details and the calculator is now ready. You can compare finish, coverage, and warranty without leaving this section."}
                </p>
              </div>

              <div className="rounded-[26px] border border-white/10 bg-[rgba(255,255,255,0.05)] p-5">
                <p className="text-[11px] uppercase tracking-[0.24em] text-white/48">Lead captured</p>
                <p className="mt-3 text-lg font-medium text-white">{vehicleSummary}</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Sean now has your name, number, and vehicle details.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button className={cn(primaryPpfCtaButtonClass, "w-full")} size="lg" variant="default" onClick={onOpenCalculator}>
                  Open PPF Price Calculator
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <a href={whatsAppUrl} target="_blank" rel="noreferrer" className="w-full sm:w-auto">
                  <Button
                    type="button"
                    variant="default"
                    className={cn(whatsappCtaButtonClass, "w-full")}
                    size="lg"
                    onClick={onWhatsAppClick}
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Ask Sean on WhatsApp
                  </Button>
                </a>
              </div>
            </div>
          )
        ) : null}
      </div>
    </div>
  );
};

const PpfDubaiQuote = () => {
  const [heroFormOpen, setHeroFormOpen] = useState(false);
  const [quoteModalFlow, setQuoteModalFlow] = useState<QuoteModalFlow>("standard");
  const [formStep, setFormStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("+971");
  const [vehicleMake, setVehicleMake] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleYear, setVehicleYear] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [vehicleError, setVehicleError] = useState("");
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingCalculatorLead, setIsSendingCalculatorLead] = useState(false);
  const [isWhyStekPlaying, setIsWhyStekPlaying] = useState(false);
  const [selection, setSelection] = useState<CalculatorSelection | null>(null);
  const [calculatorPriceUnlocked, setCalculatorPriceUnlocked] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const hasTrackedFormStart = useRef(false);
  const lastTrackedQuoteSignature = useRef<string | null>(null);
  const calculatorRef = useRef<HTMLElement | null>(null);
  const isLocalTestingBypass =
    import.meta.env.DEV ||
    (typeof window !== "undefined" &&
      /^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname));

  /** Mobile Safari often ignores smooth scroll or runs before overlay unmount; use measured top + delayed retries. */
  const scrollToCalculatorSection = useCallback(() => {
    const el = calculatorRef.current;
    if (!el || typeof window === "undefined") return;
    const coarsePointer = window.matchMedia?.("(pointer: coarse)").matches === true;
    const offset = 12;
    const targetY = () => Math.max(0, el.getBoundingClientRect().top + window.scrollY - offset);

    const run = (behavior: ScrollBehavior) => {
      window.scrollTo({ top: targetY(), left: 0, behavior });
    };

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        run(coarsePointer ? "auto" : "smooth");
        if (coarsePointer) {
          window.setTimeout(() => run("auto"), 120);
          window.setTimeout(() => run("auto"), 380);
        }
      });
    });
  }, []);
  const trustSectionRef = useRef<HTMLElement | null>(null);
  const trustVideoRef = useRef<HTMLVideoElement | null>(null);
  const whyStekSectionRef = useRef<HTMLElement | null>(null);
  const whyStekVideoRef = useRef<HTMLVideoElement | null>(null);
  /** Dedupes pointerup + click (common on Chrome Android) so play() runs once. */
  const whyStekPlayGateRef = useRef(0);

  const utmParams = useMemo(() => {
    if (typeof window === "undefined") return {};
    const search = new URLSearchParams(window.location.search);
    return {
      utm_source: search.get("utm_source") || "",
      utm_medium: search.get("utm_medium") || "",
      utm_campaign: search.get("utm_campaign") || "",
      utm_term: search.get("utm_term") || "",
      utm_content: search.get("utm_content") || "",
      gclid: search.get("gclid") || "",
    };
  }, []);

  const vehicleSummary = useMemo(
    () => [vehicleYear.trim(), vehicleMake.trim(), vehicleModel.trim()].filter(Boolean).join(" "),
    [vehicleMake, vehicleModel, vehicleYear]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(LEAD_PROFILE_STORAGE_KEY);
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored) as StoredLeadProfile;
      if (!parsed.submitted) return;
      setName(parsed.name || "");
      setMobile(parsed.mobile || "+971");
      setVehicleMake(parsed.vehicleMake || "");
      setVehicleModel(parsed.vehicleModel || "");
      setVehicleYear(parsed.vehicleYear || "");
      setFormSubmitted(true);
    } catch (error) {
      console.warn("Failed to restore stored PPF lead profile", error);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !formSubmitted) return;
    const payload: StoredLeadProfile = {
      submitted: true,
      name,
      mobile,
      vehicleMake,
      vehicleModel,
      vehicleYear,
      savedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(LEAD_PROFILE_STORAGE_KEY, JSON.stringify(payload));
  }, [formSubmitted, mobile, name, vehicleMake, vehicleModel, vehicleYear]);

  const whatsAppUrl = useMemo(() => {
    const cleanVehicleSummary = vehicleSummary.trim();

    if (selection) {
      const packageLabel = getCalculatorPackageLabel(selection);
      const setupParts = [
        `${selection.finish.toLowerCase()} finish`,
        selection.coverage === "Full Body" ? "full body coverage" : "front coverage",
      ];

      const lines = cleanVehicleSummary
        ? [
            `Hi Sean, I’ve been looking at PPF for my ${cleanVehicleSummary} on the Grand Touch site.`,
            `I’m leaning towards ${packageLabel} with ${setupParts.join(" and ")}.`,
            calculatorPriceUnlocked
              ? `The starting price showed ${formatAED(selection.estimateMin)} plus VAT. Does that look like the right package for my car?`
              : "Could you let me know if that sounds like the right package for my car?",
          ]
        : [
            "Hi Sean, I’ve been looking at the PPF options on the Grand Touch site.",
            `I’m leaning towards ${packageLabel} with ${setupParts.join(" and ")}.`,
            calculatorPriceUnlocked
              ? `The starting price showed ${formatAED(selection.estimateMin)} plus VAT. Could you help me with the right package?`
              : "Could you help me choose the right package?",
          ];

      return buildWhatsAppUrl(lines.join(" "));
    }

    if (formSubmitted && cleanVehicleSummary) {
      return buildWhatsAppUrl(
        `Hi Sean, I’ve just sent my details through on the Grand Touch website for my ${cleanVehicleSummary}. I’d love your advice on the right PPF package for it when you have a moment.`
      );
    }

    return buildWhatsAppUrl(
      "Hi Sean, I’m looking at PPF for my car and wanted a quote from Grand Touch when you have a moment."
    );
  }, [calculatorPriceUnlocked, formSubmitted, selection, vehicleSummary]);

  const trackEvent = (eventName: string, payload: Record<string, unknown> = {}) => {
    if (typeof window === "undefined") return;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: eventName, ...payload });
    if (window.gtag) {
      window.gtag("event", eventName, payload);
    }
  };

  const trackGoogleAdsLeadConversion = () => {
    if (typeof window === "undefined" || !window.gtag) return;

    window.gtag("event", "conversion", {
      send_to: GOOGLE_ADS_SUBMIT_LEAD_SEND_TO,
      value: 1.0,
      currency: "AED",
    });
  };

  useEffect(() => {
    updatePageSEO("ppf-dubai-quote", {
      title: "PPF Dubai Quote | Grand Touch",
      description:
        "Get a Grand Touch PPF quote in Dubai with a short form, visual calculator, and direct WhatsApp follow-up from Sean.",
      keywords:
        "PPF Dubai quote, Grand Touch PPF Dubai, STEK PPF Dubai, premium PPF Dubai, full body PPF Dubai price",
      ogTitle: "PPF Dubai Quote | Grand Touch",
      ogDescription:
        "Premium PPF quote funnel for Dubai drivers with image-led calculator, Google review trust, and fast WhatsApp handoff.",
      url: "https://www.grandtouchauto.ae/ppf-dubai-quote",
    });

    trackEvent("page_view_funnel", {
      funnel_name: "ppf_dubai_quote",
      brand_focus: "Grand Touch",
      default_package: "STEK 10-year",
      ...utmParams,
    });
  }, [utmParams]);

  useEffect(() => {
    if (!heroFormOpen || quoteModalFlow !== "calculator" || formStep !== 3 || !selection) return;
    const signature = JSON.stringify([
      selection.brand,
      selection.stekLine,
      selection.warrantyYears,
      selection.size,
      selection.coverage,
      selection.finish,
      selection.estimateMin,
    ]);
    if (lastTrackedQuoteSignature.current === signature) return;
    lastTrackedQuoteSignature.current = signature;
    const packageLabel = `${selection.brand}${selection.stekLine ? ` ${selection.stekLine}` : ""} ${selection.warrantyYears}-year`;
    trackEvent("ppf_estimate_shown", {
      funnel_name: "ppf_dubai_quote",
      package_name: packageLabel,
      size: selection.size,
      coverage: selection.coverage,
      finish: selection.finish,
      estimate_value: selection.estimateMin,
      ...utmParams,
    });
  }, [formStep, heroFormOpen, quoteModalFlow, selection, utmParams]);

  useEffect(() => {
    const video = trustVideoRef.current;

    if (!video || typeof IntersectionObserver === "undefined") return;

    // Observe the video node (not the whole section). A tall section's intersection ratio
    // stays low on mobile while the clip is clearly visible, which falsely triggered pause.
    const playWhenRatio = 0.18;
    const pauseWhenRatio = 0.06;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!video) return;
        const ratio = entry.intersectionRatio;
        const mostlyVisible = entry.isIntersecting && ratio >= playWhenRatio;
        const mostlyHidden = !entry.isIntersecting || ratio < pauseWhenRatio;

        if (mostlyVisible) {
          if (video.paused) {
            video.play().catch(() => {
              // Ignore autoplay rejections if the browser is being strict.
            });
          }
        } else if (mostlyHidden) {
          video.pause();
        }
      },
      {
        threshold: [0, 0.05, 0.1, 0.15, 0.18, 0.25, 0.33, 0.5, 0.75, 1],
      }
    );

    observer.observe(video);

    return () => {
      observer.disconnect();
      video.pause();
    };
  }, []);

  const validatePhoneNumber = (value: string) => {
    const cleaned = value.replace(/[\s-]/g, "");
    return /^\+[0-9]{9,}$/.test(cleaned) && cleaned.length >= 10;
  };

  const trackFormStartIfNeeded = () => {
    if (hasTrackedFormStart.current) return;
    hasTrackedFormStart.current = true;
    trackEvent("ppf_quote_form_start", {
      funnel_name: "ppf_dubai_quote",
      ...utmParams,
    });
  };

  const sendLeadEmail = useCallback(
    async (payload: Record<string, string | number>, debugLabel: string) => {
      if (isLocalTestingBypass) {
        console.info(`[dev bypass] ${debugLabel}`, payload);
        return;
      }

      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        payload,
        EMAILJS_PUBLIC_KEY
      );
    },
    [isLocalTestingBypass]
  );

  const sendCalculatorRevealEmail = useCallback(
    async (calculatorSelection: CalculatorSelection) => {
      const packageLabel = getCalculatorPackageLabel(calculatorSelection);
      const estimateLabel = formatAED(calculatorSelection.estimateMin);

      await sendLeadEmail(
        {
          customer_name: name,
          customer_phone: mobile,
          vehicle_info: vehicleSummary,
          vehicle_size: calculatorSelection.size,
          service_name: "PPF Calculator Quote Reveal",
          service_category: "PPF Calculator",
          service_price: estimateLabel,
          final_price: estimateLabel,
          discount_code: `${calculatorSelection.coverage} | ${calculatorSelection.finish} | ${packageLabel}`,
          utm_source: utmParams.utm_source,
          utm_medium: utmParams.utm_medium,
          utm_campaign: utmParams.utm_campaign,
          utm_term: utmParams.utm_term,
          utm_content: utmParams.utm_content,
          gclid: utmParams.gclid,
          timestamp: new Date().toISOString(),
        },
        "calculator quote reveal"
      );
    },
    [mobile, name, sendLeadEmail, utmParams, vehicleSummary]
  );

  const handleStepOne = () => {
    trackFormStartIfNeeded();

    if (!name.trim()) return;

    if (!mobile.trim() || !validatePhoneNumber(mobile)) {
      setPhoneError("Use a valid international number, for example +971 50 123 4567.");
      return;
    }

    setPhoneError("");
    setFormStep(2);
  };

  const handleSubmit = async () => {
    trackFormStartIfNeeded();

    if (!vehicleMake.trim() || !vehicleModel.trim() || !vehicleYear.trim()) {
      setVehicleError("Add the make, model, and year so Sean can quote properly.");
      return;
    }

    if (!/^\d{4}$/.test(vehicleYear.trim())) {
      setVehicleError("Use a 4-digit year, for example 2024.");
      return;
    }

    setVehicleError("");
    setIsSubmitting(true);

    try {
      if (quoteModalFlow === "calculator" && selection) {
        await sendCalculatorRevealEmail(selection);
      } else {
        await sendLeadEmail(
          {
            customer_name: name,
            customer_phone: mobile,
            vehicle_info: vehicleSummary,
            service_name: "PPF Dubai Quote Lead",
            service_category: "PPF Quote Funnel",
            utm_source: utmParams.utm_source,
            utm_medium: utmParams.utm_medium,
            utm_campaign: utmParams.utm_campaign,
            utm_term: utmParams.utm_term,
            utm_content: utmParams.utm_content,
            gclid: utmParams.gclid,
            timestamp: new Date().toISOString(),
          },
          "standard quote lead"
        );
      }
    } catch (error) {
      console.error("Failed to send quote lead email:", error);
    } finally {
      setIsSubmitting(false);
      setFormSubmitted(true);
      if (quoteModalFlow === "calculator" && selection) {
        setCalculatorPriceUnlocked(true);
      }
      setFormStep(3);
      trackEvent("ppf_quote_form_submit", {
        funnel_name: "ppf_dubai_quote",
        vehicle: vehicleSummary,
        flow: quoteModalFlow,
        ...utmParams,
      });
      trackGoogleAdsLeadConversion();
    }
  };

  const handleWhatsAppClick = () => {
    const whatsappState = selection
      ? calculatorPriceUnlocked
        ? "calculator_quote"
        : "calculator_setup"
      : formSubmitted
        ? "known_lead"
        : "cold_start";

    trackEvent("ppf_whatsapp_click", {
      funnel_name: "ppf_dubai_quote",
      whatsapp_state: whatsappState,
      ...utmParams,
    });
  };

  const handleCalculatorWhatsApp = async (calculatorSelection: CalculatorSelection) => {
    const packageLabel = getCalculatorPackageLabel(calculatorSelection);
    const estimateLabel = formatAED(calculatorSelection.estimateMin);
    const cleanVehicleSummary = vehicleSummary.trim();
    const coverageLabel =
      calculatorSelection.coverage === "Full Body" ? "full body coverage" : "front coverage";
    const message = cleanVehicleSummary
      ? [
          `Hi Sean, I’ve just built a setup on your PPF calculator for my ${cleanVehicleSummary}.`,
          `I’m looking at ${packageLabel} with a ${calculatorSelection.finish.toLowerCase()} finish and ${coverageLabel}.`,
          `The starting price showed ${estimateLabel} plus VAT. Does that look like the right package for my car?`,
        ].join(" ")
      : [
          "Hi Sean, I’ve just built a setup on your PPF calculator.",
          `I’m looking at ${packageLabel} with a ${calculatorSelection.finish.toLowerCase()} finish and ${coverageLabel}.`,
          `The starting price showed ${estimateLabel} plus VAT. Could you help me with the right package?`,
        ].join(" ");

    setIsSendingCalculatorLead(true);
    try {
      await sendLeadEmail(
        {
          customer_name: name,
          customer_phone: mobile,
          vehicle_info: vehicleSummary,
          vehicle_size: calculatorSelection.size,
          service_name: "PPF Calculator WhatsApp Lead",
          service_category: "PPF Calculator",
          service_price: estimateLabel,
          final_price: estimateLabel,
          discount_code: `${calculatorSelection.coverage} | ${calculatorSelection.finish} | ${packageLabel}`,
          timestamp: new Date().toISOString(),
        },
        "calculator whatsapp lead"
      );
    } catch (error) {
      console.error("Failed to send calculator WhatsApp lead email:", error);
    } finally {
      setIsSendingCalculatorLead(false);
      trackEvent("ppf_whatsapp_click", {
        funnel_name: "ppf_dubai_quote",
        whatsapp_state: "calculator_quote",
        package_name: packageLabel,
        size: calculatorSelection.size,
        coverage: calculatorSelection.coverage,
        finish: calculatorSelection.finish,
        estimate_value: calculatorSelection.estimateMin,
        ...utmParams,
      });
      window.open(buildWhatsAppUrl(message), "_blank", "noopener,noreferrer");
    }
  };

  const openHeroForm = () => {
    trackFormStartIfNeeded();
    setQuoteModalFlow("standard");
    setFormStep(formSubmitted ? 3 : 1);
    setHeroFormOpen(true);
  };

  const openCalculatorQuoteModal = async () => {
    if (!selection) return;
    setQuoteModalFlow("calculator");

    if (formSubmitted) {
      setCalculatorPriceUnlocked(true);
      setFormStep(3);
      setHeroFormOpen(true);
      try {
        await sendCalculatorRevealEmail(selection);
      } catch (error) {
        console.error("Failed to send calculator reveal email:", error);
      }
      return;
    }

    setFormStep(1);
    setHeroFormOpen(true);
  };

  const handleModalOpenChange = (open: boolean) => {
    setHeroFormOpen(open);
  };

  const handleOpenCalculatorFromModal = () => {
    setHeroFormOpen(false);
    setFormStep(1);
    /** Radix dialog / mobile browsers often keep scroll locked briefly while the overlay closes;
     * run after that so scrollTo actually applies (see scrollToCalculatorSection retries). */
    window.setTimeout(() => scrollToCalculatorSection(), 280);
    window.setTimeout(() => scrollToCalculatorSection(), 520);
  };

  const faqItems = [
    {
      question: "Is full front enough, or should I go full body?",
      answer:
        "Full front works well if you mainly want the highest-impact areas protected and want to keep the spend tighter. Full body is the better fit if you want every painted panel covered, plan to keep the car longer, or simply do not want to leave the doors, quarters, and rear exposed. Sean can tell you very quickly which route makes more sense for your car.",
    },
    {
      question: "Should I choose gloss or matte PPF?",
      answer:
        "Gloss keeps the factory shine and is the right choice if you want the car to look clean, bright, and close to OEM. Matte gives the paint a satin finish and suits buyers who want a more deliberate, stealthier look. The right answer depends on the look you want the car to have every day, not just on delivery day.",
    },
    {
      question: "How long does PPF installation usually take?",
      answer:
        "That depends on the car, the coverage, and how much prep or correction is needed before film goes on. A smaller package can move faster, while full-body protection on a larger car takes longer because the prep and QC matter as much as the film itself. Sean can confirm realistic timing once he knows the car and the package you are considering.",
    },
    {
      question: "What does the quote already include?",
      answer:
        "The starting figure is not just film on paint. It already stacks in multi-stage paint correction, full interior and exterior detailing, headlights and door sill protection, leather ceramic, rim ceramic, and ongoing PPF inspection support. That is why the quote should be read as a complete package direction, not a stripped-back install price.",
    },
    {
      question: "Are the prices final, and do they include VAT?",
      answer:
        "The prices shown are starting figures and exclude VAT. Final pricing depends on the condition of the paint, the exact vehicle, and panel complexity once the car is inspected properly. The calculator is there to give you a realistic direction before Sean confirms the final package and price.",
    },
    {
      question: "How does the STEK warranty registration work?",
      answer:
        "After installation and the one-week check, the film is registered through the correct STEK process so the warranty is traceable to the actual material on the car. That matters because plenty of buyers are told they are getting premium film and warranty cover without ever seeing a proper registration trail.",
    },
    {
      question: "Can I message Sean before I decide?",
      answer:
        "Yes. If you are still comparing gloss versus matte, full front versus full body, or you just want a quick sense-check on the right package, you can go straight to WhatsApp and ask. That is exactly why the page keeps a direct Sean route open instead of forcing you through a sales handoff.",
    },
  ];

  useEffect(() => {
    const section = whyStekSectionRef.current;
    const video = whyStekVideoRef.current;
    if (!section || !video || typeof IntersectionObserver === "undefined") return;

    const onPlay = () => setIsWhyStekPlaying(true);
    const onPause = () => setIsWhyStekPlaying(false);
    const onEnded = () => {
      setIsWhyStekPlaying(false);
      video.currentTime = 0;
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Only pause when fully out of viewport; avoids mobile viewport jitter pauses.
        if (entry.intersectionRatio > 0) return;
        video.pause();
      },
      { threshold: [0] }
    );

    observer.observe(section);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("ended", onEnded);

    return () => {
      observer.disconnect();
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("ended", onEnded);
    };
  }, []);

  const handleWhyStekPlay = () => {
    const video = whyStekVideoRef.current;
    if (!video) return;
    const isAtEnd =
      video.ended ||
      (Number.isFinite(video.duration) && video.duration > 0 && video.currentTime >= video.duration - 0.2);
    if (isAtEnd) {
      video.currentTime = 0;
    }
    video.muted = false;
    void video.play().catch(() => {
      setIsWhyStekPlaying(false);
    });
  };

  const activateWhyStekPlay = () => {
    const t = Date.now();
    // Short window: touchend + synthetic click can fire ~50–300ms apart on Android Chrome.
    if (t - whyStekPlayGateRef.current < 120) return;
    whyStekPlayGateRef.current = t;
    handleWhyStekPlay();
  };

  const whyStekPlayOverlayRef = useRef<HTMLButtonElement | null>(null);
  const whyStekOverlayTouchStartRef = useRef<{ x: number; y: number } | null>(null);
  const activateWhyStekPlayRef = useRef(activateWhyStekPlay);
  activateWhyStekPlayRef.current = activateWhyStekPlay;

  const whyStekTogglePointerRef = useRef<{ x: number; y: number; pointerId: number } | null>(null);

  useEffect(() => {
    if (isWhyStekPlaying) return;
    const btn = whyStekPlayOverlayRef.current;
    if (!btn) return;
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      whyStekOverlayTouchStartRef.current = { x: t.clientX, y: t.clientY };
    };
    const onTouchEnd = (e: TouchEvent) => {
      const start = whyStekOverlayTouchStartRef.current;
      whyStekOverlayTouchStartRef.current = null;
      if (!start || e.changedTouches.length !== 1) return;
      const t = e.changedTouches[0];
      if (
        Math.abs(t.clientX - start.x) > WHY_STEK_TAP_SLOP_PX ||
        Math.abs(t.clientY - start.y) > WHY_STEK_TAP_SLOP_PX
      ) {
        return;
      }
      e.preventDefault();
      activateWhyStekPlayRef.current();
    };
    const onTouchCancel = () => {
      whyStekOverlayTouchStartRef.current = null;
    };
    btn.addEventListener("touchstart", onTouchStart, { passive: true });
    btn.addEventListener("touchend", onTouchEnd, { passive: false });
    btn.addEventListener("touchcancel", onTouchCancel);
    return () => {
      btn.removeEventListener("touchstart", onTouchStart);
      btn.removeEventListener("touchend", onTouchEnd);
      btn.removeEventListener("touchcancel", onTouchCancel);
    };
  }, [isWhyStekPlaying]);

  const handleWhyStekVideoPointerDown = (e: React.PointerEvent<HTMLVideoElement>) => {
    if (!isWhyStekPlaying) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    whyStekTogglePointerRef.current = { x: e.clientX, y: e.clientY, pointerId: e.pointerId };
  };

  const handleWhyStekVideoPointerUp = (e: React.PointerEvent<HTMLVideoElement>) => {
    if (!isWhyStekPlaying) return;
    const start = whyStekTogglePointerRef.current;
    whyStekTogglePointerRef.current = null;
    if (!start || start.pointerId !== e.pointerId) return;
    if (
      Math.abs(e.clientX - start.x) > WHY_STEK_TAP_SLOP_PX ||
      Math.abs(e.clientY - start.y) > WHY_STEK_TAP_SLOP_PX
    ) {
      return;
    }
    handleWhyStekToggle();
  };

  const handleWhyStekVideoPointerCancel = () => {
    whyStekTogglePointerRef.current = null;
  };

  const handleWhyStekToggle = () => {
    const video = whyStekVideoRef.current;
    if (!video) return;

    if (video.paused) {
      const isAtEnd =
        video.ended ||
        (Number.isFinite(video.duration) && video.duration > 0 && video.currentTime >= video.duration - 0.2);
      if (isAtEnd) {
        video.currentTime = 0;
      }
      video.muted = false;
      void video.play().catch(() => {
        setIsWhyStekPlaying(false);
      });
      return;
    }

    video.pause();
  };

  return (
    <div className="min-h-screen bg-background pb-32 text-foreground md:pb-0">
      <main>
        <section className="relative overflow-hidden border-b border-border/50 bg-[radial-gradient(circle_at_top,_hsl(38_92%_58%_/_0.09),_transparent_42%),radial-gradient(circle_at_15%_25%,rgba(245,158,11,0.04),transparent_34%),radial-gradient(circle_at_85%_20%,rgba(255,255,255,0.05),transparent_22%),linear-gradient(180deg,hsl(0_0%_8%)_0%,hsl(0_0%_5%)_100%)] px-0 pb-8 pt-10 sm:bg-[radial-gradient(circle_at_top,_hsl(38_92%_58%_/_0.24),_transparent_32%),radial-gradient(circle_at_15%_25%,rgba(245,158,11,0.12),transparent_26%),radial-gradient(circle_at_85%_20%,rgba(255,255,255,0.08),transparent_18%),linear-gradient(180deg,hsl(0_0%_8%)_0%,hsl(0_0%_5%)_100%)]">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-24 top-16 h-56 w-56 rounded-full bg-primary/8 blur-3xl sm:bg-primary/12" />
            <div className="absolute right-[-4rem] top-10 h-64 w-64 rounded-full bg-amber-200/[0.04] blur-3xl sm:bg-amber-200/10" />
            <div className="absolute bottom-[-4rem] left-1/3 h-40 w-40 rounded-full bg-white/5 blur-3xl" />
          </div>
          <div className="container mx-auto max-w-6xl">
            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start lg:gap-x-8 lg:gap-y-0">
              <div className="order-1 max-w-3xl lg:col-start-1 lg:row-start-1 lg:self-start">
                <Link
                  to="/"
                  className="inline-flex transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(0_0%_8%)]"
                  aria-label="Grand Touch Auto — home"
                >
                  <img src={logo} alt="Grand Touch" className="h-10 w-auto" />
                </Link>
                <div className="mt-6 flex flex-wrap gap-2">
                  <Badge variant="secondary" className="gap-2 border border-white/10 bg-white/8 px-3 py-1.5 shadow-sm backdrop-blur-sm">
                    <GoogleWordmark />
                    <span>4.9 stars</span>
                  </Badge>
                  <Badge variant="outline" className="border-white/15 bg-black/20 px-3 py-1.5 backdrop-blur-sm">
                    Warranty-registered STEK film
                  </Badge>
                </div>

                <h1 className="mt-6 flex max-w-3xl flex-col gap-1.5 text-4xl font-bold leading-snug tracking-tight sm:gap-1.5 sm:text-5xl sm:leading-tight md:gap-2 md:text-6xl">
                  <span className="text-white">PPF in Dubai</span>
                  <span className="text-white">you can trust.</span>
                  <span className="bg-[linear-gradient(180deg,#ffcc63_0%,#f7b52b_55%,#e79a13_100%)] bg-clip-text text-transparent drop-shadow-[0_8px_30px_rgba(247,181,43,0.15)]">
                    Direct with Sean. Installed properly.
                  </span>
                </h1>
                <p className="mt-4 max-w-2xl text-lg text-slate-300">
                  Get a clear PPF quote, choose the right coverage for your car, and deal directly with Sean from first message to final handover.
                </p>

                <div className="mt-6 flex flex-col gap-3">
                  <Dialog open={heroFormOpen} onOpenChange={handleModalOpenChange}>
                    <DialogTrigger asChild>
                      <Button size="lg" variant="default" className={cn(primaryPpfCtaButtonClass, "w-full")} onClick={openHeroForm}>
                        Get My PPF Estimate
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent
                      className={cn(
                        "flex max-h-[min(90dvh,920px)] min-h-0 w-[calc(100vw-1.25rem)] flex-col overflow-hidden overflow-x-hidden border-0 bg-transparent p-0 shadow-none outline-none focus-visible:outline-none sm:w-full [&>button]:hidden",
                        quoteModalFlow === "calculator" && formStep === 3 ? "max-w-4xl" : "max-w-2xl"
                      )}
                      onCloseAutoFocus={(event) => {
                        event.preventDefault();
                      }}
                    >
                      <div className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-y-auto [-webkit-overflow-scrolling:touch]">
                        <QuoteUnlockForm
                        variant="modal"
                        flow={quoteModalFlow}
                        formStep={formStep}
                        formSubmitted={formSubmitted}
                        name={name}
                        mobile={mobile}
                        vehicleMake={vehicleMake}
                        vehicleModel={vehicleModel}
                        vehicleYear={vehicleYear}
                        phoneError={phoneError}
                        vehicleError={vehicleError}
                        isSubmitting={isSubmitting}
                        vehicleSummary={vehicleSummary}
                        onNameChange={(value) => {
                          trackFormStartIfNeeded();
                          setName(value);
                        }}
                        onMobileChange={(value) => {
                          trackFormStartIfNeeded();
                          setMobile(value);
                          if (phoneError) setPhoneError("");
                        }}
                        onVehicleMakeChange={(value) => {
                          trackFormStartIfNeeded();
                          setVehicleMake(value);
                          if (vehicleError) setVehicleError("");
                        }}
                        onVehicleModelChange={(value) => {
                          trackFormStartIfNeeded();
                          setVehicleModel(value);
                          if (vehicleError) setVehicleError("");
                        }}
                        onVehicleYearChange={(value) => {
                          trackFormStartIfNeeded();
                          setVehicleYear(value.replace(/[^0-9]/g, "").slice(0, 4));
                          if (vehicleError) setVehicleError("");
                        }}
                        onContinue={handleStepOne}
                        onBack={() => setFormStep(1)}
                        onSubmit={handleSubmit}
                        onOpenCalculator={handleOpenCalculatorFromModal}
                        whatsAppUrl={whatsAppUrl}
                        onWhatsAppClick={handleWhatsAppClick}
                        calculatorSelection={selection}
                        onCalculatorWhatsAppClick={() => {
                          if (selection) {
                            void handleCalculatorWhatsApp(selection);
                          }
                        }}
                      />
                      </div>
                    </DialogContent>
                  </Dialog>

                  <a href={whatsAppUrl} target="_blank" rel="noreferrer" className="w-full">
                    <Button
                      type="button"
                      variant="default"
                      className={heroWhatsAppButtonClass}
                      size="lg"
                      onClick={handleWhatsAppClick}
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Ask Sean on WhatsApp
                    </Button>
                  </a>

                  {formSubmitted ? (
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full text-white/75 hover:bg-white/5 hover:text-white"
                      onClick={scrollToCalculatorSection}
                    >
                      Open price calculator
                    </Button>
                  ) : null}
                </div>

              </div>

              <div className="relative order-2 flex min-h-0 flex-col justify-end overflow-visible lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start">
                <div className="relative mx-auto flex w-full max-w-[480px] min-h-0 flex-col justify-end pb-0 pt-2">
                    <div className="relative mx-auto aspect-[9/19.5] w-full min-h-0 min-w-0 max-h-full max-w-[420px] shrink-0">
                      <div className="pointer-events-none absolute -left-[5px] top-[157px] z-20 h-[4.5rem] w-[4px] rounded-full bg-gradient-to-b from-white/55 via-white/15 to-white/35 shadow-[0_0_12px_rgba(255,255,255,0.16)]" />
                      <div className="pointer-events-none absolute -left-[5px] top-[250px] z-20 h-28 w-[4px] rounded-full bg-gradient-to-b from-white/45 via-white/12 to-white/30 shadow-[0_0_12px_rgba(255,255,255,0.14)]" />
                      <div className="pointer-events-none absolute -right-[5px] top-[219px] z-20 h-32 w-[4px] rounded-full bg-gradient-to-b from-white/45 via-white/12 to-white/30 shadow-[0_0_12px_rgba(255,255,255,0.14)]" />

                      <div className="relative flex h-full w-full flex-col rounded-[3.5rem] bg-[linear-gradient(150deg,#53565d_0%,#212328_12%,#070708_48%,#1f2126_78%,#6a7078_100%)] p-[11px] shadow-[0_45px_120px_rgba(0,0,0,0.62),0_10px_30px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.24),inset_0_-1px_0_rgba(255,255,255,0.10)]">
                        <div className="pointer-events-none absolute inset-[1px] rounded-[3.35rem] border border-white/12" />
                        <div className="pointer-events-none absolute inset-[8px] rounded-[3rem] border border-white/[0.07]" />

                        <div className="relative min-h-0 flex-1 overflow-hidden rounded-[2.95rem] bg-black shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]">
                          <div className="pointer-events-none absolute left-1/2 top-3 z-20 flex h-8 w-[168px] -translate-x-1/2 items-center justify-center rounded-full bg-[#050505] shadow-[0_2px_8px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.04)]">
                            <div className="h-1.5 w-12 rounded-full bg-[#141414]" />
                          </div>

                          <video
                            className="h-full w-full object-cover"
                            src="https://res.cloudinary.com/diw6rekpm/video/upload/q_auto/f_auto/v1775556526/Jetour_EDIT_yi001t.mp4"
                            autoPlay
                            muted
                            loop
                            playsInline
                            preload="auto"
                          />

                          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-start gap-3 bg-gradient-to-t from-black/90 via-black/32 to-transparent px-5 pb-6 pt-16">
                            <img
                              src="/stek-white-full.png"
                              alt="STEK"
                              className="h-16 w-auto max-w-[min(72%,13rem)] shrink-0 translate-y-5 self-start object-contain object-left opacity-95 drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)] sm:h-20 sm:translate-y-6 md:h-[5.25rem]"
                              loading="lazy"
                            />
                            <div className="w-full">
                              <p className="text-[11px] uppercase tracking-[0.24em] text-white/60">Grand Touch transformations</p>
                              <p className="mt-2 text-lg font-semibold leading-tight text-white">Premium finish. Trusted handover.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                </div>
              </div>

              <div className="order-3 w-full lg:col-start-1 lg:row-start-2 lg:mt-5 lg:self-start">
                <div className="grid gap-2 sm:grid-cols-3 sm:gap-2.5 sm:items-stretch">
                  <div className="flex flex-row items-center gap-3 rounded-xl border border-white/10 bg-[linear-gradient(180deg,rgba(66,133,244,0.08),rgba(255,255,255,0.03)_28%,rgba(255,255,255,0.02)_100%)] px-3 py-2.5 shadow-[0_20px_50px_rgba(0,0,0,0.25)] backdrop-blur-sm sm:flex-col sm:items-stretch sm:rounded-2xl sm:p-3 sm:py-3">
                    <div className="flex shrink-0 flex-col gap-1 sm:w-full sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
                      <GoogleWordmark className="text-[1.125rem] leading-none sm:text-[1.4rem]" />
                      <TrustStars starClassName="h-4 w-4 sm:h-[1.25rem] sm:w-[1.25rem]" />
                    </div>
                    <div className="min-w-0 flex-1 sm:mt-2 sm:flex-none">
                      <p className="text-[0.9375rem] font-semibold leading-tight text-white sm:text-sm">Trusted by real buyers</p>
                      <p className="mt-0.5 text-sm leading-snug text-slate-300 sm:mt-1 sm:max-w-[19ch] sm:text-[0.8125rem]">
                        Google proof from real Grand Touch handovers.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-row items-center gap-3 rounded-xl border border-primary/20 bg-[linear-gradient(180deg,rgba(245,158,11,0.11),rgba(255,255,255,0.03)_28%,rgba(255,255,255,0.02)_100%)] px-3 py-2.5 shadow-[0_20px_50px_rgba(0,0,0,0.28)] ring-1 ring-primary/10 backdrop-blur-sm sm:flex-col sm:items-stretch sm:rounded-2xl sm:p-3 sm:py-3">
                    <div className="flex shrink-0 items-center justify-start sm:w-full sm:justify-center sm:py-0.5">
                      <img
                        src="/stek-white-small.png"
                        alt="STEK"
                        className="h-7 w-auto max-w-[120px] object-contain object-left sm:h-9 sm:max-w-[140px]"
                        loading="lazy"
                      />
                    </div>
                    <div className="min-w-0 flex-1 sm:mt-2 sm:flex-none">
                      <p className="text-[0.9375rem] font-semibold leading-tight text-white sm:text-sm">Certified STEK installs</p>
                      <p className="mt-0.5 text-sm leading-snug text-slate-300 sm:mt-1 sm:max-w-[17ch] sm:text-[0.8125rem]">
                        Genuine STEK, fitted properly.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-row items-center gap-3 rounded-xl border border-white/10 bg-[linear-gradient(180deg,rgba(95,143,121,0.09),rgba(255,255,255,0.03)_28%,rgba(255,255,255,0.02)_100%)] px-3 py-2.5 shadow-[0_20px_50px_rgba(0,0,0,0.25)] backdrop-blur-sm sm:flex-col sm:items-stretch sm:rounded-2xl sm:p-3 sm:py-3">
                    <div className="flex shrink-0 items-center justify-start sm:w-full sm:justify-center sm:py-0.5">
                      <div
                        className="inline-flex max-w-[9.25rem] -rotate-[2deg] items-center gap-1.5 rounded-md border-2 border-white/30 bg-white px-1.5 py-1 text-black shadow-[0_6px_20px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-black/15 sm:max-w-[11.5rem] sm:-rotate-[3deg] sm:gap-2 sm:rounded-lg sm:px-2 sm:py-1.5"
                        role="img"
                        aria-label="Serial verification seal"
                      >
                        <span
                          aria-hidden
                          className="shrink-0 rounded bg-[#b73a2f] px-0.5 py-0.5 text-[5px] font-bold uppercase tracking-[0.1em] text-white sm:px-1 sm:text-[6px] sm:tracking-[0.12em]"
                        >
                          Seal
                        </span>
                        <div
                          aria-hidden
                          className="grid h-6 w-6 shrink-0 grid-cols-4 gap-px rounded-sm bg-black p-0.5 shadow-inner sm:h-7 sm:w-7"
                        >
                          {Array.from({ length: 16 }).map((_, index) => (
                            <span
                              key={index}
                              className={index % 3 === 0 ? "bg-white" : "bg-black"}
                            />
                          ))}
                        </div>
                        <div aria-hidden className="min-w-0 flex-1">
                          <p className="text-[6px] font-semibold uppercase leading-tight tracking-[0.08em] text-[#b73a2f] sm:text-[7px] sm:tracking-[0.1em]">
                            Serial verified
                          </p>
                          <div className="mt-0.5 h-0.5 rounded-sm bg-[repeating-linear-gradient(90deg,#111_0_1px,transparent_1px_2px)] sm:h-1" />
                        </div>
                        <img
                          src="/stek-logo.webp"
                          alt=""
                          className="h-2.5 w-auto shrink-0 object-contain opacity-80 invert sm:h-3"
                          loading="lazy"
                          aria-hidden
                        />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1 sm:mt-2 sm:flex-none">
                      <p className="text-[0.9375rem] font-semibold leading-tight text-white sm:text-sm">Warranty you can trace</p>
                      <p className="mt-0.5 text-sm leading-snug text-slate-300 sm:mt-1 sm:max-w-[18ch] sm:text-[0.8125rem]">
                        Serial-tracked and registered properly.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          ref={trustSectionRef}
          className="border-y border-border/50 bg-[radial-gradient(circle_at_18%_20%,rgba(245,181,43,0.07),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01))] px-0 py-14"
        >
          <div className="container mx-auto max-w-6xl">
            <div className="grid gap-8 lg:grid-cols-[0.88fr_1.12fr] lg:items-start lg:gap-10">
              <div className="order-2 lg:order-none">
                <div className="relative min-h-0 overflow-hidden rounded-[32px] border border-primary/15 bg-[radial-gradient(circle_at_50%_18%,rgba(245,181,43,0.16),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(10,10,10,0.92))] px-4 pt-7 shadow-[0_28px_90px_rgba(0,0,0,0.38)] sm:px-8 sm:pt-10">
                <div className="pointer-events-none absolute inset-0">
                  <div className="absolute left-1/2 top-16 h-56 w-56 -translate-x-1/2 rounded-full bg-primary/12 blur-3xl" />
                  <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/45 to-transparent" />
                </div>
                <div className="relative mb-7 overflow-hidden rounded-[28px] border border-white/10 bg-black/35 shadow-[0_20px_60px_rgba(0,0,0,0.35)] sm:mb-8">
                  <video
                    ref={trustVideoRef}
                    className="aspect-[4/5] h-auto w-full object-cover"
                    muted
                    loop
                    playsInline
                    preload="auto"
                    onEnded={(event) => {
                      event.currentTarget.currentTime = 0;
                      event.currentTarget.play().catch(() => {
                        // Ignore replay failures if the browser is being strict.
                      });
                    }}
                  >
                    <source src={TRUST_SECTION_VIDEO} type="video/mp4" />
                  </video>
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <div className="pointer-events-none absolute inset-x-5 bottom-5">
                    <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-white/65">
                    </p>
                    <p className="mt-2 max-w-[22ch] text-xl font-semibold leading-tight text-white sm:text-2xl">
                    See how Sean works
                    </p>
                  </div>
                </div>
                <div className="relative -mx-4 border-t border-white/10 bg-black/18 px-4 py-5 backdrop-blur-sm sm:-mx-8 sm:px-8">
                  <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-primary/80">
                    Deal Directly with Sean
                  </p>
                  <p className="mt-2 max-w-[28ch] text-sm leading-6 text-slate-300">
                  One conversation, one person accountable, and no vague handoff between sales and install.
                  </p>
                </div>

                <div className="px-4 pb-6 pt-0 sm:px-8">
                  <SectionCta stacked className="mt-6" onPrimaryClick={openHeroForm} />
                </div>
                </div>
              </div>

              <div className="order-1 lg:order-none">
                <div className="relative min-h-0 overflow-hidden rounded-[32px] border border-primary/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(12,12,12,0.96))] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.35)] sm:p-8">
                <div className="pointer-events-none absolute inset-0">
                  <div className="absolute -right-12 top-0 h-44 w-44 rounded-full bg-primary/8 blur-3xl" />
                  <div className="absolute -left-10 top-28 h-32 w-32 rounded-full bg-primary/6 blur-3xl" />
                </div>
                <div className="relative">
                  <p className="text-sm uppercase tracking-[0.26em] text-muted-foreground">
                    Why buyers trust Grand Touch
                  </p>
                  <h2 className="mt-3 flex max-w-xl flex-col gap-1 text-3xl font-bold leading-[0.98] text-white sm:gap-1.5 sm:text-4xl">
                    <span className="block">The film matters.</span>
                    <span className="block">Who you trust to fit it</span>
                    <span className="block bg-[linear-gradient(180deg,#ffcf6a_0%,#f7b52b_55%,#e79a13_100%)] bg-clip-text text-transparent drop-shadow-[0_10px_30px_rgba(247,181,43,0.16)]">
                      matters more.
                    </span>
                  </h2>
                  <div className="mt-6 max-w-[58ch] space-y-4 text-base leading-7 text-slate-300">
                    <p>People do not just buy film here. They buy confidence in the prep, the fitment, and the paperwork afterwards.</p>
                    <p className="text-[1.02rem] leading-8 text-white/92">
                      <span className="font-semibold text-[#f6c76d]">proper prep</span>,{" "}
                      <span className="font-semibold text-white">genuine STEK film</span>, and{" "}
                      <span className="font-semibold text-[#f6c76d]">
                        warranty registration done the right way
                      </span>
                      .
                    </p>
                  </div>

                  <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/6 px-4 py-2 text-xs font-medium uppercase tracking-[0.22em] text-[#f6c76d] shadow-[0_12px_35px_rgba(245,181,43,0.08)]">
                    <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_14px_rgba(245,181,43,0.7)]" />
                    Trust is built before the film goes on
                  </div>

                  <div className="mt-7 rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] p-[1px] shadow-[0_22px_60px_rgba(0,0,0,0.28)]">
                    <div className="rounded-[27px] bg-[linear-gradient(180deg,rgba(20,20,20,0.96),rgba(14,14,14,0.98))] px-5 sm:px-6">
                    <div className="py-5 sm:py-6">
                      <div className="flex items-start gap-4">
                        <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-primary shadow-[0_0_16px_rgba(245,181,43,0.6)]" />
                        <div className="min-w-0">
                          <p className="text-lg font-semibold text-white">
                            <span className="text-[#f6c76d]">British-owned.</span> Sean-led.
                          </p>
                          <p className="mt-1 text-sm leading-6 text-slate-300">
                          Straight advice, direct accountability, and a process Sean stands behind himself.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                    <div className="py-5 sm:py-6">
                      <div className="flex items-start gap-4">
                        <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-primary shadow-[0_0_16px_rgba(245,181,43,0.6)]" />
                        <div className="min-w-0">
                          <p className="text-lg font-semibold text-white">
                            No shortcuts in <span className="text-[#f6c76d]">prep.</span>
                          </p>
                          <p className="mt-1 text-sm leading-6 text-slate-300">
                          Good film still looks bad on badly prepared paint, so prep is treated as part of the product.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                    <div className="py-5 sm:py-6">
                      <div className="flex items-start gap-4">
                        <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-primary shadow-[0_0_16px_rgba(245,181,43,0.6)]" />
                        <div className="min-w-0">
                          <p className="text-lg font-semibold text-white">
                            Genuine film. <span className="text-[#f6c76d]">Verified warranty.</span>
                          </p>
                          <p className="mt-1 text-sm leading-6 text-slate-300">
                          The film on your car is scanned, registered, and traceable through the proper STEK process.
                          </p>
                        </div>
                      </div>
                    </div>
                    </div>
                  </div>

                  <div className="mt-7 rounded-[24px] border border-primary/15 bg-[linear-gradient(180deg,rgba(245,181,43,0.12),rgba(245,181,43,0.04))] px-5 py-4 shadow-[0_14px_40px_rgba(245,181,43,0.08)]">
                    <p className="text-center text-sm font-semibold tracking-[0.08em] text-[#f6c76d] sm:text-[0.95rem]">
                    Proper prep <span className="mx-2 text-primary/70">&bull;</span> Genuine film <span className="mx-2 text-primary/70">&bull;</span> Verified warranty
                    </p>
                  </div>
                </div>
              </div>
              </div>
            </div>
          </div>
        </section>

        <section
          ref={whyStekSectionRef}
          className="border-b border-border/50 bg-[radial-gradient(circle_at_75%_20%,rgba(245,181,43,0.08),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01))] px-0 py-14"
        >
          <div className="container mx-auto max-w-6xl">
            <div className="grid gap-7 lg:grid-cols-[1fr_0.92fr] lg:items-start">
              <div className="relative min-h-0 overflow-hidden rounded-[32px] border border-primary/15 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(12,12,12,0.96))] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.35)] sm:p-8">
                <div className="pointer-events-none absolute inset-0">
                  <div className="absolute -left-12 top-6 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
                  <div className="absolute right-0 top-16 h-32 w-32 rounded-full bg-white/5 blur-3xl" />
                </div>
                <div className="relative">
                  <p className="text-sm uppercase tracking-[0.26em] text-muted-foreground">
                    WHY WE USE STEK
                  </p>
                  <h2 className="mt-3 max-w-[20ch] text-3xl font-bold leading-[0.98] text-white sm:text-4xl">
                    The film on your car should match what you were promised.
                  </h2>
                  <p className="mt-5 max-w-[58ch] text-base leading-7 text-slate-300">
                    Grand Touch uses STEK because Sean can recommend it without caveats: genuine supply, registered warranty options, strong gloss and matte finishes, and coverage levels that make sense for real owners in Dubai.
                  </p>

                  <div className="mt-8 grid gap-4 sm:max-w-xl">
                    {[
                      {
                        title: "What we quote is what we fit.",
                        text: "The car gets genuine STEK film, correctly sourced and correctly registered.",
                      },
                      {
                        title: "Finish options that suit the car",
                        text: "Choose gloss to keep the OEM shine or matte for a more deliberate satin look.",
                      },
                      {
                        title: "Warranty options that match ownership",
                        text: "5, 10, and 12-year packages depending on budget, usage, and how long you plan to keep the car.",
                      },
                    ].map((item) => (
                      <div
                        key={item.title}
                        className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 shadow-[0_18px_40px_rgba(0,0,0,0.18)]"
                      >
                        <p className="text-base font-semibold text-white">{item.title}</p>
                        <p className="mt-1 text-sm leading-6 text-slate-300">{item.text}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 rounded-[24px] border border-primary/15 bg-[linear-gradient(180deg,rgba(245,181,43,0.12),rgba(245,181,43,0.04))] px-5 py-4 shadow-[0_14px_40px_rgba(245,181,43,0.08)]">
                    <p className="text-center text-sm font-semibold tracking-[0.08em] text-[#f6c76d] sm:text-[0.95rem]">
                      Genuine STEK <span className="mx-2 text-primary/70">&bull;</span> Real finish options{" "}
                      <span className="mx-2 text-primary/70">&bull;</span> Registered warranty
                    </p>
                  </div>

                  <SectionCta
                    stacked
                    className="mt-6"
                    onPrimaryClick={openHeroForm}
                    secondaryLabel="Ask Sean which package fits"
                  />
                </div>
              </div>

              <div className="relative mx-auto flex w-full max-w-[480px] min-h-0 flex-col pb-0 pt-2">
                <div className="relative mx-auto aspect-[9/19.5] w-full min-h-0 min-w-0 max-h-full max-w-[420px] shrink-0">
                  <div className="pointer-events-none absolute -left-[5px] top-[157px] z-20 h-[4.5rem] w-[4px] rounded-full bg-gradient-to-b from-white/55 via-white/15 to-white/35 shadow-[0_0_12px_rgba(255,255,255,0.16)]" />
                  <div className="pointer-events-none absolute -left-[5px] top-[250px] z-20 h-28 w-[4px] rounded-full bg-gradient-to-b from-white/45 via-white/12 to-white/30 shadow-[0_0_12px_rgba(255,255,255,0.14)]" />
                  <div className="pointer-events-none absolute -right-[5px] top-[219px] z-20 h-32 w-[4px] rounded-full bg-gradient-to-b from-white/45 via-white/12 to-white/30 shadow-[0_0_12px_rgba(255,255,255,0.14)]" />

                  <div className="relative flex h-full w-full flex-col rounded-[3.5rem] bg-[linear-gradient(150deg,#53565d_0%,#212328_12%,#070708_48%,#1f2126_78%,#6a7078_100%)] p-[11px] shadow-[0_45px_120px_rgba(0,0,0,0.62),0_10px_30px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.24),inset_0_-1px_0_rgba(255,255,255,0.10)]">
                    <div className="pointer-events-none absolute inset-[1px] rounded-[3.35rem] border border-white/12" />
                    <div className="pointer-events-none absolute inset-[8px] rounded-[3rem] border border-white/[0.07]" />

                    <div className="relative min-h-0 flex-1 overflow-hidden rounded-[2.95rem] bg-black shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]">
                      <div className="pointer-events-none absolute left-1/2 top-3 z-20 flex h-8 w-[168px] -translate-x-1/2 items-center justify-center rounded-full bg-[#050505] shadow-[0_2px_8px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.04)]">
                        <div className="h-1.5 w-12 rounded-full bg-[#141414]" />
                      </div>

                      <video
                        ref={whyStekVideoRef}
                        className={cn(
                          "h-full w-full object-cover",
                          isWhyStekPlaying ? "cursor-pointer touch-pan-y" : "pointer-events-none"
                        )}
                        src={WHY_STEK_VIDEO}
                        playsInline
                        preload="auto"
                        loop={false}
                        controls={false}
                        onPointerDown={handleWhyStekVideoPointerDown}
                        onPointerUp={handleWhyStekVideoPointerUp}
                        onPointerCancel={handleWhyStekVideoPointerCancel}
                      />
                      {!isWhyStekPlaying ? (
                        <button
                          ref={whyStekPlayOverlayRef}
                          type="button"
                          onClick={activateWhyStekPlay}
                          className="absolute inset-0 z-[100] flex touch-manipulation touch-pan-y items-center justify-center bg-black/18 transition hover:bg-black/10"
                          aria-label="Play Sean's video about why he chose STEK"
                        >
                          <span className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-black/60 px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(0,0,0,0.45)] backdrop-blur-md">
                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-black">
                              <Play className="ml-0.5 h-4 w-4 fill-current" />
                            </span>
                            Play with sound
                          </span>
                        </button>
                      ) : null}

                      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-start gap-3 bg-gradient-to-t from-black/90 via-black/32 to-transparent px-5 pb-6 pt-16">
                        <img
                          src="/stek-white-full.png"
                          alt="STEK"
                          className="h-16 w-auto max-w-[min(72%,13rem)] shrink-0 translate-y-5 self-start object-contain object-left opacity-95 drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)] sm:h-20 sm:translate-y-6 md:h-[5.25rem]"
                          loading="lazy"
                        />
                        <div className="w-full">
                          <p className="text-[11px] uppercase tracking-[0.24em] text-white/60">
                            Sean on why we use STEK
                          </p>
                          <p className="mt-2 max-w-[22ch] text-lg font-semibold leading-tight text-white">
                            Hear the reason directly from Sean.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-border/50 bg-card/30 px-0 py-12">
          <div className="container mx-auto max-w-6xl">
            <div className="mb-6">
              <p className="text-sm uppercase tracking-[0.25em] text-muted-foreground">
                Customer reviews & our work
              </p>
              <h2 className="mt-2 text-3xl font-bold">Real buyers, real handovers, real cars</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-3 md:items-stretch">
              <Card className="flex h-full flex-col border-[#4285F4]/20 bg-[linear-gradient(180deg,rgba(66,133,244,0.07),rgba(255,255,255,0.02)_22%,rgba(255,255,255,0.02)_100%)] p-4 sm:p-6">
                <div className="flex items-center gap-2">
                  <GoogleWordmark />
                  <span className="text-sm font-semibold">Reviews</span>
                </div>
                <div className="mt-3 flex items-center gap-2 text-primary">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-4 w-4 fill-current" />
                  ))}
                  <span className="text-sm font-semibold">5-star review</span>
                </div>
                <h3 className="mt-4 text-xl font-semibold">Mark | Zeekr 001</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  "Sean made the whole process easy, even from Abu Dhabi, and the finish came out amazing."
                </p>
                <div className="mt-auto">
                  <VideoModalCard
                    title="Mark's Zeekr 001"
                    description="A quick customer delivery clip showing the finished Zeekr 001 and the level of service behind it."
                    videoSrc="https://res.cloudinary.com/diw6rekpm/video/upload/q_auto/f_auto/v1775562589/Mark_Zeekr_conzdp.mp4"
                    posterSrc="/mark-zeekr-001.png"
                    eyebrow="Zeekr 001 PPF edit"
                  />
                </div>
              </Card>

              <Card className="flex h-full flex-col border-[#f59e0b]/20 bg-[linear-gradient(180deg,rgba(245,158,11,0.08),rgba(255,255,255,0.02)_24%,rgba(255,255,255,0.02)_100%)] p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <img
                    src="/stek-logo.webp"
                    alt="STEK official brand logo"
                    className="h-6 w-auto object-contain"
                    loading="lazy"
                  />
                  <span className="text-xs uppercase tracking-[0.18em] text-[#f6c76d]">
                    STEK certified installs
                  </span>
                </div>
                <h3 className="mt-4 text-xl font-semibold">Recent Grand Touch work</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Recent STEK installs across gloss and matte finishes, longer-term warranty packages, and full delivery-standard handovers.
                </p>
                <div className="mt-auto">
                  <VideoModalCard
                    title="Recent Grand Touch work"
                    description="A multi-car G700 showcase featuring STEK gloss and matte colour PPF installs, warranty-backed packages, and custom finish details."
                    videoSrc="https://res.cloudinary.com/diw6rekpm/video/upload/v1775556526/Jetour_EDIT_yi001t.mp4"
                    posterSrc="/g700-orange.png"
                    eyebrow="G700 | STEK gloss & matte"
                  />
                </div>
              </Card>

              <Card className="flex h-full flex-col border-[#5f8f79]/20 bg-[linear-gradient(180deg,rgba(95,143,121,0.09),rgba(255,255,255,0.02)_24%,rgba(255,255,255,0.02)_100%)] p-4 sm:p-6">
                <div className="mt-4 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="text-xl font-semibold">Matt Cooper</h3>
                    <p className="text-xs uppercase tracking-[0.18em] text-[#9dc3b0]">
                      Jetour T2 | Matte green colour PPF
                    </p>
                  </div>
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-border/60 bg-black/20">
                    <img
                      src="/matt-cooper-face.png"
                      alt="Matt Cooper"
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  "Great finish, smooth process, and a team I was happy to trust with my car."
                </p>
                <div className="mt-auto">
                  <VideoModalCard
                    title="Matt Cooper's Jetour T2"
                    description="A quick delivery clip showing Matt Cooper's matte green Jetour T2 colour PPF transformation."
                    videoSrc="https://res.cloudinary.com/diw6rekpm/video/upload/q_auto/f_auto/v1775563747/0407_xyaggw.mp4"
                    posterSrc="/matt-cooper-t2.png"
                    eyebrow="Jetour T2 matte green"
                  />
                </div>
              </Card>
            </div>

            <SectionCta
              primaryLabel="Get My PPF Quote"
              secondaryLabel="Ask Sean on WhatsApp"
              onPrimaryClick={openHeroForm}
              secondaryHref={whatsAppUrl}
              onSecondaryClick={handleWhatsAppClick}
              note="Seen the proof. Open the quote or ask Sean directly."
            />
          </div>
        </section>

        <section className="px-0 pb-24 pt-14 sm:pb-28">
          <div className="container mx-auto max-w-6xl">
            <div className="relative overflow-hidden rounded-[34px] border border-primary/12 bg-[radial-gradient(circle_at_top_left,rgba(245,181,43,0.1),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.035),rgba(10,10,10,0.98))] p-4 shadow-[0_28px_90px_rgba(0,0,0,0.28)] sm:p-7">
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute -left-16 top-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
                <div className="absolute right-0 top-8 h-32 w-32 rounded-full bg-white/5 blur-3xl" />
              </div>

              <div className="relative">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                  <div className="max-w-3xl">
                    <p className="text-sm uppercase tracking-[0.25em] text-muted-foreground">
                      Our process
                    </p>
                    <h2 className="mt-2 text-3xl font-bold leading-tight sm:text-4xl">
                      From decontamination to
                      <span className="bg-[linear-gradient(180deg,#ffcf6a_0%,#f7b52b_55%,#e79a13_100%)] bg-clip-text text-transparent">
                        {" "}verified warranty
                      </span>
                    </h2>
                    <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
                      A tighter 4-stage system with deep prep, controlled install, final finishing,
                      and a one-week recheck before your STEK warranty is registered.
                    </p>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[360px]">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-white/55">Prep first</p>
                      <p className="mt-1 text-sm font-semibold text-white">No film over bad paint</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-white/55">QC built in</p>
                      <p className="mt-1 text-sm font-semibold text-white">Reset if standards slip</p>
                    </div>
                    <div className="rounded-2xl border border-primary/20 bg-primary/8 px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-primary/80">Registered</p>
                      <p className="mt-1 text-sm font-semibold text-white">Traceable STEK warranty</p>
                    </div>
                  </div>
                </div>

                  <div className="mt-6 grid gap-4 lg:grid-cols-[0.96fr_1.04fr]">
                  <div className="grid grid-cols-1 gap-4">
                    <Card className="relative overflow-hidden border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(15,15,15,0.98))] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.24)] sm:p-5">
                      <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,rgba(245,181,43,0.8),rgba(245,181,43,0))]" />
                      <div className="flex items-start justify-between gap-4">
                        <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                          <Sparkles className="h-5 w-5" />
                        </div>
                        <div className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/65">
                          Stage 1
                        </div>
                      </div>
                      <h3 className="mt-4 text-lg font-semibold text-white">Prep and paint correction</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-300">
                        Fallout removal, foam wash, clay, edge decontamination, then correction to
                        remove swirls, haze, and scratches before film touches the car.
                      </p>
                    </Card>

                    <Card className="relative overflow-hidden border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(15,15,15,0.98))] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.24)] sm:p-5">
                      <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,rgba(245,181,43,0.8),rgba(245,181,43,0))]" />
                      <div className="flex items-start justify-between gap-4">
                        <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                          <ShieldCheck className="h-5 w-5" />
                        </div>
                        <div className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/65">
                          Stage 2
                        </div>
                      </div>
                      <h3 className="mt-4 text-lg font-semibold text-white">Install only after QC</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-300">
                        The team re-checks prep first. If cleanliness is off, we stop, reset, and
                        repeat stage one before installation begins.
                      </p>
                    </Card>

                    <Card className="relative overflow-hidden border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(15,15,15,0.98))] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.24)] sm:p-5">
                      <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,rgba(245,181,43,0.8),rgba(245,181,43,0))]" />
                      <div className="flex items-start justify-between gap-4">
                        <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                          <Star className="h-5 w-5" />
                        </div>
                        <div className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/65">
                          Stage 3
                        </div>
                      </div>
                      <h3 className="mt-4 text-lg font-semibold text-white">Final QC and handover finish</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-300">
                        Final quality control, plus rim ceramic and interior leather ceramic as part
                        of the delivery finish.
                      </p>
                    </Card>
                  </div>

                  <Card
                    id="speak-to-sean"
                    className="relative overflow-hidden border-primary/30 bg-[radial-gradient(circle_at_top_left,rgba(245,181,43,0.18),transparent_26%),linear-gradient(180deg,rgba(245,181,43,0.14),rgba(18,18,18,0.98))] p-5 shadow-[0_24px_80px_rgba(245,181,43,0.14)] sm:p-6"
                  >
                    <div className="pointer-events-none absolute inset-0">
                      <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-primary/12 blur-3xl" />
                    </div>

                    <div className="relative">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-start gap-4">
                          <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-black shadow-[0_12px_30px_rgba(245,181,43,0.28)]">
                            <ScanSearch className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm uppercase tracking-[0.2em] text-primary/85">
                              Stage 4 | Most important
                            </p>
                            <h3 className="mt-1 text-2xl font-semibold text-white">
                              One-week check + verified warranty
                            </h3>
                          </div>
                        </div>

                        <div className="inline-flex items-center gap-2 self-start rounded-full border border-primary/25 bg-black/20 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[#f6c76d]">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Traceable proof
                        </div>
                      </div>

                      <p className="mt-3 max-w-[56ch] text-sm leading-6 text-slate-100 sm:text-[0.98rem]">
                        After one week, we inspect the vehicle again, make sure everything has settled
                        properly, then register your STEK warranty online and deliver it by email with
                        full traceability.
                      </p>

                      <div className="mt-4 overflow-hidden rounded-[26px] border border-primary/25 bg-[linear-gradient(180deg,rgba(0,0,0,0.22),rgba(0,0,0,0.1))]">
                        <div className="grid gap-4 p-4 sm:grid-cols-[1.28fr_0.72fr] sm:items-center sm:p-5">
                          <div className="relative overflow-hidden rounded-2xl border border-white/12 bg-black/35">
                            <img
                              src={stekWarrantySticker}
                              alt="STEK tamper-proof warranty sticker with serial and scan details"
                              className="aspect-[4/2.55] h-full w-full object-cover"
                              loading="lazy"
                            />
                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
                          </div>

                          <div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#f6c76d]">
                              <ScanSearch className="h-3.5 w-3.5" />
                              Warranty proof
                            </div>
                            <p className="mt-3 text-base font-semibold text-white sm:text-lg">
                              Tamper-proof sticker linked to your film roll
                            </p>
                            <p className="mt-2 text-sm leading-5 text-slate-200">
                              Registered and traceable.
                            </p>
                          </div>
                        </div>
                      </div>

                      <SectionCta
                        stacked
                        className="mt-5"
                        onPrimaryClick={openHeroForm}
                        note="When you are ready, open Get My PPF Quote — same action as at the top of the page."
                      />
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          ref={calculatorRef}
          className="scroll-mt-6 border-t border-border/50 bg-[radial-gradient(circle_at_50%_0%,rgba(245,181,43,0.04),transparent_42%)] px-0 pb-16 pt-16 [overflow-anchor:none] sm:scroll-mt-8 sm:pb-20 sm:pt-20"
        >
          <div className="container mx-auto max-w-6xl">
            <div className="mb-8 overflow-hidden rounded-[34px] border border-primary/12 bg-[radial-gradient(circle_at_top_left,rgba(245,181,43,0.10),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.035),rgba(10,10,10,0.98))] p-6 shadow-[0_28px_90px_rgba(0,0,0,0.28)] sm:p-8">
              <p className="text-sm uppercase tracking-[0.25em] text-muted-foreground">PPF Configurator</p>
              <h2 className="mt-2 text-3xl font-bold leading-tight sm:text-4xl">
                Build the right setup for your car
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
                Choose the package, size, finish, and coverage openly. Reveal the estimate only when
                you are ready to send your details through to Sean.
              </p>
            </div>

            <div className="relative [overflow-anchor:none]">
              <div>
                <PpfCostCalculatorWidget
                  variant="embedded"
                  showIntro={false}
                  showBrandSelector={false}
                  showActionButtons={false}
                  priceUnlocked={calculatorPriceUnlocked}
                  brandOptions={["STEK"]}
                  defaultBrand="STEK"
                  defaultWarrantyYears={10}
                  vehicleSummary={vehicleSummary}
                  onSelectionChange={(nextSelection) => setSelection(nextSelection)}
                  onWhatsAppRequest={handleCalculatorWhatsApp}
                  onPriceUnlockRequest={() => {
                    void openCalculatorQuoteModal();
                  }}
                />
              </div>
            </div>
            {isSendingCalculatorLead ? (
              <p className="mt-4 text-sm text-slate-400">
                Sending your calculator setup to Sean before WhatsApp opens...
              </p>
            ) : null}
          </div>
        </section>

        <section className="border-y border-border/50 bg-[radial-gradient(circle_at_15%_20%,rgba(245,181,43,0.06),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01))] px-0 py-14">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center">
              <p className="text-sm uppercase tracking-[0.25em] text-muted-foreground">FAQ</p>
              <h2 className="mt-2 text-3xl font-bold sm:text-4xl">
                Questions serious buyers usually ask before booking
              </h2>
              <p className="mx-auto mt-3 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
                The calculator helps with setup choices. These answers handle the practical questions
                buyers usually want cleared up before they enquire.
              </p>
            </div>

            <div className="mt-8 grid gap-3">
              {faqItems.map((item, index) => {
                const isOpen = openFaqIndex === index;
                return (
                  <Card
                    key={item.question}
                    className="overflow-hidden border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(15,15,15,0.98))]"
                  >
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6 sm:py-5"
                      onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                      aria-expanded={isOpen}
                    >
                      <span className="text-base font-semibold text-white sm:text-lg">{item.question}</span>
                      <span
                        className={cn(
                          "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary transition-transform",
                          isOpen ? "rotate-180" : ""
                        )}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </span>
                    </button>
                    {isOpen ? (
                      <div className="border-t border-white/10 px-5 py-4 text-sm leading-7 text-slate-300 sm:px-6">
                        {item.answer}
                      </div>
                    ) : null}
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        <section className="px-0 py-16">
          <div className="container mx-auto max-w-5xl">
            <div className="relative overflow-hidden rounded-[34px] border border-primary/20 bg-[radial-gradient(circle_at_top,rgba(245,181,43,0.16),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(10,10,10,0.98))] px-6 py-10 text-center shadow-[0_28px_90px_rgba(0,0,0,0.35)] sm:px-10 sm:py-12">
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-1/2 top-0 h-40 w-40 -translate-x-1/2 rounded-full bg-primary/12 blur-3xl" />
                <div className="absolute -left-10 bottom-0 h-36 w-36 rounded-full bg-white/5 blur-3xl" />
                <div className="absolute -right-6 top-10 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />
              </div>

              <div className="relative">
                <p className="text-sm uppercase tracking-[0.25em] text-primary/80">Final step</p>
                <h2 className="mt-3 text-3xl font-bold leading-tight sm:text-5xl">
                  Ready to get the right PPF package for your car?
                </h2>
                <p className="mx-auto mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                  Open the quote, compare the setup, and message Sean directly if you want a fast recommendation before you book.
                </p>

                <SectionCta
                  primaryLabel="Get My PPF Quote"
                  secondaryLabel="Ask Sean on WhatsApp"
                  onPrimaryClick={openHeroForm}
                  secondaryHref={whatsAppUrl}
                  onSecondaryClick={handleWhatsAppClick}
                  align="center"
                  note="Fast quote. Direct Sean contact. No vague handoff."
                />
              </div>
            </div>
          </div>
        </section>

      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[rgba(8,8,8,0.88)] p-3 backdrop-blur-xl md:hidden">
        <a href={whatsAppUrl} target="_blank" rel="noreferrer" className="block">
          <Button
            type="button"
            variant="default"
            className={whatsappCtaButtonClass}
            size="lg"
            onClick={handleWhatsAppClick}
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Ask Sean on WhatsApp
          </Button>
        </a>
      </div>

      <div className="pointer-events-none fixed bottom-0 right-0 z-40 hidden overflow-visible md:block">
        <a
          href={whatsAppUrl}
          target="_blank"
          rel="noreferrer"
          onClick={handleWhatsAppClick}
          aria-label="Ask Sean on WhatsApp"
          className="group pointer-events-auto absolute bottom-0 right-6 z-0 block cursor-pointer"
        >
          <img
            src="/chat-to-sean.png"
            alt=""
            className="h-auto w-44 max-w-[min(260px,46vw)] origin-bottom-right object-contain object-bottom-right transition-transform duration-300 ease-out group-hover:scale-[1.18]"
            loading="lazy"
          />
        </a>
      </div>
    </div>
  );
};

export default PpfDubaiQuote;
