import { MessageCircle, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type PpfQuoteSummarySelection = {
  brand: "STEK" | "GYEON";
  warrantyYears: number;
  finish: "Gloss" | "Matte";
  size: "Sports" | "Small" | "Medium" | "SUV";
  coverage: "Front" | "Full Body";
  estimateMin: number;
  stekLine: string | null;
};

type IncludedTile = {
  label: string;
  value: number;
};

const includedTiles: IncludedTile[] = [
  { label: "Paint correction", value: 999 },
  { label: "Full detailing", value: 499 },
  { label: "Protection extras", value: 499 },
  { label: "Ceramic upgrades", value: 898 },
];

const includedValueTotal = includedTiles.reduce((total, item) => total + item.value, 0);

const whatsappButtonClass =
  "h-12 w-full max-w-[420px] rounded-2xl border-0 bg-[#25D366] px-6 text-white shadow-[0_18px_48px_rgba(37,211,102,0.32)] transition-all duration-200 ease-out hover:bg-[#1ebe5d] hover:text-white hover:shadow-[0_22px_58px_rgba(37,211,102,0.44)] active:scale-[0.99]";

const formatAED = (value: number) => `AED ${value.toLocaleString("en-AE")}`;

export default function PpfQuoteSummaryV1({
  selection,
  vehicleSummary,
  onWhatsAppClick,
  className,
  ctaLabel = "Discuss This Quote on WhatsApp",
}: {
  selection: PpfQuoteSummarySelection;
  vehicleSummary?: string;
  onWhatsAppClick: () => void;
  className?: string;
  ctaLabel?: string;
}) {
  const chips = [
    selection.stekLine ? `${selection.brand} ${selection.stekLine}` : selection.brand,
    `${selection.warrantyYears}-year`,
    selection.finish,
    selection.size,
    selection.coverage,
  ];

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-wrap gap-2">
        {chips.map((item) => (
          <span
            key={item}
            className="rounded-full border border-white/10 bg-black/18 px-3 py-1.5 text-xs font-medium text-white/82"
          >
            {item}
          </span>
        ))}
      </div>

      {vehicleSummary ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-1">
          <p className="text-[11px] uppercase tracking-[0.22em] text-white/42">For your car</p>
          <p className="text-base font-semibold text-white/94">{vehicleSummary}</p>
        </div>
      ) : null}

      <div className="rounded-[30px] border border-primary/12 bg-[radial-gradient(circle_at_top_left,rgba(245,181,43,0.16),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(10,10,10,0.98))] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.34)] sm:p-7">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-[11px] uppercase tracking-[0.24em] text-white/54">Starting from</p>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/16 bg-[linear-gradient(180deg,rgba(245,181,43,0.18),rgba(245,181,43,0.08))] px-3 py-1.5 text-sm font-semibold text-[#ffd47a]">
              <Sparkles className="h-4 w-4 text-primary" />
              Included value {formatAED(includedValueTotal)}+
            </div>
          </div>

          <p className="mt-3 text-[4rem] font-black leading-[0.9] tracking-[-0.085em] text-white sm:text-[5.7rem]">
            {formatAED(selection.estimateMin)}
          </p>
          <p className="mt-2 text-xs uppercase tracking-[0.18em] text-white/42">Prices shown exclude VAT</p>

          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-100">
            Includes{" "}
            <span className="font-semibold text-[#ffd47a]">{formatAED(includedValueTotal)}+</span>{" "}
            in prep, detailing, protection extras, and lifetime inspection support.
          </p>

          <Button
            type="button"
            variant="default"
            className={cn(whatsappButtonClass, "mt-5")}
            size="lg"
            onClick={onWhatsAppClick}
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            {ctaLabel}
          </Button>

          <div className="mt-6">
            <p className="text-[11px] uppercase tracking-[0.22em] text-white/50">Included as standard</p>
            <div className="mt-3 flex flex-wrap gap-2.5">
              {includedTiles.map((item) => (
                <div
                  key={item.label}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(8,8,8,0.92))] px-3.5 py-2 text-sm text-white/88"
                >
                  <span className="font-medium text-white">{item.label}</span>
                  <span className="rounded-full border border-primary/14 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-[#ffd47a]">
                    {formatAED(item.value)}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-slate-300">
              <span className="font-semibold text-white">Lifetime inspection support included.</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
