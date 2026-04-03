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

const baseUrl = "https://grandtouchauto.com";

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
