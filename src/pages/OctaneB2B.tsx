import { useState, useEffect } from "react";
import { Eye, EyeOff, LogOut, Shield, Wrench, CheckCircle, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import gallery1 from "@/assets/octane-gallery-1.jpg";
import gallery2 from "@/assets/octane-gallery-2.jpg";
import gallery3 from "@/assets/octane-gallery-3.jpg";
import gallery4 from "@/assets/octane-gallery-4.jpg";
import gallery5 from "@/assets/octane-gallery-5.jpg";
import gallery6 from "@/assets/octane-gallery-6.jpg";
import gallery7 from "@/assets/octane-gallery-7.jpg";
import gallery8 from "@/assets/octane-gallery-8.jpg";

// SECURITY NOTE: Password is hardcoded here. For better security,
// use VITE_OCTANE_B2B_PASSWORD env var in production.
const PORTAL_PASSWORD = import.meta.env.VITE_OCTANE_B2B_PASSWORD || "Octane";
const AUTH_KEY = "octane_b2b_auth";
const EXPIRY_HOURS = 24;

function isAuthenticated(): boolean {
  try {
    const data = localStorage.getItem(AUTH_KEY);
    if (!data) return false;
    const { expiry } = JSON.parse(data);
    if (Date.now() > expiry) {
      localStorage.removeItem(AUTH_KEY);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function setAuth() {
  localStorage.setItem(AUTH_KEY, JSON.stringify({ expiry: Date.now() + EXPIRY_HOURS * 60 * 60 * 1000 }));
}

function clearAuth() {
  localStorage.removeItem(AUTH_KEY);
}

// Pricing data
const pricingRows = [
  { service: "5 Years Warranty", sedan: "5,500", midSuv: "6,000", largeSuv: "7,000" },
  { service: "10 Years Warranty", sedan: "7,000", midSuv: "7,500", largeSuv: "8,500" },
  { service: "12 Years Warranty", sedan: "9,000", midSuv: "9,500", largeSuv: "11,000" },
  { service: "Front PPF + Ceramic", sedan: "3,000", midSuv: "3,500", largeSuv: "4,000" },
  { service: "Colored PPF (5Y W)", sedan: "6,500 – 12,000", midSuv: "7,000 – 12,000", largeSuv: "8,000 – 15,000" },
  { service: "Rear & Side Tints", sedan: "650", midSuv: "700", largeSuv: "750" },
  { service: "Front 0% Tints", sedan: "400", midSuv: "400", largeSuv: "400" },
  { service: "Roof Tints", sedan: "400", midSuv: "450", largeSuv: "500" },
];

const galleryImages = [
  { src: gallery1, caption: "Full Matte STEK PPF – Jetour G700" },
  { src: gallery2, caption: "Hyper Pro Champagne Gold Colour PPF – Mercedes S-Class" },
  { src: gallery3, caption: "Ceramic Coating – BMW X5" },
  { src: gallery4, caption: "Ceramic Coating – Toyota Supra" },
  { src: gallery5, caption: "Ceramic Coating – Ford Bronco" },
  { src: gallery6, caption: "Ceramic Coating – Chevrolet El Camino" },
  { src: gallery7, caption: "Matte STEK PPF – Toyota Prado" },
  { src: gallery8, caption: "STEK Clear PPF – Land Rover Defender" },
];

const processSteps = [
  { icon: ClipboardCheck, text: "Prep & inspection" },
  { icon: Wrench, text: "Clean edge work" },
  { icon: Shield, text: "Warranty-backed materials" },
  { icon: CheckCircle, text: "Quality control handover" },
];

// Password Gate Component
function PasswordGate({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === PORTAL_PASSWORD) {
      setAuth();
      onSuccess();
    } else {
      setError("Incorrect password");
      setPassword("");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md border-border/50 bg-card/80 backdrop-blur-sm">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
              <Shield className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Octane Portal</h1>
            <p className="text-muted-foreground text-sm mt-1">B2B Partner Access</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                className="pr-10 bg-background/50 border-border"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {error && <p className="text-destructive text-sm text-center">{error}</p>}
            <Button type="submit" className="w-full">Access Portal</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// Main Page
export default function OctaneB2B() {
  const [authed, setAuthed] = useState(isAuthenticated);

  useEffect(() => { setAuthed(isAuthenticated()); }, []);

  if (!authed) return <PasswordGate onSuccess={() => setAuthed(true)} />;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
              Octane – <span className="text-primary">B2B PPF Price List</span>
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">For Shaq (internal use)</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { clearAuth(); setAuthed(false); }}
            className="text-muted-foreground hover:text-foreground gap-1.5"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Log out</span>
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-12 sm:space-y-16">
        {/* Last updated */}
        <p className="text-muted-foreground text-xs">Last updated: February 18, 2026</p>

        {/* Pricing Table – Desktop */}
        <section>
          <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-6 tracking-tight">Pricing Schedule</h2>
          
          {/* Desktop table */}
          <div className="hidden md:block rounded-xl border border-border/50 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-card/60">
                  <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Service</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground">Sedan</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground">Mid-Size SUV</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground">Large SUV / Van</th>
                </tr>
              </thead>
              <tbody>
                {pricingRows.map((row, i) => (
                  <tr key={row.service} className={`border-t border-border/30 ${i % 2 === 0 ? "bg-background" : "bg-card/20"}`}>
                    <td className="px-6 py-4 text-sm font-medium text-foreground">{row.service}</td>
                    <td className="px-6 py-4 text-right text-sm text-foreground font-semibold tabular-nums">
                      <span className="text-muted-foreground font-normal text-xs mr-1">AED</span>{row.sedan}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-foreground font-semibold tabular-nums">
                      <span className="text-muted-foreground font-normal text-xs mr-1">AED</span>{row.midSuv}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-foreground font-semibold tabular-nums">
                      <span className="text-muted-foreground font-normal text-xs mr-1">AED</span>{row.largeSuv}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {pricingRows.map((row) => (
              <Card key={row.service} className="border-border/30 bg-card/40">
                <CardContent className="p-4">
                  <p className="text-sm font-semibold text-primary mb-3">{row.service}</p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Sedan</p>
                      <p className="text-sm font-semibold text-foreground tabular-nums">{row.sedan}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Mid SUV</p>
                      <p className="text-sm font-semibold text-foreground tabular-nums">{row.midSuv}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Large SUV</p>
                      <p className="text-sm font-semibold text-foreground tabular-nums">{row.largeSuv}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="text-muted-foreground text-xs mt-4">All pricing in AED. Subject to vehicle condition and inspection.</p>
        </section>

        {/* Gallery */}
        <section>
          <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-6 tracking-tight">Work Examples</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {galleryImages.map((img) => (
              <div key={img.caption} className="group">
                <div className="aspect-[4/3] rounded-lg overflow-hidden bg-card border border-border/30">
                  <img
                    src={img.src}
                    alt={img.caption}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">{img.caption}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Process */}
        <section>
          <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-6 tracking-tight">How We Install</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {processSteps.map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center gap-3 p-4 rounded-xl bg-card/30 border border-border/20">
                <step.icon className="w-6 h-6 text-primary" />
                <p className="text-sm text-foreground">{step.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border/30 pt-6 pb-8 text-center">
          <p className="text-xs text-muted-foreground">Grand Touch Auto — Confidential B2B pricing. Not for distribution.</p>
        </footer>
      </main>
    </div>
  );
}
