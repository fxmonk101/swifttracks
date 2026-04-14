import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { Zap, Truck, Globe, Clock, Shield, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const Section = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  const { ref, isVisible } = useScrollAnimation();
  return <div ref={ref} className={`transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}>{children}</div>;
};

const services = [
  {
    icon: Zap, title: "Express Overnight", badge: "FASTEST", badgeColor: "bg-primary text-primary-foreground",
    delivery: "Next business day by 10:30 AM", weight: "Up to 150 lbs", price: "From $24.99",
    features: ["Guaranteed delivery time", "Real-time GPS tracking", "Signature confirmation", "Priority handling", "Full insurance included"],
  },
  {
    icon: Truck, title: "Standard Ground", badge: "POPULAR", badgeColor: "bg-secondary text-secondary-foreground",
    delivery: "3-5 business days", weight: "Up to 150 lbs", price: "From $9.99",
    features: ["Full tracking", "Delivery notifications", "Drop-off flexibility", "Saturday delivery available", "Insurance up to $100"],
  },
  {
    icon: Globe, title: "Economy Saver", badge: "VALUE", badgeColor: "bg-accent text-accent-foreground",
    delivery: "5-7 business days", weight: "Up to 70 lbs", price: "From $5.99",
    features: ["Full tracking", "Email notifications", "Budget-friendly", "Ideal for non-urgent items", "Basic insurance included"],
  },
];

const ServicesGuidePage = () => (
  <div className="min-h-screen flex flex-col">
    <AppHeader />
    <section className="bg-secondary py-20">
      <div className="container text-center">
        <h1 className="font-display text-5xl md:text-7xl font-black text-secondary-foreground">SERVICES <span className="text-primary">GUIDE</span></h1>
        <p className="text-secondary-foreground/70 text-lg mt-4 max-w-2xl mx-auto">Choose the perfect shipping solution for your needs.</p>
      </div>
    </section>

    <section className="container py-16">
      <Section>
        <div className="grid md:grid-cols-3 gap-8">
          {services.map((s) => (
            <Card key={s.title} className="hover:shadow-xl transition-all overflow-hidden">
              <CardContent className="p-0">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <s.icon className="h-10 w-10 text-primary" />
                    <span className={`${s.badgeColor} text-xs font-bold font-mono px-2.5 py-1 rounded-full`}>{s.badge}</span>
                  </div>
                  <h3 className="font-display text-2xl font-black text-foreground mb-4">{s.title}</h3>
                  <div className="space-y-2 mb-4 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span className="font-semibold text-foreground">{s.delivery}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Max Weight</span><span className="font-semibold text-foreground">{s.weight}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Price</span><span className="font-display font-bold text-primary text-lg">{s.price}</span></div>
                  </div>
                  <div className="border-t border-border pt-4 space-y-2">
                    {s.features.map((f) => (
                      <div key={f} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-success shrink-0" />
                        <span className="text-foreground">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>
    </section>

    <section className="bg-muted/50 py-16">
      <div className="container">
        <Section>
          <h2 className="font-display text-4xl font-black text-foreground text-center mb-8">ADDITIONAL SERVICES</h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {[
              { icon: Shield, title: "Signature Required", desc: "Ensure your package is delivered to the right person with mandatory signature confirmation." },
              { icon: Clock, title: "Saturday Delivery", desc: "Get deliveries on Saturdays for Express and Standard Ground shipments." },
              { icon: Globe, title: "Scheduled Delivery", desc: "Choose a specific delivery date that works best for your recipient." },
              { icon: Truck, title: "Large Package Handling", desc: "Special handling for packages exceeding standard dimensions or weight." },
            ].map((s) => (
              <Card key={s.title}>
                <CardContent className="p-6 flex gap-4">
                  <s.icon className="h-8 w-8 text-primary shrink-0" />
                  <div>
                    <h3 className="font-display text-lg font-bold text-foreground mb-1">{s.title}</h3>
                    <p className="text-sm text-muted-foreground">{s.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </Section>
      </div>
    </section>
    <Footer />
  </div>
);

export default ServicesGuidePage;
