import { useEffect, useMemo, useRef, useState } from "react";
import emailjs from "@emailjs/browser";
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
import PpfCostCalculatorWidget from "@/components/PpfCostCalculatorWidget";
import { updatePageSEO } from "@/lib/seo";
import logo from "@/assets/logo.svg";
import seanIllustration from "../../SEAN.png";
import {
  ArrowRight,
  MessageCircle,
  Maximize2,
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

const BrandTrustBadge = ({
  src,
  alt,
  imgClassName,
}: {
  src: string;
  alt: string;
  imgClassName: string;
}) => (
  <div className="inline-flex items-center rounded-full border border-white/12 bg-white/6 px-3 py-2 shadow-sm backdrop-blur-sm">
    <img src={src} alt={alt} className={imgClassName} loading="lazy" />
  </div>
);

const TrustStars = () => (
  <div className="flex items-center gap-1 text-[#fbbc05]">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star key={star} className="h-4 w-4 fill-current" />
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

const PpfDubaiQuote = () => {
  const [heroFormOpen, setHeroFormOpen] = useState(false);
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
      setHeroFormOpen(false);
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
    <div className="min-h-screen bg-background pb-24 text-foreground md:pb-0">
      <main>
        <section className="relative overflow-hidden border-b border-border/50 bg-[radial-gradient(circle_at_top,_hsl(38_92%_58%_/_0.24),_transparent_32%),radial-gradient(circle_at_15%_25%,rgba(245,158,11,0.12),transparent_26%),radial-gradient(circle_at_85%_20%,rgba(255,255,255,0.08),transparent_18%),linear-gradient(180deg,hsl(0_0%_8%)_0%,hsl(0_0%_5%)_100%)] px-4 pb-12 pt-10 sm:px-6 lg:px-8">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-24 top-16 h-56 w-56 rounded-full bg-primary/12 blur-3xl" />
            <div className="absolute right-[-4rem] top-10 h-64 w-64 rounded-full bg-amber-200/10 blur-3xl" />
            <div className="absolute bottom-[-4rem] left-1/3 h-40 w-40 rounded-full bg-white/5 blur-3xl" />
          </div>
          <div className="container mx-auto max-w-6xl">
            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-stretch">
              <div className="order-1 max-w-3xl lg:col-start-1 lg:row-start-1">
                <img src={logo} alt="Grand Touch" className="h-10 w-auto" />
                <div className="mt-6 flex flex-wrap gap-2">
                  <Badge variant="secondary" className="gap-2 border border-white/10 bg-white/8 px-3 py-1.5 shadow-sm backdrop-blur-sm">
                    <GoogleWordmark />
                    <span>4.9 stars</span>
                  </Badge>
                  <Badge variant="outline" className="border-white/15 bg-black/20 px-3 py-1.5 backdrop-blur-sm">
                    Warranty-registered film
                  </Badge>
                </div>

                <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl">
                  PPF in Dubai
                  <span className="block text-white">you can trust.</span>
                  <span className="block bg-[linear-gradient(180deg,#ffcc63_0%,#f7b52b_55%,#e79a13_100%)] bg-clip-text text-transparent drop-shadow-[0_8px_30px_rgba(247,181,43,0.15)]">
                    Direct with Sean. Installed properly.
                  </span>
                </h1>
                <p className="mt-4 max-w-2xl text-lg text-slate-300">
                  British-owned, trust-led, and built for buyers who care who handles the car, what film is being fitted, and whether the warranty process is real.
                </p>

                <div className="mt-6 grid gap-3 text-sm text-slate-300 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 backdrop-blur-sm">
                    <p className="font-semibold text-white">Direct with Sean</p>
                    <p className="mt-1 text-white/70">No generic sales handoff.</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 backdrop-blur-sm">
                    <p className="font-semibold text-white">British-owned</p>
                    <p className="mt-1 text-white/70">Premium service, cleaner communication.</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 backdrop-blur-sm">
                    <p className="font-semibold text-white">Warranty-verified</p>
                    <p className="mt-1 text-white/70">Authentic film and traceable registration.</p>
                  </div>
                </div>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Dialog open={heroFormOpen} onOpenChange={setHeroFormOpen}>
                    <DialogTrigger asChild>
                      <Button size="lg" className="w-full sm:w-auto">
                        Get My PPF Estimate
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-xl border-primary/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(18,18,18,0.98))] p-6 shadow-[0_35px_120px_rgba(0,0,0,0.65)] backdrop-blur-xl sm:p-8">
                      <DialogHeader>
                        <DialogTitle className="text-2xl">Get My PPF Estimate</DialogTitle>
                        <DialogDescription>
                          Share the basics and the calculator unlocks straight after submission.
                        </DialogDescription>
                      </DialogHeader>

                      <div className="mt-4 space-y-4">
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
                          {phoneError ? <p className="mt-2 text-sm text-red-400">{phoneError}</p> : null}
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
                      </div>
                    </DialogContent>
                  </Dialog>

                  <a href={whatsAppUrl} target="_blank" rel="noreferrer" className="w-full sm:w-auto">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-[#25D366]/35 bg-[#25D366]/10 text-white hover:bg-[#25D366]/18"
                      size="lg"
                      onClick={handleWhatsAppClick}
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Speak to Sean on WhatsApp
                    </Button>
                  </a>

                  {formSubmitted ? (
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full text-white/75 hover:bg-white/5 hover:text-white sm:w-auto"
                      onClick={() =>
                        calculatorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
                      }
                    >
                      Open calculator
                    </Button>
                  ) : null}
                </div>

              </div>

              <Card className="relative order-2 flex h-full min-h-0 flex-col overflow-hidden border-primary/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.025))] p-4 shadow-[0_30px_120px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-6 lg:col-start-2 lg:row-span-2 lg:row-start-1">
                <div className="pointer-events-none absolute inset-0">
                  <div className="absolute -top-12 left-10 h-32 w-32 rounded-full bg-primary/12 blur-3xl" />
                  <div className="absolute right-[-2rem] top-12 h-28 w-28 rounded-full bg-white/6 blur-3xl" />
                </div>
                <div className="relative flex min-h-0 flex-1 flex-col">
                  <div className="flex items-center justify-between gap-3 px-1 pb-5">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary/80">Trusted recent work</p>
                      <p className="mt-2 text-sm text-slate-300">Real jobs, real finishes, and the kind of detail buyers usually ask Sean about before booking.</p>
                    </div>
                    <div className="hidden rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/70 sm:block">
                      9:16 showcase
                    </div>
                  </div>

                  <div className="relative mx-auto mt-auto flex min-h-[640px] w-full max-w-[380px] items-center justify-center overflow-visible py-4">
                    <div className="pointer-events-none absolute inset-0">
                      <div className="absolute left-1/2 top-1/2 h-[520px] w-[260px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/12 blur-3xl" />
                      <div className="absolute left-1/2 top-1/2 h-[420px] w-[220px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/6 blur-[90px]" />
                    </div>

                    <div className="relative rotate-[5deg]">
                      <div className="pointer-events-none absolute -left-[5px] top-[110px] z-20 h-14 w-[4px] rounded-full bg-gradient-to-b from-white/55 via-white/15 to-white/35 shadow-[0_0_12px_rgba(255,255,255,0.16)]" />
                      <div className="pointer-events-none absolute -left-[5px] top-[176px] z-20 h-24 w-[4px] rounded-full bg-gradient-to-b from-white/45 via-white/12 to-white/30 shadow-[0_0_12px_rgba(255,255,255,0.14)]" />
                      <div className="pointer-events-none absolute -right-[5px] top-[154px] z-20 h-28 w-[4px] rounded-full bg-gradient-to-b from-white/45 via-white/12 to-white/30 shadow-[0_0_12px_rgba(255,255,255,0.14)]" />

                      <div className="relative w-[280px] rounded-[3.5rem] bg-[linear-gradient(150deg,#53565d_0%,#212328_12%,#070708_48%,#1f2126_78%,#6a7078_100%)] p-[10px] shadow-[0_45px_120px_rgba(0,0,0,0.62),0_10px_30px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.24),inset_0_-1px_0_rgba(255,255,255,0.10)]">
                        <div className="absolute inset-[1px] rounded-[3.35rem] border border-white/12" />
                        <div className="absolute inset-[8px] rounded-[3rem] border border-white/[0.07]" />

                        <div className="relative overflow-hidden rounded-[2.95rem] bg-black shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]">
                          <div className="pointer-events-none absolute left-1/2 top-3 z-20 flex h-8 w-[118px] -translate-x-1/2 items-center justify-center rounded-full bg-[#050505] shadow-[0_2px_8px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.04)]">
                            <div className="h-1.5 w-12 rounded-full bg-[#141414]" />
                          </div>

                          <video
                            className="aspect-[9/19.5] h-auto w-full object-cover"
                            src="https://res.cloudinary.com/diw6rekpm/video/upload/q_auto/f_auto/v1775556526/Jetour_EDIT_yi001t.mp4"
                            autoPlay
                            muted
                            loop
                            playsInline
                            preload="auto"
                          />

                          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/32 to-transparent px-5 pb-6 pt-14">
                            <p className="text-[11px] uppercase tracking-[0.24em] text-white/60">Grand Touch transformations</p>
                            <p className="mt-2 text-lg font-semibold leading-tight text-white">Premium finish. Trusted handover.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              <div className="order-3 max-w-3xl lg:col-start-1 lg:row-start-2 lg:mt-2">
                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(66,133,244,0.07),rgba(255,255,255,0.03)_28%,rgba(255,255,255,0.02)_100%)] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.25)] backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                      <GoogleWordmark />
                      <TrustStars />
                    </div>
                    <p className="mt-4 text-sm font-semibold">4.9-star trust</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Google-backed social proof for high-intent buyers.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(245,158,11,0.07),rgba(255,255,255,0.03)_28%,rgba(255,255,255,0.02)_100%)] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.25)] backdrop-blur-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <BrandTrustBadge
                        src="/stek-logo.webp"
                        alt="STEK official brand logo"
                        imgClassName="h-6 w-auto object-contain"
                      />
                      <BrandTrustBadge
                        src="/gyeon-logo-purple.png"
                        alt="GYEON official brand logo"
                        imgClassName="h-6 w-auto object-contain brightness-150 saturate-125"
                      />
                    </div>
                    <p className="mt-4 text-sm font-semibold">Certified install</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      STEK and GYEON supplied, installed, and registered properly.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(95,143,121,0.08),rgba(255,255,255,0.03)_28%,rgba(255,255,255,0.02)_100%)] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.25)] backdrop-blur-sm">
                    <div className="inline-flex rounded-xl border border-primary/25 bg-black/40 p-1.5">
                      <div className="w-[88px] rotate-[-10deg] rounded-lg border border-white/15 bg-white px-2 py-1.5 text-black shadow-2xl">
                        <div className="flex items-center justify-between">
                          <span className="rounded bg-[#b73a2f] px-1 py-0.5 text-[8px] font-bold uppercase tracking-[0.16em] text-white">
                            Seal
                          </span>
                          <img
                            src="/stek-logo.webp"
                            alt="STEK warranty label"
                            className="h-2.5 w-auto object-contain invert"
                            loading="lazy"
                          />
                        </div>
                        <div className="mt-1 flex items-start gap-1.5">
                          <div className="grid h-8 w-8 shrink-0 grid-cols-4 gap-[1px] rounded-sm bg-black p-[2px]">
                            {Array.from({ length: 16 }).map((_, index) => (
                              <span
                                key={index}
                                className={index % 3 === 0 ? "bg-white" : "bg-black"}
                              />
                            ))}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[7px] font-semibold uppercase tracking-[0.14em] text-[#b73a2f]">
                              Serial verified
                            </p>
                            <div className="mt-1 h-3 rounded-sm bg-[repeating-linear-gradient(90deg,#111_0_2px,transparent_2px_3px)]" />
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="mt-4 text-sm font-semibold">Verified warranty</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Tamper proof-label, serial, and online warranty.
                    </p>
                  </div>
                </div>
              </div>
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
            <div className="grid gap-6 md:grid-cols-3 md:items-stretch">
              <Card className="flex h-full flex-col border-[#4285F4]/20 bg-[linear-gradient(180deg,rgba(66,133,244,0.07),rgba(255,255,255,0.02)_22%,rgba(255,255,255,0.02)_100%)] p-6">
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
                <h3 className="mt-4 text-xl font-semibold">Mark | Zeekr 001</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  "Top-notch service, Sean. Unreal. Sean picked my car up from Abu Dhabi, kept the
                  whole process easy, and the finish, including the Hermes orange calipers, came
                  out amazing."
                </p>
                <div className="mt-auto">
                  <VideoModalCard
                    title="Mark's Zeekr 001"
                    description="A quick customer delivery clip showing the finished Zeekr 001 and the level of service behind it."
                    videoSrc="https://res.cloudinary.com/diw6rekpm/video/upload/q_auto/f_auto/v1775562589/Mark_Zeekr_conzdp.mp4"
                    posterSrc="/mark-zeekr-001.png"
                    eyebrow="Zeekr 001 PPF edit"
                  />
                </div>
              </Card>

              <Card className="flex h-full flex-col border-[#f59e0b]/20 bg-[linear-gradient(180deg,rgba(245,158,11,0.08),rgba(255,255,255,0.02)_24%,rgba(255,255,255,0.02)_100%)] p-6">
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
                <h3 className="mt-4 text-xl font-semibold">Recent Grand Touch work</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Four G700 builds finished with STEK PPF in gloss and matte options, 10-year
                  warranty coverage, and selected custom paintwork details by the Grand Touch team.
                </p>
                <div className="mt-auto">
                  <VideoModalCard
                    title="Recent Grand Touch work"
                    description="A multi-car G700 showcase featuring STEK gloss and matte colour PPF installs, warranty-backed packages, and custom finish details."
                    videoSrc="https://res.cloudinary.com/diw6rekpm/video/upload/v1775556526/Jetour_EDIT_yi001t.mp4"
                    posterSrc="/g700-orange.png"
                    eyebrow="G700 | STEK gloss & matte"
                  />
                </div>
              </Card>

              <Card className="flex h-full flex-col border-[#5f8f79]/20 bg-[linear-gradient(180deg,rgba(95,143,121,0.09),rgba(255,255,255,0.02)_24%,rgba(255,255,255,0.02)_100%)] p-6">
                <div className="mt-4 flex items-start justify-between gap-4">
                  <div className="min-w-0">
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
                  "I left my Jetour T2 with Sean for a matte green colour PPF transformation and
                  couldn't be happier. Great finish, smooth process, and a team I was happy to
                  trust with my car."
                </p>
                <div className="mt-auto">
                  <VideoModalCard
                    title="Matt Cooper's Jetour T2"
                    description="A quick delivery clip showing Matt Cooper's matte green Jetour T2 colour PPF transformation."
                    videoSrc="https://res.cloudinary.com/diw6rekpm/video/upload/q_auto/f_auto/v1775563747/0407_xyaggw.mp4"
                    posterSrc="/matt-cooper-t2.png"
                    eyebrow="Jetour T2 matte green"
                  />
                </div>
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

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[rgba(8,8,8,0.88)] p-3 backdrop-blur-xl md:hidden">
        <a href={whatsAppUrl} target="_blank" rel="noreferrer" className="block">
          <Button
            type="button"
            className="w-full bg-[#25D366] text-white shadow-[0_18px_45px_rgba(37,211,102,0.28)] hover:bg-[#20BD5A]"
            size="lg"
            onClick={handleWhatsAppClick}
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Speak to Sean on WhatsApp
          </Button>
        </a>
      </div>

      <div className="pointer-events-none fixed bottom-0 right-0 z-40 hidden h-[150px] w-[220px] overflow-visible md:block">
        <img
          src={seanIllustration}
          alt="Sean"
          className="pointer-events-auto absolute bottom-0 right-6 z-0 h-auto w-40 max-w-none origin-bottom-right object-contain object-bottom-right transition-transform duration-300 ease-out hover:scale-110"
          loading="lazy"
        />
        <a
          href={whatsAppUrl}
          target="_blank"
          rel="noreferrer"
          className="pointer-events-auto absolute bottom-4 right-4 z-10 block"
        >
          <Button
            type="button"
            className="rounded-full bg-[#25D366] px-5 text-white shadow-[0_20px_60px_rgba(37,211,102,0.28)] hover:bg-[#20BD5A]"
            size="lg"
            onClick={handleWhatsAppClick}
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Speak to Sean
          </Button>
        </a>
      </div>
    </div>
  );
};

export default PpfDubaiQuote;



