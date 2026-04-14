import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Check,
  Maximize2,
  MessageCircle,
  PaintBucket,
  Palette,
  Play,
  SlidersHorizontal,
  Sparkles,
  Star,
} from "lucide-react";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updatePageSEO } from "@/lib/seo";
import { cn } from "@/lib/utils";

type Finish = "gloss" | "matte";
type TrimPackage = "standard" | "blackout" | "paint-matched";

type ColorOption = {
  id: string;
  label: string;
  swatch: string;
  finishes: Record<Finish, Record<TrimPackage, string>>;
};

type PresetBuild = {
  title: string;
  colorId: ColorOption["id"];
  finish: Finish;
  trimPackage: TrimPackage;
};

const WHATSAPP_NUMBER = "971567191045";

const colorOptions: ColorOption[] = [
  { id: "black", label: "Black", swatch: "#111111", finishes: { gloss: { standard: new URL("../../Generated/Black Gloss.webp", import.meta.url).href, blackout: new URL("../../Generated/Blackout/Black Gloss Blackout.webp", import.meta.url).href, "paint-matched": new URL("../../Generated/Paint Matched/Black Gloss Matched.webp", import.meta.url).href }, matte: { standard: new URL("../../Generated/Black Matte.webp", import.meta.url).href, blackout: new URL("../../Generated/Blackout/Black Matte Blackout.webp", import.meta.url).href, "paint-matched": new URL("../../Generated/Paint Matched/Black Matte Matched.webp", import.meta.url).href } } },
  { id: "blue", label: "Blue", swatch: "#214a87", finishes: { gloss: { standard: new URL("../../Generated/Blue Gloss.webp", import.meta.url).href, blackout: new URL("../../Generated/Blackout/Blue Gloss Blackout.webp", import.meta.url).href, "paint-matched": new URL("../../Generated/Paint Matched/Blue Gloss Matched.webp", import.meta.url).href }, matte: { standard: new URL("../../Generated/Blue Matte.webp", import.meta.url).href, blackout: new URL("../../Generated/Blackout/Blue Matte Blackout.webp", import.meta.url).href, "paint-matched": new URL("../../Generated/Paint Matched/Blue Matte Matched.webp", import.meta.url).href } } },
  { id: "grey", label: "Grey", swatch: "#7d8388", finishes: { gloss: { standard: new URL("../../Generated/Grey Gloss.webp", import.meta.url).href, blackout: new URL("../../Generated/Blackout/Grey Gloss Blackout.webp", import.meta.url).href, "paint-matched": new URL("../../Generated/Paint Matched/Grey Gloss Matched.webp", import.meta.url).href }, matte: { standard: new URL("../../Generated/Grey Matte.webp", import.meta.url).href, blackout: new URL("../../Generated/Blackout/Grey Matte Blackout.webp", import.meta.url).href, "paint-matched": new URL("../../Generated/Paint Matched/Grey Matte Matched.webp", import.meta.url).href } } },
  { id: "orange", label: "Orange", swatch: "#d96a20", finishes: { gloss: { standard: new URL("../../Generated/Orange Gloss.webp", import.meta.url).href, blackout: new URL("../../Generated/Blackout/Orange Gloss Blackout.webp", import.meta.url).href, "paint-matched": new URL("../../Generated/Paint Matched/Orange Gloss Matched.webp", import.meta.url).href }, matte: { standard: new URL("../../Generated/Orange Matte.webp", import.meta.url).href, blackout: new URL("../../Generated/Blackout/Orange Matte Blackout.webp", import.meta.url).href, "paint-matched": new URL("../../Generated/Paint Matched/Orange Matte Matched.webp", import.meta.url).href } } },
  { id: "sand", label: "Sand", swatch: "#b5a180", finishes: { gloss: { standard: new URL("../../Generated/Sand Gloss.webp", import.meta.url).href, blackout: new URL("../../Generated/Blackout/Sand Gloss Blackout.webp", import.meta.url).href, "paint-matched": new URL("../../Generated/Paint Matched/Sand Gloss Matched.webp", import.meta.url).href }, matte: { standard: new URL("../../Generated/Sand Matte.webp", import.meta.url).href, blackout: new URL("../../Generated/Blackout/Sand Matte Blackout.webp", import.meta.url).href, "paint-matched": new URL("../../Generated/Paint Matched/Sand Matte Matched.webp", import.meta.url).href } } },
  { id: "white", label: "White", swatch: "#f2f1eb", finishes: { gloss: { standard: new URL("../../Generated/White Gloss.webp", import.meta.url).href, blackout: new URL("../../Generated/Blackout/White Gloss Blackout.webp", import.meta.url).href, "paint-matched": new URL("../../Generated/Paint Matched/White Gloss Matched.webp", import.meta.url).href }, matte: { standard: new URL("../../Generated/White Matte.webp", import.meta.url).href, blackout: new URL("../../Generated/Blackout/White Matte Blackout.webp", import.meta.url).href, "paint-matched": new URL("../../Generated/Paint Matched/White Matte Matched.webp", import.meta.url).href } } },
];

const trimPackageOptions: Array<{ id: TrimPackage; label: string }> = [
  { id: "standard", label: "Standard" },
  { id: "blackout", label: "Blackout" },
  { id: "paint-matched", label: "Paint Matched" },
];

const presetBuilds: PresetBuild[] = [
  { title: "Stealth Black", colorId: "black", finish: "matte", trimPackage: "blackout" },
  { title: "Launch Orange Blackout", colorId: "orange", finish: "gloss", trimPackage: "blackout" },
  { title: "White Out", colorId: "white", finish: "matte", trimPackage: "paint-matched" },
];

const serviceCards = [
  {
    icon: Sparkles,
    title: "Gloss or matte PPF",
    body: "Choose the finish that suits the personality of the G700. Gloss keeps the bodywork deep and reflective, while matte gives it a more aggressive stealth look without losing the protection side of the package.",
  },
  {
    icon: PaintBucket,
    title: "Blackout or paint matched trim",
    body: "If you want more contrast, we can take the trim into piano gloss black. If you want a cleaner, more integrated finish, we can paint match selected trim pieces to the body colour.",
  },
  {
    icon: Palette,
    title: "Accessories and finishing touches",
    body: "Spoilers, lights, wheel colours, and other visual upgrades can be quoted as add-ons around the main build. The dedicated accessory catalogue is the next layer we will add here.",
  },
] as const;

const faqItems = [
  {
    question: "Can you do the G700 in gloss or matte PPF?",
    answer: "Yes. Gloss PPF keeps the G700 looking sharp, deep, and reflective. Matte PPF changes the whole personality of the car and gives it a more stealth-driven look while still working as a proper protection package.",
  },
  {
    question: "What is the blackout package on the G700?",
    answer: "The blackout package takes the darker trim and plastic areas into a cleaner gloss-black direction, so the car looks more premium and more intentional than the standard hard-texture finish.",
  },
  {
    question: "What does paint matched mean?",
    answer: "Paint matched means selected trim pieces are finished to sit with the body colour rather than standing out as black trim. It is the right option when you want the G700 to feel cleaner and more integrated overall.",
  },
  {
    question: "Do you offer colour PPF options as well?",
    answer: "Yes. If you want a bigger transformation than the six rendered directions shown here, we can also quote gloss or matte colour PPF options and recommend the closest route for the look you want.",
  },
  {
    question: "Can you add spoilers, lights, or other accessories?",
    answer: "Yes. Accessories and finishing details can be quoted alongside the main PPF or paint package. The live accessory catalogue is coming next, but we can already discuss those upgrades during the quote.",
  },
  {
    question: "How do I get pricing for my build?",
    answer: "Use the configurator to choose the colour, finish, and trim package you like, then send it through for a quote. We will reply with the right recommendation, pricing direction, and the next step.",
  },
];

const getColor = (colorId: ColorOption["id"]) =>
  colorOptions.find((option) => option.id === colorId) ?? colorOptions[0];

const buildWhatsAppUrl = (message: string) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

const formatTrimPackage = (trimPackage: TrimPackage) =>
  trimPackage === "paint-matched"
    ? "paint matched"
    : trimPackage;

const GoogleWordmark = ({ className }: { className?: string }) => (
  <span aria-label="Google" className={cn("font-semibold tracking-tight", className)}>
    <span className="text-[#4285F4]">G</span>
    <span className="text-[#EA4335]">o</span>
    <span className="text-[#FBBC05]">o</span>
    <span className="text-[#4285F4]">g</span>
    <span className="text-[#34A853]">l</span>
    <span className="text-[#EA4335]">e</span>
  </span>
);

const TrustStars = () => (
  <div className="flex shrink-0 items-center gap-1 text-[#fbbc05]">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star key={star} className="h-4 w-4 fill-current" />
    ))}
  </div>
);

const ReviewVideoCard = ({
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
}) => (
  <Dialog>
    <DialogTrigger asChild>
      <button type="button" className="mt-4 block w-full text-left">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/30 transition hover:border-primary/35">
          <div className="relative aspect-video">
            <img
              src={posterSrc}
              alt={title}
              className="h-full w-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="rounded-full border border-white/35 bg-black/40 p-3 text-white shadow-[0_10px_30px_rgba(0,0,0,0.45)] backdrop-blur-sm">
                <Play className="h-5 w-5 fill-current" />
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
    <DialogContent className="max-w-[420px] border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(10,10,10,0.98))] p-3 text-white shadow-[0_30px_120px_rgba(0,0,0,0.6)] sm:p-4">
      <DialogHeader>
        <DialogTitle className="text-xl text-white">{title}</DialogTitle>
        <DialogDescription className="text-white/65">{description}</DialogDescription>
      </DialogHeader>
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-black shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
        <video
          className="aspect-[9/16] h-auto w-full bg-black object-cover"
          controls
          playsInline
          preload="metadata"
          autoPlay
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
      </div>
    </DialogContent>
  </Dialog>
);

const G700Customizer = () => {
  const configuratorRef = useRef<HTMLElement | null>(null);
  const imageSwapRequestRef = useRef(0);
  const [selectedColorId, setSelectedColorId] = useState<ColorOption["id"] | null>(null);
  const [selectedFinish, setSelectedFinish] = useState<Finish | null>(null);
  const [selectedTrimPackage, setSelectedTrimPackage] = useState<TrimPackage | null>(null);
  const [displayedImage, setDisplayedImage] = useState<string>(
    () => getColor("black").finishes.gloss.standard,
  );
  const [showVideoOverlay, setShowVideoOverlay] = useState(true);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const hasConfiguredBuild = Boolean(selectedColorId && selectedFinish && selectedTrimPackage);
  const activeColor = getColor(selectedColorId ?? "black");
  const activeFinish = selectedFinish ?? "gloss";
  const activeTrimPackage = selectedTrimPackage ?? "standard";
  const activeImage = activeColor.finishes[activeFinish][activeTrimPackage];
  const summary = hasConfiguredBuild
    ? `${activeColor.label} / ${activeFinish} / ${formatTrimPackage(activeTrimPackage)}`
    : "No build selected yet";
  const quoteUrl = buildWhatsAppUrl(
    [
      "Hi Sean, I want a quote for this G700 customization.",
      "",
      `Colour: ${hasConfiguredBuild ? activeColor.label : "Not selected yet"}`,
      `Finish: ${hasConfiguredBuild ? activeFinish : "Not selected yet"}`,
      `Trim package: ${hasConfiguredBuild ? formatTrimPackage(activeTrimPackage) : "Not selected yet"}`,
      "",
      `Name: ${name || "Not provided yet"}`,
      `WhatsApp: ${phone || "Not provided yet"}`,
      `Vehicle: ${vehicle || "G700 enquiry"}`,
      `Notes: ${notes || "Please send pricing and your recommended PPF or paint package."}`,
    ].join("\n"),
  );
  const quickWhatsappUrl = buildWhatsAppUrl(
    hasConfiguredBuild
      ? `Hi Sean, I am interested in customizing a G700 with PPF and trim options.\n\nCurrent build: ${summary}\n\nPlease send pricing and the best next step.`
      : "Hi Sean, I am interested in customizing a G700 with PPF and trim options. Please send pricing and the best next step.",
  );

  useEffect(() => {
    if (activeImage === displayedImage) return;

    const requestId = ++imageSwapRequestRef.current;
    const nextImage = new Image();
    nextImage.src = activeImage;

    const commitSwap = () => {
      if (imageSwapRequestRef.current === requestId) {
        setDisplayedImage(activeImage);
      }
    };

    if (nextImage.complete) {
      commitSwap();
      return;
    }

    nextImage.onload = commitSwap;
    nextImage.onerror = commitSwap;

    return () => {
      nextImage.onload = null;
      nextImage.onerror = null;
    };
  }, [activeImage, displayedImage]);

  useEffect(() => {
    updatePageSEO("services", {
      title: "G700 PPF & Customization Dubai | Grand Touch Auto",
      description:
        "Use the G700 configurator to compare gloss or matte PPF, blackout gloss-black trim, paint-matched details, and colour PPF directions before requesting your quote from Grand Touch Auto in Dubai.",
      keywords:
        "G700 PPF Dubai, G700 customizer Dubai, G700 blackout package Dubai, G700 paint matched package Dubai, G700 matte PPF Dubai, G700 gloss PPF Dubai, G700 colour PPF Dubai",
      ogTitle: "G700 PPF & Customization Dubai",
      ogDescription:
        "Compare colours, gloss or matte PPF, blackout gloss-black trim, and paint-matched options on a G700, then request your quote directly on WhatsApp.",
      url: "https://www.grandtouchauto.ae/g700-customizer",
    });

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqItems.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    });
    script.setAttribute("data-page-schema", "g700-customizer-faq");
    document.head.appendChild(script);

    colorOptions.forEach((option) => {
      (["gloss", "matte"] as Finish[]).forEach((finish) => {
        trimPackageOptions.forEach(({ id: trimPackage }) => {
          const image = new Image();
          image.src = option.finishes[finish][trimPackage];
        });
      });
    });

    return () => {
      const existingScript = document.querySelector('script[data-page-schema="g700-customizer-faq"]');
      if (existingScript) document.head.removeChild(existingScript);
    };
  }, []);

  const scrollToConfigurator = () =>
    configuratorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  const openQuoteModal = () => setQuoteOpen(true);
  const startConfigurator = () => {
    setSelectedColorId("black");
    setSelectedFinish("gloss");
    setSelectedTrimPackage("standard");
    setShowVideoOverlay(false);
  };

  const ensureSelectionDefaults = () => {
    if (!selectedColorId) setSelectedColorId("black");
    if (!selectedFinish) setSelectedFinish("gloss");
    if (!selectedTrimPackage) setSelectedTrimPackage("standard");
  };

  const handleColorSelect = (colorId: ColorOption["id"]) => {
    ensureSelectionDefaults();
    setShowVideoOverlay(false);
    setSelectedColorId(colorId);
  };

  const handleFinishSelect = (finish: Finish) => {
    ensureSelectionDefaults();
    setShowVideoOverlay(false);
    setSelectedFinish(finish);
  };

  const handleTrimPackageSelect = (trimPackage: TrimPackage) => {
    ensureSelectionDefaults();
    setShowVideoOverlay(false);
    setSelectedTrimPackage(trimPackage);
  };

  const applyPreset = (preset: PresetBuild) => {
    startConfigurator();
    setSelectedColorId(preset.colorId);
    setSelectedFinish(preset.finish);
    setSelectedTrimPackage(preset.trimPackage);
    scrollToConfigurator();
  };

  const handleQuoteSubmit = () => {
    if (!name.trim() || !phone.trim()) {
      setError("Add your name and WhatsApp number so we can send the right quote back.");
      setQuoteOpen(true);
      return;
    }
    setError("");
    window.open(quoteUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-[#070707] pb-24 md:pb-0">
      <Navbar sticky={false} />
      <main className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#080808_0%,#060606_38%,#0b0b0b_100%)]" />
        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:72px_72px]" />

        <section className="relative px-4 pb-4 pt-8 sm:px-6 sm:pt-10 lg:px-8 lg:pt-12">
          <div className="container mx-auto max-w-7xl">
            <div className="flex flex-col gap-4 rounded-[26px] border border-white/10 bg-white/[0.03] p-4 text-white backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-3xl">
                <div className="flex flex-wrap gap-2">
                  <Badge className="border-primary/20 bg-primary/15 text-primary hover:bg-primary/15">G700 customization</Badge>
                  <Badge variant="outline" className="border-white/15 bg-white/5 text-white/75">Gloss & matte PPF</Badge>
                  <Badge variant="outline" className="border-white/15 bg-white/5 text-white/75">Blackout + paint matched</Badge>
                  <Badge variant="outline" className="border-white/15 bg-white/5 text-white/75">Colour PPF options</Badge>
                </div>
                <h1 className="mt-3 text-2xl font-bold leading-tight sm:text-3xl">
                  Build your G700 finish before you book
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/68">
                  Compare gloss or matte PPF, switch between standard, blackout, and paint-matched trim, and send the exact direction for pricing. If you want to go further, we can also quote colour PPF and accessories around the same build.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:shrink-0">
                <Button size="lg" className="h-11 rounded-2xl bg-[linear-gradient(180deg,#ffd47a_0%,#f7b52b_52%,#e79a13_100%)] px-5 text-black hover:brightness-105" onClick={scrollToConfigurator}>
                  Start My G700 Build
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <a href={quickWhatsappUrl} target="_blank" rel="noreferrer">
                  <Button size="lg" variant="outline" className="h-11 rounded-2xl border-[#25D366]/35 bg-[#25D366]/10 px-5 text-white hover:bg-[#25D366]/20">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Talk Through My Options
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </section>

        <section ref={configuratorRef} className="relative px-3 py-3 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-7xl">
            <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(10,10,10,0.98))] p-3 shadow-[0_30px_90px_rgba(0,0,0,0.45)] sm:rounded-[36px] sm:p-6">
              <div className="flex flex-col gap-3 border-b border-white/10 pb-3 lg:flex-row lg:items-end lg:justify-between lg:pb-5">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-white/45 sm:text-sm sm:tracking-[0.24em]">Build studio</p>
                  <h2 className="mt-1 text-[2rem] font-bold leading-tight text-white sm:mt-2 sm:text-4xl">Configure the G700 live</h2>
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-white/60 sm:px-4 sm:py-2 sm:text-xs sm:tracking-[0.24em]">
                  {summary}
                </div>
              </div>

              <div className="mt-3 flex flex-col gap-3 lg:mt-5 lg:flex-row lg:items-start lg:gap-4">
                <div className="grid grid-cols-3 gap-2 rounded-[18px] p-1 lg:flex lg:w-[96px] lg:grid-cols-1 lg:flex-col lg:gap-3 lg:overflow-visible lg:rounded-[28px] lg:border lg:border-white/10 lg:bg-white/[0.04] lg:p-4">
                  {colorOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      aria-label={option.label}
                      onClick={() => handleColorSelect(option.id)}
                      className={cn(
                        "group relative flex w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-black/20 px-2 py-2.5 transition duration-300 lg:h-14 lg:w-14 lg:rounded-full lg:border lg:bg-transparent lg:p-0",
                        selectedColorId === option.id
                          ? "border-white/40 bg-white/8 shadow-[0_0_0_1px_rgba(255,255,255,0.3)] lg:border-white lg:bg-transparent lg:shadow-[0_0_0_5px_rgba(255,255,255,0.08)]"
                          : "hover:border-white/30 hover:bg-white/6 lg:border-white/15 lg:bg-transparent lg:hover:border-white/35",
                      )}
                    >
                      <span
                        className="h-8 w-8 rounded-full border border-white/25 sm:h-9 sm:w-9 lg:h-auto lg:w-auto lg:border-0 lg:absolute lg:inset-[5px]"
                        style={{ backgroundColor: option.swatch }}
                      />
                      <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-white/70 lg:hidden">
                        {option.label}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="relative min-w-0 flex-1 overflow-hidden rounded-[24px] bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] lg:rounded-[32px] lg:border lg:border-white/10">
                  <div className="hidden items-center gap-2 border-b border-white/10 px-3 py-2.5 sm:flex sm:px-4 sm:py-3 lg:px-5 lg:py-4">
                    <span className="h-2.5 w-2.5 rounded-full bg-white/35" />
                    <span className="h-2.5 w-2.5 rounded-full bg-white/18" />
                    <span className="h-2.5 w-2.5 rounded-full bg-white/12" />
                  </div>
                  <div className="p-1 sm:p-4 lg:p-6">
                      <div className={cn("relative overflow-hidden rounded-[20px] p-1 sm:rounded-[22px] sm:border sm:p-2.5 lg:rounded-[26px] lg:p-3", activeFinish === "gloss" ? "bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.16),transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(0,0,0,0.32))] sm:border-white/10" : "bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(0,0,0,0.4))] sm:border-white/8")}>
                      <div className="relative aspect-[16/10] rounded-[16px] bg-black/20 sm:rounded-[18px] lg:rounded-[22px]">
                        <div className="absolute inset-x-[12%] bottom-8 h-12 rounded-full bg-black/60 blur-3xl sm:h-16" />
                        <img
                          src={displayedImage}
                          alt={`G700 in ${summary}`}
                          className="relative z-10 h-full w-full object-contain transition-opacity duration-300"
                        />
                        {showVideoOverlay ? (
                          <div className="absolute inset-0 z-20">
                            <video
                              autoPlay
                              loop
                              muted
                              playsInline
                              preload="auto"
                              aria-hidden="true"
                              className="h-full w-full object-cover"
                            >
                              <source
                                src="https://res.cloudinary.com/diw6rekpm/video/upload/v1776162984/hf_20260414_102549_ebf12369-c296-4175-80b5-1fbb8f3f3d97_raj91n.mp4"
                                type="video/mp4"
                              />
                            </video>
                            <div className="absolute inset-0 flex items-center justify-center p-4">
                              <Button
                                size="lg"
                                className="group relative h-14 rounded-2xl border-2 border-black/40 bg-white/10 px-8 text-base font-semibold text-white backdrop-blur-xl shadow-[0_10px_35px_rgba(255,255,255,0.18),inset_0_1px_0_rgba(255,255,255,0.5)] transition-all duration-300 hover:bg-white/16 hover:shadow-[0_14px_40px_rgba(255,255,255,0.24),inset_0_1px_0_rgba(255,255,255,0.65)]"
                                onClick={startConfigurator}
                              >
                                <span className="pointer-events-none absolute inset-[1px] rounded-[15px] bg-[linear-gradient(180deg,rgba(255,255,255,0.26),rgba(255,255,255,0.03))]" />
                                <span className="pointer-events-none absolute -inset-x-4 -inset-y-2 -z-10 rounded-full bg-white/25 blur-xl" />
                                Start the configurator
                                <ArrowRight className="ml-2 h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 rounded-[22px] p-2 lg:w-[300px] lg:shrink-0 lg:gap-4 lg:rounded-[28px] lg:border lg:border-white/10 lg:bg-white/[0.04] lg:p-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-white/45 sm:text-xs sm:tracking-[0.24em]">Finish</p>
                    <div className="mt-2 grid grid-cols-2 gap-2.5 sm:mt-3 sm:gap-3 lg:grid-cols-1">
                      {(["gloss", "matte"] as Finish[]).map((finish) => (
                        <button
                          key={finish}
                          type="button"
                          onClick={() => handleFinishSelect(finish)}
                          className={cn(
                            "rounded-xl border px-3 py-2.5 text-[11px] font-medium uppercase tracking-[0.2em] transition duration-300 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-xs sm:tracking-[0.24em] lg:rounded-[22px] lg:py-4 lg:tracking-[0.35em]",
                            selectedFinish === finish
                              ? "border-white bg-white text-black shadow-[0_12px_35px_rgba(255,255,255,0.18)]"
                              : "border-white/10 bg-black/20 text-white/70 hover:border-white/25 hover:bg-white/10 hover:text-white",
                          )}
                        >
                          {finish}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-white/45 sm:text-xs sm:tracking-[0.24em]">Trim package</p>
                    <div className="mt-2 grid gap-2.5 sm:mt-3 sm:gap-3">
                      {trimPackageOptions.map(({ id: trimPackage, label }) => (
                        <button
                          key={trimPackage}
                          type="button"
                          onClick={() => handleTrimPackageSelect(trimPackage)}
                          className={cn(
                            "rounded-xl border px-3 py-2.5 text-[11px] font-medium uppercase tracking-[0.16em] transition duration-300 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-xs sm:tracking-[0.2em] lg:rounded-[22px] lg:py-4 lg:tracking-[0.23em]",
                            selectedTrimPackage === trimPackage
                              ? "border-[#d96a20] bg-[#d96a20] text-black shadow-[0_12px_35px_rgba(217,106,32,0.28)]"
                              : "border-white/10 bg-black/20 text-white/70 hover:border-white/25 hover:bg-white/10 hover:text-white",
                          )}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-4 rounded-[28px] border border-white/10 bg-black/20 p-4 lg:grid-cols-[1fr_auto_auto] lg:items-end">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-white/45">Ready to price this build?</p>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-white/78 sm:text-base">
                    Send the selected colour, PPF finish, and trim package through now and we will quote the right direction for your G700, including colour PPF or paint advice if you need it.
                  </p>
                </div>
                <Button size="lg" className="h-12 rounded-2xl bg-[linear-gradient(180deg,#ffd47a_0%,#f7b52b_52%,#e79a13_100%)] px-6 text-black hover:brightness-105" onClick={openQuoteModal}>
                  Get My G700 Quote
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="relative px-4 py-8 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-7xl">
            <div className="grid gap-4 md:grid-cols-3">
              {serviceCards.map((item) => (
                <Card key={item.title} className="rounded-[28px] border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(8,8,8,0.96))] p-6 text-white">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-xl font-semibold">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-white/68">{item.body}</p>
                  <Button variant="outline" className="mt-5 rounded-xl border-white/15 bg-white/5 text-white hover:bg-white/10" onClick={openQuoteModal}>
                    Get a Quote
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="relative px-4 py-4 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-7xl">
            <Card className="rounded-[34px] border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(8,8,8,0.98))] p-6 text-white sm:p-8">
              <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-white/45">Colour PPF options</p>
                  <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Want a bigger transformation than the six rendered looks?</h2>
                  <p className="mt-4 text-sm leading-8 text-white/72 sm:text-base">
                    This configurator shows the main G700 directions we already generated, but it is not the limit of what we can build. If you want something more individual, we can also quote gloss or matte colour PPF, selected paintwork, blackout details in gloss black, and paint-matched trim where that route makes more sense.
                  </p>
                  <p className="mt-4 text-sm leading-8 text-white/72 sm:text-base">
                    That means you can start by choosing the look here, then let us guide you toward the best material and finish combination for the exact result you want on the car.
                  </p>
                </div>
                <div className="rounded-[28px] border border-white/10 bg-black/25 p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-white/45">What we can quote around this build</p>
                  <div className="mt-4 space-y-3 text-sm leading-6 text-white/76">
                    {[
                      "Gloss colour PPF options",
                      "Matte colour PPF options",
                      "Piano-black blackout details",
                      "Paint-matched trim and selected panels",
                      "Spoilers, lights, and other accessories quoted separately",
                    ].map((item) => (
                      <div key={item} className="flex items-start gap-3">
                        <Check className="mt-1 h-4 w-4 shrink-0 text-primary" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 flex flex-col gap-3">
                    <Button className="h-12 rounded-2xl bg-[linear-gradient(180deg,#ffd47a_0%,#f7b52b_52%,#e79a13_100%)] text-black hover:brightness-105" onClick={openQuoteModal}>
                      Get a Quote
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    <a href={quickWhatsappUrl} target="_blank" rel="noreferrer">
                      <Button variant="outline" className="h-12 w-full rounded-2xl border-[#25D366]/35 bg-[#25D366]/10 text-white hover:bg-[#25D366]/20">
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Ask About Colour PPF
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </section>

        <section className="relative px-4 py-10 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-7xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-white/45">Build inspiration</p>
                <h2 className="mt-2 text-3xl font-bold text-white sm:text-4xl">Popular G700 customization directions</h2>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-white/68 sm:text-base">
                  Use these presets when you want to show a customer how the G700 changes with gloss or matte PPF, blackout, and paint-matched trim. Load any direction, tweak it, and send it for a quote when you are ready.
                </p>
              </div>
              <a href={quickWhatsappUrl} target="_blank" rel="noreferrer">
                <Button variant="outline" className="rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Ask About These Looks
                </Button>
              </a>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {presetBuilds.map((preset) => (
                <Card key={preset.title} className="overflow-hidden rounded-[28px] border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(8,8,8,0.98))] text-white">
                  <div className="aspect-[16/10] overflow-hidden bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_45%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(0,0,0,0.4))] px-3 py-3">
                    <img src={getColor(preset.colorId).finishes[preset.finish][preset.trimPackage]} alt={preset.title} className="h-full w-full object-contain" loading="lazy" />
                  </div>
                  <div className="p-5">
                    <h3 className="text-xl font-semibold">{preset.title}</h3>
                    <p className="mt-1 text-sm text-white/55">{getColor(preset.colorId).label} / {preset.finish} / {formatTrimPackage(preset.trimPackage)}</p>
                    <div className="mt-5 flex gap-3">
                      <Button className="flex-1 rounded-xl bg-white text-black hover:bg-white/90" onClick={() => applyPreset(preset)}>Load This Build</Button>
                      <Button variant="outline" className="rounded-xl border-white/15 bg-white/5 text-white hover:bg-white/10" onClick={openQuoteModal}>Quote</Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="relative px-4 py-6 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-7xl">
            <div className="mb-6">
              <p className="text-sm uppercase tracking-[0.24em] text-white/45">Trust & proof</p>
              <h2 className="mt-2 text-3xl font-bold text-white sm:text-4xl">Real owners, real deliveries, real workshop proof</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-white/68 sm:text-base">
                When a buyer is close to booking, this is the part that helps them trust the finish, the process, and the handover. These review and delivery clips are pulled from the live PPF quote funnel and dropped in here as proof.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3 md:items-stretch">
              <Card className="flex h-full flex-col rounded-[28px] border-[#4285F4]/20 bg-[linear-gradient(180deg,rgba(66,133,244,0.07),rgba(255,255,255,0.02)_22%,rgba(255,255,255,0.02)_100%)] p-4 text-white sm:p-6">
                <div className="flex items-center gap-2">
                  <GoogleWordmark />
                  <span className="text-sm font-semibold text-white">Reviews</span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <TrustStars />
                  <span className="text-sm font-semibold text-white">5-star review</span>
                </div>
                <h3 className="mt-4 text-xl font-semibold text-white">Mark | Zeekr 001</h3>
                <p className="mt-2 text-sm leading-7 text-white/68">
                  "Top-notch service. Sean picked my car up from Abu Dhabi, kept the whole process easy, and the finish came out amazing."
                </p>
                <div className="mt-auto">
                  <ReviewVideoCard
                    title="Mark's Zeekr 001"
                    description="A quick customer delivery clip showing the finished Zeekr 001 and the level of service behind it."
                    videoSrc="https://res.cloudinary.com/diw6rekpm/video/upload/q_auto/f_auto/v1775562589/Mark_Zeekr_conzdp.mp4"
                    posterSrc="/mark-zeekr-001.png"
                    eyebrow="Real owner handover"
                  />
                </div>
              </Card>

              <Card className="flex h-full flex-col rounded-[28px] border-[#f59e0b]/20 bg-[linear-gradient(180deg,rgba(245,158,11,0.08),rgba(255,255,255,0.02)_24%,rgba(255,255,255,0.02)_100%)] p-4 text-white sm:p-6">
                <div className="flex items-center gap-3">
                  <img
                    src="/stek-logo.webp"
                    alt="STEK official brand logo"
                    className="h-6 w-auto object-contain"
                    loading="lazy"
                  />
                  <span className="text-xs uppercase tracking-[0.18em] text-[#f6c76d]">
                    PPF & finish proof
                  </span>
                </div>
                <h3 className="mt-4 text-xl font-semibold text-white">Recent Grand Touch G700 work</h3>
                <p className="mt-2 text-sm leading-7 text-white/68">
                  Recent G700 installs showing gloss and matte PPF directions, custom trim packages, and the sort of finish standard Grand Touch is willing to hand back to a paying customer.
                </p>
                <div className="mt-auto">
                  <ReviewVideoCard
                    title="Recent Grand Touch G700 work"
                    description="A multi-car G700 showcase featuring gloss and matte PPF directions, blackout details, and custom finish work completed by Grand Touch."
                    videoSrc="https://res.cloudinary.com/diw6rekpm/video/upload/v1775556526/Jetour_EDIT_yi001t.mp4"
                    posterSrc="/g700-orange.png"
                    eyebrow="Recent G700 builds"
                  />
                </div>
              </Card>

              <Card className="flex h-full flex-col rounded-[28px] border-[#5f8f79]/20 bg-[linear-gradient(180deg,rgba(95,143,121,0.09),rgba(255,255,255,0.02)_24%,rgba(255,255,255,0.02)_100%)] p-4 text-white sm:p-6">
                <div className="mt-4 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9dc3b0]">
                      Colour PPF proof
                    </p>
                    <h3 className="text-xl font-semibold text-white">Matt Cooper</h3>
                    <p className="text-xs uppercase tracking-[0.18em] text-[#9dc3b0]">
                      Jetour T2 | Matte green colour PPF
                    </p>
                  </div>
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                    <img
                      src="/matt-cooper-face.png"
                      alt="Matt Cooper"
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                </div>
                <p className="mt-2 text-sm leading-7 text-white/68">
                  "I left my Jetour T2 with Sean for a matte green colour PPF transformation and could not be happier. Great finish, smooth process, and a team I was happy to trust with my car."
                </p>
                <div className="mt-auto">
                  <ReviewVideoCard
                    title="Matt Cooper's Jetour T2"
                    description="A quick delivery clip showing Matt Cooper's matte green Jetour T2 colour PPF transformation."
                    videoSrc="https://res.cloudinary.com/diw6rekpm/video/upload/q_auto/f_auto/v1775563747/0407_xyaggw.mp4"
                    posterSrc="/matt-cooper-t2.png"
                    eyebrow="Real finished handover"
                  />
                </div>
              </Card>
            </div>
          </div>
        </section>

        <section className="relative border-y border-white/10 bg-black/20 px-4 py-14 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center">
              <p className="text-sm uppercase tracking-[0.24em] text-white/45">Questions owners ask</p>
              <h2 className="mt-2 text-3xl font-bold text-white sm:text-4xl">G700 PPF, trim, and customization explained</h2>
              <p className="mx-auto mt-3 max-w-3xl text-sm leading-7 text-white/68 sm:text-base">
                Everything below is here to help a buyer understand the options clearly before you move them into a quote.
              </p>
            </div>

            <Card className="mt-8 rounded-[28px] border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(8,8,8,0.96))] p-4 text-white sm:p-6">
              <Accordion type="single" collapsible className="w-full">
                {faqItems.map((item, index) => (
                  <AccordionItem
                    key={item.question}
                    value={`faq-${index}`}
                    className="border-b border-white/10 last:border-b-0"
                  >
                    <AccordionTrigger className="py-4 text-left text-base font-semibold text-white hover:no-underline">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="pb-4 text-sm leading-7 text-white/68">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </Card>

            <Card className="mt-8 rounded-[34px] border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(8,8,8,0.98))] p-6 text-white sm:p-8">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="border-white/15 bg-white/5 text-white/70">G700 customization</Badge>
                <Badge variant="outline" className="border-white/15 bg-white/5 text-white/70">PPF + paint</Badge>
                <Badge variant="outline" className="border-white/15 bg-white/5 text-white/70">Colour PPF options</Badge>
              </div>
              <h2 className="mt-5 text-3xl font-bold sm:text-4xl">Planning your G700 customization in Dubai</h2>
              <div className="mt-6 grid gap-8 lg:grid-cols-2">
                <div>
                  <p className="text-sm leading-8 text-white/72 sm:text-base">
                    Most G700 enquiries start with finish. Gloss PPF keeps the look clean, reflective, and showroom-sharp. Matte PPF changes the personality of the car completely and gives the body a more aggressive, stealthier finish. The configurator makes that comparison visual straight away, which helps buyers choose with more confidence.
                  </p>
                  <p className="mt-4 text-sm leading-8 text-white/72 sm:text-base">
                    From there, the trim package changes the final story again. Standard keeps the factory trim direction, blackout brings in that piano-black contrast, and paint matched makes the whole build feel more integrated and premium.
                  </p>
                </div>
                <div>
                  <p className="text-sm leading-8 text-white/72 sm:text-base">
                    If the customer wants something beyond these six looks, that is where colour PPF, selected paintwork, and accessories come in. We can quote those separately around the same build and guide them toward the cleanest way to achieve the final result.
                  </p>
                  <div className="mt-4 space-y-2 text-sm">
                    <Link to="/ppf-cost-calculator" className="block text-primary hover:underline">PPF cost calculator</Link>
                    <Link to="/blog/matte-vs-gloss-ppf-dubai" className="block text-primary hover:underline">Matte vs gloss PPF guide</Link>
                    <Link to="/contact" className="block text-primary hover:underline">Contact Grand Touch Auto</Link>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </section>

        <section className="relative px-4 pb-20 pt-8 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-5xl">
            <div className="rounded-[34px] border border-primary/20 bg-[radial-gradient(circle_at_top,rgba(245,181,43,0.16),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(10,10,10,0.98))] px-6 py-10 text-center text-white shadow-[0_28px_90px_rgba(0,0,0,0.35)] sm:px-10 sm:py-12">
              <div className="mx-auto flex max-w-max items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/65">
                <Star className="h-3.5 w-3.5 text-primary" />
                G700 PPF + customization
              </div>
              <h2 className="mt-5 text-[2rem] font-bold leading-tight sm:text-5xl">Ready to turn this G700 build into a quote?</h2>
              <p className="mx-auto mt-4 max-w-3xl text-sm leading-7 text-white/68 sm:text-base">
                Send the build through with the chosen PPF finish and trim package, and tell us if you also want colour PPF, paint, or accessories included in the final recommendation.
              </p>
              <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                <Button size="lg" className="h-12 rounded-2xl bg-[linear-gradient(180deg,#ffd47a_0%,#f7b52b_52%,#e79a13_100%)] px-6 text-black hover:brightness-105" onClick={openQuoteModal}>
                  Get My Quote
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <a href={quickWhatsappUrl} target="_blank" rel="noreferrer">
                  <Button size="lg" variant="outline" className="h-12 rounded-2xl border-[#25D366]/35 bg-[#25D366]/10 px-6 text-white hover:bg-[#25D366]/20">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Talk to Sean on WhatsApp
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[rgba(8,8,8,0.88)] p-2.5 backdrop-blur-xl md:hidden">
        <div className="flex gap-2">
          <Button className="h-11 flex-1 rounded-xl bg-white text-black hover:bg-white/90" onClick={openQuoteModal}>
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Get a Quote
          </Button>
          <a href={quickWhatsappUrl} target="_blank" rel="noreferrer" className="flex-1">
            <Button className="h-11 w-full rounded-xl bg-[#25D366] text-white hover:bg-[#1ebe5d]">
              <MessageCircle className="mr-2 h-4 w-4" />
              WhatsApp
            </Button>
          </a>
        </div>
      </div>
      <Dialog open={quoteOpen} onOpenChange={setQuoteOpen}>
        <DialogContent className="w-[min(92vw,520px)] max-w-none rounded-[24px] border-white/10 bg-[linear-gradient(180deg,rgba(30,30,30,0.96),rgba(8,8,8,0.98))] p-0 text-white shadow-[0_32px_100px_rgba(0,0,0,0.55)]">
          <div className="p-6 sm:p-7">
            <DialogHeader>
              <DialogTitle className="text-2xl text-white">Get a quote for your G700 customization</DialogTitle>
              <DialogDescription className="text-white/60">
                We will include the selected colour, PPF finish, and trim package automatically.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-5 rounded-[22px] border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-white/45">Selected build</p>
              <p className="mt-2 text-lg font-semibold text-white">{summary}</p>
              <div className="mt-4 grid gap-2 text-sm text-white/68">
                <div className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />Your chosen look is clear before we price it.</div>
                <div className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />PPF finish, blackout, or paint-matched trim are included in the enquiry.</div>
                <div className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />Add colour PPF or accessory requests in the notes and we will include them.</div>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" className="h-12 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-white/35" />
              <Input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="WhatsApp number" className="h-12 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-white/35" />
              <Input value={vehicle} onChange={(event) => setVehicle(event.target.value)} placeholder="Vehicle details" className="h-12 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-white/35" />
              <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Anything else you want priced or explained?" className="min-h-[120px] rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-white/35" />
            </div>

            {error ? <p className="mt-3 text-sm text-[#ffb37a]">{error}</p> : null}

            <div className="mt-5 flex flex-col gap-3">
              <Button size="lg" className="h-12 rounded-2xl bg-[linear-gradient(180deg,#ffd47a_0%,#f7b52b_52%,#e79a13_100%)] text-black hover:brightness-105" onClick={handleQuoteSubmit}>
                Request My Quote on WhatsApp
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <div className="pointer-events-none fixed bottom-0 right-0 z-40 hidden overflow-visible md:block">
        <a
          href={quickWhatsappUrl}
          target="_blank"
          rel="noreferrer"
          aria-label="Ask Sean on WhatsApp about this G700 build"
          className="group pointer-events-auto absolute bottom-0 right-6 z-0 block cursor-pointer"
        >
          <img
            src="/chat-to-sean.png"
            alt=""
            className="h-auto w-44 max-w-[min(260px,46vw)] origin-bottom-right object-contain object-bottom-right transition-transform duration-300 ease-out group-hover:scale-[1.18]"
            loading="lazy"
          />
        </a>
      </div>
      <Footer />
    </div>
  );
};

export default G700Customizer;
