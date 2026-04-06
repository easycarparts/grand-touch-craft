import { useEffect, useMemo, useRef, useState } from "react";
import emailjs from "@emailjs/browser";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import PpfCostCalculatorWidget from "@/components/PpfCostCalculatorWidget";
import { updatePageSEO } from "@/lib/seo";
import logo from "@/assets/logo.svg";
import {
  ArrowRight,
  CheckCircle2,
  MessageCircle,
  PlayCircle,
  ScanSearch,
  ShieldCheck,
  Star,
} from "lucide-react";

type OwnershipStage = "I have the car now" | "Delivery soon" | "Just researching";
type CalculatorSelection = {
  brand: "STEK" | "GYEON";
  warrantyYears: number;
  finish: "Gloss" | "Matte";
  size: "Sports" | "Small" | "Medium" | "SUV";
  coverage: "Front" | "Full Body";
  estimateMin: number;
  stekLine: string | null;
};

const EMAILJS_SERVICE_ID = "service_f2na96a";
const EMAILJS_TEMPLATE_ID = "template_bs1inle";
const EMAILJS_PUBLIC_KEY = "PBrHmtX3m6KZRrwiC";

const OWNERSHIP_STAGES: OwnershipStage[] = [
  "I have the car now",
  "Delivery soon",
  "Just researching",
];

const defaultSelection: CalculatorSelection = {
  brand: "STEK",
  warrantyYears: 10,
  finish: "Gloss",
  size: "Medium",
  coverage: "Full Body",
  estimateMin: 11500,
  stekLine: "ForceShield",
};

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: Array<Record<string, unknown>>;
  }
}

const GoogleWordmark = () => (
  <span aria-label="Google" className="font-semibold tracking-tight">
    <span className="text-[#4285F4]">G</span>
    <span className="text-[#EA4335]">o</span>
    <span className="text-[#FBBC05]">o</span>
    <span className="text-[#4285F4]">g</span>
    <span className="text-[#34A853]">l</span>
    <span className="text-[#EA4335]">e</span>
  </span>
);

const formatAED = (value: number) => `AED ${value.toLocaleString("en-AE")}`;

const PpfDubaiQuote = () => {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("+971");
  const [vehicle, setVehicle] = useState("");
  const [ownershipStage, setOwnershipStage] = useState<OwnershipStage>("I have the car now");
  const [phoneError, setPhoneError] = useState("");
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selection, setSelection] = useState<CalculatorSelection>(defaultSelection);

  const hasTrackedFormStart = useRef(false);
  const hasTrackedEstimate = useRef(false);
  const calculatorRef = useRef<HTMLElement | null>(null);

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

  const estimateLabel = useMemo(() => formatAED(selection.estimateMin), [selection.estimateMin]);

  const packageLabel = useMemo(() => {
    const line = selection.stekLine ? ` ${selection.stekLine}` : "";
    return `${selection.brand}${line} ${selection.warrantyYears}-year`;
  }, [selection.brand, selection.stekLine, selection.warrantyYears]);

  const whatsAppUrl = useMemo(() => {
    const lines = [
      "Hi Sean, I want a PPF quote from Grand Touch.",
      "",
      `Name: ${name || "-"}`,
      `Phone: ${mobile || "-"}`,
      `Vehicle: ${vehicle || "-"}`,
      `Ownership stage: ${ownershipStage}`,
      `Package: ${packageLabel}`,
      `Car size: ${selection.size}`,
      `Coverage: ${selection.coverage}`,
      `Finish: ${selection.finish}`,
      `Estimate: ${estimateLabel}`,
      "",
      "Please confirm the right package, final pricing, and earliest availability.",
    ];

    if (utmParams.utm_source || utmParams.gclid) {
      lines.push("");
      lines.push(
        `Source: ${utmParams.utm_source || "unknown"} / ${utmParams.utm_campaign || "unknown"}`
      );
    }

    return `https://wa.me/971567191045?text=${encodeURIComponent(lines.join("\n"))}`;
  }, [
    estimateLabel,
    mobile,
    name,
    ownershipStage,
    packageLabel,
    selection.coverage,
    selection.finish,
    selection.size,
    utmParams.gclid,
    utmParams.utm_campaign,
    utmParams.utm_source,
    vehicle,
  ]);

  const trackEvent = (eventName: string, payload: Record<string, unknown> = {}) => {
    if (typeof window === "undefined") return;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: eventName, ...payload });
    if (window.gtag) {
      window.gtag("event", eventName, payload);
    }
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
    if (!formSubmitted || hasTrackedEstimate.current) return;
    hasTrackedEstimate.current = true;
    trackEvent("ppf_estimate_shown", {
      funnel_name: "ppf_dubai_quote",
      package_name: packageLabel,
      size: selection.size,
      coverage: selection.coverage,
      finish: selection.finish,
      estimate_value: selection.estimateMin,
      ...utmParams,
    });
  }, [formSubmitted, packageLabel, selection, utmParams]);

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

  const handleSubmit = async () => {
    trackFormStartIfNeeded();

    if (!name.trim() || !vehicle.trim() || !mobile.trim()) {
      if (!validatePhoneNumber(mobile)) {
        setPhoneError("Use a valid international number, for example +971 50 123 4567.");
      }
      return;
    }

    if (!validatePhoneNumber(mobile)) {
      setPhoneError("Use a valid international number, for example +971 50 123 4567.");
      return;
    }

    setPhoneError("");
    setIsSubmitting(true);

    const emailPayload = {
      customer_name: name,
      customer_phone: mobile,
      vehicle_info: vehicle,
      vehicle_size: selection.size,
      service_name: "PPF Dubai Quote Lead",
      service_category: "PPF Quote Funnel",
      service_price: estimateLabel,
      final_price: estimateLabel,
      discount_code: ownershipStage,
      timestamp: new Date().toISOString(),
    };

    try {
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        emailPayload,
        EMAILJS_PUBLIC_KEY
      );
    } catch (error) {
      console.error("Failed to send quote lead email:", error);
    } finally {
      setIsSubmitting(false);
      setFormSubmitted(true);
      trackEvent("ppf_quote_form_submit", {
        funnel_name: "ppf_dubai_quote",
        ownership_stage: ownershipStage,
        vehicle,
        ...utmParams,
      });
      calculatorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleWhatsAppClick = () => {
    trackEvent("ppf_whatsapp_click", {
      funnel_name: "ppf_dubai_quote",
      package_name: packageLabel,
      size: selection.size,
      coverage: selection.coverage,
      finish: selection.finish,
      estimate_value: selection.estimateMin,
      ...utmParams,
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main>
        <section className="relative overflow-hidden border-b border-border/50 bg-[radial-gradient(circle_at_top,_hsl(38_92%_58%_/_0.18),_transparent_30%),linear-gradient(180deg,hsl(0_0%_8%)_0%,hsl(0_0%_6%)_100%)] px-4 pb-12 pt-10 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-6xl">
            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
              <div className="max-w-3xl">
                <img src={logo} alt="Grand Touch" className="h-10 w-auto" />
                <div className="mt-6 flex flex-wrap gap-2">
                  <Badge variant="secondary" className="gap-2 px-3 py-1.5">
                    <GoogleWordmark />
                    <span>4.9 stars</span>
                  </Badge>
                  <Badge variant="secondary" className="px-3 py-1.5 font-semibold">
                    STEK
                  </Badge>
                  <Badge variant="secondary" className="px-3 py-1.5 font-semibold">
                    GYEON
                  </Badge>
                  <Badge variant="outline" className="px-3 py-1.5">
                    Warranty-registered film
                  </Badge>
                </div>

                <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">
                  Premium PPF in Dubai.
                  <span className="block text-primary">Quoted fast. Installed properly.</span>
                </h1>
                <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
                  Genuine film, clean installs, and a warranty process buyers can actually trust.
                </p>

                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-border/60 bg-card/70 p-4">
                    <p className="text-sm font-semibold">4.9-star trust</p>
                    <p className="mt-1 text-sm text-muted-foreground">Google review slot ready.</p>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-card/70 p-4">
                    <p className="text-sm font-semibold">Certified install</p>
                    <p className="mt-1 text-sm text-muted-foreground">STEK and GYEON certified.</p>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-card/70 p-4">
                    <p className="text-sm font-semibold">Verified warranty</p>
                    <p className="mt-1 text-sm text-muted-foreground">Built to show authenticity.</p>
                  </div>
                </div>
              </div>

              <Card className="p-6 sm:p-8 shadow-card">
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                  Step 1
                </p>
                <h2 className="mt-3 text-2xl font-bold">Get My PPF Estimate</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Your details are emailed to the team the moment you submit.
                </p>

                <div className="mt-6 space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium">Name</label>
                    <Input
                      value={name}
                      onChange={(event) => {
                        trackFormStartIfNeeded();
                        setName(event.target.value);
                      }}
                      placeholder="Your name"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">Mobile number</label>
                    <Input
                      value={mobile}
                      onChange={(event) => {
                        trackFormStartIfNeeded();
                        setMobile(event.target.value);
                        if (phoneError) setPhoneError("");
                      }}
                      placeholder="+971 50 123 4567"
                    />
                    {phoneError ? <p className="mt-2 text-sm text-red-500">{phoneError}</p> : null}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">Vehicle make and model</label>
                    <Input
                      value={vehicle}
                      onChange={(event) => {
                        trackFormStartIfNeeded();
                        setVehicle(event.target.value);
                      }}
                      placeholder="Example: Porsche 911 Turbo S"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">Buying stage</label>
                    <div className="grid gap-2">
                      {OWNERSHIP_STAGES.map((stage) => (
                        <button
                          key={stage}
                          type="button"
                          onClick={() => {
                            trackFormStartIfNeeded();
                            setOwnershipStage(stage);
                          }}
                          className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
                            ownershipStage === stage
                              ? "border-primary bg-primary/10"
                              : "border-border bg-background hover:border-primary/50"
                          }`}
                        >
                          {stage}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button className="w-full" size="lg" onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? "Saving your details..." : "Get My PPF Estimate"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>

                  <p className="text-xs text-muted-foreground">
                    Not the cheapest PPF in Dubai. Built for buyers who care about finish, film
                    authenticity, and long-term results.
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </section>

        <section ref={calculatorRef} className="px-4 py-12 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-6xl">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-muted-foreground">Step 2</p>
                <h2 className="mt-2 text-3xl font-bold">Build the estimate visually</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Same compact layout, now with the visual calculator back in.
                </p>
              </div>
              <div className="hidden rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 md:block">
                <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Current estimate</p>
                <p className="mt-1 text-xl font-semibold">{estimateLabel}</p>
              </div>
            </div>

            <div className="relative">
              {!formSubmitted ? (
                <div className="absolute inset-0 z-20 flex items-center justify-center rounded-3xl border border-border/60 bg-background/78 px-6 text-center backdrop-blur-sm">
                  <div className="max-w-md">
                    <p className="text-lg font-semibold">Submit the short form first</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Once your details are captured, the calculator and the rest of the funnel unlock.
                    </p>
                  </div>
                </div>
              ) : null}

              <div className={!formSubmitted ? "pointer-events-none select-none opacity-40" : ""}>
                <PpfCostCalculatorWidget
                  variant="embedded"
                  showIntro={false}
                  showBrandSelector={false}
                  showActionButtons={false}
                  brandOptions={["STEK"]}
                  defaultBrand="STEK"
                  defaultWarrantyYears={10}
                  onSelectionChange={(nextSelection) => setSelection(nextSelection)}
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a href={whatsAppUrl} target="_blank" rel="noreferrer" className="w-full">
                <Button
                  className="w-full bg-[#25D366] text-white hover:bg-[#20BD5A]"
                  size="lg"
                  onClick={handleWhatsAppClick}
                  disabled={!formSubmitted}
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Send My Quote to WhatsApp
                </Button>
              </a>
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full sm:w-auto"
                onClick={() =>
                  document.getElementById("speak-to-sean")?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  })
                }
              >
                Speak to Sean
              </Button>
            </div>
          </div>
        </section>

        <section className="border-y border-border/50 bg-card/30 px-4 py-12 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-6xl">
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="p-6">
                <div className="flex items-center gap-2">
                  <GoogleWordmark />
                  <span className="text-sm font-semibold">Reviews</span>
                </div>
                <div className="mt-3 flex items-center gap-2 text-primary">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-4 w-4 fill-current" />
                  ))}
                  <span className="text-sm font-semibold">4.9 stars</span>
                </div>
                <h3 className="mt-4 text-xl font-semibold">Customer review slot</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Drop in real Google review snippets and the live review count here.
                </p>
              </Card>

              <Card className="p-6">
                <PlayCircle className="h-8 w-8 text-primary" />
                <h3 className="mt-4 text-xl font-semibold">Transformation video slot</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Add your before-and-after or customer handover videos here.
                </p>
              </Card>

              <Card className="p-6">
                <CheckCircle2 className="h-8 w-8 text-primary" />
                <h3 className="mt-4 text-xl font-semibold">Testimonial slot</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Add concise testimonials focused on finish quality, trust, and delivery.
                </p>
              </Card>
            </div>
          </div>
        </section>

        <section className="px-4 py-14 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-6xl grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <Card className="p-7">
              <p className="text-sm uppercase tracking-[0.25em] text-muted-foreground">Warranty trust</p>
              <h2 className="mt-3 text-3xl font-bold">Show buyers how genuine film is verified</h2>
              <div className="mt-6 space-y-4 text-sm leading-7 text-muted-foreground">
                <p>
                  This section is designed for your real proof: anti-tamper barcode, roll scan, and
                  installer portal registration.
                </p>
                <p>That trust story matters more than generic claims.</p>
              </div>
              <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-4">
                <div className="flex items-start gap-3">
                  <ScanSearch className="mt-1 h-5 w-5 text-primary" />
                  <div>
                    <p className="font-semibold">Proof block placeholder</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Barcode photo, warranty scan screenshot, or your proof video can live here.
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card id="speak-to-sean" className="p-7">
              <p className="text-sm uppercase tracking-[0.25em] text-muted-foreground">Speak to Sean</p>
              <h2 className="mt-3 text-3xl font-bold">Expert review, not endless back-and-forth</h2>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                Sean reviews the vehicle, confirms the right coverage, and keeps the process clean.
              </p>
              <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-1 h-5 w-5 text-primary" />
                  <div>
                    <p className="font-semibold">What gets confirmed</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Correct package, final pricing, install timing, and whether 5, 10, or 12-year
                      STEK is the right fit.
                    </p>
                  </div>
                </div>
              </div>

              <a href={whatsAppUrl} target="_blank" rel="noreferrer" className="mt-6 block">
                <Button className="w-full" size="lg" onClick={handleWhatsAppClick} disabled={!formSubmitted}>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Speak to Sean on WhatsApp
                </Button>
              </a>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
};

export default PpfDubaiQuote;
