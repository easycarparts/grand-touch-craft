import { useEffect, useMemo, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowUpRight,
  BadgeCheck,
  Banknote,
  Car,
  Check,
  ChevronRight,
  ClipboardList,
  Crown,
  Gauge,
  Handshake,
  KeyRound,
  Lock,
  Megaphone,
  Rocket,
  Scale,
  ShieldCheck,
  ShieldX,
  Target,
  TrendingUp,
  UserCheck,
  Wallet,
  Wrench,
} from "lucide-react";

/**
 * Private manager-takeover & equity earn-in proposal for WRAPCO (Al Quoz 1).
 * Mirrors docs/wrapco-manager-takeover-proposal.docx; shares the visual
 * language of PpfInvestorProposalV3 but is aimed at the Wrapco owner,
 * not a cash investor.
 */
const PROPOSAL_PASSWORD = import.meta.env.VITE_WRAPCO_PROPOSAL_PASSWORD || "WRAPCO2026";
const STORAGE_KEY = "gt-wrapco-proposal-unlocked-v1";

/* ----------------------------------------------------------------------------
 * Formatting helpers
 * ------------------------------------------------------------------------- */
const formatAed = (value: number) =>
  new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: "AED",
    maximumFractionDigits: 0,
  }).format(value);

const formatShort = (value: number) => {
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${sign}AED ${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${sign}AED ${Math.round(abs / 1_000)}k`;
  return `${sign}AED ${Math.round(abs)}`;
};

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

/* ----------------------------------------------------------------------------
 * Motion hooks (respect prefers-reduced-motion)
 * ------------------------------------------------------------------------- */
function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = () => setReduced(mq.matches);
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);
  return reduced;
}

function useInView<T extends HTMLElement>(threshold = 0.2) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function useCountUp(target: number, start: boolean, duration = 1300) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, start, duration]);
  return value;
}

function CountStat({
  value,
  format,
  className,
}: {
  value: number;
  format: (n: number) => string;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const { ref, inView } = useInView<HTMLSpanElement>();
  const animated = useCountUp(value, inView && !reduced);
  return (
    <span ref={ref} className={className}>
      {format(reduced || !inView ? value : animated)}
    </span>
  );
}

function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduced = useReducedMotion();
  const { ref, inView } = useInView<HTMLDivElement>(0.15);
  const show = reduced || inView;
  return (
    <div
      ref={ref}
      className={cx(
        className,
        "transition-all duration-700 ease-out will-change-transform",
        show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * Static data — Grand Touch proof (same real numbers as the V3 investor deck)
 * ------------------------------------------------------------------------- */
const PROVEN_REVENUE = 726766;
const AD_SPEND_TOTAL = 54800;
const BLENDED_ROAS = Math.round(PROVEN_REVENUE / AD_SPEND_TOTAL); // ~13x

const gtMonthly = [
  { month: "Jan", revenue: 95866 },
  { month: "Feb", revenue: 77449 },
  { month: "Mar", revenue: 138330 },
  { month: "Apr", revenue: 156540 },
  { month: "May", revenue: 145588 },
  { month: "Jun", revenue: 185000 },
];

const adSpendSplit = [
  { channel: "Meta", value: 43000, color: "#42d6c9" },
  { channel: "TikTok", value: 8000, color: "#f472b6" },
  { channel: "Google", value: 3800, color: "#f8b84e" },
];

const heroStats = [
  { label: "Closed & paid revenue", value: PROVEN_REVENUE, display: "AED 727k+", sub: "94 paid jobs since Jan 2026" },
  { label: "Return on ad spend", value: BLENDED_ROAS, display: `~${BLENDED_ROAS}x`, sub: "AED 55k ads → AED 727k banked" },
  { label: "Cost per qualified lead", value: 35, display: "AED 30–40", sub: "vs ~AED 80 unqualified today" },
  { label: "Space it was built in", value: 1600, display: "1,600 sq ft", sub: "One-third of Wrapco, AED 10k sublease" },
];

/**
 * 24-month illustrative growth scenario.
 * PPF: ramps from ~8 cars/mo toward 10-bay capacity (~54 full bodies/mo) at AED 14,500.
 * Tint: marketing switched on month 4, ramps to AED 100k/mo (2–3 cars/day).
 * Paint booth: activated month 7, ramps to AED 50k/mo.
 */
const growthData = Array.from({ length: 24 }, (_, i) => {
  const m = i + 1;
  const ppfCars = Math.min(54, 8 + Math.round(i * 2.1));
  const ppf = ppfCars * 14500;
  const tint = m < 4 ? 0 : Math.min(100000, (m - 3) * 11000);
  const paint = m < 7 ? 0 : Math.min(50000, (m - 6) * 8500);
  return { month: `M${m}`, ppf, tint, paint, total: ppf + tint + paint };
});
const growthEnd = growthData[growthData.length - 1];
const WRAPCO_FY25_MONTHLY = 140000;

const growthStreams = [
  { key: "ppf" as const, name: "XPEL PPF · toward 10 bays", color: "#f8b84e" },
  { key: "tint" as const, name: "Window tint · from month 4", color: "#42d6c9" },
  { key: "paint" as const, name: "Paint booth · from month 7", color: "#f472b6" },
];

/** Full-body XPEL quotes found in market research, Jul 2026. */
const pricingData = [
  { name: "Grey shop A", price: 6500, approved: false },
  { name: "Grey shop B", price: 8000, approved: false },
  { name: "Grey shop C", price: 11000, approved: false },
  { name: "XPEL floor", price: 14500, approved: true },
  { name: "Topaz (approved)", price: 15300, approved: true },
  { name: "PPS (approved)", price: 22000, approved: true },
];

const founderTrackRecord = [
  {
    icon: Crown,
    metric: "$3.5B",
    title: "Phoenix Group IPO",
    body: "Led marketing strategy for one of the world's largest Bitcoin-mining firms through its $3.5B Abu Dhabi Stock Exchange IPO.",
    color: "#f8b84e",
  },
  {
    icon: Banknote,
    metric: "$15M+",
    title: "Capital raised for clients",
    body: "Including a pivotal role helping Lyvely raise $12M across rounds — hands-on investor relations and capital-raising experience.",
    color: "#a3e635",
  },
  {
    icon: Megaphone,
    metric: "1B+",
    title: "Content views generated",
    body: "SEO-driven content for 1Inch, eToro, Gemini and more — over a billion views, the same engine now pointed at car care.",
    color: "#f472b6",
  },
  {
    icon: Rocket,
    metric: "AED 727k+",
    title: "Grand Touch, from scratch",
    body: "Built a paying PPF business to AED 727k+ in six months — in a 1,600 sq ft sublease, without an XPEL license, in the most undercut corner of the market.",
    color: "#42d6c9",
  },
];

const phase0 = [
  {
    icon: ShieldCheck,
    title: "XPEL locked in",
    body: "You provide the XPEL dealer agreement evidencing the AED 14,500 minimum and confirm the authorization is in good standing. Keeping the license alive is — and stays — your responsibility.",
    color: "#f8b84e",
  },
  {
    icon: Scale,
    title: "Clean slate",
    body: "You warrant sole 100% ownership and disclose all bank accounts, debts and post-dated cheques. Anything from before day one stays yours — full indemnity.",
    color: "#42d6c9",
  },
  {
    icon: Wallet,
    title: "Financial control",
    body: "A new operational account with me as signatory. All revenue routed through it; withdrawals above an agreed threshold need both signatures. Non-negotiable — clean books are what make your 50% valuable.",
    color: "#a3e635",
  },
];

const phase1Me = [
  "All marketing: funnels, ads, retargeting, content — the engine that did 13x",
  "CRM, booking systems and the full sales process, walk-in to handover",
  "Pricing within XPEL terms; job workflow and quality control",
  "Installer hiring and scheduling as volume grows",
];

const phase1You = [
  "Lease and landlord relationship",
  "Government, PRO and licensing administration",
  "XPEL and key supplier relationships",
  "Everything that pre-dates the agreement",
];

const phase1Terms = [
  {
    icon: Wallet,
    title: "AED 15k/month — self-funded",
    body: "Paid from a 10% set-aside of PPF revenue I generate. Cash tight? It accrues as company debt, senior to any owner drawing, back-paid from profits, due in full on exit. Zero cash risk to you.",
  },
  {
    icon: Target,
    title: "All PPF revenue attributed",
    body: "Walk-ins and repeats included — everyone passes through the same campaigns and sales process. One simple rule, no attribution arguments.",
  },
  {
    icon: Megaphone,
    title: "Ad budget from revenue",
    body: "Marketing is a company cost (target 10–15% of monthly revenue). I bring systems and expertise — not cash.",
  },
  {
    icon: Lock,
    title: "My IP stays mine",
    body: "Funnels, ad accounts, content, booking pages and CRM are licensed to Wrapco while I'm in. If I'm pushed out, the pipeline leaves with me. You only ever lose it by ending the deal.",
  },
  {
    icon: Handshake,
    title: "Exclusive to Wrapco",
    body: "I market PPF for nobody else. My existing lower-segment shop runs under its own manager and doesn't compete for XPEL-tier work.",
  },
  {
    icon: ClipboardList,
    title: "Clean exit terms",
    body: "Either side can walk on 30 days' notice. Terminate me without cause: accrued fees plus a 3-month break fee. Lose the XPEL license: everything accrued falls due.",
  },
];

const milestoneKpis = [
  { icon: TrendingUp, text: "Bank-verified quarterly revenue targets" },
  { icon: BadgeCheck, text: "XPEL PPF units at ≥ AED 14,500 average ticket" },
  { icon: Gauge, text: "Gross-margin floor on every certified quarter" },
  { icon: UserCheck, text: "Google-review growth & 100% CRM logging" },
];

const comparison = [
  { today: "~AED 140k/month banked revenue; FY2025 ended effectively flat", together: "Proven demand engine targeting AED 500k+/month at protected XPEL pricing" },
  { today: "~AED 80 per lead, mostly unqualified", together: "AED 30–40 per qualified lead, booking-page sales process, retargeting" },
  { today: "No budget for senior operators", together: "An operator whose fee is self-funded from new PPF revenue — zero cash risk" },
  { today: "Informal records", together: "Clean, auditable books — what makes your retained 50% bankable and sellable" },
  { today: "100% of a business that retains no cash", together: "50% of a scaled, price-protected XPEL operation — equity moves only after banked growth" },
];

const nextSteps = [
  { icon: ClipboardList, title: "Phase 0 documents", body: "XPEL dealer agreement & standing, ownership warranty, accounts disclosure." },
  { icon: Scale, title: "Counsel drafts", body: "UAE counsel prepares the management agreement and the shareholders'/option agreement." },
  { icon: Rocket, title: "Launch in 14 days", body: "Operational account opened, systems onboarded, campaigns live within two weeks of signature." },
];

const proofImages = [
  { src: "/guided-rolls-install.png", label: "Rolls-Royce install" },
  { src: "/guided-cullinan-ppf.png", label: "Cullinan full body" },
  { src: "/guided-911-gloss.png", label: "911 gloss PPF" },
  { src: "/guided-911-stek-roll.png", label: "911 film roll" },
];

const navLinks = [
  { id: "proof", label: "Proof" },
  { id: "founder", label: "Sean" },
  { id: "xpel", label: "The XPEL window" },
  { id: "math", label: "The numbers" },
  { id: "deal", label: "The deal" },
  { id: "steps", label: "Next steps" },
];

/* ----------------------------------------------------------------------------
 * Password gate
 * ------------------------------------------------------------------------- */
function PasswordGate({ onUnlock }: { onUnlock: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password.trim().toUpperCase() === PROPOSAL_PASSWORD.toUpperCase()) {
      localStorage.setItem(STORAGE_KEY, "true");
      onUnlock();
      return;
    }
    setError("Wrong password");
  };

  return (
    <main className="min-h-screen bg-[#070707] text-white">
      <section className="relative flex min-h-screen items-center overflow-hidden px-5 py-10">
        <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_15%_0%,rgba(248,184,78,0.16),transparent_55%),radial-gradient(120%_120%_at_100%_100%,rgba(66,214,201,0.14),transparent_55%)]" />
        <div className="absolute inset-0 bg-[#070707]/40" />
        <div className="relative mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[1.05fr_0.7fr] lg:items-center">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/80 backdrop-blur">
              <Lock className="h-4 w-4 text-[#f8b84e]" />
              Private proposal · Wrapco × Grand Touch
            </div>
            <h1 className="max-w-4xl text-[44px] font-black uppercase leading-[0.92] text-white sm:text-6xl lg:text-7xl">
              Management takeover & earn-in
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/78">
              A partnership proposal for WRAPCO New Auto Accessories LLC — pairing Dubai's closed XPEL
              network with a marketing engine that has already banked AED 727k+ this year.
            </p>
          </div>
          <form onSubmit={submit} className="rounded-lg border border-white/15 bg-[#111]/90 p-5 shadow-2xl backdrop-blur">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-md bg-[#f8b84e] text-black">
              <KeyRound className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold">Enter password</h2>
            <p className="mt-2 text-sm leading-6 text-white/62">
              This page is hidden from navigation and marked noindex for search engines.
            </p>
            <input
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError("");
              }}
              type="password"
              autoFocus
              className="mt-6 h-12 w-full rounded-md border border-white/15 bg-black/60 px-4 text-base outline-none ring-[#f8b84e] transition focus:ring-2"
              placeholder="Password"
            />
            {error ? <p className="mt-3 text-sm text-[#ff8a70]">{error}</p> : null}
            <button className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-md bg-white font-bold text-black transition hover:bg-[#f8b84e]">
              Unlock proposal
              <ChevronRight className="h-4 w-4" />
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

/* ----------------------------------------------------------------------------
 * Shared bits
 * ------------------------------------------------------------------------- */
function SectionKicker({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <p className="text-sm font-bold uppercase tracking-[0.28em]" style={{ color }}>
      {children}
    </p>
  );
}

function StickyNav() {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const onScroll = () => setShown(window.scrollY > 620);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={cx(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        shown ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
      )}
    >
      <div className="border-b border-white/10 bg-[#070707]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-2.5 sm:px-6">
          <span className="hidden shrink-0 items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-white sm:flex">
            <ShieldCheck className="h-4 w-4 text-[#f8b84e]" />
            WRAPCO × GT
          </span>
          <nav className="hide-scrollbar -mx-1 flex flex-1 items-center gap-1 overflow-x-auto px-1">
            {navLinks.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                className="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold text-white/65 transition hover:bg-white/10 hover:text-white"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <a
            href="#deal"
            className="hidden h-9 shrink-0 items-center gap-1.5 rounded-full bg-[#f8b84e] px-4 text-xs font-black uppercase tracking-[0.14em] text-black transition hover:bg-white sm:inline-flex"
          >
            The deal
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}

const chartTooltipStyle = {
  background: "#0b0b0b",
  border: "1px solid rgba(255,255,255,0.14)",
  borderRadius: 8,
} as const;

/* ----------------------------------------------------------------------------
 * Page
 * ------------------------------------------------------------------------- */
export default function WrapcoTakeoverProposal() {
  const [unlocked, setUnlocked] = useState(false);
  const [carsPerWeek, setCarsPerWeek] = useState(5);

  useEffect(() => {
    document.title = "Wrapco × Grand Touch — Private Proposal";
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex,nofollow";
    document.head.appendChild(meta);
    return () => {
      document.head.removeChild(meta);
    };
  }, []);

  useEffect(() => {
    setUnlocked(localStorage.getItem(STORAGE_KEY) === "true");
  }, []);

  const math = useMemo(() => {
    const carsPerMonth = Math.round(carsPerWeek * 4.3);
    const revenue = carsPerMonth * 14500;
    const directCosts = carsPerMonth * 8000; // XPEL film ~6k + install labour ~2k per car (Sean's real costs)
    const marketing = revenue * 0.12;
    const salaryPool = 15000;
    const gross = revenue - directCosts;
    const afterEngine = gross - marketing - salaryPool;
    return { carsPerMonth, revenue, directCosts, marketing, salaryPool, gross, afterEngine };
  }, [carsPerWeek]);

  if (!unlocked) {
    return <PasswordGate onUnlock={() => setUnlocked(true)} />;
  }

  return (
    <main className="min-h-screen bg-[#070707] text-white">
      <style>{`
        .hide-scrollbar::-webkit-scrollbar{display:none}
        .hide-scrollbar{scrollbar-width:none}
        input[type=range].gt-range{-webkit-appearance:none;appearance:none;height:8px;border-radius:9999px;outline:none}
        input[type=range].gt-range::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;height:24px;width:24px;border-radius:9999px;background:#fff;border:4px solid #f8b84e;cursor:pointer;box-shadow:0 2px 10px rgba(0,0,0,.5)}
        input[type=range].gt-range::-moz-range-thumb{height:22px;width:22px;border-radius:9999px;background:#fff;border:4px solid #f8b84e;cursor:pointer}
      `}</style>
      <StickyNav />

      {/* Hero */}
      <section className="relative overflow-hidden px-5 pb-16 pt-20 sm:px-8 lg:px-10">
        <div className="absolute inset-0 bg-[radial-gradient(110%_90%_at_20%_0%,rgba(248,184,78,0.15),transparent_55%),radial-gradient(110%_90%_at_95%_15%,rgba(66,214,201,0.12),transparent_55%)]" />
        <div className="relative mx-auto max-w-7xl">
          <Reveal>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/80 backdrop-blur">
              <Lock className="h-4 w-4 text-[#f8b84e]" />
              Private & confidential · Non-binding heads of terms · July 2026
            </div>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="mt-6 max-w-5xl text-5xl font-black uppercase leading-[0.94] sm:text-7xl">
              You hold the <span className="text-[#f8b84e]">license</span>.
              <br />I bring the <span className="text-[#42d6c9]">demand</span>.
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-white/75">
              Wrapco is one of only <strong className="text-white">12 XPEL-authorized centers in Dubai</strong> — a
              network now closed to new entrants. I've spent this year building a PPF marketing machine that banked{" "}
              <strong className="text-white">AED 727k+ from AED 55k of ad spend</strong> — in the most undercut corner
              of the market, without a license like yours. This proposal puts the two together.
            </p>
          </Reveal>
          <Reveal delay={240}>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#proof"
                className="inline-flex h-12 items-center gap-2 rounded-md bg-[#f8b84e] px-6 font-bold text-black transition hover:bg-white"
              >
                See the proof
                <ChevronRight className="h-4 w-4" />
              </a>
              <a
                href="#deal"
                className="inline-flex h-12 items-center gap-2 rounded-md border border-white/20 bg-white/5 px-6 font-bold text-white transition hover:bg-white/15"
              >
                Straight to the deal
              </a>
            </div>
          </Reveal>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {heroStats.map((stat, i) => (
              <Reveal key={stat.label} delay={i * 90}>
                <div className="rounded-lg border border-white/12 bg-white/[0.05] p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/50">{stat.label}</p>
                  <p className="mt-2 text-3xl font-black text-white">{stat.display}</p>
                  <p className="mt-1 text-sm text-white/55">{stat.sub}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Proof */}
      <section id="proof" className="scroll-mt-20 px-5 py-14 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <SectionKicker color="#42d6c9">What I built in six months</SectionKicker>
            <h2 className="mt-3 max-w-3xl text-4xl font-black uppercase leading-tight sm:text-5xl">
              Grand Touch: zero → <span className="text-[#42d6c9]">AED 727k+</span>, in 1,600 sq ft
            </h2>
            <p className="mt-4 max-w-3xl leading-7 text-white/70">
              From a standing start in January — one-third of your floor space, an AED 10k sublease, no XPEL
              authorization, selling against shops quoting 6k for full bodies. Every dirham below is closed and
              banked, not pipeline.
            </p>
          </Reveal>

          <div className="mt-10 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
            <Reveal className="rounded-lg border border-white/12 bg-white/[0.04] p-5">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-white/55">
                Closed revenue by month · Jan–Jun 2026
              </p>
              <div className="mt-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={gtMonthly} margin={{ top: 24, right: 8, left: 8, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.07)" vertical={false} />
                    <XAxis dataKey="month" stroke="rgba(255,255,255,0.45)" tickLine={false} axisLine={false} />
                    <YAxis
                      stroke="rgba(255,255,255,0.45)"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
                      width={40}
                    />
                    <Tooltip
                      contentStyle={chartTooltipStyle}
                      formatter={(value: number) => [formatAed(value), "Closed revenue"]}
                      cursor={{ fill: "rgba(255,255,255,0.06)" }}
                    />
                    <Bar dataKey="revenue" radius={[6, 6, 0, 0]} fill="#42d6c9">
                      <LabelList
                        dataKey="revenue"
                        position="top"
                        formatter={(v: number) => `${Math.round(v / 1000)}k`}
                        style={{ fill: "rgba(255,255,255,0.65)", fontSize: 11, fontWeight: 700 }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-3 text-xs text-white/45">
                94 paid jobs. June includes the current run-rate extension. Premium metal throughout — Patrols,
                911s, Cullinans, G-Wagons.
              </p>
            </Reveal>

            <div className="flex flex-col gap-6">
              <Reveal delay={80} className="rounded-lg border border-white/12 bg-white/[0.04] p-5">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-white/55">
                  Ad spend → revenue · real, since Jan
                </p>
                <div className="mt-4 flex items-end gap-4">
                  <div>
                    <p className="text-3xl font-black text-white">AED 55k</p>
                    <p className="text-xs text-white/50">total ad spend</p>
                  </div>
                  <ArrowUpRight className="mb-2 h-6 w-6 text-[#a3e635]" />
                  <div>
                    <p className="text-3xl font-black text-[#a3e635]">
                      <CountStat value={PROVEN_REVENUE} format={(n) => formatShort(n)} />
                    </p>
                    <p className="text-xs text-white/50">closed revenue · ~{BLENDED_ROAS}x blended</p>
                  </div>
                </div>
                <div className="mt-4 flex h-3 w-full overflow-hidden rounded-full bg-white/10">
                  {adSpendSplit.map((c) => (
                    <div
                      key={c.channel}
                      style={{ width: `${(c.value / AD_SPEND_TOTAL) * 100}%`, background: c.color }}
                      title={c.channel}
                    />
                  ))}
                </div>
                <div className="mt-3 space-y-1.5">
                  {adSpendSplit.map((c) => (
                    <div key={c.channel} className="flex items-center gap-2 text-sm text-white/65">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: c.color }} />
                      {c.channel} · {formatShort(c.value)}
                    </div>
                  ))}
                </div>
              </Reveal>

              <Reveal delay={160} className="rounded-lg border border-white/12 bg-white/[0.04] p-5">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-white/55">Cost per lead, today</p>
                <div className="mt-4 space-y-4">
                  <div>
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="font-bold text-[#42d6c9]">Grand Touch funnels</span>
                      <span className="font-black text-white">AED 30–40 · qualified</span>
                    </div>
                    <div className="mt-1.5 h-2.5 rounded-full bg-white/10">
                      <div className="h-2.5 w-[44%] rounded-full bg-[#42d6c9]" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="font-bold text-[#ef6345]">Wrapco current ads</span>
                      <span className="font-black text-white">~AED 80 · mostly unqualified</span>
                    </div>
                    <div className="mt-1.5 h-2.5 rounded-full bg-white/10">
                      <div className="h-2.5 w-full rounded-full bg-[#ef6345]" />
                    </div>
                  </div>
                </div>
                <p className="mt-4 text-xs leading-5 text-white/45">
                  Same city, same product category — half the cost, and the leads arrive pre-qualified through
                  price-transparent booking funnels instead of asking for jobs.
                </p>
              </Reveal>
            </div>
          </div>

          <Reveal delay={120}>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {proofImages.map((img) => (
                <figure key={img.src} className="overflow-hidden rounded-lg border border-white/10">
                  <img src={img.src} alt={img.label} loading="lazy" className="h-40 w-full object-cover sm:h-48" />
                  <figcaption className="bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white/60">
                    {img.label}
                  </figcaption>
                </figure>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Founder */}
      <section id="founder" className="scroll-mt-20 px-5 py-14 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <SectionKicker color="#f8b84e">Who you're partnering with</SectionKicker>
            <h2 className="mt-3 max-w-3xl text-4xl font-black uppercase leading-tight sm:text-5xl">
              A proven operator, not a promise
            </h2>
            <p className="mt-4 max-w-3xl leading-7 text-white/70">
              Sean spent a decade running marketing for exchanges, brokers and IPOs before pointing the same engine
              at Dubai car care. Grand Touch is the proof it transfers.
            </p>
          </Reveal>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {founderTrackRecord.map((card, i) => (
              <Reveal key={card.title} delay={i * 90}>
                <div className="h-full rounded-lg border border-white/12 bg-white/[0.04] p-5">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-md"
                    style={{ background: `${card.color}1f`, color: card.color }}
                  >
                    <card.icon className="h-5 w-5" />
                  </div>
                  <p className="mt-4 text-3xl font-black" style={{ color: card.color }}>
                    {card.metric}
                  </p>
                  <p className="mt-1 font-bold text-white">{card.title}</p>
                  <p className="mt-2 text-sm leading-6 text-white/60">{card.body}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <Reveal className="overflow-hidden rounded-lg border border-white/12">
              <img
                src="/guided-sean-with-patrols-v2.jpg"
                alt="Sean, founder of Grand Touch, with customer Patrols"
                loading="lazy"
                className="h-72 w-full object-cover sm:h-80"
              />
              <div className="bg-white/[0.04] px-4 py-3">
                <p className="text-sm font-bold text-white">Sean Gardner · Founder, Grand Touch</p>
                <p className="text-xs text-white/55">British owned & run — a trust signal Dubai customers pay for.</p>
              </div>
            </Reveal>
            <Reveal delay={100} className="flex flex-col justify-between overflow-hidden rounded-lg border border-white/12">
              <img
                src="/sean-phoenix-ipo-bell.png"
                alt="Sean at the Phoenix Group $3.5B IPO bell ceremony on ADX"
                loading="lazy"
                className="h-72 w-full object-cover object-top sm:h-80"
              />
              <div className="bg-white/[0.04] px-4 py-3">
                <p className="text-sm font-bold text-white">Ringing the bell — $3.5B ADX listing, Dec 2023</p>
                <p className="text-xs text-white/55">
                  “I've helped raise over $15M for other founders and led the marketing on a $3.5B IPO. Grand Touch
                  is me doing it for myself — Wrapco is us doing it together.”
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* XPEL window */}
      <section id="xpel" className="scroll-mt-20 px-5 py-14 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <SectionKicker color="#a3e635">Why Wrapco, why now</SectionKicker>
            <h2 className="mt-3 max-w-3xl text-4xl font-black uppercase leading-tight sm:text-5xl">
              The XPEL window: a market where <span className="text-[#a3e635]">price wars can't follow</span>
            </h2>
            <p className="mt-4 max-w-3xl leading-7 text-white/70">
              I'm winning in the brutal end of the market right now — where every job is a knife-fight against 6k
              quotes on grey film. Your license removes that fight entirely. Independent research, July 2026:
            </p>
          </Reveal>

          <div className="mt-10 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="flex flex-col gap-4">
              {[
                {
                  icon: ShieldCheck,
                  color: "#f8b84e",
                  title: "12 approved centers. Network closed.",
                  body: "XPEL isn't issuing new Dubai authorizations. Wrapco's listing on xpel.com is an asset nobody can buy or build — it can only be partnered with.",
                },
                {
                  icon: ShieldX,
                  color: "#ef6345",
                  title: "The undercutters aren't authorized",
                  body: "Every shop advertising “XPEL” at 6–11k is absent from XPEL's official installer list. No authorized installer = no registerable factory warranty — and documented cases of counterfeit film sold as XPEL in Dubai.",
                },
                {
                  icon: Megaphone,
                  color: "#42d6c9",
                  title: "That's an attack line, not a problem",
                  body: "Awareness campaigns write themselves: “Only 12 centers in Dubai can register your XPEL warranty — check XPEL's own website.” Their price advantage becomes our trust advantage.",
                },
              ].map((card, i) => (
                <Reveal key={card.title} delay={i * 90}>
                  <div className="rounded-lg border border-white/12 bg-white/[0.04] p-5">
                    <div className="flex items-start gap-4">
                      <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md"
                        style={{ background: `${card.color}1f`, color: card.color }}
                      >
                        <card.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-bold text-white">{card.title}</p>
                        <p className="mt-1.5 text-sm leading-6 text-white/60">{card.body}</p>
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal delay={120} className="rounded-lg border border-white/12 bg-white/[0.04] p-5">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-white/55">
                Full-body “XPEL” quotes in Dubai · market research, Jul 2026
              </p>
              <div className="mt-4 h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pricingData} margin={{ top: 24, right: 8, left: 8, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.07)" vertical={false} />
                    <XAxis
                      dataKey="name"
                      stroke="rgba(255,255,255,0.45)"
                      tickLine={false}
                      axisLine={false}
                      interval={0}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis
                      stroke="rgba(255,255,255,0.45)"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
                      width={36}
                    />
                    <Tooltip
                      contentStyle={chartTooltipStyle}
                      formatter={(value: number, _n, item) => [
                        formatAed(value),
                        item?.payload?.approved ? "Authorized channel" : "Not on XPEL's installer list",
                      ]}
                      cursor={{ fill: "rgba(255,255,255,0.06)" }}
                    />
                    <ReferenceLine
                      y={14500}
                      stroke="#f8b84e"
                      strokeDasharray="6 4"
                      label={{
                        value: "AED 14,500 contract floor",
                        fill: "#f8b84e",
                        fontSize: 11,
                        position: "insideTopRight",
                      }}
                    />
                    <Bar dataKey="price" radius={[6, 6, 0, 0]}>
                      {pricingData.map((entry) => (
                        <Cell key={entry.name} fill={entry.approved ? "#f8b84e" : "#ef6345"} />
                      ))}
                      <LabelList
                        dataKey="price"
                        position="top"
                        formatter={(v: number) => `${(v / 1000).toFixed(1)}k`}
                        style={{ fill: "rgba(255,255,255,0.65)", fontSize: 11, fontWeight: 700 }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 flex flex-wrap gap-4 text-xs text-white/55">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ef6345]" /> Not authorized — no factory warranty
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#f8b84e]" /> Authorized channel
                </span>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* The numbers */}
      <section id="math" className="scroll-mt-20 px-5 py-14 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <SectionKicker color="#f472b6">The numbers</SectionKicker>
            <h2 className="mt-3 max-w-3xl text-4xl font-black uppercase leading-tight sm:text-5xl">
              What the license does at <span className="text-[#f472b6]">AED 14,500</span> a car
            </h2>
            <p className="mt-4 max-w-3xl leading-7 text-white/70">
              Drag the volume. Six bays support roughly 30+ full bodies a month at capacity — my funnels' job is to
              keep them full. Real unit costs: XPEL film AED 6,000 + install labour AED 2,000 per car — AED 6,500
              gross on every AED 14,500 ticket. Marketing modelled at 12% of revenue.
            </p>
          </Reveal>

          <Reveal delay={100}>
            <div className="mt-10 grid gap-6 rounded-lg border border-white/12 bg-white/[0.04] p-6 lg:grid-cols-[0.9fr_1.1fr]">
              <div>
                <div className="flex items-baseline justify-between">
                  <label className="text-sm font-bold uppercase tracking-[0.18em] text-white/55">
                    XPEL full bodies / week
                  </label>
                  <span className="text-3xl font-black text-[#f8b84e]">{carsPerWeek}</span>
                </div>
                <input
                  type="range"
                  min={3}
                  max={9}
                  step={1}
                  value={carsPerWeek}
                  onChange={(e) => setCarsPerWeek(Number(e.target.value))}
                  className="gt-range mt-4 w-full"
                  style={{
                    background: `linear-gradient(90deg,#f8b84e ${((carsPerWeek - 3) / 6) * 100}%, rgba(255,255,255,0.12) ${((carsPerWeek - 3) / 6) * 100}%)`,
                  }}
                />
                <div className="mt-2 flex justify-between text-xs text-white/40">
                  <span>3 · proof phase</span>
                  <span>9 · near capacity</span>
                </div>
                <div className="mt-6 rounded-md border border-white/10 bg-black/30 p-4 text-sm leading-6 text-white/65">
                  <p>
                    <strong className="text-white">{math.carsPerMonth} cars/month</strong> ·{" "}
                    <strong className="text-white">{formatShort(math.revenue)}</strong> revenue — every job at a
                    price the grey market is contractually locked out of matching through the authorized channel.
                  </p>
                  <p className="mt-2 text-xs text-white/45">
                    For reference: Wrapco's whole FY2025 banked ~AED 140k/month across five service lines.
                  </p>
                </div>
              </div>
              <div className="grid content-start gap-3 sm:grid-cols-2">
                {[
                  { label: "Monthly revenue", value: math.revenue, color: "#f8b84e" },
                  { label: "XPEL film (6k) + install (2k)", value: -math.directCosts, color: "#ef6345" },
                  { label: "Marketing engine (12%)", value: -math.marketing, color: "#f472b6" },
                  { label: "My fee — from the 10% set-aside", value: -math.salaryPool, color: "#7dd3fc" },
                  { label: "Left for overheads + profit", value: math.afterEngine, color: "#a3e635", big: true },
                ].map((row) => (
                  <div
                    key={row.label}
                    className={cx(
                      "rounded-md border border-white/10 bg-black/30 p-4",
                      row.big && "sm:col-span-2"
                    )}
                  >
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/45">{row.label}</p>
                    <p className={cx("mt-1 font-black", row.big ? "text-3xl" : "text-xl")} style={{ color: row.color }}>
                      <CountStat value={Math.abs(row.value)} format={(n) => `${row.value < 0 ? "−" : ""}${formatShort(n)}`} />
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          {/* 24-month growth picture */}
          <Reveal delay={80}>
            <div className="mt-10 rounded-lg border border-white/12 bg-white/[0.04] p-6">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-white/55">
                    Where it goes · 24-month growth picture
                  </p>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">
                    The workshop supports up to <strong className="text-white">10 bays</strong>. PPF scales first,
                    tint marketing switches on in month 4, the paint booth comes online in month 7 — three engines,
                    one demand machine.
                  </p>
                </div>
                <div className="shrink-0 rounded-md border border-[#a3e635]/30 bg-[#a3e635]/10 px-4 py-3 text-right">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#a3e635]/80">
                    Month 24 run-rate
                  </p>
                  <p className="text-3xl font-black text-[#a3e635]">
                    <CountStat value={growthEnd.total} format={(n) => formatShort(n)} />
                    <span className="text-base font-bold text-white/60">/mo</span>
                  </p>
                  <p className="text-xs text-white/50">
                    ≈ {formatShort(growthEnd.total * 12)} a year · {(growthEnd.total / WRAPCO_FY25_MONTHLY).toFixed(1)}×
                    today's Wrapco
                  </p>
                </div>
              </div>
              <div className="mt-5 h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={growthData} margin={{ top: 16, right: 8, left: 8, bottom: 0 }}>
                    <defs>
                      {growthStreams.map((s) => (
                        <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={s.color} stopOpacity={0.75} />
                          <stop offset="100%" stopColor={s.color} stopOpacity={0.15} />
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.07)" vertical={false} />
                    <XAxis
                      dataKey="month"
                      stroke="rgba(255,255,255,0.45)"
                      tickLine={false}
                      axisLine={false}
                      interval={2}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis
                      stroke="rgba(255,255,255,0.45)"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
                      width={44}
                    />
                    <Tooltip
                      contentStyle={chartTooltipStyle}
                      formatter={(value: number, name: string) => [formatAed(value), name]}
                      labelFormatter={(label: string) => `Month ${label.slice(1)}`}
                    />
                    <ReferenceLine
                      x="M7"
                      stroke="rgba(255,255,255,0.35)"
                      strokeDasharray="5 4"
                      label={{ value: "Earn-in begins", fill: "rgba(255,255,255,0.6)", fontSize: 11, position: "insideTopLeft" }}
                    />
                    <ReferenceLine
                      x="M18"
                      stroke="rgba(163,230,53,0.5)"
                      strokeDasharray="5 4"
                      label={{ value: "Buyout option opens", fill: "#a3e635", fontSize: 11, position: "insideTopLeft" }}
                    />
                    {growthStreams.map((s) => (
                      <Area
                        key={s.key}
                        type="monotone"
                        dataKey={s.key}
                        name={s.name}
                        stackId="rev"
                        stroke={s.color}
                        strokeWidth={2}
                        fill={`url(#grad-${s.key})`}
                      />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-4">
                {growthStreams.map((s) => (
                  <span key={s.key} className="flex items-center gap-2 text-xs text-white/60">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                    {s.name}
                  </span>
                ))}
                <span className="ml-auto text-xs text-white/40">
                  Illustrative scenario · PPF at AED 14,500 avg ticket · tint & paint at owner-quoted capacity
                </span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* The deal */}
      <section id="deal" className="scroll-mt-20 px-5 py-14 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <SectionKicker color="#f8b84e">The deal</SectionKicker>
            <h2 className="mt-3 max-w-3xl text-4xl font-black uppercase leading-tight sm:text-5xl">
              Zero cash risk to you. Equity only after <span className="text-[#f8b84e]">banked growth</span>.
            </h2>
          </Reveal>

          {/* Phase 0 */}
          <Reveal delay={80}>
            <p className="mt-10 text-sm font-bold uppercase tracking-[0.22em] text-white/50">
              Phase 0 · Before day one
            </p>
          </Reveal>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {phase0.map((card, i) => (
              <Reveal key={card.title} delay={i * 90}>
                <div className="h-full rounded-lg border border-white/12 bg-white/[0.04] p-5">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-md"
                    style={{ background: `${card.color}1f`, color: card.color }}
                  >
                    <card.icon className="h-5 w-5" />
                  </div>
                  <p className="mt-4 font-bold text-white">{card.title}</p>
                  <p className="mt-2 text-sm leading-6 text-white/60">{card.body}</p>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Phase 1 */}
          <Reveal delay={80}>
            <p className="mt-12 text-sm font-bold uppercase tracking-[0.22em] text-white/50">
              Phase 1 · Months 1–6 — I run it, you keep 100%
            </p>
          </Reveal>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Reveal className="rounded-lg border border-[#42d6c9]/30 bg-[#42d6c9]/[0.06] p-5">
              <p className="flex items-center gap-2 font-black uppercase tracking-[0.14em] text-[#42d6c9]">
                <Wrench className="h-4 w-4" /> I take over
              </p>
              <ul className="mt-4 space-y-2.5">
                {phase1Me.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm leading-6 text-white/75">
                    <Check className="mt-1 h-4 w-4 shrink-0 text-[#42d6c9]" />
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal delay={90} className="rounded-lg border border-[#f8b84e]/30 bg-[#f8b84e]/[0.06] p-5">
              <p className="flex items-center gap-2 font-black uppercase tracking-[0.14em] text-[#f8b84e]">
                <Handshake className="h-4 w-4" /> You keep
              </p>
              <ul className="mt-4 space-y-2.5">
                {phase1You.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm leading-6 text-white/75">
                    <Check className="mt-1 h-4 w-4 shrink-0 text-[#f8b84e]" />
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {phase1Terms.map((term, i) => (
              <Reveal key={term.title} delay={i * 70}>
                <div className="h-full rounded-lg border border-white/12 bg-white/[0.04] p-5">
                  <term.icon className="h-5 w-5 text-white/60" />
                  <p className="mt-3 font-bold text-white">{term.title}</p>
                  <p className="mt-1.5 text-sm leading-6 text-white/60">{term.body}</p>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Phase 2 */}
          <Reveal delay={80}>
            <p className="mt-12 text-sm font-bold uppercase tracking-[0.22em] text-white/50">
              Phase 2 · Months 7–24 — the earn-in (headline terms, negotiated month 5–6)
            </p>
          </Reveal>
          <div className="mt-4 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <Reveal className="rounded-lg border border-white/12 bg-white/[0.04] p-6">
              <p className="text-5xl font-black text-[#f8b84e]">
                Up to 50<span className="text-3xl">%</span>
              </p>
              <p className="mt-2 font-bold text-white">earned in quarterly tranches — never given, always paid for</p>
              <p className="mt-3 text-sm leading-6 text-white/60">
                Each tranche is certified against bank statements and the garage software, with share-transfer
                documents pre-signed and held in escrow, executed per UAE notarization requirements. Every
                percentage point I earn has already been paid for by verified revenue sitting in the company
                account. Plus: a call option to acquire the remaining 50% at a pre-agreed valuation formula,
                exercisable months 18–36.
              </p>
              <ul className="mt-5 space-y-2.5">
                {milestoneKpis.map((kpi) => (
                  <li key={kpi.text} className="flex items-start gap-2.5 text-sm leading-6 text-white/75">
                    <kpi.icon className="mt-0.5 h-4 w-4 shrink-0 text-[#a3e635]" />
                    {kpi.text}
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal delay={100} className="rounded-lg border border-white/12 bg-white/[0.04] p-6">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-white/55">Today vs together</p>
              <div className="mt-4 space-y-3">
                {comparison.map((row) => (
                  <div key={row.today} className="grid gap-2 rounded-md border border-white/10 bg-black/30 p-3 sm:grid-cols-2">
                    <p className="text-sm leading-5 text-white/50">{row.today}</p>
                    <p className="text-sm font-semibold leading-5 text-[#a3e635]">{row.together}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm font-bold italic leading-6 text-white/75">
                You keep half of something big instead of all of something stuck.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Next steps */}
      <section id="steps" className="scroll-mt-20 px-5 py-14 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <SectionKicker color="#42d6c9">Next steps</SectionKicker>
            <h2 className="mt-3 max-w-3xl text-4xl font-black uppercase leading-tight sm:text-5xl">
              Live within <span className="text-[#42d6c9]">14 days</span> of signature
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {nextSteps.map((step, i) => (
              <Reveal key={step.title} delay={i * 90}>
                <div className="h-full rounded-lg border border-white/12 bg-white/[0.04] p-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-md bg-[#42d6c9]/15 text-[#42d6c9]">
                    <step.icon className="h-5 w-5" />
                  </div>
                  <p className="mt-4 font-bold text-white">
                    {i + 1}. {step.title}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/60">{step.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={120}>
            <div className="mt-10 rounded-lg border border-[#f8b84e]/30 bg-[#f8b84e]/[0.07] p-6 sm:p-8">
              <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
                <div>
                  <p className="text-2xl font-black text-white">Ready when you are.</p>
                  <p className="mt-1 max-w-xl text-sm leading-6 text-white/65">
                    The engine that built Grand Touch doesn't need ramp-up time — it needs your license and six
                    bays. Reply to Sean directly to move to Phase 0.
                  </p>
                </div>
                <a
                  href="mailto:hello@sgservices.ae?subject=Wrapco%20proposal%20—%20let's%20talk"
                  className="inline-flex h-12 shrink-0 items-center gap-2 rounded-md bg-[#f8b84e] px-6 font-bold text-black transition hover:bg-white"
                >
                  <Car className="h-4 w-4" />
                  Talk to Sean
                </a>
              </div>
            </div>
          </Reveal>
          <p className="mt-10 text-center text-xs leading-5 text-white/35">
            Private & confidential. Non-binding heads of terms for discussion — definitive agreements to be prepared
            by UAE counsel. Grand Touch performance figures are actual closed revenue Jan–Jun 2026; Wrapco figures
            from documents provided by the owner; market pricing from public research, July 2026.
          </p>
        </div>
      </section>
    </main>
  );
}
