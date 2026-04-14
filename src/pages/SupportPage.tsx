import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { Phone, Mail, Clock, MessageSquare, Search, HelpCircle, FileText, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const SupportPage = () => (
  <div className="min-h-screen flex flex-col">
    <AppHeader />
    <section className="bg-secondary py-20">
      <div className="container text-center">
        <h1 className="font-display text-5xl md:text-7xl font-black text-secondary-foreground">HELP & <span className="text-primary">SUPPORT</span></h1>
        <p className="text-secondary-foreground/70 text-lg mt-4 max-w-2xl mx-auto">We're here to help. Find answers or get in touch.</p>
      </div>
    </section>

    <section className="container py-16">
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        {[
          { icon: Phone, title: "Call Us", desc: "1-800-SWIFT-TK", sub: "Mon-Sat 8AM-8PM EST" },
          { icon: Mail, title: "Email Us", desc: "support@swifttrack.com", sub: "Response within 24 hours" },
          { icon: MessageSquare, title: "Live Chat", desc: "Chat with an agent", sub: "Available 24/7" },
        ].map((c) => (
          <Card key={c.title} className="hover:shadow-lg transition-all text-center">
            <CardContent className="p-6">
              <c.icon className="h-10 w-10 text-primary mx-auto mb-3" />
              <h3 className="font-display text-lg font-bold text-foreground mb-1">{c.title}</h3>
              <p className="text-sm font-semibold text-foreground">{c.desc}</p>
              <p className="text-xs text-muted-foreground">{c.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <h2 className="font-display text-3xl font-black text-foreground text-center mb-8">QUICK LINKS</h2>
      <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
        {[
          { icon: Search, label: "Track a Package", to: "/track" },
          { icon: HelpCircle, label: "Frequently Asked Questions", to: "/faq" },
          { icon: FileText, label: "Services Guide", to: "/services-guide" },
          { icon: Clock, label: "Schedule a Pickup", to: "/schedule-pickup" },
        ].map((l) => (
          <Link key={l.label} to={l.to}>
            <Card className="hover:shadow-lg transition-all hover:-translate-y-0.5 cursor-pointer group">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <l.icon className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-foreground group-hover:text-primary transition-colors">{l.label}</span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
    <Footer />
  </div>
);

export default SupportPage;
