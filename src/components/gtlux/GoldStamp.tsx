import { useEffect, useRef } from "react";
import "./gt-lux.css";

interface GoldStampProps {
  size?: number | string;
  className?: string;
  /** Text ring around the seal. */
  ringText?: string;
  monogram?: string;
}

/** Gold-leaf wax seal that stamps down when scrolled into view. */
const GoldStamp = ({
  size = "clamp(96px, 13vw, 128px)",
  className = "",
  ringText = "GRAND TOUCH · DUBAI · EST. 2026 · LIFETIME ·",
  monogram = "GT",
}: GoldStampProps) => {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const stamp = el.querySelector(".gtlux-stamp");
    if (!stamp) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((en) => en.isIntersecting)) {
          stamp.classList.add("is-stamped");
          io.disconnect();
        }
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg className="gtlux-stamp" viewBox="0 0 120 120" style={{ width: "100%", height: "100%" }} aria-hidden>
        <defs>
          <linearGradient id="gtlux-seal-foil" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="hsl(34 75% 40%)" />
            <stop offset="0.3" stopColor="hsl(42 95% 66%)" />
            <stop offset="0.55" stopColor="hsl(38 92% 52%)" />
            <stop offset="0.8" stopColor="hsl(45 96% 74%)" />
            <stop offset="1" stopColor="hsl(34 75% 40%)" />
          </linearGradient>
          <path id="gtlux-seal-ring" d="M 60,60 m -41,0 a 41,41 0 1,1 82,0 a 41,41 0 1,1 -82,0" />
          <filter id="gtlux-seal-texture">
            <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="2" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="1.6" />
          </filter>
        </defs>
        <circle cx="60" cy="60" r="57" fill="url(#gtlux-seal-foil)" opacity="0.16" />
        <g filter="url(#gtlux-seal-texture)">
          <circle cx="60" cy="60" r="52" fill="url(#gtlux-seal-foil)" opacity="0.92" />
        </g>
        <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(30 60% 25%)" strokeWidth="0.6" opacity="0.6" />
        <circle cx="60" cy="60" r="46" fill="none" stroke="hsl(30 70% 22%)" strokeWidth="0.8" opacity="0.7" />
        <circle cx="60" cy="60" r="33" fill="none" stroke="hsl(30 70% 22%)" strokeWidth="0.8" opacity="0.7" />
        <text fontSize="8.2" fontFamily="Poppins, sans-serif" fontWeight="600" letterSpacing="2.6" fill="hsl(28 80% 20%)">
          <textPath href="#gtlux-seal-ring" startOffset="0%">
            {ringText}
          </textPath>
        </text>
        <text
          x="60"
          y="72"
          textAnchor="middle"
          fontFamily="'Cormorant Garamond', Georgia, serif"
          fontWeight="600"
          fontSize="34"
          fill="hsl(28 80% 20%)"
        >
          {monogram}
        </text>
      </svg>
      <span className="gtlux-stamp-shockwave" aria-hidden />
    </div>
  );
};

export default GoldStamp;
