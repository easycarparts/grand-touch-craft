import { Card } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

interface ServiceCardProps {
  title: string;
  description: string;
  image: string;
  icon: React.ReactNode;
}

const ServiceCard = ({ title, description, image, icon }: ServiceCardProps) => {
  return (
    <Card className="group relative overflow-hidden bg-card border-border/50 hover:border-primary/50 transition-all duration-500 cursor-pointer">
      {/* Image Container */}
      <div className="relative h-64 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent z-10" />
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        
        {/* Icon Badge */}
        <div className="absolute top-4 left-4 z-20 w-12 h-12 rounded-full bg-primary/20 backdrop-blur-sm border border-primary/30 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
          {icon}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-3">
        <h3 className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-muted-foreground leading-relaxed">
          {description}
        </p>
        
        {/* CTA */}
        <div className="flex items-center text-primary font-medium pt-2 group-hover:translate-x-2 transition-transform">
          Learn More
          <ArrowRight className="ml-2 w-4 h-4" />
        </div>
      </div>

      {/* Hover Glow Effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5" />
      </div>
    </Card>
  );
};

export default ServiceCard;
