import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import MobileBottomBar from "@/components/MobileBottomBar";
import { Card } from "@/components/ui/card";
import { Camera } from "lucide-react";
import { updatePageSEO } from "@/lib/seo";

const Portfolio = () => {
  // Update SEO metadata for portfolio page
  useEffect(() => {
    updatePageSEO('portfolio');
  }, []);
  // Placeholder for portfolio - would be replaced with actual images
  const portfolioItems = [
    { id: 1, title: "Ferrari 488 GTB - Full PPF", category: "PPF" },
    { id: 2, title: "Lamborghini Urus - Satin Black Wrap", category: "Wrap" },
    { id: 3, title: "Porsche 911 GT3 - Paint Correction", category: "Correction" },
    { id: 4, title: "Range Rover Sport - Ceramic Coating", category: "Ceramic" },
    { id: 5, title: "McLaren 720S - Full PPF + Ceramic", category: "PPF" },
    { id: 6, title: "Bentley Continental - Chrome Delete", category: "Wrap" },
  ];

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        
        <div className="container mx-auto relative z-10 text-center">
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm mb-6">
            <Camera className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Our Work</span>
          </div>
          <h1 className="mb-6">Portfolio</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Witness the transformation of Dubai's finest vehicles through our expert craftsmanship
          </p>
        </div>
      </section>

      {/* Portfolio Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portfolioItems.map((item, index) => (
              <Card
                key={item.id}
                className="group relative overflow-hidden bg-card border-border/50 hover:border-primary/50 transition-all duration-500 cursor-pointer aspect-[4/3]"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-card to-muted flex items-center justify-center">
                  <div className="text-center space-y-4 p-8">
                    <Camera className="w-16 h-16 text-muted-foreground/30 mx-auto" />
                    <div>
                      <div className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium inline-block mb-3">
                        {item.category}
                      </div>
                      <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                        {item.title}
                      </h3>
                    </div>
                  </div>
                </div>
                
                {/* Hover Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </Card>
            ))}
          </div>

          {/* Coming Soon Notice */}
          <div className="text-center mt-12 p-8 border border-border/30 rounded-lg bg-card/50 backdrop-blur-sm">
            <Camera className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2 text-foreground">Gallery Coming Soon</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We're curating our finest work to showcase here. Follow us on Instagram 
              @grandtouchauto to see our latest transformations.
            </p>
          </div>
        </div>
      </section>

      <Footer />
      <WhatsAppButton />
      <MobileBottomBar />
    </div>
  );
};

export default Portfolio;
