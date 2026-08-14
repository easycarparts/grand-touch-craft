import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  captureLeadSnapshot,
  createFunnelTrackingContext,
  trackFunnelEvent,
  type MetaStandardEvent,
} from "@/lib/funnel-analytics";
import { updatePageSEO } from "@/lib/seo";
import { PhoneInputWithCountry } from "@/components/PhoneInputWithCountry";
import { cn } from "@/lib/utils";
import LuxCard from "@/components/gtlux/LuxCard";
import AskGrandTouch from "@/components/gtlux/AskGrandTouch";
import { WarrantyCertificateShowcase } from "@/components/gtlux/WarrantyCertificateGT";
import { GtFaq, GtFilmStrip, GtSection, GtStickyBar, GtTrustRow } from "@/components/gtlux/GtShared";
import { GT_CERT_SAMPLE, GT_FAQ, GT_IMAGES, GT_PROCESS_STEPS, GT_SIZE_NOTE, GT_TIERS, type GtTierKey } from "@/lib/gtProgram";
import logo from "@/assets/logo.svg";

/**
 * GT WARRANTY FUNNEL (2026-08) — Meta-ads LP for the Protection Program.
 * Forked from the PpfMetaPriceBuilder playbook (one screen, everything visible,
 * no stepper — the stepper lost ~75% of starters before the price) but the toy
 * is inverted: with one price per program there is nothing to "calculate", so
 * the interactive object is the COVER, not the number. Downgrading a tier never
 * hides a row — it flips it to its à-la-carte state (struck, dimmed, priced),
 * so the page performs the no-discount argument before the chat ever has to.
 * Tracking is META ONLY, same rules as the builder: fbq Contact on WhatsApp
 * taps, fbq Lead ONCE per session on successful phone capture, nothing to
 * GTM/gtag on tap events (emitToTagManagers: false).
 */

const SEO_KEY = "ppf-lifetime-warranty";
const PAGE_URL = "https://www.grandtouchauto.ae/ppf-lifetime-warranty";
const FUNNEL_NAME = "gt_warranty_meta_2026h2";
const SERVICE_NAME = "GT Warranty Funnel - Cover Lock";

const WHATSAPP_NUMBER = "971567191045";
const buildWhatsAppUrl = (message: string) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

/** The bonus behind the phone lock. Value-add only — never a discount. Scoped
 *  to install day so it doesn't collide with Concours' every-visit logistics. */
const BONUS_LABEL = "Free collection + delivery on install day";

const GOLD_GRADIENT = "linear-gradient(135deg, hsl(38 92% 58%), hsl(18 95% 58%))";

const fmt = (value: number) => value.toLocaleString("en-AE");

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

/**
 * The cover ledger. "in" = covered, "half" = a lesser version survives,
 * "out" = gone — and the à-la-carte cost the owner carries appears instead.
 * Rows never unmount on tier change; they change state. Loss framing as UI.
 * Rows are grouped, and value rows carry a right-column worth tag — the ledger
 * has to justify every dirham of the step-up, not list features.
 */
type LedgerState = {
  kind: "in" | "half" | "out";
  detail: string;
  /** Right-column tag: gold = value included, cost = what you carry instead. */
  tag?: { text: string; tone: "gold" | "cost" };
};
type LedgerRow = { id: string; label: string; states: Record<GtTierKey, LedgerState> };
type LedgerGroup = { title: string; rows: LedgerRow[] };

/** The headline item gets marquee treatment, not a row. */
const TERM_DISPLAY: Record<GtTierKey, { big: string; sub: string; ends: boolean }> = {
  essential: { big: "5 years", sub: "Film and workmanship — then cover ends.", ends: true },
  signature: { big: "Lifetime", sub: "Film AND labour, for as long as you own it — in writing.", ends: false },
  concours: { big: "Lifetime", sub: "Film AND labour, for as long as you own it — in writing.", ends: false },
};

const LEDGER_GROUPS: LedgerGroup[] = [
  {
    title: "The protection",
    rows: [
      {
        id: "panels",
        label: "Free panel replacements",
        states: {
          essential: { kind: "out", detail: "None", tag: { text: "AED 1,000+ per panel, on you", tone: "cost" } },
          signature: {
            kind: "in",
            detail: "3 — any damage, any cause. A scrape, a trolley, a careless valet",
            tag: { text: "no fault, no excess", tone: "gold" },
          },
          concours: {
            kind: "in",
            detail: "6 — any damage, any cause. A scrape, a trolley, a careless valet",
            tag: { text: "no fault, no excess", tone: "gold" },
          },
        },
      },
      {
        id: "yellowing",
        label: "Yellowing in Dubai heat",
        states: {
          essential: { kind: "half", detail: "Covered — but only for the 5-year term" },
          signature: { kind: "in", detail: "Covered for life, film and labour — no UV carve-out" },
          concours: { kind: "in", detail: "Covered for life, film and labour — no UV carve-out" },
        },
      },
    ],
  },
  {
    title: "The ownership",
    rows: [
      {
        id: "transfer",
        label: "When you sell the car",
        states: {
          essential: { kind: "out", detail: "No transfer — the cover ends with your ownership" },
          signature: {
            kind: "in",
            detail: "The defect cover transfers once — film and labour, for the car's next owner",
            tag: { text: "goes on your listing", tone: "gold" },
          },
          concours: {
            kind: "in",
            detail: "The defect cover transfers once — film and labour, for the car's next owner",
            tag: { text: "goes on your listing", tone: "gold" },
          },
        },
      },
      {
        id: "aftercare",
        label: "Aftercare",
        states: {
          essential: { kind: "half", detail: "One health check, at month 12" },
          signature: {
            kind: "in",
            detail: "Wash + inspection at 6 and 12 months, then yearly",
            tag: { text: "free, for life", tone: "gold" },
          },
          concours: {
            kind: "in",
            detail: "Yearly care + full ceramic refresh over the film, every visit",
            tag: { text: "free, for life", tone: "gold" },
          },
        },
      },
      {
        id: "ceramic",
        label: "Ceramic coatings",
        states: {
          essential: { kind: "out", detail: "Not included", tag: { text: "a paid add-on", tone: "cost" } },
          signature: {
            kind: "in",
            detail: "Ceramic over the film at install, plus leather and rim ceramic",
            tag: { text: "included", tone: "gold" },
          },
          concours: {
            kind: "in",
            detail: "Every surface — and renewed free at every yearly visit",
            tag: { text: "renewed free, for life", tone: "gold" },
          },
        },
      },
    ],
  },
  {
    title: "The install",
    rows: [
      {
        id: "film",
        label: "The film itself",
        states: {
          essential: { kind: "in", detail: "Self-healing gloss TPU, GT-certified" },
          signature: {
            kind: "in",
            detail: "Diamond Pro premium TPU — self-healing, hydrophobic, registered to your car",
          },
          concours: {
            kind: "in",
            detail: "Diamond Pro X — the PCU flagship. A harder chemistry built for Gulf heat",
            tag: { text: "15-year film registration", tone: "gold" },
          },
        },
      },
      {
        id: "coverage",
        label: "What gets wrapped",
        states: {
          essential: { kind: "in", detail: "Every painted panel + headlights" },
          signature: { kind: "in", detail: "+ door jambs and boot strip — edges wrapped out of sight" },
          concours: { kind: "in", detail: "+ concours preparation — a completely seamless, invisible finish" },
        },
      },
      {
        id: "certificate",
        label: "The document",
        states: {
          essential: { kind: "in", detail: "Signed, numbered certificate at handover" },
          signature: { kind: "in", detail: "Signed, numbered certificate at handover" },
          concours: { kind: "in", detail: "Signed, numbered certificate at handover" },
        },
      },
    ],
  },
];

/**
 * The 2-tap guide. Cold Meta traffic doesn't digest a ledger at a glance —
 * two cheap questions personalize the reveal instead. Lessons honoured from
 * the guided funnels: taps stay cheap (the forced car step collapsed
 * submissions to zero, 2026-07-11), a skip path always exists, and the
 * answers ride into the CRM payload so leads arrive pre-qualified.
 */
/** The guide is the assistant itself — Grok with the GT persona tells the
 *  story live and answers anything. These chips solve the cold-start: a lead
 *  who knows nothing about PPF doesn't know what to ask, so we hand them the
 *  four questions that matter. Each maps to a story the persona tells well. */
// Three simple doors — each maps to a SCRIPTED first reply in the edge
// function, so every conversation starts at the same measurable station.
const ASK_OPENERS = [
  "I need PPF",
  "Window tint",
  "Just a question",
];

/** Steering ladder for visitors who never type: each assistant turn ends with
 *  the next questions we WANT asked — story → objection kill → close. The
 *  brain's own `followups` override these once the new persona ships. */
const ASK_FOLLOWUPS: string[][] = [
  [
    "So what's actually covered for life?",
    "What would that cost me somewhere else?",
    "Which program fits my car?",
  ],
  [
    "What's the catch — what voids it?",
    "What happens when I sell the car?",
    "Why one price for every car?",
  ],
  [
    "How many cars do you take a month?",
    "What's the next available week?",
    "Take my number and hold me a slot",
  ],
];

/** The step-up, itemized — every increase justifies itself line by line. */
const STEP_UP: Record<"essential" | "signature", { to: GtTierKey; toName: string; delta: number; gains: string[] }> = {
  essential: {
    to: "signature",
    toName: "Signature",
    delta: GT_TIERS[1].fullBody - GT_TIERS[0].fullBody,
    gains: [
      "The warranty stops expiring — lifetime, film AND labour",
      "3 panels of damage are on us — refilms you'd otherwise pay AED 1,000+ each for",
      "The defect cover transfers to the next owner when you sell",
      "Washed, inspected and signed off free — every year, forever",
    ],
  },
  signature: {
    to: "concours",
    toName: "Concours",
    delta: GT_TIERS[2].fullBody - GT_TIERS[1].fullBody,
    gains: [
      "The film itself steps up — Diamond Pro X, the PCU flagship, 15-year registration",
      "6 free panel replacements — double the no-fault cover",
      "Concours preparation — a completely seamless, invisible finish",
      "Ceramic over every surface, renewed free at every visit",
      "Priority booking, with collection & delivery at every aftercare visit",
    ],
  },
};

/** The four conversations Sean has every week, answered the way he answers them. */
const OBJECTIONS: { q: string; a: string[] }[] = [
  {
    q: "Another shop quoted me 8,000 for “the same thing.”",
    a: [
      "That quote is real — for what it is. Here's what we see from this side: we've stripped and re-done other shops' film in this studio more than a few times. Peeling in year two. Claim refused. The owner blamed for “improper care.”",
      "So ask the question that decides it: at that price, what is actually funding the warranty? A warranty is a promise about someone's labour and materials years from now — something has to pay for that day.",
      "You're not comparing two prices. You're comparing who's holding the problem in year three. Here, that's us — in writing.",
    ],
  },
  {
    q: "Do you discount?",
    a: [
      "No — and the builder above shows you why. The number only moves when cover comes off. Take off the panel replacements: that's AED 1,000+ per panel the day you need one. Take off the lifetime: your cover now has an end date. Take off the transfer and the inspections — now it's cheap.",
      "The stripped version already exists. It's called GT Essential, it's 7,900, and it's honest about what it is.",
      "So the real question isn't the discount. It's this: what matters more — the price, or the peace of mind?",
    ],
  },
  {
    q: "I'll sell the car before “lifetime” matters.",
    a: [
      "Most owners do — that's exactly why ours transfers. Once, to the next owner, for the rest of its life. Registered at the studio in twenty minutes. The defect cover — film and labour — is what carries; unused panel credits and free aftercare stay with you, because you bought them.",
      "It goes on your listing: full-body PPF, a lifetime warranty the buyer inherits. That's money back at resale, not a receipt in the glovebox.",
      "A warranty that dies the day you sell tells you what it was worth while you owned it.",
    ],
  },
  {
    q: "Is yellowing genuinely covered?",
    a: [
      "Film and labour, yes. Read a film-brand warranty closely: yellowing is often covered only when it's ruled a manufacturing defect — with UV and heat carved out. In a Dubai summer, that carve-out is the whole warranty.",
      "Ours has no such clause. If the film on your car yellows, we replace the film and we pay the labour.",
    ],
  },
];

/** Real handover clips — same Cloudinary library the Meta builder's carousel
 *  uses. Posters only until tapped; video loads on demand (preload none). */
type HandoverClip = { name: string; car: string; videoSrc: string; posterSrc: string; google?: boolean };

const HANDOVER_CLIPS: HandoverClip[] = [
  {
    name: "Samir",
    car: "Porsche 911 · Matte PPF",
    videoSrc: "https://res.cloudinary.com/diw6rekpm/video/upload/q_auto/v1781333287/911_MATTE_aaomcw.mp4",
    posterSrc: "https://res.cloudinary.com/diw6rekpm/video/upload/so_2/v1781333287/911_MATTE_aaomcw.jpg",
  },
  {
    name: "Mansoor",
    car: "Porsche 911 · Gloss",
    videoSrc: "https://res.cloudinary.com/diw6rekpm/video/upload/q_auto/v1781333400/911_4_vcvvkn.mp4",
    posterSrc: "https://res.cloudinary.com/diw6rekpm/video/upload/so_2/v1781333400/911_4_vcvvkn.jpg",
  },
  {
    name: "Scott",
    car: "Jetour G700 · Matte + paint match",
    videoSrc: "https://res.cloudinary.com/diw6rekpm/video/upload/q_auto/v1781333432/G7_BLUE_wlvxks.mp4",
    posterSrc: "https://res.cloudinary.com/diw6rekpm/video/upload/so_2/v1781333432/G7_BLUE_wlvxks.jpg",
  },
  {
    name: "Mark",
    car: "Zeekr 001 · Owner review",
    google: true,
    videoSrc: "https://res.cloudinary.com/diw6rekpm/video/upload/q_auto/f_auto/v1775562589/Mark_Zeekr_conzdp.mp4",
    posterSrc: "/mark-zeekr-001.png",
  },
  {
    name: "Alex",
    car: "Aston Martin Rapide · Colour PPF",
    videoSrc: "https://res.cloudinary.com/diw6rekpm/video/upload/q_auto/v1781333953/Aston_Martin_Rapide_S_rstzr2.mp4",
    posterSrc: "https://res.cloudinary.com/diw6rekpm/video/upload/so_2/v1781333953/Aston_Martin_Rapide_S_rstzr2.jpg",
  },
];

/** Poster-first video card: nothing loads until the tap. `playing` is owned by
 *  the section so only one clip can have audio at a time. */
const HandoverCard = ({
  clip,
  featured = false,
  playing,
  onPlay,
}: {
  clip: HandoverClip;
  featured?: boolean;
  playing: boolean;
  onPlay: (name: string) => void;
}) => {
  return (
    <figure
      className={cn(
        "gtwf-clip group relative overflow-hidden rounded-lg border border-border/60 bg-black",
        featured ? "aspect-[4/5] w-full" : "aspect-[4/5] w-[68vw] max-w-[240px] flex-none snap-center sm:w-[240px]",
      )}
    >
      {playing ? (
        <video
          src={clip.videoSrc}
          poster={clip.posterSrc}
          controls
          autoPlay
          playsInline
          className="h-full w-full object-cover"
        />
      ) : (
        <button
          type="button"
          className="absolute inset-0 h-full w-full text-left"
          onClick={() => onPlay(clip.name)}
          aria-label={`Play ${clip.name}'s handover — ${clip.car}`}
        >
          <img
            src={clip.posterSrc}
            alt={`${clip.name} — ${clip.car}`}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
          <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
          <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-4">
            <span>
              <span className="block text-[13.5px] font-semibold text-white">{clip.name}</span>
              <span className="mt-0.5 block text-[11px] text-white/70">{clip.car}</span>
              {clip.google && (
                <span className="mt-1.5 inline-block rounded-full border border-white/25 bg-black/50 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-white/90">
                  ★ Google review
                </span>
              )}
            </span>
            <span className="gtwf-play" aria-hidden>
              <svg viewBox="0 0 14 14" fill="currentColor">
                <path d="M4 2.5v9l7.5-4.5L4 2.5z" />
              </svg>
            </span>
          </span>
        </button>
      )}
    </figure>
  );
};

/** FAQ subset for this LP — funnel-relevant picks from the single source. */
const FAQ_PICKS = [
  "How much does PPF cost in Dubai?",
  "What does the lifetime warranty actually cover?",
  "What happens to the warranty if I sell the car?",
  "Another shop quoted me 7,000 for full body. Why pay 12,900?",
  "What voids the warranty?",
  "How long does installation take?",
];

const FUNNEL_FAQ = GT_FAQ.filter((item) => FAQ_PICKS.includes(item.q));

/** Odometer price: per-digit columns roll to the new value. Never gold, never
 *  small. Columns are keyed by their position FROM THE RIGHT so the shared
 *  ",900" tail keeps stable keys when the digit count changes (7,900 ↔ 12,900)
 *  and actually rolls instead of remounting. */
const PriceOdometer = ({ value }: { value: number }) => {
  const chars = fmt(value).split("");
  return (
    <span className="gtwf-odo" aria-hidden>
      {chars.map((ch, i) => {
        const fromRight = chars.length - i;
        return /\d/.test(ch) ? (
          <span key={`d${fromRight}`} className="gtwf-odo-col">
            <span
              className="gtwf-odo-strip"
              style={{ transform: `translateY(-${Number(ch)}em)` }}
            >
              {Array.from({ length: 10 }, (_, d) => (
                <span key={d}>{d}</span>
              ))}
            </span>
          </span>
        ) : (
          <span key={`s${fromRight}`}>{ch}</span>
        );
      })}
    </span>
  );
};

/** Ledger disc: gold filled tick / hollow half-mark / struck-out minus. */
const LedgerDisc = ({ kind }: { kind: LedgerState["kind"] }) => (
  <span className={cn("gtwf-disc", `gtwf-disc-${kind}`)} aria-hidden>
    {kind === "in" && (
      <svg viewBox="0 0 16 16" fill="none">
        <path className="gtwf-tick" d="M3.5 8.5l3 3 6-6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )}
    {kind === "half" && <span className="gtwf-halfmark" />}
    {kind === "out" && (
      <svg viewBox="0 0 16 16" fill="none">
        <path d="M4 8h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    )}
  </span>
);

const TIER_ORDER: GtTierKey[] = ["essential", "signature", "concours"];

const PpfLifetimeWarranty = () => {
  const [tier, setTier] = useState<GtTierKey>("signature");
  const [askPrompt, setAskPrompt] = useState<{ text: string; nonce: number } | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  // Exit save: an engaged, uncaptured visitor tapping X is the highest-value
  // interception in the funnel (exit offers recover ~10-15% when contextual).
  // Shown once per session, honest copy, WhatsApp escape hatch alongside.
  const [exitSave, setExitSave] = useState<"hidden" | "open" | "saving" | "saved" | "invalid" | "error">("hidden");
  const [exitPhone, setExitPhone] = useState("");
  /** Mobile chat height driven by visualViewport, so the composer rides on top
   *  of the keyboard instead of hiding under it. null = CSS classes rule. */
  const [chatShellHeight, setChatShellHeight] = useState<number | null>(null);
  const exitSaveShownRef = useRef(false);
  const assistantEngagedRef = useRef(false);
  const [assistantCaptured, setAssistantCaptured] = useState(false);
  const [vehicle, setVehicle] = useState("");
  const [activeClip, setActiveClip] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [phoneStatus, setPhoneStatus] = useState<"idle" | "saving" | "saved" | "invalid" | "error">("idle");
  const [phoneCapturedAt, setPhoneCapturedAt] = useState<string | null>(null);
  // Certificate personalization — the specimen renders with their own name and
  // car typed in. The typed name rides into the CRM snapshot on capture.
  const [certName, setCertName] = useState("");
  const [certCar, setCertCar] = useState("");
  const certPersonalizedRef = useRef(false);
  const metaLeadFiredRef = useRef(false);
  const priceViewedRef = useRef(false);
  const priceShownRef = useRef(false);
  const closeReachedRef = useRef(false);
  const builderRef = useRef<HTMLDivElement | null>(null);
  const [builderOffscreen, setBuilderOffscreen] = useState(false);

  const selected = useMemo(() => GT_TIERS.find((t) => t.key === tier) ?? GT_TIERS[1], [tier]);
  // Full body only on this funnel — the ads sell the program, not partial covers.
  const price = selected.fullBody;

  /** The specimen certificate, personalized live. The document's headline is
   *  "Lifetime", so the programme line only follows lifetime tiers — Essential
   *  keeps the sample's Signature label rather than rendering a false cert. */
  const certSample = useMemo(
    () => ({
      ...GT_CERT_SAMPLE,
      owner: certName.trim() || GT_CERT_SAMPLE.owner,
      vehicle: certCar.trim() || GT_CERT_SAMPLE.vehicle,
      vehicleMeta: certCar.trim() ? "Registered at install" : GT_CERT_SAMPLE.vehicleMeta,
      programme: tier === "essential" ? GT_CERT_SAMPLE.programme : selected.name,
    }),
    [certName, certCar, tier, selected.name],
  );

  const funnelContext = useMemo(
    () =>
      createFunnelTrackingContext({
        funnelName: FUNNEL_NAME,
        landingPageVariant: FUNNEL_NAME,
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

  const buildPayload = useCallback(
    () => ({
      calculator_type: "gt_warranty_cover_builder",
      package_name: selected.name,
      tier: selected.key,
      coverage: "Full Body",
      warranty_line: selected.warrantyShort,
      estimate_value: price,
      final_price: price,
      service_price: price,
      vehicle_model: vehicle.trim() || undefined,
    }),
    [selected, price, vehicle],
  );

  // ── SEO + first paint. The price is on screen from the start, so the reveal
  // pair fires on mount (keeps reveal-rate honest, same as the builder).
  useEffect(() => {
    updatePageSEO(SEO_KEY, {
      title: "Lifetime-Warranty PPF from AED 12,900 — Film & Labour | Grand Touch",
      description:
        "Full-body PPF with a lifetime warranty on film AND labour — signed, numbered, published word for word. One price, every car. It even transfers when you sell.",
      keywords:
        "ppf lifetime warranty dubai, ppf dubai, paint protection film dubai, ppf price dubai, full body ppf dubai, ppf warranty dubai, best ppf dubai",
      ogTitle: "Lifetime-warranty PPF from AED 12,900 — film and labour, in writing",
      ogDescription:
        "Build your cover: lifetime warranty, free panel replacements, transfer when you sell. Watch what the cheaper number removes.",
    });
    trackEvent("lp_view", { calculator_type: "gt_warranty_cover_builder" });
    // The builder (and its price) renders from first paint, so the reveal
    // pair fires on mount (keeps reveal-rate honest).
    if (!priceViewedRef.current) {
      priceViewedRef.current = true;
      trackEvent("price_viewed", buildPayload());
      trackEvent("guided_price_revealed", buildPayload());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Runtime JSON-LD, removed on unmount so other routes stay clean.
  useEffect(() => {
    const blocks = [
      {
        "@context": "https://schema.org",
        "@type": "Service",
        name: "GT Protection Program — PPF with Lifetime Warranty, Dubai",
        serviceType: "Paint Protection Film installation",
        url: PAGE_URL,
        provider: {
          "@type": "AutoRepair",
          name: "Grand Touch Auto Repair",
          url: "https://www.grandtouchauto.ae",
          telephone: "+971567191045",
          address: {
            "@type": "PostalAddress",
            streetAddress: "DIP 2, Dubai Investment Park - 2, Thani warehouse - 3 11b",
            addressLocality: "Dubai",
            addressCountry: "AE",
          },
          aggregateRating: { "@type": "AggregateRating", ratingValue: "4.9", reviewCount: "83" },
        },
        areaServed: { "@type": "City", name: "Dubai" },
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "GT Protection Program",
          itemListElement: GT_TIERS.map((t) => ({
            "@type": "Offer",
            name: `GT ${t.name} — full body PPF`,
            priceSpecification: { "@type": "PriceSpecification", price: t.fullBody, priceCurrency: "AED" },
            description: t.warrantyLine,
          })),
        },
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: FUNNEL_FAQ.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      },
    ];
    const tags = blocks.map((block, i) => {
      const tag = document.createElement("script");
      tag.type = "application/ld+json";
      tag.setAttribute("data-gtwf-jsonld", String(i));
      tag.textContent = JSON.stringify(block);
      document.head.appendChild(tag);
      return tag;
    });
    return () => tags.forEach((tag) => tag.remove());
  }, []);

  // ── Section analytics: same names as the other funnels so the admin
  // dashboard reads every LP with one query.
  useEffect(() => {
    if (typeof window === "undefined" || typeof IntersectionObserver === "undefined") return;
    const pageStartedAt = Date.now();
    const seen = new Set<string>();
    let engaged: { name: string; since: number } | null = null;
    const flush = () => {
      if (!engaged) return;
      const dwell = Date.now() - engaged.since;
      if (dwell >= 750) {
        // duration_ms, not dwell_ms — the admin dashboard's section-timing
        // reader hard-requires this key.
        trackEvent("section_engagement", { section_name: engaged.name, duration_ms: dwell });
      }
      engaged = null;
    };
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const name = entry.target.getAttribute("data-funnel-section") ?? "unknown";
          if (entry.isIntersecting && entry.intersectionRatio >= 0.25) {
            if (!seen.has(name)) {
              seen.add(name);
              trackEvent("section_view", { section_name: name });
            }
            if (engaged?.name !== name) {
              flush();
              engaged = { name, since: Date.now() };
            }
          } else if (engaged?.name === name) {
            flush();
          }
        });
      },
      { threshold: [0.25] },
    );
    document.querySelectorAll("[data-funnel-section]").forEach((el) => io.observe(el));
    // Re-arm dwell when the tab comes back — otherwise the first section after
    // a visibility flip never accrues time.
    const rearmFromViewport = () => {
      const inView = [...document.querySelectorAll("[data-funnel-section]")].find((el) => {
        const r = el.getBoundingClientRect();
        return r.top < window.innerHeight * 0.75 && r.bottom > window.innerHeight * 0.25;
      });
      if (inView) engaged = { name: inView.getAttribute("data-funnel-section") ?? "unknown", since: Date.now() };
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
      else rearmFromViewport();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", flush);
    const scrollPercent = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      return max > 0 ? Math.round((window.scrollY / max) * 100) : 0;
    };
    const heartbeat = window.setInterval(
      () =>
        trackEvent("page_checkpoint", {
          checkpoint_reason: "heartbeat_12s",
          elapsed_ms: Date.now() - pageStartedAt,
          active_section: engaged?.name ?? "",
          current_scroll_percent: scrollPercent(),
        }),
      12000,
    );
    return () => {
      flush();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", flush);
      window.clearInterval(heartbeat);
    };
  }, [trackEvent]);

  // ── Scroll reveals (once, subtle) + sticky-bar gating off the builder panel.
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const reveal = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("gtwf-in");
            reveal.unobserve(entry.target);
          }
        }),
      { threshold: 0.16 },
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => reveal.observe(el));
    let panelGate: IntersectionObserver | null = null;
    if (builderRef.current) {
      panelGate = new IntersectionObserver(
        ([entry]) => setBuilderOffscreen(!entry.isIntersecting && entry.boundingClientRect.bottom < 0),
        { threshold: 0 },
      );
      panelGate.observe(builderRef.current);
    }
    return () => {
      reveal.disconnect();
      panelGate?.disconnect();
    };
  }, []);

  const selectTier = (next: GtTierKey) => {
    if (next === tier) return;
    setTier(next);
    // Payload built from the INCOMING tier — buildPayload() still closes over
    // the tier being left (setTier hasn't re-rendered yet), which would stamp
    // the old package/price onto the new tier's events and poison the rollups.
    const nextTier = GT_TIERS.find((t) => t.key === next)!;
    const payload = {
      step_name: "tier",
      calculator_type: "gt_warranty_cover_builder",
      tier: next,
      package_name: nextTier.name,
      warranty_line: nextTier.warrantyShort,
      coverage: "Full Body",
      estimate_value: nextTier.fullBody,
      final_price: nextTier.fullBody,
      service_price: nextTier.fullBody,
    };
    trackEvent("calculator_selection_changed", payload);
    trackEvent("guided_step_completed", payload);
  };

  /** A question chip opens the full-screen chat and asks it. */
  const askQuestion = (question: string, placement: string) => {
    setChatOpen(true);
    setAskPrompt((prev) => ({ text: question, nonce: (prev?.nonce ?? 0) + 1 }));
    trackEvent("assistant_opener_clicked", { question, cta_location: placement, ...buildPayload() });
  };

  /** Closing the chat runs through here: an engaged visitor with no number in
   *  gets one save offer — then the X always works. */
  const attemptCloseChat = useCallback(() => {
    const uncaptured = !assistantCaptured && phoneStatus !== "saved";
    if (assistantEngagedRef.current && uncaptured && !exitSaveShownRef.current) {
      exitSaveShownRef.current = true;
      setExitSave("open");
      trackEvent("chat_exit_save_shown", buildPayload(), { emitToTagManagers: false });
      return;
    }
    setExitSave("hidden");
    setChatOpen(false);
  }, [assistantCaptured, phoneStatus, trackEvent, buildPayload]);

  const dismissExitSave = useCallback(() => {
    trackEvent("chat_exit_save_dismissed", buildPayload(), { emitToTagManagers: false });
    setExitSave("hidden");
    setChatOpen(false);
  }, [trackEvent, buildPayload]);

  const handleExitSave = useCallback(async () => {
    const cleaned = exitPhone.trim();
    if (!isLikelyRealPhone(cleaned)) {
      setExitSave("invalid");
      return;
    }
    setExitSave("saving");
    const result = await captureLeadSnapshot({
      snapshotType: "contact",
      context: funnelContext,
      fullName: certName.trim(),
      phone: cleaned,
      vehicleModel: vehicle.trim() || certCar.trim(),
      payload: {
        ...buildPayload(),
        service_name: SERVICE_NAME,
        capture_location: "chat_exit_save",
      },
    });
    if (!result.ok) {
      setExitSave("error");
      trackEvent(
        "lead_save_failed",
        { capture_location: "chat_exit_save", reason: ("reason" in result ? result.reason : null) ?? "unknown", ...buildPayload() },
        { emitToTagManagers: false },
      );
      return;
    }
    setExitSave("saved");
    trackEvent("lead_form_submitted", { form_type: "chat_exit_save", ...buildPayload() });
    if (!metaLeadFiredRef.current) {
      metaLeadFiredRef.current = true;
      trackMetaStandardEvent("Lead", {
        content_name: "GT Warranty Funnel",
        content_category: "PPF",
        capture_location: "chat_exit_save",
        value: price,
        currency: "AED",
      });
    }
    window.setTimeout(() => {
      setExitSave("hidden");
      setChatOpen(false);
    }, 1600);
  }, [exitPhone, funnelContext, certName, vehicle, certCar, buildPayload, trackEvent, trackMetaStandardEvent, price]);

  // Real-chat behaviour: the page behind the overlay must not scroll, and
  // Escape closes on desktop. The thread itself survives close/reopen via the
  // session restore.
  useEffect(() => {
    if (!chatOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") attemptCloseChat();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [chatOpen, attemptCloseChat]);

  // Keyboard-aware chat height: keyboards shrink only the VISUAL viewport
  // (iOS always; Android too on older Chrome), so a 100dvh shell keeps its
  // composer underneath the keys. Track visualViewport while the chat is open
  // and let it own the shell height on mobile widths only.
  useEffect(() => {
    if (!chatOpen) {
      setChatShellHeight(null);
      return;
    }
    const vv = window.visualViewport;
    if (!vv) return;
    const sync = () => {
      const mobile = window.matchMedia("(max-width: 767px)").matches;
      setChatShellHeight(mobile ? Math.round(vv.height) : null);
    };
    sync();
    vv.addEventListener("resize", sync);
    vv.addEventListener("scroll", sync);
    window.addEventListener("resize", sync);
    return () => {
      vv.removeEventListener("resize", sync);
      vv.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
      setChatShellHeight(null);
    };
  }, [chatOpen]);

  const whatsAppMessage = useMemo(() => {
    const carPart = vehicle.trim() ? ` Car: ${vehicle.trim()}.` : "";
    const warranty = tier === "essential" ? "5-year warranty" : "lifetime warranty";
    return (
      `Hi Sean, I built my cover on the lifetime warranty page.${carPart} ` +
      `Program: ${selected.name}, full body — ` +
      `AED ${fmt(price)} +VAT, ${warranty}. ` +
      `Can you confirm my install week?`
    );
  }, [vehicle, selected, tier, price]);

  /** Every WhatsApp tap fires Meta Contact — never Lead. Lead is reserved for
   *  the phone capture so the pixel trains on real numbers in the CRM. */
  const handleWhatsApp = useCallback(
    (placement: string) => {
      trackMetaStandardEvent("Contact", {
        content_name: "GT Warranty Funnel",
        content_category: "PPF",
        button_location: placement,
        value: price,
        currency: "AED",
      });
      trackEvent("whatsapp_click", { cta_location: placement, ...buildPayload() }, { emitToTagManagers: false });
      window.open(buildWhatsAppUrl(whatsAppMessage), "_blank", "noopener,noreferrer");
    },
    [trackMetaStandardEvent, trackEvent, buildPayload, price, whatsAppMessage],
  );

  /** Retargeting beacons from the chat: exactly TWO low-volume custom pixel
   *  events, once per session each — "saw the price" and "reached the close".
   *  They exist so Meta can build the audience standard events can't ("saw
   *  12,900, never dropped a number") for retargeting. The generic pipeline
   *  deliberately never mirrors customs to the pixel (it flooded the shared
   *  pixel and buried Lead) — these two are the whitelisted exception. */
  const handleAssistantTurn = useCallback(
    ({ reply, askedForPhone }: { reply: string; askedForPhone: boolean; leadCaptured: boolean }) => {
      if (!priceShownRef.current && /12,900|18,900|7,900/.test(reply)) {
        priceShownRef.current = true;
        trackEvent("assistant_price_shown", buildPayload(), { emitToTagManagers: false });
        try {
          window.fbq?.("trackCustom", "GtPriceShown", { funnel_name: FUNNEL_NAME });
        } catch { /* pixel absent/blocked — the Supabase event above still records it */ }
      }
      if (!closeReachedRef.current && askedForPhone) {
        closeReachedRef.current = true;
        trackEvent("assistant_close_reached", buildPayload(), { emitToTagManagers: false });
        try {
          window.fbq?.("trackCustom", "GtCloseReached", { funnel_name: FUNNEL_NAME });
        } catch { /* ditto */ }
      }
    },
    [trackEvent, buildPayload],
  );

  /** Phone capture = the bonus lock. CRM snapshot first; pixel Lead fires ONLY
   *  when the save succeeds, once per session. Failures surface as
   *  lead_save_failed so a silent CRM outage can't hide behind pixel numbers. */
  const handleCoverLock = useCallback(async () => {
    const cleaned = phone.trim();
    if (!isLikelyRealPhone(cleaned)) {
      setPhoneStatus("invalid");
      trackEvent("guided_invalid_phone_blocked", { capture_location: "cover_lock" }, { emitToTagManagers: false });
      return;
    }
    if (phoneCapturedAt === cleaned || phoneStatus === "saving") return;
    setPhoneStatus("saving");
    setPhoneCapturedAt(cleaned);
    trackEvent("guided_phone_captured", { capture_location: "cover_lock", ...buildPayload() });
    const result = await captureLeadSnapshot({
      snapshotType: "contact",
      context: funnelContext,
      // The certificate preview doubles as a name field — if they typed a name
      // to see it on the document, the lead arrives named.
      fullName: certName.trim(),
      phone: cleaned,
      vehicleModel: vehicle.trim() || certCar.trim(),
      payload: {
        ...buildPayload(),
        service_name: SERVICE_NAME,
        bonus: BONUS_LABEL,
      },
    });
    if (!result.ok) {
      setPhoneStatus("error");
      setPhoneCapturedAt(null); // allow retry with the same number
      trackEvent(
        "lead_save_failed",
        { capture_location: "cover_lock", reason: ("reason" in result ? result.reason : null) ?? "unknown", ...buildPayload() },
        { emitToTagManagers: false },
      );
      return;
    }
    setPhoneStatus("saved");
    trackEvent("lead_form_submitted", { form_type: "cover_lock", ...buildPayload() });
    if (!metaLeadFiredRef.current) {
      metaLeadFiredRef.current = true;
      trackMetaStandardEvent("Lead", {
        content_name: "GT Warranty Funnel",
        content_category: "PPF",
        capture_location: "cover_lock",
        value: price,
        currency: "AED",
      });
    }
  }, [phone, phoneCapturedAt, phoneStatus, trackEvent, buildPayload, funnelContext, vehicle, certName, certCar, trackMetaStandardEvent, price]);

  const scrollToBuilder = (placement: string) => {
    trackEvent("guided_step_view", { step_name: "builder", navigation_reason: placement });
    builderRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const goldCtaClass =
    "inline-flex min-h-[48px] items-center justify-center rounded-md px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg transition hover:opacity-90";
  const ghostCtaClass =
    "inline-flex min-h-[48px] items-center justify-center gap-2 rounded-md border border-border bg-white/[0.03] px-8 py-3.5 text-sm font-medium text-foreground transition hover:border-primary/60";

  const activeIndex = TIER_ORDER.indexOf(tier);

  return (
    <div className="min-h-screen bg-background pb-20 text-foreground md:pb-0">
      <style>{gtwfCss}</style>

      {/* ── HERO — the promise the click was sold on, over real cars from the
             bay. Photo dissolves into the page (dark-graded, never a bright
             box): vertical gradient on mobile, side mask on desktop. ── */}
      <section data-funnel-section="hero" className="relative overflow-hidden">
        <div aria-hidden className="absolute inset-0">
          <img
            src={GT_IMAGES.seanWithPatrols}
            alt=""
            width={1600}
            height={1000}
            loading="eager"
            className="h-full w-full object-cover object-[72%_28%] opacity-[0.55] lg:opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background lg:bg-gradient-to-r lg:from-background lg:via-background/88 lg:to-background/10" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-background" />
        </div>

        <div className="relative mx-auto w-full max-w-6xl px-4 pb-14 pt-6 md:pb-20">
          <header className="mb-12 flex items-center justify-between lg:mb-20">
            <a href="/" aria-label="Grand Touch Auto home">
              <img src={logo} alt="Grand Touch Auto" className="h-9 w-auto sm:h-11" />
            </a>
            <span className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">DIP 2 · Dubai</span>
          </header>

          <div className="max-w-xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
              The GT Protection Program
            </p>
            {/* One sentence per line, never mid-sentence wraps (owner call). */}
            <h1 className="mt-4 !text-4xl !leading-[1.12] sm:!text-5xl lg:!text-6xl">
              <span className="block whitespace-nowrap">One price.</span>
              <span className="block whitespace-nowrap">Every car.</span>
              <span className="block whitespace-nowrap">Covered for life.</span>
            </h1>
            <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-foreground/80">
              Full-body PPF with a lifetime warranty on film{" "}
              <span className="font-semibold text-foreground">and</span> labour — from{" "}
              <span className="font-semibold text-foreground">AED 12,900</span> +VAT, signed and numbered at
              handover. It even transfers when you sell.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button type="button" className={goldCtaClass} style={{ background: GOLD_GRADIENT }} onClick={() => scrollToBuilder("hero_start")}>
                Build my cover
              </button>
              <button type="button" className={ghostCtaClass} onClick={() => handleWhatsApp("hero_whatsapp")}>
                WhatsApp Sean
              </button>
            </div>

            <GtTrustRow className="mt-8 !justify-start" />
          </div>
        </div>
      </section>

      {/* ── THE COVER BUILDER — the toy is the cover, not the number. ── */}
      <section data-funnel-section="builder" className="mx-auto w-full max-w-2xl scroll-mt-6 px-4" ref={builderRef}>
        <LuxCard className="p-6 sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">Build your cover</p>

          {/* The guide IS the assistant, previewed as a LIVE mini chat — a
              conversation already mid-breath, not a list of links. Typing dots
              resolve into the greeting, the questions sit as quick-replies,
              and every part of it opens the real fullscreen chat. */}
          <div
            className="gtwf-mockchat"
            data-funnel-section="assistant"
            role="button"
            tabIndex={0}
            aria-label="Open chat with the studio"
            onClick={() => {
              setChatOpen(true);
              trackEvent("assistant_opener_clicked", { question: "", cta_location: "mock_chat_surface" });
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setChatOpen(true);
                trackEvent("assistant_opener_clicked", { question: "", cta_location: "mock_chat_surface" });
              }
            }}
          >
            <span className="gtwf-mock-frame" aria-hidden />
            <div className="flex items-center gap-3">
              <span className="gtwf-mock-ava" aria-hidden>
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 20l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <div>
                <p className="text-[13.5px] font-semibold leading-tight text-foreground">Ask Grand Touch</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span className="gtwf-mock-dot" aria-hidden />
                  Answering now — prices, warranty, your car
                </p>
              </div>
            </div>

            <div className="gtwf-mock-typing" aria-hidden>
              <i />
              <i />
              <i />
            </div>
            <p className="gtwf-mock-bubble">
              Did you know — scrape it in a car park here and that panel's film is replaced free. For life.
              Ask me anything.
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {ASK_OPENERS.map((q, i) => (
                <button
                  key={q}
                  type="button"
                  className="gtwf-mock-chip"
                  style={{ animationDelay: `${1600 + i * 100}ms` }}
                  onClick={(e) => {
                    e.stopPropagation();
                    askQuestion(q, "mock_chat");
                  }}
                >
                  {q}
                </button>
              ))}
            </div>

            <div className="gtwf-mock-composer" aria-hidden>
              <span className="gtwf-mock-input">Type your question…</span>
              <span className="gtwf-mock-send">
                <svg viewBox="0 0 16 16" fill="currentColor">
                  <path d="M2 8l12-6-4.5 6L14 14 2 8z" transform="rotate(-14 8 8)" />
                </svg>
              </span>
            </div>
          </div>

          {chatOpen &&
            createPortal(
              <div
                className="fixed inset-0 z-[80] flex items-stretch justify-center bg-black/70 backdrop-blur-sm md:items-center md:p-6"
                role="dialog"
                aria-modal="true"
                aria-label="Ask Grand Touch"
              >
                <div
                  className="gtwf-chatshell relative flex h-[100dvh] w-full flex-col md:h-[min(84vh,800px)] md:w-[min(600px,94vw)]"
                  // Mobile keyboards shrink only the VISUAL viewport (iOS
                  // always; Android before the interactive-widget meta lands).
                  // Sizing the shell from visualViewport keeps the composer
                  // sitting on top of the keyboard instead of underneath it.
                  style={chatShellHeight ? { height: `${chatShellHeight}px` } : undefined}
                >
                  <button
                    type="button"
                    onClick={attemptCloseChat}
                    aria-label="Close chat"
                    className="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-black/60 text-foreground/90 backdrop-blur transition hover:border-primary/60"
                    style={{ marginTop: "env(safe-area-inset-top, 0px)" }}
                  >
                    <svg viewBox="0 0 14 14" className="h-3.5 w-3.5" fill="none" aria-hidden>
                      <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                  </button>
                  <AskGrandTouch
                    variant="fullscreen"
                    className="flex-1"
                    openers={ASK_OPENERS}
                    prompt={askPrompt}
                    onPromptConsumed={() => setAskPrompt(null)}
                    followupLadder={ASK_FOLLOWUPS}
                    onFirstMessage={() => {
                      assistantEngagedRef.current = true;
                      trackEvent("assistant_opened", { placement: "warranty_funnel", ...buildPayload() });
                    }}
                    onLeadCaptured={() => {
                      setAssistantCaptured(true);
                      trackEvent("assistant_lead_captured", { placement: "warranty_funnel", ...buildPayload() });
                      if (!metaLeadFiredRef.current) {
                        metaLeadFiredRef.current = true;
                        trackMetaStandardEvent("Lead", {
                          content_name: "GT Warranty Funnel",
                          content_category: "PPF",
                          capture_location: "assistant",
                          value: price,
                          currency: "AED",
                        });
                      }
                    }}
                    onAssistantTurn={handleAssistantTurn}
                    waHref={buildWhatsAppUrl(whatsAppMessage)}
                    onWhatsAppTap={() => {
                      trackMetaStandardEvent("Contact", {
                        content_name: "GT Warranty Funnel",
                        content_category: "PPF",
                        button_location: "assistant_handoff",
                        value: price,
                        currency: "AED",
                      });
                      trackEvent(
                        "whatsapp_click",
                        { cta_location: "assistant_handoff", ...buildPayload() },
                        { emitToTagManagers: false },
                      );
                    }}
                  />

                  {/* Exit save — one honest interception before an engaged,
                      uncaptured visitor walks. The X works normally after. */}
                  {exitSave !== "hidden" && (
                    <div
                      className="absolute inset-0 z-30 flex items-end justify-center bg-black/70 backdrop-blur-[2px] md:items-center md:p-6"
                      role="dialog"
                      aria-label="Before you go"
                      onClick={(e) => {
                        if (e.target === e.currentTarget) dismissExitSave();
                      }}
                    >
                      <div
                        className="w-full rounded-t-2xl border border-primary/35 p-6 pb-8 md:max-w-md md:rounded-2xl md:pb-6"
                        style={{
                          background: "linear-gradient(168deg, hsl(0 0% 15%), hsl(0 0% 9%) 60%)",
                          boxShadow: "0 -20px 60px -20px hsl(0 0% 0% / .8), 0 0 50px hsl(38 92% 58% / .1)",
                        }}
                      >
                        {exitSave === "saved" ? (
                          <div className="py-4 text-center">
                            <p className="text-[17px] font-semibold text-foreground">Locked.</p>
                            <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
                              Sean will WhatsApp you the price and the terms. No calls until you want one.
                            </p>
                          </div>
                        ) : (
                          <>
                            <p className="text-[16.5px] font-semibold leading-snug text-foreground">
                              Before you go — keep the price.
                            </p>
                            <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                              Drop your number and Sean WhatsApps you today&apos;s exact price and the
                              warranty terms, in writing. No calls until you ask for one.
                            </p>
                            <form
                              className="mt-4 flex gap-2"
                              onSubmit={(e) => {
                                e.preventDefault();
                                void handleExitSave();
                              }}
                            >
                              <input
                                value={exitPhone}
                                onChange={(e) => setExitPhone(e.target.value)}
                                type="tel"
                                inputMode="tel"
                                autoComplete="tel"
                                placeholder="05X XXX XXXX"
                                aria-label="Your WhatsApp number"
                                className="min-w-0 flex-1 rounded-md border border-primary/40 bg-black/30 px-3 py-3 text-[15px] text-foreground outline-none transition focus:border-primary/70 placeholder:text-muted-foreground/60"
                                disabled={exitSave === "saving"}
                              />
                              <button
                                type="submit"
                                disabled={exitSave === "saving" || !exitPhone.trim()}
                                className="rounded-md px-4 py-3 text-[13px] font-semibold text-primary-foreground transition disabled:opacity-50"
                                style={{ background: GOLD_GRADIENT }}
                              >
                                {exitSave === "saving" ? "Saving…" : "Send to Sean"}
                              </button>
                            </form>
                            {exitSave === "invalid" && (
                              <p className="mt-2 text-[12px] text-destructive">
                                That number doesn&apos;t look right — UAE mobiles are 05x xxx xxxx.
                              </p>
                            )}
                            {exitSave === "error" && (
                              <p className="mt-2 text-[12px] text-destructive">
                                Couldn&apos;t save just now — try again, or WhatsApp Sean directly below.
                              </p>
                            )}
                            <button
                              type="button"
                              className="mt-3 flex w-full items-center justify-center gap-2 rounded-md border border-border/70 bg-white/[0.03] px-4 py-3 text-[13px] font-medium text-foreground transition hover:border-primary/60"
                              onClick={() => {
                                handleWhatsApp("chat_exit_save");
                                setExitSave("hidden");
                                setChatOpen(false);
                              }}
                            >
                              Or message Sean on WhatsApp
                            </button>
                            <button
                              type="button"
                              onClick={dismissExitSave}
                              className="mx-auto mt-4 block text-[12px] text-muted-foreground underline underline-offset-4 transition hover:text-foreground"
                            >
                              No thanks, just close
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>,
              document.body,
            )}

          <h2 className="mt-8 !text-2xl !tracking-tight sm:!text-3xl">
            Watch what the cheaper number removes.
          </h2>

          {/* Tier control — badge mounts on the wrapper so it can't be clipped. */}
          <div className="relative mt-8">
            <span className="gtwf-chosen" aria-hidden style={{ left: `${100 / 3 + 100 / 6}%` }}>
              Most chosen
            </span>
            <div aria-label="Choose your program" className="gtwf-seg">
              <span className="gtwf-seg-thumb" aria-hidden style={{ transform: `translateX(${activeIndex * 100}%)` }} />
              {TIER_ORDER.map((key) => {
                const t = GT_TIERS.find((x) => x.key === key)!;
                const active = key === tier;
                return (
                  <button
                    key={key}
                    aria-pressed={active}
                    className={cn("gtwf-seg-btn", active && "is-active")}
                    onClick={() => selectTier(key)}
                  >
                    {/* "GT " dropped in the segment — three prefixed names at
                        ~110px each read cramped; the programme context is set
                        by the page. */}
                    <span className="gtwf-seg-name">{t.name.replace(/^GT /, "")}</span>
                    <span className="gtwf-seg-price">{fmt(t.fullBody)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* The headline item — a typographic event, not a row. Keyed by the
              displayed value so Signature↔Concours (both "Lifetime") doesn't
              replay the entrance. */}
          <div key={TERM_DISPLAY[tier].big} className="gtwf-term mt-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-primary/90">The warranty</p>
            <p
              className={cn(
                "mt-1.5 text-[38px] font-bold leading-none tracking-[-0.02em] sm:text-[46px]",
                TERM_DISPLAY[tier].ends ? "text-muted-foreground" : "text-foreground",
              )}
            >
              {TERM_DISPLAY[tier].big}
            </p>
            <span className="gtwf-term-rule" aria-hidden />
            <p className={cn("mt-2.5 text-[13px] leading-relaxed", TERM_DISPLAY[tier].ends ? "text-muted-foreground" : "text-foreground/85")}>
              {TERM_DISPLAY[tier].sub}
            </p>
          </div>

          {/* Price — the money moment lives one screen from the top, with the
              ledger as its scannable justification below (owner call: the old
              bottom placement buried it under the full scroll). */}
          <div className="gtwf-pricepanel mt-7">
            <p className="text-[10.5px] uppercase tracking-[0.2em] text-muted-foreground">
              {selected.name} · full body · {selected.daysInStudio} days in studio
            </p>
            <p className="mt-3 text-[46px] font-semibold leading-none tracking-[-0.025em] text-foreground sm:text-[56px]">
              <span className="mr-1.5 align-middle text-[15px] font-normal text-muted-foreground">AED</span>
              <PriceOdometer value={price} />
              <span className="sr-only" aria-live="polite">
                AED {fmt(price)}
              </span>
            </p>
            <p className="mt-3 max-w-[340px] text-[12px] leading-snug text-muted-foreground">{GT_SIZE_NOTE}</p>
            <a
              href="https://www.google.com/maps/place/?q=place_id:ChIJ88lkU8hzXz4ReC7g9x4kJ7k"
              target="_blank"
              rel="noreferrer"
              onClick={() => trackEvent("google_rating_click", { cta_location: "price_panel" }, { emitToTagManagers: false })}
              className="mt-4 flex w-fit items-center gap-2 text-[12.5px] text-muted-foreground transition hover:text-foreground"
            >
              <span className="text-primary" aria-hidden>★</span>
              <span><b className="font-semibold text-foreground">4.9 on Google</b> · 83 reviews · six years in DIP 2</span>
            </a>
            <button
              type="button"
              className={cn(goldCtaClass, "mt-4 w-full sm:w-auto")}
              style={{ background: GOLD_GRADIENT }}
              onClick={() => handleWhatsApp("builder_panel")}
            >
              Get this in writing on WhatsApp
            </button>
          </div>

          {/* The ledger. Rows change state — they never disappear. */}
          <div className="mt-7 space-y-5">
            {LEDGER_GROUPS.map((group) => (
              <div key={group.title}>
                <p className="mb-1.5 border-b border-border/50 pb-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground/80">
                  {group.title}
                </p>
                <ul>
                  {group.rows.map((row, i) => {
                    const st = row.states[tier];
                    return (
                      <li
                        key={row.id}
                        className={cn("gtwf-row", `is-${st.kind}`)}
                        style={{ transitionDelay: `${i * 45}ms` }}
                      >
                        {/* Keyed by state, not tier — unchanged rows must not
                            replay their entrance on every tier switch. */}
                        <LedgerDisc key={`${st.kind}-${row.id}`} kind={st.kind} />
                        <div className="min-w-0 flex-1">
                          <p className="gtwf-row-label">
                            <span className="gtwf-strikewrap">
                              {row.label}
                              <i className="gtwf-strike" aria-hidden />
                            </span>
                          </p>
                          <p className="gtwf-row-detail">{st.detail}</p>
                        </div>
                        {st.tag && (
                          <span key={`${row.id}-${st.tag.text}`} className={cn("gtwf-tag", st.tag.tone === "gold" ? "gtwf-tag-gold" : "gtwf-tag-cost")}>
                            {st.tag.text}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>

          {/* The step-up, itemized — every increase justifies itself. */}
          {tier !== "concours" && (
            <div key={`step-${tier}`} className="gtwf-step mt-8">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-[13px] font-semibold text-foreground">
                  The +{fmt(STEP_UP[tier as "essential" | "signature"].delta)} to {STEP_UP[tier as "essential" | "signature"].toName} buys
                </p>
                <button
                  type="button"
                  className="text-[12px] font-semibold text-primary underline-offset-4 transition hover:underline"
                  onClick={() => selectTier(STEP_UP[tier as "essential" | "signature"].to)}
                >
                  Step up →
                </button>
              </div>
              <ul className="mt-3 space-y-2">
                {STEP_UP[tier as "essential" | "signature"].gains.map((gain) => (
                  <li key={gain} className="flex items-start gap-2.5 text-[13px] leading-snug text-muted-foreground">
                    <span className="gtwf-gain" aria-hidden>
                      +
                    </span>
                    {gain}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ── The cover lock — bonus is value added, never a number subtracted. ── */}
          <div className="mt-9 rounded-lg border border-border/70 bg-black/25 p-5">
            {phoneStatus === "saved" ? (
              <div className="gtwf-locked">
                <p className="text-[15px] font-semibold text-foreground">Locked. Sean has your build.</p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                  {BONUS_LABEL} is saved against your number — he'll WhatsApp you today to confirm your install
                  week. Or beat him to it:
                </p>
                <button
                  type="button"
                  className={cn(goldCtaClass, "mt-4 w-full sm:w-auto")}
                  style={{ background: GOLD_GRADIENT }}
                  onClick={() => handleWhatsApp("cover_lock_send")}
                >
                  Send my build now
                </button>
              </div>
            ) : (
              <>
                <p className="text-[14px] font-semibold text-foreground">
                  Lock this build — with {BONUS_LABEL.toLowerCase()}
                </p>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
                  We collect the car, protect it, and deliver it back. Locked to your number — no calls until
                  you're ready.
                </p>
                <form
                  className="mt-4 flex flex-col gap-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void handleCoverLock();
                  }}
                >
                  <input
                    type="text"
                    value={vehicle}
                    onChange={(e) => setVehicle(e.target.value)}
                    placeholder="Your car — e.g. 2025 G 63"
                    aria-label="Your car"
                    className="h-12 rounded-md border border-input bg-black/30 px-4 text-[15px] text-foreground placeholder:text-muted-foreground/70 focus:border-primary/60 focus:outline-none"
                  />
                  <PhoneInputWithCountry
                    value={phone}
                    onChange={(v) => {
                      setPhone(v);
                      if (phoneStatus === "invalid" || phoneStatus === "error") setPhoneStatus("idle");
                    }}
                    ariaLabel="WhatsApp number"
                  />
                  <button
                    type="submit"
                    disabled={phoneStatus === "saving"}
                    className={cn(goldCtaClass, "w-full disabled:opacity-60")}
                    style={{ background: GOLD_GRADIENT }}
                  >
                    {phoneStatus === "saving" ? "Locking…" : "Lock my cover + collection"}
                  </button>
                </form>
                {phoneStatus === "invalid" && (
                  <p className="mt-2 text-[12px] text-destructive">That number doesn't look right — UAE mobiles are 05x xxx xxxx.</p>
                )}
                {phoneStatus === "error" && (
                  <p className="mt-2 text-[12px] text-destructive">Couldn't save just now — try again, or WhatsApp Sean directly.</p>
                )}
              </>
            )}
          </div>
        </LuxCard>
      </section>

      {/* ── HANDOVER DAY — the strongest emotional proof, straight after the
             ask (same trust-stack order the proven funnels run). ── */}
      <section data-funnel-section="handover_reactions" className="py-14 md:py-20">
        <div className="mx-auto mb-8 max-w-xl px-4 text-center" data-reveal>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">Proof, not promises</p>
          <h2 className="mt-3 !text-3xl md:!text-4xl">The moment they see the car.</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Real owners, real handovers at the studio — tap any of them, sound on.
          </p>
        </div>
        <div className="gtwf-cliprow mx-auto flex max-w-5xl snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4" data-reveal>
          {HANDOVER_CLIPS.map((clip) => (
            <HandoverCard
              key={clip.name}
              clip={clip}
              playing={activeClip === clip.name}
              onPlay={(name) => {
                setActiveClip(name);
                trackEvent("handover_video_play", { clip: name });
              }}
            />
          ))}
        </div>
      </section>

      {/* ── THE SIGNATURE — the warranty is a person, not a policy desk. ── */}
      <section data-funnel-section="meet_sean" className="mx-auto w-full max-w-5xl px-4 py-14 md:py-20">
        <div className="grid items-center gap-10 md:grid-cols-2" data-reveal>
          <div className="relative overflow-hidden rounded-lg">
            <img
              src={GT_IMAGES.seanWith911}
              alt="Sean at the Grand Touch studio with a protected Porsche 911"
              loading="lazy"
              width={900}
              height={1100}
              className="aspect-[4/4.4] w-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-background/90" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">The other signature on your certificate</p>
            <h2 className="mt-3 !text-3xl md:!text-4xl">Mine.</h2>
            <div className="mt-5 space-y-4 text-[14.5px] leading-relaxed text-muted-foreground">
              <p>
                I'm Sean. Six years in DIP 2, about fifteen cars a month — a limit we keep on purpose, because the
                prep day and the triple check don't survive volume.
              </p>
              <p>
                When something's wrong with your film in year four, there's no claims department and no fine-print
                desk. You message the person who signed the certificate, the car comes in, and it gets fixed —
                free, film and labour.
              </p>
              <p className="text-foreground">
                I can only afford a lifetime warranty because the job is done properly the first time. That's the
                whole model.
              </p>
            </div>
            <button type="button" className={cn(ghostCtaClass, "mt-7")} onClick={() => handleWhatsApp("meet_sean")}>
              Message Sean directly
            </button>
          </div>
        </div>
      </section>

      {/* ── THE QUESTIONS THAT DECIDE IT — Sean's answers, verbatim voice. ── */}
      <GtSection
        eyebrow="Before you compare quotes"
        title="Who's holding the problem in year three?"
        sub="The four conversations we have every week — answered straight."
      >
        <div data-funnel-section="objections" className="mx-auto max-w-2xl" data-reveal>
          {OBJECTIONS.map((item) => (
            <details key={item.q} className="gtwf-obj group border-b border-border/60">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-[15px] font-medium text-foreground [&::-webkit-details-marker]:hidden">
                {item.q}
                <span className="gtwf-plus text-primary" aria-hidden>
                  +
                </span>
              </summary>
              <div className="space-y-3 pb-6 text-[14px] leading-relaxed text-muted-foreground">
                {item.a.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </details>
          ))}
        </div>
      </GtSection>

      {/* ── THE DOCUMENT — proof you can hold. ── */}
      {/* overflow-x-clip: the rotating Card3D projects ~1px past 375px mid-spin
          and the cert watermark is wider than the column — clip x only, keep y
          for the ground shadow. */}
      <section data-funnel-section="certificate" className="mx-auto w-full max-w-5xl overflow-x-clip px-4 py-14 md:py-20">
        <div className="mx-auto mb-8 max-w-xl text-center" data-reveal>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">Not a promise. A document.</p>
          <h2 className="mt-3 !text-3xl md:!text-4xl">This is what you leave with.</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Signed, numbered, registered to your chassis — and the full terms are published word for word before
            you pay a dirham. Type your name and watch it become yours.
          </p>
        </div>
        {/* Personalization: no PPF shop in Dubai lets you see your own
            certificate before paying. Specimen-watermarked throughout; the
            typed name rides into the CRM snapshot if they lock the cover. */}
        <div className="mx-auto mb-9 flex max-w-md flex-col gap-2.5 px-1 sm:flex-row" data-reveal>
          {[
            { value: certName, set: setCertName, placeholder: "Your name", label: "Your name on the specimen certificate" },
            { value: certCar, set: setCertCar, placeholder: "Your car — e.g. Range Rover", label: "Your car on the specimen certificate" },
          ].map((field) => (
            <input
              key={field.placeholder}
              value={field.value}
              onChange={(e) => {
                field.set(e.target.value);
                if (!certPersonalizedRef.current) {
                  certPersonalizedRef.current = true;
                  trackEvent("certificate_personalized", buildPayload(), { emitToTagManagers: false });
                }
              }}
              type="text"
              maxLength={40}
              placeholder={field.placeholder}
              aria-label={field.label}
              className="flex-1 rounded-md border border-primary/35 bg-black/30 px-3.5 py-2.5 text-center text-[14px] text-foreground outline-none transition focus:border-primary/70 placeholder:text-muted-foreground/60 sm:text-left"
            />
          ))}
        </div>
        <div className="mx-auto max-w-xl">
          <WarrantyCertificateShowcase sample={certSample} />
        </div>
        <div className="mt-10 text-center">
          <a href="/ppf-warranty-dubai" className={ghostCtaClass}>
            Read every word of the warranty
          </a>
        </div>
      </section>

      {/* ── THE WORK — what the number buys before film touches paint. ── */}
      <section data-funnel-section="process" className="py-14 md:py-20">
        <div className="mx-auto mb-8 max-w-xl px-4 text-center" data-reveal>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">Where the money goes</p>
          <h2 className="mt-3 !text-3xl md:!text-4xl">The work you never see.</h2>
        </div>
        <div className="gtwf-cliprow mx-auto flex max-w-6xl snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 md:grid md:grid-cols-4 md:overflow-visible" data-reveal>
          {GT_PROCESS_STEPS.map((step) => (
            <figure
              key={step.title}
              className="w-[74vw] max-w-[300px] flex-none snap-center overflow-hidden rounded-lg border border-border/60 bg-card md:w-auto md:max-w-none"
            >
              <div className="relative">
                <img src={step.image} alt={step.title} loading="lazy" className="aspect-[4/3] w-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-b from-transparent to-black/60" />
              </div>
              <figcaption className="p-4">
                <p className="text-[13.5px] font-semibold leading-snug text-foreground">{step.title}</p>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">{step.body}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* ── PROOF STRIP ── */}
      <GtSection
        eyebrow="Why the panel replacements exist"
        title="Nobody thinks it will be them."
        sub="We replace damaged panels on customers' cars every month — a scrape, a trolley, a careless valet. That's why Signature and Concours include free panel replacements: we know it happens."
      >
        <div data-funnel-section="proof" data-reveal>
          <GtFilmStrip className="mt-2" />
        </div>
      </GtSection>

      {/* ── FAQ — always in the DOM for crawlers. ── */}
      <GtSection eyebrow="Questions" title="Straight answers">
        <div data-funnel-section="faq" className="mx-auto max-w-2xl" data-reveal>
          <GtFaq items={FUNNEL_FAQ} />
        </div>
      </GtSection>

      {/* ── CLOSE ── */}
      <section data-funnel-section="final_cta" className="mx-auto w-full max-w-2xl px-4 pb-20 pt-6 text-center" data-reveal>
        <h2 className="!text-3xl md:!text-4xl">~15 cars a month.</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
          That's the studio's limit, on purpose — the prep day and the triple check don't survive volume. When the
          month is full, it's full.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button type="button" className={goldCtaClass} style={{ background: GOLD_GRADIENT }} onClick={() => handleWhatsApp("final_cta")}>
            Reserve my install week
          </button>
          <a href="/ppf-dubai" className={ghostCtaClass}>
            See the full program
          </a>
        </div>
      </section>

      {builderOffscreen && (
        <GtStickyBar
          href={buildWhatsAppUrl(whatsAppMessage)}
          onClick={() => {
            trackMetaStandardEvent("Contact", {
              content_name: "GT Warranty Funnel",
              content_category: "PPF",
              button_location: "mobile_sticky",
              value: price,
              currency: "AED",
            });
            trackEvent("whatsapp_click", { cta_location: "mobile_sticky", ...buildPayload() }, { emitToTagManagers: false });
          }}
          anchorLine={`AED ${fmt(price)}`}
          subLine={`${selected.name} · ${tier === "essential" ? "5-year warranty" : "lifetime warranty"}`}
        />
      )}
    </div>
  );
};

/** Scoped styles: the odometer, the ledger choreography, reveals. GPU
 *  transforms + opacity only; everything gated by prefers-reduced-motion. */
const gtwfCss = `
.gtwf-odo { display: inline-flex; font-variant-numeric: tabular-nums; }
.gtwf-odo-col { display: inline-block; height: 1em; overflow: hidden; }
.gtwf-odo-strip { display: inline-flex; flex-direction: column; line-height: 1; transition: transform 0.62s cubic-bezier(0.22, 1, 0.36, 1); will-change: transform; }
.gtwf-odo-strip span { height: 1em; }

.gtwf-seg { position: relative; display: grid; grid-template-columns: repeat(3, 1fr); border: 1px solid hsl(var(--border)); border-radius: calc(var(--radius) - 2px); background: hsl(0 0% 0% / 0.35); padding: 4px; }
.gtwf-seg-thumb { position: absolute; top: 4px; bottom: 4px; left: 4px; width: calc((100% - 8px) / 3); border-radius: calc(var(--radius) - 4px); background: linear-gradient(165deg, hsl(0 0% 16%), hsl(0 0% 10%)); box-shadow: inset 0 0 0 1px hsl(38 92% 58% / 0.55), 0 6px 18px hsl(0 0% 0% / 0.45); transition: transform 0.42s cubic-bezier(0.3, 1.1, 0.35, 1); will-change: transform; }
.gtwf-seg-btn { position: relative; z-index: 1; display: flex; min-height: 60px; flex-direction: column; align-items: center; justify-content: center; gap: 2px; border-radius: calc(var(--radius) - 4px); color: hsl(var(--muted-foreground)); transition: color 0.25s ease; }
.gtwf-seg-btn.is-active { color: hsl(var(--foreground)); }
.gtwf-seg-name { font-size: 13.5px; font-weight: 600; letter-spacing: 0.01em; }
.gtwf-seg-price { font-size: 11.5px; font-variant-numeric: tabular-nums; opacity: 0.75; }
.gtwf-chosen { position: absolute; top: -9px; z-index: 2; transform: translateX(-50%); border-radius: 999px; border: 1px solid hsl(38 92% 58% / 0.6); background: hsl(0 0% 7%); padding: 2px 9px; font-size: 9px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: hsl(var(--primary)); }

.gtwf-term { animation: gtwf-term-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) both; }
.gtwf-term-rule { display: block; margin-top: 14px; height: 1px; width: 64px; background: linear-gradient(90deg, hsl(38 92% 58% / 0.9), hsl(38 92% 58% / 0)); transform-origin: left center; animation: gtwf-rule-draw 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.1s both; }
@keyframes gtwf-term-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
@keyframes gtwf-rule-draw { from { transform: scaleX(0); } to { transform: scaleX(1); } }

.gtwf-row { display: flex; align-items: flex-start; gap: 12px; border-radius: calc(var(--radius) - 4px); padding: 9px 6px; transition: opacity 0.45s ease; }
.gtwf-row + .gtwf-row { border-top: 1px solid hsl(0 0% 100% / 0.045); }
.gtwf-row.is-out { opacity: 0.5; }
.gtwf-row-label { font-size: 14px; font-weight: 600; color: hsl(var(--foreground)); line-height: 1.3; }
.gtwf-row-detail { margin-top: 2.5px; font-size: 12.5px; line-height: 1.45; color: hsl(var(--muted-foreground)); }
.gtwf-tag { align-self: center; white-space: nowrap; border-radius: 999px; padding: 4px 10px; font-size: 10.5px; font-weight: 600; letter-spacing: 0.04em; animation: gtwf-tag-in 0.4s ease both; }
.gtwf-tag-gold { border: 1px solid hsl(38 92% 58% / 0.4); background: hsl(38 92% 58% / 0.07); color: hsl(38 92% 66%); }
.gtwf-tag-cost { border: 1px solid hsl(18 95% 58% / 0.45); color: hsl(18 95% 62%); }
@keyframes gtwf-tag-in { from { opacity: 0; transform: translateX(6px); } to { opacity: 1; transform: none; } }
/* ≤480px: the tag drops under the text (aligned to its indent) instead of
   crushing the detail column against the right edge. */
@media (max-width: 480px) {
  .gtwf-row { flex-wrap: wrap; }
  .gtwf-row > div { min-width: 62%; }
  .gtwf-tag { margin-left: 36px; margin-top: 2px; align-self: flex-start; }
}

.gtwf-step { border-radius: calc(var(--radius) - 2px); border: 1px solid hsl(38 92% 58% / 0.22); background: radial-gradient(130% 120% at 12% 0%, hsl(38 60% 20% / 0.22), transparent 55%), linear-gradient(165deg, hsl(0 0% 10%), hsl(0 0% 7%)); padding: 18px 18px 16px; animation: gtwf-term-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) both; }
.gtwf-gain { display: inline-flex; height: 17px; width: 17px; flex: none; align-items: center; justify-content: center; margin-top: 1px; border-radius: 999px; border: 1px solid hsl(38 92% 58% / 0.5); font-size: 12px; font-weight: 700; line-height: 1; color: hsl(var(--primary)); }

.gtwf-pricepanel { border-radius: calc(var(--radius) - 2px); border: 1px solid hsl(0 0% 100% / 0.07); background: radial-gradient(120% 100% at 15% 0%, hsl(38 60% 20% / 0.28), transparent 55%), linear-gradient(165deg, hsl(0 0% 11%), hsl(0 0% 7%)); padding: 22px 20px; box-shadow: 0 18px 50px -18px hsl(0 0% 0% / 0.7); }

.gtwf-strikewrap { position: relative; display: inline-block; }
.gtwf-strike { position: absolute; left: -2px; right: -2px; top: 50%; height: 1.5px; background: hsl(var(--muted-foreground)); transform: scaleX(0); transform-origin: left center; transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0.12s; }
.gtwf-row.is-out .gtwf-strike { transform: scaleX(1); }

.gtwf-disc { display: inline-flex; height: 22px; width: 22px; flex: none; align-items: center; justify-content: center; margin-top: 1px; border-radius: 999px; }
.gtwf-disc svg { height: 13px; width: 13px; }
.gtwf-disc-in { border: 1px solid hsl(38 92% 58% / 0.7); background: hsl(38 92% 58% / 0.1); color: hsl(var(--primary)); }
.gtwf-disc-half { border: 1px dashed hsl(38 92% 58% / 0.5); color: hsl(38 60% 55%); }
.gtwf-disc-out { border: 1px solid hsl(var(--border)); color: hsl(var(--muted-foreground)); }
.gtwf-halfmark { height: 1.6px; width: 8px; border-radius: 2px; background: currentColor; }
.gtwf-tick { stroke-dasharray: 16; stroke-dashoffset: 16; animation: gtwf-tick-draw 0.45s cubic-bezier(0.4, 0, 0.2, 1) 0.08s forwards; }
@keyframes gtwf-tick-draw { to { stroke-dashoffset: 0; } }

.gtwf-cliprow { scrollbar-width: none; -webkit-overflow-scrolling: touch; }
.gtwf-cliprow::-webkit-scrollbar { display: none; }
.gtwf-play { display: inline-flex; height: 40px; width: 40px; flex: none; align-items: center; justify-content: center; border-radius: 999px; border: 1px solid hsl(38 92% 58% / 0.65); background: hsl(0 0% 5% / 0.72); color: hsl(var(--primary)); backdrop-filter: blur(4px); transition: transform 0.25s ease; }
.gtwf-play svg { height: 14px; width: 14px; margin-left: 2px; }
.gtwf-clip:hover .gtwf-play { transform: scale(1.08); }

.gtwf-locked { animation: gtwf-lock-in 0.5s cubic-bezier(0.2, 1.2, 0.4, 1) both; }
@keyframes gtwf-lock-in { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: none; } }

/* The mini chat: same lit surface + gold hairline as the real panel, so the
   fullscreen chat feels like this exact object expanding. */
.gtwf-mockchat { position: relative; margin-top: 1.5rem; border-radius: 1rem; padding: 16px; cursor: pointer; background: linear-gradient(168deg, hsl(0 0% 17%), hsl(0 0% 11%) 55%, hsl(0 0% 12%)); box-shadow: 0 24px 60px -22px hsl(0 0% 0% / 0.85), 0 0 50px hsl(38 92% 58% / 0.08); transition: box-shadow 0.3s ease; }
.gtwf-mockchat:hover { box-shadow: 0 24px 60px -22px hsl(0 0% 0% / 0.85), 0 0 60px hsl(38 92% 58% / 0.14); }
.gtwf-mock-frame { position: absolute; inset: 0; border-radius: 1rem; padding: 1px; background: linear-gradient(160deg, hsl(38 92% 58% / 0.85), hsl(38 70% 45% / 0.25) 45%, hsl(38 60% 40% / 0.12) 75%); -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor; mask-composite: exclude; pointer-events: none; }
.gtwf-mock-ava { display: inline-flex; height: 36px; width: 36px; flex: none; align-items: center; justify-content: center; border-radius: 999px; background: linear-gradient(135deg, hsl(38 92% 58%), hsl(18 95% 58%)); color: hsl(0 0% 10%); }
.gtwf-mock-ava svg { height: 17px; width: 17px; }
.gtwf-mock-dot { display: inline-block; height: 6px; width: 6px; border-radius: 999px; background: #34c477; box-shadow: 0 0 6px #34c47788; }
.gtwf-mock-typing { display: inline-flex; gap: 4px; margin-top: 14px; border-radius: 12px; border-top-left-radius: 4px; background: hsl(0 0% 100% / 0.05); padding: 11px 13px; animation: gtwf-mock-typing-out 0.25s 1.45s forwards; }
.gtwf-mock-typing i { height: 5px; width: 5px; border-radius: 999px; background: hsl(38 92% 58% / 0.8); animation: gtwf-mock-bounce 1s infinite ease-in-out; }
.gtwf-mock-typing i:nth-child(2) { animation-delay: 0.15s; }
.gtwf-mock-typing i:nth-child(3) { animation-delay: 0.3s; }
@keyframes gtwf-mock-bounce { 0%, 80%, 100% { transform: translateY(0); opacity: 0.5; } 40% { transform: translateY(-3px); opacity: 1; } }
@keyframes gtwf-mock-typing-out { to { opacity: 0; height: 0; margin: 0; padding: 0; overflow: hidden; } }
.gtwf-mock-bubble { margin-top: 12px; max-width: 94%; border-radius: 12px; border-top-left-radius: 4px; background: hsl(0 0% 100% / 0.06); padding: 11px 13px; font-size: 13.5px; line-height: 1.5; color: hsl(var(--foreground) / 0.9); opacity: 0; transform: translateY(4px); animation: gtwf-mock-in 0.35s 1.5s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
.gtwf-mock-chip { border-radius: 999px; border: 1px solid hsl(38 92% 58% / 0.32); background: hsl(38 92% 58% / 0.05); padding: 9px 13px; font-size: 12.5px; font-weight: 500; text-align: left; color: hsl(var(--foreground) / 0.85); min-height: 40px; opacity: 0; animation: gtwf-mock-in 0.3s cubic-bezier(0.22, 1, 0.36, 1) forwards; transition: border-color 0.25s ease, transform 0.25s ease; }
.gtwf-mock-chip:hover, .gtwf-mock-chip:focus-visible { border-color: hsl(38 92% 58% / 0.65); transform: translateY(-1px); }
@keyframes gtwf-mock-in { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: none; } }
.gtwf-mock-composer { margin-top: 14px; display: flex; align-items: center; gap: 8px; }
.gtwf-mock-input { flex: 1; border-radius: 10px; border: 1px solid hsl(var(--border) / 0.7); background: hsl(0 0% 0% / 0.3); padding: 11px 13px; font-size: 13px; color: hsl(var(--muted-foreground)); }
.gtwf-mock-send { display: inline-flex; height: 40px; width: 40px; flex: none; align-items: center; justify-content: center; border-radius: 999px; background: linear-gradient(135deg, hsl(38 92% 58%), hsl(18 95% 58%)); color: hsl(0 0% 10%); }
.gtwf-mock-send svg { height: 15px; width: 15px; }

/* The chat shell rises in like a sheet — real-messenger feel, one motion. */
.gtwf-chatshell { animation: gtwf-chat-rise 0.45s cubic-bezier(0.22, 1, 0.36, 1) both; }
@keyframes gtwf-chat-rise { from { opacity: 0; transform: translateY(26px) scale(0.985); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .gtwf-chatshell { animation: none; } }

.gtwf-plus { transition: transform 0.25s ease; font-size: 18px; line-height: 1; }
details[open] .gtwf-plus { transform: rotate(45deg); }

[data-reveal] { opacity: 0; transform: translateY(14px); transition: opacity 0.55s ease, transform 0.55s ease; }
[data-reveal].gtwf-in { opacity: 1; transform: none; }

@media (prefers-reduced-motion: reduce) {
  .gtwf-odo-strip, .gtwf-seg-thumb, .gtwf-strike, .gtwf-row, .gtwf-mock-chip, [data-reveal] { transition: none !important; }
  .gtwf-tick, .gtwf-tag, .gtwf-locked, .gtwf-term, .gtwf-term-rule, .gtwf-step, .gtwf-chatshell { animation: none !important; }
  .gtwf-mock-typing { display: none; }
  .gtwf-mock-bubble, .gtwf-mock-chip { animation: none !important; opacity: 1; transform: none; }
  .gtwf-tick { stroke-dashoffset: 0; }
  [data-reveal] { opacity: 1; transform: none; }
}
`;

export default PpfLifetimeWarranty;
