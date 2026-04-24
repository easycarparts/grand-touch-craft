import { Maximize2, Play, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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

const TrustStars = () => (
  <div className="flex shrink-0 items-center gap-1 text-[#fbbc05]">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star key={s} className="h-4 w-4 fill-current" />
    ))}
  </div>
);

type HandoverCardProps = {
  title: string;
  description: string;
  videoSrc: string;
  posterSrc: string;
  eyebrow: string;
};

const HandoverVideoCard = ({
  title,
  description,
  videoSrc,
  posterSrc,
  eyebrow,
}: HandoverCardProps) => (
  <Dialog>
    <DialogTrigger asChild>
      <button type="button" className="mt-4 block w-full text-left">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/30 transition hover:border-primary/35">
          <div className="relative aspect-video">
            <img
              src={posterSrc}
              alt={title}
              className="h-full w-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="rounded-full border border-white/35 bg-black/40 p-3 text-white shadow-[0_10px_30px_rgba(0,0,0,0.45)] backdrop-blur-sm">
                <Play className="h-5 w-5 fill-current" />
              </div>
            </div>
            <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80">
                {eyebrow}
              </span>
              <div className="rounded-full border border-white/15 bg-white/10 p-2 text-white backdrop-blur-sm">
                <Maximize2 className="h-3.5 w-3.5" />
              </div>
            </div>
          </div>
        </div>
      </button>
    </DialogTrigger>
    <DialogContent className="max-w-[420px] border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(10,10,10,0.98))] p-3 text-white shadow-[0_30px_120px_rgba(0,0,0,0.6)] sm:p-4">
      <DialogHeader>
        <DialogTitle className="text-xl text-white">{title}</DialogTitle>
        <DialogDescription className="text-white/65">{description}</DialogDescription>
      </DialogHeader>
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-black shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
        <video
          className="aspect-[9/16] h-auto w-full bg-black object-cover"
          controls
          playsInline
          preload="metadata"
          autoPlay
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
      </div>
    </DialogContent>
  </Dialog>
);

const HomeHandovers = () => {
  return (
    <section className="relative bg-[#070707] px-3 py-14 sm:px-6 sm:py-18 lg:px-8 lg:py-20">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-8 max-w-2xl sm:mb-10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary sm:text-[11px]">
            Customer handovers
          </p>
          <h2 className="mt-2 text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
            Real owners,{" "}
            <span className="bg-[linear-gradient(180deg,#ffcc63_0%,#f7b52b_50%,#e79a13_100%)] bg-clip-text text-transparent">
              real handovers.
            </span>
          </h2>
          <p className="mt-3 text-base leading-7 text-white/65 sm:text-lg">
            Not stock footage. These are delivery clips and review videos from cars Grand Touch actually handed back last year.
          </p>
        </div>

        <div className="grid gap-4 sm:gap-6 md:grid-cols-3 md:items-stretch">
          {/* Mark Zeekr */}
          <Card className="flex h-full flex-col rounded-[28px] border-[#4285F4]/20 bg-[linear-gradient(180deg,rgba(66,133,244,0.07),rgba(255,255,255,0.02)_22%,rgba(255,255,255,0.02)_100%)] p-4 text-white sm:p-6">
            <div className="flex items-center gap-2">
              <GoogleWordmark />
              <span className="text-sm font-semibold text-white">Reviews</span>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <TrustStars />
              <span className="text-sm font-semibold text-white">5-star review</span>
            </div>
            <h3 className="mt-4 text-xl font-semibold text-white">Mark | Zeekr 001</h3>
            <p className="mt-2 text-sm leading-7 text-white/68">
              "Top-notch service. Sean picked my car up from Abu Dhabi, kept the whole process easy, and the finish came out amazing."
            </p>
            <div className="mt-auto">
              <HandoverVideoCard
                title="Mark's Zeekr 001"
                description="A quick customer delivery clip showing the finished Zeekr 001 and the level of service behind it."
                videoSrc="https://res.cloudinary.com/diw6rekpm/video/upload/q_auto/f_auto/v1775562589/Mark_Zeekr_conzdp.mp4"
                posterSrc="/mark-zeekr-001.png"
                eyebrow="Real owner handover"
              />
            </div>
          </Card>

          {/* G700 recent work */}
          <Card className="flex h-full flex-col rounded-[28px] border-[#f59e0b]/20 bg-[linear-gradient(180deg,rgba(245,158,11,0.08),rgba(255,255,255,0.02)_24%,rgba(255,255,255,0.02)_100%)] p-4 text-white sm:p-6">
            <div className="flex items-center gap-3">
              <img
                src="/stek-logo.webp"
                alt="STEK official brand logo"
                className="h-6 w-auto object-contain"
                loading="lazy"
              />
              <span className="text-xs uppercase tracking-[0.18em] text-[#f6c76d]">
                PPF &amp; finish proof
              </span>
            </div>
            <h3 className="mt-4 text-xl font-semibold text-white">Recent Grand Touch G700 work</h3>
            <p className="mt-2 text-sm leading-7 text-white/68">
              Recent G700 installs showing gloss and matte PPF directions, custom trim packages, and the sort of finish standard Grand Touch hands back to paying customers.
            </p>
            <div className="mt-auto">
              <HandoverVideoCard
                title="Recent Grand Touch G700 work"
                description="A multi-car G700 showcase featuring gloss and matte PPF directions, blackout details, and custom finish work completed by Grand Touch."
                videoSrc="https://res.cloudinary.com/diw6rekpm/video/upload/v1775556526/Jetour_EDIT_yi001t.mp4"
                posterSrc="/g700-orange.png"
                eyebrow="Recent G700 builds"
              />
            </div>
          </Card>

          {/* Matt Cooper T2 */}
          <Card className="flex h-full flex-col rounded-[28px] border-[#5f8f79]/20 bg-[linear-gradient(180deg,rgba(95,143,121,0.09),rgba(255,255,255,0.02)_24%,rgba(255,255,255,0.02)_100%)] p-4 text-white sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9dc3b0]">
                  Colour PPF proof
                </p>
                <h3 className="text-xl font-semibold text-white">Matt Cooper</h3>
                <p className="text-xs uppercase tracking-[0.18em] text-[#9dc3b0]">
                  Jetour T2 | Matte green colour PPF
                </p>
              </div>
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                <img
                  src="/matt-cooper-face.png"
                  alt="Matt Cooper"
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>
            <p className="mt-2 text-sm leading-7 text-white/68">
              "I left my Jetour T2 with Sean for a matte green colour PPF transformation and could not be happier. Great finish, smooth process, and a team I was happy to trust with my car."
            </p>
            <div className="mt-auto">
              <HandoverVideoCard
                title="Matt Cooper's Jetour T2"
                description="A quick delivery clip showing Matt Cooper's matte green Jetour T2 colour PPF transformation."
                videoSrc="https://res.cloudinary.com/diw6rekpm/video/upload/q_auto/f_auto/v1775563747/0407_xyaggw.mp4"
                posterSrc="/matt-cooper-t2.png"
                eyebrow="Real finished handover"
              />
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default HomeHandovers;
