import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Check,
  ChevronDown,
  Clock,
  Gift,
  Handshake,
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
  X,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  GoogleWordmark,
  HandoverReactionsReel,
  HandoverReviewsCarousel,
} from "@/components/ppf/HandoverTrust";
import GuidedPpfCalculator from "@/components/ppf/GuidedPpfCalculator";
import {
  createFunnelTrackingContext,
  trackFunnelEvent,
} from "@/lib/funnel-analytics";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.svg";

/* ────────────────────────────────────────────────────────────────────────────
 * PPF WhatsApp-Direct landing page  (route: /paint-protection-film-dubai)
 *
 * The "light" funnel test (June 2026). WhatsApp is always a direct 1-tap (no gate,
 * no popup) — the data showed the WhatsApp tap is the ~90% conversion engine.
 * It reuses the PROVEN guided-funnel trust assets (handover reel + reviews
 * carousel + Meet Sean + "where cheap PPF goes wrong" photos) and an UNGATED
 * guided calculator at the bottom. Copy is keyword-aligned to the live Search ads
 * (paint protection film / ppf coating / ppf dubai / ppf for suv) for ad
 * relevance + Quality Score.
 *
 * Easy-to-edit config lives in the marked blocks below.
 * ──────────────────────────────────────────────────────────────────────────── */

const WHATSAPP_NUMBER = "971567191045";
const DISPLAY_PHONE = "+971 56 719 1045";
const TEL_HREF = "tel:+971567191045";

// Counted Google Ads conversion (identical to the proven May funnel). Fires once
// per session on the first WhatsApp tap. Keep in lock-step with the V2 file.
const GOOGLE_ADS_WHATSAPP_CONTACT_SEND_TO = "AW-17684563059/KqOWCJfDoLAcEPOI1PBB";
const GOOGLE_ADS_PRE_FORM_WHATSAPP_SEND_TO = "AW-17684563059/q_bgCOXs1L8cEPOI1PBB";

const FUNNEL_NAME = "ppf_whatsapp_direct";
const LANDING_PAGE_VARIANT = "whatsapp_direct";

const GOLD = "#f7b52b";
const FULL_BODY_FROM = 7990;
const formatAED = (value: number) => `AED ${value.toLocaleString("en-AE")}`;

// ── EASY-TO-EDIT COPY ───────────────────────────────────────────────────────
// Low-commitment, easy-send WhatsApp message — the visitor just hits send.
const DEFAULT_WA_MESSAGE =
  "Hi Sean, I'm interested in PPF for my car — could you send me a bit more detail?";

// Keyword chips mirror the highest-click Search terms (helps ad relevance).
const keywordChips = [
  "Paint protection film",
  "PPF coating",
  "PPF for SUV",
  "Matte & gloss PPF",
  "PPF Dubai",
];

const trackGoogleAdsConversion = (sendTo: string) => {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", "conversion", { send_to: sendTo, value: 1.0, currency: "AED" });
};

const buildWhatsAppUrl = (message: string) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

const SEO = {
  title: "PPF Dubai | Paint Protection Film & Coating Priced on WhatsApp | Grand Touch Auto",
  description:
    "Genuine STEK paint protection film (PPF) & coating in Dubai, fitted by Sean's team. Full-body PPF from AED 7,990 — get your exact price in a 15-minute WhatsApp chat. Free pickup across Dubai, traceable warranty, 4.9★ on Google.",
  keywords:
    "PPF Dubai, paint protection film Dubai, PPF coating, PPF price Dubai, PPF cost Dubai, STEK PPF Dubai, full body PPF Dubai, PPF for SUV, matte PPF Dubai, ppf car, car paint protection Dubai",
};

function applySEO() {
  if (typeof document === "undefined") return;
  document.title = SEO.title;
  const set = (selector: string, attr: string, value: string, create?: () => HTMLElement) => {
    let el = document.querySelector(selector) as HTMLElement | null;
    if (!el && create) {
      el = create();
      document.head.appendChild(el);
    }
    if (el) el.setAttribute(attr, value);
  };
  set('meta[name="description"]', "content", SEO.description, () => {
    const m = document.createElement("meta");
    m.setAttribute("name", "description");
    return m;
  });
  set('meta[name="keywords"]', "content", SEO.keywords, () => {
    const m = document.createElement("meta");
    m.setAttribute("name", "keywords");
    return m;
  });
  set('meta[property="og:title"]', "content", SEO.title);
  set('meta[property="og:description"]', "content", SEO.description);
}

// ── content config ──────────────────────────────────────────────────────────
const realCars = [
  { src: "/guided-911-stek-roll.png", label: "Porsche 911 · genuine STEK roll" },
  { src: "/guided-cullinan-ppf.png", label: "Rolls-Royce Cullinan · full-body PPF" },
  { src: "/guided-cullinan-black.jpg", label: "Rolls-Royce Cullinan · STEK gloss PPF" },
  { src: "/guided-aston-rapide-ppf.png", label: "Aston Martin Rapide · colour PPF" },
];

const meetSeanPillars = [
  { icon: UserCheck, title: "Sean-led from quote to handover", body: "Same WhatsApp from quote to final sign-off. No salesperson hand-off, no vague accountability." },
  { icon: ScanSearch, title: "Prep before film, always", body: "Multi-stage decon, correction, and QC before any film touches paint. If prep isn't right, the install doesn't start." },
  { icon: ShieldCheck, title: "Registered STEK warranty", body: "Genuine STEK rolls, registered through the proper channel. You receive the trail tied to your VIN." },
];

const reactionPoints = [
  { icon: UserCheck, title: "Real owners, not actors", body: "Every clip is a paying customer collecting their own car." },
  { icon: Handshake, title: "Filmed on handover day", body: "The genuine first reaction once Sean reveals the finished car." },
  { icon: ShieldCheck, title: "The standard we hand back", body: "The same QC and finish that ships with your STEK warranty." },
];

const wentWrong = [
  { image: "/guided-install-detail.png", problem: "Skipped paint prep", fix: "Multi-stage decon + correction before the roll is opened. Film over swirls = ugly forever." },
  { image: "/guided-rolls-install.png", problem: "Razor-cut on the paint", fix: "Every piece is hand-cut and trimmed off the car before install. No blade work on the panel." },
  { image: "/guided-911-stek-roll.png", problem: "Mystery film, mystery warranty", fix: "We only install genuine STEK and register the roll. If the warranty isn't traceable, it doesn't exist." },
  { image: "/guided-cullinan-ppf.png", problem: "No QC, no follow-up", fix: "Final inspection + one-week recheck on edges, corners and high-flex panels. Most shops disappear at handover." },
];

// Full free-extras stack (matches the V3 guided value stack ≈ AED 4,550).
const includedExtras = [
  "Multi-stage paint correction",
  "Full interior & exterior detail",
  "Headlight & door-sill protection",
  "Leather interior ceramic coating",
  "Wheel ceramic coating",
  "Lifetime PPF edge & corner inspections",
  "Free pickup & drop-off across Dubai",
];

const steps = [
  { title: "Tap WhatsApp & send your car", body: "Make, model and year — that's all Sean needs to start." },
  { title: "Get your exact price + options", body: "A clear quote for your car: film grade, coverage and warranty. No pressure." },
  { title: "Book it — free pickup", body: "Happy? We collect the car Dubai-wide and return it protected." },
];

const faqs = [
  {
    q: "How much does PPF cost in Dubai?",
    a: `Full-body STEK PPF starts from ${formatAED(FULL_BODY_FROM)}. Your exact price depends on your car, the coverage and the film grade — build it in the calculator below, or send your car on WhatsApp and Sean gives you the exact number in minutes.`,
  },
  { q: "Which film do you use?", a: "Genuine STEK as our hero film (with KDX, Diamond Pro, Supreme and GYEON also available). We're an authorised installer, so your warranty is real and traceable." },
  { q: "How long does it take?", a: "Most full-body installs are 2–4 days depending on the car and coverage. We confirm the exact turnaround with your quote." },
  { q: "Do you collect my car?", a: "Yes — free pickup and drop-off across Dubai, at a time that works for you." },
  { q: "Is there a warranty?", a: "Yes. Registered warranty against yellowing, cracking, bubbling and lifting, kept on file so a claim is simple." },
];

export default function PpfWhatsAppDirect() {
  const funnelContext = useMemo(
    () =>
      createFunnelTrackingContext({
        funnelName: FUNNEL_NAME,
        landingPageVariant: LANDING_PAGE_VARIANT,
        defaultSourcePlatform: "google",
      }),
    [],
  );

  const countedFiredRef = useRef(false);
  const observeFiredRef = useRef(false);
  const calcRef = useRef<HTMLDivElement | null>(null);
  const [showStickyBar, setShowStickyBar] = useState(false);

  const trackEvent = useCallback(
    (eventName: string, payload: Record<string, unknown> = {}) => {
      trackFunnelEvent({ eventName, context: funnelContext, payload });
    },
    [funnelContext],
  );

  useEffect(() => {
    applySEO();
    trackEvent("lp_view", { calculator_type: "whatsapp_direct" });
  }, [trackEvent]);

  useEffect(() => {
    const onScroll = () => setShowStickyBar(window.scrollY > 520);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const requestWhatsApp = useCallback(
    (placement: string, message: string = DEFAULT_WA_MESSAGE) => {
      trackEvent("whatsapp_contact_click", { cta_location: placement });
      if (!countedFiredRef.current) {
        countedFiredRef.current = true;
        trackGoogleAdsConversion(GOOGLE_ADS_WHATSAPP_CONTACT_SEND_TO);
      }
      if (!observeFiredRef.current) {
        observeFiredRef.current = true;
        trackGoogleAdsConversion(GOOGLE_ADS_PRE_FORM_WHATSAPP_SEND_TO);
      }
      window.open(buildWhatsAppUrl(message), "_blank", "noopener,noreferrer");
    },
    [trackEvent],
  );

  const requestCall = useCallback(
    (placement: string) => {
      trackEvent("call_click", { cta_location: placement });
      if (typeof window !== "undefined") window.location.href = TEL_HREF;
    },
    [trackEvent],
  );

  const scrollToCalculator = useCallback(
    (placement: string) => {
      trackEvent("scroll_to_calculator", { cta_location: placement });
      calcRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [trackEvent],
  );

  const CtaPair = ({ placement, primaryLabel = "Get my 15-min quote", microcopy }: {
    placement: string;
    primaryLabel?: string;
    microcopy?: string;
  }) => (
    <div className="mt-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          onClick={() => requestWhatsApp(placement)}
          className="group inline-flex items-center justify-center gap-2.5 rounded-2xl bg-[#25D366] px-6 py-3.5 text-base font-bold text-[#04210f] shadow-[0_10px_30px_rgba(37,211,102,0.32)] transition hover:-translate-y-0.5 hover:brightness-105"
        >
          <MessageCircle className="h-5 w-5" />
          {primaryLabel}
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </button>
        <button
          onClick={() => scrollToCalculator(placement)}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#f7b52b]/50 px-5 py-3.5 text-base font-bold text-[#f7b52b] transition hover:-translate-y-0.5 hover:bg-[#f7b52b]/10"
        >
          <Sparkles className="h-4.5 w-4.5" /> See my price
        </button>
      </div>
      {microcopy ? <p className="mt-3 text-xs text-white/50">{microcopy}</p> : null}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#070707] text-white antialiased">
      {/* ── Sticky header ─────────────────────────────────────────────── */}
      <header className="border-b border-white/10 bg-[#070707]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2 sm:py-3">
          <a href="/" className="flex items-center gap-2">
            <img src={logo} alt="Grand Touch Auto" className="h-6 w-auto sm:h-8" />
          </a>
          <div className="flex items-center gap-2">
            <button
              onClick={() => requestCall("header")}
              className="hidden items-center gap-1.5 rounded-full border border-white/15 px-3.5 py-2 text-sm font-medium text-white/85 transition hover:border-white/35 hover:text-white sm:flex"
            >
              <Phone className="h-4 w-4" /> Call
            </button>
            <button
              onClick={() => requestWhatsApp("header")}
              className="flex items-center gap-1 rounded-full bg-[#25D366] px-2.5 py-1 text-[11px] font-semibold text-[#04210f] shadow-[0_4px_14px_rgba(37,211,102,0.3)] transition hover:brightness-105 sm:gap-1.5 sm:px-4 sm:py-2 sm:text-sm"
            >
              <MessageCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              WhatsApp<span className="hidden sm:inline"> Sean</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(1200px 520px at 12% -10%, rgba(247,181,43,0.16), transparent), radial-gradient(900px 520px at 100% 0%, rgba(37,211,102,0.10), transparent)",
          }}
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pb-12 pt-10 lg:grid-cols-[1.05fr_0.95fr] lg:pb-16 lg:pt-16">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: GOLD }} />
              Dubai · Authorised STEK PPF · Direct with Sean
            </div>

            <h1 className="text-5xl font-black leading-[0.98] tracking-tight sm:text-6xl lg:text-7xl">
              Premium PPF,
              <span className="block" style={{ color: GOLD }}>done right.</span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
              Get your exact PPF price on WhatsApp in 15 minutes — genuine STEK paint protection
              film, proper prep, and free pickup across Dubai.
            </p>

            {/* keyword chips — mirror the Search ads for relevance */}
            <div className="mt-4 flex flex-wrap gap-1.5">
              {keywordChips.map((k) => (
                <span key={k} className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/55">
                  {k}
                </span>
              ))}
            </div>

            <div className="mt-7 flex flex-col gap-2.5 sm:flex-row sm:items-center">
              <button
                onClick={() => requestWhatsApp("hero")}
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 py-2.5 text-sm font-bold text-[#04210f] shadow-[0_8px_24px_rgba(37,211,102,0.3)] transition hover:-translate-y-0.5 hover:brightness-105"
              >
                <MessageCircle className="h-4 w-4" />
                Get my 15-min quote on WhatsApp
                <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
              </button>
              <button
                onClick={() => scrollToCalculator("hero")}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#f7b52b]/50 px-4 py-2.5 text-sm font-bold text-[#f7b52b] transition hover:-translate-y-0.5 hover:bg-[#f7b52b]/10"
              >
                <Sparkles className="h-4 w-4" /> See my price
              </button>
            </div>

            <p className="mt-3 text-sm text-white/55">
              <span className="font-semibold text-white/80">Full-body STEK PPF from {formatAED(FULL_BODY_FROM)}</span>{" "}
              — exact price for your car in a 15-min WhatsApp chat, no forms.
            </p>
          </div>

          <div className="relative">
            <div className="relative overflow-hidden rounded-[26px] border border-white/10 shadow-2xl">
              <img
                src="/guided-sean-with-patrols-v2.jpg"
                alt="Sean from Grand Touch Auto with PPF-protected vehicles in Dubai"
                className="h-full w-full object-cover"
                loading="eager"
              />
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/75 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-2">
                <button
                  type="button"
                  onClick={() => requestWhatsApp("hero_image")}
                  className="group inline-flex items-center gap-1.5 rounded-full bg-[#25D366] px-3 py-1.5 text-xs font-bold text-[#04210f] shadow-lg transition hover:brightness-105"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  Chat directly with Sean
                </button>
                <div className="flex items-center gap-1.5 rounded-full border border-white/20 bg-black/55 px-3 py-1.5 text-xs font-bold text-white backdrop-blur">
                  <Star className="h-3.5 w-3.5 fill-[#FBBC05] text-[#FBBC05]" /> 4.9 on Google
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust bar (logos + rating + authorised) ───────────────────── */}
      <section className="border-y border-white/10 bg-white/[0.02]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-5 px-4 py-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl font-black leading-none" style={{ color: GOLD }}>4.9</span>
            <div>
              <span className="flex items-center gap-0.5 text-[#FBBC05]">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="h-3.5 w-3.5 fill-current" />
                ))}
              </span>
              <span className="mt-0.5 flex items-center gap-1 text-[11px] text-white/60">
                on <GoogleWordmark className="text-[0.95em]" />
              </span>
            </div>
          </div>

          <span className="hidden h-8 w-px bg-white/10 sm:block" />

          <div className="flex items-center gap-2.5">
            <img src="/stek-logo.webp" alt="STEK official brand logo" className="h-7 w-auto object-contain" loading="lazy" />
            <div className="leading-tight">
              <p className="text-xs font-black uppercase tracking-[0.14em]" style={{ color: GOLD }}>Authorised installer</p>
              <p className="text-[11px] text-white/55">Factory-trained STEK application</p>
            </div>
          </div>

          <span className="hidden h-8 w-px bg-white/10 sm:block" />

          <div className="flex items-center gap-2 text-xs font-semibold text-white/75">
            <Truck className="h-4 w-4" style={{ color: GOLD }} /> Free pickup across Dubai
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-white/75">
            <ShieldCheck className="h-4 w-4" style={{ color: GOLD }} /> Warranty you can trace
          </div>
        </div>
      </section>

      {/* ── Real cars gallery (the Rolls / 911-with-STEK-roll trust shots) ── */}
      <section className="mx-auto max-w-6xl px-4 py-12 lg:py-16">
        <div className="mb-6 max-w-2xl">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] sm:text-[11px]" style={{ color: GOLD }}>
            Real cars we've protected
          </p>
          <h2 className="mt-2 text-2xl font-black leading-tight sm:text-3xl">
            The cars Dubai trusts us with.
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {realCars.map((c) => (
            <div key={c.src} className="group relative aspect-[4/5] overflow-hidden rounded-2xl border border-white/10">
              <img src={c.src} alt={c.label} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
              <p className="absolute inset-x-0 bottom-0 p-3 text-[11px] font-semibold leading-tight text-white/85">{c.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Handover reactions reel (emotional hook) ──────────────────── */}
      <section className="border-t border-white/10 bg-[radial-gradient(circle_at_15%_0%,rgba(247,181,43,0.08),transparent_55%),#070707] px-4 py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
            <div className="mx-auto w-full max-w-[420px] sm:max-w-[460px] lg:max-w-none">
              <HandoverReactionsReel
                videoSrc="https://res.cloudinary.com/diw6rekpm/video/upload/q_auto/v1781334893/customer_roqujv.mp4"
                posterSrc="https://res.cloudinary.com/diw6rekpm/video/upload/so_2/v1781334893/customer_roqujv.jpg"
              />
            </div>
            <div>
              <p className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.22em] sm:text-[11px]" style={{ color: GOLD }}>
                <Play className="h-3.5 w-3.5 fill-current" /> Real handover reactions
              </p>
              <h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">
                See the moment it
                <span className="block" style={{ color: GOLD }}>becomes their car.</span>
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-300 sm:text-base sm:leading-7">
                Not stock footage, not actors — real Dubai owners on handover day, the second
                they see the finish in person. Watch before you decide who touches your car.
              </p>
              <div className="mt-6 space-y-4">
                {reactionPoints.map(({ icon: Icon, title, body }) => (
                  <div key={title} className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f7b52b]/15 ring-1 ring-[#f7b52b]/30">
                      <Icon className="h-5 w-5" style={{ color: GOLD }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-black leading-tight text-white">{title}</p>
                      <p className="mt-0.5 text-[13px] leading-5 text-slate-400">{body}</p>
                    </div>
                  </div>
                ))}
              </div>
              <CtaPair placement="handover_reactions" primaryLabel="Price my car like theirs" microcopy="Direct with Sean · No commitment" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Customer reviews & our work carousel ──────────────────────── */}
      <section className="bg-[#070707] px-4 py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] sm:text-[11px]" style={{ color: GOLD }}>
              Customer reviews & our work
            </p>
            <h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">
              Real buyers, real handovers,
              <span className="block" style={{ color: GOLD }}>real cars.</span>
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base sm:leading-7">
              Real owners trust Sean, the finish looks right, and the handover feels properly
              done. Swipe through — the centre clip plays, tap it for sound.
            </p>
          </div>
          <HandoverReviewsCarousel />
        </div>
      </section>

      {/* ── Mid-page CTA strip ────────────────────────────────────────── */}
      <section className="bg-[#070707] px-4 py-8 sm:py-12">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-[28px] border border-[#f7b52b]/30 bg-[radial-gradient(circle_at_80%_-10%,rgba(247,181,43,0.22),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(8,8,8,0.55))] p-5 sm:p-8">
            <div className="grid items-center gap-5 sm:grid-cols-[1.4fr_1fr] sm:gap-8">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] sm:text-[11px]" style={{ color: GOLD }}>
                  Like what you've seen?
                </p>
                <h2 className="mt-2 text-2xl font-black leading-tight sm:text-3xl lg:text-4xl">
                  Get your exact PPF price
                  <span className="block" style={{ color: GOLD }}>in a 15-minute chat.</span>
                </h2>
              </div>
              <div className="flex flex-col gap-3 sm:items-end">
                <div className="flex flex-col gap-2.5 sm:flex-row sm:justify-end">
                  <button
                    onClick={() => requestWhatsApp("mid_cta")}
                    className="inline-flex items-center justify-center gap-2.5 rounded-2xl bg-[#25D366] px-6 py-3.5 text-base font-bold text-[#04210f] shadow-[0_10px_30px_rgba(37,211,102,0.32)] transition hover:-translate-y-0.5 hover:brightness-105"
                  >
                    <MessageCircle className="h-5 w-5" /> Message Sean now
                  </button>
                  <button
                    onClick={() => scrollToCalculator("mid_cta")}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#f7b52b]/50 px-5 py-3.5 text-base font-bold text-[#f7b52b] transition hover:-translate-y-0.5 hover:bg-[#f7b52b]/10"
                  >
                    <Sparkles className="h-4.5 w-4.5" /> See my price
                  </button>
                </div>
                <p className="text-xs text-white/50">AED 4,550+ in free extras · No upsell</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Meet Sean ─────────────────────────────────────────────────── */}
      <section className="bg-[#070707] px-4 py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] sm:text-[11px]" style={{ color: GOLD }}>
              Meet Sean · Founder & lead installer
            </p>
            <h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">
              One person owns your car
              <span className="block" style={{ color: GOLD }}>from quote to handover.</span>
            </h2>
            <p className="mt-3 text-base leading-7 text-slate-300 sm:text-lg">
              Most PPF shops bounce you between a sales WhatsApp, a coordinator, and a technician
              you never meet. Here, Sean answers your first message, reviews your car, and signs
              off the final QC himself.
            </p>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-[1.05fr_1.95fr] lg:items-center lg:gap-8">
            <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent">
              <div className="relative aspect-[4/5] w-full overflow-hidden sm:aspect-[5/6] lg:aspect-[4/5]">
                <img src="/guided-sean-with-patrols-v2.jpg" alt="Sean — founder of Grand Touch Auto" loading="lazy" className="h-full w-full object-cover" />
                <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/30 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-black" style={{ background: GOLD }}>
                      <UserCheck className="h-3 w-3" /> Founder
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-black/50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white backdrop-blur">
                      <ShieldCheck className="h-3 w-3" style={{ color: GOLD }} /> STEK-authorised
                    </span>
                  </div>
                  <p className="mt-3 text-lg font-black text-white sm:text-xl">Sean</p>
                  <p className="text-xs font-semibold text-slate-300 sm:text-sm">Founder · Lead installer · Your direct contact</p>
                </div>
              </div>
            </div>

            <div className="flex h-full flex-col gap-4">
              <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
                {meetSeanPillars.map(({ icon: Icon, title, body }) => (
                  <Card key={title} className="flex h-full flex-col rounded-2xl border-white/10 bg-[linear-gradient(180deg,rgba(247,181,43,0.06),rgba(255,255,255,0.015))] p-4 text-white sm:p-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f7b52b]/15 ring-1 ring-[#f7b52b]/30">
                      <Icon className="h-5 w-5" style={{ color: GOLD }} />
                    </div>
                    <h3 className="mt-3 text-base font-black leading-tight">{title}</h3>
                    <p className="mt-1.5 text-sm leading-6 text-slate-300">{body}</p>
                  </Card>
                ))}
              </div>

              <figure className="relative overflow-hidden rounded-2xl border border-[#f7b52b]/25 bg-[linear-gradient(135deg,rgba(247,181,43,0.08),transparent_60%)] p-5 sm:p-6">
                <span aria-hidden className="absolute left-3 top-1 text-6xl font-black leading-none text-[#f7b52b]/15">"</span>
                <blockquote className="relative text-sm leading-7 text-slate-100 sm:text-base sm:leading-8">
                  STEK is STEK — the same roll wherever it's installed properly. What separates an
                  install you forget about from one you regret is the prep, the fitment, and the
                  person still answering your messages two years later. That part doesn't get cut here.
                </blockquote>
                <figcaption className="mt-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em]" style={{ color: GOLD }}>
                  <span>— Sean, founder</span>
                </figcaption>
              </figure>
            </div>
          </div>
        </div>
      </section>

      {/* ── Where cheap PPF goes wrong (objection-busting + install photos) ── */}
      <section className="border-t border-white/10 bg-[radial-gradient(circle_at_85%_0%,rgba(247,181,43,0.08),transparent_55%),#050505] px-4 py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.22em] sm:text-[11px]" style={{ color: GOLD }}>
              <AlertTriangle className="h-3.5 w-3.5" /> Where cheap PPF jobs go wrong
            </p>
            <h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">
              The risk is the install
              <span className="block" style={{ color: GOLD }}>— not the film.</span>
            </h2>
            <p className="mt-3 text-base leading-7 text-slate-300 sm:text-lg">
              Almost every PPF complaint in Dubai owner groups traces back to one of these four
              mistakes. Each one is preventable with discipline at the right stage.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {wentWrong.map((card) => (
              <Card key={card.problem} className="group relative flex flex-col overflow-hidden rounded-3xl border-white/10 bg-[#0a0a0a] text-white sm:flex-row">
                <div className="relative aspect-[4/3] w-full overflow-hidden sm:aspect-auto sm:h-auto sm:w-[42%] sm:min-h-[200px]">
                  <img src={card.image} alt={card.problem} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                  <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                </div>
                <div className="flex flex-1 flex-col gap-3 p-5 sm:p-6">
                  <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-red-300">
                    <X className="h-3 w-3" /> The mistake
                  </span>
                  <h3 className="text-lg font-black leading-tight sm:text-xl">{card.problem}</h3>
                  <div className="flex items-start gap-2 rounded-2xl border border-[#f7b52b]/20 bg-[#f7b52b]/[0.06] p-3">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" style={{ color: GOLD }} />
                    <p className="text-xs leading-6 text-slate-200 sm:text-sm sm:leading-6">
                      <span className="font-black uppercase tracking-wider" style={{ color: GOLD }}>How we prevent it: </span>
                      {card.fix}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <CtaPair placement="install_risk" primaryLabel="Get my prep-first quote" microcopy="Prep-first install · Genuine STEK · Traceable warranty" />
        </div>
      </section>

      {/* ── How the 15-min quote works ────────────────────────────────── */}
      <section className="border-y border-white/10 bg-white/[0.02]">
        <div className="mx-auto max-w-6xl px-4 py-12 lg:py-16">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-2xl font-black tracking-tight sm:text-3xl">Your quote in 15 minutes, on WhatsApp</h2>
              <p className="mt-2 max-w-2xl text-white/65">No long forms, no waiting for a callback that never comes. Just a quick chat.</p>
            </div>
            <button
              onClick={() => requestWhatsApp("process")}
              className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-5 py-3 text-sm font-bold text-[#04210f] transition hover:brightness-105"
            >
              <MessageCircle className="h-4 w-4" /> Start now
            </button>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {steps.map(({ title, body }, i) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-[#070707] p-6">
                <span className="mb-4 flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-[#04210f]" style={{ background: GOLD }}>{i + 1}</span>
                <h3 className="text-base font-semibold">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-white/60">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Included free (full stack) ────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-12 lg:py-16">
        <div className="grid items-start gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#f7b52b]/30 bg-[#f7b52b]/[0.07] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em]" style={{ color: GOLD }}>
              <Gift className="h-3.5 w-3.5" /> AED 4,550+ in free extras included
            </div>
            <h2 className="text-2xl font-black tracking-tight sm:text-3xl">More than film — the full protection package</h2>
            <p className="mt-2 text-white/65">
              Every full PPF includes the lot below as standard — no upsell. Ask Sean on WhatsApp to
              confirm what's included for your car.
            </p>
            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:items-center">
              <button
                onClick={() => requestWhatsApp("offer")}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 py-3 text-sm font-bold text-[#04210f] transition hover:brightness-105"
              >
                <MessageCircle className="h-4 w-4" /> Claim it on WhatsApp
              </button>
              <button
                onClick={() => scrollToCalculator("offer")}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#f7b52b]/50 px-5 py-3 text-sm font-bold text-[#f7b52b] transition hover:bg-[#f7b52b]/10"
              >
                <Sparkles className="h-4 w-4" /> See my price
              </button>
            </div>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {includedExtras.map((item) => (
              <li key={item} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                <span className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full" style={{ background: "rgba(37,211,102,0.16)" }}>
                  <Check className="h-3.5 w-3.5 text-[#25D366]" />
                </span>
                <span className="text-sm leading-relaxed text-white/80">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Guided calculator (ungated) ───────────────────────────────── */}
      <section ref={calcRef} className="scroll-mt-20 border-y border-white/10 bg-[radial-gradient(circle_at_85%_0%,rgba(247,181,43,0.08),transparent_55%),#070707]">
        <div className="mx-auto max-w-4xl px-4 py-12 lg:py-16">
          <div className="mx-auto mb-8 max-w-2xl text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] sm:text-[11px]" style={{ color: GOLD }}>
              Build your price
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">See a live full-body PPF estimate</h2>
            <p className="mt-2 text-white/65">
              Full-body STEK starts from {formatAED(FULL_BODY_FROM)}. Build your spec for a starting
              price, then lock the exact number with Sean on WhatsApp.
            </p>
          </div>
          <GuidedPpfCalculator onWhatsApp={requestWhatsApp} onEvent={trackEvent} />
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-4 py-12 lg:py-16">
        <h2 className="text-center text-2xl font-black tracking-tight sm:text-3xl">Quick questions, quick answers</h2>
        <Accordion type="single" collapsible className="mt-8">
          {faqs.map(({ q, a }) => (
            <AccordionItem key={q} value={q} className="border-white/10">
              <AccordionTrigger className="text-left text-base font-semibold hover:no-underline [&>svg]:hidden">
                <span className="flex w-full items-center justify-between gap-3">
                  {q}
                  <ChevronDown className="h-4 w-4 flex-none text-white/50 transition-transform" />
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-white/65">{a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* ── Final CTA band ────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 pb-24 lg:pb-28">
        <div
          className="relative overflow-hidden rounded-3xl border border-white/10 px-6 py-12 text-center lg:py-16"
          style={{ background: "radial-gradient(800px 300px at 50% 0%, rgba(247,181,43,0.18), transparent), #111114" }}
        >
          <Clock className="mx-auto mb-3 h-6 w-6" style={{ color: GOLD }} />
          <h2 className="text-2xl font-black tracking-tight sm:text-3xl">Protect it before the next stone chip</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/70">Send your car now and have your exact quote before you finish your coffee.</p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              onClick={() => requestWhatsApp("final")}
              className="inline-flex items-center gap-2.5 rounded-2xl bg-[#25D366] px-7 py-4 text-base font-bold text-[#04210f] shadow-[0_10px_30px_rgba(37,211,102,0.35)] transition hover:-translate-y-0.5 hover:brightness-105"
            >
              <MessageCircle className="h-5 w-5" /> Get my 15-min quote
            </button>
            <button
              onClick={() => scrollToCalculator("final")}
              className="inline-flex items-center gap-2 rounded-2xl border border-[#f7b52b]/50 px-6 py-4 text-base font-bold text-[#f7b52b] transition hover:-translate-y-0.5 hover:bg-[#f7b52b]/10"
            >
              <Sparkles className="h-4.5 w-4.5" /> See my price
            </button>
            <button
              onClick={() => requestCall("final")}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/20 px-6 py-4 text-base font-semibold text-white/90 transition hover:border-white/40"
            >
              <Phone className="h-4.5 w-4.5" /> {DISPLAY_PHONE}
            </button>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-white/55">
            <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Free pickup across Dubai</span>
            <span className="inline-flex items-center gap-1.5"><Star className="h-3.5 w-3.5 fill-[#FBBC05] text-[#FBBC05]" /> 4.9 on Google</span>
            <span className="inline-flex items-center gap-1.5"><BadgeCheck className="h-3.5 w-3.5" /> Authorised STEK installer</span>
          </div>
        </div>
      </section>

      {/* ── SEO keyword footer (relevance for the Search ads) ─────────── */}
      <section className="border-t border-white/10 px-4 py-8">
        <p className="mx-auto max-w-4xl text-center text-[12px] leading-6 text-white/35">
          Grand Touch Auto — paint protection film (PPF) &amp; PPF coating specialists in Dubai.
          Full-body and front-end PPF, matte &amp; gloss, for sedans, sports cars and SUVs. Genuine
          STEK film, free pickup across Dubai, and a traceable warranty. Get your PPF Dubai price on
          WhatsApp in 15 minutes.
        </p>
      </section>

      {/* ── Mobile sticky WhatsApp bar (slim) ─────────────────────────── */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#070707]/95 px-3 py-2 backdrop-blur transition-transform duration-300 sm:hidden",
          showStickyBar ? "translate-y-0" : "translate-y-full",
        )}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => requestCall("sticky")}
            className="flex flex-none items-center justify-center rounded-lg border border-white/20 px-3 py-2.5 text-white/90"
            aria-label="Call Sean"
          >
            <Phone className="h-4.5 w-4.5" />
          </button>
          <button
            onClick={() => scrollToCalculator("sticky")}
            className="flex flex-none items-center justify-center gap-1.5 rounded-lg border border-[#f7b52b]/50 px-3 py-2.5 text-sm font-bold text-[#f7b52b]"
          >
            <Sparkles className="h-4 w-4" /> See my price
          </button>
          <button
            onClick={() => requestWhatsApp("sticky")}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 py-2.5 text-sm font-bold text-[#04210f]"
          >
            <MessageCircle className="h-4.5 w-4.5" /> WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}
