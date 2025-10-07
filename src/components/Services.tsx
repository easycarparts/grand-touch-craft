import ServiceCard from "./ServiceCard";
import { Shield, Droplets, Palette, Sparkles, Scissors } from "lucide-react";
import ppfImage from "@/assets/service-ppf.jpg";
import wrapImage from "@/assets/service-wrap.jpg";
import ceramicImage from "@/assets/service-ceramic.jpg";
import correctionImage from "@/assets/service-correction.jpg";

const Services = () => {
  const services = [
    {
      title: "Paint Protection Film",
      description: "Invisible armor engineered for Dubai's roads — self-healing, UV-resistant, and built to last.",
      image: ppfImage,
      icon: <Shield className="w-6 h-6" />,
    },
    {
      title: "Ceramic Coating",
      description: "Advanced nano-ceramic technology that bonds to your paint, creating an ultra-durable hydrophobic shield.",
      image: ceramicImage,
      icon: <Droplets className="w-6 h-6" />,
    },
    {
      title: "Vinyl Wrapping",
      description: "Transform your car's personality with precision-cut vinyl wraps in gloss, satin, or stealth matte.",
      image: wrapImage,
      icon: <Palette className="w-6 h-6" />,
    },
    {
      title: "Paint Correction",
      description: "From micro-polish to mirror finish — every surface is restored to its original brilliance.",
      image: correctionImage,
      icon: <Sparkles className="w-6 h-6" />,
    },
  ];

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />

      <div className="container mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16 space-y-4 animate-fade-up">
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm">
            <Scissors className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Our Expertise</span>
          </div>
          <h2 className="text-foreground">
            The Art of Surface Science
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-light">
            Every curve. Every detail. Every reflection — perfected by Dubai's master craftsmen.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-up">
          {services.map((service, index) => (
            <div
              key={service.title}
              style={{ animationDelay: `${index * 100}ms` }}
              className="animate-fade-up"
            >
              <ServiceCard {...service} />
            </div>
          ))}
        </div>

        {/* Additional Services CTA */}
        <div className="text-center mt-16">
          <p className="text-muted-foreground mb-4">
            Plus: Interior Detailing • Window Tinting • Paint Repair • Windscreen Protection
          </p>
        </div>
      </div>
    </section>
  );
};

export default Services;
