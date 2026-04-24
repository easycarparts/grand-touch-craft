import { ArrowRight, MessageCircle, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import BookServiceDialog from "@/components/BookServiceDialog";

const HomeFinalCta = () => {
  return (
    <section className="relative bg-[#070707] px-3 pb-16 pt-8 sm:px-6 sm:pb-20 sm:pt-10 lg:px-8">
      <div className="container mx-auto max-w-5xl">
        <div className="relative overflow-hidden rounded-[28px] border border-primary/25 bg-[radial-gradient(circle_at_top,rgba(245,181,43,0.22),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(10,10,10,0.98))] px-5 py-10 text-center text-white shadow-[0_24px_80px_rgba(0,0,0,0.45)] sm:px-10 sm:py-14">
          <div className="pointer-events-none absolute -left-20 top-10 h-56 w-56 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute -right-16 bottom-0 h-64 w-64 rounded-full bg-[#d96a20]/10 blur-3xl" aria-hidden="true" />

          <div className="relative">
            <div className="mx-auto flex max-w-max items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white/70 sm:text-[11px]">
              <Star className="h-3 w-3 text-primary" />
              Ready when you are
            </div>
            <h2 className="mt-5 text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
              Let&apos;s start your{" "}
              <span className="bg-[linear-gradient(180deg,#ffcc63_0%,#f7b52b_50%,#e79a13_100%)] bg-clip-text text-transparent">
                project.
              </span>
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-white/65 sm:text-base sm:leading-7">
              Tell us what you&apos;re after &mdash; PPF, paint, ceramic, diagnostics, a restoration or a G700 build &mdash; and Sean will reply personally on WhatsApp with pricing and timelines.
            </p>

            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <BookServiceDialog>
                <Button
                  size="lg"
                  className="group h-12 w-full rounded-2xl bg-[linear-gradient(180deg,#ffd47a_0%,#f7b52b_52%,#e79a13_100%)] px-6 text-[15px] font-semibold text-black shadow-[0_14px_40px_rgba(247,181,43,0.32)] hover:brightness-105 sm:w-auto"
                >
                  Start your project
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </BookServiceDialog>
              <BookServiceDialog>
                <Button
                  size="lg"
                  variant="outline"
                  className="group h-12 w-full rounded-2xl border-white/20 bg-white/5 px-6 text-[15px] font-semibold text-white backdrop-blur-md hover:bg-white/10 hover:text-white sm:w-auto"
                >
                  <MessageCircle className="mr-2 h-4 w-4 text-[#25D366]" />
                  WhatsApp
                </Button>
              </BookServiceDialog>
            </div>

            <div className="mt-5 text-[12px] text-white/55 sm:text-[13px]">
              Or prefer a quick ballpark?{" "}
              <Link
                to="/ppf-dubai-quote"
                className="font-semibold text-primary underline-offset-4 hover:underline"
              >
                Get an instant PPF estimate &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeFinalCta;
