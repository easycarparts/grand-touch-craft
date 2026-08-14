import { useCallback, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  ClipboardCheck,
  Layers,
  MessageCircle,
  QrCode,
  ShieldCheck,
} from "lucide-react";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LuxCard from "@/components/gtlux/LuxCard";
import { GtFaq, GtSection, GtStickyBar, GtTrustRow } from "@/components/gtlux/GtShared";
import { updatePageSEO } from "@/lib/seo";
import {
  BUSINESS,
  getFaqPageJsonLd,
  getLocalBusinessJsonLd,
  injectJsonLd,
  removeJsonLd,
} from "@/lib/business";
import { createFunnelTrackingContext, trackFunnelEvent } from "@/lib/funnel-analytics";
import {
  GT_CANON,
  GT_FAQ,
  GT_FILMS,
  GT_FILMS_LINE,
  GT_FILM_LADDER,
  GT_IMAGES,
  GT_WA,
  type GtFaqItem,
} from "@/lib/gtProgram";

const PAGE_URL = `${BUSINESS.url}/ppf-films-dubai`;

const JSONLD_BUSINESS_ID = "ppf-films-localbusiness";
const JSONLD_FAQ_ID = "ppf-films-faq";

/** The selection clause, one line — expanded in full further down the page. */
const SELECTION_CLAUSE_LINE =
  "We select the film that fits your car and your program — and you get both warranties.";

/** Above-the-fold risk reversal for the film question. */
const HERO_PROOF = [
  "Genuine film only — factory-sealed rolls, serial-traceable to the manufacturer",
  "The manufacturer's warranty registered to your car as standard",
  "The GT warranty on top of it — film and labour, in writing",
];

/** Mini FAQ: the film / why-pay-more / warranty questions from the canonical set. */
const FILM_FAQ_QUESTIONS = new Set([
  "What film brands do you use?",
  "What does the lifetime warranty actually cover?",
  "Another shop quoted me 7,000 for full body. Why pay 12,900?",
]);

const PAGE_FAQ: GtFaqItem[] = [
  ...GT_FAQ.filter((item) => FILM_FAQ_QUESTIONS.has(item.q)),
  {
    q: "Can I request a specific brand?",
    a: "Yes — within your tier's specification. The warranty is with us either way.",
  },
];

const SELECTION_POINTS = [
  {
    icon: Layers,
    title: "Fit to the car, not the invoice",
    body: "Paint, finish, colour and program decide the film — not whichever roll carries the biggest margin that week. That's what the roster is for.",
  },
  {
    icon: BadgeCheck,
    title: "Every film genuine",
    body: "Factory-sealed rolls, serial-traceable to the manufacturer. Scan the roll before we cut it — we'll hand you the box.",
  },
  {
    icon: ShieldCheck,
    title: "Two warranties, one car",
    body: "The manufacturer's warranty, registered to your car as standard — then the GT warranty on top, covering film and labour.",
  },
];

const VERIFY_STEPS = [
  {
    icon: QrCode,
    step: "01",
    title: "Scan the roll before it's cut",
    body: "Genuine film carries the manufacturer's QR code or serial on the roll and the box. Ask to scan it in front of the installer — it should resolve on the manufacturer's own website, not a reseller page. Any shop fitting genuine film will let you do this without hesitation.",
  },
  {
    icon: ClipboardCheck,
    step: "02",
    title: "Ask for the warranty registration",
    body: "A genuine install ends with the manufacturer's warranty registered against your car and confirmed in writing. Ask to see a past customer's registration confirmation before you book — if the shop can't produce one, the film warranty they're advertising may not exist.",
  },
  {
    icon: ShieldCheck,
    step: "03",
    title: "Do the maths on very cheap quotes",
    body: "A 6–7k full-body quote isn't automatically a con — but genuine flagship film has a real cost, and quotes far below it usually mean gray-market or unregistered rolls: real-looking plastic with no manufacturer standing behind it. If a quote is that low, the two checks above tell you exactly what you're buying.",
  },
];

/** Mid-page conversion band — one gold CTA, one quiet route deeper into the program. */
const CtaBand = ({
  eyebrow,
  title,
  body,
  waHref,
  waLabel,
  onWaClick,
  ghostTo,
  ghostLabel,
}: {
  eyebrow: string;
  title: string;
  body: string;
  waHref: string;
  waLabel: string;
  onWaClick: () => void;
  ghostTo: string;
  ghostLabel: string;
}) => (
  <section className="px-4 py-6 md:py-8">
    <div className="mx-auto max-w-5xl rounded-2xl border border-border/60 bg-[linear-gradient(120deg,hsl(0_0%_11%),hsl(0_0%_7%))] px-6 py-9 shadow-[0_30px_70px_-30px_hsl(0_0%_0%/0.9)] md:px-12 md:py-11">
      <div className="grid gap-7 md:grid-cols-[1.35fr_auto] md:items-center md:gap-12">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
            {eyebrow}
          </div>
          <h2 className="mt-2 !text-2xl leading-snug md:!text-[1.9rem]">{title}</h2>
          <p className="mt-3 max-w-lg text-[14px] leading-relaxed text-muted-foreground">{body}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row md:min-w-[15rem] md:flex-col">
          <a
            href={waHref}
            target="_blank"
            rel="noreferrer"
            onClick={onWaClick}
            className="inline-flex items-center justify-center rounded-md bg-primary px-7 py-3.5 text-center text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            <MessageCircle className="mr-2 h-4 w-4" aria-hidden />
            {waLabel}
          </a>
          <Link
            to={ghostTo}
            className="inline-flex items-center justify-center rounded-md border border-border px-7 py-3.5 text-center text-sm font-medium text-foreground transition hover:border-primary/60"
          >
            {ghostLabel}
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </div>
  </section>
);

const PpfFilmsDubai = () => {
  const funnelContext = useMemo(
    () =>
      createFunnelTrackingContext({
        funnelName: "ppf-films-dubai",
        landingPageVariant: "v1",
      }),
    [],
  );

  const trackWhatsAppClick = useCallback(
    (placement: string) => {
      trackFunnelEvent({
        eventName: "whatsapp_click",
        context: funnelContext,
        payload: { placement },
        metaStandardEvent: "Lead",
      });
    },
    [funnelContext],
  );

  useEffect(() => {
    trackFunnelEvent({ eventName: "page_view", context: funnelContext });
  }, [funnelContext]);

  useEffect(() => {
    updatePageSEO("ppf-films-dubai", {
      title: "PPF Film Dubai — Diamond Pro TPU & Diamond Pro X | What Grand Touch Uses",
      description:
        "The film at Grand Touch Dubai — Diamond Pro premium TPU on GT Signature and Diamond Pro X, the PCU flagship, on GT Concours, with Gyeon coatings. Every film genuine, the manufacturer's warranty registered to your car, and the GT warranty on top. Plus how to verify genuine film before any shop cuts it.",
      keywords:
        "Diamond Pro PPF Dubai, Diamond Pro X, PCU PPF film, Gyeon Dubai, best PPF film brand, genuine PPF film Dubai, PPF brands Dubai, paint protection film brands",
      ogTitle: "The Films We Use — and Why That's the Wrong Question | Grand Touch",
      ogDescription:
        "Diamond Pro premium TPU and Diamond Pro X (PCU flagship), with Gyeon coatings — genuine, registered to your car, backed by the GT warranty on top.",
      url: PAGE_URL,
      image: GT_IMAGES.cullinanPpf,
    });

    injectJsonLd(JSONLD_BUSINESS_ID, getLocalBusinessJsonLd());
    injectJsonLd(
      JSONLD_FAQ_ID,
      getFaqPageJsonLd(PAGE_FAQ.map((item) => ({ question: item.q, answer: item.a }))),
    );

    return () => {
      removeJsonLd(JSONLD_BUSINESS_ID, JSONLD_FAQ_ID);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background pb-20 text-foreground md:pb-0">
      <Navbar />
      <main>
        {/* ————— Hero — two columns: the argument left, the roster card right ————— */}
        <section className="relative isolate overflow-hidden">
          <div className="absolute inset-0 -z-10" aria-hidden>
            <img
              src={GT_IMAGES.cullinanPpf}
              alt=""
              className="h-full w-full object-cover opacity-[0.2] saturate-[0.6]"
              loading="eager"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,hsl(var(--background)/0.88),hsl(var(--background)/0.72)_45%,hsl(var(--background))_97%)]" />
          </div>

          <div className="mx-auto grid w-full max-w-5xl items-center gap-12 px-4 pb-16 pt-32 md:grid-cols-[1.08fr_0.92fr] md:gap-14 md:pb-24 md:pt-40">
            {/* Left — eyebrow, H1, sub, proof, CTAs */}
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
                Films &amp; materials — Diamond Pro
              </div>
              <h1 className="mt-4 !text-4xl leading-[1.08] sm:!text-5xl lg:!text-[3.4rem]">
                The films we use — and why that&rsquo;s the wrong question.
              </h1>
              <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-muted-foreground">
                {GT_FILMS_LINE}
              </p>

              <ul className="mt-7 space-y-2.5">
                {HERO_PROOF.map((line) => (
                  <li
                    key={line}
                    className="flex gap-3 text-[14px] leading-relaxed text-foreground/85"
                  >
                    <span
                      aria-hidden
                      className="mt-[7px] h-[9px] w-[9px] shrink-0 rotate-45 border border-primary/70 bg-primary/20"
                    />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <a
                  href={GT_WA.general}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => trackWhatsAppClick("hero")}
                  className="inline-flex items-center justify-center rounded-md bg-primary px-7 py-3.5 text-center text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                >
                  <MessageCircle className="mr-2 h-4 w-4" aria-hidden />
                  WhatsApp Sean
                </a>
                <Link
                  to="/ppf-dubai"
                  className="inline-flex items-center justify-center rounded-md border border-border px-7 py-3.5 text-center text-sm font-medium text-foreground transition hover:border-primary/60"
                >
                  See the three programs
                </Link>
              </div>

              <GtTrustRow className="mt-8 !justify-start" />
            </div>

            {/* Right — the roster at a glance */}
            <LuxCard className="w-full" as="section">
              <div className="p-6 md:p-7">
                <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  The film ladder
                </div>
                <ul className="mt-5 space-y-3.5">
                  {GT_FILMS.map((film) => (
                    <li key={film.name} className="flex items-center gap-3.5">
                      <span
                        aria-hidden
                        className="h-1.5 w-1.5 shrink-0 rotate-45 bg-primary/60"
                      />
                      <span className="text-[15px] font-medium uppercase tracking-[0.22em] text-foreground">
                        {film.name}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-6 border-t border-border/60 pt-5 text-[13px] leading-relaxed text-muted-foreground">
                  {SELECTION_CLAUSE_LINE}
                </p>
                <Link
                  to="/ppf-warranty-dubai"
                  className="mt-4 inline-flex items-center text-[12.5px] font-medium text-foreground/80 transition hover:text-primary"
                >
                  Read the GT Owner&rsquo;s Warranty
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" aria-hidden />
                </Link>
              </div>
            </LuxCard>
          </div>
        </section>

        {/* ————— Diamond Pro, in depth ————— */}
        <GtSection
          eyebrow="The film"
          title="Diamond Pro — chosen on data, not badge."
          sub="A Gulf company, established in Kuwait in 2018 with an office here in Dubai. This film was engineered for our summer, not adapted to it — and the film itself steps up with the tier."
        >
          <div className="mx-auto max-w-4xl">
            <LuxCard as="div">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] border-collapse text-left">
                  <thead>
                    <tr>
                      <th className="w-[18%] border-b border-border/60 p-4 align-bottom text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                        The film ladder
                      </th>
                      <th className="w-[41%] border-b border-border/60 p-4 align-bottom">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                          GT Signature · AED 12,900
                        </div>
                        <div className="mt-1.5 text-[19px] font-semibold text-foreground">
                          Diamond Pro{" "}
                          <span className="text-[13px] font-medium text-primary/90">Premium TPU</span>
                        </div>
                      </th>
                      <th className="w-[41%] border-b border-primary/50 bg-primary/[0.05] p-4 align-bottom">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
                          GT Concours · AED 18,900
                        </div>
                        <div className="mt-1.5 text-[19px] font-semibold text-foreground">
                          Diamond Pro X{" "}
                          <span className="text-[13px] font-medium text-primary">PCU Flagship</span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-[13.5px] leading-relaxed">
                    {GT_FILM_LADDER.map((row) => (
                      <tr key={row.label}>
                        <th className="border-b border-border/40 p-4 align-top text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          {row.label}
                        </th>
                        <td className="border-b border-border/40 p-4 align-top text-foreground/80">{row.tpu}</td>
                        <td className="border-b border-border/40 bg-primary/[0.04] p-4 align-top text-foreground/90">
                          {row.x}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="border-l-2 border-primary/60 bg-primary/[0.04] px-6 py-5 text-[14px] italic leading-relaxed text-foreground/85 md:px-8">
                Whichever film your tier wears, the GT warranty sits on top — film and labour, yellowing
                covered, no UV carve-out. Two documents, one car.
              </p>
            </LuxCard>

            <div className="mx-auto mt-10 max-w-3xl space-y-4 text-[14.5px] leading-relaxed text-muted-foreground">
              <p>
                <strong className="text-foreground">Why the chemistry matters here.</strong> Almost all PPF
                is TPU. Polyester-based TPU is vulnerable to hydrolysis — heat plus moisture. Polyether-based
                TPU oxidises and yellows under UV. Dubai is heat, humidity and UV, all year. Diamond Pro X
                swaps that soft segment for a polycarbonate backbone that resists both — the same polymer
                family long-term medical implants reach for, because it survives a hot, wet, oxidising
                environment for decades.
              </p>
              <p>
                The honest trade-off: PCU is a harder film, less forgiving on complex curves — which is an
                argument about the installer, not against the film. It&rsquo;s also why we&rsquo;ll never
                sell you film on thickness: every flagship film on the market is about the same thickness,
                so it settles nothing. Chemistry and evidence settle it.
              </p>
              <p className="text-xs">
                Which film goes on which car is decided by your program — see{" "}
                <Link
                  to="/ppf-dubai"
                  className="font-semibold text-foreground underline underline-offset-4 hover:text-primary"
                >
                  the Protection Program
                </Link>
                .
              </p>
            </div>
          </div>
        </GtSection>

        {/* ————— The selection clause ————— */}
        <GtSection
          eyebrow="The selection clause"
          title="We pick the film. You get both warranties."
          sub="The clause every quote should have in writing — here's ours, in plain English."
        >
          <LuxCard className="mx-auto max-w-3xl" as="article">
            <div className="p-7 md:p-10">
              <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                In plain English
              </div>
              <p className="mt-4 text-lg leading-relaxed text-foreground md:text-xl">
                Grand Touch selects the film that best fits your vehicle and your program from our
                certified roster. Every film we fit is genuine. We register the manufacturer&rsquo;s
                warranty to your car as standard — and the GT warranty sits on top of it, covering the
                whole job.
              </p>
              <div className="mt-8 grid gap-6 border-t border-border/60 pt-8 sm:grid-cols-3">
                {SELECTION_POINTS.map((point) => (
                  <div key={point.title}>
                    <point.icon className="h-5 w-5 text-primary" aria-hidden />
                    <h3 className="mt-3 !text-sm font-semibold text-foreground">{point.title}</h3>
                    <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                      {point.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </LuxCard>
        </GtSection>

        {/* ————— Mid-page conversion band ————— */}
        <CtaBand
          eyebrow="The short answer"
          title="Tell us the car. We'll tell you the film — and the price."
          body="The film brand warranties the plastic. We warranty the whole job, in writing, for as long as you own the car. Send your car and your week and Sean will tell you honestly which program fits."
          waHref={GT_WA.general}
          waLabel="WhatsApp Sean"
          onWaClick={() => trackWhatsAppClick("mid_band")}
          ghostTo="/ppf-dubai"
          ghostLabel="See the three programs"
        />

        {/* ————— How to verify genuine film ————— */}
        <GtSection
          eyebrow="Buyer's protection"
          title="How to verify genuine film — at any shop"
          sub="Three checks before anyone cuts film for your car. They take five minutes, and they work on us too."
        >
          <div className="grid gap-x-10 gap-y-10 md:grid-cols-3">
            {VERIFY_STEPS.map((item) => (
              <article key={item.step} className="flex h-full flex-col">
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
                    {item.step}
                  </span>
                  <span aria-hidden className="h-px flex-1 bg-border/70" />
                  <item.icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                </div>
                <h3 className="mt-4 !text-base font-semibold leading-snug text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2.5 text-[13.5px] leading-relaxed text-muted-foreground">
                  {item.body}
                </p>
              </article>
            ))}
          </div>
          <p className="mx-auto mt-10 max-w-2xl text-center text-sm italic leading-relaxed text-muted-foreground">
            &ldquo;{GT_CANON.askWorkmanship}&rdquo; Ours is a lifetime, and it&rsquo;s published word
            for word on{" "}
            <Link
              to="/ppf-warranty-dubai"
              className="not-italic font-semibold text-foreground underline underline-offset-4 hover:text-primary"
            >
              the GT Owner&rsquo;s Warranty page
            </Link>
            .
          </p>
        </GtSection>

        {/* ————— Mini FAQ ————— */}
        <GtSection eyebrow="Questions" title="Films, brands, and why pay more">
          <GtFaq items={PAGE_FAQ} />
        </GtSection>

        {/* ————— Closing CTA ————— */}
        <GtSection
          eyebrow="Next step"
          title="Send your car. We'll tell you which film — and why."
          sub={GT_CANON.closingSub}
          className="!pb-24 md:!pb-32"
        >
          <div className="flex flex-col items-center gap-6">
            <a
              href={GT_WA.general}
              target="_blank"
              rel="noreferrer"
              onClick={() => trackWhatsAppClick("closing")}
              className="inline-flex w-full items-center justify-center rounded-md bg-primary px-8 py-3.5 text-center text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 sm:w-auto"
            >
              <MessageCircle className="mr-2 h-4 w-4" aria-hidden />
              WhatsApp Sean
            </a>
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm">
              <Link
                to="/ppf-dubai"
                className="text-muted-foreground underline-offset-4 transition hover:text-foreground hover:underline"
              >
                Explore the Protection Program{" "}
                <ArrowRight className="inline h-3.5 w-3.5" aria-hidden />
              </Link>
              <Link
                to="/ppf-warranty-dubai"
                className="text-muted-foreground underline-offset-4 transition hover:text-foreground hover:underline"
              >
                Read the GT Owner&rsquo;s Warranty{" "}
                <ArrowRight className="inline h-3.5 w-3.5" aria-hidden />
              </Link>
            </div>
          </div>
        </GtSection>
      </main>
      <Footer />
      {/* Floating WhatsApp on desktop; sticky bar owns the bottom edge on mobile.
          Direct GT_WA link (tracked) instead of the site-wide BookServiceDialog bubble,
          so every WhatsApp path off this page uses the funnel number and fires analytics. */}
      <a
        href={GT_WA.general}
        target="_blank"
        rel="noreferrer"
        aria-label="Chat with Sean on WhatsApp"
        onClick={() => trackWhatsAppClick("floating_bubble")}
        className="fixed bottom-6 right-6 z-50 hidden h-14 w-14 items-center justify-center rounded-full bg-[#1f8350] text-white shadow-lg transition hover:bg-[#278f5a] md:flex"
      >
        <MessageCircle className="h-6 w-6" aria-hidden />
      </a>
      <GtStickyBar
        href={GT_WA.general}
        onClick={() => trackWhatsAppClick("sticky_bar")}
        anchorLine="Genuine film, registered"
        subLine="Both warranties — ours on top"
      />
    </div>
  );
};

export default PpfFilmsDubai;
