import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { Award, Users, Shield, Sparkles } from "lucide-react";
import { updatePageSEO, generateBusinessStructuredData } from "@/lib/seo";

const About = () => {
  // Update SEO metadata for about page
  useEffect(() => {
    updatePageSEO('about');
    
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
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        
        <div className="container mx-auto relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Our Story</span>
            </div>
            <h1 className="text-foreground">Where Craftsmanship Meets Innovation</h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Grand Touch Auto was born from a passion for automotive excellence and a commitment 
              to delivering world-class service to Dubai's most prestigious vehicles.
            </p>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl">
          <div className="prose prose-invert max-w-none">
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              At Grand Touch Auto, we combine engineering expertise with artisan craftsmanship.
              From diagnostics to detailing, every vehicle receives meticulous care using factory-grade 
              tools, OEM materials, and certified techniques.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              Our team services brands such as Mercedes-AMG, Porsche, BMW M, Range Rover, and McLaren, 
              ensuring every job meets the standards of excellence our clients expect. We work exclusively 
              with industry-leading partners like XPEL, 3M, Avery Dennison, and Gtechniq.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Whether it's advanced diagnostics, factory-grade paintwork, or precision detailing — 
              every vehicle that enters our facility is treated as a masterpiece, deserving of 
              meticulous care and attention to detail that only true craftsmen can provide.
            </p>
          </div>
        </div>
      </section>

      {/* Values Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-card/30">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Award className="w-8 h-8" />,
                title: "Excellence",
                description: "Uncompromising quality in every detail of our work.",
              },
              {
                icon: <Users className="w-8 h-8" />,
                title: "Expertise",
                description: "Certified technicians with specialized training.",
              },
              {
                icon: <Shield className="w-8 h-8" />,
                title: "Trust",
                description: "Transparent pricing and honest recommendations.",
              },
              {
                icon: <Sparkles className="w-8 h-8" />,
                title: "Innovation",
                description: "Latest techniques and premium materials.",
              },
            ].map((value) => (
              <div key={value.title} className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto">
                  {value.icon}
                </div>
                <h3 className="text-xl font-bold text-foreground">{value.title}</h3>
                <p className="text-muted-foreground">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="mb-8 text-foreground">Certified Partners</h2>
          <p className="text-lg text-muted-foreground mb-12">
            Authorized installers for the world's leading automotive protection brands
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 text-muted-foreground">
            <div className="text-2xl font-bold">XPEL</div>
            <div className="text-2xl font-bold">3M</div>
            <div className="text-2xl font-bold">Avery Dennison</div>
            <div className="text-2xl font-bold">Gtechniq</div>
            <div className="text-2xl font-bold">Ceramic Pro</div>
          </div>
        </div>
      </section>

      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default About;
