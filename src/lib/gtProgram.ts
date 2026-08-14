// GT Protection Program — single source of truth for the program pages.
// Canonical content lives in docs/gt-tier-sheet-v1.md and docs/gt-protection-program-master-plan.md.
// Any price, warranty term, or claim shown on the site must come from here.

export const GT_WHATSAPP_NUMBER = "971567191045";

export const gtWhatsAppLink = (text: string) =>
  `https://wa.me/${GT_WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;

export const GT_WA = {
  general: gtWhatsAppLink("Hi Sean — I'd like to protect my car. Which program fits?"),
  essential: gtWhatsAppLink("Hi Sean — interested in GT Essential. My car: "),
  signature: gtWhatsAppLink("Hi Sean — interested in GT Signature. My car: "),
  concours: gtWhatsAppLink("Hi Sean — interested in GT Concours. My car: "),
  warranty: gtWhatsAppLink("Hi Sean — I have a question about the GT Owner's Warranty."),
};

// googleRating 4.9 is already published in the site's own schema (prerender.js AggregateRating 4.9 / 83 reviews).
// TODO(Sean): carsProtected — provide a defensible number; stays hidden while null.
export const GT_TRUST: { googleRating: number | null; carsProtected: string | null } = {
  googleRating: 4.9,
  carsProtected: null,
};

export type GtTierKey = "essential" | "signature" | "concours";

export interface GtTier {
  key: GtTierKey;
  name: string;
  tagline: string;
  /** Full-body price by size band, AED (+VAT). null = not offered. */
  /**
   * One price, every vehicle. Decided 2026-08-05: no SUV or exotic surcharge.
   * A single published number is the whole positioning — the moment pricing
   * needs a size table, it stops being "real prices, no bait".
   */
  fullBody: number;
  fullFront: number | null;
  warrantyLine: string;
  /** One-line version of warrantyLine for the card face. */
  warrantyShort: string;
  panelChip: string | null;
  /** Who this tier is for — the buyer self-selects by identity, not by spec. */
  identity: string;
  /** The single most valuable thing this tier buys. Leads the card body. */
  usp: string;
  /** What stepping UP to this tier actually buys, for the upgrade-math strip. */
  upgrade: string | null;
  /** Three short phrases for the card. Full detail lives in GT_COMPARISON. */
  highlights: string[];
  bullets: string[];
  daysInStudio: number;
  featured?: boolean;
  wa: string;
  cta: string;
}

export const GT_TIERS: GtTier[] = [
  {
    key: "essential",
    name: "GT Essential",
    tagline: "Protected, properly.",
    fullBody: 7900,
    // Full fronts discontinued 2026-08-13 (Sean: "we don't sell full front,
    // never — not worth it for us"). Full body only, program-wide.
    fullFront: null,
    warrantyLine: "GT 5-Year Warranty — film and workmanship, in writing",
    warrantyShort: "GT 5-Year Warranty",
    panelChip: null,
    identity: "For a car you'll change in a few years",
    usp: "Real cover at the entry price — 5 years, film and workmanship, in writing.",
    upgrade: null,
    highlights: ["Every painted panel + headlights", "Self-healing gloss film", "2 days in the studio"],
    bullets: [
      "Self-healing gloss TPU film, GT-certified",
      "Every painted exterior panel + headlights",
      "Health check at month 12",
      "2 days in the studio",
    ],
    daysInStudio: 2,
    wa: GT_WA.essential,
    cta: "Ask about Essential",
  },
  {
    key: "signature",
    name: "GT Signature",
    tagline: "Forget the film. It's covered for life.",
    fullBody: 12900,
    fullFront: null,
    warrantyLine: "GT Lifetime Warranty — as long as you own the car, film and labour, in writing",
    warrantyShort: "GT Lifetime Warranty",
    panelChip: "3 free panel replacements — any damage, any cause, ever",
    identity: "For the car you're keeping",
    usp: "The warranty that never expires — film AND labour, signed and numbered.",
    upgrade:
      "The warranty stops expiring. Labour is covered, not just film. 3 panels of damage are on us — a scrape, a trolley, any cause at all. And we wash and inspect it free, every year, forever.",
    highlights: [
      "Diamond Pro TPU film · door jambs and boot strip",
      "Edges wrapped out of sight",
      "Free wash + inspection, for life",
    ],
    bullets: [
      "Diamond Pro premium TPU film — self-healing, hydrophobic, manufacturer warranty registered to your car",
      "Every painted panel + headlights, door jambs and boot loading strip",
      "Edges wrapped out of sight — the film disappears into the panel gaps",
      "Wash + inspection at 6 and 12 months, then yearly — free, for as long as you own it",
      "3 days in the studio — we don't rush film",
    ],
    daysInStudio: 3,
    featured: true,
    wa: GT_WA.signature,
    cta: "WhatsApp about Signature",
  },
  {
    key: "concours",
    name: "GT Concours",
    tagline: "For the cars that deserve everything.",
    fullBody: 18900,
    fullFront: null,
    warrantyLine: "Everything in Signature, plus concours-level care",
    warrantyShort: "Everything in Signature, plus",
    panelChip: "6 free panel replacements — any damage, any cause",
    identity: "For the car that's a statement",
    usp: "Perfection, maintained for you — paint corrected first, ceramic refreshed free at every visit.",
    upgrade:
      "The film itself steps up — Diamond Pro X, the PCU flagship. Ceramic over everything, refreshed free at every visit. 6 panels covered, and we collect and deliver.",
    highlights: [
      "Diamond Pro X — the PCU flagship film",
      "Free ceramic refresh at every visit",
      "Collection, delivery and a full dossier",
    ],
    bullets: [
      "Diamond Pro X film — the PCU flagship, a harder chemistry than TPU, 15-year manufacturer registration",
      "Concours preparation — completely seamless, invisible finish",
      "Paint perfected before film; ceramic over film and every uncovered surface",
      "Every visit: inspection, wash + full ceramic refresh over the film — free, every time",
      "Full photo/video protection dossier of your exact car",
      "Priority booking, collection & delivery · 5 days in the studio",
    ],
    daysInStudio: 5,
    wa: GT_WA.concours,
    cta: "Enquire about Concours",
  },
];

/**
 * The comparison matrix. `true` renders a tick, `false` a dash, a string the
 * literal value. Grouped so the table reads as a spec sheet rather than a wall.
 * This is the canonical detail — the cards deliberately show only highlights.
 */
export interface GtCompareRow {
  feature: string;
  note?: string;
  essential: boolean | string;
  signature: boolean | string;
  concours: boolean | string;
}

export const GT_COMPARISON: { group: string; rows: GtCompareRow[] }[] = [
  {
    group: "The warranty",
    rows: [
      { feature: "Warranty term", essential: "5 years", signature: "Lifetime", concours: "Lifetime" },
      { feature: "Covers film and labour", essential: true, signature: true, concours: true },
      {
        feature: "Yellowing covered",
        note: "with no “manufacturing defect only” carve-out for UV and heat",
        essential: true,
        signature: true,
        concours: true,
      },
      {
        feature: "Manufacturer warranty registered to your car",
        essential: true,
        signature: true,
        concours: true,
      },
      {
        feature: "No-fault panel replacements",
        note: "any damage, any cause — a scrape, a trolley, a bad wash",
        essential: false,
        signature: "3",
        concours: "6",
      },
      { feature: "Signed, numbered certificate at handover", essential: true, signature: true, concours: true },
    ],
  },
  {
    group: "The install",
    rows: [
      { feature: "Every painted exterior panel + headlights", essential: true, signature: true, concours: true },
      { feature: "Door jambs and boot loading strip", essential: false, signature: true, concours: true },
      { feature: "Edges wrapped out of sight", essential: false, signature: true, concours: true },
      { feature: "Diamond Pro film — manufacturer warranty registered", essential: false, signature: true, concours: true },
      {
        feature: "Diamond Pro X — the PCU flagship film",
        note: "a harder chemistry than TPU, 15-year manufacturer registration",
        essential: false,
        signature: false,
        concours: true,
      },
      { feature: "Concours preparation — seamless, invisible finish", essential: false, signature: false, concours: true },
      { feature: "Ceramic over film and every uncovered surface", essential: false, signature: false, concours: true },
      { feature: "Days in the studio", essential: "2", signature: "3", concours: "5" },
    ],
  },
  {
    group: "After you drive away",
    rows: [
      {
        feature: "Wash + inspection visits",
        note: "6 and 12 months, then yearly — these keep lifetime cover active",
        essential: "Month 12 check",
        signature: "Free, for life",
        concours: "Free, for life",
      },
      { feature: "Full ceramic refresh at every visit", essential: false, signature: false, concours: true },
      { feature: "Photo / video protection dossier", essential: false, signature: false, concours: true },
      { feature: "Priority booking, collection & delivery", essential: false, signature: false, concours: true },
    ],
  },
];

export const GT_INSTALL_STANDARD =
  "Every car, every tier: the GT Install Standard — paint prepared to showroom standard, dust-controlled bay, precision-cut for your exact model, triple-checked before handover.";

export const GT_SIZE_NOTE =
  "One price, every car. A G-Class, a Patrol and a 911 pay the same as a sedan — no size surcharge, no exotic surcharge. All prices +VAT.";

export const GT_WARRANTY = {
  headline: "Covered for as long as you own it.",
  bullets: [
    "Film AND labour — a film brand warranties its film; the studio that fitted it warranties the fitting. Ours covers both, for a lifetime, in a signed document.",
    "Yellowing is covered, film and labour — with no \"manufacturing defect only\" carve-out for UV and heat.",
    "Underneath it: the film manufacturer's warranty, registered to your car. You get both.",
    "Scraped it in a car park? That's not a warranty claim — that's your free panel replacement.",
    "Free inspections at 6 and 12 months, then yearly — they keep your cover active and your car perfect.",
    "Selling the car? The cover transfers once, with the vehicle — so it's worth something on your listing, not just in your glovebox.",
  ],
  covenant:
    "Grand Touch warrants this installation — film and labour — against yellowing, cracking, peeling, bubbling and lifting, for as long as the registered owner keeps this vehicle, and transfers once with the vehicle to one subsequent owner.",
  covers: [
    {
      title: "Film + labour, for life",
      body: "Yellowing, cracking, peeling, bubbling, edge-lift and installation defects — fixed free, parts and labour, for as long as you own the car.",
    },
    {
      // Fact-checked 2026-08-05 against the STEK, XPEL, SunTek, 3M, LLumar and
      // Garware warranty documents. Deliberately worded as a positive claim
      // about GT's own cover with NO superlative about other shops: UAE Cabinet
      // Resolution 68/2024 Art. 33 prohibits claiming exclusivity and
      // disparaging competitors, and several Dubai shops (Polix, RMA, Approved,
      // Apex) already advertise yellowing coverage — so "nobody else does" is
      // both false and unlawful. "Often" is the supportable quantifier: STEK
      // excludes environmentally caused yellowing outright, Garware excludes
      // gradual climate degradation, and LLumar's EMEA entry tier carries no
      // discolouration cover at all.
      title: "Yellowing, without the asterisk",
      body: "Read a film-brand warranty closely and yellowing is often covered only when it is ruled a manufacturing defect — with UV and heat exposure carved out. In a Dubai summer that is the distinction that decides a claim. Ours has no such carve-out: yellowing is covered, film and labour.",
    },
    {
      title: "No-fault panel replacement",
      body: "A scrape? A trolley? A careless valet? Any cause at all — we replace that panel free. Three times on Signature, six on Concours.",
    },
    {
      title: "Free inspections, forever",
      body: "Wash + inspection at 6 and 12 months, then yearly. Twenty minutes that keep your cover active and your car perfect.",
    },
    {
      title: "Two warranties, one car",
      body: "We register the film manufacturer's warranty to your car as standard — then put ours on top. Ask any cheaper quote to show you either.",
    },
    {
      // Reversed 2026-08-11. Cover was previously non-transferable by design.
      // The objection it now answers is the only real hole in a lifetime
      // warranty: almost nobody keeps a car for life, so "for as long as you
      // own it" quietly expires at resale. One transfer closes that and turns
      // the warranty into a resale asset. Risk is bounded by carrying the
      // DEFECT cover only — unused panel credits and complimentary aftercare
      // stay with the original owner. See PpfWarrantyDubai clause 09.
      title: "Transfers once, with the car",
      body: "Sell the car and the lifetime cover goes with it — one transfer, to one subsequent owner, for the rest of its life (Signature and Concours; Essential's 5-year cover doesn't transfer). Registered at the studio in twenty minutes. The defect cover carries; unused panel credits and complimentary aftercare stay with the original owner.",
    },
  ],
};

export const GT_CERT_SAMPLE = {
  certNo: "GT-2026-0047",
  programme: "GT Signature",
  owner: "Khalid Al Mansoori",
  installDate: "14 August 2026",
  vehicle: "Mercedes-AMG G 63",
  vehicleMeta: "Obsidian Black · 2026",
  chassisMasked: "W1N ···· ···· 4471",
};

/**
 * The certified roster. Rendered as typographic wordmarks, not logo images —
 * brands are credentials here, never the headline (and mismatched logo PNGs
 * read cheap). Only brands GT actually installs. NOTE: no Avery Dennison.
 */
export const GT_FILMS = [
  {
    name: "Diamond Pro — Premium TPU",
    note: "The GT Signature film. Heat-activated self-healing, factory hydrophobic, manufacturer warranty registered to your car.",
  },
  {
    name: "Diamond Pro X — PCU Flagship",
    note: "The GT Concours film. Polycarbonate urethane — a harder chemistry than TPU, engineered for Gulf heat, humidity and UV, with a 15-year manufacturer registration.",
  },
  {
    name: "Gyeon",
    note: "Certified coatings — over the film and every uncovered surface.",
  },
];

/** The film ladder, spec by spec — shared by the films page and the warranty
 *  funnel. Verified claims only: the dE figure is Diamond Pro's published UV
 *  test, and 15 years is anchored to X ONLY. */
export const GT_FILM_LADDER: { label: string; tpu: string; x: string }[] = [
  {
    label: "Chemistry",
    tpu: "Premium thermoplastic polyurethane (TPU) — the material almost all quality PPF is made of",
    x: "Polycarbonate urethane (PCU) — a carbonate backbone in place of TPU's soft segment. A harder chemistry, built to survive heat, humidity and UV for decades",
  },
  {
    label: "Self-healing",
    tpu: "Heat-activated top coat — light swirls vanish in the Dubai sun",
    x: "Heat-activated top coat — light swirls vanish in the Dubai sun",
  },
  {
    label: "Hydrophobic",
    tpu: "Factory hydrophobic finish — water beads off, the car stays cleaner longer",
    x: "Factory hydrophobic finish — R9–R10 rated",
  },
  {
    label: "UV, tested",
    tpu: "Built to hold clarity in Gulf heat",
    x: "Colour shift under ΔE 1 after 1,000 hours of UV exposure — no measurable yellowing",
  },
  {
    label: "In writing",
    tpu: "Fading and colour change named in the manufacturer's warranty — and registered to your car",
    x: "Fading and colour change named in the manufacturer's warranty — registered to your car for 15 years",
  },
  {
    label: "Removal",
    tpu: "Removal-tested clean — no damage to original paint, no glue residue",
    x: "Removal-tested clean — no damage to original paint, no glue residue",
  },
];

export const GT_FILMS_LINE =
  "Most film in Dubai comes from the same handful of factories. Results differ because installs differ. We fit genuine film from our certified roster, register the manufacturer's warranty to your car — and back the whole job with ours.";

export interface GtFaqItem {
  q: string;
  a: string;
}

export const GT_FAQ: GtFaqItem[] = [
  {
    q: "How much does PPF cost in Dubai?",
    a: "At Grand Touch: full body AED 7,900 (Essential), 12,900 (Signature), 18,900 (Concours), +VAT. Full body only — we don't sell partial coverage. Same price whatever you drive — no SUV or exotic surcharge. Those are real prices, not bait.",
  },
  {
    q: "What film brands do you use?",
    a: "Diamond Pro, and we say it with pride: GT Signature runs their premium self-healing TPU, GT Concours steps up to Diamond Pro X — the PCU flagship, developed for the Middle East, with a 15-year manufacturer registration. Gyeon handles the coatings. The manufacturer's warranty is registered to your car as standard, and your GT warranty sits on top. The film brand warranties the plastic. We warranty the whole job, for life.",
  },
  {
    q: "What does the lifetime warranty actually cover?",
    a: "Yellowing, cracking, peeling, bubbling, edge-lift and installation defects — film and labour — for as long as you own the car, kept active by free yearly inspections. It also transfers once, with the car, when you sell it. The full terms are published, word for word.",
  },
  {
    q: "What happens to the warranty if I sell the car?",
    a: "On Signature and Concours, it goes with the car: the lifetime cover transfers once, to one subsequent owner, for the rest of its life — registered at our studio in about twenty minutes, within 30 days of the sale. That makes it a line on your listing: the buyer inherits a lifetime warranty on the paint protection. The defect cover transfers; any unused panel replacements and complimentary aftercare stay with you, because you bought them. Essential's 5-year cover doesn't transfer.",
  },
  {
    q: "Is yellowing really covered?",
    a: "Yes — film and labour. Read a film-brand warranty closely and yellowing is often covered only when it is ruled a manufacturing defect, with yellowing caused by UV or heat carved out. In a Dubai summer that is the distinction that decides a claim. Our warranty has no such carve-out: if the film on your car yellows, we replace that film and we pay the labour.",
  },
  {
    q: "What's a no-fault panel replacement?",
    a: "Any damage, any cause — a scrape, a trolley, a bad wash. We replace that panel's film free: three times on Signature, six times on Concours.",
  },
  {
    q: "Another shop quoted me 7,000 for full body. Why pay 12,900?",
    a: "That quote is real — for what it is: value film, tucked edges, a one-year workmanship warranty, often no registered manufacturer warranty at all. It's a different product. If price is the deciding factor, take it, genuinely. If the car matters, compare warranties before prices.",
  },
  {
    q: "What voids the warranty?",
    a: "Very little, and it's all published: skipping your free yearly inspection converts cover to the 5-year base term, and third-party rework on a panel ends cover for that panel. Impact damage isn't a defect — that's what your free no-fault panel replacement is for.",
  },
  {
    q: "How long does installation take?",
    a: "Essential 2 days, Signature 3, Concours 5. We don't rush film — the days in the bay are where the money goes.",
  },
  {
    q: "Do you charge more for an SUV or an exotic?",
    a: "No. One price, every car — a G-Class, a Patrol, a Range Rover or a 911 pays exactly what a sedan pays. Most shops in Dubai load 10–25% onto a big SUV; we don't, and the published price is the price.",
  },
];

export const GT_CANON = {
  notCheapest: "We're not the cheapest PPF studio in Dubai. On purpose.",
  askWorkmanship: "Ask any shop to show you their workmanship warranty. It's usually one year.",
  fifteenCars: "~15 cars a month. That's the point.",
  closingSub: "Send your car and your week — Sean will tell you honestly which program fits.",
};

export const GT_VIDEOS = {
  heroInstall:
    "https://res.cloudinary.com/diw6rekpm/video/upload/q_auto:eco,vc_auto,w_720,c_limit/v1775639271/0408_3_gjnsep.mp4",
  handovers: [
    {
      src: "https://res.cloudinary.com/diw6rekpm/video/upload/q_auto/v1781333287/911_MATTE_aaomcw.mp4",
      label: "Porsche 911 — stealth matte",
    },
    {
      src: "https://res.cloudinary.com/diw6rekpm/video/upload/q_auto/v1781333432/G7_BLUE_wlvxks.mp4",
      label: "Jetour G700",
    },
    {
      src: "https://res.cloudinary.com/diw6rekpm/video/upload/q_auto,f_auto/v1775562589/Mark_Zeekr_conzdp.mp4",
      label: "Mark's Zeekr — handover day",
    },
    {
      src: "https://res.cloudinary.com/diw6rekpm/video/upload/q_auto/v1781333953/Aston_Martin_Rapide_S_rstzr2.mp4",
      label: "Aston Martin Rapide S",
    },
  ],
  customerVoice:
    "https://res.cloudinary.com/diw6rekpm/video/upload/q_auto/v1781334893/customer_roqujv.mp4",
};

export const GT_IMAGES = {
  heroFallback: "/guided-cullinan-ppf.png",
  seanWith911: "/guided-sean-with-911.png",
  seanWithPatrols: "/guided-sean-with-patrols-v2.jpg",
  installDetail: "/guided-install-detail.png",
  cullinanPpf: "/guided-cullinan-ppf.png",
  gloss911: "/guided-911-gloss.png",
  rollsInstall: "/guided-rolls-install.png",
};

export const GT_PROCESS_STEPS = [
  {
    title: "Paint prepared to showroom standard",
    body: "Wash, decontamination and clay before any film touches the car — skip the prep and you seal the dirt in.",
    image: GT_IMAGES.installDetail,
  },
  {
    title: "Precision-cut for your exact model",
    body: "Patterns cut for your car, refined by hand where the pattern isn't good enough.",
    image: GT_IMAGES.rollsInstall,
  },
  {
    title: "Edges wrapped out of sight",
    body: "The film disappears into the panel gaps. Run your finger along the edge — that's the test.",
    image: GT_IMAGES.gloss911,
  },
  {
    title: "The delivery walkaround",
    body: "We walk YOU around every edge before you drive away — then sign and register your certificate.",
    image: GT_IMAGES.seanWith911,
  },
];
