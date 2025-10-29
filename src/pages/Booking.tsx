import { useState } from "react";
import { useNavigate } from "react-router-dom";
import emailjs from "@emailjs/browser";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import carSmallGT3 from "@/assets/car-small-gt3.jpg";
import carMediumCayenne from "@/assets/car-medium-cayenne.jpg";
import carLargeGwagon from "@/assets/car-large-gwagon.jpg";
import packagePPFElite from "@/assets/package-ppf-elite.jpg";
import packageTintDetail from "@/assets/package-tint-detail.jpg";
import packageCeramicInterior from "@/assets/package-ceramic-interior.jpg";
import ppfCClear from "@/assets/ppf-cclear-entry.jpg";
import ppfForceShield from "@/assets/ppf-forceshield-recommended.jpg";
import ppfDynoShield from "@/assets/ppf-dynoshield-premium.jpg";
import ceramicExterior from "@/assets/ceramic-exterior-only.jpg";
import ceramicInterior from "@/assets/ceramic-interior-only.jpg";
import ceramicFull from "@/assets/ceramic-full-bundle.jpg";
import tintSmart from "@/assets/tint-smart-recommended.jpg";
import tintNex from "@/assets/tint-nex-premium.jpg";
import tintAction from "@/assets/tint-action-entry.jpg";
import polishFull from "@/assets/polish-full-detailing.jpg";
import polishOnly from "@/assets/polish-only-correction.jpg";
import detailingOnly from "@/assets/detailing-only-interior.jpg";
import { Shield, Sparkles, Sun, Gem, Gift, Tag, CheckCircle2, XCircle } from "lucide-react";

// NOTE: @emailjs/browser is already installed in package.json
// EmailJS Constants
const EMAILJS_SERVICE_ID = "service_f2na96a";
const EMAILJS_TEMPLATE_ID = "template_bs1inle";
const EMAILJS_PUBLIC_KEY = "PBrHmtX3m6KZRrwiC";

type VehicleSize = "Small" | "Medium" | "Large";
type ServiceCategory = "Package Offers" | "PPF" | "Ceramic" | "Tint" | "Polishing";

interface PPFService {
  name: string;
  description: string[];
  prices: { Small: number; Medium: number; Large: number };
  tag?: string;
}

interface FixedPriceService {
  name: string;
  description: string[];
  price: number;
  tag?: string;
}

interface ServicesData {
  PPF: PPFService[];
  Ceramic: FixedPriceService[];
  Tint: FixedPriceService[];
  Polishing: FixedPriceService[];
  "Package Offers": (PPFService | FixedPriceService)[];
}

const servicesData: ServicesData = {
  PPF: [
    {
      name: "Dyno Shield",
      description: [
        "Nano-ceramic top coat",
        "Extreme gloss & clarity",
        "Maximum chip protection",
        "Stain & UV resistant",
        "10-year warranty coverage"
      ],
      prices: { Small: 10999, Medium: 12000, Large: 14500 },
      tag: "Premium"
    },
    {
      name: "Force Shield",
      description: [
        "Gloss or matte finish options",
        "Self-healing TPU film",
        "Enhanced hydrophobic coating",
        "Strong rock-chip resistance",
        "5-year warranty – most popular"
      ],
      prices: { Small: 6999, Medium: 7499, Large: 8999 },
      tag: "Recommended"
    },
    {
      name: "C-Clear",
      description: [
        "Gloss finish for clean, clear shine",
        "Hydrophobic top coat repels water",
        "Self-healing surface for light scratches",
        "UV & stain resistant protection",
        "3-year warranty coverage"
      ],
      prices: { Small: 5499, Medium: 5999, Large: 6999 },
      tag: "Entry Level"
    }
  ],
  Ceramic: [
    {
      name: "Full Ceramic Coating",
      description: [
        "Full exterior ceramic protection",
        "Full interior ceramic protection",
        "Deep gloss & hydrophobic finish outside",
        "Interior stain + UV protection",
        "Bundle pricing (save vs separate)"
      ],
      price: 1749,
      tag: "Best Value"
    },
    {
      name: "Exterior Ceramic",
      description: [
        "Exterior paint surfaces only",
        "UV and heat protection",
        "Hydrophobic coating (water beads off)",
        "Gloss enhancement"
      ],
      price: 1249
    },
    {
      name: "Interior Ceramic",
      description: [
        "Interior surfaces: leather / plastics / trim",
        "Protection from wear & stains",
        "Easier to clean and maintain",
        "Anti-fade / anti-aging treatment"
      ],
      price: 749
    }
  ],
  Tint: [
    {
      name: "STEK NEXseries (Graphene Nano-Ceramic)",
      description: [
        "Graphene-infused nano-ceramic",
        "Blocks up to 98% infrared heat",
        "Maximum comfort in Dubai heat",
        "99% UV protection",
        "Lifetime warranty"
      ],
      price: 2499,
      tag: "Premium"
    },
    {
      name: "STEK SMARTseries (Nano-Ceramic)",
      description: [
        "Nano-ceramic heat rejection",
        "Up to 60% total solar energy rejection",
        "Cuts glare, cooler cabin",
        "99% UV protection",
        "Lifetime warranty"
      ],
      price: 1999,
      tag: "Recommended"
    },
    {
      name: "STEK ACTIONseries (Carbon)",
      description: [
        "Color-stable carbon film (no fading)",
        "Heat + glare reduction",
        "No signal interference",
        "99% UV protection",
        "Lifetime warranty"
      ],
      price: 1499,
      tag: "Entry Level"
    }
  ],
  Polishing: [
    {
      name: "Detailing & Polishing (Full)",
      description: [
        "Exterior polishing + full interior detail",
        "Multi-stage paint correction",
        "Interior deep clean",
        "Complete refresh"
      ],
      price: 1500
    },
    {
      name: "Polishing Only",
      description: [
        "Multi-stage paint correction",
        "Gloss enhancement",
        "Swirl mark removal",
        "Show car finish"
      ],
      price: 1000
    },
    {
      name: "Detailing Only",
      description: [
        "Deep clean interior + exterior",
        "Steam cleaning",
        "Leather conditioning",
        "Protection application"
      ],
      price: 850
    }
  ],
  "Package Offers": [
    {
      name: "PPF Elite Package",
      description: [
        "Full PPF, ceramic, tint & correction",
        "Self-healing, hydrophobic finish",
        "Extreme gloss & chip protection",
        "Heat + UV defense across all surfaces",
        "5-year full protection package"
      ],
      prices: { Small: 9999, Medium: 10999, Large: 12999 },
      tag: "Premium"
    },
    {
      name: "Ceramic & Interior Protection Package",
      description: [
        "Deep gloss ceramic coating",
        "Interior PPF protection",
        "UV + stain resistance",
        "Free interior detail",
        "Premium full-vehicle refinement"
      ],
      price: 2249,
      tag: "Refinement"
    },
    {
      name: "Tint & Detail Package",
      description: [
        "Nano-carbon tint + full detail",
        "Protects cabin from heat & UV",
        "Deep clean, interior + exterior",
        "Free polish + inspection",
        "Perfect for daily drivers"
      ],
      price: 1749,
      tag: "Popular"
    }
  ]
};

interface SelectedService {
  serviceName: string;
  category: string;
  price: number;
}

const Booking = () => {
  const navigate = useNavigate();
  const [selectedSize, setSelectedSize] = useState<VehicleSize>("Medium");
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory>("PPF");
  const [selectedService, setSelectedService] = useState<SelectedService | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("+971");
  const [vehicleInfo, setVehicleInfo] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  const [discountApplied, setDiscountApplied] = useState(false);
  const [discountError, setDiscountError] = useState("");

  // Helper to get PPF price based on vehicle size
  const getPPFPrice = (service: PPFService, size: VehicleSize): number => {
    return service.prices[size];
  };

  // Helper to get icon component for category
  const getCategoryIcon = (category: ServiceCategory) => {
    const iconClass = "w-6 h-6";
    const icons: Record<ServiceCategory, JSX.Element> = {
      "Package Offers": <Gift className={iconClass} />,
      "PPF": <Shield className={iconClass} />,
      "Ceramic": <Sparkles className={iconClass} />,
      "Tint": <Sun className={iconClass} />,
      "Polishing": <Gem className={iconClass} />
    };
    return icons[category] || <Shield className={iconClass} />;
  };

  // Helper to get car image based on size
  const getCarImage = (size: VehicleSize): string => {
    const images: Record<VehicleSize, string> = {
      "Small": carSmallGT3,
      "Medium": carMediumCayenne,
      "Large": carLargeGwagon
    };
    return images[size];
  };

  // Helper to get specific service image based on service name and category
  const getServiceImage = (serviceName: string, category: ServiceCategory): string => {
    // Package Offers
    if (category === "Package Offers") {
      if (serviceName === "PPF Elite Package") return packagePPFElite;
      if (serviceName === "Tint & Detail Package") return packageTintDetail;
      if (serviceName === "Ceramic & Interior Protection Package") return packageCeramicInterior;
    }
    
    // PPF Services
    if (category === "PPF") {
      if (serviceName === "C-Clear") return ppfCClear;
      if (serviceName === "Force Shield") return ppfForceShield;
      if (serviceName === "Dyno Shield") return ppfDynoShield;
    }
    
    // Ceramic Services
    if (category === "Ceramic") {
      if (serviceName === "Exterior Ceramic") return ceramicExterior;
      if (serviceName === "Interior Ceramic") return ceramicInterior;
      if (serviceName === "Full Ceramic Coating") return ceramicFull;
    }
    
    // Tint Services
    if (category === "Tint") {
      if (serviceName === "STEK SMARTseries (Nano-Ceramic)") return tintSmart;
      if (serviceName === "STEK NEXseries (Graphene Nano-Ceramic)") return tintNex;
      if (serviceName === "STEK ACTIONseries (Carbon)") return tintAction;
    }
    
    // Polishing Services
    if (category === "Polishing") {
      if (serviceName === "Detailing & Polishing (Full)") return polishFull;
      if (serviceName === "Polishing Only") return polishOnly;
      if (serviceName === "Detailing Only") return detailingOnly;
    }
    
    // Fallback
    return packagePPFElite;
  };

  // Helper to generate WhatsApp link
  const getWhatsAppLink = (serviceName: string, size: VehicleSize, price: number | string): string => {
    const message = `Hi Sean, I'm interested in ${serviceName} for a ${size} vehicle${typeof price === 'number' ? ` (${price.toLocaleString()} AED)` : ' - quote required'}. Can you confirm availability and booking?`;
    return `https://wa.me/971567191045?text=${encodeURIComponent(message)}`;
  };

  // Format price display
  const formatPrice = (price: number): string => {
    if (price === 0) return "Quote on Inspection";
    return `AED ${price.toLocaleString()}`;
  };

  // Handle discount code application
  const handleApplyDiscount = () => {
    if (discountCode.trim().toUpperCase() === "GT15") {
      setDiscountApplied(true);
      setDiscountError("");
    } else {
      setDiscountApplied(false);
      setDiscountError("Invalid discount code. Please try again.");
    }
  };

  // Calculate final price with discount
  const calculateFinalPrice = (originalPrice: number): number => {
    if (discountApplied) {
      return Math.round(originalPrice * 0.85); // 15% discount
    }
    return originalPrice;
  };

  // Calculate discount amount
  const calculateDiscount = (originalPrice: number): number => {
    if (discountApplied) {
      return Math.round(originalPrice * 0.15);
    }
    return 0;
  };

  // Handle complete booking
  const handleCompleteBooking = async () => {
    if (!selectedService) {
      alert("Please select a package or service first.");
      return;
    }

    if (!customerName || !customerPhone || !vehicleInfo) {
      alert("Please fill in your name, phone, and vehicle details.");
      return;
    }

    const finalPrice = calculateFinalPrice(selectedService.price);
    
    // Payload for EmailJS
    const emailPayload = {
      customer_name: customerName,
      customer_phone: customerPhone,
      vehicle_info: vehicleInfo,
      vehicle_size: selectedSize,
      service_name: selectedService.serviceName,
      service_category: selectedService.category,
      service_price: `AED ${selectedService.price.toLocaleString()}`,
      final_price: discountApplied ? `AED ${finalPrice.toLocaleString()} (15% discount applied)` : `AED ${finalPrice.toLocaleString()}`,
      discount_code: discountApplied ? "GT15" : "None",
      timestamp: new Date().toISOString(),
    };

    try {
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        emailPayload,
        EMAILJS_PUBLIC_KEY
      );
    } catch (err) {
      console.error("Failed to send lead email:", err);
      // We do NOT block WhatsApp redirect if email fails
    }

    // Build WhatsApp message
    const message = `
Hi Sean, I'd like to book:
- Service: ${selectedService.serviceName}
- Category: ${selectedService.category}
- Vehicle Size: ${selectedSize}
- Vehicle: ${vehicleInfo}
- Original Price: AED ${selectedService.price.toLocaleString()}
${discountApplied ? `- Discount (GT15): -AED ${calculateDiscount(selectedService.price).toLocaleString()}\n- Final Price: AED ${finalPrice.toLocaleString()}` : `- Final Price: AED ${finalPrice.toLocaleString()}`}

My details:
Name: ${customerName}
Phone: ${customerPhone}

Can you confirm availability and next steps?
    `.trim();

    // Open WhatsApp chat with prefilled message
    const waUrl = `https://wa.me/971567191045?text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank");

    // Navigate to thank you page with booking data
    navigate("/thank-you", {
      state: {
        bookingData: {
          serviceName: selectedService.serviceName,
          category: selectedService.category,
          vehicleSize: selectedSize,
          customerName: customerName,
          customerPhone: customerPhone,
          vehicleInfo: vehicleInfo,
          price: selectedService.price,
          finalPrice: finalPrice,
          discountApplied: discountApplied
        }
      }
    });
  };

  // Scroll to booking section
  const scrollToBooking = () => {
    const element = document.getElementById('booking-checkout');
    if (element) {
      // Scroll with offset to account for navbar and keep title visible
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - 100; // 100px offset for title visibility
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const scrollToService = () => {
    const element = document.getElementById('service-selection');
    if (element) {
      // Scroll with offset to account for fixed navbar and keep title visible
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - 100; // 100px offset for title visibility
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  // Get current services based on selected category
  const getCurrentServices = () => {
    const categoryServices = servicesData[selectedCategory];
    
    if (selectedCategory === "PPF") {
      return categoryServices as PPFService[];
    }
    
    return categoryServices as FixedPriceService[];
  };

  const currentServices = getCurrentServices();

  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-20 md:pb-0">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-12 max-w-7xl">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="relative flex items-center justify-center mb-8">
            <div className="flex-1 h-px bg-white/20"></div>
            <span className="px-6 text-sm font-semibold uppercase tracking-wider text-primary">
              Dubai • Grand Touch Studio
            </span>
            <div className="flex-1 h-px bg-white/20"></div>
          </div>
          <p className="text-white/60 text-sm mb-4">STEK Certified PPF / STEK Tint / Ceramic / Detailing</p>
        </div>

        {/* STEP 1: Vehicle Size Selection */}
        <section className="mb-16">
          <div className="relative flex items-center justify-center mb-8">
            <div className="flex-1 h-px bg-white/20"></div>
            <span className="px-6 text-sm font-semibold uppercase tracking-wider text-primary">
              Vehicle Size
            </span>
            <div className="flex-1 h-px bg-white/20"></div>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-center text-primary mb-8">
            Select Your Vehicle Size
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-8">
            {(["Small", "Medium", "Large"] as VehicleSize[]).map((size) => (
              <button
                key={size}
                onClick={() => {
                  setSelectedSize(size);
                  scrollToService();
                }}
                className={`relative bg-white rounded-xl overflow-hidden transition-all duration-300 ${
                  selectedSize === size
                    ? "ring-2 ring-primary ring-offset-2 ring-offset-[#0f0f0f] shadow-[0_0_30px_rgba(248,180,0,0.5)]"
                    : "ring-2 ring-transparent hover:ring-white/20"
                }`}
              >
                <div className="h-[200px] bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden">
                  <img 
                    src={getCarImage(size)} 
                    alt={`${size} vehicle - ${size === 'Small' ? 'Porsche GT3' : size === 'Medium' ? 'Porsche Cayenne' : 'Mercedes G-Wagon'}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4 bg-white">
                  <p className="text-center font-semibold text-lg text-black">{size}</p>
                  <p className="text-center text-xs text-gray-500 mt-1">
                    {size === 'Small' && 'e.g., Porsche GT3'}
                    {size === 'Medium' && 'e.g., Porsche Cayenne'}
                    {size === 'Large' && 'e.g., Mercedes G-Wagon'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* STEP 2: Service Category Selection */}
        <section id="service-selection" className="mb-16">
          <div className="relative flex items-center justify-center mb-8">
            <div className="flex-1 h-px bg-white/20"></div>
            <span className="px-6 text-sm font-semibold uppercase tracking-wider text-primary">
              Services & Packages
            </span>
            <div className="flex-1 h-px bg-white/20"></div>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-center text-primary mb-8">
            Select Service Or Package Type
          </h2>

          <div className="flex flex-wrap justify-center gap-4">
            {(["Package Offers", "PPF", "Ceramic", "Tint", "Polishing"] as ServiceCategory[]).map((category) => (
              <button
                key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`relative flex flex-col items-center justify-center gap-3 px-6 py-4 rounded-xl min-w-[140px] transition-all duration-300 ${
                    selectedCategory === category
                      ? "bg-primary text-black"
                      : "bg-card border border-white/10 text-white hover:border-primary/50"
                  }`}
                >
                  {category === "Package Offers" && (
                    <span className="absolute -top-2 -right-2 bg-primary text-black text-[10px] font-bold px-2 py-0.5 rounded-full">
                      LIMITED OFFER
                    </span>
                  )}
                  <div className="flex items-center justify-center w-full">{getCategoryIcon(category)}</div>
                  <span className="text-sm font-semibold text-center leading-tight">{category}</span>
                </button>
              ))}
          </div>
        </section>

        {/* STEP 3: Service Cards */}
        <section>
          <h3 className="text-2xl md:text-3xl font-bold text-center text-primary mb-8">
            {selectedCategory}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentServices.map((service, index) => {
              const isPPF = selectedCategory === "PPF";
              const isPackageOffers = selectedCategory === "Package Offers";
              const serviceWithPrice = service as PPFService | FixedPriceService;
              const hasSizeBasedPricing = 'prices' in serviceWithPrice;
              
              const price = (isPPF || (isPackageOffers && hasSizeBasedPricing))
                ? getPPFPrice(service as PPFService, selectedSize)
                : (serviceWithPrice as FixedPriceService).price;
              
              const whatsappLink = getWhatsAppLink(
                serviceWithPrice.name,
                selectedSize,
                price
              );

              // Check if this service is selected
              const isSelected = selectedService?.serviceName === serviceWithPrice.name;

              return (
                <div
                  key={index}
                  onClick={() => {
                    setSelectedService({
                      serviceName: serviceWithPrice.name,
                      category: selectedCategory,
                      price: price,
                    });
                    scrollToBooking();
                  }}
                  className={`bg-gradient-to-br from-card to-card/50 rounded-xl overflow-hidden transition-all duration-300 group cursor-pointer ${
                    isSelected
                      ? "border-2 border-primary shadow-[0_0_30px_rgba(248,180,0,0.5)]"
                      : selectedService
                      ? "border border-white/5 opacity-85"
                      : "border border-white/5 hover:border-primary/20"
                  }`}
                >
                  {/* Tag Badge */}
                  {serviceWithPrice.tag && (
                    <div className="bg-primary text-black text-xs font-bold px-4 py-1 text-center">
                      {serviceWithPrice.tag === "Limited Time Offer" && "LIMITED TIME OFFER"}
                      {serviceWithPrice.tag === "Recommended" && "RECOMMENDED"}
                      {serviceWithPrice.tag === "Premium" && "PREMIUM"}
                      {serviceWithPrice.tag === "Entry Level" && "ENTRY LEVEL"}
                      {serviceWithPrice.tag === "Best Value" && "BEST VALUE"}
                      {serviceWithPrice.tag === "Popular" && "POPULAR"}
                      {serviceWithPrice.tag === "Refinement" && "REFINEMENT"}
                    </div>
                  )}

                  {/* Service Image */}
                  <div className="h-[200px] bg-gradient-to-br from-gray-900 to-gray-800 relative overflow-hidden">
                    <img 
                      src={getServiceImage(serviceWithPrice.name, selectedCategory)} 
                      alt={`${serviceWithPrice.name} service`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent"></div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h4 className="text-xl font-bold text-white mb-3 group-hover:text-primary transition-colors">
                      {serviceWithPrice.name}
                    </h4>

                    {/* Description */}
                    <ul className="space-y-2 mb-4">
                      {serviceWithPrice.description.map((item, idx) => (
                        <li key={idx} className="text-sm text-white/70 flex items-start">
                          <span className="text-primary mr-2">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>

                    {/* Price */}
                    <div className="mb-6">
                      <div className="text-3xl font-bold text-white">
                        {formatPrice(price)}
                      </div>
                      {price === 0 && (
                        <div className="text-xs text-white/50 mt-1">Custom quote required</div>
                      )}
                    </div>

                    {/* Status Indicator */}
                    <div>
                      <div
                        className={`block w-full font-semibold py-3 px-4 rounded-lg transition-colors text-center ${
                          isSelected
                            ? "bg-green-600 text-white"
                            : "bg-primary text-black"
                        }`}
                      >
                        <span className="flex items-center justify-center gap-2">
                          {isSelected ? (
                            <>
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Selected
                            </>
                          ) : (
                            <>
                              Select Plan
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Complete Your Booking Section */}
        <section id="booking-checkout" className="mt-16 mb-12">
          <div className="bg-[#1a1a1a] text-white rounded-2xl border border-[#F8B400] max-w-5xl mx-auto p-6 md:p-8 shadow-[0_0_30px_rgba(248,180,0,0.2)]">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-primary">Complete Your Booking</h2>
              <p className="text-xs text-gray-400 mt-1">Lock in your slot and send details to Sean.</p>
            </div>

            {/* Summary Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-[#0f0f0f] rounded-lg">
              <div>
                <p className="text-sm text-gray-400 mb-1">Vehicle Size:</p>
                <p className="font-semibold text-white">{selectedSize || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Selected Service:</p>
                <p className="font-semibold text-white">{selectedService?.serviceName || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Total Price:</p>
                {selectedService?.price && discountApplied ? (
                  <div>
                    <p className="font-semibold text-white/50 line-through text-sm">
                      AED {selectedService.price.toLocaleString()}
                    </p>
                    <p className="font-semibold text-green-400 text-lg">
                      AED {calculateFinalPrice(selectedService.price).toLocaleString()}
                    </p>
                  </div>
                ) : (
                  <p className="font-semibold text-white">
                    {selectedService?.price ? `AED ${selectedService.price.toLocaleString()}` : "—"}
                  </p>
                )}
              </div>
            </div>

            {/* Discount Code Section */}
            {selectedService && (
              <div className="mb-6 p-4 bg-[#0f0f0f] rounded-lg border border-white/10">
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-white">Have a Discount Code?</h3>
                </div>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={discountCode}
                    onChange={(e) => {
                      setDiscountCode(e.target.value.toUpperCase());
                      setDiscountError("");
                    }}
                    placeholder="Enter code (e.g., GT15)"
                    className="flex-1 rounded-lg bg-[#1a1a1a] border border-gray-700 text-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F8B400] transition-all uppercase"
                    disabled={discountApplied}
                  />
                  <button
                    onClick={handleApplyDiscount}
                    disabled={discountApplied || !discountCode.trim()}
                    className="px-6 py-3 bg-primary text-black font-semibold rounded-lg hover:brightness-110 transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {discountApplied ? "Applied" : "Apply"}
                  </button>
                </div>

                {/* Success Message */}
                {discountApplied && (
                  <div className="mt-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-green-400 font-semibold text-sm">Discount Applied! 🎉</p>
                      <p className="text-green-400/80 text-xs mt-1">
                        You saved AED {calculateDiscount(selectedService.price).toLocaleString()} (15% off)
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setDiscountApplied(false);
                        setDiscountCode("");
                      }}
                      className="text-green-400/60 hover:text-green-400 text-xs font-medium"
                    >
                      Remove
                    </button>
                  </div>
                )}

                {/* Error Message */}
                {discountError && !discountApplied && (
                  <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-red-400 font-semibold text-sm">Invalid Code</p>
                      <p className="text-red-400/80 text-xs mt-1">{discountError}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Form or Empty State */}
            {!selectedService ? (
              <div className="text-center py-8">
                <p className="text-gray-400 text-lg">
                  Select a service above to continue your booking.
                </p>
              </div>
            ) : (
              <div>
                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="text-sm text-gray-300 mb-1 block">Full Name</label>
                    <input
                      className="w-full rounded-lg bg-[#0f0f0f] border border-gray-700 text-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F8B400] transition-all"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-300 mb-1 block">Phone / WhatsApp Number</label>
                    <input
                      className="w-full rounded-lg bg-[#0f0f0f] border border-gray-700 text-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F8B400] transition-all"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="XX XXX XXXX"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-300 mb-1 block">Vehicle Make & Model</label>
                    <input
                      className="w-full rounded-lg bg-[#0f0f0f] border border-gray-700 text-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F8B400] transition-all"
                      value={vehicleInfo}
                      onChange={(e) => setVehicleInfo(e.target.value)}
                      placeholder="e.g., Mercedes G63"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleCompleteBooking}
                  className="w-full bg-[#F8B400] text-black font-semibold rounded-lg py-3 text-center mt-6 hover:brightness-110 transition disabled:opacity-40"
                  disabled={!selectedService}
                >
                  Complete Booking
                </button>

                <p className="text-xs text-gray-500 text-center mt-2">
                  We'll email your booking details to our team and open WhatsApp so you can confirm with Sean.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Booking;

