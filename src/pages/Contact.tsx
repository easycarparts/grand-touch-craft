import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import MobileBottomBar from "@/components/MobileBottomBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Phone, Mail, Clock, Send } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const Contact = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    service: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const isDetailing = formData.service === "detailing";
    const phoneNumber = isDetailing ? "971567191045" : "971547302243";

    const selectedServiceLabel = isDetailing ? "Detailing & Protection" : "Workshop & Repair";

    const composed = `New inquiry from website%0A%0A` +
      `Name: ${encodeURIComponent(formData.name)}%0A` +
      `Service: ${encodeURIComponent(selectedServiceLabel)}%0A%0A` +
      `Message:%0A${encodeURIComponent(formData.message)}`;

    const url = `https://wa.me/${phoneNumber}?text=${composed}`;
    window.open(url, "_blank");

    toast({ title: "Opening WhatsApp…", description: `Sending to ${selectedServiceLabel}` });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        
        <div className="container mx-auto relative z-10 text-center">
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm mb-6">
            <Send className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Get in Touch</span>
          </div>
          <h1 className="mb-6">Contact Us</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Ready to elevate your vehicle? Reach out to schedule a consultation or request a quote
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <Card className="p-8 bg-card border-border/50">
              <h2 className="text-2xl font-bold mb-6 text-foreground">Send us a Message</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">
                    Name *
                  </label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="bg-background border-border"
                  />
                </div>
                {/* Email and phone removed as WhatsApp handles contact */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">
                    Service of Interest
                  </label>
                  <Select
                    value={formData.service}
                    onValueChange={(value) => setFormData({ ...formData, service: value })}
                  >
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue placeholder="Select a service" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border z-50">
                      <SelectItem value="workshop">Workshop & Repair</SelectItem>
                      <SelectItem value="detailing">Detailing & Protection</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">
                    Message *
                  </label>
                  <Textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    className="bg-background border-border resize-none"
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                >
                  <Send className="mr-2 w-4 h-4" />
                  Book Service or Detailing
                </Button>
              </form>
            </Card>

            {/* Contact Information */}
            <div className="space-y-8">
              {/* Info Cards */}
              <Card className="p-6 bg-card border-border/50">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div className="w-full">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-foreground">Location</h3>
                      <a
                        href="https://maps.app.goo.gl/j6CZCqFX2bDYtCLf7"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80 transition-transform inline-flex items-center gap-1 text-sm hover:scale-110"
                        aria-label="Open in Google Maps"
                      >
                        <MapPin className="w-8 h-8 md:w-9 md:h-9" />
                      </a>
                    </div>
                    <p className="text-muted-foreground">
                      DIP 2, Dubai Investment Park - 2<br />
                      Thani warehouse - 3 11b <br />
                      Dubai, United Arab Emirates
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-card border-border/50">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Phone</h3>
                    <p className="text-muted-foreground">
                      Work Shop +971 54 730 2243<br />
                      Detailing +971 56 719 1045<br />
                      Available 9 AM - 7 PM
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-card border-border/50">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Email</h3>
                    <p className="text-muted-foreground">
                    info@grandtouchautorepair.com<br />
                      We reply within 24 hours
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-card border-border/50">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Hours</h3>
                    <div className="text-muted-foreground space-y-1">
                      <p>Monday - Saturday: 9:00 AM - 6:00 PM</p>
                      <p>Sunday: Closed</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <WhatsAppButton />
      <MobileBottomBar />
    </div>
  );
};

export default Contact;
