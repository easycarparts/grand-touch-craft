import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  BadgePercent,
  Check,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { PhoneInputWithCountry } from "@/components/PhoneInputWithCountry";
import {
  captureLeadSnapshot,
  createFunnelTrackingContext,
  trackFunnelEvent,
  type MetaStandardEvent,
} from "@/lib/funnel-analytics";
import { updatePageSEO } from "@/lib/seo";
import {
  identifyTikTokUser,
  initTikTokPixel,
  trackTikTokEvent,
  trackTikTokSubmitForm,
} from "@/lib/tiktok-pixel";
import { cn } from "@/lib/utils";

/**
 * FAST tint funnel (Jul 2026) — replaces the guided 3-step funnel on /tint-dubai
 * after it produced 0 leads from ~360 paid clicks. Design rule: the PRICE is
 * visible with zero clicks, and a lead takes exactly one action:
 *
 *   - primary: WhatsApp tap (fires Contact always, Lead once per session)
 *   - secondary: phone number submit (saves CRM snapshot, fires Lead/SubmitForm)
 *
 * No name, no car model, no year, no timing, no add-on steps before capture.
 * Meta + TikTok pixels only — NO Google Ads conversions on this page.
 */

type TintTier = "action" | "smart" | "nex";
type TintSize = "Small" | "Medium" | "Sports" | "SUV";

const WHATSAPP_NUMBER = "971567191045";
const TINT_TIKTOK_PIXEL_IDS = [
  "D97JTBBC77U6Q0JCHTLG",
  "D7EDTI3C77UF89IGHIHG",
  "D7EFCR3C77UF89IGHL5G",
];
const TINT_TIKTOK_CONTENT = {
  content_id: "tint-dubai",
  content_type: "product",
  content_name: "Tint Dubai Fast Funnel",
  content_category: "Window Tint",
};

// Same price table the guided funnel used — the TRUE prices Sean honors.
const TINT_PRICE_TABLE: Record<TintTier, Record<TintSize, number>> = {
  action: { Small: 649, Medium: 799, Sports: 899, SUV: 999 },
  smart: { Small: 1299, Medium: 1499, Sports: 1499, SUV: 1699 },
  nex: { Small: 2199, Medium: 2399, Sports: 2499, SUV: 2799 },
};

/** "Before discount" anchor (~25% above the honored price, rounded to 10). */
const anchorFor = (price: number) => Math.round(price / 0.8 / 10) * 10;

const sizeOptions: Array<{ value: TintSize; label: string; example: string }> = [
  { value: "Small", label: "Small", example: "Golf / Yaris" },
  { value: "Medium", label: "Sedan", example: "Camry / E-Class" },
  { value: "Sports", label: "Sports", example: "911 / Mustang" },
  { value: "SUV", label: "SUV / 4x4", example: "Patrol / Defender" },
];

const tierOptions: Array<{
  value: TintTier;
  name: string;
  spec: string;
  badge?: string;
}> = [
  { value: "action", name: "STEK Action", spec: "Carbon film · UV 99%" },
  {
    value: "smart",
    name: "STEK Smart Ceramic",
    spec: "Ceramic heat rejection · UV 99%",
    badge: "MOST CHOSEN",
  },
  { value: "nex", name: "STEK Nex Premium", spec: "Max IR rejection · UV 99%" },
];

const includedPerks = [
  { icon: Sparkles, text: "Free sun-strip visor" },
  { icon: ShieldCheck, text: "STEK warranty registered to your car" },
  { icon: Zap, text: "Installed in ~3 hours at our DIP 2 studio" },
];

const fastFaqs: Array<{ question: string; answer: string }> = [
  {
    question: "Is this price final?",
    answer:
      "It's the honest starting price for your size and film, excluding VAT. Sean confirms the exact figure on WhatsApp once he knows the model — no bait pricing, the tier price is what most cars pay.",
  },
  {
    question: "What shades are legal in the UAE?",
    answer:
      "Up to 50% darkness on side and rear windows for private cars. Everything we install is within legal limits — Sean will tell you the darkest legal option before anything goes on the glass.",
  },
  {
    question: "Does darker tint mean a cooler cabin?",
    answer:
      "No — heat rejection comes from the ceramic layers, not the darkness. A light STEK ceramic film rejects more heat than a cheap dark dyed film. That's why the tier changes the price, not the shade.",
  },
  {
    question: "How long does it take?",
    answer:
      "Around 3 hours for the full car — every window plus the free sun-strip. Wait at the studio or drop the car and collect it the same day.",
  },
];

const phoneDigits = (value: string) => value.replace(/\D/g, "");

const isLikelyRealPhone = (value: string) => {
  const digits = phoneDigits(value);
  const local = digits.startsWith("971") ? digits.slice(3) : digits;
  if (!local) return false;
  if (/^(\d)\1+$/.test(local)) return false;
  if (digits.startsWith("971")) return /^5\d{8}$/.test(local);
  return digits.length >= 10 && digits.length <= 15 && local.length >= 7;
};

const formatAED = (value: number) => `AED ${value.toLocaleString("en-AE")}`;

const buildWhatsAppUrl = (message: string) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

const TintDubaiFastFunnel = () => {
  // Sedan + Smart preselected: a price is on screen before the first tap.
  const [size, setSize] = useState<TintSize>("Medium");
  const [tier, setTier] = useState<TintTier>("smart");
  const [phone, setPhone] = useState("");
  const [phoneStatus, setPhoneStatus] = useState<
    "idle" | "saving" | "saved" | "invalid" | "error"
  >("idle");
  const metaLeadFiredRef = useRef(false);

  const funnelContext = useMemo(
    () =>
      createFunnelTrackingContext({
        funnelName: "tint_meta_2026h2",
        landingPageVariant: "tint_fast_v1",
        defaultSourcePlatform: "meta",
      }),
    [],
  );

  const price = TINT_PRICE_TABLE[tier][size];
  const anchor = anchorFor(price);
  const savings = anchor - price;
  const selectedTier = tierOptions.find((option) => option.value === tier)!;
  const selectedSize = sizeOptions.find((option) => option.value === size)!;

  const buildPayload = useCallback(
    () => ({
      vehicle_size: size,
      package_id: tier,
      package_name: selectedTier.name,
      list_price: anchor,
      discount_savings: savings,
      estimate_value: price,
      final_price: price,
      service_price: price,
    }),
    [anchor, price, savings, selectedTier, size, tier],
  );

  const trackEvent = useCallback(
    (eventName: string, payload: Record<string, unknown> = {}) => {
      trackFunnelEvent({ eventName, context: funnelContext, payload });
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
    updatePageSEO("tint-dubai", {
      title: "Ceramic Window Tint Dubai | From AED 649 | Grand Touch",
      description:
        "See your ceramic window tint price instantly — STEK film, legal shades, warranty registered, installed in ~3 hours in Dubai. WhatsApp Sean to book.",
      keywords:
        "window tint dubai, ceramic tint dubai, car tinting dubai, tint price dubai, STEK tint dubai",
      ogTitle: "Ceramic Window Tint Dubai — See Your Price Instantly",
      ogDescription:
        "STEK ceramic tint with your price on screen in one tap. Installed in ~3 hours, warranty registered.",
    });
    trackEvent("lp_view", { calculator_type: "fast_tint" });
    initTikTokPixel({ pixelIds: TINT_TIKTOK_PIXEL_IDS });
    trackTikTokEvent(
      "ViewContent",
      {
        contents: [TINT_TIKTOK_CONTENT],
        content_name: TINT_TIKTOK_CONTENT.content_name,
        content_category: TINT_TIKTOK_CONTENT.content_category,
        value: 1499,
        currency: "AED",
      },
      { pixelIds: TINT_TIKTOK_PIXEL_IDS },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fireLeadOnce = useCallback(
    (payload: Record<string, unknown>) => {
      if (metaLeadFiredRef.current) return;
      metaLeadFiredRef.current = true;
      trackMetaStandardEvent("Lead", payload);
      trackTikTokEvent(
        "Lead",
        {
          contents: [TINT_TIKTOK_CONTENT],
          content_name: TINT_TIKTOK_CONTENT.content_name,
          content_category: TINT_TIKTOK_CONTENT.content_category,
          value: price,
          currency: "AED",
        },
        { pixelIds: TINT_TIKTOK_PIXEL_IDS },
      );
    },
    [price, trackMetaStandardEvent, trackTikTokEvent],
  );

  const whatsAppMessage = useMemo(
    () =>
      [
        "Hi Sean, I want the tint offer from the tint page.",
        `Setup: ${selectedTier.name} on ${selectedSize.label}.`,
        `My price: ${formatAED(price)} (20% online offer applied, excl. VAT).`,
        "Can you confirm my slot and the free sun-strip?",
      ].join(" "),
    [price, selectedSize, selectedTier],
  );

  const handleWhatsApp = (placement: string) => {
    const metaPayload = {
      content_name: TINT_TIKTOK_CONTENT.content_name,
      content_category: "Tint",
      button_location: placement,
      value: price,
      currency: "AED",
    };
    trackMetaStandardEvent("Contact", metaPayload);
    trackTikTokEvent(
      "Contact",
      {
        content_name: TINT_TIKTOK_CONTENT.content_name,
        content_category: TINT_TIKTOK_CONTENT.content_category,
        button_location: placement,
        value: price,
        currency: "AED",
      },
      { pixelIds: TINT_TIKTOK_PIXEL_IDS },
    );
    fireLeadOnce(metaPayload);
    trackEvent("whatsapp_click", { cta_location: placement, ...buildPayload() });
    window.open(buildWhatsAppUrl(whatsAppMessage), "_blank", "noopener,noreferrer");
  };

  const handlePhoneSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const cleaned = phone.trim();
    if (!isLikelyRealPhone(cleaned)) {
      setPhoneStatus("invalid");
      return;
    }
    if (phoneStatus === "saving" || phoneStatus === "saved") return;

    setPhoneStatus("saving");
    trackEvent("lead_form_submit_attempt", {
      form_type: "fast_phone_capture",
      ...buildPayload(),
      has_phone: true,
    });

    const result = await captureLeadSnapshot({
      snapshotType: "submit",
      context: funnelContext,
      fullName: "",
      phone: cleaned,
      vehicleModel: "",
      payload: {
        ...buildPayload(),
        service_name: "Tint Fast Funnel - Phone Capture",
        preferred_contact: "whatsapp_callback",
      },
    });

    if (!result.ok) {
      setPhoneStatus("error");
      trackEvent("lead_save_failed", {
        capture_location: "fast_phone_capture",
        reason: ("reason" in result ? result.reason : null) ?? "unknown",
        ...buildPayload(),
      });
      return;
    }

    setPhoneStatus("saved");
    trackEvent("lead_form_submitted", {
      form_type: "fast_phone_capture",
      ...buildPayload(),
    });
    fireLeadOnce({
      content_name: TINT_TIKTOK_CONTENT.content_name,
      content_category: "Tint",
      value: price,
      currency: "AED",
    });
    await identifyTikTokUser(
      { phoneNumber: cleaned, externalId: funnelContext.visitorId },
      { pixelIds: TINT_TIKTOK_PIXEL_IDS },
    );
    trackTikTokSubmitForm(
      {
        contents: [TINT_TIKTOK_CONTENT],
        content_name: TINT_TIKTOK_CONTENT.content_name,
        content_category: TINT_TIKTOK_CONTENT.content_category,
        value: price,
        currency: "AED",
      },
      { pixelIds: TINT_TIKTOK_PIXEL_IDS },
    );
  };

  const selectSize = (next: TintSize) => {
    setSize(next);
    trackEvent("guided_step_completed", { step_name: "size", vehicle_size: next });
  };

  const selectTier = (next: TintTier) => {
    setTier(next);
    trackEvent("guided_step_completed", { step_name: "package", package_id: next });
  };

  return (
    <div className="min-h-screen bg-[#070707] pb-28 text-white md:pb-10">
      <main className="mx-auto w-full max-w-xl px-4 pt-5 sm:pt-8">
        {/* ── Compact trust header ─────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.08em]">
          <span className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.05] px-2 py-1">
            <Star className="h-3 w-3 fill-current text-[#fbbc05]" />
            Google 4.9
          </span>
          <span className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-1">
            STEK authorised installer
          </span>
          <span className="rounded-full border border-[#f7b52b]/25 bg-[#f7b52b]/10 px-2 py-1 text-[#f7b52b]">
            20% online offer applied
          </span>
        </div>

        <h1 className="mt-3 text-[1.7rem] font-black leading-[1.05] tracking-tight sm:text-4xl">
          Ceramic window tint.
          <span className="block text-[#f7b52b]">Your price is below.</span>
        </h1>
        <p className="mt-2 text-xs leading-5 text-slate-400 sm:text-sm">
          Tap your car size — the price updates instantly. Legal shades, STEK warranty
          registered, installed in ~3 hours.
        </p>

        {/* ── Size chips ───────────────────────────────────────────────── */}
        <div className="mt-4 grid grid-cols-4 gap-1.5 sm:gap-2">
          {sizeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => selectSize(option.value)}
              className={cn(
                "rounded-xl border px-1.5 py-2.5 text-center transition",
                size === option.value
                  ? "border-[#f7b52b] bg-[#f7b52b]/15"
                  : "border-white/15 bg-white/[0.04] hover:border-[#f7b52b]/50",
              )}
            >
              <span
                className={cn(
                  "block text-xs font-black sm:text-sm",
                  size === option.value ? "text-[#f7b52b]" : "text-white",
                )}
              >
                {option.label}
              </span>
              <span className="mt-0.5 block text-[9px] font-semibold text-slate-500 sm:text-[10px]">
                {option.example}
              </span>
            </button>
          ))}
        </div>

        {/* ── Film tiers with live prices ──────────────────────────────── */}
        <div className="mt-3 grid gap-2">
          {tierOptions.map((option) => {
            const tierPrice = TINT_PRICE_TABLE[option.value][size];
            const tierAnchor = anchorFor(tierPrice);
            const isSelected = tier === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => selectTier(option.value)}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-2xl border px-3.5 py-3 text-left transition",
                  isSelected
                    ? "border-[#f7b52b] bg-[#f7b52b]/10 ring-1 ring-[#f7b52b]/40"
                    : "border-white/12 bg-white/[0.035] hover:border-[#f7b52b]/55",
                )}
              >
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "text-sm font-black sm:text-base",
                        isSelected ? "text-[#f7b52b]" : "text-white",
                      )}
                    >
                      {option.name}
                    </span>
                    {option.badge ? (
                      <span className="rounded-full bg-[#25D366]/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-[#25D366]">
                        {option.badge}
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-0.5 block text-[11px] font-semibold text-slate-400">
                    {option.spec}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-[11px] font-bold text-white/40 line-through">
                    {formatAED(tierAnchor)}
                  </span>
                  <span
                    className={cn(
                      "block text-lg font-black tabular-nums sm:text-xl",
                      isSelected ? "text-[#25D366]" : "text-white",
                    )}
                  >
                    {formatAED(tierPrice)}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Selected price + conversion block ────────────────────────── */}
        <div className="mt-4 rounded-[24px] border-2 border-[#25D366]/50 bg-[radial-gradient(circle_at_top_left,rgba(37,211,102,0.14),transparent_45%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(8,8,8,0.95))] p-4 shadow-[0_0_32px_rgba(37,211,102,0.14)] sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50">
                Your price today · {selectedSize.label} · {selectedTier.name}
              </p>
              <p className="mt-1 text-4xl font-black tracking-tight text-[#25D366] sm:text-5xl">
                {formatAED(price)}
              </p>
              <p className="mt-1 text-[11px] font-semibold text-slate-400">
                <span className="line-through">{formatAED(anchor)}</span>
                <span className="ml-1.5 text-[#25D366]">save {formatAED(savings)}</span>
                <span className="ml-1.5">· excl. VAT</span>
              </p>
            </div>
            <BadgePercent className="h-10 w-10 shrink-0 text-[#25D366]/70" />
          </div>

          <ul className="mt-3 space-y-1.5 border-t border-white/10 pt-3">
            {includedPerks.map((perk) => (
              <li
                key={perk.text}
                className="flex items-center gap-2 text-xs font-semibold text-slate-200"
              >
                <perk.icon className="h-3.5 w-3.5 shrink-0 text-[#25D366]" />
                {perk.text}
              </li>
            ))}
          </ul>

          <Button
            type="button"
            size="lg"
            onClick={() => handleWhatsApp("price_card")}
            className="mt-4 h-13 w-full gap-2 bg-[#25D366] py-3.5 text-base font-black text-white shadow-[0_18px_48px_rgba(37,211,102,0.3)] hover:bg-[#20bf5d]"
          >
            <MessageCircle className="h-5 w-5" />
            WhatsApp Sean — {formatAED(price)}
          </Button>
          <p className="mt-1.5 text-center text-[10px] font-semibold text-slate-500">
            Opens WhatsApp with this exact build pre-written · Sean replies fast
          </p>

          <div className="mt-3 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
            <span className="h-px flex-1 bg-white/10" />
            or get it by text
            <span className="h-px flex-1 bg-white/10" />
          </div>

          {phoneStatus === "saved" ? (
            <p className="mt-3 flex items-center gap-2 rounded-xl border border-[#25D366]/40 bg-[#25D366]/10 px-3 py-2.5 text-xs font-bold text-[#25D366]">
              <BadgeCheck className="h-4 w-4 shrink-0" />
              Done — Sean will WhatsApp you this price shortly.
            </p>
          ) : (
            <form onSubmit={handlePhoneSubmit} className="mt-3">
              <div className="flex gap-2">
                <div className="min-w-0 flex-1">
                  <PhoneInputWithCountry
                    value={phone}
                    onChange={(value) => {
                      setPhone(value);
                      if (phoneStatus === "invalid" || phoneStatus === "error") {
                        setPhoneStatus("idle");
                      }
                    }}
                    placeholder="50 123 4567"
                    className="border-white/20 bg-white/[0.04]"
                    ariaLabel="Your WhatsApp number"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={phoneStatus === "saving"}
                  className="h-11 shrink-0 bg-[#f7b52b] px-4 text-sm font-black text-black hover:bg-[#ffc94f] disabled:opacity-60"
                >
                  {phoneStatus === "saving" ? "Saving…" : "Send price"}
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
              {phoneStatus === "invalid" ? (
                <p className="mt-1.5 text-[11px] font-semibold text-red-300">
                  Please enter a valid UAE WhatsApp number.
                </p>
              ) : null}
              {phoneStatus === "error" ? (
                <p className="mt-1.5 text-[11px] font-semibold text-amber-300">
                  Couldn't save just now — tap the WhatsApp button above instead.
                </p>
              ) : null}
              <p className="mt-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                WhatsApp number only · No spam · Price locked 14 days
              </p>
            </form>
          )}
        </div>

        {/* ── Compact FAQ ──────────────────────────────────────────────── */}
        <section className="mt-8 pb-8">
          <h2 className="text-lg font-black tracking-tight sm:text-xl">
            Quick answers
          </h2>
          <Accordion type="single" collapsible className="mt-2">
            {fastFaqs.map((faq, index) => (
              <AccordionItem key={faq.question} value={`faq-${index}`} className="border-white/10">
                <AccordionTrigger className="text-left text-sm font-black text-white hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-6 text-slate-300">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <p className="mt-4 flex items-center gap-2 text-[11px] font-semibold text-slate-500">
            <Check className="h-3.5 w-3.5 text-[#25D366]" />
            Grand Touch Auto · DIP 2, Dubai · STEK-authorised studio
          </p>
        </section>
      </main>

      {/* ── Mobile sticky WhatsApp bar ─────────────────────────────────── */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black/90 px-3 py-2 backdrop-blur md:hidden">
        <Button
          type="button"
          onClick={() => handleWhatsApp("mobile_sticky")}
          className="h-12 w-full gap-2 bg-[#25D366] text-sm font-black text-white hover:bg-[#20bf5d]"
        >
          <MessageCircle className="h-4 w-4" />
          WhatsApp Sean — {formatAED(price)}
        </Button>
      </div>
    </div>
  );
};

export default TintDubaiFastFunnel;
