import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Search, Package, Clock, MapPin, Weight, Shield, Truck, Copy, Check, ChevronDown, ChevronUp, Box } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import TrackingTimeline from "@/components/TrackingTimeline";
import TrackingMap from "@/components/TrackingMap";
import TrackingProgressBar from "@/components/TrackingProgressBar";
import { getShipmentByTrackingId, routeHistory } from "@/lib/mockData";
import { STATUS_LABELS } from "@/lib/types";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import { toast } from "@/hooks/use-toast";

const statusClass: Record<string, string> = {
  LABEL_CREATED: "bg-muted text-muted-foreground",
  PICKED_UP: "bg-secondary/10 text-secondary",
  IN_TRANSIT: "bg-secondary text-secondary-foreground",
  AT_FACILITY: "bg-accent text-accent-foreground",
  OUT_FOR_DELIVERY: "bg-warning text-warning-foreground",
  DELIVERED: "bg-success text-success-foreground",
  DELIVERY_ATTEMPTED: "bg-warning text-warning-foreground",
  EXCEPTION: "bg-destructive text-destructive-foreground",
  RETURNED: "bg-muted text-muted-foreground",
};

const TrackPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [input, setInput] = useState(id || "");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [showTimeline, setShowTimeline] = useState(true);

  const shipment = id ? getShipmentByTrackingId(id) : null;

  const handleSearch = () => {
    if (!input.trim()) return;
    setError("");
    const found = getShipmentByTrackingId(input.trim());
    if (!found) {
      setError("Shipment not found. Try: ST-2024-AB3F7K9M");
      return;
    }
    navigate(`/track/${input.trim()}`);
  };

  const copyTracking = () => {
    if (shipment) {
      navigator.clipboard.writeText(shipment.trackingId);
      setCopied(true);
      toast({ title: "Copied!", description: "Tracking ID copied to clipboard" });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getDestination = () => {
    if (!shipment) return { lat: 0, lng: 0 };
    const cityMap: Record<string, { lat: number; lng: number }> = {
      Washington: { lat: 38.9072, lng: -77.0369 },
      Chicago: { lat: 41.8827, lng: -87.6233 },
      "Los Angeles": { lat: 34.0522, lng: -118.2437 },
      "New York": { lat: 40.7128, lng: -74.006 },
    };
    return cityMap[shipment.receiver.city] || { lat: 34.0522, lng: -118.2437 };
  };

  const getOrigin = () => {
    if (!shipment) return { lat: 0, lng: 0 };
    const cityMap: Record<string, { lat: number; lng: number }> = {
      "New York": { lat: 40.7128, lng: -74.006 },
      "San Francisco": { lat: 37.7749, lng: -122.4194 },
      Cupertino: { lat: 37.322, lng: -122.0322 },
    };
    return cityMap[shipment.sender.city] || { lat: 37.7749, lng: -122.4194 };
  };

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col bg-background">
        <AppHeader />

        {/* Hero search bar */}
        <div className="bg-secondary py-8">
          <div className="container">
            <h1 className="font-display text-2xl md:text-3xl font-bold text-secondary-foreground mb-1 text-center">
              Track Your Shipment
            </h1>
            <p className="text-secondary-foreground/60 text-sm text-center mb-5">
              Enter your SwiftTrack tracking number to get real-time updates
            </p>
            <div className="flex gap-2 max-w-2xl mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-foreground/40" />
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Enter tracking ID (e.g. ST-2024-AB3F7K9M)"
                  className="pl-10 bg-white/10 border-white/20 text-secondary-foreground placeholder:text-secondary-foreground/40 font-mono text-sm h-12"
                />
              </div>
              <Button onClick={handleSearch} size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold tracking-wide px-8">
                <Search className="h-4 w-4 mr-2" />
                TRACK
              </Button>
            </div>
            {error && <p className="text-center text-primary-foreground text-sm mt-3 font-mono bg-primary/20 rounded py-2 max-w-2xl mx-auto">{error}</p>}
          </div>
        </div>

        {/* Empty state */}
        {!shipment && !id && (
          <div className="flex-1 flex items-center justify-center py-20">
            <div className="text-center space-y-6 p-8 max-w-lg">
              <div className="w-20 h-20 rounded-full bg-secondary/10 flex items-center justify-center mx-auto">
                <Package className="h-10 w-10 text-secondary" />
              </div>
              <div>
                <h2 className="font-display text-3xl font-bold text-foreground mb-2">Where's My Package?</h2>
                <p className="text-muted-foreground">
                  Enter your SwiftTrack tracking ID above to get real-time updates, live map, and delivery timeline.
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider font-semibold">Try a demo tracking ID</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {["ST-2024-AB3F7K9M", "ST-2024-XK9P2L4N", "ST-2024-MN7Q8R2T", "ST-2024-PL5W3Y8Z"].map((tid) => (
                    <button
                      key={tid}
                      onClick={() => { setInput(tid); navigate(`/track/${tid}`); }}
                      className="font-mono text-xs px-4 py-2 rounded-lg bg-card border border-border text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200 shadow-sm"
                    >
                      {tid}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tracking results */}
        {shipment && (
          <div className="flex-1 flex flex-col">
            {/* Status bar & progress */}
            <div className="border-b border-border bg-card">
              <div className="container py-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                      <Truck className="h-5 w-5 text-secondary-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-mono text-lg font-bold">{shipment.trackingId}</h2>
                        <button onClick={copyTracking} className="text-muted-foreground hover:text-foreground transition-colors">
                          {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge className={`${statusClass[shipment.status]} text-xs font-mono`}>
                          {STATUS_LABELS[shipment.status]}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{shipment.serviceType}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">From</p>
                      <p className="font-semibold">{shipment.sender.city}, {shipment.sender.state}</p>
                    </div>
                    <div className="text-muted-foreground">→</div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">To</p>
                      <p className="font-semibold">{shipment.receiver.city}, {shipment.receiver.state}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Est. Delivery</p>
                      <p className="font-semibold">{new Date(shipment.estimatedDeliveryDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                    </div>
                  </div>
                </div>
                <TrackingProgressBar currentStatus={shipment.status} />
              </div>
            </div>

            {/* Map & Details side by side */}
            <div className="flex-1 flex flex-col lg:flex-row">
              {/* Map */}
              <div className="h-[45vh] lg:h-auto lg:flex-[3] relative">
                <TrackingMap
                  routeHistory={routeHistory}
                  currentLocation={shipment.currentLocation}
                  destination={getDestination()}
                  origin={getOrigin()}
                  heading={210}
                />
                {/* Map overlay info */}
                <div className="absolute top-3 left-3 z-[1000] bg-card/90 backdrop-blur-sm rounded-lg shadow-lg px-3 py-2 border border-border">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Live Tracking</p>
                  <p className="text-xs font-mono font-bold text-foreground">{shipment.trackingId}</p>
                </div>
              </div>

              {/* Details panel */}
              <div className="lg:flex-[2] lg:max-w-md overflow-y-auto border-l border-border bg-card">
                <div className="p-5 space-y-5">
                  {/* Shipment details */}
                  <div>
                    <h3 className="font-display text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Shipment Details</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <Card className="p-3 space-y-0.5 bg-muted/30 border-0">
                        <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] uppercase tracking-wider">
                          <MapPin className="h-3 w-3" /> From
                        </div>
                        <p className="text-sm font-semibold">{shipment.sender.name}</p>
                        <p className="text-xs text-muted-foreground">{shipment.sender.city}, {shipment.sender.state}</p>
                      </Card>
                      <Card className="p-3 space-y-0.5 bg-muted/30 border-0">
                        <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] uppercase tracking-wider">
                          <MapPin className="h-3 w-3" /> To
                        </div>
                        <p className="text-sm font-semibold">{shipment.receiver.name}</p>
                        <p className="text-xs text-muted-foreground">{shipment.receiver.city}, {shipment.receiver.state}</p>
                      </Card>
                      <Card className="p-3 space-y-0.5 bg-muted/30 border-0">
                        <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] uppercase tracking-wider">
                          <Weight className="h-3 w-3" /> Weight
                        </div>
                        <p className="text-sm font-semibold">{shipment.weight} kg</p>
                      </Card>
                      <Card className="p-3 space-y-0.5 bg-muted/30 border-0">
                        <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] uppercase tracking-wider">
                          <Box className="h-3 w-3" /> Dimensions
                        </div>
                        <p className="text-sm font-semibold">{shipment.dimensions.length}×{shipment.dimensions.width}×{shipment.dimensions.height} cm</p>
                      </Card>
                    </div>
                  </div>

                  {shipment.requiresSignature && (
                    <div className="flex items-center gap-2 text-xs bg-accent/20 text-accent-foreground px-3 py-2.5 rounded-lg border border-accent/30">
                      <Shield className="h-4 w-4 text-accent" /> Signature required on delivery
                    </div>
                  )}

                  {/* Timeline toggle */}
                  <div>
                    <button
                      onClick={() => setShowTimeline(!showTimeline)}
                      className="flex items-center justify-between w-full text-left"
                    >
                      <h3 className="font-display text-sm font-bold text-muted-foreground uppercase tracking-wider">Tracking History</h3>
                      {showTimeline ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </button>
                    {showTimeline && (
                      <div className="mt-3">
                        <TrackingTimeline events={shipment.events} currentStatus={shipment.status} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {!shipment && <Footer />}
      </div>
    </PageTransition>
  );
};

export default TrackPage;
