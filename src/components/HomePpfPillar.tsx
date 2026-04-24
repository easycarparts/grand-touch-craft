import { ArrowRight, Check, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

const WHY_STEK_VIDEO =
  "https://res.cloudinary.com/diw6rekpm/video/upload/q_auto:eco,vc_auto,w_720,c_limit/v1775639271/0408_3_gjnsep.mp4";
const WHY_STEK_POSTER = encodeURI("/Screenshot 2026-04-11 162409.png");

const benefits: Array<{ title: string; description: string }> = [
  {
    title: "Self-healing topcoat",
    description:
      "Light swirls and rock-chip scuffs re-flow out in the sun — the paint under it stays factory-fresh.",
  },
  {
    title: "Built for Dubai heat",
    description:
      "Hydrophobic UV coating designed to hold up to high temperatures, sand, and salt without yellowing.",
  },
  {
    title: "10-year manufacturer warranty",
    description:
      "Proper factory-backed PPF warranty — not an installer promise. Claims handled directly through STEK.",
  },
  {
    title: "Optical-grade clarity",
    description:
      "Zero orange peel, crystal-clear gloss, and clean edges that don't telegraph the install.",
  },
];

const HomePpfPillar = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = () => {
    const node = videoRef.current;
    if (!node) return;
    if (node.paused) {
      node.muted = false;
      void node.play().catch(() => {
        node.muted = true;
        void node.play();
      });
      setIsPlaying(true);
    } else {
      node.pause();
      setIsPlaying(false);
    }
  };

  return (
    <section className="relative bg-[#070707] px-3 py-14 sm:px-6 sm:py-18 lg:px-8 lg:py-24">
      <div className="pointer-events-none absolute inset-y-0 right-0 -z-0 w-1/2 bg-[radial-gradient(circle_at_right,rgba(247,181,43,0.10),transparent_55%)]" aria-hidden="true" />

      <div className="container mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_1fr] lg:items-start lg:gap-12">
          {/* Video */}
          <div className="flex flex-col">
            <div className="max-w-2xl">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary sm:text-[11px]">
                Our studio specialty
              </p>
              <h2 className="mt-2 text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
                <span className="bg-[linear-gradient(180deg,#ffcc63_0%,#f7b52b_50%,#e79a13_100%)] bg-clip-text text-transparent">
                  Why STEK PPF wins
                </span>{" "}
                in Dubai heat.
              </h2>
              <p className="mt-4 text-base leading-7 text-white/65 sm:text-lg">
                Paint protection film is one of the services Grand Touch is most known for &mdash;
                designed to hold up under 45&deg;C heat, fine desert sand, and daily traffic-film.
                The film does the work, your paint stays original.
              </p>
            </div>

            <div className="relative mt-8 overflow-hidden rounded-[28px] border border-white/10 bg-black/40 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
              <div className="relative aspect-video">
                <video
                  ref={videoRef}
                  className="h-full w-full object-cover"
                  poster={WHY_STEK_POSTER}
                  controls={isPlaying}
                  playsInline
                  preload="none"
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                >
                  <source src={WHY_STEK_VIDEO} type="video/mp4" />
                </video>
                {!isPlaying ? (
                  <button
                    type="button"
                    onClick={handlePlay}
                    className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/70 via-black/25 to-transparent transition hover:from-black/60"
                    aria-label="Play Why STEK video"
                  >
                    <span className="flex h-16 w-16 items-center justify-center rounded-full border border-white/30 bg-black/55 text-white shadow-[0_20px_60px_rgba(247,181,43,0.25)] backdrop-blur-sm">
                      <Play className="h-6 w-6 fill-current" />
                    </span>
                    <span className="absolute left-4 bottom-4 right-4 flex items-center justify-between gap-2 text-white">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/85">
                        Why we lead with STEK
                      </span>
                      <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold backdrop-blur-sm">
                        Tap to play
                      </span>
                    </span>
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="flex h-full flex-col lg:pt-2">
            <ul className="space-y-4">
              {benefits.map((benefit) => (
                <li
                  key={benefit.title}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[15px] font-semibold text-white sm:text-base">
                        {benefit.title}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-white/65">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-6 flex flex-col items-start gap-2 sm:gap-3">
              <Link to="/ppf-dubai-quote" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="group h-12 w-full rounded-2xl bg-[linear-gradient(180deg,#ffd47a_0%,#f7b52b_52%,#e79a13_100%)] px-6 text-[15px] font-semibold text-black shadow-[0_14px_40px_rgba(247,181,43,0.28)] hover:brightness-105 sm:w-auto"
                >
                  Get my 60-second PPF estimate
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link
                to="/ppf-cost-calculator"
                className="text-[13px] font-semibold text-primary underline-offset-4 hover:underline sm:text-sm"
              >
                Or see PPF pricing by vehicle size &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomePpfPillar;
