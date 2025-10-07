import ServiceCard from "./ServiceCard";
import { Shield, Droplets, Palette, Sparkles, Wrench, Zap } from "lucide-react";
import repairImage from "@/assets/service-repair.jpg";
import paintImage from "@/assets/service-paint.jpg";
import ceramicImage from "@/assets/service-ceramic.jpg";
import ppfImage from "@/assets/service-ppf.jpg";
import restorationImage from "@/assets/service-restoration.jpg";
import performanceImage from "@/assets/service-performance.jpg";

const Services = () => {
  const services = [
    {
      title: "Auto Repair & Diagnostics",
      description: "Advanced ECU diagnostics to full mechanical service and maintenance for luxury vehicles.",
      image: repairImage,
      icon: <Wrench className="w-6 h-6" />,
    },
    {
      title: "Paint & Bodywork",
      description: "Factory-grade refinishing, color matching, and full restorations in a dust-controlled booth.",
      image: paintImage,
      icon: <Palette className="w-6 h-6" />,
    },
    {
      title: "Detailing & Ceramic Coating",
      description: "Multi-stage detailing, correction, and ceramic protection for flawless gloss.",
      image: ceramicImage,
      icon: <Droplets className="w-6 h-6" />,
    },
    {
      title: "PPF & Vinyl Wrapping",
      description: "XPEL / STEK / 3M-grade films, full-body wraps, and custom designs.",
      image: ppfImage,
      icon: <Shield className="w-6 h-6" />,
    },
    {
      title: "Restoration & Customization",
      description: "Bringing classics and exotics back to life — full teardown, rebuild, or modernization.",
      image: restorationImage,
      icon: <Sparkles className="w-6 h-6" />,
    },
    {
      title: "Off-Road & Performance",
      description: "Suspension tuning, lift kits, and armor installs for 4x4s and high-performance builds.",
      image: performanceImage,
      icon: <Zap className="w-6 h-6" />,
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
            <Wrench className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Full-Service Excellence</span>
          </div>
          <h2 className="text-foreground">
            Comprehensive Automotive Care
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-light">
            From diagnostics to detailing — precision engineering meets artisan craftsmanship.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-up">
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
      </div>
    </section>
  );
};

export default Services;
