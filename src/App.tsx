import { Suspense, lazy, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { RequireAdmin } from "@/components/admin/RequireAdmin";

/**
 * Every page is lazy-loaded so each route ships only its own chunk. Before this
 * change the whole site was ONE ~3MB bundle (~690KB gzipped) — paid-ad landing
 * pages (tint/PPF funnels) paid the full parse cost on every click, which is
 * lethal inside TikTok/Instagram in-app browsers.
 */
const Index = lazy(() => import("./pages/Index"));
const Services = lazy(() => import("./pages/Services"));
const Portfolio = lazy(() => import("./pages/Portfolio"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Blog = lazy(() => import("./pages/Blog"));
const Booking = lazy(() => import("./pages/Booking"));
const ThankYou = lazy(() => import("./pages/ThankYou"));
const ThankYouPayment = lazy(() => import("./pages/ThankYouPayment"));
const CeramicCoatingGuide = lazy(() => import("./pages/articles/CeramicCoatingGuide"));
const PPFvsCeramic = lazy(() => import("./pages/articles/PPFvsCeramic"));
const PpfCostCalculator = lazy(() => import("./pages/PpfCostCalculator"));
const BestPpfStudioDubai = lazy(() => import("./pages/BestPpfStudioDubai"));
const PpfFullPpfCalculator = lazy(() => import("./pages/PpfFullPpfCalculator"));
const PpfFullPpfGuidedCalculator = lazy(() => import("./pages/PpfFullPpfGuidedCalculator"));
const PpfFullPpfGuidedCalculatorV2 = lazy(() => import("./pages/PpfFullPpfGuidedCalculatorV2"));
const PpfMetaPriceBuilder = lazy(() => import("./pages/PpfMetaPriceBuilder"));
const PpfWhatsAppDirect = lazy(() => import("./pages/PpfWhatsAppDirect"));
const TintDubaiQuoteFunnel = lazy(() => import("./pages/TintDubaiQuoteFunnel"));
const TintDubaiFastFunnel = lazy(() => import("./pages/TintDubaiFastFunnel"));
const CeramicDubaiFunnel = lazy(() => import("./pages/CeramicDubaiFunnel"));
const PaintCorrectionTechniques = lazy(() => import("./pages/articles/PaintCorrectionTechniques"));
const CustomVinylWraps = lazy(() => import("./pages/articles/CustomVinylWraps"));
const PerformanceTuning = lazy(() => import("./pages/articles/PerformanceTuning"));
const ClassicCarRestoration = lazy(() => import("./pages/articles/ClassicCarRestoration"));
const IsPpfWorthItDubai = lazy(() => import("./pages/articles/IsPpfWorthItDubai"));
const PpfVsCeramicDubai = lazy(() => import("./pages/articles/PpfVsCeramicDubai"));
const PpfDubaiFullFrontVsFullBody = lazy(() => import("./pages/articles/PpfDubaiFullFrontVsFullBody"));
const PpfLongevityDubaiHeat = lazy(() => import("./pages/articles/PpfLongevityDubaiHeat"));
const PpfWarrantyClaimsDubai = lazy(() => import("./pages/articles/PpfWarrantyClaimsDubai"));
const PpfCostDubaiPricingGuide = lazy(() => import("./pages/articles/PpfCostDubaiPricingGuide"));
const MatteVsGlossPpfDubai = lazy(() => import("./pages/articles/MatteVsGlossPpfDubai"));
const NissanPatrolPpfDubai = lazy(() => import("./pages/articles/NissanPatrolPpfDubai"));
const NewCarPpfDubai = lazy(() => import("./pages/articles/NewCarPpfDubai"));
const LexusLx600PpfDubai = lazy(() => import("./pages/articles/LexusLx600PpfDubai"));
const PpfDubaiQuote = lazy(() => import("./pages/PpfDubaiQuote"));
const PpfDubaiQuoteV1 = lazy(() => import("./pages/PpfDubaiQuoteV1"));
const PpfTikTokGuidedQuote = lazy(() => import("./pages/PpfTikTokGuidedQuote"));
const PpfTikTokGuidedFunnel = lazy(() => import("./pages/PpfTikTokGuidedFunnel"));
const AdminFunnelDashboard = lazy(() => import("./pages/AdminFunnelDashboard"));
const AdminGoogleAdsDashboard = lazy(() => import("./pages/AdminGoogleAdsDashboard"));
const AdminActionPlan = lazy(() => import("./pages/AdminActionPlan"));
const AdminCeramicBookings = lazy(() => import("./pages/AdminCeramicBookings"));
const AdminTintBookings = lazy(() => import("./pages/AdminTintBookings"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminLeads = lazy(() => import("./pages/AdminLeads"));
const AdminLeadTasks = lazy(() => import("./pages/AdminLeadTasks"));
const AdminCloseRates = lazy(() => import("./pages/AdminCloseRates"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsAndConditions = lazy(() => import("./pages/TermsAndConditions"));
const CeramicBookingConfirmation = lazy(() => import("./pages/CeramicBookingConfirmation"));
const TintBookingConfirmation = lazy(() => import("./pages/TintBookingConfirmation"));
const NotFound = lazy(() => import("./pages/NotFound"));
const OctaneB2B = lazy(() => import("./pages/OctaneB2B"));
const Partner2B2B = lazy(() => import("./pages/Partner2B2B"));
const TechnicalResourcesB2B = lazy(() => import("./pages/TechnicalResourcesB2B"));
const G700Customizer = lazy(() => import("./pages/G700Customizer"));
const PpfInvestorProposal = lazy(() => import("./pages/PpfInvestorProposal"));
const PpfInvestorProposalV2 = lazy(() => import("./pages/PpfInvestorProposalV2"));
const PpfInvestorProposalV3 = lazy(() => import("./pages/PpfInvestorProposalV3"));
const WrapcoTakeoverProposal = lazy(() => import("./pages/WrapcoTakeoverProposal"));

const queryClient = new QueryClient();

/** Keeps `?utm_…`, `ttclid`, etc. when swapping TikTok landing paths (cache-bust routes). */
function RedirectPreserveSearch({ to }: { to: string }) {
  const { search, hash } = useLocation();
  return <Navigate to={{ pathname: to, search, hash }} replace />;
}

/** Minimal route-transition fallback — matches the funnel pages' dark theme. */
const RouteFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-[#070707]">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-[#f7b52b]" />
  </div>
);

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
          <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/services" element={<Services />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/g700-customizer" element={<G700Customizer />} />
            <Route path="/ppf-dubai" element={<Navigate to="/ppf-cost-calculator" replace />} />
            <Route path="/best-ppf-studio-dubai" element={<BestPpfStudioDubai />} />
            <Route path="/ppf-cost-calculator" element={<PpfCostCalculator />} />
            <Route path="/ppf-full-ppf-calculator" element={<PpfFullPpfCalculator />} />
            <Route path="/ppf-full-ppf-calculator-guided" element={<PpfFullPpfGuidedCalculator />} />
            <Route path="/ppf-full-ppf-calculator-guided-v2" element={<PpfFullPpfGuidedCalculatorV2 />} />
            <Route path="/ppf-full-ppf-calculator-guided-v3" element={<PpfFullPpfGuidedCalculatorV2 variant="v3" />} />
            <Route path="/ppf-meta-full-car-ppf-v2" element={<PpfFullPpfGuidedCalculatorV2 variant="meta" />} />
            {/* Light WhatsApp-first funnel (June 2026 test). Keyword-aligned URL for ad relevance. */}
            <Route path="/paint-protection-film-dubai" element={<PpfWhatsAppDirect />} />
            <Route path="/ppf-tiktok-full-car-ppf" element={<PpfFullPpfGuidedCalculator variant="tiktok" />} />
            <Route path="/ppf-dubai-quote" element={<PpfFullPpfGuidedCalculatorV2 variant="dubai_quote" />} />
            {/* Google fresh-start funnel (Jul 2026): price shown openly, soft capture. */}
            <Route path="/ppf-dubai-price" element={<PpfFullPpfGuidedCalculatorV2 variant="price" />} />
            {/* Free-play price builder (staging for the /ppf-dubai-price swap — not linked from ads yet). */}
            <Route path="/ppf-dubai-price-v2" element={<PpfFullPpfGuidedCalculatorV2 variant="builder" />} />
            {/* Meta-ads one-screen price builder (Jul 2026): Meta pixel only, two film lines. */}
            <Route path="/ppf-meta-builder" element={<PpfMetaPriceBuilder />} />
            {/* FAST tint funnel (Jul 2026): price visible with zero clicks, one-action
                capture (WhatsApp tap or phone submit). Replaced the guided 3-step
                funnel after 0 leads from ~360 paid clicks — old version kept on
                /tint-dubai-full for comparison/rollback. */}
            <Route path="/tint-dubai" element={<TintDubaiFastFunnel />} />
            <Route path="/tint-dubai-full" element={<TintDubaiQuoteFunnel />} />
            <Route path="/ceramic-dubai" element={<CeramicDubaiFunnel />} />
            <Route path="/tint-booking/:token" element={<TintBookingConfirmation />} />
            <Route path="/ceramic-booking/:token" element={<CeramicBookingConfirmation />} />
            <Route path="/ppf-tiktok-quote" element={<RedirectPreserveSearch to="/ppf-tiktok-quote_2" />} />
            <Route path="/ppf-tiktok-quote-v2" element={<RedirectPreserveSearch to="/ppf-tiktok-quote_2" />} />
            <Route path="/ppf-tiktok-quote_2" element={<PpfDubaiQuote variant="tiktok" />} />
            <Route path="/ppf-tiktok-quote-guided" element={<PpfTikTokGuidedQuote />} />
            <Route path="/ppf-tiktok-quote-guided/funnel" element={<PpfTikTokGuidedFunnel />} />
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
              path="/admin/leads/tasks"
              element={
                <RequireAdmin>
                  <AdminLeadTasks />
                </RequireAdmin>
              }
            />
            <Route
              path="/admin/close-rates"
              element={
                <RequireAdmin>
                  <AdminCloseRates />
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
            <Route
              path="/admin/google-ads-dashboard"
              element={
                <RequireAdmin>
                  <AdminGoogleAdsDashboard />
                </RequireAdmin>
              }
            />
            <Route
              path="/admin/action-plan"
              element={
                <RequireAdmin>
                  <AdminActionPlan />
                </RequireAdmin>
              }
            />
            <Route
              path="/admin/tint-bookings"
              element={
                <RequireAdmin>
                  <AdminTintBookings />
                </RequireAdmin>
              }
            />
            <Route
              path="/admin/ceramic-bookings"
              element={
                <RequireAdmin>
                  <AdminCeramicBookings />
                </RequireAdmin>
              }
            />
            <Route
              path="/admin/users"
              element={
                <RequireAdmin>
                  <AdminUsers />
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
            <Route path="/blog/nissan-patrol-ppf-dubai" element={<NissanPatrolPpfDubai />} />
            <Route path="/blog/new-car-ppf-dubai" element={<NewCarPpfDubai />} />
            <Route path="/blog/lexus-lx600-ppf-dubai" element={<LexusLx600PpfDubai />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
            <Route path="/partners/octane-b2b-7f3k" element={<OctaneB2B />} />
            <Route path="/partner/M2Luxury" element={<Partner2B2B />} />
            <Route path="/partners/technical-resources-b2b" element={<TechnicalResourcesB2B />} />
            <Route path="/private/ppf-investor-proposal" element={<PpfInvestorProposal />} />
            <Route path="/private/ppf-investor-proposal-v2" element={<PpfInvestorProposalV2 />} />
            <Route path="/private/ppf-investor-proposal-v3" element={<PpfInvestorProposalV3 />} />
            {/* Wrapco manager-takeover & earn-in proposal (Jul 2026) — password gated, noindex. */}
            <Route path="/private/wrapco-proposal" element={<WrapcoTakeoverProposal />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
