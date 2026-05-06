import { useTranslation } from "react-i18next";
import { Globe, FileText, Truck, CheckCircle, ArrowRight, Plane, Ship, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import internationalImage from "@/assets/international-shipping.jpg";
import airFreightImage from "@/assets/air-freight.jpg";
import seaFreightImage from "@/assets/hero-sea.jpg";
import roadRailImage from "@/assets/hero-land-fleet.jpg";

const Section = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  const { ref, isVisible } = useScrollAnimation();
  return (
    <div ref={ref} className={`transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}>
      {children}
    </div>
  );
};

const InternationalPage = () => {
  const { t } = useTranslation();

  const steps = [
    { icon: FileText, title: t("international.step1"), desc: t("international.step1Desc") },
    { icon: Truck, title: t("international.step2"), desc: t("international.step2Desc") },
    { icon: Globe, title: t("international.step3"), desc: t("international.step3Desc") },
    { icon: CheckCircle, title: t("international.step4"), desc: t("international.step4Desc") },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <PageTransition>
        {/* Hero */}
        <section className="relative overflow-hidden bg-secondary py-20">
          <img src={internationalImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-15" />
          <div className="absolute inset-0 bg-gradient-to-r from-secondary via-secondary/95 to-secondary/70" />
          <div className="container relative z-10">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-primary/20 border border-primary/30 rounded-full px-4 py-1.5 mb-6">
                <Globe className="h-3.5 w-3.5 text-accent" />
                <span className="font-mono text-xs text-accent tracking-wider">INTERNATIONAL</span>
              </div>
              <h1 className="font-display text-4xl md:text-6xl font-black text-secondary-foreground leading-tight mb-4">
                {t("international.title")}
              </h1>
              <p className="text-secondary-foreground/70 text-lg mb-8">{t("international.heroDesc")}</p>
              <div className="flex flex-wrap gap-4">
                <div className="bg-secondary-foreground/10 rounded-lg px-4 py-2 text-center">
                  <p className="font-display text-2xl font-black text-accent">220+</p>
                  <p className="text-secondary-foreground/60 text-xs">{t("international.countries")}</p>
                </div>
                <div className="bg-secondary-foreground/10 rounded-lg px-4 py-2 text-center">
                  <p className="font-display text-2xl font-black text-accent">24/7</p>
                  <p className="text-secondary-foreground/60 text-xs">{t("international.customs")}</p>
                </div>
                <div className="bg-secondary-foreground/10 rounded-lg px-4 py-2 text-center">
                  <p className="font-display text-2xl font-black text-accent">100%</p>
                  <p className="text-secondary-foreground/60 text-xs">{t("international.doorToDoor")}</p>
                </div>
              </div>
              <Link to="/quote">
                <Button className="mt-8 bg-primary hover:bg-primary/90 font-display font-bold text-base px-8 py-6">
                  {t("international.getQuote")} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Services */}
        <section className="container py-16">
          <Section>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: Plane, title: "Express Air", desc: "1-3 business days worldwide", image: airFreightImage },
                { icon: Ship, title: "Ocean Freight", desc: "Cost-effective for large shipments", image: seaFreightImage },
                { icon: Truck, title: "Road & Rail", desc: "Cross-border ground transport", image: roadRailImage },
              ].map((s) => (
                <Card key={s.title} className="group hover:shadow-xl transition-all hover:-translate-y-1 overflow-hidden">
                  <CardContent className="p-0">
                    {s.image && (
                      <img src={s.image} alt={s.title} className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" width={640} height={400} />
                    )}
                    <div className="p-6">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                        <s.icon className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="font-display text-lg font-bold mb-1">{s.title}</h3>
                      <p className="text-sm text-muted-foreground">{s.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </Section>
        </section>

        {/* How It Works */}
        <section className="bg-muted/50 py-16">
          <div className="container">
            <Section>
              <h2 className="font-display text-3xl md:text-4xl font-black text-center mb-12">{t("international.howItWorks")}</h2>
              <div className="grid md:grid-cols-4 gap-6">
                {steps.map((step, i) => (
                  <div key={i} className="text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <step.icon className="h-7 w-7 text-primary" />
                    </div>
                    <div className="font-mono text-xs text-primary mb-2">STEP {i + 1}</div>
                    <h3 className="font-display text-lg font-bold mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.desc}</p>
                  </div>
                ))}
              </div>
            </Section>
          </div>
        </section>

        {/* Countries */}
        <section className="container py-16">
          <Section>
            <div className="text-center mb-8">
              <h2 className="font-display text-3xl font-black">Popular Destinations</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {["🇬🇧 United Kingdom", "🇩🇪 Germany", "🇫🇷 France", "🇯🇵 Japan", "🇦🇺 Australia", "🇨🇳 China", "🇧🇷 Brazil", "🇮🇳 India", "🇰🇷 South Korea", "🇲🇽 Mexico"].map((c) => (
                <div key={c} className="bg-card border border-border rounded-lg p-3 text-center text-sm font-medium hover:border-primary transition-colors cursor-pointer">
                  {c}
                </div>
              ))}
            </div>
          </Section>
        </section>
      </PageTransition>
      <Footer />
    </div>
  );
};

export default InternationalPage;
