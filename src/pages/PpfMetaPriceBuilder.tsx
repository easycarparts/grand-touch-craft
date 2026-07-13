import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Award,
  BadgeCheck,
  BadgePercent,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Gift,
  Handshake,
  Lock,
  MapPin,
  MessageCircle,
  Phone,
  Play,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
  UserCheck,
  Volume2,
  VolumeX,
  Wrench,
  X,
} from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PhoneInputWithCountry } from "@/components/PhoneInputWithCountry";
import stekWarrantySticker from "../../Landscape STEK Sticker.png";
import {
  captureLeadSnapshot,
  createFunnelTrackingContext,
  trackFunnelEvent,
  type MetaStandardEvent,
} from "@/lib/funnel-analytics";
import { updatePageSEO } from "@/lib/seo";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.svg";

/**
 * META PRICE BUILDER (2026-07) — Meta-ads PPF funnel forked from
 * PpfFullPpfGuidedCalculatorV2 (same playbook TintDubaiQuoteFunnel used):
 * identity hardcoded, the other variant configs deleted, and the multi-step
 * stepper replaced by a ONE-SCREEN price builder — every control always
 * visible, the exact price updating live on each tap (the stepper lost ~75%
 * of starters before they ever saw a price). The proven trust stack below the
 * fold (handover reactions, reviews carousel, Meet Sean, install-risk,
 * process, credibility, FAQ, service area, final CTA) is preserved from the
 * fork as-is.
 *
 * Tracking is META ONLY:
 *   - fbq("track", "Contact") on every WhatsApp tap
 *   - fbq("track", "Lead") ONCE per session, on successful phone capture
 *   - NO Google Ads conversions, NO TikTok pixel, NO fbq("trackCustom") calls
 *     (trackFunnelEvent already forwards only Meta STANDARD events — see the
 *     2026-07-08 pixel-flooding fix in funnel-analytics.ts).
 */

type PpfLine = "signature" | "core";
type BuilderSize = "normal" | "suv_xl";
type WarrantyYears = 5 | 10 | 12;
type BuilderFinish = "Gloss" | "Matte";

const WHATSAPP_NUMBER = "971567191045";
const DISPLAY_PHONE = "+971 56 719 1045";
const TEL_HREF = "tel:+971567191045";
const PAGE_URL = "https://www.grandtouchauto.ae/ppf-meta-builder";
const SEO_KEY = "ppf-meta-builder";

// Dubai install slot windows — rolling, cosmetic only. Used to give a "next available" feel.
const SLOTS_PER_WEEK = 4;
const SLOTS_REMAINING_THIS_WEEK = 2;

// ── PRICING (gloss, AED, excl. VAT) ─────────────────────────────────────────
// Matte adds +500 on everything EXCEPT Signature 5-year, where matte is
// included at the gloss price. Core has no 12-year package — selecting Core
// while on 12 falls back to 10.
const MATTE_UPCHARGE = 500;

const PPF_PRICE_TABLE: Record<
  PpfLine,
  Partial<Record<WarrantyYears, Record<BuilderSize, number>>>
> = {
  signature: {
    5: { normal: 8490, suv_xl: 8990 },
    10: { normal: 9990, suv_xl: 10490 },
    12: { normal: 11990, suv_xl: 12490 },
  },
  core: {
    5: { normal: 6990, suv_xl: 7490 },
    10: { normal: 8990, suv_xl: 8990 },
  },
};

const isMatteIncluded = (line: PpfLine, years: WarrantyYears) =>
  line === "signature" && years === 5;

const warrantyAvailable = (line: PpfLine, years: WarrantyYears) =>
  Boolean(PPF_PRICE_TABLE[line][years]);

/** Exact build price. Falls back to 10-year if a line/warranty combo doesn't exist. */
const priceFor = (
  line: PpfLine,
  years: WarrantyYears,
  size: BuilderSize,
  finish: BuilderFinish,
) => {
  const effectiveYears: WarrantyYears = warrantyAvailable(line, years) ? years : 10;
  const base = PPF_PRICE_TABLE[line][effectiveYears]![size];
  return (
    base + (finish === "Matte" && !isMatteIncluded(line, effectiveYears) ? MATTE_UPCHARGE : 0)
  );
};

/** Mirrors the funnel-wide 20% online-offer anchor math. */
const listPriceFor = (target: number) => Math.round(target / 0.8 / 10) * 10;

const sizeOptions: Array<{
  value: BuilderSize;
  label: string;
  sub: string;
  example: string;
}> = [
  {
    value: "normal",
    label: "Normal",
    sub: "Hatch · sedan · coupe · sports",
    example: "Golf / E-Class / 911",
  },
  {
    value: "suv_xl",
    label: "SUV & XL",
    sub: "SUV · 4x4 · pickup",
    example: "Patrol / Defender / Cayenne",
  },
];

const lineOptions: Array<{
  value: PpfLine;
  name: string;
  shortName: string;
  brands: string;
  tagline: string;
}> = [
  {
    value: "signature",
    name: "Signature PPF",
    shortName: "Signature",
    brands: "GENUINE STEK · GYEON",
    tagline: "The premium aesthetic film",
  },
  {
    value: "core",
    name: "Core PPF",
    shortName: "Core",
    brands: "PROTECT+ · SUPREME · SUNSTOP · KDX",
    tagline: "Serious protection, smarter price",
  },
];

const warrantyChoices: WarrantyYears[] = [5, 10, 12];

const finishOptions: Array<{ value: BuilderFinish; label: string; helper: string }> = [
  { value: "Gloss", label: "Gloss", helper: "Factory paint look" },
  { value: "Matte", label: "Matte", helper: "Satin stealth" },
];

const lockBonuses = [
  { icon: Truck, text: "Free pickup & drop-off across Dubai" },
  { icon: ShieldCheck, text: "Warranty registered in your name" },
  { icon: Lock, text: "This price locked for 14 days" },
];

/**
 * FAQ for the trust section below the calculator. Copy mirrors the high-trust
 * tone used on PpfDubaiQuote — anti-hype, install-quality-focused, Sean-led
 * accountability. Six questions chosen to cover every common bounce trigger:
 * coverage, finish, install quality, what's actually included, warranty
 * registration, and install timing.
 */
const trustFaqs: Array<{ question: string; answer: string }> = [
  {
    question: "Is full front enough, or should I go full body?",
    answer:
      "Full front works if you only want the highest-impact areas covered and want to keep spend tighter. Full body is the better fit if you want every painted panel protected, plan to keep the car longer, or simply don't want doors, quarters, and rear left exposed. Sean tells you quickly which route fits your car.",
  },
  {
    question: "Should I choose gloss or matte PPF?",
    answer:
      "Gloss keeps the factory shine — right if you want the car to look clean, bright, and close to OEM. Matte gives the paint a satin finish, suited to buyers who want a more deliberate, stealthier look. The right answer depends on the look you want every day, not just on delivery day.",
  },
  {
    question: "How do you avoid poor fitment, lifting edges, and bad prep?",
    answer:
      "The control point is prep and fitment discipline, not just the film brand. Paint is decontaminated, corrected, and checked before install starts. Every piece is hand-cut off the car first — no blade touches your paint. If cleanliness or prep is off, the job is reset before film goes on. Lifting edges, trapped contamination, and weak finish usually begin long before the handover — which is why we don't skip stages.",
  },
  {
    question: "What does the quote already include?",
    answer:
      "The price isn't just film on paint. It includes decontamination, paint prep, the hand-cut install, final QC, and the warranty registration in your name. Prices exclude VAT. Final pricing depends on the car, paint condition, and panel complexity once the vehicle is inspected.",
  },
  {
    question: "How does the warranty registration work?",
    answer:
      "After installation and the one-week check, the film is registered with its manufacturer — STEK on Signature builds, the respective film brand on Core builds — so the warranty is traceable to the actual material on your car. Most buyers are told they have warranty cover without ever seeing the registration trail — we send you yours.",
  },
  {
    question: "How long does PPF installation usually take?",
    answer:
      "Depends on the car, coverage, and how much prep is needed. A smaller package can move faster; full-body protection on a larger car takes longer because prep, fitment, and final QC all matter as much as the film. Sean confirms realistic timing once he knows the car and the package.",
  },
  {
    question: "Will PPF damage my paint when it's eventually removed?",
    answer:
      "No — when quality film is removed by a trained installer it lifts cleanly off intact factory paint and leaves no residue. The risk only appears with cheap films or aggressive removal on already-failing clearcoat. That's why we won't install on paint we haven't inspected.",
  },
  {
    question: "Does the PPF cover stone chips and rock damage?",
    answer:
      "Yes — protecting against road impact is what PPF is designed for. Daily Dubai driving (Sheikh Zayed, Hessa, Emirates Road) is brutal on front bumpers, bonnets, and mirrors, which is why we always recommend at least the high-impact zones be fully wrapped, even on a partial package.",
  },
  {
    question: "Can I bring my own film, or does Grand Touch supply it?",
    answer:
      "We only install film we supply — STEK and GYEON on Signature builds; Protect+, Supreme, Sunstop, and KDX on Core builds — because we stand behind the warranty and we know the batch. Customer-supplied film breaks the chain of accountability — if anything fails later, no one owns it. The film cost is included in the package figures you see.",
  },
  {
    question: "Is the warranty transferable if I sell the car?",
    answer:
      "Yes. The warranty registration is tied to the vehicle, not the owner, so a future buyer inherits the remaining warranty term and inspection support. We hand over the documentation so the next owner can prove the install is legitimate.",
  },
];

const buildWhatsAppUrl = (message: string) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

const formatAED = (value: number) => `AED ${value.toLocaleString("en-AE")}`;

const phoneDigits = (value: string) => value.replace(/\D/g, "");

const localPhoneDigits = (value: string) => {
  const digits = phoneDigits(value);
  if (digits.startsWith("971")) return digits.slice(3);
  return digits;
};

const isLikelyRealPhone = (value: string) => {
  const digits = phoneDigits(value);
  const local = localPhoneDigits(value);
  if (!local) return false;
  if (/^(\d)\1+$/.test(local)) return false;
  if (digits.startsWith("971")) {
    return /^5\d{8}$/.test(local);
  }
  return digits.length >= 10 && digits.length <= 15 && local.length >= 7;
};

/**
 * Inline Google wordmark — coloured letters, no logo download required.
 * Duplicated from HomeTrustStrip so the hero badges don't depend on that
 * component being mounted (it lives below the calculator).
 */
const HeroGoogleWordmark = ({ className }: { className?: string }) => (
  <span aria-label="Google" className={cn("font-semibold tracking-tight", className)}>
    <span className="text-[#4285F4]">G</span>
    <span className="text-[#EA4335]">o</span>
    <span className="text-[#FBBC05]">o</span>
    <span className="text-[#4285F4]">g</span>
    <span className="text-[#34A853]">l</span>
    <span className="text-[#EA4335]">e</span>
  </span>
);

type HeroTrustBadgesProps = {
  size?: "sm" | "md";
  className?: string;
};

/**
 * Above-the-fold social-proof row used in both the mobile and desktop hero.
 * Three signals — Google 4.9★ rating, Authorised STEK installer, and
 * Sean-led handovers — chosen because they answer the three biggest
 * "is this legit?" questions a Google PPC visitor has on first scroll.
 */
const HeroTrustBadges = ({ size = "sm", className }: HeroTrustBadgesProps) => {
  const isMd = size === "md";
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5 sm:gap-2", className)}>
      <div
        className={cn(
          "flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-2.5",
          isMd ? "py-2" : "py-1.5",
        )}
      >
        <HeroGoogleWordmark className={isMd ? "text-sm" : "text-xs"} />
        <div className="flex items-center gap-0.5 text-[#fbbc05]">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              className={cn("fill-current", isMd ? "h-3.5 w-3.5" : "h-3 w-3")}
            />
          ))}
        </div>
        <span className={cn("font-black tabular-nums text-white", isMd ? "text-sm" : "text-xs")}>
          4.9
        </span>
      </div>

      <div
        className={cn(
          "flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-2.5",
          isMd ? "py-2" : "py-1.5",
        )}
      >
        <img
          src="/stek-logo.webp"
          alt="STEK"
          loading="lazy"
          className={cn("w-auto object-contain opacity-95", isMd ? "h-4" : "h-3")}
        />
        <span
          className={cn(
            "font-black uppercase tracking-[0.12em] text-white",
            isMd ? "text-[11px]" : "text-[10px]",
          )}
        >
          Authorised installer
        </span>
      </div>

      <div
        className={cn(
          "hidden items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-2.5 sm:flex",
          isMd ? "py-2" : "py-1.5",
        )}
      >
        <UserCheck
          className={cn("text-[#f7b52b]", isMd ? "h-4 w-4" : "h-3.5 w-3.5")}
        />
        <span
          className={cn(
            "font-black uppercase tracking-[0.12em] text-white",
            isMd ? "text-[11px]" : "text-[10px]",
          )}
        >
          Sean-led handovers
        </span>
      </div>
    </div>
  );
};

type TrustSectionCtaProps = {
  placement: string;
  onEstimate: (placement: string) => void;
  /** Omit to hide the WhatsApp button (lead-form-style variants). */
  onWhatsApp?: (placement: string) => void;
  primaryLabel?: string;
  whatsappLabel?: string;
  microcopy?: string;
  align?: "start" | "center";
};

/**
 * Standardised dual-CTA block reused at the bottom of every trust section so
 * every objection answer has an immediate way to act — either jump back into
 * the guided calculator or skip straight to WhatsApp. Keeps gold = funnel,
 * green = WhatsApp consistent across the page.
 */
const TrustSectionCta = ({
  placement,
  onEstimate,
  onWhatsApp,
  primaryLabel = "Get my PPF estimate",
  whatsappLabel = "WhatsApp Sean",
  microcopy = "60-second quote · No commitment · Sean reviews each setup",
  align = "start",
}: TrustSectionCtaProps) => (
  <div
    className={cn(
      "mt-6 flex flex-col gap-3 sm:mt-8",
      align === "center" && "items-center text-center",
    )}
  >
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <Button
        type="button"
        size="lg"
        onClick={() => onEstimate(placement)}
        className="h-12 gap-2 bg-[#f7b52b] px-5 text-sm font-black text-black hover:bg-[#ffc94f] sm:text-base"
      >
        {primaryLabel}
        <ArrowRight className="h-4 w-4" />
      </Button>
      {onWhatsApp ? (
        <Button
          type="button"
          size="lg"
          variant="ghost"
          onClick={() => onWhatsApp(placement)}
          className="h-12 gap-2 border border-[#25D366]/45 bg-transparent px-5 text-sm font-bold text-[#25D366] hover:bg-[#25D366]/10 hover:text-[#25D366] sm:text-base"
        >
          <MessageCircle className="h-4 w-4" />
          {whatsappLabel}
        </Button>
      ) : null}
    </div>
    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 sm:text-[11px]">
      {microcopy}
    </p>
  </div>
);

/** Inline coloured Google wordmark used on the review proof card. */
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

/**
 * Hero handover-reactions reel — a 1:1 customer handover montage (no audio).
 * Autoplays muted + looping so the faces stay the focus; tap to pause/play.
 */
const HandoverReactionsReel = ({
  videoSrc,
  posterSrc,
}: {
  videoSrc: string;
  posterSrc: string;
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [playing, setPlaying] = useState(true);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().then(() => setPlaying(true)).catch(() => undefined);
    } else {
      video.pause();
      setPlaying(false);
    }
  };

  return (
    <div className="group relative overflow-hidden rounded-[28px] border border-white/12 bg-black shadow-[0_36px_120px_rgba(0,0,0,0.55)]">
      <button
        type="button"
        onClick={togglePlay}
        aria-label={playing ? "Pause reactions reel" : "Play reactions reel"}
        className="block w-full"
      >
        <video
          ref={videoRef}
          className="aspect-square w-full bg-black object-cover"
          poster={posterSrc}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
      </button>

      {/* top-left live badge */}
      <div className="pointer-events-none absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-[#f7b52b]/35 bg-black/55 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#f7b52b] backdrop-blur-sm">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#f7b52b]" />
        Real reactions
      </div>

      {/* play state hint (only while paused) */}
      {!playing ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/60 px-5 py-2.5 text-white shadow-2xl backdrop-blur-sm">
            <Play className="h-4 w-4 fill-current" />
            <span className="text-sm font-semibold">Tap to play</span>
          </span>
        </div>
      ) : null}
    </div>
  );
};

type HandoverReviewClip = {
  name: string;
  car: string;
  badge: string;
  /** Accent colour for the badge chip (hex). */
  accent: string;
  videoSrc: string;
  posterSrc: string;
  google?: boolean;
};

/**
 * Best customer handover clips for the reviews carousel. The first entry is the
 * "main" clip (default centred + playing). To add more later, just append a
 * HandoverReviewClip (name, car, badge, accent, videoSrc, posterSrc). The .mov
 * sources are delivered as mp4 via Cloudinary, with auto-generated posters.
 */
const handoverReviewSlides: HandoverReviewClip[] = [
  {
    name: "Samir",
    car: "Porsche 911 · Matte PPF",
    badge: "Matte PPF",
    accent: "#f6c76d",
    videoSrc:
      "https://res.cloudinary.com/diw6rekpm/video/upload/q_auto/v1781333287/911_MATTE_aaomcw.mp4",
    posterSrc:
      "https://res.cloudinary.com/diw6rekpm/video/upload/so_2/v1781333287/911_MATTE_aaomcw.jpg",
  },
  {
    name: "Mansoor",
    car: "Porsche 911 · STEK Gloss",
    badge: "STEK gloss",
    accent: "#9dc3b0",
    videoSrc:
      "https://res.cloudinary.com/diw6rekpm/video/upload/q_auto/v1781333400/911_4_vcvvkn.mp4",
    posterSrc:
      "https://res.cloudinary.com/diw6rekpm/video/upload/so_2/v1781333400/911_4_vcvvkn.jpg",
  },
  {
    name: "Scott",
    car: "Jetour G700 · STEK Matte + paint match",
    badge: "Matte + paint match",
    accent: "#f6c76d",
    videoSrc:
      "https://res.cloudinary.com/diw6rekpm/video/upload/q_auto/v1781333432/G7_BLUE_wlvxks.mp4",
    posterSrc:
      "https://res.cloudinary.com/diw6rekpm/video/upload/so_2/v1781333432/G7_BLUE_wlvxks.jpg",
  },
  {
    name: "Mark",
    car: "Zeekr 001",
    badge: "Owner review",
    accent: "#79a7ff",
    google: true,
    videoSrc:
      "https://res.cloudinary.com/diw6rekpm/video/upload/q_auto/f_auto/v1775562589/Mark_Zeekr_conzdp.mp4",
    posterSrc: "/mark-zeekr-001.png",
  },
  // Last entry so it wraps to the LEFT of the centred main clip (Samir).
  {
    name: "Alex",
    car: "Aston Martin Rapide · Colour PPF",
    badge: "Colour PPF · Hyper Pro",
    accent: "#9dc3b0",
    videoSrc:
      "https://res.cloudinary.com/diw6rekpm/video/upload/q_auto/v1781333953/Aston_Martin_Rapide_S_rstzr2.mp4",
    posterSrc:
      "https://res.cloudinary.com/diw6rekpm/video/upload/so_2/v1781333953/Aston_Martin_Rapide_S_rstzr2.jpg",
  },
];

/**
 * Reviews carousel: holds 6–8 clips but only the centred (selected) slide plays.
 * Every other slide stays a static poster, so the section reads as "lots of proof"
 * without 6 videos fighting for attention or hammering the page load.
 */
const HandoverReviewsCarousel = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "center",
    loop: true,
    containScroll: false,
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const activeVideoRef = useRef<HTMLVideoElement | null>(null);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setMuted(true);
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect).on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect).off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  const toggleSound = () => {
    const video = activeVideoRef.current;
    if (!video) return;
    const next = !muted;
    video.muted = next;
    setMuted(next);
    if (!next) video.play().catch(() => undefined);
  };

  return (
    <div className="relative mt-8">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex -ml-4 touch-pan-y">
          {handoverReviewSlides.map((slide, index) => {
            const isActive = index === selectedIndex;
            return (
              <div
                key={index}
                className="min-w-0 shrink-0 grow-0 basis-[82%] pl-4 sm:basis-[52%] lg:basis-[36%]"
              >
                <div
                  className={cn(
                    "relative overflow-hidden rounded-[24px] border bg-black transition-all duration-300",
                    isActive
                      ? "border-[#f7b52b]/45 shadow-[0_24px_70px_rgba(0,0,0,0.5)]"
                      : "border-white/10 opacity-60 hover:opacity-90",
                  )}
                >
                  <div className="relative aspect-[4/5]">
                    {isActive ? (
                      <video
                        ref={(el) => {
                          activeVideoRef.current = el;
                          if (el) el.muted = muted;
                        }}
                        className="h-full w-full bg-black object-cover"
                        poster={slide.posterSrc}
                        autoPlay
                        loop
                        muted
                        playsInline
                        preload="metadata"
                      >
                        <source src={slide.videoSrc} type="video/mp4" />
                      </video>
                    ) : (
                      <button
                        type="button"
                        onClick={() => emblaApi?.scrollTo(index)}
                        className="group/poster block h-full w-full"
                        aria-label={`Play ${slide.name} — ${slide.car}`}
                      >
                        <img
                          src={slide.posterSrc}
                          alt={`${slide.name} — ${slide.car}`}
                          className="h-full w-full object-cover transition duration-700 group-hover/poster:scale-[1.04]"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/35">
                          <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/55 px-4 py-2 text-white backdrop-blur-sm transition group-hover/poster:border-[#f7b52b]/55">
                            <Play className="h-4 w-4 fill-current" />
                            <span className="text-sm font-semibold">Play</span>
                          </span>
                        </div>
                      </button>
                    )}

                    <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent p-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {slide.google ? <GoogleWordmark className="text-xs" /> : null}
                        <span
                          className="inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.16em]"
                          style={{ borderColor: `${slide.accent}55`, color: slide.accent }}
                        >
                          {slide.badge}
                        </span>
                        {slide.google ? (
                          <span className="flex items-center gap-0.5 text-[#fbbc05]">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star key={star} className="h-3 w-3 fill-current" />
                            ))}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1.5 text-base font-black leading-tight text-white">
                        {slide.name}
                      </p>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70">
                        {slide.car}
                      </p>
                    </div>

                    {isActive ? (
                      <button
                        type="button"
                        onClick={toggleSound}
                        aria-label={muted ? "Unmute clip" : "Mute clip"}
                        className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/55 px-3 py-1.5 text-[11px] font-bold text-white backdrop-blur-sm transition hover:border-[#f7b52b]/55 hover:bg-black/70"
                      >
                        {muted ? (
                          <VolumeX className="h-3.5 w-3.5" />
                        ) : (
                          <Volume2 className="h-3.5 w-3.5 text-[#f7b52b]" />
                        )}
                        {muted ? "Sound" : "On"}
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Controls: prev · dots · next */}
      <div className="mt-5 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => emblaApi?.scrollPrev()}
          aria-label="Previous clip"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-white transition hover:border-[#f7b52b]/55 hover:text-[#f7b52b]"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          {handoverReviewSlides.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => emblaApi?.scrollTo(index)}
              aria-label={`Go to clip ${index + 1}`}
              className={cn(
                "h-2 rounded-full transition-all",
                index === selectedIndex ? "w-6 bg-[#f7b52b]" : "w-2 bg-white/25 hover:bg-white/40",
              )}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => emblaApi?.scrollNext()}
          aria-label="Next clip"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-white transition hover:border-[#f7b52b]/55 hover:text-[#f7b52b]"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

/**
 * Returns whether Sean (operations) is "online" right now in Dubai time.
 * Dubai is UTC+4 with no DST, so a single UTC offset is safe. Window kept to
 * 09:00–21:00 Dubai time to match the visible signpost copy below.
 */
const useSeanOnline = () => {
  const [online, setOnline] = useState(() => {
    const utcHour = new Date().getUTCHours();
    const dubaiHour = (utcHour + 4) % 24;
    return dubaiHour >= 9 && dubaiHour < 21;
  });
  useEffect(() => {
    const tick = () => {
      const utcHour = new Date().getUTCHours();
      const dubaiHour = (utcHour + 4) % 24;
      setOnline(dubaiHour >= 9 && dubaiHour < 21);
    };
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);
  return online;
};

type LivePulseStripProps = {
  variant?: "dark" | "light";
  className?: string;
  compact?: boolean;
};

/**
 * Two live signals on one row: Sean's online status and the expected reply
 * window. Intentionally narrow — no fake activity feeds, no rotating
 * bookings; everything here has to be defensible if a buyer asks "is that
 * really live?".
 */
const LivePulseStrip = ({ variant = "dark", className, compact = false }: LivePulseStripProps) => {
  const online = useSeanOnline();
  const isLight = variant === "light";

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] font-semibold",
        isLight ? "text-slate-700" : "text-slate-300",
        compact ? "sm:text-[11px]" : "sm:text-xs",
        className,
      )}
    >
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
        <span className="relative inline-flex h-2 w-2">
          {online ? (
            <>
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]" />
            </>
          ) : (
            <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
          )}
        </span>
        <span
          className={cn(
            "uppercase tracking-[0.16em]",
            online
              ? isLight ? "text-emerald-700" : "text-emerald-300"
              : isLight ? "text-amber-700" : "text-amber-300",
          )}
        >
          {online ? "Sean online" : "Sean back at 9am Dubai"}
        </span>
      </span>
      <span aria-hidden className={cn("h-3 w-px", isLight ? "bg-slate-300" : "bg-white/15")} />
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
        <Clock className="h-3 w-3 opacity-70" />
        {online ? "Replies in ~12 min" : "WhatsApp now, reply first thing"}
      </span>
    </div>
  );
};

type ScarcityChipProps = {
  className?: string;
  variant?: "dark" | "light";
};

/**
 * One-liner scarcity badge ("2 install slots left this week — Sean takes ~4")
 * Used near CTAs to make the calendar feel real without becoming a separate
 * countdown widget. Pairs intentionally with LivePulseStrip.
 */
const ScarcityChip = ({ className, variant = "dark" }: ScarcityChipProps) => {
  const isLight = variant === "light";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em]",
        isLight
          ? "border-amber-500/40 bg-amber-50 text-amber-700"
          : "border-[#f7b52b]/40 bg-[#f7b52b]/12 text-[#f7b52b]",
        className,
      )}
    >
      <AlertTriangle className="h-3 w-3" />
      {SLOTS_REMAINING_THIS_WEEK} slots left this week · Sean takes ~{SLOTS_PER_WEEK}
    </span>
  );
};

const PpfMetaPriceBuilder = () => {
  // ── Build state — Normal · Signature · 10-year · Gloss preselected so a real
  // price is on screen from first paint (the ad promise).
  const [size, setSize] = useState<BuilderSize>("normal");
  const [line, setLine] = useState<PpfLine>("signature");
  const [warrantyYears, setWarrantyYears] = useState<WarrantyYears>(10);
  const [finish, setFinish] = useState<BuilderFinish>("Gloss");
  const [vehicle, setVehicle] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneStatus, setPhoneStatus] = useState<
    "idle" | "saving" | "saved" | "invalid" | "error"
  >("idle");
  // Dedupe: the same number never writes two CRM snapshots.
  const [phoneCapturedAt, setPhoneCapturedAt] = useState<string | null>(null);
  // One Meta pixel Lead per session — fires only on a SUCCESSFUL phone capture.
  const metaLeadFiredRef = useRef(false);
  const priceViewedRef = useRef(false);

  const flowPanelRef = useRef<HTMLDivElement>(null);
  const pageStartedAtRef = useRef<number>(Date.now());
  const activeSectionRef = useRef<string>("builder");
  const activeSectionStartedAtRef = useRef<number>(Date.now());
  const viewedSectionsRef = useRef<Set<string>>(new Set());
  const maxScrollPercentRef = useRef(0);

  const funnelContext = useMemo(
    () =>
      createFunnelTrackingContext({
        funnelName: "ppf_meta_builder_2026h2",
        landingPageVariant: "ppf_meta_builder_2026h2",
        defaultSourcePlatform: "meta",
      }),
    [],
  );

  // ── Derived pricing — recomputed on every tap, so the panel is always live.
  const selectedLine = lineOptions.find((option) => option.value === line)!;
  const selectedSize = sizeOptions.find((option) => option.value === size)!;
  const price = priceFor(line, warrantyYears, size, finish);
  const listPrice = listPriceFor(price);
  const savings = listPrice - price;
  const matteFree = isMatteIncluded(line, warrantyYears);

  const buildPayload = useCallback(
    () => ({
      line,
      package_name: `${selectedLine.name} ${warrantyYears}-year`,
      warranty_years: warrantyYears,
      vehicle_size: size,
      finish,
      matte_included: matteFree,
      coverage: "Full Body",
      estimate_value: price,
      final_price: price,
      service_price: price,
      list_price: listPrice,
      discount_savings: savings,
      vehicle_model: vehicle.trim() || undefined,
    }),
    [finish, line, listPrice, matteFree, price, savings, selectedLine, size, vehicle, warrantyYears],
  );

  const trackEvent = useCallback(
    (
      eventName: string,
      payload: Record<string, unknown> = {},
      options: { emitToTagManagers?: boolean } = {},
    ) => {
      trackFunnelEvent({
        eventName,
        context: funnelContext,
        payload,
        emitToTagManagers: options.emitToTagManagers,
      });
    },
    [funnelContext],
  );

  /**
   * Meta STANDARD events only (Contact/Lead). Internal funnel events must
   * never reach fbq as trackCustom — the shared trackFunnelEvent lib already
   * guards that (2026-07-08 pixel-flooding fix), so nothing else here talks
   * to the pixel.
   */
  const trackMetaStandardEvent = useCallback(
    (eventName: MetaStandardEvent, payload: Record<string, unknown> = {}) => {
      if (typeof window === "undefined" || !window.fbq) return;
      try {
        window.fbq("track", eventName, {
          funnel_name: funnelContext.funnelName,
          landing_page_variant: funnelContext.landingPageVariant,
          source_platform: funnelContext.sourcePlatform,
          pathname: funnelContext.pathname,
          hash: funnelContext.hash,
          entry_section: funnelContext.entrySection,
          ...funnelContext.attribution,
          ...payload,
        });
      } catch (error) {
        console.warn("Failed to send Meta standard event", error);
      }
    },
    [funnelContext],
  );

  // SEO + landing view + open-price view. The builder shows a real price from
  // first paint, so price_viewed fires once on mount (keeps reveal-rate honest).
  useEffect(() => {
    updatePageSEO(SEO_KEY, {
      title: "Full Car PPF Dubai | Build Your Exact Price | Grand Touch",
      description:
        "Build your exact full car PPF price in Dubai — pick car size, film line, warranty, and finish, and the price updates live. Genuine film, warranty registered, free pickup.",
      keywords:
        "ppf dubai, full car ppf dubai, ppf price dubai, paint protection film dubai, stek ppf dubai, ppf cost dubai, ppf installer dubai",
      ogTitle: "Full Car PPF Dubai — Build Your Exact Price",
      ogDescription:
        "Every control on one screen: car size, film line, warranty, finish. Your exact PPF price updates live — genuine film, registered warranty, free pickup across Dubai.",
    });
    trackEvent("lp_view", { calculator_type: "ppf_meta_builder" });
    if (!priceViewedRef.current) {
      priceViewedRef.current = true;
      trackEvent("price_viewed", buildPayload());
      trackEvent("guided_price_revealed", buildPayload());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Briefly flashes a gold ring around the builder panel to draw the eye.
   * If the panel is below the fold, it smooth-scrolls into view first.
   */
  const pulseBuilder = useCallback(() => {
    const el = flowPanelRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const viewport = typeof window !== "undefined" ? window.innerHeight : 0;
    const inView = rect.top < viewport * 0.7 && rect.bottom > 80;
    if (!inView) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    el.classList.remove("animate-guided-panel-flash");
    void el.offsetWidth;
    el.classList.add("animate-guided-panel-flash");
    window.setTimeout(() => {
      el.classList.remove("animate-guided-panel-flash");
    }, 1500);
  }, []);

  /** Hero START — the one big gold button. Scrolls into the builder panel. */
  const startBuilder = (placement: string) => {
    trackEvent("builder_started", { cta_location: placement, ...buildPayload() });
    pulseBuilder();
  };

  /**
   * Used by every "Get my PPF estimate" CTA in the trust stack below the
   * builder. Always scrolls the builder into view and pulses it so the click
   * visibly "lands", tagged by placement for the funnel dashboard.
   */
  const handleEstimateCta = (placement: string) => {
    pulseBuilder();
    trackEvent("guided_trust_estimate_cta", { placement, ...buildPayload() });
  };

  // WhatsApp message mirrors the on-screen build exactly, price included.
  const whatsAppMessage = useMemo(() => {
    const carPart = vehicle.trim() ? `, ${vehicle.trim()}` : "";
    return (
      `Hi Sean, I built a PPF package: ${selectedLine.shortName} ${warrantyYears}-year, ` +
      `${selectedSize.label}, ${finish.toLowerCase()}${carPart}. ` +
      `My price: AED ${price.toLocaleString("en-AE")} (20% online offer applied). ` +
      `Can you confirm availability?`
    );
  }, [finish, price, selectedLine, selectedSize, vehicle, warrantyYears]);

  /**
   * Every WhatsApp tap fires Meta Contact (Events Manager visibility) — never
   * Lead. Lead is reserved for the phone capture so Meta trains on real
   * numbers in the CRM, not drive-by taps.
   */
  const handleWhatsApp = (placement: string) => {
    trackMetaStandardEvent("Contact", {
      content_name: "PPF Meta Builder",
      content_category: "PPF",
      button_location: placement,
      value: price,
      currency: "AED",
    });
    // Kept out of GTM/gtag so legacy tag rules can't turn taps into Google
    // conversions — this page is Meta-only.
    trackEvent("whatsapp_click", { cta_location: placement, ...buildPayload() }, {
      emitToTagManagers: false,
    });
    window.open(buildWhatsAppUrl(whatsAppMessage), "_blank", "noopener,noreferrer");
  };

  // Trust-stack sections call this name (fork heritage). Direct 1-tap here —
  // the price is already open, so there is no pre-chat nudge on this page.
  const requestWhatsApp = handleWhatsApp;
  const hideDirectWa = false;

  /**
   * Phone capture = "lock this price + bonuses". Saves a CRM snapshot first;
   * the Meta Lead (value = current build price) fires ONLY when the save
   * succeeds, once per session. Failures surface as lead_save_failed so a
   * silent CRM outage can't hide behind healthy pixel numbers.
   */
  const handlePhoneCapture = async (event?: FormEvent) => {
    event?.preventDefault();
    const cleaned = phone.trim();
    if (!isLikelyRealPhone(cleaned)) {
      setPhoneStatus("invalid");
      trackEvent(
        "guided_invalid_phone_blocked",
        { capture_location: "builder_price_lock", ...buildPayload() },
        { emitToTagManagers: false },
      );
      return;
    }
    if (phoneCapturedAt === cleaned || phoneStatus === "saving") return;

    setPhoneStatus("saving");
    setPhoneCapturedAt(cleaned);
    trackEvent("guided_phone_captured", {
      capture_location: "builder_price_lock",
      ...buildPayload(),
    });

    const result = await captureLeadSnapshot({
      snapshotType: "contact",
      context: funnelContext,
      fullName: "",
      phone: cleaned,
      vehicleModel: vehicle.trim(),
      payload: {
        ...buildPayload(),
        line,
        warranty_years: warrantyYears,
        vehicle_size: size,
        finish,
        final_price: price,
        list_price: listPrice,
        service_name: "PPF Meta Builder Lock",
      },
    });

    if (!result.ok) {
      setPhoneStatus("error");
      setPhoneCapturedAt(null); // allow retry with the same number
      trackEvent(
        "lead_save_failed",
        {
          capture_location: "builder_price_lock",
          reason: ("reason" in result ? result.reason : null) ?? "unknown",
          ...buildPayload(),
        },
        { emitToTagManagers: false },
      );
      return;
    }

    setPhoneStatus("saved");
    trackEvent("lead_form_submitted", {
      form_type: "builder_price_lock",
      ...buildPayload(),
    });
    if (!metaLeadFiredRef.current) {
      metaLeadFiredRef.current = true;
      trackMetaStandardEvent("Lead", {
        content_name: "PPF Meta Builder",
        content_category: "PPF",
        value: price,
        currency: "AED",
      });
    }
  };

  // ── Builder control handlers — price recomputes on render, so these only
  // set state + log the selection for the funnel dashboard.
  const selectSize = (next: BuilderSize) => {
    setSize(next);
    trackEvent("calculator_selection_changed", { step_name: "size", vehicle_size: next });
  };

  const selectLine = (next: PpfLine) => {
    setLine(next);
    // Core has no 12-year package — fall back to 10 instead of stranding the
    // build on a combo that doesn't exist.
    if (next === "core" && warrantyYears === 12) setWarrantyYears(10);
    trackEvent("calculator_selection_changed", { step_name: "line", line: next });
  };

  const selectWarranty = (years: WarrantyYears) => {
    if (!warrantyAvailable(line, years)) return;
    setWarrantyYears(years);
    trackEvent("calculator_selection_changed", { step_name: "warranty", warranty_years: years });
  };

  const selectFinish = (next: BuilderFinish) => {
    setFinish(next);
    trackEvent("calculator_selection_changed", { step_name: "finish", finish: next });
  };

  // ── Section engagement analytics (section_view / section_engagement /
  // page_checkpoint) — same instrumentation as the guided funnel so the
  // dashboard reads both pages with one query.
  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;

    const getScrollPercent = () => {
      const doc = document.documentElement;
      const scrollable = Math.max(1, doc.scrollHeight - window.innerHeight);
      const percent = Math.round((window.scrollY / scrollable) * 100);
      return Math.max(0, Math.min(100, percent));
    };

    const updateMaxScroll = () => {
      maxScrollPercentRef.current = Math.max(maxScrollPercentRef.current, getScrollPercent());
    };

    const flushSectionEngagement = (reason: string) => {
      const nowMs = Date.now();
      const durationMs = nowMs - activeSectionStartedAtRef.current;
      const sectionName = activeSectionRef.current;
      if (sectionName && durationMs >= 750) {
        trackEvent("section_engagement", {
          section_name: sectionName,
          duration_ms: durationMs,
          checkpoint_reason: reason,
          current_scroll_percent: getScrollPercent(),
          max_scroll_percent: maxScrollPercentRef.current,
        });
      }
      activeSectionStartedAtRef.current = nowMs;
    };

    const setActiveSection = (sectionName: string, reason: string) => {
      if (!sectionName || activeSectionRef.current === sectionName) return;
      flushSectionEngagement(reason);
      activeSectionRef.current = sectionName;
      activeSectionStartedAtRef.current = Date.now();
    };

    const markSectionViewed = (sectionName: string) => {
      if (!sectionName || viewedSectionsRef.current.has(sectionName)) return;
      viewedSectionsRef.current.add(sectionName);
      trackEvent("section_view", {
        section_name: sectionName,
        current_scroll_percent: getScrollPercent(),
        max_scroll_percent: maxScrollPercentRef.current,
      });
    };

    const emitCheckpoint = (reason: string) => {
      updateMaxScroll();
      trackEvent("page_checkpoint", {
        checkpoint_reason: reason,
        elapsed_ms: Math.max(0, Date.now() - pageStartedAtRef.current),
        active_section: activeSectionRef.current,
        current_scroll_percent: getScrollPercent(),
        max_scroll_percent: maxScrollPercentRef.current,
      });
    };

    const builderPanel = flowPanelRef.current;
    builderPanel?.setAttribute("data-funnel-section", "builder");

    const sections = Array.from(
      document.querySelectorAll<HTMLElement>("[data-funnel-section]"),
    );
    const visibleRatios = new Map<Element, number>();

    updateMaxScroll();
    markSectionViewed("builder");
    emitCheckpoint("initial_view");

    const observer =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(
            (entries) => {
              updateMaxScroll();
              for (const entry of entries) {
                visibleRatios.set(entry.target, entry.isIntersecting ? entry.intersectionRatio : 0);
                const sectionName = (entry.target as HTMLElement).dataset.funnelSection;
                if (sectionName && entry.isIntersecting && entry.intersectionRatio >= 0.25) {
                  markSectionViewed(sectionName);
                }
              }

              let bestSection = activeSectionRef.current;
              let bestRatio = 0;
              for (const section of sections) {
                const ratio = visibleRatios.get(section) ?? 0;
                if (ratio > bestRatio) {
                  bestRatio = ratio;
                  bestSection = section.dataset.funnelSection || bestSection;
                }
              }
              if (bestRatio >= 0.2) {
                setActiveSection(bestSection, "section_change");
              }
            },
            { threshold: [0, 0.2, 0.25, 0.5, 0.75] },
          )
        : null;

    sections.forEach((section) => observer?.observe(section));

    const onScroll = () => updateMaxScroll();
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flushSectionEngagement("visibility_hidden");
        emitCheckpoint("visibility_hidden");
      }
    };
    const onBeforeUnload = () => {
      flushSectionEngagement("page_unload");
      emitCheckpoint("page_unload");
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("beforeunload", onBeforeUnload);
    const checkpointId = window.setInterval(() => emitCheckpoint("heartbeat"), 12_000);

    return () => {
      observer?.disconnect();
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.clearInterval(checkpointId);
      flushSectionEngagement("unmount");
      builderPanel?.removeAttribute("data-funnel-section");
    };
  }, [trackEvent]);

  /**
   * Mobile sticky + desktop cluster only appear once the builder panel is
   * fully out of view, so they never double up with the in-panel CTAs.
   */
  const [isPanelOffscreen, setIsPanelOffscreen] = useState(false);

  useEffect(() => {
    const el = flowPanelRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        const passed = !entry.isIntersecting && entry.boundingClientRect.bottom < 0;
        setIsPanelOffscreen(passed);
      },
      { threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  /**
   * Next available install slot — cosmetic countdown to put a concrete date
   * on the "limited slots" claim. Rolls to the next free weekday whenever
   * the current date passes, refreshed every minute.
   */
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const nextInstallSlot = useMemo(() => {
    const d = new Date(now);
    d.setHours(9, 0, 0, 0);
    while (![2, 4].includes(d.getDay()) || d.getTime() <= now.getTime() + 18 * 3600_000) {
      d.setDate(d.getDate() + 1);
    }
    const diffMs = d.getTime() - now.getTime();
    const hrs = Math.max(0, Math.floor(diffMs / 3600_000));
    const days = Math.floor(hrs / 24);
    const remainHrs = hrs % 24;
    const label =
      days > 0 ? `${days}d ${remainHrs}h` : `${hrs}h ${Math.floor((diffMs % 3600_000) / 60_000)}m`;
    const weekday = d.toLocaleDateString("en-AE", { weekday: "long" });
    return { date: d, label, weekday };
  }, [now]);

  /**
   * JSON-LD structured data — LocalBusiness, Service, and FAQ blocks.
   * Injected once on mount and removed on unmount so other routes stay clean.
   */
  useEffect(() => {
    if (typeof document === "undefined") return;
    const blocks: Record<string, unknown>[] = [
      {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        name: "Grand Touch Auto",
        image: "https://www.grandtouchauto.ae/guided-sean-with-patrols.png",
        url: PAGE_URL,
        telephone: "+971567191045",
        priceRange: "AED 6,990 – AED 12,990",
        address: {
          "@type": "PostalAddress",
          streetAddress: "DIP 2, Thani Warehouse 3 11b",
          addressLocality: "Dubai",
          addressRegion: "Dubai",
          addressCountry: "AE",
        },
        openingHoursSpecification: [
          {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
            opens: "09:00",
            closes: "21:00",
          },
        ],
      },
      {
        "@context": "https://schema.org",
        "@type": "Service",
        serviceType: "Paint Protection Film (PPF) installation",
        provider: {
          "@type": "LocalBusiness",
          name: "Grand Touch Auto",
          telephone: "+971567191045",
        },
        areaServed: { "@type": "City", name: "Dubai" },
        description:
          "Full car paint protection film installation in Dubai with multi-stage paint correction, registered warranties, and free Dubai-wide pickup.",
        offers: {
          "@type": "AggregateOffer",
          priceCurrency: "AED",
          lowPrice: "6990",
          highPrice: "12990",
        },
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: trustFaqs.map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: f.answer },
        })),
      },
    ];
    const scripts = blocks.map((data) => {
      const s = document.createElement("script");
      s.type = "application/ld+json";
      s.text = JSON.stringify(data);
      s.setAttribute("data-guided-ppf-jsonld", "1");
      document.head.appendChild(s);
      return s;
    });
    return () => {
      scripts.forEach((s) => s.parentElement?.removeChild(s));
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#070707] text-white">
      <main>
        {/* ── HERO — compressed: one promise, proof badges, one gold START. ── */}
        <section className="relative overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_20%_0%,rgba(247,181,43,0.18),transparent_30%),linear-gradient(180deg,#15120b,#070707)] px-4 py-4 sm:px-6 sm:py-6">
          <div className="mx-auto max-w-2xl">
            <header className="flex items-center justify-between gap-3">
              <a href="/" aria-label="Grand Touch Auto home">
                <img src={logo} alt="Grand Touch Auto" className="h-8 w-auto sm:h-10" />
              </a>
              <span className="rounded-full border border-[#f7b52b]/25 bg-[#f7b52b]/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-[#f7b52b] sm:text-[10px]">
                20% online offer
              </span>
            </header>

            <p className="mt-4 text-[10px] font-black uppercase tracking-[0.22em] text-[#f7b52b] sm:text-xs">
              Premium PPF — Dubai · Full body
            </p>
            <h1 className="mt-1.5 text-[1.9rem] font-black leading-[1.04] tracking-tight sm:text-4xl">
              Full Car PPF —
              <span className="block text-[#f7b52b]">Build Your Exact Price.</span>
            </h1>
            <p className="mt-2.5 text-sm leading-6 text-slate-300 sm:text-base">
              Genuine film only, warranty registered in your name, free pickup across
              Dubai. Pick your build below — the price updates live with every tap.
            </p>

            <HeroTrustBadges className="mt-3" />

            <div className="mt-4 flex flex-col gap-2">
              <Button
                type="button"
                size="lg"
                onClick={() => startBuilder("hero_start")}
                className="h-14 w-full gap-2 bg-[#f7b52b] text-base font-black text-black shadow-[0_12px_34px_rgba(247,181,43,0.35)] hover:bg-[#ffc94f]"
              >
                Build my price
                <ArrowRight className="h-5 w-5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => handleWhatsApp("hero_whatsapp")}
                className="h-11 w-full gap-2 border border-[#25D366]/45 bg-transparent text-sm font-bold text-[#25D366] hover:bg-[#25D366]/10 hover:text-[#25D366]"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp Sean
              </Button>
            </div>

            <div className="mt-3 rounded-xl border border-white/10 bg-black/35 px-3 py-2">
              <LivePulseStrip className="!gap-x-2.5" compact />
            </div>
          </div>
        </section>

        {/* ── ONE-SCREEN PRICE BUILDER — every control visible, price live. ── */}
        <section className="px-4 py-6 sm:px-6 sm:py-10">
          <div className="mx-auto max-w-2xl">
            <div
              ref={flowPanelRef}
              className="scroll-mt-4 rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(13,13,13,0.98))] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.42)] sm:rounded-[28px] sm:p-6"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#f7b52b] sm:text-xs">
                  Build your exact price
                </p>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/30 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-slate-200">
                  <span className="relative inline-flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#f7b52b]/70" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#f7b52b]" />
                  </span>
                  Live price
                </span>
              </div>

              {/* 1 · Car size */}
              <div className="mt-4">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/55">
                  1 · Car size
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {sizeOptions.map((option) => {
                    const active = size === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => selectSize(option.value)}
                        className={cn(
                          "rounded-2xl border px-3.5 py-3.5 text-left transition",
                          active
                            ? "border-[#f7b52b] bg-[#f7b52b]/15"
                            : "border-white/15 bg-white/[0.04] hover:border-[#f7b52b]/50",
                        )}
                      >
                        <span
                          className={cn(
                            "block text-base font-black sm:text-lg",
                            active ? "text-[#f7b52b]" : "text-white",
                          )}
                        >
                          {option.label}
                        </span>
                        <span className="mt-1 block text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">
                          {option.sub}
                        </span>
                        <span className="mt-0.5 block text-[10px] font-semibold text-slate-500">
                          {option.example}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2 · Film line */}
              <div className="mt-4">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/55">
                  2 · Film line
                </p>
                <div className="mt-2 grid gap-2">
                  {lineOptions.map((option) => {
                    const active = line === option.value;
                    const isSignature = option.value === "signature";
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => selectLine(option.value)}
                        className={cn(
                          "w-full rounded-2xl border px-3.5 py-3 text-left transition",
                          active && isSignature
                            ? "border-[#f7b52b] bg-[linear-gradient(135deg,rgba(247,181,43,0.18),rgba(247,181,43,0.05))] ring-1 ring-[#f7b52b]/40 shadow-[0_10px_36px_rgba(247,181,43,0.18)]"
                            : active
                              ? "border-[#f7b52b] bg-[#f7b52b]/10 ring-1 ring-[#f7b52b]/35"
                              : "border-white/15 bg-white/[0.035] hover:border-[#f7b52b]/55",
                        )}
                      >
                        <span className="flex flex-wrap items-center justify-between gap-2">
                          <span
                            className={cn(
                              "text-base font-black sm:text-lg",
                              active ? "text-[#f7b52b]" : "text-white",
                            )}
                          >
                            {option.name}
                          </span>
                          <span
                            className={cn(
                              "rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em]",
                              active
                                ? "border-[#f7b52b]/45 bg-black/30 text-[#f7b52b]"
                                : "border-white/15 bg-black/25 text-slate-300",
                            )}
                          >
                            {option.brands}
                          </span>
                        </span>
                        <span className="mt-1 block text-[11px] font-semibold text-slate-400">
                          {option.tagline}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3 · Warranty — per-chip live price preview for the current
                  size/line/finish. 12-year exists on Signature only. */}
              <div className="mt-4">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/55">
                  3 · Warranty
                </p>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {warrantyChoices.map((years) => {
                    const available = warrantyAvailable(line, years);
                    const active = warrantyYears === years;
                    return (
                      <button
                        key={years}
                        type="button"
                        disabled={!available}
                        onClick={() => selectWarranty(years)}
                        className={cn(
                          "rounded-xl border px-2 py-2.5 text-center transition",
                          active
                            ? "border-[#f7b52b] bg-[#f7b52b]/15"
                            : available
                              ? "border-white/15 bg-white/[0.04] hover:border-[#f7b52b]/50"
                              : "cursor-not-allowed border-white/10 bg-white/[0.02] opacity-45",
                        )}
                      >
                        <span
                          className={cn(
                            "block text-xl font-black leading-none",
                            active ? "text-[#f7b52b]" : "text-white",
                          )}
                        >
                          {years}
                        </span>
                        <span className="mt-0.5 block text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
                          Years
                        </span>
                        <span
                          className={cn(
                            "mt-1 block text-[10px] font-bold tabular-nums",
                            active ? "text-[#f7b52b]" : "text-slate-300",
                          )}
                        >
                          {available
                            ? formatAED(priceFor(line, years, size, finish))
                            : "Signature only"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4 · Finish — matte is +500 except Signature 5-year (included). */}
              <div className="mt-4">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/55">
                  4 · Finish
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {finishOptions.map((option) => {
                    const active = finish === option.value;
                    const matteNote =
                      option.value === "Matte"
                        ? matteFree
                          ? "Included free"
                          : `+${formatAED(MATTE_UPCHARGE)}`
                        : option.helper;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => selectFinish(option.value)}
                        className={cn(
                          "rounded-xl border px-3 py-2.5 text-left transition",
                          active
                            ? "border-[#f7b52b] bg-[#f7b52b]/15"
                            : "border-white/15 bg-white/[0.04] hover:border-[#f7b52b]/50",
                        )}
                      >
                        <span
                          className={cn(
                            "block text-sm font-black",
                            active ? "text-[#f7b52b]" : "text-white",
                          )}
                        >
                          {option.label}
                        </span>
                        <span
                          className={cn(
                            "mt-0.5 block text-[10px] font-semibold",
                            option.value === "Matte" && matteFree
                              ? "text-[#25D366]"
                              : "text-slate-400",
                          )}
                        >
                          {matteNote}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* LIVE PRICE panel */}
              <div className="mt-5 rounded-2xl border-2 border-[#f7b52b]/50 bg-[linear-gradient(180deg,rgba(247,181,43,0.10),rgba(0,0,0,0.3))] p-4 shadow-[0_0_32px_rgba(247,181,43,0.14)] sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#f7b52b] sm:text-xs">
                    Your exact price — live
                  </p>
                  <BadgePercent className="h-6 w-6 shrink-0 text-[#f7b52b]/70" />
                </div>
                <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span
                    className="text-4xl font-black tracking-tight text-white sm:text-5xl"
                    aria-live="polite"
                  >
                    {formatAED(price)}
                  </span>
                  <span className="text-base font-bold text-slate-500 line-through sm:text-lg">
                    {formatAED(listPrice)}
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] font-semibold text-slate-300 sm:text-xs">
                  20% online offer applied — you save {formatAED(savings)}. Full body,
                  excl. VAT · warranty registered
                  {finish === "Matte" && matteFree ? " · matte included" : ""}.
                </p>
                <p className="mt-2 border-t border-white/10 pt-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                  {selectedLine.name} · installed with {selectedLine.brands}
                </p>
              </div>

              {/* PHONE CAPTURE — lock this price + bonuses */}
              <div className="mt-4 rounded-2xl border border-[#f7b52b]/35 bg-black/30 p-4">
                <p className="flex items-center gap-2 text-sm font-black text-white">
                  <Gift className="h-4 w-4 text-[#f7b52b]" />
                  Lock this price + bonuses
                </p>
                <ul className="mt-2.5 space-y-1.5">
                  {lockBonuses.map((bonus) => (
                    <li
                      key={bonus.text}
                      className="flex items-center gap-2 text-xs font-semibold text-slate-300"
                    >
                      <bonus.icon className="h-3.5 w-3.5 shrink-0 text-[#25D366]" />
                      {bonus.text}
                    </li>
                  ))}
                </ul>
                {phoneStatus === "saved" ? (
                  <p className="mt-3 flex items-center gap-2 rounded-xl border border-[#25D366]/40 bg-[#25D366]/10 px-3 py-2.5 text-xs font-bold text-[#25D366]">
                    <BadgeCheck className="h-4 w-4 shrink-0" />
                    Price locked to this exact build — Sean will WhatsApp you today to
                    confirm.
                  </p>
                ) : (
                  <form onSubmit={handlePhoneCapture} className="mt-3">
                    <PhoneInputWithCountry
                      value={phone}
                      onChange={(value) => {
                        setPhone(value);
                        if (phoneStatus === "invalid" || phoneStatus === "error") {
                          setPhoneStatus("idle");
                        }
                      }}
                      placeholder="50 123 4567"
                      className="border-[#f7b52b]/30 bg-white/[0.04]"
                      ariaLabel="Phone to lock this price"
                    />
                    <Button
                      type="submit"
                      disabled={phoneStatus === "saving"}
                      className="mt-2.5 h-12 w-full gap-2 bg-[#f7b52b] text-sm font-black text-black hover:bg-[#ffc94f] disabled:opacity-60"
                    >
                      <Lock className="h-4 w-4" />
                      {phoneStatus === "saving" ? "Saving…" : "Lock my price & bonuses"}
                    </Button>
                    {phoneStatus === "invalid" ? (
                      <p className="mt-1.5 text-[11px] font-semibold text-red-300">
                        Please enter a valid UAE WhatsApp number.
                      </p>
                    ) : null}
                    {phoneStatus === "error" ? (
                      <p className="mt-1.5 text-[11px] font-semibold text-amber-300">
                        Couldn't save just now — tap again to retry, or use the WhatsApp
                        button below.
                      </p>
                    ) : null}
                    <p className="mt-2 text-center text-[10px] font-semibold text-slate-500">
                      WhatsApp number only — no calls unless you ask. The price stays
                      visible either way.
                    </p>
                  </form>
                )}
              </div>

              {/* Optional car + WhatsApp handoff */}
              <div className="mt-4">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/55">
                  Your car{" "}
                  <span className="normal-case tracking-normal text-slate-500">
                    (optional — added to your WhatsApp message)
                  </span>
                </p>
                <Input
                  value={vehicle}
                  onChange={(event) => setVehicle(event.target.value)}
                  placeholder="e.g. 2026 Range Rover Sport, 2025 Patrol"
                  aria-label="Your car"
                  className="mt-2 h-12 border-white/20 bg-white/[0.05] text-white placeholder:text-slate-500 focus-visible:border-[#f7b52b]/70 focus-visible:ring-[#f7b52b]/30"
                />
              </div>

              <Button
                type="button"
                onClick={() => handleWhatsApp("builder_panel")}
                className="mt-4 h-13 w-full gap-2 bg-[#25D366] py-3.5 text-base font-black text-white shadow-[0_18px_48px_rgba(37,211,102,0.3)] hover:bg-[#20bf5d]"
              >
                <MessageCircle className="h-5 w-5" />
                WhatsApp Sean this exact build
              </Button>
              <p className="mt-1.5 text-center text-[10px] font-semibold text-slate-500">
                Opens WhatsApp with your build and price pre-written — Sean confirms
                availability same day.
              </p>
            </div>
          </div>
        </section>

        {/* ── THE FILMS WE BUILD WITH — what sits behind each line. ────────── */}
        <section
          data-funnel-section="films_we_build_with"
          className="border-t border-white/10 bg-[#070707] px-4 py-12 sm:px-6 sm:py-16"
        >
          <div className="mx-auto max-w-4xl">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#f7b52b] sm:text-[11px]">
              The films we build with
            </p>
            <h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">
              Two lines. One
              <span className="block text-[#f7b52b]">install standard.</span>
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Card className="flex h-full flex-col rounded-2xl border-[#f7b52b]/30 bg-[linear-gradient(180deg,rgba(247,181,43,0.08),rgba(255,255,255,0.015))] p-5 text-white">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#f7b52b]">
                  Signature · STEK &amp; GYEON
                </p>
                <h3 className="mt-2 text-lg font-black leading-tight">
                  The premium aesthetic film
                </h3>
                <p className="mt-1.5 text-sm leading-6 text-slate-300">
                  Authorised STEK and GYEON installs with fully traceable warranties —
                  the film, the batch, and the registration are all documented and
                  handed to you at collection.
                </p>
              </Card>
              <Card className="flex h-full flex-col rounded-2xl border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))] p-5 text-white">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-300">
                  Core · Protect+ · Supreme · Sunstop · KDX
                </p>
                <h3 className="mt-2 text-lg font-black leading-tight">
                  Serious protection, smarter price
                </h3>
                <p className="mt-1.5 text-sm leading-6 text-slate-300">
                  Proven films at a sharper price — with the same Grand Touch prep,
                  hand-cut install, and QC standard, and a registered warranty on every
                  build.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────────
            TRUST STACK — full conversion funnel below the calculator.
            Order is intentional: the first thing after the (working) calculator
            is the strongest EMOTIONAL social proof — real handover reactions on
            video, then named owner reviews with real faces. Only after the
            visitor has seen real people do we run the CTA recap, fast-scan
            credibility (Google/STEK), then objection-handling (Why us, Process),
            FAQ, and a final dual-CTA close. Every section has a CTA pair.
            ───────────────────────────────────────────────────────────────── */}

        {/* 0a. Handover reactions reel — the emotional hook. A real 1:1 customer
            handover montage (no audio) as the focus, with supporting copy + CTA
            beside it. Balanced two-column block so the square stays tidy. */}
        <section
          data-funnel-section="handover_reactions"
          className="border-t border-white/10 bg-[radial-gradient(circle_at_15%_0%,rgba(247,181,43,0.08),transparent_55%),#070707] px-3 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20"
        >
          <div className="mx-auto max-w-6xl">
            <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
              {/* Video — the focus (1:1 customer handover montage, no audio) */}
              <div className="mx-auto w-full max-w-[420px] sm:max-w-[460px] lg:max-w-none">
                <HandoverReactionsReel
                  videoSrc="https://res.cloudinary.com/diw6rekpm/video/upload/q_auto/v1781334893/customer_roqujv.mp4"
                  posterSrc="https://res.cloudinary.com/diw6rekpm/video/upload/so_2/v1781334893/customer_roqujv.jpg"
                />
              </div>

              {/* Copy + trust points + CTA */}
              <div>
                <p className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-[#f7b52b] sm:text-[11px]">
                  <Play className="h-3.5 w-3.5 fill-current" />
                  Real handover reactions
                </p>
                <h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">
                  See the moment it
                  <span className="block text-[#f7b52b]">becomes their car.</span>
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-300 sm:text-base sm:leading-7">
                  Not stock footage, not actors — real Dubai owners on handover day, the second
                  they see the finish in person. Watch before you decide who touches your car.
                </p>

                <div className="mt-6 space-y-4">
                  {[
                    {
                      icon: UserCheck,
                      title: "Real owners, not actors",
                      body: "Every clip is a paying customer collecting their own car.",
                    },
                    {
                      icon: Handshake,
                      title: "Filmed on handover day",
                      body: "The genuine first reaction once Sean reveals the finished car.",
                    },
                    {
                      icon: ShieldCheck,
                      title: "The standard we hand back",
                      body: "The same QC and finish that ships with your STEK warranty.",
                    },
                  ].map(({ icon: Icon, title, body }) => (
                    <div key={title} className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f7b52b]/15 ring-1 ring-[#f7b52b]/30">
                        <Icon className="h-5 w-5 text-[#f7b52b]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black leading-tight text-white">{title}</p>
                        <p className="mt-0.5 text-[13px] leading-5 text-slate-400">{body}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <TrustSectionCta
                  placement="handover_reactions"
                  onEstimate={handleEstimateCta}
                  onWhatsApp={hideDirectWa ? undefined : requestWhatsApp}
                  primaryLabel="Price my car like theirs"
                  microcopy="60-second quote · Sean reviews each setup personally"
                />
              </div>
            </div>
          </div>
        </section>

        {/* 0b. Customer reviews & real handovers — named owners + real faces,
            each with a tap-to-play delivery clip. Ported from the quote funnel,
            restyled to the guided gold ethos. */}
        <section
          id="real-handovers"
          data-funnel-section="real_handovers"
          className="bg-[#070707] px-3 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20"
        >
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#f7b52b] sm:text-[11px]">
                Customer reviews & our work
              </p>
              <h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">
                Real buyers, real handovers,
                <span className="block text-[#f7b52b]">real cars.</span>
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base sm:leading-7">
                Real owners trust Sean, the finish looks right, and the handover feels properly
                done. Swipe through — the centre clip plays, tap it for sound.
              </p>
            </div>

            <HandoverReviewsCarousel />
          </div>
        </section>

        {/* 1. Mid-page CTA strip — recap CTA now that real proof has landed */}
        <section
          data-funnel-section="trust_cta_post_handovers"
          className="bg-[#070707] px-3 py-8 sm:px-6 sm:py-12 lg:px-8"
        >
          <div className="mx-auto max-w-7xl">
            <div className="rounded-[28px] border border-[#f7b52b]/30 bg-[radial-gradient(circle_at_80%_-10%,rgba(247,181,43,0.22),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(8,8,8,0.55))] p-5 sm:p-8">
              <div className="grid items-center gap-5 sm:grid-cols-[1.4fr_1fr] sm:gap-8">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#f7b52b] sm:text-[11px]">
                    Like what you've seen?
                  </p>
                  <h2 className="mt-2 text-2xl font-black leading-tight sm:text-3xl lg:text-4xl">
                    Get your exact PPF setup priced
                    <span className="block text-[#f7b52b]">in under 60 seconds.</span>
                  </h2>
                </div>
                <TrustSectionCta
                  placement="trust_cta_post_handovers"
                  onEstimate={handleEstimateCta}
                  onWhatsApp={hideDirectWa ? undefined : requestWhatsApp}
                  microcopy="Free pickup · Warranty registered · No upsell"
                />
              </div>
            </div>
          </div>
        </section>

        {/* 4. Meet Sean — face + bio + 3 trust pillars in one block. Putting
            a real person at the top of the trust stack outperforms generic
            "Why us" because PPC visitors are scanning for a human to trust. */}
        <section
          data-funnel-section="trust_why_grand_touch"
          className="bg-[#070707] px-3 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20"
        >
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#f7b52b] sm:text-[11px]">
                Meet Sean · Founder & lead installer
              </p>
              <h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">
                One person owns your car
                <span className="block text-[#f7b52b]">from quote to handover.</span>
              </h2>
              <p className="mt-3 text-base leading-7 text-slate-300 sm:text-lg">
                Most PPF shops bounce you between a sales WhatsApp, a coordinator, and a
                technician you never meet. Here, Sean answers your first message, reviews your
                car, and signs off the final QC himself.
              </p>
            </div>

            <div className="mt-8 grid gap-5 lg:grid-cols-[1.05fr_1.95fr] lg:items-center lg:gap-8">
              {/* Sean portrait card */}
              <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent">
                <div className="relative aspect-[4/5] w-full overflow-hidden sm:aspect-[5/6] lg:aspect-[4/5]">
                  <img
                    src="/guided-sean-with-patrols-v2.jpg"
                    alt="Sean — founder of Grand Touch Auto — between two Nissan Patrols he prepped for PPF"
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/30 to-transparent"
                  />
                  <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f7b52b] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-black">
                        <UserCheck className="h-3 w-3" />
                        Founder
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-black/50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white backdrop-blur">
                        <ShieldCheck className="h-3 w-3 text-[#f7b52b]" />
                        STEK-authorised
                      </span>
                    </div>
                    <p className="mt-3 text-lg font-black text-white sm:text-xl">Sean</p>
                    <p className="text-xs font-semibold text-slate-300 sm:text-sm">
                      Founder · Lead installer · Your direct contact
                    </p>
                  </div>
                </div>
              </div>

              {/* Three trust pillars + a Sean quote */}
              <div className="flex h-full flex-col gap-4">
                <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
                  {[
                    {
                      icon: UserCheck,
                      title: "Sean-led from quote to handover",
                      body:
                        "Same WhatsApp from quote to final sign-off. No salesperson hand-off, no vague accountability.",
                    },
                    {
                      icon: ScanSearch,
                      title: "Prep before film, always",
                      body:
                        "Multi-stage decon, correction, and QC before any film touches paint. If prep isn't right, the install doesn't start.",
                    },
                    {
                      icon: ShieldCheck,
                      title: "Registered STEK warranty",
                      body:
                        "Genuine STEK rolls, registered through the proper channel. You receive the trail tied to your VIN.",
                    },
                  ].map(({ icon: Icon, title, body }) => (
                    <Card
                      key={title}
                      className="flex h-full flex-col rounded-2xl border-white/10 bg-[linear-gradient(180deg,rgba(247,181,43,0.06),rgba(255,255,255,0.015))] p-4 text-white sm:p-5"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f7b52b]/15 ring-1 ring-[#f7b52b]/30">
                        <Icon className="h-5 w-5 text-[#f7b52b]" />
                      </div>
                      <h3 className="mt-3 text-base font-black leading-tight">{title}</h3>
                      <p className="mt-1.5 text-sm leading-6 text-slate-300">{body}</p>
                    </Card>
                  ))}
                </div>

                {/* Sean pull-quote — gives the page a voice, not just brand copy. */}
                <figure className="relative overflow-hidden rounded-2xl border border-[#f7b52b]/25 bg-[linear-gradient(135deg,rgba(247,181,43,0.08),transparent_60%)] p-5 sm:p-6">
                  <span
                    aria-hidden
                    className="absolute left-3 top-1 text-6xl font-black leading-none text-[#f7b52b]/15"
                  >
                    "
                  </span>
                  <blockquote className="relative text-sm leading-7 text-slate-100 sm:text-base sm:leading-8">
                    STEK is STEK — the same roll wherever it's installed properly. What
                    separates an install you forget about from one you regret is the prep,
                    the fitment, and the person still answering your messages two years
                    later. That part doesn't get cut here.
                  </blockquote>
                  <figcaption className="mt-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#f7b52b]">
                    <span>— Sean, founder</span>
                  </figcaption>
                </figure>
              </div>
            </div>
          </div>
        </section>

        {/* 4b. Risk is the install — direct objection-busting against the
            cheap-installer competition. Uses real install photos so the
            "prep matters" claim is shown, not just told. */}
        <section
          data-funnel-section="trust_install_risk"
          className="border-t border-white/10 bg-[radial-gradient(circle_at_85%_0%,rgba(247,181,43,0.08),transparent_55%),#050505] px-3 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20"
        >
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <p className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-[#f7b52b] sm:text-[11px]">
                <AlertTriangle className="h-3.5 w-3.5" />
                Where cheap PPF jobs go wrong
              </p>
              <h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">
                The risk is the install
                <span className="block text-[#f7b52b]">— not the film.</span>
              </h2>
              <p className="mt-3 text-base leading-7 text-slate-300 sm:text-lg">
                Almost every PPF complaint you've seen in Dubai owner groups traces back to one
                of these four mistakes. Each one is preventable with discipline at the right
                stage.
              </p>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {[
                {
                  image: "/guided-install-detail.png",
                  alt: "Technician hand-pressing PPF edge during install",
                  problem: "Skipped paint prep",
                  fix: "Multi-stage decon + correction before the roll is opened. Film over swirls = ugly forever.",
                },
                {
                  image: "/guided-rolls-install.png",
                  alt: "Installer hand-cutting STEK PPF film away from the vehicle",
                  problem: "Razor-cut on the paint",
                  fix: "Every piece is hand-cut and trimmed off the car before install. No blade work on the panel — that's how clearcoat gets scored.",
                },
                {
                  image: "/guided-911-stek-roll.png",
                  alt: "Genuine STEK PPF roll next to a Porsche 911",
                  problem: "Mystery film, mystery warranty",
                  fix: "We only install genuine STEK and register the roll. If the warranty isn't traceable, it doesn't exist.",
                },
                {
                  image: "/guided-cullinan-ppf.png",
                  alt: "Rolls-Royce Cullinan after PPF install at Grand Touch",
                  problem: "No QC, no follow-up",
                  fix: "Final inspection + one-week recheck on edges, corners, and high-flex panels. Most shops disappear at handover.",
                },
              ].map((card) => (
                <Card
                  key={card.problem}
                  className="group relative flex flex-col overflow-hidden rounded-3xl border-white/10 bg-[#0a0a0a] text-white sm:flex-row"
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden sm:aspect-auto sm:h-auto sm:w-[42%] sm:min-h-[220px]">
                    <img
                      src={card.image}
                      alt={card.alt}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent"
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-3 p-5 sm:p-6">
                    <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-red-300">
                      <X className="h-3 w-3" />
                      The mistake
                    </span>
                    <h3 className="text-lg font-black leading-tight sm:text-xl">
                      {card.problem}
                    </h3>
                    <div className="flex items-start gap-2 rounded-2xl border border-[#f7b52b]/20 bg-[#f7b52b]/[0.06] p-3">
                      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#f7b52b]" />
                      <p className="text-xs leading-6 text-slate-200 sm:text-sm sm:leading-6">
                        <span className="font-black uppercase tracking-wider text-[#f7b52b]">How we prevent it: </span>
                        {card.fix}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <TrustSectionCta
              placement="trust_install_risk"
              onEstimate={handleEstimateCta}
              onWhatsApp={hideDirectWa ? undefined : requestWhatsApp}
              primaryLabel="Get my prep-first estimate"
              microcopy="Prep-first install · Genuine STEK · Traceable warranty"
            />
          </div>
        </section>

        {/* 4. The fix for those 4 mistakes — a slim numbered timeline that
            bridges straight off the install-risk section (problem → our exact
            sequence), kept visually distinct so the two don't feel duplicated. */}
        <section
          data-funnel-section="trust_process"
          className="bg-[#070707] px-3 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20"
        >
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <p className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-[#f7b52b] sm:text-[11px]">
                <ShieldCheck className="h-3.5 w-3.5" />
                What we do instead
              </p>
              <h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">
                So none of those four
                <span className="block text-[#f7b52b]">touch your car.</span>
              </h2>
              <p className="mt-3 text-base leading-7 text-slate-300 sm:text-lg">
                Every car runs the same disciplined sequence — and each stage is signed off
                before the next one starts.
              </p>
            </div>

            <ol className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-4 lg:gap-5">
              {[
                {
                  icon: Sparkles,
                  title: "Deep prep & correction",
                  body: "Decontamination and multi-stage correction until the paint is flawless under the film.",
                },
                {
                  icon: Eye,
                  title: "Hand-cut install",
                  body: "STEK measured and hand-cut off the car, then fitted panel-by-panel — edges, wraps and recesses done properly.",
                },
                {
                  icon: Wrench,
                  title: "Full QC + finish",
                  body: "Inspected, then wheel and leather ceramic before a final clean for handover.",
                },
                {
                  icon: Award,
                  title: "Recheck + warranty",
                  body: "One-week recheck, then your STEK warranty registered to a traceable serial.",
                },
              ].map(({ icon: Icon, title, body }, index) => (
                <li key={title} className="relative flex flex-col">
                  <div className="flex items-center gap-3">
                    <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#f7b52b]/35 bg-[#f7b52b]/10 text-[#f7b52b]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#f7b52b]">
                      Stage 0{index + 1}
                    </span>
                    <span
                      aria-hidden
                      className="hidden h-px flex-1 bg-gradient-to-r from-[#f7b52b]/30 to-transparent lg:block"
                    />
                  </div>
                  <h3 className="mt-4 text-base font-black leading-tight text-white">{title}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-slate-400">{body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* 4b. Credibility band — Google rating + authorised STEK + traceable
            warranty, merged into one scannable strip. Sits after the
            install-quality story so it reinforces proof right before FAQ + booking. */}
        <section
          data-funnel-section="trust_credibility"
          className="border-t border-white/10 bg-[#070707] px-3 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20"
        >
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#f7b52b] sm:text-[11px]">
                Rated, authorised & registered
              </p>
              <h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">
                The proof behind the
                <span className="block text-[#f7b52b]">finish you just saw.</span>
              </h2>
            </div>

            <div className="mt-8 grid gap-4 sm:gap-5 lg:grid-cols-3 lg:items-stretch">
              {/* Google 4.9 — hero credibility */}
              <div className="flex h-full flex-col justify-center overflow-hidden rounded-[24px] border border-white/10 bg-[radial-gradient(circle_at_15%_0%,rgba(66,133,244,0.16),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(8,8,8,0.6))] p-5 sm:p-6">
                <div className="flex items-center gap-2">
                  <GoogleWordmark className="text-lg" />
                  <span className="text-sm font-semibold text-white/80">Reviews</span>
                </div>
                <div className="mt-4 flex items-end gap-3">
                  <span className="text-5xl font-black leading-none text-white sm:text-6xl">
                    4.9
                  </span>
                  <div className="pb-1">
                    <div className="flex gap-0.5 text-[#fbbc05]">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <Star key={i} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                    <p className="mt-1.5 text-[13px] leading-5 text-white/70">
                      from real Dubai owners
                    </p>
                  </div>
                </div>
              </div>

              {/* Authorised STEK installer */}
              <div className="flex h-full flex-col overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(8,8,8,0.6))] p-5 sm:p-6">
                <div className="flex items-center gap-2">
                  <img
                    src="/stek-white-full.png"
                    alt="STEK"
                    className="h-5 w-auto object-contain sm:h-6"
                    loading="lazy"
                  />
                  <span className="inline-flex items-center gap-1 rounded-full border border-[#f7b52b]/35 bg-[#f7b52b]/12 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.16em] text-[#f7b52b]">
                    <BadgeCheck className="h-3 w-3" />
                    Authorised
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-black leading-tight text-white">
                  Factory-trained STEK application
                </h3>
                <p className="mt-1.5 text-sm leading-6 text-slate-300">
                  Genuine STEK film applied by an authorised installer — not a reseller
                  cutting corners on prep.
                </p>
              </div>

              {/* Traceable warranty — with proof sticker */}
              <div className="group relative flex h-full flex-col overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(8,8,8,0.6))] p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-white/10">
                    <img
                      src={stekWarrantySticker}
                      alt="STEK warranty sticker — traceable handover proof"
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full border border-[#f7b52b]/35 bg-[#f7b52b]/12 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.16em] text-[#f7b52b]">
                    <ShieldCheck className="h-3 w-3" />
                    Warranty proof
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-black leading-tight text-white">
                  Registered to your VIN
                </h3>
                <p className="mt-1.5 text-sm leading-6 text-slate-300">
                  A tamper-evident STEK sticker, registered to your film roll and handover —
                  fully traceable, never just verbal.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 5. FAQ accordion */}
        <section
          data-funnel-section="trust_faq"
          className="bg-[#070707] px-3 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20"
        >
          <div className="mx-auto max-w-3xl">
            <div className="max-w-2xl">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#f7b52b] sm:text-[11px]">
                FAQ
              </p>
              <h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">
                Questions serious buyers ask
                <span className="block text-[#f7b52b]">before booking PPF.</span>
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-300 sm:text-base sm:leading-7">
                If you don't see your question here, tap WhatsApp Sean below and ask. Replies
                usually arrive within minutes.
              </p>
            </div>

            <Accordion
              type="single"
              collapsible
              className="mt-6 space-y-2"
              onValueChange={(value) => {
                if (value) {
                  const payload = {
                    faq_question: value,
                    question: value,
                    ...buildPayload(),
                  };
                  trackEvent("faq_opened", payload);
                  trackEvent("guided_trust_faq_open", {
                    ...payload,
                  });
                }
              }}
            >
              {trustFaqs.map((faq, index) => (
                <AccordionItem
                  key={faq.question}
                  value={faq.question}
                  className="rounded-2xl border border-white/10 bg-white/[0.025] px-4 sm:px-5"
                >
                  <AccordionTrigger className="py-4 text-left text-sm font-black text-white hover:no-underline sm:text-base [&[data-state=open]]:text-[#f7b52b]">
                    <span className="flex items-start gap-3">
                      <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#f7b52b]/70">
                        Q{String(index + 1).padStart(2, "0")}
                      </span>
                      {faq.question}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 text-sm leading-6 text-slate-300">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            <TrustSectionCta
              placement="trust_faq"
              onEstimate={handleEstimateCta}
              onWhatsApp={hideDirectWa ? undefined : requestWhatsApp}
              primaryLabel="Get my PPF estimate now"
            />
          </div>
        </section>

        {/* 5b. Service area & pickup — Dubai-wide free collection. Map + the
            zones we hit on a weekly route so suburb buyers know they're not
            outside the catchment. */}
        <section
          data-funnel-section="trust_service_area"
          className="border-t border-white/10 bg-[#070707] px-3 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20"
        >
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-6 lg:grid-cols-[1.05fr_1.4fr] lg:items-start lg:gap-10">
              <div>
                <p className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-[#f7b52b] sm:text-[11px]">
                  <MapPin className="h-3.5 w-3.5" />
                  Service area · Dubai-wide free pickup
                </p>
                <h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">
                  Free collection from
                  <span className="block text-[#f7b52b]">anywhere in Dubai.</span>
                </h2>
                <p className="mt-3 text-base leading-7 text-slate-300 sm:text-lg">
                  We're based in DIP 2 and run a weekly pickup route across Dubai. Hand the
                  keys to Sean's driver, we collect, install, and return the car ready —
                  showroom-clean, with a full briefing.
                </p>

                <div className="mt-5 grid grid-cols-2 gap-2 text-xs sm:text-sm">
                  {[
                    "Downtown / DIFC",
                    "Marina / JBR",
                    "Palm Jumeirah",
                    "Business Bay",
                    "Jumeirah / Al Wasl",
                    "Emirates Hills",
                    "Arabian Ranches",
                    "Mirdif / Al Warqa",
                    "JLT / Barsha",
                    "Meadows / Springs",
                  ].map((zone) => (
                    <div
                      key={zone}
                      className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.025] px-3 py-2"
                    >
                      <Check className="h-3.5 w-3.5 shrink-0 text-[#f7b52b]" />
                      <span className="font-semibold text-slate-200">{zone}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <ScarcityChip />
                  <a
                    href={TEL_HREF}
                    onClick={() =>
                      trackEvent("guided_phone_tap", {
                        placement: "service_area",
                        ...buildPayload(),
                      })
                    }
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:border-[#f7b52b]/40 hover:bg-white/10"
                  >
                    <Phone className="h-3.5 w-3.5 text-[#f7b52b]" />
                    <span className="tabular-nums">{DISPLAY_PHONE}</span>
                  </a>
                </div>

                <TrustSectionCta
                  placement="trust_service_area"
                  onEstimate={handleEstimateCta}
                  onWhatsApp={hideDirectWa ? undefined : requestWhatsApp}
                  primaryLabel="Book my free pickup"
                  microcopy="Free Dubai-wide pickup · We return it showroom-clean"
                />
              </div>

              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0a0a0a]">
                <div className="aspect-[4/3] w-full sm:aspect-[5/4] lg:aspect-[4/3]">
                  <iframe
                    title="Grand Touch Auto · DIP 2 location"
                    src="https://www.google.com/maps?q=GRAND+TOUCH+AUTO+DIP+2+Dubai&output=embed&z=11"
                    width="100%"
                    height="100%"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="h-full w-full grayscale-[35%] contrast-[0.95] [filter:invert(0.85)_hue-rotate(170deg)]"
                    allowFullScreen
                  />
                </div>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent p-4 sm:p-5">
                  <div className="pointer-events-auto flex flex-wrap items-center justify-between gap-3">
                    <div className="text-white">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#f7b52b]">
                        Workshop
                      </p>
                      <p className="text-sm font-black sm:text-base">
                        DIP 2 · Dubai Investment Park
                      </p>
                    </div>
                    <a
                      href="https://maps.app.goo.gl/mpB34gHYKD194Jcd9"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() =>
                        trackEvent("guided_map_open", { ...buildPayload() })
                      }
                      className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.12em] text-black transition-colors hover:bg-[#f7b52b]"
                    >
                      <MapPin className="h-3.5 w-3.5" />
                      Open in Maps
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Final CTA — last-chance close with live signals + countdown */}
        <section
          data-funnel-section="trust_final_cta"
          className="border-t border-white/10 bg-[radial-gradient(circle_at_50%_-10%,rgba(247,181,43,0.16),transparent_60%),linear-gradient(180deg,#0a0805,#070707)] px-3 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-24"
        >
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#f7b52b]/30 bg-[#f7b52b]/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-[#f7b52b] sm:text-[11px]">
              <Handshake className="h-3.5 w-3.5" />
              Last step · {SLOTS_REMAINING_THIS_WEEK} install slots left this week
            </div>
            <h2 className="mt-4 text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">
              Lock your install before
              <span className="block text-[#f7b52b]">
                this week's slots close.
              </span>
            </h2>

            {/* Live countdown to next install bay opening — keeps the urgency
                claim grounded in a real, rolling date, not just copy. */}
            <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-2xl border border-[#f7b52b]/30 bg-black/55 px-4 py-2.5 text-left">
              <Clock className="h-5 w-5 shrink-0 text-[#f7b52b]" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#f7b52b]">
                  Next install bay opens
                </p>
                <p className="text-sm font-black text-white sm:text-base">
                  {nextInstallSlot.weekday} ·{" "}
                  <span className="tabular-nums text-[#f7b52b]">{nextInstallSlot.label}</span>{" "}
                  from now
                </p>
              </div>
            </div>

            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
              Build your exact price above — size, film line, warranty, finish — then lock it
              with your number. Sean WhatsApps within ~12 minutes to confirm — <span className="font-bold text-white">no
              spam, no salesperson</span>, just a direct line.
            </p>

            <div className="mx-auto mt-5 inline-flex max-w-full flex-wrap items-center justify-center gap-x-3 gap-y-2 rounded-2xl border border-white/10 bg-black/40 px-4 py-3">
              <LivePulseStrip className="!justify-center" />
            </div>

            <div className="mt-6 flex flex-col items-center gap-3 sm:mt-8 sm:flex-row sm:justify-center">
              <Button
                type="button"
                size="lg"
                onClick={() => handleEstimateCta("trust_final_cta")}
                className="h-12 w-full gap-2 bg-[#f7b52b] px-6 text-base font-black text-black hover:bg-[#ffc94f] sm:w-auto"
              >
                Get my PPF estimate
                <ArrowRight className="h-4 w-4" />
              </Button>
              {!hideDirectWa ? (
                <Button
                  type="button"
                  size="lg"
                  onClick={() => requestWhatsApp("trust_final_cta")}
                  className="h-12 w-full gap-2 bg-[#25D366] px-6 text-base font-black text-white hover:bg-[#20bf5d] sm:w-auto"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp Sean
                </Button>
              ) : null}
              <a
                href={TEL_HREF}
                onClick={() =>
                  trackEvent("guided_phone_tap", {
                    placement: "trust_final_cta",
                    ...buildPayload(),
                  })
                }
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md border border-white/15 bg-white/5 px-5 text-sm font-black text-white transition-colors hover:border-[#f7b52b]/40 hover:bg-white/10 sm:w-auto"
              >
                <Phone className="h-4 w-4 text-[#f7b52b]" />
                <span className="tabular-nums">{DISPLAY_PHONE}</span>
              </a>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              {[
                { icon: Star, label: "4.9 Google rated" },
                { icon: ShieldCheck, label: "Authorised STEK installer" },
                { icon: UserCheck, label: "Direct with Sean" },
              ].map(({ icon: Icon, label }) => (
                <span key={label} className="inline-flex items-center gap-1.5">
                  <Icon className="h-3 w-3 text-[#f7b52b]" />
                  {label}
                </span>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Desktop floating action cluster — only renders once the user has
          scrolled past the calculator, mirroring the mobile sticky. Gold for
          calculator, green for WhatsApp, ghost pill for direct call. */}
      <div
        aria-hidden={!isPanelOffscreen}
        className={cn(
          "fixed bottom-6 right-6 z-40 hidden flex-col items-stretch gap-2 transition-all duration-300 md:flex",
          isPanelOffscreen
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none translate-y-4 opacity-0",
        )}
      >
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/85 p-2 shadow-[0_30px_80px_rgba(0,0,0,0.5)] backdrop-blur-md">
          <div className="mb-2 flex items-center gap-2 px-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-300">
            <span className="relative inline-flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <span className="text-emerald-300">Sean online</span>
            <span aria-hidden className="h-2 w-px bg-white/15" />
            <span className="text-slate-300">~12 min reply</span>
          </div>
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              onClick={() => handleEstimateCta("desktop_sticky")}
              className="h-11 gap-2 bg-[#f7b52b] px-4 text-sm font-black text-black hover:bg-[#ffc94f]"
              tabIndex={isPanelOffscreen ? 0 : -1}
            >
              Get my PPF estimate
              <ArrowRight className="h-4 w-4" />
            </Button>
            <div className="grid grid-cols-2 gap-2">
              {!hideDirectWa ? (
                <Button
                  type="button"
                  onClick={() => requestWhatsApp("desktop_sticky")}
                  className="h-10 gap-1.5 bg-[#25D366] px-3 text-xs font-black text-white hover:bg-[#20bf5d]"
                  tabIndex={isPanelOffscreen ? 0 : -1}
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </Button>
              ) : null}
              <a
                href={TEL_HREF}
                onClick={() =>
                  trackEvent("guided_phone_tap", {
                    placement: "desktop_sticky",
                    ...buildPayload(),
                  })
                }
                tabIndex={isPanelOffscreen ? 0 : -1}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md border border-white/15 bg-white/5 px-3 text-xs font-black text-white transition-colors hover:border-[#f7b52b]/40 hover:bg-white/10"
              >
                <Phone className="h-4 w-4 text-[#f7b52b]" />
                Call
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky — brings the user back to their live price once the
          builder panel has scrolled out of view. */}
      <div
        aria-hidden={!isPanelOffscreen}
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black/90 px-3 py-2 backdrop-blur transition-all duration-300 md:hidden",
          isPanelOffscreen
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none translate-y-full opacity-0",
        )}
      >
        <Button
          type="button"
          onClick={() => handleEstimateCta("mobile_sticky")}
          tabIndex={isPanelOffscreen ? 0 : -1}
          className="h-11 w-full gap-2 bg-[#f7b52b] text-sm font-black text-black shadow-[0_-6px_24px_rgba(247,181,43,0.25)] hover:bg-[#ffc94f]"
        >
          Back to my price — {formatAED(price)}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default PpfMetaPriceBuilder;
