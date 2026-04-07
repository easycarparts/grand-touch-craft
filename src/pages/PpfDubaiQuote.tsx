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
import { cn } from "@/lib/utils";
import ppfCclearEntry from "@/assets/ppf-cclear-entry.jpg";
import ppfDynoshieldPremium from "@/assets/ppf-dynoshield-premium.jpg";
import ppfForceshieldRecommended from "@/assets/ppf-forceshield-recommended.jpg";
import servicePpf from "@/assets/service-ppf.jpg";
import logo from "@/assets/logo.svg";
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
const TRUST_SECTION_VIDEO =
  "https://res.cloudinary.com/diw6rekpm/video/upload/q_auto/f_auto/v1775586709/0407_2_qvuqmp.mp4";

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

const TrustStars = ({ starClassName }: { starClassName?: string }) => (
  <div className="flex shrink-0 items-center gap-0.5 text-[#fbbc05] sm:gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star key={star} className={cn("h-4 w-4 fill-current", starClassName)} />
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
  const trustSectionRef = useRef<HTMLElement | null>(null);
  const trustVideoRef = useRef<HTMLVideoElement | null>(null);

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

  useEffect(() => {
    const section = trustSectionRef.current;
    const video = trustVideoRef.current;

    if (!section || !video || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!video) return;

        if (entry.isIntersecting) {
          video.currentTime = 0;
          video.play().catch(() => {
            // Ignore autoplay rejections if the browser is being strict.
          });
        } else {
          video.pause();
          video.currentTime = 0;
        }
      },
      { threshold: 0.45 }
    );

    observer.observe(section);

    return () => {
      observer.disconnect();
      video.pause();
    };
  }, []);

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
        <section className="relative overflow-hidden border-b border-border/50 bg-[radial-gradient(circle_at_top,_hsl(38_92%_58%_/_0.09),_transparent_42%),radial-gradient(circle_at_15%_25%,rgba(245,158,11,0.04),transparent_34%),radial-gradient(circle_at_85%_20%,rgba(255,255,255,0.05),transparent_22%),linear-gradient(180deg,hsl(0_0%_8%)_0%,hsl(0_0%_5%)_100%)] px-5 pb-8 pt-10 sm:bg-[radial-gradient(circle_at_top,_hsl(38_92%_58%_/_0.24),_transparent_32%),radial-gradient(circle_at_15%_25%,rgba(245,158,11,0.12),transparent_26%),radial-gradient(circle_at_85%_20%,rgba(255,255,255,0.08),transparent_18%),linear-gradient(180deg,hsl(0_0%_8%)_0%,hsl(0_0%_5%)_100%)] sm:px-6 lg:px-8">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-24 top-16 h-56 w-56 rounded-full bg-primary/8 blur-3xl sm:bg-primary/12" />
            <div className="absolute right-[-4rem] top-10 h-64 w-64 rounded-full bg-amber-200/[0.04] blur-3xl sm:bg-amber-200/10" />
            <div className="absolute bottom-[-4rem] left-1/3 h-40 w-40 rounded-full bg-white/5 blur-3xl" />
          </div>
          <div className="container mx-auto max-w-6xl">
            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start lg:gap-x-8 lg:gap-y-0">
              <div className="order-1 max-w-3xl lg:col-start-1 lg:row-start-1 lg:self-start">
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

                <h1 className="mt-6 flex max-w-3xl flex-col gap-1.5 text-4xl font-bold leading-snug tracking-tight sm:gap-1.5 sm:text-5xl sm:leading-tight md:gap-2 md:text-6xl">
                  <span className="text-white">PPF in Dubai</span>
                  <span className="text-white">you can trust.</span>
                  <span className="bg-[linear-gradient(180deg,#ffcc63_0%,#f7b52b_55%,#e79a13_100%)] bg-clip-text text-transparent drop-shadow-[0_8px_30px_rgba(247,181,43,0.15)]">
                    Direct with Sean. Installed properly.
                  </span>
                </h1>
                <p className="mt-4 max-w-2xl text-lg text-slate-300">
                  British-owned, trust-led PPF for buyers who care about genuine film, clean installs, and a warranty process that is actually real.
                </p>

                <div className="mt-6 flex flex-col gap-3">
                  <Dialog open={heroFormOpen} onOpenChange={setHeroFormOpen}>
                    <DialogTrigger asChild>
                      <Button size="lg" className="w-full">
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

                  <a href={whatsAppUrl} target="_blank" rel="noreferrer" className="w-full">
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
                      className="w-full text-white/75 hover:bg-white/5 hover:text-white"
                      onClick={() =>
                        calculatorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
                      }
                    >
                      Open calculator
                    </Button>
                  ) : null}
                </div>

              </div>

              <div className="relative order-2 flex min-h-0 flex-col justify-end overflow-visible lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start">
                <div className="relative mx-auto flex w-full max-w-[480px] min-h-0 flex-col justify-end pb-0 pt-2">
                    <div className="relative mx-auto aspect-[9/19.5] w-full min-h-0 min-w-0 max-h-full max-w-[420px] shrink-0">
                      <div className="pointer-events-none absolute -left-[5px] top-[157px] z-20 h-[4.5rem] w-[4px] rounded-full bg-gradient-to-b from-white/55 via-white/15 to-white/35 shadow-[0_0_12px_rgba(255,255,255,0.16)]" />
                      <div className="pointer-events-none absolute -left-[5px] top-[250px] z-20 h-28 w-[4px] rounded-full bg-gradient-to-b from-white/45 via-white/12 to-white/30 shadow-[0_0_12px_rgba(255,255,255,0.14)]" />
                      <div className="pointer-events-none absolute -right-[5px] top-[219px] z-20 h-32 w-[4px] rounded-full bg-gradient-to-b from-white/45 via-white/12 to-white/30 shadow-[0_0_12px_rgba(255,255,255,0.14)]" />

                      <div className="relative flex h-full w-full flex-col rounded-[3.5rem] bg-[linear-gradient(150deg,#53565d_0%,#212328_12%,#070708_48%,#1f2126_78%,#6a7078_100%)] p-[11px] shadow-[0_45px_120px_rgba(0,0,0,0.62),0_10px_30px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.24),inset_0_-1px_0_rgba(255,255,255,0.10)]">
                        <div className="pointer-events-none absolute inset-[1px] rounded-[3.35rem] border border-white/12" />
                        <div className="pointer-events-none absolute inset-[8px] rounded-[3rem] border border-white/[0.07]" />

                        <div className="relative min-h-0 flex-1 overflow-hidden rounded-[2.95rem] bg-black shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]">
                          <div className="pointer-events-none absolute left-1/2 top-3 z-20 flex h-8 w-[168px] -translate-x-1/2 items-center justify-center rounded-full bg-[#050505] shadow-[0_2px_8px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.04)]">
                            <div className="h-1.5 w-12 rounded-full bg-[#141414]" />
                          </div>

                          <video
                            className="h-full w-full object-cover"
                            src="https://res.cloudinary.com/diw6rekpm/video/upload/q_auto/f_auto/v1775556526/Jetour_EDIT_yi001t.mp4"
                            autoPlay
                            muted
                            loop
                            playsInline
                            preload="auto"
                          />

                          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-start gap-3 bg-gradient-to-t from-black/90 via-black/32 to-transparent px-5 pb-6 pt-16">
                            <img
                              src="/stek-white-full.png"
                              alt="STEK"
                              className="h-16 w-auto max-w-[min(72%,13rem)] shrink-0 translate-y-5 self-start object-contain object-left opacity-95 drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)] sm:h-20 sm:translate-y-6 md:h-[5.25rem]"
                              loading="lazy"
                            />
                            <div className="w-full">
                              <p className="text-[11px] uppercase tracking-[0.24em] text-white/60">Grand Touch transformations</p>
                              <p className="mt-2 text-lg font-semibold leading-tight text-white">Premium finish. Trusted handover.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                </div>
              </div>

              <div className="order-3 w-full lg:col-start-1 lg:row-start-2 lg:mt-5 lg:self-start">
                <div className="grid gap-2 sm:grid-cols-3 sm:gap-2.5 sm:items-stretch">
                  <div className="flex flex-row items-center gap-3 rounded-xl border border-white/10 bg-[linear-gradient(180deg,rgba(66,133,244,0.08),rgba(255,255,255,0.03)_28%,rgba(255,255,255,0.02)_100%)] px-3 py-2.5 shadow-[0_20px_50px_rgba(0,0,0,0.25)] backdrop-blur-sm sm:flex-col sm:items-stretch sm:rounded-2xl sm:p-3 sm:py-3">
                    <div className="flex shrink-0 flex-col gap-1 sm:w-full sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
                      <GoogleWordmark className="text-[1.125rem] leading-none sm:text-[1.4rem]" />
                      <TrustStars starClassName="h-4 w-4 sm:h-[1.25rem] sm:w-[1.25rem]" />
                    </div>
                    <div className="min-w-0 flex-1 sm:mt-2 sm:flex-none">
                      <p className="text-[0.9375rem] font-semibold leading-tight text-white sm:text-sm">4.9-star trust</p>
                      <p className="mt-0.5 text-sm leading-snug text-slate-300 sm:mt-1 sm:max-w-[19ch] sm:text-[0.8125rem]">
                        Proof from real Grand Touch buyers.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-row items-center gap-3 rounded-xl border border-primary/20 bg-[linear-gradient(180deg,rgba(245,158,11,0.11),rgba(255,255,255,0.03)_28%,rgba(255,255,255,0.02)_100%)] px-3 py-2.5 shadow-[0_20px_50px_rgba(0,0,0,0.28)] ring-1 ring-primary/10 backdrop-blur-sm sm:flex-col sm:items-stretch sm:rounded-2xl sm:p-3 sm:py-3">
                    <div className="flex shrink-0 items-center justify-start sm:w-full sm:justify-center sm:py-0.5">
                      <img
                        src="/stek-white-small.png"
                        alt="STEK"
                        className="h-7 w-auto max-w-[120px] object-contain object-left sm:h-9 sm:max-w-[140px]"
                        loading="lazy"
                      />
                    </div>
                    <div className="min-w-0 flex-1 sm:mt-2 sm:flex-none">
                      <p className="text-[0.9375rem] font-semibold leading-tight text-white sm:text-sm">Certified installer</p>
                      <p className="mt-0.5 text-sm leading-snug text-slate-300 sm:mt-1 sm:max-w-[17ch] sm:text-[0.8125rem]">
                        STEK fitted properly.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-row items-center gap-3 rounded-xl border border-white/10 bg-[linear-gradient(180deg,rgba(95,143,121,0.09),rgba(255,255,255,0.03)_28%,rgba(255,255,255,0.02)_100%)] px-3 py-2.5 shadow-[0_20px_50px_rgba(0,0,0,0.25)] backdrop-blur-sm sm:flex-col sm:items-stretch sm:rounded-2xl sm:p-3 sm:py-3">
                    <div className="flex shrink-0 items-center justify-start sm:w-full sm:justify-center sm:py-0.5">
                      <div
                        className="inline-flex max-w-[9.25rem] -rotate-[2deg] items-center gap-1.5 rounded-md border-2 border-white/30 bg-white px-1.5 py-1 text-black shadow-[0_6px_20px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-black/15 sm:max-w-[11.5rem] sm:-rotate-[3deg] sm:gap-2 sm:rounded-lg sm:px-2 sm:py-1.5"
                        role="img"
                        aria-label="Serial verification seal"
                      >
                        <span
                          aria-hidden
                          className="shrink-0 rounded bg-[#b73a2f] px-0.5 py-0.5 text-[5px] font-bold uppercase tracking-[0.1em] text-white sm:px-1 sm:text-[6px] sm:tracking-[0.12em]"
                        >
                          Seal
                        </span>
                        <div
                          aria-hidden
                          className="grid h-6 w-6 shrink-0 grid-cols-4 gap-px rounded-sm bg-black p-0.5 shadow-inner sm:h-7 sm:w-7"
                        >
                          {Array.from({ length: 16 }).map((_, index) => (
                            <span
                              key={index}
                              className={index % 3 === 0 ? "bg-white" : "bg-black"}
                            />
                          ))}
                        </div>
                        <div aria-hidden className="min-w-0 flex-1">
                          <p className="text-[6px] font-semibold uppercase leading-tight tracking-[0.08em] text-[#b73a2f] sm:text-[7px] sm:tracking-[0.1em]">
                            Serial verified
                          </p>
                          <div className="mt-0.5 h-0.5 rounded-sm bg-[repeating-linear-gradient(90deg,#111_0_1px,transparent_1px_2px)] sm:h-1" />
                        </div>
                        <img
                          src="/stek-logo.webp"
                          alt=""
                          className="h-2.5 w-auto shrink-0 object-contain opacity-80 invert sm:h-3"
                          loading="lazy"
                          aria-hidden
                        />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1 sm:mt-2 sm:flex-none">
                      <p className="text-[0.9375rem] font-semibold leading-tight text-white sm:text-sm">Verified warranty</p>
                      <p className="mt-0.5 text-sm leading-snug text-slate-300 sm:mt-1 sm:max-w-[18ch] sm:text-[0.8125rem]">
                        Serial-tracked and registered online.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          ref={trustSectionRef}
          className="border-y border-border/50 bg-[radial-gradient(circle_at_18%_20%,rgba(245,181,43,0.07),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01))] px-4 py-14 sm:px-6 lg:px-8"
        >
          <div className="container mx-auto max-w-6xl">
            <div className="grid gap-8 lg:grid-cols-[0.88fr_1.12fr] lg:items-center lg:gap-10">
              <div className="order-2 relative overflow-hidden rounded-[32px] border border-primary/15 bg-[radial-gradient(circle_at_50%_18%,rgba(245,181,43,0.16),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(10,10,10,0.92))] px-6 pt-8 shadow-[0_28px_90px_rgba(0,0,0,0.38)] sm:px-8 sm:pt-10 lg:order-none">
                <div className="pointer-events-none absolute inset-0">
                  <div className="absolute left-1/2 top-16 h-56 w-56 -translate-x-1/2 rounded-full bg-primary/12 blur-3xl" />
                  <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/45 to-transparent" />
                </div>
                <div className="relative mb-8 overflow-hidden rounded-[28px] border border-white/10 bg-black/35 shadow-[0_20px_60px_rgba(0,0,0,0.35)] sm:mb-10">
                  <video
                    ref={trustVideoRef}
                    className="aspect-[4/5] h-auto w-full object-cover"
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    onEnded={(event) => {
                      event.currentTarget.currentTime = 0;
                      event.currentTarget.play().catch(() => {
                        // Ignore replay failures if the browser is being strict.
                      });
                    }}
                  >
                    <source src={TRUST_SECTION_VIDEO} type="video/mp4" />
                  </video>
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <div className="pointer-events-none absolute inset-x-5 bottom-5">
                    <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-white/65">
                    </p>
                    <p className="mt-2 max-w-[22ch] text-xl font-semibold leading-tight text-white sm:text-2xl">
                    See how Sean works
                    </p>
                  </div>
                </div>
                <div className="relative -mx-6 border-t border-white/10 bg-black/18 px-6 py-5 backdrop-blur-sm sm:-mx-8 sm:px-8">
                  <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-primary/80">
                    Deal Directly with Sean
                  </p>
                  <p className="mt-2 max-w-[28ch] text-sm leading-6 text-slate-300">
                  Sean stays involved from first conversation to final result..
                  </p>
                </div>
              </div>

              <div className="order-1 relative overflow-hidden rounded-[32px] border border-primary/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(12,12,12,0.96))] p-7 shadow-[0_24px_70px_rgba(0,0,0,0.35)] sm:p-8 lg:order-none">
                <div className="pointer-events-none absolute inset-0">
                  <div className="absolute -right-12 top-0 h-44 w-44 rounded-full bg-primary/8 blur-3xl" />
                  <div className="absolute -left-10 top-28 h-32 w-32 rounded-full bg-primary/6 blur-3xl" />
                </div>
                <div className="relative">
                  <p className="text-sm uppercase tracking-[0.26em] text-muted-foreground">
                    Why buyers trust Grand Touch
                  </p>
                  <h2 className="mt-3 flex max-w-xl flex-col gap-1 text-3xl font-bold leading-[0.98] text-white sm:gap-1.5 sm:text-4xl">
                    <span className="block">The film matters.</span>
                    <span className="block">Who you trust to fit it</span>
                    <span className="block bg-[linear-gradient(180deg,#ffcf6a_0%,#f7b52b_55%,#e79a13_100%)] bg-clip-text text-transparent drop-shadow-[0_10px_30px_rgba(247,181,43,0.16)]">
                      matters more.
                    </span>
                  </h2>
                  <div className="mt-5 max-w-[58ch] space-y-3 text-base leading-7 text-slate-300">
                    <p>At Grand Touch, buyers trust Sean for the parts that matter most:</p>
                    <p className="text-[1.02rem] leading-8 text-white/92">
                      <span className="font-semibold text-[#f6c76d]">proper prep</span>,{" "}
                      <span className="font-semibold text-white">genuine STEK film</span>, and{" "}
                      <span className="font-semibold text-[#f6c76d]">
                        warranty registration done the right way
                      </span>
                      .
                    </p>
                  </div>

                  <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/6 px-4 py-2 text-xs font-medium uppercase tracking-[0.22em] text-[#f6c76d] shadow-[0_12px_35px_rgba(245,181,43,0.08)]">
                    <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_14px_rgba(245,181,43,0.7)]" />
                    Trust is built before the film goes on
                  </div>

                  <div className="mt-8 rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] p-[1px] shadow-[0_22px_60px_rgba(0,0,0,0.28)]">
                    <div className="rounded-[27px] bg-[linear-gradient(180deg,rgba(20,20,20,0.96),rgba(14,14,14,0.98))] px-5 sm:px-6">
                    <div className="py-5 sm:py-6">
                      <div className="flex items-start gap-4">
                        <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-primary shadow-[0_0_16px_rgba(245,181,43,0.6)]" />
                        <div className="min-w-0">
                          <p className="text-lg font-semibold text-white">
                            <span className="text-[#f6c76d]">British-owned.</span> Sean-led.
                          </p>
                          <p className="mt-1 text-sm leading-6 text-slate-300">
                          Clear communication, honest advice, and a process Sean stands behind himself.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                    <div className="py-5 sm:py-6">
                      <div className="flex items-start gap-4">
                        <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-primary shadow-[0_0_16px_rgba(245,181,43,0.6)]" />
                        <div className="min-w-0">
                          <p className="text-lg font-semibold text-white">
                            No shortcuts in <span className="text-[#f6c76d]">prep.</span>
                          </p>
                          <p className="mt-1 text-sm leading-6 text-slate-300">
                          The finish depends on what happens before installation, so we take that seriously.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                    <div className="py-5 sm:py-6">
                      <div className="flex items-start gap-4">
                        <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-primary shadow-[0_0_16px_rgba(245,181,43,0.6)]" />
                        <div className="min-w-0">
                          <p className="text-lg font-semibold text-white">
                            Genuine film. <span className="text-[#f6c76d]">Verified warranty.</span>
                          </p>
                          <p className="mt-1 text-sm leading-6 text-slate-300">
                          Your STEK film is scanned, registered, and backed online through the proper portal.
                          </p>
                        </div>
                      </div>
                    </div>
                    </div>
                  </div>

                  <div className="mt-7 rounded-[24px] border border-primary/15 bg-[linear-gradient(180deg,rgba(245,181,43,0.12),rgba(245,181,43,0.04))] px-5 py-4 shadow-[0_14px_40px_rgba(245,181,43,0.08)]">
                    <p className="text-center text-sm font-semibold tracking-[0.08em] text-[#f6c76d] sm:text-[0.95rem]">
                    Proper prep <span className="mx-2 text-primary/70">•</span> Genuine film <span className="mx-2 text-primary/70">•</span> Verified warranty
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-border/50 bg-[radial-gradient(circle_at_75%_20%,rgba(245,181,43,0.08),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01))] px-4 py-14 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-6xl">
            <div className="grid gap-7 lg:grid-cols-[1fr_1.02fr] lg:items-start">
              <div className="relative overflow-hidden rounded-[32px] border border-primary/15 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(12,12,12,0.96))] p-7 shadow-[0_24px_70px_rgba(0,0,0,0.35)] sm:p-8">
                <div className="pointer-events-none absolute inset-0">
                  <div className="absolute -left-12 top-6 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
                  <div className="absolute right-0 top-16 h-32 w-32 rounded-full bg-white/5 blur-3xl" />
                </div>
                <div className="relative">
                  <p className="text-sm uppercase tracking-[0.26em] text-muted-foreground">
                    Why Grand Touch installs STEK
                  </p>
                  <h2 className="mt-3 max-w-[12ch] text-3xl font-bold leading-[0.98] text-white sm:text-4xl">
                    Trusted film.
                    <span className="mt-1.5 block bg-[linear-gradient(180deg,#ffcf6a_0%,#f7b52b_55%,#e79a13_100%)] bg-clip-text text-transparent drop-shadow-[0_10px_30px_rgba(247,181,43,0.16)]">
                      Clear options.
                    </span>
                    Real warranty.
                  </h2>
                  <p className="mt-5 max-w-[54ch] text-base leading-7 text-slate-300">
                    STEK is the film we trust on customer cars because it gives buyers strong
                    protection, clean finish options, and warranty-backed packages without making
                    the choice feel complicated.
                  </p>

                  <div className="mt-6 flex flex-wrap gap-2">
                    <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/6 px-4 py-2 text-xs font-medium uppercase tracking-[0.22em] text-[#f6c76d]">
                      <img
                        src="/stek-white-small.png"
                        alt=""
                        className="h-3 w-auto object-contain opacity-90"
                        loading="lazy"
                        aria-hidden
                      />
                      Certified installer
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-medium uppercase tracking-[0.22em] text-white/80">
                      5, 10 & 12-year coverage
                    </div>
                  </div>

                  <div className="mt-7 overflow-hidden rounded-[28px] border border-white/10 bg-black/35 shadow-[0_22px_60px_rgba(0,0,0,0.28)]">
                    <div className="relative aspect-[16/10]">
                      <img
                        src={servicePpf}
                        alt="Grand Touch workshop PPF installation visual"
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                      <div className="absolute inset-x-5 top-5">
                        <img
                          src="/stek-white-full.png"
                          alt="STEK"
                          className="h-7 w-auto object-contain sm:h-8"
                          loading="lazy"
                        />
                      </div>
                      <div className="absolute inset-x-5 bottom-5">
                        <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-white/60">
                          Grand Touch film choice
                        </p>
                        <p className="mt-2 max-w-[24ch] text-xl font-semibold leading-tight text-white sm:text-2xl">
                          Chosen because it supports the standard buyers are trusting us to deliver.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 rounded-[24px] border border-primary/15 bg-[linear-gradient(180deg,rgba(245,181,43,0.12),rgba(245,181,43,0.04))] px-5 py-4 shadow-[0_14px_40px_rgba(245,181,43,0.08)]">
                    <p className="text-center text-sm font-semibold tracking-[0.08em] text-[#f6c76d] sm:text-[0.95rem]">
                      Genuine STEK <span className="mx-2 text-primary/70">•</span> Installed properly{" "}
                      <span className="mx-2 text-primary/70">•</span> Registered the right way
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                <Card className="group overflow-hidden border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(16,16,16,0.98))] p-0 shadow-[0_22px_60px_rgba(0,0,0,0.28)]">
                  <div className="relative aspect-[16/11] overflow-hidden">
                    <img
                      src={ppfCclearEntry}
                      alt="STEK C-Clear and F3 film placeholder visual"
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/78 via-black/18 to-transparent" />
                    <div className="absolute left-4 top-4 rounded-full border border-white/10 bg-black/35 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.24em] text-white/80 backdrop-blur-sm">
                      Entry choice
                    </div>
                    <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3">
                      <div>
                        <p className="text-sm uppercase tracking-[0.16em] text-[#f6c76d]">5 years</p>
                        <h3 className="mt-1 text-xl font-semibold text-white">C-Clear / F3</h3>
                      </div>
                    </div>
                  </div>
                  <div className="px-5 py-5">
                    <p className="text-sm leading-6 text-slate-300">
                      A lighter starting point for buyers who want trusted STEK protection without
                      jumping straight into the top-tier package.
                    </p>
                  </div>
                </Card>

                <Card className="group overflow-hidden border-primary/20 bg-[linear-gradient(180deg,rgba(245,181,43,0.08),rgba(18,18,18,0.98))] p-0 shadow-[0_24px_70px_rgba(0,0,0,0.32)]">
                  <div className="relative aspect-[16/11] overflow-hidden">
                    <img
                      src={ppfForceshieldRecommended}
                      alt="STEK ForceShield film placeholder visual"
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/78 via-black/18 to-transparent" />
                    <div className="absolute left-4 top-4 rounded-full border border-primary/20 bg-primary/12 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.24em] text-[#f6c76d] backdrop-blur-sm">
                      Grand Touch pick
                    </div>
                    <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3">
                      <div>
                        <p className="text-sm uppercase tracking-[0.16em] text-[#f6c76d]">10 years</p>
                        <h3 className="mt-1 text-xl font-semibold text-white">FORCESHIELD</h3>
                      </div>
                    </div>
                  </div>
                  <div className="px-5 py-5">
                    <p className="text-sm leading-6 text-slate-300">
                      The most balanced option for buyers who want strong long-term protection,
                      clean finish quality, and confident everyday use.
                    </p>
                  </div>
                </Card>

                <Card className="group overflow-hidden border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(16,16,16,0.98))] p-0 shadow-[0_22px_60px_rgba(0,0,0,0.28)]">
                  <div className="relative aspect-[16/11] overflow-hidden">
                    <img
                      src={ppfDynoshieldPremium}
                      alt="STEK DynoShield film placeholder visual"
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/78 via-black/18 to-transparent" />
                    <div className="absolute left-4 top-4 rounded-full border border-white/10 bg-black/35 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.24em] text-white/80 backdrop-blur-sm">
                      Premium tier
                    </div>
                    <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3">
                      <div>
                        <p className="text-sm uppercase tracking-[0.16em] text-[#f6c76d]">12 years</p>
                        <h3 className="mt-1 text-xl font-semibold text-white">DYNOSHIELD</h3>
                      </div>
                    </div>
                  </div>
                  <div className="px-5 py-5">
                    <p className="text-sm leading-6 text-slate-300">
                      The highest-tier STEK package for buyers who want maximum long-term coverage
                      and the most premium route available.
                    </p>
                  </div>
                </Card>
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

      <div className="pointer-events-none fixed bottom-0 right-0 z-40 hidden overflow-visible md:block">
        <a
          href={whatsAppUrl}
          target="_blank"
          rel="noreferrer"
          onClick={handleWhatsAppClick}
          aria-label="Speak to Sean on WhatsApp"
          className="group pointer-events-auto absolute bottom-0 right-6 z-0 block cursor-pointer"
        >
          <img
            src="/chat-to-sean.png"
            alt=""
            className="h-auto w-44 max-w-[min(260px,46vw)] origin-bottom-right object-contain object-bottom-right transition-transform duration-300 ease-out group-hover:scale-[1.18]"
            loading="lazy"
          />
        </a>
      </div>
    </div>
  );
};

export default PpfDubaiQuote;



