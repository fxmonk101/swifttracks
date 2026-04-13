import { useState } from "react";
import { Navigation, MapPin, Package, Clock, Camera, Power, PowerOff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AppHeader from "@/components/AppHeader";
import { mockShipments } from "@/lib/mockData";
import { STATUS_LABELS, ShipmentStatus } from "@/lib/types";

const DriverPage = () => {
  const [onDuty, setOnDuty] = useState(true);
  const [gpsActive, setGpsActive] = useState(true);
  const [speed] = useState(45);
  const [accuracy] = useState(12);
  const [coords] = useState({ lat: 39.2904, lng: -76.6122 });
  const [heading] = useState(210);

  const assignedShipments = mockShipments.filter((s) => s.assignedDriver === "d1");

  const accuracyColor = accuracy < 20 ? "bg-success" : accuracy < 100 ? "bg-warning" : "bg-destructive";
  const accuracyLabel = accuracy < 20 ? "Excellent" : accuracy < 100 ? "Fair" : "Poor";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />
      <div className="container py-6 space-y-6">
        {/* Driver Status */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold">Driver Dashboard</h1>
            <p className="text-sm text-muted-foreground">Marcus Johnson · ID: D-001</p>
          </div>
          <Button
            onClick={() => setOnDuty(!onDuty)}
            variant={onDuty ? "default" : "outline"}
            className={`gap-2 font-mono text-xs ${onDuty ? "bg-success hover:bg-success/90 text-success-foreground" : ""}`}
          >
            {onDuty ? <Power className="h-3.5 w-3.5" /> : <PowerOff className="h-3.5 w-3.5" />}
            {onDuty ? "ON DUTY" : "OFF DUTY"}
          </Button>
        </div>

        {/* GPS Panel */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Navigation className="h-5 w-5 text-secondary" />
                  {gpsActive && <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-success gps-active" />}
                </div>
                <div>
                  <h3 className="font-semibold text-sm">GPS Tracking</h3>
                  <p className="text-xs text-muted-foreground">{gpsActive ? "Active — transmitting every 5s" : "Inactive"}</p>
                </div>
              </div>
              <Button
                size="sm"
                variant={gpsActive ? "destructive" : "default"}
                onClick={() => setGpsActive(!gpsActive)}
                className="font-mono text-xs"
              >
                {gpsActive ? "Stop" : "Start"}
              </Button>
            </div>

            {gpsActive && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-muted rounded p-3">
                  <p className="text-xs text-muted-foreground mb-1">Coordinates</p>
                  <p className="font-mono text-xs font-medium">{coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}</p>
                </div>
                <div className="bg-muted rounded p-3">
                  <p className="text-xs text-muted-foreground mb-1">Speed</p>
                  <p className="font-mono text-sm font-bold">{speed} <span className="text-xs font-normal">km/h</span></p>
                </div>
                <div className="bg-muted rounded p-3">
                  <p className="text-xs text-muted-foreground mb-1">Heading</p>
                  <p className="font-mono text-sm font-bold">{heading}°</p>
                </div>
                <div className="bg-muted rounded p-3">
                  <p className="text-xs text-muted-foreground mb-1">Accuracy</p>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${accuracyColor}`} />
                    <p className="font-mono text-xs font-medium">{accuracy}m · {accuracyLabel}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assigned Shipments */}
        <div>
          <h2 className="font-display text-xl font-bold mb-3">Today's Deliveries</h2>
          <div className="space-y-3">
            {assignedShipments.map((s) => (
              <Card key={s.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-mono text-xs font-bold">{s.trackingId}</p>
                      <p className="text-sm font-semibold mt-1">{s.receiver.name}</p>
                      <p className="text-xs text-muted-foreground">{s.receiver.street}, {s.receiver.city}, {s.receiver.state} {s.receiver.zip}</p>
                    </div>
                    <Badge className={`status-${s.status.toLowerCase().replace(/_/g, "-")} text-xs font-mono`}>
                      {STATUS_LABELS[s.status]}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                    <span className="flex items-center gap-1"><Package className="h-3 w-3" /> {s.weight} kg</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {s.serviceType}</span>
                    {s.requiresSignature && <span className="text-warning font-semibold">⚠ Signature Required</span>}
                  </div>

                  <div className="flex gap-2">
                    <Select>
                      <SelectTrigger className="flex-1 h-8 text-xs">
                        <SelectValue placeholder="Update status..." />
                      </SelectTrigger>
                      <SelectContent>
                        {(["OUT_FOR_DELIVERY", "DELIVERED", "DELIVERY_ATTEMPTED"] as ShipmentStatus[]).map((st) => (
                          <SelectItem key={st} value={st} className="text-xs">{STATUS_LABELS[st]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button size="sm" variant="outline" className="h-8 gap-1 text-xs">
                      <Camera className="h-3 w-3" /> POD
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 text-xs">
                      <MapPin className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {assignedShipments.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="font-semibold">No shipments assigned</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverPage;
