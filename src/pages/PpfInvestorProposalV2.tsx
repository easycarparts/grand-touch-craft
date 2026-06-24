import { useEffect, useMemo, useRef, useState } from "react";
import {
  Area,
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
  ClipboardList,
  Crown,
  Flag,
  Flame,
  Gauge,
  Globe,
  Handshake,
  KeyRound,
  LineChart as LineChartIcon,
  Lock,
  Megaphone,
  Play,
  Rocket,
  Scale,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Trophy,
  UserCheck,
  Users,
  Video,
  Wrench,
} from "lucide-react";

const PROPOSAL_PASSWORD = import.meta.env.VITE_PPF_INVESTOR_PASSWORD || "GTAPPF2026";
const STORAGE_KEY = "gt-ppf-investor-unlocked";

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
  if (abs >= 1_000_000) return `${sign}AED ${(abs / 1_000_000).toFixed(1)}M`;
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

/** Smoothly tweens a number toward its latest value whenever it changes. */
function useTween(value: number, enabled = true, duration = 450) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const rafRef = useRef(0);
  useEffect(() => {
    if (!enabled) {
      fromRef.current = value;
      setDisplay(value);
      return;
    }
    const from = fromRef.current;
    const to = value;
    if (from === to) return;
    cancelAnimationFrame(rafRef.current);
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const current = from + (to - from) * eased;
      fromRef.current = current;
      setDisplay(current);
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
        setDisplay(to);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, enabled, duration]);
  return display;
}

/** Animated number that counts up the first time it scrolls into view. */
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

/** Scroll-reveal wrapper: fade + slide up the first time it enters the viewport. */
function Reveal({
  children,
  className,
  delay = 0,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  as?: keyof JSX.IntrinsicElements;
}) {
  const reduced = useReducedMotion();
  const { ref, inView } = useInView<HTMLDivElement>(0.15);
  const show = reduced || inView;
  return (
    // @ts-expect-error - dynamic tag
    <Tag
      ref={ref}
      className={cx(
        className,
        "transition-all duration-700 ease-out will-change-transform",
        show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}

/* ----------------------------------------------------------------------------
 * Static data
 * ------------------------------------------------------------------------- */
const COGS_PER_CAR = 5000;
const WEEKS_PER_MONTH = 4.3;

// Fixed overhead: rent/marketing/utilities + support payroll. Core team is already in
// place (5 incl. Sean) - never a "lean 2 staff" launch.
const BASE_NON_STAFF_OVERHEAD = 35700;
const BASE_SUPPORT_PAID = 4; // detailer, polisher, videographer, sales - already hired
const BASE_SUPPORT_SALARY = 13000; // AED 3k + 3.5k + 3.5k + 3k
const BASE_VISA_TRANSFERS = 2; // 2 need a new visa; 3 already on existing visas

const SALARY = {
  senior: 6000,
  junior: 4000,
  polisher: 3500,
  detailer: 3000,
  sales: 3000,
  videographer: 3500,
  admin: 3000,
  manager: 5000,
};
const CONTRACTOR_PER_CAR = 2000; // install labour only; flat per car
const FILM_COGS_PER_CAR = 3000; // material cost that stays in COGS either way
const VISA_PER_PERSON = 8000; // one-off, amortised over 24 months
const VISA_MONTHS = 24;
const VISA_MONTHLY = VISA_PER_PERSON / VISA_MONTHS; // ~333/mo per head
const INSTALLER_CARS_PER_WEEK = 2.1; // one installer's monthly throughput basis

/** Support team payroll + visa amortisation (excludes PPF installers on contractors). */
function supportTeamFor(cpw: number) {
  // Core four paid roles always present today
  let detailers = 1;
  let polishers = 1;
  let sales = 1;
  const videographer = 1;
  let admin = 0;
  let manager = 0;

  if (cpw >= 8) {
    polishers = 2;
    admin = 1;
  }
  if (cpw >= 10) {
    detailers = 2;
    sales = 2;
    manager = 1;
  }
  if (cpw >= 15) {
    detailers = 3;
    polishers = 3;
  }

  const supportSalary =
    detailers * SALARY.detailer +
    polishers * SALARY.polisher +
    sales * SALARY.sales +
    videographer * SALARY.videographer +
    admin * SALARY.admin +
    manager * SALARY.manager;

  const paidSupportHeadcount = detailers + polishers + sales + videographer + admin + manager;
  const extraSupportHires = Math.max(0, paidSupportHeadcount - BASE_SUPPORT_PAID);
  const supportVisaCount = BASE_VISA_TRANSFERS + extraSupportHires;
  const supportVisaMonthly = supportVisaCount * VISA_MONTHLY;

  let team = "Core team · 5 incl. Sean";
  if (cpw >= 15) team = "Core + full growth hires";
  else if (cpw >= 10) team = "Core + manager & extra hires";
  else if (cpw >= 8) team = "Core + admin";

  return {
    detailers,
    polishers,
    sales,
    videographer,
    admin,
    manager,
    supportSalary,
    paidSupportHeadcount,
    totalHeadcount: paidSupportHeadcount + 1, // + Sean (unpaid)
    supportVisaCount,
    supportVisaMonthly,
    team,
  };
}

function installersFor(cpw: number) {
  if (cpw <= 4) return { seniors: 1, juniors: 1 };
  if (cpw <= 8) return { seniors: 2, juniors: 2 };
  if (cpw <= 10) return { seniors: 2, juniors: 3 };
  return { seniors: 3, juniors: 4 };
}

function fixedOverheadFor(carsPerWeek: number) {
  const support = supportTeamFor(carsPerWeek);
  const staff = support.supportSalary + support.supportVisaMonthly;
  return { total: BASE_NON_STAFF_OVERHEAD + staff, staff, ...support };
}

function teamFor(cpw: number) {
  const support = supportTeamFor(cpw);
  const { seniors, juniors } = installersFor(cpw);
  return { ...support, seniors, juniors, installers: seniors + juniors };
}

function installEconomics(cpw: number, visaMode: "amortised" | "upfront" = "amortised") {
  const carsPerMonth = cpw * WEEKS_PER_MONTH;
  const t = teamFor(cpw);
  const installerSalary = t.seniors * SALARY.senior + t.juniors * SALARY.junior;
  const supportSalary = t.supportSalary;
  const supportVisaMonthly = t.supportVisaMonthly;
  const installerVisaMonthly = t.installers * VISA_MONTHLY;
  const supportVisaUpfront = t.supportVisaCount * VISA_PER_PERSON;
  const installerVisaUpfront = t.installers * VISA_PER_PERSON;
  const totalVisaUpfront = supportVisaUpfront + installerVisaUpfront;

  const capacityCarsMonth = t.installers * INSTALLER_CARS_PER_WEEK * WEEKS_PER_MONTH;
  const overflowCars = Math.max(0, carsPerMonth - capacityCarsMonth);
  const contractorInstall = carsPerMonth * CONTRACTOR_PER_CAR;
  const inhouseInstallPayroll = installerSalary + overflowCars * CONTRACTOR_PER_CAR;
  const inhouseInstallAmortised = inhouseInstallPayroll + installerVisaMonthly;

  const contractorPathAmortised = supportSalary + supportVisaMonthly + contractorInstall;
  const inhousePathAmortised = supportSalary + supportVisaMonthly + inhouseInstallAmortised;
  const contractorPathUpfront = supportSalary + contractorInstall;
  const inhousePathUpfront = supportSalary + inhouseInstallPayroll;

  const contractorPathTotal = visaMode === "upfront" ? contractorPathUpfront : contractorPathAmortised;
  const inhousePathTotal = visaMode === "upfront" ? inhousePathUpfront : inhousePathAmortised;
  const totalSavings = contractorPathTotal - inhousePathTotal;
  const installSavings = contractorInstall - inhouseInstallAmortised;
  const installSavingsUpfront = contractorInstall - inhouseInstallPayroll;

  const paybackMonthsAmortised =
    installSavings > 0 ? installerVisaUpfront / installSavings : Infinity;
  const paybackMonthsUpfront = totalSavings > 0 ? totalVisaUpfront / totalSavings : Infinity;
  const paybackMonths = visaMode === "upfront" ? paybackMonthsUpfront : paybackMonthsAmortised;

  const fullyLoadedPayroll = supportSalary + installerSalary;
  const fullyLoadedStaff =
    visaMode === "upfront"
      ? fullyLoadedPayroll
      : supportSalary + installerSalary + supportVisaMonthly + installerVisaMonthly;

  return {
    ...t,
    carsPerMonth,
    installerSalary,
    supportSalary,
    headcount: t.totalHeadcount + t.installers,
    visaMonthly: supportVisaMonthly + installerVisaMonthly,
    supportVisaMonthly,
    installerVisaMonthly,
    supportVisaUpfront,
    installerVisaUpfront,
    totalVisaUpfront,
    overflowCars,
    contractorInstall,
    inhouseInstallPayroll,
    inhouseInstall: visaMode === "upfront" ? inhouseInstallPayroll : inhouseInstallAmortised,
    contractorPathTotal,
    inhousePathTotal,
    savings: totalSavings,
    installSavings,
    installSavingsUpfront,
    visaUpfront: installerVisaUpfront,
    paybackMonths,
    paybackMonthsAmortised,
    paybackMonthsUpfront,
    totalPayroll: fullyLoadedPayroll,
    totalVisaMonthly: supportVisaMonthly + installerVisaMonthly,
    fullyLoadedStaff,
    visaMode,
  };
}

/** Install-only switch chart: pay installer visas day 1, then save vs 2k/car contractors. */
function buildInstallSwitchChart(cpw: number) {
  const e = installEconomics(cpw, "upfront");
  let cumContractor = 0;
  let cumInhouse = e.installerVisaUpfront;
  const rows: Array<{
    month: string;
    monthNum: number;
    contractorInstallCum: number;
    inhouseInstallCum: number;
    netVsContractors: number;
  }> = [];

  rows.push({
    month: "Day 1",
    monthNum: 0,
    contractorInstallCum: 0,
    inhouseInstallCum: Math.round(e.installerVisaUpfront),
    netVsContractors: Math.round(-e.installerVisaUpfront),
  });

  for (let m = 1; m <= 12; m += 1) {
    cumContractor += e.contractorInstall;
    cumInhouse += e.inhouseInstallPayroll;
    rows.push({
      month: `M${m}`,
      monthNum: m,
      contractorInstallCum: Math.round(cumContractor),
      inhouseInstallCum: Math.round(cumInhouse),
      netVsContractors: Math.round(cumContractor - cumInhouse),
    });
  }

  const paybackMonth =
    rows.find((row) => row.monthNum > 0 && row.netVsContractors >= 0)?.monthNum ?? null;
  const breakEvenCpw = (() => {
    for (let c = 1; c <= 15; c += 1) {
      const x = installEconomics(c, "upfront");
      if (x.installSavingsUpfront > 0) return c;
    }
    return null;
  })();

  return { rows, economics: e, paybackMonth, breakEvenCpw, month1: rows[1], month12: rows[rows.length - 1] };
}

const costBuckets = [
  { name: "Annual rent", value: 200000, color: "#f8b84e" },
  { name: "License + visas", value: 65000, color: "#42d6c9" },
  { name: "Deposit + Ejari", value: 30000, color: "#7dd3fc" },
  { name: "Fit-out at cost", value: 42000, color: "#ef6345" },
  { name: "Marketing reserve", value: 40000, color: "#f472b6" },
  { name: "Working capital", value: 33000, color: "#a3e635" },
];
const SETUP_TOTAL = costBuckets.reduce((sum, item) => sum + item.value, 0); // 410,000

const setupLines = [
  { name: "12-month rent", range: "AED 200k", note: "The only large line - a production unit, not a showroom.", color: "#f8b84e" },
  { name: "License + 2 visas", range: "AED 55-75k", note: "Activity, authority approvals & two staff visa transfers.", color: "#42d6c9" },
  { name: "Fit-out at cost", range: "AED 35-50k", note: "Supplied at cost via the partner's own company.", color: "#ef6345" },
  { name: "Deposit + Ejari", range: "AED 25-35k", note: "Landlord deposit, agency & registration.", color: "#7dd3fc" },
  { name: "Marketing reserve", range: "AED 30-50k", note: "Launch runway - self-funding fast at 10-15x ROAS.", color: "#f472b6" },
  { name: "Working capital", range: "AED 25-40k", note: "Ramp, collection timing & contingency buffer.", color: "#a3e635" },
];

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

const proofStats = [
  { label: "Closed & paid revenue", value: 726766, display: "AED 727k+", sub: "94 paid jobs since Jan 2026" },
  { label: "Return on ad spend", value: 15, display: "10-15x", sub: "Ad spend to completed-job revenue" },
  { label: "New audience since Jan", value: 3900, display: "+3,900", sub: "+500 Instagram, +3,400 TikTok" },
  { label: "Total investor ask", value: 450000, display: "AED 350-450k", sub: "Tools, stock & fit-out already covered" },
];

const marketHighlights = [
  {
    icon: Gauge,
    title: "Demand is already proven",
    body: "AED 727k+ closed since January - this is not a market study, it's revenue on the board, generated inside someone else's space.",
    color: "#42d6c9",
  },
  {
    icon: Car,
    title: "Dubai runs on premium metal",
    body: "Patrols, 911s, Cullinans, G-wagons - the exact cars already coming through Grand Touch are the daily traffic of this city.",
    color: "#f8b84e",
  },
  {
    icon: TrendingUp,
    title: "The ceiling is space, not appetite",
    body: "Leads already outpace the bays available. A dedicated studio converts demand that currently has nowhere to go.",
    color: "#a3e635",
  },
];

const differentiators = [
  {
    icon: UserCheck,
    title: "Owner-led accountability",
    body: "Sean answers the first message, reviews the car and signs off the final QC himself. No salesperson hand-off, no vague chain of blame - one name on the line.",
    color: "#f8b84e",
  },
  {
    icon: Flag,
    title: "British owned & run",
    body: "A genuine trust signal in the Dubai market. Straight pricing, clear communication and a standard of finish customers actively seek out and pay more for.",
    color: "#7dd3fc",
  },
  {
    icon: Megaphone,
    title: "A marketing machine in-house",
    body: "Sean runs the ads, content, funnel and sales at a 10-15x return on ad spend - the single most expensive thing most workshops outsource, already built and converting.",
    color: "#f472b6",
  },
  {
    icon: ShieldCheck,
    title: "A better, harder-to-copy service",
    body: "Genuine STEK film, multi-stage prep before any film touches paint, and a registered warranty trail tied to the VIN. Quality customers can see and refer.",
    color: "#42d6c9",
  },
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
    body: "Including a pivotal role helping Lyvely raise $12M across rounds - hands-on investor relations and capital-raising experience.",
    color: "#a3e635",
  },
  {
    icon: Megaphone,
    metric: "1B+",
    title: "Content views generated",
    body: "SEO-driven content for 1Inch, eToro, Gemini and more - over a billion views, the same engine now pointed at Grand Touch.",
    color: "#f472b6",
  },
  {
    icon: Rocket,
    metric: "AED 727k+",
    title: "Grand Touch, from scratch",
    body: "Proof he can do it for himself: built a paying PPF business to AED 727k+ in months - already, before owning the space.",
    color: "#42d6c9",
  },
];

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
    item: "Core team + 6-strong contract crew",
    note: "Existing staff on their own/Sean's visas; installers run per-car inside COGS. No payroll to build from scratch.",
    icon: Users,
  },
];

const roadmap = [
  {
    phase: "Month 0-1",
    title: "Sign & secure",
    body: "Term sheet agreed, capital placed, Al Quoz production unit leased and the trade licence activated.",
    icon: Handshake,
    color: "#f8b84e",
  },
  {
    phase: "Month 1-2",
    title: "Fit-out at cost",
    body: "Bays, lighting and branding installed via the partner's own company. Owned equipment and stock moved in - minimal new spend.",
    icon: Wrench,
    color: "#7dd3fc",
  },
  {
    phase: "Month 2-3",
    title: "Soft launch",
    body: "First cars through the door under the Grand Touch brand. Google Ads switched on, content cadence ramps.",
    icon: Rocket,
    color: "#f472b6",
  },
  {
    phase: "Month 3-6",
    title: "Ramp to 10 cars/week",
    body: "Marketing scales, reviews compound, the run-rate climbs toward AED 300k+/month at today's pricing.",
    icon: TrendingUp,
    color: "#42d6c9",
  },
  {
    phase: "Month 6-9",
    title: "Pricing power",
    body: "Brand strength and Google Ads pull higher-intent buyers; average ticket moves toward AED 12k on identical COGS.",
    icon: Gauge,
    color: "#a3e635",
  },
  {
    phase: "Month 9-12",
    title: "Premium & payback",
    body: "Premium AED 15k tier in play, investor capital substantially recovered, paint lane scoped as phase-2 upside.",
    icon: Trophy,
    color: "#ffd894",
  },
];

const proofImages = [
  { src: "/guided-install-detail.png", label: "PPF install detail" },
  { src: "/guided-rolls-install.png", label: "Rolls-Royce install" },
  { src: "/guided-911-stek-roll.png", label: "911 - STEK roll" },
  { src: "/guided-cullinan-ppf.png", label: "Cullinan full body" },
  { src: "/guided-911-gloss.png", label: "911 gloss PPF" },
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
];

const navLinks = [
  { id: "proof", label: "Proof" },
  { id: "why", label: "Why GTA" },
  { id: "founder", label: "Founder" },
  { id: "calculator", label: "The numbers" },
  { id: "staffing", label: "Staffing" },
  { id: "returns", label: "Your return" },
  { id: "ask", label: "The ask" },
  { id: "roadmap", label: "Roadmap" },
  { id: "deal", label: "The deal" },
];

/* ----------------------------------------------------------------------------
 * Password gate
 * ------------------------------------------------------------------------- */
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
              Private investor deck · v2
            </div>
            <h1 className="max-w-4xl text-[44px] font-black uppercase leading-[0.92] tracking-normal text-white sm:text-6xl lg:text-7xl">
              Dubai PPF Studio
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/78">
              A full investor deck for a dedicated PPF, detailing and paint-capable studio - built on Sean's proven
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
              Unlock deck
              <ChevronRight className="h-4 w-4" />
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

/* ----------------------------------------------------------------------------
 * Sticky nav + deal bar
 * ------------------------------------------------------------------------- */
function StickyNav({ investorShare, paybackMonths }: { investorShare: number; paybackMonths: number }) {
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
            GT PPF
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
          <div className="hidden shrink-0 items-center gap-3 sm:flex">
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-[0.16em] text-white/45">Your share</p>
              <p className="text-sm font-black text-[#42d6c9]">{formatShort(investorShare)}/mo</p>
            </div>
            <a
              href="#deal"
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#f8b84e] px-4 text-xs font-black uppercase tracking-[0.14em] text-black transition hover:bg-white"
            >
              Payback ~{paybackMonths}mo
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * Section heading helper
 * ------------------------------------------------------------------------- */
function SectionKicker({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <p className="text-sm font-bold uppercase tracking-[0.28em]" style={{ color }}>
      {children}
    </p>
  );
}

/* ----------------------------------------------------------------------------
 * Main component
 * ------------------------------------------------------------------------- */
export default function PpfInvestorProposalV2() {
  const [unlocked, setUnlocked] = useState(false);
  const reducedMotion = useReducedMotion();

  // Interactive deal calculator state
  const [pricePerCar, setPricePerCar] = useState(12000);
  const [carsPerWeek, setCarsPerWeek] = useState(10);
  const [installMode, setInstallMode] = useState<"contractor" | "inhouse">("contractor");

  const calc = useMemo(() => {
    const carsPerMonth = carsPerWeek * WEEKS_PER_MONTH;
    const revenue = pricePerCar * carsPerMonth;
    const inhouse = installMode === "inhouse";
    // In-house removes the 2k contractor install from COGS (film only) and moves
    // installers into salaried overhead instead.
    const cogsPerCar = inhouse ? FILM_COGS_PER_CAR : COGS_PER_CAR;
    const cogs = cogsPerCar * carsPerMonth;
    const baseOverhead = fixedOverheadFor(carsPerWeek);
    const econ = installEconomics(carsPerWeek);
    const installerCost = inhouse ? econ.installerSalary + econ.installerVisaMonthly : 0;
    const fixedOverhead = baseOverhead.total + installerCost;
    const net = revenue - cogs - fixedOverhead;
    const investorShare = Math.max(0, net / 2);
    const paybackMonths = investorShare > 0 ? Math.max(1, Math.round(SETUP_TOTAL / investorShare)) : 99;
    const annualCashOnCash = Math.round(((investorShare * 12) / SETUP_TOTAL) * 100);
    const grossMargin = revenue > 0 ? Math.round(((revenue - cogs) / revenue) * 100) : 0;
    return {
      carsPerMonth,
      revenue,
      cogs,
      cogsPerCar,
      fixedOverhead,
      installerCost,
      inhouse,
      installers: econ.installers,
      team: baseOverhead.team,
      net,
      investorShare,
      paybackMonths,
      annualCashOnCash,
      grossMargin,
    };
  }, [pricePerCar, carsPerWeek, installMode]);

  // Tweened values so the outputs animate as the sliders move.
  const tween = {
    revenue: useTween(calc.revenue, !reducedMotion),
    cogs: useTween(calc.cogs, !reducedMotion),
    fixedOverhead: useTween(calc.fixedOverhead, !reducedMotion),
    net: useTween(calc.net, !reducedMotion),
    investorShare: useTween(calc.investorShare, !reducedMotion),
    paybackMonths: useTween(calc.paybackMonths, !reducedMotion),
    annualCashOnCash: useTween(calc.annualCashOnCash, !reducedMotion),
  };
  // Net profit as a 0-1 intensity, used to drive the glow + meter fills.
  const netIntensity = Math.max(0, Math.min(1, calc.net / 400000));

  // Detailed staffing / contractor-vs-in-house model (its own interactive control)
  const [staffCpw, setStaffCpw] = useState(10);
  const [visaAccounting, setVisaAccounting] = useState<"amortised" | "upfront">("amortised");
  const staff = useMemo(() => installEconomics(staffCpw, visaAccounting), [staffCpw, visaAccounting]);
  const staffChart = useMemo(() => {
    const rows: Array<{ cpw: number; contractor: number; inhouse: number }> = [];
    for (let c = 4; c <= 15; c += 1) {
      const e = installEconomics(c, "amortised");
      rows.push({
        cpw: c,
        contractor: Math.round(e.contractorPathTotal),
        inhouse: Math.round(e.inhousePathTotal),
      });
    }
    return rows;
  }, []);
  const staffCumulative = useMemo(
    () => buildInstallSwitchChart(staffCpw),
    [staffCpw]
  );
  const staffTween = {
    contractor: useTween(staff.contractorPathTotal, !reducedMotion),
    inhouse: useTween(staff.inhousePathTotal, !reducedMotion),
    savings: useTween(staff.savings, !reducedMotion),
    contractorInstall: useTween(staff.contractorInstall, !reducedMotion),
    inhouseInstall: useTween(staff.inhouseInstall, !reducedMotion),
    installSavings: useTween(staff.installSavings, !reducedMotion),
    installerSalary: useTween(staff.installerSalary, !reducedMotion),
    installerVisaMonthly: useTween(staff.installerVisaMonthly, !reducedMotion),
    supportSalary: useTween(staff.supportSalary, !reducedMotion),
    supportVisaMonthly: useTween(staff.supportVisaMonthly, !reducedMotion),
    totalPayroll: useTween(staff.totalPayroll, !reducedMotion),
    totalVisaMonthly: useTween(staff.totalVisaMonthly, !reducedMotion),
    fullyLoadedStaff: useTween(staff.fullyLoadedStaff, !reducedMotion),
  };
  const staffPaybackWeeks = Number.isFinite(staff.paybackMonths)
    ? Math.max(1, Math.round(staff.paybackMonths * WEEKS_PER_MONTH))
    : null;
  const staffRoster = [
    { group: "Leadership", role: "Sean", count: 1, salary: 0, note: "ops & marketing" },
    { group: "Install team", role: "Senior installer", count: staff.seniors, salary: SALARY.senior },
    { group: "Install team", role: "Junior installer", count: staff.juniors, salary: SALARY.junior },
    { group: "Support team", role: "Detailer", count: staff.detailers, salary: SALARY.detailer },
    { group: "Support team", role: "Polisher", count: staff.polishers, salary: SALARY.polisher },
    { group: "Support team", role: "Sales", count: staff.sales, salary: SALARY.sales, note: "+ commission" },
    { group: "Support team", role: "Videographer", count: staff.videographer, salary: SALARY.videographer },
    { group: "Support team", role: "Admin", count: staff.admin, salary: SALARY.admin },
    { group: "Support team", role: "Manager", count: staff.manager, salary: SALARY.manager },
  ].filter((r) => r.count > 0);
  const staffGroups = (["Leadership", "Support team", "Install team"] as const)
    .map((group) => {
      const rows = staffRoster.filter((r) => r.group === group);
      const subtotal = rows.reduce((sum, r) => sum + r.count * r.salary, 0);
      const headcount = rows.reduce((sum, r) => sum + r.count, 0);
      const accent = group === "Install team" ? "#42d6c9" : group === "Support team" ? "#f8b84e" : "#a3e635";
      return { group, rows, subtotal, headcount, accent };
    })
    .filter((group) => group.rows.length > 0);

  // Cumulative investor cash vs capital line (base case, with a realistic ramp)
  const cumulativeReturn = useMemo(() => {
    const steadyInvestorMonthly = 104300 / 2; // base-case net / 2
    const rampFactor = [0, 0, 0.3, 0.55, 0.8, 1];
    let cumulative = 0;
    const rows: Array<{ month: string; cumulative: number }> = [];
    for (let m = 1; m <= 24; m += 1) {
      const factor = m <= 6 ? rampFactor[m - 1] : 1;
      cumulative += steadyInvestorMonthly * factor;
      rows.push({ month: `M${m}`, cumulative: Math.round(cumulative) });
    }
    return rows;
  }, []);

  const buyoutValuation = Math.round((104300 * 12 * 2.5) / 2); // 2.5x annual net, investor 50%

  useEffect(() => {
    document.title = "Private PPF Investor Deck v2 | Grand Touch";
    const meta = document.querySelector<HTMLMetaElement>('meta[name="robots"]') || document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex,nofollow";
    document.head.appendChild(meta);
    setUnlocked(localStorage.getItem(STORAGE_KEY) === "true");
  }, []);

  if (!unlocked) {
    return <PasswordGate onUnlock={() => setUnlocked(true)} />;
  }

  // Hero headline return figures (base case)
  const baseInvestorShare = 52150; // 104,300 / 2
  const basePayback = Math.round(SETUP_TOTAL / baseInvestorShare); // ~8

  return (
    <main className="min-h-screen bg-[#070707] text-white">
      <style>{`.hide-scrollbar::-webkit-scrollbar{display:none}.hide-scrollbar{scrollbar-width:none}
        input[type=range].gt-range{-webkit-appearance:none;appearance:none;height:6px;border-radius:9999px;outline:none}
        input[type=range].gt-range::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;height:24px;width:24px;border-radius:9999px;background:#fff;border:4px solid #f8b84e;cursor:pointer;box-shadow:0 2px 10px rgba(0,0,0,.5)}
        input[type=range].gt-range::-moz-range-thumb{height:22px;width:22px;border-radius:9999px;background:#fff;border:4px solid #f8b84e;cursor:pointer}`}</style>

      <StickyNav investorShare={baseInvestorShare} paybackMonths={basePayback} />

      {/* ===================== HERO ===================== */}
      <section className="relative overflow-hidden px-5 pb-16 pt-6 sm:px-8 lg:px-10">
        <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_12%_-10%,rgba(248,184,78,0.18),transparent_50%),radial-gradient(110%_110%_at_100%_10%,rgba(66,214,201,0.12),transparent_55%)]" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#070707] to-transparent" />
        <div className="relative mx-auto max-w-7xl">
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.28em] text-white/68 sm:text-sm">
              <ShieldCheck className="h-5 w-5 text-[#f8b84e]" />
              Confidential investor deck
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
                A proven operator, not a pitch deck idea
              </div>
              <h1 className="text-[40px] font-black uppercase leading-[0.92] tracking-normal text-white sm:text-6xl lg:text-7xl">
                Back a business
                <br className="hidden sm:block" />{" "}
                <span className="text-[#f8b84e]">that already works.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/80 sm:text-xl">
                Sean has already generated <strong className="text-white">AED 727k+ in closed, paid revenue</strong> and
                built the marketing engine himself - all while limited by space. Fund the studio and take{" "}
                <strong className="text-white">50% of net profit</strong>, with your capital realistically back inside{" "}
                <strong className="text-white">~{basePayback}-18 months</strong>.
              </p>

              {/* Investor-return summary tiles */}
              <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: "Your capital in", value: "AED 350-450k", accent: "#ffffff" },
                  { label: "Your profit share", value: "50%", accent: "#a3e635" },
                  { label: "Capital back in", value: `~${basePayback}-18 mo`, accent: "#42d6c9" },
                  { label: "Then largely", value: "Passive", accent: "#f8b84e" },
                ].map((tile) => (
                  <div key={tile.label} className="rounded-lg border border-white/12 bg-black/40 p-4 backdrop-blur">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">{tile.label}</p>
                    <p className="mt-2 text-xl font-black sm:text-2xl" style={{ color: tile.accent }}>
                      {tile.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#returns"
                  className="inline-flex h-12 items-center gap-2 rounded-md bg-[#f8b84e] px-5 text-sm font-black uppercase tracking-[0.16em] text-black transition hover:bg-white"
                >
                  See your return
                  <TrendingUp className="h-4 w-4" />
                </a>
                <a
                  href="#calculator"
                  className="inline-flex h-12 items-center gap-2 rounded-md border border-white/20 bg-white/10 px-5 text-sm font-black uppercase tracking-[0.16em] text-white backdrop-blur transition hover:bg-white hover:text-black"
                >
                  Model the numbers
                  <Gauge className="h-4 w-4" />
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
                  <p className="text-sm text-white/70">$3.5B IPO marketing · $15M+ raised for clients</p>
                </div>
              </div>
            </div>
          </div>

          {/* Proof stat row */}
          <div id="proof" className="mt-12 grid scroll-mt-20 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {proofStats.map((stat, i) => (
              <Reveal
                key={stat.label}
                delay={i * 70}
                className="rounded-lg border border-white/12 bg-black/40 p-5 shadow-xl backdrop-blur"
              >
                <p className="text-xs uppercase tracking-[0.22em] text-white/45">{stat.label}</p>
                <p className="mt-3 text-3xl font-black text-white">{stat.display}</p>
                <p className="mt-1 text-sm leading-6 text-white/60">{stat.sub}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== MARKET = PROVEN DEMAND ===================== */}
      <section className="px-5 py-14 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <Reveal className="mb-8 max-w-3xl">
            <SectionKicker color="#42d6c9">The opportunity</SectionKicker>
            <h2 className="mt-4 text-4xl font-black uppercase leading-none sm:text-5xl">
              The market is already proven - in revenue.
            </h2>
            <p className="mt-5 leading-8 text-white/70">
              Most decks ask you to believe a market projection. This one doesn't have to. Grand Touch has already taken{" "}
              <strong className="text-white">AED 727k+ in paid work</strong> from Dubai's premium-car owners, while
              constrained by borrowed space. The demand is on the board - the studio simply removes the ceiling.
            </p>
          </Reveal>
          <div className="grid gap-5 lg:grid-cols-3">
            {marketHighlights.map((card, i) => (
              <Reveal
                key={card.title}
                delay={i * 90}
                className="rounded-lg border border-white/10 bg-[#111] p-6"
              >
                <div
                  className="mb-5 flex h-11 w-11 items-center justify-center rounded-md"
                  style={{ background: `${card.color}1f`, color: card.color }}
                >
                  <card.icon className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-black">{card.title}</h3>
                <p className="mt-3 leading-7 text-white/66">{card.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== WHY GRAND TOUCH WINS ===================== */}
      <section id="why" className="scroll-mt-20 bg-[#0a0a0a] px-5 py-14 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <Reveal className="mb-8 max-w-3xl">
            <SectionKicker color="#f472b6">Why Grand Touch wins</SectionKicker>
            <h2 className="mt-4 text-4xl font-black uppercase leading-none sm:text-5xl">
              Hard to copy, easy to trust.
            </h2>
            <p className="mt-5 leading-8 text-white/70">
              Dubai has no shortage of PPF shops. What it's short on is trust. Grand Touch wins on the things that
              actually move premium customers - and that competitors can't simply buy.
            </p>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2">
            {differentiators.map((card, i) => (
              <Reveal
                key={card.title}
                delay={i * 80}
                className="flex gap-4 rounded-lg border border-white/10 bg-[#111] p-6"
              >
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md"
                  style={{ background: `${card.color}1f`, color: card.color }}
                >
                  <card.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black">{card.title}</h3>
                  <p className="mt-2 leading-7 text-white/66">{card.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== FOUNDER TRACK RECORD ===================== */}
      <section id="founder" className="scroll-mt-20 px-5 py-14 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <Reveal className="mb-8 max-w-3xl">
            <SectionKicker color="#f8b84e">The operator</SectionKicker>
            <h2 className="mt-4 text-4xl font-black uppercase leading-none sm:text-5xl">
              You're backing a proven operator.
            </h2>
            <p className="mt-5 leading-8 text-white/70">
              The biggest risk in any small deal is the person running it. Sean isn't learning on your money - he's a
              growth strategist who has driven marketing for a multi-billion-dollar IPO, raised eight figures for other
              founders, and has now proven he can do it for himself with Grand Touch.
            </p>
          </Reveal>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {founderTrackRecord.map((card, i) => (
              <Reveal
                key={card.title}
                delay={i * 80}
                className="rounded-lg border border-white/10 bg-[#111] p-6"
              >
                <div
                  className="mb-4 flex h-11 w-11 items-center justify-center rounded-md"
                  style={{ background: `${card.color}1f`, color: card.color }}
                >
                  <card.icon className="h-5 w-5" />
                </div>
                <p className="text-3xl font-black" style={{ color: card.color }}>
                  {card.metric}
                </p>
                <h3 className="mt-1 text-base font-black">{card.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/60">{card.body}</p>
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-6 grid gap-6 rounded-2xl border border-[#f8b84e]/25 bg-[linear-gradient(135deg,rgba(248,184,78,0.08),transparent_60%)] p-6 sm:p-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div className="relative overflow-hidden rounded-xl border border-white/12 bg-black/40">
              <img
                src="/sean-phoenix-ipo-bell.png"
                alt="Sean ringing the bell at the Phoenix Group $3.5B IPO on the Abu Dhabi Securities Exchange (ADX)"
                loading="lazy"
                className="aspect-[4/3] w-full object-cover object-top"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent p-4">
                <p className="inline-flex items-center gap-1.5 rounded-full bg-[#f8b84e] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-black">
                  <Crown className="h-3 w-3" />
                  Phoenix Group IPO · ADX
                </p>
                <p className="mt-2 text-sm font-semibold text-white/85">
                  Sean ringing the bell at the $3.5B listing, Dec 2023
                </p>
              </div>
            </div>
            <div>
              <Globe className="h-7 w-7 text-[#f8b84e]" />
              <blockquote className="mt-4 text-lg leading-8 text-white/90 sm:text-xl">
                "I've helped raise over $15M for other founders and led the marketing on a $3.5B IPO. Grand Touch is me
                doing it for myself - same playbook, my own brand. It's already paying. It just needs the floor space to
                run at full speed."
              </blockquote>
              <figcaption className="mt-4 text-sm font-black uppercase tracking-[0.18em] text-[#f8b84e]">
                - Sean Gardner, Founder
              </figcaption>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===================== REVENUE PATH CHART ===================== */}
      <section className="bg-[#0a0a0a] px-5 py-14 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <Reveal className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#ef6345]/35 bg-[#ef6345]/10 px-4 py-2 text-sm font-bold text-[#ffb09f]">
            <Flame className="h-4 w-4" />
            Momentum held through a regional shock
          </Reveal>
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.15fr] lg:items-end">
            <Reveal>
              <SectionKicker color="#f8b84e">Data-backed trajectory</SectionKicker>
              <h2 className="mt-4 max-w-3xl text-4xl font-black uppercase leading-none sm:text-5xl">
                The line was already up.
              </h2>
              <p className="mt-5 max-w-2xl leading-8 text-white/70">
                Closed revenue jumped <strong className="text-white">+79% from February to March</strong> before the
                regional shock cooled the wider market. The dashed line is the no-shock path: with space, control and
                continued marketing, the same engine pushes monthly revenue past{" "}
                <strong className="text-white">AED 300k</strong>.
              </p>
            </Reveal>
            <Reveal className="rounded-lg border border-white/10 bg-[#101010] p-4 sm:p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-white/50">Actual closed revenue + no-shock projection</p>
                  <p className="text-xl font-black">Monthly closed revenue path</p>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-white/58">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2 w-4 rounded-full bg-[#f8b84e]" /> Closed
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2 w-4 rounded-full bg-[#42d6c9]" /> Projection
                  </span>
                </div>
              </div>
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={actualRevenueData} barCategoryGap="24%" margin={{ top: 24, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.58)", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis width={54} domain={[0, 600000]} tick={{ fill: "rgba(255,255,255,0.58)", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={formatShort} />
                    <Tooltip contentStyle={{ background: "#0b0b0b", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 8 }} formatter={(value: number, name: string) => [formatAed(value), name]} />
                    <ReferenceLine x="Mar" stroke="#ef6345" strokeDasharray="4 4" strokeWidth={2} label={{ value: "Regional shock", position: "top", fill: "#ffb09f", fontSize: 11, fontWeight: 700 }} />
                    <Bar dataKey="actualQuote" stackId="quote" fill="#f8b84e" radius={[5, 5, 0, 0]} maxBarSize={58} name="Closed revenue" />
                    <Bar dataKey="runRateExtension" stackId="quote" fill="#7dd3fc" fillOpacity={0.76} radius={[5, 5, 0, 0]} maxBarSize={58} name="June run-rate" />
                    <Line type="monotone" dataKey="projection" name="No-shock projection" stroke="#42d6c9" strokeWidth={3} strokeDasharray="5 4" dot={{ r: 3 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ===================== INTERACTIVE DEAL CALCULATOR ===================== */}
      <section id="calculator" className="scroll-mt-20 px-5 py-14 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <Reveal className="mb-8 max-w-3xl">
            <SectionKicker color="#7dd3fc">Model it yourself</SectionKicker>
            <h2 className="mt-4 text-4xl font-black uppercase leading-none sm:text-5xl">
              Move the sliders. Watch the profit.
            </h2>
            <p className="mt-5 leading-8 text-white/70">
              The whole thesis in one tool. Almost every dirham of a price increase drops to profit, while volume pulls
              overhead up in steps as we add staff. Toggle <strong className="text-white">contractor vs in-house PPF</strong>{" "}
              to see COGS fall when installs move in-house (offset by salaried installers in overhead). Set price, volume
              and install method, and watch your 50% share, payback and annual return update live.
            </p>
          </Reveal>

          <Reveal className="grid gap-6 rounded-2xl border border-white/10 bg-[#101010] p-5 sm:p-8 lg:grid-cols-[0.95fr_1.05fr]">
            {/* Controls */}
            <div className="flex flex-col gap-7">
              <div>
                <label className="text-sm font-bold uppercase tracking-[0.18em] text-white/55">PPF install</label>
                <div className="mt-2 grid grid-cols-2 gap-1 rounded-lg border border-white/10 bg-black/40 p-1">
                  {([
                    { id: "contractor", label: "Contractors" },
                    { id: "inhouse", label: "In-house staff" },
                  ] as const).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setInstallMode(opt.id)}
                      className={cx(
                        "rounded-md px-3 py-2.5 text-sm font-black uppercase tracking-[0.12em] transition",
                        installMode === opt.id ? "bg-[#a3e635] text-black" : "text-white/55 hover:text-white"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs leading-5 text-white/45">
                  {calc.inhouse
                    ? `COGS drops to film only (~${formatShort(FILM_COGS_PER_CAR)}/car); ${calc.installers} salaried installers move into overhead.`
                    : `Install on contractors at ${formatShort(CONTRACTOR_PER_CAR)}/car, billed inside COGS (~${formatShort(COGS_PER_CAR)}/car).`}
                </p>
              </div>

              <div>
                <div className="flex items-end justify-between">
                  <label className="text-sm font-bold uppercase tracking-[0.18em] text-white/55">Price per car</label>
                  <span className="text-2xl font-black text-[#f8b84e]">{formatShort(pricePerCar)}</span>
                </div>
                <input
                  type="range"
                  min={9000}
                  max={15000}
                  step={500}
                  value={pricePerCar}
                  onChange={(e) => setPricePerCar(Number(e.target.value))}
                  className="gt-range mt-4 w-full"
                  style={{ background: `linear-gradient(90deg,#f8b84e ${((pricePerCar - 9000) / 6000) * 100}%, rgba(255,255,255,0.12) ${((pricePerCar - 9000) / 6000) * 100}%)` }}
                />
                <div className="mt-2 flex justify-between text-xs text-white/45">
                  <span>AED 9k · below market</span>
                  <span>AED 15k · premium</span>
                </div>
              </div>

              <div>
                <div className="flex items-end justify-between">
                  <label className="text-sm font-bold uppercase tracking-[0.18em] text-white/55">Cars per week</label>
                  <span className="text-2xl font-black text-[#42d6c9]">{carsPerWeek}</span>
                </div>
                <input
                  type="range"
                  min={4}
                  max={15}
                  step={1}
                  value={carsPerWeek}
                  onChange={(e) => setCarsPerWeek(Number(e.target.value))}
                  className="gt-range mt-4 w-full"
                  style={{ background: `linear-gradient(90deg,#42d6c9 ${((carsPerWeek - 4) / 11) * 100}%, rgba(255,255,255,0.12) ${((carsPerWeek - 4) / 11) * 100}%)` }}
                />
                <div className="mt-2 flex justify-between text-xs text-white/45">
                  <span>4 / week</span>
                  <span>15 / week</span>
                </div>
                <div className="mt-3 flex items-center gap-2 rounded-md border border-white/10 bg-black/30 px-3 py-2">
                  <Users className="h-3.5 w-3.5 shrink-0 text-[#42d6c9]" />
                  <span className="text-xs text-white/60">
                    Team at this volume: <strong className="text-white/85">{calc.team}</strong>
                  </span>
                </div>
              </div>

              {/* Animated waterfall: every dirham of revenue, split into cost vs profit */}
              <div className="rounded-lg border border-white/10 bg-black/30 p-4">
                <div className="flex items-end justify-between">
                  <span className="text-xs font-bold uppercase tracking-[0.16em] text-white/45">
                    Where the revenue goes · {Math.round(calc.carsPerMonth)} cars
                  </span>
                  <span className="text-lg font-black text-[#7dd3fc]">{formatShort(tween.revenue)}</span>
                </div>
                <div className="mt-3 flex h-9 w-full overflow-hidden rounded-lg bg-white/5">
                  <div
                    className="flex items-center justify-center transition-[width] duration-300 ease-out"
                    style={{ width: `${(calc.cogs / calc.revenue) * 100}%`, background: "#ef6345" }}
                    title="COGS"
                  />
                  <div
                    className="transition-[width] duration-300 ease-out"
                    style={{ width: `${(calc.fixedOverhead / calc.revenue) * 100}%`, background: "#f472b6" }}
                    title="Overhead"
                  />
                  <div
                    className="transition-[width] duration-300 ease-out"
                    style={{ width: `${(Math.max(0, calc.net) / calc.revenue) * 100}%`, background: "#a3e635" }}
                    title="Net profit"
                  />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  {[
                    { label: calc.inhouse ? "COGS (film)" : "COGS", value: tween.cogs, color: "#ef6345" },
                    { label: calc.inhouse ? "Overhead + install" : "Overhead", value: tween.fixedOverhead, color: "#f472b6" },
                    { label: "Net profit", value: tween.net, color: "#a3e635" },
                  ].map((seg) => (
                    <div key={seg.label} className="rounded-md bg-black/30 p-2">
                      <span className="flex items-center gap-1.5 text-white/55">
                        <span className="h-2 w-2 rounded-full" style={{ background: seg.color }} />
                        {seg.label}
                      </span>
                      <span className="mt-1 block font-bold text-white/85">{formatShort(seg.value)}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-3 flex items-center gap-1.5 text-[11px] text-white/40">
                  <span className="rounded-full bg-white/10 px-2 py-0.5 font-bold uppercase tracking-wide">
                    {calc.inhouse ? `${calc.team} + install team` : calc.team}
                  </span>
                  {calc.inhouse
                    ? "Installs done in-house: COGS is film only, the install team sits in overhead instead."
                    : "Install on contractors, so COGS/car holds ~AED 5k - only support overhead steps up with volume."}
                </p>
              </div>
            </div>

            {/* Live outputs */}
            <div
              className="flex flex-col justify-between gap-5 rounded-xl border border-[#42d6c9]/25 bg-[#42d6c9]/[0.06] p-5 transition-shadow duration-500 sm:p-6"
              style={{ boxShadow: `0 0 ${20 + netIntensity * 60}px rgba(66,214,201,${0.05 + netIntensity * 0.22})` }}
            >
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/45">Monthly net profit</p>
                <p className="mt-1 text-4xl font-black text-white sm:text-5xl">{formatShort(tween.net)}</p>
                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#f8b84e] to-[#a3e635] transition-[width] duration-300 ease-out"
                    style={{ width: `${netIntensity * 100}%` }}
                  />
                </div>
              </div>

              <div
                className="rounded-lg border border-[#42d6c9]/20 bg-black/35 p-5 transition-all duration-500"
                style={{ boxShadow: `inset 0 0 ${10 + netIntensity * 40}px rgba(66,214,201,${0.04 + netIntensity * 0.12})` }}
              >
                <p className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/45">
                  <CircleDollarSign className="h-3.5 w-3.5 text-[#42d6c9]" />
                  Your 50% share
                </p>
                <p className="mt-1 text-4xl font-black text-[#42d6c9] sm:text-5xl">
                  {formatShort(tween.investorShare)}
                  <span className="text-base font-bold text-white/40"> /mo</span>
                </p>
                <p className="mt-1 text-xs text-white/45">
                  {formatShort(tween.investorShare * 12)} to you per year at this run-rate
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-white/10 bg-black/25 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-white/45">Capital payback</p>
                  <p className="mt-1 text-3xl font-black text-[#a3e635]">
                    ~{Math.round(tween.paybackMonths)}
                    <span className="text-base text-white/40"> mo</span>
                  </p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-[#a3e635] transition-[width] duration-300 ease-out"
                      style={{ width: `${Math.min(100, (1 - Math.min(calc.paybackMonths, 24) / 24) * 100)}%` }}
                    />
                  </div>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/25 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-white/45">Annual cash-on-cash</p>
                  <p className="mt-1 text-3xl font-black text-[#f8b84e]">{Math.round(tween.annualCashOnCash)}%</p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-[#f8b84e] transition-[width] duration-300 ease-out"
                      style={{ width: `${Math.min(100, (calc.annualCashOnCash / 400) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
              <p className="text-xs leading-5 text-white/45">
                Steady-state figures on AED {SETUP_TOTAL.toLocaleString()} capital. Payback and cash-on-cash are
                pre-ramp; allow 6-12 months to reach the volume you set.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===================== OPERATING MODEL: STAFFING + COST-BENEFIT ===================== */}
      <section id="staffing" className="scroll-mt-20 bg-[#0a0a0a] px-5 py-14 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <Reveal className="mb-8 max-w-3xl">
            <SectionKicker color="#ef6345">Operating model</SectionKicker>
            <h2 className="mt-4 text-4xl font-black uppercase leading-none sm:text-5xl">
              Contractors now. In-house when it pays.
            </h2>
            <p className="mt-5 leading-8 text-white/70">
              Install starts on contractors at a flat <strong className="text-white">AED 2k per car</strong> - zero
              fixed risk while volume is still building. The support team is already in place:{" "}
              <strong className="text-white">5 people including Sean</strong> (4 paid, Sean unpaid), with only{" "}
              <strong className="text-white">2 new visas</strong> needed among the core hires. Drag volume below to see
              when extra hires kick in and when bringing installers in-house beats contractors.
            </p>
          </Reveal>

          <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
            {/* Team roster — compact */}
            <Reveal className="flex h-full flex-col rounded-2xl border border-white/10 bg-[#101010] p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#42d6c9]/25 bg-[#42d6c9]/10">
                    <Users className="h-5 w-5 text-[#42d6c9]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-wide">Team plan</h3>
                    <p className="mt-1 text-xs leading-5 text-white/50">
                      {staff.team} for {staffCpw} cars/week. Growth hires and visas are included as volume rises.
                    </p>
                  </div>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-right">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/42">Heads</p>
                  <p className="text-2xl font-black text-[#42d6c9]">{staff.headcount}</p>
                </div>
              </div>

              <div className="mt-4 grid flex-1 content-start gap-2">
                {staffGroups.map((group) => (
                  <div
                    key={group.group}
                    className="rounded-lg border border-white/10 bg-black/20 p-3"
                    style={{ boxShadow: `inset 3px 0 0 ${group.accent}` }}
                  >
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/45">
                          {group.group}
                        </p>
                        <p className="text-[10px] text-white/35">{group.headcount} heads</p>
                      </div>
                      <p className="text-xs font-black" style={{ color: group.accent }}>
                        {group.subtotal > 0 ? `${formatShort(group.subtotal)}/mo` : "unpaid"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      {group.rows.map((r) => (
                        <div
                          key={r.role}
                          className="grid grid-cols-[1fr_auto_auto] items-center gap-2 rounded-md bg-white/[0.035] px-2.5 py-1.5 text-xs"
                        >
                          <span className="min-w-0 truncate font-semibold text-white/82">
                            {r.role}
                            {r.note ? <span className="text-white/35"> / {r.note}</span> : null}
                          </span>
                          <span className="min-w-6 rounded-full border border-white/10 bg-white/[0.05] px-2 py-0.5 text-center font-black text-white/62">
                            {r.count}
                          </span>
                          <span className="w-14 text-right font-bold text-white/68">
                            {r.salary > 0 ? formatShort(r.count * r.salary).replace("AED ", "") : "-"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-lg border border-[#f8b84e]/20 bg-[#f8b84e]/[0.07] p-3">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-semibold text-white/70">
                    {visaAccounting === "upfront" ? "Payroll-only run-rate" : "Fully loaded team"}
                  </span>
                  <span className="font-black text-[#f8b84e]">{formatAed(staffTween.fullyLoadedStaff)}/mo</span>
                </div>
                <p className="mt-1 text-[10px] leading-4 text-white/42">
                  Contractors stay at {formatShort(CONTRACTOR_PER_CAR)}/car until in-house crossover.
                  {staff.paidSupportHeadcount > BASE_SUPPORT_PAID
                    ? ` Growth hires above core ${BASE_SUPPORT_PAID} add salary and visas.`
                    : " Core team is already in place."}
                </p>
              </div>

            </Reveal>

            {/* Cost-benefit chart + payback */}
            <Reveal className="rounded-2xl border border-white/10 bg-[#101010] p-5 sm:p-6">
              <div className="mb-4 rounded-lg border border-white/10 bg-black/25 p-3">
                <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
                  <div>
                    <div className="mb-1.5 flex items-end justify-between gap-4">
                      <label className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">
                        Cars per week
                      </label>
                      <span className="text-xl font-black text-[#ef6345]">{staffCpw}</span>
                    </div>
                    <input
                      type="range"
                      min={4}
                      max={15}
                      step={1}
                      value={staffCpw}
                      onChange={(e) => setStaffCpw(Number(e.target.value))}
                      className="gt-range w-full"
                      style={{
                        background: `linear-gradient(90deg,#ef6345 ${((staffCpw - 4) / 11) * 100}%, rgba(255,255,255,0.12) ${((staffCpw - 4) / 11) * 100}%)`,
                        accentColor: "#ef6345",
                      }}
                    />
                    <div className="mt-2 flex justify-between text-[10px] font-semibold text-white/38">
                      <span>4 / week</span>
                      <span>15 / week</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:min-w-[340px]">
                    {[
                      { label: "Cars / month", value: `${Math.round(staff.carsPerMonth)}`, color: "#ffffff" },
                      { label: "Headcount", value: `${staff.headcount}`, color: "#42d6c9" },
                      { label: "Team cost", value: formatShort(staff.fullyLoadedStaff), color: "#f8b84e" },
                    ].map((chip) => (
                      <div key={chip.label} className="rounded-lg border border-white/10 bg-black/25 px-3 py-1.5">
                        <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-white/38">{chip.label}</p>
                        <p className="mt-0.5 text-sm font-black" style={{ color: chip.color }}>
                          {chip.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div className="flex gap-2">
                  <Scale className="mt-0.5 h-5 w-5 shrink-0 text-[#a3e635]" />
                  <div>
                  <h3 className="text-lg font-black uppercase tracking-wide">
                    {visaAccounting === "upfront"
                      ? "Upfront visa cash crossover"
                      : "Monthly cost by volume"}
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-white/50">
                    {visaAccounting === "upfront"
                      ? `Cumulative install cash at ${staffCpw} cars/week - in-house starts with installer visas on Day 1, then payroll; contractors stay AED 2k/car.`
                      : "Compare monthly run-rate across volume — both paths include support; red adds contract install at AED 2k/car."}
                  </p>
                  </div>
                </div>
              </div>
              <div className="mb-4">
                <label className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/45">Visa accounting</label>
                <div className="mt-2 grid grid-cols-2 gap-1 rounded-lg border border-white/10 bg-black/40 p-1">
                  {([
                    { id: "amortised", label: "Spread over 2 yrs" },
                    { id: "upfront", label: "Upfront visas" },
                  ] as const).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setVisaAccounting(opt.id)}
                      className={cx(
                        "rounded-md px-3 py-2 text-xs font-black uppercase tracking-[0.1em] transition",
                        visaAccounting === opt.id ? "bg-[#f8b84e] text-black" : "text-white/55 hover:text-white"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-3 flex flex-wrap gap-3 text-xs text-white/58">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-4 rounded-full bg-[#ef6345]" /> Contractor install
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-4 rounded-full bg-[#42d6c9]" /> In-house install
                </span>
                {visaAccounting === "upfront" && staffCumulative.paybackMonth ? (
                  <span className="inline-flex items-center gap-2 text-[#a3e635]">
                    <span className="h-2 w-2 rounded-full bg-[#a3e635]" />
                    In-house ahead from M{staffCumulative.paybackMonth}
                  </span>
                ) : null}
                {visaAccounting === "upfront" && staffCumulative.month1 ? (
                  <span
                    className={cx(
                      "text-white/45",
                      staffCumulative.month1.netVsContractors >= 0 ? "text-[#a3e635]" : "text-[#f8b84e]"
                    )}
                  >
                    M1: {staffCumulative.month1.netVsContractors >= 0 ? "in-house ahead" : "contractors ahead"}{" "}
                    {formatAed(Math.abs(staffCumulative.month1.netVsContractors))}
                  </span>
                ) : null}
              </div>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  {visaAccounting === "upfront" ? (
                    <ComposedChart data={staffCumulative.rows} margin={{ top: 20, right: 12, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="contractorCumFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ef6345" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#ef6345" stopOpacity={0.02} />
                        </linearGradient>
                        <linearGradient id="inhouseCumFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#42d6c9" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="#42d6c9" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                      <XAxis
                        dataKey="month"
                        tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        width={58}
                        tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={formatShort}
                      />
                      <Tooltip
                        contentStyle={{ background: "#0b0b0b", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 8 }}
                        labelFormatter={(label) => `${label} · cumulative install spend`}
                        formatter={(value: number, name: string, item: { payload?: { monthNum?: number; netVsContractors?: number } }) => {
                          const labels: Record<string, string> = {
                            contractorInstallCum: "Contractor install",
                            inhouseInstallCum: "In-house install",
                          };
                          const p = item.payload;
                          if (name === "inhouseInstallCum" && p?.monthNum === 0) {
                            return [
                              `${formatAed(value)} (installer visas on day 1)`,
                              labels.inhouseInstallCum,
                            ];
                          }
                          if (p?.monthNum && p.monthNum > 0 && p.netVsContractors !== undefined) {
                            const delta =
                              p.netVsContractors >= 0
                                ? ` · in-house ahead ${formatAed(p.netVsContractors)}`
                                : ` · contractors ahead ${formatAed(Math.abs(p.netVsContractors))}`;
                            return [formatAed(value) + delta, labels[name] ?? name];
                          }
                          return [formatAed(value), labels[name] ?? name];
                        }}
                      />
                      {staffCumulative.paybackMonth ? (
                        <ReferenceLine
                          x={`M${staffCumulative.paybackMonth}`}
                          stroke="#a3e635"
                          strokeDasharray="4 4"
                          strokeWidth={2}
                          label={{
                            value: "Crossover",
                            position: "insideTopLeft",
                            fill: "#a3e635",
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        />
                      ) : null}
                      <ReferenceLine
                        x="Day 1"
                        stroke="#f8b84e"
                        strokeDasharray="2 6"
                        strokeOpacity={0.45}
                        label={{
                          value: "Installer visas",
                          position: "insideTopRight",
                          fill: "#ffd894",
                          fontSize: 10,
                          fontWeight: 700,
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="contractorInstallCum"
                        stroke="#ef6345"
                        strokeWidth={2.5}
                        fill="url(#contractorCumFill)"
                        name="contractorInstallCum"
                      />
                      <Area
                        type="monotone"
                        dataKey="inhouseInstallCum"
                        stroke="#42d6c9"
                        strokeWidth={2.5}
                        fill="url(#inhouseCumFill)"
                        name="inhouseInstallCum"
                      />
                    </ComposedChart>
                  ) : (
                    <ComposedChart data={staffChart} margin={{ top: 16, right: 12, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="contractorFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ef6345" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="#ef6345" stopOpacity={0.02} />
                        </linearGradient>
                        <linearGradient id="inhouseFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#42d6c9" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="#42d6c9" stopOpacity={0.03} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                      <XAxis
                        dataKey="cpw"
                        type="number"
                        domain={[4, 15]}
                        ticks={[4, 6, 8, 10, 12, 15]}
                        tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v: number) => `${v}/wk`}
                      />
                      <YAxis
                        width={58}
                        tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={formatShort}
                      />
                      <Tooltip
                        contentStyle={{ background: "#0b0b0b", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 8 }}
                        labelFormatter={(v) => `${v} cars / week`}
                        formatter={(value: number, name: string) => {
                          const labels: Record<string, string> = {
                            contractor: "Contractors path",
                            inhouse: "In-house path",
                          };
                          return [formatAed(value), labels[name] ?? name];
                        }}
                      />
                      <ReferenceLine
                        x={staffCpw}
                        stroke="#ffffff"
                        strokeDasharray="3 3"
                        strokeOpacity={0.55}
                        label={{ value: "You", position: "top", fill: "rgba(255,255,255,0.75)", fontSize: 11, fontWeight: 700 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="contractor"
                        stroke="#ef6345"
                        strokeWidth={2.5}
                        fill="url(#contractorFill)"
                        name="contractor"
                      />
                      <Area
                        type="monotone"
                        dataKey="inhouse"
                        stroke="#42d6c9"
                        strokeWidth={2.5}
                        fill="url(#inhouseFill)"
                        name="inhouse"
                      />
                    </ComposedChart>
                  )}
                </ResponsiveContainer>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                {visaAccounting === "upfront" ? (
                  <>
                    <div className="rounded-lg border border-[#ef6345]/25 bg-[#ef6345]/[0.07] p-2.5">
                      <p className="text-[10px] uppercase tracking-[0.14em] text-white/45">12-mo contractor install</p>
                      <p className="mt-1 text-lg font-black text-[#ef6345]">
                        {formatAed(staffCumulative.month12?.contractorInstallCum ?? 0)}
                      </p>
                      <p className="text-[10px] text-white/40">
                        {formatAed(staff.contractorInstall)}/mo at {staffCpw}/wk
                      </p>
                    </div>
                    <div className="rounded-lg border border-[#42d6c9]/25 bg-[#42d6c9]/[0.07] p-2.5">
                      <p className="text-[10px] uppercase tracking-[0.14em] text-white/45">12-mo in-house install</p>
                      <p className="mt-1 text-lg font-black text-[#42d6c9]">
                        {formatAed(staffCumulative.month12?.inhouseInstallCum ?? 0)}
                      </p>
                      <p className="text-[10px] text-white/40">
                        Day 1 {formatAed(staff.installerVisaUpfront)} visas + payroll
                      </p>
                    </div>
                    <div
                      className={cx(
                        "rounded-lg p-2.5",
                        (staffCumulative.month1?.netVsContractors ?? 0) >= 0
                          ? "border border-[#a3e635]/30 bg-[#a3e635]/[0.08]"
                          : "border border-[#f8b84e]/30 bg-[#f8b84e]/[0.08]"
                      )}
                    >
                      <p className="text-[10px] uppercase tracking-[0.14em] text-white/45">Month 1 cash check</p>
                      <p
                        className="mt-1 text-lg font-black"
                        style={{
                          color: (staffCumulative.month1?.netVsContractors ?? 0) >= 0 ? "#a3e635" : "#f8b84e",
                        }}
                      >
                        {formatAed(Math.abs(staffCumulative.month1?.netVsContractors ?? 0))}
                      </p>
                      <p className="text-[10px] text-white/40">
                        {(staffCumulative.month1?.netVsContractors ?? 0) >= 0
                          ? "in-house ahead after M1"
                          : "contractors still ahead after M1"}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="rounded-lg border border-[#ef6345]/25 bg-[#ef6345]/[0.07] p-2.5">
                      <p className="text-[10px] uppercase tracking-[0.14em] text-white/45">Contractors path</p>
                      <p className="mt-1 text-lg font-black text-[#ef6345]">{formatAed(staffTween.contractor)}</p>
                      <p className="text-[10px] text-white/40">/mo at {staffCpw}/wk</p>
                    </div>
                    <div className="rounded-lg border border-[#42d6c9]/25 bg-[#42d6c9]/[0.07] p-2.5">
                      <p className="text-[10px] uppercase tracking-[0.14em] text-white/45">In-house path</p>
                      <p className="mt-1 text-lg font-black text-[#42d6c9]">{formatAed(staffTween.inhouse)}</p>
                      <p className="text-[10px] text-white/40">/mo at {staffCpw}/wk</p>
                    </div>
                    <div className="rounded-lg border border-[#a3e635]/30 bg-[#a3e635]/[0.08] p-2.5">
                      <p className="text-[10px] uppercase tracking-[0.14em] text-white/45">You save</p>
                      <p className="mt-1 text-lg font-black text-[#a3e635]">{formatAed(staffTween.savings)}</p>
                      <p className="text-[10px] text-white/40">/mo vs contractors</p>
                    </div>
                  </>
                )}
              </div>

              <div className="mt-3 flex items-start gap-3 rounded-lg border border-[#f8b84e]/25 bg-[#f8b84e]/[0.07] p-3">
                <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-[#f8b84e]" />
                <div className="text-sm leading-6 text-white/75">
                  {visaAccounting === "upfront" ? (
                    staff.installSavingsUpfront > 0 ? (
                      <>
                        <strong className="text-white">At steady volume, in-house install wins on the math.</strong> At{" "}
                        {staffCpw} cars/week you pay {formatAed(staff.contractorInstall)}/mo for contract install vs{" "}
                        {formatAed(staff.inhouseInstallPayroll)}/mo for salaried installers —{" "}
                        {formatAed(staff.installSavingsUpfront)}/mo better before visas. Pay{" "}
                        {formatAed(staff.installerVisaUpfront)} in installer visas on day one
                        {staffCumulative.paybackMonth ? (
                          <>
                            ; cumulative spend crosses over by{" "}
                            <strong className="text-white">M{staffCumulative.paybackMonth}</strong>
                          </>
                        ) : null}
                        .
                        {staffCumulative.month1 ? (
                          <span className="mt-1 block text-white/65">
                            After month one,{" "}
                            <strong className="text-white">
                              {staffCumulative.month1.netVsContractors >= 0 ? "in-house is ahead" : "contractors are still ahead"}
                            </strong>{" "}
                            by {formatAed(Math.abs(staffCumulative.month1.netVsContractors))}.
                          </span>
                        ) : null}
                        <span className="mt-2 block text-white/60">
                          <strong className="text-white/80">When contractors still help:</strong> launch ramp before
                          volume is proven, overflow above in-house capacity
                          {staff.overflowCars > 0
                            ? ` (~${Math.round(staff.overflowCars)} cars/mo still on contractors at ${staffCpw}/wk)`
                            : ""}
                          , or keeping install variable if bookings dip seasonally.
                        </span>
                      </>
                    ) : (
                      <>At this volume contract install is still cheaper than salaried installers — keep contractors until volume rises.</>
                    )
                  ) : staffPaybackWeeks ? (
                    <>
                      Visas spread over 2 years in the monthly lines above. Installer visas (
                      {formatAed(staff.installerVisaUpfront)} upfront) pay back in{" "}
                      <strong className="text-white">~{staffPaybackWeeks} weeks</strong> from install savings alone.
                      Switch to <strong className="text-white">Upfront visas</strong> to see the install-only crossover (
                      {formatAed(staff.installerVisaUpfront)} installer visas on day one).
                    </>
                  ) : (
                    <>At this volume keep install on contractors — in-house does not yet beat AED 2k/car.</>
                  )}
                </div>
              </div>
            </Reveal>
          </div>

          <Reveal className="mt-6 rounded-lg border border-white/10 bg-[#101010] p-5 text-sm leading-7 text-white/60">
            <strong className="text-white">How to read this:</strong> support starts as the core team already hired
            (detailer, polisher, videographer, sales + Sean unpaid). Only{" "}
            <strong className="text-white">2 new visas</strong> are modelled on the core four; 3 are already covered.
            Each growth hire above that adds salary plus a new visa (AED 8k over 2 years). The{" "}
            <strong className="text-white">Upfront visas</strong> chart isolates the PPF install decision — contractors
            at AED 2k/car vs salaried installers — because support cost is identical either way.
          </Reveal>
        </div>
      </section>

      {/* ===================== YOUR RETURN (deeper than payback) ===================== */}
      <section id="returns" className="scroll-mt-20 px-5 py-14 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <Reveal className="mb-8 max-w-3xl">
            <SectionKicker color="#a3e635">Your return</SectionKicker>
            <h2 className="mt-4 text-4xl font-black uppercase leading-none sm:text-5xl">
              What you actually walk away with.
            </h2>
            <p className="mt-5 leading-8 text-white/70">
              Payback is only half the story. Here's the full picture: how fast the capital comes back, what it earns
              after that, the downside floor, and a clean exit if you want one.
            </p>
          </Reveal>

          {/* Headline return tiles */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Capital back", value: `~${basePayback}-18 mo`, sub: "Base case, allowing for ramp", color: "#42d6c9" },
              { label: "Annual cash-on-cash", value: "~150%", sub: "Steady-state, base case", color: "#f8b84e" },
              { label: "Downside floor", value: "~14 mo", sub: "Even at half volume (5 cars/wk)", color: "#a3e635" },
              { label: "Then largely", value: "Passive", sub: "Sean runs everything", color: "#7dd3fc" },
            ].map((tile, i) => (
              <Reveal key={tile.label} delay={i * 70} className="rounded-lg border border-white/10 bg-[#111] p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-white/45">{tile.label}</p>
                <p className="mt-2 text-3xl font-black" style={{ color: tile.color }}>{tile.value}</p>
                <p className="mt-1 text-sm leading-6 text-white/55">{tile.sub}</p>
              </Reveal>
            ))}
          </div>

          {/* Cumulative return chart */}
          <Reveal className="mt-6 grid gap-6 rounded-2xl border border-white/10 bg-[#101010] p-5 sm:p-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <LineChartIcon className="h-5 w-5 text-[#42d6c9]" />
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-white/55">
                  Cumulative cash to you vs. capital in
                </p>
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={cumulativeReturn} margin={{ top: 16, right: 12, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="cumFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#42d6c9" stopOpacity={0.45} />
                        <stop offset="100%" stopColor="#42d6c9" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} axisLine={false} tickLine={false} interval={2} />
                    <YAxis width={54} tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={formatShort} />
                    <Tooltip contentStyle={{ background: "#0b0b0b", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 8 }} formatter={(value: number) => [formatAed(value), "Cumulative to you"]} />
                    <ReferenceLine y={SETUP_TOTAL} stroke="#f8b84e" strokeDasharray="5 4" strokeWidth={2} label={{ value: "Capital recovered", position: "insideTopRight", fill: "#ffd894", fontSize: 11, fontWeight: 700 }} />
                    <Area type="monotone" dataKey="cumulative" stroke="#42d6c9" strokeWidth={3} fill="url(#cumFill)" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="space-y-3 text-sm leading-7 text-white/70">
              <p>
                On the base case alone, your half of net profit clears the full{" "}
                <strong className="text-white">{formatShort(SETUP_TOTAL)}</strong> capital around{" "}
                <strong className="text-white">month 11-12</strong> after the ramp.
              </p>
              <p>
                Every month after that, your 50% share is largely{" "}
                <strong className="text-white">passive return</strong> on a business someone else runs day to day.
              </p>
              <p className="text-white/50">
                Push price toward AED 15k and the same chart steepens dramatically - that's the upside the calculator
                above lets you explore.
              </p>
            </div>
          </Reveal>

          {/* Downside + buyout */}
          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <Reveal className="rounded-2xl border border-[#a3e635]/25 bg-[#a3e635]/[0.06] p-6">
              <ShieldCheck className="h-7 w-7 text-[#a3e635]" />
              <h3 className="mt-4 text-2xl font-black">The downside is still good.</h3>
              <p className="mt-3 leading-8 text-white/75">
                Even if volume only ever reaches <strong className="text-white">5 cars a week</strong> - half the target
                - at today's below-market AED 10k, the studio still nets roughly{" "}
                <strong className="text-white">AED 60k/month</strong>. Your share (~AED 30k/mo) returns the full capital
                in about <strong className="text-white">14 months</strong>. The floor pays; the upside is where it gets
                exciting.
              </p>
            </Reveal>
            <Reveal delay={90} className="rounded-2xl border border-[#f8b84e]/30 bg-[#f8b84e]/[0.07] p-6">
              <KeyRound className="h-7 w-7 text-[#f8b84e]" />
              <h3 className="mt-4 text-2xl font-black">A clean, quantified exit.</h3>
              <p className="mt-3 leading-8 text-white/75">
                Once capital is recovered, Sean can buy back your 50% at a pre-agreed multiple - for example{" "}
                <strong className="text-white">2.5x annual net profit</strong>. On the base case that's roughly a{" "}
                <strong className="text-white">{formatShort(buyoutValuation)}</strong> payout for your stake, on top of
                the profit already drawn. Trigger window and multiple to be agreed together.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ===================== THE ASK / USE OF FUNDS ===================== */}
      <section id="ask" className="scroll-mt-20 px-5 py-14 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <Reveal className="max-w-3xl">
            <SectionKicker color="#ef6345">The ask</SectionKicker>
            <h2 className="mt-4 text-4xl font-black uppercase leading-none sm:text-5xl">A lean first-year setup.</h2>
            <p className="mt-5 leading-8 text-white/70">
              Tools, equipment and consumables are already owned, and the fit-out comes at cost through the partner's own
              company - so this is far lighter than a normal workshop build. Rent is the only large line.
            </p>
          </Reveal>

          <Reveal className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-[#101010]">
            <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">Total investor ask</p>
                <p className="mt-2 text-5xl font-black text-white sm:text-6xl">AED 350-450k</p>
                <p className="mt-3 text-sm leading-6 text-white/55">
                  Midpoint model {formatShort(SETUP_TOTAL)}. Paint/prep capex is phased in later, outside this ask.
                </p>
              </div>
              <div>
                <p className="mb-3 text-xs uppercase tracking-[0.22em] text-white/45">Where it goes</p>
                <div className="flex h-6 w-full overflow-hidden rounded-full border border-white/10">
                  {costBuckets.map((line) => (
                    <div key={line.name} style={{ width: `${(line.value / SETUP_TOTAL) * 100}%`, background: line.color }} title={line.name} />
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-xs sm:grid-cols-3">
                  {costBuckets.map((line) => (
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
          </Reveal>

          {/* Already covered */}
          <Reveal className="mt-6">
            <p className="mb-4 text-sm font-bold uppercase tracking-[0.24em] text-[#a3e635]">
              Already covered - AED 0 to you
            </p>
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
          </Reveal>
        </div>
      </section>

      {/* ===================== 12-MONTH ROADMAP ===================== */}
      <section id="roadmap" className="scroll-mt-20 bg-[#0a0a0a] px-5 py-14 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <Reveal className="mb-8 max-w-3xl">
            <SectionKicker color="#42d6c9">The plan</SectionKicker>
            <h2 className="mt-4 text-4xl font-black uppercase leading-none sm:text-5xl">
              From signature to payback in 12 months.
            </h2>
            <p className="mt-5 leading-8 text-white/70">
              The capital has a clear path, not a wish list. Here's how the first year runs - from securing the unit to
              substantially recovering your investment.
            </p>
          </Reveal>

          <div className="relative grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {roadmap.map((step, i) => (
              <Reveal key={step.phase} delay={i * 70} className="relative rounded-2xl border border-white/10 bg-[#111] p-6">
                <div className="flex items-center justify-between">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-md"
                    style={{ background: `${step.color}1f`, color: step.color }}
                  >
                    <step.icon className="h-5 w-5" />
                  </div>
                  <span className="text-5xl font-black text-white/[0.07]">{i + 1}</span>
                </div>
                <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em]" style={{ color: step.color }}>
                  {step.phase}
                </p>
                <h3 className="mt-1 text-xl font-black">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/60">{step.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== PROOF: IMAGES + VIDEOS ===================== */}
      <section className="px-5 py-14 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <Reveal className="mb-6">
            <SectionKicker color="#f8b84e">The work</SectionKicker>
            <h2 className="mt-3 text-3xl font-black uppercase leading-none sm:text-4xl">
              Premium cars, already through the door.
            </h2>
          </Reveal>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {proofImages.map((image, i) => (
              <Reveal key={image.src} delay={i * 60} className="group relative overflow-hidden rounded-lg border border-white/10 bg-[#111]">
                <img src={image.src} alt={image.label} loading="lazy" className="aspect-[4/5] w-full object-cover transition duration-500 group-hover:scale-105" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-3">
                  <p className="text-xs font-bold text-white/85">{image.label}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal className="mb-8 mt-12">
            <SectionKicker color="#f8b84e">Proof assets</SectionKicker>
            <h2 className="mt-3 text-3xl font-black uppercase leading-none sm:text-4xl">Real handovers, not stock.</h2>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {handoverVideos.map((video, index) => (
              <Reveal key={video.videoSrc} delay={index * 70} className="overflow-hidden rounded-lg border border-white/10 bg-[#111]">
                <div className="relative">
                  <video className="aspect-square w-full bg-black object-cover" poster={video.posterSrc} muted loop playsInline preload="metadata" controls>
                    <source src={video.videoSrc} type="video/mp4" />
                  </video>
                </div>
                <div className="flex items-center justify-between gap-3 px-4 py-3.5">
                  <div className="min-w-0">
                    <p className="truncate text-base font-black">{video.title}</p>
                    <p className="mt-0.5 truncate text-sm text-white/60">{video.subtitle}</p>
                  </div>
                  <Play className="h-4 w-4 shrink-0 text-white/35" />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== THE DEAL STRUCTURE ===================== */}
      <section id="deal" className="scroll-mt-20 bg-[#0a0a0a] px-5 py-14 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <Reveal className="mb-8 max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white/65">
              <Sparkles className="h-4 w-4 text-[#f8b84e]" />
              Starting point, not final terms
            </div>
            <SectionKicker color="#f8b84e">The deal</SectionKicker>
            <h2 className="mt-4 text-4xl font-black uppercase leading-none sm:text-5xl">A simple, hands-off partnership.</h2>
            <p className="mt-5 leading-8 text-white/70">
              The idea is deliberately clean: the investor backs the build, Sean runs everything, and the upside is
              shared equally.
            </p>
          </Reveal>

          <Reveal className="mb-6 overflow-hidden rounded-2xl border border-white/10 bg-[#101010] p-6 sm:p-8">
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
          </Reveal>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Users, title: "50/50 ownership", body: "An equal partnership. Final structure agreed together.", color: "#f8b84e" },
              { icon: Banknote, title: "Investor funds the build", body: "You provide the capital. No day-to-day involvement required.", color: "#a3e635" },
              { icon: Rocket, title: "Sean runs everything", body: "Ops, marketing, sales, hiring and growth - genuinely hands-off for you.", color: "#42d6c9" },
              { icon: CircleDollarSign, title: "Salary only when earned", body: "Sean draws a salary only once revenue comfortably permits.", color: "#7dd3fc" },
            ].map((card, i) => (
              <Reveal key={card.title} delay={i * 70} className="rounded-lg border border-white/10 bg-[#111] p-6">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-md" style={{ background: `${card.color}1f`, color: card.color }}>
                  <card.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-black">{card.title}</h3>
                <p className="mt-2 text-sm leading-7 text-white/62">{card.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== FINAL CTA ===================== */}
      <section className="relative overflow-hidden px-5 py-16 sm:px-8 lg:px-10">
        <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_50%_120%,rgba(248,184,78,0.18),transparent_55%)]" />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative mx-auto max-w-7xl">
          <Reveal className="max-w-4xl">
            <SectionKicker color="#f8b84e">The ask in one line</SectionKicker>
            <h2 className="mt-4 text-4xl font-black uppercase leading-none sm:text-6xl">
              Fund a lean first year. Own half of a business that already works.
            </h2>
            <p className="mt-6 text-lg leading-8 text-white/74">
              AED 350k-450k to launch a PPF-first Dubai studio, on top of equipment, stock and a marketing engine that
              are already paid for. The demand is proven. The operator is proven. The only missing piece is the space.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <div className="rounded-lg border border-white/12 bg-black/40 px-5 py-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-white/45">Investor ask</p>
                <p className="mt-1 text-2xl font-black text-white">AED 350-450k</p>
              </div>
              <div className="rounded-lg border border-white/12 bg-black/40 px-5 py-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-white/45">Your profit share</p>
                <p className="mt-1 text-2xl font-black text-[#a3e635]">50% of net</p>
              </div>
              <div className="rounded-lg border border-white/12 bg-black/40 px-5 py-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-white/45">Capital back in</p>
                <p className="mt-1 text-2xl font-black text-[#42d6c9]">~{basePayback}-18 months</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
