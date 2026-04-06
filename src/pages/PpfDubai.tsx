import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Shield, ClipboardCheck, ArrowRight, MessageCircle } from "lucide-react";
import { updatePageSEO } from "@/lib/seo";
import { Link } from "react-router-dom";

const PpfDubai = () => {
  useEffect(() => {
    updatePageSEO('ppf-dubai', {
      title: "PPF Dubai | Paint Protection Film Installation in Dubai",
      description: "PPF Dubai from Grand Touch Auto: premium paint protection film installation in Dubai with STEK-certified expertise, clean installation, and WhatsApp booking.",
      keywords: "PPF Dubai, paint protection film Dubai, car PPF Dubai, STEK PPF Dubai, paint protection film installation Dubai",
      ogTitle: "PPF Dubai | Grand Touch Auto",
      ogDescription: "Premium paint protection film installation in Dubai. Protect your paint with STEK-certified PPF and book on WhatsApp.",
    });
  }, []);

  const waLink = "https://wa.me/971567191045?text=Hi%20Grand%20Touch%2C%20I%20want%20PPF%20Dubai%20pricing%20and%20availability.";

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <Navbar />
      <main>
        <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-4xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">PPF Dubai</span>
            </div>
            <h1 className="mb-6">PPF Dubai done properly — not rushed, not templated</h1>
            <p className="text-xl text-muted-foreground max-w-3xl">
              We install paint protection film for owners who care about finish, edges, and long-term protection.
              No shortcuts. No cheap installs. Just clean, controlled PPF work in Dubai.
            </p>
            <p className="text-lg text-muted-foreground max-w-3xl mt-4">
              Full body, front-end, and custom PPF installs using premium films like STEK.
              Built for Dubai roads, heat, and real-world driving.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link to="/ppf-cost-calculator">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                  <ArrowRight className="w-5 h-5 mr-2" />
                  Check PPF Cost in 30 Seconds
                </Button>
              </Link>
              <a href={waLink} target="_blank" rel="noreferrer">
                <Button variant="outline" className="font-semibold">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  WhatsApp for PPF
                </Button>
              </a>
              <Link to="/bookings">
                <Button variant="outline" className="font-semibold">
                  Book PPF Consultation
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-card/30">
          <div className="container mx-auto max-w-5xl space-y-8">
            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4">PPF in Dubai is not all the same</h2>
              <p className="text-muted-foreground mb-4">
                Most PPF jobs fail because of preparation, not the film.
              </p>
              <p className="text-muted-foreground mb-4">
                Dust, poor alignment, rushed installs, and bad edge work are what cause lifting, lines, and visible defects.
              </p>
              <p className="text-muted-foreground">
                At Grand Touch Auto, the process is controlled from start to finish:
              </p>
              <ul className="mt-4 space-y-2 text-muted-foreground list-disc pl-5">
                <li>Full decontamination and paint correction before install</li>
                <li>Controlled indoor environment</li>
                <li>Precision alignment and edge finishing</li>
                <li>Post-install inspection and support</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                This is what separates a clean install from a cheap one.
              </p>
            </Card>

            <div className="grid gap-6 md:grid-cols-3">
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-3">What is PPF</h2>
                <p className="text-muted-foreground">Paint protection film is a clear protective layer applied to painted surfaces to help guard against stone chips, scratches, and road wear.</p>
              </Card>
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-3">Benefits</h2>
                <p className="text-muted-foreground">Helps preserve factory paint, protects high-impact areas, supports resale value, and keeps the car looking sharper for longer.</p>
              </Card>
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-3">Why choose us</h2>
                <p className="text-muted-foreground">We are STEK certified and focus on installation quality over volume.</p>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-5xl space-y-8">
            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4">Who this is for</h2>
              <ul className="space-y-3 text-muted-foreground list-disc pl-5">
                <li>You just bought a new car and want to protect it properly</li>
                <li>You care about resale value and paint condition</li>
                <li>You’ve seen bad PPF installs and want it done right</li>
                <li>You want a clean finish, not visible edges and lines</li>
              </ul>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4">PPF packages</h2>
              <div className="grid gap-6 md:grid-cols-3">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Full Front Protection</h3>
                  <p className="text-muted-foreground">Bumper, bonnet, fenders, mirrors. Most popular for daily drivers.</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Extended Front</h3>
                  <p className="text-muted-foreground">Adds headlights, A-pillars, and roof edge for broader protection.</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Full Body PPF</h3>
                  <p className="text-muted-foreground">Complete protection for high-end vehicles. Custom installs available depending on use and driving conditions.</p>
                </div>
              </div>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4">Our process</h2>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex gap-3"><ClipboardCheck className="w-5 h-5 text-primary mt-1" />Day 1 – prep and correction</li>
                <li className="flex gap-3"><ClipboardCheck className="w-5 h-5 text-primary mt-1" />Day 2 – install</li>
                <li className="flex gap-3"><ClipboardCheck className="w-5 h-5 text-primary mt-1" />Day 3 – finishing and inspection</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                We don’t rush installs to push volume.
              </p>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default PpfDubai;
