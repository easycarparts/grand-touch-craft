import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import WorkshopShowcase from "@/components/WorkshopShowcase";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import MobileBottomBar from "@/components/MobileBottomBar";
import { updatePageSEO, generateBusinessStructuredData } from "@/lib/seo";

const Index = () => {
  // Update SEO metadata for home page
  useEffect(() => {
    updatePageSEO('home');
    
    // Add business structured data
    const structuredData = generateBusinessStructuredData();
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);
    
    return () => {
      // Clean up structured data script on unmount
      const existingScript = document.querySelector('script[type="application/ld+json"]');
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, []);

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <Navbar />
      <main>
        <Hero />
        <Services />
        <WorkshopShowcase />
      </main>
      <Footer />
      <WhatsAppButton />
      <MobileBottomBar />
    </div>
  );
};

export default Index;
