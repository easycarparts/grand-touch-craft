import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import HomeV2Hero from "@/components/HomeV2Hero";
import HomeTrustStrip from "@/components/HomeTrustStrip";
import HomeCapabilityStrip from "@/components/HomeCapabilityStrip";
import HomePpfPillar from "@/components/HomePpfPillar";
import HomeHandovers from "@/components/HomeHandovers";
import HomeG700Teaser from "@/components/HomeG700Teaser";
import HomeV2OtherServices from "@/components/HomeV2OtherServices";
import HomeV2WorkshopShowcase from "@/components/HomeV2WorkshopShowcase";
import HomeFaq from "@/components/HomeFaq";
import HomeFinalCta from "@/components/HomeFinalCta";
import { homeFaqItems } from "@/lib/home-faq-items";
import { updatePageSEO, generateBusinessStructuredData } from "@/lib/seo";

const HOME_BUSINESS_SCHEMA_ATTR = "home-business";
const HOME_FAQ_SCHEMA_ATTR = "home-faq";

const Index = () => {
  useEffect(() => {
    updatePageSEO("home", {
      title: "Grand Touch Auto — Dubai's Luxury Automotive Studio & Garage",
      description:
        "Dubai's luxury automotive studio and garage. STEK-authorized PPF, colour wraps, paint & bodywork, ceramic coating, diagnostics, restoration and a live G700 customizer — all under one roof.",
      keywords:
        "luxury car garage Dubai, automotive studio Dubai, PPF Dubai, paint protection film Dubai, STEK PPF Dubai, XPEL PPF Dubai, full body PPF Dubai, matte PPF Dubai, colour PPF Dubai, G700 customizer, Jetour G700 Dubai, paint & bodywork Dubai, ceramic coating Dubai, car detailing Dubai, car restoration Dubai",
      ogTitle: "Grand Touch Auto — Dubai's Luxury Automotive Studio & Garage",
      ogDescription:
        "Paint protection film, colour wraps, paint, ceramic, diagnostics, restoration and a live G700 customizer — all under one Dubai roof.",
      url: "https://www.grandtouchauto.ae/",
    });

    const businessScript = document.createElement("script");
    businessScript.type = "application/ld+json";
    businessScript.setAttribute("data-page-schema", HOME_BUSINESS_SCHEMA_ATTR);
    businessScript.textContent = JSON.stringify(generateBusinessStructuredData());
    document.head.appendChild(businessScript);

    const faqScript = document.createElement("script");
    faqScript.type = "application/ld+json";
    faqScript.setAttribute("data-page-schema", HOME_FAQ_SCHEMA_ATTR);
    faqScript.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: homeFaqItems.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    });
    document.head.appendChild(faqScript);

    return () => {
      document
        .querySelectorAll(
          `script[data-page-schema="${HOME_BUSINESS_SCHEMA_ATTR}"], script[data-page-schema="${HOME_FAQ_SCHEMA_ATTR}"]`,
        )
        .forEach((node) => node.parentNode?.removeChild(node));
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#070707] pb-20 md:pb-0">
      <Navbar />
      <main>
        <HomeV2Hero />
        <HomeTrustStrip />
        <HomeCapabilityStrip />
        <HomeV2OtherServices />
        <HomePpfPillar />
        <HomeG700Teaser />
        <HomeHandovers />
        <HomeV2WorkshopShowcase />
        <HomeFaq />
        <HomeFinalCta />
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Index;
