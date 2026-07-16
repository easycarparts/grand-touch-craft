import ServicePillarPage from "@/components/ServicePillarPage";
import { EASY_AUTO } from "@/lib/business";

const CeramicCoatingDubai = () => (
  <ServicePillarPage
    path="/ceramic-coating-dubai"
    title="Ceramic Coating Dubai | GYEON Studio Finish | Grand Touch Auto"
    description="Professional ceramic coating in Dubai for gloss, easier washing, and UV defence. Paint correction prep, GYEON processes, and packages for daily drivers and luxury cars."
    keywords="ceramic coating Dubai, car ceramic coating Dubai, GYEON ceramic Dubai, nano ceramic coating Dubai, paint coating Dubai"
    ogTitle="Ceramic Coating in Dubai | Grand Touch Auto"
    ogDescription="Multi-stage paint correction and ceramic coating packages for Dubai heat, dust, and daily wash cycles."
    image="/guided-911-gloss.png"
    h1="Ceramic Coating in Dubai"
    intro="Ceramic coating is the gloss and maintenance layer Dubai cars need when paint is already corrected — hydrophobic, UV-stable, and built for dusty wash cycles, not showroom Instagram only."
    serviceSchema={{
      name: "Ceramic coating in Dubai",
      serviceType: "Ceramic coating",
      description:
        "Professional ceramic coating with paint correction prep for Dubai vehicles using GYEON detailing processes.",
    }}
    heroAlt="Gloss ceramic coated sports car at Grand Touch Auto Dubai"
    whatsappText="Hi Sean, I want a ceramic coating quote for my car."
    ctaLabel="WhatsApp a ceramic quote"
    packages={[
      {
        name: "Essential ceramic",
        coverage: "Single-stage correction + exterior coat",
        fromPrice: "1,800+",
        bestFor: "Newer cars with light defects",
      },
      {
        name: "Signature ceramic",
        coverage: "Multi-stage correction + durable coat",
        fromPrice: "2,800+",
        bestFor: "Daily Dubai drivers with wash swirls",
      },
      {
        name: "PPF + ceramic stack",
        coverage: "Coat over protected film panels",
        fromPrice: "Custom",
        bestFor: "Owners stacking gloss on STEK PPF",
      },
      {
        name: "Interior + wheels",
        coverage: "Leather/textile and rim ceramic options",
        fromPrice: "Add-on",
        bestFor: "Full cabin and brake-dust defence",
      },
    ]}
    easyAutoLinks={[
      {
        href: EASY_AUTO.guides.ceramicPrice,
        anchor: "ceramic coating price ranges across the UAE",
      },
    ]}
    relatedServices={[
      {
        to: "/ppf-dubai",
        label: "Paint protection film Dubai",
        blurb: "Physical chip protection ceramic alone cannot provide.",
      },
      {
        to: "/car-detailing-dubai",
        label: "Detailing & polishing Dubai",
        blurb: "Correction-only visits when you are not ready to coat yet.",
      },
      {
        to: "/window-tinting-dubai",
        label: "Window tinting Dubai",
        blurb: "Cabin heat control that complements exterior coating.",
      },
      {
        to: "/blog/gtechniq-vs-ceramic-pro-dubai",
        label: "Gtechniq vs Ceramic Pro",
        blurb: "Brand comparison for owners researching coating chemistry.",
      },
    ]}
    faqs={[
      {
        question: "Is ceramic coating the same as PPF?",
        answer:
          "No. Ceramic coating is a thin glass-like layer for gloss and easier cleaning. PPF is a thick film that absorbs stone chips. Many Dubai owners run both — film on impact zones for physical protection, ceramic across the whole car for gloss, UV defence, and easier washing between visits.",
      },
      {
        question: "How long does ceramic coating last in Dubai?",
        answer:
          "With correct prep and maintenance, quality coatings last multiple years. Neglect, automatic brushes, and harsh chemicals from cheap wash tunnels shorten that considerably. We brief every client on wash habits at collection, because the coating's lifespan depends far more on aftercare than on the product itself.",
      },
      {
        question: "Do you use GYEON?",
        answer:
          "Yes. GYEON materials are part of our detailing and protection processes alongside our broader coating recommendations for each car, chosen based on paint type, colour, and how the vehicle is actually used day to day.",
      },
      {
        question: "Can you coat matte paint or matte PPF?",
        answer:
          "Matte surfaces need matte-safe products and technique — a standard gloss-boosting ceramic will ruin the flat finish you paid for. Tell us the finish when you book so we select the correct matte-compatible coating and do not add unwanted shine.",
      },
      {
        question: "Will ceramic coating stop water spots from Dubai's hard water?",
        answer:
          "It reduces them significantly by making water bead and roll off before minerals can bake onto hot paint, but it does not make paint completely immune. Drying the car promptly after washing, especially in summer, still matters — the coating buys you time, not permanent immunity.",
      },
      {
        question: "How soon can I wash the car after coating?",
        answer:
          "We give a curing window before the first wash — typically keep the car dry and garaged or shaded for the period we specify so the coating bonds fully. Washing too early with any product, even a gentle one, can disrupt the cure.",
      },
    ]}
    sections={[
      {
        h2: "What does ceramic coating actually do in Dubai heat?",
        body: (
          <>
            <p>
              Dubai UV and mineral water spots punish unprotected clearcoat
              faster than almost anywhere else. A properly applied ceramic
              coating increases surface hardness feel, deepens gloss on
              already-polished paint, and makes dust and traffic film release
              with safer wash methods. It does not stop rock chips on Sheikh
              Zayed Road — that is still PPF territory, and no amount of
              ceramic chemistry changes that.
            </p>
            <p>
              Read the broader product comparison in our{" "}
              <a
                href="/blog/ceramic-coating-guide"
                className="text-[#f7b52b] underline-offset-2 hover:underline"
              >
                ceramic coating guide
              </a>{" "}
              and the Dubai-focused{" "}
              <a
                href="/blog/ppf-vs-ceramic-dubai"
                className="text-[#f7b52b] underline-offset-2 hover:underline"
              >
                PPF vs ceramic
              </a>{" "}
              article if you are choosing one product first and adding the
              other later.
            </p>
          </>
        ),
      },
      {
        h2: "How much does ceramic coating cost in Dubai?",
        body: (
          <>
            <p>
              Essential ceramic packages with single-stage correction start
              from around AED 1,800, and signature packages with multi-stage
              correction start from AED 2,800. The gap between the two is
              almost entirely about how much correction time your paint
              actually needs, not a different coating product being poured
              from a different bottle.
            </p>
            <p>
              Cars with heavy swirling from years of automatic brush washes
              need more polishing hours before a coating will look right —
              coating over unresolved defects just seals a dull, hazy finish
              under a hydrophobic layer. We quote after inspecting under
              proper lighting, not from a phone photo in bright sun that
              hides every mark.
            </p>
          </>
        ),
      },
      {
        h2: "Why paint correction before coating matters",
        body: (
          <>
            <p>
              Coating locks in whatever is underneath it. If your black paint
              is swirled from mall car washes or a previous owner's dry
              wiping habit, we correct first, then coat. Skipping correction
              is how cars leave the shop looking "protected" but still dull
              and hazy the moment direct sun hits the bonnet.
            </p>
            <p>
              Our detailing bay stages polish levels to the actual defect
              depth, not a one-pad-fits-all package sold regardless of
              condition. See our{" "}
              <a
                href="/car-detailing-dubai"
                className="text-[#f7b52b] underline-offset-2 hover:underline"
              >
                detailing and paint correction page
              </a>{" "}
              for how we grade correction stages before quoting a coating
              package on top.
            </p>
          </>
        ),
      },
      {
        h2: "Ceramic coating vs PPF — which comes first?",
        body: (
          <>
            <p>
              If budget forces a choice, PPF on the front end usually comes
              first because it stops physical damage that a coating cannot
              prevent. Ceramic then goes on top of the film and the rest of
              the untouched panels, giving you gloss and easy maintenance
              across the whole car while the highest-impact zones get real
              chip protection.
            </p>
            <p>
              Many Dubai owners eventually run the full stack — STEK PPF on
              impact zones, ceramic over the film and the remaining paint.
              If you are planning both, tell us up front so we sequence the
              work correctly instead of coating panels that are about to be
              wrapped in film a month later.
            </p>
          </>
        ),
      },
      {
        h2: "Does ceramic coating make washing easier day to day?",
        body: (
          <>
            <p>
              Yes, noticeably. Coated paint releases brake dust, traffic
              film, and light dust storms with far less scrubbing, which
              matters in a city where a car can look dirty again within two
              days of a wash. Water sheets off in beads rather than sitting
              in a film, taking dirt with it as it runs.
            </p>
            <p>
              That said, "easier" does not mean "no maintenance." A coated
              car still needs a pH-balanced wash and proper drying — the
              coating reduces effort and risk, it does not remove the need
              for a wash routine entirely.
            </p>
          </>
        ),
      },
      {
        h2: "Maintenance after coating",
        body: (
          <>
            <p>
              Use a pH-balanced shampoo, avoid automatic brush tunnels that
              grind grit into fresh coating, dry with clean microfibre
              towels rather than letting the sun bake water spots on, and
              book periodic inspections so we can catch any early wear before
              it becomes a bigger problem.
            </p>
            <p>
              We explain aftercare in plain language at collection so the
              coating you paid for is still performing in August heat, not
              just in the first cool month after install. If you notice
              beading has dropped off noticeably, that is worth a message to
              us rather than assuming the coating has simply "worn out."
            </p>
          </>
        ),
      },
      {
        h2: "GYEON vs Gtechniq vs Ceramic Pro — does the brand actually matter?",
        body: (
          <>
            <p>
              All three are recognised, serious coating brands with real
              chemistry behind them, and each has installer networks across
              the UAE. The honest answer is that application quality and
              correction prep move the final result far more than which
              logo is on the bottle — a poorly prepped panel coated with a
              premium brand still looks worse than a well-corrected panel
              coated with a mid-tier one.
            </p>
            <p>
              We use GYEON as part of our core process because of the
              layering options and durability we have tested directly on
              Dubai cars over multiple summers. If you are comparing brands
              before booking anywhere, our{" "}
              <a
                href="/blog/gtechniq-vs-ceramic-pro-dubai"
                className="text-[#f7b52b] underline-offset-2 hover:underline"
              >
                Gtechniq vs Ceramic Pro breakdown
              </a>{" "}
              covers where those two specifically differ on hardness,
              gloss, and warranty support.
            </p>
          </>
        ),
      },
      {
        h2: "Is ceramic coating worth it on a leased or short-term car?",
        body: (
          <>
            <p>
              It depends on how long "short-term" actually is. If you are
              leasing for one year and plan to hand the car back, an
              essential-tier coating still pays for itself in easier washing
              and better resale condition, even if you never see the
              multi-year durability the product is capable of.
            </p>
            <p>
              For cars you plan to keep two years or more, the signature
              package with fuller correction makes more financial sense
              because you get more of the coating's total lifespan out of
              the investment. Tell us your ownership horizon when you book
              and we will recommend the package that actually matches it,
              rather than upselling a longer warranty than you need.
            </p>
          </>
        ),
      },
    ]}
  />
);

export default CeramicCoatingDubai;
