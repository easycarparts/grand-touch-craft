import {
  Droplets,
  Hammer,
  Palette,
  Shield,
  Sparkles,
  Wrench,
  Zap,
} from "lucide-react";
// Service cards intentionally omit a 'Learn more' label and there is no 'View all services' link —
// the full studio story is told in-page across the following sections.

type ServiceItem = {
  title: string;
  description: string;
  icon: JSX.Element;
  accentClass: string;
  iconShadowClass: string;
};

const services: ServiceItem[] = [
  {
    title: "PPF & Colour Wrap",
    description: "STEK & XPEL paint protection film, full-body or full-front, gloss, matte & colour change.",
    icon: <Shield className="h-5 w-5" />,
    accentClass: "from-[#f7b52b]/18 via-transparent to-transparent",
    iconShadowClass: "shadow-[0_10px_32px_rgba(247,181,43,0.25)]",
  },
  {
    title: "Paint & Bodywork",
    description: "Factory-grade colour matching, collision repair, and full respray in a dust-controlled booth.",
    icon: <Palette className="h-5 w-5" />,
    accentClass: "from-[#d96a20]/18 via-transparent to-transparent",
    iconShadowClass: "shadow-[0_10px_32px_rgba(217,106,32,0.22)]",
  },
  {
    title: "Detailing & Ceramic",
    description: "Multi-stage paint correction and Gyeon / Gtechniq ceramic over paint or over PPF.",
    icon: <Droplets className="h-5 w-5" />,
    accentClass: "from-[#4285F4]/14 via-transparent to-transparent",
    iconShadowClass: "shadow-[0_10px_32px_rgba(66,133,244,0.20)]",
  },
  {
    title: "Diagnostics & Repair",
    description: "Advanced ECU diagnostics, mechanical servicing and scheduled maintenance for luxury vehicles.",
    icon: <Wrench className="h-5 w-5" />,
    accentClass: "from-[#5f8f79]/18 via-transparent to-transparent",
    iconShadowClass: "shadow-[0_10px_32px_rgba(95,143,121,0.22)]",
  },
  {
    title: "Restoration & Custom",
    description: "Full teardown, rebuild and modernisation of classics, exotics and bespoke builds.",
    icon: <Hammer className="h-5 w-5" />,
    accentClass: "from-[#a855f7]/14 via-transparent to-transparent",
    iconShadowClass: "shadow-[0_10px_32px_rgba(168,85,247,0.18)]",
  },
  {
    title: "Performance & Off-Road",
    description: "Suspension tuning, lift kits, armour installs and performance builds for 4x4s and sports cars.",
    icon: <Zap className="h-5 w-5" />,
    accentClass: "from-[#fb7185]/14 via-transparent to-transparent",
    iconShadowClass: "shadow-[0_10px_32px_rgba(251,113,133,0.20)]",
  },
];

const HomeV2OtherServices = () => {
  return (
    <section className="relative bg-[#070707] px-3 py-14 sm:px-6 sm:py-18 lg:px-8 lg:py-24">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" aria-hidden="true" />
      <div className="pointer-events-none absolute left-1/2 top-24 -z-0 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" aria-hidden="true" />

      <div className="container mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-white/65 sm:text-[11px]">
            <Sparkles className="h-3 w-3 text-primary" />
            Under one roof
          </div>
          <h2 className="mt-3 text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
            A studio. A garage.{" "}
            <span className="bg-[linear-gradient(180deg,#ffcc63_0%,#f7b52b_50%,#e79a13_100%)] bg-clip-text text-transparent">
              All of it.
            </span>
          </h2>
          <p className="mt-3 text-sm leading-6 text-white/60 sm:text-base sm:leading-7">
            Grand Touch is a full-service facility in Dubai &mdash; from PPF and colour wraps to paint, diagnostics and restoration. Same team, same standard, same roof.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {services.map((service) => (
            <article
              key={service.title}
              className="group relative overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(10,10,10,0.96))] p-6 sm:p-7"
            >
              <div
                className={`pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br ${service.accentClass} opacity-70 blur-2xl`}
                aria-hidden="true"
              />

              <div className="relative flex items-start gap-4">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(0,0,0,0.35))] text-primary ${service.iconShadowClass}`}
                >
                  {service.icon}
                </div>
              </div>

              <h3 className="relative mt-5 text-lg font-semibold text-white sm:text-[19px]">
                {service.title}
              </h3>
              <p className="relative mt-2 text-[13px] leading-6 text-white/60 sm:text-sm">
                {service.description}
              </p>

              <div className="relative mt-5 h-px w-8 bg-white/15" />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HomeV2OtherServices;
