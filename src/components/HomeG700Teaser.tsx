import { ArrowRight, Palette, Sparkles, SlidersHorizontal } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const G700_PREVIEW_VIDEO_SRC =
  "https://res.cloudinary.com/diw6rekpm/video/upload/v1775556526/Jetour_EDIT_yi001t.mp4";

const pillars: Array<{ icon: JSX.Element; title: string; copy: string }> = [
  {
    icon: <Palette className="h-4 w-4" />,
    title: "6 colours × 2 finishes",
    copy: "See gloss vs matte side by side, in the exact colour you're ordering.",
  },
  {
    icon: <SlidersHorizontal className="h-4 w-4" />,
    title: "3 trim packages",
    copy: "Standard, blackout or paint-matched — swap live without reloading.",
  },
  {
    icon: <Sparkles className="h-4 w-4" />,
    title: "Live accessory pricing",
    copy: "Spoilers, light bars, roof rack, wide-body kit — all priced on the fly.",
  },
];

const HomeG700Teaser = () => {
  return (
    <section className="relative bg-[#070707] px-3 py-14 sm:px-6 sm:py-18 lg:px-8">
      <div className="container mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(247,181,43,0.16),transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(10,10,10,0.98))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:p-10 lg:p-14">
          <div className="pointer-events-none absolute -right-10 -top-10 h-72 w-72 rounded-full bg-primary/12 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-[#d96a20]/10 blur-3xl" aria-hidden="true" />

          <div className="relative grid gap-10 lg:grid-cols-[1fr_1.05fr] lg:items-center lg:gap-14">
            {/* Copy column */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white/70 sm:text-[11px]">
                <Sparkles className="h-3 w-3 text-primary" />
                While you're here
              </div>
              <h2 className="mt-4 text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
                Configure a{" "}
                <span className="bg-[linear-gradient(180deg,#ffcc63_0%,#f7b52b_50%,#e79a13_100%)] bg-clip-text text-transparent">
                  Jetour G700
                </span>{" "}
                — live.
              </h2>
              <p className="mt-4 text-base leading-7 text-white/65 sm:text-lg">
                Pick your colour, finish, trim package and accessories. The build updates in real time and you can push an on-the-spot WhatsApp quote straight to Sean. No email ping-pong.
              </p>

              <ul className="mt-6 space-y-3">
                {pillars.map((p) => (
                  <li
                    key={p.title}
                    className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:p-4"
                  >
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                      {p.icon}
                    </span>
                    <div>
                      <p className="text-[14px] font-semibold text-white sm:text-[15px]">
                        {p.title}
                      </p>
                      <p className="mt-0.5 text-sm leading-6 text-white/60">{p.copy}</p>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link to="/g700-customizer" className="sm:w-auto">
                  <Button
                    size="lg"
                    className="group h-12 w-full rounded-2xl bg-[linear-gradient(180deg,#ffd47a_0%,#f7b52b_52%,#e79a13_100%)] px-6 text-[15px] font-semibold text-black shadow-[0_14px_40px_rgba(247,181,43,0.28)] hover:brightness-105 sm:w-auto"
                  >
                    Open the G700 customizer
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Visual column */}
            <div className="relative">
              <div className="relative overflow-hidden rounded-[22px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.1),transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(0,0,0,0.4))] shadow-[0_30px_80px_rgba(0,0,0,0.45)] sm:rounded-[28px]">
                <div className="relative aspect-[16/11]">
                  <div className="absolute inset-x-[12%] bottom-8 h-10 rounded-full bg-black/70 blur-3xl sm:h-14" />
                  <video
                    className="relative z-10 h-full w-full object-cover"
                    poster="/g700-orange.png"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    aria-label="G700 customizer preview video"
                  >
                    <source src={G700_PREVIEW_VIDEO_SRC} type="video/mp4" />
                  </video>

                  {/* Corner eyebrow */}
                  <div className="absolute left-4 top-4 z-20 flex items-center gap-2 rounded-full border border-white/15 bg-black/55 px-3 py-1 backdrop-blur-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/85 sm:text-[11px]">
                      Customizer preview
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeG700Teaser;
