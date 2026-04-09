import { useEffect, useState } from "react";
import {
  CheckCircle,
  ClipboardCheck,
  Eye,
  EyeOff,
  Gift,
  LogOut,
  Maximize2,
  Shield,
  Sparkles,
  Star,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import logo from "@/assets/logo.svg";
import gallery1 from "@/assets/octane-gallery-1.jpg";
import gallery2 from "@/assets/octane-gallery-2.jpg";
import gallery3 from "@/assets/octane-gallery-3.jpg";
import gallery4 from "@/assets/octane-gallery-4.jpg";
import gallery5 from "@/assets/octane-gallery-5.jpg";
import gallery6 from "@/assets/octane-gallery-6.jpg";
import gallery7 from "@/assets/octane-gallery-7.jpg";
import gallery8 from "@/assets/octane-gallery-8.jpg";
import m2Logo from "@/assets/logo.svg";

const PORTAL_PASSWORD =
  import.meta.env.VITE_PARTNER_2_B2B_PASSWORD ||
  import.meta.env.VITE_OCTANE_B2B_PASSWORD ||
  "M2Luxury";
const AUTH_KEY = "partner_2_b2b_auth";
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
  localStorage.setItem(
    AUTH_KEY,
    JSON.stringify({ expiry: Date.now() + EXPIRY_HOURS * 60 * 60 * 1000 }),
  );
}

function clearAuth() {
  localStorage.removeItem(AUTH_KEY);
}

const pricingRows = [
  { service: "5 Years Warranty", midSize: "6,750", largeSuv: "7,250" },
  { service: "10 Years Warranty", midSize: "8,890", largeSuv: "9,390" },
  { service: "Rear & Side Tints", midSize: "450", largeSuv: "450" },
  { service: "Front 0% Tints", midSize: "300", largeSuv: "300" },
  { service: "Roof Tints", midSize: "300", largeSuv: "300" },
];

const includedServices = [
  { service: "Complete Interior/Exterior Detailing", value: "500" },
  { service: "Complete Engine Bay Cleaning", value: "200" },
  { service: "Full Multi-Stage Paint Correction", value: "1,000" },
  { service: "Headlights Clear Gloss PPF", value: "400" },
  { service: "Clear PPF in Door Sills", value: "200" },
];

const galleryImages = [
  { src: gallery1, caption: "Full-body PPF finish on premium vehicle panels" },
  { src: gallery2, caption: "Colour transformation and high-detail presentation work" },
  { src: gallery7, caption: "Precision edge work on SUV panels" },
  { src: gallery8, caption: "Clear PPF protection with gloss retention" },
  { src: gallery3, caption: "High-gloss correction and coating finish" },
  { src: gallery4, caption: "Deep gloss result after paint refinement" },
  { src: gallery5, caption: "Protection work tailored for larger SUVs" },
  { src: gallery6, caption: "Detail-focused finishing on specialty vehicles" },
];

const processSteps = [
  { icon: ClipboardCheck, text: "Prep & inspection" },
  { icon: Wrench, text: "Clean edge work" },
  { icon: Shield, text: "Warranty-backed materials" },
  { icon: CheckCircle, text: "Quality control handover" },
];

const GoogleWordmark = ({ className = "" }: { className?: string }) => (
  <span aria-label="Google" className={`font-semibold tracking-tight ${className}`.trim()}>
    <span className="text-[#4285F4]">G</span>
    <span className="text-[#EA4335]">o</span>
    <span className="text-[#FBBC05]">o</span>
    <span className="text-[#4285F4]">g</span>
    <span className="text-[#34A853]">l</span>
    <span className="text-[#EA4335]">e</span>
  </span>
);

const TrustStars = () => (
  <div className="flex items-center gap-1 text-[#fbbc05]">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star key={star} className="h-4 w-4 fill-current" />
    ))}
  </div>
);

function VideoModalCard({
  title,
  description,
  videoSrc,
  posterSrc,
  eyebrow,
}: {
  title: string;
  description: string;
  videoSrc: string;
  posterSrc: string;
  eyebrow: string;
}) {
  return (
    <div className="mt-4">
      <Dialog>
        <DialogTrigger asChild>
          <button type="button" className="block w-full text-left">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/30 transition hover:border-orange-300/30">
              <div className="relative aspect-video">
                <img src={posterSrc} alt={title} className="h-full w-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="inline-flex items-center rounded-full border border-white/20 bg-black/55 px-4 py-2 text-white shadow-2xl backdrop-blur-sm">
                    <span className="text-sm font-semibold">Play video</span>
                  </div>
                </div>
                <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80">
                    {eyebrow}
                  </span>
                  <div className="rounded-full border border-white/15 bg-white/10 p-2 text-white backdrop-blur-sm">
                    <Maximize2 className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>
            </div>
          </button>
        </DialogTrigger>
        <DialogContent className="max-w-[420px] border-orange-300/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(18,18,18,0.96))] p-3 shadow-[0_30px_120px_rgba(0,0,0,0.6)] backdrop-blur-xl sm:p-4">
          <DialogHeader className="px-1">
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <div className="overflow-hidden rounded-2xl border border-orange-300/15 bg-black shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
            <video className="aspect-[9/16] h-auto w-full bg-black object-cover" controls playsInline preload="metadata" autoPlay>
              <source src={videoSrc} type="video/mp4" />
            </video>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.18),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(251,191,36,0.14),transparent_28%)]" />
      <Card className="relative w-full max-w-md border-white/10 bg-slate-900/85 shadow-2xl shadow-orange-950/20 backdrop-blur-xl">
        <CardContent className="p-8">
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-orange-400/20 bg-orange-400/10">
              <Shield className="h-7 w-7 text-orange-300" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Partner Portal</h1>
            <p className="mt-1 text-sm text-slate-400">Protected B2B pricing access</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                className="border-white/10 bg-slate-950/70 pr-10 text-white placeholder:text-slate-500"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-white"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {error && <p className="text-center text-sm text-red-400">{error}</p>}
            <Button type="submit" className="w-full bg-orange-500 text-white hover:bg-orange-400">
              Access Portal
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Partner2B2B() {
  const [authed, setAuthed] = useState(isAuthenticated);

  useEffect(() => {
    setAuthed(isAuthenticated());
  }, []);

  if (!authed) return <PasswordGate onSuccess={() => setAuthed(true)} />;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="absolute inset-x-0 top-0 h-[32rem] bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.2),transparent_42%),linear-gradient(180deg,rgba(15,23,42,0.2)_0%,rgba(2,6,23,0)_100%)] pointer-events-none" />

      <header className="sticky top-0 z-10 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white p-2 sm:h-14 sm:w-14">
              <img src={m2Logo} alt="M2 Luxury Car Rent" className="max-h-full w-auto object-contain" />
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-black p-2 sm:h-14 sm:w-14">
              <img src={logo} alt="Grand Touch" className="max-h-full w-auto object-contain" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs uppercase tracking-[0.24em] text-orange-300/80">M2 Luxury Car Rent x Grand Touch Auto</p>
              <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                M2 Luxury <span className="text-orange-300">B2B PPF Price List</span>
              </h1>
              <p className="mt-0.5 truncate text-xs text-slate-400 sm:text-sm">
                Prepared for Monther Mustafa, M2 Luxury Car Rent
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              clearAuth();
              setAuthed(false);
            }}
            className="gap-1.5 text-slate-300 hover:bg-white/5 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Log out</span>
          </Button>
        </div>
      </header>

      <main className="relative mx-auto flex max-w-6xl flex-col gap-12 px-4 py-8 sm:px-6 sm:py-12">
        <section className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7 shadow-[0_20px_80px_rgba(15,23,42,0.45)] backdrop-blur-sm sm:p-8">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-400/20 bg-orange-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-orange-200">
              <Sparkles className="h-3.5 w-3.5" />
              M2 Luxury Car Rent x Grand Touch Auto
            </div>
            <div className="mb-6 grid gap-4 rounded-[28px] border border-white/10 bg-slate-950/45 p-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:p-5">
              <div className="flex min-h-[108px] items-center justify-center rounded-2xl border border-white/10 bg-white px-5 py-4">
                <img src={m2Logo} alt="M2 Luxury Car Rent" className="max-h-16 w-auto object-contain sm:max-h-20" />
              </div>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-orange-400/20 bg-orange-400/10 text-xs font-semibold uppercase tracking-[0.2em] text-orange-200">
                x
              </div>
              <div className="flex min-h-[108px] items-center justify-center rounded-2xl border border-white/10 bg-black px-5 py-4">
                <img src={logo} alt="Grand Touch" className="max-h-10 w-auto object-contain sm:max-h-12" />
              </div>
            </div>
            <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Personalized B2B pricing for M2 Luxury Car Rent.
            </h2>
            <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-4 sm:px-5">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Prepared For</p>
              <p className="mt-2 text-lg font-semibold text-white">Monther Mustafa</p>
              <p className="mt-1 text-sm text-slate-300">M2 Luxury Car Rent</p>
            </div>
          </div>
        </section>

        <p className="text-xs text-slate-500">Last updated: April 9, 2026</p>

        <section>
          <h2 className="mb-6 text-lg font-semibold tracking-tight text-white sm:text-xl">Pricing Schedule</h2>

          <div className="hidden overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] shadow-[0_20px_80px_rgba(15,23,42,0.32)] md:block">
            <table className="w-full">
              <thead>
                <tr className="bg-white/[0.04]">
                  <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">Service</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-slate-400">Midsize</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-slate-400">Large SUV</th>
                </tr>
              </thead>
              <tbody>
                {pricingRows.map((row, i) => (
                  <tr
                    key={row.service}
                    className={`border-t border-white/8 ${i % 2 === 0 ? "bg-slate-950/30" : "bg-white/[0.02]"}`}
                  >
                    <td className="px-6 py-4 text-sm font-medium text-white">{row.service}</td>
                    <td className="px-6 py-4 text-right text-sm font-semibold tabular-nums text-white">
                      <span className="mr-1 text-xs font-normal text-slate-500">AED</span>
                      {row.midSize}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-semibold tabular-nums text-white">
                      <span className="mr-1 text-xs font-normal text-slate-500">AED</span>
                      {row.largeSuv}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {pricingRows.map((row) => (
              <Card key={row.service} className="border-white/10 bg-white/[0.03] shadow-xl shadow-slate-950/20">
                <CardContent className="p-4">
                  <p className="mb-3 text-sm font-semibold text-orange-200">{row.service}</p>
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="rounded-2xl border border-white/8 bg-slate-950/50 p-3">
                      <p className="mb-1 text-[10px] uppercase tracking-wider text-slate-500">Midsize</p>
                      <p className="text-sm font-semibold tabular-nums text-white">AED {row.midSize}</p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-slate-950/50 p-3">
                      <p className="mb-1 text-[10px] uppercase tracking-wider text-slate-500">Large SUV</p>
                      <p className="text-sm font-semibold tabular-nums text-white">AED {row.largeSuv}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="mt-4 text-xs text-slate-500">
            All pricing in AED excl. 5% VAT.
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Matte PPF can be arranged with additional charges, discussed and confirmed before the job.
          </p>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_12px_40px_rgba(15,23,42,0.24)]">
          <div className="mb-4 flex items-center gap-3">
            <Gift className="h-5 w-5 text-orange-300" />
            <h3 className="text-base font-semibold tracking-tight text-white sm:text-lg">Included in Package (Free)</h3>
          </div>
          <div className="space-y-3 text-sm">
            {includedServices.map((item) => (
              <div
                key={item.service}
                className="flex items-center justify-between border-b border-white/8 py-2 last:border-0"
              >
                <span className="text-slate-200">{item.service}</span>
                <span className="text-slate-500 line-through">AED {item.value}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 border-t border-white/10 pt-4 text-xs text-slate-500">
            All listed services are included at no additional cost with your PPF package.
          </p>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_12px_40px_rgba(15,23,42,0.24)]">
          <div className="mb-3 flex items-center gap-3">
            <Shield className="h-5 w-5 text-orange-300" />
            <h3 className="text-base font-semibold tracking-tight text-white sm:text-lg">Installation Guarantee</h3>
          </div>
          <p className="text-sm text-slate-300">
            We offer our installation guarantee on top of the manufacturer's warranty, ensuring
            comprehensive protection and peace of mind for your investment.
          </p>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_12px_40px_rgba(15,23,42,0.24)]">
          <h3 className="mb-4 text-base font-semibold tracking-tight text-white sm:text-lg">
            PPF Film Selection & Warranty
          </h3>
          <div className="space-y-3 text-sm text-slate-300">
            <p>
              Unless previously discussed, we reserve the right to choose the PPF film or wrap brand
              used for each installation, provided it meets the agreed warranty specifications. If a
              specific brand is explicitly requested, pricing may change based on product cost variations
              from time to time.
            </p>
            <div className="mt-4 max-w-xl rounded-2xl border border-white/10 bg-slate-950/40 p-5">
              <p className="mb-2 font-medium text-white">Clear PPF Brands:</p>
              <ul className="list-disc space-y-1 pl-5 text-slate-300">
                <li>STEK</li>
                <li>KDX</li>
                <li>DiamondPro</li>
                <li>Protect +</li>
                <li>Carbins</li>
                <li>Gyeon</li>
                <li>SunStop</li>
              </ul>
            </div>
            <p className="mt-4 border-t border-white/10 pt-4">
              While we can accommodate specific PPF or wrap brand requests from customers, we reserve
              the right to adjust pricing accordingly should the requested brand result in increased
              material costs for us.
            </p>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_12px_40px_rgba(15,23,42,0.24)]">
          <div className="mb-6">
            <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Customer reviews & our work</p>
            <h2 className="mt-2 text-3xl font-bold text-white">Google reviews, testimonials, and real edits</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3 md:items-stretch">
            <Card className="flex h-full flex-col border-[#4285F4]/20 bg-[linear-gradient(180deg,rgba(66,133,244,0.07),rgba(255,255,255,0.02)_22%,rgba(255,255,255,0.02)_100%)] p-4 sm:p-6">
              <div className="flex items-center gap-2">
                <GoogleWordmark />
                <span className="text-sm font-semibold text-white">Reviews</span>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <TrustStars />
                <span className="text-sm font-semibold text-white">5-star review</span>
              </div>
              <h3 className="mt-4 text-xl font-semibold text-white">Mark | Zeekr 001</h3>
              <p className="mt-2 text-sm text-slate-300">
                "Top-notch service, Sean. Unreal. Sean picked my car up from Abu Dhabi, kept the whole
                process easy, and the finish came out amazing."
              </p>
              <div className="mt-auto">
                <VideoModalCard
                  title="Mark's Zeekr 001"
                  description="A quick customer delivery clip showing the finished Zeekr 001 and the level of service behind it."
                  videoSrc="https://res.cloudinary.com/diw6rekpm/video/upload/q_auto/f_auto/v1775562589/Mark_Zeekr_conzdp.mp4"
                  posterSrc="/mark-zeekr-001.png"
                  eyebrow="Zeekr 001 PPF edit"
                />
              </div>
            </Card>

            <Card className="flex h-full flex-col border-[#f59e0b]/20 bg-[linear-gradient(180deg,rgba(245,158,11,0.08),rgba(255,255,255,0.02)_24%,rgba(255,255,255,0.02)_100%)] p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <img src="/stek-logo.webp" alt="STEK official brand logo" className="h-6 w-auto object-contain" loading="lazy" />
                <span className="text-xs uppercase tracking-[0.18em] text-[#f6c76d]">STEK certified installs</span>
              </div>
              <h3 className="mt-4 text-xl font-semibold text-white">Recent Grand Touch work</h3>
              <p className="mt-2 text-sm text-slate-300">
                Four G700 builds finished with STEK PPF in gloss and matte options, 10-year warranty
                coverage, and selected custom paintwork details by the Grand Touch team.
              </p>
              <div className="mt-auto">
                <VideoModalCard
                  title="Recent Grand Touch work"
                  description="A multi-car G700 showcase featuring STEK gloss and matte colour PPF installs, warranty-backed packages, and custom finish details."
                  videoSrc="https://res.cloudinary.com/diw6rekpm/video/upload/v1775556526/Jetour_EDIT_yi001t.mp4"
                  posterSrc="/g700-orange.png"
                  eyebrow="G700 | STEK gloss & matte"
                />
              </div>
            </Card>

            <Card className="flex h-full flex-col border-[#5f8f79]/20 bg-[linear-gradient(180deg,rgba(95,143,121,0.09),rgba(255,255,255,0.02)_24%,rgba(255,255,255,0.02)_100%)] p-4 sm:p-6">
              <div className="mt-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="text-xl font-semibold text-white">Matt Cooper</h3>
                  <p className="text-xs uppercase tracking-[0.18em] text-[#9dc3b0]">
                    Jetour T2 | Matte green colour PPF
                  </p>
                </div>
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                  <img src="/matt-cooper-face.png" alt="Matt Cooper" className="h-full w-full object-cover" loading="lazy" />
                </div>
              </div>
              <p className="mt-2 text-sm text-slate-300">
                "I left my Jetour T2 with Sean for a matte green colour PPF transformation and
                couldn't be happier. Great finish, smooth process, and a team I was happy to trust with my car."
              </p>
              <div className="mt-auto">
                <VideoModalCard
                  title="Matt Cooper's Jetour T2"
                  description="A quick delivery clip showing Matt Cooper's matte green Jetour T2 colour PPF transformation."
                  videoSrc="https://res.cloudinary.com/diw6rekpm/video/upload/q_auto/f_auto/v1775563747/0407_xyaggw.mp4"
                  posterSrc="/matt-cooper-t2.png"
                  eyebrow="Jetour T2 matte green"
                />
              </div>
            </Card>
          </div>
        </section>

        <section>
          <h2 className="mb-6 text-lg font-semibold tracking-tight text-white sm:text-xl">Work Examples</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {galleryImages.map((img) => (
              <div
                key={img.caption}
                className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] shadow-[0_12px_40px_rgba(15,23,42,0.24)]"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={img.src}
                    alt={img.caption}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <p className="px-4 py-3 text-xs text-slate-400">{img.caption}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-6 text-lg font-semibold tracking-tight text-white sm:text-xl">How We Install</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {processSteps.map((step) => (
              <div
                key={step.text}
                className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 text-center shadow-[0_12px_40px_rgba(15,23,42,0.2)]"
              >
                <step.icon className="mx-auto h-6 w-6 text-orange-300" />
                <p className="mt-3 text-sm text-slate-200">{step.text}</p>
              </div>
            ))}
          </div>
        </section>

        <footer className="border-t border-white/10 pb-8 pt-6 text-center">
          <p className="text-xs text-slate-500">
            Grand Touch Auto - Confidential B2B pricing. Not for distribution.
          </p>
        </footer>
      </main>
    </div>
  );
}
