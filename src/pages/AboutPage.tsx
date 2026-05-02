import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { Users, Globe, Shield, Award, Target, Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import teamPhoto from "@/assets/team-photo.jpg";
import warehouseImage from "@/assets/warehouse.jpg";

const Section = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  const { ref, isVisible } = useScrollAnimation();
  return (
    <div ref={ref} className={`transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}>
      {children}
    </div>
  );
};

const AboutPage = () => (
  <div className="min-h-screen flex flex-col">
    <AppHeader />
    <section className="bg-secondary py-20">
      <div className="container text-center">
        <h1 className="font-display text-5xl md:text-7xl font-black text-secondary-foreground">ABOUT <span className="text-primary">US</span></h1>
        <p className="text-secondary-foreground/70 text-lg mt-4 max-w-2xl mx-auto">Building the future of logistics — one delivery at a time.</p>
      </div>
    </section>

    <section className="container py-16">
      <Section>
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="font-mono text-xs text-primary tracking-widest uppercase mb-2">Our Story</p>
            <h2 className="font-display text-4xl font-black text-foreground mb-4">FROM STARTUP TO<br /><span className="text-primary">INDUSTRY LEADER</span></h2>
            <p className="text-muted-foreground leading-relaxed mb-4">Founded in 2018, TransportHaven began with a simple mission: make package delivery transparent and reliable. What started as a small courier service in New York has grown into a nationwide logistics platform serving millions of customers.</p>
            <p className="text-muted-foreground leading-relaxed">Today, we operate 15 distribution hubs, employ over 2,000 drivers, and deliver more than 2.5 million packages annually with a 99.8% on-time delivery rate.</p>
          </div>
          <div className="rounded-2xl overflow-hidden shadow-2xl">
            <img src={teamPhoto} alt="TransportHaven team" className="w-full h-auto" loading="lazy" width={1200} height={800} />
          </div>
        </div>
      </Section>
    </section>

    <section className="bg-muted/50 py-16">
      <div className="container">
        <Section>
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl font-black text-foreground">OUR VALUES</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Target, title: "Reliability", desc: "We deliver on our promises — every package, every time. Our 99.8% on-time rate speaks for itself." },
              { icon: Shield, title: "Transparency", desc: "Real-time GPS tracking and instant notifications keep you informed at every step of the journey." },
              { icon: Heart, title: "Customer First", desc: "Every decision we make starts with one question: how does this make our customers' lives easier?" },
              { icon: Globe, title: "Innovation", desc: "We invest heavily in technology — AI routing, automated sorting, and predictive delivery windows." },
              { icon: Award, title: "Excellence", desc: "Our team is trained to the highest standards. Every driver, every facility, every interaction matters." },
              { icon: Users, title: "Community", desc: "We're proud to serve communities nationwide and committed to sustainable, responsible logistics." },
            ].map((v) => (
              <Card key={v.title} className="hover:shadow-lg transition-all">
                <CardContent className="p-6">
                  <v.icon className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-display text-xl font-bold text-foreground mb-2">{v.title}</h3>
                  <p className="text-sm text-muted-foreground">{v.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </Section>
      </div>
    </section>

    <section className="container py-16">
      <Section>
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="rounded-2xl overflow-hidden shadow-2xl">
            <img src={warehouseImage} alt="TransportHaven facility" className="w-full h-auto" loading="lazy" width={800} height={600} />
          </div>
          <div>
            <h2 className="font-display text-4xl font-black text-foreground mb-6">BY THE NUMBERS</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: "2,000+", label: "Team Members" },
                { value: "15", label: "Distribution Hubs" },
                { value: "50+", label: "States Covered" },
                { value: "2.5M+", label: "Packages/Year" },
                { value: "99.8%", label: "On-Time Rate" },
                { value: "24/7", label: "Live Support" },
              ].map((s) => (
                <div key={s.label} className="bg-muted rounded-lg p-4">
                  <p className="font-display text-3xl font-black text-primary">{s.value}</p>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>
    </section>
    <Footer />
  </div>
);

export default AboutPage;
