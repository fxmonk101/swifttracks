import { Link, useNavigate } from "react-router-dom";
import {
  Search, Package, Truck, ArrowRight, MapPin, Clock, Shield,
  CheckCircle, Globe, Zap, Star, ChevronRight, Phone, Mail,
  BarChart3, Users, Box
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import AppHeader from "@/components/AppHeader";
import { useState } from "react";
import { Input } from "@/components/ui/input";

import heroImage from "@/assets/hero-delivery.jpg";
import warehouseImage from "@/assets/warehouse.jpg";
import deliveryPersonImage from "@/assets/delivery-person.jpg";
import mobileTrackingImage from "@/assets/mobile-tracking.jpg";

const Index = () => {
  const [input, setInput] = useState("");
  const navigate = useNavigate();

  const handleSearch = () => {
    if (input.trim()) navigate(`/track/${input.trim()}`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-secondary">
        <div className="absolute inset-0">
          <img src={heroImage} alt="SwiftTrack delivery fleet" className="w-full h-full object-cover opacity-20" width={1920} height={800} />
          <div className="absolute inset-0 bg-gradient-to-r from-secondary via-secondary/95 to-secondary/70" />
        </div>
        <div className="container relative z-10 py-20 md:py-32">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-primary/20 border border-primary/30 rounded-full px-4 py-1.5 mb-6">
              <Zap className="h-3.5 w-3.5 text-accent" />
              <span className="font-mono text-xs text-accent tracking-wider">REAL-TIME GPS TRACKING</span>
            </div>
            <h1 className="font-display text-5xl md:text-7xl font-black text-secondary-foreground leading-[0.95] mb-5">
              DELIVERING<br />
              <span className="text-primary">CERTAINTY</span><br />
              NOT JUST PACKAGES
            </h1>
            <p className="text-secondary-foreground/70 text-lg mb-8 max-w-lg leading-relaxed">
              Live GPS tracking, instant status updates, and full delivery visibility — from pickup to your doorstep. Track any package in seconds.
            </p>

            {/* Search */}
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
      <section className="bg-background -mt-0">
        <div className="container py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 -mt-8 relative z-10">
            {[
              { icon: Search, label: "Track a Package", desc: "Real-time updates", to: "/track" },
              { icon: Package, label: "Ship Now", desc: "Get a quote", to: "/track" },
              { icon: Clock, label: "Delivery Times", desc: "Calculate ETA", to: "/track" },
              { icon: MapPin, label: "Find Location", desc: "Nearest drop-off", to: "/track" },
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
        </div>
      </section>

      {/* Services */}
      <section className="container py-16 md:py-20">
        <div className="text-center mb-12">
          <p className="font-mono text-xs text-primary tracking-widest uppercase mb-2">Our Services</p>
          <h2 className="font-display text-4xl md:text-5xl font-black text-foreground">SHIPPING SOLUTIONS</h2>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">From same-day express to economy ground, we have the right delivery option for every package.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: Zap,
              title: "Express Overnight",
              desc: "Next-day delivery guaranteed by 10:30 AM. Priority handling with real-time GPS tracking and signature confirmation.",
              badge: "FASTEST",
              badgeColor: "bg-primary text-primary-foreground",
            },
            {
              icon: Truck,
              title: "Standard Ground",
              desc: "Reliable 3-5 business day delivery across the continental US. Full tracking and delivery notifications included.",
              badge: "POPULAR",
              badgeColor: "bg-secondary text-secondary-foreground",
            },
            {
              icon: Globe,
              title: "Economy Saver",
              desc: "Budget-friendly option with 5-7 business day delivery. Perfect for non-urgent shipments with full tracking.",
              badge: "VALUE",
              badgeColor: "bg-accent text-accent-foreground",
            },
          ].map((service) => (
            <Card key={service.title} className="group hover:shadow-xl transition-all hover:-translate-y-1 overflow-hidden">
              <CardContent className="p-0">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <service.icon className="h-6 w-6 text-primary" />
                    </div>
                    <span className={`${service.badgeColor} text-xs font-bold font-mono px-2.5 py-1 rounded-full`}>
                      {service.badge}
                    </span>
                  </div>
                  <h3 className="font-display text-xl font-bold mb-2 text-foreground">{service.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{service.desc}</p>
                </div>
                <div className="border-t border-border px-6 py-3">
                  <Link to="/track" className="inline-flex items-center gap-1 text-primary text-sm font-semibold hover:gap-2 transition-all">
                    Learn more <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Feature Showcase with Images */}
      <section className="bg-muted/50 py-16 md:py-20">
        <div className="container">
          {/* Row 1 */}
          <div className="grid md:grid-cols-2 gap-8 items-center mb-16">
            <div>
              <p className="font-mono text-xs text-primary tracking-widest uppercase mb-2">Real-Time Visibility</p>
              <h2 className="font-display text-3xl md:text-4xl font-black text-foreground mb-4">LIVE GPS TRACKING<br />ON EVERY PACKAGE</h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Watch your package move in real time on an interactive map. Our GPS-enabled fleet transmits location updates every 5 seconds, so you always know exactly where your delivery is.
              </p>
              <ul className="space-y-3">
                {[
                  "Interactive map with animated truck marker",
                  "Full route history with timeline events",
                  "Estimated delivery window with live updates",
                  "Email & SMS notifications at every milestone",
                ].map((item) => (
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
              <img src={mobileTrackingImage} alt="SwiftTrack mobile tracking interface" className="w-full h-auto" loading="lazy" width={800} height={600} />
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="rounded-2xl overflow-hidden shadow-2xl order-2 md:order-1">
              <img src={warehouseImage} alt="SwiftTrack sorting facility" className="w-full h-auto" loading="lazy" width={800} height={600} />
            </div>
            <div className="order-1 md:order-2">
              <p className="font-mono text-xs text-primary tracking-widest uppercase mb-2">Modern Infrastructure</p>
              <h2 className="font-display text-3xl md:text-4xl font-black text-foreground mb-4">STATE-OF-THE-ART<br />SORTING FACILITIES</h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Our network of automated sorting centers processes thousands of packages per hour with 99.9% accuracy. Advanced barcode scanning and AI-powered routing ensure your package takes the fastest path to its destination.
              </p>
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
        </div>
      </section>

      {/* Proof of Delivery */}
      <section className="container py-16 md:py-20">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <p className="font-mono text-xs text-primary tracking-widest uppercase mb-2">Trust & Security</p>
            <h2 className="font-display text-3xl md:text-4xl font-black text-foreground mb-4">PROOF OF DELIVERY<br />EVERY TIME</h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Our drivers capture photo proof at every delivery. Combined with GPS-verified location data and digital signatures, you have complete peace of mind that your package reached its destination safely.
            </p>
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
      </section>

      {/* Testimonials */}
      <section className="bg-secondary py-16 md:py-20">
        <div className="container">
          <div className="text-center mb-12">
            <p className="font-mono text-xs text-accent tracking-widest uppercase mb-2">Customer Reviews</p>
            <h2 className="font-display text-4xl md:text-5xl font-black text-secondary-foreground">TRUSTED BY THOUSANDS</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote: "SwiftTrack's real-time GPS tracking is a game-changer. I can see exactly where my packages are at any moment.",
                name: "Sarah M.",
                role: "E-commerce Business Owner",
                stars: 5,
              },
              {
                quote: "The delivery notifications are spot-on. I get alerts at every step, and the estimated delivery times are incredibly accurate.",
                name: "James K.",
                role: "Operations Manager",
                stars: 5,
              },
              {
                quote: "Photo proof of delivery gives us peace of mind. We've reduced delivery disputes by 95% since switching to SwiftTrack.",
                name: "Lisa W.",
                role: "Retail Director",
                stars: 5,
              },
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
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary">
        <div className="container py-16 text-center">
          <h2 className="font-display text-4xl md:text-5xl font-black text-primary-foreground mb-4">READY TO SHIP?</h2>
          <p className="text-primary-foreground/80 text-lg mb-8 max-w-lg mx-auto">
            Start tracking your packages today with SwiftTrack's industry-leading logistics platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/track">
              <Button className="bg-secondary hover:bg-secondary/90 text-secondary-foreground font-display font-bold tracking-wide text-base px-8 py-6">
                TRACK A PACKAGE <Search className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Button variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 font-display font-bold tracking-wide text-base px-8 py-6">
              GET A QUOTE <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background/60">
        <div className="container py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Package className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-display text-xl font-black text-background">
                  SWIFT<span className="text-primary">TRACK</span>
                </span>
              </div>
              <p className="text-sm leading-relaxed">Delivering certainty, not just packages. Real-time logistics for the modern world.</p>
            </div>
            <div>
              <h4 className="font-display font-bold text-background mb-3 text-sm uppercase tracking-wider">Ship</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/track" className="hover:text-background transition-colors">Track Package</Link></li>
                <li><span className="hover:text-background transition-colors cursor-pointer">Get a Quote</span></li>
                <li><span className="hover:text-background transition-colors cursor-pointer">Schedule Pickup</span></li>
                <li><span className="hover:text-background transition-colors cursor-pointer">Service Guide</span></li>
              </ul>
            </div>
            <div>
              <h4 className="font-display font-bold text-background mb-3 text-sm uppercase tracking-wider">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><span className="hover:text-background transition-colors cursor-pointer">About Us</span></li>
                <li><span className="hover:text-background transition-colors cursor-pointer">Careers</span></li>
                <li><span className="hover:text-background transition-colors cursor-pointer">Press</span></li>
                <li><span className="hover:text-background transition-colors cursor-pointer">Sustainability</span></li>
              </ul>
            </div>
            <div>
              <h4 className="font-display font-bold text-background mb-3 text-sm uppercase tracking-wider">Contact</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2"><Phone className="h-3 w-3" /> 1-800-SWIFT-TK</li>
                <li className="flex items-center gap-2"><Mail className="h-3 w-3" /> support@swifttrack.com</li>
                <li className="flex items-center gap-2"><Clock className="h-3 w-3" /> Mon-Sat 8AM-8PM</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-background/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="font-mono text-xs">© 2024 SwiftTrack Logistics. All rights reserved.</span>
            <div className="flex gap-4 text-xs">
              <span className="hover:text-background transition-colors cursor-pointer">Privacy Policy</span>
              <span className="hover:text-background transition-colors cursor-pointer">Terms of Service</span>
              <span className="hover:text-background transition-colors cursor-pointer">Cookie Policy</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
