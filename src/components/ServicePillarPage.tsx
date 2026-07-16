import { useEffect, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, Phone, CheckCircle2, ArrowRight } from "lucide-react";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { Button } from "@/components/ui/button";
import { updatePageSEO } from "@/lib/seo";
import {
  BUSINESS,
  EASY_AUTO,
  getFaqPageJsonLd,
  getServiceJsonLd,
  injectJsonLd,
  removeJsonLd,
} from "@/lib/business";

export type ServicePillarFaq = { question: string; answer: string };
export type PackageRow = { name: string; coverage: string; fromPrice: string; bestFor: string };
export type RelatedService = { to: string; label: string; blurb: string };

export type ServicePillarProps = {
  path: string;
  title: string;
  description: string;
  keywords: string;
  ogTitle: string;
  ogDescription: string;
  image: string;
  h1: string;
  intro: string;
  serviceSchema: { name: string; serviceType: string; description: string };
  heroAlt: string;
  sections: { h2: string; body: ReactNode }[];
  packages: PackageRow[];
  packageNote?: string;
  faqs: ServicePillarFaq[];
  relatedServices: RelatedService[];
  easyAutoLinks: { href: string; anchor: string }[];
  whatsappText: string;
  ctaLabel?: string;
};

const ServicePillarPage = ({
  path,
  title,
  description,
  keywords,
  ogTitle,
  ogDescription,
  image,
  h1,
  intro,
  serviceSchema,
  heroAlt,
  sections,
  packages,
  packageNote,
  faqs,
  relatedServices,
  easyAutoLinks,
  whatsappText,
  ctaLabel = "WhatsApp Sean for a quote",
}: ServicePillarProps) => {
  const pageUrl = `${BUSINESS.url}${path}`;
  const whatsappUrl = `${BUSINESS.whatsappDetailing}?text=${encodeURIComponent(whatsappText)}`;

  useEffect(() => {
    updatePageSEO("services", {
      title,
      description,
      keywords,
      ogTitle,
      ogDescription,
      url: pageUrl,
      image,
    });

    injectJsonLd(
      "service-pillar-service",
      getServiceJsonLd({ ...serviceSchema, url: pageUrl }),
    );
    injectJsonLd("service-pillar-faq", getFaqPageJsonLd(faqs));

    return () =>
      removeJsonLd("service-pillar-service", "service-pillar-faq");
  }, [
    title,
    description,
    keywords,
    ogTitle,
    ogDescription,
    pageUrl,
    image,
    serviceSchema,
    faqs,
  ]);

  return (
    <div className="min-h-screen bg-[#070707] pb-20 text-white md:pb-0">
      <Navbar />

      <main className="pt-28">
        <section className="relative overflow-hidden border-b border-white/10">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-35"
            style={{ backgroundImage: `url(${image})` }}
            role="img"
            aria-label={heroAlt}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070707] via-[#070707]/85 to-[#070707]/40" />
          <div className="container relative mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
            <p className="mb-3 text-sm font-medium tracking-wide text-[#f7b52b]">
              {BUSINESS.brandName} · {BUSINESS.alternateName}
            </p>
            <h1 className="text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
              {h1}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">
              {intro}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild className="bg-[#f7b52b] text-black hover:bg-[#f7b52b]/90">
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  {ctaLabel}
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-white/30 bg-transparent text-white hover:bg-white/10"
              >
                <a href={`tel:${BUSINESS.phonePrimary}`}>
                  <Phone className="mr-2 h-4 w-4" />
                  {BUSINESS.phonePrimaryDisplay}
                </a>
              </Button>
            </div>
          </div>
        </section>

        <article className="container mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
          {sections.map((section) => (
            <section key={section.h2} className="mb-12">
              <h2 className="mb-4 text-2xl font-semibold text-white sm:text-3xl">
                {section.h2}
              </h2>
              <div className="space-y-4 text-base leading-relaxed text-white/75">
                {section.body}
              </div>
            </section>
          ))}

          <section className="mb-12">
            <h2 className="mb-4 text-2xl font-semibold sm:text-3xl">
              Packages and pricing comparison
            </h2>
            {packageNote ? (
              <p className="mb-4 text-sm text-white/60">{packageNote}</p>
            ) : null}
            <div className="overflow-x-auto rounded-lg border border-white/10">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="bg-white/5 text-white/90">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Package</th>
                    <th className="px-4 py-3 font-semibold">Coverage</th>
                    <th className="px-4 py-3 font-semibold">From (AED)</th>
                    <th className="px-4 py-3 font-semibold">Best for</th>
                  </tr>
                </thead>
                <tbody>
                  {packages.map((row) => (
                    <tr key={row.name} className="border-t border-white/10">
                      <td className="px-4 py-3 font-medium text-white">{row.name}</td>
                      <td className="px-4 py-3 text-white/70">{row.coverage}</td>
                      <td className="px-4 py-3 text-[#f7b52b]">{row.fromPrice}</td>
                      <td className="px-4 py-3 text-white/70">{row.bestFor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-white/45">
              Prices exclude 5% VAT. Final quote confirmed after vehicle inspection.
            </p>
          </section>

          {easyAutoLinks.length > 0 ? (
            <section className="mb-12 rounded-lg border border-white/10 bg-white/[0.03] p-6">
              <h2 className="mb-3 text-xl font-semibold">Independent UAE guides</h2>
              <p className="mb-4 text-sm text-white/65">
                Grand Touch is an Easy Auto certified partner. For wider market
                context before you book, these guides are useful reading:
              </p>
              <ul className="space-y-2">
                {easyAutoLinks.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-[#f7b52b] underline-offset-4 hover:underline"
                    >
                      {link.anchor}
                      <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="mb-12">
            <h2 className="mb-6 text-2xl font-semibold sm:text-3xl">
              Frequently asked questions
            </h2>
            <div className="space-y-6">
              {faqs.map((faq) => (
                <div key={faq.question}>
                  <h3 className="mb-2 text-lg font-medium text-white">
                    {faq.question}
                  </h3>
                  <p className="text-white/70">{faq.answer}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-12">
            <h2 className="mb-4 text-2xl font-semibold">Related services</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {relatedServices.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="rounded-lg border border-white/10 bg-white/[0.03] p-5 transition hover:border-[#f7b52b]/40"
                >
                  <p className="font-semibold text-white">{item.label}</p>
                  <p className="mt-2 text-sm text-white/60">{item.blurb}</p>
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-[#f7b52b]/30 bg-[#f7b52b]/10 p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-white">Ready to book?</h2>
            <p className="mt-2 text-white/75">
              Visit us at {BUSINESS.addressFull}. Open{" "}
              {BUSINESS.openingHoursDisplay.days},{" "}
              {BUSINESS.openingHoursDisplay.hours}.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-white/70">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#f7b52b]" />
                STEK-certified PPF and GYEON detailing processes
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#f7b52b]" />
                Easy Auto certified partner —{" "}
                <a
                  href={EASY_AUTO.profile}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#f7b52b] underline-offset-2 hover:underline"
                >
                  view our Easy Auto profile
                </a>
              </li>
            </ul>
            <Button asChild className="mt-6 bg-[#f7b52b] text-black hover:bg-[#f7b52b]/90">
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="mr-2 h-4 w-4" />
                {ctaLabel}
              </a>
            </Button>
          </section>
        </article>
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default ServicePillarPage;
