import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Play, Star, Volume2, VolumeX } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";

import { cn } from "@/lib/utils";

/* ────────────────────────────────────────────────────────────────────────────
 * Shared PPF trust components — the proven handover video reel + customer
 * reviews carousel lifted from the guided V2/V3 funnel so the lighter
 * WhatsApp-first page (`/paint-protection-film-dubai`) reuses the SAME assets
 * and behaviour. The V2 funnel keeps its own inline copies untouched so this
 * extraction can't break the live page.
 * ──────────────────────────────────────────────────────────────────────────── */

/** Inline coloured Google wordmark used on review proof. */
export const GoogleWordmark = ({ className }: { className?: string }) => (
  <span aria-label="Google" className={cn("font-semibold tracking-tight", className)}>
    <span className="text-[#4285F4]">G</span>
    <span className="text-[#EA4335]">o</span>
    <span className="text-[#FBBC05]">o</span>
    <span className="text-[#4285F4]">g</span>
    <span className="text-[#34A853]">l</span>
    <span className="text-[#EA4335]">e</span>
  </span>
);

/**
 * Hero handover-reactions reel — a 1:1 customer handover montage (no audio).
 * Autoplays muted + looping so the faces stay the focus; tap to pause/play.
 */
export const HandoverReactionsReel = ({
  videoSrc,
  posterSrc,
}: {
  videoSrc: string;
  posterSrc: string;
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [playing, setPlaying] = useState(true);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().then(() => setPlaying(true)).catch(() => undefined);
    } else {
      video.pause();
      setPlaying(false);
    }
  };

  return (
    <div className="group relative overflow-hidden rounded-[28px] border border-white/12 bg-black shadow-[0_36px_120px_rgba(0,0,0,0.55)]">
      <button
        type="button"
        onClick={togglePlay}
        aria-label={playing ? "Pause reactions reel" : "Play reactions reel"}
        className="block w-full"
      >
        <video
          ref={videoRef}
          className="aspect-square w-full bg-black object-cover"
          poster={posterSrc}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
      </button>

      <div className="pointer-events-none absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-[#f7b52b]/35 bg-black/55 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#f7b52b] backdrop-blur-sm">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#f7b52b]" />
        Real reactions
      </div>

      {!playing ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/60 px-5 py-2.5 text-white shadow-2xl backdrop-blur-sm">
            <Play className="h-4 w-4 fill-current" />
            <span className="text-sm font-semibold">Tap to play</span>
          </span>
        </div>
      ) : null}
    </div>
  );
};

type HandoverReviewClip = {
  name: string;
  car: string;
  badge: string;
  accent: string;
  videoSrc: string;
  posterSrc: string;
  google?: boolean;
};

/** Best customer handover clips for the reviews carousel (mp4 via Cloudinary). */
export const handoverReviewSlides: HandoverReviewClip[] = [
  {
    name: "Samir",
    car: "Porsche 911 · Matte PPF",
    badge: "Matte PPF",
    accent: "#f6c76d",
    videoSrc:
      "https://res.cloudinary.com/diw6rekpm/video/upload/q_auto/v1781333287/911_MATTE_aaomcw.mp4",
    posterSrc:
      "https://res.cloudinary.com/diw6rekpm/video/upload/so_2/v1781333287/911_MATTE_aaomcw.jpg",
  },
  {
    name: "Mansoor",
    car: "Porsche 911 · STEK Gloss",
    badge: "STEK gloss",
    accent: "#9dc3b0",
    videoSrc:
      "https://res.cloudinary.com/diw6rekpm/video/upload/q_auto/v1781333400/911_4_vcvvkn.mp4",
    posterSrc:
      "https://res.cloudinary.com/diw6rekpm/video/upload/so_2/v1781333400/911_4_vcvvkn.jpg",
  },
  {
    name: "Scott",
    car: "Jetour G700 · STEK Matte + paint match",
    badge: "Matte + paint match",
    accent: "#f6c76d",
    videoSrc:
      "https://res.cloudinary.com/diw6rekpm/video/upload/q_auto/v1781333432/G7_BLUE_wlvxks.mp4",
    posterSrc:
      "https://res.cloudinary.com/diw6rekpm/video/upload/so_2/v1781333432/G7_BLUE_wlvxks.jpg",
  },
  {
    name: "Mark",
    car: "Zeekr 001",
    badge: "Owner review",
    accent: "#79a7ff",
    google: true,
    videoSrc:
      "https://res.cloudinary.com/diw6rekpm/video/upload/q_auto/f_auto/v1775562589/Mark_Zeekr_conzdp.mp4",
    posterSrc: "/mark-zeekr-001.png",
  },
  {
    name: "Alex",
    car: "Aston Martin Rapide · Colour PPF",
    badge: "Colour PPF · Hyper Pro",
    accent: "#9dc3b0",
    videoSrc:
      "https://res.cloudinary.com/diw6rekpm/video/upload/q_auto/v1781333953/Aston_Martin_Rapide_S_rstzr2.mp4",
    posterSrc:
      "https://res.cloudinary.com/diw6rekpm/video/upload/so_2/v1781333953/Aston_Martin_Rapide_S_rstzr2.jpg",
  },
];

/**
 * Reviews carousel: holds 6–8 clips but only the centred (selected) slide plays.
 * Every other slide stays a static poster, so the section reads as "lots of proof"
 * without 6 videos fighting for attention or hammering the page load.
 */
export const HandoverReviewsCarousel = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "center",
    loop: true,
    containScroll: false,
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const activeVideoRef = useRef<HTMLVideoElement | null>(null);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setMuted(true);
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect).on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect).off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  const toggleSound = () => {
    const video = activeVideoRef.current;
    if (!video) return;
    const next = !muted;
    video.muted = next;
    setMuted(next);
    if (!next) video.play().catch(() => undefined);
  };

  return (
    <div className="relative mt-8">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex -ml-4 touch-pan-y">
          {handoverReviewSlides.map((slide, index) => {
            const isActive = index === selectedIndex;
            return (
              <div
                key={index}
                className="min-w-0 shrink-0 grow-0 basis-[82%] pl-4 sm:basis-[52%] lg:basis-[36%]"
              >
                <div
                  className={cn(
                    "relative overflow-hidden rounded-[24px] border bg-black transition-all duration-300",
                    isActive
                      ? "border-[#f7b52b]/45 shadow-[0_24px_70px_rgba(0,0,0,0.5)]"
                      : "border-white/10 opacity-60 hover:opacity-90",
                  )}
                >
                  <div className="relative aspect-[4/5]">
                    {isActive ? (
                      <video
                        ref={(el) => {
                          activeVideoRef.current = el;
                          if (el) el.muted = muted;
                        }}
                        className="h-full w-full bg-black object-cover"
                        poster={slide.posterSrc}
                        autoPlay
                        loop
                        muted
                        playsInline
                        preload="metadata"
                      >
                        <source src={slide.videoSrc} type="video/mp4" />
                      </video>
                    ) : (
                      <button
                        type="button"
                        onClick={() => emblaApi?.scrollTo(index)}
                        className="group/poster block h-full w-full"
                        aria-label={`Play ${slide.name} — ${slide.car}`}
                      >
                        <img
                          src={slide.posterSrc}
                          alt={`${slide.name} — ${slide.car}`}
                          className="h-full w-full object-cover transition duration-700 group-hover/poster:scale-[1.04]"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/35">
                          <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/55 px-4 py-2 text-white backdrop-blur-sm transition group-hover/poster:border-[#f7b52b]/55">
                            <Play className="h-4 w-4 fill-current" />
                            <span className="text-sm font-semibold">Play</span>
                          </span>
                        </div>
                      </button>
                    )}

                    <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent p-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {slide.google ? <GoogleWordmark className="text-xs" /> : null}
                        <span
                          className="inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.16em]"
                          style={{ borderColor: `${slide.accent}55`, color: slide.accent }}
                        >
                          {slide.badge}
                        </span>
                        {slide.google ? (
                          <span className="flex items-center gap-0.5 text-[#fbbc05]">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star key={star} className="h-3 w-3 fill-current" />
                            ))}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1.5 text-base font-black leading-tight text-white">
                        {slide.name}
                      </p>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70">
                        {slide.car}
                      </p>
                    </div>

                    {isActive ? (
                      <button
                        type="button"
                        onClick={toggleSound}
                        aria-label={muted ? "Unmute clip" : "Mute clip"}
                        className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/55 px-3 py-1.5 text-[11px] font-bold text-white backdrop-blur-sm transition hover:border-[#f7b52b]/55 hover:bg-black/70"
                      >
                        {muted ? (
                          <VolumeX className="h-3.5 w-3.5" />
                        ) : (
                          <Volume2 className="h-3.5 w-3.5 text-[#f7b52b]" />
                        )}
                        {muted ? "Sound" : "On"}
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => emblaApi?.scrollPrev()}
          aria-label="Previous clip"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-white transition hover:border-[#f7b52b]/55 hover:text-[#f7b52b]"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          {handoverReviewSlides.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => emblaApi?.scrollTo(index)}
              aria-label={`Go to clip ${index + 1}`}
              className={cn(
                "h-2 rounded-full transition-all",
                index === selectedIndex ? "w-6 bg-[#f7b52b]" : "w-2 bg-white/25 hover:bg-white/40",
              )}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => emblaApi?.scrollNext()}
          aria-label="Next clip"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-white transition hover:border-[#f7b52b]/55 hover:text-[#f7b52b]"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};
