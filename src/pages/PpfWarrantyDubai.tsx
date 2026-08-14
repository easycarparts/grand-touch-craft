import { useEffect, useMemo, useRef, type CSSProperties } from "react";

import { MessageCircle } from "lucide-react";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { WarrantyCertificateShowcase } from "@/components/gtlux/WarrantyCertificateGT";
import TierCardsGT from "@/components/gtlux/TierCardsGT";
import LuxCard from "@/components/gtlux/LuxCard";
import SmokeField from "@/components/gtlux/SmokeField";
import { GtSection, GtTrustRow, GtFaq, GtStickyBar } from "@/components/gtlux/GtShared";
import { updatePageSEO } from "@/lib/seo";
import {
  injectJsonLd,
  removeJsonLd,
  getFaqPageJsonLd,
  getLocalBusinessJsonLd,
} from "@/lib/business";
import { createFunnelTrackingContext, trackFunnelEvent } from "@/lib/funnel-analytics";
import {
  GT_CANON,
  GT_CERT_SAMPLE,
  GT_FAQ,
  GT_IMAGES,
  GT_SIZE_NOTE,
  GT_TIERS,
  GT_WA,
  GT_WARRANTY,
  type GtTierKey,
} from "@/lib/gtProgram";

const PAGE_URL = "https://www.grandtouchauto.ae/ppf-warranty-dubai";

const JSONLD_FAQ_ID = "ppf-warranty-faq";
const JSONLD_BUSINESS_ID = "ppf-warranty-localbusiness";

/** Serif used on the certificate — reused for the terms document so both read as one artefact. */
const serif = "'Cormorant Garamond', Georgia, serif";

const fmt = (n: number) => n.toLocaleString("en-US");

const tier = (key: GtTierKey) => GT_TIERS.find((t) => t.key === key) as (typeof GT_TIERS)[number];
const ESSENTIAL = tier("essential");
const SIGNATURE = tier("signature");
const CONCOURS = tier("concours");

/** The one gold-filled CTA style per viewport (matches GtStickyBar / mock btn-gold). */
const goldBtnStyle: CSSProperties = {
  background: "linear-gradient(135deg, hsl(38 92% 58%), hsl(18 95% 58%))",
  boxShadow: "0 0 40px hsl(38 92% 58% / 0.25)",
};

const goldBtnClass =
  "inline-flex min-h-[48px] items-center justify-center rounded-md px-8 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110";

const ghostBtnClass =
  "inline-flex min-h-[48px] items-center justify-center rounded-md border border-border px-8 py-3 text-sm font-medium text-foreground transition hover:border-primary/60";

/** Small gold lozenge used as a list marker — the only gold on the hero besides the CTA. */
const Marker = () => (
  <span
    aria-hidden
    className="mt-[7px] h-[9px] w-[9px] shrink-0 rotate-45 border border-primary/70 bg-primary/20"
  />
);

/**
 * The published terms. Drafted from docs/gt-protection-program-master-plan.md §5
 * (UAE Federal Law 15/2020 + Cabinet Decision 66/2023 — Art. 11 requires the written
 * document to exist before the warranty is advertised; Art. 12 requires obligations
 * and exclusions to be stated). Counts, tier names and the covenant come from
 * @/lib/gtProgram so the document can never drift from the programme data.
 */
const TERMS_CLAUSES: { n: string; title: string; body: string[] }[] = [
  {
    n: "01",
    title: "Definitions",
    body: [
      `“Grand Touch”, “we” and “us” mean Grand Touch Auto, DIP 2, Dubai. “You” means the person named as Registered Owner on the certificate.`,
      `“Lifetime” means for as long as the original purchaser named on the certificate owns the vehicle identified by chassis number on the installation invoice. It is not the life of the film, it is not your lifetime, and it does not follow you to your next car. We define it here because UAE law does not.`,
      `“The Vehicle” is the single vehicle identified by make, model and chassis number on the certificate and invoice. “The Installation” is the film and labour supplied by Grand Touch and recorded on that invoice.`,
      `Lifetime cover applies to ${SIGNATURE.name} and ${CONCOURS.name}. ${ESSENTIAL.name} carries a fixed five-year term from the installation date: ${ESSENTIAL.warrantyLine}.`,
    ],
  },
  {
    n: "02",
    title: "What is covered",
    body: [
      GT_WARRANTY.covenant,
      `The named defects are: yellowing, cracking, peeling, bubbling, edge-lift and installation defects, on the panels covered by your programme.`,
      `Cover includes film and labour. Replacement film, materials and the labour to fit them are all included — an approved claim costs you nothing.`,
      `Impact damage is not a defect and is not claimed under this clause. It is dealt with under clause 04.`,
    ],
  },
  {
    n: "03",
    title: "The two layers of cover",
    body: [
      `Layer one is the film manufacturer's own warranty, registered to your vehicle by us at installation. You post nothing and register nothing — it is done before you leave the bay.`,
      `Layer two is the GT Owner's Warranty, this document, issued by Grand Touch and covering the whole job: film and labour. This is the layer you claim under.`,
      `Where both layers would respond, we handle the manufacturer's claim on your behalf. You deal only with us.`,
    ],
  },
  {
    n: "04",
    title: "No-fault panel replacements",
    body: [
      `${SIGNATURE.name}: ${SIGNATURE.panelChip}. ${CONCOURS.name}: ${CONCOURS.panelChip}. ${ESSENTIAL.name} does not include panel-replacement credits.`,
      `A credit covers one exterior panel per event, film and labour included, for damage from any cause — a scrape, a trolley, a bad wash. No fault needs to be established and no excess is payable.`,
      `Panel condition is photographed at every inspection so the record is ours, not yours to prove. Credits are void for panels reworked by a third party, are non-transferable, and hold no cash value.`,
    ],
  },
  {
    n: "05",
    title: "Your obligations",
    body: [
      `On ${SIGNATURE.name} and ${CONCOURS.name}, bring the vehicle to Grand Touch for inspection at month 6 and month 12, then annually — each within 30 days of the due date. ${ESSENTIAL.name} carries a single health check at month 12. Every one of these visits is free and takes about twenty minutes.`,
      `A missed inspection softens cover, it does not void it: on the lifetime programmes, coverage converts to the five-year base term measured from the installation date. We will not use a missed appointment to refuse a defect claim inside that term.`,
      `Follow the wash guidance on your handover sheet: no automatic brush washes, and the seven-day cure care after installation.`,
      `Do not have the film removed, reworked or coated over by a third party. Speak to us first — the work is usually free.`,
      `Keep the vehicle registered in the UAE, and tell us if ownership changes.`,
    ],
  },
  {
    n: "06",
    title: "What is excluded",
    body: [
      `Impact and accident damage, scrapes, scuffs and vandalism. This is precisely what your no-fault panel credits under clause 04 are for.`,
      `Paint or bodywork failure beneath the film, and panels resprayed before installation where that was disclosed and noted on the invoice.`,
      `Third-party removal, repair or coating over the film, and damage caused by it.`,
      `Off-road and track incident damage, and neglect as defined in the care sheet issued at handover.`,
      `Nothing in this clause removes or limits any right you have under UAE consumer protection law.`,
    ],
  },
  {
    n: "07",
    title: "How to claim",
    body: [
      `Send us photographs of the panel on WhatsApp with your certificate number. No forms, no call centre.`,
      `We offer you an inspection slot in the same week.`,
      `Approved claims are booked into the studio within 14 days.`,
      `The work is carried out at our Dubai studio, free of charge, photographed and logged against your certificate number.`,
    ],
  },
  {
    n: "08",
    title: "Remedy and limits",
    body: [
      `Our remedy is to repair or replace the film on the affected panel or panels at our studio. We choose the method; the outcome is a panel that matches the rest of the car.`,
      `Replacement film runs out the remainder of the original term. It does not restart cover.`,
      `One claim per panel in any 24-month period, unless a new and different defect cause arises.`,
      `Our aggregate liability under this warranty is capped at the original invoice amount for the installation. We do not cover consequential loss — loss of use, hire vehicles, storage or depreciation.`,
    ],
  },
  {
    n: "09",
    title: "Transfer of cover",
    body: [
      `Transfer applies to lifetime cover only (GT Signature and GT Concours). The GT Essential 5-year warranty is personal to the original purchaser and does not transfer under any circumstances.`,
      `Lifetime cover transfers once, with the vehicle, to one subsequent registered owner. It may not be transferred a second time, and it cannot be transferred to another vehicle.`,
      `To transfer it, the new owner applies to us in writing within 30 days of the change of ownership and presents the vehicle for a transfer inspection at our studio. The inspection is free of charge. Once registered, cover continues on these same terms for the remainder of its life, and the inspection schedule at clause 05 continues and binds the new owner.`,
      `What transfers is the defect cover — film and labour. Unused no-fault panel replacements and complimentary aftercare entitlements are personal to the original purchaser and do not transfer.`,
      `Cover ends if the vehicle is permanently exported from or re-registered outside the United Arab Emirates, as the remedy under this warranty is carried out at our Dubai studio.`,
    ],
  },
  {
    n: "10",
    title: "Governing law and the authority of the certificate",
    body: [
      `This warranty is governed by the laws of the United Arab Emirates and the courts of Dubai. The UAE Consumer Protection Law and its implementing regulations apply and are not displaced by anything written here.`,
      `Your signed, numbered certificate — issued in English and Arabic, handed to you at delivery with your tax invoice — is the operative document. Where this page and your certificate differ, the certificate governs.`,
      `We may update these terms for future installations. Your cover is always the version issued with your certificate, not the version on this page.`,
    ],
  },
];

const TERMS_DISCLAIMER = "Draft for review — final terms are issued with your signed certificate.";

/** GT Owner's Warranty — Google Ads LP. React implementation of public/gt-warranty-certificate-mock.html. */
const PpfWarrantyDubai = () => {
  /** The hero's smoke is emitted from this card's perimeter. */
  const certRef = useRef<HTMLDivElement | null>(null);
  const tracking = useMemo(
    () =>
      createFunnelTrackingContext({
        funnelName: "ppf-warranty-dubai",
        landingPageVariant: "v1",
      }),
    [],
  );

  const trackWhatsAppClick = (placement: string, tierKey?: GtTierKey) => {
    trackFunnelEvent({
      eventName: "whatsapp_click",
      context: tracking,
      payload: { placement, tier: tierKey },
      metaStandardEvent: "Lead",
    });
  };

  useEffect(() => {
    updatePageSEO("ppf-warranty-dubai", {
      title: "PPF Lifetime Warranty Dubai — The GT Owner's Warranty | Grand Touch Auto",
      description:
        "A PPF warranty you can hold: film and labour covered for life, no-fault panel replacement, free inspections. Full terms published in plain English. Real prices from AED 7,900 +VAT.",
      keywords:
        "ppf warranty dubai, ppf lifetime warranty, ppf warranty terms and conditions, ppf warranty claim dubai, paint protection film warranty, lifetime ppf dubai, Grand Touch warranty",
      ogTitle: "The GT Owner's Warranty — Lifetime PPF Cover in Dubai",
      ogDescription:
        "Film and labour, for as long as you own the car — signed, numbered, registered before you leave the bay. Full terms published. Programs from AED 7,900 +VAT.",
      url: PAGE_URL,
      image: "/guided-sean-with-911.png",
    });

    injectJsonLd(
      JSONLD_FAQ_ID,
      getFaqPageJsonLd(GT_FAQ.map((f) => ({ question: f.q, answer: f.a }))),
    );
    injectJsonLd(JSONLD_BUSINESS_ID, getLocalBusinessJsonLd());

    trackFunnelEvent({ eventName: "page_view", context: tracking });

    return () => {
      removeJsonLd(JSONLD_FAQ_ID, JSONLD_BUSINESS_ID);
    };
  }, [tracking]);

  return (
    <div className="min-h-screen bg-background pb-20 text-foreground md:pb-0">
      <Navbar />
      <main>
        {/* 1 — Hero: header left, offer card right (the /ppf-dubai-quote pattern) */}
        <section className="relative overflow-hidden px-4 pb-14 pt-28 md:pb-20 md:pt-36">
          {/* No photograph: the certificate is the subject. Smoke is emitted from the
              card's perimeter across the whole hero and reacts to the pointer. */}
          <div className="pointer-events-none absolute inset-0">
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(120% 90% at 72% 45%, hsl(38 92% 58% / 0.07) 0%, transparent 55%)",
              }}
            />
          </div>
          <SmokeField emitterRef={certRef} density={1} intensity={1} />

          <div className="relative mx-auto grid w-full max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-14">
            {/* LEFT — the argument */}
            <div className="max-w-xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">
                PPF in Dubai · The GT Owner's Warranty
              </p>
              <h1 className="mt-4 !text-[2.1rem] font-bold leading-[1.08] sm:!text-4xl md:!text-5xl lg:!text-[3.25rem]">
                A PPF warranty you can actually hold.
              </h1>
              <p className="mt-5 text-base leading-relaxed text-muted-foreground">
                Film <b className="font-semibold text-foreground">and</b> labour, for as long as you
                own the car — signed, numbered and registered before you leave the bay.
              </p>

              <ul className="mt-7 space-y-3 text-[14px] leading-relaxed">
                {[GT_WARRANTY.covers[0].title, SIGNATURE.panelChip, GT_WARRANTY.covers[2].title]
                  .filter((line): line is string => Boolean(line))
                  .map((line) => (
                    <li key={line} className="flex gap-3">
                      <Marker />
                      <span className="text-foreground/90">{line}</span>
                    </li>
                  ))}
              </ul>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href={GT_WA.general}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => trackWhatsAppClick("hero")}
                  className={`${goldBtnClass} w-full sm:w-auto`}
                  style={goldBtnStyle}
                >
                  WhatsApp Sean
                </a>
                <a href="#programs" className={`${ghostBtnClass} w-full sm:w-auto`}>
                  See programs &amp; prices
                </a>
              </div>

              <div className="mt-7 lg:[&>div]:justify-start">
                <GtTrustRow />
              </div>
            </div>

            {/* RIGHT — the certificate itself. It is the only asset on this page a
                competitor cannot copy, so it leads: smoke bed for depth, "Lifetime"
                in gold foil, and a tap-to-expand full-screen viewer. */}
            <div className="w-full lg:justify-self-end lg:max-w-[30rem]">
              <WarrantyCertificateShowcase smoke={false} innerRef={certRef} />
            </div>
          </div>
        </section>

        {/* 2 — The certificate now leads the hero; this is its caption. */}
        <section id="certificate" className="scroll-mt-24 px-4 pb-2 pt-6">
          <p className="mx-auto max-w-xl text-center text-[13px] leading-relaxed text-muted-foreground">
            Every <b className="font-semibold text-foreground">{SIGNATURE.name}</b> and{" "}
            <b className="font-semibold text-foreground">{CONCOURS.name}</b> installation leaves with
            its own numbered certificate — signed at handover, registered in our system, honoured at
            every inspection.{" "}
            <b className="font-semibold text-foreground">Ask the 7,000-dirham quote for theirs.</b>
          </p>
        </section>

        {/* 3 — What it covers (calm, plain English) */}
        <GtSection
          eyebrow="Plain English"
          title="What the certificate actually covers"
          sub="Four things, stated the way we'd say them across the counter. The full legal terms follow underneath."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {GT_WARRANTY.covers.map((item) => (
              <div
                key={item.title}
                className="flex h-full flex-col rounded-xl p-6"
                style={{
                  background: "var(--gradient-card)",
                  boxShadow: "var(--shadow-card)",
                }}
              >
                <h3 className="!text-[15px] font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{item.body}</p>
              </div>
            ))}
          </div>
        </GtSection>

        {/* 4 — The full terms, as a document. All text stays in the DOM for crawlers + AI engines. */}
        <GtSection
          id="terms"
          eyebrow="Published in full"
          title="The full terms — in plain English and in full"
          sub="Most Dubai shops advertise a lifetime warranty and hand you nothing. Here is ours, clause by clause, before you spend a dirham."
          className="scroll-mt-24"
        >
          <article className="mx-auto max-w-3xl rounded-xl border border-border/80 bg-[hsl(0_0%_10%)] px-5 py-8 shadow-[var(--shadow-card)] sm:px-10 sm:py-12">
            {/* document head */}
            <header className="border-b border-border/70 pb-7 text-center">
              <p className="text-[9.5px] font-semibold uppercase tracking-[0.4em] text-muted-foreground">
                Grand Touch Auto · DIP 2 · Dubai
              </p>
              <h3
                className="mt-3 !text-[1.6rem] sm:!text-[2rem]"
                style={{ fontFamily: serif, fontWeight: 600, letterSpacing: "0.06em" }}
              >
                THE OWNER'S WARRANTY — TERMS
              </h3>
              <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                Ten clauses · issued with certificate Nº {GT_CERT_SAMPLE.certNo}
              </p>
              <p className="mx-auto mt-5 max-w-md rounded-md border border-primary/35 bg-primary/[0.06] px-4 py-2.5 text-[12px] font-medium leading-relaxed text-foreground/90">
                {TERMS_DISCLAIMER}
              </p>
            </header>

            {/* clauses */}
            <div className="mt-2">
              {TERMS_CLAUSES.map((clause, i) => (
                <details
                  key={clause.n}
                  open={i === 0}
                  className="group border-b border-border/60 py-5"
                >
                  <summary className="flex cursor-pointer list-none items-baseline gap-4 [&::-webkit-details-marker]:hidden">
                    <span
                      aria-hidden
                      className="shrink-0 text-[13px] tabular-nums text-primary/80"
                      style={{ fontFamily: serif, fontWeight: 600, letterSpacing: "0.08em" }}
                    >
                      {clause.n}
                    </span>
                    <h4
                      className="flex-1 !text-[17px] !font-semibold text-foreground sm:!text-[19px]"
                      style={{ fontFamily: serif, letterSpacing: "0.01em" }}
                    >
                      {clause.title}
                    </h4>
                    <span
                      aria-hidden
                      className="shrink-0 text-primary transition-transform duration-200 group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <div className="mt-3 space-y-3 pl-[29px] pr-2">
                    {clause.body.map((para) => (
                      <p
                        key={para.slice(0, 42)}
                        className="max-w-[62ch] text-[13px] leading-[1.75] text-muted-foreground"
                      >
                        {para}
                      </p>
                    ))}
                  </div>
                </details>
              ))}
            </div>

            {/* document foot */}
            <footer className="mt-8 flex flex-col items-center gap-4 text-center">
              <p className="max-w-lg text-[12.5px] leading-relaxed text-muted-foreground">
                {TERMS_DISCLAIMER} Your certificate is issued in English and Arabic and handed to you
                at delivery with your tax invoice.
              </p>
              <a
                href={GT_WA.warranty}
                target="_blank"
                rel="noreferrer"
                onClick={() => trackWhatsAppClick("terms")}
                className={ghostBtnClass}
              >
                Ask Sean about any clause
              </a>
            </footer>
          </article>
        </GtSection>

        {/* 5 — Programs & prices (the decision point) */}
        <GtSection
          id="programs"
          eyebrow="The GT Protection Program"
          title="Three programs. Real prices."
          sub={GT_SIZE_NOTE}
          className="scroll-mt-24"
        >
          <TierCardsGT onTierCta={(t) => trackWhatsAppClick("tier_card", t)} />
        </GtSection>

        {/* 6 — FAQ (all answers in DOM) */}
        <GtSection eyebrow="Fair questions" title="PPF warranty questions, answered straight">
          <GtFaq items={GT_FAQ} />
        </GtSection>

        {/* 7 — Closing */}
        <GtSection title={GT_CANON.fifteenCars} sub={GT_CANON.closingSub} className="pb-24">
          <div className="flex justify-center">
            <a
              href={GT_WA.general}
              target="_blank"
              rel="noreferrer"
              onClick={() => trackWhatsAppClick("closing")}
              className={goldBtnClass}
              style={goldBtnStyle}
            >
              WhatsApp Sean
            </a>
          </div>
        </GtSection>
      </main>
      <Footer />
      {/* Floating bubble desktop-only: GtStickyBar owns the mobile bottom edge.
          Page-local (not WhatsAppButton) so the link is GT_WA.general and the click is tracked. */}
      <a
        href={GT_WA.general}
        target="_blank"
        rel="noreferrer"
        onClick={() => trackWhatsAppClick("floating_bubble")}
        aria-label="WhatsApp Sean"
        className="fixed bottom-6 right-6 z-50 hidden h-14 w-14 items-center justify-center rounded-full bg-[#1f8350] text-white shadow-lg transition hover:bg-[#278f5a] md:flex"
      >
        <MessageCircle className="h-6 w-6" aria-hidden />
      </a>
      <GtStickyBar href={GT_WA.general} onClick={() => trackWhatsAppClick("sticky_bar")} />
    </div>
  );
};

export default PpfWarrantyDubai;
