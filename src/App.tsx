import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Services from "./pages/Services";
import Portfolio from "./pages/Portfolio";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Blog from "./pages/Blog";
import Booking from "./pages/Booking";
import ThankYou from "./pages/ThankYou";
import CeramicCoatingGuide from "./pages/articles/CeramicCoatingGuide";
import PPFvsCeramic from "./pages/articles/PPFvsCeramic";
import PaintCorrectionTechniques from "./pages/articles/PaintCorrectionTechniques";
import CustomVinylWraps from "./pages/articles/CustomVinylWraps";
import PerformanceTuning from "./pages/articles/PerformanceTuning";
import ClassicCarRestoration from "./pages/articles/ClassicCarRestoration";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function App() {
  // Hide SEO content when React app loads
  useEffect(() => {
    const hideSEOContent = () => {
      const seoContent = document.getElementById('seo-content');
      if (seoContent) {
        seoContent.style.display = 'none';
      }
    };
    hideSEOContent();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}
        >
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/services" element={<Services />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/bookings" element={<Booking />} />
            <Route path="/thank-you" element={<ThankYou />} />
            {/* Article Routes */}
            <Route path="/blog/ceramic-coating-guide" element={<CeramicCoatingGuide />} />
            <Route path="/blog/ppf-vs-ceramic-coating" element={<PPFvsCeramic />} />
            <Route path="/blog/paint-correction-techniques" element={<PaintCorrectionTechniques />} />
            <Route path="/blog/custom-vinyl-wraps" element={<CustomVinylWraps />} />
            <Route path="/blog/performance-tuning" element={<PerformanceTuning />} />
            <Route path="/blog/classic-car-restoration" element={<ClassicCarRestoration />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
