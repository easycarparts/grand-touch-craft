const capabilities: string[] = [
  "STEK Certified",
  "Certified PPF Installation",
  "Ceramic Coating Specialists",
  "Colour Wrap Studio",
  "Dust-Controlled Paint Booth",
  "OEM-Grade Diagnostics",
  "Climate-Controlled PPF Bays",
];

const HomeCapabilityStrip = () => {
  return (
    <section
      aria-label="Studio capabilities and certifications"
      className="relative overflow-hidden bg-[linear-gradient(180deg,rgba(247,181,43,0.04),rgba(7,7,7,0)_60%),linear-gradient(180deg,rgba(10,10,10,0.96),rgba(7,7,7,1))] px-4 py-5 sm:py-6"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" aria-hidden="true" />

      <div className="container mx-auto max-w-7xl">
        <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/55 sm:text-[11px]">
          {capabilities.map((item, index) => (
            <li key={item} className="flex items-center gap-3">
              <span>{item}</span>
              {index < capabilities.length - 1 ? (
                <span
                  className="hidden h-1 w-1 shrink-0 rounded-full bg-primary/60 sm:inline-block"
                  aria-hidden="true"
                />
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default HomeCapabilityStrip;
