import ServicePillarPage from "@/components/ServicePillarPage";
import { EASY_AUTO } from "@/lib/business";

const PpfDubai = () => (
  <ServicePillarPage
    path="/ppf-dubai"
    title="Paint Protection Film (PPF) Dubai | STEK Certified | Grand Touch Auto"
    description="STEK-certified paint protection film in Dubai. Front end, track pack, and full body PPF with warranty registration, paint correction, and studio install in DIP 2."
    keywords="paint protection film Dubai, PPF Dubai, STEK PPF Dubai, full body PPF Dubai, front PPF Dubai, PPF installation Dubai"
    ogTitle="STEK-Certified PPF in Dubai | Grand Touch Auto"
    ogDescription="Front, track pack, and full body paint protection film with STEK warranty registration at Grand Touch Studio, DIP 2."
    image="/guided-sean-with-patrols-v2.jpg"
    h1="Paint Protection Film (PPF) in Dubai"
    intro="Grand Touch Auto Repair installs STEK-certified paint protection film for Dubai owners who want real chip defence, registered warranty, and clean edges — not grey-market film with a fancy sticker."
    serviceSchema={{
      name: "Paint Protection Film (PPF) installation in Dubai",
      serviceType: "Paint Protection Film installation",
      description:
        "STEK-certified PPF installation including front end, track pack, and full body coverage with paint correction and warranty registration.",
    }}
    heroAlt="STEK PPF installation at Grand Touch Studio Dubai with protected SUVs"
    whatsappText="Hi Sean, I want a PPF quote for my car in Dubai."
    ctaLabel="Get a PPF quote on WhatsApp"
    packageNote="Indicative STEK package starting points for Dubai. Vehicle size and paint condition change the final figure."
    packages={[
      {
        name: "Front end PPF",
        coverage: "Bonnet, bumper, full front wings, mirrors",
        fromPrice: "4,500+",
        bestFor: "Highway chip defence on daily drivers",
      },
      {
        name: "Track pack",
        coverage: "Front end + A-pillars, roof leading edge, rockers",
        fromPrice: "7,500+",
        bestFor: "SUVs and performance cars with side strike risk",
      },
      {
        name: "Full body PPF",
        coverage: "Complete painted exterior + high-impact zones",
        fromPrice: "12,500+",
        bestFor: "New luxury cars kept long-term in Dubai heat",
      },
      {
        name: "Colour / matte PPF",
        coverage: "Full body colour change or stealth finish",
        fromPrice: "Custom",
        bestFor: "Owners wanting protection plus a new look",
      },
    ]}
    easyAutoLinks={[
      {
        href: EASY_AUTO.guides.ppfCost,
        anchor: "Easy Auto's PPF cost guide for Dubai",
      },
      {
        href: EASY_AUTO.guides.bestPpfBrands,
        anchor: "independent PPF brand comparison for the UAE",
      },
    ]}
    relatedServices={[
      {
        to: "/ceramic-coating-dubai",
        label: "Ceramic coating Dubai",
        blurb: "Gloss and hydrophobic top layer after film or on unprotected paint.",
      },
      {
        to: "/window-tinting-dubai",
        label: "Window tinting Dubai",
        blurb: "Heat-rejecting ceramic tint that pairs cleanly with PPF edges.",
      },
      {
        to: "/car-detailing-dubai",
        label: "Detailing & polishing Dubai",
        blurb: "Paint correction before film so defects are not sealed under PPF.",
      },
      {
        to: "/best-ppf-studio-dubai",
        label: "Best PPF studio overview",
        blurb: "Studio credentials, STEK focus, and what is included in packages.",
      },
    ]}
    faqs={[
      {
        question: "Is Grand Touch a certified STEK installer in Dubai?",
        answer:
          "Yes. We install STEK as our primary PPF line and register manufacturer warranty where the film and install qualify. Ask to see registration in your name before you leave — a real installer relationship has no reason to hide that paperwork, and you should treat any studio that hesitates as a warning sign.",
      },
      {
        question: "What coverage should I choose — front, track pack, or full body?",
        answer:
          "Front end stops most highway chips on a daily driver. Track pack adds rockers and leading edges that Dubai sand, kerbs, and low sills punish, which matters most on SUVs and lower performance cars. Full body is the right call for new luxury paint you plan to keep for years, or for owners who simply do not want to think about it panel by panel.",
      },
      {
        question: "Do you correct paint before installing PPF?",
        answer:
          "Yes on full packages. Installing film over swirls, water spots, or light scratches locks those defects in permanently — you are effectively sealing a flaw under a layer that is hard to remove without risk. We stage correction to the paint condition first, then install in a controlled bay once the surface is genuinely clean.",
      },
      {
        question: "How long does full body PPF take?",
        answer:
          "Most full body installs take several studio days including prep, paint correction where needed, install, and edge finishing. Track packs and front-end jobs are faster. We confirm the exact schedule after inspecting your car in person, since panel condition and film series both affect timing.",
      },
      {
        question: "Can I get a price before visiting?",
        answer:
          "Yes — use our guided calculator for a range, then WhatsApp Sean with your model and photos for a tighter quote. Final pricing is always confirmed after a physical inspection because paint condition, previous repairs, and panel size all move the number.",
      },
      {
        question: "Can you remove old or failing PPF without reinstalling straight away?",
        answer:
          "Yes. Removal-only visits are common for owners with lifted, yellowed, or badly cut film from a previous installer. We heat and pull the old film carefully, then inspect and report on the paint underneath so you know exactly what condition it is in before deciding on a new install.",
      },
      {
        question: "What happens if a stone chip actually cracks through the film?",
        answer:
          "PPF absorbs the vast majority of impacts, but a hard enough strike can still mark the film itself rather than the paint underneath. That is the point of the product — the film is designed to be the sacrificial layer. Panel sections can be recut and replaced without touching the rest of your protected paint.",
      },
    ]}
    sections={[
      {
        h2: "Why Dubai cars need real PPF — not a cheap wrap",
        body: (
          <>
            <p>
              Dubai driving combines hot clearcoat, abrasive dust, and highway
              debris that chips soft modern paint in months, not years. Paint
              protection film is a thick, clear urethane layer that takes the
              hit so your factory paint does not. Done properly with
              STEK-grade film, it self-heals light swirl marks with heat and
              stays optically clear under Gulf sun for years, not just the
              first summer.
            </p>
            <p>
              Cheap "PPF" quotes in Dubai often use vinyl-thickness film,
              grey-market stock, or unregistered product that yellows along
              the edges and fails warranty checks the first time you try to
              claim on it. If a price looks half the market rate for the same
              coverage, read our studio notes on{" "}
              <a
                href="/blog/why-cheap-ppf-dubai-is-fake"
                className="text-[#f7b52b] underline-offset-2 hover:underline"
              >
                why cheap PPF in Dubai is usually fake
              </a>{" "}
              before you pay a deposit — it explains exactly what gets
              substituted on a quote and how to spot it.
            </p>
            <p>
              The gap between a real install and a rushed one usually shows up
              twelve to eighteen months later: lifted edges around door
              handles, a yellow tint along the bonnet's leading edge, or a
              shop with no record of your warranty registration when you call
              them about it. We would rather lose a booking to a cheaper quote
              today than have a client discover that gap in year two.
            </p>
          </>
        ),
      },
      {
        h2: "What film grades and finishes do you install?",
        body: (
          <>
            <p>
              Our main recommendation for most Dubai owners is STEK, with a
              warranty route that matches how long you will keep the car —
              typically 5-, 10-, or premium longer-term packages. Finishes
              include clear gloss for invisible protection, matte or stealth
              for a factory-look transformation, and full colour PPF when you
              want a new look without committing to a permanent vinyl wrap.
            </p>
            <p>
              STEK is not the only serious film on the UAE market, and we say
              that openly. Suntek and XPEL both have legitimate installer
              networks here, and the real differences between the top brands
              are smaller than the marketing suggests once you compare
              like-for-like coverage and installer skill. If you are shopping
              around, our{" "}
              <a
                href="/blog/stek-vs-xpel-dubai"
                className="text-[#f7b52b] underline-offset-2 hover:underline"
              >
                STEK vs XPEL Dubai guide
              </a>{" "}
              and{" "}
              <a
                href="/blog/stek-vs-suntek-dubai"
                className="text-[#f7b52b] underline-offset-2 hover:underline"
              >
                STEK vs Suntek comparison
              </a>{" "}
              break down clarity, self-healing speed, and warranty terms
              side by side.
            </p>
            <p>
              Sean helps you choose coverage and finish against your parking
              habits, highway use, and whether you care more about invisible
              protection or a visible matte look. There is no single "best"
              film for every car — there is a best film for how you actually
              drive and park in Dubai.
            </p>
          </>
        ),
      },
      {
        h2: "How does Grand Touch install and register warranty?",
        body: (
          <>
            <p>
              Process: inspection → paint correction as needed → template or
              pattern cut → dust-controlled install → edge finishing →
              manufacturer warranty registration in your name where
              applicable → two-week inspection. Full packages also include
              detailing stages and support inspections so film is maintained,
              not abandoned the moment you drive off the lot.
            </p>
            <p>
              You can estimate coverage with the{" "}
              <a
                href="/ppf-full-ppf-calculator-guided-v2"
                className="text-[#f7b52b] underline-offset-2 hover:underline"
              >
                guided PPF calculator
              </a>{" "}
              or the{" "}
              <a
                href="/ppf-cost-calculator"
                className="text-[#f7b52b] underline-offset-2 hover:underline"
              >
                quick cost calculator
              </a>
              , then message us directly for model-specific advice — Patrol,
              G-Wagon, Tesla, Porsche, and other daily luxury traffic all cut
              differently and price differently.
            </p>
            <p>
              Warranty registration is the step most "cheap PPF" shops skip
              because it takes time and ties the installer's name to the
              work permanently. We register it because we expect to still be
              answering your calls in year three, not just on install day.
            </p>
          </>
        ),
      },
      {
        h2: "How much does PPF cost in Dubai?",
        body: (
          <>
            <p>
              Front-end packages typically start from AED 4,500, track packs
              from AED 7,500, and full body coverage from AED 12,500 — but the
              number that actually matters is the one you get after we see
              your car. Panel size, existing paint condition, and whether
              correction is needed before install all move the final figure
              in either direction.
            </p>
            <p>
              Use the{" "}
              <a
                href="/ppf-cost-calculator"
                className="text-[#f7b52b] underline-offset-2 hover:underline"
              >
                PPF cost calculator
              </a>{" "}
              for a fast range based on your model, or send photos on
              WhatsApp for a tighter estimate before you drive in. Be wary of
              quotes that sit dramatically below every other number you have
              received for the same coverage — that gap is almost never a
              genuine discount.
            </p>
          </>
        ),
      },
      {
        h2: "What is a track pack and do I actually need one?",
        body: (
          <>
            <p>
              A track pack extends front-end coverage to the A-pillars, the
              roof's leading edge, and rocker panels — the zones that take a
              beating from highway grit at 120km/h and from low sills
              scraping sand-covered kerbs. It sits between front-only and full
              body in both price and protection, and it is the coverage we
              recommend most often for SUVs.
            </p>
            <p>
              If you drive Sheikh Zayed Road daily, park in a compound with
              gravel underfoot, or own an SUV that sees Hatta or desert tracks
              even occasionally, a track pack earns its price difference
              within the first year. Daily city-only sedans with careful
              parking habits can often get away with front end coverage
              alone.
            </p>
          </>
        ),
      },
      {
        h2: "STEK vs XPEL vs Suntek — how do we help you choose?",
        body: (
          <>
            <p>
              All three brands are legitimate, certified, and available
              through trained installers in the UAE. The differences that
              actually matter in practice are edge-wrap technique, topcoat
              self-healing speed in Gulf heat, and how quickly the
              installer's own warranty paperwork gets filed — not which name
              sounds more premium on Instagram.
            </p>
            <p>
              We install STEK as our primary line because of the installer
              training and warranty support we have direct access to, but we
              will talk you through Suntek and XPEL honestly if you are
              comparing quotes from other studios. Read the independent
              brand breakdowns before you decide:{" "}
              <a
                href="/blog/stek-vs-xpel-dubai"
                className="text-[#f7b52b] underline-offset-2 hover:underline"
              >
                STEK vs XPEL
              </a>{" "}
              and{" "}
              <a
                href="/blog/stek-vs-suntek-dubai"
                className="text-[#f7b52b] underline-offset-2 hover:underline"
              >
                STEK vs Suntek
              </a>
              .
            </p>
          </>
        ),
      },
      {
        h2: "How do dealers void your PPF warranty in Dubai?",
        body: (
          <>
            <p>
              Some Dubai dealerships quietly tell buyers that aftermarket PPF
              voids the factory paint warranty, or that only their in-house
              film "counts." In most cases this is not accurate, but it gets
              repeated often enough that new owners delay protection until
              the first stone chip has already happened on the drive home.
            </p>
            <p>
              We put warranty registration in writing, in your name, so you
              have documentation independent of the dealer relationship. If
              you have been told your dealer warranty is at risk, read{" "}
              <a
                href="/blog/how-dealers-void-ppf-warranty-dubai"
                className="text-[#f7b52b] underline-offset-2 hover:underline"
              >
                how dealers actually void PPF warranty in Dubai
              </a>{" "}
              before you accept that answer at face value.
            </p>
          </>
        ),
      },
      {
        h2: "Is PPF worth it for a Tesla, G-Wagon, or Patrol in Dubai?",
        body: (
          <>
            <p>
              Yes, and for different reasons on each. Tesla paint is famously
              soft and chips easily on the front bumper and door edges within
              weeks of delivery. G-Wagon flat panels show every swirl and
              stone strike under direct Dubai sun. Patrols take the worst of
              sand, kerbs, and highway convoy driving on family road trips out
              of the city.
            </p>
            <p>
              We keep model-specific notes for exactly this reason — see{" "}
              <a
                href="/blog/tesla-ppf-dubai"
                className="text-[#f7b52b] underline-offset-2 hover:underline"
              >
                Tesla PPF in Dubai
              </a>{" "}
              and{" "}
              <a
                href="/blog/mercedes-g-wagon-ppf-dubai"
                className="text-[#f7b52b] underline-offset-2 hover:underline"
              >
                G-Wagon PPF coverage
              </a>{" "}
              for the panels and packages we recommend most often on each.
            </p>
          </>
        ),
      },
      {
        h2: "How do you remove old or failing PPF safely?",
        body: (
          <>
            <p>
              Old film that has yellowed, lifted at the edges, or was
              installed with the wrong adhesive needs controlled heat and the
              right pull angle to come off without damaging the clearcoat
              underneath. Rushing this step is how amateur removal jobs leave
              adhesive residue or, worse, strip paint along with the film.
            </p>
            <p>
              We inspect the paint the moment old film is off and report on
              its condition before you decide on a new install. If your
              current film is past its best and you are not sure whether it
              is worth removing yet, read our notes on{" "}
              <a
                href="/blog/removing-cheap-ppf-dubai"
                className="text-[#f7b52b] underline-offset-2 hover:underline"
              >
                removing cheap PPF in Dubai
              </a>{" "}
              — it covers the specific signs that removal and a fresh install
              are overdue.
            </p>
          </>
        ),
      },
      {
        h2: "Where are you located and who is this for?",
        body: (
          <>
            <p>
              We install at DIP 2, Dubai Investment Park — Thani warehouse 3
              11b. Owners come from Marina, Hills, Arabian Ranches, Jumeirah,
              and across Dubai for STEK work that is registered and inspected
              — not rushed through a bay between two other jobs on the same
              afternoon.
            </p>
            <p>
              If you are comparing studios before booking, our{" "}
              <a
                href="/best-ppf-studio-dubai"
                className="text-[#f7b52b] underline-offset-2 hover:underline"
              >
                best PPF studio in Dubai overview
              </a>{" "}
              lays out exactly what separates a certified install from a shop
              that has simply bought a roll of film and a squeegee.
            </p>
          </>
        ),
      },
    ]}
  />
);

export default PpfDubai;
