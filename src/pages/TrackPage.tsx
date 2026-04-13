import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Search, Package, Clock, MapPin, Weight, Ruler, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import TrackingTimeline from "@/components/TrackingTimeline";
import TrackingMap from "@/components/TrackingMap";
import { getShipmentByTrackingId, routeHistory } from "@/lib/mockData";
import { STATUS_LABELS } from "@/lib/types";
import AppHeader from "@/components/AppHeader";

const statusClass: Record<string, string> = {
  LABEL_CREATED: "status-label-created",
  PICKED_UP: "status-picked-up",
  IN_TRANSIT: "status-in-transit",
  AT_FACILITY: "status-at-facility",
  OUT_FOR_DELIVERY: "status-out-for-delivery",
  DELIVERED: "status-delivered",
  DELIVERY_ATTEMPTED: "status-delivery-attempted",
  EXCEPTION: "status-exception",
  RETURNED: "status-returned",
};

const TrackPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [input, setInput] = useState(id || "");
  const [error, setError] = useState("");

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

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />

      {/* Search bar */}
      <div className="bg-secondary py-6">
        <div className="container">
          <div className="flex gap-2 max-w-2xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-foreground/50" />
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Enter tracking ID (e.g. ST-2024-AB3F7K9M)"
                className="pl-10 bg-secondary-foreground/10 border-secondary-foreground/20 text-secondary-foreground placeholder:text-secondary-foreground/40 font-mono text-sm"
              />
            </div>
            <Button onClick={handleSearch} className="bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold tracking-wide">
              TRACK
            </Button>
          </div>
          {error && <p className="text-center text-primary-foreground/80 text-sm mt-2 font-mono">{error}</p>}
        </div>
      </div>

      {/* Content */}
      {!shipment && !id && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4 p-8">
            <Package className="h-16 w-16 mx-auto text-muted-foreground/40" />
            <h2 className="font-display text-3xl font-bold text-foreground">Track Your Shipment</h2>
            <p className="text-muted-foreground max-w-md">
              Enter your SwiftTrack tracking ID above to get real-time updates on your package.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {["ST-2024-AB3F7K9M", "ST-2024-XK9P2L4N", "ST-2024-MN7Q8R2T", "ST-2024-PL5W3Y8Z"].map((tid) => (
                <button
                  key={tid}
                  onClick={() => { setInput(tid); navigate(`/track/${tid}`); }}
                  className="font-mono text-xs px-3 py-1.5 rounded bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  {tid}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {shipment && (
        <div className="flex-1 flex flex-col lg:flex-row">
          {/* Map */}
          <div className="h-[50vh] lg:h-auto lg:flex-[3]">
            <TrackingMap
              routeHistory={routeHistory}
              currentLocation={shipment.currentLocation}
              destination={{ lat: shipment.receiver.city === "Washington" ? 38.9072 : shipment.receiver.city === "Chicago" ? 41.8827 : 34.0522, lng: shipment.receiver.city === "Washington" ? -77.0369 : shipment.receiver.city === "Chicago" ? -87.6233 : -118.2437 }}
              origin={{ lat: shipment.sender.city === "New York" ? 40.7128 : shipment.sender.city === "San Francisco" ? 37.7749 : 37.322, lng: shipment.sender.city === "New York" ? -74.006 : shipment.sender.city === "San Francisco" ? -122.4194 : -122.0322 }}
              heading={210}
            />
          </div>

          {/* Details panel */}
          <div className="lg:flex-[2] overflow-y-auto border-l border-border">
            <div className="p-6 space-y-6">
              {/* Header */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={`${statusClass[shipment.status]} font-mono text-xs`}>
                    {STATUS_LABELS[shipment.status]}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{shipment.serviceType}</span>
                </div>
                <h1 className="font-display text-2xl font-bold">{shipment.trackingId}</h1>
              </div>

              {/* Quick info */}
              <div className="grid grid-cols-2 gap-3">
                <Card className="p-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                    <MapPin className="h-3 w-3" /> From
                  </div>
                  <p className="text-sm font-semibold">{shipment.sender.city}, {shipment.sender.state}</p>
                </Card>
                <Card className="p-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                    <MapPin className="h-3 w-3" /> To
                  </div>
                  <p className="text-sm font-semibold">{shipment.receiver.city}, {shipment.receiver.state}</p>
                </Card>
                <Card className="p-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                    <Clock className="h-3 w-3" /> Est. Delivery
                  </div>
                  <p className="text-sm font-semibold">{new Date(shipment.estimatedDeliveryDate).toLocaleDateString()}</p>
                </Card>
                <Card className="p-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                    <Weight className="h-3 w-3" /> Weight
                  </div>
                  <p className="text-sm font-semibold">{shipment.weight} kg</p>
                </Card>
              </div>

              {shipment.requiresSignature && (
                <div className="flex items-center gap-2 text-xs text-warning bg-warning/10 px-3 py-2 rounded">
                  <Shield className="h-3.5 w-3.5" /> Signature required on delivery
                </div>
              )}

              {/* Timeline */}
              <div>
                <h3 className="font-display text-lg font-bold mb-4">Tracking History</h3>
                <TrackingTimeline events={shipment.events} currentStatus={shipment.status} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackPage;
