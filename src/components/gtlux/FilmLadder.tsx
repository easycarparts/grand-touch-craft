import LuxCard from "./LuxCard";
import { GT_FILM_LADDER } from "@/lib/gtProgram";

/**
 * The Diamond Pro film ladder — Signature's premium TPU vs Concours' X (PCU).
 *
 * Desktop reads as a spec table; mobile gets two stacked tier cards instead —
 * a horizontally scrolling table on a phone buries the X column, which is the
 * whole argument (owner call, 2026-08-14). Shared by the films page and the
 * warranty funnel so the claims can never drift apart.
 */

const TIERS = [
  {
    key: "tpu" as const,
    program: "GT Signature · AED 12,900",
    film: "Diamond Pro",
    line: "Premium TPU",
    highlight: false,
  },
  {
    key: "x" as const,
    program: "GT Concours · AED 18,900",
    film: "Diamond Pro X",
    line: "PCU Flagship",
    highlight: true,
  },
];

const COVENANT =
  "Whichever film your tier wears, the GT warranty sits on top — film and labour, yellowing covered, no UV carve-out. Two documents, one car.";

const FilmLadder = () => (
  <LuxCard as="div">
    {/* ——— md+: the spec table ——— */}
    <div className="hidden md:block">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr>
            <th className="w-[18%] border-b border-border/60 p-4 align-bottom text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              The film ladder
            </th>
            {TIERS.map((tier) => (
              <th
                key={tier.key}
                className={`w-[41%] border-b p-4 align-bottom ${
                  tier.highlight ? "border-primary/50 bg-primary/[0.05]" : "border-border/60"
                }`}
              >
                <div
                  className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${
                    tier.highlight ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {tier.program}
                </div>
                <div className="mt-1.5 text-[19px] font-semibold text-foreground">
                  {tier.film}{" "}
                  <span className={`text-[13px] font-medium ${tier.highlight ? "text-primary" : "text-primary/90"}`}>
                    {tier.line}
                  </span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-[13.5px] leading-relaxed">
          {GT_FILM_LADDER.map((row) => (
            <tr key={row.label}>
              <th className="border-b border-border/40 p-4 align-top text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {row.label}
              </th>
              <td className="border-b border-border/40 p-4 align-top text-foreground/80">{row.tpu}</td>
              <td className="border-b border-border/40 bg-primary/[0.04] p-4 align-top text-foreground/90">{row.x}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {/* ——— mobile: two stacked tier cards ——— */}
    <div className="space-y-4 p-4 md:hidden">
      {TIERS.map((tier) => (
        <section
          key={tier.key}
          className={`rounded-xl border p-5 ${
            tier.highlight ? "border-primary/50 bg-primary/[0.05]" : "border-border/60 bg-white/[0.015]"
          }`}
        >
          <div
            className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${
              tier.highlight ? "text-primary" : "text-muted-foreground"
            }`}
          >
            {tier.program}
          </div>
          <div className="mt-1.5 text-[20px] font-semibold text-foreground">
            {tier.film}{" "}
            <span className={`text-[13.5px] font-medium ${tier.highlight ? "text-primary" : "text-primary/90"}`}>
              {tier.line}
            </span>
          </div>
          <dl className="mt-4 space-y-3.5">
            {GT_FILM_LADDER.map((row) => (
              <div key={row.label} className="border-t border-border/40 pt-3">
                <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {row.label}
                </dt>
                <dd className="mt-1 text-[13.5px] leading-relaxed text-foreground/85">
                  {tier.key === "tpu" ? row.tpu : row.x}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>

    <p className="border-l-2 border-primary/60 bg-primary/[0.04] px-6 py-5 text-[14px] italic leading-relaxed text-foreground/85 md:px-8">
      {COVENANT}
    </p>
  </LuxCard>
);

export default FilmLadder;
