import { useCallback, useEffect, useRef, type ReactNode } from "react";
import gtLogo from "@/assets/logo.svg";

/**
 * The certificate as a milled, filmed, slowly-turning collectible card.
 *
 * Real 3D CSS transforms over the live DOM rather than a rendered/AI 3D mesh:
 * a card is geometrically a plane, so a mesh buys nothing, and baking the
 * document into a texture would freeze its text and blur the fine print.
 *
 * Motion is ONE rAF loop over a single mutable state object, so the card is
 * never static and every input is just a change of target — no CSS transition
 * and no keyframe animation ever touches the card's transform (the vertical
 * bob lives on a separate wrapper for exactly that reason).
 *
 *   idle        slow continuous Y rotation, showing front and back
 *   hover       unwinds to the nearest front-facing angle, then follows cursor
 *   press+drag  free orbit, with inertia carried on release
 *   touch       swipe horizontally to spin it; vertical stays page scroll
 *
 * The film layer is what makes it read as PPF rather than a glossy card: a
 * hairline edge inset from the border (film stops short and catches light
 * there), a hard specular highlight, and faint orange-peel texture.
 */

const CSS = `
.gt3d-stage{perspective:1500px;perspective-origin:50% 42%;touch-action:pan-y}
.gt3d-bob{position:relative;animation:gt3d-bob 8s ease-in-out infinite;will-change:transform}
.gt3d-card{
  position:relative;transform-style:preserve-3d;will-change:transform;cursor:grab;
  /* Resting attitude is never dead-on flat, so the card always reads as an
     object with a near and a far edge rather than a rectangle on the page. */
  transform:
    rotateX(calc(-7deg + var(--gt3d-rx, 0) * 1deg))
    rotateY(calc(var(--gt3d-ry, 0) * 1deg))
    rotateZ(-1.4deg);
}
.gt3d-card.is-dragging{cursor:grabbing}
.gt3d-face{backface-visibility:hidden;-webkit-backface-visibility:hidden}

/* Extruded thickness: slabs stacked back from the face. Cheaper and far more
   robust than four transform-origin edge planes, and correct at any size —
   at an angle their stacked edges read as one milled edge. */
.gt3d-slab{
  position:absolute;inset:0;border-radius:12px;pointer-events:none;
  background:linear-gradient(115deg,hsl(30 18% 18%),hsl(38 45% 32%) 34%,hsl(42 70% 46%) 52%,hsl(34 30% 24%) 74%,hsl(28 16% 14%));
}

.gt3d-back{
  position:absolute;inset:0;transform:translateZ(-11.1px) rotateY(180deg);
  border-radius:12px;overflow:hidden;
  background:radial-gradient(120% 90% at 30% 12%, hsl(220 8% 13%), hsl(220 7% 7%) 60%, hsl(220 8% 9%));
  display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;
  box-shadow:inset 0 0 0 1px hsl(38 60% 50% / .28);
}
.gt3d-back-logo{width:min(62%,300px);height:auto;display:block;filter:drop-shadow(0 0 22px hsl(38 92% 58% / .22))}
.gt3d-back-rule{width:52%;height:1px;margin:16px 0 12px;background:linear-gradient(90deg,transparent,hsl(38 60% 50% / .7),transparent)}
.gt3d-back-title{font-family:'Cormorant Garamond',Georgia,serif;font-size:clamp(15px,3.4cqw,22px);letter-spacing:.14em;color:hsl(0 0% 88%)}
.gt3d-back-sub{margin-top:9px;font-size:8.5px;font-weight:600;letter-spacing:.3em;text-transform:uppercase;color:hsl(38 18% 58%)}
.gt3d-back-foot{position:absolute;bottom:14px;font-size:7.5px;letter-spacing:.26em;text-transform:uppercase;color:hsl(38 14% 40%)}

/* ---------- the film ---------- */
.gt3d-filmedge{
  position:absolute;inset:7px;border-radius:9px;pointer-events:none;z-index:5;
  box-shadow:
    0 0 0 1px hsl(0 0% 100% / .07),
    0 0 0 1.5px hsl(200 40% 85% / .05),
    inset 0 1px 0 hsl(0 0% 100% / .09);
}
.gt3d-filmtex{
  position:absolute;inset:7px;border-radius:9px;pointer-events:none;z-index:5;opacity:.5;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='o'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.42' numOctaves='2'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.045 0'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23o)'/%3E%3C/svg%3E");
  mix-blend-mode:overlay;
}
.gt3d-gloss{
  position:absolute;inset:7px;border-radius:9px;pointer-events:none;z-index:6;
  background:
    radial-gradient(30% 42% at calc(var(--gt3d-gx, 50) * 1%) calc(var(--gt3d-gy, 26) * 1%),
      hsl(0 0% 100% / .2) 0%, hsl(45 100% 94% / .08) 38%, transparent 66%),
    linear-gradient(calc(var(--gt3d-ry, 0) * 2deg + 115deg),
      transparent 42%, hsl(0 0% 100% / .05) 50%, transparent 58%);
  opacity:var(--gt3d-glossOn, .62);mix-blend-mode:screen;
}
.gt3d-holo{
  position:absolute;inset:7px;border-radius:9px;pointer-events:none;z-index:4;
  background:conic-gradient(from calc(var(--gt3d-ry, 0) * 3deg) at 50% 50%,
    hsl(42 90% 62% / .06), hsl(20 90% 60% / .04), hsl(48 90% 70% / .06),
    hsl(30 80% 55% / .03), hsl(42 90% 62% / .06));
  opacity:.5;mix-blend-mode:soft-light;
}
.gt3d-rim{
  position:absolute;inset:0;border-radius:12px;pointer-events:none;z-index:7;
  box-shadow:inset 0 1px 0 hsl(45 100% 88% / .2), inset 0 -1px 0 hsl(0 0% 0% / .5);
}
/* Ground shadow. Lives OUTSIDE the card: inside preserve-3d it rotated with
   the card and swung around as a dark blob instead of staying on the floor. */
.gt3d-shadow{
  position:absolute;left:8%;right:8%;bottom:-5%;height:12%;z-index:0;
  background:radial-gradient(closest-side, hsl(0 0% 0% / .55), transparent 76%);
  filter:blur(18px);pointer-events:none;
}

@keyframes gt3d-bob{
  0%,100%{transform:translateY(0)}
  50%    {transform:translateY(-9px)}
}
@media (prefers-reduced-motion:reduce){
  .gt3d-bob{animation:none}
  .gt3d-gloss,.gt3d-holo,.gt3d-filmtex{display:none}
}
`;

interface Card3DProps {
  children: ReactNode;
  className?: string;
  /** Max hover tilt in degrees. Kept low so the document stays readable. */
  max?: number;
  backTitle?: string;
  backSub?: string;
}

interface Ctl {
  /** Pointer position in card-local 0..1 while hovering, else null. */
  hover: { x: number; y: number } | null;
  dragging: boolean;
  lastX: number;
  lastY: number;
  /** Distance travelled while held — distinguishes a click from a drag. */
  travel: number;
  /** User-applied X rotation from dragging; decays back to rest on release. */
  dragRx: number;
  /** Inertia carried out of a drag, in deg/ms. */
  velSpin: number;
  boost: number;
}

const Card3D = ({
  children,
  className = "",
  max = 9,
  backTitle = "THE OWNER'S WARRANTY",
  backSub = "Signed · Numbered · Registered",
}: Card3DProps) => {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const ctl = useRef<Ctl>({
    hover: null,
    dragging: false,
    lastX: 0,
    lastY: 0,
    travel: 0,
    dragRx: 0,
    velSpin: 0,
    boost: 1,
  });

  useEffect(() => {
    const stage = stageRef.current;
    const card = cardRef.current;
    if (!stage || !card) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      card.style.setProperty("--gt3d-rx", "0");
      card.style.setProperty("--gt3d-ry", "0");
      return;
    }

    const touch = window.matchMedia("(hover: none)").matches;
    const c = ctl.current;

    let spin = 0;
    let tiltY = 0;
    let rx = 0;
    let gx = 50;
    let gy = 26;
    let gloss = 0.62;
    let raf = 0;
    let running = false;
    let last = performance.now();

    const REVOLUTION_MS = 15000;

    const loop = (now: number) => {
      const dt = Math.min(50, now - last);
      last = now;
      c.boost += (1 - c.boost) * 0.045;

      let tGx = gx;
      let tGy = gy;
      let tGloss = gloss;
      let k = 0.05;

      if (c.dragging) {
        // free orbit: the pointer handler writes spin/dragRx directly
        spin += c.velSpin * dt;
        rx = c.dragRx;
        tGx = 50 + Math.sin((spin * Math.PI) / 180) * 26;
        tGy = 30;
        tGloss = 1;
        k = 0.2;
      } else if (c.hover) {
        // engaged: unwind to the nearest front-facing angle so the document
        // squares up to the reader, then follow the cursor
        const front = Math.round(spin / 360) * 360;
        spin += (front - spin) * 0.075;
        rx += ((0.5 - c.hover.y) * 2 * max + c.dragRx - rx) * 0.16;
        tiltY += ((c.hover.x - 0.5) * 2 * max - tiltY) * 0.16;
        tGx = c.hover.x * 100;
        tGy = c.hover.y * 100;
        tGloss = 1;
        k = 0.16;
        c.dragRx *= 0.9;
      } else {
        // inertia from a released drag, then the standing slow rotation
        spin += c.velSpin * dt;
        c.velSpin *= 0.93;
        // Angle-dependent rate: quick through the thin edge-on angles, slowest
        // square to the reader, and noticeably longer on the front than the
        // back — the card presents itself rather than just revolving.
        const rad = (spin * Math.PI) / 180;
        const edge = Math.abs(Math.sin(rad)); // 1 edge-on, 0 flat to viewer
        const frontness = (1 + Math.cos(rad)) / 2; // 1 front, 0 back
        const rate = (0.34 + 2.5 * edge * edge) * (1 - 0.6 * frontness);
        spin += (dt / REVOLUTION_MS) * 360 * rate * c.boost;
        if (spin > 3600) spin -= 3600;
        if (spin < -3600) spin += 3600;
        c.dragRx *= 0.955;
        rx += (Math.sin(now * 0.00026) * max * 0.16 + c.dragRx - rx) * 0.05;
        tiltY += (0 - tiltY) * 0.05;
        tGx = 50 + Math.sin((spin * Math.PI) / 180) * 26;
        tGy = 26 + Math.sin(now * 0.00026) * 8;
        tGloss = touch ? 0.8 : 0.62;
      }

      gx += (tGx - gx) * k;
      gy += (tGy - gy) * k;
      gloss += (tGloss - gloss) * 0.06;

      card.style.setProperty("--gt3d-rx", rx.toFixed(3));
      card.style.setProperty("--gt3d-ry", (spin + tiltY).toFixed(3));
      card.style.setProperty("--gt3d-gx", gx.toFixed(2));
      card.style.setProperty("--gt3d-gy", gy.toFixed(2));
      card.style.setProperty("--gt3d-glossOn", gloss.toFixed(3));

      raf = requestAnimationFrame(loop);
    };

    const start = () => {
      if (running) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const io = new IntersectionObserver(
      (entries) => (entries.some((e) => e.isIntersecting) ? start() : stop()),
      { threshold: 0 },
    );
    io.observe(stage);
    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVis);

    return () => {
      stop();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [max]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button, a, input, [role='button']")) return;
    const c = ctl.current;
    c.dragging = true;
    c.travel = 0;
    c.lastX = e.clientX;
    c.lastY = e.clientY;
    c.velSpin = 0;
    cardRef.current?.classList.add("is-dragging");
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const c = ctl.current;
      if (c.dragging) {
        const dx = e.clientX - c.lastX;
        const dy = e.clientY - c.lastY;
        c.lastX = e.clientX;
        c.lastY = e.clientY;
        c.travel += Math.abs(dx) + Math.abs(dy);
        c.velSpin = dx * 0.012;
        // On touch the vertical axis belongs to the page: touch-action pan-y
        // lets the finger scroll, so only horizontal drag turns the card.
        // Swipe it to spin; flick it and it keeps going.
        if (e.pointerType !== "touch") {
          c.dragRx = Math.max(-60, Math.min(60, c.dragRx - dy * 0.16));
        }
        return;
      }
      if (e.pointerType === "touch") return; // touch scrolls, it does not hover
      const stage = stageRef.current;
      if (!stage) return;
      const r = stage.getBoundingClientRect();
      c.hover = { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
    },
    [],
  );

  const endDrag = useCallback((e: React.PointerEvent) => {
    const c = ctl.current;
    if (!c.dragging) return;
    c.dragging = false;
    cardRef.current?.classList.remove("is-dragging");
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    // A press that barely moved does nothing: a tap-spin fought the standing
    // rotation and read as a glitch rather than an interaction.
  }, []);

  const onLeave = useCallback(
    (e: React.PointerEvent) => {
      ctl.current.hover = null;
      endDrag(e);
    },
    [endDrag],
  );

  return (
    <div
      ref={stageRef}
      className={`gt3d-stage ${className}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerLeave={onLeave}
    >
      <style>{CSS}</style>
      <div className="gt3d-bob">
        <div className="gt3d-shadow" aria-hidden />
        <div ref={cardRef} className="gt3d-card" style={{ containerType: "inline-size" }}>
          {Array.from({ length: 12 }, (_, i) => (
            <div
              key={i}
              className="gt3d-slab"
              aria-hidden
              style={{ transform: `translateZ(${-(i + 1) * 0.85}px)` }}
            />
          ))}

          {/* FRONT — the live certificate, with film applied over it */}
          <div className="gt3d-face" style={{ position: "relative" }}>
            {children}
            <div className="gt3d-holo" aria-hidden />
            <div className="gt3d-filmtex" aria-hidden />
            <div className="gt3d-gloss" aria-hidden />
            <div className="gt3d-filmedge" aria-hidden />
            <div className="gt3d-rim" aria-hidden />
          </div>

          {/* BACK — the real brand mark, not a bare monogram */}
          <div className="gt3d-face gt3d-back" aria-hidden>
            <img src={gtLogo} alt="" className="gt3d-back-logo" />
            <span className="gt3d-back-rule" />
            <span className="gt3d-back-title">{backTitle}</span>
            <span className="gt3d-back-sub">{backSub}</span>
            <span className="gt3d-back-foot">Grand Touch Auto · DIP 2 · Dubai</span>
            <div className="gt3d-holo" aria-hidden />
            <div className="gt3d-filmtex" aria-hidden />
            <div className="gt3d-gloss" aria-hidden />
            <div className="gt3d-filmedge" aria-hidden />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Card3D;
