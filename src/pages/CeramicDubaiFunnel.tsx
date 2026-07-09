import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  BadgePercent,
  Check,
  ChevronLeft,
  Eye,
  Gift,
  Layers3,
  MessageCircle,
  Plus,
  ShieldCheck,
  Sparkles,
  Star,
  WandSparkles,
  Zap,
} from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInputWithCountry } from "@/components/PhoneInputWithCountry";
import {
  captureLeadSnapshot,
  createFunnelTrackingContext,
  trackFunnelEvent,
  type MetaStandardEvent,
} from "@/lib/funnel-analytics";
import { updatePageSEO } from "@/lib/seo";
import { cn } from "@/lib/utils";

/**
 * Meta-ads GYEON ceramic funnel (2026 H2) — GUIDED STEPPER edition.
 *
 * Full rebuild on the proven tint funnel mechanic (TintDubaiFunnel /
 * PpfFullPpfGuidedCalculatorV2): a step machine (size → car → paint condition
 * → timing → package → result) with a progress bar, image size cards, a
 * bonus-lock phone capture on the package step, and a gamified result reveal
 * where the "before discount" anchor slashes down to the final price.
 *
 * Ceramic twist: the VALUE-STACK reveal. Ceramic packages bundle up to 10
 * line items, so the result screen animates each included item in with its
 * standalone worth ("GYEON glass coating — worth AED 399 — INCLUDED"), then
 * offers the missing items as simple +AED toggles. No inclusion matrix.
 *
 * Meta pixel only — NO Google Ads conversions fire here. Contact fires on
 * every WhatsApp tap; Lead fires ONCE per session (metaLeadFiredRef guard) on
 * phone-capture success OR a qualified post-price WhatsApp tap.
 */

type VehicleSize = "small" | "medium" | "large" | "xl";
type PaintCondition = "clean" | "light_swirls" | "heavy_swirls" | "not_sure";
type CeramicPackageId = "basic" | "correction" | "signature";
type CeramicTiming = "this_week" | "two_weeks" | "just_checking";
type FlowStep = "size" | "car" | "condition" | "timing" | "package" | "result";
type StackItemId =
  | "wash"
  | "polish"
  | "correction_single"
  | "correction_multi"
  | "ceramic"
  | "interior_clean"
  | "engine_bay"
  | "glass"
  | "wheel_face"
  | "interior"
  | "trim"
  | "wheels_off";
type AddOnId = "glass" | "wheel_face" | "interior" | "trim" | "wheels_off";

const WHATSAPP_NUMBER = "971567191045";

const flowSteps: FlowStep[] = ["size", "car", "condition", "timing", "package", "result"];

const buildWhatsAppUrl = (message: string) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

const formatAED = (value: number) => `AED ${value.toLocaleString("en-US")}`;

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

const sizeOptions: Array<{
  value: VehicleSize;
  label: string;
  example: string;
  image: string;
}> = [
  {
    value: "small",
    label: "Hatchback / Small",
    example: "Golf / A45 / Mini",
    image: "/calculator-a45-gloss.jpg",
  },
  {
    value: "medium",
    label: "Sedan",
    example: "Camry / 5 Series / E-Class",
    image: "/calculator-e63s-gloss.jpg",
  },
  {
    value: "large",
    label: "SUV / 4x4",
    example: "Patrol / Cayenne / X5",
    image: "/calculator-patrol-gloss.jpg",
  },
  {
    value: "xl",
    label: "XL / Luxury",
    example: "G-Wagon / S-Class / Bentley",
    image: "/calculator-gt3-gloss.jpg",
  },
];

/** Every line item in the ceramic stack with its standalone worth — this is
 * what the gamified result reveal animates in, one row at a time. */
const stackItems: Record<StackItemId, { label: string; worth: Record<VehicleSize, number> }> = {
  wash: {
    label: "Exterior wash + decontamination + clay bar",
    worth: { small: 349, medium: 399, large: 449, xl: 499 },
  },
  polish: {
    label: "Light machine polish",
    worth: { small: 449, medium: 499, large: 549, xl: 599 },
  },
  correction_single: {
    label: "Single-stage enhancement correction",
    worth: { small: 1099, medium: 1199, large: 1399, xl: 1599 },
  },
  correction_multi: {
    label: "Full multi-stage paint correction",
    worth: { small: 1799, medium: 1999, large: 2199, xl: 2499 },
  },
  ceramic: {
    label: "GYEON exterior ceramic coating",
    worth: { small: 1499, medium: 1699, large: 1899, xl: 2199 },
  },
  interior_clean: {
    label: "Light interior detail",
    worth: { small: 199, medium: 249, large: 299, xl: 349 },
  },
  engine_bay: {
    label: "Engine bay refresh",
    worth: { small: 199, medium: 249, large: 299, xl: 349 },
  },
  glass: {
    label: "GYEON glass coating",
    worth: { small: 299, medium: 399, large: 499, xl: 599 },
  },
  wheel_face: {
    label: "Wheel-face ceramic",
    worth: { small: 399, medium: 499, large: 599, xl: 699 },
  },
  interior: {
    label: "GYEON interior ceramic",
    worth: { small: 599, medium: 699, large: 899, xl: 1099 },
  },
  trim: {
    label: "Trim + plastic ceramic detail",
    worth: { small: 399, medium: 499, large: 599, xl: 699 },
  },
  wheels_off: {
    label: "Wheels-off ceramic (barrels coated)",
    worth: { small: 999, medium: 1199, large: 1399, xl: 1599 },
  },
};

const addOnIds: AddOnId[] = ["glass", "wheel_face", "interior", "trim", "wheels_off"];

const ceramicPackages: Array<{
  id: CeramicPackageId;
  name: string;
  shortName: string;
  tagline: string;
  points: string[];
  prices: Record<VehicleSize, { was: number; offer: number }>;
  /** What the price pays for — correction + coating core. */
  paidStack: StackItemId[];
  /** Thrown in free on the online build — the anchor stack. */
  freeStack: StackItemId[];
  badge?: string;
}> = [
  {
    id: "basic",
    name: "GYEON Basic Ceramic",
    shortName: "Basic",
    tagline: "Clean paint pick",
    points: ["GYEON exterior ceramic", "Light polish + interior detail", "Free engine bay refresh"],
    prices: {
      small: { was: 2099, offer: 1499 },
      medium: { was: 2299, offer: 1699 },
      large: { was: 2599, offer: 1899 },
      xl: { was: 2999, offer: 2199 },
    },
    paidStack: ["wash", "polish", "ceramic", "interior_clean"],
    freeStack: ["engine_bay"],
  },
  {
    id: "correction",
    name: "GYEON Showroom Ceramic",
    shortName: "Showroom",
    tagline: "Better than the day you bought it",
    points: [
      "Full multi-stage paint correction",
      "GYEON exterior ceramic",
      "Interior + glass + wheel ceramic FREE",
    ],
    prices: {
      small: { was: 3199, offer: 2199 },
      medium: { was: 3599, offer: 2499 },
      large: { was: 4299, offer: 2999 },
      xl: { was: 4999, offer: 3499 },
    },
    paidStack: ["wash", "correction_multi", "ceramic", "interior_clean"],
    freeStack: ["interior", "glass", "wheel_face", "engine_bay"],
    badge: "POPULAR",
  },
  {
    id: "signature",
    name: "GYEON Signature Ceramic",
    shortName: "Signature",
    tagline: "Maximum everything",
    points: [
      "Full multi-stage paint correction",
      "Everything in Showroom",
      "Trim + wheels-off ceramic FREE",
    ],
    prices: {
      small: { was: 4999, offer: 3499 },
      medium: { was: 5599, offer: 3899 },
      large: { was: 6499, offer: 4499 },
      xl: { was: 7499, offer: 5199 },
    },
    paidStack: ["wash", "correction_multi", "ceramic", "interior_clean"],
    freeStack: ["interior", "glass", "wheel_face", "trim", "wheels_off", "engine_bay"],
  },
];

const conditionOptions: Array<{
  value: PaintCondition;
  label: string;
  helper: string;
  icon: typeof Sparkles;
  recommends: CeramicPackageId;
}> = [
  {
    value: "clean",
    label: "New or very clean",
    helper: "Paint already glossy — Basic may be enough",
    icon: Sparkles,
    recommends: "basic",
  },
  {
    value: "light_swirls",
    label: "Light swirls / wash marks",
    helper: "The classic Dubai car-wash finish — most cars",
    icon: WandSparkles,
    recommends: "correction",
  },
  {
    value: "heavy_swirls",
    label: "Heavy swirls or dull paint",
    helper: "Needs proper correction before coating",
    icon: Layers3,
    recommends: "correction",
  },
  {
    value: "not_sure",
    label: "Not sure — inspect it",
    helper: "Sean checks the paint and confirms the level",
    icon: Eye,
    recommends: "correction",
  },
];

const timingOptions: Array<{ value: CeramicTiming; label: string; helper: string }> = [
  { value: "this_week", label: "This week", helper: "One ceramic bay per day — we'll find a slot" },
  { value: "two_weeks", label: "Next 2 weeks", helper: "Plenty of bay days available" },
  { value: "just_checking", label: "Just checking prices", helper: "No pressure — offer stays valid" },
];

const lockedBonuses = [
  { icon: Sparkles, text: "Free bonus coatings locked to your build" },
  { icon: BadgeCheck, text: "Online offer price locked for 14 days" },
  { icon: ShieldCheck, text: "Priority pick of bay days — one car per day" },
];

/** Top offer ticker — mirrors the tint funnel's marquee bar. */
const topOffers: Array<{ icon: typeof Gift; text: string }> = [
  { icon: BadgePercent, text: "Online offer: before-discount price slashed on your build" },
  { icon: Sparkles, text: "Up to AED 2,400 of bonus coatings free on your build" },
  { icon: ShieldCheck, text: "GYEON products throughout" },
  { icon: Zap, text: "One ceramic bay per day — never rushed" },
  { icon: Star, text: "Final correction level confirmed after paint inspection" },
];

/** Compare table — the deep-dive for researchers, below the guided flow. */
const compareRows: Array<{ feature: string; values: [string, string, string] }> = [
  { feature: "Wash + decontamination + clay", values: ["✓", "✓", "✓"] },
  { feature: "Paint correction", values: ["Light polish", "Multi-stage", "Full paint correction"] },
  { feature: "GYEON exterior ceramic", values: ["✓", "✓", "✓"] },
  { feature: "Light interior detail", values: ["✓", "✓", "✓"] },
  { feature: "Engine bay refresh", values: ["FREE", "FREE", "FREE"] },
  { feature: "GYEON interior ceramic", values: ["Add-on", "FREE", "FREE"] },
  { feature: "GYEON glass coating", values: ["Add-on", "FREE", "FREE"] },
  { feature: "Wheel-face ceramic", values: ["Add-on", "FREE", "FREE"] },
  { feature: "Trim + plastic ceramic", values: ["Add-on", "Add-on", "FREE"] },
  { feature: "Wheels-off ceramic", values: ["Add-on", "Add-on", "FREE"] },
  { feature: "Online offer from", values: ["AED 1,499", "AED 2,199", "AED 3,499"] },
];

const whyGrandTouch = [
  { icon: ShieldCheck, text: "GYEON product system throughout — no mystery bottles" },
  { icon: Star, text: "4.9 on Google (77 reviews)" },
  { icon: Zap, text: "One ceramic bay per day — your car is never rushed" },
  { icon: Eye, text: "Paint inspected before anything is confirmed" },
];

const ceramicFaqs: Array<{ question: string; answer: string }> = [
  {
    question: "Do I really need paint correction before ceramic?",
    answer:
      "If the paint has swirls, the coating locks them in — ceramic adds gloss and protection, it doesn't erase defects. That's why the coating alone (Basic) is only right for new or very clean paint. For the classic Dubai car-wash swirls, correction first is what makes the finish look better than showroom. Sean inspects the paint before confirming the final correction level, so you never pay for more correction than the car needs.",
  },
  {
    question: "How long does the job take?",
    answer:
      "We run one ceramic bay per day — your car is the only ceramic job in that bay. Basic is usually done same day; correction packages typically need 1–2 days depending on the paint. Drop-off is usually 9–11 AM and Sean confirms the exact timing when he sees the car.",
  },
  {
    question: "How long does GYEON ceramic last in Dubai?",
    answer:
      "Years, not months — but the honest answer is it depends on the coating line and how the car is washed afterwards. Dubai sun, sand and tunnel washes are brutal on cheap coatings. We use the GYEON system end to end and hand you the aftercare rules, so the durability the product is rated for is what you actually get.",
  },
  {
    question: "What does ceramic actually do?",
    answer:
      "It bonds a hard, slick, chemical-resistant layer to the paint: deeper gloss, water beads off, sand and dust don't stick as easily, and bird droppings or water spots don't etch the paint the way they etch bare clear coat. It also makes every wash faster and safer — dirt releases instead of grinding in.",
  },
  {
    question: "Ceramic or PPF — which should I get?",
    answer:
      "Different jobs. PPF is a physical film that stops stone chips and scratches; ceramic is a chemical layer for gloss, easy washing and UV/chemical protection — it will not stop a stone chip. Many clients do PPF on the front end and ceramic over the rest. If you're weighing it up, mention it on WhatsApp and Sean will give you a straight recommendation for your car.",
  },
];

const CeramicDubaiFunnel = () => {
  const [step, setStep] = useState<FlowStep>("size");
  const [size, setSize] = useState<VehicleSize | null>(null);
  const [vehicle, setVehicle] = useState("");
  const [carYear, setCarYear] = useState<number | null>(null);
  const [condition, setCondition] = useState<PaintCondition | null>(null);
  const [timing, setTiming] = useState<CeramicTiming | null>(null);
  const [packageId, setPackageId] = useState<CeramicPackageId | null>(null);
  const [selectedAddOns, setSelectedAddOns] = useState<Record<AddOnId, boolean>>({
    glass: false,
    wheel_face: false,
    interior: false,
    trim: false,
    wheels_off: false,
  });
  const [phone, setPhone] = useState("");
  const [leadName, setLeadName] = useState("");
  const [phoneCapturedAt, setPhoneCapturedAt] = useState<string | null>(null);
  // Locked without a name → keep a name field visible in the locked state.
  const [capturedWithoutName, setCapturedWithoutName] = useState(false);
  // Dedupe key (phone|name): typing a name after locking re-sends the snapshot
  // once with the name attached, instead of never sending it.
  const capturedKeyRef = useRef<string | null>(null);
  // Gamified reveal: the big number counts down from the anchor to the final price.
  const [animatedPrice, setAnimatedPrice] = useState<number | null>(null);
  const [revealPlayed, setRevealPlayed] = useState(false);
  const priceRafRef = useRef<number | null>(null);
  // One Meta pixel Lead per session — phone capture followed by a qualified
  // WhatsApp tap must not double-count (2 Meta Leads vs 1 real lead in CRM).
  const metaLeadFiredRef = useRef(false);
  const flowPanelRef = useRef<HTMLDivElement>(null);

  const funnelContext = useMemo(
    () =>
      createFunnelTrackingContext({
        funnelName: "ceramic_gyeon_offer_builder_2026h2",
        landingPageVariant: "ceramic_gyeon_guided_v2",
        defaultSourcePlatform: "meta",
      }),
    [],
  );

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
        emitToTagManagers: options.emitToTagManagers,
        metaStandardEvent: options.metaStandardEvent,
        metaPayload: options.metaPayload,
      });
    },
    [funnelContext],
  );

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

  const selectedSize = sizeOptions.find((option) => option.value === size) ?? null;
  const selectedPackage = ceramicPackages.find((pkg) => pkg.id === packageId) ?? null;
  const selectedCondition = conditionOptions.find((option) => option.value === condition) ?? null;
  const recommendedPackageId = selectedCondition?.recommends ?? "correction";

  const includedSet = useMemo(
    () =>
      new Set<StackItemId>([
        ...(selectedPackage?.paidStack ?? []),
        ...(selectedPackage?.freeStack ?? []),
      ]),
    [selectedPackage],
  );
  const availableAddOns = addOnIds.filter((id) => !includedSet.has(id));
  const activeAddOns = availableAddOns.filter((id) => selectedAddOns[id]);

  const basePrice = selectedPackage && size ? selectedPackage.prices[size].offer : null;
  const baseWas = selectedPackage && size ? selectedPackage.prices[size].was : null;
  const addOnTotal = size
    ? activeAddOns.reduce((sum, id) => sum + stackItems[id].worth[size], 0)
    : 0;
  const totalPrice = basePrice !== null ? basePrice + addOnTotal : null;
  const anchorPrice = baseWas !== null ? baseWas + addOnTotal : null;
  const discountSavings =
    anchorPrice !== null && totalPrice !== null ? anchorPrice - totalPrice : null;
  /** Sum of every line item's standalone worth — the "total stack value". */
  const stackWorth =
    selectedPackage && size
      ? [...selectedPackage.paidStack, ...selectedPackage.freeStack, ...activeAddOns].reduce(
          (sum, id) => sum + stackItems[id].worth[size],
          0,
        )
      : null;
  /** Worth of the free bonus stack — the anchor the price never has to carry. */
  const freeWorth =
    selectedPackage && size
      ? selectedPackage.freeStack.reduce((sum, id) => sum + stackItems[id].worth[size], 0)
      : null;
  const isComplete = Boolean(size && packageId && totalPrice !== null);
  // The Meta Lead diet: only visitors who finished the builder (saw their
  // price) count as qualified — drive-by taps train Meta on tyre-kickers.
  const ceramicLeadQualified = isComplete && totalPrice !== null;

  const buildPayload = useCallback(
    () => ({
      vehicle_size: size ?? undefined,
      vehicle_model: vehicle.trim() || undefined,
      vehicle_year: carYear != null ? String(carYear) : undefined,
      car_year: carYear ?? undefined,
      paint_condition: condition ?? undefined,
      install_urgency: timing ?? undefined,
      package_id: packageId ?? undefined,
      package_name: selectedPackage?.name,
      recommended_package: recommendedPackageId,
      selected_addons: activeAddOns,
      stack_value: stackWorth ?? undefined,
      free_bonus_value: freeWorth ?? undefined,
      list_price: anchorPrice ?? undefined,
      discount_savings: discountSavings ?? undefined,
      estimate_value: totalPrice ?? undefined,
      final_price: totalPrice ?? undefined,
      service_price: totalPrice ?? undefined,
      service_type: "gyeon_ceramic",
    }),
    [
      activeAddOns,
      anchorPrice,
      carYear,
      condition,
      discountSavings,
      freeWorth,
      packageId,
      recommendedPackageId,
      selectedPackage,
      size,
      stackWorth,
      timing,
      totalPrice,
      vehicle,
    ],
  );

  useEffect(() => {
    updatePageSEO("ceramic-dubai", {
      title: "GYEON Ceramic Coating Dubai | From AED 1,499 | Grand Touch",
      description:
        "Build your GYEON ceramic coating price in 60 seconds — car size, paint condition, package, price. Correction + ceramic from a one-bay-per-day Dubai studio.",
      keywords:
        "GYEON ceramic coating Dubai, ceramic coating Dubai price, car ceramic coating Dubai, paint correction Dubai, GYEON detailing Dubai",
      ogTitle: "GYEON Ceramic Coating Dubai — Build Your Price in 60 Seconds",
      ogDescription:
        "GYEON ceramic from AED 1,499. Paint correction, interior, glass and wheel ceramic stacked into one online offer.",
      url: "https://www.grandtouchauto.ae/ceramic-dubai",
      image: "/service-ceramic.jpg",
    });

    trackEvent("lp_view", { calculator_type: "ceramic_gyeon_guided" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const scrollToCalculator = (placement: string) => {
    trackEvent("ceramic_builder_cta_click", { cta_location: placement, step_name: step });
    flowPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const selectSize = (nextSize: VehicleSize) => {
    setSize(nextSize);
    trackEvent("guided_step_completed", {
      step_name: "size",
      ...buildPayload(),
      vehicle_size: nextSize,
    });
    goToStep("car", "size_selected");
  };

  const selectCondition = (nextCondition: PaintCondition) => {
    setCondition(nextCondition);
    const recommends =
      conditionOptions.find((option) => option.value === nextCondition)?.recommends ??
      "correction";
    // Pre-select the recommended tier so the package step opens on the match.
    setPackageId(recommends);
    trackEvent("guided_step_completed", {
      step_name: "condition",
      ...buildPayload(),
      paint_condition: nextCondition,
      recommended_package: recommends,
    });
    goToStep("timing", "condition_selected");
  };

  const selectTiming = (nextTiming: CeramicTiming) => {
    setTiming(nextTiming);
    trackEvent("guided_step_completed", {
      step_name: "timing",
      ...buildPayload(),
      install_urgency: nextTiming,
    });
    goToStep("package", "timing_selected");
  };

  const selectPackage = (nextPackageId: CeramicPackageId) => {
    setPackageId(nextPackageId);
    // Reset add-on picks that the new package already includes.
    const nextPackage = ceramicPackages.find((pkg) => pkg.id === nextPackageId);
    const nextStack = new Set([
      ...(nextPackage?.paidStack ?? []),
      ...(nextPackage?.freeStack ?? []),
    ]);
    setSelectedAddOns((current) => {
      const next = { ...current };
      addOnIds.forEach((id) => {
        if (nextStack.has(id)) next[id] = false;
      });
      return next;
    });
    const pkg = ceramicPackages.find((item) => item.id === nextPackageId);
    trackEvent("guided_step_completed", {
      step_name: "package",
      ...buildPayload(),
      package_id: nextPackageId,
      package_name: pkg?.name,
    });
  };

  const toggleAddOn = (id: AddOnId) => {
    const next = !selectedAddOns[id];
    setSelectedAddOns((current) => ({ ...current, [id]: next }));
    // Price already revealed — snap the big number to the new total, no re-run.
    if (priceRafRef.current) {
      cancelAnimationFrame(priceRafRef.current);
      priceRafRef.current = null;
    }
    setAnimatedPrice(null);
    trackEvent("ceramic_addon_toggled", { addon_id: id, selected: next, ...buildPayload() });
  };

  /** Bonus-lock phone capture on the package step — the proven capture
   * mechanic. Saves the lead snapshot and fires the once-per-session Meta Lead. */
  const handlePhoneCapture = useCallback(async () => {
    const cleaned = phone.trim();
    const trimmedName = leadName.trim();
    if (!isLikelyRealPhone(cleaned)) return;
    const captureKey = `${cleaned}|${trimmedName}`;
    if (capturedKeyRef.current === captureKey) return;

    capturedKeyRef.current = captureKey;
    setPhoneCapturedAt(cleaned);
    setCapturedWithoutName(!trimmedName);
    trackEvent("guided_phone_captured", {
      step_name: step,
      capture_location: "ceramic_bonus_lock",
      has_name: Boolean(trimmedName),
      ...buildPayload(),
    });
    trackEvent("save_quote_submitted", {
      form_type: "ceramic_bonus_lock",
      capture_location: "ceramic_bonus_lock",
      ...buildPayload(),
      has_phone: true,
      has_name: Boolean(trimmedName),
    });

    const result = await captureLeadSnapshot({
      snapshotType: "submit",
      context: funnelContext,
      fullName: trimmedName,
      phone: cleaned,
      vehicleModel: vehicle.trim(),
      vehicleYear: carYear != null ? String(carYear) : undefined,
      payload: {
        ...buildPayload(),
        service_name: "Ceramic GYEON 2026H2 - Bonus Lock Phone",
      },
    });

    if (result.ok) {
      const shouldFireMetaLead = !metaLeadFiredRef.current;
      if (shouldFireMetaLead) metaLeadFiredRef.current = true;

      trackEvent(
        "lead_form_submitted",
        {
          form_type: "ceramic_bonus_lock",
          capture_location: "ceramic_bonus_lock",
          ...buildPayload(),
        },
        shouldFireMetaLead
          ? {
              metaStandardEvent: "Lead",
              metaPayload: {
                content_name: "Ceramic Dubai Guided Funnel",
                content_category: "Ceramic",
                value: totalPrice ?? undefined,
                currency: "AED",
              },
            }
          : undefined,
      );
    } else {
      trackEvent(
        "lead_save_failed",
        {
          capture_location: "ceramic_bonus_lock",
          reason: ("reason" in result ? result.reason : null) ?? "unknown",
          ...buildPayload(),
        },
        { emitToTagManagers: false },
      );
    }
  }, [
    buildPayload,
    carYear,
    funnelContext,
    leadName,
    phone,
    step,
    totalPrice,
    trackEvent,
    trackMetaStandardEvent,
    vehicle,
  ]);

  const revealPrice = () => {
    if (!isComplete) return;
    trackEvent("price_viewed", buildPayload());
    trackEvent("guided_price_revealed", buildPayload());
    goToStep("result", "reveal_price");
  };

  /** Fired on pointerDOWN, not click: tapping this button while the phone
   * input is focused triggers the blur capture, which swaps the input for the
   * "locked" confirmation and shifts the button mid-tap — the browser then
   * drops the click (press and release land on different elements). Acting on
   * pointerdown beats the blur; onClick stays as the keyboard fallback. */
  const triggerReveal = () => {
    if (step === "result" || !isComplete) return;
    if (isLikelyRealPhone(phone)) void handlePhoneCapture();
    revealPrice();
  };

  // Discount slash: count from the anchor down to the final price (~1.1s easeOut).
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

  // Play the slash animation once, each time the visitor lands on the result.
  useEffect(() => {
    if (step !== "result") {
      setRevealPlayed(false);
      return;
    }
    if (revealPlayed || anchorPrice === null || totalPrice === null) return;
    setRevealPlayed(true);
    setAnimatedPrice(anchorPrice);
    runPriceCountdown(anchorPrice, totalPrice);
    trackEvent("guided_result_viewed", buildPayload());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, anchorPrice, totalPrice, revealPlayed, runPriceCountdown]);

  const whatsAppMessage = useMemo(() => {
    if (!isComplete || !selectedPackage || !size || totalPrice === null) {
      const lines = [
        "Hi Sean, I came from the ceramic page and want a GYEON ceramic quote.",
        leadName.trim() ? `My name is ${leadName.trim()}.` : "",
        vehicle.trim() ? `Car: ${vehicle.trim()}${carYear ? ` (${carYear})` : ""}.` : "",
        "Can you confirm the right package and earliest bay day?",
      ].filter(Boolean);
      return lines.join(" ");
    }

    const timingLabel =
      timing === "this_week" ? "this week" : timing === "two_weeks" ? "in the next 2 weeks" : null;
    const lines = [
      "Hi Sean, I built a GYEON ceramic offer on the Grand Touch page.",
      leadName.trim() ? `My name is ${leadName.trim()}.` : "",
      vehicle.trim() ? `Car: ${vehicle.trim()}${carYear ? ` (${carYear})` : ""}.` : "",
      `Setup: ${selectedPackage.name} on ${selectedSize?.label ?? size}${
        activeAddOns.length
          ? ` + ${activeAddOns.map((id) => stackItems[id].label).join(" + ")}`
          : ""
      }.`,
      selectedCondition ? `Paint: ${selectedCondition.label}.` : "",
      anchorPrice !== null ? `Was ${formatAED(anchorPrice)}.` : "",
      `My locked-in price: ${formatAED(totalPrice)} (online offer applied, + VAT).`,
      freeWorth
        ? `Includes my free bonus coatings (worth ${formatAED(freeWorth)}).`
        : "",
      timingLabel ? `I'd like it done ${timingLabel}.` : "",
      "Can you confirm after paint inspection and lock my bay day?",
    ].filter(Boolean);
    return lines.join(" ");
  }, [
    activeAddOns,
    anchorPrice,
    carYear,
    freeWorth,
    isComplete,
    leadName,
    selectedCondition,
    selectedPackage,
    selectedSize,
    size,
    timing,
    totalPrice,
    vehicle,
  ]);

  const handleWhatsApp = (placement: string) => {
    const metaPayload = {
      content_name: "Ceramic Dubai Guided Funnel",
      content_category: "Ceramic",
      button_location: placement,
      value: totalPrice ?? undefined,
      currency: "AED",
    };
    // Contact = every tap (Events Manager visibility). Lead is reserved for
    // lead_form_submitted so ceramic reports through the same path as PPF.
    trackMetaStandardEvent("Contact", metaPayload);
    trackEvent(
      "whatsapp_click",
      { cta_location: placement, ...buildPayload() },
      { emitToTagManagers: false },
    );
    window.open(buildWhatsAppUrl(whatsAppMessage), "_blank", "noopener,noreferrer");

    const cleanedPhone = phone.trim();
    if (ceramicLeadQualified && isLikelyRealPhone(cleanedPhone) && phoneCapturedAt !== cleanedPhone) {
      setPhoneCapturedAt(cleanedPhone);
      capturedKeyRef.current = `${cleanedPhone}|${leadName.trim()}`;
      void captureLeadSnapshot({
        snapshotType: "submit",
        context: funnelContext,
        fullName: leadName.trim(),
        phone: cleanedPhone,
        vehicleModel: vehicle.trim(),
        vehicleYear: carYear != null ? String(carYear) : undefined,
        payload: {
          ...buildPayload(),
          capture_location: placement,
          service_name: "Ceramic GYEON 2026H2 - Qualified WhatsApp",
        },
      }).then((result) => {
        if (result.ok) {
          const shouldFireMetaLead = !metaLeadFiredRef.current;
          if (shouldFireMetaLead) metaLeadFiredRef.current = true;

          trackEvent(
            "lead_form_submitted",
            {
              form_type: "ceramic_qualified_whatsapp",
              capture_location: placement,
              ...buildPayload(),
            },
            shouldFireMetaLead
              ? {
                  metaStandardEvent: "Lead",
                  metaPayload: {
                    content_name: "Ceramic Dubai Guided Funnel",
                    content_category: "Ceramic",
                    value: totalPrice ?? undefined,
                    currency: "AED",
                  },
                }
              : undefined,
          );
          return;
        }

        if (!result.ok) {
          trackEvent(
            "lead_save_failed",
            {
              capture_location: placement,
              reason: ("reason" in result ? result.reason : null) ?? "unknown",
              ...buildPayload(),
            },
            { emitToTagManagers: false },
          );
        }
      });
    }
  };

  /** Pre-price behaviour (Meta lead-form style): no direct WhatsApp escape
   * until the visitor has a price — CTAs route into the builder instead. */
  const handlePrimaryCta = (placement: string) => {
    if (isComplete && step === "result") {
      handleWhatsApp(placement);
      return;
    }
    scrollToCalculator(placement);
  };

  const activeStepIndex = flowSteps.indexOf(step);
  const progress = Math.round(((activeStepIndex + 1) / flowSteps.length) * 100);

  const stepBack = (target: FlowStep, label: string) => (
    <button
      type="button"
      onClick={() => goToStep(target, "back")}
      className="mb-2 inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white sm:mb-4 sm:gap-2 sm:text-sm"
    >
      <ChevronLeft className="h-4 w-4" />
      {label}
    </button>
  );

  const chipClass = (active: boolean) =>
    cn(
      "w-full rounded-xl border px-3.5 py-3.5 text-left transition",
      active
        ? "border-[#f7b52b] bg-[#f7b52b]/15"
        : "border-white/15 bg-white/[0.04] hover:border-[#f7b52b]/50",
    );

  return (
    <div className="min-h-screen bg-[#070707] pb-24 text-white md:pb-0">
      {/* ── Top offer ticker (marquee) ─────────────────────────────────── */}
      <button
        type="button"
        onClick={() => handlePrimaryCta("top_offer_bar")}
        aria-label={
          isComplete && step === "result"
            ? "Open WhatsApp with your ceramic build"
            : "Start your ceramic quote"
        }
        className="group sticky top-0 z-40 flex w-full items-center gap-2 overflow-hidden border-b border-[#f7b52b]/25 bg-[#0b0b0b]/95 px-2.5 py-1.5 text-[11px] backdrop-blur transition hover:bg-[#0f0f0f]/95 sm:gap-3 sm:px-4 sm:py-2 sm:text-[13px]"
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
          <div className="flex w-max animate-guided-marquee items-center group-hover:[animation-play-state:paused] motion-reduce:animate-none">
            {[...topOffers, ...topOffers].map((offer, index) => {
              const Icon = offer.icon;
              return (
                <span
                  key={`${offer.text}-${index}`}
                  className="flex shrink-0 items-center gap-1.5 px-3 sm:gap-2 sm:px-4"
                >
                  <Icon className="h-3.5 w-3.5 shrink-0 text-[#f7b52b] sm:h-4 sm:w-4" />
                  <span className="whitespace-nowrap font-semibold text-white">{offer.text}</span>
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
            "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] transition-transform group-hover:scale-[1.04] sm:px-3 sm:py-1.5 sm:text-[11px]",
            isComplete && step === "result"
              ? "bg-[#25D366] text-white shadow-[0_0_18px_rgba(37,211,102,0.45)]"
              : "bg-[#f7b52b] text-black shadow-[0_0_18px_rgba(247,181,43,0.45)]",
          )}
        >
          {isComplete && step === "result" ? "Claim" : "Start"}
          <ArrowRight className="h-3 w-3" />
        </span>
      </button>

      <main className="mx-auto w-full max-w-3xl px-4 pt-6 sm:pt-8">
        {/* ── Compact meta-style hero ─────────────────────────────────── */}
        <header className="rounded-2xl border border-[#f7b52b]/30 bg-[linear-gradient(180deg,rgba(247,181,43,0.12),rgba(8,8,8,0.42))] px-4 py-4 sm:px-5 sm:py-5">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#f7b52b] sm:text-xs">
            GYEON Ceramic Offer — Dubai
          </p>
          <h1 className="mt-1.5 text-[1.65rem] font-black leading-[1.05] tracking-tight sm:text-4xl">
            Build your ceramic price in 60 seconds.
          </h1>
          <p className="mt-2 max-w-xl text-xs leading-5 text-slate-300 sm:text-sm sm:leading-6">
            Tap your car size, tell us how the paint looks, then watch the before-discount price
            get slashed on your build — with every included item and what it's worth stacked up.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.08em] text-slate-200">
            <span className="flex items-center gap-1 rounded-full border border-white/10 bg-black/35 px-2 py-1">
              <Star className="h-3 w-3 fill-current text-[#fbbc05]" />
              Google 4.9
            </span>
            <span className="rounded-full border border-white/10 bg-black/35 px-2 py-1">
              GYEON products
            </span>
            <span className="rounded-full border border-[#f7b52b]/25 bg-[#f7b52b]/10 px-2 py-1 text-[#f7b52b]">
              Online offer inside
            </span>
          </div>
        </header>

        {/* ── Guided builder panel ────────────────────────────────────── */}
        <section
          ref={flowPanelRef}
          className="mt-5 scroll-mt-14 rounded-[24px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(8,8,8,0.6))] p-4 sm:mt-7 sm:p-6"
        >
          {/* Progress bar */}
          <div className="mb-3 sm:mb-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400 sm:text-xs">
                Step {activeStepIndex + 1} of {flowSteps.length}
              </p>
              <p className="text-[10px] font-semibold text-[#f7b52b] sm:text-xs">
                {progress}% complete
              </p>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10 sm:h-2">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#f7b52b,#25D366)] transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Step 1 — Car size (image cards) */}
          {step === "size" ? (
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#f7b52b] sm:text-xs">
                1. Car size
              </p>
              <h2 className="mt-1 text-xl font-black sm:mt-2 sm:text-3xl">
                Which one looks like yours?
              </h2>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-5 sm:gap-3">
                {sizeOptions.map((option) => {
                  const isSelected = size === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => selectSize(option.value)}
                      className={cn(
                        "group relative overflow-hidden rounded-[18px] border text-left transition duration-200 hover:-translate-y-0.5 hover:border-[#f7b52b]/55 sm:rounded-[22px]",
                        isSelected ? "border-[#f7b52b] ring-1 ring-[#f7b52b]/40" : "border-white/10",
                      )}
                    >
                      <div className="relative aspect-[4/3] w-full overflow-hidden bg-black">
                        <img
                          src={option.image}
                          alt={`${option.label} car example`}
                          loading="lazy"
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-2.5 sm:p-3">
                          <p
                            className={cn(
                              "text-sm font-black leading-tight sm:text-base",
                              isSelected ? "text-[#f7b52b]" : "text-white",
                            )}
                          >
                            {option.label}
                          </p>
                          <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/70 sm:text-[10px]">
                            {option.example}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Tap a size to continue · No number needed yet
              </p>
            </div>
          ) : null}

          {/* Step 2 — Your car (model + year) */}
          {step === "car" ? (
            <div>
              {stepBack("size", "Back to size")}
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#f7b52b] sm:text-xs">
                2. Your car
              </p>
              <h2 className="mt-1 text-xl font-black sm:mt-2 sm:text-3xl">So we price it right.</h2>

              <p className="mt-4 text-[11px] font-black uppercase tracking-[0.14em] text-white/55">
                What car is it?
              </p>
              <Input
                value={vehicle}
                onChange={(event) => setVehicle(event.target.value)}
                placeholder="e.g. Defender 110, Cayenne S, Patrol"
                aria-label="Your car"
                className="mt-2 h-12 border-white/20 bg-white/[0.05] text-white placeholder:text-slate-500 focus-visible:border-[#f7b52b]/70 focus-visible:ring-[#f7b52b]/30"
              />

              <p className="mt-4 text-[11px] font-black uppercase tracking-[0.14em] text-white/55">
                Model year
              </p>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {[2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019].map((year) => (
                  <button
                    key={year}
                    type="button"
                    onClick={() => {
                      setCarYear(year);
                      trackEvent("guided_qualification_answered", {
                        field: "car_year",
                        value: year,
                        ...buildPayload(),
                      });
                    }}
                    className={cn(
                      "rounded-xl border px-2 py-2.5 text-sm font-bold transition",
                      carYear === year
                        ? "border-[#f7b52b] bg-[#f7b52b]/15 text-[#f7b52b]"
                        : "border-white/15 bg-white/[0.04] text-slate-200 hover:border-[#f7b52b]/50",
                    )}
                  >
                    {year}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setCarYear(2015);
                    trackEvent("guided_qualification_answered", {
                      field: "car_year",
                      value: "older",
                      ...buildPayload(),
                    });
                  }}
                  className={cn(
                    "col-span-4 rounded-xl border px-2 py-2.5 text-sm font-bold transition",
                    carYear === 2015
                      ? "border-[#f7b52b] bg-[#f7b52b]/15 text-[#f7b52b]"
                      : "border-white/15 bg-white/[0.04] text-slate-200 hover:border-[#f7b52b]/50",
                  )}
                >
                  2018 or older
                </button>
              </div>

              <Button
                type="button"
                size="lg"
                disabled={!vehicle.trim() || !carYear}
                onClick={() => {
                  trackEvent("guided_step_completed", { step_name: "car", ...buildPayload() });
                  goToStep("condition", "car_continue");
                }}
                className="mt-5 h-12 w-full gap-2 bg-[#f7b52b] font-black text-black hover:bg-[#ffc94f] disabled:bg-white/10 disabled:text-white/45"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          ) : null}

          {/* Step 3 — Paint condition (routes the recommended package) */}
          {step === "condition" ? (
            <div>
              {stepBack("car", "Back to your car")}
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#f7b52b] sm:text-xs">
                3. Paint check
              </p>
              <h2 className="mt-1 text-xl font-black sm:mt-2 sm:text-3xl">
                How does the paint look in the sun?
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                Ceramic locks in whatever's underneath — this picks the right correction level.
              </p>
              <div className="mt-3 grid gap-2 sm:mt-4">
                {conditionOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => selectCondition(option.value)}
                      className={chipClass(condition === option.value)}
                    >
                      <span className="flex items-center gap-3">
                        <Icon
                          className={cn(
                            "h-5 w-5 shrink-0",
                            condition === option.value ? "text-[#f7b52b]" : "text-slate-400",
                          )}
                        />
                        <span className="min-w-0">
                          <span
                            className={cn(
                              "block text-sm font-black sm:text-base",
                              condition === option.value ? "text-[#f7b52b]" : "text-white",
                            )}
                          >
                            {option.label}
                          </span>
                          <span className="mt-0.5 block text-[11px] font-semibold text-slate-400 sm:text-xs">
                            {option.helper}
                          </span>
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* Step 4 — When do you want it done (urgency qualifier) */}
          {step === "timing" ? (
            <div>
              {stepBack("condition", "Back")}
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#f7b52b] sm:text-xs">
                4. Timing
              </p>
              <h2 className="mt-1 text-xl font-black sm:mt-2 sm:text-3xl">
                When do you want it done?
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                One ceramic bay per day — your car gets the whole bay, never rushed.
              </p>
              <div className="mt-3 grid gap-2 sm:mt-4">
                {timingOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => selectTiming(option.value)}
                    className={chipClass(timing === option.value)}
                  >
                    <span
                      className={cn(
                        "block text-sm font-black sm:text-base",
                        timing === option.value ? "text-[#f7b52b]" : "text-white",
                      )}
                    >
                      {option.label}
                    </span>
                    <span className="mt-0.5 block text-[11px] font-semibold text-slate-400 sm:text-xs">
                      {option.helper}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {/* Step 5 — Package (struck anchors + stack preview) + bonus lock */}
          {step === "package" && size ? (
            <div>
              {stepBack("timing", "Back to timing")}
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#f7b52b] sm:text-xs">
                5. Your GYEON package
              </p>
              <h2 className="mt-1 text-xl font-black sm:mt-2 sm:text-3xl">
                Pick your package — online offer already applied.
              </h2>
              {selectedCondition ? (
                <p className="mt-2 text-sm text-slate-400">
                  Based on "{selectedCondition.label.toLowerCase()}", we've matched you to{" "}
                  <span className="font-bold text-[#f7b52b]">
                    {ceramicPackages.find((pkg) => pkg.id === recommendedPackageId)?.shortName}
                  </span>
                  .
                </p>
              ) : null}

              <div className="mt-3 grid gap-2 sm:mt-5 sm:gap-3">
                {ceramicPackages.map((pkg) => {
                  const isSelected = packageId === pkg.id;
                  const isRecommended = pkg.id === recommendedPackageId;
                  const price = pkg.prices[size];
                  const pkgFreeWorth = pkg.freeStack.reduce(
                    (sum, id) => sum + stackItems[id].worth[size],
                    0,
                  );
                  return (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => selectPackage(pkg.id)}
                      className={cn(
                        "relative flex w-full items-start justify-between gap-3 overflow-hidden rounded-[20px] border px-3.5 py-3.5 text-left transition hover:-translate-y-0.5",
                        isSelected
                          ? "border-[#f7b52b] bg-[#f7b52b]/10 ring-1 ring-[#f7b52b]/40"
                          : "border-white/12 bg-white/[0.035] hover:border-[#f7b52b]/55",
                      )}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              "text-sm font-black sm:text-base",
                              isSelected ? "text-[#f7b52b]" : "text-white",
                            )}
                          >
                            {pkg.name}
                          </span>
                          {isRecommended ? (
                            <span className="rounded-full bg-[#f7b52b] px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-black">
                              Recommended for you
                            </span>
                          ) : null}
                          {pkg.badge && !isRecommended ? (
                            <span className="rounded-full bg-[#25D366]/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-[#25D366]">
                              {pkg.badge}
                            </span>
                          ) : null}
                        </span>
                        <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                          {pkg.tagline}
                        </span>
                        <span className="mt-1 block text-[11px] font-semibold text-slate-400 sm:text-xs">
                          {pkg.points.join(" · ")}
                        </span>
                        <span className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-[#25D366]/25 bg-[#25D366]/[0.08] px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.1em] text-[#25D366]">
                          <Gift className="h-3 w-3" />
                          {formatAED(pkgFreeWorth)} of bonuses FREE
                        </span>
                      </span>
                      <span className="shrink-0 whitespace-nowrap text-right">
                        <span className="block text-xs font-bold text-white/40 line-through sm:text-sm">
                          {formatAED(price.was)}
                        </span>
                        <span
                          className={cn(
                            "mt-0.5 block text-lg font-black leading-none sm:text-xl",
                            isSelected ? "text-[#f7b52b]" : "text-white",
                          )}
                        >
                          {formatAED(price.offer)}
                        </span>
                        <span className="mt-0.5 block text-[9px] font-semibold text-slate-500">
                          + VAT
                        </span>
                        <span className="mt-1 inline-block rounded-full bg-[#25D366]/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.08em] text-[#25D366]">
                          Save {formatAED(price.was - price.offer)}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Bonus-lock phone capture — the proven capture mechanic. */}
              {packageId ? (
                <div className="mt-3 rounded-2xl border border-[#f7b52b]/35 bg-[#f7b52b]/[0.05] p-3 sm:mt-4 sm:p-4">
                  <div className="flex items-start gap-2.5 sm:gap-3">
                    <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#f7b52b] sm:h-5 sm:w-5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#f7b52b] sm:text-sm sm:tracking-[0.14em]">
                        Lock your bay day + bonuses
                      </p>
                      <ul className="mt-1.5 space-y-1">
                        {lockedBonuses.map((bonus) => (
                          <li
                            key={bonus.text}
                            className="flex items-center gap-2 text-[11px] font-semibold text-slate-300 sm:text-xs"
                          >
                            <bonus.icon className="h-3.5 w-3.5 shrink-0 text-[#25D366]" />
                            {bonus.text}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  {phoneCapturedAt ? (
                    <>
                      <p className="mt-2.5 flex items-center gap-2 rounded-xl border border-[#25D366]/40 bg-[#25D366]/10 px-3 py-2.5 text-xs font-bold text-[#25D366]">
                        <BadgeCheck className="h-4 w-4 shrink-0" />
                        Bay day & bonuses locked
                        {leadName.trim() && !capturedWithoutName ? ` for ${leadName.trim()}` : ""} —
                        reveal your offer price below.
                      </p>
                      {capturedWithoutName ? (
                        <Input
                          value={leadName}
                          onChange={(event) => setLeadName(event.target.value)}
                          onBlur={() => void handlePhoneCapture()}
                          placeholder="Your name — so Sean knows who's booking"
                          aria-label="Your name for the booking"
                          className="mt-2 h-11 border-[#f7b52b]/30 bg-white/[0.04] text-white placeholder:text-slate-500 focus-visible:border-[#f7b52b]/70 focus-visible:ring-[#f7b52b]/30"
                        />
                      ) : null}
                    </>
                  ) : (
                    <>
                      <div className="mt-2.5 sm:mt-3">
                        <Input
                          value={leadName}
                          onChange={(event) => setLeadName(event.target.value)}
                          placeholder="Your name"
                          aria-label="Your name to lock bay day and bonuses"
                          className="h-11 border-[#f7b52b]/30 bg-white/[0.04] text-white placeholder:text-slate-500 focus-visible:border-[#f7b52b]/70 focus-visible:ring-[#f7b52b]/30"
                        />
                        <div className="mt-2">
                          <PhoneInputWithCountry
                            value={phone}
                            onChange={setPhone}
                            onBlur={() => void handlePhoneCapture()}
                            placeholder="50 123 4567"
                            className="border-[#f7b52b]/30 bg-white/[0.04]"
                            ariaLabel="Phone to lock bay day and bonuses"
                          />
                        </div>
                      </div>
                      <p className="mt-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-500 sm:mt-2 sm:text-[10px]">
                        Optional · Name + WhatsApp number · No spam
                      </p>
                    </>
                  )}
                </div>
              ) : null}

              <Button
                type="button"
                size="lg"
                disabled={!isComplete}
                onPointerDown={(event) => {
                  if (event.pointerType === "mouse" && event.button !== 0) return;
                  triggerReveal();
                }}
                onClick={triggerReveal}
                className="mt-3 h-12 w-full animate-pulse gap-2 bg-[#25D366] font-black text-white shadow-[0_18px_48px_rgba(37,211,102,0.32)] hover:bg-[#20bf5d] disabled:animate-none disabled:bg-white/10 disabled:text-white/45 sm:mt-4"
              >
                {isLikelyRealPhone(phone)
                  ? "Show my full offer + lock bonuses"
                  : "Show my full offer"}
                <Sparkles className="h-4 w-4" />
              </Button>
            </div>
          ) : null}

          {/* Step 6 — Result: discount slash + value-stack reveal + WhatsApp */}
          {step === "result" &&
          isComplete &&
          selectedPackage &&
          size &&
          totalPrice !== null &&
          anchorPrice !== null ? (
            <div>
              {stepBack("package", "Edit setup")}

              <div className="relative overflow-hidden rounded-2xl border-2 border-[#25D366]/55 bg-[radial-gradient(circle_at_top_left,rgba(37,211,102,0.18),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(8,8,8,0.96))] p-3.5 shadow-[0_0_36px_rgba(37,211,102,0.16)] sm:rounded-[24px] sm:p-5">
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {[
                    selectedSize?.label,
                    vehicle.trim() || null,
                    selectedPackage.shortName,
                    selectedCondition?.label ?? null,
                  ]
                    .filter(Boolean)
                    .map((chip) => (
                      <span
                        key={chip as string}
                        className="rounded-full border border-white/10 bg-black/30 px-2.5 py-0.5 text-[10px] font-bold sm:px-3 sm:py-1 sm:text-xs"
                      >
                        {chip}
                      </span>
                    ))}
                </div>

                {/* Struck anchor + animated slash */}
                <div className="mt-3 flex items-center gap-2 sm:mt-4">
                  <span className="relative text-sm font-bold text-white/40 sm:text-base">
                    {formatAED(anchorPrice)}
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute left-0 top-1/2 h-[2px] w-full origin-left -translate-y-1/2 rounded-full bg-[#25D366] shadow-[0_0_8px_rgba(37,211,102,0.7)] animate-guided-strike motion-reduce:animate-none"
                    />
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#25D366]/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-[#25D366] ring-1 ring-[#25D366]/40 sm:text-[10px]">
                    <BadgePercent className="h-3 w-3" />
                    Online offer
                  </span>
                </div>

                <p className="mt-1 text-[9px] font-black uppercase tracking-[0.22em] text-white/50 sm:text-[10px]">
                  Your offer price
                </p>
                <p
                  className="text-4xl font-black tracking-tight text-[#25D366] sm:text-5xl"
                  aria-live="polite"
                >
                  {formatAED(animatedPrice ?? totalPrice)}
                </p>
                <p className="mt-1 text-[11px] font-semibold text-slate-300 sm:text-xs">
                  {discountSavings !== null ? `You save ${formatAED(discountSavings)} · ` : ""}+
                  VAT · Final correction level confirmed after paint inspection
                </p>

                {/* Value-stack reveal — what the price pays for */}
                <div className="mt-3.5 rounded-xl border border-white/10 bg-black/30 p-3 sm:mt-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#f7b52b]">
                    What you're paying for
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {[...selectedPackage.paidStack, ...activeAddOns].map((id, index) => {
                      const item = stackItems[id];
                      const isAddOn = activeAddOns.includes(id as AddOnId);
                      return (
                        <li
                          key={id}
                          className="flex items-start justify-between gap-2 animate-guided-reveal-row motion-reduce:animate-none"
                          style={{ animationDelay: `${0.2 + index * 0.12}s` }}
                        >
                          <span className="flex min-w-0 items-start gap-2 text-xs font-semibold leading-snug text-slate-200 sm:text-sm">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#25D366]" />
                            <span>{item.label}</span>
                          </span>
                          <span className="shrink-0 whitespace-nowrap text-right">
                            {isAddOn ? (
                              <span className="text-[10px] font-black text-[#f7b52b] sm:text-[11px]">
                                +{formatAED(item.worth[size])}
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-white/40 sm:text-[11px]">
                                <span className="line-through">{formatAED(item.worth[size])}</span>{" "}
                                <span className="text-[#25D366] no-underline">incl.</span>
                              </span>
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {/* FREE bonus stack — the anchor the price never has to carry */}
                <div className="mt-2.5 rounded-xl border border-[#25D366]/35 bg-[#25D366]/[0.06] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#25D366]">
                      <Gift className="h-3.5 w-3.5" />
                      Free with your online build
                    </p>
                    {freeWorth !== null ? (
                      <p className="text-[10px] font-black text-[#25D366] animate-guided-free-pulse motion-reduce:animate-none">
                        worth {formatAED(freeWorth)}
                      </p>
                    ) : null}
                  </div>
                  <ul className="mt-2 space-y-1.5">
                    {selectedPackage.freeStack.map((id, index) => {
                      const item = stackItems[id];
                      return (
                        <li
                          key={id}
                          className="flex items-start justify-between gap-2 animate-guided-reveal-row motion-reduce:animate-none"
                          style={{
                            animationDelay: `${0.2 + (selectedPackage.paidStack.length + activeAddOns.length + index) * 0.12}s`,
                          }}
                        >
                          <span className="flex min-w-0 items-start gap-2 text-xs font-semibold leading-snug text-slate-200 sm:text-sm">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#25D366]" />
                            <span>{item.label}</span>
                          </span>
                          <span className="shrink-0 whitespace-nowrap text-right text-[10px] font-bold text-white/40 sm:text-[11px]">
                            <span className="line-through">{formatAED(item.worth[size])}</span>{" "}
                            <span className="rounded-full bg-[#25D366]/15 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.08em] text-[#25D366]">
                              FREE
                            </span>
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {/* Add-on upsell — only what's NOT already in the package */}
                {availableAddOns.length ? (
                  <div className="mt-3 rounded-xl border border-white/10 bg-black/30 p-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                      Complete the stack
                    </p>
                    <div className="mt-2 grid gap-1.5">
                      {availableAddOns.map((id) => {
                        const item = stackItems[id];
                        const active = selectedAddOns[id];
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => toggleAddOn(id)}
                            className={cn(
                              "flex w-full min-w-0 items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-left transition",
                              active
                                ? "border-[#f7b52b] bg-[#f7b52b]/15"
                                : "border-white/12 bg-white/[0.03] hover:border-[#f7b52b]/50",
                            )}
                          >
                            <span className="flex min-w-0 items-center gap-2">
                              {active ? (
                                <Check className="h-4 w-4 shrink-0 text-[#f7b52b]" />
                              ) : (
                                <Plus className="h-4 w-4 shrink-0 text-slate-500" />
                              )}
                              <span
                                className={cn(
                                  "truncate text-xs font-bold sm:text-sm",
                                  active ? "text-[#f7b52b]" : "text-slate-200",
                                )}
                              >
                                {item.label}
                              </span>
                            </span>
                            <span
                              className={cn(
                                "shrink-0 whitespace-nowrap text-xs font-black sm:text-sm",
                                active ? "text-[#f7b52b]" : "text-slate-400",
                              )}
                            >
                              +{formatAED(item.worth[size])}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                {/* Late phone capture if the visitor skipped the bonus lock */}
                {!phoneCapturedAt ? (
                  <div className="mt-3 rounded-xl border border-[#f7b52b]/30 bg-[#f7b52b]/[0.05] p-3">
                    <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#f7b52b]">
                      Lock this price for 14 days
                    </p>
                    <Input
                      value={leadName}
                      onChange={(event) => setLeadName(event.target.value)}
                      placeholder="Your name"
                      aria-label="Your name to lock this price"
                      className="mt-2 h-11 border-[#f7b52b]/30 bg-white/[0.04] text-white placeholder:text-slate-500 focus-visible:border-[#f7b52b]/70 focus-visible:ring-[#f7b52b]/30"
                    />
                    <div className="mt-2">
                      <PhoneInputWithCountry
                        value={phone}
                        onChange={setPhone}
                        onBlur={() => void handlePhoneCapture()}
                        placeholder="50 123 4567"
                        className="border-[#f7b52b]/30 bg-white/[0.04]"
                        ariaLabel="Phone to lock this price"
                      />
                    </div>
                  </div>
                ) : null}

                <Button
                  type="button"
                  size="lg"
                  onClick={() => handleWhatsApp("result_whatsapp")}
                  className="mt-4 h-13 w-full gap-2 bg-[#25D366] py-3.5 text-base font-black text-white shadow-[0_18px_48px_rgba(37,211,102,0.32)] hover:bg-[#20bf5d]"
                >
                  <MessageCircle className="h-5 w-5" />
                  WhatsApp Sean this exact build
                </Button>
                <p className="mt-2 text-center text-[10px] font-semibold text-slate-500">
                  Opens WhatsApp with your build and offer price pre-written — Sean confirms your
                  bay day after paint inspection.
                </p>
              </div>
            </div>
          ) : null}
        </section>

        {/* ── Package compare table ───────────────────────────────────── */}
        <section className="mt-12 sm:mt-16">
          <h2 className="text-xl font-black tracking-tight sm:text-2xl">
            What's in each package
          </h2>
          <p className="mt-2 max-w-xl text-sm font-semibold text-slate-400">
            Anything marked FREE is a bonus coating included at no charge on the online offer.
            Anything not included can be added to your build as a one-tap add-on.
          </p>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full min-w-[600px] text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.04]">
                  <th className="px-3 py-2.5 font-black text-white/55">Included</th>
                  {ceramicPackages.map((pkg) => (
                    <th key={pkg.id} className="px-3 py-2.5 font-black text-white">
                      {pkg.shortName}
                      {pkg.badge ? (
                        <span className="ml-2 rounded-full bg-[#25D366]/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-[#25D366]">
                          {pkg.badge}
                        </span>
                      ) : null}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {compareRows.map((row) => (
                  <tr key={row.feature} className="border-b border-white/5 last:border-b-0">
                    <td className="px-3 py-2.5 font-bold text-slate-400">{row.feature}</td>
                    {row.values.map((value, index) => (
                      <td
                        key={index}
                        className={cn(
                          "px-3 py-2.5 font-semibold",
                          value === "✓"
                            ? "text-[#25D366]"
                            : value === "FREE"
                              ? "font-black text-[#25D366]"
                              : value === "Add-on"
                                ? "text-slate-500"
                                : "text-slate-200",
                        )}
                      >
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[11px] font-semibold text-slate-500">
            All prices + VAT. Final correction level confirmed after paint inspection.
          </p>
        </section>

        {/* ── Coating-over-swirls education block ─────────────────────── */}
        <section className="mt-12 sm:mt-16">
          <div className="rounded-[24px] border border-[#f7b52b]/25 bg-[radial-gradient(circle_at_15%_0%,rgba(247,181,43,0.12),transparent_45%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(8,8,8,0.6))] p-5 sm:p-7">
            <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#f7b52b]">
              <WandSparkles className="h-4 w-4" />
              The thing cheap coaters won't tell you
            </p>
            <h2 className="mt-2 text-xl font-black tracking-tight sm:text-2xl">
              Ceramic locks in whatever's under it.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              A coating adds gloss and protection — it doesn't erase swirls. Coat over Dubai
              car-wash marks and you've sealed them in for years. That's why the paint gets
              inspected and <span className="font-bold text-white">corrected first</span>, and why
              the middle package exists: correction plus ceramic is what makes a daily driver look
              better than it did leaving the showroom.
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-black/30 px-3.5 py-3">
                <p className="text-xs font-black text-white">Coating over swirls</p>
                <p className="mt-1 text-[11px] font-semibold text-slate-400">
                  Glossy from far away — the scratches glow under every streetlight, sealed in.
                </p>
              </div>
              <div className="rounded-xl border border-[#25D366]/30 bg-[#25D366]/[0.06] px-3.5 py-3">
                <p className="text-xs font-black text-[#25D366]">Correction first, then ceramic</p>
                <p className="mt-1 text-[11px] font-semibold text-slate-300">
                  Defects removed, then locked under the coating — deep, mirror-flat gloss.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Why Grand Touch ─────────────────────────────────────────── */}
        <section className="mt-12 sm:mt-16">
          <h2 className="text-xl font-black tracking-tight sm:text-2xl">Why Grand Touch</h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {whyGrandTouch.map((item) => (
              <li
                key={item.text}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-3 text-sm font-semibold text-slate-200"
              >
                <item.icon className="h-4 w-4 shrink-0 text-[#f7b52b]" />
                {item.text}
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button
              type="button"
              size="lg"
              onClick={() => handlePrimaryCta("trust_section")}
              className="h-12 gap-2 bg-[#f7b52b] px-5 text-sm font-black text-black hover:bg-[#ffc94f]"
            >
              {isComplete && step === "result" ? "WhatsApp my build" : "Build my ceramic price"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </section>

        {/* ── FAQ ─────────────────────────────────────────────────────── */}
        <section className="mt-12 pb-12 sm:mt-16 sm:pb-20">
          <h2 className="text-xl font-black tracking-tight sm:text-2xl">
            Ceramic in Dubai — straight answers
          </h2>
          <Accordion type="single" collapsible className="mt-4">
            {ceramicFaqs.map((faq, index) => (
              <AccordionItem key={faq.question} value={`faq-${index}`} className="border-white/10">
                <AccordionTrigger className="text-left text-sm font-black text-white hover:no-underline sm:text-base">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-6 text-slate-300">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </main>

      {/* ── Mobile sticky bar — WhatsApp after the price, funnel before ── */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black/90 px-3 py-2 backdrop-blur md:hidden">
        {isComplete && step === "result" && totalPrice !== null ? (
          <Button
            type="button"
            onClick={() => handleWhatsApp("mobile_sticky")}
            className="h-12 w-full gap-2 bg-[#25D366] text-sm font-black text-white hover:bg-[#20bf5d]"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp Sean — {formatAED(totalPrice)}
            <Check className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={() => scrollToCalculator("mobile_sticky")}
            className="h-12 w-full gap-2 bg-[#f7b52b] text-sm font-black text-black hover:bg-[#ffc94f]"
          >
            Build my ceramic price (60s)
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default CeramicDubaiFunnel;
