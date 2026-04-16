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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PpfCostCalculatorWidget from "@/components/PpfCostCalculatorWidget";
import PpfQuoteSummary from "@/components/PpfQuoteSummary";
import {
  captureLeadSnapshot,
  createFunnelTrackingContext,
  trackFunnelEvent,
} from "@/lib/funnel-analytics";
import { initTikTokPixel, trackTikTokSubmitForm } from "@/lib/tiktok-pixel";
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
type LandingPageVariant = "google" | "tiktok";
type StoredLeadProfile = {
  submitted: boolean;
  name: string;
  mobile: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: string;
  sessionId?: string;
  visitorId?: string;
  lastCompletedStep?: 1 | 2 | 3;
  savedAt: string;
};

type PhoneCountryOption = {
  dialCode: string;
  label: string;
  shortLabel: string;
};

const LEAD_PROFILE_STORAGE_KEY_BASE = "ppf-quote-lead-v1";
const WHATSAPP_NUMBER = "971567191045";
const GOOGLE_ADS_SUBMIT_LEAD_SEND_TO = "AW-17684563059/5R6tCPbqo5kcEPOI1PBB";
const DEFAULT_PHONE_COUNTRY_CODE = "971";
const CUSTOM_PHONE_COUNTRY_CODE_VALUE = "__custom_country_code__";
const PHONE_COUNTRY_OPTIONS: PhoneCountryOption[] = [
  { dialCode: "971", label: "UAE (+971)", shortLabel: "UAE" },
  { dialCode: "1", label: "US / Canada (+1)", shortLabel: "US/CA" },
  { dialCode: "44", label: "UK (+44)", shortLabel: "UK" },
  { dialCode: "91", label: "India (+91)", shortLabel: "India" },
  { dialCode: "92", label: "Pakistan (+92)", shortLabel: "Pakistan" },
  { dialCode: "20", label: "Egypt (+20)", shortLabel: "Egypt" },
  { dialCode: "962", label: "Jordan (+962)", shortLabel: "Jordan" },
  { dialCode: "961", label: "Lebanon (+961)", shortLabel: "Lebanon" },
  { dialCode: "966", label: "Saudi Arabia (+966)", shortLabel: "Saudi" },
  { dialCode: "974", label: "Qatar (+974)", shortLabel: "Qatar" },
];
const isPresetPhoneCountryCode = (value: string) => PHONE_COUNTRY_OPTIONS.some((option) => option.dialCode === value);

const EMAILJS_SERVICE_ID = "service_f2na96a";
const EMAILJS_TEMPLATE_ID = "template_bs1inle";
const EMAILJS_PUBLIC_KEY = "PBrHmtX3m6KZRrwiC";
const TRUST_SECTION_VIDEO =
  "https://res.cloudinary.com/diw6rekpm/video/upload/q_auto/f_auto/v1775906544/Customer_Hand_Over_phxbyt.mp4";
const WHY_STEK_VIDEO =
  "https://res.cloudinary.com/diw6rekpm/video/upload/q_auto/f_auto/v1775639271/0408_3_gjnsep.mp4";
/** Custom poster (public/) — replaces the browser’s default first-frame thumbnail. */
const WHY_STEK_POSTER = encodeURI("/Screenshot 2026-04-11 162409.png");

/** Max movement (px) between down/up to count as a tap, not a scroll/drag. */
const WHY_STEK_TAP_SLOP_PX = 14;
const SCROLL_DEPTH_MILESTONES = [25, 50, 75, 90] as const;
const VIDEO_PROGRESS_MILESTONES = [25, 50, 75, 95] as const;

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
const isValidPhoneNumber = (value: string) => {
  const cleaned = value.replace(/[\s-]/g, "");
  return /^\+[0-9]{9,}$/.test(cleaned) && cleaned.length >= 10;
};
const normalizePhoneLocalNumber = (value: string) => value.replace(/\D/g, "").replace(/^0+/, "");
const buildIntlPhoneNumber = (countryCode: string, localNumber: string) => {
  const cleanedCountryCode = countryCode.replace(/\D/g, "") || DEFAULT_PHONE_COUNTRY_CODE;
  const cleanedLocalNumber = normalizePhoneLocalNumber(localNumber);
  return cleanedLocalNumber ? `+${cleanedCountryCode}${cleanedLocalNumber}` : `+${cleanedCountryCode}`;
};
const parseIntlPhoneNumber = (value: string) => {
  const digits = value.replace(/\D/g, "");
  const matchedCountry =
    [...PHONE_COUNTRY_OPTIONS]
      .sort((a, b) => b.dialCode.length - a.dialCode.length)
      .find((option) => digits.startsWith(option.dialCode))?.dialCode ?? DEFAULT_PHONE_COUNTRY_CODE;

  const localDigits = digits.startsWith(matchedCountry)
    ? digits.slice(matchedCountry.length)
    : digits.replace(/^0+/, "");

  return {
    countryCode: matchedCountry,
    localNumber: localDigits,
  };
};

const buildVehicleLabel = ({
  vehicleMake,
  vehicleModel,
  vehicleYear,
}: {
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: string;
}) => [vehicleYear.trim(), vehicleMake.trim(), vehicleModel.trim()].filter(Boolean).join(" ");

const sanitizePhoneSignature = (value: string) => value.replace(/[\s-]/g, "");

const getCalculatorPackageLabel = (calculatorSelection: CalculatorSelection) => {
  return `${calculatorSelection.brand}${calculatorSelection.stekLine ? ` ${calculatorSelection.stekLine}` : ""} ${calculatorSelection.warrantyYears}-year`;
};

const buildWhatsAppUrl = (message: string) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
const buildWhatsAppAppUrl = (message: string) =>
  `whatsapp://send?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent(message)}`;
const extractWhatsAppMessage = (url: string) => {
  try {
    return new URL(url).searchParams.get("text") ?? "";
  } catch {
    return "";
  }
};
const isProbablyMobileDevice = () => {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(pointer: coarse)").matches === true ||
    /Android|iPhone|iPad|iPod/i.test(window.navigator.userAgent)
  );
};
const openWhatsAppUrl = (url: string) => {
  if (typeof window === "undefined") return;

  if (isProbablyMobileDevice()) {
    const appUrl = buildWhatsAppAppUrl(extractWhatsAppMessage(url));
    let fallbackTimer = 0;
    let cleanedUp = false;

    const cleanup = () => {
      if (cleanedUp) return;
      cleanedUp = true;
      if (fallbackTimer) {
        window.clearTimeout(fallbackTimer);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", cleanup);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        cleanup();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", cleanup, { once: true });

    fallbackTimer = window.setTimeout(() => {
      const shouldFallback = document.visibilityState === "visible";
      cleanup();
      if (shouldFallback) {
        window.location.assign(url);
      }
    }, 900);

    try {
      window.location.assign(appUrl);
      return;
    } catch {
      cleanup();
      window.location.assign(url);
      return;
    }
  }

  const popup = window.open(url, "_blank", "noopener,noreferrer");
  if (!popup) {
    window.location.assign(url);
  }
};

const landingPageCopy = {
  google: {
    funnelName: "ppf_dubai_quote",
    landingPageVariant: "google" as const,
    defaultSourcePlatform: "google",
    seoKey: "ppf-dubai-quote",
    seoTitle: "PPF Dubai Quote | Grand Touch",
    seoDescription:
      "Get a Grand Touch PPF quote in Dubai with a short form, visual calculator, and direct WhatsApp follow-up from Sean.",
    seoKeywords:
      "PPF Dubai quote, Grand Touch PPF Dubai, STEK PPF Dubai, premium PPF Dubai, full body PPF Dubai price",
    seoOgDescription:
      "Premium PPF quote funnel for Dubai drivers with image-led calculator, Google review trust, and fast WhatsApp handoff.",
    seoUrl: "https://www.grandtouchauto.ae/ppf-dubai-quote",
    tikTokContentName: "PPF Dubai Quote Funnel",
  },
  tiktok: {
    funnelName: "ppf_tiktok_quote",
    landingPageVariant: "tiktok" as const,
    defaultSourcePlatform: "tiktok",
    seoKey: "ppf-tiktok-quote",
    seoTitle: "PPF TikTok Quote | Grand Touch",
    seoDescription:
      "See your Grand Touch PPF price range in Dubai with a faster social-first quote flow and direct WhatsApp follow-up from Sean.",
    seoKeywords:
      "PPF TikTok quote Dubai, Grand Touch PPF Dubai, STEK PPF Dubai, TikTok PPF lead funnel Dubai",
    seoOgDescription:
      "TikTok-first PPF quote funnel for Dubai drivers with quick qualification, visual proof, and fast WhatsApp handoff.",
    seoUrl: "https://www.grandtouchauto.ae/ppf-tiktok-quote",
    tikTokContentName: "PPF TikTok Quote Funnel",
  },
} satisfies Record<
  LandingPageVariant,
  {
    funnelName: string;
    landingPageVariant: LandingPageVariant;
    defaultSourcePlatform: string;
    seoKey: string;
    seoTitle: string;
    seoDescription: string;
    seoKeywords: string;
    seoOgDescription: string;
    seoUrl: string;
    tikTokContentName: string;
  }
>;

/**
 * Primary gold CTA — same gradient family as the hero headline, with explicit hover so
 * `Button`’s default `hover:bg-primary/90` does not flatten it to a duller solid.
 */
const primaryPpfCtaButtonClass =
  "h-11 rounded-2xl border-0 !bg-[linear-gradient(180deg,#ffcc63_0%,#f7b52b_52%,#e79a13_100%)] px-5 text-[0.98rem] !text-neutral-950 shadow-[0_14px_44px_rgba(247,181,43,0.28)] transition-all duration-200 ease-out hover:!bg-[linear-gradient(180deg,#ffd47a_0%,#f8bd3d_52%,#f2a318_100%)] hover:!text-neutral-950 hover:shadow-[0_20px_54px_rgba(247,181,43,0.36)] focus-visible:ring-2 focus-visible:ring-[#f7b52b]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.99] disabled:!opacity-60 disabled:active:scale-100 sm:h-12 sm:px-6";

/** Muted WhatsApp-adjacent green (less neon than official #25D366). */
const whatsappCtaButtonClass =
  "w-full h-11 rounded-2xl border-0 bg-[#25D366] px-5 text-[0.98rem] text-white shadow-[0_18px_46px_rgba(37,211,102,0.28)] transition-all duration-200 ease-out hover:bg-[#1ebe5d] hover:text-white hover:shadow-[0_22px_56px_rgba(37,211,102,0.4)] focus-visible:text-white focus-visible:ring-2 focus-visible:ring-[#25D366]/50 active:scale-[0.99] active:text-white sm:h-12 sm:px-6";

/** Stronger hover so the hero WhatsApp CTA is obvious on rollover (still softer base green). */
const heroWhatsAppButtonClass =
  "w-full h-11 rounded-2xl border-0 bg-[#25D366] px-5 text-[0.98rem] text-white shadow-[0_18px_46px_rgba(37,211,102,0.28)] transition-all duration-200 ease-out hover:scale-[1.01] hover:bg-[#1ebe5d] hover:text-white hover:shadow-[0_22px_56px_rgba(37,211,102,0.4)] focus-visible:text-white focus-visible:ring-2 focus-visible:ring-[#25D366]/55 active:scale-[0.99] active:text-white sm:h-12 sm:px-6";

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
  const showSecondary = Boolean(onSecondaryClick);
  const secondaryButton = (
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
  );

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
            secondaryHref ? (
              <a
                href={secondaryHref}
                target="_blank"
                rel="noreferrer"
                className={cn("w-full", stacked ? "" : "sm:w-auto")}
              >
                {secondaryButton}
              </a>
            ) : (
              <div className={cn("w-full", stacked ? "" : "sm:w-auto")}>{secondaryButton}</div>
            )
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
  isWhatsAppGateActive,
  name,
  phoneCountryCode,
  phoneCountryCodeCustom,
  phoneLocalNumber,
  vehicleMake,
  vehicleModel,
  vehicleYear,
  phoneError,
  vehicleError,
  isSubmitting,
  vehicleSummary,
  onNameChange,
  onPhoneCountryCodeChange,
  onPhoneCountryCodeCustomChange,
  onPhoneLocalNumberChange,
  onVehicleMakeChange,
  onVehicleModelChange,
  onVehicleYearChange,
  onContinue,
  onBack,
  onSubmit,
  onOpenCalculator,
  whatsAppUrl,
  onWhatsAppClick,
  onSkipToWhatsApp,
  calculatorSelection,
  onCalculatorWhatsAppClick,
}: {
  variant: "modal" | "embedded";
  flow: QuoteModalFlow;
  formStep: 1 | 2 | 3;
  formSubmitted: boolean;
  isWhatsAppGateActive: boolean;
  name: string;
  phoneCountryCode: string;
  phoneCountryCodeCustom: string;
  phoneLocalNumber: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: string;
  phoneError: string;
  vehicleError: string;
  isSubmitting: boolean;
  vehicleSummary: string;
  onNameChange: (value: string) => void;
  onPhoneCountryCodeChange: (value: string) => void;
  onPhoneCountryCodeCustomChange: (value: string) => void;
  onPhoneLocalNumberChange: (value: string) => void;
  onVehicleMakeChange: (value: string) => void;
  onVehicleModelChange: (value: string) => void;
  onVehicleYearChange: (value: string) => void;
  onContinue: () => void;
  onBack: () => void;
  onSubmit: () => void;
  onOpenCalculator: () => void;
  whatsAppUrl: string;
  onWhatsAppClick: () => void;
  onSkipToWhatsApp: () => void;
  calculatorSelection: CalculatorSelection | null;
  onCalculatorWhatsAppClick: () => void;
}) => {
  const isModal = variant === "modal";
  const isCalculatorFlow = flow === "calculator";
  const step1CtaRef = useRef<HTMLDivElement>(null);
  const step2CtaRef = useRef<HTMLDivElement>(null);
  const isCustomPhoneCountryCode = !isPresetPhoneCountryCode(phoneCountryCode);
  const phoneCountrySelectValue = isCustomPhoneCountryCode ? CUSTOM_PHONE_COUNTRY_CODE_VALUE : phoneCountryCode;
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

      <div className="relative border-b border-white/10 px-4 pb-3.5 pt-4 sm:px-7 sm:pb-4 sm:pt-5">
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
          <div className={cn("flex flex-wrap items-center gap-2.5", isModal && "pr-11 sm:pr-12")}>
            {flowSteps.map((item) => {
              const isActive = formStep === item.step;
              const isComplete = formSubmitted || formStep > item.step;

              return (
                <div key={item.step} className="flex items-center gap-2">
                  <div
                    className={cn(
                      "flex h-7.5 w-7.5 items-center justify-center rounded-full border text-[11px] font-semibold sm:h-8 sm:w-8 sm:text-xs",
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
                      "text-[10px] uppercase tracking-[0.22em] sm:text-[11px] sm:tracking-[0.24em]",
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

      <div className="relative px-4 pb-4 pt-4 sm:px-7 sm:pb-7 sm:pt-5">
        {formStep === 1 ? (
          <div className="space-y-4">
            <div>
              <p className="text-[2rem] font-semibold tracking-tight text-white sm:text-4xl">
                Get My PPF Estimate
              </p>
              <p className="mt-1.5 max-w-xl text-[0.95rem] leading-6 text-slate-300 sm:mt-2 sm:text-base sm:leading-7">
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
                  className="h-11 rounded-xl border-white/10 bg-[rgba(255,255,255,0.06)] text-[0.98rem] text-white placeholder:text-white/35 sm:h-12"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white/78">Mobile number</label>
                <div className="grid grid-cols-[122px_minmax(0,1fr)] gap-2.5">
                  <Select
                    value={phoneCountrySelectValue}
                    onValueChange={(value) => {
                      if (value === CUSTOM_PHONE_COUNTRY_CODE_VALUE) {
                        onPhoneCountryCodeChange(phoneCountryCodeCustom);
                        return;
                      }
                      onPhoneCountryCodeChange(value);
                    }}
                  >
                    <SelectTrigger className="h-11 rounded-xl border-white/10 bg-[rgba(255,255,255,0.06)] px-3 text-[0.95rem] text-white focus:ring-primary/40 focus:ring-offset-0 sm:h-12">
                      <SelectValue placeholder="+971" />
                    </SelectTrigger>
                    <SelectContent className="border-white/10 bg-[#121212] text-white">
                      {PHONE_COUNTRY_OPTIONS.map((option) => (
                        <SelectItem key={option.dialCode} value={option.dialCode} className="text-white focus:bg-white/10 focus:text-white">
                          {option.label}
                        </SelectItem>
                      ))}
                      <SelectItem
                        value={CUSTOM_PHONE_COUNTRY_CODE_VALUE}
                        className="text-white focus:bg-white/10 focus:text-white"
                      >
                        Other (enter manually)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    value={phoneLocalNumber}
                    onChange={(event) => onPhoneLocalNumberChange(event.target.value)}
                    onFocus={isModal ? scrollPrimaryCtaAboveKeyboard : undefined}
                    placeholder="50 123 4567"
                    inputMode="tel"
                    autoComplete="tel-national"
                    className="h-11 rounded-xl border-white/10 bg-[rgba(255,255,255,0.06)] text-[0.98rem] text-white placeholder:text-white/35 sm:h-12"
                  />
                </div>
                {isCustomPhoneCountryCode ? (
                  <div className="mt-2.5">
                    <Input
                      value={phoneCountryCodeCustom}
                      onChange={(event) => onPhoneCountryCodeCustomChange(event.target.value)}
                      onFocus={isModal ? scrollPrimaryCtaAboveKeyboard : undefined}
                      placeholder="Country code (e.g. 353)"
                      inputMode="numeric"
                      autoComplete="off"
                      className="h-11 rounded-xl border-white/10 bg-[rgba(255,255,255,0.06)] text-[0.95rem] text-white placeholder:text-white/35 sm:h-12"
                    />
                  </div>
                ) : null}
                <p className="mt-2 text-xs leading-5 text-slate-400">
                  Country code stays included for the CRM. Enter the number without the leading 0.
                </p>
                {phoneError ? <p className="mt-2 text-sm text-red-400">{phoneError}</p> : null}
              </div>
            </div>

            <div ref={step1CtaRef} className="scroll-mt-3">
              <Button className={cn(primaryPpfCtaButtonClass, "w-full")} size="lg" variant="default" onClick={onContinue}>
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              {isWhatsAppGateActive ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="mt-2.5 h-auto w-full whitespace-normal px-3 py-2.5 text-center text-[0.95rem] leading-snug rounded-xl border border-[#25D366]/35 bg-[#25D366]/10 text-[#d7ffe9] hover:bg-[#25D366]/20 hover:text-white sm:whitespace-nowrap"
                  onClick={onSkipToWhatsApp}
                >
                  In a hurry? Skip and talk to Sean on WhatsApp
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}

        {formStep === 2 ? (
          <div className="space-y-4">
            <div>
              <p className="text-[2rem] font-semibold tracking-tight text-white sm:text-4xl">
                Tell us about your car
              </p>
              <p className="mt-1.5 max-w-xl text-[0.95rem] leading-6 text-slate-300 sm:mt-2 sm:text-base sm:leading-7">
                Add the make, model, and year so Sean gets something useful, not a vague lead.
              </p>
            </div>

            <div className="grid gap-3.5 sm:grid-cols-[1fr_1fr_120px] sm:gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-white/78">Make</label>
                <Input
                  value={vehicleMake}
                  onChange={(event) => onVehicleMakeChange(event.target.value)}
                  onFocus={isModal ? scrollPrimaryCtaAboveKeyboard : undefined}
                  placeholder="Porsche"
                  autoComplete="off"
                  className="h-11 rounded-xl border-white/10 bg-[rgba(255,255,255,0.06)] text-[0.98rem] text-white placeholder:text-white/35 sm:h-12"
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
                  className="h-11 rounded-xl border-white/10 bg-[rgba(255,255,255,0.06)] text-[0.98rem] text-white placeholder:text-white/35 sm:h-12"
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
                  className="h-11 rounded-xl border-white/10 bg-[rgba(255,255,255,0.06)] text-[0.98rem] text-white placeholder:text-white/35 sm:h-12"
                />
              </div>
            </div>

            {vehicleError ? <p className="text-sm text-red-400">{vehicleError}</p> : null}

            <div ref={step2CtaRef} className="flex scroll-mt-3 flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full rounded-xl border-white/10 bg-[rgba(255,255,255,0.04)] text-white hover:bg-[rgba(255,255,255,0.07)] sm:w-auto"
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
            {isWhatsAppGateActive ? (
              <Button
                type="button"
                variant="ghost"
                className="h-auto w-full whitespace-normal px-3 py-2.5 text-center text-[0.95rem] leading-snug rounded-xl border border-[#25D366]/35 bg-[#25D366]/10 text-[#d7ffe9] hover:bg-[#25D366]/20 hover:text-white sm:whitespace-nowrap"
                onClick={onSkipToWhatsApp}
              >
                In a hurry? Skip and talk to Sean on WhatsApp
              </Button>
            ) : null}
          </div>
        ) : null}

        {formStep === 3 ? (
          isCalculatorFlow && calculatorSelection ? (
            <div className="space-y-4">
              <div>
                <p className="text-[1.85rem] font-semibold tracking-tight text-white sm:text-[2.4rem]">
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
                <p className="text-[2rem] font-semibold tracking-tight text-white sm:text-4xl">
                  Your enquiry is in
                </p>
                <p className="mt-1.5 max-w-xl text-[0.95rem] leading-6 text-slate-300 sm:mt-2 sm:text-base sm:leading-7">
                  {isModal
                    ? "Thanks. Your details have been sent. Would you like to open the calculator and compare the options?"
                    : "We have your details and the calculator is now ready. You can compare finish, coverage, and warranty without leaving this section."}
                </p>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-[rgba(255,255,255,0.05)] p-4 sm:p-5">
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

const PpfDubaiQuote = ({ variant = "google" }: { variant?: LandingPageVariant }) => {
  const variantConfig = landingPageCopy[variant];
  const leadProfileStorageKey = `${LEAD_PROFILE_STORAGE_KEY_BASE}-${variantConfig.landingPageVariant}`;
  const [heroFormOpen, setHeroFormOpen] = useState(false);
  const [quoteModalFlow, setQuoteModalFlow] = useState<QuoteModalFlow>("standard");
  const [formStep, setFormStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState("");
  const [phoneCountryCode, setPhoneCountryCode] = useState(DEFAULT_PHONE_COUNTRY_CODE);
  const [phoneCountryCodeCustom, setPhoneCountryCodeCustom] = useState("");
  const [phoneLocalNumber, setPhoneLocalNumber] = useState("");
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
  const [showMobileStickyCta, setShowMobileStickyCta] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [pendingWhatsAppPlacement, setPendingWhatsAppPlacement] = useState<string | null>(null);
  const pendingWhatsAppPlacementRef = useRef<string | null>(null);

  const hasTrackedFormStart = useRef(false);
  const hasTrackedConfiguratorStart = useRef(false);
  const lastTrackedQuoteSignature = useRef<string | null>(null);
  const lastTrackedContactSignature = useRef<string | null>(null);
  const lastTrackedVehicleSignature = useRef<string | null>(null);
  const calculatorRef = useRef<HTMLElement | null>(null);
  /**
   * Lead notifications go through Telegram/backend now; EmailJS is opt-in for debugging.
   * Set VITE_SEND_FUNNEL_EMAILS=true to re-enable outbound template emails.
   */
  const funnelEmailsEnabled = import.meta.env.VITE_SEND_FUNNEL_EMAILS === "true";

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
  const heroSectionRef = useRef<HTMLElement | null>(null);
  const trustSectionRef = useRef<HTMLElement | null>(null);
  const trustVideoRef = useRef<HTMLVideoElement | null>(null);
  const whyStekSectionRef = useRef<HTMLElement | null>(null);
  const whyStekVideoRef = useRef<HTMLVideoElement | null>(null);
  const sectionVisibleSinceRef = useRef<Map<string, number>>(new Map());
  const sectionTotalMsRef = useRef<Map<string, number>>(new Map());
  const sectionSeenRef = useRef<Set<string>>(new Set());
  const sessionStartedAtRef = useRef(Date.now());
  const maxScrollDepthRef = useRef(0);
  const scrollMilestonesTrackedRef = useRef<Set<number>>(new Set());
  const whyStekVideoMilestonesTrackedRef = useRef<Set<number>>(new Set());
  const whyStekVideoMaxPercentRef = useRef(0);
  const lastPageCheckpointAtRef = useRef(0);
  /** Dedupes pointerup + click (common on Chrome Android) so play() runs once. */
  const whyStekPlayGateRef = useRef(0);
  const funnelContext = useMemo(
    () =>
      createFunnelTrackingContext({
        funnelName: variantConfig.funnelName,
        landingPageVariant: variantConfig.landingPageVariant,
        defaultSourcePlatform: variantConfig.defaultSourcePlatform,
      }),
    [variantConfig.defaultSourcePlatform, variantConfig.funnelName, variantConfig.landingPageVariant]
  );
  const utmParams = funnelContext.attribution;
  const mobile = useMemo(
    () => buildIntlPhoneNumber(phoneCountryCode, phoneLocalNumber),
    [phoneCountryCode, phoneLocalNumber]
  );

  const vehicleSummary = useMemo(
    () => [vehicleYear.trim(), vehicleMake.trim(), vehicleModel.trim()].filter(Boolean).join(" "),
    [vehicleMake, vehicleModel, vehicleYear]
  );
  const hasValidContactDetails = useMemo(
    () => Boolean(name.trim()) && isValidPhoneNumber(mobile),
    [mobile, name]
  );
  const hasValidVehicleDetails = useMemo(
    () =>
      Boolean(vehicleMake.trim()) &&
      Boolean(vehicleModel.trim()) &&
      /^\d{4}$/.test(vehicleYear.trim()),
    [vehicleMake, vehicleModel, vehicleYear]
  );
  const getResumeFormStep = useCallback((): 1 | 2 | 3 => {
    if (formSubmitted) return 3;
    if (hasValidContactDetails) return 2;
    return 1;
  }, [formSubmitted, hasValidContactDetails]);
  const contactSignature = useMemo(() => {
    if (!hasValidContactDetails) return "";
    return `${name.trim().toLowerCase()}|${sanitizePhoneSignature(mobile)}`;
  }, [hasValidContactDetails, mobile, name]);
  const vehicleSignature = useMemo(() => {
    if (!hasValidContactDetails || !hasValidVehicleDetails) return "";
    return [
      name.trim().toLowerCase(),
      sanitizePhoneSignature(mobile),
      vehicleMake.trim().toLowerCase(),
      vehicleModel.trim().toLowerCase(),
      vehicleYear.trim(),
    ].join("|");
  }, [hasValidContactDetails, hasValidVehicleDetails, mobile, name, vehicleMake, vehicleModel, vehicleYear]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(leadProfileStorageKey);
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored) as StoredLeadProfile;
      const parsedPhone = parseIntlPhoneNumber(parsed.mobile || `+${DEFAULT_PHONE_COUNTRY_CODE}`);
      setName(parsed.name || "");
      setPhoneCountryCode(parsedPhone.countryCode);
      setPhoneCountryCodeCustom(isPresetPhoneCountryCode(parsedPhone.countryCode) ? "" : parsedPhone.countryCode);
      setPhoneLocalNumber(parsedPhone.localNumber);
      setVehicleMake(parsed.vehicleMake || "");
      setVehicleModel(parsed.vehicleModel || "");
      setVehicleYear(parsed.vehicleYear || "");
      setFormSubmitted(Boolean(parsed.submitted));
      if (parsed.name && parsed.mobile && isValidPhoneNumber(parsed.mobile)) {
        lastTrackedContactSignature.current = `${parsed.name.trim().toLowerCase()}|${sanitizePhoneSignature(parsed.mobile)}`;
      }
      if (
        parsed.name &&
        parsed.mobile &&
        parsed.vehicleMake &&
        parsed.vehicleModel &&
        /^\d{4}$/.test(parsed.vehicleYear || "")
      ) {
        lastTrackedVehicleSignature.current = [
          parsed.name.trim().toLowerCase(),
          sanitizePhoneSignature(parsed.mobile),
          parsed.vehicleMake.trim().toLowerCase(),
          parsed.vehicleModel.trim().toLowerCase(),
          parsed.vehicleYear.trim(),
        ].join("|");
      }
    } catch (error) {
      console.warn("Failed to restore stored PPF lead profile", error);
    }
  }, [leadProfileStorageKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const payload: StoredLeadProfile = {
      submitted: formSubmitted,
      name,
      mobile,
      vehicleMake,
      vehicleModel,
      vehicleYear,
      sessionId: funnelContext.sessionId,
      visitorId: funnelContext.visitorId,
      lastCompletedStep: formSubmitted ? 3 : hasValidVehicleDetails ? 2 : hasValidContactDetails ? 1 : undefined,
      savedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(leadProfileStorageKey, JSON.stringify(payload));
  }, [
    formSubmitted,
    funnelContext.sessionId,
    funnelContext.visitorId,
    hasValidContactDetails,
    hasValidVehicleDetails,
    leadProfileStorageKey,
    mobile,
    name,
    vehicleMake,
    vehicleModel,
    vehicleYear,
  ]);

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

  const trackEvent = useCallback(
    (
      eventName: string,
      payload: Record<string, unknown> = {},
      options?: {
        metaStandardEvent?: "PageView" | "Lead" | "Contact";
        metaPayload?: Record<string, unknown>;
        privatePayload?: Record<string, unknown>;
      }
    ) => {
      trackFunnelEvent({
        eventName,
        context: funnelContext,
        payload,
        privatePayload: options?.privatePayload,
        metaStandardEvent: options?.metaStandardEvent,
        metaPayload: options?.metaPayload,
      });
    },
    [funnelContext]
  );

  const openTrackedWhatsApp = useCallback(
    ({
      placement,
      url,
      whatsappState,
    }: {
      placement: string;
      url: string;
      whatsappState: string;
    }) => {
      trackEvent("whatsapp_click", {
        cta_location: placement,
        whatsapp_state: whatsappState,
      }, {
        metaStandardEvent: "Contact",
        metaPayload: {
          contact_channel: "whatsapp",
          cta_location: placement,
          whatsapp_state: whatsappState,
        },
      });

      if (placement === "hero") {
        trackEvent("hero_whatsapp_click", {
          whatsapp_state: whatsappState,
        });
      }

      openWhatsAppUrl(url);
    },
    [trackEvent]
  );

  const clearPendingWhatsAppGate = useCallback(() => {
    pendingWhatsAppPlacementRef.current = null;
    setPendingWhatsAppPlacement(null);
  }, []);

  useEffect(() => {
    if (!contactSignature) return;

    const timeoutId = window.setTimeout(() => {
      if (lastTrackedContactSignature.current === contactSignature) return;
      lastTrackedContactSignature.current = contactSignature;

      trackEvent(
        "lead_contact_captured",
        {
          flow: quoteModalFlow,
          form_step: formStep,
          contact_ready: true,
        },
        {
          privatePayload: {
            lead_name: name.trim(),
            lead_phone: mobile.trim(),
          },
        }
      );

      void captureLeadSnapshot({
        snapshotType: "contact",
        context: funnelContext,
        fullName: name.trim(),
        phone: mobile.trim(),
        payload: {
          flow: quoteModalFlow,
          form_step: formStep,
        },
      });
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [contactSignature, formStep, funnelContext, mobile, name, quoteModalFlow, trackEvent]);

  useEffect(() => {
    if (!vehicleSignature) return;

    const timeoutId = window.setTimeout(() => {
      if (lastTrackedVehicleSignature.current === vehicleSignature) return;
      lastTrackedVehicleSignature.current = vehicleSignature;

      trackEvent(
        "lead_vehicle_captured",
        {
          flow: quoteModalFlow,
          form_step: formStep,
          vehicle_ready: true,
          vehicle_label: buildVehicleLabel({
            vehicleMake,
            vehicleModel,
            vehicleYear,
          }),
        },
        {
          privatePayload: {
            lead_name: name.trim(),
            lead_phone: mobile.trim(),
            vehicle_make: vehicleMake.trim(),
            vehicle_model: vehicleModel.trim(),
            vehicle_year: vehicleYear.trim(),
          },
        }
      );

      void captureLeadSnapshot({
        snapshotType: "vehicle",
        context: funnelContext,
        fullName: name.trim(),
        phone: mobile.trim(),
        vehicleMake: vehicleMake.trim(),
        vehicleModel: vehicleModel.trim(),
        vehicleYear: vehicleYear.trim(),
        payload: {
          flow: quoteModalFlow,
          form_step: formStep,
        },
      });
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [
    formStep,
    funnelContext,
    mobile,
    name,
    quoteModalFlow,
    trackEvent,
    vehicleMake,
    vehicleModel,
    vehicleSignature,
    vehicleYear,
  ]);

  const trackGoogleAdsLeadConversion = () => {
    if (typeof window === "undefined" || !window.gtag) return;

    window.gtag("event", "conversion", {
      send_to: GOOGLE_ADS_SUBMIT_LEAD_SEND_TO,
      value: 1.0,
      currency: "AED",
    });
  };

  const trackTikTokLeadConversion = () => {
    if (variant !== "tiktok") return;

    trackTikTokSubmitForm({
      content_name: variantConfig.tikTokContentName,
      content_type: "lead_form",
      currency: "AED",
      value: 1,
    });
  };

  const flushSectionDuration = useCallback(
    (sectionName: string, reason: string) => {
      const startedAt = sectionVisibleSinceRef.current.get(sectionName);
      if (!startedAt) return;

      sectionVisibleSinceRef.current.delete(sectionName);
      const durationMs = Math.max(0, Date.now() - startedAt);
      const nextTotalMs = (sectionTotalMsRef.current.get(sectionName) ?? 0) + durationMs;
      sectionTotalMsRef.current.set(sectionName, nextTotalMs);

      if (durationMs < 250) return;

      trackEvent("section_engagement", {
        section_name: sectionName,
        duration_ms: durationMs,
        total_section_ms: nextTotalMs,
        exit_reason: reason,
      });
    },
    [trackEvent]
  );

  const restartVisibleSectionsFromViewport = useCallback(() => {
    if (typeof window === "undefined") return;

    const viewportHeight = window.innerHeight;
    const now = Date.now();
    const sections = document.querySelectorAll<HTMLElement>("[data-funnel-section]");

    sections.forEach((section) => {
      const sectionName = section.dataset.funnelSection;
      if (!sectionName) return;

      const rect = section.getBoundingClientRect();
      const isVisible = rect.top < viewportHeight * 0.72 && rect.bottom > viewportHeight * 0.28;
      if (!isVisible || sectionVisibleSinceRef.current.has(sectionName)) return;

      sectionVisibleSinceRef.current.set(sectionName, now);

      if (!sectionSeenRef.current.has(sectionName)) {
        sectionSeenRef.current.add(sectionName);
        trackEvent("section_view", {
          section_name: sectionName,
        });
      }
    });
  }, [trackEvent]);

  const trackPageCheckpoint = useCallback(
    (reason: string) => {
      const now = Date.now();
      if (reason !== "resume" && now - lastPageCheckpointAtRef.current < 400) return;
      lastPageCheckpointAtRef.current = now;

      const visibleSections = Array.from(sectionVisibleSinceRef.current.keys());
      visibleSections.forEach((sectionName) => {
        flushSectionDuration(sectionName, reason);
      });

      trackEvent("page_checkpoint", {
        checkpoint_reason: reason,
        elapsed_ms: now - sessionStartedAtRef.current,
        max_scroll_percent: maxScrollDepthRef.current,
        visible_sections: visibleSections.join(","),
      });
    },
    [flushSectionDuration, trackEvent]
  );

  useEffect(() => {
    if (variant !== "tiktok") return;
    initTikTokPixel();
  }, [variant]);

  useEffect(() => {
    updatePageSEO(variantConfig.seoKey, {
      title: variantConfig.seoTitle,
      description: variantConfig.seoDescription,
      keywords: variantConfig.seoKeywords,
      ogTitle: variantConfig.seoTitle,
      ogDescription: variantConfig.seoOgDescription,
      url: variantConfig.seoUrl,
    });

    trackEvent("lp_view", {
      brand_focus: "Grand Touch",
      default_package: "STEK 10-year",
    }, {
      metaStandardEvent: "PageView",
    });
  }, [trackEvent, variantConfig]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return;

    const viewport = window.visualViewport;
    const updateKeyboardState = () => {
      setIsKeyboardOpen(viewport.height < window.innerHeight * 0.82);
    };

    updateKeyboardState();
    viewport.addEventListener("resize", updateKeyboardState);
    return () => viewport.removeEventListener("resize", updateKeyboardState);
  }, []);

  useEffect(() => {
    const heroSection = heroSectionRef.current;
    if (!heroSection || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowMobileStickyCta(!(entry?.isIntersecting && entry.intersectionRatio > 0.28));
      },
      {
        threshold: [0, 0.12, 0.28, 0.5],
      }
    );

    observer.observe(heroSection);
    return () => observer.disconnect();
  }, []);

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
    trackEvent("quote_unlocked", {
      package_name: packageLabel,
      size: selection.size,
      coverage: selection.coverage,
      finish: selection.finish,
      estimate_value: selection.estimateMin,
    });
  }, [formStep, heroFormOpen, quoteModalFlow, selection, trackEvent]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof IntersectionObserver === "undefined") return;

    const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-funnel-section]"));
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const sectionName = (entry.target as HTMLElement).dataset.funnelSection;
          if (!sectionName) continue;

          const isActive = entry.isIntersecting && entry.intersectionRatio >= 0.35;
          const isLeaving = !entry.isIntersecting || entry.intersectionRatio <= 0.15;

          if (isActive) {
            if (!sectionVisibleSinceRef.current.has(sectionName)) {
              sectionVisibleSinceRef.current.set(sectionName, Date.now());
            }

            if (!sectionSeenRef.current.has(sectionName)) {
              sectionSeenRef.current.add(sectionName);
              trackEvent("section_view", {
                section_name: sectionName,
              });
            }
          } else if (isLeaving) {
            flushSectionDuration(sectionName, "scroll_out");
          }
        }
      },
      {
        threshold: [0, 0.15, 0.35, 0.55, 0.75],
      }
    );

    sections.forEach((section) => observer.observe(section));
    restartVisibleSectionsFromViewport();

    return () => {
      observer.disconnect();
      Array.from(sectionVisibleSinceRef.current.keys()).forEach((sectionName) => {
        flushSectionDuration(sectionName, "observer_cleanup");
      });
    };
  }, [flushSectionDuration, restartVisibleSectionsFromViewport, trackEvent]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateScrollDepth = () => {
      const doc = document.documentElement;
      const scrollableHeight = Math.max(doc.scrollHeight - window.innerHeight, 1);
      const currentPercent = Math.min(
        100,
        Math.round(((window.scrollY || doc.scrollTop || 0) / scrollableHeight) * 100)
      );

      if (currentPercent > maxScrollDepthRef.current) {
        maxScrollDepthRef.current = currentPercent;
      }

      SCROLL_DEPTH_MILESTONES.forEach((milestone) => {
        if (
          currentPercent >= milestone &&
          !scrollMilestonesTrackedRef.current.has(milestone)
        ) {
          scrollMilestonesTrackedRef.current.add(milestone);
          trackEvent("scroll_depth_reached", {
            scroll_percent: milestone,
            current_scroll_percent: currentPercent,
          });
        }
      });
    };

    updateScrollDepth();
    window.addEventListener("scroll", updateScrollDepth, { passive: true });
    window.addEventListener("resize", updateScrollDepth);

    return () => {
      window.removeEventListener("scroll", updateScrollDepth);
      window.removeEventListener("resize", updateScrollDepth);
    };
  }, [trackEvent]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        trackPageCheckpoint("hidden");
        return;
      }

      trackEvent("page_checkpoint", {
        checkpoint_reason: "resume",
        elapsed_ms: Date.now() - sessionStartedAtRef.current,
        max_scroll_percent: maxScrollDepthRef.current,
      });
      restartVisibleSectionsFromViewport();
    };

    const onPageHide = () => {
      trackPageCheckpoint("pagehide");
    };

    const onBeforeUnload = () => {
      trackPageCheckpoint("beforeunload");
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [restartVisibleSectionsFromViewport, trackEvent, trackPageCheckpoint]);

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

  const trackConfiguratorStartIfNeeded = useCallback(() => {
    if (hasTrackedConfiguratorStart.current) return;
    hasTrackedConfiguratorStart.current = true;
    trackEvent("quote_config_started");
  }, [trackEvent]);

  const trackFormStartIfNeeded = () => {
    if (hasTrackedFormStart.current) return;
    hasTrackedFormStart.current = true;
    trackEvent("lead_form_started");
  };

  const sendLeadEmail = useCallback(
    async (payload: Record<string, string | number>, debugLabel: string) => {
      if (!funnelEmailsEnabled) {
        if (import.meta.env.DEV) {
          console.info(`[funnel email skipped] ${debugLabel}`, payload);
        }
        return;
      }

      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        payload,
        EMAILJS_PUBLIC_KEY
      );
    },
    [funnelEmailsEnabled]
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
          fbclid: utmParams.fbclid,
          ttclid: utmParams.ttclid,
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

    if (!mobile.trim() || !isValidPhoneNumber(mobile)) {
      setPhoneError("Choose the right country code and enter the mobile number without the leading 0.");
      return;
    }

    setPhoneError("");
    setFormStep(2);
      trackEvent("lead_form_step_completed", {
        step_name: "contact",
        flow: quoteModalFlow,
        contact_ready: true,
      });
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
      const pendingWhatsAppPlacement = pendingWhatsAppPlacementRef.current;

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
            fbclid: utmParams.fbclid,
            ttclid: utmParams.ttclid,
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
        const captureSnapshotPromise = captureLeadSnapshot({
          snapshotType: "submit",
          context: funnelContext,
          fullName: name.trim(),
          phone: mobile.trim(),
        vehicleMake: vehicleMake.trim(),
        vehicleModel: vehicleModel.trim(),
        vehicleYear: vehicleYear.trim(),
        payload: {
          flow: quoteModalFlow,
          vehicle: vehicleSummary,
        },
      });
      trackEvent("lead_form_step_completed", {
        step_name: "vehicle",
        flow: quoteModalFlow,
        vehicle_ready: true,
      });
      trackEvent("lead_form_submitted", {
        vehicle: vehicleSummary,
        flow: quoteModalFlow,
      }, {
        metaStandardEvent: "Lead",
        metaPayload: {
          content_name: "PPF Quote Funnel",
          status: "submitted",
          value: selection?.estimateMin ?? 1,
          currency: "AED",
        },
        privatePayload: {
          lead_name: name.trim(),
          lead_phone: mobile.trim(),
          vehicle_make: vehicleMake.trim(),
          vehicle_model: vehicleModel.trim(),
          vehicle_year: vehicleYear.trim(),
        },
        });
        trackGoogleAdsLeadConversion();
        trackTikTokLeadConversion();

        if (pendingWhatsAppPlacement) {
          clearPendingWhatsAppGate();
          await captureSnapshotPromise;
          openTrackedWhatsApp({
            placement: pendingWhatsAppPlacement,
            url: buildWhatsAppUrl(
              vehicleSummary.trim()
                ? `Hi Sean, I’ve just sent my details through on the Grand Touch website for my ${vehicleSummary.trim()}. I’d love your advice on the right PPF package for it when you have a moment.`
                : "Hi Sean, I’ve just sent my details through on the Grand Touch website and wanted your advice on the right PPF package when you have a moment."
            ),
            whatsappState: "known_lead",
          });
        }
      }
    };

  const handleWhatsAppClick = (placement: string = "unknown") => {
    if (!formSubmitted) {
      pendingWhatsAppPlacementRef.current = placement;
      setPendingWhatsAppPlacement(placement);
      trackFormStartIfNeeded();
      trackEvent("whatsapp_capture_required", {
        cta_location: placement,
        missing_contact: !hasValidContactDetails,
        missing_vehicle: !hasValidVehicleDetails,
      });
      trackEvent("quote_modal_opened", {
        flow: "standard",
        cta_location: `${placement}_whatsapp_gate`,
      });
      setQuoteModalFlow("standard");
      setFormStep(hasValidContactDetails ? 2 : 1);
      setHeroFormOpen(true);
      return;
    }

    const whatsappState = selection
      ? calculatorPriceUnlocked
        ? "calculator_quote"
        : "calculator_setup"
      : "known_lead";

    openTrackedWhatsApp({
      placement,
      url: whatsAppUrl,
      whatsappState,
    });
  };

  const handleSkipToWhatsApp = useCallback(() => {
    const placement = pendingWhatsAppPlacementRef.current ?? "quote_form_skip";
    clearPendingWhatsAppGate();
    setHeroFormOpen(false);

    const whatsappState = hasValidContactDetails
      ? hasValidVehicleDetails
        ? "partial_vehicle_known"
        : "partial_contact_known"
      : "skipped_capture";

    openTrackedWhatsApp({
      placement: `${placement}_skip`,
      url: whatsAppUrl,
      whatsappState,
    });
  }, [
    clearPendingWhatsAppGate,
    hasValidContactDetails,
    hasValidVehicleDetails,
    openTrackedWhatsApp,
    whatsAppUrl,
  ]);

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

    if (funnelEmailsEnabled) {
      setIsSendingCalculatorLead(true);
    }
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
          utm_source: utmParams.utm_source,
          utm_medium: utmParams.utm_medium,
          utm_campaign: utmParams.utm_campaign,
          utm_term: utmParams.utm_term,
          utm_content: utmParams.utm_content,
          gclid: utmParams.gclid,
          fbclid: utmParams.fbclid,
          ttclid: utmParams.ttclid,
          timestamp: new Date().toISOString(),
        },
        "calculator whatsapp lead"
      );
    } catch (error) {
      console.error("Failed to send calculator WhatsApp lead email:", error);
    } finally {
      if (funnelEmailsEnabled) {
        setIsSendingCalculatorLead(false);
      }
        trackEvent("whatsapp_click", {
          cta_location: "calculator_quote",
          whatsapp_state: "calculator_quote",
        package_name: packageLabel,
        size: calculatorSelection.size,
        coverage: calculatorSelection.coverage,
        finish: calculatorSelection.finish,
        estimate_value: calculatorSelection.estimateMin,
      }, {
        metaStandardEvent: "Contact",
          metaPayload: {
            contact_channel: "whatsapp",
            cta_location: "calculator_quote",
            package_name: packageLabel,
            value: calculatorSelection.estimateMin,
            currency: "AED",
          },
        });
        openWhatsAppUrl(buildWhatsAppUrl(message));
      }
    };

  const openHeroForm = (placement: string = "quote_cta") => {
    trackFormStartIfNeeded();
    trackEvent(placement === "hero" ? "hero_cta_click" : "quote_cta_click", {
      cta_location: placement,
    });
    trackEvent("quote_modal_opened", {
      flow: "standard",
      cta_location: placement,
    });
    setQuoteModalFlow("standard");
    setFormStep(getResumeFormStep());
    setHeroFormOpen(true);
  };

  const openCalculatorQuoteModal = async () => {
    if (!selection) return;
    trackEvent("quote_unlock_requested", {
      package_name: getCalculatorPackageLabel(selection),
      size: selection.size,
      coverage: selection.coverage,
      finish: selection.finish,
      estimate_value: selection.estimateMin,
    });
    trackEvent("quote_modal_opened", {
      flow: "calculator",
      cta_location: "calculator_unlock",
    });
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

    setFormStep(getResumeFormStep());
    setHeroFormOpen(true);
  };

  const handleModalOpenChange = (open: boolean) => {
    setHeroFormOpen(open);
    if (!open) {
      clearPendingWhatsAppGate();
    }
  };

  const handleOpenCalculatorFromModal = () => {
    setHeroFormOpen(false);
    setFormStep(1);
    /** Radix dialog / mobile browsers often keep scroll locked briefly while the overlay closes;
     * run after that so scrollTo actually applies (see scrollToCalculatorSection retries). */
    window.setTimeout(() => scrollToCalculatorSection(), 280);
    window.setTimeout(() => scrollToCalculatorSection(), 520);
  };

  const handlePostTrustCalculatorLinkClick = useCallback(() => {
    const isMobileDevice =
      typeof window !== "undefined" &&
      (window.matchMedia?.("(max-width: 767px)").matches === true ||
        window.matchMedia?.("(pointer: coarse)").matches === true);

    trackEvent("calculator_link_click", {
      cta_location: "post_trust_calculator_link",
      page_variant: variantConfig.landingPageVariant,
      device_type: isMobileDevice ? "mobile" : "desktop",
    });
    scrollToCalculatorSection();
  }, [scrollToCalculatorSection, trackEvent, variantConfig.landingPageVariant]);

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
      question: "How do you avoid poor fitment, lifting edges, or bad prep?",
      answer:
        "The control point is the prep, not the film itself. Paint is decontaminated, corrected, and checked before install starts. If cleanliness or prep is off, the job gets reset before the film goes on. That matters because lifting edges, trapped contamination, and weak finish quality usually begin long before the handover.",
    },
    {
      question: "What does the quote already include?",
      answer:
        "The starting figure is not just film on paint. It already includes prep, paint correction, detailing, protection extras, and the warranty process shown on this page. Prices shown are starting figures and exclude VAT. Final pricing depends on the actual car, paint condition, and panel complexity once the vehicle is inspected properly.",
    },
    {
      question: "How does the STEK warranty registration work?",
      answer:
        "After installation and the one-week check, the film is registered through the correct STEK process so the warranty is traceable to the actual material on the car. That matters because plenty of buyers are told they are getting premium film and warranty cover without ever seeing a proper registration trail.",
    },
    {
      question: "How long does PPF installation usually take?",
      answer:
        "That depends on the car, the coverage, and how much prep or correction is needed before film goes on. A smaller package can move faster, while full-body protection on a larger car takes longer because prep, fitment, and final QC matter just as much as the film itself. Sean can confirm realistic timing once he knows the car and the package you are considering.",
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

  useEffect(() => {
    const video = whyStekVideoRef.current;
    if (!video) return;

    const onTimeUpdate = () => {
      if (!Number.isFinite(video.duration) || video.duration <= 0) return;

      const currentPercent = Math.min(100, Math.round((video.currentTime / video.duration) * 100));
      if (currentPercent > whyStekVideoMaxPercentRef.current) {
        whyStekVideoMaxPercentRef.current = currentPercent;
      }

      VIDEO_PROGRESS_MILESTONES.forEach((milestone) => {
        if (
          currentPercent >= milestone &&
          !whyStekVideoMilestonesTrackedRef.current.has(milestone)
        ) {
          whyStekVideoMilestonesTrackedRef.current.add(milestone);
          trackEvent("video_progress", {
            video_name: "why_stek",
            progress_percent: milestone,
            current_seconds: Number(video.currentTime.toFixed(1)),
            duration_seconds: Number(video.duration.toFixed(1)),
          });
        }
      });
    };

    const onEnded = () => {
      trackEvent("video_completed", {
        video_name: "why_stek",
        duration_seconds: Number(video.duration.toFixed(1)),
        max_progress_percent: whyStekVideoMaxPercentRef.current,
      });
    };

    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("ended", onEnded);

    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("ended", onEnded);
    };
  }, [trackEvent]);

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
    trackEvent("manual_video_play", {
      video_name: "why_stek",
      section: "proof",
    });
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
      trackEvent("manual_video_play", {
        video_name: "why_stek",
        section: "proof",
      });
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
        <section
          ref={heroSectionRef}
          data-funnel-section="hero"
          className="relative overflow-hidden border-b border-border/50 bg-[radial-gradient(circle_at_top,_hsl(38_92%_58%_/_0.09),_transparent_42%),radial-gradient(circle_at_15%_25%,rgba(245,158,11,0.04),transparent_34%),radial-gradient(circle_at_85%_20%,rgba(255,255,255,0.05),transparent_22%),linear-gradient(180deg,hsl(0_0%_8%)_0%,hsl(0_0%_5%)_100%)] px-0 pb-7 pt-6 sm:bg-[radial-gradient(circle_at_top,_hsl(38_92%_58%_/_0.24),_transparent_32%),radial-gradient(circle_at_15%_25%,rgba(245,158,11,0.12),transparent_26%),radial-gradient(circle_at_85%_20%,rgba(255,255,255,0.08),transparent_18%),linear-gradient(180deg,hsl(0_0%_8%)_0%,hsl(0_0%_5%)_100%)] sm:pb-8 sm:pt-10"
        >
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
                <div className="mt-4 flex flex-wrap gap-2 sm:mt-5">
                  <Badge
                    variant="secondary"
                    className="gap-2 border border-white/10 bg-white/8 px-3 py-1.5 shadow-sm backdrop-blur-sm"
                  >
                    <GoogleWordmark />
                    <span>4.9 stars</span>
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-white/15 bg-black/20 px-3 py-1.5 backdrop-blur-sm"
                  >
                    Warranty-registered STEK film
                  </Badge>
                </div>
                <h1 className="mt-4 flex max-w-3xl flex-col gap-1 text-[clamp(1.78rem,8.1vw,1.9rem)] font-bold leading-[1.08] tracking-tight sm:mt-5 sm:gap-1.5 sm:text-5xl sm:leading-tight md:gap-2 md:text-6xl">
                  <span className="text-white sm:hidden">
                    Find the <span className="bg-[linear-gradient(180deg,#ffd978_0%,#f7b52b_55%,#e79a13_100%)] bg-clip-text text-transparent">right PPF</span>
                  </span>
                  <span className="sm:hidden">
                    <span className="text-white">setup for </span>
                    <span className="bg-[linear-gradient(180deg,#ffd978_0%,#f7b52b_55%,#e79a13_100%)] bg-clip-text text-transparent">your car</span>
                  </span>
                  <span className="hidden text-white sm:block">PPF in Dubai</span>
                  <span className="hidden text-white sm:block">you can trust.</span>
                  <span className="hidden bg-[linear-gradient(180deg,#ffcc63_0%,#f7b52b_55%,#e79a13_100%)] bg-clip-text text-transparent drop-shadow-[0_8px_30px_rgba(247,181,43,0.15)] sm:block">
                    Direct with Sean. Installed properly.
                  </span>
                </h1>
                <p className="mt-3 max-w-2xl text-[0.98rem] leading-6 text-slate-300 sm:text-lg sm:leading-7">
                  <span className="sm:hidden">
                    Answer a few quick questions and Sean will point you to the right package.
                  </span>
                  <span className="hidden sm:inline">
                    Get a clear PPF quote and deal directly with Sean from first message to final handover.
                  </span>
                </p>

                <div className="hidden mt-5 grid gap-2 sm:grid-cols-2">
                  {[
                    "4.9★ Google-rated by real buyers",
                    "Certified STEK installs",
                    "Warranty you can trace",
                    "Direct with Sean from quote to handover",
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(12,12,12,0.45))] px-4 py-3 text-sm font-medium text-white/88 shadow-[0_14px_38px_rgba(0,0,0,0.18)]"
                    >
                      {item}
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex flex-col gap-3">
                  <Dialog open={heroFormOpen} onOpenChange={handleModalOpenChange}>
                    <DialogTrigger asChild>
                      <Button
                        size="lg"
                        variant="default"
                        className={cn(primaryPpfCtaButtonClass, "w-full")}
                        onClick={() => openHeroForm("hero")}
                      >
                        <span className="sm:hidden">Get My PPF Estimate</span>
                        <span className="hidden sm:inline">Get My PPF Quote</span>
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent
                      className={cn(
                        "flex max-h-[min(92dvh,820px)] min-h-0 w-[calc(100vw-1rem)] flex-col overflow-hidden overflow-x-hidden border-0 bg-transparent p-0 shadow-none outline-none focus-visible:outline-none sm:w-full [&>button]:hidden",
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
                        isWhatsAppGateActive={Boolean(pendingWhatsAppPlacement)}
                        name={name}
                        phoneCountryCode={phoneCountryCode}
                        phoneCountryCodeCustom={phoneCountryCodeCustom}
                        phoneLocalNumber={phoneLocalNumber}
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
                        onPhoneCountryCodeChange={(value) => {
                          trackFormStartIfNeeded();
                          setPhoneCountryCode(value);
                          if (!isPresetPhoneCountryCode(value)) {
                            setPhoneCountryCodeCustom(value);
                          }
                          if (phoneError) setPhoneError("");
                        }}
                        onPhoneCountryCodeCustomChange={(value) => {
                          trackFormStartIfNeeded();
                          const cleaned = value.replace(/\D/g, "").slice(0, 4);
                          setPhoneCountryCodeCustom(cleaned);
                          setPhoneCountryCode(cleaned);
                          if (phoneError) setPhoneError("");
                        }}
                        onPhoneLocalNumberChange={(value) => {
                          trackFormStartIfNeeded();
                          setPhoneLocalNumber(normalizePhoneLocalNumber(value));
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
                        onWhatsAppClick={() => handleWhatsAppClick("quote_form")}
                        onSkipToWhatsApp={handleSkipToWhatsApp}
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

                  <button
                    type="button"
                    className="self-start text-sm text-slate-400 transition hover:text-slate-200 sm:hidden"
                    onClick={() => handleWhatsAppClick("hero")}
                  >
                    <span>Want to chat instead? </span>
                    <span className="font-medium text-white underline underline-offset-4">Ask Sean on WhatsApp</span>
                  </button>

                  <div className="grid grid-cols-3 gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] p-3 sm:hidden">
                    {[
                      { label: "2 min start", Icon: ScanSearch },
                      { label: "Clear setup", Icon: ShieldCheck },
                      { label: "Direct Sean", Icon: MessageCircle },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="flex min-w-0 flex-col items-center justify-center rounded-lg border border-white/10 bg-black/20 px-2 py-2.5 text-center"
                      >
                        <item.Icon className="h-3.5 w-3.5 text-primary" />
                        <p className="mt-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-white/85">
                          {item.label}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="hidden w-full sm:block">
                    <Button
                      type="button"
                      variant="default"
                      className={heroWhatsAppButtonClass}
                      size="lg"
                      onClick={() => handleWhatsAppClick("hero")}
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Ask Sean on WhatsApp
                    </Button>
                  </div>

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

                  <p className="hidden text-sm text-slate-400">
                    No vague handoff <span className="mx-2 text-primary/60">&bull;</span> No shortcuts in prep{" "}
                    <span className="mx-2 text-primary/60">&bull;</span> Warranty you can trace
                  </p>
                </div>

              </div>

              <div className="order-2 sm:hidden">
                <button
                  type="button"
                  onClick={() => handleWhatsAppClick("hero")}
                  className="group relative w-full overflow-hidden rounded-2xl border border-white/15 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(10,10,10,0.92))] p-3 text-left shadow-[0_18px_45px_rgba(0,0,0,0.35)]"
                >
                  <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-white/10">
                    <video
                      className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                      src="https://res.cloudinary.com/diw6rekpm/video/upload/q_auto/f_auto/v1775556526/Jetour_EDIT_yi001t.mp4"
                      muted
                      loop
                      playsInline
                      autoPlay
                      preload="metadata"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="pointer-events-none absolute bottom-2 left-2 inline-flex items-center rounded-full border border-white/20 bg-black/55 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-white/90">
                      Recent install
                    </div>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-white">Recent customer handover</p>
                </button>
              </div>

              <div className="relative order-2 hidden min-h-0 flex-col justify-end overflow-visible sm:flex lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start">
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
                <div className="grid gap-2 sm:grid-cols-3 sm:items-stretch sm:gap-2.5">
                  <div className="flex flex-row items-center gap-2 rounded-xl border border-white/10 bg-[linear-gradient(180deg,rgba(66,133,244,0.08),rgba(255,255,255,0.03)_28%,rgba(255,255,255,0.02)_100%)] px-2.5 py-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.25)] backdrop-blur-sm sm:flex-col sm:items-stretch sm:gap-3 sm:rounded-2xl sm:p-3 sm:py-3">
                    <div className="flex shrink-0 flex-col gap-0.5 sm:w-full sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
                      <GoogleWordmark className="text-[1rem] leading-none sm:text-[1.4rem]" />
                      <TrustStars starClassName="h-3.5 w-3.5 sm:h-[1.25rem] sm:w-[1.25rem]" />
                    </div>
                    <div className="min-w-0 flex-1 sm:mt-2 sm:flex-none">
                      <p className="text-[0.84rem] font-semibold leading-tight text-white sm:text-sm">Trusted by real buyers</p>
                      <p className="mt-0.5 hidden text-[0.84rem] leading-snug text-slate-300 sm:mt-1 sm:block sm:max-w-[19ch] sm:text-[0.8125rem]">
                        Google proof from real Grand Touch handovers.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-row items-center gap-2 rounded-xl border border-primary/20 bg-[linear-gradient(180deg,rgba(245,158,11,0.11),rgba(255,255,255,0.03)_28%,rgba(255,255,255,0.02)_100%)] px-2.5 py-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.28)] ring-1 ring-primary/10 backdrop-blur-sm sm:flex-col sm:items-stretch sm:gap-3 sm:rounded-2xl sm:p-3 sm:py-3">
                    <div className="flex shrink-0 items-center justify-start sm:w-full sm:justify-center sm:py-0.5">
                      <img
                        src="/stek-white-small.png"
                        alt="STEK"
                        className="h-6 w-auto max-w-[105px] object-contain object-left sm:h-9 sm:max-w-[140px]"
                        loading="lazy"
                      />
                    </div>
                    <div className="min-w-0 flex-1 sm:mt-2 sm:flex-none">
                      <p className="text-[0.84rem] font-semibold leading-tight text-white sm:text-sm">Certified STEK installs</p>
                      <p className="mt-0.5 hidden text-[0.84rem] leading-snug text-slate-300 sm:mt-1 sm:block sm:max-w-[17ch] sm:text-[0.8125rem]">
                        Genuine STEK, fitted properly.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-row items-center gap-2 rounded-xl border border-white/10 bg-[linear-gradient(180deg,rgba(95,143,121,0.09),rgba(255,255,255,0.03)_28%,rgba(255,255,255,0.02)_100%)] px-2.5 py-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.25)] backdrop-blur-sm sm:flex-col sm:items-stretch sm:gap-3 sm:rounded-2xl sm:p-3 sm:py-3">
                    <div className="flex shrink-0 items-center justify-start sm:w-full sm:justify-center sm:py-0.5">
                      <div
                        className="inline-flex max-w-[8.5rem] -rotate-[2deg] items-center gap-1 rounded-md border-2 border-white/30 bg-white px-1.5 py-0.5 text-black shadow-[0_6px_20px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-black/15 sm:max-w-[11.5rem] sm:-rotate-[3deg] sm:gap-2 sm:rounded-lg sm:px-2 sm:py-1.5"
                        role="img"
                        aria-label="Serial verified STEK warranty sticker"
                      >
                        <span className="rounded-sm bg-[#ea4335] px-1 py-[0.16rem] text-[0.42rem] font-black uppercase tracking-[0.14em] text-white sm:px-1.5 sm:py-[0.18rem] sm:text-[0.5rem]">
                          Seal
                        </span>
                        <div className="flex h-4 w-4 items-center justify-center rounded-sm bg-black text-[0.48rem] font-black tracking-[0.08em] text-white sm:h-5 sm:w-5 sm:text-[0.62rem]">
                          <span className="translate-y-[0.02rem]">GT</span>
                        </div>
                        <span className="text-[0.46rem] font-black uppercase tracking-[0.18em] text-black/80 sm:text-[0.56rem]">
                          Serial verified
                        </span>
                        <span className="ml-auto text-[0.38rem] font-black uppercase tracking-[0.18em] text-black/65 sm:text-[0.46rem]">
                          STEK
                        </span>
                      </div>
                    </div>
                    <div className="min-w-0 flex-1 sm:mt-2 sm:flex-none">
                      <p className="text-[0.84rem] font-semibold leading-tight text-white sm:text-sm">Warranty you can trace</p>
                      <p className="mt-0.5 hidden text-[0.84rem] leading-snug text-slate-300 sm:mt-1 sm:block sm:max-w-[17ch] sm:text-[0.8125rem]">
                        Serial-tracked and registered properly.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mx-auto mt-6 mb-7 w-full max-w-xl rounded-2xl border border-white/7 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(10,10,10,0.6))] px-3.5 py-2.5 text-center shadow-[0_8px_24px_rgba(0,0,0,0.14)] sm:mt-7 sm:mb-8 sm:px-5 sm:py-3 lg:mx-0 lg:text-left">
                  <p className="text-[0.83rem] font-medium text-white/70 sm:text-sm">Want to compare options first?</p>
                  <button
                    type="button"
                    onClick={handlePostTrustCalculatorLinkClick}
                    className="mt-1 inline-flex items-center justify-center gap-1 text-[0.92rem] font-semibold text-primary underline-offset-4 transition hover:underline hover:text-[#ffd175] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(0_0%_8%)] sm:text-[0.95rem] lg:justify-start"
                  >
                    Open the PPF calculator
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          data-funnel-section="serious_buyer_risks"
          className="border-b border-border/50 bg-[radial-gradient(circle_at_18%_0%,rgba(245,181,43,0.08),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01))] px-0 py-9 sm:py-12"
        >
          <div className="container mx-auto max-w-6xl">
            <div className="rounded-[32px] border border-primary/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(12,12,12,0.96))] p-4 shadow-[0_24px_70px_rgba(0,0,0,0.3)] sm:p-8">
              <div className="grid gap-5 lg:grid-cols-[0.88fr_1.12fr] lg:items-start lg:gap-8">
                <div className="max-w-xl">
                  <p className="text-sm uppercase tracking-[0.25em] text-muted-foreground">
                    What serious buyers are trying to avoid
                  </p>
                  <h2 className="mt-1.5 text-[1.72rem] font-bold leading-tight sm:mt-2 sm:text-4xl">
                    The risk is the install.
                    <span className="block text-[#f6c76d]">Not the film.</span>
                  </h2>
                  <p className="mt-2.5 max-w-[34rem] text-[0.95rem] leading-[1.6] text-slate-300 sm:text-base sm:leading-7">
                    Prep, fitment, and warranty handling decide whether the finish looks premium or
                    disappointing.
                  </p>
                </div>

                <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-3">
                  {[
                    {
                      title: "Poor prep",
                      text: "Shows through the film.",
                      icon: Sparkles,
                    },
                    {
                      title: "Lifting edges",
                      text: "Usually starts with rushed fitment.",
                      icon: X,
                    },
                    {
                      title: "Cut-line risk",
                      text: "The workmanship risk sits with your paint.",
                      icon: ShieldCheck,
                    },
                    {
                      title: "Vague warranty",
                      text: "No traceable proof, no real confidence.",
                      icon: ScanSearch,
                    },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.title}
                        className="rounded-[20px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(10,10,10,0.98))] px-3.5 py-3.5 shadow-[0_16px_42px_rgba(0,0,0,0.18)] sm:rounded-[24px] sm:px-4 sm:py-4"
                      >
                        <div className="flex items-start gap-2.5 sm:gap-3">
                          <div className="mt-0.5 inline-flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-xl border border-primary/18 bg-primary/10 text-primary shadow-[0_10px_24px_rgba(245,181,43,0.12)] sm:h-10 sm:w-10 sm:rounded-2xl">
                            <Icon className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[0.93rem] font-semibold leading-tight text-white sm:text-[0.98rem]">
                              {item.title}
                            </p>
                            <p className="mt-1 text-[0.87rem] leading-[1.5] text-slate-300 sm:mt-1.5 sm:text-[0.92rem] sm:leading-6">
                              {item.text}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="why-grand-touch"
          ref={trustSectionRef}
          data-funnel-section="risk_reduction"
          className="border-y border-border/50 bg-[radial-gradient(circle_at_18%_20%,rgba(245,181,43,0.07),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01))] px-0 py-10 sm:py-14"
        >
          <div className="container mx-auto max-w-6xl">
            <div className="relative overflow-hidden rounded-[32px] border border-primary/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(12,12,12,0.97))] p-4 shadow-[0_24px_70px_rgba(0,0,0,0.35)] sm:p-8">
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute -right-12 top-0 h-44 w-44 rounded-full bg-primary/8 blur-3xl" />
                <div className="absolute -left-10 top-28 h-32 w-32 rounded-full bg-primary/6 blur-3xl" />
              </div>

              <div className="relative">
                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(300px,38%)] lg:items-start lg:gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(360px,42%)]">
                  <div className="min-w-0">
                    <p className="text-sm uppercase tracking-[0.26em] text-muted-foreground">
                      How we reduce the risk
                    </p>
                    <h2 className="mt-2 max-w-[22ch] text-[1.76rem] font-bold leading-[1.03] text-white sm:mt-3 sm:max-w-[26ch] sm:text-4xl lg:max-w-none lg:text-[2.35rem] xl:text-4xl">
                      Sean-led quote.
                      <span className="block text-white">Prep before film.</span>
                      <span className="block bg-[linear-gradient(180deg,#ffcf6a_0%,#f7b52b_55%,#e79a13_100%)] bg-clip-text text-transparent drop-shadow-[0_10px_30px_rgba(247,181,43,0.16)]">
                        Registered warranty.
                      </span>
                    </h2>
                    <p className="mt-3 max-w-[52ch] text-[0.95rem] leading-[1.55] text-slate-300 sm:text-base sm:leading-7">
                      One standard all the way through: Sean-led advice, prep before film, and STEK
                      warranty registration at handover.
                    </p>

                    <div className="mt-5 grid gap-2.5 sm:grid-cols-2 sm:gap-4 lg:mt-8">
                      {[
                        {
                          eyebrow: "One owner-led standard",
                          title: "Sean-led quote and handover",
                          text: "The same person advising the job stands behind the result at handover.",
                        },
                        {
                          eyebrow: "Prep first",
                          title: "Prep before film",
                          text: "No film goes on until prep and fitment are signed off properly.",
                        },
                        {
                          eyebrow: "Traceable after handover",
                          title: "Registered STEK warranty",
                          text: "Film and warranty are matched to the car and traceable after handover.",
                        },
                      ].map((item, index) => (
                        <div
                          key={item.title}
                          className={cn(
                            "rounded-[20px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(12,12,12,0.98))] px-3.5 py-3.5 shadow-[0_18px_42px_rgba(0,0,0,0.2)] sm:rounded-[24px] sm:px-4 sm:py-4",
                            index === 2 && "sm:col-span-2 sm:mx-auto sm:w-full sm:max-w-2xl"
                          )}
                        >
                          <p className="hidden text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/75 sm:block">
                            {item.eyebrow}
                          </p>
                          <p className="text-[0.98rem] font-semibold leading-tight text-white sm:mt-2 sm:text-lg">{item.title}</p>
                          <p className="mt-1.5 text-[0.9rem] leading-[1.5] text-slate-300 sm:mt-2 sm:text-sm sm:leading-6">{item.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="order-2 flex w-full min-w-0 justify-center lg:order-none lg:justify-end">
                    <div
                      className={cn(
                        "relative mx-auto w-full max-w-[min(100%,400px)] overflow-hidden rounded-[28px] border border-white/10 bg-black/35 shadow-[0_20px_60px_rgba(0,0,0,0.35)]",
                        /* Height from 9:16 + column width; cap so the clip does not tower over the copy + cards */
                        "aspect-[9/16] max-h-[min(70vh,520px)] lg:mx-0 lg:ml-auto lg:max-w-none lg:max-h-[540px] xl:max-h-[560px]"
                      )}
                    >
                      <video
                        ref={trustVideoRef}
                        className="h-full w-full object-cover"
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
                          Real handover
                        </p>
                        <p className="mt-2 max-w-[24ch] text-xl font-semibold leading-tight text-white sm:text-2xl">
                          See the finish before sign-off.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="why-stek"
          ref={whyStekSectionRef}
          data-funnel-section="why_stek"
          className="border-b border-border/50 bg-[radial-gradient(circle_at_75%_20%,rgba(245,181,43,0.08),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01))] px-0 py-10 sm:py-14"
        >
          <div className="container mx-auto max-w-6xl">
            <div className="relative overflow-hidden rounded-[32px] border border-primary/15 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(12,12,12,0.96))] p-4 shadow-[0_24px_70px_rgba(0,0,0,0.35)] sm:p-8">
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute -left-12 top-6 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
                <div className="absolute right-0 top-16 h-32 w-32 rounded-full bg-white/5 blur-3xl" />
              </div>
              <div className="relative grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)] lg:items-center">
                <div className="order-2 mx-auto w-full max-w-[360px] lg:order-1">
                  <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-black/35 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
                    <video
                      ref={whyStekVideoRef}
                      className={cn(
                        "aspect-[4/5] h-auto w-full object-cover",
                        isWhyStekPlaying ? "cursor-pointer touch-pan-y" : "pointer-events-none"
                      )}
                      src={WHY_STEK_VIDEO}
                      poster={WHY_STEK_POSTER}
                      playsInline
                      preload="metadata"
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
                        <span className="inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-black/60 px-4 py-2.5 text-[0.92rem] font-semibold text-white shadow-[0_18px_40px_rgba(0,0,0,0.45)] backdrop-blur-md sm:gap-3 sm:px-5 sm:py-3 sm:text-sm">
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-black sm:h-10 sm:w-10">
                            <Play className="ml-0.5 h-4 w-4 fill-current" />
                          </span>
                          Watch Sean explain it
                        </span>
                      </button>
                    ) : null}

                    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-start gap-2.5 bg-gradient-to-t from-black/90 via-black/28 to-transparent px-4 pb-4 pt-12 sm:gap-3 sm:px-5 sm:pb-6 sm:pt-16">
                      <img
                        src="/stek-white-full.png"
                        alt="STEK"
                        className="h-12 w-auto max-w-[11rem] shrink-0 object-contain object-left opacity-95 drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]"
                        loading="lazy"
                      />
                      <div className="w-full">
                        <p className="text-[11px] uppercase tracking-[0.24em] text-white/60">
                          Sean on why we use STEK
                        </p>
                        <p className="mt-1.5 max-w-[22ch] text-[1.05rem] font-semibold leading-tight text-white sm:mt-2 sm:text-lg">
                          Finish, fitment, and warranty need to line up.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="order-1 min-w-0 w-full max-w-2xl lg:order-2 lg:max-w-none">
                  <p className="text-sm uppercase tracking-[0.26em] text-muted-foreground">
                    WHY WE USE STEK
                  </p>
                  <h2 className="mt-2 max-w-xl text-[1.76rem] font-bold leading-[1.05] tracking-tight text-white sm:mt-3 sm:text-[2.35rem] sm:leading-[1.06]">
                    <span className="block">Why Sean</span>
                    <span className="block">
                      recommends{" "}
                      <span className="bg-[linear-gradient(180deg,#ffcf6a_0%,#f7b52b_55%,#e79a13_100%)] bg-clip-text text-transparent drop-shadow-[0_10px_30px_rgba(247,181,43,0.16)]">
                        STEK
                      </span>
                      .
                    </span>
                  </h2>
                  <p className="mt-3 max-w-[48ch] text-[0.95rem] font-medium leading-[1.55] text-slate-200 sm:mt-4 sm:text-base sm:leading-7">
                    Not hype. Just genuine film, the right finish, and warranty registration done
                    properly.
                  </p>

                  <div className="mt-3 hidden flex-col gap-1.5 rounded-xl border border-white/12 bg-black/40 px-2.5 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:mt-4 sm:flex sm:flex-row sm:items-center sm:gap-3.5 sm:px-3.5 sm:py-3">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <img
                        src="/stek-white-small.png"
                        alt="STEK"
                        className="h-4.5 w-auto shrink-0 object-contain opacity-95 sm:h-8"
                        loading="lazy"
                      />
                      <span className="hidden h-6 w-px shrink-0 bg-white/12 sm:block" />
                      <img
                        src={stekWarrantySticker}
                        alt="STEK warranty sticker"
                        className="h-8 w-auto max-w-[min(100%,140px)] shrink-0 rounded-md border border-white/12 bg-black/35 object-contain object-left sm:h-[3.25rem] sm:max-w-[220px]"
                        loading="lazy"
                      />
                    </div>
                    <p className="w-full text-[0.82rem] font-medium leading-snug text-slate-200 sm:min-w-0 sm:flex-1 sm:text-[0.9375rem]">
                      Genuine film. Registered warranty.
                    </p>
                  </div>

                  <div className="mt-3 grid gap-2.5 sm:mt-4 sm:grid-cols-3 sm:gap-3">
                    {(
                      [
                        {
                          label: "Genuine STEK film",
                          sub: "What gets quoted is what gets fitted.",
                          icon: ShieldCheck,
                        },
                        {
                          label: "Gloss or matte",
                          sub: "Chosen for the look you actually want.",
                          icon: Sparkles,
                        },
                        {
                          label: "Registered warranty",
                          sub: "Matched to the car and traceable.",
                          icon: ScanSearch,
                        },
                      ] as const
                    ).map((item) => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={item.label}
                          className="flex gap-2.5 rounded-2xl border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(8,8,8,0.92))] px-3 py-3.5 shadow-[0_12px_36px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.06)] sm:gap-3 sm:px-3.5 sm:py-4"
                        >
                          <div className="mt-0.5 flex h-8.5 w-8.5 shrink-0 items-center justify-center text-primary sm:h-10 sm:w-10 sm:rounded-xl sm:border sm:border-primary/25 sm:bg-primary/12 sm:shadow-[0_8px_22px_rgba(245,181,43,0.12)]">
                            <Icon className="h-4 w-4 sm:h-4.5 sm:w-4.5" strokeWidth={2.25} />
                          </div>
                          <div className="min-w-0 pt-0.5">
                            <p className="text-[0.88rem] font-semibold leading-snug text-white sm:text-sm">{item.label}</p>
                            <p className="mt-1.5 text-[0.72rem] leading-relaxed text-slate-400 sm:mt-2 sm:text-xs">{item.sub}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <p className="mt-3 hidden max-w-[52ch] text-sm font-medium leading-6 text-slate-300 sm:block">
                    Sean explains what gets fitted, how the finish should look, and why the warranty
                    process matters just as much as the film choice.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="real-handovers"
          data-funnel-section="real_handovers"
          className="border-y border-border/50 bg-card/30 px-0 py-12"
        >
          <div className="container mx-auto max-w-6xl">
            <div className="mb-6">
              <p className="text-sm uppercase tracking-[0.25em] text-muted-foreground">
                Customer reviews & our work
              </p>
              <h2 className="mt-2 text-[2rem] font-bold sm:text-3xl">Real buyers, real handovers, real cars</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
                Real owners trust Sean, the finish looks right, and the handover feels properly done.
              </p>
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
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#79a7ff]">
                  Owner review
                </p>
                <h3 className="mt-2 text-xl font-semibold">Mark | Zeekr 001</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  A real owner review and handover that shows the process still feels easy when the
                  buyer is trusting you with the whole car.
                </p>
                <div className="mt-auto">
                  <VideoModalCard
                    title="Mark's Zeekr 001"
                    description="A quick customer delivery clip showing the finished Zeekr 001 and the level of service behind it."
                    videoSrc="https://res.cloudinary.com/diw6rekpm/video/upload/q_auto/f_auto/v1775562589/Mark_Zeekr_conzdp.mp4"
                    posterSrc="/mark-zeekr-001.png"
                    eyebrow="Real owner handover"
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
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#f6c76d]">
                  Workmanship proof
                </p>
                <h3 className="mt-2 text-xl font-semibold">Recent Grand Touch work</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Recent installs that show the level of finish Grand Touch is willing to hand back to
                  paying buyers.
                </p>
                <div className="mt-auto">
                  <VideoModalCard
                    title="Recent Grand Touch work"
                    description="A multi-car G700 showcase featuring STEK gloss and matte colour PPF installs, warranty-backed packages, and custom finish details."
                    videoSrc="https://res.cloudinary.com/diw6rekpm/video/upload/v1775556526/Jetour_EDIT_yi001t.mp4"
                    posterSrc="/g700-orange.png"
                    eyebrow="Recent install proof"
                  />
                </div>
              </Card>

              <Card className="flex h-full flex-col border-[#5f8f79]/20 bg-[linear-gradient(180deg,rgba(95,143,121,0.09),rgba(255,255,255,0.02)_24%,rgba(255,255,255,0.02)_100%)] p-4 sm:p-6">
                <div className="mt-4 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9dc3b0]">
                      Handover proof
                    </p>
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
                  A finished colour PPF handover that shows the payoff once the process is done
                  properly.
                </p>
                <div className="mt-auto">
                  <VideoModalCard
                    title="Matt Cooper's Jetour T2"
                    description="A quick delivery clip showing Matt Cooper's matte green Jetour T2 colour PPF transformation."
                    videoSrc="https://res.cloudinary.com/diw6rekpm/video/upload/q_auto/f_auto/v1775563747/0407_xyaggw.mp4"
                    posterSrc="/matt-cooper-t2.png"
                    eyebrow="Real finished handover"
                  />
                </div>
              </Card>
            </div>

              <SectionCta
                primaryLabel="Get My PPF Quote"
                secondaryLabel="Ask Sean on WhatsApp"
                onPrimaryClick={() => openHeroForm("mid_page")}
                onSecondaryClick={() => handleWhatsAppClick("mid_page")}
                note="Seen enough? Get your quote or ask Sean directly."
              />
          </div>
        </section>

        <section className="hidden px-0 pb-24 pt-14 sm:pb-28">
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
                    <h2 className="mt-2 text-[2rem] font-bold leading-tight sm:text-4xl">
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
                        onPrimaryClick={() => openHeroForm("warranty_section")}
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
          id="quote-calculator"
          ref={calculatorRef}
          data-funnel-section="calculator"
          className="scroll-mt-6 border-t border-border/50 bg-[radial-gradient(circle_at_50%_0%,rgba(245,181,43,0.04),transparent_42%)] px-0 pb-6 pt-16 [overflow-anchor:none] sm:scroll-mt-8 sm:pb-20 sm:pt-20"
        >
          <div className="container mx-auto max-w-6xl">
            <div className="mb-8 overflow-hidden rounded-[34px] border border-primary/12 bg-[radial-gradient(circle_at_top_left,rgba(245,181,43,0.10),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.035),rgba(10,10,10,0.98))] p-4 shadow-[0_28px_90px_rgba(0,0,0,0.28)] sm:p-8">
              <p className="text-sm uppercase tracking-[0.25em] text-primary/80 sm:text-muted-foreground">
                <span className="sm:hidden">PPF Calculator</span>
                <span className="hidden sm:inline">PPF Configurator</span>
              </p>
              <h2 className="mt-1.5 text-[1.7rem] font-bold leading-tight sm:mt-2 sm:text-4xl">
                <span className="sm:hidden">
                  Build your{" "}
                  <span className="bg-[linear-gradient(180deg,#ffcf6a_0%,#f7b52b_55%,#e79a13_100%)] bg-clip-text text-transparent">
                    setup
                  </span>
                </span>
                <span className="hidden sm:inline">Build the right setup for your car</span>
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground sm:mt-3 sm:text-base sm:leading-7">
                <span className="sm:hidden">Choose package, finish, and coverage.</span>
                <span className="hidden sm:inline">
                  Choose the package, finish, and coverage that fit your car. Unlock the estimate when
                  you&apos;re ready.
                </span>
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-300 sm:hidden">
                Estimate includes genuine film, prep, and registered warranty.
              </p>
              <div className="mt-5 hidden rounded-[24px] border border-primary/15 bg-[linear-gradient(180deg,rgba(245,181,43,0.12),rgba(245,181,43,0.04))] px-5 py-4 shadow-[0_14px_40px_rgba(245,181,43,0.08)] sm:block">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/80">
                  What this estimate includes
                </p>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-200">
                  The starting estimate reflects proper prep, genuine STEK film, and the handover
                  standards shown above.
                </p>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-200">
                  Use it to build the right package, not just the cheapest number.
                </p>
              </div>
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
                  onWarrantyYearsChange={(warrantyYears) => {
                    trackConfiguratorStartIfNeeded();
                    trackEvent("package_selected", {
                      package_name: `STEK ${warrantyYears}-year`,
                      warranty_years: warrantyYears,
                    });
                  }}
                  onSizeChange={(size) => {
                    trackConfiguratorStartIfNeeded();
                    trackEvent("vehicle_size_selected", {
                      vehicle_size: size,
                    });
                  }}
                  onFinishChange={(finish) => {
                    trackConfiguratorStartIfNeeded();
                    trackEvent("finish_selected", {
                      finish,
                    });
                  }}
                  onCoverageChange={(coverage) => {
                    trackConfiguratorStartIfNeeded();
                    trackEvent("coverage_selected", {
                      coverage,
                    });
                  }}
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

        <section
          data-funnel-section="process"
          className="border-t border-border/50 px-0 pb-24 pt-6 sm:pb-28 sm:pt-14"
        >
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
                      A proper PPF result depends on prep, controlled install, final QC, and the warranty process after the handover.
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
                        Decontamination, wash, clay, edge prep, and paint correction before film touches the car.
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
                        If prep or cleanliness is off, the team stops, resets, and fixes it before installation continues.
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
                        Final quality control, delivery detailing, rim ceramic, and leather ceramic as part of the handover finish.
                      </p>
                    </Card>
                  </div>

                  <Card
                    id="speak-to-sean-legacy"
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
                        <div className="rounded-full border border-primary/20 bg-black/15 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#ffd47a]">
                          Traceable proof
                        </div>
                      </div>

                      <p className="mt-4 max-w-2xl text-[0.97rem] leading-7 text-slate-100 sm:text-base">
                        After one week, the vehicle is checked again, the install is confirmed, and the STEK warranty is registered properly with full traceability.
                      </p>

                      <div className="mt-5 grid gap-4 md:grid-cols-[1.08fr_0.92fr]">
                        <div className="overflow-hidden rounded-[24px] border border-white/10 bg-black/18">
                          <img
                            src={stekWarrantySticker}
                            alt="STEK warranty proof sticker"
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        </div>

                        <div className="rounded-[24px] border border-primary/20 bg-black/18 p-4">
                          <div className="inline-flex items-center rounded-full border border-primary/16 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#ffd47a]">
                            Warranty proof
                          </div>
                          <p className="mt-4 text-2xl font-semibold leading-tight text-white">
                            Tamper-proof sticker linked to your film roll
                          </p>
                          <p className="mt-2 text-base leading-7 text-slate-200">
                            Registered and traceable.
                          </p>
                        </div>
                      </div>

                      <Button
                        size="lg"
                        variant="default"
                        className={cn(primaryPpfCtaButtonClass, "mt-6 w-full")}
                        onClick={() => openHeroForm("warranty_card")}
                      >
                        Get My PPF Quote
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          data-funnel-section="faq"
          className="border-y border-border/50 bg-[radial-gradient(circle_at_15%_20%,rgba(245,181,43,0.06),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01))] px-0 py-14"
        >
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
                      onClick={() => {
                        const nextOpen = isOpen ? null : index;
                        setOpenFaqIndex(nextOpen);
                        if (nextOpen !== null) {
                          trackEvent("faq_opened", {
                            faq_question: item.question,
                            faq_index: index,
                          });
                        }
                      }}
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

        <section data-funnel-section="final_cta" className="px-0 py-16">
          <div className="container mx-auto max-w-5xl">
            <div className="relative overflow-hidden rounded-[34px] border border-primary/20 bg-[radial-gradient(circle_at_top,rgba(245,181,43,0.16),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(10,10,10,0.98))] px-6 py-10 text-center shadow-[0_28px_90px_rgba(0,0,0,0.35)] sm:px-10 sm:py-12">
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-1/2 top-0 h-40 w-40 -translate-x-1/2 rounded-full bg-primary/12 blur-3xl" />
                <div className="absolute -left-10 bottom-0 h-36 w-36 rounded-full bg-white/5 blur-3xl" />
                <div className="absolute -right-6 top-10 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />
              </div>

              <div className="relative">
                <p className="text-sm uppercase tracking-[0.25em] text-primary/80">Final step</p>
                <h2 className="mt-3 text-[2rem] font-bold leading-tight sm:text-5xl">
                  Ready to get a proper PPF quote for your car?
                </h2>
                <p className="mx-auto mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                  Open the quote, compare the right setup, and speak to Sean directly if you want a
                  fast recommendation before you book.
                </p>

                  <SectionCta
                    primaryLabel="Get My PPF Quote"
                    secondaryLabel="Ask Sean on WhatsApp"
                    onPrimaryClick={() => openHeroForm("final_cta")}
                    onSecondaryClick={() => handleWhatsAppClick("final_cta")}
                    align="center"
                    note="Clear quote. Direct accountability. No vague handoff."
                  />
              </div>
            </div>
          </div>
        </section>

      </main>

      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[rgba(8,8,8,0.88)] p-2.5 backdrop-blur-xl transition-opacity duration-200 md:hidden",
          showMobileStickyCta && !heroFormOpen && !isKeyboardOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        <Button
          type="button"
          variant="default"
          className={cn(whatsappCtaButtonClass, "h-10 rounded-xl text-[0.95rem]")}
          size="lg"
          onClick={() => handleWhatsAppClick("mobile_sticky")}
        >
          <MessageCircle className="mr-2 h-4 w-4" />
          Ask Sean on WhatsApp
        </Button>
      </div>

      <div className="pointer-events-none fixed bottom-0 right-0 z-40 hidden overflow-visible md:block">
        <button
          type="button"
          onClick={() => handleWhatsAppClick("desktop_sticky")}
          aria-label="Ask Sean on WhatsApp"
          className="group pointer-events-auto absolute bottom-0 right-6 z-0 block cursor-pointer bg-transparent p-0"
        >
          <img
            src="/chat-to-sean.png"
            alt=""
            className="h-auto w-44 max-w-[min(260px,46vw)] origin-bottom-right object-contain object-bottom-right transition-transform duration-300 ease-out group-hover:scale-[1.18]"
            loading="lazy"
          />
        </button>
      </div>
    </div>
  );
};

export default PpfDubaiQuote;
