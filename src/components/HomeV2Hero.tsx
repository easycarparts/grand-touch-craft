import { ArrowRight, MapPin, MessageCircle, Sparkles, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import BookServiceDialog from "@/components/BookServiceDialog";

const HERO_VIDEO_SRC =
  "https://res.cloudinary.com/diw6rekpm/video/upload/v1775556526/Jetour_EDIT_yi001t.mp4";
const HERO_POSTER_SRC = "/g700-orange.png";
const GOOGLE_MAPS_URL = "https://maps.app.goo.gl/QYYAMcW8TiEETeHs8";
const GOOGLE_REVIEWS_URL =
  "https://www.google.com/search?q=grand+touch+auto+dubai+reviews";

const HomeV2Hero = () => {
  return (
    <section className="relative isolate overflow-hidden bg-[#070707]">
      <div className="absolute inset-0 -z-10">
        <video
          className="h-full w-full object-cover opacity-55"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={HERO_POSTER_SRC}
          aria-hidden="true"
        >
          <source src={HERO_VIDEO_SRC} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(247,181,43,0.18),transparent_45%),linear-gradient(180deg,rgba(7,7,7,0.55)_0%,rgba(7,7,7,0.82)_55%,#070707_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#070707] to-transparent" />
      </div>

      <div className="pointer-events-none absolute -top-32 right-[-10%] h-[32rem] w-[32rem] rounded-full bg-primary/12 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute bottom-[-10rem] left-[-8rem] h-[28rem] w-[28rem] rounded-full bg-[#f7b52b]/8 blur-3xl" aria-hidden="true" />

      {/* Google reviews badge — desktop-only, clickable, tucked clear of the nav */}
      <a
        href={GOOGLE_REVIEWS_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="View Grand Touch Auto reviews on Google"
        className="group absolute right-6 top-28 z-20 hidden md:block"
      >
        <div className="flex items-center gap-2.5 rounded-full border border-white/15 bg-black/55 px-3.5 py-2 shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur-md transition-all duration-300 group-hover:border-white/30 group-hover:bg-black/70">
          <svg className="h-5 w-5" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" fill="#FFC107" />
            <path d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" fill="#FF3D00" />
            <path d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0124 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" fill="#4CAF50" />
            <path d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 01-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" fill="#1976D2" />
          </svg>
          <div className="flex flex-col leading-none">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="h-3 w-3 fill-[#fbbc05] text-[#fbbc05]" />
              ))}
              <span className="ml-1 text-xs font-semibold text-white">4.9</span>
            </div>
            <span className="mt-0.5 text-[10px] text-white/60">Google Reviews</span>
          </div>
        </div>
      </a>

      <div className="container relative z-10 mx-auto flex min-h-[88vh] max-w-7xl flex-col justify-center px-4 pt-28 pb-20 sm:px-6 md:min-h-[92vh] md:pt-32 lg:px-8">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/80">
              Studio · Garage · Dubai
            </span>
          </div>

          <h1 className="mt-6 text-4xl font-bold leading-[1.05] text-white sm:text-5xl md:text-6xl lg:text-7xl">
            <span className="block bg-[linear-gradient(180deg,#ffcc63_0%,#f7b52b_50%,#e79a13_100%)] bg-clip-text text-transparent">
              Dubai's luxury
            </span>
            <span className="mt-1 block text-white">automotive studio &amp; garage.</span>
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-7 text-white/70 sm:text-lg md:text-xl md:leading-8">
            Paint protection film, colour wraps, ceramic coating, paint &amp; bodywork, diagnostics, restoration, and bespoke custom builds &mdash; all under one precision-run roof in Dubai.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Link to="/ppf-dubai-quote" className="sm:w-auto">
              <Button
                size="lg"
                className="group h-14 w-full rounded-2xl bg-[linear-gradient(180deg,#ffd47a_0%,#f7b52b_52%,#e79a13_100%)] px-7 text-[15px] font-semibold text-black shadow-[0_18px_50px_rgba(247,181,43,0.35)] hover:brightness-105 sm:w-auto"
              >
                Get PPF estimate
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <BookServiceDialog>
              <Button
                size="lg"
                variant="outline"
                className="group h-14 w-full rounded-2xl border-white/20 bg-white/5 px-7 text-[15px] font-semibold text-white backdrop-blur-md hover:bg-white/10 hover:text-white sm:w-auto"
              >
                <MessageCircle className="mr-2 h-5 w-5 text-[#25D366]" />
                WhatsApp
              </Button>
            </BookServiceDialog>
          </div>

          <a
            href={GOOGLE_MAPS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group mt-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-[12px] font-medium text-white/70 backdrop-blur-sm transition hover:border-primary/40 hover:bg-white/10 hover:text-white sm:text-[13px]"
          >
            <MapPin className="h-3.5 w-3.5 text-primary" />
            DIP 2, Dubai &mdash; open in Google Maps
            <ArrowRight className="h-3 w-3 opacity-60 transition-transform group-hover:translate-x-0.5 group-hover:opacity-100" />
          </a>
        </div>
      </div>
    </section>
  );
};

export default HomeV2Hero;
