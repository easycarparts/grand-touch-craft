import { Card } from "@/components/ui/card";
import { Wrench } from "lucide-react";

const WorkshopShowcase = () => {
  const showcaseItems = [
    {
      title: "Precision Paint Booth",
      caption: "Factory-grade dust-controlled environment",
      image: "linear-gradient(135deg, hsl(0 0% 15%), hsl(0 0% 8%))",
    },
    {
      title: "Diagnostic Center",
      caption: "Advanced ECU & system analysis",
      image: "linear-gradient(135deg, hsl(0 0% 12%), hsl(0 0% 6%))",
    },
    {
      title: "PPF Installation Bay",
      caption: "Temperature-controlled precision application",
      image: "linear-gradient(135deg, hsl(0 0% 14%), hsl(0 0% 7%))",
    },
    {
      title: "Professional Tooling",
      caption: "OEM-grade equipment & technology",
      image: "linear-gradient(135deg, hsl(0 0% 13%), hsl(0 0% 5%))",
    },
  ];

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/30 to-background" />
      
      {/* Metallic Divider */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <div className="container mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm">
            <Wrench className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Behind the Scenes</span>
          </div>
          <h2 className="text-foreground">Inside the Workshop</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-light">
            Precision. Craftsmanship. Control.
          </p>
        </div>

        {/* Horizontal Scrolling Gallery */}
        <div className="flex overflow-x-auto gap-6 pb-4 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
          {showcaseItems.map((item, index) => (
            <Card
              key={item.title}
              className="flex-shrink-0 w-80 h-96 relative overflow-hidden bg-card border-border/50 hover:border-primary/50 transition-all duration-500 group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Placeholder Background */}
              <div
                className="absolute inset-0"
                style={{ background: item.image }}
              />
              
              {/* Content Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent flex flex-col justify-end p-6">
                <h3 className="text-2xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                <p className="text-muted-foreground text-sm">{item.caption}</p>
              </div>

              {/* Hover Glow */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10" />
              </div>
            </Card>
          ))}
        </div>

        {/* Coming Soon Notice */}
        <div className="text-center mt-12 text-sm text-muted-foreground">
          Gallery images coming soon — Follow us on Instagram for live workshop updates
        </div>
      </div>

      {/* Bottom Metallic Divider */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
    </section>
  );
};

export default WorkshopShowcase;
