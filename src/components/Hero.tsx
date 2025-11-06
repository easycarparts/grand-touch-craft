import { Button } from "@/components/ui/button";
import { ArrowRight, Wrench, Star } from "lucide-react";
import heroImage from "@/assets/hero-workshop-new.jpg";
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

      {/* Google Reviews Badge - Top Right */}
      <div className="absolute top-24 right-4 md:right-8 z-20 animate-fade-in">
        <div className="flex items-center gap-2 px-3 py-2 bg-background/80 border border-border/50 rounded-lg backdrop-blur-sm shadow-lg hover:bg-background/90 transition-all">
          <svg className="w-5 h-5" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" fill="#FFC107"/>
            <path d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" fill="#FF3D00"/>
            <path d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0124 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" fill="#4CAF50"/>
            <path d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 01-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" fill="#1976D2"/>
          </svg>
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4].map((star) => (
                <Star key={star} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              ))}
              <div className="relative w-3 h-3">
                <Star className="w-3 h-3 text-yellow-400" />
                <div className="absolute inset-0 overflow-hidden" style={{ clipPath: 'inset(0 50% 0 0)' }}>
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                </div>
              </div>
              <span className="text-xs font-semibold text-foreground ml-1">4.9</span>
            </div>
            <span className="text-[10px] text-muted-foreground">Google Reviews</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-20 container mx-auto px-4 sm:px-6 lg:px-8 pt-20">
        <div className="max-w-4xl animate-fade-up">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 backdrop-blur-sm">
            <Wrench className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Dubai's All-In-One Car Care Hub</span>
          </div>

          {/* Main Headline */}
          <h1 className="mb-6 leading-tight">
            <span className="block text-foreground">Dubai's Premier</span>
            <span className="block text-primary">Automotive Hub.</span>
          </h1>

          {/* Subheading */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl font-light">
            Repair. Paint. Protection. Detailing. Perfection.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-16">
            <Link to="/bookings">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground text-base font-semibold px-8 py-6 shadow-glow animate-glow group"
              >
                Book Your Service
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
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
