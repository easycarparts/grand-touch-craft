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

const baseUrl = "https://www.grandtouchauto.ae";

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
        <p>DIP 2, Dubai Investment Park — 2, Thani warehouse — 3 11b, Dubai, UAE. Phone +971567191045. Email info@grandtouchauto.com. Monday–Saturday 9:00–18:00.</p>
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
        <p>DIP 2, Dubai Investment Park — 2, Thani warehouse — 3 11b, Dubai, UAE</p>
        <h2>Phone and email</h2>
        <p>+971567191045 · info@grandtouchauto.com</p>
        <h2>Hours</h2>
        <p>Monday–Saturday 9:00–18:00. Sunday closed.</p>
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
    title: "Full Car PPF Price Dubai | Grand Touch Auto",
    description:
      "See your full car PPF price in Dubai, build a premium setup step by step, and claim 5% off, pickup, or tint with Sean on WhatsApp.",
    keywords:
      "full car PPF price Dubai, guided PPF quote Dubai, premium PPF Dubai, full body PPF Dubai, STEK PPF Dubai, PPF offer Dubai",
    ogTitle: "Full Car PPF Price Dubai | Grand Touch",
    ogDescription:
      "Choose vehicle size, finish, and warranty package, then reveal a premium PPF setup with a direct WhatsApp bonus claim.",
    seoBody: `
        <h1>Full car PPF price in Dubai</h1>
        <p>Build a premium full-car PPF setup step by step with Grand Touch Auto before asking Sean to confirm the exact price, bonus, and next slot.</p>
        <h2>What the guided flow covers</h2>
        <ul>
          <li>Vehicle size selection for full body PPF</li>
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
