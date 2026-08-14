import { useCallback, useEffect, useRef, useState } from "react";
import LuxCard from "./LuxCard";
import GoldStamp from "./GoldStamp";
import SmokeField from "./SmokeField";
import Card3D from "./Card3D";
import { GT_CERT_SAMPLE, GT_WARRANTY } from "@/lib/gtProgram";

/**
 * Document proportions, not a page section: the certificate is capped and
 * scrolls inside its own frame so the gold border never scrolls away.
 * Sizes are container-relative (cqw) so the same card reads correctly at
 * ~900px (warranty page) and in a ~560px column (pillar page).
 */
const CSS = `
.gtcert-frame{
  --gtcert-serif:'Cormorant Garamond',Georgia,serif;
  --gtcert-script:'Allura',cursive;
  --gtcert-gold:hsl(38 92% 58%);
  --gtcert-muted:hsl(38 15% 62%);
  position:relative;container-type:inline-size;
}
/* paper: watermark stays with the frame, the document scrolls over it */
.gtcert-wm{position:absolute;inset:0;overflow:hidden;border-radius:12px;pointer-events:none;z-index:0}
.gtcert-wm span{position:absolute;inset:0;display:flex;align-items:center;justify-content:center}
.gtcert-wm-gt{font-family:var(--gtcert-serif);font-size:clamp(150px,34cqw,300px);font-weight:600;color:hsl(38 60% 50%/.05);line-height:1;letter-spacing:-.05em}
.gtcert-wm-spec{font-size:clamp(10px,1.3cqw,13px);font-weight:600;letter-spacing:1.1em;text-transform:uppercase;color:hsl(0 0% 98%/.055);transform:rotate(-24deg)}

.gtcert-scroll{position:relative;z-index:1;overflow-x:hidden;scrollbar-width:thin;scrollbar-color:hsl(38 45% 45%/.45) transparent}
.gtcert-scroll::-webkit-scrollbar{width:6px}
.gtcert-scroll::-webkit-scrollbar-thumb{background:hsl(38 45% 45%/.45);border-radius:99px}
.gtcert-scroll::-webkit-scrollbar-track{background:transparent}
.gtcert-scroll:focus-visible{outline:1px solid hsl(38 92% 58%/.55);outline-offset:-6px}
.gtcert-doc{padding:clamp(16px,2.4cqw,26px) clamp(18px,3cqw,34px)}

.gtcert-eyebrow{text-align:center;font-size:clamp(7.5px,1.05cqw,9.5px);font-weight:600;letter-spacing:.32em;text-transform:uppercase;color:var(--gtcert-muted)}
.gtcert-title{margin:7px 0 0;text-align:center;font-family:var(--gtcert-serif);font-size:clamp(18px,3.05cqw,30px);font-weight:600;letter-spacing:.08em;line-height:1.15;color:hsl(0 0% 92%)}
.gtcert-life-row{text-align:center;line-height:1.05}
.gtcert-life{display:inline-block;font-family:var(--gtcert-serif);font-style:italic;font-size:clamp(24px,4.4cqw,40px);line-height:1.1}

.gtcert-meta{display:flex;flex-wrap:wrap;justify-content:space-between;gap:4px 18px;margin-top:clamp(10px,1.6cqw,16px);padding-top:clamp(8px,1.2cqw,12px);border-top:1px solid hsl(38 40% 40%/.28);font-size:clamp(8px,1.05cqw,10px);letter-spacing:.18em;text-transform:uppercase;color:var(--gtcert-muted)}
.gtcert-meta b{color:var(--gtcert-gold);font-weight:600}

.gtcert-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:clamp(10px,1.5cqw,15px) clamp(16px,2.6cqw,30px);margin-top:clamp(12px,1.9cqw,18px)}
.gtcert-label{display:block;font-size:8px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:var(--gtcert-muted);margin-bottom:3px}
.gtcert-value{font-family:var(--gtcert-serif);font-size:clamp(14px,1.95cqw,19px);font-weight:600;line-height:1.25;color:hsl(0 0% 92%);border-bottom:1px solid hsl(38 40% 40%/.32);padding-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.gtcert-value small{font-family:'Poppins',sans-serif;font-size:.58em;font-weight:400;color:var(--gtcert-muted)}

.gtcert-covenant{max-width:620px;margin:clamp(12px,1.9cqw,18px) auto 0;font-family:var(--gtcert-serif);font-style:italic;font-size:clamp(12px,1.55cqw,15.5px);line-height:1.6;text-align:center;color:hsl(38 20% 82%)}
.gtcert-covenant b{color:hsl(42 90% 72%);font-weight:600}

.gtcert-band{display:grid;grid-template-columns:minmax(0,1.08fr) minmax(0,.92fr);align-items:center;gap:clamp(12px,2cqw,24px);margin-top:clamp(13px,2cqw,20px)}
.gtcert-ent{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.gtcert-ent-cell{border:1px solid hsl(38 50% 45%/.28);border-radius:4px;padding:7px 8px;text-align:center;background:hsl(38 60% 50%/.04)}
.gtcert-ent-cell b{display:block;font-family:var(--gtcert-serif);font-size:clamp(13px,1.75cqw,18px);font-weight:600;line-height:1.15;color:var(--gtcert-gold)}
.gtcert-ent-cell span{display:block;margin-top:2px;font-size:7.5px;font-weight:600;letter-spacing:.13em;line-height:1.35;text-transform:uppercase;color:var(--gtcert-muted)}

.gtcert-rec-title{text-align:center;font-size:8px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:var(--gtcert-muted);margin-bottom:7px}
.gtcert-stamps{display:flex;flex-wrap:wrap;justify-content:center;gap:clamp(8px,1.3cqw,14px)}
/* Discs are circles, so the usable width at the text's line box is a chord, not
   the full diameter — "Passed" at its floor size needs ~42px of chord. 46px min
   keeps every label inside the ring; four discs + gaps still fit a 375px card. */
.gtcert-disc{width:clamp(46px,5.6cqw,52px);height:clamp(46px,5.6cqw,52px);border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;white-space:nowrap;font-size:clamp(6.4px,.78cqw,7.2px);font-weight:600;letter-spacing:.04em;line-height:1.2;text-transform:uppercase}
.gtcert-disc-done{border:1.4px solid var(--gtcert-gold);color:var(--gtcert-gold);background:hsl(38 92% 58%/.05);transform:rotate(-8deg);box-shadow:0 0 14px hsl(38 92% 58%/.22),inset 0 0 10px hsl(38 92% 58%/.12)}
.gtcert-disc-done b{font-family:var(--gtcert-serif);font-size:clamp(10px,1.35cqw,13px);font-weight:600;letter-spacing:.04em;margin-top:1px}
.gtcert-disc-open{border:1.4px dashed hsl(38 40% 45%/.4);color:hsl(38 20% 45%)}

.gtcert-sign{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:end;justify-items:center;gap:clamp(10px,1.6cqw,22px);margin-top:clamp(14px,2.2cqw,22px)}
.gtcert-sign-col{width:100%;text-align:center}
.gtcert-ink{font-family:var(--gtcert-script);font-size:clamp(22px,3.4cqw,33px);line-height:1;color:hsl(38 40% 80%);transform:rotate(-3deg);text-shadow:0 0 14px hsl(38 92% 58%/.18)}
.gtcert-ink-sm{font-size:clamp(18px,2.7cqw,26px);transform:rotate(-2deg);text-shadow:none}
.gtcert-rule{height:1px;background:hsl(38 40% 45%/.5);margin:7px 10% 6px}
.gtcert-cap{display:block;font-size:8px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:var(--gtcert-muted)}

/* Security-print microtext band. It is wider than the document at every real
   width, so it must bleed off BOTH edges like real microtext — a block-level
   nowrap line start-aligns instead and clips only the right, which reads as a
   sentence cut mid-word. Flex centring overflows symmetrically. */
.gtcert-micro{margin-top:clamp(12px,1.8cqw,18px);display:flex;justify-content:center;overflow:hidden;font-size:7px;letter-spacing:.3em;text-transform:uppercase;color:hsl(38 15% 38%)}
.gtcert-micro span{white-space:nowrap;flex:none}

.gtcert-hint{position:absolute;left:50%;bottom:clamp(6px,1cqw,12px);transform:translateX(-50%);z-index:2;pointer-events:none;display:inline-flex;align-items:center;gap:6px;padding:5px 11px;border-radius:99px;border:1px solid hsl(38 60% 50%/.35);background:hsl(220 8% 8%/.86);font-size:8px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:hsl(38 30% 72%);transition:opacity .35s ease}

.gtcert-expand{position:absolute;top:clamp(8px,1.2cqw,14px);right:clamp(8px,1.2cqw,14px);z-index:3;display:inline-flex;align-items:center;gap:6px;padding:6px 11px;border-radius:99px;border:1px solid hsl(38 60% 50%/.4);background:hsl(220 8% 8%/.75);backdrop-filter:blur(4px);font-size:8.5px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:hsl(38 35% 76%);cursor:pointer;transition:border-color .25s ease,color .25s ease,background .25s ease}
.gtcert-expand:hover{border-color:hsl(38 92% 58%/.75);color:hsl(38 92% 68%);background:hsl(220 8% 6%/.9)}

/* narrow container (pillar-page column) and narrow viewport */
@container (max-width:720px){.gtcert-band{grid-template-columns:minmax(0,1fr)}}
@container (max-width:520px){
  .gtcert-grid{grid-template-columns:minmax(0,1fr)}
  /* The eyebrow is centred, so its right edge advances at half the rate of the
     pill's left edge: below ~520px the 99px label closes on "· Dubai" (2px of
     clearance at 441px). Icon only here — aria-label carries the name. */
  .gtcert-expand{padding:7px;gap:0}
  .gtcert-expand-label{display:none}
}
@container (max-width:440px){
  .gtcert-ent{grid-template-columns:minmax(0,1fr);gap:5px}
  .gtcert-ent-cell{display:flex;align-items:baseline;justify-content:space-between;gap:10px;text-align:left;padding:6px 10px}
  .gtcert-ent-cell b{display:inline;font-size:15px}
  .gtcert-ent-cell span{margin-top:0;text-align:right}
  .gtcert-sign{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}
  .gtcert-seal{grid-column:1/-1;order:-1}
}
@media (max-width:640px){
  .gtcert-grid{grid-template-columns:minmax(0,1fr)}
  .gtcert-band{grid-template-columns:minmax(0,1fr)}
  .gtcert-expand{padding:7px;gap:0}
  .gtcert-expand-label{display:none}
}
@media (prefers-reduced-motion:reduce){.gtcert-hint{transition:none}}
`;

/** Document proportions: the compact card never grows past this. */
const CAP_PX = 620;
const CAP_VH = 0.78;

/**
 * Signature-programme entitlements, matching GT_TIERS.signature in
 * src/lib/gtProgram.ts ("1 free panel replacement", lifetime film + labour,
 * free wash & inspection visits). GT_CERT_SAMPLE.programme is GT Signature; a
 * sample for another programme must bring its own entitlements — Concours is
 * 3 panel replacements, Essential is a 5-year term, not a lifetime one.
 */
const ENTITLEMENTS: [string, string][] = [
  ["Film + Labour", "Full coverage"],
  ["3 of 3", "No-fault panel replacements"],
  ["For life", "Wash & inspection visits"],
];

/** "Khalid Al Mansoori" → "K. Al Mansoori" — the countersignature must track the
 *  named owner rather than repeat a literal that a different sample would falsify. */
const countersign = (owner: string) => {
  const [first, ...rest] = owner.trim().split(/\s+/);
  return rest.length ? `${first.charAt(0)}. ${rest.join(" ")}` : owner;
};

interface WarrantyCertificateGTProps {
  className?: string;
  /** Full pinstripe + smoke + stamp theatre. Set false for calm embeds. */
  theatre?: boolean;
  /** Document-height cap + internal scroll. false = full height (print/full-page view). */
  compact?: boolean;
  /** Show the "View full" affordance (wired by WarrantyCertificateShowcase). */
  expandable?: boolean;
  onExpand?: () => void;
  sample?: typeof GT_CERT_SAMPLE;
}

/** The GT Owner's Warranty rendered as a physical document — specimen version. */
const WarrantyCertificateGT = ({
  className = "",
  theatre = true,
  compact = true,
  expandable = false,
  onExpand,
  sample = GT_CERT_SAMPLE,
}: WarrantyCertificateGTProps) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const docRef = useRef<HTMLDivElement | null>(null);
  const [scroll, setScroll] = useState({ canScroll: false, atTop: true, atEnd: true });

  const sync = useCallback(() => {
    const el = scrollRef.current;
    const doc = docRef.current;
    if (!el || !doc) return;
    // Measure the document's own height against the cap, never the port's
    // scrollHeight: rotated ink and the seal shockwave add a few pixels of
    // decorative overflow, and the scrollbar itself changes the port. Judging
    // on those makes the state latch.
    const cap = Math.min(CAP_PX, window.innerHeight * CAP_VH);
    const docHeight = doc.getBoundingClientRect().height;
    const range = el.scrollHeight - el.clientHeight;
    setScroll((prev) => {
      // Asymmetric thresholds: turning scroll on narrows the document by a
      // scrollbar (so it gets taller), turning it off widens it (shorter) —
      // each transition is therefore monotone and the state cannot oscillate.
      const canScroll = prev.canScroll ? docHeight > cap : docHeight > cap + 12;
      // On the pass that first turns scrolling on, the cap has not been applied
      // yet — fall back to the range it is about to have, so the bottom fade is
      // right on the first paint instead of one frame late.
      const scrollable = canScroll ? Math.max(range, docHeight - cap) : range;
      const next = {
        canScroll,
        atTop: !canScroll || el.scrollTop <= 4,
        atEnd: !canScroll || el.scrollTop >= scrollable - 6,
      };
      return prev.canScroll === next.canScroll && prev.atTop === next.atTop && prev.atEnd === next.atEnd
        ? prev
        : next;
    });
  }, []);

  useEffect(() => {
    if (!compact) {
      setScroll({ canScroll: false, atTop: true, atEnd: true });
      return;
    }
    const el = scrollRef.current;
    const doc = docRef.current;
    if (!el || !doc) return;
    sync();
    // Re-measure on reflow (container width, late web fonts) and viewport height.
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    ro.observe(doc);
    window.addEventListener("resize", sync);
    // Cormorant / Allura land after first paint and change the document height.
    let live = true;
    document.fonts?.ready.then(() => {
      if (live) sync();
    });
    return () => {
      live = false;
      ro.disconnect();
      window.removeEventListener("resize", sync);
    };
  }, [compact, sync]);

  // Named to avoid shadowing the pixel-range `scrollable` local inside sync().
  const hasInnerScroll = compact && scroll.canScroll;

  // Inner fade masks: the document dissolves at the edges it can still scroll toward.
  const fadeTop = compact && !scroll.atTop ? 30 : 0;
  const fadeBottom = compact && !scroll.atEnd ? 34 : 0;
  const mask =
    fadeTop || fadeBottom
      ? `linear-gradient(to bottom, transparent 0, #000 ${fadeTop}px, #000 calc(100% - ${fadeBottom}px), transparent 100%)`
      : undefined;

  return (
    <LuxCard pinstripe={theatre} className={`w-full ${className}`} as="article">
      <style>{CSS}</style>
      <div className="gtcert-frame">
        <div className="gtcert-wm" aria-hidden>
          <span className="gtcert-wm-gt">GT</span>
          <span className="gtcert-wm-spec">Specimen</span>
        </div>

        <div
          ref={scrollRef}
          className="gtcert-scroll"
          onScroll={compact ? sync : undefined}
          // Only a genuinely scrollable box needs to be a labelled, focusable
          // region. Declaring it unconditionally put a second identically-named
          // landmark in the DOM whenever the expanded viewer was open.
          role={hasInnerScroll ? "region" : undefined}
          aria-label={
            hasInnerScroll ? "Specimen of the Grand Touch Owner's Warranty certificate" : undefined
          }
          tabIndex={hasInnerScroll ? 0 : undefined}
          style={{
            // Cap + scroll only once the document actually needs it, so a card
            // that already fits never shows a scrollbar or gets clipped.
            maxHeight: hasInnerScroll ? `min(${CAP_PX}px, ${CAP_VH * 100}vh)` : undefined,
            overflowY: compact ? (scroll.canScroll ? "auto" : "hidden") : "visible",
            overflowX: compact ? "hidden" : "visible",
            maskImage: mask,
            WebkitMaskImage: mask,
          }}
        >
          <div className="gtcert-doc" ref={docRef}>
            {/* header */}
            <div className="gtcert-eyebrow">
              Grand Touch Auto&nbsp;&nbsp;·&nbsp;&nbsp;DIP 2&nbsp;&nbsp;·&nbsp;&nbsp;Dubai
            </div>
            <h3 className="gtcert-title">THE OWNER'S WARRANTY</h3>
            <div className="gtcert-life-row">
              <span className="gtcert-life gtlux-foil gtlux-foil-text">Lifetime</span>
            </div>

            {/* cert meta */}
            <div className="gtcert-meta">
              <span>
                Certificate <b>Nº {sample.certNo}</b>
              </span>
              <span>
                Programme <b>{sample.programme}</b>
              </span>
            </div>

            {/* identity */}
            <div className="gtcert-grid">
              <div>
                <span className="gtcert-label">Registered Owner</span>
                <div className="gtcert-value">{sample.owner}</div>
              </div>
              <div>
                <span className="gtcert-label">Date of Installation</span>
                <div className="gtcert-value">{sample.installDate}</div>
              </div>
              <div>
                <span className="gtcert-label">Vehicle</span>
                <div className="gtcert-value">
                  {sample.vehicle} <small>· {sample.vehicleMeta}</small>
                </div>
              </div>
              <div>
                <span className="gtcert-label">Chassis · registered with film manufacturer</span>
                <div className="gtcert-value">{sample.chassisMasked}</div>
              </div>
            </div>

            {/* covenant */}
            <p className="gtcert-covenant">
              {GT_WARRANTY.covenant} <b>Not a promise. A document.</b>
            </p>

            {/* entitlements + inspection record, one band */}
            <div className="gtcert-band">
              <div className="gtcert-ent">
                {ENTITLEMENTS.map(([big, small]) => (
                  <div className="gtcert-ent-cell" key={small}>
                    <b>{big}</b>
                    <span>{small}</span>
                  </div>
                ))}
              </div>
              <div>
                <div className="gtcert-rec-title">Inspection Record — keeps this warranty active</div>
                <div className="gtcert-stamps">
                  <div className="gtcert-disc gtcert-disc-done">
                    <span>6 months</span>
                    <b>Passed</b>
                  </div>
                  {["12 months", "Year 2", "Year 3"].map((s) => (
                    <div className="gtcert-disc gtcert-disc-open" key={s}>
                      {s}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* signatures + seal */}
            <div className="gtcert-sign">
              <div className="gtcert-sign-col">
                <div className="gtcert-ink">Sean</div>
                <div className="gtcert-rule" />
                <span className="gtcert-cap">Founder, Grand Touch Auto</span>
              </div>
              <GoldStamp className="gtcert-seal" size="clamp(64px, 8.6cqw, 82px)" />
              <div className="gtcert-sign-col">
                <div className="gtcert-ink gtcert-ink-sm">{countersign(sample.owner)}</div>
                <div className="gtcert-rule" />
                <span className="gtcert-cap">Registered Owner</span>
              </div>
            </div>

            {/* microtext — repeated so the band is continuous wherever it is clipped */}
            <div className="gtcert-micro" aria-hidden>
              <span>
                {`${sample.certNo} · Film and labour · As long as you own it · Terms at grandtouchauto.ae/ppf-warranty-dubai · Specimen · `.repeat(
                  2,
                )}
              </span>
            </div>
          </div>
        </div>

        {hasInnerScroll && (
          <div className="gtcert-hint" aria-hidden style={{ opacity: scroll.atTop ? 1 : 0 }}>
            Scroll to read <span aria-hidden>▾</span>
          </div>
        )}

        {expandable && onExpand && (
          <button
            type="button"
            onClick={onExpand}
            className="gtcert-expand"
            aria-label="View the full certificate"
            // Below a 520px container the pill collapses to its icon (it would
            // otherwise sit on the eyebrow), so carry the name as a tooltip too.
            title="View the full certificate"
          >
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="gtcert-expand-label">View full</span>
          </button>
        )}
      </div>
    </LuxCard>
  );
};

/**
 * Certificate with the smoke bed behind it and a full-screen viewer.
 * The smoke only runs on the inline card — in the expanded viewer the document
 * is the subject and the effect would just be noise behind it.
 */
export const WarrantyCertificateShowcase = ({
  className = "",
  smoke = true,
  innerRef,
  sample = GT_CERT_SAMPLE,
}: {
  className?: string;
  /** false when the parent (hero) owns a larger smoke field emitting from this card. */
  smoke?: boolean;
  /** Lets a hero-level SmokeField use this card as its emitter. */
  innerRef?: React.RefObject<HTMLDivElement | null>;
  sample?: typeof GT_CERT_SAMPLE;
}) => {
  return (
    <div className={`relative ${className}`}>
      {smoke && (
        /* Smoke bed behind the card. Bleeds vertically for depth but stays
           inset-x-0: horizontal bleed pushed the document past the viewport
           on mobile and created a horizontal scrollbar. */
        <div className="pointer-events-none absolute inset-x-0 -bottom-16 -top-10 z-0 overflow-hidden">
          <SmokeField intensity={1} />
        </div>
      )}
      <div className="relative z-10" ref={innerRef}>
        {/* The card turns to show both faces, so there is nothing left for a
            modal to reveal — the whole document is legible in place. */}
        <Card3D>
          <WarrantyCertificateGT theatre compact={false} sample={sample} />
        </Card3D>
      </div>
    </div>
  );
};

export default WarrantyCertificateGT;
