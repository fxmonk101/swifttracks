import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { Calendar, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const Section = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  const { ref, isVisible } = useScrollAnimation();
  return <div ref={ref} className={`transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}>{children}</div>;
};

const releases = [
  { date: "Mar 15, 2024", title: "SwiftTrack Expands to 50 States with New Distribution Hub in Seattle", excerpt: "Completion of our nationwide network with a new state-of-the-art facility in the Pacific Northwest." },
  { date: "Jan 22, 2024", title: "SwiftTrack Achieves 99.8% On-Time Delivery Rate in Q4 2023", excerpt: "Record-breaking performance driven by AI-powered route optimization." },
  { date: "Nov 8, 2023", title: "SwiftTrack Launches Real-Time GPS Tracking for All Shipments", excerpt: "Customers can now watch their packages move in real time on an interactive map." },
  { date: "Sep 3, 2023", title: "SwiftTrack Raises $50M Series C to Fuel Nationwide Expansion", excerpt: "Funding led by Logistics Ventures to expand fleet and technology infrastructure." },
  { date: "Jun 14, 2023", title: "SwiftTrack Named 'Most Innovative Logistics Company' by TechCrunch", excerpt: "Recognition for our pioneering approach to transparent, technology-driven delivery." },
];

const PressPage = () => (
  <div className="min-h-screen flex flex-col">
    <AppHeader />
    <section className="bg-secondary py-20">
      <div className="container text-center">
        <h1 className="font-display text-5xl md:text-7xl font-black text-secondary-foreground">PRESS & <span className="text-primary">NEWS</span></h1>
        <p className="text-secondary-foreground/70 text-lg mt-4 max-w-2xl mx-auto">Latest news and announcements from SwiftTrack.</p>
      </div>
    </section>

    <section className="container py-16">
      <Section>
        <div className="max-w-3xl mx-auto space-y-6">
          {releases.map((r) => (
            <Card key={r.title} className="hover:shadow-lg transition-all group cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <Calendar className="h-3 w-3" /> {r.date}
                </div>
                <h3 className="font-display text-xl font-bold text-foreground group-hover:text-primary transition-colors mb-2">{r.title}</h3>
                <p className="text-sm text-muted-foreground">{r.excerpt}</p>
                <span className="inline-flex items-center gap-1 text-primary text-sm font-semibold mt-3">Read more <ExternalLink className="h-3 w-3" /></span>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>
    </section>
    <Footer />
  </div>
);

export default PressPage;
