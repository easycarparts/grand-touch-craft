// Pre-rendering script for better SEO
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Generate static HTML files for key pages
const pages = [
  {
    path: '/',
    title: 'Grand Touch Auto – Dubai\'s Luxury Garage for Repair, Paint, Detailing & PPF',
    description: 'From precision diagnostics to high-gloss ceramic finishes, Grand Touch Auto delivers full-service automotive excellence in Dubai. Repair, paint, restoration, detailing & PPF.',
    content: `
      <h1>Grand Touch Auto - Dubai's Luxury Automotive Studio</h1>
      <p>Professional automotive services including repair, paint, detailing, PPF, and restoration in Dubai.</p>
      
      <h2>Our Services</h2>
      <ul>
        <li>Auto Repair & Diagnostics - Advanced ECU diagnostics and full mechanical service for luxury and performance vehicles</li>
        <li>Paint & Bodywork - Factory-grade refinishing, color matching, and full body restorations in dust-controlled booth</li>
        <li>Detailing & Ceramic Coating - Multi-stage detailing and nano-ceramic protection for superior gloss and durability</li>
        <li>PPF & Vinyl Wrapping - Premium XPEL/STEK/3M films and custom vinyl wraps for protection and transformation</li>
        <li>Restoration & Customization - Classic car restoration and custom modifications</li>
        <li>Off-Road & Performance - Suspension tuning, lift kits, and performance upgrades</li>
      </ul>
      
      <h2>About Grand Touch Auto</h2>
      <p>Dubai's premier luxury automotive studio specializing in repair, paint, detailing, PPF, and restoration services. We work with brands such as Mercedes-AMG, Porsche, BMW M, Range Rover, and McLaren, ensuring every job meets the standards of excellence our clients expect.</p>
      
      <h2>Contact Information</h2>
      <p>Location: DIP 2, Dubai Investment Park - 2, Thani warehouse - 3 11b, Dubai, UAE</p>
      <p>Phone: +971567191045</p>
      <p>Email: info@grandtouchauto.com</p>
      <p>Hours: Monday-Saturday 9:00 AM - 6:00 PM</p>
    `
  },
  {
    path: '/services',
    title: 'Premium Auto Services – Repair, Paint, Detailing & PPF in Dubai',
    description: 'Comprehensive automotive services including advanced diagnostics, factory-grade paintwork, ceramic coating, PPF installation, and luxury car restoration in Dubai.',
    content: `
      <h1>Our Services</h1>
      <p>Comprehensive automotive care tailored for Dubai's most discerning vehicle owners.</p>
      
      <h2>Auto Repair & Diagnostics</h2>
      <p>Advanced ECU diagnostics and full mechanical service for luxury and performance vehicles.</p>
      
      <h2>Paint & Bodywork</h2>
      <p>Factory-grade refinishing, color matching, and full body restorations in dust-controlled booth.</p>
      
      <h2>Detailing & Ceramic Coating</h2>
      <p>Multi-stage detailing and nano-ceramic protection for superior gloss and durability.</p>
      
      <h2>PPF & Vinyl Wrapping</h2>
      <p>Premium XPEL/STEK/3M films and custom vinyl wraps for protection and transformation.</p>
      
      <h2>Restoration & Customization</h2>
      <p>Classic car restoration and custom modifications.</p>
      
      <h2>Off-Road & Performance</h2>
      <p>Suspension tuning, lift kits, and performance upgrades.</p>
    `
  },
  {
    path: '/about',
    title: 'About Grand Touch Auto – Dubai\'s Premier Luxury Car Service',
    description: 'Learn about Grand Touch Auto\'s commitment to automotive excellence, certified partnerships with XPEL, 3M, and Gtechniq, and our expert team in Dubai.',
    content: `
      <h1>About Grand Touch Auto</h1>
      <p>Where Craftsmanship Meets Innovation</p>
      
      <p>Grand Touch Auto was born from a passion for automotive excellence and a commitment to delivering world-class service to Dubai's most prestigious vehicles.</p>
      
      <p>At Grand Touch Auto, we combine engineering expertise with artisan craftsmanship. From diagnostics to detailing, every vehicle receives meticulous care using factory-grade tools, OEM materials, and certified techniques.</p>
      
      <p>Our team services brands such as Mercedes-AMG, Porsche, BMW M, Range Rover, and McLaren, ensuring every job meets the standards of excellence our clients expect. We work exclusively with industry-leading partners like XPEL, 3M, Avery Dennison, and Gtechniq.</p>
      
      <p>Whether it's advanced diagnostics, factory-grade paintwork, or precision detailing — every vehicle that enters our facility is treated as a masterpiece, deserving of meticulous care and attention to detail that only true craftsmen can provide.</p>
    `
  },
  {
    path: '/contact',
    title: 'Contact Grand Touch Auto – Dubai Luxury Car Service Center',
    description: 'Get in touch with Dubai\'s premier luxury car service center. Book your appointment for repair, detailing, PPF, or paint services at Grand Touch Auto.',
    content: `
      <h1>Contact Grand Touch Auto</h1>
      <p>Get in touch with Dubai's premier luxury car service center.</p>
      
      <h2>Location</h2>
      <p>DIP 2, Dubai Investment Park - 2, Thani warehouse - 3 11b, Dubai, UAE</p>
      
      <h2>Contact Information</h2>
      <p>Phone: +971567191045</p>
      <p>Email: info@grandtouchauto.com</p>
      
      <h2>Business Hours</h2>
      <p>Monday - Saturday: 9:00 AM - 6:00 PM</p>
      <p>Sunday: Closed</p>
      
      <h2>Service Areas</h2>
      <p>We serve all areas of Dubai including Downtown Dubai, Jumeirah, Dubai Marina, Business Bay, and surrounding areas.</p>
    `
  }
];

// Generate HTML files for each page
pages.forEach(page => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${page.title}</title>
  <meta name="description" content="${page.description}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="https://grandtouchauto.com${page.path}">
</head>
<body>
  <div style="max-width: 1200px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
    ${page.content}
  </div>
</body>
</html>
  `;
  
  const filePath = path.join(__dirname, '..', 'dist', page.path === '/' ? 'index.html' : `${page.path}/index.html`);
  const dir = path.dirname(filePath);
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(filePath, html);
  console.log(`Generated: ${filePath}`);
});

console.log('Pre-rendering complete!');
