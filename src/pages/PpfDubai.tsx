import { useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, MessageCircle } from "lucide-react";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { HandoverReviewsCarousel } from "@/components/ppf/HandoverTrust";
import LuxCard from "@/components/gtlux/LuxCard";
import TierCardsGT from "@/components/gtlux/TierCardsGT";
import { WarrantyCertificateShowcase } from "@/components/gtlux/WarrantyCertificateGT";
import SmokeField from "@/components/gtlux/SmokeField";
import AskGrandTouch from "@/components/gtlux/AskGrandTouch";
import { GtFaq, GtSection, GtStickyBar, GtTrustRow } from "@/components/gtlux/GtShared";
import {
  GT_CANON,
  GT_FAQ,
  GT_IMAGES,
  GT_SIZE_NOTE,
  GT_TIERS,
  GT_WA,
  GT_WARRANTY,
  type GtTier,
  type GtTierKey,
} from "@/lib/gtProgram";
import { updatePageSEO } from "@/lib/seo";
import {
  getFaqPageJsonLd,
  getLocalBusinessJsonLd,
  getServiceJsonLd,
  injectJsonLd,
  removeJsonLd,
} from "@/lib/business";
import { createFunnelTrackingContext, trackFunnelEvent } from "@/lib/funnel-analytics";

const PAGE_URL = "https://www.grandtouchauto.ae/ppf-dubai";
const GOLD_GRADIENT = "linear-gradient(135deg, hsl(38 92% 58%), hsl(18 95% 58%))";
const JSONLD_IDS = ["ppf-dubai-business", "ppf-dubai-service", "ppf-dubai-faq"];

const fmt = (n: number) => n.toLocaleString("en-US");

/** One gold-filled CTA per viewport region — this is the only filled button style on the page. */
const goldCtaClass =
  "inline-flex items-center justify-center rounded-md px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg transition hover:opacity-90";
/** Everything else is a ghost — keeps gold scarce so it still reads as premium. */
const ghostCtaClass =
  "inline-flex items-center justify-center gap-2 rounded-md border border-border bg-white/[0.03] px-8 py-3.5 text-sm font-medium text-foreground transition hover:border-primary/60";

/** Signature carries the page's core promise, so the hero quotes it directly from the tier sheet. */
const SIGNATURE: GtTier = GT_TIERS.find((tier) => tier.featured) ?? GT_TIERS[1];
const ENTRY_PRICE = Math.min(...GT_TIERS.map((tier) => tier.fullBody));

/**
 * Above-the-fold proof. Every claim and number is read from gtProgram — never typed here.
 *
 * The lifetime warranty and the free panel replacement are GT Signature terms, so each one
 * carries its program name. Unscoped, they sit directly above the entry price and read as
 * "AED 7,900 buys a lifetime warranty" — but ENTRY_PRICE is GT Essential, which gtProgram
 * defines as a 5-year warranty with panelChip: null. That would also contradict the glance
 * card one column to the right, which prints each tier's real warrantyLine.
 */
const HERO_PROOF: { text: string; scope?: string }[] = [
  { text: SIGNATURE.warrantyLine, scope: SIGNATURE.name },
  ...(SIGNATURE.panelChip ? [{ text: SIGNATURE.panelChip, scope: SIGNATURE.name }] : []),
  { text: `Published prices — full body from AED ${fmt(ENTRY_PRICE)} +VAT` },
];

const PpfDubai = () => {
  /** The hero's smoke is emitted from this card's perimeter. */
  const certRef = useRef<HTMLDivElement | null>(null);
  const tracking = useMemo(
    () => createFunnelTrackingContext({ funnelName: "ppf-dubai", landingPageVariant: "v1" }),
    [],
  );

  useEffect(() => {
    updatePageSEO("ppf-dubai", {
      title:
        "PPF Dubai — The Grand Touch Protection Program | Lifetime Warranty & Real Prices",
      description:
        `Paint protection film in Dubai with real published prices: full body from AED ${fmt(ENTRY_PRICE)}, ${SIGNATURE.name} from ${fmt(SIGNATURE.fullBody)} with a written lifetime warranty on film and labour, plus no-fault panel replacement. Three programs, one install standard.`,
      keywords:
        "PPF Dubai, paint protection film Dubai, PPF price Dubai, PPF cost Dubai, PPF packages Dubai, lifetime PPF warranty Dubai, best PPF Dubai, full body PPF Dubai",
      ogTitle: "PPF in Dubai, backed for life — The Grand Touch Protection Program",
      ogDescription:
        `Three programs. Real prices. The GT Lifetime Warranty on ${SIGNATURE.name} and above — signed before you leave the bay. Full body from AED ${fmt(ENTRY_PRICE)} +VAT.`,
      url: PAGE_URL,
      image: GT_IMAGES.heroFallback,
    });

    injectJsonLd(JSONLD_IDS[0], getLocalBusinessJsonLd());
    injectJsonLd(
      JSONLD_IDS[1],
      getServiceJsonLd({
        name: "Paint Protection Film — GT Protection Program",
        serviceType: "Paint Protection Film installation",
        description:
          `Three PPF programs with published prices — ${GT_TIERS.map(
            (tier) => `${tier.name} full body from AED ${fmt(tier.fullBody)}`,
          ).join(", ")} — installed to the GT Install Standard in Dubai. ${SIGNATURE.name} and above carry the GT Lifetime Warranty on film and labour, plus no-fault panel replacement.`,
        url: PAGE_URL,
      }),
    );
    injectJsonLd(
      JSONLD_IDS[2],
      getFaqPageJsonLd(GT_FAQ.map((f) => ({ question: f.q, answer: f.a }))),
    );

    trackFunnelEvent({ eventName: "page_view", context: tracking });

    return () => removeJsonLd(...JSONLD_IDS);
  }, [tracking]);

  const trackWhatsApp = (placement: string, tier?: GtTierKey) => {
    trackFunnelEvent({
      eventName: "whatsapp_click",
      context: tracking,
      payload: { placement, tier },
      metaStandardEvent: "Lead",
    });
  };

  return (
    <div className="min-h-screen bg-background pb-20 text-foreground md:pb-0">
      <Navbar />
      <main>
        {/* 1 — HERO. No photograph: the certificate is the subject, smouldering into
            black. Smoke is emitted from the card's perimeter across the whole hero
            and reacts to the pointer. */}
        <section className="relative isolate overflow-hidden bg-[#050505] lg:flex lg:min-h-[88svh] lg:items-center">
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-[radial-gradient(120%_90%_at_72%_45%,hsl(38_92%_58%/0.07)_0%,transparent_55%)]"
          />
          <SmokeField emitterRef={certRef} className="-z-10" density={1} intensity={1} />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-40 bg-[linear-gradient(180deg,transparent,hsl(0_0%_8%))]"
          />

          <div className="relative mx-auto w-full max-w-5xl px-4 pb-16 pt-28 md:pb-24 md:pt-36">
            <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
              {/* Left — the promise */}
              <div className="max-w-xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">
                  The Grand Touch Protection Program
                </p>
                <h1 className="mt-4 !text-4xl !leading-[1.05] sm:!text-5xl lg:!text-6xl">
                  PPF in Dubai, backed for life.
                </h1>
                <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground md:text-lg">
                  Three programs. Real prices. A written lifetime warranty — signed before you leave
                  the bay.
                </p>

                <ul className="mt-7 space-y-3">
                  {HERO_PROOF.map((proof) => (
                    <li
                      key={proof.text}
                      className="flex gap-3 text-[13.5px] leading-relaxed text-foreground/85"
                    >
                      <span
                        aria-hidden
                        className="mt-[7px] h-[9px] w-[9px] shrink-0 rotate-45 border border-primary/70 bg-primary/20"
                      />
                      <span>
                        {proof.text}
                        {proof.scope && (
                          <span className="whitespace-nowrap text-muted-foreground">
                            {" "}
                            · {proof.scope}
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                  <a
                    href={GT_WA.general}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => trackWhatsApp("hero")}
                    className={`${goldCtaClass} w-full sm:w-auto`}
                    style={{ background: GOLD_GRADIENT }}
                  >
                    WhatsApp Sean
                  </a>
                  <a href="#ask" className={`${ghostCtaClass} w-full sm:w-auto`}>
                    Ask a question
                  </a>
                </div>
                <a
                  href="#programs"
                  className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-primary transition hover:underline"
                >
                  Or see the three programs and prices
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </a>

                <GtTrustRow className="mt-8 !justify-start" />
              </div>

              {/* Right — the certificate, alone. It is the thing no competitor can quote
                  against, so nothing shares the hero with it. Prices live in the left
                  column's proof line and in the programs section directly below. */}
              <div className="w-full">
                <WarrantyCertificateShowcase smoke={false} innerRef={certRef} />
              </div>
            </div>
          </div>
        </section>

        {/* 2 — THE THREE PROGRAMS. Price comes straight after the promise: the
            whole positioning is price transparency, so nothing sits between the
            hero and the numbers. */}
        <GtSection
          id="programs"
          className="scroll-mt-24"
          eyebrow="The three programs"
          title="Real prices. Pick your level of cover."
          sub="Every price below is real and +VAT — not bait, and the same whatever you drive."
        >
          <TierCardsGT onTierCta={(tier) => trackWhatsApp("tier_card", tier)} />

          {/* One price, every car — a positioning statement, not a footnote.
              Most Dubai shops load 10-25% onto a large SUV. We do not. */}
          <p className="mx-auto mt-10 max-w-2xl rounded-lg border border-primary/25 bg-primary/[0.05] px-5 py-4 text-center text-[13.5px] leading-relaxed text-foreground/85">
            {GT_SIZE_NOTE}
          </p>
        </GtSection>

        {/* 3 — PROOF, immediately after price. A number this size needs faces
            behind it before the reader decides anything: named owners, real
            cars, the proven carousel from the quote funnel. */}
        <GtSection
          eyebrow="Proof"
          title="Real owners. Real cars."
          sub="Handover day, every week. Swipe through — the centre clip plays, tap it for sound."
        >
          <HandoverReviewsCarousel />

          <div className="mx-auto mt-10 max-w-xl text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
              Your car next
            </p>
            <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
              Every handover ends the same way — a walkaround of every edge, then a signed
              certificate.
            </p>
            <div className="mt-5 flex justify-center">
              <a
                href={GT_WA.general}
                target="_blank"
                rel="noreferrer"
                onClick={() => trackWhatsApp("proof_section")}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-white/[0.03] px-5 py-3 text-[13px] font-medium text-foreground transition hover:border-primary/60"
              >
                <MessageCircle className="h-3.5 w-3.5" aria-hidden />
                Ask Sean about your car
              </a>
            </div>
          </div>
        </GtSection>


        {/* 3 — THE GT LIFETIME WARRANTY
            The certificate itself now leads the hero, so this section carries the
            plain-English promise and the route to the full terms, with Sean's
            photo as the human counterpart rather than a second certificate. */}
        <section className="mx-auto w-full max-w-5xl px-4 py-14 md:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
            <div className="relative overflow-hidden rounded-xl">
              <img
                src={GT_IMAGES.seanWith911}
                alt="Sean handing over a protected Porsche 911 at the Grand Touch studio in Dubai"
                width={900}
                height={1100}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_45%,hsl(0_0%_8%/0.85)_100%)]"
              />
              <p className="absolute inset-x-0 bottom-0 p-5 text-[12.5px] leading-relaxed text-white/85">
                Every certificate is signed at handover — and honoured at every inspection after it.
              </p>
            </div>
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
                The GT Lifetime Warranty
              </p>
              <h2 className="!text-3xl md:!text-4xl">{GT_WARRANTY.headline}</h2>
              <ul className="mt-6 space-y-4">
                {GT_WARRANTY.bullets.map((bullet) => (
                  <li
                    key={bullet}
                    className="flex gap-3 text-sm leading-relaxed text-muted-foreground"
                  >
                    <span
                      aria-hidden
                      className="mt-[7px] h-[9px] w-[9px] shrink-0 rotate-45 border border-primary/70 bg-primary/20"
                    />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/ppf-warranty-dubai"
                  className="inline-flex items-center justify-center gap-2 rounded-md border-2 border-primary/70 px-8 py-3.5 text-sm font-semibold text-foreground transition hover:border-primary hover:bg-primary/10"
                >
                  Read the full warranty — word for word
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            </div>
          </div>

          {/* WHO BACKS YOUR CAR — the market context that makes "lifetime, film
              AND labour" land. Hedged, verified market norms; no shop named. */}
          <div className="mt-12 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border/60 bg-white/[0.02] px-5 py-5">
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                The typical shop
              </div>
              <p className="mt-2.5 text-[13px] leading-relaxed text-muted-foreground">
                A 1-year workmanship warranty is the market norm — and it's often verbal.
              </p>
            </div>
            <div className="rounded-xl border border-border/60 bg-white/[0.02] px-5 py-5">
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                The film brand
              </div>
              <p className="mt-2.5 text-[13px] leading-relaxed text-muted-foreground">
                Manufacturing defects in the film only. UV and heat yellowing is often carved
                out, and the labour is often yours.
              </p>
            </div>
            <div
              className="rounded-xl border border-primary/60 px-5 py-5"
              style={{
                background:
                  "radial-gradient(120% 120% at 50% 0%, hsl(38 60% 20% / .3), transparent 60%), hsl(0 0% 8%)",
              }}
            >
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-primary">
                Grand Touch
              </div>
              <p className="mt-2.5 text-[13px] leading-relaxed text-foreground/90">
                Lifetime. Film <b className="font-semibold">and</b> labour. Yellowing covered.
                Signed, numbered, and honoured at every inspection.
              </p>
            </div>
          </div>
        </section>

        {/* 5 — ASK GRAND TOUCH. Sits AFTER the warranty on purpose: this is
            where real questions form, and the assistant is the objection-killer
            that turns them into a number instead of an exit. */}
        <section id="ask" className="scroll-mt-24 px-4 py-14 md:py-20">
          <div
            className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl border border-primary/20 px-6 py-10 md:px-12 md:py-14"
            style={{
              background:
                "radial-gradient(120% 100% at 15% 0%, hsl(38 60% 20% / .28), transparent 55%), linear-gradient(165deg, hsl(0 0% 11%), hsl(0 0% 7%))",
              boxShadow: "0 40px 100px -40px hsl(0 0% 0%), inset 0 1px 0 hsl(0 0% 100% / .06)",
            }}
          >
            <div className="grid items-center gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-14">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">
                  Ask Grand Touch
                </p>
                <h2 className="mt-4 !text-3xl !leading-[1.1] md:!text-4xl">
                  Ask anything.
                  <br />
                  Get a straight answer.
                </h2>
                <p className="mt-5 max-w-md text-[15px] leading-relaxed text-muted-foreground">
                  Real prices, what the warranty actually covers, the films we fit, how long it
                  takes, where we are. No form, no callback queue, no "DM for price".
                </p>

                <ul className="mt-7 space-y-3">
                  {[
                    "Published prices for your exact program",
                    "The warranty explained clause by clause",
                    "Which film goes on your car, and why",
                  ].map((line) => (
                    <li key={line} className="flex gap-3 text-[13.5px] text-muted-foreground">
                      <span
                        aria-hidden
                        className="mt-[3px] flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary"
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2">
                          <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                      {line}
                    </li>
                  ))}
                </ul>

                <a
                  href={GT_WA.general}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => trackWhatsApp("ask_section")}
                  className="mt-8 inline-flex items-center gap-2 text-[13px] font-medium text-muted-foreground underline underline-offset-4 transition hover:text-foreground"
                >
                  <MessageCircle className="h-3.5 w-3.5" aria-hidden />
                  Prefer a human? Message Sean on WhatsApp
                </a>
              </div>

              <AskGrandTouch
                onFirstMessage={() =>
                  trackFunnelEvent({
                    eventName: "assistant_opened",
                    context: tracking,
                    payload: { placement: "pillar_ask_section" },
                  })
                }
                onLeadCaptured={() =>
                  trackFunnelEvent({
                    eventName: "assistant_lead_captured",
                    context: tracking,
                    payload: { placement: "pillar_ask_section" },
                    metaStandardEvent: "Lead",
                  })
                }
              />
            </div>
          </div>
        </section>

        {/* 4 — MID-PAGE CTA BAND. Text-led, no urgency: keeps WhatsApp under one scroll all page. */}
        <section className="border-y border-white/[0.06] bg-[linear-gradient(180deg,hsl(0_0%_11%),hsl(0_0%_7%))]">
          <div className="mx-auto flex w-full max-w-5xl flex-col items-start gap-7 px-4 py-12 md:flex-row md:items-center md:justify-between md:py-14">
            <div className="max-w-xl">
              <h2 className="!text-2xl md:!text-[1.75rem]">Send your car. Get the honest answer.</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Make, model and the week you can leave it with us. Sean tells you which program
                actually fits your car — and the exact figure — before you commit to anything.
              </p>
            </div>
            <a
              href={GT_WA.general}
              target="_blank"
              rel="noreferrer"
              onClick={() => trackWhatsApp("mid_page_band")}
              className={`${goldCtaClass} w-full shrink-0 md:w-auto`}
              style={{ background: GOLD_GRADIENT }}
            >
              WhatsApp Sean
            </a>
          </div>
        </section>

        {/* 7 — THE HONEST BIT */}
        <section className="mx-auto w-full max-w-5xl px-4 py-14 md:py-20">
          <div className="grid items-center gap-10 md:grid-cols-[0.9fr_1.1fr] md:gap-14">
            <div className="relative overflow-hidden rounded-lg">
              <img
                src={GT_IMAGES.seanWithPatrols}
                alt="Sean, founder of Grand Touch, with two protected Nissan Patrols at the Dubai studio"
                width={800}
                height={1000}
                loading="lazy"
                className="aspect-[4/5] w-full object-cover"
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"
              />
            </div>
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
                The honest bit
              </p>
              <h2 className="!text-3xl md:!text-4xl">{GT_CANON.notCheapest}</h2>
              <p className="mt-5 text-sm leading-relaxed text-muted-foreground md:text-base">
                A 7,000 dirham full-body quote is real — for what it is: value film, tucked edges,
                a one-year workmanship warranty, often no registered manufacturer warranty at all.
                It's a different product. If price is the deciding factor, take it, genuinely. If
                the car matters, read our warranty first.
              </p>
              <p className="mt-6">
                <Link
                  to="/ppf-installation-process"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  How to judge any shop's PPF in 5 minutes{" "}
                  <ArrowRight className="inline h-4 w-4" aria-hidden />
                </Link>
              </p>
            </div>
          </div>
        </section>

        {/* 8 — GO DEEPER. One deliberate exit point instead of small links
            scattered through every section: everything above this line closes,
            and this band serves the reader who needs the depth before they
            message. Three big, unmistakable doors. */}
        <GtSection
          eyebrow="Go deeper"
          title="Everything, published."
          sub="No secrets, no fine print you can't read. The three pages that most shops never dare to publish."
        >
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                to: "/ppf-warranty-dubai",
                kicker: "The warranty",
                title: "Every clause, word for word",
                body: "The full terms in plain English and in full — and the signed certificate they come on.",
              },
              {
                to: "/ppf-installation-process",
                kicker: "The install",
                title: "How a GT car is done",
                body: "Six steps, no jargon — plus how to judge any shop's PPF work in five minutes.",
              },
              {
                to: "/ppf-films-dubai",
                kicker: "The films",
                title: "The certified roster",
                body: "What we fit, how we choose it per car, and how to verify genuine film before anyone cuts.",
              },
            ].map((door) => (
              <Link
                key={door.to}
                to={door.to}
                className="group relative overflow-hidden rounded-2xl border border-border/70 px-7 py-8 transition hover:border-primary/60"
                style={{ background: "linear-gradient(165deg, hsl(0 0% 11%), hsl(0 0% 7%))" }}
              >
                <div className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-primary">
                  {door.kicker}
                </div>
                <div className="mt-3 text-[19px] font-semibold leading-snug text-foreground">
                  {door.title}
                </div>
                <p className="mt-2.5 text-[13px] leading-relaxed text-muted-foreground">{door.body}</p>
                <span className="mt-6 inline-flex items-center gap-2 text-[13px] font-semibold text-foreground transition group-hover:text-primary">
                  Read it
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
                </span>
              </Link>
            ))}
          </div>
        </GtSection>

        {/* 9 — FAQ */}
        <GtSection eyebrow="Questions" title="Straight answers">
          <GtFaq />
        </GtSection>

        {/* 10 — CLOSING CTA */}
        <section className="mx-auto w-full max-w-3xl px-4 py-14 pb-24 text-center md:py-20 md:pb-32">
          <h2 className="!text-3xl md:!text-4xl lg:!text-5xl">{GT_CANON.fifteenCars}</h2>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground md:text-base">
            {GT_CANON.closingSub}
          </p>
          <a
            href={GT_WA.general}
            target="_blank"
            rel="noreferrer"
            onClick={() => trackWhatsApp("closing_cta")}
            className={`${goldCtaClass} mt-8 px-10 py-4`}
            style={{ background: GOLD_GRADIENT }}
          >
            WhatsApp Sean
          </a>
        </section>
      </main>

      {/* 11 — STICKY MOBILE BAR. anchorLine passed explicitly so the price tracks
          gtProgram instead of GtShared's hardcoded default. */}
      <GtStickyBar
        href={GT_WA.general}
        onClick={() => trackWhatsApp("sticky_bar")}
        anchorLine={`From AED ${fmt(ENTRY_PRICE)}`}
      />
      <Footer />
      <a
        href={GT_WA.general}
        target="_blank"
        rel="noreferrer"
        onClick={() => trackWhatsApp("floating_button")}
        aria-label="Chat with Sean on WhatsApp"
        className="fixed bottom-6 right-6 z-50 hidden h-14 w-14 items-center justify-center rounded-full bg-[#1f8350] text-white shadow-lg transition hover:bg-[#278f5a] md:flex"
      >
        <MessageCircle className="h-6 w-6" aria-hidden />
      </a>
    </div>
  );
};

export default PpfDubai;
