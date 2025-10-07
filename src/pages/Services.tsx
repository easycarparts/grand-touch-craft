import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import MobileBottomBar from "@/components/MobileBottomBar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import BookServiceDialog from "@/components/BookServiceDialog";
import { Shield, Droplets, Palette, Sparkles, Wrench, Sun, Package, Zap, MessageCircle } from "lucide-react";

const Services = () => {
  const serviceDetails = [
    {
      icon: <Wrench className="w-8 h-8" />,
      title: "Auto Repair & Diagnostics",
      description: "Advanced ECU diagnostics and full mechanical service for luxury and performance vehicles.",
      features: [
        "Advanced ECU diagnostics",
        "Engine & transmission service",
        "Brake system maintenance",
        "Suspension & steering",
        "Electrical system repair",
      ],
    },
    {
      icon: <Palette className="w-8 h-8" />,
      title: "Paint & Bodywork",
      description: "Factory-grade refinishing, color matching, and full body restorations in dust-controlled booth.",
      features: [
        "Factory-grade paint booth",
        "Perfect color matching",
        "Collision repair",
        "Panel replacement",
        "OEM-quality finish",
      ],
    },
    {
      icon: <Droplets className="w-8 h-8" />,
      title: "Detailing & Ceramic Coating",
      description: "Multi-stage detailing and nano-ceramic protection for superior gloss and durability.",
      features: [
        "Paint correction",
        "9H ceramic coating",
        "Interior detailing",
        "Engine bay detailing",
        "5-year protection",
      ],
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "PPF & Vinyl Wrapping",
      description: "Premium XPEL/STEK/3M films and custom vinyl wraps for protection and transformation.",
      features: [
        "Self-healing PPF",
        "Full-body wraps",
        "Custom designs",
        "Matte/Gloss finishes",
        "10-year warranty",
      ],
    },
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: "Restoration & Customization",
      description: "Bringing classics and exotics back to life with full teardown, rebuild, and modernization.",
      features: [
        "Classic car restoration",
        "Full vehicle rebuild",
        "Custom modifications",
        "Suspension upgrades",
        "Performance tuning",
      ],
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Off-Road & Performance",
      description: "Suspension tuning, lift kits, and armor installs for 4x4s and high-performance builds.",
      features: [
        "Lift kit installation",
        "Suspension tuning",
        "Armor & protection",
        "Performance exhaust",
        "ECU remapping",
      ],
    },
  ];

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        
        <div className="container mx-auto relative z-10 text-center">
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm mb-6">
            <Package className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Premium Services</span>
          </div>
          <h1 className="mb-6">Our Services</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Comprehensive automotive care tailored for Dubai's most discerning vehicle owners
          </p>
          <div className="mt-8 flex justify-center">
            <BookServiceDialog>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-glow">
                <MessageCircle className="w-5 h-5 mr-2" />
                Get in touch
              </Button>
            </BookServiceDialog>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {serviceDetails.map((service, index) => (
              <Card
                key={service.title}
                className="p-8 bg-card border-border/50 hover:border-primary/50 transition-all duration-300 group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                  {service.icon}
                </div>
                <h3 className="text-2xl font-bold mb-4 text-foreground group-hover:text-primary transition-colors">
                  {service.title}
                </h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  {service.description}
                </p>
                <ul className="space-y-2 mb-6">
                  {service.features.map((feature) => (
                    <li key={feature} className="flex items-center text-sm text-muted-foreground">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mr-3" />
                      {feature}
                    </li>
                  ))}
                </ul>
                {/* Per-card CTA removed in favor of global CTAs */}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto text-center">
          <div className="inline-flex items-center justify-center">
            <BookServiceDialog>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-glow">
                <MessageCircle className="w-5 h-5 mr-2" />
                Get in touch
              </Button>
            </BookServiceDialog>
          </div>
        </div>
      </section>

      <Footer />
      <WhatsAppButton />
      <MobileBottomBar />
    </div>
  );
};

export default Services;
