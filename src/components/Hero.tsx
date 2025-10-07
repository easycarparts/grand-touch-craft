import { Button } from "@/components/ui/button";
import BookServiceDialog from "@/components/BookServiceDialog";
import { ArrowRight, Shield, Wrench } from "lucide-react";
import heroImage from "@/assets/hero-workshop.jpg";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background z-10" />
        <img
          src={heroImage}
          alt="Professional automotive workshop in Dubai - luxury car repair, paint, and detailing services"
          className="w-full h-full object-cover"
          loading="eager"
          width="1920"
          height="1080"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background/80 z-10" />
      </div>

      {/* Content */}
      <div className="relative z-20 container mx-auto px-4 sm:px-6 lg:px-8 pt-20">
        <div className="max-w-4xl animate-fade-up">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 backdrop-blur-sm">
            <Wrench className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Dubai's Luxury Automotive Studio</span>
          </div>

          {/* Main Headline */}
          <h1 className="mb-6 leading-tight">
            <span className="block text-foreground">Dubai's Luxury</span>
            <span className="block text-primary">Automotive Studio.</span>
          </h1>

          {/* Subheading */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl font-light">
            Repair. Paint. Protection. Detailing. Perfection.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-16">
            <BookServiceDialog>
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground text-base font-semibold px-8 py-6 shadow-glow animate-glow group"
              >
                Book Your Service
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </BookServiceDialog>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-2 border-primary/30 text-foreground hover:bg-primary/10 text-base font-semibold px-8 py-6 backdrop-blur-sm"
            >
              <Link to="/portfolio">
                <Shield className="mr-2 w-5 h-5" />
                View Our Work
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl border-t border-border/30 pt-8">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">500+</div>
              <div className="text-sm text-muted-foreground">Luxury Vehicles</div>
            </div>
            <div className="text-center border-x border-border/30">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">15+</div>
              <div className="text-sm text-muted-foreground">Years Experience</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">100%</div>
              <div className="text-sm text-muted-foreground">Satisfaction</div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 animate-bounce">
        <div className="w-6 h-10 border-2 border-primary/50 rounded-full flex items-start justify-center p-2">
          <div className="w-1.5 h-3 bg-primary rounded-full" />
        </div>
      </div>
    </section>
  );
};

export default Hero;
