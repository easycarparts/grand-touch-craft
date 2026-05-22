import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Check, Maximize2, MessageCircle, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { captureLeadSnapshot, createFunnelTrackingContext, trackFunnelEvent } from "@/lib/funnel-analytics";
import { updatePageSEO } from "@/lib/seo";
import { cn } from "@/lib/utils";
import {
  getPpfPriceRange,
  stekSeriesName,
  type PpfPricingFinish,
  type PpfPricingSize,
} from "@/data/ppf-calculator-pricing";
import logo from "@/assets/logo.svg";
import stekWarrantySticker from "../../Landscape STEK Sticker.png";

type PackageYears = 5 | 10 | 12;

const WHATSAPP_NUMBER = "971567191045";
const GOOGLE_ADS_WHATSAPP_CONTACT_SEND_TO = "AW-17684563059/KqOWCJfDoLAcEPOI1PBB";
const GOOGLE_ADS_SUBMIT_LEAD_SEND_TO = "AW-17684563059/5R6tCPbqo5kcEPOI1PBB";
const TRUST_HANDOVER_VIDEO =
  "https://res.cloudinary.com/diw6rekpm/video/upload/q_auto/f_auto/v1775906544/Customer_Hand_Over_phxbyt.mp4";
const SCROLL_DEPTH_MILESTONES = [25, 50, 75, 90];

const sizeOptions: Array<{
  value: PpfPricingSize;
  label: string;
  example: string;
  image: string;
}> = [
  { value: "Small", label: "Small", example: "A45 / Golf / 3 Series", image: "/calculator-a45-gloss.jpg" },
  { value: "Medium", label: "Medium", example: "E-Class / 5 Series", image: "/calculator-e63s-gloss.jpg" },
  { value: "SUV", label: "SUV / 4x4", example: "Patrol / Defender / Cayenne", image: "/calculator-patrol-gloss.jpg" },
  { value: "Sports", label: "Sports", example: "911 / GT3 / R8", image: "/calculator-gt3-gloss.jpg" },
];

const finishOptions: Array<{
  value: PpfPricingFinish;
  label: string;
  helper: string;
}> = [
  { value: "Gloss", label: "Gloss", helper: "Factory paint look" },
  { value: "Matte", label: "Matte", helper: "Satin finish" },
];

const packageOptions: Array<{
  years: PackageYears;
  label: string;
  helper: string;
  badge?: string;
}> = [
  { years: 5, label: "5-year", helper: "Entry full PPF package" },
  { years: 10, label: "10-year", helper: "Most popular full PPF package", badge: "Most popular" },
  { years: 12, label: "12-year", helper: "Maximum full PPF package" },
];

const trustPoints = [
  "Full PPF from AED 7,990 + VAT",
  "Instant price estimate",
  "WhatsApp to confirm slot",
];

const ownerStandardCards = [
  {
    eyebrow: "One owner-led standard",
    title: "Sean-led quote and handover",
    text: "The same person advising the job stands behind the result when the car is handed over.",
  },
  {
    eyebrow: "Prep first",
    title: "Prep before film",
    text: "No film goes on until prep, fitment, and finish expectations are checked properly.",
  },
  {
    eyebrow: "Traceable after handover",
    title: "Registered warranty",
    text: "Film, warranty, and handover proof are matched to the car so support is traceable later.",
  },
];

const handoverCards = [
  {
    eyebrow: "Owner review",
    title: "Mark | Zeekr 001",
    text: "A real handover showing the finished result and the service experience around the car.",
    posterSrc: "/mark-zeekr-001.png",
    videoSrc: "https://res.cloudinary.com/diw6rekpm/video/upload/q_auto/f_auto/v1775562589/Mark_Zeekr_conzdp.mp4",
    modalTitle: "Mark's Zeekr 001",
    modalDescription:
      "A quick customer delivery clip showing the finished Zeekr 001 and the level of service behind it.",
    modalEyebrow: "Real owner handover",
  },
  {
    eyebrow: "Recent install proof",
    title: "Grand Touch work",
    text: "Recent protection and transformation work from the studio, shown with real cars.",
    posterSrc: "/g700-orange.png",
    videoSrc: "https://res.cloudinary.com/diw6rekpm/video/upload/v1775556526/Jetour_EDIT_yi001t.mp4",
    modalTitle: "Recent Grand Touch work",
    modalDescription:
      "A multi-car G700 showcase featuring STEK gloss and matte colour PPF installs, warranty-backed packages, and custom finish details.",
    modalEyebrow: "Recent install proof",
  },
  {
    eyebrow: "Finished handover",
    title: "Matt Cooper",
    text: "A completed colour PPF delivery that shows the standard of finish after install.",
    posterSrc: "/matt-cooper-t2.png",
    videoSrc: "https://res.cloudinary.com/diw6rekpm/video/upload/q_auto/f_auto/v1775563747/0407_xyaggw.mp4",
    modalTitle: "Matt Cooper's Jetour T2",
    modalDescription:
      "A quick delivery clip showing Matt Cooper's matte green Jetour T2 colour PPF transformation.",
    modalEyebrow: "Real finished handover",
  },
];

const filmLogoTiles = [
  {
    name: "STEK",
    src: "/stek-white-full.png",
    surface: "dark",
    className: "max-h-5 sm:max-h-9",
  },
  {
    name: "GYEON",
    src: "/gyeon-logo-purple.png",
    surface: "light",
    className: "max-h-7 sm:max-h-12 sm:scale-125",
  },
  {
    name: "Protect+",
    src: "/ppf-logo-protect-plus.webp",
    surface: "dark",
    className: "max-h-5 sm:max-h-9",
  },
  {
    name: "Diamond Pro",
    src: "/ppf-logo-diamond-pro.webp",
    surface: "dark",
    className: "max-h-7 sm:max-h-12",
  },
  {
    name: "Hyper Pro / KKVinyl",
    src: "/ppf-logo-kkvinyl.png",
    surface: "light",
    className: "max-h-8 scale-[1.65] sm:max-h-10 sm:scale-[2.15]",
  },
  {
    name: "3M",
    src: "/ppf-logo-3m.png",
    surface: "light",
    className: "max-h-10 scale-125 sm:max-h-14 sm:scale-150",
  },
  {
    name: "Carbins",
    src: "/ppf-logo-carbins.png",
    surface: "dark",
    className: "max-h-6 sm:max-h-10",
  },
  {
    name: "Avery Dennison",
    src: "/ppf-logo-avery.png",
    surface: "light",
    className: "max-h-10 scale-[1.45] sm:max-h-14 sm:scale-[1.75]",
  },
] as const;

const formatAED = (value: number) => `AED ${value.toLocaleString("en-AE")}`;

const buildWhatsAppUrl = (message: string) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

const trackGoogleAdsConversion = (sendTo: string) => {
  if (typeof window === "undefined" || !window.gtag) return;

  window.gtag("event", "conversion", {
    send_to: sendTo,
    value: 1.0,
    currency: "AED",
  });
};

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
  <Dialog>
    <DialogTrigger asChild>
      <button type="button" className="block w-full text-left">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/30 transition hover:border-[#f7b52b]/45">
          <div className="relative aspect-video">
            <img src={posterSrc} alt={title} className="h-full w-full object-cover" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="inline-flex items-center rounded-full border border-white/20 bg-black/55 px-4 py-2 text-white shadow-2xl backdrop-blur-sm">
                <span className="text-sm font-semibold">Play video</span>
              </div>
            </div>
            <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80">{eyebrow}</span>
              <div className="rounded-full border border-white/15 bg-white/10 p-2 text-white backdrop-blur-sm">
                <Maximize2 className="h-3.5 w-3.5" />
              </div>
            </div>
          </div>
        </div>
      </button>
    </DialogTrigger>
    <DialogContent className="max-w-[420px] border-[#f7b52b]/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(18,18,18,0.96))] p-3 shadow-[0_30px_120px_rgba(0,0,0,0.6)] backdrop-blur-xl sm:p-4">
      <DialogHeader className="px-1">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <div className="overflow-hidden rounded-2xl border border-[#f7b52b]/15 bg-black shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
        <video className="aspect-[9/16] h-auto w-full bg-black object-cover" controls playsInline preload="metadata" autoPlay>
          <source src={videoSrc} type="video/mp4" />
        </video>
      </div>
    </DialogContent>
  </Dialog>
);

const GoogleRating = () => (
  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm font-semibold text-white">
    <span>
      <span className="text-[#4285F4]">G</span>
      <span className="text-[#EA4335]">o</span>
      <span className="text-[#FBBC05]">o</span>
      <span className="text-[#4285F4]">g</span>
      <span className="text-[#34A853]">l</span>
      <span className="text-[#EA4335]">e</span>
    </span>
    <span>4.9</span>
    <div className="flex text-[#fbbc05]">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} className="h-3.5 w-3.5 fill-current" />
      ))}
    </div>
  </div>
);

const PpfFullPpfCalculator = () => {
  const [size, setSize] = useState<PpfPricingSize | null>(null);
  const [finish, setFinish] = useState<PpfPricingFinish | null>(null);
  const [warrantyYears, setWarrantyYears] = useState<PackageYears | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [carDetails, setCarDetails] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const sessionStartedAtRef = useRef(Date.now());
  const maxScrollDepthRef = useRef(0);
  const scrollMilestonesTrackedRef = useRef(new Set<number>());
  const sectionVisibleSinceRef = useRef(new Map<string, number>());
  const sectionTotalMsRef = useRef(new Map<string, number>());
  const sectionSeenRef = useRef(new Set<string>());
  const hasTrackedCalculatorStartRef = useRef(false);
  const hasTrackedPriceViewedRef = useRef(false);
  const hasTrackedSaveQuoteStartRef = useRef(false);

  const funnelContext = useMemo(
    () =>
      createFunnelTrackingContext({
        funnelName: "ppf_full_ppf_calculator",
        landingPageVariant: "google_full_ppf_calculator",
        defaultSourcePlatform: "google",
      }),
    [],
  );

  const estimate = useMemo(
    () =>
      size && finish && warrantyYears
        ? getPpfPriceRange("STEK", warrantyYears, size, "Full Body", finish).min
        : null,
    [finish, size, warrantyYears],
  );

  const selectedSize = size ? sizeOptions.find((option) => option.value === size) ?? null : null;
  const selectedSeries = warrantyYears ? stekSeriesName(warrantyYears) : null;
  const packageLabel = warrantyYears ? `${warrantyYears}-year premium full PPF` : "";
  const isCalculatorComplete = Boolean(size && finish && warrantyYears && estimate !== null);

  const trackEvent = useCallback(
    (eventName: string, payload: Record<string, unknown> = {}) => {
      trackFunnelEvent({
        eventName,
        context: funnelContext,
        payload,
      });
    },
    [funnelContext],
  );

  const buildCalculatorPayload = useCallback(
    () => ({
      size,
      finish,
      warranty_years: warrantyYears,
      package_name: packageLabel || undefined,
      estimate_value: estimate,
      coverage: "Full Body",
      calculator_complete: isCalculatorComplete,
    }),
    [estimate, finish, isCalculatorComplete, packageLabel, size, warrantyYears],
  );

  const trackCalculatorStarted = useCallback(
    (changedField: string) => {
      if (hasTrackedCalculatorStartRef.current) return;
      hasTrackedCalculatorStartRef.current = true;
      trackEvent("calculator_started", {
        changed_field: changedField,
        ...buildCalculatorPayload(),
      });
    },
    [buildCalculatorPayload, trackEvent],
  );

  const trackCalculatorChange = useCallback(
    (changedField: string, nextPayload: Record<string, unknown>) => {
      trackCalculatorStarted(changedField);
      trackEvent("calculator_setup_changed", {
        changed_field: changedField,
        ...buildCalculatorPayload(),
        ...nextPayload,
      });
    },
    [buildCalculatorPayload, trackCalculatorStarted, trackEvent],
  );

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
    [trackEvent],
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
        trackEvent("section_view", { section_name: sectionName });
      }
    });
  }, [trackEvent]);

  const trackPageCheckpoint = useCallback(
    (reason: string) => {
      const visibleSections = Array.from(sectionVisibleSinceRef.current.keys());
      visibleSections.forEach((sectionName) => flushSectionDuration(sectionName, reason));

      trackEvent("page_checkpoint", {
        checkpoint_reason: reason,
        elapsed_ms: Date.now() - sessionStartedAtRef.current,
        max_scroll_percent: maxScrollDepthRef.current,
        visible_sections: visibleSections.join(","),
      });
    },
    [flushSectionDuration, trackEvent],
  );

  useEffect(() => {
    updatePageSEO("ppf-full-ppf-calculator", {
      title: "Full PPF Price Calculator Dubai | Grand Touch Auto",
      description:
        "Calculate a full car PPF starting price in Dubai by vehicle size, finish, and warranty package. Send the quote directly to Grand Touch on WhatsApp.",
      keywords:
        "full PPF Dubai calculator, full car PPF price Dubai, PPF price Dubai, paint protection film Dubai price, luxury car PPF Dubai",
      ogTitle: "Full PPF Price Calculator Dubai",
      ogDescription:
        "Choose your vehicle size, finish, and full PPF package, then send the starting price to Grand Touch on WhatsApp.",
    });

    trackEvent("lp_view", {
      calculator_type: "full_ppf_only",
    });
  }, [trackEvent]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof IntersectionObserver === "undefined") return;

    const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-funnel-section]"));
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const sectionName = (entry.target as HTMLElement).dataset.funnelSection;
          if (!sectionName) return;

          const isActive = entry.isIntersecting && entry.intersectionRatio >= 0.35;
          const isLeaving = !entry.isIntersecting || entry.intersectionRatio <= 0.15;

          if (isActive) {
            if (!sectionVisibleSinceRef.current.has(sectionName)) {
              sectionVisibleSinceRef.current.set(sectionName, Date.now());
            }

            if (!sectionSeenRef.current.has(sectionName)) {
              sectionSeenRef.current.add(sectionName);
              trackEvent("section_view", { section_name: sectionName });
            }
          } else if (isLeaving) {
            flushSectionDuration(sectionName, "scroll_out");
          }
        });
      },
      { threshold: [0, 0.15, 0.35, 0.55, 0.75] },
    );

    sections.forEach((section) => observer.observe(section));
    restartVisibleSectionsFromViewport();
    const visibleSections = sectionVisibleSinceRef.current;

    return () => {
      observer.disconnect();
      Array.from(visibleSections.keys()).forEach((sectionName) => {
        flushSectionDuration(sectionName, "observer_cleanup");
      });
    };
  }, [flushSectionDuration, restartVisibleSectionsFromViewport, trackEvent]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof IntersectionObserver === "undefined") return;

    const priceResult = document.querySelector<HTMLElement>("[data-price-result]");
    if (!priceResult) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting || entry.intersectionRatio < 0.45) return;
        if (hasTrackedPriceViewedRef.current) return;
        hasTrackedPriceViewedRef.current = true;
        if (!isCalculatorComplete) return;
        trackEvent("price_viewed", buildCalculatorPayload());
      },
      { threshold: [0, 0.25, 0.45, 0.7, 1] },
    );

    observer.observe(priceResult);
    return () => observer.disconnect();
  }, [buildCalculatorPayload, isCalculatorComplete, trackEvent]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateScrollDepth = () => {
      const doc = document.documentElement;
      const scrollableHeight = Math.max(doc.scrollHeight - window.innerHeight, 1);
      const currentPercent = Math.min(
        100,
        Math.round(((window.scrollY || doc.scrollTop || 0) / scrollableHeight) * 100),
      );

      if (currentPercent > maxScrollDepthRef.current) {
        maxScrollDepthRef.current = currentPercent;
      }

      SCROLL_DEPTH_MILESTONES.forEach((milestone) => {
        if (currentPercent < milestone || scrollMilestonesTrackedRef.current.has(milestone)) return;
        scrollMilestonesTrackedRef.current.add(milestone);
        trackEvent("scroll_depth_reached", {
          scroll_percent: milestone,
          current_scroll_percent: currentPercent,
        });
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

    const onPageHide = () => trackPageCheckpoint("pagehide");
    const onBeforeUnload = () => trackPageCheckpoint("beforeunload");

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [restartVisibleSectionsFromViewport, trackEvent, trackPageCheckpoint]);

  const generalWhatsAppMessage = useMemo(() => {
    const carLine = carDetails.trim() ? ` My car is: ${carDetails.trim()}.` : "";
    return [
      "Hi Sean, I came from the Grand Touch Google PPF calculator page.",
      carLine,
      "Can you help me choose the right full PPF setup for my car?",
    ]
      .filter(Boolean)
      .join(" ");
  }, [carDetails]);

  const priceWhatsAppMessage = useMemo(() => {
    const carLine = carDetails.trim() ? ` My car is: ${carDetails.trim()}.` : "";
    if (!isCalculatorComplete || !estimate || !finish || !packageLabel || !selectedSize) {
      return generalWhatsAppMessage;
    }

    return [
      "Hi Sean, I came from the Grand Touch Google PPF calculator page.",
      carLine,
      `Setup: ${packageLabel}, ${finish.toLowerCase()} finish, ${selectedSize.label}.`,
      `Starting price shown: ${formatAED(estimate)} + VAT.`,
      "Can you confirm exact price and earliest availability?",
    ]
      .filter(Boolean)
      .join(" ");
  }, [carDetails, estimate, finish, generalWhatsAppMessage, isCalculatorComplete, packageLabel, selectedSize]);

  const handleWhatsAppClick = useCallback(
    (placement: string) => {
      const isPriceResultCta = placement === "price_result" && isCalculatorComplete;
      const messageType = isPriceResultCta ? "selected_price" : "general_calculator";
      const eventName = isPriceResultCta ? "selected_price_whatsapp_click" : "general_whatsapp_click";
      trackEvent("whatsapp_click", {
        cta_location: placement,
        size,
        finish,
        warranty_years: warrantyYears,
        estimate_value: isPriceResultCta ? estimate : undefined,
        coverage: "Full Body",
        message_type: messageType,
        calculator_complete: isCalculatorComplete,
      });
      trackEvent(eventName, {
        cta_location: placement,
        ...buildCalculatorPayload(),
        message_type: messageType,
      });
      trackGoogleAdsConversion(GOOGLE_ADS_WHATSAPP_CONTACT_SEND_TO);
      window.open(
        buildWhatsAppUrl(isPriceResultCta ? priceWhatsAppMessage : generalWhatsAppMessage),
        "_blank",
        "noopener,noreferrer",
      );
    },
    [
      buildCalculatorPayload,
      estimate,
      finish,
      generalWhatsAppMessage,
      isCalculatorComplete,
      priceWhatsAppMessage,
      size,
      trackEvent,
      warrantyYears,
    ],
  );

  const handleSaveQuote = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isCalculatorComplete || estimate === null || !finish || !size || !packageLabel) return;

    setSaveStatus("saving");

    trackEvent("save_quote_submitted", {
      form_type: "save_quote",
      ...buildCalculatorPayload(),
      has_car_details: Boolean(carDetails.trim()),
    });
    trackEvent("lead_form_submitted", {
      form_type: "save_quote",
      size,
      finish,
      warranty_years: warrantyYears,
      estimate_value: estimate,
      coverage: "Full Body",
    });

    const result = await captureLeadSnapshot({
      snapshotType: "submit",
      context: funnelContext,
      fullName: name.trim(),
      phone: phone.trim(),
      vehicleModel: carDetails.trim(),
      payload: {
        service_name: "Full PPF Calculator Lead",
        service_price: estimate,
        final_price: estimate,
        package_name: packageLabel,
        finish,
        vehicle_size: size,
        coverage: "Full Body",
      },
    });

    if (result.ok) {
      setSaveStatus("saved");
      trackGoogleAdsConversion(GOOGLE_ADS_SUBMIT_LEAD_SEND_TO);
    } else {
      setSaveStatus("error");
    }
  };

  const handleSaveQuoteStarted = () => {
    if (hasTrackedSaveQuoteStartRef.current) return;
    hasTrackedSaveQuoteStartRef.current = true;
    trackEvent("save_quote_started", buildCalculatorPayload());
  };

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <main>
        <section data-funnel-section="hero" className="relative overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_18%_0%,rgba(247,181,43,0.16),transparent_30%),linear-gradient(180deg,#111,#080808)] px-4 pb-10 pt-7 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-6xl">
            <header className="flex items-center justify-between gap-4">
              <a href="/" aria-label="Grand Touch Auto home" className="inline-flex items-center">
                <img src={logo} alt="Grand Touch Auto" className="h-10 w-auto sm:h-12" />
              </a>
              <Button
                type="button"
                className="hidden bg-[#25D366] font-semibold text-white hover:bg-[#1fbe5c] sm:inline-flex"
                onClick={() => handleWhatsAppClick("top_nav")}
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                WhatsApp Quote
              </Button>
            </header>

            <div className="grid gap-7 pt-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:pt-14">
              <div className="max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <GoogleRating />
                  <Badge className="border-[#f7b52b]/20 bg-[#f7b52b]/12 text-[#ffd47a] hover:bg-[#f7b52b]/12">
                    Full PPF only
                  </Badge>
                </div>
                <h1 className="mt-5 text-[3rem] font-black leading-[0.95] tracking-tight sm:text-6xl lg:text-[4.55rem]">
                  Full Car PPF Price in Dubai
                </h1>
                <p className="mt-4 max-w-xl text-lg leading-8 text-slate-200">
                  See your Grand Touch full-car PPF starting price in under 30 seconds. Choose your
                  car size, finish, and warranty package, then send the setup on WhatsApp to confirm
                  availability.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {trustPoints.map((point) => (
                    <span
                      key={point}
                      className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-200"
                    >
                      {point}
                    </span>
                  ))}
                </div>
                <div className="mt-6 grid gap-3 sm:grid-cols-[0.85fr_1fr]">
                  <a href="#calculator" className="inline-flex">
                    <Button type="button" className="w-full bg-[#f7b52b] font-semibold text-black hover:bg-[#ffc54d]">
                      Start Calculator
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </a>
                  <Button
                    type="button"
                    variant="outline"
                    className="hidden border-white/16 bg-white/[0.03] text-white hover:bg-white/[0.08] sm:inline-flex"
                    onClick={() => handleWhatsAppClick("hero_secondary")}
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    WhatsApp Quote
                  </Button>
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-300 sm:hidden">
                  Most SUV and premium packages calculate between AED 8,990 and AED 14,500 + VAT.
                </p>
                <div className="mt-7 hidden rounded-[26px] border border-[#f7b52b]/18 bg-[#f7b52b]/10 p-4 sm:block">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#ffd47a]">
                    Full PPF starting point
                  </p>
                  <p className="mt-2 text-2xl font-bold">Full PPF from AED 7,990 + VAT</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Most SUV and premium packages calculate between AED 8,990 and AED 14,500 + VAT.
                    Use the calculator to see where your car sits.
                  </p>
                </div>
              </div>

              <Card id="calculator" data-funnel-section="calculator" className="overflow-hidden rounded-[32px] border-[#f7b52b]/16 bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(10,10,10,0.98))] p-4 shadow-[0_28px_90px_rgba(0,0,0,0.34)] sm:p-5">
                <div className="grid gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/50">1. Vehicle size</p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {sizeOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setSize(option.value);
                            trackCalculatorChange("size", { size: option.value });
                          }}
                          className={cn(
                            "overflow-hidden rounded-[22px] border text-left transition",
                            size === option.value
                              ? "border-[#f7b52b] bg-[#f7b52b]/10 shadow-[0_0_0_1px_rgba(247,181,43,0.22)]"
                              : "border-white/10 bg-white/[0.03] hover:border-[#f7b52b]/45",
                          )}
                        >
                          <div className="relative aspect-video bg-black">
                            <img src={option.image} alt={option.label} className="h-full w-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                            <p className="absolute bottom-2 left-3 text-sm font-bold">{option.label}</p>
                          </div>
                          <p className="px-3 py-2 text-xs leading-5 text-slate-300">{option.example}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/50">2. Finish</p>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {finishOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                              setFinish(option.value);
                              trackCalculatorChange("finish", { finish: option.value });
                            }}
                            className={cn(
                              "rounded-[18px] border px-3 py-3 text-left transition",
                              finish === option.value
                                ? "border-[#f7b52b] bg-[#f7b52b]/10"
                                : "border-white/10 bg-white/[0.03] hover:border-[#f7b52b]/45",
                            )}
                          >
                            <p className="font-semibold">{option.label}</p>
                            <p className="mt-1 text-xs text-slate-400">{option.helper}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/50">3. Package</p>
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        {packageOptions.map((option) => (
                          <button
                            key={option.years}
                            type="button"
                            onClick={() => {
                              setWarrantyYears(option.years);
                              trackCalculatorChange("warranty_years", {
                                warranty_years: option.years,
                                package_name: `${option.years}-year premium full PPF`,
                              });
                            }}
                            className={cn(
                              "relative rounded-[18px] border px-2 py-3 text-left transition",
                              warrantyYears === option.years
                                ? "border-[#f7b52b] bg-[#f7b52b]/10"
                                : "border-white/10 bg-white/[0.03] hover:border-[#f7b52b]/45",
                            )}
                          >
                            {option.badge ? (
                              <span className="absolute -top-2 left-2 rounded-full bg-[#f7b52b] px-2 py-0.5 text-[9px] font-black uppercase text-black">
                                Popular
                              </span>
                            ) : null}
                            <p className="text-lg font-black">{option.years}</p>
                            <p className="text-[10px] uppercase tracking-[0.14em] text-slate-400">Years</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div data-price-result className="rounded-[28px] border border-[#f7b52b]/20 bg-[radial-gradient(circle_at_top_left,rgba(247,181,43,0.22),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(8,8,8,0.96))] p-5">
                    <div className="flex flex-wrap gap-2">
                      {[selectedSize?.label, finish, packageLabel, selectedSeries].filter(Boolean).map((chip) => (
                        <span key={chip} className="rounded-full border border-white/10 bg-black/24 px-3 py-1 text-xs font-semibold">
                          {chip}
                        </span>
                      ))}
                      {!isCalculatorComplete ? (
                        <span className="rounded-full border border-white/10 bg-black/24 px-3 py-1 text-xs font-semibold text-slate-300">
                          Choose size, finish, and warranty
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-4 text-xs font-semibold uppercase tracking-[0.24em] text-white/55">Starting from</p>
                    <p className="mt-1 text-[3.35rem] font-black leading-none tracking-tight sm:text-[4.5rem]">
                      {estimate !== null ? formatAED(estimate) : "Select setup"}
                    </p>
                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                      {isCalculatorComplete
                        ? "Prices exclude VAT. Final quote depends on vehicle and paint condition."
                        : "Pick all three options to show the starting price and send the exact setup."}
                    </p>
                    <div className="mt-5 grid gap-2 text-sm text-slate-200 sm:grid-cols-2">
                      {["Full-car PPF installation", "Paint prep before film", "Handover inspection", "Warranty registration"].map((item) => (
                        <div key={item} className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-[#f7b52b]" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_0.72fr]">
                      <Button
                        type="button"
                        size="lg"
                        disabled={!isCalculatorComplete}
                        className="bg-[#25D366] text-white shadow-[0_18px_46px_rgba(37,211,102,0.26)] hover:bg-[#1fbe5c] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/45 disabled:shadow-none"
                        onClick={() => handleWhatsAppClick("price_result")}
                      >
                        <MessageCircle className="mr-2 h-4 w-4" />
                        {isCalculatorComplete ? "Send Price on WhatsApp" : "Choose Setup First"}
                      </Button>
                      <a href="#save-quote" className="inline-flex">
                        <Button type="button" size="lg" variant="outline" disabled={!isCalculatorComplete} className="w-full border-white/16 bg-white/[0.03] text-white hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:text-white/40">
                          Save Quote
                        </Button>
                      </a>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        <section id="owner-standard" data-funnel-section="owner_standard" className="border-b border-white/10 px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
          <div className="container mx-auto max-w-6xl">
            <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-[radial-gradient(circle_at_18%_0%,rgba(247,181,43,0.14),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.055),rgba(10,10,10,0.98))] p-4 shadow-[0_28px_90px_rgba(0,0,0,0.32)] sm:rounded-[30px] sm:p-7 lg:p-8">
              <div className="grid gap-4 sm:gap-7 lg:grid-cols-[1.1fr_0.9fr] lg:items-stretch">
                <div className="relative z-10">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
                        Why it holds value
                      </p>
                      <h2 className="mt-2 text-[1.82rem] font-black leading-[1] sm:mt-3 sm:text-4xl sm:leading-tight lg:text-5xl">
                        Sean-led quote.
                        <span className="block sm:hidden">Prep checked.</span>
                        <span className="hidden sm:block">Prep before film.</span>
                        <span className="block text-[#f7b52b]">
                          <span className="sm:hidden">Warranty registered.</span>
                          <span className="hidden sm:inline">Registered warranty.</span>
                        </span>
                      </h2>
                      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:mt-4 sm:text-base sm:leading-7">
                        <span className="sm:hidden">
                          Your price includes Sean-led advice, proper prep, handover, and warranty proof.
                        </span>
                        <span className="hidden sm:inline">
                          The calculator gives the starting number. The standard behind it is personal:
                          Sean-led advice, proper prep, a clean handover, and warranty proof you can trace.
                        </span>
                      </p>
                    </div>
                    <img
                      src="/chat-to-sean.png"
                      alt="Sean from Grand Touch"
                      className="mt-9 h-auto w-16 shrink-0 drop-shadow-[0_18px_40px_rgba(0,0,0,0.38)] sm:mt-0 sm:w-28 lg:w-36"
                      loading="lazy"
                    />
                  </div>

                  <div className="mt-4 grid gap-2 sm:hidden">
                    <div className="flex items-start gap-2 rounded-xl border border-white/10 bg-black/24 px-3 py-2.5">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#f7b52b]" />
                      <p className="text-sm font-semibold leading-5 text-white">Sean stands behind the quote.</p>
                    </div>
                    <div className="flex items-start gap-2 rounded-xl border border-white/10 bg-black/24 px-3 py-2.5">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#f7b52b]" />
                      <p className="text-sm font-semibold leading-5 text-white">Prep checked before film.</p>
                    </div>
                    <div className="flex items-start gap-2 rounded-xl border border-white/10 bg-black/24 px-3 py-2.5">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#f7b52b]" />
                      <p className="text-sm font-semibold leading-5 text-white">Warranty proof after handover.</p>
                    </div>
                  </div>

                  <div className="mt-6 hidden gap-3 sm:grid sm:grid-cols-2">
                    {ownerStandardCards.slice(0, 2).map((item) => (
                      <Card key={item.title} className="rounded-[22px] border-white/10 bg-black/22 p-4">
                        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#f7b52b]">
                          {item.eyebrow}
                        </p>
                        <h3 className="mt-3 text-xl font-semibold text-white">{item.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-300">{item.text}</p>
                      </Card>
                    ))}
                    <Card className="rounded-[22px] border-white/10 bg-black/22 p-4 sm:col-span-2">
                      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#f7b52b]">
                        {ownerStandardCards[2].eyebrow}
                      </p>
                      <h3 className="mt-3 text-xl font-semibold text-white">{ownerStandardCards[2].title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-300">{ownerStandardCards[2].text}</p>
                    </Card>
                  </div>

                  <div className="mt-4 hidden gap-2 sm:mt-6 sm:grid sm:grid-cols-[1fr_0.72fr]">
                    <a href="#calculator" className="inline-flex">
                      <Button type="button" className="w-full bg-[#f7b52b] font-semibold text-black hover:bg-[#ffc54d]">
                        See My Package
                        <span className="hidden sm:inline">&nbsp;Fit</span>
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </a>
                    <Button
                      type="button"
                      variant="outline"
                      className="border-white/16 bg-white/[0.03] text-white hover:bg-white/[0.08]"
                      onClick={() => handleWhatsAppClick("owner_standard_section")}
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Ask Sean
                    </Button>
                  </div>
                </div>

                <div className="relative aspect-video overflow-hidden rounded-[20px] border border-white/10 bg-black shadow-[0_24px_70px_rgba(0,0,0,0.36)] sm:rounded-[28px] lg:aspect-auto lg:min-h-[320px]">
                  <video
                    className="h-full w-full object-cover"
                    src={TRUST_HANDOVER_VIDEO}
                    poster="/mark-zeekr-001.png"
                    muted
                    loop
                    playsInline
                    autoPlay
                    preload="metadata"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                  <div className="absolute bottom-5 left-5 right-5">
                    <p className="text-[11px] font-black uppercase tracking-[0.24em] text-white/65">
                      Real handover
                    </p>
                    <p className="mt-1 text-xl font-bold leading-tight text-white sm:mt-2 sm:text-2xl">
                      See the finish before sign-off.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="save-quote" data-funnel-section="save_quote" className="border-b border-white/10 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <div className="container mx-auto max-w-6xl">
            <div className="grid gap-5 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
              <div>
                <p className="text-sm uppercase tracking-[0.26em] text-[#f7b52b]">Save your setup</p>
                <h2 className="mt-2 text-2xl font-bold leading-tight sm:text-4xl">Save this quote before you WhatsApp.</h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base sm:leading-7">
                  WhatsApp stays the fastest route. Saving the quote also gives the team your exact setup,
                  so the reply is not vague.
                </p>
              </div>
              <Card className="rounded-[22px] border-white/10 bg-white/[0.035] p-4 sm:rounded-[28px] sm:p-5">
                <form onSubmit={handleSaveQuote} onFocus={handleSaveQuoteStarted} className="grid gap-3 sm:grid-cols-3">
                  <Input
                    required
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Name"
                    className="border-white/10 bg-black/28 text-white placeholder:text-white/38"
                  />
                  <Input
                    required
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="WhatsApp number"
                    className="border-white/10 bg-black/28 text-white placeholder:text-white/38"
                  />
                  <Input
                    value={carDetails}
                    onChange={(event) => setCarDetails(event.target.value)}
                    placeholder="Car model"
                    className="border-white/10 bg-black/28 text-white placeholder:text-white/38"
                  />
                  <div className="sm:col-span-3 grid gap-3 sm:grid-cols-[1fr_0.78fr]">
                    <Button type="submit" disabled={saveStatus === "saving" || !isCalculatorComplete} className="bg-[#f7b52b] font-semibold text-black hover:bg-[#ffc54d] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40">
                      {saveStatus === "saving"
                        ? "Saving..."
                        : isCalculatorComplete
                          ? "Save Quote & Request Availability"
                          : "Choose Setup Before Saving"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="border-white/16 bg-white/[0.03] text-white hover:bg-white/[0.08]"
                      onClick={() => handleWhatsAppClick("save_quote_section")}
                    >
                      Open WhatsApp
                    </Button>
                  </div>
                  {saveStatus === "saved" ? (
                    <p className="sm:col-span-3 text-sm font-semibold text-[#8ff0b1]">
                      Quote saved. Open WhatsApp for the fastest reply.
                    </p>
                  ) : null}
                  {saveStatus === "error" ? (
                    <p className="sm:col-span-3 text-sm font-semibold text-red-200">
                      Could not confirm CRM save from this browser. WhatsApp still sends your setup.
                    </p>
                  ) : null}
                </form>
              </Card>
            </div>
          </div>
        </section>

        <section data-funnel-section="film_proof" className="border-b border-white/10 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
          <div className="container mx-auto max-w-6xl">
            <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)] lg:items-center">
              <div className="relative hidden max-h-[260px] overflow-hidden rounded-[28px] border border-white/10 bg-black/35 sm:block lg:max-h-none">
                <img src={stekWarrantySticker} alt="Warranty proof sticker" className="h-full max-h-[260px] w-full object-cover lg:aspect-[4/3] lg:max-h-none" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-white/60">Warranty proof</p>
                  <p className="mt-1 text-xl font-semibold">Traceable handover support</p>
                </div>
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.26em] text-[#f7b52b]">Film credibility</p>
                <h2 className="mt-2 text-2xl font-bold leading-tight sm:text-4xl">Film and warranty proof, without the confusion.</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base sm:leading-7">
                  First, get the full PPF starting price for your car. Then check the film, finish,
                  handover, and warranty proof that sit behind the quote.
                </p>
                <div className="mt-5 rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(10,10,10,0.98))] p-4 sm:mt-6 sm:rounded-[28px] sm:p-5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#f7b52b]">
                        Premium films available
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-300">
                        Final film recommendation is confirmed after we know the car, finish, and
                        warranty target.
                      </p>
                    </div>
                    <p className="hidden text-xs font-semibold uppercase tracking-[0.2em] text-white/45 sm:block">
                      Grand Touch install standard first
                    </p>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
                    {filmLogoTiles.map((logo) => (
                      <div
                        key={logo.name}
                        className={cn(
                          "flex min-h-[58px] items-center justify-center overflow-hidden rounded-xl border px-3 py-2 shadow-[0_14px_36px_rgba(0,0,0,0.18)] sm:min-h-[82px] sm:rounded-[20px] sm:px-4 sm:py-4",
                          logo.surface === "light"
                            ? "border-white/10 bg-white"
                            : "border-white/10 bg-black/45"
                        )}
                      >
                        <img
                          src={logo.src}
                          alt={`${logo.name} logo`}
                          className={cn("max-w-full object-contain", logo.className)}
                          loading="lazy"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section data-funnel-section="handover_proof" className="border-b border-white/10 bg-[radial-gradient(circle_at_70%_20%,rgba(247,181,43,0.08),transparent_28%)] px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
          <div className="container mx-auto max-w-6xl">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.26em] text-slate-400">Customer reviews and work</p>
                <h2 className="mt-2 text-2xl font-bold leading-tight sm:text-4xl">Real buyers, real handovers, real cars.</h2>
              </div>
              <GoogleRating />
            </div>
            <div className="mt-5 flex gap-3 overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-3 md:overflow-visible md:pb-0 md:gap-4">
              {handoverCards.map((card) => (
                <Card key={card.title} className="flex h-full min-w-[82%] flex-col rounded-[20px] border-white/10 bg-white/[0.035] p-4 sm:rounded-[26px] sm:p-5 md:min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#f7b52b]">{card.eyebrow}</p>
                  <h3 className="mt-2 text-lg font-semibold sm:text-xl">{card.title}</h3>
                  <p className="mt-2 hidden text-sm leading-6 text-slate-300 sm:block">{card.text}</p>
                  <div className="mt-4">
                    <VideoModalCard
                      title={card.modalTitle}
                      description={card.modalDescription}
                      videoSrc={card.videoSrc}
                      posterSrc={card.posterSrc}
                      eyebrow={card.modalEyebrow}
                    />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section data-funnel-section="final_cta" className="px-4 py-12 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-6xl">
            <Card className="rounded-[30px] border-[#f7b52b]/20 bg-[radial-gradient(circle_at_top_left,rgba(247,181,43,0.16),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.055),rgba(10,10,10,0.98))] p-6 sm:p-8">
              <div className="grid gap-5 lg:grid-cols-[1fr_0.5fr] lg:items-center">
                <div>
                  <p className="text-sm uppercase tracking-[0.26em] text-[#f7b52b]">Ready to confirm?</p>
                  <h2 className="mt-2 text-3xl font-bold leading-tight sm:text-4xl">
                    Ask Sean to confirm the right setup.
                  </h2>
                  <p className="mt-3 max-w-2xl text-base leading-7 text-slate-300">
                    If you want to send the selected price, use the green button inside the calculator result.
                    This button starts a general WhatsApp chat from the calculator page.
                  </p>
                </div>
                <Button
                  type="button"
                  size="lg"
                  className="bg-[#25D366] text-white hover:bg-[#1fbe5c]"
                  onClick={() => handleWhatsAppClick("final_cta")}
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Ask Sean on WhatsApp
                </Button>
              </div>
            </Card>
          </div>
        </section>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black/85 p-3 backdrop-blur md:hidden">
        <Button
          type="button"
          className="w-full bg-[#25D366] text-white hover:bg-[#1fbe5c]"
          onClick={() => handleWhatsAppClick("mobile_sticky")}
        >
          <MessageCircle className="mr-2 h-4 w-4" />
          Ask Sean on WhatsApp
        </Button>
      </div>
    </div>
  );
};

export default PpfFullPpfCalculator;
