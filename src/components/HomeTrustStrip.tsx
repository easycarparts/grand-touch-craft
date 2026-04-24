import { Card } from "@/components/ui/card";
import { Star, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

const GoogleWordmark = ({ className }: { className?: string }) => (
  <span aria-label="Google" className={cn("font-semibold tracking-tight", className)}>
    <span className="text-[#4285F4]">G</span>
    <span className="text-[#EA4335]">o</span>
    <span className="text-[#FBBC05]">o</span>
    <span className="text-[#4285F4]">g</span>
    <span className="text-[#34A853]">l</span>
    <span className="text-[#EA4335]">e</span>
  </span>
);

const HomeTrustStrip = () => {
  return (
    <section className="relative bg-[#070707] px-3 pt-10 pb-4 sm:px-6 sm:pt-14 lg:px-8">
      <div className="container mx-auto max-w-7xl">
        <div className="grid gap-4 sm:gap-5 md:grid-cols-3">
          {/* Google Reviews pillar */}
          <Card className="flex items-center gap-4 rounded-[24px] border-[#4285F4]/20 bg-[linear-gradient(180deg,rgba(66,133,244,0.09),rgba(255,255,255,0.02)_32%)] p-4 text-white sm:p-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/30">
              <GoogleWordmark className="text-sm" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="h-3.5 w-3.5 fill-[#fbbc05] text-[#fbbc05]" />
                ))}
                <span className="ml-1 text-sm font-semibold text-white">4.9</span>
              </div>
              <p className="mt-1 text-[13px] leading-5 text-white/70">
                Top-rated by real Dubai owners on Google.
              </p>
            </div>
          </Card>

          {/* STEK authorized pillar */}
          <Card className="flex items-center gap-4 rounded-[24px] border-[#f59e0b]/20 bg-[linear-gradient(180deg,rgba(245,158,11,0.10),rgba(255,255,255,0.02)_32%)] p-4 text-white sm:p-5">
            <div className="flex h-12 w-20 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/30 p-2">
              <img
                src="/stek-logo.webp"
                alt="STEK official brand logo"
                className="h-full w-auto object-contain"
                loading="lazy"
              />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f6c76d]">
                Authorized installer
              </p>
              <p className="mt-1 text-[13px] leading-5 text-white/70">
                Factory-trained STEK PPF &amp; colour wrap application.
              </p>
            </div>
          </Card>

          {/* Full-service studio pillar */}
          <Card className="flex items-center gap-4 rounded-[24px] border-[#5f8f79]/20 bg-[linear-gradient(180deg,rgba(95,143,121,0.12),rgba(255,255,255,0.02)_32%)] p-4 text-white sm:p-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/30 text-[#9dc3b0]">
              <Wrench className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9dc3b0]">
                Studio & garage
              </p>
              <p className="mt-1 text-[13px] leading-5 text-white/70">
                PPF, paint, ceramic, diagnostics and restoration under one roof.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default HomeTrustStrip;
