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
  detail: string;
  value: number;
};

const includedTiles: IncludedTile[] = [
  {
    label: "Paint correction",
    detail: "Multi-stage",
    value: 999,
  },
  {
    label: "Full detailing",
    detail: "Interior + exterior",
    value: 499,
  },
  {
    label: "Protection extras",
    detail: "Headlights + sills",
    value: 499,
  },
  {
    label: "Ceramic upgrades",
    detail: "Leather + rims",
    value: 898,
  },
];

const includedValueTotal = includedTiles.reduce((total, item) => total + item.value, 0);

const whatsappButtonClass =
  "w-full border-0 bg-[#25D366] text-white shadow-[0_18px_46px_rgba(37,211,102,0.28)] transition-all duration-200 ease-out hover:bg-[#1fbe5c] hover:text-white hover:shadow-[0_24px_56px_rgba(37,211,102,0.38)]";

const formatAED = (value: number) => `AED ${value.toLocaleString("en-AE")}`;

export default function PpfQuoteSummary({
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
            className="rounded-full border border-white/10 bg-black/24 px-3 py-1.5 text-xs font-medium text-white/92"
          >
            {item}
          </span>
        ))}
      </div>

      {vehicleSummary ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-1">
          <p className="text-[11px] uppercase tracking-[0.22em] text-white/48">For your car</p>
          <p className="text-base font-semibold text-white">{vehicleSummary}</p>
        </div>
      ) : null}

      <div className="rounded-[28px] border border-primary/18 bg-[radial-gradient(circle_at_top_left,rgba(245,181,43,0.22),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(8,8,8,0.96))] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.34)] sm:p-6">
        <div className="min-w-0 max-w-[760px]">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-[11px] uppercase tracking-[0.24em] text-white/58">Starting from</p>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/18 bg-[linear-gradient(180deg,rgba(245,181,43,0.16),rgba(245,181,43,0.08))] px-3 py-1.5 text-sm font-semibold text-[#ffd47a]">
              <Sparkles className="h-4 w-4 text-primary" />
              Included value {formatAED(includedValueTotal)}+
            </div>
          </div>
          <p className="mt-2 text-[3.55rem] font-black leading-[0.9] tracking-[-0.075em] text-white sm:text-[4.9rem]">
            {formatAED(selection.estimateMin)}
          </p>
          <p className="mt-2 text-xs uppercase tracking-[0.18em] text-white/42">Prices shown exclude VAT</p>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-100">
            Includes <span className="font-semibold text-[#ffd47a]">{formatAED(includedValueTotal)}+</span> in prep,
            detailing, protection extras, and lifetime inspection support.
          </p>

          <Button
            type="button"
            variant="default"
            className={cn(whatsappButtonClass, "mt-4 max-w-[420px]")}
            size="lg"
            onClick={onWhatsAppClick}
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            {ctaLabel}
          </Button>
          <p className="mt-3 text-sm text-white/68">Lifetime inspection support stays included.</p>
        </div>
      </div>

      <div className="px-1 pt-1">
        <p className="text-[11px] uppercase tracking-[0.22em] text-white/52">Included as standard</p>
        <p className="mt-2 text-2xl font-semibold leading-tight text-white">
          Premium work many shops add later
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {includedTiles.map((item) => (
            <div
              key={item.label}
              className="rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(10,10,10,0.96))] px-4 py-4 shadow-[0_12px_36px_rgba(0,0,0,0.16)]"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="max-w-[70%] text-sm font-semibold text-white">{item.label}</p>
                <span className="shrink-0 rounded-full border border-primary/16 bg-primary/12 px-2.5 py-1 text-[11px] font-semibold text-[#ffd47a]">
                  {formatAED(item.value)}
                </span>
              </div>
              <p className="mt-3 text-sm text-slate-300">{item.detail}</p>
            </div>
          ))}
        </div>

        <p className="mt-4 text-sm text-slate-300">
          <span className="font-semibold text-white">Lifetime support included.</span> Inspection support after handover.
        </p>
      </div>
    </div>
  );
}
