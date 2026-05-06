import { Link, useNavigate } from "react-router-dom";
import {
  Search, Package, Truck, ArrowRight, MapPin, Clock, Shield,
  CheckCircle, Globe, Zap, Star, ChevronRight, ChevronLeft, Phone, Mail,
  BarChart3, Users, Box, Plane, Ship, Anchor
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useTranslation } from "react-i18next";
import PageTransition from "@/components/PageTransition";

import heroImage from "@/assets/hero-trucks.jpg";
import warehouseImage from "@/assets/warehouse-modern.jpg";
import deliveryPersonImage from "@/assets/delivery-handoff.png";
import mobileTrackingImage from "@/assets/live-tracking.jpg";
import planeImage from "@/assets/plane-flying.jpg";
import deliveryVanImage from "@/assets/hero-land-fleet.jpg";
import airFreightImage from "@/assets/air-freight.jpg";
import seaFreightImage from "@/assets/hero-sea.jpg";
import landFreightImage from "@/assets/hero-land-fleet.jpg";

const Section = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  const { ref, isVisible } = useScrollAnimation();
  return (
    <div ref={ref} className={`transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}>
      {children}
    </div>
  );
};

const Index = () => {
  const [input, setInput] = useState("");
  const navigate = useNavigate();
  const [slide, setSlide] = useState(0);
  const { t } = useTranslation();

  const heroSlides = [
    {
      image: heroImage,
      tag: t("hero.tag1"),
      tagIcon: Zap,
      title: <>{t("hero.title1_1")}<br /><span className="text-primary">{t("hero.title1_2")}</span><br />{t("hero.title1_3")}</>,
      desc: t("hero.desc1"),
    },
    {
      image: planeImage,
      tag: t("hero.tag2"),
      tagIcon: Plane,
      title: <>{t("hero.title2_1")}<br /><span className="text-primary">{t("hero.title2_2")}</span><br />{t("hero.title2_3")}</>,
      desc: t("hero.desc2"),
    },
    {
      image: deliveryVanImage,
      tag: t("hero.tag3"),
      tagIcon: Truck,
      title: <>{t("hero.title3_1")}<br /><span className="text-primary">{t("hero.title3_2")}</span><br />{t("hero.title3_3")}</>,
      desc: t("hero.desc3"),
    },
  ];

  const nextSlide = useCallback(() => setSlide((s) => (s + 1) % heroSlides.length), [heroSlides.length]);
  const prevSlide = useCallback(() => setSlide((s) => (s - 1 + heroSlides.length) % heroSlides.length), [heroSlides.length]);

  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  const handleSearch = () => {
    if (input.trim()) navigate(`/track/${input.trim()}`);
  };

  const current = heroSlides[slide];

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <PageTransition>
        {/* Hero Slider */}
        <section className="relative overflow-hidden bg-secondary">
          {heroSlides.map((s, i) => (
            <div key={i} className={`absolute inset-0 transition-opacity duration-1000 ${i === slide ? "opacity-100" : "opacity-0"}`}>
              <img src={s.image} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-secondary via-secondary/85 to-secondary/30" />
            </div>
          ))}

          <div className="container relative z-10 py-20 md:py-32">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-primary/20 border border-primary/30 rounded-full px-4 py-1.5 mb-6">
                <current.tagIcon className="h-3.5 w-3.5 text-accent" />
                <span className="font-mono text-xs text-accent tracking-wider">{current.tag}</span>
              </div>
              <h1 className="font-display text-5xl md:text-7xl font-black text-secondary-foreground leading-[0.95] mb-5 transition-all duration-500">
                {current.title}
              </h1>
              <p className="text-secondary-foreground/70 text-lg mb-8 max-w-lg leading-relaxed">{current.desc}</p>

              <div className="bg-secondary-foreground/10 backdrop-blur-sm border border-secondary-foreground/20 rounded-xl p-4 max-w-xl">
                <p className="text-secondary-foreground/60 text-xs font-mono mb-3 tracking-wider uppercase">{t("hero.enterTracking")}</p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-foreground/50" />
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      placeholder="ST-2024-AB3F7K9M"
                      className="pl-10 bg-secondary-foreground/10 border-secondary-foreground/20 text-secondary-foreground placeholder:text-secondary-foreground/40 font-mono h-12 text-base"
                    />
                  </div>
                  <Button onClick={handleSearch} className="h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold tracking-wider text-base">
                    {t("hero.trackBtn")} <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
                <div className="flex gap-3 mt-3">
                  {["ST-2024-AB3F7K9M", "ST-2024-XK9P2L4N"].map((tid) => (
                    <button key={tid} onClick={() => navigate(`/track/${tid}`)} className="font-mono text-xs text-secondary-foreground/40 hover:text-accent transition-colors underline underline-offset-2">
                      Try: {tid}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Slider controls */}
            <div className="flex items-center gap-4 mt-8">
              <button onClick={prevSlide} className="w-10 h-10 rounded-full border border-secondary-foreground/20 flex items-center justify-center text-secondary-foreground/60 hover:text-secondary-foreground hover:border-secondary-foreground/40 transition-colors">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="flex gap-2">
                {heroSlides.map((_, i) => (
                  <button key={i} onClick={() => setSlide(i)} className={`h-2 rounded-full transition-all duration-300 ${i === slide ? "w-8 bg-primary" : "w-2 bg-secondary-foreground/30"}`} />
                ))}
              </div>
              <button onClick={nextSlide} className="w-10 h-10 rounded-full border border-secondary-foreground/20 flex items-center justify-center text-secondary-foreground/60 hover:text-secondary-foreground hover:border-secondary-foreground/40 transition-colors">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Animated plane */}
          <div className="absolute top-16 right-0 opacity-10 pointer-events-none hidden md:block">
            <Plane className="h-32 w-32 text-secondary-foreground animate-[flyPlane_12s_linear_infinite]" />
          </div>
        </section>

        {/* Stats Bar */}
        <section className="bg-primary">
          <div className="container py-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {[
                { value: "2.5M+", label: t("stats.packages"), icon: Box },
                { value: "99.8%", label: t("stats.onTime"), icon: Clock },
                { value: "50+", label: t("stats.states"), icon: Globe },
                { value: "24/7", label: t("stats.liveTracking"), icon: MapPin },
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col items-center gap-1">
                  <stat.icon className="h-5 w-5 text-primary-foreground/70 mb-1" />
                  <span className="font-display text-3xl md:text-4xl font-black text-primary-foreground">{stat.value}</span>
                  <span className="text-primary-foreground/70 text-xs font-medium uppercase tracking-wider">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="bg-background">
          <div className="container py-4">
            <Section>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 -mt-8 relative z-10">
                {[
                  { icon: Search, label: t("quickActions.trackPackage"), desc: t("quickActions.realTimeUpdates"), to: "/track" },
                  { icon: Package, label: t("quickActions.getQuote"), desc: t("quickActions.instantPricing"), to: "/quote" },
                  { icon: Clock, label: t("quickActions.schedulePickup"), desc: t("quickActions.weComeToYou"), to: "/schedule-pickup" },
                  { icon: MapPin, label: t("quickActions.servicesGuide"), desc: t("quickActions.compareOptions"), to: "/services-guide" },
                ].map((action) => (
                  <Link key={action.label} to={action.to}>
                    <Card className="hover:shadow-lg transition-all hover:-translate-y-0.5 cursor-pointer border-t-4 border-t-primary bg-card">
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <action.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-foreground">{action.label}</p>
                          <p className="text-xs text-muted-foreground">{action.desc}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </Section>
          </div>
        </section>

        {/* Freight Services */}
        <section className="container py-16 md:py-20">
          <Section>
            <div className="text-center mb-12">
              <p className="font-mono text-xs text-primary tracking-widest uppercase mb-2">{t("freight.subtitle")}</p>
              <h2 className="font-display text-4xl md:text-5xl font-black text-foreground">{t("freight.title")}</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { image: airFreightImage, icon: Plane, title: t("freight.airTitle"), desc: t("freight.airDesc"), color: "from-secondary to-secondary/80" },
                { image: seaFreightImage, icon: Anchor, title: t("freight.seaTitle"), desc: t("freight.seaDesc"), color: "from-primary to-primary/80" },
                { image: landFreightImage, icon: Truck, title: t("freight.landTitle"), desc: t("freight.landDesc"), color: "from-secondary to-secondary/80" },
              ].map((service) => (
                <Card key={service.title} className="group overflow-hidden hover:shadow-2xl transition-all hover:-translate-y-1">
                  <CardContent className="p-0">
                    <div className="relative h-52 overflow-hidden">
                      <img src={service.image} alt={service.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" width={640} height={400} />
                      <div className={`absolute inset-0 bg-gradient-to-t ${service.color} opacity-60`} />
                      <div className="absolute bottom-4 left-4">
                        <div className="w-10 h-10 rounded-lg bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center mb-2">
                          <service.icon className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <h3 className="font-display text-xl font-black text-primary-foreground">{service.title}</h3>
                      </div>
                    </div>
                    <div className="p-5">
                      <p className="text-sm text-muted-foreground mb-4">{service.desc}</p>
                      <Link to="/services" className="inline-flex items-center gap-1 text-primary text-sm font-semibold hover:gap-2 transition-all">
                        {t("freight.getStarted")} <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </Section>
        </section>

        {/* Services */}
        <section className="bg-muted/50 py-16 md:py-20">
          <div className="container">
            <Section>
              <div className="text-center mb-12">
                <p className="font-mono text-xs text-primary tracking-widest uppercase mb-2">{t("services.title")}</p>
                <h2 className="font-display text-4xl md:text-5xl font-black text-foreground">{t("services.subtitle")}</h2>
                <p className="text-muted-foreground mt-3 max-w-xl mx-auto">{t("services.desc")}</p>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { icon: Zap, title: t("services.expressTitle"), desc: t("services.expressDesc"), badge: t("services.fastest"), badgeColor: "bg-primary text-primary-foreground" },
                  { icon: Truck, title: t("services.standardTitle"), desc: t("services.standardDesc"), badge: t("services.popular"), badgeColor: "bg-secondary text-secondary-foreground" },
                  { icon: Globe, title: t("services.economyTitle"), desc: t("services.economyDesc"), badge: t("services.value"), badgeColor: "bg-accent text-accent-foreground" },
                ].map((service) => (
                  <Card key={service.title} className="group hover:shadow-xl transition-all hover:-translate-y-1 overflow-hidden">
                    <CardContent className="p-0">
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                            <service.icon className="h-6 w-6 text-primary" />
                          </div>
                          <span className={`${service.badgeColor} text-xs font-bold font-mono px-2.5 py-1 rounded-full`}>{service.badge}</span>
                        </div>
                        <h3 className="font-display text-xl font-bold mb-2 text-foreground">{service.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{service.desc}</p>
                      </div>
                      <div className="border-t border-border px-6 py-3">
                        <Link to="/services-guide" className="inline-flex items-center gap-1 text-primary text-sm font-semibold hover:gap-2 transition-all">
                          {t("services.learnMore")} <ChevronRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </Section>
          </div>
        </section>

        {/* Plane & Van Visual Banner */}
        <section className="relative overflow-hidden bg-secondary py-12">
          <div className="container relative z-10">
            <Section>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl group">
                  <img src={planeImage} alt="Air freight delivery" className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" width={1920} height={800} />
                  <div className="absolute inset-0 bg-gradient-to-t from-secondary/80 to-transparent flex items-end p-6">
                    <div>
                      <h3 className="font-display text-2xl font-black text-secondary-foreground">AIR EXPRESS</h3>
                      <p className="text-secondary-foreground/70 text-sm">Overnight delivery coast-to-coast</p>
                    </div>
                  </div>
                </div>
                <div className="relative rounded-2xl overflow-hidden shadow-2xl group">
                  <img src={deliveryVanImage} alt="Ground delivery" className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" width={1920} height={800} />
                  <div className="absolute inset-0 bg-gradient-to-t from-secondary/80 to-transparent flex items-end p-6">
                    <div>
                      <h3 className="font-display text-2xl font-black text-secondary-foreground">GROUND FLEET</h3>
                      <p className="text-secondary-foreground/70 text-sm">500+ vehicles covering all 50 states</p>
                    </div>
                  </div>
                </div>
              </div>
            </Section>
          </div>
        </section>

        {/* Feature Showcase */}
        <section className="bg-background py-16 md:py-20">
          <div className="container">
            <Section>
              <div className="grid md:grid-cols-2 gap-8 items-center mb-16">
                <div>
                  <p className="font-mono text-xs text-primary tracking-widest uppercase mb-2">Real-Time Visibility</p>
                  <h2 className="font-display text-3xl md:text-4xl font-black text-foreground mb-4">{t("features.realTimeTitle")}</h2>
                  <p className="text-muted-foreground leading-relaxed mb-6">{t("features.realTimeDesc")}</p>
                  <ul className="space-y-3">
                    {["Interactive map with animated truck marker", "Full route history with timeline events", "Estimated delivery window with live updates", "Email & SMS notifications at every milestone"].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-success shrink-0" />
                        <span className="text-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to="/track/ST-2024-AB3F7K9M">
                    <Button className="mt-6 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold tracking-wide">
                      {t("features.seeTracking")} <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
                <div className="rounded-2xl overflow-hidden shadow-2xl">
                  <img src={mobileTrackingImage} alt="TransportHaven mobile tracking" className="w-full h-auto" loading="lazy" width={800} height={600} />
                </div>
              </div>
            </Section>

            <Section>
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="rounded-2xl overflow-hidden shadow-2xl order-2 md:order-1">
                  <img src={warehouseImage} alt="TransportHaven sorting facility" className="w-full h-auto" loading="lazy" width={800} height={600} />
                </div>
                <div className="order-1 md:order-2">
                  <p className="font-mono text-xs text-primary tracking-widest uppercase mb-2">Modern Infrastructure</p>
                  <h2 className="font-display text-3xl md:text-4xl font-black text-foreground mb-4">{t("features.facilityTitle")}</h2>
                  <p className="text-muted-foreground leading-relaxed mb-6">{t("features.facilityDesc")}</p>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { value: "15", label: "Distribution Hubs" },
                      { value: "500+", label: "Delivery Vehicles" },
                      { value: "10K+", label: "Daily Packages" },
                      { value: "99.9%", label: "Sort Accuracy" },
                    ].map((stat) => (
                      <div key={stat.label} className="bg-card rounded-lg p-3 border border-border">
                        <p className="font-display text-2xl font-black text-primary">{stat.value}</p>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Section>
          </div>
        </section>

        {/* Proof of Delivery */}
        <section className="container py-16 md:py-20">
          <Section>
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <p className="font-mono text-xs text-primary tracking-widest uppercase mb-2">Trust & Security</p>
                <h2 className="font-display text-3xl md:text-4xl font-black text-foreground mb-4">{t("features.podTitle")}</h2>
                <p className="text-muted-foreground leading-relaxed mb-6">{t("features.podDesc")}</p>
                <div className="flex flex-wrap gap-3">
                  {[
                    { icon: Shield, label: "Signature Capture" },
                    { icon: MapPin, label: "GPS Verification" },
                    { icon: Star, label: "Photo Proof" },
                  ].map((badge) => (
                    <div key={badge.label} className="flex items-center gap-2 bg-muted rounded-full px-4 py-2">
                      <badge.icon className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">{badge.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl overflow-hidden shadow-2xl">
                <img src={deliveryPersonImage} alt="TransportHaven delivery confirmation" className="w-full h-auto" loading="lazy" width={800} height={600} />
              </div>
            </div>
          </Section>
        </section>

        {/* Testimonials */}
        <section className="bg-secondary py-16 md:py-20">
          <div className="container">
            <Section>
              <div className="text-center mb-12">
                <p className="font-mono text-xs text-accent tracking-widest uppercase mb-2">{t("nav.reviews")}</p>
                <h2 className="font-display text-4xl md:text-5xl font-black text-secondary-foreground">{t("testimonials.title")}</h2>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { quote: "TransportHaven's real-time GPS tracking is a game-changer. I can see exactly where my packages are at any moment.", name: "Sarah M.", role: "E-commerce Business Owner", stars: 5 },
                  { quote: "The delivery notifications are spot-on. Estimated delivery times are incredibly accurate.", name: "James K.", role: "Operations Manager", stars: 5 },
                  { quote: "Photo proof of delivery gives us peace of mind. We've reduced delivery disputes by 95%.", name: "Lisa W.", role: "Retail Director", stars: 5 },
                ].map((testimonial) => (
                  <Card key={testimonial.name} className="bg-secondary-foreground/5 border-secondary-foreground/10">
                    <CardContent className="p-6">
                      <div className="flex gap-0.5 mb-3">
                        {Array.from({ length: testimonial.stars }).map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                        ))}
                      </div>
                      <p className="text-secondary-foreground/80 text-sm leading-relaxed mb-4">"{testimonial.quote}"</p>
                      <div>
                        <p className="text-secondary-foreground font-semibold text-sm">{testimonial.name}</p>
                        <p className="text-secondary-foreground/50 text-xs">{testimonial.role}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="text-center mt-8">
                <Link to="/reviews">
                  <Button variant="outline" className="border-secondary-foreground/20 text-secondary-foreground hover:bg-secondary-foreground/10 font-display font-bold tracking-wide">
                    {t("testimonials.seeAll")} <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </Section>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-primary">
          <div className="container py-16 text-center">
            <Section>
              <h2 className="font-display text-4xl md:text-5xl font-black text-primary-foreground mb-4">{t("cta.title")}</h2>
              <p className="text-primary-foreground/80 text-lg mb-8 max-w-lg mx-auto">{t("cta.desc")}</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/track">
                  <Button className="bg-secondary hover:bg-secondary/90 text-secondary-foreground font-display font-bold tracking-wide text-base px-8 py-6">
                    {t("cta.trackPackage")} <Search className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/quote">
                  <Button variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 font-display font-bold tracking-wide text-base px-8 py-6">
                    {t("cta.getQuote")} <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </Section>
          </div>
        </section>

        <Footer />
      </PageTransition>
    </div>
  );
};

export default Index;
