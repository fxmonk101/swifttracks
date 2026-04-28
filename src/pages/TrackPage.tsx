import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Search,
  Package,
  MapPin,
  Weight,
  Shield,
  Truck,
  Copy,
  Check,
  Box,
  Loader2,
  Calendar,
  CircleCheck,
  Clock,
  AlertCircle,
  QrCode,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import TrackingMap from "@/components/TrackingMap";
import TrackingProgressBar from "@/components/TrackingProgressBar";
import BarcodeScanner from "@/components/BarcodeScanner";
import { getShipmentByTrackingId, routeHistory as mockRouteHistory } from "@/lib/mockData";
import { STATUS_LABELS, ShipmentStatus, Shipment, Coordinates } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import { toast } from "@/hooks/use-toast";
import { geocode, US_CENTER } from "@/lib/geocoding";

const statusClass: Record<string, string> = {
  LABEL_CREATED: "bg-muted text-muted-foreground border-border",
  PICKED_UP: "bg-secondary/10 text-secondary border-secondary/30",
  IN_TRANSIT: "bg-secondary text-secondary-foreground border-secondary",
  AT_FACILITY: "bg-accent text-accent-foreground border-accent",
  OUT_FOR_DELIVERY: "bg-warning text-warning-foreground border-warning",
  DELIVERED: "bg-success text-success-foreground border-success",
  DELIVERY_ATTEMPTED: "bg-warning text-warning-foreground border-warning",
  EXCEPTION: "bg-destructive text-destructive-foreground border-destructive",
  RETURNED: "bg-muted text-muted-foreground border-border",
};

type DBShipment = {
  id: string;
  tracking_id: string;
  service_type: string;
  status: string;
  sender_name: string;
  sender_city: string;
  sender_state: string;
  sender_street: string | null;
  sender_zip: string | null;
  receiver_name: string;
  receiver_city: string;
  receiver_state: string;
  receiver_street: string | null;
  receiver_zip: string | null;
  weight: number | null;
  dimensions_length: number | null;
  dimensions_width: number | null;
  dimensions_height: number | null;
  requires_signature: boolean | null;
  estimated_delivery_date: string | null;
  actual_delivery_date: string | null;
  current_lat: number | null;
  current_lng: number | null;
  created_at: string;
};

type DBEvent = {
  status: string;
  description: string | null;
  location: string | null;
  created_at: string;
};

const num = (v: unknown, fallback = 0): number => {
  const n = typeof v === "string" ? parseFloat(v) : (v as number);
  return Number.isFinite(n) ? n : fallback;
};

function haversineMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371008;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

async function calculateSpeedAndETA(
  shipmentId: string,
  currentLocation: Coordinates | null,
  destination: Coordinates | null,
  status: string
): Promise<{ speed: number | null; eta: Date | null }> {
  // Only calculate if in transit or out for delivery
  if (!["IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(status)) {
    return { speed: null, eta: null };
  }

  if (!currentLocation || !destination) {
    return { speed: null, eta: null };
  }

  try {
    // Get analytics from RPC
    const { data, error } = await supabase.rpc("get_shipment_analytics", {
      p_shipment_id: shipmentId,
    });

    if (error || !data) {
      return { speed: null, eta: null };
    }

    const speedMph = data.current_speed_mph || 60;

    // Calculate distance to destination using haversine
    const distanceMeters = haversineMeters(currentLocation, destination);
    const distanceKm = distanceMeters / 1000;
    const distanceMiles = distanceKm * 0.621371;

    // Calculate ETA: hours = distance / speed
    const hoursToDestination = distanceMiles / speedMph;
    const secondsToDestination = hoursToDestination * 3600;
    const etaDate = new Date(Date.now() + secondsToDestination * 1000);

    return { speed: speedMph, eta: etaDate };
  } catch (err) {
    console.error("Error calculating speed/ETA:", err);
    return { speed: null, eta: null };
  }
}

const TrackPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [input, setInput] = useState(id || "");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [barcodeScannerOpen, setBarcodeScannerOpen] = useState(false);

  const [dbShipment, setDbShipment] = useState<DBShipment | null>(null);
  const [dbEvents, setDbEvents] = useState<DBEvent[]>([]);
  const [locationRouteHistory, setLocationRouteHistory] = useState<Coordinates[]>([]);
  const [followTruck, setFollowTruck] = useState(false);
  const [mapFitNonce, setMapFitNonce] = useState(0);
  const routeHistorySeededRef = useRef(false);

  // Geocoded coordinates (async)
  const [coords, setCoords] = useState<{ origin: Coordinates; destination: Coordinates } | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);

  // Speed and ETA
  const [currentSpeed, setCurrentSpeed] = useState<number | null>(null);
  const [etaTime, setEtaTime] = useState<Date | null>(null);
  const [etaCountdown, setEtaCountdown] = useState<{ hours: number; minutes: number } | null>(null);

  const mockShipment = id ? getShipmentByTrackingId(id) : null;

  useEffect(() => {
    setFollowTruck(false);
    setMapFitNonce(0);
    setLocationRouteHistory([]);
    routeHistorySeededRef.current = false;
  }, [id]);

  // Load shipment + subscribe to realtime
  useEffect(() => {
    if (!id) {
      setDbShipment(null);
      setDbEvents([]);
      setLocationRouteHistory([]);
      return;
    }
    setLoading(true);
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const loadEvents = async (sid: string) => {
      const { data: events } = await supabase
        .from("shipment_events")
        .select("status, description, location, created_at")
        .eq("shipment_id", sid)
        .order("created_at", { ascending: true });
      setDbEvents((events || []) as DBEvent[]);
    };

    const loadSnapshots = async (sid: string) => {
      const { data, error } = await supabase
        .from("shipment_location_snapshots")
        .select("lat,lng")
        .eq("shipment_id", sid)
        .order("created_at", { ascending: true })
        .limit(400);
      if (error) {
        console.warn("[TrackPage] snapshots:", error.message);
        setLocationRouteHistory([]);
        return;
      }
      const pts = (data || [])
        .map((r) => ({ lat: num(r.lat), lng: num(r.lng) }))
        .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
      setLocationRouteHistory(pts);
    };

    (async () => {
      const { data: shipment, error: sErr } = await supabase
        .from("shipments")
        .select("*")
        .eq("tracking_id", id)
        .maybeSingle();

      if (sErr) console.error("[TrackPage] shipment fetch error:", sErr);

      if (shipment) {
        setDbShipment(shipment as DBShipment);
        await loadEvents(shipment.id);
        await loadSnapshots(shipment.id);

        // Set up real-time subscription with all events
        channel = supabase
          .channel(`shipment-${shipment.id}`, {
            config: { broadcast: { self: true }, presence: { key: shipment.id } },
          })
          .on(
            "postgres_changes",
            { event: "UPDATE", schema: "public", table: "shipments", filter: `id=eq.${shipment.id}` },
            (payload) => {
              console.log("[TrackPage] Shipment UPDATE received:", payload);
              const n = payload.new as DBShipment;
              const o = (payload as { old?: Partial<DBShipment> }).old;
              setDbShipment(n);
              
              if (o && n.status !== o.status) {
                toast({
                  title: "Shipment updated",
                  description: `Status: ${STATUS_LABELS[n.status as ShipmentStatus] || n.status}`,
                });
                // Queue notification
                supabase.rpc("queue_delivery_notification", {
                  p_shipment_id: shipment.id,
                  p_event_type: "status_change",
                }).catch(err => console.error("Error queueing notification:", err));
              }
              
              // Check if location changed - handle both cases (o exists or not)
              const latChanged =
                (!o || `${n.current_lat}` !== `${o.current_lat}` || `${n.current_lng}` !== `${o.current_lng}`);
              
              if (latChanged) {
                console.log("[TrackPage] Location changed, reloading snapshots");
                // Check for large jumps (> 25km) that require map refit
                if (o) {
                  const prevLat = num(o.current_lat, NaN);
                  const prevLng = num(o.current_lng, NaN);
                  const curLat = num(n.current_lat, NaN);
                  const curLng = num(n.current_lng, NaN);
                  if (
                    Number.isFinite(prevLat) &&
                    Number.isFinite(prevLng) &&
                    Number.isFinite(curLat) &&
                    Number.isFinite(curLng)
                  ) {
                    if (haversineMeters({ lat: prevLat, lng: prevLng }, { lat: curLat, lng: curLng }) > 25000) {
                      console.log("[TrackPage] Large location jump detected, refitting map");
                      setMapFitNonce((x) => x + 1);
                    }
                  }
                }
                void loadSnapshots(shipment.id);
              }
            }
          )
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "shipment_events", filter: `shipment_id=eq.${shipment.id}` },
            () => {
              console.log("[TrackPage] New shipment event");
              return loadEvents(shipment.id);
            }
          )
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "shipment_location_snapshots",
              filter: `shipment_id=eq.${shipment.id}`,
            },
            (payload) => {
              console.log("[TrackPage] New location snapshot:", payload);
              return loadSnapshots(shipment.id);
            }
          )
          .subscribe((status) => {
            console.log("[TrackPage] Subscription status:", status);
          });
      } else {
        setDbShipment(null);
        setDbEvents([]);
        setLocationRouteHistory([]);
      }
      setLoading(false);
    })();

    return () => {
      console.log("[TrackPage] Cleaning up subscription for shipment");
      if (channel) supabase.removeChannel(channel);
    };
  }, [id]);

  // Build unified shipment object
  const isDB = !!dbShipment;
  const shipment: Shipment | null = useMemo(() => {
    if (isDB && dbShipment) {
      return {
        id: dbShipment.id,
        trackingId: dbShipment.tracking_id,
        serviceType: dbShipment.service_type as Shipment["serviceType"],
        status: dbShipment.status as ShipmentStatus,
        sender: {
          name: dbShipment.sender_name,
          street: dbShipment.sender_street || "",
          city: dbShipment.sender_city,
          state: dbShipment.sender_state,
          zip: dbShipment.sender_zip || "",
          country: "US",
        },
        receiver: {
          name: dbShipment.receiver_name,
          street: dbShipment.receiver_street || "",
          city: dbShipment.receiver_city,
          state: dbShipment.receiver_state,
          zip: dbShipment.receiver_zip || "",
          country: "US",
        },
        weight: num(dbShipment.weight),
        dimensions: {
          length: num(dbShipment.dimensions_length),
          width: num(dbShipment.dimensions_width),
          height: num(dbShipment.dimensions_height),
        },
        requiresSignature: dbShipment.requires_signature || false,
        estimatedDeliveryDate: dbShipment.estimated_delivery_date || "",
        actualDeliveryDate: dbShipment.actual_delivery_date || undefined,
        currentLocation:
          dbShipment.current_lat != null && dbShipment.current_lng != null
            ? { lat: num(dbShipment.current_lat), lng: num(dbShipment.current_lng) }
            : undefined as unknown as Coordinates,
        events: dbEvents.map((e) => ({
          status: e.status as ShipmentStatus,
          description: e.description || "",
          location: e.location || "",
          timestamp: e.created_at,
        })),
        createdAt: dbShipment.created_at,
      };
    }
    return mockShipment || null;
  }, [isDB, dbShipment, dbEvents, mockShipment]);

  useEffect(() => {
    if (!isDB || locationRouteHistory.length === 0) return;
    if (!routeHistorySeededRef.current) {
      routeHistorySeededRef.current = true;
      setMapFitNonce((n) => n + 1);
    }
  }, [isDB, locationRouteHistory.length]);

  const mapRouteHistory = useMemo(() => {
    if (isDB) return locationRouteHistory;
    if (mockShipment) return mockRouteHistory;
    return [];
  }, [isDB, locationRouteHistory, mockShipment]);

  // Geocode origin & destination whenever shipment changes
  useEffect(() => {
    if (!shipment) {
      setCoords(null);
      return;
    }
    let cancelled = false;
    setGeoLoading(true);
    (async () => {
      const buildQuery = (s: { street: string; city: string; state: string; zip: string }) => {
        const parts = [s.city, s.state, s.zip, "USA"].filter(Boolean);
        return parts.join(", ");
      };
      const [o, d] = await Promise.all([
        geocode(buildQuery(shipment.sender)),
        geocode(buildQuery(shipment.receiver)),
      ]);
      if (cancelled) return;
      setCoords({
        origin: o || US_CENTER,
        destination: d || US_CENTER,
      });
      setGeoLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [shipment?.id, shipment?.sender.city, shipment?.receiver.city]);

  // Calculate speed and ETA whenever shipment location or status changes
  useEffect(() => {
    if (!shipment || !isDB) {
      setCurrentSpeed(null);
      setEtaTime(null);
      return;
    }

    let cancelled = false;
    const calculateAsync = async () => {
      const { speed, eta } = await calculateSpeedAndETA(
        shipment.id,
        shipment.currentLocation || null,
        coords?.destination || null,
        shipment.status
      );
      if (!cancelled) {
        setCurrentSpeed(speed);
        setEtaTime(eta);
      }
    };

    void calculateAsync();

    return () => {
      cancelled = true;
    };
  }, [shipment?.id, shipment?.status, shipment?.currentLocation?.lat, coords?.destination?.lat, isDB]);

  // ETA countdown timer
  useEffect(() => {
    if (!etaTime) {
      setEtaCountdown(null);
      return;
    }

    const updateCountdown = () => {
      const now = new Date();
      const diff = etaTime.getTime() - now.getTime();

      if (diff <= 0) {
        setEtaCountdown(null);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setEtaCountdown({ hours, minutes });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [etaTime]);

  const handleSearch = () => {
    if (!input.trim()) return;
    setError("");
    navigate(`/track/${input.trim()}`);
  };

  const handleBarcodeScan = (barcode: string) => {
    setInput(barcode);
    setError("");
    navigate(`/track/${barcode.trim()}`);
    toast({
      title: "Barcode Scanned",
      description: `Tracking shipment: ${barcode}`,
    });
  };

  useEffect(() => {
    if (id && !loading && !dbShipment && !mockShipment) {
      setError("Shipment not found. Check the tracking ID and try again.");
    } else {
      setError("");
    }
  }, [id, loading, dbShipment, mockShipment]);

  const copyTracking = () => {
    if (shipment) {
      navigator.clipboard.writeText(shipment.trackingId);
      setCopied(true);
      toast({ title: "Copied!", description: "Tracking ID copied to clipboard" });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const origin = coords?.origin || US_CENTER;
  const destination = coords?.destination || US_CENTER;
  const currentLoc =
    shipment?.currentLocation && Number.isFinite(shipment.currentLocation.lat)
      ? shipment.currentLocation
      : origin;

  const hasGps = !!(shipment?.currentLocation && Number.isFinite(shipment.currentLocation.lat));
  const canShowMap =
    !!shipment &&
    !!coords &&
    Number.isFinite(origin.lat) &&
    Number.isFinite(destination.lat) &&
    Number.isFinite(currentLoc.lat);

  const formatDate = (iso?: string) => {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return "—";
    }
  };
  const formatDateTime = (iso?: string) => {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleString("en-US", {
        month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
      });
    } catch {
      return "—";
    }
  };

  const isDelivered = shipment?.status === "DELIVERED";
  const isException = shipment?.status === "EXCEPTION" || shipment?.status === "DELIVERY_ATTEMPTED";
  const stationaryAtHold = shipment?.status === "AT_FACILITY" || shipment?.status === "EXCEPTION";
  const shareUrl =
    typeof window !== "undefined" && id ? `${window.location.origin}/track/${encodeURIComponent(id)}` : undefined;

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col bg-muted/20">
        <AppHeader />

        {/* Hero search */}
        <div className="bg-secondary py-8">
          <div className="container">
            <h1 className="font-display text-2xl md:text-3xl font-bold text-secondary-foreground mb-1 text-center">
              Track Your Shipment
            </h1>
            <p className="text-secondary-foreground/60 text-sm text-center mb-5">
              Enter your SwiftTrack tracking number for real-time updates
            </p>
            <div className="flex gap-2 max-w-2xl mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-foreground/40" />
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Enter tracking ID"
                  className="pl-10 bg-white/10 border-white/20 text-secondary-foreground placeholder:text-secondary-foreground/40 font-mono text-sm h-12"
                />
              </div>
              <Button 
                onClick={handleSearch} 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold tracking-wide px-8"
              >
                <Search className="h-4 w-4 mr-2" /> TRACK
              </Button>
              <Button 
                onClick={() => setBarcodeScannerOpen(true)} 
                size="lg" 
                variant="outline"
                className="bg-white/10 border-white/20 hover:bg-white/20 text-secondary-foreground font-display font-bold"
                title="Scan barcode or QR code"
              >
                <QrCode className="h-4 w-4" />
              </Button>
            </div>
            {error && (
              <p className="text-center text-primary-foreground text-sm mt-3 font-mono bg-primary/20 rounded py-2 max-w-2xl mx-auto">
                {error}
              </p>
            )}
          </div>
        </div>

        {loading && id && (
          <div className="flex-1 flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Empty state */}
        {!shipment && !loading && (
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
            </div>
          </div>
        )}

        {/* Tracking results — Enhanced Fleet-style layout with sidebar */}
        {shipment && !loading && (
          <div className="flex-1 flex flex-col">
            {/* Top info bar */}
            <div className="border-b border-border bg-card px-4 py-3 md:px-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Tracking Number</p>
                  <div className="flex items-center gap-2 mt-1">
                    <h2 className="font-mono text-lg font-bold text-foreground">{shipment.trackingId}</h2>
                    <button onClick={copyTracking} className="text-muted-foreground hover:text-foreground transition-colors">
                      {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Badge className={`${statusClass[shipment.status]} text-sm font-mono px-4 py-2 border`}>
                  {STATUS_LABELS[shipment.status]}
                </Badge>
              </div>
            </div>

            {/* Main content: sidebar + map + right panel */}
            <div className="flex-1 flex overflow-hidden">
              {/* Left sidebar */}
              <div className="w-72 border-r border-border bg-card overflow-y-auto hidden md:flex flex-col">
                <div className="p-4 border-b border-border">
                  <h3 className="font-display text-sm font-bold text-foreground mb-2">Shipment Status</h3>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {isDelivered 
                      ? "Package delivered successfully." 
                      : isException 
                      ? "Delivery issue reported." 
                      : "Package is in transit."}
                  </p>
                </div>

                {/* Status block */}
                <div className="p-4 border-b border-border">
                  <div className={`p-3 rounded-lg ${
                    isDelivered
                      ? "bg-success/10 border border-success/30"
                      : isException
                      ? "bg-destructive/10 border border-destructive/30"
                      : "bg-secondary/10 border border-secondary/30"
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      {isDelivered ? <CircleCheck className="h-4 w-4 text-success" /> : isException ? <AlertCircle className="h-4 w-4 text-destructive" /> : <Truck className="h-4 w-4 text-secondary" />}
                      <span className="text-xs font-semibold">
                        {isDelivered ? "Delivered" : isException ? "Issue" : STATUS_LABELS[shipment.status]}
                      </span>
                    </div>
                    {hasGps && (
                      <p className="text-[10px] font-mono text-muted-foreground">
                        {num(shipment?.currentLocation?.lat).toFixed(4)}, {num(shipment?.currentLocation?.lng).toFixed(4)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Route info */}
                <div className="p-4 border-b border-border space-y-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">From</p>
                    <p className="text-xs font-semibold text-foreground">{shipment.sender.name}</p>
                    <p className="text-[10px] text-muted-foreground">{shipment.sender.city}, {shipment.sender.state}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">To</p>
                    <p className="text-xs font-semibold text-foreground">{shipment.receiver.name}</p>
                    <p className="text-[10px] text-muted-foreground">{shipment.receiver.city}, {shipment.receiver.state}</p>
                  </div>
                </div>

                {/* Service details */}
                <div className="p-4 border-b border-border space-y-2">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Service</p>
                    <p className="text-xs font-semibold text-foreground">{shipment.serviceType}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Expected Delivery</p>
                    <p className="text-xs font-semibold text-foreground">{formatDate(shipment.estimatedDeliveryDate)}</p>
                  </div>
                  {shipment.requiresSignature && (
                    <div className="flex items-center gap-1.5 text-accent text-xs pt-1">
                      <Shield className="h-3 w-3" /> Signature required
                    </div>
                  )}
                </div>

                {/* Progress */}
                <div className="p-4 flex-1">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Progress</p>
                  <TrackingProgressBar currentStatus={shipment.status} />
                </div>
              </div>

              {/* Center: Map */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="px-4 py-3 border-b border-border bg-card flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-display text-sm font-bold text-foreground">Live Tracking Map</h3>
                    <p className="text-xs text-muted-foreground">
                      {hasGps ? "Real-time GPS location" : geoLoading ? "Locating addresses…" : "Showing route"}
                    </p>
                  </div>
                  {hasGps && (
                    <Badge className="bg-success/10 text-success border-success/30 text-[10px] font-mono flex-shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-success mr-1.5 animate-pulse" />
                      LIVE
                    </Badge>
                  )}
                </div>
                <div className="flex-1 relative">
                  {canShowMap ? (
                    <TrackingMap
                      routeHistory={mapRouteHistory}
                      currentLocation={currentLoc}
                      destination={destination}
                      origin={origin}
                      followTruck={followTruck}
                      onFollowTruckChange={setFollowTruck}
                      stationaryAtHold={stationaryAtHold}
                      mapFitNonce={mapFitNonce}
                      trackingIdForFit={shipment.trackingId}
                      shareTrackingUrl={shareUrl}
                    />
                  ) : (
                    <div className="h-full w-full flex flex-col items-center justify-center bg-muted/30 text-muted-foreground text-sm p-6 text-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      Loading map…
                    </div>
                  )}
                </div>
              </div>

              {/* Right sidebar: Additional info */}
              <div className="w-80 border-l border-border bg-card overflow-y-auto hidden lg:flex flex-col">
                <div className="p-4 border-b border-border space-y-3">
                  <h3 className="font-display text-sm font-bold text-foreground">Package Information</h3>
                  
                  <div className="space-y-2 text-xs">
                    <div>
                      <p className="text-muted-foreground uppercase tracking-wider font-semibold">Weight</p>
                      <p className="font-semibold text-foreground">{shipment.weight || "—"} kg</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground uppercase tracking-wider font-semibold">Dimensions</p>
                      <p className="font-semibold text-foreground">
                        {shipment.dimensions.length || "—"} × {shipment.dimensions.width || "—"} × {shipment.dimensions.height || "—"} cm
                      </p>
                    </div>
                  </div>
                </div>

                {/* Speed widget */}
                {["IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(shipment.status) && (
                  <div className="p-4 border-b border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <Truck className="h-4 w-4 text-secondary" />
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Current Speed</h4>
                    </div>
                    <p className="text-lg font-bold text-foreground">
                      {currentSpeed !== null ? `${currentSpeed.toFixed(0)} mph` : "—"}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {currentSpeed === null
                        ? "Calculating…"
                        : currentSpeed > 50
                        ? "Highway speed"
                        : currentSpeed > 25
                        ? "City speed"
                        : "Slow/stationary"}
                    </p>
                  </div>
                )}

                {/* ETA countdown widget */}
                {etaCountdown && ["IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(shipment.status) && (
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-primary" />
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">ETA</h4>
                    </div>
                    <p className="text-lg font-bold text-foreground">
                      {etaCountdown.hours > 0
                        ? `${etaCountdown.hours}h ${etaCountdown.minutes}m`
                        : `${etaCountdown.minutes}m`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Arrives by {etaTime?.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom: Tracking history when on mobile */}
            <div className="md:hidden border-t border-border bg-card">
              <div className="container py-6">
                <h3 className="font-display text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Tracking History
                  <span className="text-xs text-muted-foreground">({shipment.events.length} updates)</span>
                </h3>
                {shipment.events.length === 0 ? (
                  <div className="text-center text-sm text-muted-foreground py-8">No tracking updates yet.</div>
                ) : (
                  <div className="space-y-3">
                    {[...shipment.events].reverse().slice(0, 5).map((e, i) => (
                      <div key={`${e.timestamp}-${i}`} className="pb-3 border-b border-border/50 last:border-0">
                        <div className="text-xs text-muted-foreground mb-1">{formatDateTime(e.timestamp)}</div>
                        <Badge className={`${statusClass[e.status] || "bg-muted text-muted-foreground"} text-[10px] font-mono border mb-1`}>
                          {STATUS_LABELS[e.status as ShipmentStatus] || e.status}
                        </Badge>
                        <p className="text-sm text-foreground">{e.description}</p>
                        {e.location && (
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {e.location}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <Footer />
          </div>
        )}

        {!shipment && !loading && <Footer />}

        {/* Barcode Scanner Dialog */}
        <BarcodeScanner
          isOpen={barcodeScannerOpen}
          onOpenChange={setBarcodeScannerOpen}
          onScan={handleBarcodeScan}
        />
      </div>
    </PageTransition>
  );
};

export default TrackPage;
