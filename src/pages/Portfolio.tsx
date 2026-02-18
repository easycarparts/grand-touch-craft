import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { Card } from "@/components/ui/card";
import { Camera } from "lucide-react";
import { updatePageSEO } from "@/lib/seo";
import gallery1 from "@/assets/octane-gallery-1.jpg";
import gallery2 from "@/assets/octane-gallery-2.jpg";
import gallery3 from "@/assets/octane-gallery-3.jpg";
import gallery4 from "@/assets/octane-gallery-4.jpg";
import gallery5 from "@/assets/octane-gallery-5.jpg";
import gallery6 from "@/assets/octane-gallery-6.jpg";
import gallery7 from "@/assets/octane-gallery-7.jpg";
import gallery8 from "@/assets/octane-gallery-8.jpg";

const Portfolio = () => {
  useEffect(() => {
    updatePageSEO('portfolio');
  }, []);

  const portfolioItems = [
    { id: 1, title: "Jetour G700 – Full Matte STEK PPF", category: "PPF", image: gallery1 },
    { id: 2, title: "Mercedes S-Class – Hyper Pro Champagne Gold PPF", category: "PPF", image: gallery2 },
    { id: 3, title: "Toyota Prado – Matte STEK PPF", category: "PPF", image: gallery7 },
    { id: 4, title: "Land Rover Defender – STEK Clear PPF", category: "PPF", image: gallery8 },
    { id: 5, title: "BMW X5 – Ceramic Coating", category: "Ceramic", image: gallery3 },
    { id: 6, title: "Toyota Supra – Ceramic Coating", category: "Ceramic", image: gallery4 },
    { id: 7, title: "Ford Bronco – Ceramic Coating", category: "Ceramic", image: gallery5 },
    { id: 8, title: "Chevrolet El Camino – Ceramic Coating", category: "Ceramic", image: gallery6 },
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
                <div className="absolute inset-0">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <div className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-medium inline-block mb-2 backdrop-blur-sm">
                      {item.category}
                    </div>
                    <h3 className="text-lg font-semibold text-white">
                      {item.title}
                    </h3>
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
    </div>
  );
};

export default Portfolio;
