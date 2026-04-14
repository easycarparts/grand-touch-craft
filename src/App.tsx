import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Services from "./pages/Services";
import Portfolio from "./pages/Portfolio";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Blog from "./pages/Blog";
import Booking from "./pages/Booking";
import ThankYou from "./pages/ThankYou";
import ThankYouPayment from "./pages/ThankYouPayment";
import CeramicCoatingGuide from "./pages/articles/CeramicCoatingGuide";
import PPFvsCeramic from "./pages/articles/PPFvsCeramic";
import PpfCostCalculator from "./pages/PpfCostCalculator";
import PaintCorrectionTechniques from "./pages/articles/PaintCorrectionTechniques";
import CustomVinylWraps from "./pages/articles/CustomVinylWraps";
import PerformanceTuning from "./pages/articles/PerformanceTuning";
import ClassicCarRestoration from "./pages/articles/ClassicCarRestoration";
import IsPpfWorthItDubai from "./pages/articles/IsPpfWorthItDubai";
import PpfVsCeramicDubai from "./pages/articles/PpfVsCeramicDubai";
import PpfDubaiFullFrontVsFullBody from "./pages/articles/PpfDubaiFullFrontVsFullBody";
import PpfLongevityDubaiHeat from "./pages/articles/PpfLongevityDubaiHeat";
import PpfWarrantyClaimsDubai from "./pages/articles/PpfWarrantyClaimsDubai";
import PpfCostDubaiPricingGuide from "./pages/articles/PpfCostDubaiPricingGuide";
import MatteVsGlossPpfDubai from "./pages/articles/MatteVsGlossPpfDubai";
import PpfDubaiQuote from "./pages/PpfDubaiQuote";
import PpfDubaiQuoteV1 from "./pages/PpfDubaiQuoteV1";
import AdminFunnelDashboard from "./pages/AdminFunnelDashboard";
import AdminLogin from "./pages/AdminLogin";
import AdminLeads from "./pages/AdminLeads";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsAndConditions from "./pages/TermsAndConditions";
import NotFound from "./pages/NotFound";
import OctaneB2B from "./pages/OctaneB2B";
import Partner2B2B from "./pages/Partner2B2B";
import TechnicalResourcesB2B from "./pages/TechnicalResourcesB2B";
import { RequireAdmin } from "@/components/admin/RequireAdmin";
import G700Customizer from "./pages/G700Customizer";

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
            <Route path="/g700-customizer" element={<G700Customizer />} />
            <Route path="/ppf-dubai" element={<Navigate to="/ppf-cost-calculator" replace />} />
            <Route path="/ppf-cost-calculator" element={<PpfCostCalculator />} />
            <Route path="/ppf-dubai-quote" element={<PpfDubaiQuote />} />
            <Route path="/ppf-tiktok-quote" element={<PpfDubaiQuote variant="tiktok" />} />
            <Route path="/ppf-dubai-quote-v1" element={<PpfDubaiQuoteV1 />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route
              path="/admin"
              element={
                <RequireAdmin>
                  <Navigate to="/admin/leads" replace />
                </RequireAdmin>
              }
            />
            <Route
              path="/admin/leads"
              element={
                <RequireAdmin>
                  <AdminLeads />
                </RequireAdmin>
              }
            />
            <Route
              path="/admin/funnel-dashboard"
              element={
                <RequireAdmin>
                  <AdminFunnelDashboard />
                </RequireAdmin>
              }
            />
            <Route path="/bookings" element={<Booking />} />
            <Route path="/thank-you" element={<ThankYou />} />
            <Route path="/thankyou" element={<ThankYouPayment />} />
            {/* Article Routes */}
            <Route path="/blog/ceramic-coating-guide" element={<CeramicCoatingGuide />} />
            <Route path="/blog/ppf-vs-ceramic-coating" element={<PPFvsCeramic />} />
            <Route path="/blog/paint-correction-techniques" element={<PaintCorrectionTechniques />} />
            <Route path="/blog/custom-vinyl-wraps" element={<CustomVinylWraps />} />
            <Route path="/blog/performance-tuning" element={<PerformanceTuning />} />
            <Route path="/blog/classic-car-restoration" element={<ClassicCarRestoration />} />
            <Route path="/blog/is-ppf-worth-it-dubai" element={<IsPpfWorthItDubai />} />
            <Route path="/blog/ppf-vs-ceramic-dubai" element={<PpfVsCeramicDubai />} />
            <Route path="/blog/ppf-dubai-full-front-vs-full-body" element={<PpfDubaiFullFrontVsFullBody />} />
            <Route path="/blog/ppf-longevity-dubai-heat" element={<PpfLongevityDubaiHeat />} />
            <Route path="/blog/ppf-warranty-claims-dubai" element={<PpfWarrantyClaimsDubai />} />
            <Route path="/blog/ppf-cost-dubai-pricing-guide" element={<PpfCostDubaiPricingGuide />} />
            <Route path="/blog/matte-vs-gloss-ppf-dubai" element={<MatteVsGlossPpfDubai />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
            <Route path="/partners/octane-b2b-7f3k" element={<OctaneB2B />} />
            <Route path="/partner/M2Luxury" element={<Partner2B2B />} />
            <Route path="/partners/technical-resources-b2b" element={<TechnicalResourcesB2B />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
