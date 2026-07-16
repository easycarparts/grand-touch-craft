import ServicePillarPage from "@/components/ServicePillarPage";
import { EASY_AUTO } from "@/lib/business";

const CarDetailingDubai = () => (
  <ServicePillarPage
    path="/car-detailing-dubai"
    title="Car Detailing & Polishing Dubai | Paint Correction | Grand Touch"
    description="Professional car detailing and polishing in Dubai. Multi-stage paint correction, interior deep cleans, and prep for ceramic coating or PPF at Grand Touch Studio DIP 2."
    keywords="car detailing Dubai, paint correction Dubai, car polishing Dubai, luxury car detailing Dubai, swirl removal Dubai"
    ogTitle="Car Detailing & Polishing in Dubai | Grand Touch Auto"
    ogDescription="Paint correction, polishing, and full detailing for Dubai luxury cars — the prep step before coating or PPF."
    image="/guided-install-detail.png"
    h1="Car Detailing and Polishing in Dubai"
    intro="Detailing here is not a foam-and-vacuum upsell. It is controlled paint correction, interior reset, and honest advice on whether your car needs polish only — or polish before PPF or ceramic."
    serviceSchema={{
      name: "Car detailing and paint correction in Dubai",
      serviceType: "Automotive detailing",
      description:
        "Multi-stage paint correction, polishing, and interior/exterior detailing for Dubai vehicles.",
    }}
    heroAlt="Paint correction and detailing work at Grand Touch Auto Dubai"
    whatsappText="Hi Sean, I want a detailing / paint correction quote."
    ctaLabel="WhatsApp a detailing quote"
    packages={[
      {
        name: "Maintenance detail",
        coverage: "Safe wash, decontam, interior reset",
        fromPrice: "350+",
        bestFor: "Monthly upkeep on coated cars",
      },
      {
        name: "Single-stage polish",
        coverage: "Light defect removal + finish",
        fromPrice: "900+",
        bestFor: "Newer paint with light swirls",
      },
      {
        name: "Multi-stage correction",
        coverage: "Compound + polish to clarity",
        fromPrice: "1,800+",
        bestFor: "Black paint destroyed by brush washes",
      },
      {
        name: "Correction + ceramic / PPF prep",
        coverage: "Stage polish ready for protection",
        fromPrice: "Package",
        bestFor: "Owners booking coating or film next",
      },
    ]}
    easyAutoLinks={[
      {
        href: EASY_AUTO.guides.detailingCost,
        anchor: "car detailing cost benchmarks for Dubai",
      },
    ]}
    relatedServices={[
      {
        to: "/ceramic-coating-dubai",
        label: "Ceramic coating Dubai",
        blurb: "Lock in correction with a durable ceramic layer.",
      },
      {
        to: "/ppf-dubai",
        label: "PPF Dubai",
        blurb: "Protect corrected paint from the next highway chip.",
      },
      {
        to: "/window-tinting-dubai",
        label: "Window tinting Dubai",
        blurb: "Finish the cabin comfort side of a full refresh.",
      },
      {
        to: "/blog/paint-correction-techniques",
        label: "Paint correction techniques",
        blurb: "Deeper explainer on how professional correction works.",
      },
    ]}
    faqs={[
      {
        question: "How do I know if I need correction or just a detail?",
        answer:
          "If swirls are obvious in sunlight on dark paint, you need machine polishing — not only washing. A maintenance detail cleans and protects what is already there; it cannot remove marks that are already cut into the clearcoat. Send photos in direct sun and in shade and we will tell you honestly which stage applies before you book anything.",
      },
      {
        question: "Will polishing remove clearcoat?",
        answer:
          "Any polish removes a microscopic layer of clearcoat to level out defects — that is simply how correction works. We measure risk by paint type, panel history, and defect depth, and we stop once the visible improvement is achieved rather than chasing a theoretical perfection that thins clearcoat unsafely for future protection.",
      },
      {
        question: "Can you detail cars with existing PPF?",
        answer:
          "Yes, with PPF-safe chemistry and technique throughout. Aggressive compounds and high-heat buffing near film edges are how cheap detailing jobs cause peeling and lifting — we use products and pad speeds that are specifically safe for film, not just for bare paint.",
      },
      {
        question: "Do you offer interior-only packages?",
        answer:
          "Yes. Leather, Alcantara, and family-SUV interiors each get different processes and different chemistry. Tell us about pets, kids, smoke exposure, or spills so we stage the clean correctly rather than applying a generic interior package that misses your specific problem areas.",
      },
      {
        question: "How often should I book a maintenance detail in Dubai?",
        answer:
          "Most daily-driven cars benefit from a maintenance visit every four to six weeks, more often if you park outdoors under trees or near construction dust. Coated or filmed cars can often stretch that interval slightly since the protective layer does some of the work between visits.",
      },
      {
        question: "Can paint correction fix deep scratches down to primer?",
        answer:
          "Not fully by polishing alone. Correction levels out swirls, light scratches, and haze sitting within the clearcoat. Anything that has cut through to primer or bare metal needs touch-up paint or a respray on that panel before polishing can bring back a uniform finish.",
      },
    ]}
    sections={[
      {
        h2: "What Dubai does to paint between washes",
        body: (
          <>
            <p>
              Fine dust acts like grit every time it is wiped rather than
              rinsed off properly. Combined with automatic brush tunnels and
              dry wiping in car parks, it holograms clearcoat over time —
              especially visible on black and dark blue luxury cars under
              direct sun. Our job is to remove the defect level you can
              actually see, then leave a surface that either stays
              maintained on its own or is ready for ceramic or STEK PPF.
            </p>
            <p>
              Owners are often surprised how much of what they assumed was
              "just how the paint looks now" is actually reversible swirling
              rather than permanent wear. A proper inspection under raking
              light tells the real story before we quote anything.
            </p>
          </>
        ),
      },
      {
        h2: "How much does detailing and paint correction cost in Dubai?",
        body: (
          <>
            <p>
              Maintenance details start from around AED 350, single-stage
              polishing from AED 900, and multi-stage correction from AED
              1,800. The jump between single-stage and multi-stage reflects
              the number of compounding and polishing passes needed to
              actually resolve deeper defects, not a different product tier
              being sold at a markup.
            </p>
            <p>
              If you are planning ceramic coating or PPF afterwards, ask
              about our correction-plus-prep packages — bundling the stages
              is usually more efficient than booking correction and
              protection as two completely separate visits weeks apart.
            </p>
          </>
        ),
      },
      {
        h2: "Paint correction levels we actually use",
        body: (
          <>
            <p>
              We do not sell "twenty-hour show correction" to every daily
              driver that walks in. Stages run from a light enhancement
              polish for newer cars with minor swirling, up to multi-step
              compound-and-polish sequences for paint that has genuinely been
              through years of poor wash habits — based on a defect map, not
              a flat-rate package applied regardless of condition.
            </p>
            <p>
              For technique background on how this actually works panel by
              panel, see{" "}
              <a
                href="/blog/paint-correction-techniques"
                className="text-[#f7b52b] underline-offset-2 hover:underline"
              >
                advanced paint correction techniques
              </a>
              . It is useful reading before you compare quotes that all use
              the word "correction" to mean very different amounts of work.
            </p>
          </>
        ),
      },
      {
        h2: "Detailing before ceramic coating or PPF — why order matters",
        body: (
          <>
            <p>
              Coating or film applied over uncorrected paint locks in every
              swirl and water spot underneath it, permanently. That is the
              single most common regret we hear from owners who booked
              protection at another shop without a proper correction stage
              first — the car looks "protected" but still dull the moment
              direct sun hits it.
            </p>
            <p>
              If you are heading toward{" "}
              <a
                href="/ceramic-coating-dubai"
                className="text-[#f7b52b] underline-offset-2 hover:underline"
              >
                ceramic coating
              </a>{" "}
              or{" "}
              <a
                href="/ppf-dubai"
                className="text-[#f7b52b] underline-offset-2 hover:underline"
              >
                PPF
              </a>
              , tell us at the first inspection so we can plan correction and
              protection as one sequence rather than two disconnected visits
              that leave gaps in the schedule.
            </p>
          </>
        ),
      },
      {
        h2: "Interior detailing that matches the exterior",
        body: (
          <>
            <p>
              Cabin work covers extraction on carpets and seats, leather
              conditioning, vent and stitching dusting, and glass cleaned
              without leaving a haze under Dubai's low winter sun angle. On
              PPF or ceramic clients, we keep chemistry compatible across
              departments so one bay visit does not undo another
              department's work through the wrong interior spray drifting
              onto protected exterior trim.
            </p>
            <p>
              Family SUVs with car seats, sand, and food spills get a
              different process to a weekend sports car that mostly needs
              dust removed from Alcantara. Tell us how the car is actually
              used and we will stage the interior clean accordingly rather
              than running a generic checklist.
            </p>
          </>
        ),
      },
      {
        h2: "How to tell a real correction from a wax-only 'polish' service",
        body: (
          <>
            <p>
              A lot of Dubai "polish and wax" packages are a machine buff
              with a filler-heavy wax that hides light marks temporarily and
              washes off within a few weeks, leaving the underlying swirls
              exactly where they were. It looks impressive at handover and
              disappointing a month later.
            </p>
            <p>
              Genuine correction removes material to actually level the
              defect, then finishes with a sealant or sets you up for a
              proper ceramic coating rather than a wax that fades fast in
              Dubai heat. Ask any studio directly what pad and compound
              combination they use and how many stages are included — a
              confident, specific answer is a good sign; a vague "we polish
              it nicely" is not.
            </p>
          </>
        ),
      },
      {
        h2: "Correction for cars going into storage or resale",
        body: (
          <>
            <p>
              If you are prepping a car for sale or for a long storage
              period, correction plus a protective layer makes a measurable
              difference to perceived value — buyers and appraisers notice
              swirl-free paint under showroom lighting immediately, even if
              they cannot articulate exactly why the car "looks newer."
            </p>
            <p>
              For long storage, we also recommend a lighter ceramic or sealant
              layer over bare corrected paint rather than leaving it exposed
              with nothing between visits — dust and humidity still do
              damage even when a car is not being driven.
            </p>
          </>
        ),
      },
    ]}
  />
);

export default CarDetailingDubai;
