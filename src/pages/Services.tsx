import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Droplets, Palette, Sparkles, Wrench, Sun, Package } from "lucide-react";

const Services = () => {
  const serviceDetails = [
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Paint Protection Film (PPF)",
      description: "Premium self-healing film that shields your vehicle from rock chips, scratches, and environmental damage.",
      features: [
        "Full-body or partial coverage",
        "Self-healing technology",
        "UV protection",
        "10-year warranty",
        "Maintains resale value",
      ],
    },
    {
      icon: <Droplets className="w-8 h-8" />,
      title: "Ceramic Coating",
      description: "Nano-ceramic protection creating a permanent bond with your paint for superior gloss and durability.",
      features: [
        "9H hardness protection",
        "Hydrophobic properties",
        "Chemical resistance",
        "Enhanced depth & gloss",
        "5-year protection",
      ],
    },
    {
      icon: <Palette className="w-8 h-8" />,
      title: "Vinyl Wrapping",
      description: "Complete color change or custom designs with premium 3M and Avery Dennison vinyl films.",
      features: [
        "Full or partial wraps",
        "Matte, Gloss, Satin finishes",
        "Chrome & specialty finishes",
        "Paint protection",
        "Reversible process",
      ],
    },
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: "Paint Correction",
      description: "Multi-stage polishing to remove swirls, scratches, and oxidation for a flawless mirror finish.",
      features: [
        "Swirl mark removal",
        "Scratch elimination",
        "Oxidation treatment",
        "Haze removal",
        "Mirror-like clarity",
      ],
    },
    {
      icon: <Wrench className="w-8 h-8" />,
      title: "Body & Paint Repair",
      description: "Expert collision repair, dent removal, and refinishing to factory specifications.",
      features: [
        "Paintless dent repair",
        "Panel replacement",
        "Color matching",
        "Bumper restoration",
        "Factory-quality finish",
      ],
    },
    {
      icon: <Sun className="w-8 h-8" />,
      title: "Window Tinting",
      description: "Premium ceramic tint films providing heat rejection, UV protection, and enhanced privacy.",
      features: [
        "Ceramic & carbon films",
        "99% UV rejection",
        "Heat reduction",
        "Enhanced privacy",
        "Lifetime warranty",
      ],
    },
  ];

  return (
    <div className="min-h-screen">
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
                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                  Request Quote
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Services;
