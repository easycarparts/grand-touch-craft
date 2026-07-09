import {
  FormEvent,
  MutableRefObject,
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AlertTriangle,
  ArrowRight,
  Award,
  BadgeCheck,
  BadgePercent,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  CarFront,
  Eye,
  Gift,
  Handshake,
  Lock,
  MapPin,
  MessageCircle,
  MousePointerClick,
  PanelTop,
  Phone,
  Play,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Star,
  Sun,
  UserCheck,
  Volume2,
  VolumeX,
  Wrench,
  X,
  Zap,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { initTikTokPixel, trackTikTokEvent, trackTikTokSubmitForm } from "@/lib/tiktok-pixel";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.svg";

/** Tint tier ids — STEK Action Essential / STEK Smart Ceramic / STEK Nex Premium. */
type TintTier = "action" | "smart" | "nex";
type FlowStep = "size" | "package" | "result";
/** Car-size brackets (same visual size step as the PPF funnel). */
type TintSize = "Small" | "Medium" | "Sports" | "SUV";
type InstallTiming = "today" | "tomorrow" | "this_week" | "checking";

type TintFunnelConfig = {
  seoKey: string;
  funnelName: string;
  landingPageVariant: string;
  defaultSourcePlatform: string;
  calculatorType: string;
  pageUrl: string;
  seo: {
    title: string;
    description: string;
    keywords: string;
    ogTitle: string;
    ogDescription: string;
  };
  eyebrow: string;
  headline: string;
  headlineAccent: string;
  mobileIntro: string;
  desktopIntro: string;
  campaignIntro?: string;
  campaignTerms?: string[];
  primaryCta: string;
  secondaryCta: string;
  proofPoints: string[];
  messageIntro: string;
  bonusClaimServiceName: string;
};

const WHATSAPP_NUMBER = "971567191045";
const DISPLAY_PHONE = "+971 56 719 1045";
const TEL_HREF = "tel:+971567191045";
const TINT_TIKTOK_PIXEL_ID = "D97JTBBC77U6Q0JCHTLG";
// NOTE: there are intentionally NO Google Ads conversion sends on this page.
// Paid social conversions are Meta/TikTok only: Contact on WhatsApp taps,
// Lead/SubmitForm on successful form submit.

// Meta tint funnel identity — exact clone of the /ppf-dubai-quote (dubai_quote)
// variant behaviour: price SHOWN openly, guided stepper, soft pre-chat popup on
// pre-quote WhatsApp taps.
const funnelConfig: TintFunnelConfig = {
  seoKey: "tint-dubai",
  funnelName: "tint_meta_2026h2",
  landingPageVariant: "tint_meta_2026h2",
  defaultSourcePlatform: "meta",
  calculatorType: "guided_tint",
  pageUrl: "https://www.grandtouchauto.ae/tint-dubai",
  seo: {
    title: "Ceramic Window Tint Dubai | Installed in 3 Hours | Grand Touch",
    description:
      "Build your ceramic window tint setup, see your Dubai price instantly, then claim 20% off and a free sun-strip visor direct with Sean on WhatsApp.",
    keywords:
      "window tint dubai, ceramic tint dubai, car tinting dubai, tint price dubai, STEK tint dubai, heat rejection tint dubai, legal tint dubai",
    ogTitle: "Ceramic Window Tint Dubai",
    ogDescription:
      "Ceramic window tint installed in ~3 hours — build your setup, see your price, unlock 20% off, and confirm with Sean on WhatsApp.",
  },
  eyebrow: "Ceramic Window Tint - Dubai",
  headline: "Ceramic Window Tint Price",
  headlineAccent: "in Dubai.",
  mobileIntro:
    "Build your setup, see your ceramic tint price instantly, then claim 20% off and a free sun-strip visor with Sean on WhatsApp.",
  desktopIntro:
    "Use this tint builder to price ceramic window tint for your car, SUV, or sports car — real heat rejection, UAE-legal shades, installed in about 3 hours — then lock in 20% off with Sean on WhatsApp.",
  campaignIntro:
    "Built for Dubai drivers comparing ceramic window tint, heat rejection film, and legal tint shades — with STEK-authorised installation.",
  campaignTerms: ["Window tint Dubai", "Ceramic tint", "Heat rejection", "UAE-legal shades"],
  primaryCta: "See my price (60s)",
  secondaryCta: "WhatsApp Sean",
  proofPoints: ["60-second quote", "Installed in ~3 hours", "Sean reviews each setup"],
  messageIntro: "Hi Sean, I built a ceramic tint setup on the Grand Touch tint page.",
  bonusClaimServiceName: "Tint Dubai Quote Bonus Claim",
};

// Dubai install slot windows — rolling, cosmetic only. Used to give a "next available" feel.
const SLOTS_PER_WEEK = 4;
const SLOTS_REMAINING_THIS_WEEK = 2;

const sizeOptions: Array<{
  value: TintSize;
  label: string;
  example: string;
  image: string;
}> = [
  {
    value: "Small",
    label: "Hatchback / Small",
    example: "Golf / A45 / Yaris",
    image: "/calculator-a45-gloss.jpg",
  },
  {
    value: "Medium",
    label: "Sedan",
    example: "Camry / 5 Series / E-Class",
    image: "/calculator-e63s-gloss.jpg",
  },
  {
    value: "Sports",
    label: "Sports / Exotic",
    example: "911 / GT3 / SF90 / Huracán",
    image: "/calculator-gt3-gloss.jpg",
  },
  {
    value: "SUV",
    label: "SUV / 4x4",
    example: "Patrol / Defender / Cayenne",
    image: "/calculator-patrol-gloss.jpg",
  },
];

// Film specs per tier — shown as compact differentiators on the package cards.
// TODO: owner to confirm exact specs from STEK data sheets (stekautomotive.com
// lists the ACTION+/SMART+/NEX+ lines but publishes no TSER/IR/UV numbers).
const packageOptions: Array<{
  tier: TintTier;
  title: string;
  shortName: string;
  label: string;
  value: string;
  specs: string[];
  badge?: string;
}> = [
  {
    tier: "action",
    title: "STEK Action Essential",
    shortName: "Action",
    label: "Essential",
    value: "Budget pick, good heat rejection",
    specs: ["IR rejection ~55%", "UV 99%", "Dyed-carbon film"],
  },
  {
    tier: "smart",
    title: "STEK Smart Ceramic",
    shortName: "Smart",
    label: "Most chosen",
    value: "Ceramic heat rejection, crystal night clarity, strong STEK warranty",
    specs: ["IR rejection ~88%", "UV 99%", "Ceramic layer"],
    badge: "POPULAR",
  },
  {
    tier: "nex",
    title: "STEK Nex Premium",
    shortName: "Nex",
    label: "Ultimate",
    value: "Maximum IR rejection, premium warranty",
    specs: ["IR rejection ~97%", "UV 99%", "Nano-ceramic"],
  },
];

// Full-car ceramic tint pricing by size × tier (AED, excl. VAT). These are the
// TRUE starting prices Sean honors — ranges use the low end as the quoted
// anchor; Sean confirms the final figure once he knows the exact car. The 20%
// strikethrough anchor is derived from them (list = round(target / 0.8 / 10) * 10).
const TINT_PRICE_TABLE: Record<TintTier, Record<TintSize, number>> = {
  action: { Small: 649, Medium: 799, Sports: 899, SUV: 999 },
  smart: { Small: 1299, Medium: 1499, Sports: 1499, SUV: 1699 },
  nex: { Small: 2199, Medium: 2399, Sports: 2499, SUV: 2799 },
};

const getTintPrice = (tier: TintTier, size: TintSize) => TINT_PRICE_TABLE[tier][size];

type TintAddOnId = "windshield" | "panoramic";

const TINT_ADD_ONS: Array<{
  id: TintAddOnId;
  label: string;
  description: string;
  price: number;
  icon: typeof CarFront;
}> = [
  {
    id: "windshield",
    label: "Clear front windshield heat film",
    description: "Cuts dashboard heat while keeping the front glass clear",
    price: 499,
    icon: CarFront,
  },
  {
    id: "panoramic",
    label: "Panoramic roof tint",
    description: "Heat rejection film for the glass roof",
    price: 699,
    icon: PanelTop,
  },
];

const EMPTY_SELECTED_ADD_ONS: Record<TintAddOnId, boolean> = {
  windshield: false,
  panoramic: false,
};

const installTimingOptions: Array<{ value: InstallTiming; label: string }> = [
  { value: "today", label: "Today" },
  { value: "tomorrow", label: "Tomorrow" },
  { value: "this_week", label: "This week" },
  { value: "checking", label: "Just checking" },
];

const formatSelectedAddOns = (selected: Record<TintAddOnId, boolean>) =>
  TINT_ADD_ONS.filter((addon) => selected[addon.id]).map(
    (addon) => `${addon.label} (+AED ${addon.price})`,
  );

const stepOrder: FlowStep[] = ["size", "package", "result"];

/**
 * Top-bar bonuses — claimable extras only, kept distinct from the standard
 * "free add-ons" stack shown in the Dialog. These are the things a user
 * unlocks by completing the funnel: discount, free tint, extended warranty,
 * and a direct line to Sean.
 */
const topOffers: Array<{
  icon: typeof BadgePercent;
  text: string;
}> = [
  { icon: BadgePercent, text: "Claim 20% off your ceramic tint setup" },
  { icon: Sparkles, text: "Free sun-strip visor with every install" },
  { icon: ShieldCheck, text: "Front windshield film available (+AED 499)" },
  { icon: Zap, text: "Installed in ~3 hours · quote direct from Sean" },
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
    question: "What tint shades are legal in the UAE?",
    answer:
      "UAE regulations allow up to 50% darkness on the side and rear windows of private cars — the front windshield can't be tinted except for a sun-strip visor at the top. Everything we install is within legal limits, and Sean will tell you straight if a shade you're asking for would cause problems at registration or with the authorities.",
  },
  {
    question: "Does a darker tint mean better heat rejection?",
    answer:
      "No — this is the biggest myth in tinting. Darkness (VLT) is a look choice; heat rejection comes from the ceramic and IR-blocking layers in the film. A light ceramic tint from the Smart or Nex range rejects far more heat than a cheap dark dyed film. That's why your shade choice never changes the price on this page — the tier does.",
  },
  {
    question: "How long does a tint install take?",
    answer:
      "Around 3 hours for a full car — glass decontamination, precision-cut film, installation, and QC. You can wait comfortably at our DIP 2 studio while we work. We'll also tell you the safe window before you roll the windows down (usually 24–48 hours while the film cures).",
  },
  {
    question: "What's the difference between Action, Smart Ceramic, and Nex?",
    answer:
      "STEK Action Essential is the budget pick — solid heat rejection and a clean look. STEK Smart Ceramic is the most chosen: true ceramic heat rejection, crystal clarity at night, and a strong STEK warranty. STEK Nex Premium is the maximum — the highest IR rejection in the range with the premium warranty. Sean will tell you honestly which tier fits how you use the car.",
  },
  {
    question: "How does the warranty registration work?",
    answer:
      "STEK film is registered after installation so the warranty is traceable to the actual roll on your car — covering bubbling, peeling, and colour change (no purple fade). Most shops promise a warranty verbally; we hand you the registration trail.",
  },
  {
    question: "Will the tint interfere with phone signal, Salik, or GPS?",
    answer:
      "No. STEK ceramic films are non-metallic, so they don't block phone signal, GPS, garage remotes, or Salik toll tags. Signal interference is a problem with old metallised films — not with what we install.",
  },
  {
    question: "Can you tint the front windshield too?",
    answer:
      "Full windshield tinting isn't permitted in the UAE, but we offer a clear heat-rejection windshield film (+AED 499) that blocks IR without darkening the glass, plus a free sun-strip visor across the top with every install.",
  },
  {
    question: "Will removing the tint later damage my windows?",
    answer:
      "No — quality film installed properly lifts off cleanly. Problems come from cheap dyed films that bake onto the glass and defroster lines. If you have old tint on the car now, we remove it properly before the new film goes on.",
  },
  {
    question: "Can I bring my own film, or does Grand Touch supply it?",
    answer:
      "We only install film we supply — genuine STEK ranges we can register and stand behind. Customer-supplied film breaks the chain of accountability: if it fades or bubbles later, no one owns the problem. Film cost is already included in the prices you see.",
  },
  {
    question: "Does the price cover all windows?",
    answer:
      "Yes — the figure you see covers the full car: front doors, rear doors, quarter glass, and the rear windshield, plus the free sun-strip visor. Prices exclude VAT, and Sean confirms the final figure once he knows the exact car.",
  },
];

// NOTE: the `value` AED figures below are PLACEHOLDERS — confirm/adjust with the
// owner before launch. They drive the Step 4 "value stack" total in ONE place.
const includedFreeItems: Array<{ title: string; description: string; value: number }> = [
  {
    title: "Sun-strip visor (free bonus)",
    description: "A legal shade band across the top of the windshield — the spot the sun hits hardest.",
    value: 299,
  },
  {
    title: "STEK warranty registration",
    description: "Registered to your car — bubbling, peeling & fade covered on paper, not verbally.",
    value: 150,
  },
  {
    title: "Lifetime tint inspection",
    description: "Drop in anytime — we recheck edges & corners for life.",
    value: 300,
  },
];

// The full Step 4 value stack = free inclusions bundled with every install.
const valueStackItems = [...includedFreeItems];
const valueStackTotal = valueStackItems.reduce((sum, item) => sum + item.value, 0);

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

const optionButton =
  "group relative overflow-hidden rounded-[22px] border bg-white/[0.035] text-left transition duration-200 hover:-translate-y-0.5 hover:border-[#f7b52b]/55 hover:bg-white/[0.06]";

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
  primaryLabel = "Get my tint estimate",
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

type GuidedCardGlowProps = {
  delay?: number;
  radius?: number;
  inset?: number;
};

/**
 * Renders a soft gold comet that traces the rounded-rect outline of its parent
 * anticlockwise, with a gentle opacity pulse. Sits inside the parent's
 * overflow-hidden bounds so the glow hugs the visible card border.
 */
const GuidedCardGlow = ({ delay = 0, radius = 22, inset = 3 }: GuidedCardGlowProps) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  useEffect(() => {
    const node = wrapperRef.current;
    if (!node) return;

    const update = () => {
      const rect = node.getBoundingClientRect();
      setSize({ w: Math.round(rect.width), h: Math.round(rect.height) });
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const { w, h } = size;
  const innerW = Math.max(0, w - inset * 2);
  const innerH = Math.max(0, h - inset * 2);
  const r = Math.max(0, Math.min(radius - inset, Math.min(innerW, innerH) / 2));

  // Anticlockwise rounded-rect path beginning at top-middle:
  // top -> left -> bottom -> right -> back to top.
  const path =
    innerW > 0 && innerH > 0
      ? `M ${inset + innerW / 2} ${inset}` +
        ` H ${inset + r}` +
        ` A ${r} ${r} 0 0 0 ${inset} ${inset + r}` +
        ` V ${inset + innerH - r}` +
        ` A ${r} ${r} 0 0 0 ${inset + r} ${inset + innerH}` +
        ` H ${inset + innerW - r}` +
        ` A ${r} ${r} 0 0 0 ${inset + innerW} ${inset + innerH - r}` +
        ` V ${inset + r}` +
        ` A ${r} ${r} 0 0 0 ${inset + innerW - r} ${inset}` +
        ` Z`
      : "";

  return (
    <div
      ref={wrapperRef}
      aria-hidden
      className="pointer-events-none absolute inset-0"
    >
      {path ? (
        <svg
          width={w}
          height={h}
          viewBox={`0 0 ${w} ${h}`}
          fill="none"
          className="absolute inset-0"
        >
          {/* Soft outer glow */}
          <path
            d={path}
            stroke="rgba(247, 181, 43, 0.55)"
            strokeWidth={4}
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray="22 78"
            className="guided-glow-comet"
            style={{ animationDelay: `${delay}s`, filter: "blur(4px)" }}
          />
          {/* Bright comet core */}
          <path
            d={path}
            stroke="rgba(247, 181, 43, 1)"
            strokeWidth={1.5}
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray="14 86"
            className="guided-glow-comet"
            style={{ animationDelay: `${delay}s` }}
          />
        </svg>
      ) : null}
    </div>
  );
};

/**
 * Drives a looping "click me" pointer demo: cursor floats from the centre of a
 * card grid to each card in turn, with a pause/ripple at every stop. Stops
 * automatically when `active` flips to false (e.g. once the user picks one).
 */
const useGuidedPointer = (
  gridRef: RefObject<HTMLDivElement>,
  cardRefs: MutableRefObject<Array<HTMLButtonElement | null>>,
  cardCount: number,
  active: boolean,
) => {
  const [step, setStep] = useState(0);
  const [coord, setCoord] = useState<{ x: number; y: number } | null>(null);

  const atCard = active && step % 2 === 1;
  const cardIndex = atCard ? (step - 1) / 2 : -1;

  useEffect(() => {
    if (!active) {
      setStep(0);
      return;
    }
    if (cardCount <= 0) return;
    const id = window.setInterval(() => {
      setStep((s) => (s + 1) % (cardCount * 2));
    }, 1500);
    return () => window.clearInterval(id);
  }, [active, cardCount]);

  useEffect(() => {
    if (!active) {
      setCoord(null);
      return;
    }

    const updateCoord = () => {
      const grid = gridRef.current;
      if (!grid) return;
      const gridRect = grid.getBoundingClientRect();
      if (atCard) {
        const card = cardRefs.current[cardIndex];
        if (!card) return;
        const cardRect = card.getBoundingClientRect();
        setCoord({
          x: cardRect.left + cardRect.width / 2 - gridRect.left,
          y: cardRect.top + cardRect.height / 2 - gridRect.top,
        });
      } else {
        setCoord({ x: gridRect.width / 2, y: gridRect.height / 2 });
      }
    };

    updateCoord();
    const observer = new ResizeObserver(updateCoord);
    const grid = gridRef.current;
    if (grid) observer.observe(grid);
    window.addEventListener("resize", updateCoord);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateCoord);
    };
  }, [active, atCard, cardIndex, gridRef, cardRefs]);

  return { coord, atCard, cardIndex };
};

const GuidedPointerOverlay = ({
  coord,
  atCard,
}: {
  coord: { x: number; y: number } | null;
  atCard: boolean;
}) => {
  if (!coord) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute left-0 top-0 z-30 motion-reduce:hidden"
      style={{
        transform: `translate3d(${coord.x}px, ${coord.y}px, 0)`,
        transition: "transform 950ms cubic-bezier(0.22, 1, 0.36, 1), opacity 400ms ease",
        opacity: atCard ? 1 : 0.92,
      }}
    >
      <div className="relative -translate-x-1/2 -translate-y-1/2">
        {atCard ? (
          <>
            <span className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#f7b52b]/40 animate-ping" />
            <span className="absolute left-1/2 top-1/2 h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#f7b52b]/25 blur-md" />
          </>
        ) : null}
        <span
          className={cn(
            "relative block rounded-full border border-white/35 bg-[#f7b52b] shadow-[0_0_22px_rgba(247,181,43,0.85)] transition-all duration-300",
            atCard ? "h-3.5 w-3.5" : "h-4 w-4",
          )}
        />
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

const TintDubaiQuoteFunnel = () => {
  const variantConfig = funnelConfig;
  // Hardcoded behaviour = the "dubai_quote" variant path of the PPF V2 funnel:
  // price SHOWN openly, guided stepper, soft pre-chat popup on pre-quote
  // WhatsApp taps. The flags below are kept as dead-but-safe constants so the
  // shared JSX branches stay intact (deleting them risked layout regressions).
  const isTikTokVariant = false;
  const isGated = false;
  const isMetaVariant = false;
  const isPriceVariant = false;
  const offerTickerItems = topOffers;
  // Opens on the visual size picker (lowest-friction first tap).
  const [step, setStep] = useState<FlowStep>("size");
  const [size, setSize] = useState<TintSize | null>(null);
  const [tintTier, setTintTier] = useState<TintTier | null>(null);
  const [vehicle, setVehicle] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedAddOns, setSelectedAddOns] =
    useState<Record<TintAddOnId, boolean>>(EMPTY_SELECTED_ADD_ONS);
  const [installTiming, setInstallTiming] = useState<InstallTiming>("this_week");
  const [formStatus, setFormStatus] = useState<"idle" | "saving" | "saved" | "error" | "invalid_phone">("idle");
  const [preChatOpen, setPreChatOpen] = useState(false);
  const [pendingWaPlacement, setPendingWaPlacement] = useState<string | null>(null);
  // Gamified "unlock 20% off" mechanic on the result step.
  const [discountUnlocked, setDiscountUnlocked] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [animatedPrice, setAnimatedPrice] = useState<number | null>(null);
  const priceRafRef = useRef<number | null>(null);
  const flowPanelRef = useRef<HTMLDivElement>(null);
  const pageStartedAtRef = useRef<number>(Date.now());
  const activeSectionRef = useRef<string>("calculator");
  const activeSectionStartedAtRef = useRef<number>(Date.now());
  const viewedSectionsRef = useRef<Set<string>>(new Set());
  const maxScrollPercentRef = useRef(0);
  const resultStepStartedAtRef = useRef<number | null>(null);
  // One Meta pixel Lead per session — a qualified WhatsApp tap followed by a
  // form submit must not double-count (2 Meta Leads vs 1 real lead in the CRM).
  const metaLeadFiredRef = useRef(false);

  const sizeGridRef = useRef<HTMLDivElement>(null);
  const sizeCardRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const sizePointer = useGuidedPointer(
    sizeGridRef,
    sizeCardRefs,
    sizeOptions.length,
    step === "size" && !size,
  );

  const [vehicleAttentionFired, setVehicleAttentionFired] = useState(false);
  const [animatedVehiclePlaceholder, setAnimatedVehiclePlaceholder] = useState(
    "Example: 2026 Range Rover Sport, 2025 Patrol...",
  );
  const [isVehicleFocused, setIsVehicleFocused] = useState(false);
  const vehiclePlaceholderExamples = useMemo(
    () => [
      "2026 Range Rover Sport",
      "2025 Nissan Patrol",
      "2024 Porsche 911 GT3",
      "2023 AMG G63",
      "2026 BMW M5",
      "2025 Tesla Model X",
    ],
    [],
  );

  const [animatedPhonePlaceholder, setAnimatedPhonePlaceholder] = useState("50 123 4567");
  const [isPhoneFocused, setIsPhoneFocused] = useState(false);
  const phonePlaceholderExamples = useMemo(
    () => ["50 123 4567", "55 234 5678", "56 345 6789", "52 456 7890"],
    [],
  );

  useEffect(() => {
    if (size && !vehicleAttentionFired) {
      setVehicleAttentionFired(true);
    }
  }, [size, vehicleAttentionFired]);

  useEffect(() => {
    if (!tintTier) {
      setAnimatedPhonePlaceholder("50 123 4567");
      return;
    }
    if (phone.length > 0 || isPhoneFocused) return;

    let exampleIdx = 0;
    let charIdx = 0;
    let isDeleting = false;
    let cancelled = false;
    let timeoutId: number | null = null;

    const tick = () => {
      if (cancelled) return;
      const target = phonePlaceholderExamples[exampleIdx];
      if (!isDeleting) {
        charIdx += 1;
        setAnimatedPhonePlaceholder(target.slice(0, charIdx));
        if (charIdx >= target.length) {
          isDeleting = true;
          timeoutId = window.setTimeout(tick, 1400);
          return;
        }
        timeoutId = window.setTimeout(tick, 70 + Math.random() * 50);
      } else {
        charIdx -= 1;
        setAnimatedPhonePlaceholder(target.slice(0, charIdx) || " ");
        if (charIdx <= 0) {
          isDeleting = false;
          exampleIdx = (exampleIdx + 1) % phonePlaceholderExamples.length;
          timeoutId = window.setTimeout(tick, 320);
          return;
        }
        timeoutId = window.setTimeout(tick, 30);
      }
    };

    timeoutId = window.setTimeout(tick, 500);
    return () => {
      cancelled = true;
      if (timeoutId !== null) window.clearTimeout(timeoutId);
    };
  }, [tintTier, phone, isPhoneFocused, phonePlaceholderExamples]);

  useEffect(() => {
    if (!size) {
      setAnimatedVehiclePlaceholder("Example: 2026 Range Rover Sport, 2025 Patrol...");
      return;
    }
    if (vehicle.length > 0 || isVehicleFocused) return;

    let exampleIdx = 0;
    let charIdx = 0;
    let isDeleting = false;
    let cancelled = false;
    let timeoutId: number | null = null;

    const tick = () => {
      if (cancelled) return;
      const target = vehiclePlaceholderExamples[exampleIdx];
      if (!isDeleting) {
        charIdx += 1;
        const text = target.slice(0, charIdx);
        setAnimatedVehiclePlaceholder(text);
        if (charIdx >= target.length) {
          isDeleting = true;
          timeoutId = window.setTimeout(tick, 1400);
          return;
        }
        timeoutId = window.setTimeout(tick, 70 + Math.random() * 50);
      } else {
        charIdx -= 1;
        const text = target.slice(0, charIdx);
        setAnimatedVehiclePlaceholder(text || " ");
        if (charIdx <= 0) {
          isDeleting = false;
          exampleIdx = (exampleIdx + 1) % vehiclePlaceholderExamples.length;
          timeoutId = window.setTimeout(tick, 320);
          return;
        }
        timeoutId = window.setTimeout(tick, 30);
      }
    };

    timeoutId = window.setTimeout(tick, 500);
    return () => {
      cancelled = true;
      if (timeoutId !== null) window.clearTimeout(timeoutId);
    };
  }, [size, vehicle, isVehicleFocused, vehiclePlaceholderExamples]);


  const funnelContext = useMemo(
    () =>
      createFunnelTrackingContext({
        funnelName: variantConfig.funnelName,
        landingPageVariant: variantConfig.landingPageVariant,
        defaultSourcePlatform: variantConfig.defaultSourcePlatform,
      }),
    [variantConfig],
  );

  const selectedSize = sizeOptions.find((option) => option.value === size) ?? null;
  const selectedPackage = packageOptions.find((option) => option.tier === tintTier) ?? null;
  const estimate = size && tintTier ? getTintPrice(tintTier, size) : null;
  const isComplete = Boolean(size && tintTier && estimate !== null);
  const policyBonusEligible = Boolean(size && tintTier);
  const phoneCaptured = isLikelyRealPhone(phone);
  const bonusEligible = policyBonusEligible && phoneCaptured;
  const premiumBonusLabel = bonusEligible
    ? "20% saving & sun-strip visor unlocked"
    : "20% saving & sun-strip visor available";

  // ── Gamified 20% unlock pricing — MARGIN-NEUTRAL ANCHOR ─────────────────
  // `estimate` is the TRUE price Sean honors → that's the unlocked target.
  // The displayed pre-unlock anchor (`listPrice`) is ~25% higher, rounded to
  // the nearest 10 so a clean "20% OFF" reads correctly. Savings = anchor −
  // target. The WhatsApp message and Google Ads VALUES always use targetPrice.
  const targetPrice = estimate;
  const listPrice = estimate !== null ? Math.round(estimate / 0.8 / 10) * 10 : null;
  const discountSavings =
    listPrice !== null && targetPrice !== null ? listPrice - targetPrice : null;
  const addOnTotal = useMemo(
    () =>
      TINT_ADD_ONS.reduce(
        (sum, addon) => sum + (selectedAddOns[addon.id] ? addon.price : 0),
        0,
      ),
    [selectedAddOns],
  );
  const todayPrice = targetPrice !== null ? targetPrice + addOnTotal : null;
  const selectedAddOnLabels = useMemo(() => formatSelectedAddOns(selectedAddOns), [selectedAddOns]);
  const selectedInstallTimingLabel =
    installTimingOptions.find((option) => option.value === installTiming)?.label ?? "This week";
  const priceIncludesLine = useMemo(() => {
    if (!selectedSize || !selectedPackage) return "";
    const parts = [`${selectedSize.label} ${selectedPackage.title}`];
    if (selectedAddOns.windshield) parts.push("front windshield film");
    if (selectedAddOns.panoramic) parts.push("panoramic roof tint");
    return `Includes ${parts.join(" + ")}`;
  }, [selectedAddOns, selectedPackage, selectedSize]);
  const firstName = name.trim().split(/\s+/)[0] ?? "";
  const reserveButtonText = useMemo(() => {
    if (todayPrice === null) return "Reserve my tint offer";
    if (installTiming === "checking") return `Send me the ${formatAED(todayPrice)} offer`;
    if (installTiming === "today" || installTiming === "tomorrow") {
      return `Reserve my ${formatAED(todayPrice)} slot`;
    }
    return `Reserve my ${formatAED(todayPrice)} tint offer`;
  }, [installTiming, todayPrice]);
  // V3 needs only a valid phone (name optional) to cut last-step friction.
  const canUnlock = (isGated || isPriceVariant || name.trim().length >= 2) && phoneCaptured;
  // PRICE variant capture intent: "whatsapp" = save then open WhatsApp with the
  // quote (primary); "lock" = save only (secondary, for quiet researchers).
  const priceCaptureIntentRef = useRef<"whatsapp" | "lock">("whatsapp");
  // Meta traffic runs "lead-form" style: no direct-WhatsApp escape until the
  // visitor has qualified (calculator complete). Owner data: drive-by Meta
  // WhatsApp chats essentially never close. Google/v3 keeps direct WhatsApp.
  const hideDirectWa = isMetaVariant && !isComplete;
  // Meta Lead gating: this funnel has no qualifier layer — a Lead fires only
  // for QUALIFIED actions (calculator complete) and only once per session via
  // metaLeadFiredRef.
  const tintLeadQualified = true;

  const trackEvent = useCallback(
    (
      eventName: string,
      payload: Record<string, unknown> = {},
      options: {
        emitToTagManagers?: boolean;
        metaStandardEvent?: MetaStandardEvent;
        metaPayload?: Record<string, unknown>;
      } = {},
    ) => {
      trackFunnelEvent({
        eventName,
        context: funnelContext,
        payload,
        metaStandardEvent: options.metaStandardEvent,
        metaPayload: options.metaPayload,
        emitToTagManagers: options.emitToTagManagers,
      });
    },
    [funnelContext],
  );

  // Meta-traffic funnel: NO Google Ads conversions fire on this page — the
  // Meta pixel Contact/Lead events (see trackWhatsAppContact and
  // handleUnlockDiscount) are the conversion signals.

  const buildPayload = useCallback(
    () => ({
      size,
      vehicle_size: size,
      tint_tier: tintTier,
      package_name: selectedPackage?.title,
      estimate_value: todayPrice ?? estimate,
      final_price: todayPrice ?? estimate,
      service_price: todayPrice ?? estimate,
      coverage: "Full Car Tint",
      lead_name: name.trim() || undefined,
      lead_phone: phoneCaptured ? phone.trim() : undefined,
      vehicle_model: vehicle.trim() || undefined,
      bonus_eligible: bonusEligible,
      bonus_label: premiumBonusLabel,
      selected_extras: selectedAddOnLabels.join(", "),
      preferred_install_timing: installTiming,
      preferred_install_timing_label: selectedInstallTimingLabel,
    }),
    [
      bonusEligible,
      estimate,
      name,
      phone,
      phoneCaptured,
      premiumBonusLabel,
      selectedAddOnLabels,
      selectedInstallTimingLabel,
      selectedPackage,
      size,
      vehicle,
      tintTier,
      todayPrice,
      installTiming,
    ],
  );

  const buildProjectedPayload = useCallback(
    ({
      nextSize = size,
      nextTintTier = tintTier,
    }: {
      nextSize?: TintSize | null;
      nextTintTier?: TintTier | null;
    } = {}) => {
      const projectedPackage =
        packageOptions.find((option) => option.tier === nextTintTier) ?? null;
      const projectedEstimate =
        nextSize && nextTintTier ? getTintPrice(nextTintTier, nextSize) : null;

      return {
        ...buildPayload(),
        size: nextSize,
        vehicle_size: nextSize,
        tint_tier: nextTintTier,
        package_name: projectedPackage?.title,
        estimate_value: projectedEstimate,
        final_price: projectedEstimate,
        service_price: projectedEstimate,
      };
    },
    [buildPayload, size, tintTier],
  );

  useEffect(() => {
    updatePageSEO(variantConfig.seoKey, variantConfig.seo);

    trackEvent("lp_view", { calculator_type: variantConfig.calculatorType });
    initTikTokPixel({ pixelIds: TINT_TIKTOK_PIXEL_ID });
    trackTikTokEvent(
      "ViewContent",
      {
        content_name: "Tint Dubai Quote Funnel",
        content_category: "Window Tint",
        currency: "AED",
      },
      { pixelIds: TINT_TIKTOK_PIXEL_ID },
    );
  }, [trackEvent, variantConfig]);

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

  useEffect(() => {
    if (step !== "result") {
      resultStepStartedAtRef.current = null;
      return;
    }

    const startedAt = Date.now();
    resultStepStartedAtRef.current = startedAt;
    trackEvent("guided_result_viewed", {
      ...buildPayload(),
      result_step_started_at: new Date(startedAt).toISOString(),
    });

    return () => {
      const durationMs = Date.now() - startedAt;
      if (durationMs < 750) return;

      trackEvent("result_screen_engagement", {
        ...buildPayload(),
        result_screen_duration_ms: durationMs,
        checkpoint_reason: "result_step_exit",
      });
    };
  }, [step]);

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
      const nowMs = Date.now();
      trackEvent("page_checkpoint", {
        checkpoint_reason: reason,
        elapsed_ms: Math.max(0, nowMs - pageStartedAtRef.current),
        active_section: activeSectionRef.current,
        current_scroll_percent: getScrollPercent(),
        max_scroll_percent: maxScrollPercentRef.current,
      });

      if (step === "result" && resultStepStartedAtRef.current) {
        trackEvent("result_screen_engagement", {
          ...buildPayload(),
          result_screen_duration_ms: Math.max(0, nowMs - resultStepStartedAtRef.current),
          checkpoint_reason: reason,
        });
      }
    };

    const calculatorPanel = flowPanelRef.current;
    calculatorPanel?.setAttribute("data-funnel-section", "calculator");

    const sections = Array.from(
      document.querySelectorAll<HTMLElement>("[data-funnel-section]"),
    );
    const visibleRatios = new Map<Element, number>();

    updateMaxScroll();
    markSectionViewed("calculator");
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
      calculatorPanel?.removeAttribute("data-funnel-section");
    };
  }, [step, trackEvent]);

  const goToStep = (rawNextStep: FlowStep, reason: string) => {
    const nextStep = rawNextStep;
    setStep(nextStep);
    window.setTimeout(() => {
      flowPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
    trackEvent("guided_step_view", {
      step_name: nextStep,
      navigation_reason: reason,
      ...buildPayload(),
    });
  };

  /**
   * Briefly flashes a gold ring around the calculator panel to draw the eye.
   * If the panel is below the fold, it smooth-scrolls into view first.
   * Used by the top marquee and the mobile hero CTA so a press visibly
   * "lands" on something even when the calculator is already on screen.
   */
  const pulseCalculator = useCallback(() => {
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

  const handleTopBarTap = () => {
    if (isComplete) {
      handleWhatsApp("top_offer_bar");
      return;
    }
    if (step !== "size" && step !== "result") {
      goToStep("size", "top_offer_bar");
    }
    pulseCalculator();
  };

  /**
   * Used by every "Get my PPF estimate" CTA in the trust stack below the
   * calculator. Preserves in-progress state (so users on step 2/3 don't get
   * bounced back to step 1), but always scrolls the calculator into view
   * and pulses it so the click visibly "lands". Fires a placement-tagged
   * analytics event so we can see which trust section drives engagement.
   */
  const handleEstimateCta = (placement: string) => {
    if (step === "result") {
      goToStep("size", placement);
    } else {
      pulseCalculator();
    }
    trackEvent("guided_trust_estimate_cta", {
      placement,
      step_name: step,
      ...buildPayload(),
    });
  };

  const selectSize = (nextSize: TintSize) => {
    setSize(nextSize);
    const payload = {
      step_name: "size",
      ...buildProjectedPayload({ nextSize }),
    };
    trackEvent("guided_step_completed", payload);
    trackEvent("calculator_selection_changed", payload);
  };

  const selectPackage = (nextYears: TintTier) => {
    setTintTier(nextYears);
    const payload = {
      step_name: "package",
      ...buildProjectedPayload({ nextTintTier: nextYears }),
    };
    trackEvent("guided_step_completed", payload);
    trackEvent("calculator_selection_changed", payload);
  };

  const revealSetup = () => {
    if (!isComplete) return;
    trackEvent("price_viewed", buildPayload());
    trackEvent("guided_price_revealed", buildPayload());
    goToStep("result", "reveal_setup");
  };

  const toggleAddOn = (addOnId: TintAddOnId) => {
    setSelectedAddOns((current) => {
      const nextSelected = !current[addOnId];
      const next = { ...current, [addOnId]: nextSelected };
      trackEvent("guided_extra_toggled", {
        extra: addOnId,
        selected: nextSelected,
        selected_extras: formatSelectedAddOns(next).join(", "),
      });
      return next;
    });
  };

  const selectInstallTiming = (nextTiming: InstallTiming) => {
    setInstallTiming(nextTiming);
    const timingLabel =
      installTimingOptions.find((option) => option.value === nextTiming)?.label ?? "This week";
    trackEvent("guided_install_timing_selected", {
      ...buildPayload(),
      preferred_install_timing: nextTiming,
      preferred_install_timing_label: timingLabel,
    });
  };

  const whatsAppMessage = useMemo(() => {
    if (!isComplete || !estimate || !selectedPackage || !selectedSize) {
      const lines = [
        "Hi Sean, I want a ceramic window tint quote.",
        vehicle.trim() ? `Car: ${vehicle.trim()}.` : "",
        size || selectedPackage
          ? `Selected so far: ${[size, selectedPackage?.title].filter(Boolean).join(", ")}.`
          : "",
        "Can you confirm the best option and earliest slot?",
      ].filter(Boolean);

      return lines.join(" ");
    }

    const setupParts = [selectedSize.label, selectedPackage.title].filter(Boolean);
    const addOnSummary = selectedAddOnLabels.length
      ? `Add-ons: ${selectedAddOnLabels.join(", ")}.`
      : "";
    const lines = [
      "Hi Sean, I built a ceramic tint setup on the Grand Touch tint page.",
      vehicle.trim() ? `Car: ${vehicle.trim()}.` : "",
      `Setup: ${setupParts.join(", ")}.`,
      todayPrice !== null
        ? `Price: ${formatAED(todayPrice)} (tint ${formatAED(estimate)}${addOnTotal ? ` + add-ons ${formatAED(addOnTotal)}` : ""}, excl. VAT).`
        : `Price: ${formatAED(estimate)} (excl. VAT).`,
      addOnSummary,
      `Preferred install time: ${selectedInstallTimingLabel}.`,
      bonusEligible ? `Bonus: ${premiumBonusLabel}.` : "",
      "Can you confirm final price and availability?",
    ].filter(Boolean);

    return lines.join(" ");
  }, [
    estimate,
    isComplete,
    bonusEligible,
    premiumBonusLabel,
    selectedAddOnLabels,
    selectedInstallTimingLabel,
    addOnTotal,
    todayPrice,
    selectedPackage,
    selectedSize,
    size,
    variantConfig,
    vehicle,
  ]);

  const trackWhatsAppContact = (placement: string) => {
    const isSelectedSetupClick = isComplete && estimate !== null;
    const messageType = isSelectedSetupClick ? "guided_selected_setup" : "guided_general_quote";
    const eventPayload = {
      cta_location: placement,
      message_type: messageType,
      whatsapp_path: isSelectedSetupClick ? "selected_price" : "general",
      ...buildPayload(),
    };

    // Keep V2 WhatsApp behaviour visible in admin/Supabase without pushing the
    // generic event names into Google tag/GTM, where old conversion rules can
    // turn every WhatsApp tap into an extra Google Ads conversion.
    trackEvent("whatsapp_click", eventPayload, { emitToTagManagers: false });
    trackEvent(
      isSelectedSetupClick ? "selected_price_whatsapp_click" : "general_whatsapp_click",
      eventPayload,
      { emitToTagManagers: false },
    );

    const metaPayload = {
      content_name: "Tint Dubai Quote Funnel",
      content_category: "Window Tint",
      button_location: placement,
      value: estimate ?? undefined,
      currency: "AED",
    };
    // Contact = every tap (Events Manager visibility). Lead is reserved for
    // lead_form_submitted so the tint funnel mirrors the proven PPF path.
    trackMetaStandardEvent("Contact", metaPayload);
    trackTikTokEvent(
      "Contact",
      {
        content_name: "Tint Dubai Quote Funnel",
        content_category: "Window Tint",
        button_location: placement,
        value: estimate ?? undefined,
        currency: "AED",
      },
      { pixelIds: TINT_TIKTOK_PIXEL_ID },
    );

    // NO Google Ads conversions on this page — paid social pixels only.
  };

  const handleWhatsApp = (placement: string) => {
    trackWhatsAppContact(placement);
    window.open(buildWhatsAppUrl(whatsAppMessage), "_blank", "noopener,noreferrer");
  };

  // Tasteful count from the anchor down to the discounted price (~1.1s, easeOut).
  const runPriceCountdown = useCallback((from: number, to: number) => {
    if (
      typeof window === "undefined" ||
      typeof requestAnimationFrame === "undefined" ||
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches
    ) {
      setAnimatedPrice(to);
      return;
    }
    const duration = 1100;
    const start = performance.now();
    if (priceRafRef.current) cancelAnimationFrame(priceRafRef.current);
    const tick = (nowTs: number) => {
      const t = Math.min(1, (nowTs - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setAnimatedPrice(Math.round(from + (to - from) * eased));
      if (t < 1) {
        priceRafRef.current = requestAnimationFrame(tick);
      } else {
        setAnimatedPrice(to);
        priceRafRef.current = null;
      }
    };
    priceRafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(
    () => () => {
      if (priceRafRef.current) cancelAnimationFrame(priceRafRef.current);
    },
    [],
  );

  useEffect(() => {
    if (!discountUnlocked || todayPrice === null) return;
    setAnimatedPrice(todayPrice);
  }, [discountUnlocked, todayPrice, selectedAddOns]);

  // The locked-in WhatsApp message — uses the captured name and the DISCOUNTED
  // targetPrice, and flags the 20% online discount. Kept separate from the
  // generic `whatsAppMessage` so the higher-funnel pre-chat path is untouched.
  const buildLockedInWhatsAppMessage = () => {
    const setupParts = [selectedSize?.label, selectedPackage?.title].filter(Boolean);
    const lines = [
      `Hi Sean, it's ${name.trim() || "a customer"} — I unlocked the 20% online discount on the ceramic tint builder.`,
      vehicle.trim() ? `Car: ${vehicle.trim()}.` : "",
      setupParts.length ? `Setup: ${setupParts.join(", ")}.` : "",
      listPrice !== null ? `Was ${formatAED(listPrice)}.` : "",
      todayPrice !== null
        ? `My locked-in price: ${formatAED(todayPrice)} (tint ${formatAED(targetPrice ?? todayPrice)}${addOnTotal ? ` + add-ons ${formatAED(addOnTotal)}` : ""}, 20% online discount applied, excl. VAT).`
        : "",
      selectedAddOnLabels.length ? `Add-ons: ${selectedAddOnLabels.join(", ")}.` : "",
      `Preferred install time: ${selectedInstallTimingLabel}.`,
      "Can you confirm my final price and earliest slot?",
    ].filter(Boolean);
    return lines.join(" ");
  };

  const handleSendLockedInPrice = () => {
    // Analytics/admin only. The form submit already captured the lead, so the
    // post-submit WhatsApp handoff must not fire a Google Ads conversion.
    trackWhatsAppContact("result_unlock_send");
    window.open(buildWhatsAppUrl(buildLockedInWhatsAppMessage()), "_blank", "noopener,noreferrer");
  };

  /**
   * Skippable, two-step pre-chat nudge. When a visitor taps a *direct* WhatsApp
   * entry point BEFORE finishing the calculator, we intercept with one soft step
   * that offers the price-first route. Once a quote is complete we bypass the
   * dialog entirely and go straight to the qualified WhatsApp handoff — a
   * finished, high-intent buyer is never interrupted.
   */
  const requestWhatsApp = (placement: string) => {
    // V3: WhatsApp is always a direct 1-tap (no pre-chat popup) so it converts
    // like the proven V1 funnel. The gated calculator is the rewarded path for
    // people who choose to build their price — it's never a wall in front of
    // WhatsApp. (Other variants keep the soft pre-chat nudge.)
    if (isGated || isPriceVariant || (isComplete && estimate !== null)) {
      handleWhatsApp(placement);
      return;
    }
    setPendingWaPlacement(placement);
    setPreChatOpen(true);
    trackEvent("whatsapp_prechat_shown", { cta_location: placement, ...buildPayload() });
  };

  const handlePreChatToCalculator = () => {
    trackEvent("whatsapp_prechat_to_calculator", {
      cta_location: pendingWaPlacement ?? "unknown",
      ...buildPayload(),
    });
    setPreChatOpen(false);
    if (step !== "size" && step !== "result") {
      goToStep("size", "prechat_to_calculator");
    }
    pulseCalculator();
  };

  const handlePreChatContinue = () => {
    trackEvent("whatsapp_prechat_continued", {
      cta_location: pendingWaPlacement ?? "unknown",
      ...buildPayload(),
    });
    setPreChatOpen(false);
    handleWhatsApp(pendingWaPlacement ?? "prechat_skip");
  };

  /**
   * Hard-gated "unlock 20% off" submit on the result step. Name (>=2 chars) and
   * a valid number are REQUIRED — there is no blank-WhatsApp path here anymore.
   * On success we persist the lead, fire the lead event + Submit-lead conversion
   * (value = targetPrice) + a `discount_unlocked` dataLayer event, and play the
   * gamified price reveal. The WhatsApp handoff is now a deliberate second tap.
   */
  const handleUnlockDiscount = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (
      !isComplete ||
      estimate === null ||
      targetPrice === null ||
      listPrice === null ||
      !size ||
      !selectedPackage
    ) {
      return;
    }
    if (discountUnlocked || unlocking) return;

    if (!isGated && !isPriceVariant && name.trim().length < 2) {
      setFormStatus("error");
      return;
    }
    if (!phoneCaptured) {
      setFormStatus("invalid_phone");
      trackEvent("guided_invalid_phone_blocked", {
        capture_location: "result_discount_unlock",
        ...buildPayload(),
      });
      return;
    }

    setUnlocking(true);
    setFormStatus("saving");

    // Gamified payoff: this is the moment the big price cuts from the full anchor
    // (`listPrice`) down to the discounted `targetPrice`, and the value stack
    // checks off. Count-down respects prefers-reduced-motion (snaps to final).
    setDiscountUnlocked(true);
    setAnimatedPrice(listPrice);
    runPriceCountdown(listPrice, todayPrice ?? targetPrice);

    trackEvent("save_quote_submitted", {
      form_type: "guided_discount_unlock",
      ...buildPayload(),
      has_name: true,
      has_phone: true,
    });

    const result = await captureLeadSnapshot({
      snapshotType: "submit",
      context: funnelContext,
      fullName: name.trim(),
      phone: phone.trim(),
      vehicleModel: vehicle.trim(),
      payload: {
        ...buildPayload(),
        service_name: variantConfig.bonusClaimServiceName,
        service_price: todayPrice ?? targetPrice,
        final_price: todayPrice ?? targetPrice,
        list_price: listPrice,
        discount_savings: discountSavings,
        package_name: selectedPackage.title,
        vehicle_size: size,
        coverage: "Full Car Tint",
        bonus_eligible: bonusEligible,
        selected_extras: selectedAddOnLabels.join(", "),
      },
    });

    if (result.ok) {
      const shouldFireMetaLead = tintLeadQualified && !metaLeadFiredRef.current;
      if (shouldFireMetaLead) metaLeadFiredRef.current = true;

      trackEvent(
        "lead_form_submitted",
        {
          form_type: "guided_discount_unlock",
          ...buildPayload(),
        },
        shouldFireMetaLead
          ? {
              metaStandardEvent: "Lead",
              metaPayload: {
                content_name: "Tint Dubai Quote Funnel",
                content_category: "Window Tint",
                value: todayPrice ?? targetPrice,
                currency: "AED",
              },
            }
          : undefined,
      );
      trackTikTokSubmitForm(
        {
          content_name: "Tint Dubai Quote Funnel",
          content_category: "Window Tint",
          value: todayPrice ?? targetPrice,
          currency: "AED",
        },
        { pixelIds: TINT_TIKTOK_PIXEL_ID },
      );

      // New gamification dataLayer event (value = today's total incl. selected add-ons).
      trackEvent("discount_unlocked", {
        ...buildPayload(),
        value: todayPrice ?? targetPrice,
        currency: "AED",
        list_price: listPrice,
        discount_savings: discountSavings,
      });

      // Submit-lead PRIMARY conversion is sent above on lead_form_submitted,
      // matching the PPF funnel's Meta reporting path.
    }

    if (!result.ok) {
      // LOUD failure signal: a Google Ads "Submit lead form" conversion with no
      // matching CRM lead (2026-07-03) means silent save failures cost real
      // paid leads. Surface every failure in analytics so it can't hide.
      trackEvent(
        "lead_save_failed",
        {
          capture_location: "result_discount_unlock",
          reason: ("reason" in result ? result.reason : null) ?? "unknown",
          ...buildPayload(),
        },
        { emitToTagManagers: false },
      );
    }

    setUnlocking(false);
    setFormStatus(result.ok ? "saved" : "error");

    // PRICE variant, primary intent: never lose the human. Open WhatsApp with
    // the quote pre-filled even if the CRM save failed (the failure is logged
    // above). Analytics-only tap — the counted conversion already fired on a
    // successful save, and a failed save must not fire one.
    if (isPriceVariant && priceCaptureIntentRef.current === "whatsapp") {
      trackWhatsAppContact("result_price_auto_whatsapp");
      window.open(buildWhatsAppUrl(buildLockedInWhatsAppMessage()), "_blank", "noopener,noreferrer");
    }
  };

  /**
   * Mobile sticky CTA only appears once the calculator panel is fully out of
   * view (i.e. the user has scrolled down into the trust stack). This keeps
   * the calculator the focal point while it's on screen and stops the sticky
   * doubling up with the in-card Continue button.
   */
  const [isPanelOffscreen, setIsPanelOffscreen] = useState(false);

  useEffect(() => {
    const el = flowPanelRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        // Panel is "off-screen" when no part of it intersects the viewport
        // AND its bottom edge sits above the top — i.e. user has scrolled past.
        const passed =
          !entry.isIntersecting && entry.boundingClientRect.bottom < 0;
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
    // Pick the next Tue/Thu (Sean's PPF days) at 09:00 Dubai time. Returns
    // a future Date and a short human label.
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
   * JSON-LD structured data — boosts Google Ads Quality Score and SERP
   * visibility (review stars + FAQ accordion in results). Injected once
   * on mount and removed on unmount so we don't pollute other routes.
   */
  useEffect(() => {
    if (typeof document === "undefined") return;
    const blocks: Record<string, unknown>[] = [
      {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        name: "Grand Touch Auto",
        image: "https://www.grandtouchauto.ae/guided-sean-with-patrols.png",
        url: variantConfig.pageUrl,
        telephone: "+971567191045",
        priceRange: "AED 649 – AED 2,799",
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
        // NOTE: AggregateRating intentionally omitted — Google requires a real,
        // verifiable reviewCount and will down-rank or disable the rich result
        // if the count is fabricated. Add back here once a real number is
        // exported from the Google Business Profile (e.g. via the GMB API).
      },
      {
        "@context": "https://schema.org",
        "@type": "Service",
        serviceType: "Ceramic window tint installation",
        provider: {
          "@type": "LocalBusiness",
          name: "Grand Touch Auto",
          telephone: "+971567191045",
        },
        areaServed: { "@type": "City", name: "Dubai" },
        description:
          "STEK-authorised ceramic window tint installation in Dubai — UAE-legal shades, real heat rejection, installed in about 3 hours with a registered warranty.",
        offers: {
          "@type": "AggregateOffer",
          priceCurrency: "AED",
          lowPrice: "649",
          highPrice: "2799",
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
  }, [variantConfig]);

  const handleMobileSticky = () => {
    if (step === "result") {
      handleWhatsApp("mobile_sticky");
      return;
    }

    // Sticky only renders when the calculator is off-screen, so a tap should
    // always bring the user back to the panel (and flash it so the click
    // visibly lands). After scrolling, advance the step if they have enough
    // info; otherwise just leave them on the current step ready to interact.
    pulseCalculator();

    if (step === "size" && size) {
      goToStep("package", "mobile_sticky_continue");
      return;
    }

    if (step === "package" && isComplete) {
      revealSetup();
      return;
    }

    trackEvent("guided_mobile_sticky_prompt", {
      step_name: step,
      ...buildPayload(),
    });
  };

  const flowSteps: FlowStep[] = stepOrder;
  const activeStepIndex = flowSteps.indexOf(step);
  const progress = Math.round(((activeStepIndex + 1) / flowSteps.length) * 100);

  return (
    <div className="min-h-screen bg-[#070707] text-white">
      <button
        type="button"
        onClick={handleTopBarTap}
        aria-hidden={isPanelOffscreen}
        tabIndex={isPanelOffscreen ? -1 : 0}
        aria-label={
          isComplete
            ? "Open your WhatsApp bonus check"
            : "Tap to claim your tint bonuses and start your quote"
        }
        className={cn(
          "group sticky top-0 z-40 flex w-full items-center gap-2 overflow-hidden border-b border-[#f7b52b]/25 bg-[#0b0b0b]/95 px-2.5 py-1.5 text-[11px] backdrop-blur transition-all duration-300 hover:bg-[#0f0f0f]/95 active:bg-[#141414]/95 sm:gap-3 sm:px-4 sm:py-2 sm:text-[13px]",
          // Hide bar once the user has scrolled past the calculator — the
          // sticky desktop CTA + mobile sticky take over from here.
          isPanelOffscreen
            ? "pointer-events-none -translate-y-full opacity-0"
            : "translate-y-0 opacity-100",
        )}
      >
        <Gift
          aria-hidden
          className="h-4 w-4 shrink-0 text-[#f7b52b] animate-guided-sparkle-twinkle motion-reduce:animate-none sm:h-[18px] sm:w-[18px]"
        />

        <div className="relative min-w-0 flex-1 overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-[#0b0b0b] via-[#0b0b0b]/80 to-transparent"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-[#0b0b0b] via-[#0b0b0b]/80 to-transparent"
          />

          <div className="flex w-max animate-guided-marquee items-center group-hover:[animation-play-state:paused] group-focus-visible:[animation-play-state:paused] motion-reduce:animate-none">
            {[...offerTickerItems, ...offerTickerItems].map((offer, index) => {
              const Icon = offer.icon;
              return (
                <span
                  key={`${offer.text}-${index}`}
                  className="flex shrink-0 items-center gap-1.5 px-3 sm:gap-2 sm:px-4"
                >
                  <Icon className="h-3.5 w-3.5 shrink-0 text-[#f7b52b] sm:h-4 sm:w-4" />
                  <span className="whitespace-nowrap font-semibold text-white">
                    {offer.text}
                  </span>
                  <span aria-hidden className="text-[#f7b52b]/40">
                    •
                  </span>
                </span>
              );
            })}
          </div>
        </div>

        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] transition-transform group-hover:scale-[1.04] group-active:scale-[0.97] sm:px-3 sm:py-1.5 sm:text-[11px]",
            isComplete
              ? "bg-[#25D366] text-white shadow-[0_0_18px_rgba(37,211,102,0.45)]"
              : "bg-[#f7b52b] text-black shadow-[0_0_18px_rgba(247,181,43,0.45)]",
          )}
        >
          {isComplete ? "Claim" : "Start"}
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </span>
      </button>

      <main>
        <section className="relative overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_20%_0%,rgba(247,181,43,0.18),transparent_30%),linear-gradient(180deg,#15120b,#070707)] px-3 py-3 sm:px-6 sm:py-5 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <header className="flex items-center justify-between gap-3">
              <a href="/" aria-label="Grand Touch Auto home">
                <img src={logo} alt="Grand Touch Auto" className="h-8 w-auto sm:h-12" />
              </a>
            </header>

            {isMetaVariant ? (
              <div className="mt-2 lg:hidden">
                <div className="rounded-2xl border border-[#f7b52b]/30 bg-[linear-gradient(180deg,rgba(247,181,43,0.12),rgba(8,8,8,0.42))] px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#f7b52b]">
                    {variantConfig.eyebrow}
                  </p>
                  <h1 className="mt-1 text-[1.55rem] font-black leading-[1.02] tracking-tight">
                    Build your ceramic tint price in 60 seconds.
                  </h1>
                  <p className="mt-2 text-xs leading-5 text-slate-300">
                    Tap your car size below, choose your tint package, then unlock the online offer.
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.08em] text-slate-200">
                    <span className="rounded-full border border-white/10 bg-black/35 px-2 py-1">
                      Google 4.9
                    </span>
                    <span className="rounded-full border border-white/10 bg-black/35 px-2 py-1">
                      STEK authorised
                    </span>
                    <span className="rounded-full border border-[#f7b52b]/25 bg-[#f7b52b]/10 px-2 py-1 text-[#f7b52b]">
                      20% online offer
                    </span>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Mobile-only value hero — shows the offer above the calculator so
                users land on a real promise before the funnel asks anything.
                Dual CTA: gold to engage the calculator, green for direct WhatsApp. */}
            <div className={cn("mt-3 lg:hidden", isMetaVariant && "hidden")}>
              <div className="relative overflow-hidden rounded-2xl border border-[#f7b52b]/35 bg-[radial-gradient(circle_at_85%_-10%,rgba(247,181,43,0.28),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(8,8,8,0.55))] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#f7b52b]">
                  {variantConfig.eyebrow}
                </p>
                <h1 className="mt-1.5 text-[1.85rem] font-black leading-[1.04] tracking-tight">
                  {variantConfig.headline}
                  <span className="block text-[#f7b52b]">{variantConfig.headlineAccent}</span>
                </h1>
                <HeroTrustBadges className="mt-3" />

                {/* Compact proof strip — shows real cars from the bay so the
                    eyebrow "Premium PPF" claim cashes immediately. Decorative
                    only, keeps vertical cost to ~70px. */}
                <div className="mt-3 grid grid-cols-3 gap-1.5">
                  {[
                    { src: "/guided-911-gloss.png", alt: "Porsche 911 with gloss PPF" },
                    { src: "/guided-cullinan-ppf.png", alt: "Rolls-Royce Cullinan with PPF" },
                    { src: "/guided-tint-install.png", alt: "Ceramic window tint install in progress" },
                  ].map((img) => (
                    <div
                      key={img.src}
                      className="relative aspect-[4/3] overflow-hidden rounded-xl border border-white/10 bg-black"
                    >
                      <img
                        src={img.src}
                        alt={img.alt}
                        loading="eager"
                        className="h-full w-full object-cover"
                      />
                      <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"
                      />
                    </div>
                  ))}
                </div>

                <p className="mt-3 text-xs leading-5 text-slate-300">
                  {variantConfig.mobileIntro}
                </p>
                {variantConfig.campaignIntro ? (
                  <div className="mt-3 rounded-xl border border-white/10 bg-black/35 px-3 py-2">
                    <p className="text-[11px] leading-5 text-slate-300">
                      {variantConfig.campaignIntro}
                    </p>
                    {variantConfig.campaignTerms?.length ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {variantConfig.campaignTerms.map((term) => (
                          <span
                            key={term}
                            className="rounded-full border border-[#f7b52b]/25 bg-[#f7b52b]/10 px-2 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-[#f7b52b]"
                          >
                            {term}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <div className="mt-3 grid grid-cols-3 gap-1.5">
                  {[
                    { icon: BadgePercent, label: "20% off setup" },
                    { icon: Clock, label: "~3 hour install" },
                    { icon: Sparkles, label: "Free sun-strip" },
                  ].map(({ icon: Icon, label }) => (
                    <div
                      key={label}
                      className="flex flex-col items-center gap-1 rounded-xl border border-white/10 bg-black/40 px-2 py-2 text-center"
                    >
                      <Icon className="h-4 w-4 text-[#f7b52b]" />
                      <p className="text-[10px] font-black leading-tight text-white">{label}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex flex-col gap-2">
                  <Button
                    type="button"
                    onClick={() => {
                      if (step !== "size" && step !== "result") {
                        goToStep("size", "mobile_hero_quote");
                      }
                      pulseCalculator();
                      trackEvent("guided_mobile_hero_cta", {
                        cta: "build_quote",
                        ...buildPayload(),
                      });
                    }}
                    className="h-12 w-full gap-2 bg-[#f7b52b] px-4 text-[15px] font-black tracking-tight text-black shadow-[0_10px_30px_rgba(247,181,43,0.35)] hover:bg-[#ffc94f]"
                  >
                    {variantConfig.primaryCta}
                    <ArrowRight className="h-4 w-4 shrink-0" />
                  </Button>
                  {!hideDirectWa ? (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => requestWhatsApp("mobile_hero")}
                      className="h-10 w-full gap-1.5 border border-[#25D366]/45 bg-transparent px-4 text-[13px] font-bold tracking-tight text-[#25D366] hover:bg-[#25D366]/10 hover:text-[#25D366]"
                    >
                      <MessageCircle className="h-4 w-4 shrink-0" />
                      {variantConfig.secondaryCta}
                    </Button>
                  ) : null}
                </div>

                {/* Live credibility row: Sean online + reply ETA + rotating
                    booking → answers "is anyone actually there?" without a
                    separate widget. Followed by scarcity + tap-to-call. */}
                <div className="mt-3 space-y-2 rounded-xl border border-white/10 bg-black/35 px-3 py-2">
                  <LivePulseStrip className="!gap-x-2.5" compact />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <ScarcityChip />
                    <a
                      href={TEL_HREF}
                      onClick={() =>
                        trackEvent("guided_phone_tap", {
                          placement: "mobile_hero",
                          ...buildPayload(),
                        })
                      }
                      className="inline-flex items-center gap-1.5 rounded-full bg-white/8 px-2.5 py-1 text-[11px] font-black text-white transition-colors hover:bg-white/15"
                    >
                      <Phone className="h-3 w-3 text-[#f7b52b]" />
                      Call Sean
                    </a>
                  </div>
                </div>

                {/* Subtle scroll cue so first-fold mobile users know there's
                    more below the hero without us using a giant arrow. */}
                <div className="mt-3 flex items-center justify-center gap-1 text-[10px] font-black uppercase tracking-[0.3em] text-[#f7b52b]/80 motion-reduce:animate-none">
                  <span className="animate-bounce">↓</span>
                  {isTikTokVariant ? "Tap the cards below" : "Build your quote below"}
                </div>
              </div>
            </div>

            <div
              className={cn(
                "grid gap-4 pb-8 pt-3 lg:grid-cols-[0.88fr_1.12fr] lg:items-start lg:gap-8 lg:pb-12 lg:pt-12",
                isMetaVariant && "pb-6 pt-2 lg:pb-12 lg:pt-12",
              )}
            >
              <div className="hidden lg:block lg:sticky lg:top-20">
                <p className="text-xs font-black uppercase tracking-[0.28em] text-[#f7b52b]">
                  {variantConfig.eyebrow}
                </p>
                <HeroTrustBadges size="md" className="mt-2.5" />
                <h1 className="mt-3 text-[2.85rem] font-black leading-[1.02] tracking-tight xl:text-[3.4rem]">
                  {variantConfig.headline}
                  <span className="block text-[#f7b52b]">{variantConfig.headlineAccent}</span>
                </h1>
                <p className="mt-3 max-w-xl text-base leading-7 text-slate-200">
                  {variantConfig.desktopIntro}
                </p>
                {variantConfig.campaignIntro ? (
                  <div className="mt-4 max-w-xl rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                    <p className="text-sm leading-6 text-slate-300">
                      {variantConfig.campaignIntro}
                    </p>
                    {variantConfig.campaignTerms?.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {variantConfig.campaignTerms.map((term) => (
                          <span
                            key={term}
                            className="rounded-full border border-[#f7b52b]/25 bg-[#f7b52b]/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-[#f7b52b]"
                          >
                            {term}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <div className="mt-4 grid grid-cols-3 gap-2.5">
                  {[
                    {
                      icon: BadgePercent,
                      label: "20% off setup",
                      sub: "Any package",
                    },
                    {
                      icon: Clock,
                      label: "~3 hour install",
                      sub: "DIP 2 studio",
                    },
                    {
                      icon: Sparkles,
                      label: "Free sun-strip",
                      sub: "Every install",
                    },
                  ].map(({ icon: Icon, label, sub }) => (
                    <div
                      key={label}
                      className="rounded-2xl border border-[#f7b52b]/25 bg-gradient-to-b from-[#f7b52b]/[0.08] to-transparent p-3"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#f7b52b]/15 ring-1 ring-[#f7b52b]/30">
                        <Icon className="h-4 w-4 text-[#f7b52b]" />
                      </div>
                      <p className="mt-2 text-sm font-black leading-tight text-white">{label}</p>
                      <p className="mt-0.5 text-[11px] leading-5 text-slate-400">{sub}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:items-center">
                  <Button
                    type="button"
                    size="lg"
                    onClick={() => {
                      if (step !== "size" && step !== "result") {
                        goToStep("size", "desktop_hero_quote");
                      }
                      pulseCalculator();
                      trackEvent("guided_desktop_hero_cta", {
                        cta: "build_quote",
                        ...buildPayload(),
                      });
                    }}
                    className="h-12 flex-1 bg-[#f7b52b] px-6 text-base font-black text-black shadow-[0_12px_34px_rgba(247,181,43,0.35)] hover:bg-[#ffc94f]"
                  >
                    {isTikTokVariant ? "Start my setup" : variantConfig.primaryCta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  {!hideDirectWa ? (
                    <Button
                      type="button"
                      size="lg"
                      variant="ghost"
                      onClick={() => requestWhatsApp("desktop_hero")}
                      className="h-12 gap-2 border border-[#25D366]/45 bg-transparent px-5 text-base font-bold text-[#25D366] hover:bg-[#25D366]/10 hover:text-[#25D366]"
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      {variantConfig.secondaryCta}
                    </Button>
                  ) : null}
                </div>

                {/* Unified credibility card — pulls 'live availability',
                    'scarcity', 'brand promises' and 'tap-to-call' into one
                    block so the hero closes with a single dense panel rather
                    than four loosely-spaced rows. */}
                <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black/40">
                  <div className="px-4 py-3">
                    <LivePulseStrip />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 border-t border-white/10 bg-white/[0.02] px-4 py-2.5">
                    <ScarcityChip />
                    <a
                      href={TEL_HREF}
                      onClick={() =>
                        trackEvent("guided_phone_tap", {
                          placement: "desktop_hero",
                          ...buildPayload(),
                        })
                      }
                      className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-black text-white transition-colors hover:border-[#f7b52b]/40 hover:bg-white/10"
                    >
                      <Phone className="h-3.5 w-3.5 text-[#f7b52b]" />
                      <span className="tabular-nums">{DISPLAY_PHONE}</span>
                    </a>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-white/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    {variantConfig.proofPoints.map((item) => (
                      <span key={item} className="flex items-center gap-1.5">
                        <Check className="h-3 w-3 text-[#f7b52b]" />
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div ref={flowPanelRef} className="min-w-0 scroll-mt-14 rounded-[20px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(13,13,13,0.98))] p-3 shadow-[0_24px_80px_rgba(0,0,0,0.42)] sm:scroll-mt-20 sm:rounded-[28px] sm:p-5">
                <>
                <div className="mb-3 sm:mb-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400 sm:text-xs">
                      Step {activeStepIndex + 1} of {flowSteps.length}
                    </p>
                    <p className="text-[10px] font-semibold text-[#f7b52b] sm:text-xs">{progress}% complete</p>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10 sm:mt-3 sm:h-2">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,#f7b52b,#25D366)] transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {step === "size" ? (
                  <div>
                    <div className="flex items-start justify-between gap-2 sm:items-end">
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#f7b52b] sm:text-xs">
                          1. Your car size
                        </p>
                        <h2 className="mt-1 text-xl font-black sm:mt-2 sm:text-3xl">
                          Choose the closest bracket.
                        </h2>
                      </div>
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#f7b52b]/30 bg-[#f7b52b]/10 px-2 py-1 text-[10px] font-semibold text-[#f7b52b] animate-guided-tap-badge motion-reduce:animate-none sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-xs">
                        <MousePointerClick className="h-3 w-3 opacity-80 sm:h-3.5 sm:w-3.5" />
                        Tap to start
                      </span>
                    </div>

                    {!size ? (
                      <p className="mt-2 text-xs text-slate-400 sm:mt-3 sm:text-sm">
                        Select the closest size to continue.
                      </p>
                    ) : null}

                    <div ref={sizeGridRef} className="relative mt-3 grid grid-cols-2 gap-2 sm:mt-5 sm:gap-3">
                      {sizeOptions.map((option, index) => {
                        const isSelected = size === option.value;
                        const showGlow = !size;
                        const isPointerTarget =
                          sizePointer.atCard && sizePointer.cardIndex === index && !isSelected;

                        return (
                          <button
                            key={option.value}
                            ref={(el) => {
                              sizeCardRefs.current[index] = el;
                            }}
                            type="button"
                            onClick={() => selectSize(option.value)}
                            className={cn(
                              optionButton,
                              "flex h-full flex-col",
                              isSelected
                                ? "border-[#f7b52b] ring-1 ring-[#f7b52b]/40"
                                : "border-white/10",
                              isPointerTarget &&
                                "-translate-y-0.5 border-[#f7b52b]/55 bg-white/[0.06] shadow-[0_18px_38px_rgba(247,181,43,0.18)]",
                            )}
                          >
                            <img
                              src={option.image}
                              alt=""
                              className="h-20 w-full object-cover opacity-80 sm:h-32"
                            />
                            <div className="flex-1 p-2.5 sm:p-4">
                              <p className="text-base font-black sm:text-xl">{option.label}</p>
                              <p className="mt-0.5 text-[11px] leading-snug text-slate-300 sm:mt-1 sm:text-sm">
                                {option.example}
                              </p>
                            </div>
                            {showGlow ? <GuidedCardGlow delay={index * 1.6} /> : null}
                          </button>
                        );
                      })}

                      <GuidedPointerOverlay coord={sizePointer.coord} atCard={sizePointer.atCard} />
                    </div>

                    {size ? (
                      <div
                        className={cn(
                          "mt-3 rounded-2xl border border-[#f7b52b]/35 bg-[#f7b52b]/[0.04] p-2.5 transition-all duration-500 sm:mt-4 sm:p-3",
                          vehicleAttentionFired &&
                            "animate-guided-attention motion-reduce:animate-none",
                        )}
                      >
                        <div className="flex items-baseline justify-between gap-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.16em] text-[#f7b52b] sm:text-xs sm:tracking-[0.18em]">
                            Add your car for an exact match
                          </label>
                          <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400 sm:text-[10px] sm:tracking-[0.14em]">
                            3 seconds
                          </span>
                        </div>
                        <div className="relative mt-2">
                          <Input
                            value={vehicle}
                            onChange={(event) => setVehicle(event.target.value)}
                            onFocus={() => setIsVehicleFocused(true)}
                            onBlur={() => setIsVehicleFocused(false)}
                            placeholder={animatedVehiclePlaceholder}
                            className="h-10 border-[#f7b52b]/30 bg-white/[0.04] text-white placeholder:text-slate-500 focus-visible:ring-[#f7b52b]/40"
                          />
                          {!vehicle && !isVehicleFocused ? (
                            <span
                              aria-hidden
                              className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm font-semibold text-[#f7b52b] animate-guided-caret-blink motion-reduce:animate-none"
                            >
                              |
                            </span>
                          ) : null}
                        </div>
                      </div>
                    ) : null}

                    <Button
                      type="button"
                      size="lg"
                      disabled={!size}
                      onClick={() => goToStep("package", "size_continue")}
                      className="mt-3 h-11 w-full bg-[#f7b52b] font-black text-black hover:bg-[#ffc94f] disabled:bg-white/10 disabled:text-white/45 sm:mt-4 sm:h-12"
                    >
                      Continue to Packages
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                ) : null}

                {step === "package" ? (
                  <div>
                    <button
                      type="button"
                      onClick={() => goToStep("size", "back")}
                      className="mb-2 inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white sm:mb-4 sm:gap-2 sm:text-sm"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Back to size
                    </button>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#f7b52b] sm:text-xs">
                      2. Tint package
                    </p>
                    <h2 className="mt-1 text-xl font-black sm:mt-2 sm:text-3xl">
                      How much heat do you want gone?
                    </h2>
                    <div className="mt-2 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 sm:mt-3 sm:px-3.5 sm:py-3">
                      <img
                        src="/stek-logo.webp"
                        alt="STEK"
                        loading="lazy"
                        className="h-7 w-auto shrink-0 object-contain opacity-95 sm:h-8"
                      />
                      <p className="text-[11px] font-black uppercase leading-snug tracking-[0.08em] text-slate-200 sm:text-xs sm:tracking-[0.1em]">
                        All packages use genuine STEK window tint
                      </p>
                    </div>

                    <div className="mt-3 grid gap-2 sm:mt-5 sm:grid-cols-3 sm:gap-3">
                      {packageOptions.map((option, index) => {
                        const isSelected = tintTier === option.tier;
                        const showGlow = !tintTier;
                        // Price anchor for the CURRENT selected size (step 1
                        // guarantees `size` is set before this step renders).
                        const tierFromPrice = size ? getTintPrice(option.tier, size) : null;

                        return (
                          <button
                            key={option.tier}
                            type="button"
                            onClick={() => selectPackage(option.tier)}
                            className={cn(
                              optionButton,
                              "flex h-full w-full flex-col px-3.5 py-3 text-left sm:items-center sm:px-4 sm:py-6 sm:text-center",
                              isSelected
                                ? "border-[#f7b52b] bg-[#f7b52b]/10 ring-1 ring-[#f7b52b]/40"
                                : "border-white/10",
                            )}
                          >
                            {option.badge ? (
                              <span className="absolute right-2 top-2 rounded-full bg-[#f7b52b] px-2 py-0.5 text-[8px] font-black tracking-[0.12em] text-black shadow-[0_0_22px_rgba(247,181,43,0.45)] sm:right-3 sm:top-3 sm:px-2.5 sm:text-[10px] sm:tracking-[0.14em]">
                                {option.badge}
                              </span>
                            ) : null}
                            {/* Row 1: tier name + series sublabel (badge sits top-right) */}
                            <div className="flex flex-wrap items-baseline gap-x-2 pr-16 sm:flex-col sm:items-center sm:gap-0 sm:pr-0">
                              <span
                                className={cn(
                                  "text-2xl font-black leading-none tracking-tight sm:text-[2.6rem]",
                                  isSelected ? "text-[#f7b52b]" : "text-white",
                                )}
                              >
                                {option.shortName}
                              </span>
                              <span className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400 sm:mt-1 sm:text-[10px] sm:tracking-[0.24em]">
                                {option.title}
                              </span>
                            </div>
                            {/* Row 2: label + price anchor (price = second-most prominent) */}
                            <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 sm:mt-4 sm:flex-col sm:items-center sm:gap-0">
                              <p className="text-xs font-black uppercase tracking-[0.08em] leading-tight text-slate-200 sm:text-base sm:normal-case sm:tracking-normal sm:text-white">
                                {option.label}
                              </p>
                              {tierFromPrice !== null ? (
                                <p
                                  className={cn(
                                    "text-lg font-black tabular-nums leading-tight sm:mt-1 sm:text-base",
                                    isSelected ? "text-[#f7b52b]" : "text-white",
                                  )}
                                >
                                  From {formatAED(tierFromPrice)}
                                </p>
                              ) : null}
                            </div>
                            {/* Row 3: specs — compact one-liner on mobile, checklist on sm+ */}
                            <p className="mt-1.5 text-[11px] font-semibold leading-snug text-slate-300 sm:hidden">
                              {option.specs.join(" · ")}
                            </p>
                            <ul className="mt-1.5 hidden space-y-0.5 sm:block">
                              {option.specs.map((spec) => (
                                <li
                                  key={spec}
                                  className="flex items-center gap-1 text-[11px] font-semibold leading-tight text-slate-300 sm:justify-center"
                                >
                                  <Check className="h-3 w-3 shrink-0 text-[#f7b52b]/80" />
                                  {spec}
                                </li>
                              ))}
                            </ul>
                            {/* Row 4: positioning copy */}
                            <p className="mt-1 text-[10px] leading-snug text-slate-400 sm:mt-1.5 sm:text-[11px] sm:leading-4">
                              {option.value}
                            </p>
                            {showGlow ? <GuidedCardGlow delay={index * 1.6} /> : null}
                          </button>
                        );
                      })}
                    </div>

                    <Button
                      type="button"
                      size="lg"
                      disabled={!isComplete}
                      onClick={revealSetup}
                      className="mt-3 h-11 w-full animate-pulse bg-[#25D366] font-black text-white shadow-[0_18px_48px_rgba(37,211,102,0.32)] hover:bg-[#20bf5d] disabled:animate-none disabled:bg-white/10 disabled:text-white/45 sm:mt-4 sm:h-12"
                    >
                      Reveal My Setup
                      <Sparkles className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                ) : null}

                {step === "result" ? (
                  <div>
                    <button
                      type="button"
                      onClick={() => goToStep("package", "back")}
                      className="mb-2 inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white sm:mb-4 sm:gap-2 sm:text-sm"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Edit setup
                    </button>

                    {/* Combined offer + unlock card — the DISCOUNT is the hero,
                        and the name/number fields are glued directly to it. */}
                    <div
                      className={cn(
                        "relative overflow-hidden rounded-2xl border-2 p-3.5 transition-colors duration-500 sm:rounded-[24px] sm:p-4",
                        discountUnlocked
                          ? "border-[#25D366]/55 bg-[radial-gradient(circle_at_top_left,rgba(37,211,102,0.18),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(8,8,8,0.96))] shadow-[0_0_36px_rgba(37,211,102,0.16)]"
                          : "border-[#f7b52b]/60 bg-[radial-gradient(circle_at_top_left,rgba(247,181,43,0.22),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(8,8,8,0.96))] shadow-[0_0_36px_rgba(247,181,43,0.16)]",
                      )}
                    >
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {selectedSize && selectedPackage ? (
                          <span className="rounded-full border border-white/10 bg-black/30 px-2.5 py-0.5 text-[10px] font-bold sm:px-3 sm:py-1 sm:text-xs">
                            {selectedSize.label} · {selectedPackage.title}
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-white/10 bg-black/25 px-2.5 py-1.5">
                        {[
                          { icon: Sun, label: "Heat rejection" },
                          { icon: ShieldCheck, label: "UV protection" },
                          { icon: Clock, label: "3-hour install" },
                        ].map(({ icon: Icon, label }) => (
                          <div
                            key={label}
                            className="flex min-w-0 flex-1 items-center justify-center gap-1.5 text-center"
                          >
                            <Icon className="h-3.5 w-3.5 shrink-0 text-[#f7b52b]" />
                            <p className="text-[9px] font-black leading-tight text-slate-300 sm:text-[10px]">
                              {label}
                            </p>
                          </div>
                        ))}
                      </div>

                      {targetPrice !== null && todayPrice !== null ? (
                        <div
                          className={cn(
                            "mt-3 rounded-xl border p-3 transition-colors duration-500 sm:p-3.5",
                            discountUnlocked
                              ? "border-[#25D366]/35 bg-[#25D366]/[0.06]"
                              : "border-white/10 bg-black/30",
                          )}
                        >
                          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/55">
                            Price summary
                          </p>
                          <div className="mt-2 space-y-1.5">
                            <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
                              <span className="font-semibold text-slate-300">
                                Base {selectedSize?.label} · {selectedPackage?.title}
                              </span>
                              <span className="font-black tabular-nums text-white">
                                {formatAED(targetPrice)}
                              </span>
                            </div>
                            {TINT_ADD_ONS.filter((addon) => selectedAddOns[addon.id]).map((addon) => (
                              <div
                                key={addon.id}
                                className="flex items-center justify-between gap-2 text-xs sm:text-sm"
                              >
                                <span className="font-semibold text-slate-400">{addon.label}</span>
                                <span className="font-black tabular-nums text-[#f7b52b]">
                                  +{formatAED(addon.price)}
                                </span>
                              </div>
                            ))}
                            {listPrice !== null && discountSavings !== null ? (
                              <>
                                <div className="flex items-center justify-between gap-2 border-t border-white/10 pt-2 text-[11px]">
                                  <span className="font-semibold text-slate-500">Regular tint price</span>
                                  <span className="font-bold tabular-nums text-white/40 line-through">
                                    {formatAED(listPrice)}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between gap-2 text-[11px]">
                                  <span className="font-semibold text-[#25D366]">20% online discount</span>
                                  <span className="font-black tabular-nums text-[#25D366]">
                                    −{formatAED(discountSavings)}
                                  </span>
                                </div>
                              </>
                            ) : null}
                          </div>
                          <div className="mt-3 border-t border-white/10 pt-3">
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50 sm:text-[10px]">
                              Your price today
                            </p>
                            <p
                              className={cn(
                                "mt-0.5 text-[2.4rem] font-black leading-none tracking-tight transition-colors duration-500 sm:text-[3.2rem]",
                                discountUnlocked ? "text-[#25D366]" : "text-white",
                              )}
                            >
                              {formatAED(
                                discountUnlocked && animatedPrice !== null ? animatedPrice : todayPrice,
                              )}
                            </p>
                            <p className="mt-2 text-[11px] leading-relaxed text-slate-300 sm:text-xs">
                              {priceIncludesLine}
                            </p>
                            <p className="mt-1.5 text-[10px] font-semibold leading-relaxed text-slate-500">
                              Tint-only from {formatAED(targetPrice)} · add-ons optional · excludes VAT
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-4 text-2xl font-black leading-none tracking-tight text-white">
                          Setup ready
                        </p>
                      )}

                      {/* VALUE STACK — V2 always; V3 reveals the itemized extras on unlock */}
                      <div className="mt-2.5">
                        <div className="flex items-end justify-between gap-2">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#f7b52b]">
                              Optional add-ons
                            </p>
                            <p className="mt-0.5 text-[10px] font-semibold leading-tight text-slate-500">
                              Not included in base price
                            </p>
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-[0.08em] text-white/45">
                            tap to add
                          </span>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          {TINT_ADD_ONS.map((addon) => {
                            const selected = selectedAddOns[addon.id];
                            const AddOnIcon = addon.icon;
                            const compactLabel =
                              addon.id === "windshield" ? "Front windshield" : "Panoramic roof";
                            const compactDescription =
                              addon.id === "windshield" ? "Clear heat film" : "Glass roof tint";
                            return (
                              <button
                                key={addon.id}
                                type="button"
                                onClick={() => toggleAddOn(addon.id)}
                                className={cn(
                                  "flex min-h-[66px] w-full items-center gap-2 rounded-xl border p-2 text-left transition",
                                  selected
                                    ? "border-[#f7b52b] bg-[#f7b52b]/10"
                                    : "border-white/10 bg-black/25 hover:border-[#f7b52b]/40",
                                )}
                              >
                                <span
                                  className={cn(
                                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border bg-white/5",
                                    selected
                                      ? "border-[#f7b52b] text-[#f7b52b]"
                                      : "border-white/10 text-[#f7b52b]",
                                  )}
                                >
                                  {selected ? (
                                    <Check className="h-3.5 w-3.5" />
                                  ) : (
                                    <AddOnIcon className="h-3.5 w-3.5" />
                                  )}
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block text-[11px] font-black leading-tight text-white">
                                    {compactLabel}
                                  </span>
                                  <span className="mt-0.5 block text-[10px] font-semibold leading-tight text-slate-500">
                                    {compactDescription}
                                  </span>
                                  <span
                                    className={cn(
                                      "mt-1 block text-[10px] font-black uppercase tracking-[0.06em]",
                                      selected ? "text-[#f7b52b]" : "text-white/65",
                                    )}
                                  >
                                    {selected ? "Added" : `+${formatAED(addon.price)}`}
                                  </span>
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {(!isGated || discountUnlocked) ? (
                      <div
                        className={cn(
                          "mt-3 rounded-xl border p-2.5 transition-colors duration-500 sm:mt-3.5 sm:p-3",
                          discountUnlocked
                            ? "border-[#25D366]/30 bg-[#25D366]/[0.06]"
                            : "border-white/10 bg-black/25",
                        )}
                      >
                        <p
                          className={cn(
                            "text-[9px] font-black uppercase tracking-[0.16em] transition-colors duration-500 sm:text-[10px]",
                            discountUnlocked ? "text-[#25D366]" : "text-[#f7b52b]",
                          )}
                        >
                          {discountUnlocked
                            ? "Free inclusions — locked in"
                            : "Free inclusions with your setup"}
                        </p>
                        <ul className="mt-1.5 space-y-0.5">
                          {valueStackItems.map((item, index) => (
                            <li
                              key={item.title}
                              className={cn(
                                "flex items-center justify-between gap-2",
                                discountUnlocked &&
                                  "animate-guided-reveal-row motion-reduce:animate-none",
                              )}
                              style={
                                discountUnlocked
                                  ? { animationDelay: `${index * 0.07}s`, animationFillMode: "both" }
                                  : undefined
                              }
                            >
                              <span className="flex min-w-0 items-center gap-1.5">
                                <Check
                                  className={cn(
                                    "h-3.5 w-3.5 shrink-0 transition-colors duration-500",
                                    discountUnlocked ? "text-[#25D366]" : "text-[#f7b52b]/70",
                                  )}
                                />
                                <span className="truncate text-[11px] font-semibold leading-tight text-slate-200 sm:text-xs">
                                  {item.title}
                                </span>
                              </span>
                              <span className="flex shrink-0 items-center gap-1.5">
                                <span className="text-[10px] font-bold text-white/35 line-through sm:text-[11px]">
                                  {formatAED(item.value)}
                                </span>
                                <span className="rounded-full bg-[#25D366]/15 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.1em] text-[#25D366] sm:text-[9px]">
                                  Free
                                </span>
                              </span>
                            </li>
                          ))}
                        </ul>
                        <div className="mt-2 flex items-center justify-between gap-2 border-t border-white/10 pt-2">
                          <span className="text-[10px] font-black uppercase tracking-[0.1em] text-white/55 sm:text-[11px]">
                            ≈{formatAED(valueStackTotal)} of extras
                          </span>
                          <span className="text-[10px] font-black uppercase tracking-[0.1em] text-[#25D366] sm:text-[11px]">
                            included free
                          </span>
                        </div>
                      </div>
                      ) : null}

                      {/* Lock cue + animated arrow pointing into the fields below */}
                      {discountUnlocked ? (
                        <div className="mt-3 flex items-center gap-2 border-t border-[#25D366]/25 pt-3 sm:mt-3.5">
                          <BadgeCheck className="h-5 w-5 shrink-0 text-[#25D366] animate-guided-reveal-check motion-reduce:animate-none" />
                          <p className="text-sm font-black leading-tight text-white sm:text-base">
                            Your <span className="text-[#25D366]">20% is locked in</span>
                            {firstName ? `, ${firstName}.` : "."}
                          </p>
                        </div>
                      ) : (
                        <div className="mt-4 sm:mt-5">
                          <div className="rounded-xl bg-[#f7b52b] px-3 py-2.5 shadow-[0_12px_34px_rgba(247,181,43,0.32)] animate-guided-cue-pulse motion-reduce:animate-none sm:px-4 sm:py-3">
                            <p className="flex items-center justify-center gap-1.5 text-center text-[13px] font-black leading-tight text-black sm:text-[15px]">
                              <Lock className="h-4 w-4 shrink-0" />
                              {isGated
                                ? `Enter your number to lock this price — ${todayPrice !== null ? formatAED(todayPrice) : targetPrice !== null ? formatAED(targetPrice) : "20% off"}`
                                : isPriceVariant
                                  ? `WhatsApp yourself this exact quote — ${todayPrice !== null ? formatAED(todayPrice) : targetPrice !== null ? formatAED(targetPrice) : "your price"}`
                                  : `Enter your details below to reserve ${todayPrice !== null ? formatAED(todayPrice) : targetPrice !== null ? formatAED(targetPrice) : "this price"}`}
                            </p>
                            <p className="mt-0.5 text-center text-[10px] font-bold uppercase tracking-[0.08em] text-black/65 sm:text-[11px]">
                              {isGated
                                ? "Last step · no payment now · 10 seconds"
                                : "10 seconds · no payment now · price held for you"}
                            </p>
                          </div>
                          <ChevronDown className="mx-auto mt-1 h-5 w-5 text-[#f7b52b] animate-bounce motion-reduce:animate-none" />
                        </div>
                      )}

                      {/* Fields + button (pre) OR green Send button (post) */}
                      {discountUnlocked ? (
                        <div className="mt-3 animate-fade-up motion-reduce:animate-none">
                          <Button
                            type="button"
                            size="lg"
                            onClick={handleSendLockedInPrice}
                            className="h-12 w-full bg-[#25D366] font-black text-white shadow-[0_18px_48px_rgba(37,211,102,0.32)] hover:bg-[#20bf5d]"
                          >
                            <MessageCircle className="mr-2 h-4 w-4" />
                            {isPriceVariant ? "Open WhatsApp with my quote" : "Send my locked-in price to Sean"}
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                          <p className="mt-2 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 sm:text-[11px]">
                            Valid today · Sean confirms your final price on WhatsApp
                          </p>
                        </div>
                      ) : (
                        <>
                        <form onSubmit={handleUnlockDiscount} className="mt-3">
                          <div className={cn("grid gap-2 sm:gap-2.5", !isPriceVariant && "sm:grid-cols-2")}>
                            {!isPriceVariant ? (
                            <Input
                              value={name}
                              onChange={(event) => {
                                setName(event.target.value);
                                if (formStatus === "error" || formStatus === "invalid_phone") {
                                  setFormStatus("idle");
                                }
                              }}
                              placeholder="Your name"
                              aria-label="Your name"
                              className="h-11 border-white/20 bg-white/[0.05] text-white placeholder:text-slate-500 focus-visible:border-[#f7b52b]/70 focus-visible:ring-[#f7b52b]/30"
                            />
                            ) : null}
                            <PhoneInputWithCountry
                              value={phone}
                              onChange={(value) => {
                                setPhone(value);
                                if (formStatus === "invalid_phone" || formStatus === "error") {
                                  setFormStatus("idle");
                                }
                              }}
                              onFocus={() => setIsPhoneFocused(true)}
                              onBlur={() => setIsPhoneFocused(false)}
                              placeholder={animatedPhonePlaceholder}
                              className="border-white/20 bg-white/[0.05]"
                              ariaLabel="Your WhatsApp number"
                            />
                          </div>

                          <div className="mt-2.5 rounded-xl border border-white/10 bg-black/25 p-2.5">
                            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/55">
                              When would you like to install?
                            </p>
                            <div className="mt-2 grid grid-cols-2 gap-1.5">
                              {installTimingOptions.map((option) => {
                                const selected = installTiming === option.value;
                                return (
                                  <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => selectInstallTiming(option.value)}
                                    className={cn(
                                      "min-h-10 rounded-lg border px-2 py-2 text-center text-[11px] font-black leading-tight transition sm:text-xs",
                                      selected
                                        ? "border-[#f7b52b] bg-[#f7b52b] text-black shadow-[0_10px_24px_rgba(247,181,43,0.22)]"
                                        : "border-white/10 bg-white/[0.04] text-slate-300 hover:border-[#f7b52b]/45 hover:text-white",
                                    )}
                                    aria-pressed={selected}
                                  >
                                    {option.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <Button
                            type="submit"
                            size="lg"
                            disabled={!canUnlock || unlocking}
                            onClick={() => {
                              priceCaptureIntentRef.current = "whatsapp";
                            }}
                            className={cn(
                              "mt-2.5 h-12 w-full font-black shadow-[0_18px_48px_rgba(247,181,43,0.32)]",
                              isPriceVariant
                                ? "bg-[#25D366] text-white hover:bg-[#20bf5d] shadow-[0_18px_48px_rgba(37,211,102,0.32)]"
                                : "bg-[#f7b52b] text-black hover:bg-[#ffc94f]",
                              "disabled:bg-white/10 disabled:text-white/45 disabled:shadow-none",
                              canUnlock && !unlocking
                                ? "animate-guided-free-pulse motion-reduce:animate-none"
                                : "",
                            )}
                          >
                            {unlocking ? (
                              "Saving..."
                            ) : isPriceVariant ? (
                              <>
                                <MessageCircle className="mr-2 h-4 w-4" />
                                WhatsApp me this exact quote
                                <ArrowRight className="ml-2 h-4 w-4" />
                              </>
                            ) : (
                              <>
                                <Lock className="mr-2 h-4 w-4" />
                                {reserveButtonText}
                                <Sparkles className="ml-2 h-4 w-4" />
                              </>
                            )}
                          </Button>
                          {isPriceVariant ? (
                            <button
                              type="submit"
                              disabled={!canUnlock || unlocking}
                              onClick={() => {
                                priceCaptureIntentRef.current = "lock";
                              }}
                              className="mt-2.5 w-full text-center text-[11px] font-semibold text-slate-400 underline-offset-4 hover:text-slate-200 hover:underline disabled:opacity-40 sm:text-xs"
                            >
                              Just lock this price for 14 days — no WhatsApp yet
                            </button>
                          ) : null}
                          {formStatus === "error" && !isPriceVariant && name.trim().length < 2 ? (
                            <p className="mt-2 text-xs text-red-300 sm:text-sm">
                              Please add your name to lock in your price.
                            </p>
                          ) : null}
                          {formStatus === "invalid_phone" ? (
                            <p className="mt-2 text-xs text-red-300 sm:text-sm">
                              Please enter a valid WhatsApp number to lock in your price.
                            </p>
                          ) : null}
                          {formStatus === "error" && isPriceVariant ? (
                            <p className="mt-2 text-xs text-amber-300 sm:text-sm">
                              We couldn't save your quote just now — your WhatsApp message has all the
                              details, or tap again to retry.
                            </p>
                          ) : null}
                          {formStatus === "error" && !isPriceVariant && name.trim().length >= 2 ? (
                            <p className="mt-2 text-xs text-amber-300 sm:text-sm">
                              Your 20% is locked in — we'll save it when you message Sean.
                            </p>
                          ) : null}
                        </form>
                        {isGated && !isMetaVariant ? (
                          /* Gate-bypass escape: v3 (Google) only. Meta runs
                             lead-form style — no way around the form. */
                          <button
                            type="button"
                            onClick={() => requestWhatsApp("result_v3_no_discount")}
                            className="mt-2.5 w-full text-center text-[11px] font-semibold text-slate-400 underline-offset-4 hover:text-slate-200 hover:underline sm:text-xs"
                          >
                            Prefer to just ask Sean? Chat on WhatsApp (without the discount)
                          </button>
                        ) : null}
                        </>
                      )}
                    </div>

                  </div>
                ) : null}
                </>
              </div>
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
                    Get your exact tint setup priced
                    <span className="block text-[#f7b52b]">in under 60 seconds.</span>
                  </h2>
                </div>
                <TrustSectionCta
                  placement="trust_cta_post_handovers"
                  onEstimate={handleEstimateCta}
                  onWhatsApp={hideDirectWa ? undefined : requestWhatsApp}
                  microcopy={`Bonuses worth ${formatAED(valueStackTotal)}+ · No upsell`}
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
                Most tint shops bounce you between a sales WhatsApp, a coordinator, and a
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
                        "Glass decontamination, dust control, and QC before any film goes on. If prep isn't right, the install doesn't start.",
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
                Where cheap tint jobs go wrong
              </p>
              <h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">
                The risk is the install
                <span className="block text-[#f7b52b]">— not the film.</span>
              </h2>
              <p className="mt-3 text-base leading-7 text-slate-300 sm:text-lg">
                Almost every tint complaint you've seen in Dubai owner groups traces back to one
                of these four mistakes. Each one is preventable with discipline at the right
                stage.
              </p>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {[
                {
                  image: "/guided-install-detail.png",
                  alt: "Technician hand-finishing film edge during install",
                  problem: "Dust & bubbles sealed under the film",
                  fix: "Glass is decontaminated and the bay kept clean before any film goes on. Dust trapped today is a bubble you stare at for years.",
                },
                {
                  image: "/guided-rolls-install.png",
                  alt: "Installer cutting film away from the vehicle",
                  problem: "Blade-cut on the glass",
                  fix: "Film is precision-cut off the car before install. Freehand blade work on the glass is how rubber seals and defroster lines get scored.",
                },
                {
                  image: "/guided-911-stek-roll.png",
                  alt: "Genuine STEK film roll next to a Porsche 911",
                  problem: "Cheap dyed film that turns purple",
                  fix: "We only install genuine STEK ceramic film and register it. Dyed bargain film fades purple and bubbles within a couple of Dubai summers.",
                },
                {
                  image: "/guided-cullinan-ppf.png",
                  alt: "Rolls-Royce Cullinan after installation at Grand Touch",
                  problem: "No QC, no follow-up",
                  fix: "Final inspection + recheck on edges, dot-matrix zones, and the rear screen. Most shops disappear at handover.",
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
                  title: "Glass decon & prep",
                  body: "Old film removed properly, glass decontaminated and dust-controlled before any film is opened.",
                },
                {
                  icon: Eye,
                  title: "Precision-cut install",
                  body: "STEK film measured and cut off the car, then fitted window-by-window — edges, dot-matrix zones and the rear screen done properly.",
                },
                {
                  icon: Wrench,
                  title: "Full QC + finish",
                  body: "Every window inspected for dust, edge gaps and clarity, then a full glass clean for handover — about 3 hours in total.",
                },
                {
                  icon: Award,
                  title: "Cure check + warranty",
                  body: "Cure-window guidance, then your STEK warranty registered so fade, bubbling and peeling are covered on paper.",
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
                <span className="block text-[#f7b52b]">before booking tint.</span>
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
              primaryLabel="Get my tint estimate now"
            />
          </div>
        </section>

        {/* 5b. Studio location — DIP 2 workshop + map so buyers know where
            the install happens and which areas customers typically drive from. */}
        <section
          data-funnel-section="trust_service_area"
          className="border-t border-white/10 bg-[#070707] px-3 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20"
        >
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-6 lg:grid-cols-[1.05fr_1.4fr] lg:items-start lg:gap-10">
              <div>
                <p className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-[#f7b52b] sm:text-[11px]">
                  <MapPin className="h-3.5 w-3.5" />
                  Studio location · DIP 2
                </p>
                <h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">
                  Installed at our
                  <span className="block text-[#f7b52b]">DIP 2 workshop.</span>
                </h2>
                <p className="mt-3 text-base leading-7 text-slate-300 sm:text-lg">
                  We're based in Dubai Investment Park 2. Drop the car off, wait in the
                  lounge if you like, and collect it in about 3 hours — showroom-clean,
                  with a full briefing from Sean's team.
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
                  primaryLabel="Book my install slot"
                  microcopy="DIP 2 studio · ~3 hour turnaround"
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
              Build your exact setup in 60 seconds, see the starting price, and Sean WhatsApps
              within ~12 minutes to confirm your bonus eligibility — <span className="font-bold text-white">no
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
                Get my tint estimate
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
              Get my tint estimate
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

      {step !== "result" ? (
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
            className="h-11 w-full gap-2 bg-[#f7b52b] text-sm font-black text-black shadow-[0_-6px_24px_rgba(247,181,43,0.25)] hover:bg-[#ffc94f]"
            onClick={handleMobileSticky}
            tabIndex={isPanelOffscreen ? 0 : -1}
          >
            {step === "size" && !size
              ? "Pick a car size to start"
              : step === "size"
                ? "Continue to Packages"
                : step === "package" && !tintTier
                  ? "Pick a tint package"
                  : "Reveal My Setup"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      ) : null}

      {/* Skippable two-step pre-chat nudge for direct (pre-quote) WhatsApp taps.
          Guides toward the price-first route without blocking the channel; a
          completed quote bypasses this entirely (see requestWhatsApp). */}
      <Dialog open={preChatOpen} onOpenChange={setPreChatOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-[#f7b52b]/25 bg-[#0c0c0c] text-white sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[1.55rem] font-black leading-tight">
              See your price + unlock 20% off first?
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-400">
              Build your setup in ~60 seconds to reveal your exact price and lock
              the discount — or message Sean now and he'll ask for the details.
            </DialogDescription>
          </DialogHeader>

          <ul className="mt-1 flex flex-col gap-2.5 text-sm text-slate-300">
            <li className="flex items-start gap-2.5">
              <Zap className="mt-0.5 h-4 w-4 shrink-0 text-[#f7b52b]" />
              <span>See your exact ceramic tint price in about 60 seconds</span>
            </li>
            <li className="flex items-start gap-2.5">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#f7b52b]" />
              <span>Unlock 20% off + free sun-strip visor, locked to your setup</span>
            </li>
            <li className="flex items-start gap-2.5">
              <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#f7b52b]" />
              <span>Or message Sean now — he'll still need your car, size &amp; package</span>
            </li>
          </ul>

          <div className="mt-4 grid gap-2">
            <Button
              type="button"
              onClick={handlePreChatToCalculator}
              className="h-14 w-full gap-2 rounded-xl bg-[#f7b52b] text-base font-black text-black shadow-lg shadow-[#f7b52b]/20 hover:bg-[#ffc94f]"
            >
              Build my price first
              <ArrowRight className="h-5 w-5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={handlePreChatContinue}
              className="h-14 w-full gap-2 rounded-xl border border-[#25D366]/45 bg-transparent text-base font-black text-[#25D366] hover:bg-[#25D366]/10 hover:text-[#25D366]"
            >
              Message Sean now
              <MessageCircle className="h-5 w-5" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default TintDubaiQuoteFunnel;
