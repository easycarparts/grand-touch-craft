import { useCallback, useEffect, useRef, type ReactNode } from "react";
import "./gt-lux.css";

interface LuxCardProps {
  children: ReactNode;
  className?: string;
  /** Draw the gold pinstripe border with smoke wisps (theatre pages only). */
  pinstripe?: boolean;
  as?: "div" | "section" | "article";
}

/**
 * Black textured card with a cursor-tracked specular sheen.
 * Sets --gt-mx / --gt-my (0..1) on the card; .gtlux-foil children shift
 * their gold gradient toward the light so foil genuinely catches it.
 * On touch devices the sheen auto-pans (see gt-lux.css @media hover:none).
 */
const LuxCard = ({ children, className = "", pinstripe = false, as: Tag = "div" }: LuxCardProps) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const frame = useRef<number>(0);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    cancelAnimationFrame(frame.current);
    const { clientX, clientY } = e;
    frame.current = requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect();
      el.style.setProperty("--gt-mx", String((clientX - rect.left) / rect.width));
      el.style.setProperty("--gt-my", String((clientY - rect.top) / rect.height));
    });
  }, []);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  // Pinstripe: measure perimeter for the draw animation, start when in view.
  useEffect(() => {
    if (!pinstripe) return;
    const svg = svgRef.current;
    const el = ref.current;
    if (!svg || !el) return;
    const rectEl = svg.querySelector("rect");
    if (!rectEl) return;
    const setPerimeter = () => {
      const b = el.getBoundingClientRect();
      const perimeter = 2 * (b.width + b.height);
      svg.style.setProperty("--gt-perimeter", String(Math.ceil(perimeter)));
    };
    setPerimeter();
    const ro = new ResizeObserver(setPerimeter);
    ro.observe(el);
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((en) => en.isIntersecting)) {
          svg.classList.add("is-drawing");
          io.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => {
      ro.disconnect();
      io.disconnect();
    };
  }, [pinstripe]);

  return (
    <Tag
      ref={ref as never}
      className={`gtlux-card gtlux-ambient ${className}`}
      onPointerMove={onPointerMove}
      style={{ boxShadow: "0 40px 90px -20px hsl(0 0% 0% / .8), 0 0 60px hsl(38 92% 58% / .1)" }}
    >
      <div className="gtlux-sheen" aria-hidden />
      {pinstripe && (
        <>
          <svg ref={svgRef} className="gtlux-pinstripe" aria-hidden>
            <defs>
              <linearGradient id="gtlux-foil-stroke" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="hsl(34 75% 44%)" />
                <stop offset="0.3" stopColor="hsl(42 95% 68%)" />
                <stop offset="0.55" stopColor="hsl(38 92% 55%)" />
                <stop offset="0.8" stopColor="hsl(45 96% 78%)" />
                <stop offset="1" stopColor="hsl(34 75% 44%)" />
              </linearGradient>
            </defs>
            {/* geometry comes from CSS (see gt-lux.css); attrs are the no-CSS fallback */}
            <rect width="100%" height="100%" rx="6" />
          </svg>
          {/* smoke wisps rising off the pinstripe */}
          <span className="gtlux-smoke" style={{ top: "8%", left: "4%", animationDelay: "1.1s" }} aria-hidden />
          <span className="gtlux-smoke" style={{ top: "2%", left: "38%", animationDelay: "2.6s" }} aria-hidden />
          <span className="gtlux-smoke" style={{ top: "1%", right: "18%", animationDelay: "4s" }} aria-hidden />
          <span className="gtlux-smoke" style={{ bottom: "6%", right: "5%", animationDelay: "3.2s" }} aria-hidden />
        </>
      )}
      <div style={{ position: "relative", zIndex: 3 }}>{children}</div>
    </Tag>
  );
};

export default LuxCard;
