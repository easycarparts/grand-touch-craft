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
import CeramicCoatingGuide from "./pages/articles/CeramicCoatingGuide";
import PPFvsCeramic from "./pages/articles/PPFvsCeramic";
import PaintCorrectionTechniques from "./pages/articles/PaintCorrectionTechniques";
import CustomVinylWraps from "./pages/articles/CustomVinylWraps";
import PerformanceTuning from "./pages/articles/PerformanceTuning";
import ClassicCarRestoration from "./pages/articles/ClassicCarRestoration";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/services" element={<Services />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/blog" element={<Blog />} />
          {/* Article Routes */}
          <Route path="/blog/1" element={<CeramicCoatingGuide />} />
          <Route path="/blog/2" element={<PPFvsCeramic />} />
          <Route path="/blog/3" element={<PaintCorrectionTechniques />} />
          <Route path="/blog/4" element={<CustomVinylWraps />} />
          <Route path="/blog/5" element={<PerformanceTuning />} />
          <Route path="/blog/6" element={<ClassicCarRestoration />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
