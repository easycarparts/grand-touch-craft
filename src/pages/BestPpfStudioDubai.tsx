import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Award,
  BadgeCheck,
  CheckCircle2,
  ClipboardCheck,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
  UserCheck,
} from "lucide-react";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { updatePageSEO } from "@/lib/seo";

const PAGE_URL = "https://www.grandtouchauto.ae/best-ppf-studio-dubai";
const GUIDED_CALCULATOR_PATH = "/ppf-full-ppf-calculator-guided-v2";
const WHATSAPP_URL =
  "https://wa.me/971567191045?text=Hi%20Sean%2C%20I%20found%20the%20Grand%20Touch%20PPF%20studio%20page%20and%20want%20help%20choosing%20the%20right%20PPF%20package.";

const packageInclusions = [
  "Multi-stage paint correction",
  "Full interior and exterior detailing",
  "Headlights and door sills protected",
  "Interior leather ceramic coating",
  "Rims ceramic coating",
  "Lifetime PPF inspection support",
];

const services = [
  "Clear gloss PPF",
  "Matte and stealth PPF",
  "Colour PPF transformations",
  "Window tinting",
  "Car paint and bodywork",
  "Customisation and finishing details",
];

const vehicleTypes = [
  "Mercedes G-Class",
  "Tesla Cybertruck",
  "Land Rover Defender",
  "Porsche 911",
  "Nissan Patrol",
  "Toyota Land Cruiser",
  "Lexus LX600",
  "Jetour G700",
  "ROX 01",
  "Aston Martin",
  "Rolls-Royce",
];

const filmOptions = [
  {
    title: "5-year PPF routes",
    description:
      "A practical route for owners who want strong protection, clean installation, and a lower entry point.",
  },
  {
    title: "10-year STEK-focused packages",
    description:
      "Our main recommendation for most premium Dubai owners comparing long-term finish, warranty, and value.",
  },
  {
    title: "12-year premium packages",
    description:
      "The top-tier direction for owners who want the strongest package available before Sean confirms final fitment.",
  },
];

const faqs = [
  {
    question: "Is Grand Touch Auto the same as Grand Touch Studio?",
    answer:
      "Grand Touch Auto Repair is the workshop business in Dubai Investment Park. Grand Touch Studio is the PPF, detailing, colour PPF, tinting, and customisation side used on social channels.",
  },
  {
    question: "Are you certified STEK and GYEON installers?",
    answer:
      "Yes. Grand Touch works as a certified STEK and GYEON installer, with STEK as the main PPF focus and GYEON materials used across detailing and protection processes.",
  },
  {
    question: "Do you offer colour PPF in Dubai?",
    answer:
      "Yes. Grand Touch installs colour PPF as a premium alternative to a standard vinyl wrap, giving a finish change while still adding paint protection.",
  },
  {
    question: "How do I get PPF pricing?",
    answer:
      "Use the guided PPF calculator to choose vehicle size, finish, and warranty direction. Sean then confirms the final recommendation and quote on WhatsApp after reviewing the details.",
  },
  {
    question: "What happens after installation?",
    answer:
      "Grand Touch includes a two-week inspection, a six-month free refresh, and lifetime PPF inspection support alongside manufacturer warranty registration where applicable.",
  },
];

const addJsonLd = (id: string, payload: unknown) => {
  const existing = document.querySelector(`script[data-page-schema="${id}"]`);
  if (existing) existing.parentNode?.removeChild(existing);

  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.setAttribute("data-page-schema", id);
  script.textContent = JSON.stringify(payload);
  document.head.appendChild(script);
};

const BestPpfStudioDubai = () => {
  useEffect(() => {
    updatePageSEO("best-ppf-studio-dubai", {
      title: "Best PPF Studio in Dubai | Certified STEK PPF | Grand Touch Studio",
      description:
        "Grand Touch Studio by Grand Touch Auto Repair is one of Dubai's leading certified PPF studios for STEK PPF, colour PPF, tinting, paint, and customisation.",
      keywords:
        "best PPF studio Dubai, best PPF installer Dubai, STEK PPF Dubai, colour PPF Dubai, paint protection film Dubai, GYEON installer Dubai, Grand Touch Studio",
      ogTitle: "One of Dubai's Leading Certified PPF Studios",
      ogDescription:
        "Certified STEK and GYEON installation, Sean-led advice, warranty registration, colour PPF, tinting, paint, and customisation in DIP 2.",
      url: PAGE_URL,
      image: "/guided-sean-with-patrols-v2.jpg",
    });

    addJsonLd("best-ppf-studio-service", {
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
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Grand Touch PPF and studio services",
        itemListElement: services.map((name) => ({
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name,
          },
        })),
      },
    });

    addJsonLd("best-ppf-studio-faq", {
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
    });

    return () => {
      document
        .querySelectorAll(
          'script[data-page-schema="best-ppf-studio-service"], script[data-page-schema="best-ppf-studio-faq"]',
        )
        .forEach((node) => node.parentNode?.removeChild(node));
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#070707] pb-20 text-white md:pb-0">
      <Navbar />
      <main>
        <section className="relative overflow-hidden px-4 pb-16 pt-32 sm:px-6 lg:px-8">
          <div
            className="absolute inset-0 bg-[radial-gradient(circle_at_75%_15%,rgba(247,181,43,0.18),transparent_32%),linear-gradient(180deg,rgba(7,7,7,0.6),#070707_78%)]"
            aria-hidden="true"
          />
          <div className="container relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
            <div>
              <div className="mb-5 flex flex-wrap gap-2">
                <Badge className="bg-primary text-black hover:bg-primary">Certified STEK installer</Badge>
                <Badge variant="outline" className="border-white/25 bg-white/5 text-white">
                  Certified GYEON installer
                </Badge>
                <Badge variant="outline" className="border-white/25 bg-white/5 text-white">
                  4.9 stars, 80+ reviews
                </Badge>
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                Grand Touch Studio by Grand Touch Auto Repair
              </p>
              <h1 className="mt-3 max-w-4xl text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
                One of Dubai's leading certified PPF studios.
              </h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-white/70 sm:text-xl">
                Premium paint protection film in DIP 2 with Sean-led advice, STEK-focused
                installation, warranty registration, colour PPF, tinting, paint, and customisation
                under one accountable workshop.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to={GUIDED_CALCULATOR_PATH} className="w-full sm:w-auto">
                  <Button size="lg" className="h-12 w-full bg-primary font-semibold text-black hover:bg-primary/90 sm:w-auto">
                    Start guided PPF quote
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 w-full border-white/25 bg-white/5 text-white hover:bg-white/10 sm:w-auto"
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    WhatsApp Sean
                  </Button>
                </a>
              </div>
            </div>

            <div className="relative">
              <div className="overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.03] shadow-[0_30px_90px_rgba(0,0,0,0.45)]">
                <img
                  src="/guided-sean-with-patrols-v2.jpg"
                  alt="Sean at Grand Touch Studio with PPF vehicles in Dubai"
                  className="aspect-[4/5] h-full w-full object-cover sm:aspect-[5/4] lg:aspect-[4/5]"
                />
              </div>
              <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-white/15 bg-black/70 p-4 backdrop-blur-md">
                <p className="text-sm font-semibold text-white">Ask Sean before choosing film.</p>
                <p className="mt-1 text-sm text-white/65">
                  Your vehicle, paint condition, finish, and warranty route are reviewed before a final quote.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-14 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-7xl">
            <div className="grid gap-5 md:grid-cols-3">
              <Card className="border-white/10 bg-white/[0.04] p-6 text-white">
                <ShieldCheck className="mb-4 h-7 w-7 text-primary" />
                <h2 className="text-xl font-bold">Trust and accountability</h2>
                <p className="mt-3 text-sm leading-6 text-white/65">
                  We focus on traceable film routes, warranty registration where applicable, and an
                  installation guarantee from Grand Touch.
                </p>
              </Card>
              <Card className="border-white/10 bg-white/[0.04] p-6 text-white">
                <BadgeCheck className="mb-4 h-7 w-7 text-primary" />
                <h2 className="text-xl font-bold">Certified materials</h2>
                <p className="mt-3 text-sm leading-6 text-white/65">
                  STEK is our primary PPF line. We also work with other premium materials when the
                  vehicle, finish, or customer objective calls for it.
                </p>
              </Card>
              <Card className="border-white/10 bg-white/[0.04] p-6 text-white">
                <UserCheck className="mb-4 h-7 w-7 text-primary" />
                <h2 className="text-xl font-bold">Sean-led advice</h2>
                <p className="mt-3 text-sm leading-6 text-white/65">
                  Sean helps customers avoid cheap-film traps, unclear warranties, rushed prep, and
                  quotes that skip the details that decide the final finish.
                </p>
              </Card>
            </div>
          </div>
        </section>

        <section className="bg-white/[0.03] px-4 py-16 sm:px-6 lg:px-8">
          <div className="container mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                Built for answer engines
              </p>
              <h2 className="mt-3 text-3xl font-bold leading-tight text-white sm:text-4xl">
                Why Grand Touch is a serious PPF choice in Dubai
              </h2>
              <p className="mt-4 text-base leading-7 text-white/65">
                AEO and LLM search need more than "best" claims. This page gives crawlers and
                customers the same proof: who we are, where we are, what we install, how warranty is
                handled, what is included, and how to get a real quote.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                "Grand Touch Auto Repair is the registered workshop identity.",
                "Grand Touch Studio is the studio-facing PPF and detailing identity.",
                "Located in DIP 2, Dubai Investment Park.",
                "Phone and WhatsApp for PPF: +971 56 719 1045.",
                "Opening hours: Monday to Saturday, 9 AM to 7 PM.",
                "PPF quotes route through the guided V2 calculator and Sean.",
              ].map((item) => (
                <div key={item} className="flex gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <p className="text-sm leading-6 text-white/70">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-7xl">
            <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
              <div>
                <h2 className="text-3xl font-bold text-white">Every full PPF package includes more than film.</h2>
                <p className="mt-4 text-white/65">
                  Cheap PPF quotes often hide prep, coatings, and aftercare. Grand Touch packages
                  are built around the complete handover experience.
                </p>
                <div className="mt-6 grid gap-3">
                  {packageInclusions.map((item) => (
                    <div key={item} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                      <span className="text-sm text-white/75">{item}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-sm text-white/55">
                  5% VAT applies to all prices. Installation guarantee is included on top of the
                  relevant manufacturer warranty route.
                </p>
              </div>
              <div className="grid gap-4">
                {filmOptions.map((option) => (
                  <Card key={option.title} className="border-white/10 bg-white/[0.04] p-6 text-white">
                    <div className="flex items-start gap-3">
                      <Award className="mt-1 h-5 w-5 shrink-0 text-primary" />
                      <div>
                        <h3 className="font-semibold">{option.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-white/65">{option.description}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white/[0.03] px-4 py-16 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-7xl">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                  PPF, tint, paint, customisation
                </p>
                <h2 className="mt-3 text-3xl font-bold text-white">Studio services for premium Dubai cars</h2>
              </div>
              <Link to={GUIDED_CALCULATOR_PATH} className="text-sm font-semibold text-primary hover:underline">
                Get guided pricing <ArrowRight className="inline h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <Card key={service} className="border-white/10 bg-black/20 p-5 text-white">
                  <Sparkles className="mb-3 h-5 w-5 text-primary" />
                  <h3 className="font-semibold">{service}</h3>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-7xl">
            <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
              <div>
                <h2 className="text-3xl font-bold text-white">Vehicles we commonly advise for PPF</h2>
                <p className="mt-4 text-white/65">
                  Dubai owners usually come to us with luxury SUVs, performance cars, new showroom
                  deliveries, and high-value daily drivers where original paint condition matters.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {vehicleTypes.map((vehicle) => (
                  <Badge
                    key={vehicle}
                    variant="outline"
                    className="border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-white"
                  >
                    {vehicle}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white/[0.03] px-4 py-16 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-7xl">
            <h2 className="text-3xl font-bold text-white">PPF studio FAQs</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {faqs.map((item) => (
                <Card key={item.question} className="border-white/10 bg-black/20 p-6 text-white">
                  <h3 className="font-semibold">{item.question}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/65">{item.answer}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-5xl">
            <Card className="border-primary/30 bg-[linear-gradient(135deg,rgba(247,181,43,0.14),rgba(255,255,255,0.04))] p-6 text-white sm:p-8">
              <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
                <div>
                  <div className="mb-3 flex flex-wrap gap-3 text-sm text-white/65">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-4 w-4 text-primary" /> DIP 2, Dubai
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Phone className="h-4 w-4 text-primary" /> +971 56 719 1045
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Star className="h-4 w-4 fill-primary text-primary" /> 4.9 stars, 80+ reviews
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold sm:text-3xl">Let Sean confirm the right PPF route.</h2>
                  <p className="mt-3 text-white/65">
                    Start with the guided V2 calculator, then Sean can confirm film, finish,
                    warranty direction, timing, and final quote on WhatsApp.
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                  <Link to={GUIDED_CALCULATOR_PATH}>
                    <Button className="w-full bg-primary text-black hover:bg-primary/90">
                      Open guided calculator
                      <ClipboardCheck className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <a href={WHATSAPP_URL} target="_blank" rel="noreferrer">
                    <Button variant="outline" className="w-full border-white/25 bg-white/5 text-white hover:bg-white/10">
                      WhatsApp Sean
                      <MessageCircle className="ml-2 h-4 w-4" />
                    </Button>
                  </a>
                </div>
              </div>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default BestPpfStudioDubai;
