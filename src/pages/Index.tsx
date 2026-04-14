import { Link, useNavigate } from "react-router-dom";
import {
  Search, Package, Truck, ArrowRight, MapPin, Clock, Shield,
  CheckCircle, Globe, Zap, Star, ChevronRight, ChevronLeft, Phone, Mail,
  BarChart3, Users, Box, Plane
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

import heroImage from "@/assets/hero-delivery.jpg";
import warehouseImage from "@/assets/warehouse.jpg";
import deliveryPersonImage from "@/assets/delivery-person.jpg";
import mobileTrackingImage from "@/assets/mobile-tracking.jpg";
import planeImage from "@/assets/plane-flying.jpg";
import deliveryVanImage from "@/assets/delivery-van.jpg";

const Section = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  const { ref, isVisible } = useScrollAnimation();
  return (
    <div ref={ref} className={`transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}>
      {children}
    </div>
  );
};

const heroSlides = [
  {
    image: heroImage,
    tag: "REAL-TIME GPS TRACKING",
    tagIcon: Zap,
    title: <>DELIVERING<br /><span className="text-primary">CERTAINTY</span><br />NOT JUST PACKAGES</>,
    desc: "Live GPS tracking, instant status updates, and full delivery visibility — from pickup to your doorstep.",
  },
  {
    image: planeImage,
    tag: "AIR FREIGHT",
    tagIcon: Plane,
    title: <>EXPRESS<br /><span className="text-primary">OVERNIGHT</span><br />DELIVERY</>,
    desc: "Next-day delivery guaranteed by 10:30 AM. Priority air freight with real-time tracking.",
  },
  {
    image: deliveryVanImage,
    tag: "NATIONWIDE COVERAGE",
    tagIcon: Truck,
    title: <>COAST TO<br /><span className="text-primary">COAST</span><br />IN DAYS</>,
    desc: "Our fleet of 500+ vehicles delivers to all 50 states with industry-leading reliability.",
  },
];

const Index = () => {
  const [input, setInput] = useState("");
  const navigate = useNavigate();
  const [slide, setSlide] = useState(0);

  const nextSlide = useCallback(() => setSlide((s) => (s + 1) % heroSlides.length), []);
  const prevSlide = useCallback(() => setSlide((s) => (s - 1 + heroSlides.length) % heroSlides.length), []);

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

      {/* Hero Slider */}
      <section className="relative overflow-hidden bg-secondary">
        {heroSlides.map((s, i) => (
          <div key={i} className={`absolute inset-0 transition-opacity duration-1000 ${i === slide ? "opacity-100" : "opacity-0"}`}>
            <img src={s.image} alt="" className="w-full h-full object-cover opacity-20" />
            <div className="absolute inset-0 bg-gradient-to-r from-secondary via-secondary/95 to-secondary/70" />
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
              <p className="text-secondary-foreground/60 text-xs font-mono mb-3 tracking-wider uppercase">Enter Tracking Number</p>
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
                  TRACK <ArrowRight className="ml-1 h-4 w-4" />
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
              { value: "2.5M+", label: "Packages Delivered", icon: Box },
              { value: "99.8%", label: "On-Time Delivery", icon: Clock },
              { value: "50+", label: "States Covered", icon: Globe },
              { value: "24/7", label: "Live Tracking", icon: MapPin },
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
                { icon: Search, label: "Track a Package", desc: "Real-time updates", to: "/track" },
                { icon: Package, label: "Get a Quote", desc: "Instant pricing", to: "/quote" },
                { icon: Clock, label: "Schedule Pickup", desc: "We come to you", to: "/schedule-pickup" },
                { icon: MapPin, label: "Services Guide", desc: "Compare options", to: "/services-guide" },
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

      {/* Services */}
      <section className="container py-16 md:py-20">
        <Section>
          <div className="text-center mb-12">
            <p className="font-mono text-xs text-primary tracking-widest uppercase mb-2">Our Services</p>
            <h2 className="font-display text-4xl md:text-5xl font-black text-foreground">SHIPPING SOLUTIONS</h2>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto">From same-day express to economy ground, we have the right delivery option for every package.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Zap, title: "Express Overnight", desc: "Next-day delivery guaranteed by 10:30 AM. Priority handling with real-time GPS tracking and signature confirmation.", badge: "FASTEST", badgeColor: "bg-primary text-primary-foreground" },
              { icon: Truck, title: "Standard Ground", desc: "Reliable 3-5 business day delivery across the continental US. Full tracking and delivery notifications included.", badge: "POPULAR", badgeColor: "bg-secondary text-secondary-foreground" },
              { icon: Globe, title: "Economy Saver", desc: "Budget-friendly option with 5-7 business day delivery. Perfect for non-urgent shipments with full tracking.", badge: "VALUE", badgeColor: "bg-accent text-accent-foreground" },
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
                      Learn more <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </Section>
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
      <section className="bg-muted/50 py-16 md:py-20">
        <div className="container">
          <Section>
            <div className="grid md:grid-cols-2 gap-8 items-center mb-16">
              <div>
                <p className="font-mono text-xs text-primary tracking-widest uppercase mb-2">Real-Time Visibility</p>
                <h2 className="font-display text-3xl md:text-4xl font-black text-foreground mb-4">LIVE GPS TRACKING<br />ON EVERY PACKAGE</h2>
                <p className="text-muted-foreground leading-relaxed mb-6">Watch your package move in real time on an interactive map. Our GPS-enabled fleet transmits location updates every 5 seconds.</p>
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
                    SEE LIVE TRACKING <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <div className="rounded-2xl overflow-hidden shadow-2xl">
                <img src={mobileTrackingImage} alt="SwiftTrack mobile tracking" className="w-full h-auto" loading="lazy" width={800} height={600} />
              </div>
            </div>
          </Section>

          <Section>
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="rounded-2xl overflow-hidden shadow-2xl order-2 md:order-1">
                <img src={warehouseImage} alt="SwiftTrack sorting facility" className="w-full h-auto" loading="lazy" width={800} height={600} />
              </div>
              <div className="order-1 md:order-2">
                <p className="font-mono text-xs text-primary tracking-widest uppercase mb-2">Modern Infrastructure</p>
                <h2 className="font-display text-3xl md:text-4xl font-black text-foreground mb-4">STATE-OF-THE-ART<br />SORTING FACILITIES</h2>
                <p className="text-muted-foreground leading-relaxed mb-6">Our network of automated sorting centers processes thousands of packages per hour with 99.9% accuracy.</p>
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
              <h2 className="font-display text-3xl md:text-4xl font-black text-foreground mb-4">PROOF OF DELIVERY<br />EVERY TIME</h2>
              <p className="text-muted-foreground leading-relaxed mb-6">Our drivers capture photo proof at every delivery. Combined with GPS-verified location data and digital signatures, you have complete peace of mind.</p>
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
              <img src={deliveryPersonImage} alt="SwiftTrack delivery confirmation" className="w-full h-auto" loading="lazy" width={800} height={600} />
            </div>
          </div>
        </Section>
      </section>

      {/* Testimonials */}
      <section className="bg-secondary py-16 md:py-20">
        <div className="container">
          <Section>
            <div className="text-center mb-12">
              <p className="font-mono text-xs text-accent tracking-widest uppercase mb-2">Customer Reviews</p>
              <h2 className="font-display text-4xl md:text-5xl font-black text-secondary-foreground">TRUSTED BY THOUSANDS</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { quote: "SwiftTrack's real-time GPS tracking is a game-changer. I can see exactly where my packages are at any moment.", name: "Sarah M.", role: "E-commerce Business Owner", stars: 5 },
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
                  SEE ALL REVIEWS <ArrowRight className="ml-2 h-4 w-4" />
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
            <h2 className="font-display text-4xl md:text-5xl font-black text-primary-foreground mb-4">READY TO SHIP?</h2>
            <p className="text-primary-foreground/80 text-lg mb-8 max-w-lg mx-auto">Start tracking your packages today with SwiftTrack's industry-leading logistics platform.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/track">
                <Button className="bg-secondary hover:bg-secondary/90 text-secondary-foreground font-display font-bold tracking-wide text-base px-8 py-6">
                  TRACK A PACKAGE <Search className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/quote">
                <Button variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 font-display font-bold tracking-wide text-base px-8 py-6">
                  GET A QUOTE <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </Section>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
