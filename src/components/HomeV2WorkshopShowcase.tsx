import { ArrowRight, ClipboardList, Handshake, MessageCircle, Wrench } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

type Step = {
  n: string;
  icon: JSX.Element;
  title: string;
  description: string;
  meta: string;
};

const steps: Step[] = [
  {
    n: "01",
    icon: <MessageCircle className="h-5 w-5" />,
    title: "Talk",
    description:
      "A five-minute WhatsApp or walk-in with Sean to scope the project, budget, and what a great outcome looks like for your car.",
    meta: "Same-day reply",
  },
  {
    n: "02",
    icon: <ClipboardList className="h-5 w-5" />,
    title: "Plan & quote",
    description:
      "In-person inspection, agreed materials (STEK, Gyeon, OEM paint), written scope and timeline. No surprises once we start.",
    meta: "Written scope",
  },
  {
    n: "03",
    icon: <Wrench className="h-5 w-5" />,
    title: "Studio work",
    description:
      "Climate-controlled bays, OEM-grade tooling, certified installers — with daily WhatsApp progress updates straight to you.",
    meta: "Daily updates",
  },
  {
    n: "04",
    icon: <Handshake className="h-5 w-5" />,
    title: "Handover & aftercare",
    description:
      "Full walk-through of the finished work, aftercare instructions, warranty activation and a point of contact for anything post-delivery.",
    meta: "Warranty activated",
  },
];

const HomeV2WorkshopShowcase = () => {
  return (
    <section className="relative overflow-hidden bg-[#070707] px-3 py-14 sm:px-6 sm:py-18 lg:px-8 lg:py-24">
      <div className="pointer-events-none absolute top-0 left-1/2 h-px w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-primary/30 to-transparent" aria-hidden="true" />
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-px w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-primary/20 to-transparent" aria-hidden="true" />
      <div className="pointer-events-none absolute -left-24 top-1/3 h-[28rem] w-[28rem] rounded-full bg-primary/8 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-24 bottom-1/4 h-[24rem] w-[24rem] rounded-full bg-[#d96a20]/8 blur-3xl" aria-hidden="true" />

      <div className="container relative mx-auto max-w-7xl">
        <div className="mb-10 max-w-3xl sm:mb-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-white/65 sm:text-[11px]">
            How we work
          </div>
          <h2 className="mt-3 text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
            From first message to final{" "}
            <span className="bg-[linear-gradient(180deg,#ffcc63_0%,#f7b52b_50%,#e79a13_100%)] bg-clip-text text-transparent">
              handover.
            </span>
          </h2>
          <p className="mt-3 text-sm leading-6 text-white/60 sm:text-base sm:leading-7">
            A studio runs differently to a workshop. Here's the process every project at Grand Touch follows &mdash; PPF, paint, restoration, or a full G700 build.
          </p>
        </div>

        <ol className="grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <li
              key={step.n}
              className="group relative flex h-full flex-col overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(10,10,10,0.96))] p-6 transition hover:border-primary/25 sm:p-7"
            >
              <div
                className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full bg-primary/10 opacity-60 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
                aria-hidden="true"
              />

              <div className="relative flex items-start justify-between gap-3">
                <span className="bg-[linear-gradient(180deg,#ffcc63_0%,#f7b52b_55%,#e79a13_100%)] bg-clip-text font-serif text-5xl font-bold leading-none text-transparent sm:text-6xl">
                  {step.n}
                </span>
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/15 bg-black/30 text-primary shadow-[0_10px_32px_rgba(247,181,43,0.18)]">
                  {step.icon}
                </div>
              </div>

              <h3 className="relative mt-5 text-xl font-semibold text-white sm:text-2xl">
                {step.title}
              </h3>
              <p className="relative mt-2 text-[13px] leading-6 text-white/65 sm:text-sm">
                {step.description}
              </p>

              <div className="relative mt-auto pt-6">
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary sm:text-[11px]">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {step.meta}
                </span>
              </div>

              {index < steps.length - 1 ? (
                <div
                  className="pointer-events-none absolute right-0 top-1/2 hidden h-px w-6 -translate-y-1/2 translate-x-full bg-gradient-to-r from-primary/40 to-transparent lg:block"
                  aria-hidden="true"
                />
              ) : null}
            </li>
          ))}
        </ol>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:mt-12 sm:flex-row">
          <Link to="/contact" className="sm:w-auto">
            <Button
              size="lg"
              className="group h-12 w-full rounded-2xl bg-[linear-gradient(180deg,#ffd47a_0%,#f7b52b_52%,#e79a13_100%)] px-6 text-[15px] font-semibold text-black shadow-[0_14px_40px_rgba(247,181,43,0.28)] hover:brightness-105 sm:w-auto"
            >
              Start your project
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
          <span className="text-[13px] text-white/50 sm:text-sm">
            Dubai-based &middot; STEK &amp; XPEL authorized &middot; 15+ years under one roof
          </span>
        </div>
      </div>
    </section>
  );
};

export default HomeV2WorkshopShowcase;
