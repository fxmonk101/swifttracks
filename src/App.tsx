import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatePresence } from "framer-motion";
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
import AuthPage from "./pages/AuthPage";
import CreateShipmentPage from "./pages/CreateShipmentPage";
import InternationalPage from "./pages/InternationalPage";
import BusinessPage from "./pages/BusinessPage";
import ContactPage from "./pages/ContactPage";
import ScrollToTop from "./components/ScrollToTop";
import LiveChatWidget from "./components/LiveChatWidget";

const queryClient = new QueryClient();

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <>
      <ScrollToTop />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
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
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/create-shipment" element={<CreateShipmentPage />} />
        <Route path="/international" element={<InternationalPage />} />
        <Route path="/business" element={<BusinessPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      </AnimatePresence>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AnimatedRoutes />
        <LiveChatWidget />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
