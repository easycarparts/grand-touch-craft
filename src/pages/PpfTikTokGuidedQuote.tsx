import { FocusEvent, FormEvent, ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, MessageCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  captureLeadSnapshot,
  createFunnelTrackingContext,
  trackFunnelEvent,
} from "@/lib/funnel-analytics";
import { initTikTokPixel, trackTikTokEvent, trackTikTokSubmitForm } from "@/lib/tiktok-pixel";
import {
  readTikTokGuidedDraft,
  saveTikTokGuidedDraft,
  type TikTokGuidedFinishPreference,
  type TikTokGuidedFlowVariant,
} from "@/lib/tiktok-guided-draft";
import { updatePageSEO } from "@/lib/seo";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.svg";

type GuidedStage = "contact" | "vehicle" | "finish" | "result";
type FinishPreference = TikTokGuidedFinishPreference;
type FlowVariant = TikTokGuidedFlowVariant;

type PhoneCountryOption = {
  dialCode: string;
  label: string;
};

const WHATSAPP_NUMBER = "971567191045";
const DEFAULT_PHONE_COUNTRY_CODE = "971";
const PHONE_COUNTRY_OPTIONS: PhoneCountryOption[] = [
  { dialCode: "971", label: "UAE +971" },
  { dialCode: "44", label: "UK +44" },
  { dialCode: "91", label: "India +91" },
  { dialCode: "92", label: "Pakistan +92" },
  { dialCode: "966", label: "Saudi +966" },
  { dialCode: "974", label: "Qatar +974" },
  { dialCode: "1", label: "US/CA +1" },
];

const FINISH_OPTIONS: Array<{
  value: FinishPreference;
  title: string;
  hint: string;
}> = [
  { value: "Gloss clear PPF", title: "Gloss", hint: "Factory shine" },
  { value: "Matte clear PPF", title: "Matte", hint: "Satin finish" },
  { value: "Colour PPF", title: "Colour", hint: "New look" },
  { value: "Not sure yet", title: "Not sure", hint: "Sean advises" },
];

const INTENT_FIRST_FLOW: GuidedStage[] = ["finish", "vehicle", "contact", "result"];
const PHONE_FIRST_FLOW: GuidedStage[] = ["contact", "vehicle", "finish", "result"];

const resolveFlowVariant = (): FlowVariant => {
  if (typeof window === "undefined") return "intent_first";
  const params = new URLSearchParams(window.location.search);
  return params.get("flow") === "phone_first" ? "phone_first" : "intent_first";
};

const getFlowOrder = (variant: FlowVariant): GuidedStage[] =>
  variant === "phone_first" ? PHONE_FIRST_FLOW : INTENT_FIRST_FLOW;

const normalizeLocalNumber = (value: string) => value.replace(/\D/g, "").replace(/^0+/, "");

const parseVehicleText = (value: string) => {
  const normalized = value.replace(/\s+/g, " ").trim();
  const yearMatch = normalized.match(/\b(19|20)\d{2}\b/);
  const vehicleYear = yearMatch?.[0] ?? "";
  const withoutYear = vehicleYear ? normalized.replace(vehicleYear, "").replace(/\s+/g, " ").trim() : normalized;
  const parts = withoutYear.split(" ").filter(Boolean);

  return {
    vehicleYear,
    vehicleMake: parts[0] ?? "",
    vehicleModel: parts.slice(1).join(" "),
    vehicleLabel: normalized,
  };
};

const buildPhoneNumber = (countryCode: string, localNumber: string) => {
  const cleanCountry = countryCode.replace(/\D/g, "") || DEFAULT_PHONE_COUNTRY_CODE;
  const cleanLocal = normalizeLocalNumber(localNumber);
  return cleanLocal ? `+${cleanCountry}${cleanLocal}` : `+${cleanCountry}`;
};

const isValidPhoneNumber = (value: string) => /^\+[0-9]{9,}$/.test(value.replace(/\s|-/g, ""));

const getSearchSuffix = () => {
  if (typeof window === "undefined") return "";
  return window.location.search || "";
};

type GuidedFunnelTarget = "full_page" | "calculator" | "reveal_price" | "view_price" | "why_stek";

const getGuidedFunnelPageUrl = (target: GuidedFunnelTarget) => {
  const suffix = getSearchSuffix();
  const hash =
    target === "calculator" || target === "reveal_price" || target === "view_price"
      ? "#quote-calculator"
      : target === "why_stek"
        ? "#why-stek"
        : "";
  const connector = suffix ? `${suffix}&` : "?";
  const revealQuery = target === "reveal_price" || target === "view_price" ? `${connector}guided_reveal=1` : suffix;
  return `/ppf-tiktok-quote-guided/funnel${revealQuery}${hash}`;
};

const openNewTab = (url: string) => {
  if (typeof window === "undefined") return;
  window.open(url, "_blank", "noopener,noreferrer");
};

const TrustPill = ({ children }: { children: ReactNode }) => (
  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold text-white/74">
    {children}
  </div>
);

const ProgressDots = ({
  stage,
  flowOrder,
}: {
  stage: GuidedStage;
  flowOrder: GuidedStage[];
}) => {
  const activeIndex = flowOrder.indexOf(stage);

  return (
    <div className="flex items-center gap-1.5" aria-hidden="true">
      {flowOrder.map((step, index) => (
        <span
          key={step}
          className={cn(
            "h-1.5 rounded-full transition-all",
            index <= activeIndex ? "w-6 bg-[#f6ad1b]" : "w-1.5 bg-white/18",
          )}
        />
      ))}
    </div>
  );
};

export default function PpfTikTokGuidedQuote() {
  const flowVariant = useMemo<FlowVariant>(() => resolveFlowVariant(), []);
  const flowOrder = useMemo<GuidedStage[]>(() => getFlowOrder(flowVariant), [flowVariant]);
  const storedDraft = useMemo(() => readTikTokGuidedDraft(), []);

  const [stage, setStage] = useState<GuidedStage>(() => {
    if (typeof window === "undefined") return "finish";
    const params = new URLSearchParams(window.location.search);
    return params.get("flow") === "phone_first" ? "contact" : "finish";
  });
  const [name, setName] = useState(storedDraft?.fullName ?? "");
  const [countryCode, setCountryCode] = useState(storedDraft?.countryCode || DEFAULT_PHONE_COUNTRY_CODE);
  const [localPhone, setLocalPhone] = useState(storedDraft?.localPhone ?? "");
  const [vehicleText, setVehicleText] = useState(
    storedDraft?.vehicleLabel ||
      [storedDraft?.vehicleYear, storedDraft?.vehicleMake, storedDraft?.vehicleModel]
        .map((part) => part?.trim())
        .filter(Boolean)
        .join(" "),
  );
  const [finishPreference, setFinishPreference] = useState<FinishPreference | "">(storedDraft?.finishPreference ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [saveWarning, setSaveWarning] = useState<string | null>(null);
  const [isKeyboardLikelyOpen, setIsKeyboardLikelyOpen] = useState(false);

  const context = useMemo(
    () =>
      createFunnelTrackingContext({
        funnelName: "ppf_tiktok_guided_quote",
        landingPageVariant: flowVariant === "phone_first" ? "tiktok_guided_phone_first" : "tiktok_guided_intent_first",
        defaultSourcePlatform: "tiktok",
      }),
    [flowVariant],
  );

  const phone = useMemo(() => buildPhoneNumber(countryCode, localPhone), [countryCode, localPhone]);
  const parsedVehicle = useMemo(() => parseVehicleText(vehicleText), [vehicleText]);
  const { vehicleMake, vehicleModel, vehicleYear, vehicleLabel } = parsedVehicle;
  const firstName = useMemo(() => name.trim().split(/\s+/)[0] ?? "", [name]);
  const canContinueContact = name.trim().length >= 2 && isValidPhoneNumber(phone);
  const canContinueVehicle = vehicleText.trim().length >= 4;
  const hasContactDetails = canContinueContact;

  const finalDataStage = flowOrder[flowOrder.length - 2];
  const isContactFinal = finalDataStage === "contact";
  const isFinishFinal = finalDataStage === "finish";

  const advanceFromStage = useCallback(
    (currentStage: GuidedStage) => {
      const idx = flowOrder.indexOf(currentStage);
      const nextStage = idx >= 0 && idx < flowOrder.length - 1 ? flowOrder[idx + 1] : "result";
      setStage(nextStage);
    },
    [flowOrder],
  );

  const goBack = useCallback(
    (currentStage: GuidedStage) => {
      const idx = flowOrder.indexOf(currentStage);
      if (idx > 0) setStage(flowOrder[idx - 1]);
    },
    [flowOrder],
  );

  const trackEvent = useCallback(
    (
      eventName: string,
      payload: Record<string, unknown> = {},
      options: {
        metaStandardEvent?: "PageView" | "Lead" | "Contact";
        metaPayload?: Record<string, unknown>;
        privatePayload?: Record<string, unknown>;
      } = {},
    ) =>
      trackFunnelEvent({
        eventName,
        context,
        payload: { flow_variant: flowVariant, ...payload },
        privatePayload: options.privatePayload,
        metaStandardEvent: options.metaStandardEvent,
        metaPayload: options.metaPayload,
      }),
    [context, flowVariant],
  );

  const saveCurrentDraft = useCallback(() => {
    saveTikTokGuidedDraft({
      flowVariant,
      fullName: name.trim(),
      phone,
      countryCode,
      localPhone,
      vehicleMake: vehicleMake.trim(),
      vehicleModel: vehicleModel.trim(),
      vehicleYear: vehicleYear.trim(),
      vehicleLabel,
      finishPreference,
      sessionId: context.sessionId,
      attribution: context.attribution,
    });
  }, [
    context.attribution,
    context.sessionId,
    countryCode,
    finishPreference,
    flowVariant,
    localPhone,
    name,
    phone,
    vehicleLabel,
    vehicleMake,
    vehicleModel,
    vehicleYear,
  ]);

  useEffect(() => {
    updatePageSEO("ppf-tiktok-guided-quote", {
      title: "Guided PPF Quote Dubai | Grand Touch",
      description: "A short guided PPF quote flow for Dubai drivers who want the right STEK setup with Sean.",
      keywords: "PPF Dubai quote, TikTok PPF Dubai, STEK PPF Dubai, guided PPF quote",
      ogTitle: "Guided PPF Quote Dubai | Grand Touch",
      ogDescription: "Answer a few quick questions and Sean will point you to the right PPF setup.",
      url: "https://www.grandtouchauto.ae/ppf-tiktok-quote-guided",
      image: "/calculator-patrol-gloss.jpg",
    });

    initTikTokPixel();
    trackEvent("lp_view", { page_type: "guided_quote" }, { metaStandardEvent: "PageView" });
  }, [trackEvent]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const root = document.documentElement;
    const updateKeyboardViewport = () => {
      const visualHeight = window.visualViewport?.height ?? window.innerHeight;
      const keyboardInset = window.innerHeight - visualHeight;
      root.style.setProperty("--tiktok-guided-vh", `${visualHeight}px`);
      setIsKeyboardLikelyOpen(keyboardInset > 120);
    };

    updateKeyboardViewport();
    window.visualViewport?.addEventListener("resize", updateKeyboardViewport);
    window.visualViewport?.addEventListener("scroll", updateKeyboardViewport);
    window.addEventListener("resize", updateKeyboardViewport);

    return () => {
      window.visualViewport?.removeEventListener("resize", updateKeyboardViewport);
      window.visualViewport?.removeEventListener("scroll", updateKeyboardViewport);
      window.removeEventListener("resize", updateKeyboardViewport);
      root.style.removeProperty("--tiktok-guided-vh");
    };
  }, []);

  const keepFocusedFieldVisible = useCallback((event: FocusEvent<HTMLElement>) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    window.setTimeout(() => {
      target.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });
    }, 180);
  }, []);

  const recordSnapshot = async (
    snapshotType: "contact" | "vehicle" | "submit",
    payload: Record<string, unknown> = {},
  ) => {
    const result = await captureLeadSnapshot({
      snapshotType,
      context,
      fullName: name.trim(),
      phone,
      vehicleMake: vehicleMake.trim(),
      vehicleModel: vehicleModel.trim(),
      vehicleYear: vehicleYear.trim(),
      payload: {
        guided_stage: stage,
        flow_variant: flowVariant,
        finish_preference: finishPreference || null,
        vehicle_label: vehicleLabel || null,
        ...payload,
      },
    });

    if (!result.ok) {
      setSaveWarning(result.reason);
    } else {
      setSaveWarning(null);
    }
  };

  const fireLeadSubmission = () => {
    trackEvent(
      "lead_form_submitted",
      {
        lead_name: name.trim(),
        lead_phone: phone,
        vehicle_make: vehicleMake.trim(),
        vehicle_model: vehicleModel.trim(),
        vehicle_year: vehicleYear.trim(),
        vehicle_label: vehicleLabel,
        finish_preference: finishPreference,
        content_name: "PPF TikTok Guided Quote Funnel",
        content_type: "lead_form",
        currency: "AED",
        value: 1,
      },
      {
        metaStandardEvent: "Lead",
        metaPayload: {
          content_name: "PPF TikTok Guided Quote Funnel",
          content_type: "lead_form",
          currency: "AED",
          value: 1,
        },
        privatePayload: {
          lead_name: name.trim(),
          lead_phone: phone,
          vehicle_make: vehicleMake.trim(),
          vehicle_model: vehicleModel.trim(),
          vehicle_year: vehicleYear.trim(),
        },
      },
    );
    trackEvent("guided_quote_submitted", {
      lead_name: name.trim(),
      lead_phone: phone,
      vehicle_make: vehicleMake.trim(),
      vehicle_model: vehicleModel.trim(),
      vehicle_year: vehicleYear.trim(),
      vehicle_label: vehicleLabel,
      finish_preference: finishPreference,
    });
    trackTikTokSubmitForm({
      content_name: "PPF TikTok Guided Quote Funnel",
      content_type: "lead_form",
      contents: [
        {
          content_name: "PPF TikTok Guided Quote Funnel",
          content_type: "lead_form",
          currency: "AED",
        },
      ],
      finish_preference: finishPreference,
      vehicle_label: vehicleLabel,
      currency: "AED",
      value: 1,
    });
  };

  const handleContactSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canContinueContact || isSaving) return;

    const isFinal = isContactFinal;
    setIsSaving(true);
    trackEvent("guided_contact_completed", {
      has_name: Boolean(name.trim()),
      phone_country_code: countryCode,
      is_final_step: isFinal,
    });
    saveCurrentDraft();
    await recordSnapshot(isFinal ? "submit" : "contact", {
      completion_depth: "contact",
      is_final_step: isFinal,
      ...(isFinal ? { submitted_from: "guided_quote" } : {}),
    });
    if (isFinal) {
      fireLeadSubmission();
    }
    setIsSaving(false);
    advanceFromStage("contact");
  };

  const handleVehicleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canContinueVehicle || isSaving) return;

    setIsSaving(true);
    trackEvent("guided_vehicle_completed", {
      vehicle_make: vehicleMake.trim(),
      vehicle_model: vehicleModel.trim(),
      vehicle_year: vehicleYear.trim(),
      lead_phone: phone,
    });
    saveCurrentDraft();
    if (hasContactDetails) {
      await recordSnapshot("vehicle", { completion_depth: "vehicle" });
    }
    setIsSaving(false);
    advanceFromStage("vehicle");
  };

  const handleFinishSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!finishPreference || isSaving) return;

    const isFinal = isFinishFinal;
    setIsSaving(true);
    trackEvent("guided_finish_completed", {
      finish_preference: finishPreference,
      is_final_step: isFinal,
    });
    saveCurrentDraft();
    if (isFinal || hasContactDetails) {
      await recordSnapshot(isFinal ? "submit" : "vehicle", {
        completion_depth: "finish",
        is_final_step: isFinal,
        ...(isFinal ? { submitted_from: "guided_quote" } : {}),
      });
    }
    if (isFinal) {
      fireLeadSubmission();
    }
    setIsSaving(false);
    advanceFromStage("finish");
  };

  const handleWhatsAppClick = (placement: string) => {
    const cleanVehicle = vehicleLabel || "my car";
    const parts = [
      `Hi Sean, I came from the TikTok PPF quote page.`,
      name.trim() ? `My name is ${name.trim()}.` : "",
      isValidPhoneNumber(phone) && localPhone.trim() ? `My number is ${phone}.` : "",
      cleanVehicle !== "my car" ? `Car: ${cleanVehicle}.` : "I want to ask about PPF for my car.",
      finishPreference ? `Finish: ${finishPreference}.` : "",
      `Can you advise the right setup?`,
    ].filter(Boolean);

    trackEvent(
      "whatsapp_click",
      {
        cta_location: placement,
        whatsapp_state: stage,
        lead_phone: isValidPhoneNumber(phone) ? phone : undefined,
        vehicle_label: vehicleLabel || undefined,
        finish_preference: finishPreference || undefined,
        content_name: "PPF TikTok Guided Quote Funnel",
        content_type: "lead_form",
        currency: "AED",
        value: 1,
      },
      {
        metaStandardEvent: "Contact",
        metaPayload: {
          content_name: "PPF TikTok Guided Quote Funnel",
          content_type: "lead_form",
          currency: "AED",
          value: 1,
        },
      },
    );
    trackTikTokEvent("Contact", {
      content_name: "PPF TikTok Guided Quote Funnel",
      content_type: "lead_form",
      currency: "AED",
      value: 1,
      cta_location: placement,
    });
    openNewTab(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(parts.join("\n"))}`);
  };

  const openDetailedPage = (target: GuidedFunnelTarget) => {
    const url = getGuidedFunnelPageUrl(target);
    saveCurrentDraft();
    trackEvent(
      target === "calculator" || target === "reveal_price" || target === "view_price"
        ? "guided_funnel_calculator_click"
        : target === "why_stek"
          ? "guided_funnel_why_stek_click"
          : "guided_funnel_full_page_click",
      {
      cta_location: stage,
      target: "guided_funnel",
    });
    trackTikTokEvent("ClickButton", {
      content_name:
        target === "calculator"
          ? "Open guided PPF calculator"
          : target === "reveal_price"
            ? "Reveal guided PPF price"
            : target === "view_price"
              ? "View guided PPF price again"
          : target === "why_stek"
            ? "Open guided STEK section"
            : "Open guided PPF funnel",
      content_type: "lead_form",
      currency: "AED",
      value: 1,
    });
    if (typeof window !== "undefined") {
      window.location.href = url;
    }
  };

  const calculatorDraft = storedDraft?.calculatorSelection;
  const primaryResultTarget: GuidedFunnelTarget = calculatorDraft
    ? calculatorDraft.priceRevealed
      ? "view_price"
      : "reveal_price"
    : "calculator";
  const primaryResultLabel = calculatorDraft
    ? calculatorDraft.priceRevealed
      ? "View my PPF price again"
      : "Reveal my PPF price"
    : "Configure my PPF cost";
  const calculatorSetupLabel = calculatorDraft
    ? [
        calculatorDraft.stekLine ? `${calculatorDraft.brand} ${calculatorDraft.stekLine}` : calculatorDraft.brand,
        calculatorDraft.size,
        calculatorDraft.finish,
        calculatorDraft.coverage,
      ]
        .filter(Boolean)
        .join(" | ")
    : "";
  const compactInputClass =
    "h-12 rounded-xl border-white/12 bg-white/[0.06] text-base font-semibold text-white placeholder:text-white/32";
  const primaryButtonClass =
    "h-12 w-full rounded-xl bg-[#f6ad1b] text-base font-black text-black shadow-[0_14px_34px_rgba(246,173,27,0.22)] hover:bg-[#ffc34a]";
  const secondaryButtonClass = "h-auto min-h-12 w-full rounded-xl px-4 py-3 text-sm font-black leading-5";

  return (
    <main className="min-h-[100svh] bg-[#070705] text-white">
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute left-1/2 top-0 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[#f6ad1b]/16 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[420px] w-[420px] rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      <section
        className={cn(
          "relative mx-auto flex w-full max-w-[460px] flex-col overflow-x-hidden px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4",
          isKeyboardLikelyOpen ? "justify-start" : "min-h-[100svh]",
        )}
        style={{ minHeight: "var(--tiktok-guided-vh, 100svh)" }}
      >
        <div className={cn("flex items-center justify-between gap-4", isKeyboardLikelyOpen ? "mb-3" : "mb-5")}>
          <img src={logo} alt="Grand Touch" className="h-auto w-44 max-w-[58vw]" />
          <ProgressDots stage={stage} flowOrder={flowOrder} />
        </div>

        <div className={cn("flex flex-wrap items-center gap-2", isKeyboardLikelyOpen ? "sr-only" : "mb-4")}>
          <TrustPill>
            <ShieldCheck className="h-3.5 w-3.5 text-[#f6ad1b]" />
            <span>Warranty-registered STEK film</span>
          </TrustPill>
        </div>

        <div className={cn(isKeyboardLikelyOpen ? "mb-3" : "mb-4")}>
          <h1
            className={cn(
              "font-black leading-[0.96] tracking-[-0.055em] text-white",
              isKeyboardLikelyOpen ? "text-[1.65rem]" : "text-[2rem]",
            )}
          >
            {flowVariant === "phone_first" ? "Quick PPF quote." : "Pick a finish."}
          </h1>
          <p className={cn("max-w-sm font-medium text-white/64", isKeyboardLikelyOpen ? "mt-2 text-xs leading-5" : "mt-3 text-sm leading-6")}>
            {flowVariant === "phone_first"
              ? "Name, number, car. Sean replies with the right setup."
              : "Two taps. Then your car. Sean replies with a real quote — not a brochure."}
          </p>
        </div>

        <div
          onFocusCapture={keepFocusedFieldVisible}
          className={cn(
            "relative overflow-hidden border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.075),rgba(14,14,12,0.94))] shadow-[0_24px_64px_rgba(0,0,0,0.44)]",
            isKeyboardLikelyOpen ? "rounded-2xl p-3" : "rounded-[1.5rem] p-4",
          )}
        >
          <div className="relative">
            {stage === "contact" ? (
              <form onSubmit={handleContactSubmit} className={cn(isKeyboardLikelyOpen ? "space-y-3" : "space-y-4")}>
                <div>
                  <h2 className={cn("font-black tracking-[-0.045em]", isKeyboardLikelyOpen ? "text-xl" : "text-2xl")}>
                    {isContactFinal ? "Last step — where do we send the quote?" : "Name and number"}
                  </h2>
                  <p className="mt-1 text-sm leading-5 text-white/58">
                    {isContactFinal ? "Sean WhatsApps you. No spam, no call centre." : "We’ll keep this quick."}
                  </p>
                </div>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-bold text-white">Name</span>
                  <Input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Your name"
                    autoComplete="name"
                    className={compactInputClass}
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-bold text-white">Mobile</span>
                  <div className="grid grid-cols-[106px_1fr] gap-2">
                    <select
                      value={countryCode}
                      onChange={(event) => setCountryCode(event.target.value)}
                      className="h-12 rounded-xl border border-white/12 bg-[#171713] px-2.5 text-xs font-black text-white outline-none focus:border-[#f6ad1b]"
                    >
                      {PHONE_COUNTRY_OPTIONS.map((option) => (
                        <option key={option.dialCode} value={option.dialCode}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <Input
                      value={localPhone}
                      onChange={(event) => setLocalPhone(normalizeLocalNumber(event.target.value))}
                      placeholder="50 123 4567"
                      inputMode="tel"
                      autoComplete="tel-national"
                      className={compactInputClass}
                    />
                  </div>
                  <span className="mt-2 block text-xs leading-5 text-white/48">
                    No leading 0 needed.
                  </span>
                </label>

                <Button
                  type="submit"
                  disabled={!canContinueContact || isSaving}
                  className={primaryButtonClass}
                >
                  {isSaving ? "Saving..." : isContactFinal ? "Get my quote" : "Continue"}
                  <ArrowRight className="h-4 w-4" />
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleWhatsAppClick("guided_contact_skip")}
                  className={cn(secondaryButtonClass, "border-emerald-400/40 bg-emerald-500/8 text-emerald-50 hover:bg-emerald-500/18 hover:text-white")}
                >
                  <MessageCircle className="h-4 w-4" />
                  Prefer WhatsApp? Talk to Sean now
                </Button>

                {flowOrder.indexOf("contact") > 0 ? (
                  <button
                    type="button"
                    onClick={() => goBack("contact")}
                    className="w-full text-sm font-bold text-white/55"
                  >
                    Back
                  </button>
                ) : null}
              </form>
            ) : null}

            {stage === "vehicle" ? (
              <form onSubmit={handleVehicleSubmit} className={cn(isKeyboardLikelyOpen ? "space-y-3" : "space-y-4")}>
                <div>
                  <h2 className={cn("font-black tracking-[-0.045em]", isKeyboardLikelyOpen ? "text-xl" : "text-2xl")}>Which car?</h2>
                  <p className="mt-1 text-sm leading-5 text-white/58">So the quote is not vague.</p>
                </div>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-bold text-white">Car</span>
                  <Input
                    value={vehicleText}
                    onChange={(event) => setVehicleText(event.target.value)}
                    placeholder="2022 Nissan Patrol"
                    autoComplete="off"
                    className={compactInputClass}
                  />
                  <span className="mt-2 block text-xs leading-5 text-white/48">
                    Year, make and model is enough.
                  </span>
                </label>

                <Button
                  type="submit"
                  disabled={!canContinueVehicle || isSaving}
                  className={primaryButtonClass}
                >
                  {isSaving ? "Saving..." : "Next"}
                  <ArrowRight className="h-4 w-4" />
                </Button>

                <button type="button" onClick={() => goBack("vehicle")} className="w-full text-sm font-bold text-white/55">
                  Back
                </button>
              </form>
            ) : null}

            {stage === "finish" ? (
              <form onSubmit={handleFinishSubmit} className={cn(isKeyboardLikelyOpen ? "space-y-3" : "space-y-4")}>
                <div>
                  <h2 className={cn("font-black tracking-[-0.045em]", isKeyboardLikelyOpen ? "text-xl" : "text-2xl")}>Which finish?</h2>
                  <p className="mt-1 text-sm leading-5 text-white/58">
                    {isFinishFinal ? "Pick one. Sean can adjust it later." : "Tap the look you want. Sean can swap it later."}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {FINISH_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFinishPreference(option.value)}
                      className={cn(
                        "rounded-xl border text-left transition",
                        isKeyboardLikelyOpen ? "p-3" : "p-4",
                        finishPreference === option.value
                          ? "border-[#f6ad1b] bg-[#f6ad1b]/14 shadow-[0_14px_34px_rgba(246,173,27,0.16)]"
                          : "border-white/12 bg-white/[0.055] hover:border-white/28",
                      )}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-base font-black text-white">{option.title}</span>
                        {finishPreference === option.value ? <Check className="h-4 w-4 text-[#f6ad1b]" /> : null}
                      </span>
                      <span className="mt-1 block text-xs font-semibold text-white/54">{option.hint}</span>
                    </button>
                  ))}
                </div>

                <Button
                  type="submit"
                  disabled={!finishPreference || isSaving}
                  className={primaryButtonClass}
                >
                  {isSaving ? "Sending..." : isFinishFinal ? "Show my options" : "Continue"}
                  <ArrowRight className="h-4 w-4" />
                </Button>

                {flowOrder.indexOf("finish") > 0 ? (
                  <button
                    type="button"
                    onClick={() => goBack("finish")}
                    className="w-full text-sm font-bold text-white/55"
                  >
                    Back
                  </button>
                ) : null}
              </form>
            ) : null}

            {stage === "result" ? (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-300">Sent</p>
                  <h2 className="mt-2 text-2xl font-black tracking-[-0.04em]">
                    {firstName ? `Sean has it, ${firstName}.` : "Sean has the basics."}
                  </h2>
                  <p className="mt-1 text-sm leading-5 text-white/68">
                    {vehicleLabel ? `${vehicleLabel}. ` : ""}
                    {finishPreference || "PPF"} noted. Have a proper look while Sean prepares your reply.
                  </p>
                </div>

                <Button
                  type="button"
                  onClick={() => openDetailedPage(primaryResultTarget)}
                  className="h-14 w-full rounded-2xl bg-[#f6ad1b] text-base font-black text-black shadow-[0_18px_45px_rgba(246,173,27,0.26)] hover:bg-[#ffc34a]"
                >
                  {primaryResultLabel}
                  <ArrowRight className="h-4 w-4" />
                </Button>
                {calculatorSetupLabel ? (
                  <p className="rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-2 text-center text-xs font-bold leading-5 text-white/58">
                    Saved setup: <span className="text-white/82">{calculatorSetupLabel}</span>
                  </p>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => openDetailedPage("why_stek")}
                  className="h-14 w-full rounded-2xl border-white/15 bg-white/[0.04] text-sm font-black text-white hover:bg-white/[0.08] hover:text-white"
                >
                  Why we chose STEK
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => openDetailedPage("full_page")}
                  className="h-14 w-full rounded-2xl border-white/15 bg-white/[0.04] text-sm font-black text-white hover:bg-white/[0.08] hover:text-white"
                >
                  More information
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <button
                  type="button"
                  onClick={() => handleWhatsAppClick("guided_result_whatsapp")}
                  className="w-full pt-1 text-center text-sm font-bold text-white/55"
                >
                  Or <span className="text-emerald-300 underline underline-offset-4">message Sean on WhatsApp</span>
                </button>
              </div>
            ) : null}

            {saveWarning ? (
              <p className="mt-4 rounded-2xl border border-red-400/30 bg-red-500/10 p-3 text-xs leading-5 text-red-100">
                CRM save warning: {saveWarning}
              </p>
            ) : null}
          </div>
        </div>

        {stage !== "result" ? (
          <div className={cn("flex flex-col items-center text-center font-bold", isKeyboardLikelyOpen ? "mt-3 gap-2" : "mt-4 gap-3")}>
            <button
              type="button"
              onClick={() => handleWhatsAppClick("persistent_below_card")}
              className={cn(
                "w-full rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-4 text-white shadow-[0_14px_36px_rgba(16,185,129,0.12)]",
                isKeyboardLikelyOpen ? "py-2.5 text-sm leading-5" : "py-3 text-base leading-5",
              )}
            >
              Rather just chat?<br />
              <span className={cn("text-emerald-300 underline underline-offset-4", isKeyboardLikelyOpen ? "text-base" : "text-lg")}>
                Message Sean on WhatsApp
              </span>
            </button>
            <button
              type="button"
              onClick={() => openDetailedPage("full_page")}
              className="text-sm text-white/48"
            >
              Want to read first? <span className="text-[#f6ad1b] underline underline-offset-4">View the full page</span>
            </button>
          </div>
        ) : null}

        <p className={cn("mt-auto pt-6 text-center text-[11px] leading-5 text-white/30", isKeyboardLikelyOpen && "hidden")}>
          Grand Touch Auto Dubai
        </p>
      </section>
    </main>
  );
}
