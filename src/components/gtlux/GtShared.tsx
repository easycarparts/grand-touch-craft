import { useEffect, useState } from "react";
import { GT_FAQ, GT_FILMS, GT_FILMS_LINE, GT_TRUST, type GtFaqItem } from "@/lib/gtProgram";

/** Eyebrow + display heading + support line. */
export const GtSection = ({
  eyebrow,
  title,
  sub,
  children,
  className = "",
  id,
}: {
  eyebrow?: string;
  title: string;
  sub?: string;
  children?: React.ReactNode;
  className?: string;
  id?: string;
}) => (
  <section id={id} className={`mx-auto w-full max-w-5xl px-4 py-14 md:py-20 ${className}`}>
    <div className="mb-8 text-center md:mb-10">
      {eyebrow && (
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">{eyebrow}</div>
      )}
      <h2 className="!text-3xl md:!text-4xl lg:!text-5xl">{title}</h2>
      {sub && <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">{sub}</p>}
    </div>
    {children}
  </section>
);

/** Trust row — renders only the values that actually exist in GT_TRUST. */
export const GtTrustRow = ({ className = "" }: { className?: string }) => {
  if (GT_TRUST.googleRating == null && GT_TRUST.carsProtected == null) return null;
  return (
    <div className={`flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[12.5px] text-muted-foreground ${className}`}>
      {GT_TRUST.googleRating != null && (
        <span>
          <span className="text-primary">★</span> <b className="font-semibold text-foreground">{GT_TRUST.googleRating}</b> Google rating
        </span>
      )}
      {GT_TRUST.carsProtected != null && (
        <span>
          <b className="font-semibold text-foreground">{GT_TRUST.carsProtected}</b> cars protected
        </span>
      )}
      <span>
        Full terms <b className="font-semibold text-foreground">published</b>
      </span>
    </div>
  );
};

/** FAQ accordion — answers always present in the DOM for crawlers. */
export const GtFaq = ({ items = GT_FAQ, className = "" }: { items?: GtFaqItem[]; className?: string }) => (
  <div className={`mx-auto max-w-2xl ${className}`}>
    {items.map((f) => (
      <details key={f.q} className="group border-b border-border/60 px-1 py-4">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[15px] font-medium text-foreground [&::-webkit-details-marker]:hidden">
          {f.q}
          <span aria-hidden className="text-primary transition-transform group-open:rotate-45">
            +
          </span>
        </summary>
        <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">{f.a}</p>
      </details>
    ))}
  </div>
);

/**
 * Film roster as typographic wordmarks separated by gold diamonds.
 * Deliberately not logo images: brands are credentials, not the headline.
 */
export const GtFilmStrip = ({ className = "" }: { className?: string }) => (
  <div className={className}>
    <p className="mx-auto mb-9 max-w-2xl text-center text-sm leading-relaxed text-muted-foreground">{GT_FILMS_LINE}</p>
    <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-4">
      {GT_FILMS.map((f, i) => (
        <div key={f.name} className="flex items-center gap-7">
          {i > 0 && <span aria-hidden className="h-1 w-1 rotate-45 bg-primary/50" />}
          <span className="text-[15px] font-medium uppercase tracking-[0.28em] text-foreground/60 transition-colors hover:text-foreground/90">
            {f.name}
          </span>
        </div>
      ))}
    </div>
  </div>
);

/** Sticky mobile WhatsApp bar; appears after scrolling past the hero. */
export const GtStickyBar = ({
  href,
  onClick,
  anchorLine = "From AED 7,900",
  subLine = "Lifetime warranty programs",
}: {
  href: string;
  onClick?: () => void;
  anchorLine?: string;
  subLine?: string;
}) => {
  // Initialised from the live scroll position: a bar mounted mid-page (e.g.
  // conditionally, after a section scrolls past) must not wait for the next
  // scroll event to become visible.
  const [on, setOn] = useState(() => typeof window !== "undefined" && window.scrollY > 560);
  useEffect(() => {
    const fn = () => setOn(window.scrollY > 560);
    fn();
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-50 flex h-[62px] items-center justify-between border-t border-border bg-popover/95 px-4 backdrop-blur transition-transform duration-300 md:hidden ${on ? "translate-y-0" : "translate-y-full"}`}
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="text-[11px] text-muted-foreground">
        <b className="block text-sm font-semibold text-foreground">{anchorLine}</b>
        {subLine}
      </div>
      {/* _blank keeps the page alive so onClick's fire-and-forget analytics
          writes aren't aborted by a same-tab navigation to wa.me. */}
      <a
        href={href}
        onClick={onClick}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-md px-5 py-2.5 text-sm font-semibold text-primary-foreground"
        style={{ background: "linear-gradient(135deg, hsl(38 92% 58%), hsl(18 95% 58%))" }}
      >
        WhatsApp Sean
      </a>
    </div>
  );
};
