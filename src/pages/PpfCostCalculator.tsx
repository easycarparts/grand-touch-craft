import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  MessageCircle,
  ShieldCheck,
  Star,
} from "lucide-react";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import PpfCostCalculatorWidget from "@/components/PpfCostCalculatorWidget";
import { updatePageSEO } from "@/lib/seo";

const PpfCostCalculator = () => {
  useEffect(() => {
    updatePageSEO("ppf-cost-calculator", {
      title: "PPF Cost Calculator Dubai | Full Body & Front PPF Price Estimate",
      description:
        "Get a PPF cost estimate in Dubai by car size, coverage, and finish. Compare front and full body options, then confirm pricing and install timing on WhatsApp.",
      keywords:
        "PPF cost calculator Dubai, front PPF price Dubai, full body PPF cost Dubai, matte PPF Dubai price, STEK PPF Dubai price, GYEON PPF Dubai, PPF for SUV Dubai, PPF for sports car Dubai",
      ogTitle: "PPF Cost Calculator Dubai | Front & Full Body PPF Pricing",
      ogDescription:
        "Use our PPF calculator for Dubai to estimate pricing by film brand, warranty, finish, and coverage, then confirm your final quote with our team.",
    });

    const structuredData = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "How much does full body PPF cost in Dubai?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Full body PPF cost in Dubai depends on vehicle size, film brand, warranty term, and paint condition. Use the calculator above for a fast estimate, then confirm final pricing after inspection.",
          },
        },
        {
          "@type": "Question",
          name: "Is front PPF enough for daily driving in Dubai?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Front coverage protects high-impact zones such as bumper, hood, and fenders, and is often chosen for daily drivers. Full body PPF gives more complete protection for frequent highway use or premium vehicles.",
          },
        },
        {
          "@type": "Question",
          name: "What changes PPF price the most?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Vehicle size, panel complexity, coverage area, film type, and pre-install paint correction are the biggest pricing factors.",
          },
        },
        {
          "@type": "Question",
          name: "Can I get matte PPF pricing in Dubai?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. The calculator includes gloss and matte selection so you can estimate matte PPF pricing before requesting a final quote.",
          },
        },
      ],
    };

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(structuredData);
    script.setAttribute("data-page-schema", "ppf-cost-calculator-faq");
    document.head.appendChild(script);

    return () => {
      const existingScript = document.querySelector(
        'script[data-page-schema="ppf-cost-calculator-faq"]'
      );
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, []);

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <Navbar />
      <main>
        <PpfCostCalculatorWidget variant="standalone" />

        <section className="pb-10 px-4 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-6xl">
            <Card className="p-6 sm:p-8 bg-card/60 border-primary/20">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Badge variant="secondary">Local PPF specialists</Badge>
                <Badge variant="outline">Dubai Investment Park</Badge>
                <Badge variant="outline">4.9 Google rating</Badge>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                PPF cost in Dubai: estimate first, then confirm with real inspection
              </h2>
              <p className="text-muted-foreground text-base sm:text-lg">
                This page is built as a single PPF funnel for Dubai drivers. Start with your estimate
                above, then use the sections below to compare coverage, understand pricing factors, and
                decide what protection level fits your car and driving style.
              </p>
            </Card>
          </div>
        </section>

        <section className="pb-12 px-4 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-6xl grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="p-6">
              <h3 className="font-semibold mb-2">Front PPF price Dubai</h3>
              <p className="text-sm text-muted-foreground">
                Best for daily driving and highway chip protection on high-impact panels.
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="font-semibold mb-2">Full body PPF cost Dubai</h3>
              <p className="text-sm text-muted-foreground">
                Recommended for owners who want complete paint protection and easier resale positioning.
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="font-semibold mb-2">Matte PPF Dubai pricing</h3>
              <p className="text-sm text-muted-foreground">
                Compare satin-matte appearance against gloss while keeping impact resistance.
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="font-semibold mb-2">SUV and sports car PPF</h3>
              <p className="text-sm text-muted-foreground">
                Vehicle size and body complexity heavily influence total PPF installation cost.
              </p>
            </Card>
          </div>
        </section>

        <section className="pb-16 px-4 sm:px-6 lg:px-8 bg-card/30">
          <div className="container mx-auto max-w-6xl py-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-6">Why PPF installs fail (and how we avoid it)</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="p-6">
                <h3 className="font-semibold mb-3">What causes poor PPF results</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5" />
                    Rushed prep and contamination left on paint.
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5" />
                    Misalignment around edges, sensors, and trims.
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5" />
                    Weak finishing that leads to lifting and visible lines.
                  </li>
                </ul>
              </Card>
              <Card className="p-6">
                <h3 className="font-semibold mb-3">Our PPF workflow in Dubai</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <ClipboardCheck className="w-4 h-4 text-primary mt-0.5" />
                    Controlled indoor prep with decontamination and correction checks.
                  </li>
                  <li className="flex items-start gap-2">
                    <ClipboardCheck className="w-4 h-4 text-primary mt-0.5" />
                    Precision template/alignment work for cleaner wrap-around edges.
                  </li>
                  <li className="flex items-start gap-2">
                    <ClipboardCheck className="w-4 h-4 text-primary mt-0.5" />
                    Final inspection and aftercare guidance before delivery.
                  </li>
                </ul>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-6xl grid gap-6 lg:grid-cols-3">
            <Card className="p-6 lg:col-span-2">
              <h2 className="text-2xl font-bold mb-4">PPF coverage options after your estimate</h2>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <h3 className="font-semibold mb-2">Front Protection</h3>
                  <p className="text-sm text-muted-foreground">
                    Bumper, hood, fenders, and mirrors for impact-prone zones.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Extended Front</h3>
                  <p className="text-sm text-muted-foreground">
                    Adds more upper and side exposure areas for mixed city/highway driving.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Full Body PPF</h3>
                  <p className="text-sm text-muted-foreground">
                    Full-panel protection preferred by performance and premium car owners.
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-muted-foreground mb-2">Reputation and trust</p>
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <span className="font-semibold">Certified film installation focus</span>
              </div>
              <div className="flex items-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
                <span className="text-sm font-semibold ml-1">4.9 Google</span>
              </div>
              <p className="text-sm text-muted-foreground">
                We prioritize finish quality, edge quality, and long-term appearance over volume installs.
              </p>
            </Card>
          </div>
        </section>

        <section className="pb-16 px-4 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-2xl sm:text-3xl font-bold mb-6">PPF Dubai FAQs</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="p-6">
                <h3 className="font-semibold mb-2">How much does full body PPF cost in Dubai?</h3>
                <p className="text-sm text-muted-foreground">
                  It depends on size, film line, warranty, and paint condition. Use the calculator above
                  for an instant range and message us for final confirmation.
                </p>
              </Card>
              <Card className="p-6">
                <h3 className="font-semibold mb-2">Is front PPF enough for Dubai roads?</h3>
                <p className="text-sm text-muted-foreground">
                  For many daily drivers, yes. If you do frequent highway use or want full resale-focused
                  protection, full body PPF is usually the stronger option.
                </p>
              </Card>
              <Card className="p-6">
                <h3 className="font-semibold mb-2">Do you offer matte and gloss PPF?</h3>
                <p className="text-sm text-muted-foreground">
                  Yes, both are available. The calculator lets you estimate each finish before requesting
                  your final quote.
                </p>
              </Card>
              <Card className="p-6">
                <h3 className="font-semibold mb-2">What should I read before deciding coverage?</h3>
                <p className="text-sm text-muted-foreground">
                  Use our practical guides on PPF vs ceramic and front vs full body so your estimate
                  matches your actual usage.
                </p>
              </Card>
            </div>
          </div>
        </section>

        <section className="pb-20 px-4 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-6xl">
            <Card className="p-6 sm:p-8">
              <h2 className="text-2xl font-bold mb-4">Next step after your estimate</h2>
              <p className="text-muted-foreground mb-6">
                Use your calculator result as a baseline, then send it to us on WhatsApp to confirm
                final pricing and slot availability.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <a
                  href="https://wa.me/971567191045?text=Hi%20Sean%2C%20I%20used%20the%20PPF%20cost%20calculator%20and%20want%20to%20confirm%20my%20best%20option."
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto"
                >
                  <Button className="w-full sm:w-auto">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Confirm on WhatsApp
                  </Button>
                </a>
                <Link to="/bookings" className="w-full sm:w-auto">
                  <Button variant="outline" className="w-full sm:w-auto">
                    Book consultation
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
              <div className="text-sm space-y-2">
                <Link to="/blog/ppf-vs-ceramic-dubai" className="text-primary hover:underline block">
                  Read: PPF vs Ceramic in Dubai
                </Link>
                <Link
                  to="/blog/ppf-dubai-full-front-vs-full-body"
                  className="text-primary hover:underline block"
                >
                  Read: Front vs Full Body PPF
                </Link>
                <Link
                  to="/blog/ppf-longevity-dubai-heat"
                  className="text-primary hover:underline block"
                >
                  Read: PPF durability in Dubai heat
                </Link>
              </div>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default PpfCostCalculator;
