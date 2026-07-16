// Post-build: clone dist/index.html per route with unique <title>, meta, canonical,
// and crawlable body copy — keeps the real Vite bundle so the SPA still works.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, "..", "dist");
const templatePath = path.join(distDir, "index.html");

function escapeAttr(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;");
}

function escapeJsonScript(payload) {
  return JSON.stringify(payload).replace(/</g, "\\u003c");
}

const baseUrl = "https://www.grandtouchauto.ae";

function makeBlogArticlePage({
  slug,
  title,
  description,
  keywords,
  image,
  highlights,
}) {
  return {
    path: `/blog/${slug}`,
    title: `${title} | Grand Touch Auto Blog`,
    description,
    keywords,
    ogTitle: title,
    ogDescription: description,
    image,
    ogImageAlt: `${title} - Grand Touch Auto Dubai`,
    seoBody: `
        <h1>${title}</h1>
        <p>${description}</p>
        <h2>What this Dubai guide covers</h2>
        <ul>
          ${highlights.map((item) => `<li>${item}</li>`).join("\n          ")}
        </ul>
        <h2>Plan your next step</h2>
        <p>Compare the related Grand Touch Auto guides, use the PPF cost calculator for a practical estimate, or request a direct PPF quote when you are ready to speak with Sean.</p>
    `,
    noscriptExtra:
      "<p><strong>Enable JavaScript</strong> to read the full article, browse related guides, and use the quote tools.</p>",
  };
}

const blogArticlePages = [
  makeBlogArticlePage({
    slug: "ceramic-coating-guide",
    title: "The Complete Guide to Ceramic Coating: Protection That Lasts",
    description:
      "Learn how ceramic coating protects gloss, makes washing easier, and fits into a Dubai paint protection plan for luxury vehicles.",
    keywords:
      "ceramic coating Dubai, car ceramic coating Dubai, luxury car detailing Dubai, paint protection Dubai",
    image: "/service-ceramic.jpg",
    highlights: [
      "What ceramic coating does and what it does not do",
      "Where ceramic coating fits next to PPF",
      "Maintenance expectations for Dubai heat and dust",
    ],
  }),
  makeBlogArticlePage({
    slug: "ppf-vs-ceramic-coating",
    title: "Paint Protection Film vs Ceramic Coating: Which is Right for You?",
    description:
      "Compare paint protection film and ceramic coating so you can choose the right protection for chips, gloss, washing, and budget.",
    keywords:
      "PPF vs ceramic coating Dubai, paint protection film Dubai, ceramic coating Dubai, car paint protection Dubai",
    image: "/blog-hero-ppf-vs-ceramic-comparison.png",
    highlights: [
      "The difference between impact protection and gloss protection",
      "When PPF is the correct first layer",
      "When ceramic coating is enough for your car",
    ],
  }),
  makeBlogArticlePage({
    slug: "paint-correction-techniques",
    title: "Advanced Paint Correction Techniques for Luxury Vehicles",
    description:
      "Understand professional paint correction for luxury cars in Dubai, including swirl removal, gloss restoration, and prep before coating or PPF.",
    keywords:
      "paint correction Dubai, luxury car detailing Dubai, swirl removal Dubai, car polish Dubai",
    image: "/service-correction.jpg",
    highlights: [
      "Why correction quality affects the final finish",
      "How prep changes ceramic coating and PPF results",
      "What luxury car owners should inspect before booking",
    ],
  }),
  makeBlogArticlePage({
    slug: "custom-vinyl-wraps",
    title: "Custom Vinyl Wraps: Transforming Your Vehicle's Appearance",
    description:
      "Explore custom vinyl wraps, finish changes, and how wraps compare with colour PPF for Dubai drivers who want a new look.",
    keywords:
      "vinyl wrap Dubai, custom car wrap Dubai, colour PPF Dubai, matte wrap Dubai",
    image: "/service-wrap.jpg",
    highlights: [
      "How wraps change appearance without repainting",
      "Where colour PPF may be a better premium option",
      "Finish and maintenance considerations in Dubai",
    ],
  }),
  makeBlogArticlePage({
    slug: "performance-tuning",
    title: "Performance Tuning: Unlocking Your Engine's Potential",
    description:
      "A practical guide to professional performance tuning, ECU optimisation, and supporting upgrades for Dubai performance cars.",
    keywords:
      "performance tuning Dubai, ECU tuning Dubai, luxury car performance Dubai, car upgrades Dubai",
    image: "/service-performance.jpg",
    highlights: [
      "Why tuning should be matched to the car and driving use",
      "Supporting maintenance before power upgrades",
      "How exterior protection fits performance builds",
    ],
  }),
  makeBlogArticlePage({
    slug: "classic-car-restoration",
    title: "Classic Car Restoration: Bringing History Back to Life",
    description:
      "See how classic car restoration combines bodywork, paint, detailing, and careful protection planning for Dubai collectors.",
    keywords:
      "classic car restoration Dubai, car restoration Dubai, classic car paint Dubai, restoration workshop Dubai",
    image: "/service-restoration.jpg",
    highlights: [
      "How restoration moves from inspection to finish",
      "Why paint and trim choices need planning",
      "Where PPF or ceramic coating can protect restored paint",
    ],
  }),
  makeBlogArticlePage({
    slug: "is-ppf-worth-it-dubai",
    title: "Is PPF Worth the Investment for Dubai Car Owners?",
    description:
      "A Dubai-focused look at whether paint protection film is worth it for new cars, luxury SUVs, daily drivers, and long-term owners.",
    keywords:
      "is PPF worth it Dubai, PPF Dubai, car PPF Dubai, new car PPF Dubai, luxury car PPF Dubai",
    image: "/blog-hero-ppf-worth-dubai.png",
    highlights: [
      "The Dubai risks that make PPF more relevant",
      "When full body PPF is worth considering",
      "How to compare PPF cost against ownership goals",
    ],
  }),
  makeBlogArticlePage({
    slug: "ppf-vs-ceramic-dubai",
    title: "PPF vs Ceramic in Dubai: Which One Do You Really Need?",
    description:
      "Understand the real difference between PPF and ceramic coating in Dubai so you choose the right protection for heat, sand, chips, and gloss.",
    keywords:
      "PPF vs ceramic Dubai, paint protection film Dubai, ceramic coating Dubai, Dubai heat paint protection",
    image: "/blog-hero-ppf-ceramic-dubai-choice.png",
    highlights: [
      "Why PPF and ceramic solve different problems",
      "How Dubai heat, sand, and road use change the decision",
      "When to combine both for premium protection",
    ],
  }),
  makeBlogArticlePage({
    slug: "ppf-dubai-full-front-vs-full-body",
    title: "Full Front vs Full Body PPF in Dubai: Which Coverage Actually Makes Sense?",
    description:
      "Compare full front and full body PPF coverage in Dubai so you choose the right protection for your car, budget, and ownership goals.",
    keywords:
      "full front PPF Dubai, full body PPF Dubai, car PPF Dubai, PPF coverage Dubai, paint protection film Dubai",
    image: "/ppf-featured-ppf-dubai-full-front-vs-full-body-option-1.png",
    highlights: [
      "What full front PPF usually covers",
      "When full body PPF is worth the extra spend",
      "How Dubai roads and parking affect coverage choice",
    ],
  }),
  makeBlogArticlePage({
    slug: "ppf-longevity-dubai-heat",
    title: "How Long Does PPF Actually Last in Dubai Heat?",
    description:
      "Set realistic expectations for paint protection film durability in Dubai heat, UV, sand, washing, and daily driving.",
    keywords:
      "PPF warranty Dubai, PPF maintenance Dubai, Dubai heat paint protection, PPF longevity Dubai",
    image: "/ppf-featured-ppf-longevity-dubai-heat-option-1.png",
    highlights: [
      "How heat and UV affect film over time",
      "Maintenance habits that help PPF last longer",
      "When inspection or warranty support matters",
    ],
  }),
  makeBlogArticlePage({
    slug: "ppf-warranty-claims-dubai",
    title: "PPF Warranty Claims in Dubai: What Actually Gets Covered?",
    description:
      "Learn what PPF warranty claims usually cover in Dubai, what installers need to see, and how to avoid avoidable warranty issues.",
    keywords:
      "PPF warranty Dubai, paint protection film warranty Dubai, PPF installer Dubai, PPF maintenance Dubai",
    image: "/ppf-featured-ppf-warranty-claims-dubai.png",
    highlights: [
      "Common PPF warranty coverage issues",
      "What documentation helps a claim",
      "Why install quality matters before warranty terms",
    ],
  }),
  makeBlogArticlePage({
    slug: "ppf-cost-dubai-pricing-guide",
    title: "PPF Cost in Dubai: Complete Pricing Guide for Luxury Cars 2026",
    description:
      "Get real PPF pricing context for Dubai luxury cars, including coverage levels, vehicle size, film choice, and quote quality.",
    keywords:
      "PPF cost Dubai, PPF price Dubai, paint protection film Dubai price, car PPF Dubai, luxury car PPF Dubai",
    image: "/ppf-featured-ppf-cost-dubai-pricing-guide-option-1.png",
    highlights: [
      "What drives PPF price in Dubai",
      "How full front and full body pricing compare",
      "How to spot a fair quote versus a risky cheap quote",
    ],
  }),
  makeBlogArticlePage({
    slug: "matte-vs-gloss-ppf-dubai",
    title: "Gloss vs Matte PPF in Dubai: Which Finish Should You Choose?",
    description:
      "Compare gloss and matte PPF in Dubai so you can choose the finish that fits your car, your style, and your real-world use.",
    keywords:
      "matte PPF Dubai, gloss PPF Dubai, colour PPF Dubai, car PPF Dubai, STEK PPF Dubai",
    image: "/ppf-featured-ppf-dubai-full-front-vs-full-body-option-1.png",
    highlights: [
      "How gloss and matte PPF change the car visually",
      "Which finish is easier to live with in Dubai",
      "How finish choice affects quote conversations",
    ],
  }),
  makeBlogArticlePage({
    slug: "nissan-patrol-ppf-dubai",
    title: "Nissan Patrol PPF in Dubai: Coverage, Cost Factors, and Finish Choices",
    description:
      "A practical Dubai guide for Nissan Patrol owners comparing front PPF, full body PPF, gloss or matte film, and quote factors before booking.",
    keywords:
      "Nissan Patrol PPF Dubai, SUV PPF Dubai, car PPF Dubai, paint protection film Dubai, luxury SUV PPF, PPF quote Dubai",
    image: "/ppf-size-suv-nissan-patrol-gloss.png",
    highlights: [
      "When full front PPF makes sense for a Nissan Patrol",
      "When full body PPF is worth considering on a large Dubai SUV",
      "How gloss, matte, prep, and vehicle size affect the quote",
    ],
  }),
  makeBlogArticlePage({
    slug: "new-car-ppf-dubai",
    title: "New Car PPF in Dubai: What to Protect Before the First Summer",
    description:
      "A practical guide for Dubai owners deciding when to install PPF on a new car, which coverage makes sense, and how to request a proper quote.",
    keywords:
      "new car PPF Dubai, car PPF Dubai, paint protection film Dubai, car paint protection Dubai, PPF quote Dubai, Dubai heat paint protection",
    image: "/service-ppf.jpg",
    highlights: [
      "Why new cars still need paint inspection before PPF",
      "When full front or full body PPF makes sense on a new car",
      "How to request a proper new car PPF quote in Dubai",
    ],
  }),
  makeBlogArticlePage({
    slug: "lexus-lx600-ppf-dubai",
    title: "Lexus LX600 PPF in Dubai: Coverage, Cost Factors, and Finish Choices",
    description:
      "A practical Dubai guide for Lexus LX600 owners comparing full front PPF, full body PPF, gloss or matte film, and quote factors before booking.",
    keywords:
      "Lexus LX600 PPF Dubai, luxury SUV PPF Dubai, car PPF Dubai, paint protection film Dubai, PPF quote Dubai, Dubai heat paint protection",
    image: "/guided-cullinan-ppf.png",
    highlights: [
      "When full front PPF makes sense for a Lexus LX600",
      "When full body PPF is worth considering on a large luxury SUV",
      "How gloss, matte, prep, and vehicle size affect the quote",
    ],
  }),
  makeBlogArticlePage({
    slug: "stek-vs-xpel-dubai",
    title: "STEK vs XPEL PPF in Dubai: Which Film Should You Choose?",
    description:
      "A Dubai-focused comparison of STEK and XPEL paint protection film for clarity, heat, warranty, and ownership goals.",
    keywords: "STEK vs XPEL Dubai, STEK PPF Dubai, XPEL PPF Dubai, best PPF Dubai",
    image: "/guided-911-stek-roll.png",
    highlights: [
      "How STEK and XPEL differ for Dubai heat and highway debris",
      "Warranty and registration realities",
      "Which owners should choose which film",
    ],
  }),
  makeBlogArticlePage({
    slug: "stek-vs-suntek-dubai",
    title: "STEK vs SunTek PPF in Dubai: Heat, Clarity, and Warranty",
    description:
      "Compare STEK and SunTek PPF for Dubai heat, optical clarity, and warranty expectations before booking.",
    keywords: "STEK vs SunTek Dubai, SunTek PPF Dubai, PPF brands Dubai",
    image: "/guided-install-detail.png",
    highlights: [
      "Heat and clarity differences that matter in the UAE",
      "Warranty practicalities",
      "When SunTek may still be a fit",
    ],
  }),
  makeBlogArticlePage({
    slug: "gtechniq-vs-ceramic-pro-dubai",
    title: "Gtechniq vs Ceramic Pro in Dubai: Which Ceramic Coating Wins?",
    description:
      "Compare Gtechniq and Ceramic Pro for Dubai wash cycles, UV, and maintenance — and when coating alone is not enough.",
    keywords: "Gtechniq vs Ceramic Pro Dubai, ceramic coating Dubai brands",
    image: "/service-ceramic.jpg",
    highlights: [
      "Brand differences that matter after Dubai summer",
      "Maintenance expectations",
      "When to pair coating with PPF",
    ],
  }),
  makeBlogArticlePage({
    slug: "why-cheap-ppf-dubai-is-fake",
    title: "Why Cheap PPF in Dubai Is Usually Fake (And How to Spot It)",
    description:
      "How to spot grey-market and vinyl-thickness film sold as premium PPF in Dubai before you pay a deposit.",
    keywords: "cheap PPF Dubai, fake PPF Dubai, grey market PPF UAE",
    image: "/ppf-featured-ppf-warranty-claims-dubai.png",
    highlights: [
      "Red flags in half-price PPF quotes",
      "Registration and warranty checks",
      "What failed cheap film looks like when removed",
    ],
  }),
  makeBlogArticlePage({
    slug: "how-dealers-void-ppf-warranty-dubai",
    title: "How Dealers Can Void Your Paint Warranty — And What PPF Actually Changes",
    description:
      "What dealer paint warranties usually cover in the UAE and how professional PPF fits without false promises.",
    keywords: "dealer paint warranty Dubai, PPF warranty UAE, new car PPF Dubai",
    image: "/blog-hero-ppf-worth-dubai.png",
    highlights: [
      "What dealer warranties usually exclude",
      "How documented PPF helps ownership",
      "Questions to ask before film install",
    ],
  }),
  makeBlogArticlePage({
    slug: "tesla-ppf-dubai",
    title: "Tesla PPF in Dubai: Model Y, Model 3, and Cybertruck Coverage Guide",
    description:
      "Coverage priorities for Tesla paint in Dubai heat and highway debris for Model Y, Model 3, and Cybertruck.",
    keywords: "Tesla PPF Dubai, Model Y PPF Dubai, Model 3 PPF Dubai, Cybertruck PPF Dubai",
    image: "/guided-cullinan-ppf.png",
    highlights: [
      "High-impact zones on Tesla body styles",
      "Front vs full body decisions",
      "How to request a Tesla PPF quote",
    ],
  }),
  makeBlogArticlePage({
    slug: "mercedes-g-wagon-ppf-dubai",
    title: "Mercedes G-Wagon PPF in Dubai: Full Body vs Front Package",
    description:
      "Compare front packages vs full body STEK PPF for Mercedes G-Class owners driving in Dubai.",
    keywords: "G-Wagon PPF Dubai, Mercedes G-Class PPF Dubai, G63 PPF Dubai",
    image: "/guided-sean-with-patrols-v2.jpg",
    highlights: [
      "Why G-Wagon paint takes unique abuse",
      "Front vs full body trade-offs",
      "Finish choices for G-Class owners",
    ],
  }),
  makeBlogArticlePage({
    slug: "what-we-see-removing-cheap-ppf-dubai",
    title: "What We See When We Remove Cheap PPF in Dubai",
    description:
      "Studio findings from stripping failed budget film in Dubai — adhesive mess, stained paint, and re-install cost reality.",
    keywords: "remove PPF Dubai, failed PPF Dubai, PPF damage paint",
    image: "/guided-rolls-install.png",
    highlights: [
      "Common failure modes on cheap film",
      "Paint risk during removal",
      "Why re-doing STEK properly costs more later",
    ],
  }),
];

const g700CustomizerPage = {
  path: "/g700-customizer",
  title: "G700 PPF & Customization Dubai | Grand Touch Auto",
  description:
    "Compare gloss or matte PPF, blackout or paint-matched trim, accessories, and pricing direction for your Jetour G700 before requesting a quote in Dubai.",
  keywords:
    "G700 PPF Dubai, Jetour G700 PPF Dubai, G700 customizer Dubai, G700 accessories Dubai, G700 blackout package Dubai, G700 matte PPF Dubai, G700 gloss PPF Dubai",
  ogTitle: "G700 PPF & Customization Dubai",
  ogDescription:
    "Compare colours, gloss or matte PPF, blackout trim, paint-matched options, and G700 accessories before sending your build to Grand Touch Auto.",
  image: "/g700-orange.png",
  ogImageAlt: "Jetour G700 PPF and customization in Dubai",
  seoBody: `
        <h1>Jetour G700 PPF and customization in Dubai</h1>
        <p>Use the Grand Touch G700 customizer to compare gloss PPF, matte PPF, blackout trim, paint-matched finishes, accessories, and quote direction before speaking with Sean.</p>
        <h2>What the G700 customizer covers</h2>
        <ul>
          <li>Gloss and matte PPF directions for the Jetour G700</li>
          <li>Blackout and paint-matched trim concepts</li>
          <li>Accessory ideas including roof, lighting, sill, step, and storage upgrades</li>
          <li>Direct WhatsApp quote handoff for the selected build</li>
        </ul>
        <h2>Related PPF planning</h2>
        <p>G700 owners can also compare PPF pricing, full body protection, and Dubai heat protection through the Grand Touch PPF calculators and blog guides.</p>
    `,
  noscriptExtra:
    "<p><strong>Enable JavaScript</strong> to use the interactive G700 customizer and send your selected build.</p>",
};

const pages = [
  {
    path: "/",
    title: "Grand Touch Auto – Dubai's Luxury Garage for Repair, Paint, Detailing & PPF",
    description:
      "From precision diagnostics to high-gloss ceramic finishes, Grand Touch Auto delivers full-service automotive excellence in Dubai. Repair, paint, restoration, detailing & PPF.",
    keywords:
      "Dubai auto repair, luxury car service, ceramic coating, PPF installation, paint protection, car detailing, automotive restoration, Mercedes service, Porsche service, BMW service, Dubai automotive",
    ogTitle: "Grand Touch Auto – Dubai's Luxury Automotive Garage",
    ogDescription:
      "Full-service automotive excellence: Repair, diagnostics, paint, bodywork, detailing, PPF & restoration for luxury vehicles.",
    seoBody: `
        <h1>Grand Touch Auto — Dubai's luxury automotive studio</h1>
        <p>Professional automotive services including repair, paint, detailing, PPF, and restoration in Dubai.</p>
        <h2>Our services</h2>
        <ul>
          <li>Auto repair and diagnostics — ECU diagnostics and mechanical service for luxury and performance vehicles</li>
          <li>Paint and bodywork — refinishing, color matching, and restorations in a dust-controlled booth</li>
          <li>Detailing and ceramic coating — multi-stage detailing and nano-ceramic protection</li>
          <li>PPF and vinyl wrapping — XPEL, STEK, 3M films and custom wraps</li>
          <li>Restoration and customization — classics and bespoke builds</li>
          <li>Off-road and performance — suspension, lifts, and upgrades</li>
        </ul>
        <h2>Contact</h2>
        <p>DIP 2, Dubai Investment Park - 2, Thani warehouse - 3 11b, Dubai, UAE. Phone +971567191045. Email hello@grandtouchauto.ae. Monday–Saturday 9:00–19:00.</p>
    `,
    noscriptExtra:
      "<p><strong>Enable JavaScript</strong> for live booking, animations, and the full gallery.</p>",
  },
  {
    path: "/services",
    title: "Premium Auto Services – Repair, Paint, Detailing & PPF in Dubai",
    description:
      "Comprehensive automotive services including advanced diagnostics, factory-grade paintwork, ceramic coating, PPF installation, and luxury car restoration in Dubai.",
    keywords:
      "auto repair Dubai, car paint service, ceramic coating Dubai, PPF installation, car detailing, luxury car service, automotive restoration, paint correction",
    ogTitle: "Premium Automotive Services – Grand Touch Auto Dubai",
    ogDescription:
      "Comprehensive automotive care tailored for Dubai's most discerning vehicle owners.",
    seoBody: `
        <h1>Premium auto services in Dubai</h1>
        <p>Repair, paint, detailing, PPF, and restoration for luxury vehicles — one workshop, factory-grade standards.</p>
        <h2>Diagnostics and repair</h2>
        <p>Advanced ECU diagnostics and mechanical service for performance and luxury cars.</p>
        <h2>Paint and bodywork</h2>
        <p>Factory-grade refinishing, color matching, and full body restorations.</p>
        <h2>Detailing and ceramic coating</h2>
        <p>Multi-stage detailing and nano-ceramic protection for gloss and durability.</p>
        <h2>PPF and vinyl</h2>
        <p>Premium film brands and custom wraps for protection and style.</p>
        <h2>Restoration and performance</h2>
        <p>Classic restoration, customization, suspension, and performance upgrades.</p>
    `,
    noscriptExtra:
      "<p><strong>Enable JavaScript</strong> to browse service packages and book online.</p>",
  },
  {
    path: "/about",
    title: "About Grand Touch Auto – Dubai's Premier Luxury Car Service",
    description:
      "Learn about Grand Touch Auto's commitment to automotive excellence, certified partnerships with XPEL, 3M, and Gtechniq, and our expert team in Dubai.",
    keywords:
      "about Grand Touch Auto, Dubai car service, luxury automotive, certified partners, XPEL installer, 3M authorized, Gtechniq certified",
    ogTitle: "About Grand Touch Auto – Dubai's Premier Automotive Excellence",
    ogDescription:
      "Our story of craftsmanship and innovation in Dubai's luxury car service industry.",
    seoBody: `
        <h1>About Grand Touch Auto</h1>
        <p><strong>Where craftsmanship meets innovation.</strong> Grand Touch Auto was built for owners who expect OEM-level care and show-quality finishes.</p>
        <p>We combine engineering discipline with artisan paint, film, and detailing. Every vehicle is treated with factory-grade tools, OEM-aligned materials, and certified techniques.</p>
        <p>We regularly service Mercedes-AMG, Porsche, BMW M, Range Rover, McLaren, and other prestige brands. Partners include XPEL, 3M, Avery Dennison, and Gtechniq.</p>
        <p>From diagnostics to paint, PPF, ceramic coating, and restoration — each car is handled as a long-term asset, not a quick job.</p>
    `,
    noscriptExtra:
      "<p><strong>Enable JavaScript</strong> for the full about experience and team highlights.</p>",
  },
  {
    path: "/portfolio",
    title: "Portfolio – Grand Touch Auto's Luxury Car Projects in Dubai",
    description:
      "Explore our portfolio of luxury car projects including ceramic coating, PPF installation, paint correction, and restoration work on premium vehicles in Dubai.",
    keywords:
      "Grand Touch Auto portfolio, luxury car projects, ceramic coating examples, PPF installation gallery, Dubai car detailing showcase",
    ogTitle: "Portfolio – Luxury Car Projects by Grand Touch Auto",
    ogDescription:
      "Showcase of ceramic coating, PPF, and detailing work on Dubai's finest vehicles.",
    seoBody: `
        <h1>Portfolio — our work in Dubai</h1>
        <p>Selected projects: paint protection film, ceramic coating, and detailing on luxury and performance vehicles.</p>
        <h2>Featured projects</h2>
        <ul>
          <li>Jetour G700 — full matte STEK PPF</li>
          <li>Mercedes S-Class — Hyper Pro champagne gold PPF</li>
          <li>Toyota Prado — matte STEK PPF</li>
          <li>Land Rover Defender — STEK clear PPF</li>
          <li>BMW X5 — ceramic coating</li>
          <li>Toyota Supra — ceramic coating</li>
          <li>Ford Bronco — ceramic coating</li>
          <li>Chevrolet El Camino — ceramic coating</li>
        </ul>
        <p>Visit the interactive gallery with full images after loading the site.</p>
    `,
    noscriptExtra:
      "<p><strong>Enable JavaScript</strong> to view the full image gallery and project details.</p>",
  },
  {
    path: "/contact",
    title: "Contact Grand Touch Auto – Dubai Luxury Car Service Center",
    description:
      "Get in touch with Dubai's premier luxury car service center. Book your appointment for repair, detailing, PPF, or paint services at Grand Touch Auto.",
    keywords:
      "contact Grand Touch Auto, Dubai car service appointment, luxury car booking, automotive consultation, service inquiry",
    ogTitle: "Contact Grand Touch Auto – Dubai Luxury Car Service",
    ogDescription:
      "Book your appointment with Dubai's premier luxury automotive service center.",
    seoBody: `
        <h1>Contact Grand Touch Auto</h1>
        <p>Book repair, detailing, PPF, paint, or ask for a consultation.</p>
        <h2>Location</h2>
        <p>DIP 2, Dubai Investment Park - 2, Thani warehouse - 3 11b, Dubai, UAE</p>
        <h2>Phone and email</h2>
        <p>+971567191045 · hello@grandtouchauto.ae</p>
        <h2>Hours</h2>
        <p>Monday–Saturday 9:00–19:00. Sunday closed.</p>
        <h2>Service areas</h2>
        <p>Dubai including Downtown, Jumeirah, Dubai Marina, Business Bay, and surrounding areas.</p>
    `,
    noscriptExtra:
      "<p><strong>Enable JavaScript</strong> to use the contact form and WhatsApp shortcuts.</p>",
  },
  {
    path: "/blog",
    title: "Automotive Blog & Insights – Grand Touch Auto Dubai",
    description:
      "Expert automotive insights from Dubai's premier luxury car studio. Learn about PPF pricing, ceramic coating, coverage decisions, and maintenance.",
    keywords:
      "PPF Dubai blog, automotive blog Dubai, paint protection guides, ceramic coating tips, Grand Touch Auto blog",
    ogTitle: "Automotive Blog & Insights – Grand Touch Auto",
    ogDescription:
      "Read practical guides on PPF, ceramic, detailing, and paint protection for Dubai driving conditions.",
    seoBody: `
        <h1>Grand Touch Auto blog</h1>
        <p>Practical Dubai-focused guides on paint protection film, ceramic coating, and luxury car care.</p>
        <h2>Popular reads</h2>
        <ul>
          <li>PPF vs ceramic in Dubai</li>
          <li>Full front vs full body PPF</li>
          <li>How long PPF lasts in Dubai heat</li>
          <li>PPF warranty claims in Dubai</li>
        </ul>
        <h2>Need pricing first?</h2>
        <p>Use our PPF cost calculator to estimate by coverage, finish, and car size before requesting a final quote.</p>
    `,
    noscriptExtra:
      "<p><strong>Enable JavaScript</strong> to browse all articles and related recommendations.</p>",
  },
  g700CustomizerPage,
  ...blogArticlePages,
  {
    path: "/ppf-dubai",
    title: "Paint Protection Film (PPF) Dubai | STEK Certified | Grand Touch Auto",
    description:
      "STEK-certified paint protection film in Dubai. Front end, track pack, and full body PPF with warranty registration in DIP 2.",
    keywords:
      "paint protection film Dubai, PPF Dubai, STEK PPF Dubai, full body PPF Dubai",
    ogTitle: "STEK-Certified PPF in Dubai | Grand Touch Auto",
    ogDescription:
      "Front, track pack, and full body paint protection film with STEK warranty registration.",
    image: "/guided-sean-with-patrols-v2.jpg",
    seoBody: `
        <h1>Paint Protection Film (PPF) in Dubai</h1>
        <p>STEK-certified PPF installation at Grand Touch Auto Repair in Dubai Investment Park 2.</p>
        <h2>Coverage options</h2>
        <ul>
          <li>Front end PPF</li>
          <li>Track pack</li>
          <li>Full body PPF</li>
          <li>Colour and matte PPF</li>
        </ul>
        <h2>Next step</h2>
        <p>WhatsApp Sean for a quote or use the guided PPF calculator.</p>
    `,
  },
  {
    path: "/ceramic-coating-dubai",
    title: "Ceramic Coating Dubai | GYEON Studio Finish | Grand Touch Auto",
    description:
      "Professional ceramic coating in Dubai with paint correction prep for gloss, easier washing, and UV defence.",
    keywords: "ceramic coating Dubai, GYEON ceramic Dubai, car ceramic coating Dubai",
    image: "/guided-911-gloss.png",
    seoBody: `
        <h1>Ceramic Coating in Dubai</h1>
        <p>Multi-stage paint correction and ceramic coating packages for Dubai heat and dust.</p>
    `,
  },
  {
    path: "/window-tinting-dubai",
    title: "Window Tinting Dubai | Ceramic Tint & Heat Rejection | Grand Touch",
    description:
      "Professional window tinting in Dubai with heat-rejecting ceramic film options and clean studio installs.",
    keywords: "window tinting Dubai, ceramic window tint Dubai, car tint Dubai",
    image: "/guided-tint-install.png",
    seoBody: `
        <h1>Window Tinting in Dubai</h1>
        <p>Heat-rejecting ceramic tint installed at Grand Touch Studio, DIP 2.</p>
    `,
  },
  {
    path: "/car-detailing-dubai",
    title: "Car Detailing & Polishing Dubai | Paint Correction | Grand Touch",
    description:
      "Professional car detailing and polishing in Dubai — multi-stage paint correction and prep for ceramic or PPF.",
    keywords: "car detailing Dubai, paint correction Dubai, car polishing Dubai",
    image: "/guided-install-detail.png",
    seoBody: `
        <h1>Car Detailing and Polishing in Dubai</h1>
        <p>Paint correction, interior detailing, and protection prep at Grand Touch Auto.</p>
    `,
  },
  {
    path: "/best-ppf-studio-dubai",
    title: "Best PPF Studio in Dubai | Certified STEK PPF | Grand Touch Studio",
    description:
      "Grand Touch Studio by Grand Touch Auto Repair is one of Dubai's leading certified PPF studios for STEK PPF, colour PPF, tinting, paint, and customisation.",
    keywords:
      "best PPF studio Dubai, best PPF installer Dubai, STEK PPF Dubai, colour PPF Dubai, paint protection film Dubai, GYEON installer Dubai, Grand Touch Studio",
    ogTitle: "One of Dubai's Leading Certified PPF Studios",
    ogDescription:
      "Certified STEK and GYEON installation, Sean-led advice, warranty registration, colour PPF, tinting, paint, and customisation in DIP 2.",
    image: "/guided-sean-with-patrols-v2.jpg",
    ogImageAlt: "Sean at Grand Touch Studio with PPF vehicles in Dubai",
    seoBody: `
        <h1>One of Dubai's leading certified PPF studios</h1>
        <p>Grand Touch Studio is the PPF, detailing, colour PPF, tinting, and customisation side of Grand Touch Auto Repair in Dubai Investment Park 2.</p>
        <h2>Why choose Grand Touch for PPF in Dubai</h2>
        <ul>
          <li>Certified STEK and GYEON installer with STEK as the main PPF focus</li>
          <li>Sean-led advice before choosing clear gloss, matte, colour PPF, or warranty route</li>
          <li>Manufacturer warranty registration where applicable plus Grand Touch installation guarantee</li>
          <li>Two-week inspection, six-month free refresh, and lifetime PPF inspection support</li>
          <li>PPF, window tinting, car paint, detailing, and customisation under one accountable workshop</li>
        </ul>
        <h2>Package inclusions</h2>
        <p>Grand Touch full PPF packages include multi-stage paint correction, full interior and exterior detailing, headlights and door sills protected, interior leather ceramic coating, rims ceramic coating, and lifetime inspection support. 5% VAT applies to all prices.</p>
        <h2>Vehicles we commonly advise for PPF</h2>
        <p>Mercedes G-Class, Tesla Cybertruck, Land Rover Defender, Porsche 911, Nissan Patrol, Toyota Land Cruiser, Lexus LX600, Jetour G700, ROX 01, Aston Martin, Rolls-Royce, and other luxury Dubai vehicles.</p>
        <h2>Get pricing</h2>
        <p>Use the guided PPF calculator to choose vehicle size, finish, and warranty direction, then Sean can confirm final pricing on WhatsApp.</p>
    `,
    noscriptExtra:
      "<p><strong>Enable JavaScript</strong> to use the guided calculator, view the full studio page, and message Sean on WhatsApp.</p>",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "Service",
        name: "Certified PPF installation in Dubai",
        serviceType: "Paint Protection Film installation",
        provider: {
          "@type": "AutoRepair",
          name: "Grand Touch Auto Repair",
          alternateName: "Grand Touch Studio",
          url: "https://www.grandtouchauto.ae",
          telephone: "+971567191045",
          email: "hello@grandtouchauto.ae",
          address: {
            "@type": "PostalAddress",
            streetAddress: "DIP 2, Dubai Investment Park - 2, Thani warehouse - 3 11b",
            addressLocality: "Dubai",
            addressCountry: "AE",
          },
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: "4.9",
            reviewCount: "83",
          },
        },
        areaServed: {
          "@type": "City",
          name: "Dubai",
        },
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "Is Grand Touch Auto the same as Grand Touch Studio?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Grand Touch Auto Repair is the workshop business in Dubai Investment Park. Grand Touch Studio is the PPF, detailing, colour PPF, tinting, and customisation side used on social channels.",
            },
          },
          {
            "@type": "Question",
            name: "Are you certified STEK and GYEON installers?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. Grand Touch works as a certified STEK and GYEON installer, with STEK as the main PPF focus and GYEON materials used across detailing and protection processes.",
            },
          },
          {
            "@type": "Question",
            name: "Do you offer colour PPF in Dubai?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. Grand Touch installs colour PPF as a premium alternative to a standard vinyl wrap, giving a finish change while still adding paint protection.",
            },
          },
          {
            "@type": "Question",
            name: "How do I get PPF pricing?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Use the guided PPF calculator to choose vehicle size, finish, and warranty direction. Sean then confirms the final recommendation and quote on WhatsApp after reviewing the details.",
            },
          },
        ],
      },
    ],
  },
  {
    path: "/ppf-cost-calculator",
    title: "PPF Cost Calculator Dubai | Full Body & Front PPF Price Estimate",
    description:
      "Estimate PPF pricing in Dubai by car size, coverage, finish, and brand. Compare front vs full body options, then confirm your quote on WhatsApp.",
    keywords:
      "PPF cost calculator Dubai, front PPF price Dubai, full body PPF cost Dubai, matte PPF Dubai price, STEK PPF Dubai price",
    ogTitle: "PPF Cost Calculator Dubai | Front & Full Body PPF Pricing",
    ogDescription:
      "Get a practical PPF estimate for Dubai in seconds and compare coverage options before booking.",
    seoBody: `
        <h1>PPF cost calculator in Dubai</h1>
        <p>Get an instant estimate for paint protection film based on coverage, finish, warranty, and vehicle size.</p>
        <h2>What affects PPF pricing</h2>
        <ul>
          <li>Front vs full body coverage</li>
          <li>Gloss vs matte finish</li>
          <li>Vehicle size and panel complexity</li>
          <li>Film brand and warranty term</li>
        </ul>
        <h2>After your estimate</h2>
        <p>Compare guides, review portfolio work, and message Sean on WhatsApp for final inspection-based pricing.</p>
    `,
    noscriptExtra:
      "<p><strong>Enable JavaScript</strong> to use the interactive calculator and visual preview.</p>",
  },
  {
    path: "/ppf-dubai-quote",
    title: "PPF Dubai Quote | Grand Touch",
    description:
      "Get a Grand Touch PPF quote in Dubai with a short form, trust-led pricing flow, and direct WhatsApp follow-up from Sean.",
    keywords:
      "PPF Dubai quote, Grand Touch PPF Dubai, STEK PPF Dubai, full body PPF Dubai price, front PPF Dubai quote",
    ogTitle: "PPF Dubai Quote | Grand Touch",
    ogDescription:
      "Premium PPF quote funnel for Dubai drivers with STEK 10-year positioning, warranty trust, and fast WhatsApp handoff.",
    seoBody: `
        <h1>PPF Dubai quote from Grand Touch</h1>
        <p>Request a fast paint protection film quote in Dubai with a short form, practical estimate flow, and direct follow-up from Sean.</p>
        <h2>Why this page exists</h2>
        <p>Built for premium buyers who want genuine material, clean installation, and verified warranty registration instead of bargain-first sales tactics.</p>
        <h2>What you can confirm here</h2>
        <ul>
          <li>STEK 10-year PPF starting pricing for full body protection</li>
          <li>Front-end protection as a custom quote path</li>
          <li>Vehicle size and finish preference</li>
          <li>Direct WhatsApp handoff with your details already captured</li>
        </ul>
        <h2>Trust signals</h2>
        <p>Grand Touch is positioned here as a certified STEK and GYEON installer in Dubai with warranty-led, authenticity-focused messaging for cautious buyers.</p>
    `,
    noscriptExtra:
      "<p><strong>Enable JavaScript</strong> to use the short quote form, estimate controls, and WhatsApp handoff.</p>",
  },
  {
    path: "/ppf-full-ppf-calculator",
    title: "Full PPF Price Calculator Dubai | Grand Touch Auto",
    description:
      "Calculate a full car PPF starting price in Dubai by vehicle size, finish, and warranty package. Send the setup to Grand Touch on WhatsApp.",
    keywords:
      "full PPF Dubai calculator, full car PPF price Dubai, PPF price Dubai, paint protection film Dubai price, luxury car PPF Dubai",
    ogTitle: "Full PPF Price Calculator Dubai | Grand Touch",
    ogDescription:
      "Choose your vehicle size, finish, and full PPF package, then message Sean at Grand Touch to confirm exact price and availability.",
    seoBody: `
        <h1>Full PPF price calculator in Dubai</h1>
        <p>Use the Grand Touch full-car PPF calculator to see a starting price by vehicle size, finish, and warranty package before messaging Sean on WhatsApp.</p>
        <h2>What the calculator covers</h2>
        <ul>
          <li>Full-car paint protection film pricing</li>
          <li>Gloss or matte finish direction</li>
          <li>Vehicle size examples for small cars, saloons, SUVs, and sports cars</li>
          <li>Warranty-led package options with Grand Touch installation standards</li>
        </ul>
        <h2>Why this page exists</h2>
        <p>This paid-search calculator gives Dubai PPF buyers a fast starting price while still explaining the value behind Sean-led advice, prep before film, real handovers, and traceable warranty proof.</p>
    `,
    noscriptExtra:
      "<p><strong>Enable JavaScript</strong> to use the interactive full PPF calculator and WhatsApp handoff.</p>",
  },
  {
    path: "/ppf-full-ppf-calculator-guided",
    title: "PPF Dubai Price Calculator | Full Car Paint Protection Film",
    description:
      "Use the Grand Touch PPF Dubai calculator to estimate full car paint protection film pricing, full body PPF options, STEK film, and install support.",
    keywords:
      "ppf dubai, paint protection film dubai, ppf price dubai, ppf cost dubai, full body ppf dubai, full car ppf dubai, full car PPF price Dubai, car ppf dubai, car paint protection film dubai, premium PPF Dubai, STEK PPF Dubai, PPF installation Dubai, PPF installer Dubai",
    ogTitle: "PPF Dubai Price Calculator | Grand Touch",
    ogDescription:
      "Choose vehicle size, finish, and warranty package, then reveal a premium paint protection film setup with Sean on WhatsApp.",
    seoBody: `
        <h1>PPF Dubai price calculator</h1>
        <p>Build a premium full-car PPF setup step by step with Grand Touch Auto before asking Sean to confirm the exact price, bonus, and next slot.</p>
        <p>This guided calculator is built for Dubai drivers comparing paint protection film, PPF price, PPF cost, full body PPF, car paint protection film, STEK PPF, and premium PPF installation in Dubai.</p>
        <h2>What the guided flow covers</h2>
        <ul>
          <li>Vehicle size selection for full body PPF and full car PPF</li>
          <li>Gloss or matte finish direction</li>
          <li>5-year, 10-year, and 12-year warranty packages</li>
          <li>Premium bonuses such as 5% off, pickup and drop-off, tint, ceramic extras, and lifetime inspection support</li>
        </ul>
        <h2>Why this page exists</h2>
        <p>This experimental Google PPC funnel adds more micro-commitment before the price reveal and gives buyers a stronger reason to message Sean on WhatsApp.</p>
    `,
    noscriptExtra:
      "<p><strong>Enable JavaScript</strong> to use the guided full PPF quote flow and WhatsApp handoff.</p>",
  },
  {
    path: "/ppf-full-ppf-calculator-guided-v2",
    title: "PPF Dubai Price Calculator | Full Car Paint Protection Film",
    description:
      "Use the Grand Touch PPF Dubai calculator to estimate full car paint protection film pricing, full body PPF options, STEK film, and your 20% online discount.",
    keywords:
      "ppf dubai, paint protection film dubai, ppf price dubai, ppf cost dubai, full body ppf dubai, full car ppf dubai, full car PPF price Dubai, car ppf dubai, car paint protection film dubai, premium PPF Dubai, STEK PPF Dubai, PPF installation Dubai, PPF installer Dubai",
    ogTitle: "PPF Dubai Price Calculator | Grand Touch",
    ogDescription:
      "Choose vehicle size, finish, and warranty package, then unlock a 20% online paint protection film discount with a direct WhatsApp handoff.",
    seoBody: `
        <h1>PPF Dubai price calculator</h1>
        <p>Build a premium full-car PPF setup step by step with Grand Touch Auto, unlock the 20% online discount, and send your locked-in price to Sean on WhatsApp.</p>
        <p>This V2 funnel is built for Dubai drivers comparing paint protection film, PPF price, PPF cost, full body PPF, car paint protection film, STEK PPF, and premium PPF installation in Dubai.</p>
        <h2>What the V2 guided flow covers</h2>
        <ul>
          <li>Vehicle size selection for full body PPF and full car PPF</li>
          <li>Gloss or matte finish direction</li>
          <li>5-year, 10-year, and 12-year warranty packages</li>
          <li>A name and WhatsApp unlock step for the primary lead conversion</li>
          <li>A secondary WhatsApp handoff after the price is locked in</li>
        </ul>
        <h2>Why this page exists</h2>
        <p>This Google PPC funnel separates the primary form-submit conversion from the secondary WhatsApp handoff so Google Ads can optimise toward submitted leads.</p>
    `,
    noscriptExtra:
      "<p><strong>Enable JavaScript</strong> to use the guided full PPF V2 quote flow and WhatsApp handoff.</p>",
  },
  {
    path: "/ppf-meta-full-car-ppf-v2",
    title: "Meta Full PPF Offer Dubai | Grand Touch Auto",
    description:
      "Use the Meta-only Grand Touch full PPF calculator to reveal your Dubai paint protection film setup and claim the online offer.",
    keywords:
      "Meta PPF Dubai, full car PPF Dubai offer, PPF price Dubai Meta, Grand Touch PPF, STEK PPF Dubai",
    ogTitle: "Meta Full PPF Offer Dubai",
    ogDescription:
      "Choose car size, finish, and warranty in a Meta-specific full PPF flow, then WhatsApp Sean with your locked-in setup.",
    seoBody: `
        <h1>Meta full PPF offer in Dubai</h1>
        <p>Use a Meta-specific Grand Touch full PPF calculator to choose vehicle size, finish, and warranty before revealing the online offer.</p>
        <h2>What the Meta V2 flow covers</h2>
        <ul>
          <li>Vehicle size selection for full body PPF and full car PPF</li>
          <li>Gloss or matte finish direction</li>
          <li>5-year, 10-year, and 12-year warranty packages</li>
          <li>A name and WhatsApp unlock step for the Meta lead event</li>
          <li>A separate WhatsApp contact handoff after the price is locked in</li>
        </ul>
        <h2>Why this page exists</h2>
        <p>This paid-social funnel keeps Meta traffic separate from the Google V2 experiment while preserving the same guided PPF quote experience.</p>
    `,
    noscriptExtra:
      "<p><strong>Enable JavaScript</strong> to use the Meta guided full PPF V2 quote flow and WhatsApp handoff.</p>",
  },
  {
    path: "/ppf-tiktok-full-car-ppf",
    title: "TikTok Full PPF Offer Dubai | Grand Touch Auto",
    description:
      "Tap through a mobile-first full car PPF quote flow for Dubai, reveal your starting price, and claim a Grand Touch TikTok bonus on WhatsApp.",
    keywords:
      "TikTok PPF Dubai, full car PPF Dubai offer, PPF price Dubai TikTok, Grand Touch PPF, STEK PPF Dubai",
    ogTitle: "TikTok Full PPF Offer Dubai",
    ogDescription:
      "Choose car size, finish, and warranty in a fast TikTok-first flow, then WhatsApp Sean with your setup and bonus claim.",
    seoBody: `
        <h1>TikTok full car PPF quote in Dubai</h1>
        <p>Use a fast mobile-first flow to choose vehicle size, finish, and warranty before revealing a Grand Touch full PPF starting price.</p>
        <h2>What the TikTok flow covers</h2>
        <ul>
          <li>Tap-first vehicle size selection</li>
          <li>Gloss or matte finish direction</li>
          <li>5-year, 10-year, and 12-year full PPF packages</li>
          <li>WhatsApp handoff with the selected setup and bonus claim already written</li>
        </ul>
        <h2>Why this page exists</h2>
        <p>This paid-social funnel keeps TikTok traffic in a shorter mobile quote experience while tracking it separately from Google PPC traffic.</p>
    `,
    noscriptExtra:
      "<p><strong>Enable JavaScript</strong> to use the TikTok full PPF guided calculator and WhatsApp handoff.</p>",
  },
  {
    path: "/ppf-tiktok-quote_2",
    title: "PPF TikTok Quote | Grand Touch",
    description:
      "See your Grand Touch PPF price range in Dubai with a faster social-first quote flow, visual proof, and direct WhatsApp follow-up from Sean.",
    keywords:
      "PPF TikTok quote Dubai, PPF Dubai quote, STEK PPF Dubai, paint protection film Dubai, Grand Touch Auto",
    ogTitle: "PPF TikTok Quote | Grand Touch",
    ogDescription:
      "TikTok-first PPF quote funnel for Dubai drivers with quick qualification, visual proof, and fast WhatsApp handoff.",
    seoBody: `
        <h1>PPF quote for Dubai drivers</h1>
        <p>See your likely PPF price range, compare coverage, and request a fast follow-up from Grand Touch Auto.</p>
        <h2>What this page focuses on</h2>
        <ul>
          <li>Fast vehicle qualification for social traffic</li>
          <li>Coverage guidance for front protection or full body PPF</li>
          <li>Premium film positioning with STEK-backed trust</li>
          <li>Direct WhatsApp handoff with your details already captured</li>
        </ul>
        <h2>Why it exists</h2>
        <p>This route is designed for paid social traffic while keeping the same core quote engine and CRM tracking as the main PPF funnel.</p>
    `,
    noscriptExtra:
      "<p><strong>Enable JavaScript</strong> to use the short quote form, estimate controls, and WhatsApp handoff.</p>",
  },
  {
    path: "/ppf-tiktok-quote-guided",
    title: "Guided PPF Quote Dubai | Grand Touch",
    description:
      "Answer a few quick questions and let Sean point you to the right PPF finish, film setup, and next step in Dubai.",
    keywords:
      "guided PPF quote Dubai, TikTok PPF quote Dubai, STEK PPF Dubai, gloss matte colour PPF Dubai",
    ogTitle: "Guided PPF Quote Dubai | Grand Touch",
    ogDescription:
      "A focused TikTok-first quote path for Dubai drivers who want fast PPF advice without reading a full landing page first.",
    seoBody: `
        <h1>Guided PPF quote for Dubai drivers</h1>
        <p>Answer a few quick questions so Grand Touch can recommend the right paint protection film setup for your car.</p>
        <h2>What this guided flow captures</h2>
        <ul>
          <li>Name and mobile number for fast follow-up</li>
          <li>Vehicle make, model, and year</li>
          <li>Gloss, matte, colour PPF, or not sure yet</li>
          <li>Direct WhatsApp or calculator next step</li>
        </ul>
        <h2>Why it exists</h2>
        <p>This route is designed for cold TikTok traffic that needs a simpler, more guided mobile quote experience before reading the full PPF page.</p>
    `,
    noscriptExtra:
      "<p><strong>Enable JavaScript</strong> to use the guided quote flow and WhatsApp handoff.</p>",
  },
  {
    path: "/ppf-tiktok-quote-guided/funnel",
    title: "Guided PPF Funnel | Grand Touch",
    description:
      "Continue from the TikTok guided PPF quote flow into the full Grand Touch PPF funnel without restarting your quote.",
    keywords:
      "guided PPF funnel Dubai, TikTok PPF quote details, STEK PPF calculator Dubai, Grand Touch PPF quote",
    ogTitle: "Guided PPF Funnel | Grand Touch",
    ogDescription:
      "A guided continuation copy of the TikTok PPF funnel with saved setup, calculator, and WhatsApp follow-up.",
    seoBody: `
        <h1>Guided PPF funnel</h1>
        <p>Continue from the Grand Touch TikTok guided quote flow into the full funnel without restarting the old form.</p>
        <h2>What this page shows</h2>
        <ul>
          <li>Your saved vehicle, finish preference, and contact details from the quick quote flow</li>
          <li>Compact full body and front protection PPF options</li>
          <li>Gloss, matte, and colour PPF next steps</li>
          <li>Direct WhatsApp handoff to Sean with your details included</li>
        </ul>
        <h2>Why it exists</h2>
        <p>This route keeps TikTok guided quote users in a dedicated copy of the full funnel instead of sending them into the older live TikTok route.</p>
    `,
    noscriptExtra:
      "<p><strong>Enable JavaScript</strong> to load your saved guided quote details and message Sean on WhatsApp.</p>",
  },
  {
    path: "/ppf-dubai-quote-v1",
    title: "PPF Dubai Quote V1 | Grand Touch",
    description:
      "Sandbox version of the Grand Touch PPF quote funnel with premium trust messaging, a guided calculator, and direct WhatsApp follow-up from Sean.",
    keywords:
      "PPF Dubai quote V1, Grand Touch PPF funnel, STEK PPF Dubai quote, PPF calculator Dubai, premium PPF quote",
    ogTitle: "PPF Dubai Quote V1 | Grand Touch",
    ogDescription:
      "Sandbox review version of the Grand Touch PPF quote page with updated funnel copy, proof, and guided estimate flow.",
    seoBody: `
        <h1>PPF Dubai quote sandbox from Grand Touch</h1>
        <p>This route is a review version of the Grand Touch paint protection film quote page in Dubai, built to test stronger trust messaging, proof, and a guided estimator before the live page is replaced.</p>
        <h2>What this version focuses on</h2>
        <ul>
          <li>Premium trust-led PPF messaging for Dubai buyers</li>
          <li>Stronger proof around Sean, STEK, and warranty registration</li>
          <li>A guided calculator flow for finish, size, coverage, and pricing direction</li>
          <li>Direct WhatsApp handoff with conversational message prefills</li>
        </ul>
        <h2>Who it is for</h2>
        <p>Buyers comparing full body versus front protection, gloss versus matte, and longer-term warranty options who still want direct advice before booking.</p>
    `,
    noscriptExtra:
      "<p><strong>Enable JavaScript</strong> to review the sandbox quote flow, guided calculator, and WhatsApp handoff.</p>",
  },
];

function applyPage(html, page) {
  const canonical = page.path === "/" ? baseUrl : `${baseUrl}${page.path}`;

  let out = html;
  out = out.replace(/<title>[^<]*<\/title>/, `<title>${escapeAttr(page.title)}</title>`);
  out = out.replace(
    /<meta name="description" content="[^"]*" \/>/,
    `<meta name="description" content="${escapeAttr(page.description)}" />`
  );
  out = out.replace(
    /<meta name="keywords" content="[^"]*" \/>/,
    `<meta name="keywords" content="${escapeAttr(page.keywords)}" />`
  );
  out = out.replace(
    /<link rel="canonical" href="[^"]*" \/>/,
    `<link rel="canonical" href="${escapeAttr(canonical)}" />`
  );
  out = out.replace(
    /<meta property="og:title" content="[^"]*" \/>/,
    `<meta property="og:title" content="${escapeAttr(page.ogTitle)}" />`
  );
  out = out.replace(
    /<meta property="og:description" content="[^"]*" \/>/,
    `<meta property="og:description" content="${escapeAttr(page.ogDescription)}" />`
  );
  if (page.image) {
    const image = page.image.startsWith("http") ? page.image : `${baseUrl}${page.image}`;
    out = out.replace(
      /<meta property="og:image" content="[^"]*" \/>/,
      `<meta property="og:image" content="${escapeAttr(image)}" />`
    );
    out = out.replace(
      /<meta name="twitter:image" content="[^"]*" \/>/,
      `<meta name="twitter:image" content="${escapeAttr(image)}" />`
    );
  }
  if (page.ogImageAlt) {
    out = out.replace(
      /<meta property="og:image:alt" content="[^"]*" \/>/,
      `<meta property="og:image:alt" content="${escapeAttr(page.ogImageAlt)}" />`
    );
    out = out.replace(
      /<meta name="twitter:image:alt" content="[^"]*" \/>/,
      `<meta name="twitter:image:alt" content="${escapeAttr(page.ogImageAlt)}" />`
    );
  }
  out = out.replace(
    /<meta property="og:url" content="[^"]*" \/>/,
    `<meta property="og:url" content="${escapeAttr(canonical)}" />`
  );
  out = out.replace(
    /<meta name="twitter:title" content="[^"]*" \/>/,
    `<meta name="twitter:title" content="${escapeAttr(page.ogTitle)}" />`
  );
  out = out.replace(
    /<meta name="twitter:description" content="[^"]*" \/>/,
    `<meta name="twitter:description" content="${escapeAttr(page.ogDescription)}" />`
  );

  const seoBlock = `$1
        ${page.seoBody.trim()}
      $3`;
  out = out.replace(
    /(<div id="seo-content" style="display: none; max-width: 1200px; margin: 0 auto; padding: 20px;">)([\s\S]*?)(<\/div>\s*\n\s*<!-- Fallback content for search engines -->)/,
    seoBlock
  );

  const noscriptInner = `
          ${page.seoBody.trim()}
          ${page.noscriptExtra}
      `;
  out = out.replace(
    /(<!-- Fallback content for search engines -->\s*<noscript>\s*<div style="padding: 20px; font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto;">)([\s\S]*?)(<\/div>\s*<\/noscript>)/,
    `$1${noscriptInner}$3`
  );

  if (page.jsonLd?.length) {
    const scripts = page.jsonLd
      .map(
        (payload, index) =>
          `<script type="application/ld+json" data-prerender-schema="${page.path}-${index}">${escapeJsonScript(payload)}</script>`
      )
      .join("\n    ");
    out = out.replace("</head>", `    ${scripts}\n  </head>`);
  }

  return out;
}

if (!fs.existsSync(templatePath)) {
  console.error("prerender: dist/index.html not found. Run vite build first.");
  process.exit(1);
}

const template = fs.readFileSync(templatePath, "utf8");

pages.forEach((page) => {
  const html = applyPage(template, page);
  const filePath =
    page.path === "/"
      ? path.join(distDir, "index.html")
      : path.join(distDir, page.path.replace(/^\//, ""), "index.html");
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, html);
  console.log(`prerender: wrote ${path.relative(distDir, filePath)}`);
});

console.log("prerender: complete");
