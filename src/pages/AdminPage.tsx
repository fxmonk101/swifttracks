import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package,
  Truck,
  MapPin,
  CheckCircle,
  AlertTriangle,
  Search,
  Plus,
  Eye,
  Edit2,
  Loader2,
  Navigation,
  Map,
  Play,
  Square,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import AppHeader from "@/components/AppHeader";
import { STATUS_LABELS, ShipmentStatus } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { geocode, US_CENTER } from "@/lib/geocoding";
import TrackingMap from "@/components/TrackingMap";
import { Coordinates } from "@/lib/types";

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

type DBShipment = {
  id: string;
  tracking_id: string;
  service_type: string;
  status: string;
  sender_name: string;
  sender_city: string;
  sender_state: string;
  receiver_name: string;
  receiver_city: string;
  receiver_state: string;
  weight: number | null;
  estimated_delivery_date: string | null;
  assigned_driver: string | null;
  created_at: string;
  current_lat: number | null;
  current_lng: number | null;
};

const num = (v: unknown, fallback = 0): number => {
  const n = typeof v === "string" ? parseFloat(v) : (v as number);
  return Number.isFinite(n) ? n : fallback;
};

function generateTrackingId() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return `TH-2026-${code}`;
}

const AdminPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [shipments, setShipments] = useState<DBShipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editingShipment, setEditingShipment] = useState<DBShipment | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [statusDescription, setStatusDescription] = useState("");
  const [statusLocation, setStatusLocation] = useState("");
  const [syncMapFromLocation, setSyncMapFromLocation] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [gpsShipment, setGpsShipment] = useState<DBShipment | null>(null);
  const [gpsLat, setGpsLat] = useState("");
  const [gpsLng, setGpsLng] = useState("");
  const [gpsAddressQuery, setGpsAddressQuery] = useState("");
  const [geocodingGps, setGeocodingGps] = useState(false);
  const [updatingGps, setUpdatingGps] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [mapPreviewShipment, setMapPreviewShipment] = useState<DBShipment | null>(null);
  const [previewCoords, setPreviewCoords] = useState<{
    origin: Coordinates;
    destination: Coordinates;
    current: Coordinates;
  } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [simulatingShipment, setSimulatingShipment] = useState<DBShipment | null>(null);
  const [simulationProgress, setSimulationProgress] = useState(0);
  const [simulationSpeed, setSimulationSpeed] = useState(1);
  const [simulationRunning, setSimulationRunning] = useState(false);
  const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [packageCount, setPackageCount] = useState(1);

  const fetchShipments = async () => {
    const { data, error } = await supabase
      .from("shipments")
      .select(
        "id, tracking_id, service_type, status, sender_name, sender_city, sender_state, receiver_name, receiver_city, receiver_state, weight, estimated_delivery_date, assigned_driver, created_at, current_lat, current_lng"
      )
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Error loading shipments", description: error.message, variant: "destructive" });
    }
    if (data) setShipments(data as DBShipment[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchShipments();
    if (user) {
      supabase.rpc("is_admin").then(({ data }) => setIsAdmin(!!data));
    }
    const channel = supabase
      .channel("admin-shipments")
      .on("postgres_changes", { event: "*", schema: "public", table: "shipments" }, () => fetchShipments())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
      if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
    };
  }, [user]);

  useEffect(() => {
    if (!mapPreviewShipment) {
      setPreviewCoords(null);
      return;
    }
    let cancelled = false;
    setPreviewLoading(true);
    (async () => {
      const qO = `${mapPreviewShipment.sender_city}, ${mapPreviewShipment.sender_state}`;
      const qD = `${mapPreviewShipment.receiver_city}, ${mapPreviewShipment.receiver_state}`;
      const [o, d] = await Promise.all([geocode(qO), geocode(qD)]);
      if (cancelled) return;
      const origin = o || US_CENTER;
      const destination = d || US_CENTER;
      const current =
        mapPreviewShipment.current_lat != null && mapPreviewShipment.current_lng != null
          ? { lat: num(mapPreviewShipment.current_lat), lng: num(mapPreviewShipment.current_lng) }
          : origin;
      setPreviewCoords({ origin, destination, current });
      setPreviewLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [mapPreviewShipment]);

  const handleUpdateGps = async () => {
    if (!gpsShipment) return;
    const lat = parseFloat(gpsLat);
    const lng = parseFloat(gpsLng);
    if (isNaN(lat) || isNaN(lng)) {
      toast({ title: "Invalid coordinates", description: "Please enter valid numbers", variant: "destructive" });
      return;
    }
    setUpdatingGps(true);
    const { data, error } = await supabase.rpc("update_shipment_location", {
      p_shipment_id: gpsShipment.id,
      p_lat: lat,
      p_lng: lng,
      p_source: "admin_manual",
    });
    if (error) {
      toast({ title: "Error updating GPS", description: error.message, variant: "destructive" });
    } else if (data && !(data as { success?: boolean }).success) {
      toast({ title: "Not authorized", description: (data as { error?: string }).error, variant: "destructive" });
    } else {
      toast({ title: "GPS Updated", description: `Truck moved to ${lat.toFixed(4)}, ${lng.toFixed(4)}` });
      setGpsShipment(null);
      setGpsLat("");
      setGpsLng("");
      setGpsAddressQuery("");
      fetchShipments();
    }
    setUpdatingGps(false);
  };

  const handleGeocodeGpsAddress = async () => {
    const q = gpsAddressQuery.trim();
    if (!q) {
      toast({ title: "Enter an address", description: "Type a city or full address to geocode.", variant: "destructive" });
      return;
    }
    setGeocodingGps(true);
    const g = await geocode(q);
    setGeocodingGps(false);
    if (!g) {
      toast({ title: "Not found", description: "Could not resolve that address.", variant: "destructive" });
      return;
    }
    setGpsLat(String(g.lat));
    setGpsLng(String(g.lng));
    toast({ title: "Coordinates set", description: `${g.lat.toFixed(4)}, ${g.lng.toFixed(4)}` });
  };

  const handleSimulateTrip = async (targetShipment?: DBShipment) => {
    const shipment = targetShipment || simulatingShipment || gpsShipment;
    if (!shipment) return;

    // Auto-promote to IN_TRANSIT so the trip can run from any starting state
    if (shipment.status !== "IN_TRANSIT") {
      const { error: stErr } = await supabase.rpc("update_shipment_status", {
        p_shipment_id: shipment.id,
        p_new_status: "IN_TRANSIT",
        p_description: "Live trip started — package is now moving",
        p_location: `${shipment.sender_city}, ${shipment.sender_state}`,
      });
      if (stErr) {
        toast({ title: "Could not start trip", description: stErr.message, variant: "destructive" });
        return;
      }
    }

    // Resolve origin & destination coords
    const [o, d] = await Promise.all([
      geocode(`${shipment.sender_city}, ${shipment.sender_state}`),
      geocode(`${shipment.receiver_city}, ${shipment.receiver_state}`),
    ]);
    if (!o || !d) {
      toast({ title: "Geocode failed", description: "Could not resolve origin or destination", variant: "destructive" });
      return;
    }

    // Determine starting progress from current GPS so the truck doesn't jump back
    let startProgress = 0;
    const curLat = shipment.current_lat != null ? num(shipment.current_lat) : null;
    const curLng = shipment.current_lng != null ? num(shipment.current_lng) : null;
    if (curLat != null && curLng != null) {
      const dx = d.lng - o.lng;
      const dy = d.lat - o.lat;
      const len2 = dx * dx + dy * dy;
      if (len2 > 1e-9) {
        const t = ((curLng - o.lng) * dx + (curLat - o.lat) * dy) / len2;
        startProgress = Math.round(Math.max(0, Math.min(100, t * 100)));
      }
    }

    setSimulatingShipment(shipment);
    setSimulationRunning(true);
    setSimulationProgress(startProgress);
    let currentProgress = startProgress;
    const stepSize = 1; // 1% per tick — smoother + slower

    // Realistic speed: average 55 mph long-haul trucking
    // distance(km) at 55mph ≈ 88 km/h. Time(sec) per 1% step = (totalKm * 0.01) / (88/3600)
    const R = 6371;
    const toRad = (x: number) => (x * Math.PI) / 180;
    const dLat = toRad(d.lat - o.lat);
    const dLng = toRad(d.lng - o.lng);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(o.lat)) * Math.cos(toRad(d.lat)) * Math.sin(dLng / 2) ** 2;
    const totalKm = 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
    const realSecondsPerStep = (totalKm * 0.01) / (88 / 3600); // real-world seconds per 1%
    // Compress real time so a 1000mi trip doesn't take all day. Cap step delay at 8s, min 1s.
    // Compression factor: simulate at ~120x real time, then divide by simulationSpeed multiplier.
    const compressed = (realSecondsPerStep / 120) * 1000;
    const delay = Math.max(1000, Math.min(8000, compressed)) / Math.max(0.5, simulationSpeed);

    const runSimulation = async () => {
      if (currentProgress >= 100) {
        setSimulationRunning(false);
        if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
        toast({
          title: "Trip Completed!",
          description: "Truck reached the destination — status set to OUT_FOR_DELIVERY.",
        });
        const { error } = await supabase.rpc("update_shipment_status", {
          p_shipment_id: shipment.id,
          p_new_status: "OUT_FOR_DELIVERY",
          p_description: "Arrived at destination facility, out for delivery",
          p_location: `${shipment.receiver_city}, ${shipment.receiver_state}`,
        });
        if (error) console.error("Error updating status:", error);
        fetchShipments();
        return;
      }

      const { error } = await supabase.rpc("simulate_trip_step", {
        p_shipment_id: shipment.id,
        p_step: currentProgress,
        p_origin_lat: o.lat,
        p_origin_lng: o.lng,
        p_dest_lat: d.lat,
        p_dest_lng: d.lng,
      });

      if (error) {
        toast({ title: "Simulation error", description: error.message, variant: "destructive" });
        setSimulationRunning(false);
        if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
        return;
      }

      currentProgress = Math.min(100, currentProgress + stepSize);
      setSimulationProgress(currentProgress);
    };

    simulationIntervalRef.current = setInterval(runSimulation, delay);
  };

  const handleStopSimulation = () => {
    if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
    setSimulationRunning(false);
    setSimulationProgress(0);
  };

  const stats = [
    { label: "Total Shipments", value: shipments.length, icon: Package, color: "text-secondary" },
    { label: "In Transit", value: shipments.filter((s) => s.status === "IN_TRANSIT").length, icon: Truck, color: "text-secondary" },
    { label: "Out for Delivery", value: shipments.filter((s) => s.status === "OUT_FOR_DELIVERY").length, icon: MapPin, color: "text-warning" },
    { label: "Delivered", value: shipments.filter((s) => s.status === "DELIVERED").length, icon: CheckCircle, color: "text-success" },
    { label: "Exceptions", value: shipments.filter((s) => s.status === "EXCEPTION").length, icon: AlertTriangle, color: "text-destructive" },
  ];

  const filtered = shipments.filter((s) => {
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    if (searchQuery && !s.tracking_id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleCreateShipment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Error", description: "You must be logged in as admin to create shipments", variant: "destructive" });
      return;
    }
    setCreating(true);
    const form = new FormData(e.currentTarget);
    const trackingId = generateTrackingId();

    const packageCount = parseInt((form.get("packageCount") as string) || "1", 10) || 1;
    const packagesMeta = Array.from({ length: packageCount }, (_, i) => ({
      index: i + 1,
      weight: parseFloat((form.get(`pkgWeight_${i}`) as string) || "0") || 0,
      length: parseFloat((form.get(`pkgLength_${i}`) as string) || "0") || 0,
      width: parseFloat((form.get(`pkgWidth_${i}`) as string) || "0") || 0,
      height: parseFloat((form.get(`pkgHeight_${i}`) as string) || "0") || 0,
      description: (form.get(`pkgDesc_${i}`) as string) || "",
    }));
    const totalWeight = packagesMeta.reduce((s, p) => s + p.weight, 0);

    const { data, error } = await supabase
      .from("shipments")
      .insert({
        tracking_id: trackingId,
        service_type: (form.get("serviceType") as string) || "STANDARD",
        sender_name: form.get("senderName") as string,
        sender_city: form.get("senderCity") as string,
        sender_state: form.get("senderState") as string,
        sender_street: form.get("senderStreet") as string,
        sender_email: (form.get("senderEmail") as string) || null,
        sender_phone: (form.get("senderPhone") as string) || null,
        receiver_name: form.get("receiverName") as string,
        receiver_city: form.get("receiverCity") as string,
        receiver_state: form.get("receiverState") as string,
        receiver_street: form.get("receiverStreet") as string,
        receiver_email: (form.get("receiverEmail") as string) || null,
        receiver_phone: (form.get("receiverPhone") as string) || null,
        weight: totalWeight,
        package_count: packageCount,
        packages_meta: packagesMeta,
        requires_signature: form.get("signature") === "on",
        pickup_date: (form.get("pickupDate") as string) || null,
        estimated_delivery_date: (form.get("estDelivery") as string) || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Error creating shipment", description: error.message, variant: "destructive" });
    } else {
      if (data) {
        await supabase.from("shipment_events").insert({
          shipment_id: data.id,
          status: "LABEL_CREATED",
          description: `Shipping label created — ${packageCount} package${packageCount > 1 ? "s" : ""}`,
          location: `${form.get("senderCity")}, ${form.get("senderState")}`,
        });
      }
      toast({ title: "Shipment Created!", description: `Tracking ID: ${trackingId}` });
      setShowCreateDialog(false);
      fetchShipments();
    }
    setCreating(false);
  };

  const handleUpdateStatus = async () => {
    if (!editingShipment || !newStatus) return;
    setUpdatingStatus(true);

    const { data, error } = await supabase.rpc("update_shipment_status", {
      p_shipment_id: editingShipment.id,
      p_new_status: newStatus,
      p_description: statusDescription || null,
      p_location: statusLocation || null,
    });

    if (error) {
      toast({ title: "Error updating status", description: error.message, variant: "destructive" });
      setUpdatingStatus(false);
      return;
    }
    if (data && !(data as { success?: boolean }).success) {
      toast({ title: "Error", description: (data as { error?: string }).error || "Failed to update", variant: "destructive" });
      setUpdatingStatus(false);
      return;
    }

    if (syncMapFromLocation && statusLocation.trim()) {
      const g = await geocode(statusLocation.trim());
      if (!g) {
        toast({
          title: "Status saved — map pin unchanged",
          description: "Could not geocode the location text. Set GPS manually if needed.",
          variant: "destructive",
        });
      } else {
        const { data: locData, error: locErr } = await supabase.rpc("update_shipment_location", {
          p_shipment_id: editingShipment.id,
          p_lat: g.lat,
          p_lng: g.lng,
          p_source: "admin_status_geocode",
        });
        if (locErr) {
          toast({ title: "Status saved", description: `Map pin not updated: ${locErr.message}`, variant: "destructive" });
        } else if (locData && !(locData as { success?: boolean }).success) {
          toast({ title: "Status saved", description: "Map pin not updated (not authorized).", variant: "destructive" });
        } else {
          toast({
            title: "Status & map updated",
            description: `${editingShipment.tracking_id} → ${STATUS_LABELS[newStatus as ShipmentStatus] || newStatus}`,
          });
          setEditingShipment(null);
          setNewStatus("");
          setStatusDescription("");
          setStatusLocation("");
          fetchShipments();
          setUpdatingStatus(false);
          return;
        }
      }
    } else {
      toast({
        title: "Status Updated",
        description: `${editingShipment.tracking_id} → ${STATUS_LABELS[newStatus as ShipmentStatus] || newStatus}`,
      });
    }

    setEditingShipment(null);
    setNewStatus("");
    setStatusDescription("");
    setStatusLocation("");
    fetchShipments();
    setUpdatingStatus(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <AppHeader />
        <div className="flex-1 flex items-center justify-center">
          <Card className="p-8 max-w-md text-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-warning mx-auto" />
            <h2 className="font-display text-2xl font-bold">Admin Access Required</h2>
            <p className="text-muted-foreground text-sm">You need to sign in with an admin account to access this dashboard.</p>
            <Button onClick={() => navigate("/auth")} className="bg-primary text-primary-foreground">
              Sign In
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />
      <div className="container py-6 space-y-6">
        {isAdmin === false && (
          <Card className="p-4 border-destructive bg-destructive/10">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
              <div className="text-sm">
                <p className="font-bold text-destructive">You are signed in but not an admin</p>
                <p className="text-muted-foreground mt-1">
                  Creating and updating shipments requires the admin role. The first user to sign up automatically becomes admin. Sign out and create a fresh account, or ask an existing admin to grant you the role.
                </p>
              </div>
            </div>
          </Card>
        )}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage shipments, drivers, and fleet operations {isAdmin && <span className="text-success font-mono">• admin</span>}
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-primary text-primary-foreground font-mono text-xs gap-1.5" disabled={isAdmin === false}>
                  <Plus className="h-3.5 w-3.5" /> New Shipment
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-display">Create New Shipment</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateShipment} className="space-y-4">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Sender</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Name *</Label>
                      <Input name="senderName" required className="text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs">Street</Label>
                      <Input name="senderStreet" className="text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs">City *</Label>
                      <Input name="senderCity" required className="text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs">State *</Label>
                      <Input name="senderState" required className="text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs">Email</Label>
                      <Input name="senderEmail" type="email" className="text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs">Phone</Label>
                      <Input name="senderPhone" type="tel" className="text-sm" />
                    </div>
                  </div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Receiver</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Name *</Label>
                      <Input name="receiverName" required className="text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs">Street</Label>
                      <Input name="receiverStreet" className="text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs">City *</Label>
                      <Input name="receiverCity" required className="text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs">State *</Label>
                      <Input name="receiverState" required className="text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs">Email</Label>
                      <Input name="receiverEmail" type="email" className="text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs">Phone</Label>
                      <Input name="receiverPhone" type="tel" className="text-sm" />
                    </div>
                  </div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Schedule</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Pickup date & time</Label>
                      <Input name="pickupDate" type="datetime-local" className="text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs">Expected delivery date & time</Label>
                      <Input name="estDelivery" type="datetime-local" className="text-sm" />
                    </div>
                  </div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Service</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Service Type</Label>
                      <Select name="serviceType" defaultValue="EXPRESS">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EXPRESS">Express</SelectItem>
                          <SelectItem value="STANDARD">Standard</SelectItem>
                          <SelectItem value="OVERNIGHT">Overnight</SelectItem>
                          <SelectItem value="ECONOMY">Economy</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end gap-2 pb-1">
                      <input type="checkbox" name="signature" id="signature" className="rounded" />
                      <Label htmlFor="signature" className="text-xs">
                        Requires Signature
                      </Label>
                    </div>
                  </div>

                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                    <span>Packages</span>
                    <span className="text-[10px] text-muted-foreground normal-case">Add multiple packages to one shipment</span>
                  </h4>
                  <div>
                    <Label className="text-xs">Number of packages</Label>
                    <Input
                      name="packageCount"
                      type="number"
                      min="1"
                      max="20"
                      value={packageCount}
                      onChange={(e) => setPackageCount(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                      className="text-sm w-32"
                    />
                  </div>
                  <div className="space-y-3">
                    {Array.from({ length: packageCount }).map((_, i) => (
                      <div key={i} className="border border-border rounded-md p-3 space-y-2 bg-muted/30">
                        <p className="text-[11px] font-bold text-muted-foreground">Package #{i + 1}</p>
                        <Input name={`pkgDesc_${i}`} placeholder="Description (e.g. Electronics)" className="text-xs h-8" />
                        <div className="grid grid-cols-4 gap-2">
                          <Input name={`pkgWeight_${i}`} type="number" step="0.1" placeholder="Wt (kg)" className="text-xs h-8" />
                          <Input name={`pkgLength_${i}`} type="number" placeholder="L (cm)" className="text-xs h-8" />
                          <Input name={`pkgWidth_${i}`} type="number" placeholder="W (cm)" className="text-xs h-8" />
                          <Input name={`pkgHeight_${i}`} type="number" placeholder="H (cm)" className="text-xs h-8" />
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button type="submit" disabled={creating} className="w-full bg-primary text-primary-foreground">
                    {creating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" /> Creating...
                      </>
                    ) : (
                      "Create Shipment"
                    )}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {stats.map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                  <span className="font-display text-2xl font-bold">{s.value}</span>
                </div>
                <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tracking ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 font-mono text-sm"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Card>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="font-medium">No shipments found</p>
                <p className="text-xs mt-1">Create a new shipment to get started</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-semibold text-xs text-muted-foreground uppercase tracking-wider">Tracking ID</th>
                    <th className="text-left p-3 font-semibold text-xs text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="text-left p-3 font-semibold text-xs text-muted-foreground uppercase tracking-wider hidden md:table-cell">Service</th>
                    <th className="text-left p-3 font-semibold text-xs text-muted-foreground uppercase tracking-wider hidden lg:table-cell">From</th>
                    <th className="text-left p-3 font-semibold text-xs text-muted-foreground uppercase tracking-wider hidden lg:table-cell">To</th>
                    <th className="text-left p-3 font-semibold text-xs text-muted-foreground uppercase tracking-wider hidden xl:table-cell">GPS</th>
                    <th className="text-left p-3 font-semibold text-xs text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => (
                    <tr key={s.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-3 font-mono text-xs font-medium">{s.tracking_id}</td>
                      <td className="p-3">
                        <Badge className={`${statusClass[s.status] || "bg-muted text-muted-foreground"} text-xs font-mono`}>
                          {STATUS_LABELS[s.status as ShipmentStatus] || s.status}
                        </Badge>
                      </td>
                      <td className="p-3 hidden md:table-cell text-xs">{s.service_type}</td>
                      <td className="p-3 hidden lg:table-cell text-xs">
                        {s.sender_city}, {s.sender_state}
                      </td>
                      <td className="p-3 hidden lg:table-cell text-xs">
                        {s.receiver_city}, {s.receiver_state}
                      </td>
                      <td className="p-3 hidden xl:table-cell text-[10px] font-mono text-muted-foreground">
                        {s.current_lat != null && s.current_lng != null
                          ? `${num(s.current_lat).toFixed(3)}, ${num(s.current_lng).toFixed(3)}`
                          : "—"}
                      </td>
                      <td className="p-3 flex gap-1 flex-wrap">
                        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => navigate(`/track/${s.tracking_id}`)}>
                          <Eye className="h-3 w-3" /> Track
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={() => setMapPreviewShipment(s)}
                          disabled={isAdmin === false}
                        >
                          <Map className="h-3 w-3" /> Map
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={() => {
                            setEditingShipment(s);
                            setNewStatus(s.status);
                          }}
                          disabled={isAdmin === false}
                        >
                          <Edit2 className="h-3 w-3" /> Status
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={() => {
                            setGpsShipment(s);
                            setGpsLat(s.current_lat != null ? String(s.current_lat) : "");
                            setGpsLng(s.current_lng != null ? String(s.current_lng) : "");
                            setGpsAddressQuery("");
                          }}
                          disabled={isAdmin === false}
                        >
                          <Navigation className="h-3 w-3" /> GPS
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs gap-1 text-secondary"
                          onClick={() => {
                            setSimulatingShipment(s);
                          }}
                          disabled={isAdmin === false}
                          title="Start a real live trip — auto-moves the truck along the route"
                        >
                          <Play className="h-3 w-3" /> Trip
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      </div>

      <Dialog open={!!editingShipment} onOpenChange={(open) => !open && setEditingShipment(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">Update Shipment Status</DialogTitle>
          </DialogHeader>
          {editingShipment && (
            <div className="space-y-4">
              <p className="font-mono text-sm font-bold">{editingShipment.tracking_id}</p>
              <p className="text-xs text-muted-foreground">
                Current:{" "}
                <Badge className={`${statusClass[editingShipment.status]} text-xs ml-1`}>
                  {STATUS_LABELS[editingShipment.status as ShipmentStatus] || editingShipment.status}
                </Badge>
              </p>
              <div>
                <Label className="text-xs">New Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Description</Label>
                <Input
                  value={statusDescription}
                  onChange={(e) => setStatusDescription(e.target.value)}
                  placeholder="e.g. Package arrived at sorting facility"
                  className="text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">Location</Label>
                <Input
                  value={statusLocation}
                  onChange={(e) => setStatusLocation(e.target.value)}
                  placeholder="e.g. New York, NY"
                  className="text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="sync-map" checked={syncMapFromLocation} onCheckedChange={(c) => setSyncMapFromLocation(c === true)} />
                <Label htmlFor="sync-map" className="text-xs font-normal leading-tight cursor-pointer">
                  Update map pin from this location (geocoded)
                </Label>
              </div>
              <Button onClick={handleUpdateStatus} disabled={updatingStatus} className="w-full bg-primary text-primary-foreground">
                {updatingStatus ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" /> Updating...
                  </>
                ) : (
                  "Update Status"
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!gpsShipment} onOpenChange={(open) => !open && setGpsShipment(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">Update GPS Location</DialogTitle>
          </DialogHeader>
          {gpsShipment && (
            <div className="space-y-4">
              <p className="font-mono text-sm font-bold">{gpsShipment.tracking_id}</p>
              <p className="text-xs text-muted-foreground">Move the truck on the live map by coordinates or geocode an address.</p>
              <div>
                <Label className="text-xs">Address or city</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={gpsAddressQuery}
                    onChange={(e) => setGpsAddressQuery(e.target.value)}
                    placeholder="e.g. Memphis, TN"
                    className="text-sm"
                  />
                  <Button type="button" variant="secondary" size="sm" className="shrink-0" disabled={geocodingGps} onClick={handleGeocodeGpsAddress}>
                    {geocodingGps ? <Loader2 className="h-4 w-4 animate-spin" /> : "Geocode"}
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Latitude</Label>
                  <Input value={gpsLat} onChange={(e) => setGpsLat(e.target.value)} placeholder="40.7128" type="number" step="any" className="text-sm font-mono" />
                </div>
                <div>
                  <Label className="text-xs">Longitude</Label>
                  <Input value={gpsLng} onChange={(e) => setGpsLng(e.target.value)} placeholder="-74.0060" type="number" step="any" className="text-sm font-mono" />
                </div>
              </div>
              <div className="text-[11px] text-muted-foreground bg-muted/50 p-2 rounded space-y-1">
                <p className="font-semibold">Quick presets:</p>
                <div className="flex flex-wrap gap-1">
                  {[
                    { name: "NYC", lat: 40.7128, lng: -74.006 },
                    { name: "Chicago", lat: 41.8827, lng: -87.6233 },
                    { name: "Denver", lat: 39.7392, lng: -104.9903 },
                    { name: "LA", lat: 34.0522, lng: -118.2437 },
                  ].map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => {
                        setGpsLat(String(c.lat));
                        setGpsLng(String(c.lng));
                      }}
                      className="px-2 py-0.5 rounded bg-card border border-border hover:bg-accent transition font-mono"
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
              <Button onClick={handleUpdateGps} disabled={updatingGps} className="w-full bg-primary text-primary-foreground">
                {updatingGps ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" /> Updating...
                  </>
                ) : (
                  "Update GPS"
                )}
              </Button>
              {gpsShipment?.status === "IN_TRANSIT" && (
                <div className="space-y-3 border-t pt-4">
                  <h4 className="text-xs font-semibold">Simulate Trip</h4>
                  <p className="text-[11px] text-muted-foreground">Auto-move truck along route from origin to destination</p>
                  <div>
                    <Label className="text-xs">Simulation Speed</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="range"
                        min="0.5"
                        max="3"
                        step="0.5"
                        value={simulationSpeed}
                        onChange={(e) => setSimulationSpeed(parseFloat(e.target.value))}
                        disabled={simulationRunning}
                        className="flex-1 h-2 rounded cursor-pointer"
                      />
                      <span className="text-xs font-mono w-12 text-right">{simulationSpeed}x</span>
                    </div>
                  </div>
                  {simulationRunning && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">Progress</span>
                        <span className="text-xs font-mono">{simulationProgress.toFixed(0)}%</span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded overflow-hidden">
                        <div
                          className="h-full bg-secondary transition-all duration-300"
                          style={{ width: `${simulationProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                  <Button
                    onClick={simulationRunning ? handleStopSimulation : () => handleSimulateTrip(gpsShipment || undefined)}
                    className="w-full"
                    variant={simulationRunning ? "destructive" : "default"}
                  >
                    {simulationRunning ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" /> Stop Simulation
                      </>
                    ) : (
                      <>▶ Start Simulation</>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!mapPreviewShipment} onOpenChange={(open) => !open && setMapPreviewShipment(null)}>
        <DialogContent className="max-w-3xl w-[95vw]">
          <DialogHeader>
            <DialogTitle className="font-display">Map preview</DialogTitle>
          </DialogHeader>
          {mapPreviewShipment && (
            <div className="space-y-2">
              <p className="font-mono text-sm text-muted-foreground">{mapPreviewShipment.tracking_id}</p>
              <div className="h-[320px] rounded-md overflow-hidden border border-border">
                {previewLoading || !previewCoords ? (
                  <div className="h-full flex items-center justify-center bg-muted/40">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <TrackingMap
                    routeHistory={[]}
                    currentLocation={previewCoords.current}
                    destination={previewCoords.destination}
                    origin={previewCoords.origin}
                    mapFitNonce={1}
                    trackingIdForFit={mapPreviewShipment.tracking_id}
                    showMapControls
                    shareTrackingUrl={
                      typeof window !== "undefined"
                        ? `${window.location.origin}/track/${encodeURIComponent(mapPreviewShipment.tracking_id)}`
                        : undefined
                    }
                  />
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Real Trip control — auto-moves the truck along the route polyline */}
      <Dialog
        open={!!simulatingShipment}
        onOpenChange={(open) => {
          if (!open) {
            if (simulationRunning && simulationIntervalRef.current) {
              clearInterval(simulationIntervalRef.current);
              setSimulationRunning(false);
            }
            setSimulatingShipment(null);
            setSimulationProgress(0);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Play className="h-4 w-4 text-secondary" /> Real Trip Control
            </DialogTitle>
          </DialogHeader>
          {simulatingShipment && (
            <div className="space-y-4">
              <div className="bg-muted/40 rounded-md p-3 space-y-1">
                <p className="font-mono text-sm font-bold">{simulatingShipment.tracking_id}</p>
                <p className="text-xs text-muted-foreground">
                  <span className="font-semibold">From:</span> {simulatingShipment.sender_city}, {simulatingShipment.sender_state}
                </p>
                <p className="text-xs text-muted-foreground">
                  <span className="font-semibold">To:</span> {simulatingShipment.receiver_city}, {simulatingShipment.receiver_state}
                </p>
              </div>

              <p className="text-xs text-muted-foreground">
                The truck will animate along the route from origin to destination, posting real GPS pings to the
                tracking page every step. Status auto-promotes to <strong>IN_TRANSIT</strong> when the trip starts and
                <strong> OUT_FOR_DELIVERY</strong> when it completes.
              </p>

              <div>
                <Label className="text-xs">Trip speed</Label>
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="range"
                    min="0.5"
                    max="3"
                    step="0.5"
                    value={simulationSpeed}
                    onChange={(e) => setSimulationSpeed(parseFloat(e.target.value))}
                    disabled={simulationRunning}
                    className="flex-1 h-2 rounded cursor-pointer"
                  />
                  <span className="text-xs font-mono w-12 text-right">{simulationSpeed}x</span>
                </div>
              </div>

              {(simulationRunning || simulationProgress > 0) && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">Progress</span>
                    <span className="text-xs font-mono">{simulationProgress.toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded overflow-hidden">
                    <div
                      className="h-full bg-secondary transition-all duration-300"
                      style={{ width: `${simulationProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <Button
                onClick={
                  simulationRunning
                    ? handleStopSimulation
                    : () => handleSimulateTrip(simulatingShipment || undefined)
                }
                className="w-full"
                variant={simulationRunning ? "destructive" : "default"}
              >
                {simulationRunning ? (
                  <>
                    <Square className="h-4 w-4 mr-2" /> Stop Trip
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" /> Start Real Trip
                  </>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPage;
