import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowRight, MessageCircle } from "lucide-react";
import LuxCard from "@/components/gtlux/LuxCard";
import { GtSection, GtStickyBar, GtTrustRow } from "@/components/gtlux/GtShared";
import { updatePageSEO } from "@/lib/seo";
import {
  BUSINESS,
  getLocalBusinessJsonLd,
  injectJsonLd,
  removeJsonLd,
} from "@/lib/business";
import {
  createFunnelTrackingContext,
  trackFunnelEvent,
} from "@/lib/funnel-analytics";
import {
  GT_CANON,
  GT_IMAGES,
  GT_INSTALL_STANDARD,
  GT_PROCESS_STEPS,
  GT_TIERS,
  GT_WA,
  gtWhatsAppLink,
} from "@/lib/gtProgram";

const PAGE_URL = `${BUSINESS.url}/ppf-installation-process`;

const EDGE_INSPECTION_WA = gtWhatsAppLink(
  "Hi Sean — I'd like the free 5-minute edge inspection.",
);

type JourneyStep = (typeof GT_PROCESS_STEPS)[number];

/** Two extra steps written in the same outcome voice as GT_PROCESS_STEPS. */
const TRIPLE_CHECK_STEP: JourneyStep = {
  title: "Triple-checked before handover",
  body: "Under proper light, three separate passes: the installer signs off each panel, a second pair of eyes walks the whole car, then Sean does the final walk. If a single edge isn't right, it's redone — the car doesn't leave until it is.",
  image: GT_IMAGES.heroFallback,
};

const FIRST_INSPECTION_STEP: JourneyStep = {
  title: "Your first inspection visit",
  body: "After handover, you bring the car back — every program books it in. On Signature and Concours it's a wash and inspection at six and twelve months, then yearly, free for as long as you own the car — the twenty minutes that keep your lifetime cover active. On Essential it's a health check at month twelve. We walk every edge again and stamp your warranty record. Most shops hope they never see the car again. We book to see yours.",
  image: GT_IMAGES.seanWithPatrols,
};

const JOURNEY_STEPS: JourneyStep[] = [
  ...GT_PROCESS_STEPS.slice(0, 3),
  TRIPLE_CHECK_STEP,
  ...GT_PROCESS_STEPS.slice(3),
  FIRST_INSPECTION_STEP,
];

/** Entry price comes off the tier sheet — never hardcode a number on a page. */
const GT_FROM_PRICE = Math.min(...GT_TIERS.map((tier) => tier.fullBody));

/** Above-the-fold risk reversal: what the install standard actually buys you. */
const HERO_PROOF = [
  "Paint prepared to showroom standard before any film touches the car",
  "Edges wrapped out of sight, then triple-checked under proper light",
  `Film and labour covered in writing — on every program, from AED ${GT_FROM_PRICE.toLocaleString("en-US")}`,
];

const EDGE_CHECKLIST = [
  {
    title: "Run your finger along an edge",
    body: "On a proper install the film disappears into the panel gap — your finger falls off the panel without ever finding a line. A ridge you can catch a nail on means the edge was cut short and left sitting on the paint.",
  },
  {
    title: "Look at the panel gaps",
    body: "At the bonnet and the doors, you should see film curling out of sight into the gap — not a straight cut line sitting proud on the paint an inch from the edge.",
  },
  {
    title: "Ask for the workmanship warranty — in writing",
    body: "Not the film brochure. The shop's own cover on the install itself. The usual answer is one year, verbal. If it isn't a signed document, it isn't a warranty.",
  },
  {
    title: "Ask for warranty registration proof",
    body: "Genuine film comes with a manufacturer's warranty registered to your car. If a shop can't show you a registration, question the film itself.",
  },
  {
    title: "Look at the door jambs",
    body: "Open a door. The jambs are where a rushed job saves an hour. If they're covered, they should look like the bonnet — clean edges, no bunching. If a quote skips them without saying so, ask what else it skips.",
  },
];

/** Mid-page conversion band — one gold CTA, one quiet route into the warranty. */
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
          <p className="mt-3 max-w-lg text-[14px] leading-relaxed text-muted-foreground">
            {body}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row md:flex-col md:min-w-[15rem]">
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

const PpfInstallationProcess = () => {
  const trackingContext = useMemo(
    () =>
      createFunnelTrackingContext({
        funnelName: "ppf-installation-process",
        landingPageVariant: "v1",
      }),
    [],
  );

  useEffect(() => {
    trackFunnelEvent({
      eventName: "page_view",
      context: trackingContext,
    });
  }, [trackingContext]);

  useEffect(() => {
    updatePageSEO("ppf-installation-process", {
      title:
        "PPF Installation Process Dubai — How Grand Touch Installs | GT Install Standard",
      description:
        "How a Grand Touch car is done: paint prepared to showroom standard, film precision-cut for your exact model, edges wrapped out of sight, triple-checked before handover. Plus how to judge any shop's PPF in 5 minutes.",
      keywords:
        "PPF installation Dubai, how is PPF installed, PPF installation process, PPF edges peeling, bad PPF installation, paint protection film install Dubai, GT Install Standard",
      ogTitle: "How a Grand Touch car is done — the GT Install Standard",
      ogDescription:
        "The full journey of one car through the studio, and the 5-minute edge test that tells you the truth about any shop's PPF.",
      url: PAGE_URL,
      image: GT_IMAGES.installDetail,
    });

    injectJsonLd("gt-process-local-business", getLocalBusinessJsonLd());

    injectJsonLd("gt-howto", {
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: "The GT Install Standard",
      description: GT_INSTALL_STANDARD,
      image: `${BUSINESS.url}${GT_IMAGES.installDetail}`,
      step: JOURNEY_STEPS.map((step, index) => ({
        "@type": "HowToStep",
        position: index + 1,
        name: step.title,
        text: step.body,
        image: `${BUSINESS.url}${step.image}`,
      })),
    });

    return () => {
      removeJsonLd("gt-process-local-business", "gt-howto");
    };
  }, []);

  const handleWhatsAppClick = (placement: string) => {
    trackFunnelEvent({
      eventName: "whatsapp_click",
      context: trackingContext,
      payload: { placement },
      metaStandardEvent: "Lead",
    });
  };

  return (
    <div className="min-h-screen bg-background pb-24 text-foreground md:pb-0">
      <Navbar />

      <main>
        {/* ————— Hero — two columns: the promise left, the summary card right ————— */}
        <section className="relative isolate overflow-hidden">
          <div className="absolute inset-0 -z-10" aria-hidden>
            <img
              src={GT_IMAGES.installDetail}
              alt=""
              loading="eager"
              className="h-full w-full object-cover opacity-[0.22] saturate-[0.6]"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,hsl(var(--background)/0.88),hsl(var(--background)/0.72)_45%,hsl(var(--background))_97%)]" />
          </div>

          <div className="mx-auto grid w-full max-w-5xl items-center gap-12 px-4 pb-16 pt-32 md:grid-cols-[1.08fr_0.92fr] md:gap-14 md:pb-24 md:pt-40">
            {/* Left — eyebrow, H1, sub, proof, CTAs */}
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
                The GT Install Standard
              </div>
              <h1 className="mt-4 !text-4xl leading-[1.08] sm:!text-5xl lg:!text-[3.4rem]">
                How a Grand Touch car is done.
              </h1>
              <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-muted-foreground">
                Most bad PPF isn&rsquo;t bad film — it&rsquo;s a rushed install.
                This is the journey every car takes through our studio, whichever{" "}
                <Link
                  to="/ppf-dubai"
                  className="text-foreground underline decoration-primary/50 underline-offset-4 transition hover:decoration-primary"
                >
                  Grand Touch program
                </Link>{" "}
                you choose.
              </p>

              <ul className="mt-7 space-y-2.5">
                {HERO_PROOF.map((line) => (
                  <li key={line} className="flex gap-3 text-[14px] leading-relaxed text-foreground/85">
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
                  onClick={() => handleWhatsAppClick("hero")}
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

            {/* Right — what the install actually includes */}
            <LuxCard className="w-full" as="section">
              <div className="p-6 md:p-7">
                <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  What a GT install includes
                </div>
                <ol className="mt-5 space-y-4">
                  {GT_PROCESS_STEPS.map((step, index) => (
                    <li key={step.title} className="flex gap-3.5">
                      <span
                        aria-hidden
                        className="mt-[1px] w-5 shrink-0 text-[11px] font-semibold tabular-nums text-primary"
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="text-[14px] leading-snug text-foreground/90">
                        {step.title}
                      </span>
                    </li>
                  ))}
                </ol>

                <div className="mt-6 border-t border-border/60 pt-5">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    Days in the studio
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-3">
                    {GT_TIERS.map((tier) => (
                      <div key={tier.key}>
                        <div className="text-xl font-semibold text-foreground">
                          {tier.daysInStudio}
                          <span className="ml-1 text-[11px] font-normal text-muted-foreground">
                            {tier.daysInStudio === 1 ? "day" : "days"}
                          </span>
                        </div>
                        <div className="mt-0.5 text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">
                          {tier.name.replace("GT ", "")}
                        </div>
                      </div>
                    ))}
                  </div>
                  <Link
                    to="/ppf-dubai"
                    className="mt-5 inline-flex items-center text-[12.5px] font-medium text-foreground/80 transition hover:text-primary"
                  >
                    Compare the three programs
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" aria-hidden />
                  </Link>
                </div>
              </div>
            </LuxCard>
          </div>
        </section>

        {/* ————— The journey — alternating rows, generous whitespace ————— */}
        <GtSection
          eyebrow="The journey of one car"
          title="Six steps. No shortcuts."
          sub={GT_INSTALL_STANDARD}
        >
          <div className="mt-4 space-y-16 md:space-y-24">
            {JOURNEY_STEPS.map((step, index) => {
              const reversed = index % 2 === 1;
              return (
                <div
                  key={step.title}
                  className="grid items-center gap-8 md:grid-cols-2 md:gap-14"
                >
                  <div className={reversed ? "md:order-2" : ""}>
                    <div className="relative overflow-hidden rounded-2xl border border-border/40">
                      <img
                        src={step.image}
                        alt={`${step.title} — PPF installation at Grand Touch, Dubai`}
                        loading="lazy"
                        className="aspect-[4/3] w-full object-cover brightness-[.85] saturate-[.9]"
                      />
                      <div
                        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent"
                        aria-hidden
                      />
                    </div>
                  </div>
                  <div className={reversed ? "md:order-1" : ""}>
                    <div className="mb-3 flex items-center gap-3">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
                        Step {String(index + 1).padStart(2, "0")}
                      </span>
                      <span aria-hidden className="h-px w-10 bg-primary/30" />
                    </div>
                    <h3 className="!text-2xl font-semibold leading-tight text-foreground md:!text-[1.75rem]">
                      {step.title}
                    </h3>
                    <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted-foreground">
                      {step.body}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </GtSection>

        {/* ————— Mid-page conversion band — carries the warranty link ————— */}
        <CtaBand
          eyebrow="Every step, in writing"
          title="The install is the product. The warranty is the proof."
          body="Every step above is covered by the GT Owner's Warranty — film and labour, signed before you drive away. The full terms are published word for word. Send your car and your week and Sean will tell you honestly which program fits."
          waHref={GT_WA.general}
          waLabel="WhatsApp Sean"
          onWaClick={() => handleWhatsAppClick("mid_band")}
          ghostTo="/ppf-warranty-dubai"
          ghostLabel="Read the warranty"
        />

        {/* ————— The 5-minute edge test ————— */}
        <GtSection
          eyebrow="The edge-check challenge"
          title="How to judge ANY shop's PPF in 5 minutes"
          sub="You don't need to be an installer to spot a rushed job. Five checks, no tools, no appointment. Use them on our work too."
        >
          <LuxCard className="mx-auto max-w-4xl" as="article">
            <div className="p-7 md:p-9">
              <ol className="grid gap-7 md:grid-cols-2 md:gap-x-10 md:gap-y-8">
                {EDGE_CHECKLIST.map((item, index) => (
                  <li key={item.title} className="flex gap-4">
                    <span
                      aria-hidden
                      className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary/50 text-[13px] font-semibold text-primary"
                    >
                      {index + 1}
                    </span>
                    <div>
                      <h3 className="!text-[15.5px] font-semibold leading-snug text-foreground">
                        {item.title}
                      </h3>
                      <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted-foreground">
                        {item.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="mt-9 border-t border-border/60 pt-6 text-center text-[13px] leading-relaxed text-muted-foreground">
                Score any quote against those five — including ours.{" "}
                {GT_CANON.askWorkmanship} Ours is a lifetime, and it&rsquo;s
                published word for word on{" "}
                <Link
                  to="/ppf-warranty-dubai"
                  className="text-foreground underline decoration-primary/50 underline-offset-4 transition hover:decoration-primary"
                >
                  the GT Owner&rsquo;s Warranty page
                </Link>
                .
              </p>
            </div>
          </LuxCard>
        </GtSection>

        {/* ————— The standing offer — the lead magnet, full theatre ————— */}
        <section className="px-4 py-14 md:py-20">
          <LuxCard pinstripe className="mx-auto max-w-3xl" as="article">
            <div className="px-6 py-11 text-center md:px-14 md:py-14">
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
                The standing offer
              </div>
              <h2 className="mx-auto mt-4 max-w-xl !text-3xl leading-[1.12] md:!text-[2.6rem]">
                A{" "}
                <span className="gtlux-foil gtlux-foil-text">
                  free 5-minute
                </span>{" "}
                edge inspection.
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
                Already have PPF — from us or anyone else? Bring the car. We
                walk the edges with you, show you exactly what we see, and tell
                you the truth — even when the truth is &ldquo;this is a good
                install, leave it alone.&rdquo; Five minutes and you&rsquo;ll
                know what you&rsquo;re driving on.
              </p>

              <div className="mx-auto mt-8 flex max-w-md flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                <span>No charge</span>
                <span aria-hidden className="h-1 w-1 rotate-45 bg-primary/60" />
                <span>No pitch</span>
                <span aria-hidden className="h-1 w-1 rotate-45 bg-primary/60" />
                <span>No appointment drama</span>
              </div>

              <a
                href={EDGE_INSPECTION_WA}
                target="_blank"
                rel="noreferrer"
                onClick={() => handleWhatsAppClick("edge_inspection")}
                className="mt-9 inline-flex items-center justify-center rounded-md bg-primary px-9 py-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
              >
                <MessageCircle className="mr-2 h-4 w-4" aria-hidden />
                Book the free edge inspection
              </a>
            </div>
          </LuxCard>
        </section>

        {/* ————— Closing CTA ————— */}
        <GtSection
          eyebrow="Next step"
          title={GT_CANON.fifteenCars}
          sub={GT_CANON.closingSub}
          className="!pb-24 md:!pb-32"
        >
          <div className="flex flex-col items-center gap-6">
            <a
              href={GT_WA.general}
              target="_blank"
              rel="noreferrer"
              onClick={() => handleWhatsAppClick("closing")}
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
                Compare the three programs{" "}
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
      {/* Floating bubble desktop-only: GtStickyBar owns the mobile bottom edge.
          Direct GT_WA link + tracking — never the untracked BookServiceDialog. */}
      <a
        href={GT_WA.general}
        target="_blank"
        rel="noreferrer"
        onClick={() => handleWhatsAppClick("floating_bubble")}
        aria-label="Chat with Sean on WhatsApp"
        className="fixed bottom-6 right-6 z-50 hidden h-14 w-14 items-center justify-center rounded-full bg-[#1f8350] text-white shadow-lg transition hover:bg-[#278f5a] md:flex"
      >
        <MessageCircle className="h-6 w-6" aria-hidden />
      </a>
      <GtStickyBar
        href={GT_WA.general}
        onClick={() => handleWhatsAppClick("sticky_bar")}
        anchorLine="Free 5-minute edge inspection"
        subLine="Any car, any shop's PPF — no charge"
      />
    </div>
  );
};

export default PpfInstallationProcess;
