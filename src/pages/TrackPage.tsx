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
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import TrackingMap from "@/components/TrackingMap";
import Barcode from "@/components/Barcode";
import TrackingProgressBar from "@/components/TrackingProgressBar";
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

    const analytics = (data ?? {}) as { current_speed_mph?: number | null };
    const speedMph = analytics.current_speed_mph ?? 60;

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

        channel = supabase
          .channel(`shipment-${shipment.id}`)
          .on(
            "postgres_changes",
            { event: "UPDATE", schema: "public", table: "shipments", filter: `id=eq.${shipment.id}` },
            (payload) => {
              const n = payload.new as DBShipment;
              const o = (payload as { old?: Partial<DBShipment> }).old;
              setDbShipment(n);
              if (o && n.status !== o.status) {
                toast({
                  title: "Shipment updated",
                  description: `Status: ${STATUS_LABELS[n.status as ShipmentStatus] || n.status}`,
                });
                // Queue notification (fire & forget)
                void supabase
                  .rpc("queue_delivery_notification", {
                    p_shipment_id: shipment.id,
                    p_event_type: "status_change",
                  })
                  .then(({ error: nerr }) => {
                    if (nerr) console.error("Error queueing notification:", nerr);
                  });
              }
              const latChanged =
                o &&
                (`${n.current_lat}` !== `${o.current_lat}` || `${n.current_lng}` !== `${o.current_lng}`);
              if (latChanged && o) {
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
                    setMapFitNonce((x) => x + 1);
                  }
                }
                void loadSnapshots(shipment.id);
              }
            }
          )
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "shipment_events", filter: `shipment_id=eq.${shipment.id}` },
            () => loadEvents(shipment.id)
          )
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "shipment_location_snapshots",
              filter: `shipment_id=eq.${shipment.id}`,
            },
            () => loadSnapshots(shipment.id)
          )
          .subscribe();
      } else {
        setDbShipment(null);
        setDbEvents([]);
        setLocationRouteHistory([]);
      }
      setLoading(false);
    })();

    return () => {
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
              <Button onClick={handleSearch} size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold tracking-wide px-8">
                <Search className="h-4 w-4 mr-2" /> TRACK
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

        {/* Tracking results — USPS-style layout */}
        {shipment && !loading && (
          <div className="flex-1">
            <div className="container py-6 space-y-5">
              {/* === Header card: tracking number + status banner === */}
              <Card className="overflow-hidden border-border">
                <div className="p-5 border-b border-border bg-card flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Tracking Number</p>
                    <div className="flex items-center gap-2 mt-1">
                      <h2 className="font-mono text-xl font-bold text-foreground">{shipment.trackingId}</h2>
                      <button onClick={copyTracking} className="text-muted-foreground hover:text-foreground transition-colors">
                        {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Service: <span className="font-semibold text-foreground">{shipment.serviceType}</span>
                      {shipment.requiresSignature && (
                        <span className="ml-3 inline-flex items-center gap-1 text-accent">
                          <Shield className="h-3 w-3" /> Signature required
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge className={`${statusClass[shipment.status]} text-sm font-mono px-4 py-2 border`}>
                      {STATUS_LABELS[shipment.status]}
                    </Badge>
                    <div className="bg-white rounded p-2 border border-border">
                      <Barcode value={shipment.trackingId} height={44} width={1.4} />
                    </div>
                  </div>
                </div>

                {/* Hero status block */}
                <div
                  className={`px-5 py-6 ${
                    isDelivered
                      ? "bg-success/10 border-l-4 border-success"
                      : isException
                      ? "bg-destructive/10 border-l-4 border-destructive"
                      : "bg-secondary/5 border-l-4 border-secondary"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isDelivered ? "bg-success text-success-foreground" : isException ? "bg-destructive text-destructive-foreground" : "bg-secondary text-secondary-foreground"
                      }`}
                    >
                      {isDelivered ? <CircleCheck className="h-6 w-6" /> : isException ? <AlertCircle className="h-6 w-6" /> : <Truck className="h-6 w-6" />}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-display text-xl font-bold text-foreground mb-1">
                        {isDelivered ? "Delivered" : isException ? "Delivery Issue" : STATUS_LABELS[shipment.status]}
                      </h3>
                      {isDelivered && shipment.actualDeliveryDate ? (
                        <p className="text-sm text-muted-foreground">
                          Delivered on <span className="font-semibold text-foreground">{formatDateTime(shipment.actualDeliveryDate)}</span>
                        </p>
                      ) : (
                        <>
                          <p className="text-sm text-muted-foreground">
                            <span className="font-semibold text-foreground">Expected delivery:</span>{" "}
                            {formatDate(shipment.estimatedDeliveryDate)}
                          </p>
                          {shipment.events.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Last update: {shipment.events[shipment.events.length - 1].description} —{" "}
                              {formatDateTime(shipment.events[shipment.events.length - 1].timestamp)}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="px-5 py-5 bg-card">
                  <TrackingProgressBar currentStatus={shipment.status} />
                </div>
              </Card>

              {/* === Map + sidebar === */}
              <div className="grid lg:grid-cols-3 gap-5">
                <Card className="lg:col-span-2 overflow-hidden border-border">
                  <div className="px-5 py-3 border-b border-border bg-card flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-display text-sm font-bold text-foreground">Live Map</h3>
                      <p className="text-xs text-muted-foreground">
                        {hasGps ? "Real-time GPS location" : geoLoading ? "Locating addresses…" : "Showing route"}
                      </p>
                      {hasGps && (
                        <p className="text-[10px] font-mono text-muted-foreground mt-1 truncate" title="Current coordinates">
                          {num(isDB && dbShipment ? dbShipment.current_lat : shipment?.currentLocation?.lat).toFixed(5)}
                          ,{" "}
                          {num(isDB && dbShipment ? dbShipment.current_lng : shipment?.currentLocation?.lng).toFixed(5)}
                        </p>
                      )}
                    </div>
                    {hasGps && (
                      <Badge className="bg-success/10 text-success border-success/30 text-[10px] font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-success mr-1.5 animate-pulse" />
                        LIVE
                      </Badge>
                    )}
                  </div>
                  <div className="h-[420px] relative">
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
                </Card>

                {/* Right sidebar: addresses */}
                <div className="space-y-5">
                  <Card className="p-5 border-border">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-full bg-secondary/10 flex items-center justify-center">
                        <MapPin className="h-4 w-4 text-secondary" />
                      </div>
                      <h3 className="font-display text-sm font-bold uppercase tracking-wider text-muted-foreground">
                        Shipped From
                      </h3>
                    </div>
                    <p className="text-sm font-semibold text-foreground">{shipment.sender.name}</p>
                    {shipment.sender.street && (
                      <p className="text-xs text-muted-foreground mt-1">{shipment.sender.street}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {shipment.sender.city}, {shipment.sender.state} {shipment.sender.zip}
                    </p>
                  </Card>

                  <Card className="p-5 border-border">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                        <MapPin className="h-4 w-4 text-primary" />
                      </div>
                      <h3 className="font-display text-sm font-bold uppercase tracking-wider text-muted-foreground">
                        Delivering To
                      </h3>
                    </div>
                    <p className="text-sm font-semibold text-foreground">{shipment.receiver.name}</p>
                    {shipment.receiver.street && (
                      <p className="text-xs text-muted-foreground mt-1">{shipment.receiver.street}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {shipment.receiver.city}, {shipment.receiver.state} {shipment.receiver.zip}
                    </p>
                  </Card>

                  <Card className="p-5 border-border">
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-display text-sm font-bold uppercase tracking-wider text-muted-foreground">
                        Expected Delivery
                      </h3>
                    </div>
                    <p className="text-lg font-bold text-foreground">{formatDate(shipment.estimatedDeliveryDate)}</p>
                  </Card>

                  {/* Speed widget */}
                  {["IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(shipment.status) && (
                    <Card className="p-5 border-border bg-secondary/5">
                      <div className="flex items-center gap-2 mb-3">
                        <Truck className="h-4 w-4 text-secondary" />
                        <h3 className="font-display text-sm font-bold uppercase tracking-wider text-muted-foreground">
                          Current Speed
                        </h3>
                      </div>
                      <p className="text-lg font-bold text-foreground">
                        {currentSpeed !== null ? `${currentSpeed.toFixed(0)} mph` : "—"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {currentSpeed === null
                          ? "Calculating from GPS history..."
                          : currentSpeed > 50
                          ? "Highway speed"
                          : currentSpeed > 25
                          ? "City speed"
                          : "Slow or stationary"}
                      </p>
                    </Card>
                  )}

                  {/* ETA countdown widget */}
                  {etaCountdown && ["IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(shipment.status) && (
                    <Card className="p-5 border-border bg-primary/5">
                      <div className="flex items-center gap-2 mb-3">
                        <Clock className="h-4 w-4 text-primary" />
                        <h3 className="font-display text-sm font-bold uppercase tracking-wider text-muted-foreground">
                          ETA Countdown
                        </h3>
                      </div>
                      <p className="text-lg font-bold text-foreground">
                        {etaCountdown.hours > 0
                          ? `${etaCountdown.hours}h ${etaCountdown.minutes}m`
                          : `${etaCountdown.minutes}m`}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Arrives by {etaTime?.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                      </p>
                    </Card>
                  )}
                </div>
              </div>

              {/* === Package details === */}
              <Card className="border-border">
                <div className="px-5 py-3 border-b border-border bg-card">
                  <h3 className="font-display text-sm font-bold text-foreground">Package Details</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-border">
                  <div className="p-4">
                    <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] uppercase tracking-wider mb-1">
                      <Weight className="h-3 w-3" /> Weight
                    </div>
                    <p className="text-sm font-semibold">{shipment.weight || "—"} kg</p>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] uppercase tracking-wider mb-1">
                      <Box className="h-3 w-3" /> Dimensions
                    </div>
                    <p className="text-sm font-semibold">
                      {shipment.dimensions.length}×{shipment.dimensions.width}×{shipment.dimensions.height} cm
                    </p>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] uppercase tracking-wider mb-1">
                      <Truck className="h-3 w-3" /> Service
                    </div>
                    <p className="text-sm font-semibold">{shipment.serviceType}</p>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] uppercase tracking-wider mb-1">
                      <Shield className="h-3 w-3" /> Signature
                    </div>
                    <p className="text-sm font-semibold">{shipment.requiresSignature ? "Required" : "Not required"}</p>
                  </div>
                </div>
              </Card>

              {/* === Tracking history (USPS-style table) === */}
              <Card className="border-border overflow-hidden">
                <div className="px-5 py-3 border-b border-border bg-card flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-display text-sm font-bold text-foreground">Tracking History</h3>
                  <span className="text-xs text-muted-foreground">({shipment.events.length} updates)</span>
                </div>
                {shipment.events.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">No tracking updates yet.</div>
                ) : (
                  <div className="divide-y divide-border">
                    {[...shipment.events].reverse().map((e, i) => {
                      const isLatest = i === 0;
                      return (
                        <div
                          key={`${e.timestamp}-${i}`}
                          className={`grid grid-cols-12 gap-3 px-5 py-4 ${isLatest ? "bg-secondary/5" : ""}`}
                        >
                          <div className="col-span-12 md:col-span-3 text-xs text-muted-foreground">
                            {formatDateTime(e.timestamp)}
                          </div>
                          <div className="col-span-12 md:col-span-3">
                            <Badge className={`${statusClass[e.status] || "bg-muted text-muted-foreground"} text-[10px] font-mono border`}>
                              {STATUS_LABELS[e.status as ShipmentStatus] || e.status}
                            </Badge>
                          </div>
                          <div className="col-span-12 md:col-span-4 text-sm text-foreground">{e.description}</div>
                          <div className="col-span-12 md:col-span-2 text-xs text-muted-foreground flex items-center gap-1">
                            {e.location && <MapPin className="h-3 w-3" />}
                            {e.location}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            </div>

            <Footer />
          </div>
        )}

        {!shipment && !loading && <Footer />}
      </div>
    </PageTransition>
  );
};

export default TrackPage;
