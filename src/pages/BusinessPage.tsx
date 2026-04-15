import { useTranslation } from "react-i18next";
import { Building2, Zap, HeadphonesIcon, BarChart3, ArrowRight, CheckCircle, Globe, Shield, Truck } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import businessImage from "@/assets/business-solutions.jpg";

const Section = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  const { ref, isVisible } = useScrollAnimation();
  return (
    <div ref={ref} className={`transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}>
      {children}
    </div>
  );
};

const BusinessPage = () => {
  const { t } = useTranslation();

  const solutions = [
    { icon: Building2, title: t("business.volumeShipping"), desc: t("business.volumeDesc") },
    { icon: Zap, title: t("business.apiAccess"), desc: t("business.apiDesc") },
    { icon: HeadphonesIcon, title: t("business.dedicated"), desc: t("business.dedicatedDesc") },
    { icon: BarChart3, title: t("business.analytics"), desc: t("business.analyticsDesc") },
  ];

  const plans = [
    { name: t("business.startup"), price: "$99", period: "/mo", features: ["Up to 100 shipments/mo", "Standard support", "Basic tracking API", "Email notifications"] },
    { name: t("business.small"), price: "$299", period: "/mo", features: ["Up to 1,000 shipments/mo", "Priority support", "Full API access", "SMS + Email notifications", "Custom branding"], highlight: true },
    { name: t("business.enterprise"), price: "Custom", period: "", features: ["Unlimited shipments", "24/7 dedicated manager", "Custom API integration", "White-label solutions", "Volume discounts", "SLA guarantee"] },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <PageTransition>
        {/* Hero */}
        <section className="relative overflow-hidden bg-secondary py-20">
          <img src={businessImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-15" />
          <div className="absolute inset-0 bg-gradient-to-r from-secondary via-secondary/95 to-secondary/70" />
          <div className="container relative z-10">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-primary/20 border border-primary/30 rounded-full px-4 py-1.5 mb-6">
                <Building2 className="h-3.5 w-3.5 text-accent" />
                <span className="font-mono text-xs text-accent tracking-wider">BUSINESS</span>
              </div>
              <h1 className="font-display text-4xl md:text-6xl font-black text-secondary-foreground leading-tight mb-4">
                {t("business.title")}
              </h1>
              <p className="text-secondary-foreground/70 text-lg mb-8">{t("business.heroDesc")}</p>
              <Link to="/quote">
                <Button className="bg-primary hover:bg-primary/90 font-display font-bold text-base px-8 py-6">
                  {t("business.getStarted")} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Solutions */}
        <section className="container py-16">
          <Section>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {solutions.map((s) => (
                <Card key={s.title} className="hover:shadow-lg transition-all hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <s.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-display text-lg font-bold mb-2">{s.title}</h3>
                    <p className="text-sm text-muted-foreground">{s.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </Section>
        </section>

        {/* Pricing */}
        <section className="bg-muted/50 py-16">
          <div className="container">
            <Section>
              <h2 className="font-display text-3xl md:text-4xl font-black text-center mb-12">Choose Your Plan</h2>
              <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                {plans.map((plan) => (
                  <Card key={plan.name} className={`${plan.highlight ? "border-primary border-2 shadow-xl relative" : ""}`}>
                    {plan.highlight && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                        MOST POPULAR
                      </div>
                    )}
                    <CardContent className="p-6">
                      <h3 className="font-display text-lg font-bold mb-2">{plan.name}</h3>
                      <div className="mb-4">
                        <span className="font-display text-4xl font-black text-primary">{plan.price}</span>
                        <span className="text-muted-foreground text-sm">{plan.period}</span>
                      </div>
                      <ul className="space-y-2 mb-6">
                        {plan.features.map((f) => (
                          <li key={f} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-success shrink-0" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                      <Button className={`w-full font-display font-bold ${plan.highlight ? "bg-primary hover:bg-primary/90" : ""}`} variant={plan.highlight ? "default" : "outline"}>
                        {t("business.getStarted")}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </Section>
          </div>
        </section>

        {/* Trust badges */}
        <section className="container py-16">
          <Section>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {[
                { icon: Globe, label: "220+ Countries" },
                { icon: Shield, label: "Insured Shipments" },
                { icon: Truck, label: "500+ Fleet Vehicles" },
                { icon: BarChart3, label: "99.8% On-Time" },
              ].map((b) => (
                <div key={b.label} className="flex flex-col items-center gap-2">
                  <b.icon className="h-8 w-8 text-primary" />
                  <span className="font-display text-sm font-bold">{b.label}</span>
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

export default BusinessPage;
