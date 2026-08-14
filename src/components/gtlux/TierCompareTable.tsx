import { Fragment } from "react";
import { GT_COMPARISON, GT_TIERS, type GtTierKey } from "@/lib/gtProgram";

const fmt = (n: number) => n.toLocaleString("en-US");

/**
 * The full spec sheet. The cards carry three highlights each; everything that
 * actually separates the programmes lives here, so a buyer can see what the
 * extra money buys line by line instead of comparing paragraphs.
 *
 * A real <table> with proper scope attributes: it is the most machine-readable
 * form of the offer on the site, which matters for AI answer engines quoting
 * what each programme includes.
 *
 * On mobile the table scrolls inside its own container (never the page) with
 * the feature column pinned, so the row you are reading stays labelled.
 */

const CSS = `
.gtcmp-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:thin;scrollbar-color:hsl(38 45% 45% / .4) transparent}
.gtcmp{width:100%;min-width:640px;border-collapse:separate;border-spacing:0;font-size:13.5px}
.gtcmp th,.gtcmp td{padding:13px 16px;text-align:left;vertical-align:middle}
.gtcmp thead th{position:sticky;top:0;z-index:2;background:hsl(0 0% 9%);border-bottom:1px solid hsl(0 0% 20%);padding-top:20px;padding-bottom:18px;vertical-align:bottom}
.gtcmp .feat{
  position:sticky;left:0;z-index:1;background:hsl(0 0% 8%);
  color:hsl(0 0% 78%);font-weight:400;width:44%;
}
.gtcmp thead .feat{z-index:3;background:hsl(0 0% 9%)}
.gtcmp .feat small{display:block;margin-top:3px;font-size:11.5px;line-height:1.5;color:hsl(0 0% 52%)}
.gtcmp .val{text-align:center;width:18.6%;color:hsl(0 0% 88%)}
/* The featured column is lit from top to bottom so the eye tracks it down the
   whole sheet, not just at the header. */
.gtcmp .col-featured{background:hsl(38 92% 58% / .045)}
.gtcmp tbody tr{border-top:1px solid hsl(0 0% 100% / .05)}
.gtcmp tbody tr:hover .feat,.gtcmp tbody tr:hover .val{background-color:hsl(0 0% 100% / .022)}
.gtcmp tbody tr:hover .feat{background-color:hsl(0 0% 10%)}
.gtcmp .grp td{
  padding:26px 16px 9px;font-size:10.5px;font-weight:600;letter-spacing:.24em;
  text-transform:uppercase;color:hsl(38 55% 62%);background:transparent;
}
/* display:block is load-bearing — as inline spans the name, price and "from"
   line reflow into one another and the margins are ignored entirely. */
.gtcmp-tier{display:block;font-size:10.5px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:hsl(0 0% 60%);line-height:1.4}
.gtcmp-tier.on{color:hsl(38 92% 58%)}
.gtcmp-price{display:block;margin-top:7px;font-size:20px;font-weight:600;color:hsl(0 0% 98%);letter-spacing:-.01em;line-height:1.1;white-space:nowrap}
.gtcmp-from{display:block;margin-top:4px;font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:hsl(0 0% 50%);line-height:1.4}
.gtcmp-tick{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;
  background:hsl(38 92% 58% / .13);color:hsl(38 92% 62%)}
.gtcmp-dash{display:inline-block;width:12px;height:1px;background:hsl(0 0% 100% / .22)}
.gtcmp-text{font-size:12.5px;color:hsl(0 0% 92%)}
`;

const Tick = () => (
  <span className="gtcmp-tick" role="img" aria-label="Included">
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden>
      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </span>
);

const Dash = () => (
  <>
    <span className="gtcmp-dash" aria-hidden />
    <span className="sr-only">Not included</span>
  </>
);

const Cell = ({ value }: { value: boolean | string }) => {
  if (value === true) return <Tick />;
  if (value === false) return <Dash />;
  return <span className="gtcmp-text">{value}</span>;
};

const TierCompareTable = ({
  className = "",
  activeTier,
}: {
  className?: string;
  /** Highlights the column matching the carousel selection. */
  activeTier?: GtTierKey;
}) => (
  <div className={className}>
    <style>{CSS}</style>
    <div className="gtcmp-wrap rounded-xl border border-border/60 bg-[linear-gradient(160deg,hsl(0_0%_10%),hsl(0_0%_7%))]">
      <table className="gtcmp">
        <caption className="sr-only">
          What each Grand Touch protection programme includes, compared line by line
        </caption>
        <thead>
          <tr>
            <th scope="col" className="feat">
              <span className="gtcmp-tier">Compare everything</span>
            </th>
            {GT_TIERS.map((tier) => {
              const on = activeTier ? tier.key === activeTier : Boolean(tier.featured);
              return (
                <th
                  scope="col"
                  key={tier.key}
                  className={`val ${on ? "col-featured" : ""}`}
                >
                  <span className={`gtcmp-tier ${on ? "on" : ""}`}>{tier.name.replace("GT ", "")}</span>
                  <span className="gtcmp-price">AED {fmt(tier.fullBody)}</span>
                  <span className="gtcmp-from">
                    {tier.key === "concours" ? "from · full vehicle" : "from · full body"}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {GT_COMPARISON.map((group) => (
            // Fragment needs the key: a bare <> in a map has no identity, which
            // is what React was warning about.
            <Fragment key={group.group}>
              <tr className="grp">
                <td colSpan={4}>{group.group}</td>
              </tr>
              {group.rows.map((row) => {
                const cells: [GtTierKey, boolean | string][] = [
                  ["essential", row.essential],
                  ["signature", row.signature],
                  ["concours", row.concours],
                ];
                return (
                  <tr key={row.feature}>
                    <th scope="row" className="feat">
                      {row.feature}
                      {row.note && <small>{row.note}</small>}
                    </th>
                    {cells.map(([key, value]) => {
                      const on = activeTier ? key === activeTier : key === "signature";
                      return (
                        <td key={key} className={`val ${on ? "col-featured" : ""}`}>
                          <Cell value={value} />
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
    <p className="mt-4 text-center text-[11.5px] text-muted-foreground">All prices +VAT.</p>
  </div>
);

export default TierCompareTable;
