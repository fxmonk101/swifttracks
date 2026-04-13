import { Link } from "react-router-dom";
import { Search, Package, Truck, LayoutDashboard, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import AppHeader from "@/components/AppHeader";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";

const Index = () => {
  const [input, setInput] = useState("");
  const navigate = useNavigate();

  const handleSearch = () => {
    if (input.trim()) navigate(`/track/${input.trim()}`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />

      {/* Hero */}
      <section className="bg-secondary relative overflow-hidden">
        <div className="absolute right-[-100px] top-[-100px] w-[600px] h-[600px] bg-primary rounded-full opacity-[0.06]" />
        <div className="container py-16 md:py-24 relative z-10">
          <div className="max-w-2xl">
            <p className="font-mono text-xs text-accent tracking-widest mb-3 uppercase">Real-time Logistics Platform</p>
            <h1 className="font-display text-5xl md:text-7xl font-black text-secondary-foreground leading-[0.95] mb-4">
              TRACK YOUR<br />
              <span className="text-primary">SHIPMENT</span><br />
              IN REAL TIME
            </h1>
            <p className="text-secondary-foreground/70 text-lg mb-8 max-w-lg">
              Live GPS tracking, instant status updates, and full delivery visibility — from pickup to doorstep.
            </p>

            <div className="flex gap-2 max-w-lg">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-foreground/50" />
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="ST-2024-AB3F7K9M"
                  className="pl-10 bg-secondary-foreground/10 border-secondary-foreground/20 text-secondary-foreground placeholder:text-secondary-foreground/40 font-mono h-12"
                />
              </div>
              <Button onClick={handleSearch} className="h-12 px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold tracking-wider text-lg">
                TRACK <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>

            <div className="flex gap-2 mt-4">
              {["ST-2024-AB3F7K9M", "ST-2024-XK9P2L4N"].map((tid) => (
                <button key={tid} onClick={() => navigate(`/track/${tid}`)} className="font-mono text-xs text-secondary-foreground/50 hover:text-accent transition-colors underline underline-offset-2">
                  Try: {tid}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container py-16">
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="group hover:shadow-lg transition-shadow border-t-4 border-t-primary">
            <CardContent className="p-6">
              <Package className="h-8 w-8 text-primary mb-4" />
              <h3 className="font-display text-xl font-bold mb-2">Live Tracking</h3>
              <p className="text-sm text-muted-foreground">Real-time GPS tracking with animated map visualization and instant status updates via WebSocket.</p>
              <Link to="/track/ST-2024-AB3F7K9M" className="inline-flex items-center gap-1 text-primary text-sm font-semibold mt-4 hover:underline">
                Track a package <ArrowRight className="h-3 w-3" />
              </Link>
            </CardContent>
          </Card>
          <Card className="group hover:shadow-lg transition-shadow border-t-4 border-t-secondary">
            <CardContent className="p-6">
              <LayoutDashboard className="h-8 w-8 text-secondary mb-4" />
              <h3 className="font-display text-xl font-bold mb-2">Admin Dashboard</h3>
              <p className="text-sm text-muted-foreground">Full shipment lifecycle management — create, assign drivers, update statuses, and monitor fleet in real time.</p>
              <Link to="/admin" className="inline-flex items-center gap-1 text-secondary text-sm font-semibold mt-4 hover:underline">
                Open dashboard <ArrowRight className="h-3 w-3" />
              </Link>
            </CardContent>
          </Card>
          <Card className="group hover:shadow-lg transition-shadow border-t-4 border-t-accent">
            <CardContent className="p-6">
              <Truck className="h-8 w-8 text-accent-foreground mb-4" />
              <h3 className="font-display text-xl font-bold mb-2">Driver Module</h3>
              <p className="text-sm text-muted-foreground">GPS-powered delivery interface with real-time location sharing, status updates, and proof-of-delivery capture.</p>
              <Link to="/driver" className="inline-flex items-center gap-1 text-foreground text-sm font-semibold mt-4 hover:underline">
                Driver view <ArrowRight className="h-3 w-3" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-secondary text-secondary-foreground/60 py-6">
        <div className="container flex items-center justify-between text-xs">
          <span className="font-display text-sm font-bold text-secondary-foreground">SWIFT<span className="text-primary">TRACK</span></span>
          <span className="font-mono">© 2024 SwiftTrack Logistics</span>
        </div>
      </footer>
    </div>
  );
};

export default Index;
