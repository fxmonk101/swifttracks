import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { Leaf, Zap, Recycle, TreePine, Droplets, Wind } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import sustainabilityImage from "@/assets/sustainability.jpg";

const Section = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  const { ref, isVisible } = useScrollAnimation();
  return <div ref={ref} className={`transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}>{children}</div>;
};

const SustainabilityPage = () => (
  <div className="min-h-screen flex flex-col">
    <AppHeader />
    <section className="bg-secondary py-20">
      <div className="container text-center">
        <h1 className="font-display text-5xl md:text-7xl font-black text-secondary-foreground"><span className="text-primary">GREEN</span> LOGISTICS</h1>
        <p className="text-secondary-foreground/70 text-lg mt-4 max-w-2xl mx-auto">Our commitment to sustainable, eco-friendly delivery.</p>
      </div>
    </section>

    <section className="container py-16">
      <Section>
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-display text-4xl font-black text-foreground mb-4">DELIVERING A<br /><span className="text-primary">GREENER FUTURE</span></h2>
            <p className="text-muted-foreground leading-relaxed mb-4">SwiftTrack is committed to reducing our environmental footprint. By 2030, we aim to achieve carbon-neutral operations across our entire logistics network.</p>
            <p className="text-muted-foreground leading-relaxed">Our fleet is transitioning to electric vehicles, our facilities run on renewable energy, and our packaging is 100% recyclable.</p>
          </div>
          <div className="rounded-2xl overflow-hidden shadow-2xl">
            <img src={sustainabilityImage} alt="Eco-friendly delivery" className="w-full h-auto" loading="lazy" width={1200} height={800} />
          </div>
        </div>
      </Section>
    </section>

    <section className="bg-muted/50 py-16">
      <div className="container">
        <Section>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Zap, title: "Electric Fleet", desc: "40% of our delivery vehicles are now electric, with 100% EV target by 2028.", stat: "40%" },
              { icon: Recycle, title: "Zero Waste Packaging", desc: "All our packaging materials are recyclable or compostable.", stat: "100%" },
              { icon: TreePine, title: "Carbon Offset", desc: "We plant one tree for every 100 deliveries made.", stat: "25K+" },
              { icon: Leaf, title: "Green Facilities", desc: "All distribution hubs powered by renewable energy sources.", stat: "15 Hubs" },
              { icon: Droplets, title: "Water Conservation", desc: "Advanced water recycling systems in all vehicle wash facilities.", stat: "60% Less" },
              { icon: Wind, title: "Route Optimization", desc: "AI-powered routing reduces unnecessary mileage by 30%.", stat: "30% Less" },
            ].map((item) => (
              <Card key={item.title} className="hover:shadow-lg transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <item.icon className="h-8 w-8 text-success" />
                    <span className="font-display text-2xl font-black text-primary">{item.stat}</span>
                  </div>
                  <h3 className="font-display text-lg font-bold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
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

export default SustainabilityPage;
