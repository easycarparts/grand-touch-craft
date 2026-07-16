/** Single source of truth for NAP + local business schema (must match Google Business Profile). */

export const BUSINESS = {
  legalName: "Grand Touch Auto Repair",
  brandName: "Grand Touch Auto",
  alternateName: "Grand Touch Studio",
  url: "https://www.grandtouchauto.ae",
  email: "hello@grandtouchauto.ae",
  phonePrimary: "+971567191045",
  phonePrimaryDisplay: "+971 56 719 1045",
  phoneWorkshop: "+971547302243",
  phoneWorkshopDisplay: "+971 54 730 2243",
  streetAddress: "DIP 2, Dubai Investment Park - 2, Thani warehouse - 3 11b",
  addressLocality: "Dubai",
  addressRegion: "Dubai",
  addressCountry: "AE",
  addressFull:
    "DIP 2, Dubai Investment Park - 2, Thani warehouse - 3 11b, Dubai, UAE",
  /** Approximate DIP 2 coordinates (not Downtown Dubai). */
  latitude: "24.9856",
  longitude: "55.1731",
  openingHoursDisplay: {
    days: "Monday - Saturday",
    hours: "9:00 AM - 7:00 PM",
    sunday: "Sunday - Closed",
  },
  /** schema.org OpeningHoursSpecification style */
  openingHours: "Mo-Sa 09:00-19:00",
  mapsUrl: "https://maps.app.goo.gl/QYYAMcW8TiEETeHs8",
  instagram: "https://www.instagram.com/grandtouchauto",
  logoPath: "/stek-white-full.png",
  whatsappDetailing: "https://wa.me/971567191045",
  whatsappWorkshop: "https://wa.me/971547302243",
  /** Matches Easy Auto listing / Google reviews snapshot. */
  ratingValue: "4.9",
  reviewCount: "83",
  easyAutoProfile: "https://easyauto.ae/business/grand-touch-auto-repair",
} as const;

export const EASY_AUTO = {
  profile: BUSINESS.easyAutoProfile,
  guides: {
    ppfCost: "https://easyauto.ae/guides/ppf-cost-in-dubai",
    bestPpfBrands: "https://easyauto.ae/guides/best-ppf-brands-uae",
    ceramicPrice: "https://easyauto.ae/guides/ceramic-coating-price-uae",
    tintLaw: "https://easyauto.ae/guides/window-tint-law-uae",
    detailingCost: "https://easyauto.ae/guides/car-detailing-cost-dubai",
    bestPpf: "https://easyauto.ae/best/best-ppf-paint-protection-film-uae",
    xpelVsStek: "https://easyauto.ae/guides/xpel-vs-stek",
  },
} as const;

export function getLocalBusinessJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "AutoRepair",
    name: BUSINESS.legalName,
    alternateName: [BUSINESS.brandName, BUSINESS.alternateName],
    description:
      "STEK-certified PPF, ceramic coating, window tinting, detailing, paint, and auto repair studio in Dubai Investment Park 2.",
    url: BUSINESS.url,
    telephone: BUSINESS.phonePrimary,
    email: BUSINESS.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: BUSINESS.streetAddress,
      addressLocality: BUSINESS.addressLocality,
      addressRegion: BUSINESS.addressRegion,
      addressCountry: BUSINESS.addressCountry,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: BUSINESS.latitude,
      longitude: BUSINESS.longitude,
    },
    openingHours: BUSINESS.openingHours,
    priceRange: "$$$",
    image: [
      `${BUSINESS.url}/guided-sean-with-patrols-v2.jpg`,
      `${BUSINESS.url}/guided-911-gloss.png`,
      `${BUSINESS.url}/guided-cullinan-ppf.png`,
    ],
    logo: {
      "@type": "ImageObject",
      url: `${BUSINESS.url}${BUSINESS.logoPath}`,
      width: 400,
      height: 120,
    },
    sameAs: [BUSINESS.instagram, BUSINESS.easyAutoProfile],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: BUSINESS.ratingValue,
      reviewCount: BUSINESS.reviewCount,
    },
    areaServed: {
      "@type": "City",
      name: "Dubai",
    },
  };
}

export function getServiceJsonLd(opts: {
  name: string;
  serviceType: string;
  description: string;
  url: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: opts.name,
    serviceType: opts.serviceType,
    description: opts.description,
    url: opts.url,
    provider: getLocalBusinessJsonLd(),
    areaServed: {
      "@type": "City",
      name: "Dubai",
    },
  };
}

export function getFaqPageJsonLd(
  faqs: { question: string; answer: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function injectJsonLd(id: string, payload: unknown) {
  const existing = document.querySelector(`script[data-page-schema="${id}"]`);
  if (existing) existing.parentNode?.removeChild(existing);
  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.setAttribute("data-page-schema", id);
  script.textContent = JSON.stringify(payload);
  document.head.appendChild(script);
}

export function removeJsonLd(...ids: string[]) {
  ids.forEach((id) => {
    document
      .querySelectorAll(`script[data-page-schema="${id}"]`)
      .forEach((node) => node.parentNode?.removeChild(node));
  });
}
