import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { Zap, Truck, Globe, Shield, Clock, Package, CheckCircle, ArrowRight, Cpu, ShoppingBag, Wrench, Home, Boxes, PawPrint } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import deliveryVanImage from "@/assets/hero-trucks.jpg";
import planeImage from "@/assets/hero-land-fleet.jpg";

const Section = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  const { ref, isVisible } = useScrollAnimation();
  return <div ref={ref} className={`transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}>{children}</div>;
};

const ServicesPage = () => (
  <div className="min-h-screen flex flex-col">
    <AppHeader />
    <section className="relative bg-secondary py-20 overflow-hidden">
      <div className="absolute inset-0">
        <img src={planeImage} alt="Air freight" className="w-full h-full object-cover opacity-15" />
        <div className="absolute inset-0 bg-gradient-to-r from-secondary via-secondary/95 to-secondary/70" />
      </div>
      <div className="container relative z-10 text-center">
        <h1 className="font-display text-5xl md:text-7xl font-black text-secondary-foreground">OUR <span className="text-primary">SERVICES</span></h1>
        <p className="text-secondary-foreground/70 text-lg mt-4 max-w-2xl mx-auto">Comprehensive shipping solutions for every need — from same-day express to economy ground.</p>
      </div>
    </section>

    <section className="container py-16">
      <Section>
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-display text-4xl font-black text-foreground mb-4">FAST, RELIABLE<br /><span className="text-primary">DELIVERY</span></h2>
            <p className="text-muted-foreground leading-relaxed mb-6">Whether you need next-day express or budget-friendly economy shipping, TransportHaven has the right solution. Every shipment includes real-time GPS tracking and delivery notifications.</p>
            <Link to="/quote"><Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold tracking-wide">GET A QUOTE <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
          </div>
          <div className="rounded-2xl overflow-hidden shadow-2xl">
            <img src={deliveryVanImage} alt="TransportHaven delivery van" className="w-full h-auto" loading="lazy" width={1920} height={800} />
          </div>
        </div>
      </Section>
    </section>

    <section className="bg-muted/50 py-16">
      <div className="container">
        <Section>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Zap, title: "Express Overnight", badge: "FASTEST", badgeColor: "bg-primary text-primary-foreground", price: "From $24.99", delivery: "Next day by 10:30 AM", features: ["Guaranteed delivery time", "Priority handling", "Full insurance", "Signature confirmation"] },
              { icon: Truck, title: "Standard Ground", badge: "POPULAR", badgeColor: "bg-secondary text-secondary-foreground", price: "From $9.99", delivery: "3-5 business days", features: ["Full tracking", "Delivery notifications", "Saturday delivery", "Insurance up to $100"] },
              { icon: Globe, title: "Economy Saver", badge: "VALUE", badgeColor: "bg-accent text-accent-foreground", price: "From $5.99", delivery: "5-7 business days", features: ["Full tracking", "Email notifications", "Budget-friendly", "Basic insurance"] },
            ].map((s) => (
              <Card key={s.title} className="hover:shadow-xl transition-all overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <s.icon className="h-10 w-10 text-primary" />
                    <span className={`${s.badgeColor} text-xs font-bold font-mono px-2.5 py-1 rounded-full`}>{s.badge}</span>
                  </div>
                  <h3 className="font-display text-2xl font-black text-foreground mb-1">{s.title}</h3>
                  <p className="font-display text-xl font-bold text-primary mb-1">{s.price}</p>
                  <p className="text-sm text-muted-foreground mb-4">{s.delivery}</p>
                  <div className="space-y-2">
                    {s.features.map((f) => (
                      <div key={f} className="flex items-center gap-2 text-sm"><CheckCircle className="h-4 w-4 text-success shrink-0" /><span className="text-foreground">{f}</span></div>
                    ))}
                  </div>
                  <Link to="/quote"><Button className="w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold">GET QUOTE</Button></Link>
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

export default ServicesPage;
