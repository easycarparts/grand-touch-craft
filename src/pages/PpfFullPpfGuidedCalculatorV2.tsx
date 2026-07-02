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
  Eye,
  Gift,
  Handshake,
  Lock,
  MapPin,
  MessageCircle,
  MousePointerClick,
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
import {
  getPpfPriceRange,
  stekSeriesName,
  type PpfPricingFinish,
  type PpfPricingSize,
} from "@/data/ppf-calculator-pricing";
import logo from "@/assets/logo.svg";

type PackageYears = 5 | 10 | 12;
type FlowStep = "size" | "finish" | "package" | "result";
type GuidedCalculatorVariant = "google" | "tiktok" | "meta" | "dubai_quote" | "v3";

type GuidedCalculatorVariantConfig = {
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
  phoneCaptureServiceName: string;
  bonusClaimServiceName: string;
};

type PpfFullPpfGuidedCalculatorProps = {
  variant?: GuidedCalculatorVariant;
};

const WHATSAPP_NUMBER = "971567191045";
const DISPLAY_PHONE = "+971 56 719 1045";
const TEL_HREF = "tel:+971567191045";
// Counted Google Ads conversions. To keep conversion VOLUME stable when this
// funnel takes over the proven May campaign URL, WhatsApp taps and the unlock
// form both count — but only ONE counted conversion fires per user/session
// (whichever happens first), so a single visitor never double-counts.
const GOOGLE_ADS_WHATSAPP_CONTACT_SEND_TO = "AW-17684563059/KqOWCJfDoLAcEPOI1PBB";
const GOOGLE_ADS_SUBMIT_LEAD_SEND_TO = "AW-17684563059/5R6tCPbqo5kcEPOI1PBB";
// Non-counted (observe-only) action, kept firing purely for the admin dashboard.
const GOOGLE_ADS_PRE_FORM_WHATSAPP_SEND_TO = "AW-17684563059/q_bgCOXs1L8cEPOI1PBB";

const guidedVariantConfig: Record<GuidedCalculatorVariant, GuidedCalculatorVariantConfig> = {
  google: {
    seoKey: "ppf-full-ppf-calculator-guided",
    funnelName: "ppf_full_ppf_guided_calculator",
    landingPageVariant: "google_full_ppf_guided_calculator_v2",
    defaultSourcePlatform: "google",
    calculatorType: "guided_full_ppf",
    pageUrl: "https://www.grandtouchauto.ae/ppf-full-ppf-calculator-guided-v2",
    seo: {
      title: "PPF Dubai Price Calculator | Full Car Paint Protection Film",
      description:
        "Use the Grand Touch PPF Dubai calculator to estimate full car paint protection film pricing, full body PPF options, STEK film, and your 20% online discount.",
      keywords:
        "ppf dubai, paint protection film dubai, ppf price dubai, ppf cost dubai, full body ppf dubai, full car ppf dubai, full car PPF price Dubai, car ppf dubai, car paint protection film dubai, premium PPF Dubai, STEK PPF Dubai, PPF installation Dubai, PPF installer Dubai",
      ogTitle: "PPF Dubai Price Calculator",
      ogDescription:
        "Build your full PPF setup, unlock the 20% online discount, and ask Sean to confirm your paint protection film install in Dubai.",
    },
    eyebrow: "Premium PPF - Dubai",
    headline: "Full Car PPF Price",
    headlineAccent: "in Dubai.",
    mobileIntro:
      "Build your setup, see the starting PPF Dubai price, then claim 20% off, free pickup, or window tint with Sean on WhatsApp.",
    desktopIntro:
      "Use this PPF Dubai calculator to estimate full car paint protection film pricing for your car, SUV, or sports car, then lock in 20% off, free pickup, or window tint with Sean on WhatsApp.",
    campaignIntro:
      "Built for Dubai drivers comparing paint protection film, full body PPF, STEK PPF, and full car PPF installation costs.",
    campaignTerms: ["PPF Dubai", "Paint protection film", "PPF price", "Full body PPF"],
    primaryCta: "See my price (60s)",
    secondaryCta: "WhatsApp Sean",
    proofPoints: ["60-second quote", "No commitment", "Sean reviews each setup"],
    messageIntro: "Hi Sean, I built a guided full PPF setup on the Grand Touch page.",
    phoneCaptureServiceName: "Guided Full PPF - Phone Captured At Warranty Step",
    bonusClaimServiceName: "Guided Full PPF Bonus Claim",
  },
  // Replaces the legacy /ppf-dubai-quote page with the V2 funnel while keeping
  // that page's identity: same funnel name (ppf_dubai_quote), same Google
  // conversions, and the ppf-dubai-quote canonical so SEO + dashboard carry over.
  dubai_quote: {
    seoKey: "ppf-dubai-quote",
    funnelName: "ppf_dubai_quote",
    landingPageVariant: "google",
    defaultSourcePlatform: "google",
    calculatorType: "guided_full_ppf",
    pageUrl: "https://www.grandtouchauto.ae/ppf-dubai-quote",
    seo: {
      title: "PPF Dubai Quote | Grand Touch",
      description:
        "Build your full PPF setup, see your Dubai paint protection film price, then claim 20% off, free pickup, or window tint direct with Sean on WhatsApp.",
      keywords:
        "PPF Dubai quote, ppf dubai, paint protection film dubai, ppf price dubai, full body ppf dubai, full car ppf dubai, STEK PPF Dubai, premium PPF Dubai",
      ogTitle: "PPF Dubai Quote",
      ogDescription:
        "Premium full PPF quote for Dubai drivers — build your setup, unlock 20% off, and confirm with Sean on WhatsApp.",
    },
    eyebrow: "Premium PPF - Dubai",
    headline: "Full Car PPF Price",
    headlineAccent: "in Dubai.",
    mobileIntro:
      "Build your setup, see the starting PPF Dubai price, then claim 20% off, free pickup, or window tint with Sean on WhatsApp.",
    desktopIntro:
      "Use this PPF Dubai calculator to estimate full car paint protection film pricing for your car, SUV, or sports car, then lock in 20% off, free pickup, or window tint with Sean on WhatsApp.",
    campaignIntro:
      "Built for Dubai drivers comparing paint protection film, full body PPF, STEK PPF, and full car PPF installation costs.",
    campaignTerms: ["PPF Dubai", "Paint protection film", "PPF price", "Full body PPF"],
    primaryCta: "See my price (60s)",
    secondaryCta: "WhatsApp Sean",
    proofPoints: ["60-second quote", "No commitment", "Sean reviews each setup"],
    messageIntro: "Hi Sean, I built a full PPF setup on the Grand Touch Dubai quote page.",
    phoneCaptureServiceName: "Dubai Quote V2 - Phone Captured At Warranty Step",
    bonusClaimServiceName: "Dubai Quote V2 Bonus Claim",
  },
  // V3 (experimental, localhost): price-GATED variant. The exact discounted
  // price is locked behind the contact form to fix the "saw price then left"
  // drop-off. Own funnel name so the dashboard tracks V3 capture rate separately.
  v3: {
    seoKey: "ppf-full-ppf-calculator-guided-v3",
    funnelName: "ppf_full_ppf_guided_calculator_v3",
    landingPageVariant: "google_full_ppf_guided_calculator_v3",
    defaultSourcePlatform: "google",
    calculatorType: "guided_full_ppf_v3",
    pageUrl: "https://www.grandtouchauto.ae/ppf-full-ppf-calculator-guided-v3",
    seo: {
      title: "PPF Dubai Price Calculator | Full Car Paint Protection Film",
      description:
        "Use the Grand Touch PPF Dubai calculator to estimate full car paint protection film pricing, full body PPF options, STEK film, and your 20% online discount.",
      keywords:
        "ppf dubai, paint protection film dubai, ppf price dubai, ppf cost dubai, full body ppf dubai, full car ppf dubai, car ppf dubai, premium PPF Dubai, STEK PPF Dubai",
      ogTitle: "PPF Dubai Price Calculator",
      ogDescription:
        "Build your full PPF setup, unlock the 20% online discount, and ask Sean to confirm your paint protection film install in Dubai.",
    },
    eyebrow: "Premium PPF - Dubai",
    headline: "Full Car PPF Price",
    headlineAccent: "in Dubai.",
    mobileIntro:
      "Build your setup, then unlock your exact PPF Dubai price with 20% off, free pickup, or window tint with Sean on WhatsApp.",
    desktopIntro:
      "Use this PPF Dubai calculator to build your full car paint protection film setup, then unlock your exact price plus 20% off, free pickup, or window tint with Sean on WhatsApp.",
    campaignIntro:
      "Built for Dubai drivers comparing paint protection film, full body PPF, STEK PPF, and full car PPF installation costs.",
    campaignTerms: ["PPF Dubai", "Paint protection film", "PPF price", "Full body PPF"],
    primaryCta: "Build my price (60s)",
    secondaryCta: "WhatsApp Sean",
    proofPoints: ["60-second quote", "No commitment", "Sean reviews each setup"],
    messageIntro: "Hi Sean, I built a guided full PPF setup on the Grand Touch page.",
    phoneCaptureServiceName: "Guided Full PPF V3 - Phone Captured At Warranty Step",
    bonusClaimServiceName: "Guided Full PPF V3 Bonus Claim",
  },
  tiktok: {
    seoKey: "ppf-tiktok-full-car-ppf",
    funnelName: "ppf_tiktok_guided_calculator",
    landingPageVariant: "tiktok_full_ppf_guided_calculator",
    defaultSourcePlatform: "tiktok",
    calculatorType: "tiktok_guided_full_ppf",
    pageUrl: "https://www.grandtouchauto.ae/ppf-tiktok-full-car-ppf",
    seo: {
      title: "TikTok Full PPF Offer Dubai | Grand Touch Auto",
      description:
        "Tap through a mobile-first full car PPF quote flow for Dubai, reveal your starting price, and claim a Grand Touch TikTok bonus on WhatsApp.",
      keywords:
        "TikTok PPF Dubai, full car PPF Dubai offer, PPF price Dubai TikTok, Grand Touch PPF, STEK PPF Dubai",
      ogTitle: "TikTok Full PPF Offer Dubai",
      ogDescription:
        "Choose car size, finish, and warranty in a fast TikTok-first flow, then WhatsApp Sean with your setup and bonus claim.",
    },
    eyebrow: "TikTok PPF offer - Dubai",
    headline: "Full PPF price",
    headlineAccent: "+ bonus claim.",
    mobileIntro:
      "Tap your size, finish, and warranty. Reveal the price, then WhatsApp Sean with the setup already written.",
    desktopIntro:
      "A fast TikTok-first PPF quote flow: tap your size, finish, and warranty, reveal the price, then WhatsApp Sean with your setup already written.",
    primaryCta: "Start my setup",
    secondaryCta: "WhatsApp Sean",
    proofPoints: ["30-second setup", "No spam", "Sean confirms on WhatsApp"],
    messageIntro: "Hi Sean, I built a TikTok full PPF setup on the Grand Touch page.",
    phoneCaptureServiceName: "TikTok Guided Full PPF - Phone Captured At Warranty Step",
    bonusClaimServiceName: "TikTok Guided Full PPF Bonus Claim",
  },
  meta: {
    seoKey: "ppf-meta-full-car-ppf-v2",
    funnelName: "ppf_meta_guided_calculator_v2",
    landingPageVariant: "meta_full_ppf_guided_calculator_v2",
    defaultSourcePlatform: "meta",
    calculatorType: "meta_guided_full_ppf_v2",
    pageUrl: "https://www.grandtouchauto.ae/ppf-meta-full-car-ppf-v2",
    seo: {
      title: "Meta Full PPF Offer Dubai | Grand Touch Auto",
      description:
        "Use the Meta-only Grand Touch full PPF calculator to reveal your Dubai paint protection film setup and claim the online offer.",
      keywords:
        "Meta PPF Dubai, full car PPF Dubai offer, PPF price Dubai Meta, Grand Touch PPF, STEK PPF Dubai",
      ogTitle: "Meta Full PPF Offer Dubai",
      ogDescription:
        "Choose car size, finish, and warranty in a Meta-specific full PPF flow, then WhatsApp Sean with your locked-in setup.",
    },
    eyebrow: "Meta PPF offer - Dubai",
    headline: "Full PPF price",
    headlineAccent: "+ online offer.",
    mobileIntro:
      "Tap your size, finish, and warranty. Reveal the price, then WhatsApp Sean with the setup already written.",
    desktopIntro:
      "A Meta-specific full PPF quote flow: choose your car size, finish, and warranty, reveal the price, then WhatsApp Sean with your setup already written.",
    primaryCta: "Start my setup",
    secondaryCta: "WhatsApp Sean",
    proofPoints: ["Fast setup", "No spam", "Sean confirms on WhatsApp"],
    messageIntro: "Hi Sean, I built a Meta full PPF setup on the Grand Touch page.",
    phoneCaptureServiceName: "Meta Guided Full PPF V2 - Phone Captured At Warranty Step",
    bonusClaimServiceName: "Meta Guided Full PPF V2 Bonus Claim",
  },
};

// Dubai install slot windows — rolling, cosmetic only. Used to give a "next available" feel.
const SLOTS_PER_WEEK = 4;
const SLOTS_REMAINING_THIS_WEEK = 2;

const sizeOptions: Array<{
  value: PpfPricingSize;
  label: string;
  example: string;
  image: string;
}> = [
  {
    value: "Small",
    label: "Small",
    example: "A45 / Golf / 3 Series",
    image: "/calculator-a45-gloss.jpg",
  },
  {
    value: "Medium",
    label: "Medium",
    example: "E-Class / 5 Series",
    image: "/calculator-e63s-gloss.jpg",
  },
  {
    value: "SUV",
    label: "SUV / 4x4",
    example: "Patrol / Defender / Cayenne",
    image: "/calculator-patrol-gloss.jpg",
  },
  {
    value: "Sports",
    label: "Sports",
    example: "911 / GT3 / R8",
    image: "/calculator-gt3-gloss.jpg",
  },
];

const finishOptions: Array<{
  value: PpfPricingFinish;
  label: string;
  helper: string;
  proof: string;
}> = [
  {
    value: "Gloss",
    label: "Gloss",
    helper: "Factory paint look",
    proof: "Keeps the original paint look while protecting against chips and wash marks.",
  },
  {
    value: "Matte",
    label: "Matte",
    helper: "Satin stealth",
    proof: "Changes the visual attitude while still giving full-body protection.",
  },
];

const packageOptions: Array<{
  years: PackageYears;
  title: string;
  label: string;
  value: string;
  badge?: string;
}> = [
  {
    years: 5,
    title: "5-year warranty",
    label: "Essential",
    value: "Confident chip & paint cover",
  },
  {
    years: 10,
    title: "10-year warranty",
    label: "Most chosen",
    value: "Best protection-to-price balance",
    badge: "POPULAR",
  },
  {
    years: 12,
    title: "12-year warranty",
    label: "Ultimate",
    value: "Maximum long-term cover",
  },
];

const stepOrder: FlowStep[] = ["size", "finish", "package", "result"];

/**
 * Top-bar bonuses — claimable extras only, kept distinct from the standard
 * "free add-ons" stack shown in the Dialog. These are the things a user
 * unlocks by completing the funnel: discount, free tint, free pickup,
 * extended warranty, and a direct line to Sean.
 */
const topOffers: Array<{
  icon: typeof Truck;
  text: string;
}> = [
  { icon: BadgePercent, text: "Claim 20% off your full PPF setup" },
  { icon: Truck, text: "Free pickup & drop-off across Dubai" },
  { icon: Sparkles, text: "Free window tint upgrade available" },
  { icon: ShieldCheck, text: "10 & 12-year warranty options available" },
  { icon: Zap, text: "Same-day WhatsApp quote direct from Sean" },
];

const tiktokTopOffers: Array<{
  icon: typeof Truck;
  text: string;
}> = [
  { icon: MousePointerClick, text: "Tap 3 choices to reveal your PPF setup" },
  { icon: BadgePercent, text: "TikTok bonus: 20% off, pickup, or tint" },
  { icon: MessageCircle, text: "WhatsApp Sean with your setup pre-written" },
  { icon: ShieldCheck, text: "10 & 12-year warranty options available" },
  { icon: Zap, text: "Built for mobile - no long form required" },
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
      "The starting figure isn't just film on paint. It already includes prep, paint correction, full detailing, headlight & door-sill protection, leather + wheel ceramic, and the warranty registration. Starting figures exclude VAT. Final pricing depends on the car, paint condition, and panel complexity once the vehicle is inspected.",
  },
  {
    question: "How does the STEK warranty registration work?",
    answer:
      "After installation and the one-week check, the film is registered through STEK so the warranty is traceable to the actual material on your car. Most buyers are told they have warranty cover without ever seeing the registration trail — we send you yours.",
  },
  {
    question: "How long does PPF installation usually take?",
    answer:
      "Depends on the car, coverage, and how much prep is needed. A smaller package can move faster; full-body protection on a larger car takes longer because prep, fitment, and final QC all matter as much as the film. Sean confirms realistic timing once he knows the car and the package.",
  },
  {
    question: "Will PPF damage my paint when it's eventually removed?",
    answer:
      "No — when STEK film is removed by a trained installer it lifts cleanly off intact factory paint and leaves no residue. The risk only appears with cheap films or aggressive removal on already-failing clearcoat. That's why we won't install on paint we haven't inspected.",
  },
  {
    question: "Does the PPF cover stone chips and rock damage?",
    answer:
      "Yes — protecting against road impact is what PPF is designed for. Daily Dubai driving (Sheikh Zayed, Hessa, Emirates Road) is brutal on front bumpers, bonnets, and mirrors, which is why we always recommend at least the high-impact zones be fully wrapped, even on a partial package.",
  },
  {
    question: "Can I bring my own film, or does Grand Touch supply it?",
    answer:
      "We only install STEK because we stand behind the warranty and we know the batch. Customer-supplied film breaks the chain of accountability — if anything fails later, no one owns it. The film cost is included in the package figures you see.",
  },
  {
    question: "Is the warranty transferable if I sell the car?",
    answer:
      "Yes. STEK registration is tied to the vehicle, not the owner, so a future buyer inherits the remaining warranty term and inspection support. We hand over the documentation so the next owner can prove the install is legitimate.",
  },
];

// NOTE: the `value` AED figures below are PLACEHOLDERS — confirm/adjust with the
// owner before launch. They drive the Step 4 "value stack" total in ONE place.
const includedFreeItems: Array<{ title: string; description: string; value: number }> = [
  {
    title: "Multi-stage paint correction",
    description: "Panels hand-polished so the film bonds to flawless paint.",
    value: 1500,
  },
  {
    title: "Full interior & exterior detail",
    description: "Showroom-clean handover, inside and out.",
    value: 600,
  },
  {
    title: "Headlight & door-sill protection",
    description: "The two spots that scratch first — covered.",
    value: 400,
  },
  {
    title: "Leather interior ceramic coat",
    description: "Spill-resistant seats, easier to wipe clean.",
    value: 700,
  },
  {
    title: "Wheel ceramic coating",
    description: "Brake dust rinses off in seconds.",
    value: 500,
  },
  {
    title: "Lifetime PPF inspection",
    description: "Drop in anytime — we recheck edges & corners for life.",
    value: 600,
  },
];

// Free pickup (sourced from topOffers) folded into the value stack. PLACEHOLDER value.
const freePickupStackItem = {
  title: "Free pickup & drop-off across Dubai",
  description: "Dubai-wide, by Sean's team — at a time that suits you.",
  value: 250,
};

// The full Step 4 value stack = free inclusions + pickup. Total ≈ AED 4,550.
const valueStackItems = [...includedFreeItems, freePickupStackItem];
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

const finishImageFor = (size: PpfPricingSize | null, finish: PpfPricingFinish) => {
  const prefix =
    size === "Medium" ? "e63s" : size === "SUV" ? "patrol" : size === "Sports" ? "gt3" : "a45";
  return `/calculator-${prefix}-${finish.toLowerCase()}.jpg`;
};

/**
 * Fires a Google Ads conversion. `value` enables value-based bidding: when a
 * real AED estimate is available we pass it so Smart Bidding can optimise toward
 * higher-value setups instead of treating every lead as worth 1.0.
 */
const trackGoogleAdsConversion = (sendTo: string, value?: number) => {
  if (typeof window === "undefined" || !window.gtag) return;

  window.gtag("event", "conversion", {
    send_to: sendTo,
    value: typeof value === "number" && value > 0 ? value : 1.0,
    currency: "AED",
  });
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

const PpfFullPpfGuidedCalculatorV2 = ({ variant = "google" }: PpfFullPpfGuidedCalculatorProps) => {
  const variantConfig = guidedVariantConfig[variant];
  // dubai_quote + v3 reuse the Google funnel's conversion behaviour, so they
  // count as a "Google" variant here.
  const isGoogleVariant =
    variant === "google" || variant === "dubai_quote" || variant === "v3";
  const isTikTokVariant = variant === "tiktok";
  // Gated funnels (V3 + Meta): hide the exact price behind the form, drop the
  // name requirement, and make WhatsApp a direct 1-tap (no pre-chat popup).
  const isGated = variant === "v3" || variant === "meta";
  const isMetaVariant = variant === "meta";
  const offerTickerItems = isTikTokVariant ? tiktokTopOffers : topOffers;
  const [step, setStep] = useState<FlowStep>("size");
  const [size, setSize] = useState<PpfPricingSize | null>(null);
  const [finish, setFinish] = useState<PpfPricingFinish | null>(null);
  const [warrantyYears, setWarrantyYears] = useState<PackageYears | null>(null);
  const [vehicle, setVehicle] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
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
  // One COUNTED Google conversion per user/session — shared by the WhatsApp
  // contact and the unlock-form actions so a single visitor never fires both.
  const googleCountedConversionFiredRef = useRef(false);
  // Independent guard for the non-counted observe-only pre-form WhatsApp action.
  const googlePreFormWhatsAppFiredRef = useRef(false);

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

  const [phoneAttentionFired, setPhoneAttentionFired] = useState(false);
  const [animatedPhonePlaceholder, setAnimatedPhonePlaceholder] = useState("50 123 4567");
  const [isPhoneFocused, setIsPhoneFocused] = useState(false);
  const [phoneCapturedAt, setPhoneCapturedAt] = useState<string | null>(null);
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
    if (warrantyYears && !phoneAttentionFired) {
      setPhoneAttentionFired(true);
    }
  }, [warrantyYears, phoneAttentionFired]);

  useEffect(() => {
    if (!warrantyYears) {
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
  }, [warrantyYears, phone, isPhoneFocused, phonePlaceholderExamples]);

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
  const selectedPackage = packageOptions.find((option) => option.years === warrantyYears) ?? null;
  const selectedSeries = warrantyYears ? stekSeriesName(warrantyYears) : null;
  const estimate =
    size && finish && warrantyYears
      ? getPpfPriceRange("STEK", warrantyYears, size, "Full Body", finish).min
      : null;
  const isComplete = Boolean(size && finish && warrantyYears && estimate !== null);
  const policyBonusEligible = Boolean(size && warrantyYears);
  const phoneCaptured = isLikelyRealPhone(phone);
  const bonusEligible = policyBonusEligible && phoneCaptured;
  const premiumBonusLabel = bonusEligible
    ? "20% saving, free pickup, or free tint unlocked"
    : "20% saving, free pickup, or free tint available";

  // ── Gamified 20% unlock pricing — MARGIN-NEUTRAL ANCHOR ─────────────────
  // `estimate` is the TRUE price Sean honors → that's the unlocked target.
  // The displayed pre-unlock anchor (`listPrice`) is ~25% higher, rounded to
  // the nearest 10 so a clean "20% OFF" reads correctly. Savings = anchor −
  // target. The WhatsApp message and Google Ads VALUES always use targetPrice.
  const targetPrice = estimate;
  const listPrice = estimate !== null ? Math.round(estimate / 0.8 / 10) * 10 : null;
  const discountSavings =
    listPrice !== null && targetPrice !== null ? listPrice - targetPrice : null;
  const firstName = name.trim().split(/\s+/)[0] ?? "";
  // V3 needs only a valid phone (name optional) to cut last-step friction.
  const canUnlock = (isGated || name.trim().length >= 2) && phoneCaptured;
  // Meta traffic runs "lead-form" style: no direct-WhatsApp escape until the
  // visitor has qualified (calculator complete). Owner data: drive-by Meta
  // WhatsApp chats essentially never close. Google/v3 keeps direct WhatsApp.
  const hideDirectWa = isMetaVariant && !isComplete;

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

  const trackGoogleSubmitLeadConversion = useCallback(
    (value?: number) => {
      if (!isGoogleVariant || googleCountedConversionFiredRef.current) return;
      googleCountedConversionFiredRef.current = true;
      trackGoogleAdsConversion(GOOGLE_ADS_SUBMIT_LEAD_SEND_TO, value);
    },
    [isGoogleVariant],
  );

  // Counted WhatsApp contact conversion (same action the proven May funnel
  // uses). Shares the one-per-session guard with the unlock form above so a
  // visitor who taps WhatsApp and later submits the form counts only once.
  const trackGoogleWhatsAppContactConversion = useCallback(
    (value?: number) => {
      if (!isGoogleVariant || googleCountedConversionFiredRef.current) return;
      googleCountedConversionFiredRef.current = true;
      trackGoogleAdsConversion(GOOGLE_ADS_WHATSAPP_CONTACT_SEND_TO, value);
    },
    [isGoogleVariant],
  );

  // Observe-only action for the admin dashboard. Independent guard, so it keeps
  // firing on pre-form WhatsApp taps without affecting the counted conversion.
  const trackGooglePreFormWhatsAppConversion = useCallback(
    (value?: number) => {
      if (!isGoogleVariant || googlePreFormWhatsAppFiredRef.current) return;
      googlePreFormWhatsAppFiredRef.current = true;
      trackGoogleAdsConversion(GOOGLE_ADS_PRE_FORM_WHATSAPP_SEND_TO, value);
    },
    [isGoogleVariant],
  );

  const buildPayload = useCallback(
    () => ({
      size,
      vehicle_size: size,
      finish,
      warranty_years: warrantyYears,
      package_name: selectedPackage?.title,
      estimate_value: estimate,
      final_price: estimate,
      service_price: estimate,
      coverage: "Full Body",
      lead_name: name.trim() || undefined,
      lead_phone: phoneCaptured ? phone.trim() : undefined,
      vehicle_model: vehicle.trim() || undefined,
      bonus_eligible: bonusEligible,
      bonus_label: premiumBonusLabel,
      selected_extras: selectedExtras.join(", "),
    }),
    [
      bonusEligible,
      estimate,
      finish,
      name,
      phone,
      phoneCaptured,
      premiumBonusLabel,
      selectedExtras,
      selectedPackage,
      size,
      vehicle,
      warrantyYears,
    ],
  );

  const buildProjectedPayload = useCallback(
    ({
      nextSize = size,
      nextFinish = finish,
      nextWarrantyYears = warrantyYears,
    }: {
      nextSize?: PpfPricingSize | null;
      nextFinish?: PpfPricingFinish | null;
      nextWarrantyYears?: PackageYears | null;
    } = {}) => {
      const projectedPackage =
        packageOptions.find((option) => option.years === nextWarrantyYears) ?? null;
      const projectedEstimate =
        nextSize && nextFinish && nextWarrantyYears
          ? getPpfPriceRange("STEK", nextWarrantyYears, nextSize, "Full Body", nextFinish).min
          : null;

      return {
        ...buildPayload(),
        size: nextSize,
        vehicle_size: nextSize,
        finish: nextFinish,
        warranty_years: nextWarrantyYears,
        package_name: projectedPackage?.title,
        estimate_value: projectedEstimate,
        final_price: projectedEstimate,
        service_price: projectedEstimate,
      };
    },
    [buildPayload, finish, size, warrantyYears],
  );

  useEffect(() => {
    updatePageSEO(variantConfig.seoKey, variantConfig.seo);

    trackEvent("lp_view", { calculator_type: variantConfig.calculatorType });
    if (isTikTokVariant) {
      initTikTokPixel();
      trackTikTokEvent("ViewContent", {
        content_name: "TikTok Guided Full PPF Calculator",
        content_category: "PPF",
      });
    }
  }, [isTikTokVariant, trackEvent, variantConfig]);

  const trackMetaStandardEvent = useCallback(
    (eventName: MetaStandardEvent, payload: Record<string, unknown> = {}) => {
      if (!isMetaVariant || typeof window === "undefined" || !window.fbq) return;

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
    [funnelContext, isMetaVariant],
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

  const goToStep = (nextStep: FlowStep, reason: string) => {
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

  const selectSize = (nextSize: PpfPricingSize) => {
    setSize(nextSize);
    const payload = {
      step_name: "size",
      ...buildProjectedPayload({ nextSize }),
    };
    trackEvent("guided_step_completed", payload);
    trackEvent("calculator_selection_changed", payload);
  };

  const selectFinish = (nextFinish: PpfPricingFinish) => {
    setFinish(nextFinish);
    const payload = {
      step_name: "finish",
      ...buildProjectedPayload({ nextFinish }),
    };
    trackEvent("guided_step_completed", payload);
    trackEvent("calculator_selection_changed", payload);
  };

  const selectPackage = (nextYears: PackageYears) => {
    setWarrantyYears(nextYears);
    const payload = {
      step_name: "package",
      ...buildProjectedPayload({ nextWarrantyYears: nextYears }),
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

  const handlePhoneCapture = useCallback(async () => {
    const cleaned = phone.trim();
    if (!isLikelyRealPhone(cleaned)) return;
    if (phoneCapturedAt === cleaned) return;

    setPhoneCapturedAt(cleaned);
    trackEvent("guided_phone_captured", {
      step_name: "package",
      capture_location: "warranty_bonus_lock",
      ...buildPayload(),
    });
    await captureLeadSnapshot({
      snapshotType: "contact",
      context: funnelContext,
      fullName: name.trim(),
      phone: cleaned,
      vehicleModel: vehicle.trim(),
      payload: {
        service_name: variantConfig.phoneCaptureServiceName,
        package_name: selectedPackage?.title,
        warranty_years: warrantyYears,
        finish,
        vehicle_size: size,
        bonus_eligible: bonusEligible,
      },
    });
  }, [
    bonusEligible,
    buildPayload,
    finish,
    funnelContext,
    name,
    phone,
    phoneCapturedAt,
    selectedPackage,
    size,
    trackEvent,
    variantConfig,
    vehicle,
    warrantyYears,
  ]);

  const toggleExtra = (extra: string) => {
    setSelectedExtras((current) => {
      const exists = current.includes(extra);
      const next = exists ? current.filter((item) => item !== extra) : [...current, extra];
      trackEvent("guided_extra_toggled", {
        extra,
        selected: !exists,
        selected_extras: next.join(", "),
      });
      return next;
    });
  };

  const whatsAppMessage = useMemo(() => {
    if (!isComplete || !estimate || !selectedPackage || !finish || !selectedSize) {
      const lines = [
        isTikTokVariant
          ? "Hi Sean, I came from TikTok and want a full PPF quote."
          : isMetaVariant
            ? "Hi Sean, I came from Meta and want a full PPF quote."
          : "Hi Sean, I want a full PPF quote.",
        vehicle.trim() ? `Car: ${vehicle.trim()}.` : "",
        size || finish || selectedPackage
          ? `Selected so far: ${[size, finish, selectedPackage?.title].filter(Boolean).join(", ")}.`
          : "",
        "Can you confirm the best option and earliest slot?",
      ].filter(Boolean);

      return lines.join(" ");
    }

    const setupParts = [selectedSize.label, finish.toLowerCase(), selectedPackage.title].filter(Boolean);
    const lines = [
      isTikTokVariant
        ? "Hi Sean, I checked full PPF on TikTok."
        : isMetaVariant
          ? "Hi Sean, I checked full PPF from Meta."
          : "Hi Sean, I checked full PPF.",
      vehicle.trim() ? `Car: ${vehicle.trim()}.` : "",
      `Setup: ${setupParts.join(", ")}.`,
      `Estimate: ${formatAED(estimate)} (excl. VAT).`,
      bonusEligible ? `Bonus: ${premiumBonusLabel}.` : "",
      selectedExtras.length ? `I am also interested in: ${selectedExtras.join(", ")}.` : "",
      "Can you confirm final price and availability?",
    ].filter(Boolean);

    return lines.join(" ");
  }, [
    estimate,
    finish,
    isComplete,
    isMetaVariant,
    isTikTokVariant,
    bonusEligible,
    premiumBonusLabel,
    selectedExtras,
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

    if (isTikTokVariant) {
      trackTikTokEvent("Contact", {
        content_name: "TikTok Guided Full PPF Calculator",
        content_category: "PPF",
        button_location: placement,
        value: estimate ?? undefined,
        currency: "AED",
      });
    }

    if (isMetaVariant) {
      const metaPayload = {
        content_name: "Meta Guided Full PPF Calculator V2",
        content_category: "PPF",
        button_location: placement,
        value: estimate ?? undefined,
        currency: "AED",
      };
      // Contact = every tap (Events Manager visibility). Lead = QUALIFIED taps
      // only (calculator complete) — drive-by taps were firing phantom Leads
      // (tap ≠ message sent) and training Meta to optimise for tyre-kickers.
      // Form submit fires Lead separately in handleUnlockDiscount.
      trackMetaStandardEvent("Contact", metaPayload);
      if (isComplete && estimate !== null) {
        trackMetaStandardEvent("Lead", metaPayload);
      }
    }

    // Counted Google Ads conversions fire from handleWhatsApp (WhatsApp tap) and
    // handleUnlockDiscount (form submit). The post-submit handoff stays
    // analytics-only so one visitor never fires two counted conversions.
  };

  const handleWhatsApp = (placement: string) => {
    trackWhatsAppContact(placement);
    // Observe-only signal for the dashboard (does not affect bidding).
    trackGooglePreFormWhatsAppConversion(estimate ?? undefined);
    // Counted Google conversion: on gated funnels only QUALIFIED WhatsApp taps
    // (calculator complete) count, so Smart Bidding optimises toward buyers who
    // qualified themselves — raw drive-by taps rarely close and would train
    // Google to find tyre-kickers. Ungated variants keep counting every tap.
    if (!isGated || (isComplete && estimate !== null)) {
      trackGoogleWhatsAppContactConversion(estimate ?? undefined);
    }
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


  // The locked-in WhatsApp message — uses the captured name and the DISCOUNTED
  // targetPrice, and flags the 20% online discount. Kept separate from the
  // generic `whatsAppMessage` so the higher-funnel pre-chat path is untouched.
  const buildLockedInWhatsAppMessage = () => {
    const setupParts = [selectedSize?.label, finish?.toLowerCase(), selectedPackage?.title].filter(
      Boolean,
    );
    const lines = [
      `Hi Sean, it's ${name.trim() || "a customer"} — I unlocked the 20% online discount on the full PPF calculator.`,
      vehicle.trim() ? `Car: ${vehicle.trim()}.` : "",
      setupParts.length ? `Setup: ${setupParts.join(", ")}.` : "",
      listPrice !== null ? `Was ${formatAED(listPrice)}.` : "",
      targetPrice !== null
        ? `My locked-in price: ${formatAED(targetPrice)} (20% online discount applied, excl. VAT).`
        : "",
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
    if (isGated || (isComplete && estimate !== null)) {
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
      !finish ||
      !selectedPackage
    ) {
      return;
    }
    if (discountUnlocked || unlocking) return;

    if (!isGated && name.trim().length < 2) {
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
    runPriceCountdown(listPrice, targetPrice);

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
        service_name: variantConfig.bonusClaimServiceName,
        service_price: targetPrice,
        final_price: targetPrice,
        list_price: listPrice,
        discount_savings: discountSavings,
        package_name: selectedPackage.title,
        finish,
        vehicle_size: size,
        coverage: "Full Body",
        bonus_eligible: bonusEligible,
        selected_extras: selectedExtras.join(", "),
      },
    });

    if (result.ok) {
      trackEvent("lead_form_submitted", {
        form_type: "guided_discount_unlock",
        ...buildPayload(),
      });

      // New gamification dataLayer event (value = discounted targetPrice).
      trackEvent("discount_unlocked", {
        ...buildPayload(),
        value: targetPrice,
        currency: "AED",
        list_price: listPrice,
        discount_savings: discountSavings,
      });

      // Submit-lead PRIMARY conversion - value = discounted targetPrice.
      if (isTikTokVariant) {
        trackTikTokSubmitForm({
          content_name: "TikTok Guided Full PPF Calculator",
          content_category: "PPF",
          value: targetPrice,
          currency: "AED",
        });
      } else if (isMetaVariant) {
        trackMetaStandardEvent("Lead", {
          content_name: "Meta Guided Full PPF Calculator V2",
          content_category: "PPF",
          value: targetPrice,
          currency: "AED",
        });
      } else {
        trackGoogleSubmitLeadConversion(targetPrice);
      }
    }

    setUnlocking(false);
    setFormStatus(result.ok ? "saved" : "error");
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
        priceRange: "AED 4,000 – AED 25,000",
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
        serviceType: "Paint Protection Film (PPF) installation",
        provider: {
          "@type": "LocalBusiness",
          name: "Grand Touch Auto",
          telephone: "+971567191045",
        },
        areaServed: { "@type": "City", name: "Dubai" },
        description:
          "Authorised STEK paint protection film installation in Dubai with multi-stage paint correction, ceramic add-ons, and a registered warranty.",
        offers: {
          "@type": "AggregateOffer",
          priceCurrency: "AED",
          lowPrice: "4000",
          highPrice: "25000",
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
      goToStep("finish", "mobile_sticky_continue");
      return;
    }

    if (step === "finish" && finish) {
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

  const activeStepIndex = stepOrder.indexOf(step);
  const progress = Math.round(((activeStepIndex + 1) / stepOrder.length) * 100);

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
            : "Tap to claim your PPF bonuses and start your quote"
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
                    Build your full PPF price in 60 seconds.
                  </h1>
                  <p className="mt-2 text-xs leading-5 text-slate-300">
                    Tap your car size below, choose finish and warranty, then unlock the online offer.
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
                    { src: "/guided-rolls-install.png", alt: "PPF install in progress" },
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
                    { icon: BadgePercent, label: isTikTokVariant ? "TikTok bonus" : "20% off setup" },
                    { icon: Truck, label: "Free pickup" },
                    { icon: Sparkles, label: "Free tint" },
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
                      label: isTikTokVariant ? "TikTok bonus" : "20% off setup",
                      sub: isTikTokVariant ? "Claim option" : "Any package",
                    },
                    {
                      icon: Truck,
                      label: "Free pickup",
                      sub: "Dubai-wide",
                    },
                    {
                      icon: Sparkles,
                      label: "Free tint",
                      sub: "Claim option",
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
                <div className="mb-3 sm:mb-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400 sm:text-xs">
                      Step {activeStepIndex + 1} of {stepOrder.length}
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
                      onClick={() => goToStep("finish", "size_continue")}
                      className="mt-3 h-11 w-full bg-[#f7b52b] font-black text-black hover:bg-[#ffc94f] disabled:bg-white/10 disabled:text-white/45 sm:mt-4 sm:h-12"
                    >
                      Continue to Finish
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                ) : null}

                {step === "finish" ? (
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
                      2. Finish direction
                    </p>
                    <h2 className="mt-1 text-xl font-black sm:mt-2 sm:text-3xl">Gloss or matte?</h2>

                    <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-5 sm:gap-3">
                      {finishOptions.map((option, index) => {
                        const isSelected = finish === option.value;
                        const showGlow = !finish;

                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => selectFinish(option.value)}
                            className={cn(
                              optionButton,
                              "flex h-full flex-col",
                              isSelected ? "border-[#f7b52b] ring-1 ring-[#f7b52b]/40" : "border-white/10",
                            )}
                          >
                            <img
                              src={finishImageFor(size, option.value)}
                              alt=""
                              className="h-24 w-full object-cover opacity-85 sm:h-48"
                            />
                            <div className="flex-1 p-2.5 sm:p-4">
                              <p className="text-lg font-black sm:text-2xl">{option.label}</p>
                              <p className="mt-0.5 text-[11px] text-[#f7b52b] sm:mt-1 sm:text-sm">
                                {option.helper}
                              </p>
                              <p className="mt-3 hidden text-sm leading-6 text-slate-300 sm:block">
                                {option.proof}
                              </p>
                            </div>
                            {showGlow ? <GuidedCardGlow delay={index * 1.6} /> : null}
                          </button>
                        );
                      })}
                    </div>

                    <Button
                      type="button"
                      size="lg"
                      disabled={!finish}
                      onClick={() => goToStep("package", "finish_continue")}
                      className="mt-3 h-11 w-full bg-[#f7b52b] font-black text-black hover:bg-[#ffc94f] disabled:bg-white/10 disabled:text-white/45 sm:mt-4 sm:h-12"
                    >
                      Continue to Warranty
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                ) : null}

                {step === "package" ? (
                  <div>
                    <button
                      type="button"
                      onClick={() => goToStep("finish", "back")}
                      className="mb-2 inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white sm:mb-4 sm:gap-2 sm:text-sm"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Back to finish
                    </button>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#f7b52b] sm:text-xs">
                      3. Warranty
                    </p>
                    <h2 className="mt-1 text-xl font-black sm:mt-2 sm:text-3xl">
                      How long do you want it to last?
                    </h2>

                    <div className="mt-3 grid gap-2 sm:mt-5 sm:grid-cols-3 sm:gap-3">
                      {packageOptions.map((option, index) => {
                        const isSelected = warrantyYears === option.years;
                        const showGlow = !warrantyYears;

                        return (
                          <button
                            key={option.years}
                            type="button"
                            onClick={() => selectPackage(option.years)}
                            className={cn(
                              optionButton,
                              "flex h-full items-center gap-3 px-3 py-2.5 text-left sm:flex-col sm:items-center sm:justify-between sm:gap-0 sm:px-4 sm:py-6 sm:text-center",
                              isSelected
                                ? "border-[#f7b52b] bg-[#f7b52b]/10 ring-1 ring-[#f7b52b]/40"
                                : "border-white/10",
                            )}
                          >
                            {option.badge ? (
                              <span className="absolute right-2 top-2 rounded-full bg-[#f7b52b] px-1.5 py-0.5 text-[8px] font-black tracking-[0.12em] text-black shadow-[0_0_22px_rgba(247,181,43,0.45)] sm:right-3 sm:top-3 sm:px-2.5 sm:text-[10px] sm:tracking-[0.14em]">
                                {option.badge}
                              </span>
                            ) : null}
                            <div className="flex shrink-0 items-baseline gap-1 sm:flex-col sm:items-center sm:gap-0">
                              <span
                                className={cn(
                                  "text-[2.1rem] font-black leading-none tracking-tight sm:text-[5rem]",
                                  isSelected ? "text-[#f7b52b]" : "text-white",
                                )}
                              >
                                {option.years}
                              </span>
                              <span className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400 sm:mt-1 sm:text-[10px] sm:tracking-[0.24em]">
                                Year<span className="hidden sm:inline"> warranty</span>
                              </span>
                            </div>
                            <div className="min-w-0 flex-1 pr-12 sm:mt-4 sm:flex-none sm:pr-0">
                              <p className="text-sm font-black leading-tight sm:text-base">{option.label}</p>
                              <p className="mt-0.5 text-[11px] leading-snug text-slate-400 sm:mt-1 sm:text-xs sm:leading-5">
                                {option.value}
                              </p>
                            </div>
                            {showGlow ? <GuidedCardGlow delay={index * 1.6} /> : null}
                          </button>
                        );
                      })}
                    </div>

                    {warrantyYears ? (
                      <div
                        className={cn(
                          "mt-3 rounded-2xl border bg-[#f7b52b]/[0.05] p-2.5 transition-all duration-500 sm:mt-4 sm:p-4",
                          "border-[#f7b52b]/35",
                          phoneAttentionFired && "animate-guided-attention motion-reduce:animate-none",
                        )}
                      >
                        <div className="flex items-center gap-2 sm:items-start sm:gap-3">
                          <BadgeCheck className="h-4 w-4 shrink-0 text-[#f7b52b] sm:mt-0.5 sm:h-5 sm:w-5" />
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#f7b52b] sm:text-base sm:tracking-[0.14em]">
                              Save your number — unlock 20% off next
                            </p>
                            <p className="mt-0.5 hidden text-xs leading-5 text-slate-300 sm:block">
                              Add your number now, then claim your 20% online discount on the next step.
                            </p>
                          </div>
                        </div>
                        <div className="relative mt-2 sm:mt-3">
                          <PhoneInputWithCountry
                            value={phone}
                            onChange={setPhone}
                            onFocus={() => setIsPhoneFocused(true)}
                            onBlur={() => {
                              setIsPhoneFocused(false);
                              void handlePhoneCapture();
                            }}
                            placeholder={animatedPhonePlaceholder}
                            className="border-[#f7b52b]/30 bg-white/[0.04]"
                            ariaLabel="Phone for bonus lock"
                          />
                          {!phone && !isPhoneFocused ? (
                            <span
                              aria-hidden
                              className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm font-semibold text-[#f7b52b] animate-guided-caret-blink motion-reduce:animate-none"
                            >
                              |
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-500 sm:mt-2 sm:text-[10px] sm:tracking-[0.18em]">
                          Optional · No spam
                        </p>
                      </div>
                    ) : null}

                    <Button
                      type="button"
                      size="lg"
                      disabled={!isComplete}
                      onClick={revealSetup}
                      className="mt-3 h-11 w-full animate-pulse bg-[#25D366] font-black text-white shadow-[0_18px_48px_rgba(37,211,102,0.32)] hover:bg-[#20bf5d] disabled:animate-none disabled:bg-white/10 disabled:text-white/45 sm:mt-4 sm:h-12"
                    >
                      {phone.trim().length >= 7 ? "Reveal My Setup + Lock Bonus" : "Reveal My Setup"}
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
                        {[selectedSize?.label, finish, selectedPackage?.title]
                          .filter(Boolean)
                          .map((chip) => (
                            <span
                              key={chip}
                              className="rounded-full border border-white/10 bg-black/30 px-2.5 py-0.5 text-[10px] font-bold sm:px-3 sm:py-1 sm:text-xs"
                            >
                              {chip}
                            </span>
                          ))}
                      </div>

                      {discountUnlocked && listPrice !== null && targetPrice !== null ? (
                        /* ---------- POST-UNLOCK: locked-in green price ---------- */
                        <>
                          <div className="mt-3 flex items-center gap-2 sm:mt-3.5">
                            <span className={cn("relative text-sm font-bold text-white/40 sm:text-base", !isGated && "line-through")}>
                              {formatAED(listPrice)}
                              {isGated ? (
                                <span
                                  aria-hidden="true"
                                  className="pointer-events-none absolute left-0 top-1/2 h-[2px] w-full origin-left -translate-y-1/2 rounded-full bg-[#25D366] shadow-[0_0_8px_rgba(37,211,102,0.7)] animate-guided-strike motion-reduce:animate-none"
                                />
                              ) : null}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#25D366]/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-[#25D366] ring-1 ring-[#25D366]/40 sm:text-[10px]">
                              <BadgePercent className="h-3 w-3" />
                              20% OFF
                            </span>
                          </div>

                          <p className="mt-1 text-[9px] font-black uppercase tracking-[0.22em] text-white/50 sm:text-[10px]">
                            Your locked-in price
                          </p>

                          <p className="mt-0.5 text-[2.6rem] font-black leading-none tracking-tight text-[#25D366] transition-colors duration-500 sm:mt-1 sm:text-[4rem]">
                            {formatAED(animatedPrice ?? targetPrice)}
                          </p>

                          {discountSavings !== null ? (
                            <div
                              className="mt-2 animate-fade-up motion-reduce:animate-none"
                              style={{ animationDelay: "0.45s", animationFillMode: "both" }}
                            >
                              <span className="inline-flex flex-wrap items-center gap-1.5 rounded-full bg-[#25D366]/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.06em] text-[#25D366] ring-1 ring-[#25D366]/45 sm:text-[11px]">
                                <BadgePercent className="h-3.5 w-3.5" />
                                20% off + extras locked in · save {formatAED(discountSavings)} + ≈{formatAED(valueStackTotal)} free
                              </span>
                            </div>
                          ) : null}

                          <p className="mt-2 text-[9px] font-semibold uppercase tracking-[0.14em] text-white/40 sm:text-[10px] sm:tracking-[0.16em]">
                            Excludes VAT · Sean confirms final price
                          </p>

                          {isGated ? (
                            <div className="mt-3 flex justify-center">
                              <span className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[#25D366]/60 bg-[#25D366]/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.08em] text-[#25D366] animate-guided-stamp-in motion-reduce:animate-none sm:text-xs">
                                <Sparkles className="h-4 w-4" />
                                You unlocked {formatAED((discountSavings ?? 0) + valueStackTotal)} of value
                              </span>
                            </div>
                          ) : null}
                        </>
                      ) : targetPrice !== null && listPrice !== null ? (
                        /* ---------- PRE-UNLOCK ---------- */
                        isGated ? (
                          /* V3: fully locked reward bundle. Nothing is inferable
                             (no anchor, no %math) — the reveal is the payoff. */
                          <>
                            <div className="mt-3 flex items-center gap-2 sm:mt-3.5">
                              <Sparkles className="h-5 w-5 shrink-0 text-[#f7b52b]" />
                              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#f7b52b] sm:text-xs">
                                Your reward bundle is ready
                              </p>
                            </div>

                            {/* BEFORE price — small, muted, with an animated red strike so it
                                clearly reads as the OLD price, not what they'll pay. */}
                            <p className="mt-2.5 text-[9px] font-black uppercase tracking-[0.22em] text-white/35 sm:text-[10px]">
                              Before your discount
                            </p>
                            <div className="flex items-center gap-2.5">
                              <span className="relative inline-block">
                                <span className="text-2xl font-black leading-none tracking-tight text-white/35 sm:text-3xl">
                                  {formatAED(listPrice)}
                                </span>
                                <span
                                  aria-hidden="true"
                                  className="pointer-events-none absolute left-0 top-1/2 h-[3px] w-full origin-left -translate-y-1/2 rounded-full bg-[#ff6b6b] shadow-[0_0_10px_rgba(255,107,107,0.75)] animate-guided-strike motion-reduce:animate-none"
                                />
                              </span>
                              <span className="rounded-full bg-[#25D366]/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.1em] text-[#25D366] ring-1 ring-[#25D366]/40">
                                −20%
                              </span>
                            </div>
                            <p className="mt-1.5 flex items-center gap-1.5 text-sm font-black leading-tight text-white sm:text-base">
                              Your real price is <span className="text-[#25D366]">lower</span> — it's locked
                              <ChevronDown className="h-4 w-4 shrink-0 text-[#f7b52b] animate-bounce motion-reduce:animate-none" />
                            </p>

                            {/* Locked perks — calm (no shimmer); the price card is the green hero */}
                            <div className="mt-2.5 grid gap-1.5">
                              {[
                                { label: "Your discounted price", hero: true },
                                { label: "20% online discount", hero: false },
                                { label: "AED 4,550 in free extras", hero: false },
                                { label: "Free pickup & delivery", hero: false },
                              ].map((perk) => (
                                <div
                                  key={perk.label}
                                  className={cn(
                                    "flex items-center justify-between gap-2 rounded-xl border px-3 py-2",
                                    perk.hero
                                      ? "border-[#25D366]/45 bg-[#25D366]/[0.07]"
                                      : "border-white/10 bg-black/30",
                                  )}
                                >
                                  <span className="flex min-w-0 items-center gap-2 text-xs font-bold text-slate-200 sm:text-sm">
                                    <Lock
                                      className={cn(
                                        "h-3.5 w-3.5 shrink-0",
                                        perk.hero ? "text-[#25D366]" : "text-[#f7b52b]",
                                      )}
                                    />
                                    <span className="truncate">{perk.label}</span>
                                  </span>
                                  <span
                                    className={cn(
                                      "shrink-0 rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.12em] sm:text-[9px]",
                                      perk.hero ? "bg-[#25D366]/15 text-[#25D366]" : "bg-white/10 text-white/55",
                                    )}
                                  >
                                    Locked
                                  </span>
                                </div>
                              ))}
                            </div>
                            <p className="mt-2.5 text-center text-[11px] font-black uppercase tracking-[0.1em] text-[#f7b52b] sm:text-xs">
                              You're one step away — add your number to reveal &amp; lock it in
                            </p>
                          </>
                        ) : (
                          /* V2: full price strikes out, discounted price is the hero */
                          <>
                            <p className="mt-3 text-[9px] font-black uppercase tracking-[0.22em] text-white/40 sm:mt-3.5 sm:text-[10px]">
                              Full setup price
                            </p>
                            <div className="relative mt-0.5 inline-block">
                              <span className="text-2xl font-black leading-none tracking-tight text-white/45 sm:text-3xl">
                                {formatAED(listPrice)}
                              </span>
                              <span
                                aria-hidden="true"
                                className="pointer-events-none absolute left-0 top-1/2 h-[3px] w-full origin-left -translate-y-1/2 rounded-full bg-[#f7b52b] shadow-[0_0_10px_rgba(247,181,43,0.7)] animate-guided-strike motion-reduce:animate-none"
                                style={{ animationDelay: "0.4s" }}
                              />
                            </div>
                            <p
                              className="mt-2.5 text-[9px] font-black uppercase tracking-[0.22em] text-white/55 animate-guided-anchor-up motion-reduce:animate-none sm:text-[10px]"
                              style={{ animationDelay: "0.75s" }}
                            >
                              Your price today
                            </p>
                            <p
                              className="mt-0.5 text-[2.6rem] font-black leading-none tracking-tight text-white animate-guided-price-in motion-reduce:animate-none sm:mt-1 sm:text-[4rem]"
                              style={{ animationDelay: "0.7s" }}
                            >
                              {formatAED(targetPrice)}
                            </p>
                            {discountSavings !== null ? (
                              <div
                                className="mt-2 animate-fade-up motion-reduce:animate-none"
                                style={{ animationDelay: "0.95s", animationFillMode: "both" }}
                              >
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366]/15 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.08em] text-[#25D366] ring-1 ring-[#25D366]/45 sm:text-xs">
                                  <BadgePercent className="h-3.5 w-3.5" />
                                  Save {formatAED(discountSavings)} · 20% off
                                </span>
                              </div>
                            ) : null}
                            <p className="mt-2 text-[9px] font-semibold uppercase tracking-[0.14em] text-white/40 sm:text-[10px] sm:tracking-[0.16em]">
                              Excludes VAT · Sean confirms final price
                            </p>
                          </>
                        )
                      ) : (
                        <p className="mt-3 text-[2.6rem] font-black leading-none tracking-tight text-white sm:mt-3.5 sm:text-[4rem]">
                          Setup ready
                        </p>
                      )}

                      {/* VALUE STACK — V2 always; V3 reveals the itemized extras on unlock */}
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
                            ? "Extras locked in — included free"
                            : "What's included free with your setup"}
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
                                ? "Enter your number to reveal your price + 20% off"
                                : `Enter your details below to get ${targetPrice !== null ? formatAED(targetPrice) : "this price"}`}
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
                            Send my locked-in price to Sean
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                          <p className="mt-2 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 sm:text-[11px]">
                            Valid today · Sean confirms your final price on WhatsApp
                          </p>
                        </div>
                      ) : (
                        <>
                        <form onSubmit={handleUnlockDiscount} className="mt-3">
                          <div className="grid gap-2 sm:grid-cols-2 sm:gap-2.5">
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

                          <Button
                            type="submit"
                            size="lg"
                            disabled={!canUnlock || unlocking}
                            className={cn(
                              "mt-2.5 h-12 w-full font-black text-black shadow-[0_18px_48px_rgba(247,181,43,0.32)]",
                              "bg-[#f7b52b] hover:bg-[#ffc94f]",
                              "disabled:bg-white/10 disabled:text-white/45 disabled:shadow-none",
                              canUnlock && !unlocking
                                ? "animate-guided-free-pulse motion-reduce:animate-none"
                                : "",
                            )}
                          >
                            {unlocking ? (
                              "Unlocking..."
                            ) : (
                              <>
                                <Lock className="mr-2 h-4 w-4" />
                                Lock in my 20% discount
                                <Sparkles className="ml-2 h-4 w-4" />
                              </>
                            )}
                          </Button>
                          {formStatus === "error" && name.trim().length < 2 ? (
                            <p className="mt-2 text-xs text-red-300 sm:text-sm">
                              Please add your name to lock in your price.
                            </p>
                          ) : null}
                          {formStatus === "invalid_phone" ? (
                            <p className="mt-2 text-xs text-red-300 sm:text-sm">
                              Please enter a valid WhatsApp number to lock in your price.
                            </p>
                          ) : null}
                          {formStatus === "error" && name.trim().length >= 2 ? (
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
                    Get your exact PPF setup priced
                    <span className="block text-[#f7b52b]">in under 60 seconds.</span>
                  </h2>
                </div>
                <TrustSectionCta
                  placement="trust_cta_post_handovers"
                  onEstimate={handleEstimateCta}
                  onWhatsApp={hideDirectWa ? undefined : requestWhatsApp}
                  microcopy="Bonuses worth AED 4,550+ · No upsell"
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
                ? "Continue to Finish"
                : step === "finish" && !finish
                  ? "Pick a finish"
                  : step === "finish"
                    ? "Continue to Warranty"
                    : step === "package" && !warrantyYears
                      ? "Pick a warranty"
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
              <span>See your exact full-PPF price in about 60 seconds</span>
            </li>
            <li className="flex items-start gap-2.5">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#f7b52b]" />
              <span>Unlock 20% off + free pickup, locked to your setup</span>
            </li>
            <li className="flex items-start gap-2.5">
              <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#f7b52b]" />
              <span>Or message Sean now — he'll still need your car, size &amp; finish</span>
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

export default PpfFullPpfGuidedCalculatorV2;
