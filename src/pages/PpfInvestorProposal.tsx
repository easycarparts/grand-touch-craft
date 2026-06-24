import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowUpRight,
  Banknote,
  Car,
  Check,
  ChevronRight,
  CircleDollarSign,
  Factory,
  Flame,
  Gauge,
  Instagram,
  KeyRound,
  Lock,
  Megaphone,
  Music2,
  Play,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  UserCheck,
  Users,
  Wrench,
} from "lucide-react";

const PROPOSAL_PASSWORD = import.meta.env.VITE_PPF_INVESTOR_PASSWORD || "GTAPPF2026";
const STORAGE_KEY = "gt-ppf-investor-unlocked";

const formatAed = (value: number) =>
  new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: "AED",
    maximumFractionDigits: 0,
  }).format(value);

const formatShort = (value: number) => {
  if (value >= 1_000_000) return `AED ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `AED ${Math.round(value / 1_000)}k`;
  return `AED ${value}`;
};

const actualRevenueData = [
  { month: "Jan", actualQuote: 95866, runRateExtension: null, projection: 95866 },
  { month: "Feb", actualQuote: 77449, runRateExtension: null, projection: 77449 },
  { month: "Mar", actualQuote: 138330, runRateExtension: null, projection: 138330 },
  { month: "Apr", actualQuote: 156540, runRateExtension: null, projection: 162000 },
  { month: "May", actualQuote: 145588, runRateExtension: null, projection: 190000 },
  { month: "Jun", actualQuote: 62387, runRateExtension: 87613, projection: 222000 },
  { month: "Jul", actualQuote: null, runRateExtension: null, projection: 260000 },
  { month: "Aug", actualQuote: null, runRateExtension: null, projection: 304000 },
  { month: "Sep", actualQuote: null, runRateExtension: null, projection: 356000 },
  { month: "Oct", actualQuote: null, runRateExtension: null, projection: 417000 },
  { month: "Nov", actualQuote: null, runRateExtension: null, projection: 488000 },
  { month: "Dec", actualQuote: null, runRateExtension: null, projection: 570000 },
];

// COGS ~50% on PPF (e.g. 10-year PPF sold ~AED 10k: ~AED 3k film + ~AED 2k install).
// Each scenario is shown as a profit RANGE: low end bills every car at today's below-market
// AED 10k, high end is the SAME volume at premium AED 15k pricing - COGS and overhead unchanged.
const revenueScenarios = [
  {
    name: "Base",
    tag: "6-12 months",
    revLow: 300000,
    revHigh: 450000,
    cogs: 150000,
    fixed: 45700,
    profitLow: 104300,
    profitHigh: 254300,
    note: "Current team and overhead - no new hires needed.",
  },
  {
    name: "Target",
    tag: "10 cars/week",
    revLow: 520000,
    revHigh: 780000,
    cogs: 260000,
    fixed: 55700,
    profitLow: 204300,
    profitHigh: 464300,
    note: "Staffing steps up to ~AED 20k; rent and marketing unchanged.",
  },
  {
    name: "Target + paint",
    tag: "PPF + paint lane",
    revLow: 610000,
    revHigh: 870000,
    cogs: 291000,
    fixed: 63000,
    profitLow: 256000,
    profitHigh: 516000,
    note: "Paint adds at lower COGS, so blended margin improves.",
  },
];

// Lean first-year envelope: tools, equipment and consumables already owned (AED 0 to investor),
// fit-out supplied at cost via the investor's own company, paint/prep phased in later.
// Same product, same cars, same COGS - only the price moves as brand awareness grows.
// Hold volume flat at ~43 cars/month (10 a week); revenue and profit are derived from price.
const PRICE_MAX = 15000;
const PPF_CARS_PER_MONTH = 43;
const PPF_COGS_PER_CAR = 5000;
const PPF_FIXED_OVERHEAD = 55700;
const pricingTiers = [
  { label: "Today - below market", price: 10000, cogs: PPF_COGS_PER_CAR, badge: "Now", color: "#7dd3fc", current: true },
  { label: "As brand awareness grows", price: 12000, cogs: PPF_COGS_PER_CAR, badge: "Next", color: "#f8b84e", current: false },
  { label: "Premium positioning + Google Ads", price: 15000, cogs: PPF_COGS_PER_CAR, badge: "Upside", color: "#a3e635", current: false },
];

const costBuckets = [
  { name: "Annual rent", value: 200000, color: "#f8b84e" },
  { name: "License + visas", value: 65000, color: "#42d6c9" },
  { name: "Deposit + Ejari", value: 30000, color: "#7dd3fc" },
  { name: "Fit-out at cost", value: 42000, color: "#ef6345" },
  { name: "Marketing reserve", value: 40000, color: "#f472b6" },
  { name: "Working capital", value: 33000, color: "#a3e635" },
];

const monthlyOpex = [
  { item: "Rent", value: 16700 },
  { item: "Two staff", value: 10000 },
  { item: "Marketing", value: 10000 },
  { item: "Waste/maintenance", value: 3000 },
  { item: "Admin", value: 2500 },
  { item: "Utilities", value: 2000 },
  { item: "Software/phones", value: 1500 },
];

// Single source for the proportion bar and the line list. Values are midpoints (sum = setup envelope).
const setupLines = [
  { name: "12-month rent", value: 200000, range: "AED 200k", note: "The only large line - production unit, not a showroom", color: "#f8b84e" },
  { name: "License + 2 visas", value: 65000, range: "AED 55-75k", note: "Activity, authority approvals & two staff visas", color: "#42d6c9" },
  { name: "Fit-out at cost", value: 42000, range: "AED 35-50k", note: "Supplied at cost via partner's own company", color: "#ef6345" },
  { name: "Deposit + Ejari", value: 30000, range: "AED 25-35k", note: "Landlord deposit, agency & registration", color: "#7dd3fc" },
  { name: "Marketing reserve", value: 40000, range: "AED 30-50k", note: "Launch runway - self-funding fast at 10-15x ROAS", color: "#f472b6" },
  { name: "Working capital", value: 33000, range: "AED 25-40k", note: "Ramp, collection timing & contingency buffer", color: "#a3e635" },
];

// Already owned by Sean - AED 0 to the investor.
const ownedAssets = [
  {
    item: "PPF tooling, plotter, lights & install gear",
    note: "Production-ready equipment already owned. No capex required to start installing.",
    icon: Wrench,
  },
  {
    item: "Film, chemicals & launch consumables",
    note: "Working stock already in hand. Future material demand scales inside job COGS.",
    icon: Sparkles,
  },
  {
    item: "Marketing engine, website & funnels",
    note: "Built, live and converting today - run in-house by Sean at 10-15x ROAS.",
    icon: Megaphone,
  },
  {
    item: "Core team already in place",
    note: "Existing staff sit on their own visas or Sean's company - no payroll to build from scratch. Only two visa transfers are needed, already inside the ask.",
    icon: Users,
  },
  {
    item: "6-strong PPF install crew",
    note: "Installers run on contract, so there is no fixed installer payroll. Their cost flexes per car inside job COGS, not overhead.",
    icon: UserCheck,
  },
];

const proofStats = [
  { label: "Closed & paid revenue", value: "AED 727k+", sub: "94 paid jobs since Jan 2026" },
  { label: "Return on ad spend", value: "10-15x", sub: "Ad spend to completed-job revenue" },
  { label: "New audience since Jan", value: "+3,900", sub: "+500 Instagram, +3,400 TikTok" },
  { label: "Total investor ask", value: "AED 350-450k", sub: "Tools, stock & fit-out already covered" },
];

const marketingGrowth = [
  {
    label: "Instagram followers added",
    value: "+500",
    sub: "Built organically since January 2026",
    icon: Instagram,
    color: "#f472b6",
  },
  {
    label: "TikTok followers added",
    value: "+3,400",
    sub: "Driven by in-house content since January",
    icon: Music2,
    color: "#42d6c9",
  },
  {
    label: "Return on ad spend",
    value: "10-15x",
    sub: "Ad spend to completed-job revenue",
    icon: Gauge,
    color: "#f8b84e",
  },
  {
    label: "Marketing run in-house",
    value: "100%",
    sub: "Ads, funnel, content & leads by Sean",
    icon: Rocket,
    color: "#a3e635",
  },
];

const tractionCards = [
  {
    title: "Demand already exists",
    body: "AED 727k+ in closed, paid work since January - delivered while operating inside someone else's space and brand constraints.",
    icon: Gauge,
  },
  {
    title: "The bottleneck is space",
    body: "This is not an unproven idea. It is a constrained PPF lane that needs ownership, floor space and control to scale.",
    icon: Factory,
  },
  {
    title: "Sean drives the growth",
    body: "Marketing, website, funnels, content and sales are already handled in-house at a 10-15x return on ad spend.",
    icon: Target,
  },
];

const proofImages = [
  { src: "/guided-install-detail.png", label: "PPF install detail" },
  { src: "/guided-rolls-install.png", label: "Rolls-Royce install" },
  { src: "/guided-911-stek-roll.png", label: "911 - STEK roll" },
  { src: "/guided-cullinan-ppf.png", label: "Cullinan full body" },
  { src: "/guided-911-gloss.png", label: "911 gloss PPF" },
];

const sourceLinks = [
  {
    label: "Dubai DET mainland licensing overview",
    href: "https://www.dubaidet.gov.ae/en/licences-and-permits/business-licensing",
  },
  {
    label: "DET activity reference: Auto Accessories Fitting and Auto Denting & Painting",
    href: "https://www.dubailicensing.com/service/dubai-department-of-economic-tourism-det-business-activities-list-a?id=8",
  },
  {
    label: "Al Quoz detailing warehouse example at AED 385k/year",
    href: "https://www.metahomes.net/property/for-rent/commercial/2036391636723007490",
  },
  {
    label: "Auto garage setup cost and approval ranges",
    href: "https://diac.ae/blog/open-auto-repair-garage-dubai/",
  },
  {
    label: "Dubai mainland employee visa cost estimate",
    href: "https://www.dubaifreezonecompany.com/auriondubai/company-visa-cost-in-uae.html",
  },
];

const handoverVideos = [
  {
    title: "Real handover reactions",
    subtitle: "Customer montage",
    videoSrc: "https://res.cloudinary.com/diw6rekpm/video/upload/q_auto/v1781334893/customer_roqujv.mp4",
    posterSrc: "https://res.cloudinary.com/diw6rekpm/video/upload/so_2/v1781334893/customer_roqujv.jpg",
  },
  {
    title: "Samir",
    subtitle: "Porsche 911 · Matte PPF",
    videoSrc: "https://res.cloudinary.com/diw6rekpm/video/upload/q_auto/v1781333287/911_MATTE_aaomcw.mp4",
    posterSrc: "https://res.cloudinary.com/diw6rekpm/video/upload/so_2/v1781333287/911_MATTE_aaomcw.jpg",
  },
  {
    title: "Mansoor",
    subtitle: "Porsche 911 · STEK Gloss",
    videoSrc: "https://res.cloudinary.com/diw6rekpm/video/upload/q_auto/v1781333400/911_4_vcvvkn.mp4",
    posterSrc: "https://res.cloudinary.com/diw6rekpm/video/upload/so_2/v1781333400/911_4_vcvvkn.jpg",
  },
  {
    title: "Scott",
    subtitle: "Jetour G700 · Matte + paint match",
    videoSrc: "https://res.cloudinary.com/diw6rekpm/video/upload/q_auto/v1781333432/G7_BLUE_wlvxks.mp4",
    posterSrc: "https://res.cloudinary.com/diw6rekpm/video/upload/so_2/v1781333432/G7_BLUE_wlvxks.jpg",
  },
  {
    title: "Mark",
    subtitle: "Zeekr 001 · Owner review",
    videoSrc: "https://res.cloudinary.com/diw6rekpm/video/upload/q_auto/f_auto/v1775562589/Mark_Zeekr_conzdp.mp4",
    posterSrc: "/mark-zeekr-001.png",
  },
  {
    title: "Zee",
    subtitle: "Aston Martin Rapide · Colour PPF",
    videoSrc: "https://res.cloudinary.com/diw6rekpm/video/upload/q_auto/v1781333953/Aston_Martin_Rapide_S_rstzr2.mp4",
    posterSrc: "https://res.cloudinary.com/diw6rekpm/video/upload/so_2/v1781333953/Aston_Martin_Rapide_S_rstzr2.jpg",
  },
];

function PasswordGate({ onUnlock }: { onUnlock: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password.trim() === PROPOSAL_PASSWORD) {
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
              Private investor proposal
            </div>
            <h1 className="max-w-4xl text-[44px] font-black uppercase leading-[0.92] tracking-normal text-white sm:text-6xl lg:text-7xl">
              Dubai PPF Studio
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/78">
              A capacity-led proposal for a dedicated PPF, detailing and paint-capable studio built around Sean's proven
              demand, in-house marketing engine and premium average ticket.
            </p>
          </div>
          <form onSubmit={submit} className="rounded-lg border border-white/15 bg-[#111]/90 p-5 shadow-2xl backdrop-blur">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-md bg-[#f8b84e] text-black">
              <KeyRound className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold">Enter password</h2>
            <p className="mt-2 text-sm leading-6 text-white/62">
              This page is hidden from normal navigation and marked noindex for search engines.
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

export default function PpfInvestorProposal() {
  const [unlocked, setUnlocked] = useState(false);
  const setupTotal = useMemo(() => costBuckets.reduce((sum, item) => sum + item.value, 0), []);
  const monthlyFixedTotal = useMemo(() => monthlyOpex.reduce((sum, item) => sum + item.value, 0), []);

  useEffect(() => {
    document.title = "Private PPF Investor Proposal | Grand Touch";
    const meta = document.querySelector<HTMLMetaElement>('meta[name="robots"]') || document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex,nofollow";
    document.head.appendChild(meta);

    setUnlocked(localStorage.getItem(STORAGE_KEY) === "true");
  }, []);

  if (!unlocked) {
    return <PasswordGate onUnlock={() => setUnlocked(true)} />;
  }

  return (
    <main className="min-h-screen bg-[#070707] text-white">
      {/* HERO - text + data, no oversized imagery */}
      <section className="relative overflow-hidden px-5 pb-16 pt-6 sm:px-8 lg:px-10">
        <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_12%_-10%,rgba(248,184,78,0.18),transparent_50%),radial-gradient(110%_110%_at_100%_10%,rgba(66,214,201,0.12),transparent_55%)]" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#070707] to-transparent" />
        <div className="relative mx-auto max-w-7xl">
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.28em] text-white/68 sm:text-sm">
              <ShieldCheck className="h-5 w-5 text-[#f8b84e]" />
              Confidential pitch
            </div>
            <div className="hidden items-center gap-2 rounded-full border border-white/15 bg-black/35 px-4 py-2 text-sm text-white/70 backdrop-blur sm:flex">
              <span className="h-2 w-2 rounded-full bg-[#42d6c9]" />
              Dubai PPF, detailing & paint-capable studio
            </div>
          </div>

          <div className="mt-12 grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#f8b84e]/30 bg-[#f8b84e]/10 px-4 py-2 text-sm font-semibold text-[#ffd894]">
                <Sparkles className="h-4 w-4" />
                The 60-second pitch
              </div>
              <h1 className="text-[40px] font-black uppercase leading-[0.92] tracking-normal text-white sm:text-6xl lg:text-7xl">
                A proven demand engine.
                <br className="hidden sm:block" />{" "}
                <span className="text-[#f8b84e]">It just needs the space.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/80 sm:text-xl">
                Sean has already generated <strong className="text-white">AED 727k+ in closed, paid revenue</strong> and
                grown a real audience since January - all while limited by space and operating inside a business he does
                not own. A dedicated Dubai studio unlocks <strong className="text-white">AED 300k+ monthly revenue</strong>{" "}
                within 6-12 months, with <strong className="text-white">AED 500k+ upside</strong> at 10 PPF cars a week.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#upside"
                  className="inline-flex h-12 items-center gap-2 rounded-md bg-[#f8b84e] px-5 text-sm font-black uppercase tracking-[0.16em] text-black transition hover:bg-white"
                >
                  See the upside
                  <TrendingUp className="h-4 w-4" />
                </a>
                <a
                  href="#costing"
                  className="inline-flex h-12 items-center gap-2 rounded-md border border-white/20 bg-white/10 px-5 text-sm font-black uppercase tracking-[0.16em] text-white backdrop-blur transition hover:bg-white hover:text-black"
                >
                  The ask
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-md lg:max-w-none">
              <div className="relative overflow-hidden rounded-2xl border border-white/12 bg-[#111] shadow-2xl">
                <img
                  src="/guided-sean-with-patrols-v2.jpg"
                  alt="Sean, founder of Grand Touch"
                  className="aspect-[4/5] w-full object-cover object-top"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#f8b84e]">Founder & marketing</p>
                  <p className="mt-1 text-2xl font-black">Sean</p>
                  <p className="text-sm text-white/70">Driving demand, brand & sales in-house</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {proofStats.map((stat) => (
              <div key={stat.label} className="rounded-lg border border-white/12 bg-black/40 p-5 shadow-xl backdrop-blur">
                <p className="text-xs uppercase tracking-[0.22em] text-white/45">{stat.label}</p>
                <p className="mt-3 text-3xl font-black text-white">{stat.value}</p>
                <p className="mt-1 text-sm leading-6 text-white/60">{stat.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRACTION CARDS */}
      <section className="px-5 py-12 sm:px-8 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-3">
          {tractionCards.map((card) => (
            <div key={card.title} className="rounded-lg border border-white/10 bg-[#111] p-6">
              <card.icon className="h-8 w-8 text-[#42d6c9]" />
              <h2 className="mt-5 text-2xl font-black">{card.title}</h2>
              <p className="mt-3 leading-7 text-white/66">{card.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* MARKETING STRENGTH */}
      <section className="px-5 py-12 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.28em] text-[#f472b6]">The growth engine</p>
            <h2 className="mt-4 text-4xl font-black uppercase leading-none sm:text-5xl">
              Sean is the marketing department.
            </h2>
            <p className="mt-5 leading-8 text-white/70">
              Since January, with no agency and a lean budget, Sean has built the audience, run the ads, handled the
              funnel and closed the work himself. This is the part most workshops have to pay an agency for - here it is
              already built and converting.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {marketingGrowth.map((stat) => (
              <div key={stat.label} className="relative overflow-hidden rounded-lg border border-white/10 bg-[#111] p-6">
                <div
                  className="mb-5 flex h-11 w-11 items-center justify-center rounded-md"
                  style={{ background: `${stat.color}1f`, color: stat.color }}
                >
                  <stat.icon className="h-5 w-5" />
                </div>
                <p className="text-4xl font-black text-white">{stat.value}</p>
                <p className="mt-2 text-sm font-semibold text-white/80">{stat.label}</p>
                <p className="mt-1 text-sm leading-6 text-white/55">{stat.sub}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-lg border border-[#f472b6]/25 bg-[#f472b6]/10 p-5 text-sm leading-7 text-white/78">
            <strong className="text-white">Why this matters to you:</strong> a 10-15x ROAS means every AED 1 of ad spend
            is returning AED 10-15 in completed-job revenue. The marketing reserve in this proposal is a launch runway -
            it becomes self-funding fast, and there is no external agency dependency to manage.
          </div>
        </div>
      </section>

      {/* DESPITE THE WAR - chart */}
      <section className="px-5 py-12 sm:px-8 lg:px-10" id="upside">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#ef6345]/35 bg-[#ef6345]/10 px-4 py-2 text-sm font-bold text-[#ffb09f]">
            <Flame className="h-4 w-4" />
            Momentum held through a regional shock
          </div>
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.15fr] lg:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.28em] text-[#f8b84e]">Data-backed trajectory</p>
              <h2 className="mt-4 max-w-3xl text-4xl font-black uppercase leading-none sm:text-5xl">
                Growing despite the war.
              </h2>
              <p className="mt-5 max-w-2xl leading-8 text-white/70">
                Closed revenue jumped <strong className="text-white">+79% from February to March</strong>. Then the
                regional Iran-war shock in March cooled the wider market - so later months should be read with that
                context, not as the business slowing. The dashed line is the no-shock path: with space, control and continued marketing,
                the same engine pushes monthly revenue past <strong className="text-white">AED 300k</strong>.
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-[#101010] p-4 sm:p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-white/50">Actual closed revenue + no-shock projection</p>
                  <p className="text-xl font-black">Monthly closed revenue path</p>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-white/58">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2 w-4 rounded-full bg-[#f8b84e]" />
                    Closed revenue
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2 w-4 rounded-full bg-[#7dd3fc]" />
                    June run-rate
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2 w-4 rounded-full bg-[#42d6c9]" />
                    No-shock projection
                  </span>
                </div>
              </div>
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={actualRevenueData}
                    barCategoryGap="24%"
                    barGap={0}
                    margin={{ top: 24, right: 8, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.58)", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis
                      width={54}
                      domain={[0, 600000]}
                      tick={{ fill: "rgba(255,255,255,0.58)", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={formatShort}
                    />
                    <Tooltip
                      contentStyle={{ background: "#0b0b0b", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 8 }}
                      formatter={(value: number, name: string) => [formatAed(value), name]}
                    />
                    <ReferenceLine
                      x="Mar"
                      stroke="#ef6345"
                      strokeDasharray="4 4"
                      strokeWidth={2}
                      label={{
                        value: "Iran war shock",
                        position: "top",
                        fill: "#ffb09f",
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    />
                    <Bar
                      dataKey="actualQuote"
                      stackId="quote"
                      fill="#f8b84e"
                      radius={[5, 5, 0, 0]}
                      maxBarSize={58}
                      name="Closed revenue"
                    />
                    <Bar
                      dataKey="runRateExtension"
                      stackId="quote"
                      fill="#7dd3fc"
                      fillOpacity={0.76}
                      radius={[5, 5, 0, 0]}
                      maxBarSize={58}
                      name="June run-rate"
                    />
                    <Line
                      type="monotone"
                      dataKey="projection"
                      name="No-shock projection"
                      stroke="#42d6c9"
                      strokeWidth={3}
                      strokeDasharray="5 4"
                      dot={{ r: 3 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* UPSIDE SCENARIOS */}
      <section className="px-5 py-12 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.28em] text-[#42d6c9]">The upside</p>
            <h2 className="mt-4 text-4xl font-black uppercase leading-none sm:text-5xl">What the space unlocks.</h2>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            {revenueScenarios.map((scenario, index) => {
              const marginLow = Math.round((scenario.profitLow / scenario.revLow) * 100);
              const marginHigh = Math.round((scenario.profitHigh / scenario.revHigh) * 100);
              return (
                <div
                  key={scenario.name}
                  className={`rounded-lg border p-6 ${
                    index === 1 ? "border-[#42d6c9]/50 bg-[#42d6c9]/10" : "border-white/10 bg-[#111]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-black">{scenario.name}</h3>
                      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-white/45">{scenario.tag}</p>
                    </div>
                    <CircleDollarSign className="h-7 w-7 text-[#f8b84e]" />
                  </div>

                  <p className="mt-5 text-sm uppercase tracking-[0.2em] text-white/45">Monthly revenue</p>
                  <p className="mt-1 text-3xl font-black">
                    {formatShort(scenario.revLow)}
                    <span className="text-white/40"> - </span>
                    {formatShort(scenario.revHigh)}
                  </p>

                  <div className="mt-5 space-y-3 text-sm">
                    <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
                      <span className="text-white/60">COGS at ~50% (fixed)</span>
                      <span className="font-semibold">{formatAed(scenario.cogs)}</span>
                    </div>
                    <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
                      <span className="text-white/60">Fixed overhead</span>
                      <span className="font-semibold">{formatAed(scenario.fixed)}</span>
                    </div>
                  </div>

                  <div className="mt-4 rounded-lg bg-black/30 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/45">Net before tax / month</p>
                    <p className="mt-1 text-3xl font-black text-[#42d6c9]">
                      {formatShort(scenario.profitLow)}
                      <span className="text-white/40"> - </span>
                      {formatShort(scenario.profitHigh)}
                    </p>
                    <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full bg-[#42d6c9]"
                        style={{ width: `${Math.min(100, marginLow * 1.5)}%` }}
                      />
                      <div
                        className="h-full bg-[#42d6c9]/40"
                        style={{ width: `${Math.min(100, (marginHigh - marginLow) * 1.5)}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-white/50">
                      {marginLow}% at AED 10k pricing &rarr; {marginHigh}% at AED 15k pricing
                    </p>
                  </div>

                  <p className="mt-4 border-t border-white/10 pt-3 text-xs leading-5 text-[#a3e635]">{scenario.note}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-6 rounded-2xl border border-[#42d6c9]/30 bg-[#42d6c9]/10 p-6">
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#42d6c9]">Why the low end is conservative</p>
            <p className="mt-3 leading-8 text-white/80">
              Every low figure above bills each car at today's <strong className="text-white">below-market AED 10k</strong>.
              The high figure is the <strong className="text-white">exact same volume at premium AED 15k pricing</strong> -
              and because COGS (~AED 5k/car) and overhead don't change, the entire uplift drops straight to profit. The base
              case alone clears six figures a month; the upside is where it gets genuinely exciting.
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-white/10 bg-black/25 p-4 text-sm leading-7 text-white/72">
                <strong className="text-white">COGS ~50%, fixed.</strong> ~AED 3k film + ~AED 2k install per car - it does
                not move when price rises.
              </div>
              <div className="rounded-lg border border-white/10 bg-black/25 p-4 text-sm leading-7 text-white/72">
                <strong className="text-white">Paint is even better.</strong> Paintwork carries a lower COGS than PPF, so it
                lifts blended margin on top of these figures.
              </div>
              <div className="rounded-lg border border-white/10 bg-black/25 p-4 text-sm leading-7 text-white/72">
                <strong className="text-white">Overhead scales gently.</strong> Only staffing really grows; rent and
                marketing stay flat, so extra revenue drops to profit.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING POWER */}
      <section className="px-5 py-12 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.28em] text-[#7dd3fc]">Pricing power</p>
            <h2 className="mt-4 text-4xl font-black uppercase leading-none sm:text-5xl">
              We're underpricing the market - on purpose.
            </h2>
            <p className="mt-5 leading-8 text-white/70">
              Right now a 10-year full PPF goes out around <strong className="text-white">AED 10k</strong> - deliberately
              below what most Dubai studios charge - to win trust and volume while the brand is still young. The cost to
              deliver it never changes. So as brand awareness grows and we lean into{" "}
              <strong className="text-white">Google Ads</strong> - where there is less price-gouging and customers are
              willing to spend more - the exact same job sells for <strong className="text-white">AED 12k</strong> and up
              to <strong className="text-white">AED 15k</strong> with identical COGS. Every dirham of that increase is
              pure margin. That is where it gets really interesting.
            </p>
            <p className="mt-4 leading-8 text-white/60">
              To show the effect cleanly, the cards below hold volume flat at the{" "}
              <strong className="text-white/80">same ~43 cars a month (10 a week)</strong> - the only thing that changes is
              the price the brand can command. As reviews, reputation and Google Ads pull in higher-intent buyers, the
              identical workshop output is simply worth more, and almost all of that extra value is profit.
            </p>
          </div>

          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/65">
            <Car className="h-4 w-4 text-[#7dd3fc]" />
            Same {PPF_CARS_PER_MONTH} cars / month · only the price changes
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {pricingTiers.map((tier) => {
              const profit = tier.price - tier.cogs;
              const margin = Math.round((profit / tier.price) * 100);
              const monthlyRevenue = tier.price * PPF_CARS_PER_MONTH;
              const monthlyNet = monthlyRevenue - tier.cogs * PPF_CARS_PER_MONTH - PPF_FIXED_OVERHEAD;
              return (
                <div
                  key={tier.label}
                  className={`rounded-2xl border p-6 ${
                    tier.current ? "border-white/10 bg-[#111]" : "border-[#a3e635]/30 bg-[#a3e635]/[0.06]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/50">{tier.label}</p>
                    <span
                      className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wide"
                      style={{ background: `${tier.color}22`, color: tier.color }}
                    >
                      {tier.badge}
                    </span>
                  </div>
                  <p className="mt-4 text-5xl font-black text-white">
                    {formatShort(tier.price)}
                    <span className="text-base font-bold text-white/40"> /car</span>
                  </p>

                  <div className="mt-5 h-4 w-full rounded-full bg-white/5">
                    <div
                      className="flex h-full overflow-hidden rounded-full"
                      style={{ width: `${(tier.price / PRICE_MAX) * 100}%` }}
                    >
                      <div style={{ width: `${(tier.cogs / tier.price) * 100}%`, background: "#3a3a3a" }} />
                      <div style={{ width: `${(profit / tier.price) * 100}%`, background: tier.color }} />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-xs text-white/55">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#3a3a3a]" />
                      COGS
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: tier.color }} />
                      Gross profit
                    </span>
                  </div>

                  <div className="mt-5 space-y-3 text-sm">
                    <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
                      <span className="text-white/60">Cost to deliver (fixed)</span>
                      <span className="font-semibold">{formatAed(tier.cogs)}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-white">Gross profit / car</span>
                      <span className="font-black" style={{ color: tier.color }}>
                        {formatAed(profit)} · {margin}%
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 rounded-lg bg-black/30 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs uppercase tracking-[0.2em] text-white/45">Monthly revenue</span>
                      <span className="text-sm font-bold text-white/70">{formatShort(monthlyRevenue)}</span>
                    </div>
                    <p className="mt-2 text-xs uppercase tracking-[0.2em] text-white/45">Net before tax / month</p>
                    <p className="mt-1 text-3xl font-black" style={{ color: tier.color }}>
                      {formatShort(monthlyNet)}
                      <span className="text-sm font-bold text-white/40"> /mo net</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 rounded-lg border border-[#a3e635]/25 bg-[#a3e635]/10 p-5 text-sm leading-7 text-white/80">
            <strong className="text-white">Same cars, same cost - the brand does the work.</strong> On the identical{" "}
            {PPF_CARS_PER_MONTH} cars a month, moving the price from AED 10k to AED 15k more than doubles monthly net
            profit (about <strong className="text-white">AED 215k extra</strong>) with no added cost per job. Sean is
            already building toward this with Google Ads and a strengthening brand image.
          </div>
        </div>
      </section>

      {/* THE ASK - lean costing */}
      <section className="px-5 py-12 sm:px-8 lg:px-10" id="costing">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.28em] text-[#ef6345]">The ask</p>
            <h2 className="mt-4 text-4xl font-black uppercase leading-none sm:text-5xl">A lean first-year setup.</h2>
            <p className="mt-5 leading-8 text-white/70">
              Tools, equipment and consumables are already owned, and the fit-out comes at cost through the partner's own
              company - so this is far lighter than a normal workshop build. Rent is the only large line.
            </p>
          </div>

          <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-[#101010]">
            <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">Total investor ask</p>
                <p className="mt-2 text-5xl font-black text-white sm:text-6xl">AED 350-450k</p>
                <p className="mt-3 text-sm leading-6 text-white/55">
                  Midpoint model {formatShort(setupTotal)}. Paint/prep capex is phased in later, outside this ask.
                </p>
              </div>
              <div>
                <p className="mb-3 text-xs uppercase tracking-[0.22em] text-white/45">Where it goes</p>
                <div className="flex h-6 w-full overflow-hidden rounded-full border border-white/10">
                  {setupLines.map((line) => (
                    <div
                      key={line.name}
                      style={{ width: `${(line.value / setupTotal) * 100}%`, background: line.color }}
                      title={`${line.name} · ${line.range}`}
                    />
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-xs sm:grid-cols-3">
                  {setupLines.map((line) => (
                    <div key={line.name} className="flex items-center gap-2 text-white/65">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: line.color }} />
                      <span className="truncate">{line.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid gap-px bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
              {setupLines.map((line) => (
                <div key={line.name} className="bg-[#101010] p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: line.color }} />
                      <h3 className="text-sm font-black uppercase tracking-wide text-white">{line.name}</h3>
                    </div>
                    <p className="shrink-0 text-base font-black text-white">{line.range}</p>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-white/55">{line.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ALREADY OWNED - in-kind */}
      <section className="px-5 py-12 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.28em] text-[#a3e635]">Already covered - AED 0 to you</p>
            <h2 className="mt-4 text-4xl font-black uppercase leading-none sm:text-5xl">What keeps the cost down.</h2>
            <p className="mt-5 leading-8 text-white/70">
              A normal PPF workshop pays up front for equipment, launch stock, a marketing build-out and a full payroll.
              Here that is already covered - equipment and stock owned, a proven in-house marketing engine, and a team
              that runs on existing visas plus a 6-strong contract install crew. That is why the ask is a fraction of a
              standard build.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {ownedAssets.map((asset) => (
              <div key={asset.item} className="flex gap-4 rounded-lg border border-[#a3e635]/25 bg-[#a3e635]/5 p-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-[#a3e635]/15 text-[#a3e635]">
                  <asset.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#a3e635]" />
                    <h3 className="text-lg font-black">{asset.item}</h3>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-white/60">{asset.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COST SPLIT + MONTHLY OPEX */}
      <section className="px-5 py-12 sm:px-8 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-lg border border-white/10 bg-[#101010] p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-white/45">First-year cash split</p>
                <h2 className="mt-2 text-2xl font-black">{formatShort(setupTotal)} setup</h2>
              </div>
              <Banknote className="h-8 w-8 text-[#42d6c9]" />
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={costBuckets} dataKey="value" nameKey="name" innerRadius={72} outerRadius={116} paddingAngle={2}>
                    {costBuckets.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#0b0b0b", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 8 }}
                    formatter={(value: number) => formatAed(value)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              {costBuckets.map((bucket) => (
                <div key={bucket.name} className="flex items-center gap-2 text-white/66">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: bucket.color }} />
                  {bucket.name}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-[#101010] p-5 sm:p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-white/45">Monthly fixed overhead</p>
                <h2 className="mt-2 text-2xl font-black">{formatAed(monthlyFixedTotal)} before COGS</h2>
              </div>
              <Users className="h-8 w-8 text-[#f8b84e]" />
            </div>
            <div className="h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyOpex} layout="vertical" margin={{ top: 0, right: 20, left: 16, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" horizontal={false} />
                  <XAxis
                    type="number"
                    tickFormatter={formatShort}
                    tick={{ fill: "rgba(255,255,255,0.58)", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    dataKey="item"
                    type="category"
                    width={112}
                    tick={{ fill: "rgba(255,255,255,0.70)", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{ background: "#0b0b0b", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 8 }}
                    formatter={(value: number) => formatAed(value)}
                  />
                  <Bar dataKey="value" fill="#f8b84e" radius={[0, 5, 5, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      {/* PROOF IMAGE STRIP */}
      <section className="px-5 py-12 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.28em] text-[#f8b84e]">The work</p>
              <h2 className="mt-3 text-3xl font-black uppercase leading-none sm:text-4xl">Premium cars, already through the door.</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {proofImages.map((image) => (
              <div key={image.src} className="group relative overflow-hidden rounded-lg border border-white/10 bg-[#111]">
                <img
                  src={image.src}
                  alt={image.label}
                  loading="lazy"
                  className="aspect-[4/5] w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-3">
                  <p className="text-xs font-bold text-white/85">{image.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HANDOVER VIDEOS */}
      <section className="px-5 py-12 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.28em] text-[#f8b84e]">Proof assets</p>
              <h2 className="mt-4 text-4xl font-black uppercase leading-none sm:text-5xl">Real handovers, not stock.</h2>
            </div>
            <p className="max-w-xl leading-7 text-white/62">
              Real owners, real reactions, and premium PPF cars already handed back through Grand Touch.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {handoverVideos.map((video, index) => (
              <div key={video.videoSrc} className="overflow-hidden rounded-lg border border-white/10 bg-[#111]">
                <div className="relative">
                  <video
                    className="aspect-square w-full bg-black object-cover"
                    poster={video.posterSrc}
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    controls
                    autoPlay={index === 0}
                  >
                    <source src={video.videoSrc} type="video/mp4" />
                  </video>
                  {index === 0 ? (
                    <div className="pointer-events-none absolute left-3 top-3 inline-flex items-center gap-2 rounded-full bg-black/70 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-white backdrop-blur">
                      <span className="h-2 w-2 rounded-full bg-[#ef6345]" />
                      Customer reactions
                    </div>
                  ) : null}
                </div>
                <div className="flex items-center justify-between gap-3 px-4 py-3.5">
                  <div className="min-w-0">
                    <p className="truncate text-base font-black">{video.title}</p>
                    <p className="mt-0.5 truncate text-sm text-white/60">{video.subtitle}</p>
                  </div>
                  <Play className="h-4 w-4 shrink-0 text-white/35" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY NOW */}
      <section className="px-5 py-12 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.28em] text-[#42d6c9]">Why now</p>
              <h2 className="mt-4 text-4xl font-black uppercase leading-none sm:text-5xl">
                Own the brand, own the space, own the margin.
              </h2>
              <p className="mt-5 leading-8 text-white/68">
                The only real limitation today is operating inside a business Sean does not fully own. A separate studio
                points the marketing, customer experience, job flow and premium pricing all in one direction.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                "PPF-first revenue with paint as a phase-2 upside lane",
                "Two staff to launch, contractors for overflow",
                "AED 11k-12k average billing today, with headroom to push higher",
                "Future sale-or-return showroom angle, kept outside the core ask",
              ].map((item) => (
                <div key={item} className="flex gap-3 rounded-lg border border-white/10 bg-[#111] p-4">
                  <Check className="mt-1 h-5 w-5 shrink-0 text-[#42d6c9]" />
                  <p className="leading-7 text-white/72">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* RESEARCH BASIS */}
      <section className="px-5 py-12 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl rounded-lg border border-white/10 bg-[#101010] p-6 sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[0.65fr_1fr]">
            <div>
              <p className="text-sm uppercase tracking-[0.22em] text-white/45">Research basis</p>
              <h2 className="mt-3 text-3xl font-black">Assumptions to verify before signing</h2>
              <p className="mt-4 leading-7 text-white/62">
                These are current research anchors and should be confirmed by a PRO, landlord and authority consultant
                once the exact premises are known.
              </p>
            </div>
            <div className="grid gap-3">
              {sourceLinks.map((source) => (
                <a
                  key={source.href}
                  href={source.href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between gap-4 rounded-md border border-white/10 bg-black/35 px-4 py-3 text-sm text-white/72 transition hover:border-[#f8b84e]/50 hover:text-white"
                >
                  <span>{source.label}</span>
                  <ArrowUpRight className="h-4 w-4 shrink-0" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PROPOSED STRUCTURE */}
      <section className="px-5 py-12 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white/65">
              <Sparkles className="h-4 w-4 text-[#f8b84e]" />
              To be discussed
            </div>
            <p className="text-sm font-bold uppercase tracking-[0.28em] text-[#f8b84e]">The proposal</p>
            <h2 className="mt-4 text-4xl font-black uppercase leading-none sm:text-5xl">A simple, hands-off partnership.</h2>
            <p className="mt-5 leading-8 text-white/70">
              This is a starting point, not final terms. The idea is deliberately clean: the investor backs the build,
              Sean runs everything, and the upside is shared equally.
            </p>
          </div>

          <div className="mb-6 overflow-hidden rounded-2xl border border-white/10 bg-[#101010] p-6 sm:p-8">
            <p className="text-xs uppercase tracking-[0.22em] text-white/45">Proposed ownership & profit split</p>
            <div className="mt-4 flex h-12 overflow-hidden rounded-xl">
              <div className="flex w-1/2 items-center justify-center bg-[#f8b84e] text-sm font-black uppercase tracking-wide text-black">
                Investor 50%
              </div>
              <div className="flex w-1/2 items-center justify-center bg-[#42d6c9] text-sm font-black uppercase tracking-wide text-black">
                Sean 50%
              </div>
            </div>
            <p className="mt-4 text-sm leading-7 text-white/60">
              Equal ownership and an equal share of net profit. Exact structure, legal setup and any adjustments to be
              agreed together.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Users,
                title: "50/50 ownership",
                body: "An equal partnership between the investor and Sean. Final structure to be agreed together.",
                color: "#f8b84e",
              },
              {
                icon: Banknote,
                title: "Investor funds the build",
                body: "The financer provides the capital. That is the role - no day-to-day involvement required.",
                color: "#a3e635",
              },
              {
                icon: Rocket,
                title: "Sean runs everything",
                body: "Operations, marketing, sales, hiring and growth all handled by Sean. A genuinely hands-off project for the investor.",
                color: "#42d6c9",
              },
              {
                icon: CircleDollarSign,
                title: "Salary only when earned",
                body: "Sean draws a salary only once revenue comfortably permits, so early cash stays inside the business.",
                color: "#7dd3fc",
              },
            ].map((card) => (
              <div key={card.title} className="rounded-lg border border-white/10 bg-[#111] p-6">
                <div
                  className="mb-5 flex h-11 w-11 items-center justify-center rounded-md"
                  style={{ background: `${card.color}1f`, color: card.color }}
                >
                  <card.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-black">{card.title}</h3>
                <p className="mt-2 text-sm leading-7 text-white/62">{card.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-[#42d6c9]/30 bg-[#42d6c9]/10 p-6 sm:p-8">
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#42d6c9]">Estimated capital payback</p>
            <p className="mt-3 max-w-3xl leading-8 text-white/80">
              The investor funds roughly {formatShort(setupTotal)} and takes 50% of net profit. From steady-state monthly
              profit, that capital is recovered in:
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              {[
                { label: "Base case · AED 10k pricing", net: 104300 },
                { label: "Target volume", net: 204300 },
                { label: "Premium pricing · AED 15k", net: 374300 },
              ].map((tier) => {
                const share = tier.net / 2;
                const months = Math.max(1, Math.round(setupTotal / share));
                return (
                  <div key={tier.label} className="rounded-lg border border-white/10 bg-black/25 p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/45">{tier.label}</p>
                    <p className="mt-2 text-4xl font-black text-[#42d6c9]">~{months} months</p>
                    <p className="mt-1 text-sm text-white/55">Investor share {formatShort(share)}/mo</p>
                  </div>
                );
              })}
            </div>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/55">
              Figures use steady-state monthly net. Allowing for the 6-12 month ramp, full payback realistically lands
              inside the first 12-18 months - after which the investor's 50% share is largely passive return on a business
              someone else runs.
            </p>
          </div>

          <div className="mt-4 flex gap-4 rounded-2xl border border-[#f8b84e]/30 bg-[#f8b84e]/[0.07] p-6 sm:p-8">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-[#f8b84e]/15 text-[#f8b84e]">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-xl font-black">Optional buyout clause</h3>
                <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-white/60">
                  To be discussed
                </span>
              </div>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-white/65">
                Once the investor has recovered their capital and the business is stable, Sean (or the company) can buy
                back the investor's 50% stake at a pre-agreed valuation - for example a fixed multiple of annual net
                profit. This gives the investor a clean, defined exit with a strong return, while letting Sean move toward
                full ownership over time. Trigger window, valuation multiple and terms all to be agreed together.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative overflow-hidden px-5 py-16 sm:px-8 lg:px-10">
        <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_50%_120%,rgba(248,184,78,0.18),transparent_55%)]" />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative mx-auto max-w-7xl">
          <div className="max-w-4xl">
            <p className="text-sm font-bold uppercase tracking-[0.28em] text-[#f8b84e]">The ask in one line</p>
            <h2 className="mt-4 text-4xl font-black uppercase leading-none sm:text-6xl">
              Fund a lean first year. Turn proven demand into a controlled asset.
            </h2>
            <p className="mt-6 text-lg leading-8 text-white/74">
              AED 350k-450k to launch a PPF-first Dubai studio, on top of equipment, stock and a marketing engine that are
              already paid for. The demand is proven. The team is ready. The only missing piece is the space.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <div className="rounded-lg border border-white/12 bg-black/40 px-5 py-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-white/45">Investor ask</p>
                <p className="mt-1 text-2xl font-black text-white">AED 350-450k</p>
              </div>
              <div className="rounded-lg border border-white/12 bg-black/40 px-5 py-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-white/45">Target revenue</p>
                <p className="mt-1 text-2xl font-black text-white">AED 300k+/mo</p>
              </div>
              <div className="rounded-lg border border-white/12 bg-black/40 px-5 py-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-white/45">Upside</p>
                <p className="mt-1 text-2xl font-black text-[#42d6c9]">AED 500k+/mo</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
