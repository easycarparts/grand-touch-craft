import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Maximize2,
  MessageCircle,
  Play,
  SlidersHorizontal,
  Star,
} from "lucide-react";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
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
import {
  captureLeadSnapshot,
  createFunnelTrackingContext,
  trackFunnelEvent,
} from "@/lib/funnel-analytics";
import { updatePageSEO } from "@/lib/seo";
import { trackTikTokSubmitForm } from "@/lib/tiktok-pixel";
import { cn } from "@/lib/utils";

const G700_FUNNEL_NAME = "g700_customizer";
const G700_LANDING_PAGE_VARIANT = "g700-customizer";
const G700_VEHICLE_MAKE = "Jetour";
const G700_VEHICLE_MODEL = "G700";

type Finish = "gloss" | "matte";
type TrimPackage = "standard" | "blackout" | "paint-matched";

type ColorOption = {
  id: string;
  label: string;
  swatch: string;
  finishes: Record<Finish, Record<TrimPackage, string>>;
};

type AccessoryItem = {
  title: string;
  description: string;
  image: string;
  imageClassName?: string;
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

const FINISH_FROM_PRICES: Record<Finish, number> = {
  gloss: 9990,
  matte: 10490,
};

const TRIM_FROM_PRICES: Record<TrimPackage, number> = {
  standard: 0,
  blackout: 3000,
  "paint-matched": 4000,
};

const ACCESSORY_PRICE_MAP: Record<string, number> = {
  "G700 Rear Roof Spoiler": 540,
  "G700 LED Roof Lights (4 Lenses)": 1450,
  "G700 2 Lens Front Roof Light Bar": 1400,
  "G700 Side Ladder Panel": 950,
  "G700 Side Tool Box": 870,
  "G700 Mudflaps + Wheel Arch Liner Kit": 440,
  "G700 Widebody Fender Flare Kit": 1380,
  "G700 Roof Rack": 1450,
  "G700 Hood Scoop + Vent Trim Set": 580,
  "G700 Rear Bumper Sill Guard Set": 440,
  "G700 Door Sill Scuff Plate Set": 440,
  "G700 Floor Mats (Rubber + Fabric) 5 Seats": 580,
  "G700 Double Layer Floor Mats 5 Seats": 580,
  "G700 Floor Mats Full Set (6 Seats)": 660,
};

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

const accessoryItems: AccessoryItem[] = [
  {
    title: "G700 Rear Roof Spoiler",
    description:
      "Rear roof spoiler upgrade that gives the G700 a sportier silhouette with vehicle-specific fitment.",
    image: new URL("../../G700 Accessories/web/jetour-g700-rear-roof-spoiler.jpg", import.meta.url).href,
  },
  {
    title: "G700 LED Roof Lights (4 Lenses)",
    description:
      "Roofline LED light module trim with 4-lens design for a stronger off-road aesthetic.",
    image: new URL("../../G700 Accessories/web/jetour-g700-front-led-light-bar-trim.jpg", import.meta.url).href,
  },
  {
    title: "G700 2 Lens Front Roof Light Bar",
    description:
      "Gloss black lighting trim panel with integrated lens-style detailing on the front end.",
    image: new URL("../../G700 Accessories/web/jetour-g700-gloss-black-front-grille-light-trim.jpg", import.meta.url).href,
  },
  {
    title: "G700 Side Ladder Panel",
    description:
      "Side ladder style accessory for utility-focused builds with a rugged OEM-inspired look.",
    image: new URL("../../G700 Accessories/web/jetour-g700-locking-side-ladder-panel.jpg", import.meta.url).href,
  },
  {
    title: "G700 Side Tool Box",
    description:
      "Compact side tool box accessory for secure storage and quick access to essentials.",
    image: new URL("../../G700 Accessories/web/jetour-g700-jetour-key-cover.jpg", import.meta.url).href,
    imageClassName: "object-cover scale-100",
  },
  {
    title: "G700 Mudflaps + Wheel Arch Liner Kit",
    description:
      "Mud flap and wheel-arch protection kit that helps reduce road spray and stone chips.",
    image: new URL("../../G700 Accessories/web/jetour-g700-mud-flaps-wheel-arch-liners-kit.jpg", import.meta.url).href,
  },
  {
    title: "G700 Widebody Fender Flare Kit",
    description:
      "Wide arch over-fender kit designed to give the G700 a tougher stance with broader wheel-arch coverage.",
    image: new URL("../../G700 Accessories/web/jetour-g700-widebody-fender-flare-kit.jpg", import.meta.url).href,
  },
  {
    title: "G700 Roof Rack",
    description:
      "Roof rack panel accessory designed to add practical cargo utility with a clean OEM-style look.",
    image: new URL("../../G700 Accessories/web/jetour-g700-tailgate-storage-rack-panel.jpg", import.meta.url).href,
  },
  {
    title: "G700 Bull Bar",
    description:
      "Small bull bar with hitch points, designed for a rugged rear setup and recovery-ready styling.",
    image: new URL("../../G700 Accessories/web/jetour-g700-roof-rack-crossbar-frame.jpg", import.meta.url).href,
  },
  {
    title: "G700 Lower Skid Plate",
    description:
      "Heavy-duty lower skid plate designed to protect the underside while keeping an aggressive off-road look.",
    image: new URL("../../G700 Accessories/web/jetour-g700-lower-skid-plate.jpg", import.meta.url).href,
  },
  {
    title: "G700 Side Steps (Set)",
    description:
      "Running board side step set that improves entry and exit comfort while enhancing side profile.",
    image: new URL("../../G700 Accessories/web/jetour-g700-side-steps-running-boards.jpg", import.meta.url).href,
  },
  {
    title: "G700 Hood Scoop + Vent Trim Set",
    description:
      "Gloss black trim package for hood and vent detailing for a bolder front-end appearance.",
    image: new URL("../../G700 Accessories/web/jetour-g700-gloss-black-hood-scoop-vent-trims.jpg", import.meta.url).href,
  },
  {
    title: "G700 Rear Bumper Sill Guard Set",
    description:
      "Rear entry sill guard trim pieces to help protect loading zones from scratches and scuffs.",
    image: new URL("../../G700 Accessories/web/jetour-g700-rear-bumper-sill-guard-set.jpg", import.meta.url).href,
  },
  {
    title: "G700 Door Sill Scuff Plate Set",
    description:
      "Door sill scuff plate kit to protect threshold paintwork and keep entry zones cleaner.",
    image: new URL("../../G700 Accessories/web/jetour-g700-door-sill-scuff-plate-set.jpg", import.meta.url).href,
  },
  {
    title: "G700 Floor Mats (Rubber + Fabric) 5 Seats",
    description:
      "Premium 3D rubber floor mat set designed for full-cabin coverage and easy cleaning.",
    image: new URL("../../G700 Accessories/web/jetour-g700-3d-rubber-floor-mats-full-set.jpg", import.meta.url).href,
  },
  {
    title: "G700 Double Layer Floor Mats 5 Seats",
    description:
      "Double-layer floor mat set for 5-seat G700 layout, combining durable coverage with a premium carpet finish.",
    image: new URL("../../G700 Accessories/web/jetour-g700-3d-carpet-floor-mats-set.jpg", import.meta.url).href,
  },
  {
    title: "G700 Floor Mats Full Set (6 Seats)",
    description:
      "Textured full-coverage floor liner set for practical interior protection in daily use.",
    image: new URL("../../G700 Accessories/web/jetour-g700-textured-floor-liner-full-set.jpg", import.meta.url).href,
  },
  {
    title: "G700 Cup Holder Silicone Inserts",
    description:
      "Multi-piece center console insert kit that adds color-accent styling and surface protection.",
    image: new URL("../../G700 Accessories/web/jetour-g700-center-console-cup-holder-inserts.jpg", import.meta.url).href,
  },
  {
    title: "G700 Seat Back Folding Table Trays",
    description:
      "Foldable seat-back table trays for rear-passenger utility on daily drives and long trips.",
    image: new URL("../../G700 Accessories/web/jetour-g700-seat-back-folding-table-trays.jpg", import.meta.url).href,
  },
  {
    title: "G700 Wireless Charging Silicone Pads",
    description:
      "Seat-back protector panel set designed to reduce scuffing from rear passengers and cargo.",
    image: new URL("../../G700 Accessories/web/jetour-g700-seat-back-kick-protector-panels.jpg", import.meta.url).href,
  },
  {
    title: "G700 Key Cover",
    description:
      "Protective key cover accessory designed for a cleaner look and everyday key protection.",
    image: new URL("../../G700 Accessories/web/jetour-g700-keychain-set.jpg", import.meta.url).href,
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

const formatAED = (value: number) => `${value.toLocaleString("en-US")} AED`;

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
  const quoteCardRef = useRef<HTMLDivElement | null>(null);
  const accessoriesSectionRef = useRef<HTMLElement | null>(null);
  const accessoriesQuoteRef = useRef<HTMLDivElement | null>(null);
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
  const [error, setError] = useState("");
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [leadSaveWarning, setLeadSaveWarning] = useState<string | null>(null);
  const [selectedAccessories, setSelectedAccessories] = useState<string[]>([]);
  const lastTrackedContactSignatureRef = useRef<string | null>(null);
  const hasTrackedPricingViewRef = useRef(false);
  const hasTrackedBuildStartedRef = useRef(false);

  const funnelContext = useMemo(
    () =>
      createFunnelTrackingContext({
        funnelName: G700_FUNNEL_NAME,
        landingPageVariant: G700_LANDING_PAGE_VARIANT,
      }),
    [],
  );

  const trackEvent = useCallback(
    (
      eventName: string,
      payload: Record<string, unknown> = {},
      options?: {
        metaStandardEvent?: "PageView" | "Lead" | "Contact";
        metaPayload?: Record<string, unknown>;
        privatePayload?: Record<string, unknown>;
      },
    ) => {
      trackFunnelEvent({
        eventName,
        context: funnelContext,
        payload,
        privatePayload: options?.privatePayload,
        metaStandardEvent: options?.metaStandardEvent,
        metaPayload: options?.metaPayload,
      });
    },
    [funnelContext],
  );

  const trackBuildStartedOnce = useCallback(() => {
    if (hasTrackedBuildStartedRef.current) return;
    hasTrackedBuildStartedRef.current = true;
    trackEvent("g700_build_started");
  }, [trackEvent]);

  const [includeConfiguratorInAccessoriesTotal, setIncludeConfiguratorInAccessoriesTotal] =
    useState(true);
  const [isConfiguratorInView, setIsConfiguratorInView] = useState(false);
  const [isQuoteCardInView, setIsQuoteCardInView] = useState(false);
  const [isAccessoriesSectionInView, setIsAccessoriesSectionInView] = useState(false);
  const [isAccessoriesQuoteInView, setIsAccessoriesQuoteInView] = useState(false);

  const hasConfiguredBuild = Boolean(selectedColorId && selectedFinish && selectedTrimPackage);
  const hasAnySelection = Boolean(selectedColorId || selectedFinish || selectedTrimPackage);
  const stepsCompleted =
    (selectedColorId ? 1 : 0) + (selectedFinish ? 1 : 0) + (selectedTrimPackage ? 1 : 0);
  const activeColor = getColor(selectedColorId ?? "black");
  const activeFinish = selectedFinish ?? "gloss";
  const activeTrimPackage = selectedTrimPackage ?? "standard";
  const activeImage = activeColor.finishes[activeFinish][activeTrimPackage];
  const summary = hasConfiguredBuild
    ? `${activeColor.label} / ${activeFinish} / ${formatTrimPackage(activeTrimPackage)}`
    : "No build selected yet";
  const selectedFinishForPricing = selectedFinish ?? "gloss";
  const selectedTrimForPricing = selectedTrimPackage ?? "standard";
  const buildFromPrice =
    FINISH_FROM_PRICES[selectedFinishForPricing] + TRIM_FROM_PRICES[selectedTrimForPricing];
  const selectedAccessoryDetails = selectedAccessories.map((title) => ({
    title,
    price: ACCESSORY_PRICE_MAP[title],
  }));
  const selectedAccessoryPricedTotal = selectedAccessoryDetails.reduce(
    (total, item) => total + (item.price ?? 0),
    0,
  );
  const selectedAccessoryPriceOnRequestCount = selectedAccessoryDetails.filter(
    (item) => item.price === undefined,
  ).length;
  const configuratorIncludedInTotal = includeConfiguratorInAccessoriesTotal && hasConfiguredBuild;
  const grandTotal =
    selectedAccessoryPricedTotal + (configuratorIncludedInTotal ? buildFromPrice : 0);

  const nextStepLabel = useMemo(() => {
    if (!selectedColorId) return "Pick your colour";
    if (!selectedFinish) return "Gloss or matte";
    if (!selectedTrimPackage) return "Choose your trim";
    return "Get my G700 quote";
  }, [selectedColorId, selectedFinish, selectedTrimPackage]);

  const quoteUrl = buildWhatsAppUrl(
    [
      "Hi Sean, I just submitted my G700 customization quote request.",
      "",
      `Vehicle: Jetour G700`,
      `Colour: ${hasConfiguredBuild ? activeColor.label : "Not selected yet"}`,
      `Finish: ${hasConfiguredBuild ? activeFinish : "Not selected yet"}`,
      `Trim package: ${hasConfiguredBuild ? formatTrimPackage(activeTrimPackage) : "Not selected yet"}`,
      hasConfiguredBuild ? `Build from: ${formatAED(buildFromPrice)}` : "",
      selectedAccessories.length
        ? `\nAccessories (${selectedAccessories.length}):\n${selectedAccessoryDetails
            .map(
              (item, index) =>
                `${index + 1}. ${item.title}${item.price ? ` - ${formatAED(item.price)}` : " - Price on request"}`,
            )
            .join("\n")}`
        : "",
      grandTotal > 0 ? `\nEstimated total from: ${formatAED(grandTotal)}` : "",
      "",
      `Name: ${name || "Not provided"}`,
      `WhatsApp: ${phone || "Not provided"}`,
    ]
      .filter(Boolean)
      .join("\n"),
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
        "Compare gloss or matte PPF, blackout or paint-matched trim, accessories, and pricing direction for your G700 before you request a quote in Dubai.",
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

  useEffect(() => {
    trackEvent("page_view_g700_customizer", { pathname: funnelContext.pathname }, {
      metaStandardEvent: "PageView",
    });
  }, [funnelContext.pathname, trackEvent]);

  useEffect(() => {
    if (!hasConfiguredBuild) return;
    if (hasTrackedPricingViewRef.current) return;
    hasTrackedPricingViewRef.current = true;
    trackEvent("g700_pricing_viewed", {
      build_from_price: buildFromPrice,
      color_id: selectedColorId,
      finish: selectedFinish,
      trim_package: selectedTrimPackage,
    });
  }, [
    buildFromPrice,
    hasConfiguredBuild,
    selectedColorId,
    selectedFinish,
    selectedTrimPackage,
    trackEvent,
  ]);

  useEffect(() => {
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    if (!trimmedName || trimmedPhone.length < 6) return;

    const signature = `${trimmedName}|${trimmedPhone}`;
    if (lastTrackedContactSignatureRef.current === signature) return;

    const timeoutId = window.setTimeout(() => {
      if (lastTrackedContactSignatureRef.current === signature) return;
      lastTrackedContactSignatureRef.current = signature;

      trackEvent(
        "lead_contact_captured",
        { funnel: G700_FUNNEL_NAME, configured: hasConfiguredBuild },
        {
          privatePayload: {
            lead_name: trimmedName,
            lead_phone: trimmedPhone,
          },
        },
      );

      void captureLeadSnapshot({
        snapshotType: "contact",
        context: funnelContext,
        fullName: trimmedName,
        phone: trimmedPhone,
        vehicleMake: G700_VEHICLE_MAKE,
        vehicleModel: G700_VEHICLE_MODEL,
        payload: {
          funnel: G700_FUNNEL_NAME,
          configured: hasConfiguredBuild,
          color_id: selectedColorId ?? null,
          finish: selectedFinish ?? null,
          trim_package: selectedTrimPackage ?? null,
          build_summary: summary,
          accessories_count: selectedAccessories.length,
        },
      });
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [
    funnelContext,
    hasConfiguredBuild,
    name,
    phone,
    selectedAccessories.length,
    selectedColorId,
    selectedFinish,
    selectedTrimPackage,
    summary,
    trackEvent,
  ]);

  useEffect(() => {
    const configuratorNode = configuratorRef.current;
    const quoteNode = quoteCardRef.current;
    const accessoriesNode = accessoriesSectionRef.current;
    const accessoriesQuoteNode = accessoriesQuoteRef.current;

    const observers: IntersectionObserver[] = [];

    if (configuratorNode) {
      const obs = new IntersectionObserver(
        ([entry]) => setIsConfiguratorInView(entry.isIntersecting),
        { threshold: 0.05 },
      );
      obs.observe(configuratorNode);
      observers.push(obs);
    }
    if (quoteNode) {
      const obs = new IntersectionObserver(
        ([entry]) => setIsQuoteCardInView(entry.isIntersecting),
        { threshold: 0.2 },
      );
      obs.observe(quoteNode);
      observers.push(obs);
    }
    if (accessoriesNode) {
      const obs = new IntersectionObserver(
        ([entry]) => setIsAccessoriesSectionInView(entry.isIntersecting),
        { threshold: 0.15 },
      );
      obs.observe(accessoriesNode);
      observers.push(obs);
    }
    if (accessoriesQuoteNode) {
      const obs = new IntersectionObserver(
        ([entry]) => setIsAccessoriesQuoteInView(entry.isIntersecting),
        { threshold: 0.25 },
      );
      obs.observe(accessoriesQuoteNode);
      observers.push(obs);
    }

    return () => {
      observers.forEach((obs) => obs.disconnect());
    };
  }, []);

  const scrollToConfigurator = () =>
    configuratorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  const openQuoteModal = () => {
    trackEvent("g700_quote_modal_opened", {
      configured: hasConfiguredBuild,
      accessory_count: selectedAccessories.length,
    });
    setLeadSubmitted(false);
    setLeadSaveWarning(null);
    setError("");
    setQuoteOpen(true);
  };
  const scrollToAccessoriesQuote = () =>
    accessoriesQuoteRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  const scrollToAccessories = () =>
    accessoriesSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  const jumpToAccessoriesFromQuote = () => {
    setQuoteOpen(false);
    window.requestAnimationFrame(() => {
      scrollToAccessories();
    });
  };

  const startConfigurator = () => {
    setSelectedColorId("black");
    setShowVideoOverlay(false);
    trackBuildStartedOnce();
    trackEvent("g700_color_selected", { color_id: "black", color_label: "Black" });
  };

  const handleColorSelect = (colorId: ColorOption["id"]) => {
    setShowVideoOverlay(false);
    setSelectedColorId(colorId);
    trackBuildStartedOnce();
    trackEvent("g700_color_selected", {
      color_id: colorId,
      color_label: getColor(colorId).label,
    });
  };

  const handleFinishSelect = (finish: Finish) => {
    setShowVideoOverlay(false);
    setSelectedFinish(finish);
    if (!selectedColorId) setSelectedColorId("black");
    trackBuildStartedOnce();
    trackEvent("g700_finish_selected", {
      finish,
      finish_from_price: FINISH_FROM_PRICES[finish],
    });
  };

  const handleTrimPackageSelect = (trimPackage: TrimPackage) => {
    setShowVideoOverlay(false);
    setSelectedTrimPackage(trimPackage);
    if (!selectedColorId) setSelectedColorId("black");
    if (!selectedFinish) setSelectedFinish("gloss");
    trackBuildStartedOnce();
    trackEvent("g700_trim_selected", {
      trim_package: trimPackage,
      trim_label: formatTrimPackage(trimPackage),
      trim_from_price: TRIM_FROM_PRICES[trimPackage],
    });
  };

  const openTrackedWhatsApp = useCallback(
    (placement: string, url: string) => {
      trackEvent(
        "g700_whatsapp_clicked",
        { cta_location: placement, lead_submitted: leadSubmitted },
        {
          metaStandardEvent: "Contact",
          metaPayload: { contact_channel: "whatsapp", cta_location: placement },
        },
      );
      window.open(url, "_blank", "noopener,noreferrer");
    },
    [leadSubmitted, trackEvent],
  );

  const handleQuoteSubmit = async () => {
    if (!name.trim() || !phone.trim()) {
      setError("Add your name and WhatsApp number so we can send the right quote back.");
      return;
    }
    setError("");
    setIsSubmittingLead(true);
    setLeadSaveWarning(null);

    const estimateValue = configuratorIncludedInTotal
      ? grandTotal
      : hasConfiguredBuild
        ? buildFromPrice
        : selectedAccessoryPricedTotal;

    const buildPayload = {
      funnel: G700_FUNNEL_NAME,
      configured: hasConfiguredBuild,
      color_id: selectedColorId ?? null,
      color_label: selectedColorId ? activeColor.label : null,
      color_swatch: selectedColorId ? activeColor.swatch : null,
      finish: selectedFinish ?? null,
      trim_package: selectedTrimPackage ?? null,
      trim_label: selectedTrimPackage ? formatTrimPackage(selectedTrimPackage) : null,
      build_summary: summary,
      build_from_price: hasConfiguredBuild ? buildFromPrice : null,
      accessories: selectedAccessoryDetails.map((item) => ({
        title: item.title,
        price: item.price ?? null,
      })),
      accessories_count: selectedAccessories.length,
      accessories_subtotal: selectedAccessoryPricedTotal,
      accessories_price_on_request_count: selectedAccessoryPriceOnRequestCount,
      include_build_in_total: configuratorIncludedInTotal,
      grand_total: grandTotal,
      estimate_value: estimateValue,
      currency: "AED",
    };

    try {
      const persistResult = await captureLeadSnapshot({
        snapshotType: "submit",
        context: funnelContext,
        fullName: name.trim(),
        phone: phone.trim(),
        vehicleMake: G700_VEHICLE_MAKE,
        vehicleModel: G700_VEHICLE_MODEL,
        payload: buildPayload,
      });

      if (persistResult.ok === false) {
        const suffix = persistResult.code ? ` (${persistResult.code})` : "";
        setLeadSaveWarning(`${persistResult.reason}${suffix}`);
      }
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : String(caught);
      setLeadSaveWarning(message);
    }

    trackEvent(
      "g700_quote_submitted",
      {
        ...buildPayload,
        lead_form_submitted: true,
      },
      {
        metaStandardEvent: "Lead",
        metaPayload: {
          content_name: "G700 PPF & Customization",
          content_category: "G700 Customizer",
          status: "submitted",
          value: estimateValue || 1,
          currency: "AED",
          num_items: selectedAccessories.length,
        },
        privatePayload: {
          lead_name: name.trim(),
          lead_phone: phone.trim(),
        },
      },
    );

    try {
      trackTikTokSubmitForm({
        content_name: "G700 PPF & Customization",
        content_type: "lead_form",
        content_id: G700_FUNNEL_NAME,
        currency: "AED",
        value: estimateValue || 1,
        num_items: selectedAccessories.length,
      });
    } catch (caught) {
      console.warn("TikTok SubmitForm dispatch failed", caught);
    }

    setIsSubmittingLead(false);
    setLeadSubmitted(true);
  };

  const handleContinueOnWhatsApp = () => {
    openTrackedWhatsApp("post_submit", quoteUrl);
  };

  const toggleAccessorySelection = (title: string) => {
    const willSelect = !selectedAccessories.includes(title);
    setSelectedAccessories((current) =>
      current.includes(title)
        ? current.filter((item) => item !== title)
        : [...current, title],
    );
    if (willSelect) {
      trackEvent("g700_accessory_selected", {
        accessory_title: title,
        accessory_price: ACCESSORY_PRICE_MAP[title] ?? null,
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#070707] pb-28 md:pb-0">
      <Navbar sticky={false} />
      <main className="relative">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#080808_0%,#060606_38%,#0b0b0b_100%)]" />
        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:72px_72px]" />

        {/* CONFIGURATOR - compact single-screen layout, sticky preview, no auto-scroll */}
        <section ref={configuratorRef} className="relative px-3 pb-4 pt-3 sm:px-6 sm:pt-5 lg:px-8 lg:pt-8">
          <div className="container mx-auto max-w-7xl">
            <div className="rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(10,10,10,0.98))] shadow-[0_20px_60px_rgba(0,0,0,0.4)] sm:rounded-[32px]">
              {/* Eyebrow header with progress dots */}
              <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-6 sm:py-4 lg:px-6">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/45 sm:text-[11px]">Build studio</p>
                  <h1 className="mt-0.5 text-lg font-bold leading-tight text-white sm:text-2xl lg:text-[28px]">
                    Configure your G700
                  </h1>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {[0, 1, 2].map((index) => (
                    <span
                      key={index}
                      className={cn(
                        "h-1.5 rounded-full transition-all duration-300",
                        index < stepsCompleted
                          ? "w-6 bg-[#f7b52b]"
                          : "w-3 bg-white/15",
                      )}
                    />
                  ))}
                </div>
              </div>

              {/* 2-column layout on desktop: sticky preview (left) + compact controls (right) */}
              <div className="flex flex-col lg:grid lg:grid-cols-[1.25fr_1fr] lg:gap-6 lg:px-6 lg:pt-4">
                {/* Preview — sticky on mobile AND desktop so the car stays visible while experimenting */}
                <div className="sticky top-0 z-30 bg-[linear-gradient(180deg,rgba(12,12,12,0.97),rgba(10,10,10,0.97))] shadow-[0_8px_24px_rgba(0,0,0,0.4)] backdrop-blur-md lg:top-6 lg:self-start lg:bg-transparent lg:shadow-none lg:backdrop-blur-none">
                  <div className="px-3 pb-2 pt-2 sm:px-5 sm:pb-3 sm:pt-3 lg:p-0">
                    <div
                      className={cn(
                        "relative overflow-hidden rounded-[18px] border border-white/10 sm:rounded-[24px] lg:rounded-[20px]",
                        activeFinish === "gloss"
                          ? "bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(0,0,0,0.32))]"
                          : "bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.07),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(0,0,0,0.4))]",
                      )}
                    >
                      <div className="relative aspect-[16/10]">
                        <div className="absolute inset-x-[12%] bottom-6 h-10 rounded-full bg-black/60 blur-3xl sm:h-14" />
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
                                className="group relative h-14 rounded-2xl border-2 border-black/40 bg-white/10 px-7 text-base font-semibold text-white backdrop-blur-xl shadow-[0_10px_35px_rgba(255,255,255,0.18),inset_0_1px_0_rgba(255,255,255,0.5)] transition-all duration-300 hover:bg-white/16"
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
                    {/* Summary chip + progress status */}
                    <div className="mt-2 flex items-center justify-between gap-2 sm:mt-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[10px] uppercase tracking-[0.18em] text-white/40 sm:text-[11px]">
                          Your build
                        </p>
                        <p className={cn(
                          "mt-0.5 truncate text-sm font-semibold sm:text-base",
                          hasConfiguredBuild ? "text-white" : "text-white/55",
                        )}>
                          {summary}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1 rounded-full bg-white/5 px-2.5 py-1.5 text-[10px] uppercase tracking-[0.16em] text-white/55 sm:text-[11px]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#f7b52b]" />
                        {stepsCompleted}/3
                      </div>
                    </div>
                  </div>
                </div>

                {/* Controls column — stacked compact rows, zero scroll needed to access any option */}
                <div className="px-4 pt-3 sm:px-6 sm:pt-4 lg:min-w-0 lg:p-0">
                  {/* COLOUR — single row of 6 swatches */}
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/75 sm:text-xs">
                      Colour
                    </p>
                    <div className="mt-2.5 grid grid-cols-6 gap-1.5 sm:gap-2">
                      {colorOptions.map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          aria-label={option.label}
                          aria-pressed={selectedColorId === option.id}
                          onClick={() => handleColorSelect(option.id)}
                          className={cn(
                            "group relative flex flex-col items-center gap-1.5 rounded-xl border bg-black/25 py-2 transition",
                            selectedColorId === option.id
                              ? "border-white bg-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.35),0_8px_22px_rgba(255,255,255,0.08)]"
                              : "border-white/10 hover:border-white/30 hover:bg-white/5",
                          )}
                        >
                          <span
                            className={cn(
                              "h-9 w-9 rounded-full border-2 transition sm:h-10 sm:w-10",
                              selectedColorId === option.id
                                ? "border-white shadow-[0_0_0_3px_rgba(255,255,255,0.18)]"
                                : "border-white/20",
                            )}
                            style={{ backgroundColor: option.swatch }}
                          />
                          <span
                            className={cn(
                              "hidden text-[9px] font-semibold uppercase tracking-[0.08em] transition sm:block sm:text-[10px]",
                              selectedColorId === option.id ? "text-white" : "text-white/60",
                            )}
                          >
                            {option.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* FINISH — 2 pills side-by-side */}
                  <div className="mt-4 sm:mt-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/75 sm:text-xs">
                      Finish
                    </p>
                    <div className="mt-2.5 grid grid-cols-2 gap-2 sm:gap-2.5">
                      {(["gloss", "matte"] as Finish[]).map((finish) => (
                        <button
                          key={finish}
                          type="button"
                          aria-pressed={selectedFinish === finish}
                          onClick={() => handleFinishSelect(finish)}
                          className={cn(
                            "flex flex-col items-start rounded-xl border px-3 py-2.5 text-left transition sm:px-3.5 sm:py-3",
                            selectedFinish === finish
                              ? "border-white bg-white text-black shadow-[0_8px_22px_rgba(255,255,255,0.12)]"
                              : "border-white/10 bg-black/25 text-white/75 hover:border-white/25 hover:bg-white/5 hover:text-white",
                          )}
                        >
                          <span className="text-[13px] font-bold uppercase tracking-[0.14em] sm:text-sm">
                            {finish}
                          </span>
                          <span
                            className={cn(
                              "mt-0.5 hidden text-[10px] leading-4 sm:block sm:text-[11px]",
                              selectedFinish === finish ? "text-black/65" : "text-white/50",
                            )}
                          >
                            {finish === "gloss"
                              ? "Sharp, reflective"
                              : "Stealth, muted"}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* TRIM — 3 compact pills in a single row */}
                  <div className="mt-4 sm:mt-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/75 sm:text-xs">
                      Trim
                    </p>
                    <div className="mt-2.5 grid grid-cols-3 gap-1.5 sm:gap-2">
                      {trimPackageOptions.map(({ id: trimPackage, label }) => {
                        const helper =
                          trimPackage === "standard"
                            ? "Factory"
                            : trimPackage === "blackout"
                              ? "Gloss black"
                              : "Colour-matched";
                        return (
                          <button
                            key={trimPackage}
                            type="button"
                            aria-pressed={selectedTrimPackage === trimPackage}
                            onClick={() => handleTrimPackageSelect(trimPackage)}
                            className={cn(
                              "flex flex-col items-start rounded-xl border px-2.5 py-2.5 text-left transition sm:px-3 sm:py-3",
                              selectedTrimPackage === trimPackage
                                ? "border-[#d96a20] bg-[#d96a20] text-black shadow-[0_10px_28px_rgba(217,106,32,0.28)]"
                                : "border-white/10 bg-black/25 text-white/80 hover:border-white/25 hover:bg-white/5 hover:text-white",
                            )}
                          >
                            <span className="text-[12px] font-bold uppercase tracking-[0.1em] leading-tight sm:text-[13px]">
                              {label}
                            </span>
                            <span
                              className={cn(
                                "mt-0.5 hidden text-[10px] leading-3 sm:block sm:text-[11px]",
                                selectedTrimPackage === trimPackage
                                  ? "text-black/70"
                                  : "text-white/50",
                              )}
                            >
                              {helper}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Pricing guidance — compact 2-col grid, always visible to anchor expectations */}
                  <div className="mt-4 sm:mt-5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/75 sm:text-xs">
                        Guide pricing
                      </p>
                      <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-amber-200">
                        Draft
                      </span>
                    </div>
                    <div className="mt-2.5 grid grid-cols-2 gap-1.5 sm:gap-2">
                      {[
                        {
                          active: selectedFinish === "gloss",
                          label: "Gloss PPF",
                          price: "from 9,990 AED",
                        },
                        {
                          active: selectedFinish === "matte",
                          label: "Matte PPF",
                          price: "from 10,490 AED",
                        },
                        {
                          active: selectedTrimPackage === "blackout",
                          label: "Blackout trim",
                          price: "from 3,000 AED",
                        },
                        {
                          active: selectedTrimPackage === "paint-matched",
                          label: "Paint-matched",
                          price: "from 4,000 AED",
                        },
                      ].map((row) => (
                        <div
                          key={row.label}
                          className={cn(
                            "flex flex-col gap-0.5 rounded-xl border px-3 py-2 transition",
                            row.active
                              ? "border-[#f7b52b]/50 bg-[#f7b52b]/12"
                              : "border-white/5 bg-white/[0.02]",
                          )}
                        >
                          <span
                            className={cn(
                              "text-[11px] font-medium leading-tight sm:text-xs",
                              row.active ? "text-white" : "text-white/55",
                            )}
                          >
                            {row.label}
                          </span>
                          <span
                            className={cn(
                              "text-[12px] font-semibold leading-tight sm:text-[13px]",
                              row.active ? "text-[#f7b52b]" : "text-white/45",
                            )}
                          >
                            {row.price}
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className="mt-2 text-[10px] leading-4 text-white/40 sm:text-[11px]">
                      Guide pricing only. Final quote depends on your exact scope.
                    </p>
                  </div>
                </div>
              </div>

              {/* Quote CTA card — full width under both columns */}
              <div ref={quoteCardRef} className="p-4 pt-4 sm:p-6 lg:pt-5">
                <div className="rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(247,181,43,0.12),rgba(0,0,0,0.3))] p-4 sm:p-5">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 sm:text-[11px]">
                        Quote summary
                      </p>
                      <p className="mt-1 text-2xl font-bold leading-none text-white sm:text-[32px]">
                        From {formatAED(buildFromPrice)}
                      </p>
                      <p className="mt-1 text-[11px] text-white/55 sm:text-xs">
                        {`${selectedFinishForPricing === "gloss" ? "Gloss" : "Matte"} PPF (${formatAED(FINISH_FROM_PRICES[selectedFinishForPricing])})`}
                        {TRIM_FROM_PRICES[selectedTrimForPricing] > 0
                          ? ` + ${formatTrimPackage(selectedTrimForPricing)} trim (${formatAED(TRIM_FROM_PRICES[selectedTrimForPricing])})`
                          : ""}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <Button
                      size="lg"
                      className={cn(
                        "h-12 rounded-2xl px-5 text-[15px] font-semibold transition sm:px-6",
                        hasConfiguredBuild
                          ? "bg-[linear-gradient(180deg,#ffd47a_0%,#f7b52b_52%,#e79a13_100%)] text-black hover:brightness-105"
                          : "bg-white/10 text-white/80 hover:bg-white/15",
                      )}
                      onClick={openQuoteModal}
                    >
                      Get My G700 Quote
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="h-12 rounded-2xl border-white/20 bg-white/5 text-white hover:bg-white/10"
                      onClick={scrollToAccessories}
                    >
                      Add Accessories
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ACCESSORIES - compact grid, tighter cards, mobile-friendly selection */}
        <section ref={accessoriesSectionRef} className="relative px-3 pb-4 pt-5 sm:px-6 sm:pt-8 lg:px-8">
          <div className="container mx-auto max-w-7xl">
            <div className="flex items-end justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/45 sm:text-[11px]">Accessories</p>
                <h2 className="mt-0.5 text-xl font-bold leading-tight text-white sm:text-2xl lg:text-3xl">
                  Add accessories to your build
                </h2>
                <p className="mt-1 text-xs leading-5 text-white/55 sm:text-sm">
                  Tap anything you want priced. We&apos;ll bundle it with your quote.
                </p>
              </div>
              <a
                href={quickWhatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="hidden sm:block"
                onClick={() =>
                  trackEvent(
                    "g700_whatsapp_clicked",
                    { cta_location: "accessories_header", lead_submitted: leadSubmitted },
                    { metaStandardEvent: "Contact", metaPayload: { contact_channel: "whatsapp" } },
                  )
                }
              >
                <Button
                  variant="outline"
                  className="h-11 rounded-2xl border-[#25D366]/35 bg-[#25D366]/10 text-white hover:bg-[#25D366]/20"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Ask About Accessories
                </Button>
              </a>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-6 sm:gap-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {accessoryItems.map((item) => {
                const isSelected = selectedAccessories.includes(item.title);
                return (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => toggleAccessorySelection(item.title)}
                    aria-pressed={isSelected}
                    className={cn(
                      "group relative flex flex-col overflow-hidden rounded-xl border bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(8,8,8,0.98))] text-left transition",
                      isSelected
                        ? "border-[#f7b52b]/70 shadow-[0_10px_28px_rgba(247,181,43,0.2)]"
                        : "border-white/10 hover:border-white/25",
                    )}
                  >
                    <div className="relative aspect-video overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.title}
                        className={cn(
                          "h-full w-full object-contain",
                          item.imageClassName,
                        )}
                        loading="lazy"
                      />
                      {/* Selection badge */}
                      <span
                        className={cn(
                          "absolute right-1.5 top-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full border transition",
                          isSelected
                            ? "border-[#f7b52b] bg-[#f7b52b] text-black"
                            : "border-white/30 bg-black/60 text-transparent group-hover:text-white/60",
                        )}
                      >
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                    </div>
                    <div className="bg-black px-2.5 pb-2 pt-1 sm:px-3 sm:pt-1.5 sm:pb-2.5">
                      <h3 className="line-clamp-2 text-[12px] font-semibold leading-tight text-white sm:text-[13px]">
                        {item.title}
                      </h3>
                      <p className="mt-0.5 text-[10px] text-white/55 sm:text-[11px]">
                        {ACCESSORY_PRICE_MAP[item.title]
                          ? `From ${formatAED(ACCESSORY_PRICE_MAP[item.title])}`
                          : "Price on request"}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div ref={accessoriesQuoteRef} className="scroll-mt-4 lg:scroll-mt-8">
              <Card className="mt-4 rounded-2xl border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(8,8,8,0.98))] p-4 text-white sm:mt-6 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-white/45 sm:text-[11px]">
                      My accessories
                    </p>
                    <h3 className="mt-0.5 text-base font-semibold sm:text-lg">
                      {selectedAccessories.length
                        ? `${selectedAccessories.length} item${selectedAccessories.length > 1 ? "s" : ""} selected`
                        : "None selected yet"}
                    </h3>
                  </div>
                </div>

                {selectedAccessories.length ? (
                  <div className="mt-3">
                    <div className="flex flex-wrap gap-1.5">
                      {selectedAccessories.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => toggleAccessorySelection(item)}
                          className="group flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/85 transition hover:border-white/30 hover:bg-white/10"
                        >
                          <span className="truncate max-w-[180px]">{item}</span>
                          <span className="text-white/40 group-hover:text-white/80">×</span>
                        </button>
                      ))}
                    </div>

                    <div className="mt-4 rounded-xl border border-white/10 bg-black/25 p-3 sm:p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/65">
                          Price summary
                        </p>
                        {hasConfiguredBuild ? (
                          <button
                            type="button"
                            onClick={() =>
                              setIncludeConfiguratorInAccessoriesTotal((current) => !current)
                            }
                            className={cn(
                              "inline-flex h-7 items-center rounded-full border px-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] transition",
                              configuratorIncludedInTotal
                                ? "border-[#f7b52b]/50 bg-[#f7b52b]/15 text-[#f7b52b]"
                                : "border-white/20 bg-white/5 text-white/65 hover:bg-white/10",
                            )}
                          >
                            {configuratorIncludedInTotal ? "Build included" : "Build excluded"}
                          </button>
                        ) : null}
                      </div>

                      <div className="mt-3 space-y-1.5">
                        {selectedAccessoryDetails.map((item) => (
                          <div
                            key={`${item.title}-line`}
                            className="flex items-center justify-between gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-2.5 py-2"
                          >
                            <p className="truncate text-xs text-white/80">{item.title}</p>
                            <p className="shrink-0 text-xs font-semibold text-white/90">
                              {item.price ? formatAED(item.price) : "Price on request"}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="mt-3 space-y-1.5 border-t border-white/10 pt-3 text-xs">
                        <div className="flex items-center justify-between text-white/70">
                          <span>Accessories subtotal</span>
                          <span>{formatAED(selectedAccessoryPricedTotal)}</span>
                        </div>
                        {selectedAccessoryPriceOnRequestCount > 0 ? (
                          <div className="flex items-center justify-between text-white/55">
                            <span>Price on request items</span>
                            <span>{selectedAccessoryPriceOnRequestCount}</span>
                          </div>
                        ) : null}
                        {hasConfiguredBuild ? (
                          <div className="flex items-center justify-between text-white/70">
                            <span>Configurator build</span>
                            <span>
                              {configuratorIncludedInTotal ? formatAED(buildFromPrice) : "Not included"}
                            </span>
                          </div>
                        ) : null}
                        <div className="flex items-center justify-between border-t border-white/10 pt-2 text-sm font-semibold text-white">
                          <span>Total from</span>
                          <span>{formatAED(grandTotal)}</span>
                        </div>
                        <p className="text-[11px] text-white/45">
                          Installation charged separately.
                        </p>
                      </div>
                    </div>

                    <Button
                      size="lg"
                      className={cn(
                        "mt-4 h-12 w-full rounded-2xl text-[15px] font-semibold",
                        selectedAccessories.length
                          ? "bg-[linear-gradient(180deg,#ffd47a_0%,#f7b52b_52%,#e79a13_100%)] text-black hover:brightness-105"
                          : "bg-white/10 text-white/70 hover:bg-white/15",
                      )}
                      onClick={openQuoteModal}
                    >
                      {selectedAccessories.length ? "Get Quote" : "Open Quote"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                ) : null}
              </Card>
            </div>
          </div>
        </section>

        {/* TRUST - compressed copy, keeps video proof cards */}
        <section className="relative px-3 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="container mx-auto max-w-7xl">
            <div className="mb-4 sm:mb-6">
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/45 sm:text-[11px]">Trust & proof</p>
              <h2 className="mt-0.5 text-xl font-bold leading-tight text-white sm:text-2xl lg:text-3xl">
                Real owners, real handovers
              </h2>
              <p className="mt-1 max-w-2xl text-xs leading-5 text-white/60 sm:text-sm">
                Review and delivery clips from real Grand Touch customers.
              </p>
            </div>
            <div className="grid gap-4 sm:gap-6 md:grid-cols-3 md:items-stretch">
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

        {/* FAQ - compressed header */}
        <section className="relative border-y border-white/10 bg-black/20 px-3 py-8 sm:px-6 sm:py-10 lg:px-8">
          <div className="container mx-auto max-w-4xl">
            <div className="mb-4 sm:mb-6">
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/45 sm:text-[11px]">
                Questions owners ask
              </p>
              <h2 className="mt-0.5 text-xl font-bold leading-tight text-white sm:text-2xl lg:text-3xl">
                Common questions
              </h2>
            </div>

            <Card className="rounded-2xl border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(8,8,8,0.96))] p-3 text-white sm:p-5">
              <Accordion type="single" collapsible className="w-full">
                {faqItems.map((item, index) => (
                  <AccordionItem
                    key={item.question}
                    value={`faq-${index}`}
                    className="border-b border-white/10 last:border-b-0"
                  >
                    <AccordionTrigger className="py-3.5 text-left text-[14px] font-semibold text-white hover:no-underline sm:py-4 sm:text-base">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="pb-4 text-sm leading-6 text-white/68">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </Card>
          </div>
        </section>

        {/* FINAL CTA - compact */}
        <section className="relative px-3 pb-10 pt-6 sm:px-6 sm:pb-14 sm:pt-8 lg:px-8">
          <div className="container mx-auto max-w-4xl">
            <div className="rounded-[24px] border border-primary/25 bg-[radial-gradient(circle_at_top,rgba(245,181,43,0.18),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(10,10,10,0.98))] px-5 py-7 text-center text-white shadow-[0_18px_60px_rgba(0,0,0,0.35)] sm:px-8 sm:py-10">
              <div className="mx-auto flex max-w-max items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-white/65 sm:text-[11px]">
                <Star className="h-3 w-3 text-primary" />
                Price this build
              </div>
              <h2 className="mt-4 text-2xl font-bold leading-tight sm:text-3xl lg:text-4xl">
                Ready to turn this build into a quote?
              </h2>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-white/65 sm:text-[15px]">
                Your colour, finish, trim, and accessories go through with the lead.
              </p>
              <div className="mt-5 flex flex-col justify-center gap-2.5 sm:flex-row sm:gap-3">
                <Button
                  size="lg"
                  className="h-12 rounded-2xl bg-[linear-gradient(180deg,#ffd47a_0%,#f7b52b_52%,#e79a13_100%)] px-6 text-[15px] font-semibold text-black hover:brightness-105"
                  onClick={openQuoteModal}
                >
                  Get My G700 Quote
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <a
                  href={quickWhatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() =>
                    trackEvent(
                      "g700_whatsapp_clicked",
                      { cta_location: "final_cta", lead_submitted: leadSubmitted },
                      { metaStandardEvent: "Contact", metaPayload: { contact_channel: "whatsapp" } },
                    )
                  }
                >
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 w-full rounded-2xl border-[#25D366]/35 bg-[#25D366]/10 px-6 text-[14px] font-semibold text-white hover:bg-[#25D366]/20"
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Talk on WhatsApp
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
      {/* Context-aware sticky mobile CTA bar */}
      {(() => {
        // In accessories section with selections -> accessory-specific CTA
        if (
          isAccessoriesSectionInView &&
          !isAccessoriesQuoteInView &&
          selectedAccessories.length > 0
        ) {
          return (
            <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[rgba(8,8,8,0.92)] p-2.5 backdrop-blur-xl md:hidden">
              <div className="mx-auto w-full max-w-7xl">
                <Button
                  className="h-12 w-full rounded-2xl bg-white text-black hover:bg-white/90"
                  onClick={scrollToAccessoriesQuote}
                >
                  <SlidersHorizontal className="mr-2 h-4 w-4" />
                  See My {selectedAccessories.length} Accessor{selectedAccessories.length === 1 ? "y" : "ies"}
                </Button>
              </div>
            </div>
          );
        }

        // Once user engages with configurator, persistent progress CTA
        // Hide when quote card is in view (don't compete with inline CTA)
        // Hide when they haven't touched anything yet (no nagging cold users)
        if (hasAnySelection && !isQuoteCardInView) {
          return (
            <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[rgba(8,8,8,0.92)] p-2.5 backdrop-blur-xl md:hidden">
              <div className="mx-auto flex w-full max-w-7xl items-center gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[10px] uppercase tracking-[0.16em] text-white/45">
                    {hasConfiguredBuild ? "Your build" : `Step ${Math.min(stepsCompleted + 1, 3)} of 3`}
                  </p>
                  <p className="truncate text-sm font-semibold text-white">
                    {hasConfiguredBuild ? summary : nextStepLabel}
                  </p>
                </div>
                <Button
                  className={cn(
                    "h-11 shrink-0 rounded-2xl px-4 text-sm font-semibold",
                    hasConfiguredBuild
                      ? "bg-[linear-gradient(180deg,#ffd47a_0%,#f7b52b_52%,#e79a13_100%)] text-black hover:brightness-105"
                      : "bg-white text-black hover:bg-white/90",
                  )}
                  onClick={hasConfiguredBuild ? openQuoteModal : scrollToConfigurator}
                >
                  {hasConfiguredBuild ? "Get Quote" : "Keep Building"}
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        }

        return null;
      })()}

      <Dialog open={quoteOpen} onOpenChange={setQuoteOpen}>
        <DialogContent className="flex h-[100dvh] max-h-[100dvh] w-[100vw] max-w-none flex-col gap-0 rounded-none border-0 bg-[linear-gradient(180deg,rgba(25,25,25,0.98),rgba(8,8,8,0.99))] p-0 text-white shadow-[0_32px_100px_rgba(0,0,0,0.55)] sm:h-auto sm:max-h-[92vh] sm:w-[min(92vw,520px)] sm:rounded-[24px] sm:border sm:border-white/10">
          <div data-quote-modal-scroll className="flex-1 overflow-y-auto p-5 pb-[calc(7.25rem+env(safe-area-inset-bottom))] sm:p-7 sm:pb-7">
            {leadSubmitted ? (
              <div className="flex min-h-[60vh] flex-col">
                <DialogHeader className="text-left">
                  <DialogTitle className="text-xl text-white sm:text-2xl">
                    Thanks {name.trim().split(" ")[0] || "there"} — we've got your build
                  </DialogTitle>
                  <DialogDescription className="text-sm text-white/60">
                    Sean will message you on WhatsApp shortly with the exact quote based on what you selected.
                  </DialogDescription>
                </DialogHeader>

                <div className="mt-5 flex flex-col items-start gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                    <p className="text-sm font-semibold text-emerald-100">Quote request saved</p>
                  </div>
                  <p className="text-xs leading-5 text-emerald-100/80">
                    Your build {hasConfiguredBuild ? `(${summary})` : ""}
                    {selectedAccessories.length ? ` and ${selectedAccessories.length} accessories` : ""} were sent
                    through with your name and WhatsApp number.
                  </p>
                </div>

                <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-4 text-xs text-white/70">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/45 sm:text-[11px]">What happens next</p>
                  <ul className="mt-2 space-y-1.5">
                    <li>• Sean reviews your selection and confirms availability.</li>
                    <li>• You'll get a WhatsApp message with exact pricing + installation slots.</li>
                    <li>• Want to get ahead? Tap the button below to message Sean now with your build pre-filled.</li>
                  </ul>
                </div>

                {leadSaveWarning ? (
                  <p className="mt-3 text-xs text-[#ffb37a]">
                    Note: we had trouble saving your request automatically ({leadSaveWarning}). Please continue on WhatsApp to finish.
                  </p>
                ) : null}
              </div>
            ) : (
              <>
                <DialogHeader className="text-left">
                  <DialogTitle className="text-xl text-white sm:text-2xl">
                    Get your G700 quote
                  </DialogTitle>
                  <DialogDescription className="text-sm text-white/60">
                    Leave your name and WhatsApp number — Sean will come back with exact pricing for this build.
                  </DialogDescription>
                </DialogHeader>

                <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-4">
                  <div className="flex items-end justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-white/45 sm:text-[11px]">
                        Quote summary
                      </p>
                      <p className={cn("mt-1 text-base font-semibold sm:text-lg", hasConfiguredBuild ? "text-white" : "text-white/55")}>
                        {summary}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">Total from</p>
                      <p className="mt-1 text-xl font-bold text-white">{formatAED(grandTotal)}</p>
                    </div>
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-2.5 py-2 text-white/75">
                      <span>Configurator build</span>
                      <span>{hasConfiguredBuild ? formatAED(buildFromPrice) : "Not selected"}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-2.5 py-2 text-white/75">
                      <span>Accessories subtotal</span>
                      <span>{formatAED(selectedAccessoryPricedTotal)}</span>
                    </div>
                    {selectedAccessoryPriceOnRequestCount > 0 ? (
                      <div className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-2.5 py-2 text-white/65">
                        <span>Price on request items</span>
                        <span>{selectedAccessoryPriceOnRequestCount}</span>
                      </div>
                    ) : null}
                    <p className="pt-0.5 text-[11px] text-white/45">Installation charged separately.</p>
                  </div>
                </div>

                <div className="mt-3 rounded-2xl border border-white/10 bg-black/25 p-4">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/45 sm:text-[11px]">
                    Selected accessories
                  </p>
                  {selectedAccessoryDetails.length ? (
                    <div className="mt-2 space-y-1.5">
                      {selectedAccessoryDetails.map((item) => (
                        <div key={`modal-${item.title}`} className="flex items-center justify-between gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-2.5 py-2">
                          <p className="truncate text-xs text-white/80">{item.title}</p>
                          <p className="shrink-0 text-xs font-semibold text-white/90">
                            {item.price ? formatAED(item.price) : "Price on request"}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-2.5 rounded-xl border border-dashed border-white/20 bg-white/[0.02] p-3">
                      <p className="text-xs text-white/65">No accessories selected yet.</p>
                      <Button
                        type="button"
                        variant="outline"
                        className="mt-2 h-9 rounded-xl border-white/20 bg-white/5 text-white hover:bg-white/10"
                        onClick={jumpToAccessoriesFromQuote}
                      >
                        Add accessories
                      </Button>
                    </div>
                  )}
                </div>

                <div className="mt-4 space-y-2.5">
                  <Input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    onFocus={(event) => event.currentTarget.scrollIntoView({ behavior: "smooth", block: "center" })}
                    placeholder="Your name"
                    type="text"
                    autoComplete="name"
                    className="h-12 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-white/35"
                  />
                  <Input
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    onFocus={(event) => event.currentTarget.scrollIntoView({ behavior: "smooth", block: "center" })}
                    placeholder="WhatsApp number"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    className="h-12 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-white/35"
                  />
                  <p className="pt-0.5 text-[11px] text-white/45">
                    We only use this to send your G700 quote. No spam.
                  </p>
                </div>

                {error ? <p className="mt-2.5 text-sm text-[#ffb37a]">{error}</p> : null}
              </>
            )}
          </div>

          {/* Sticky submit / post-submit footer */}
          <div className="border-t border-white/10 bg-black/65 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur-md sm:border-0 sm:bg-transparent sm:p-5 sm:pt-0">
            {leadSubmitted ? (
              <div className="space-y-2">
                <Button
                  size="lg"
                  className="h-12 w-full rounded-2xl bg-[#25D366] text-[15px] font-semibold text-white hover:bg-[#1ebe5a]"
                  onClick={handleContinueOnWhatsApp}
                >
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Continue on WhatsApp
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-11 w-full rounded-2xl border-white/15 bg-white/5 text-sm text-white hover:bg-white/10"
                  onClick={() => setQuoteOpen(false)}
                >
                  Close
                </Button>
              </div>
            ) : (
              <Button
                size="lg"
                disabled={isSubmittingLead}
                className="h-12 w-full rounded-2xl bg-[linear-gradient(180deg,#ffd47a_0%,#f7b52b_52%,#e79a13_100%)] text-[15px] font-semibold text-black hover:brightness-105 disabled:opacity-60"
                onClick={handleQuoteSubmit}
              >
                {isSubmittingLead ? "Sending..." : "Get My G700 Quote"}
                {!isSubmittingLead ? <ArrowRight className="ml-2 h-4 w-4" /> : null}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <div className="pointer-events-none fixed bottom-0 right-0 z-30 hidden overflow-visible md:block">
        <a
          href={quickWhatsappUrl}
          target="_blank"
          rel="noreferrer"
          aria-label="Ask Sean on WhatsApp about this G700 build"
          onClick={() =>
            trackEvent(
              "g700_whatsapp_clicked",
              { cta_location: "desktop_floating", lead_submitted: leadSubmitted },
              { metaStandardEvent: "Contact", metaPayload: { contact_channel: "whatsapp" } },
            )
          }
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
