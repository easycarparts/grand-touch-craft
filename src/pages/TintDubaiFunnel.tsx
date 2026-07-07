import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  Gift,
  Lock,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Star,
  Sun,
  Truck,
} from "lucide-react";

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
 * Meta-ads ceramic tint funnel (2026 H2). Clone of the proven PPF price-builder
 * mechanic (live price + bonus-lock phone capture + WhatsApp handoff), applied
 * to window tint. Meta pixel only — NO Google Ads conversions fire here.
 */

type TintSize = "Small" | "Medium" | "SUV";
type TintPackageId = "essential" | "smart" | "nex";

const WHATSAPP_NUMBER = "971567191045";
const WINDSHIELD_ADDON_PRICE = 499;

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

const sizeChoices: Array<{ value: TintSize; label: string; example: string }> = [
  { value: "Small", label: "Small", example: "A45 / Golf / 3 Series" },
  { value: "Medium", label: "Medium", example: "E-Class / 5 Series" },
  { value: "SUV", label: "SUV / 4x4", example: "Patrol / Defender / Cayenne" },
];

const tintPackages: Array<{
  id: TintPackageId;
  name: string;
  prices: Record<TintSize, number>;
  points: string[];
  badge?: string;
}> = [
  {
    id: "essential",
    name: "Action Essential",
    prices: { Small: 699, Medium: 799, SUV: 899 },
    points: ["Good heat rejection", "Basic warranty", "Budget pick"],
  },
  {
    id: "smart",
    name: "STEK Smart Ceramic",
    prices: { Small: 1199, Medium: 1399, SUV: 1599 },
    points: ["Ceramic heat rejection", "Crystal night clarity", "Strong STEK warranty"],
    badge: "POPULAR",
  },
  {
    id: "nex",
    name: "STEK Nex Premium",
    prices: { Small: 2799, Medium: 2999, SUV: 3299 },
    points: ["Maximum IR heat rejection", "Best night clarity", "Premium STEK warranty"],
  },
];

const lockedBonuses = [
  { icon: Sparkles, text: "Free sun-strip visor upgrade" },
  { icon: Truck, text: "Free pickup & drop-off across Dubai" },
  { icon: BadgeCheck, text: "Price locked for 14 days" },
];

const comparisonRows: Array<{ feature: string; values: [string, string, string] }> = [
  { feature: "Heat rejection", values: ["Good", "Better", "Best"] },
  { feature: "Night clarity", values: ["Standard", "Crystal", "Best-in-class"] },
  { feature: "UV protection", values: ["99%", "99%", "99%"] },
  { feature: "Warranty", values: ["Basic", "Strong", "Premium"] },
  { feature: "Best for", values: ["Budget", "Daily driving", "Luxury & family"] },
];

const whyGrandTouch = [
  { icon: ShieldCheck, text: "STEK-authorised installer" },
  { icon: BadgeCheck, text: "The same studio Dubai trusts for 10k+ PPF installs" },
  { icon: Star, text: "4.9 on Google (77 reviews)" },
  { icon: Truck, text: "Free pickup across Dubai" },
];

const TintDubaiFunnel = () => {
  const [size, setSize] = useState<TintSize>("Medium");
  const [packageId, setPackageId] = useState<TintPackageId>("smart");
  const [windshield, setWindshield] = useState(false);
  const [vehicle, setVehicle] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneCapturedAt, setPhoneCapturedAt] = useState<string | null>(null);
  // One Meta pixel Lead per session — repeat captures must not double-count.
  const metaLeadFiredRef = useRef(false);
  const builderRef = useRef<HTMLDivElement>(null);

  const funnelContext = useMemo(
    () =>
      createFunnelTrackingContext({
        funnelName: "tint_meta_2026h2",
        landingPageVariant: "tint_meta_2026h2",
        defaultSourcePlatform: "meta",
      }),
    [],
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

  const selectedPackage = tintPackages.find((pkg) => pkg.id === packageId) ?? tintPackages[1];
  const basePrice = selectedPackage.prices[size];
  const totalPrice = basePrice + (windshield ? WINDSHIELD_ADDON_PRICE : 0);

  const buildPayload = useCallback(
    () => ({
      package_id: packageId,
      package_name: selectedPackage.name,
      vehicle_size: size,
      windshield_addon: windshield,
      estimate_value: totalPrice,
      final_price: totalPrice,
      service_price: totalPrice,
      vehicle: vehicle.trim() || undefined,
    }),
    [packageId, selectedPackage.name, size, windshield, totalPrice, vehicle],
  );

  useEffect(() => {
    updatePageSEO("tint-dubai", {
      title: "Ceramic Window Tint Dubai | Installed in 3 Hours | Grand Touch",
      description:
        "Ceramic window tint in Dubai by a STEK-authorised studio — heat rejection you feel on day one, legal shades, traceable warranty, from AED 1,199. Installed in ~3 hours.",
      keywords:
        "window tint dubai, ceramic tint dubai, car tinting dubai, STEK tint dubai, heat rejection tint, tint price dubai",
      ogTitle: "Ceramic Window Tint Dubai — Installed in 3 Hours",
      ogDescription:
        "STEK-authorised ceramic tint from AED 1,199. Legal shades, traceable warranty, free pickup across Dubai.",
    });

    trackEvent("lp_view", { calculator_type: "tint_meta_builder" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scrollToBuilder = (placement: string) => {
    trackEvent("tint_builder_cta_click", { cta_location: placement });
    builderRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleLockSlot = useCallback(async () => {
    const cleaned = phone.trim();
    if (!isLikelyRealPhone(cleaned)) return;
    if (phoneCapturedAt === cleaned) return;

    setPhoneCapturedAt(cleaned);
    trackEvent("guided_phone_captured", {
      capture_location: "tint_slot_lock",
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
        service_name: "Tint Meta 2026H2 - Slot Lock",
        package: selectedPackage.name,
        size,
        price: totalPrice,
      },
    });

    if (result.ok) {
      if (!metaLeadFiredRef.current) {
        metaLeadFiredRef.current = true;
        trackMetaStandardEvent("Lead", {
          content_name: "Tint Dubai Funnel",
          content_category: "Tint",
          value: totalPrice,
          currency: "AED",
        });
      }
    } else {
      trackEvent(
        "lead_save_failed",
        {
          capture_location: "tint_slot_lock",
          reason: ("reason" in result ? result.reason : null) ?? "unknown",
          ...buildPayload(),
        },
        { emitToTagManagers: false },
      );
    }
  }, [
    buildPayload,
    funnelContext,
    phone,
    phoneCapturedAt,
    selectedPackage.name,
    size,
    totalPrice,
    trackEvent,
    trackMetaStandardEvent,
    vehicle,
  ]);

  const whatsAppMessage = useMemo(() => {
    const carPart = vehicle.trim() ? ` ${vehicle.trim()}` : "";
    const windshieldPart = windshield ? ", + windshield" : "";
    return `Hi Sean, I built a tint quote: ${selectedPackage.name} on ${size}${carPart}${windshieldPart}. Total ${formatAED(totalPrice)}. Can you confirm a slot this week?`;
  }, [selectedPackage.name, size, totalPrice, vehicle, windshield]);

  const handleWhatsApp = (placement: string) => {
    trackMetaStandardEvent("Contact", {
      content_name: "Tint Dubai Funnel",
      content_category: "Tint",
      button_location: placement,
      value: totalPrice,
      currency: "AED",
    });
    trackEvent(
      "whatsapp_click",
      { cta_location: placement, ...buildPayload() },
      { emitToTagManagers: false },
    );
    window.open(buildWhatsAppUrl(whatsAppMessage), "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-[#080808] pb-24 text-white md:pb-0">
      <main className="mx-auto w-full max-w-3xl px-4 pt-8 sm:pt-12">
        {/* ── Compact hero ────────────────────────────────────────────── */}
        <header>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#f7b52b] sm:text-xs">
            STEK-Authorised Studio — Dubai
          </p>
          <h1 className="mt-2 text-3xl font-black leading-tight tracking-tight sm:text-5xl">
            Ceramic Tint, Installed in 3 Hours.
          </h1>
          <p className="mt-3 max-w-xl text-sm font-semibold text-slate-300 sm:text-base">
            Heat rejection you can feel on day one. Legal shades, traceable STEK warranty, from
            AED 1,199.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs font-black">
              <Star className="h-3 w-3 fill-current text-[#fbbc05]" />
              Google 4.9
            </span>
            <span className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs font-black">
              <ShieldCheck className="h-3 w-3 text-[#f7b52b]" />
              STEK Authorised
            </span>
            <span className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs font-black">
              <Truck className="h-3 w-3 text-[#25D366]" />
              Free pickup across Dubai
            </span>
          </div>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button
              type="button"
              size="lg"
              onClick={() => scrollToBuilder("hero")}
              className="h-12 gap-2 bg-[#f7b52b] px-5 text-sm font-black text-black hover:bg-[#ffc94f] sm:text-base"
            >
              Build my tint price
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="lg"
              onClick={() => handleWhatsApp("hero")}
              className="h-12 gap-2 bg-[#25D366] px-5 text-sm font-black text-white hover:bg-[#20bf5d] sm:text-base"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp Sean
            </Button>
          </div>
        </header>

        {/* ── Builder ─────────────────────────────────────────────────── */}
        <section ref={builderRef} className="mt-10 scroll-mt-6 sm:mt-14">
          {/* Live price panel — the headline act, updates with every tap. */}
          <div className="rounded-2xl border border-[#f7b52b]/30 bg-[linear-gradient(180deg,rgba(247,181,43,0.10),rgba(0,0,0,0.25))] p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#f7b52b] sm:text-xs">
                Your tint price — live
              </p>
              <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/30 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-200">
                <ShieldCheck className="h-3 w-3 text-[#f7b52b]" />
                {selectedPackage.name}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-4xl font-black tracking-tight text-white sm:text-5xl" aria-live="polite">
                {formatAED(totalPrice)}
              </span>
            </div>
            <p className="mt-1.5 text-[11px] font-semibold text-slate-300 sm:text-xs">
              Installed in ~3 hours · Legal shades · excl. VAT
            </p>
          </div>

          <div className="mt-4 space-y-4">
            {/* Car size */}
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/55">Car size</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {sizeChoices.map((choice) => (
                  <button
                    key={choice.value}
                    type="button"
                    onClick={() => {
                      setSize(choice.value);
                      trackEvent("tint_size_selected", { vehicle_size: choice.value });
                    }}
                    className={cn(
                      "rounded-xl border px-3 py-2.5 text-left transition",
                      size === choice.value
                        ? "border-[#f7b52b] bg-[#f7b52b]/15"
                        : "border-white/15 bg-white/[0.04] hover:border-[#f7b52b]/50",
                    )}
                  >
                    <span
                      className={cn(
                        "block text-sm font-black",
                        size === choice.value ? "text-[#f7b52b]" : "text-white",
                      )}
                    >
                      {choice.label}
                    </span>
                    <span className="mt-0.5 block text-[10px] font-semibold text-slate-400">
                      {choice.example}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Packages */}
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/55">Tint package</p>
              <div className="mt-2 space-y-2">
                {tintPackages.map((pkg) => {
                  const active = packageId === pkg.id;
                  return (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => {
                        setPackageId(pkg.id);
                        trackEvent("tint_package_selected", {
                          package_id: pkg.id,
                          package_name: pkg.name,
                          package_price: pkg.prices[size],
                        });
                      }}
                      className={cn(
                        "flex w-full items-start justify-between gap-3 rounded-xl border px-3.5 py-3 text-left transition",
                        active
                          ? "border-[#f7b52b] bg-[#f7b52b]/15"
                          : "border-white/15 bg-white/[0.04] hover:border-[#f7b52b]/50",
                      )}
                    >
                      <span className="min-w-0">
                        <span className="flex items-center gap-2">
                          <span className={cn("text-sm font-black", active ? "text-[#f7b52b]" : "text-white")}>
                            {pkg.name}
                          </span>
                          {pkg.badge ? (
                            <span className="rounded-full bg-[#25D366]/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-[#25D366]">
                              {pkg.badge}
                            </span>
                          ) : null}
                        </span>
                        <span className="mt-0.5 block text-[10px] font-semibold text-slate-400">
                          {pkg.points.join(" · ")}
                        </span>
                      </span>
                      <span className={cn("shrink-0 text-sm font-black", active ? "text-[#f7b52b]" : "text-slate-200")}>
                        {formatAED(pkg.prices[size])}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-[11px] font-semibold text-slate-400">
                Darker does not mean cooler — a lighter ceramic film can reject more heat than a
                dark cheap film. We show you the spec sheet.
              </p>
            </div>

            {/* Windshield add-on */}
            <button
              type="button"
              onClick={() => {
                const next = !windshield;
                setWindshield(next);
                trackEvent("tint_windshield_toggled", { selected: next });
              }}
              className={cn(
                "flex w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-3 text-left transition",
                windshield
                  ? "border-[#f7b52b] bg-[#f7b52b]/15"
                  : "border-white/15 bg-white/[0.04] hover:border-[#f7b52b]/50",
              )}
            >
              <span className="flex items-center gap-2">
                <Sun className={cn("h-4 w-4", windshield ? "text-[#f7b52b]" : "text-slate-400")} />
                <span className={cn("text-sm font-black", windshield ? "text-[#f7b52b]" : "text-white")}>
                  Front windshield film
                </span>
              </span>
              <span className={cn("shrink-0 text-sm font-black", windshield ? "text-[#f7b52b]" : "text-slate-200")}>
                +{formatAED(WINDSHIELD_ADDON_PRICE)}
              </span>
            </button>

            {/* Optional car */}
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/55">
                Your car <span className="normal-case tracking-normal text-slate-500">(optional — sharpens the quote)</span>
              </p>
              <Input
                value={vehicle}
                onChange={(event) => setVehicle(event.target.value)}
                placeholder="e.g. 2026 Range Rover Sport, 2025 Patrol"
                aria-label="Your car"
                className="mt-2 h-12 border-white/20 bg-white/[0.05] text-white placeholder:text-slate-500 focus-visible:border-[#f7b52b]/70 focus-visible:ring-[#f7b52b]/30"
              />
            </div>

            {/* Bonus lock — the capture mechanic that produced the PPF funnel's leads. */}
            <div className="rounded-2xl border border-[#f7b52b]/35 bg-black/30 p-4">
              <p className="flex items-center gap-2 text-sm font-black text-white">
                <Gift className="h-4 w-4 text-[#f7b52b]" />
                Lock a same-week slot + these bonuses onto this build
              </p>
              <ul className="mt-2.5 space-y-1.5">
                {lockedBonuses.map((bonus) => (
                  <li key={bonus.text} className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                    <bonus.icon className="h-3.5 w-3.5 shrink-0 text-[#25D366]" />
                    {bonus.text}
                  </li>
                ))}
              </ul>
              {phoneCapturedAt ? (
                <p className="mt-3 flex items-center gap-2 rounded-xl border border-[#25D366]/40 bg-[#25D366]/10 px-3 py-2.5 text-xs font-bold text-[#25D366]">
                  <BadgeCheck className="h-4 w-4 shrink-0" />
                  Slot & price locked to this build — Sean will WhatsApp you today to confirm.
                </p>
              ) : (
                <>
                  <div className="mt-3">
                    <PhoneInputWithCountry
                      value={phone}
                      onChange={setPhone}
                      onBlur={() => void handleLockSlot()}
                      placeholder="50 123 4567"
                      className="border-[#f7b52b]/30 bg-white/[0.04]"
                      ariaLabel="Phone to lock slot and price"
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={() => void handleLockSlot()}
                    className="mt-2.5 h-12 w-full gap-2 bg-[#f7b52b] text-sm font-black text-black hover:bg-[#e5a622]"
                  >
                    <Lock className="h-4 w-4" />
                    Lock my slot & price
                  </Button>
                  <p className="mt-2 text-center text-[10px] font-semibold text-slate-500">
                    WhatsApp number only — no calls unless you ask. The price stays visible either way.
                  </p>
                </>
              )}
            </div>

            <Button
              type="button"
              onClick={() => handleWhatsApp("builder_panel")}
              className="h-13 w-full gap-2 bg-[#25D366] py-3.5 text-base font-black text-white hover:bg-[#20bf5d]"
            >
              <MessageCircle className="h-5 w-5" />
              WhatsApp Sean this exact tint build
            </Button>
            <p className="text-center text-[10px] font-semibold text-slate-500">
              Opens WhatsApp with your setup and price pre-written — Sean confirms availability same day.
            </p>
          </div>
        </section>

        {/* ── Comparison table ────────────────────────────────────────── */}
        <section className="mt-12 sm:mt-16">
          <h2 className="text-xl font-black tracking-tight sm:text-2xl">Compare the three packages</h2>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full min-w-[560px] text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.04]">
                  <th className="px-3 py-2.5 font-black text-white/55">Feature</th>
                  {tintPackages.map((pkg) => (
                    <th key={pkg.id} className="px-3 py-2.5 font-black text-white">
                      {pkg.name}
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
                {comparisonRows.map((row) => (
                  <tr key={row.feature} className="border-b border-white/5 last:border-b-0">
                    <td className="px-3 py-2.5 font-bold text-slate-400">{row.feature}</td>
                    {row.values.map((value, index) => (
                      <td key={index} className="px-3 py-2.5 font-semibold text-slate-200">
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Trust section ───────────────────────────────────────────── */}
        <section className="mt-12 pb-12 sm:mt-16 sm:pb-20">
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
              onClick={() => scrollToBuilder("trust_section")}
              className="h-12 gap-2 bg-[#f7b52b] px-5 text-sm font-black text-black hover:bg-[#ffc94f]"
            >
              Build my tint price
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="lg"
              variant="ghost"
              onClick={() => handleWhatsApp("trust_section")}
              className="h-12 gap-2 border border-[#25D366]/45 bg-transparent px-5 text-sm font-bold text-[#25D366] hover:bg-[#25D366]/10 hover:text-[#25D366]"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp Sean
            </Button>
          </div>
        </section>
      </main>

      {/* ── Mobile sticky WhatsApp bar ────────────────────────────────── */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black/90 px-3 py-2 backdrop-blur md:hidden">
        <Button
          type="button"
          onClick={() => handleWhatsApp("mobile_sticky")}
          className="h-12 w-full gap-2 bg-[#25D366] text-sm font-black text-white hover:bg-[#20bf5d]"
        >
          <MessageCircle className="h-4 w-4" />
          WhatsApp Sean — {formatAED(totalPrice)}
          <Check className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default TintDubaiFunnel;
