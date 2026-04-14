import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import TrackPage from "./pages/TrackPage";
import AdminPage from "./pages/AdminPage";
import DriverPage from "./pages/DriverPage";
import NotFound from "./pages/NotFound";
import AboutPage from "./pages/AboutPage";
import CareersPage from "./pages/CareersPage";
import PressPage from "./pages/PressPage";
import SustainabilityPage from "./pages/SustainabilityPage";
import ServicesGuidePage from "./pages/ServicesGuidePage";
import ServicesPage from "./pages/ServicesPage";
import SupportPage from "./pages/SupportPage";
import SchedulePickupPage from "./pages/SchedulePickupPage";
import FAQPage from "./pages/FAQPage";
import ReviewsPage from "./pages/ReviewsPage";
import QuotePage from "./pages/QuotePage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import CookiesPage from "./pages/CookiesPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/track" element={<TrackPage />} />
          <Route path="/track/:id" element={<TrackPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/driver" element={<DriverPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/careers" element={<CareersPage />} />
          <Route path="/press" element={<PressPage />} />
          <Route path="/sustainability" element={<SustainabilityPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/services-guide" element={<ServicesGuidePage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/schedule-pickup" element={<SchedulePickupPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/reviews" element={<ReviewsPage />} />
          <Route path="/quote" element={<QuotePage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/cookies" element={<CookiesPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
