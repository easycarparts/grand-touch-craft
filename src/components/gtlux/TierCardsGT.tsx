import { useCallback, useEffect, useRef, useState } from "react";
import LuxCard from "./LuxCard";
import TierCompareTable from "./TierCompareTable";
import { GT_INSTALL_STANDARD, GT_TIERS, type GtTier, type GtTierKey } from "@/lib/gtProgram";

const fmt = (n: number) => n.toLocaleString("en-US");

/**
 * The three programmes as a 3D coverflow rather than three static columns.
 *
 * Three equal columns read as a list; the point of the ladder is that each step
 * buys something, so the selected programme comes forward and the others sit
 * angled behind it. Sliding between them is what makes the difference legible.
 *
 * Every card stays mounted and in the DOM at all times — the transform is
 * presentational only — so crawlers, AI engines and assistive tech always see
 * all three programmes and their prices.
 *
 *   click a side card   brings it forward
 *   swipe / drag        moves between programmes (vertical stays page scroll)
 *   arrow keys          moves between programmes
 *   reduced motion      falls back to a plain stacked grid, no transforms
 */

const CSS = `
.gttier-stage{position:relative;perspective:1600px;touch-action:pan-y;user-select:none}
.gttier-track{position:relative;display:flex;align-items:stretch;justify-content:center;transform-style:preserve-3d}
.gttier-slot{
  position:absolute;top:0;width:min(94%,26rem);
  transition:transform .55s cubic-bezier(.22,.8,.28,1), opacity .55s ease, filter .55s ease;
  will-change:transform,opacity;
}
.gttier-slot.is-active{z-index:3;cursor:default}
.gttier-slot.is-side{z-index:2;cursor:pointer}
.gttier-slot.is-far{z-index:1;cursor:pointer}
/* Backgrounded cards brighten on hover so they read as pressable, not decoration. */
.gttier-slot.is-side:hover,.gttier-slot.is-far:hover{opacity:.95 !important;filter:saturate(1) !important}
/* Measured, not positioned: keeps the stage the height of the tallest card so
   switching programmes never changes the section height. */
.gttier-ghost{visibility:hidden;pointer-events:none;width:min(94%,26rem);position:relative}

.gttier-rail{display:flex;justify-content:center;gap:10px;margin-top:30px;flex-wrap:wrap}
.gttier-pill{
  display:flex;flex-direction:column;align-items:center;gap:4px;cursor:pointer;
  padding:11px 20px;border-radius:10px;
  border:1px solid hsl(0 0% 100% / .1);background:hsl(0 0% 100% / .022);
  transition:border-color .3s ease,background .3s ease,transform .3s ease;
}
.gttier-pill:hover{border-color:hsl(38 92% 58% / .45)}
.gttier-pill.is-on{
  border-color:hsl(38 92% 58% / .8);background:hsl(38 92% 58% / .08);transform:translateY(-2px);
}
.gttier-pill-name{font-size:10px;font-weight:600;letter-spacing:.22em;text-transform:uppercase;color:hsl(0 0% 58%)}
.gttier-pill.is-on .gttier-pill-name{color:hsl(38 92% 62%)}
.gttier-pill-price{font-size:15px;font-weight:600;color:hsl(0 0% 92%);letter-spacing:-.01em;white-space:nowrap}
.gttier-pill.is-on .gttier-pill-price{color:hsl(0 0% 100%)}

@media (min-width:1024px){
  .gttier-slot{width:min(70%,25rem)}
}
@media (prefers-reduced-motion:reduce){
  .gttier-stage{perspective:none}
  .gttier-track{display:grid;grid-template-columns:1fr;gap:24px;transform-style:flat}
  .gttier-slot{position:relative;transform:none !important;opacity:1 !important;filter:none !important;width:100%}
  .gttier-ghost{display:none}
}
`;

interface TierCardsGTProps {
  /** Called on any tier CTA click (wire tracking here); href still navigates. */
  onTierCta?: (tier: GtTierKey) => void;
  className?: string;
}

const TierCard = ({
  tier,
  active,
  onTierCta,
  align = "left",
}: {
  tier: GtTier;
  active: boolean;
  onTierCta?: (tier: GtTierKey) => void;
  /** Which edge the name + price sit on — the edge that stays visible. */
  align?: "left" | "center" | "right";
}) => {
  const featured = Boolean(tier.featured);
  const headAlign =
    align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left";
  return (
    <LuxCard
      className={`h-full ${active && featured ? "ring-1 ring-primary/80" : active ? "ring-1 ring-border" : "ring-1 ring-border/40"}`}
      as="article"
    >
      {/* Deliberately sparse: three highlights, not a spec dump. The full
          line-by-line comparison lives in the table below the carousel. */}
      <div className="flex h-full flex-col">
        {/* Header plate — its own lit surface so the price reads as struck into
            the card rather than typed onto one flat panel. */}
        <div
          className={`relative overflow-hidden rounded-t-xl px-7 pb-7 pt-9 md:px-8 md:pt-10 ${headAlign}`}
          style={{
            background: featured
              ? "linear-gradient(180deg, hsl(38 60% 22% / .55) 0%, hsl(38 40% 12% / .3) 45%, transparent 100%)"
              : "linear-gradient(180deg, hsl(0 0% 100% / .055) 0%, hsl(0 0% 100% / .014) 48%, transparent 100%)",
            boxShadow: "inset 0 1px 0 hsl(0 0% 100% / .09)",
          }}
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 -top-24 h-40"
            style={{
              background: featured
                ? "radial-gradient(60% 100% at 50% 100%, hsl(38 92% 58% / .3), transparent 70%)"
                : "radial-gradient(60% 100% at 50% 100%, hsl(0 0% 100% / .09), transparent 70%)",
            }}
          />
          <div
            className={`relative text-[10.5px] font-semibold uppercase tracking-[0.26em] ${featured ? "text-primary" : "text-muted-foreground"}`}
          >
            {tier.name}
          </div>
          {/* Identity line: the buyer self-selects by who they are, not by spec.
              This is the fastest "which one is me?" answer on the page. */}
          <div className="relative mt-1.5 text-[12.5px] italic text-foreground/70">{tier.identity}</div>

          <div className="relative mt-5">
            <div className="text-[46px] font-semibold leading-none tracking-[-0.025em] text-foreground">
              <span className="mr-1.5 align-middle text-[15px] font-normal tracking-normal text-muted-foreground">
                AED
              </span>
              {fmt(tier.fullBody)}
            </div>
            <div className="mt-3 text-[10.5px] uppercase tracking-[0.2em] text-muted-foreground">
              {tier.key === "concours" ? "From · full vehicle" : "From · full body"}
            </div>
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        <div className="flex flex-1 flex-col px-7 pb-7 pt-6 md:px-8 md:pb-8">
          {/* The USP leads — the single most valuable thing this money buys,
              stated as an outcome. Features support it underneath. */}
          <div className="text-[15px] font-semibold leading-snug text-foreground">{tier.usp}</div>

        <ul className="mt-5 flex-1 space-y-3 text-[13.5px] leading-relaxed">
          {tier.highlights.map((h) => (
            <li key={h} className="flex gap-3">
              <span
                aria-hidden
                className="mt-[3px] flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2">
                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="text-muted-foreground">{h}</span>
            </li>
          ))}
        </ul>

        {tier.panelChip && (
          <div className="mt-6 rounded-lg border border-accent/30 bg-accent/[0.07] px-4 py-3 text-[12.5px] font-medium leading-snug text-accent">
            {tier.panelChip}
          </div>
        )}

        <a
          href={tier.wa}
          target="_blank"
          rel="noreferrer"
          onClick={() => onTierCta?.(tier.key)}
          // Gold is reserved for the programme in focus, so only one filled CTA
          // is ever on screen no matter which card is forward.
          className={
            active && featured
              ? "mt-7 rounded-md bg-primary py-3.5 text-center text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
              : "mt-7 rounded-md border border-border py-3.5 text-center text-sm font-medium text-foreground transition hover:border-primary/60"
          }
          tabIndex={active ? 0 : -1}
        >
          {tier.cta}
        </a>
        </div>
      </div>
    </LuxCard>
  );
};

const TierCardsGT = ({ onTierCta, className = "" }: TierCardsGTProps) => {
  // Presentation order is the price ladder; the featured tier opens in front.
  const tiers = GT_TIERS;
  const featuredIndex = Math.max(0, tiers.findIndex((t) => t.featured));
  const [active, setActive] = useState(featuredIndex);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const drag = useRef({ down: false, x: 0, moved: 0, downIndex: -1, lastTravel: 0 });

  const go = useCallback(
    (dir: number) => setActive((i) => Math.min(tiers.length - 1, Math.max(0, i + dir))),
    [tiers.length],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        go(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(-1);
      }
    },
    [go],
  );

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    // Record which card the press started on. Selection is resolved on
    // pointer-up rather than via onClick: a synthetic click is unreliable
    // after a touch gesture, and gating it on a drag distance that never
    // reset meant one swipe disabled tapping for good.
    const slot = (e.target as HTMLElement).closest<HTMLElement>("[data-slot-index]");
    drag.current = {
      down: true,
      x: e.clientX,
      moved: 0,
      downIndex: slot ? Number(slot.dataset.slotIndex) : -1,
      lastTravel: 0,
    };
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const d = drag.current;
    if (!d.down) return;
    d.moved = e.clientX - d.x;
  }, []);

  const onPointerUp = useCallback(() => {
    const d = drag.current;
    if (!d.down) return;
    d.down = false;
    // Remember how far this press travelled BEFORE resetting: the promote
    // overlay's click event fires after pointerup and must be able to tell a
    // tap from the end of a swipe.
    d.lastTravel = Math.abs(d.moved);
    if (d.lastTravel > 45) {
      go(d.moved < 0 ? 1 : -1);
    } else if (d.lastTravel < 10 && d.downIndex >= 0) {
      setActive(d.downIndex);
    }
    d.moved = 0;
    d.downIndex = -1;
  }, [go]);

  // Tallest card sets the stage height, so moving between programmes never
  // shifts the page underneath the reader.
  const [stageH, setStageH] = useState<number | undefined>(undefined);
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => {
      const ghosts = el.querySelectorAll<HTMLElement>(".gttier-ghost");
      let tallest = 0;
      ghosts.forEach((g) => (tallest = Math.max(tallest, g.offsetHeight)));
      if (tallest) setStageH(tallest);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className={className}>
      <style>{CSS}</style>

      <div
        ref={stageRef}
        className="gttier-stage"
        role="group"
        aria-label="The three protection programmes"
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{ height: stageH }}
      >
        <div className="gttier-track" style={{ height: stageH }}>
          {/* invisible copies purely to measure the tallest card */}
          {tiers.map((tier) => (
            <div key={`ghost-${tier.key}`} className="gttier-ghost" aria-hidden>
              <TierCard tier={tier} active={false} />
            </div>
          ))}

          {tiers.map((tier, i) => {
            const offset = i - active;
            const abs = Math.abs(offset);
            const isActive = offset === 0;
            // Sides sit well clear of the active card (72%) rather than tucked
            // behind it: a buyer has to be able to see the neighbouring
            // programme's price to have any reason to move to it.
            const transform = isActive
              ? "translateX(0) translateZ(0) rotateY(0deg) scale(1)"
              : `translateX(${offset * 72}%) translateZ(${-110 - (abs - 1) * 70}px) rotateY(${offset > 0 ? -26 : 26}deg) scale(${1 - abs * 0.04})`;
            return (
              <div
                key={tier.key}
                className={`gttier-slot ${isActive ? "is-active" : abs === 1 ? "is-side" : "is-far"}`}
                data-slot-index={i}
                style={{
                  transform,
                  opacity: isActive ? 1 : abs === 1 ? 0.82 : 0.6,
                  filter: isActive ? "none" : "saturate(.85)",
                }}
              >
                {/* Header alignment follows the card's place in the ladder, so the
                    name and price sit on the edge that stays visible when the
                    card is tucked behind the active one. */}
                <TierCard
                  tier={tier}
                  active={isActive}
                  onTierCta={onTierCta}
                  align={i === 0 ? "left" : i === tiers.length - 1 ? "right" : "center"}
                />
                {/* A backgrounded card is one big button: click ANYWHERE on it to
                    bring it forward. A real overlay element — not pointer math —
                    so it cannot break, it's keyboard-focusable, and it stops the
                    card's own CTA from firing while the card is behind. */}
                {!isActive && (
                  <button
                    type="button"
                    aria-label={`Show the ${tier.name} programme`}
                    className="absolute inset-0 z-20 cursor-pointer rounded-2xl"
                    onClick={() => {
                      if (drag.current.lastTravel > 10) return; // end of a swipe, not a tap
                      setActive(i);
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Price rail. The ladder has to be readable WITHOUT swiping, otherwise
          there is no reason to swipe — and it doubles as the control. */}
      <div className="gttier-rail" role="tablist" aria-label="Choose a programme">
        {tiers.map((tier, i) => (
          <button
            key={tier.key}
            type="button"
            role="tab"
            aria-selected={i === active}
            className={`gttier-pill ${i === active ? "is-on" : ""}`}
            onClick={() => setActive(i)}
          >
            <span className="gttier-pill-name">{tier.name.replace("GT ", "")}</span>
            <span className="gttier-pill-price">AED {fmt(tier.fullBody)}</span>
          </button>
        ))}
      </div>

      {/* THE UPGRADE MATH — the actual sales argument of the ladder. Each step's
          delta is computed from the live prices and answered in plain English:
          this is what the extra money buys. Without this, three cards are just
          three prices and the buyer defaults to the cheapest. */}
      <div className="mx-auto mt-10 grid max-w-4xl gap-4 md:grid-cols-2">
        {tiers.map((tier, i) => {
          if (!tier.upgrade || i === 0) return null;
          const prev = tiers[i - 1];
          const delta = tier.fullBody - prev.fullBody;
          return (
            <div
              key={`upgrade-${tier.key}`}
              className="relative overflow-hidden rounded-xl border border-primary/25 px-6 py-5"
              style={{
                background:
                  "radial-gradient(120% 120% at 0% 0%, hsl(38 60% 20% / .25), transparent 55%), linear-gradient(160deg, hsl(0 0% 11%), hsl(0 0% 7%))",
              }}
            >
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {prev.name.replace("GT ", "")} → {tier.name.replace("GT ", "")}
                </span>
                <span className="text-[17px] font-semibold text-primary">+AED {fmt(delta)}</span>
                <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  buys you
                </span>
              </div>
              <p className="mt-2.5 text-[13.5px] leading-relaxed text-foreground/85">{tier.upgrade}</p>
            </div>
          );
        })}
      </div>

      <p className="mx-auto mt-8 max-w-2xl text-center text-xs leading-relaxed text-muted-foreground">
        {GT_INSTALL_STANDARD}
      </p>

      {/* The spec sheet. The selected programme's column stays lit, so the
          carousel and the table read as one control. */}
      <TierCompareTable className="mt-14" activeTier={tiers[active]?.key} />
    </div>
  );
};

export default TierCardsGT;
