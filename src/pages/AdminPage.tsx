import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Package, Truck, MapPin, CheckCircle, AlertTriangle, Search, Plus, Eye, Edit2, Loader2, Navigation } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import AppHeader from "@/components/AppHeader";
import { STATUS_LABELS, ShipmentStatus } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

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
};

function generateTrackingId() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return `ST-${new Date().getFullYear()}-${code}`;
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
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [gpsShipment, setGpsShipment] = useState<DBShipment | null>(null);
  const [gpsLat, setGpsLat] = useState("");
  const [gpsLng, setGpsLng] = useState("");
  const [updatingGps, setUpdatingGps] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  const fetchShipments = async () => {
    const { data, error } = await supabase
      .from("shipments")
      .select("id, tracking_id, service_type, status, sender_name, sender_city, sender_state, receiver_name, receiver_city, receiver_state, weight, estimated_delivery_date, assigned_driver, created_at")
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
    // Realtime: refresh table when any shipment changes
    const channel = supabase
      .channel("admin-shipments")
      .on("postgres_changes", { event: "*", schema: "public", table: "shipments" }, () => fetchShipments())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

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
    });
    if (error) {
      toast({ title: "Error updating GPS", description: error.message, variant: "destructive" });
    } else if (data && !(data as any).success) {
      toast({ title: "Not authorized", description: (data as any).error, variant: "destructive" });
    } else {
      toast({ title: "GPS Updated", description: `Truck moved to ${lat.toFixed(4)}, ${lng.toFixed(4)}` });
      setGpsShipment(null);
      setGpsLat("");
      setGpsLng("");
      fetchShipments();
    }
    setUpdatingGps(false);
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

    const { data, error } = await supabase.from("shipments").insert({
      tracking_id: trackingId,
      service_type: form.get("serviceType") as string || "STANDARD",
      sender_name: form.get("senderName") as string,
      sender_city: form.get("senderCity") as string,
      sender_state: form.get("senderState") as string,
      sender_street: form.get("senderStreet") as string,
      receiver_name: form.get("receiverName") as string,
      receiver_city: form.get("receiverCity") as string,
      receiver_state: form.get("receiverState") as string,
      receiver_street: form.get("receiverStreet") as string,
      weight: parseFloat(form.get("weight") as string) || 0,
      requires_signature: form.get("signature") === "on",
      estimated_delivery_date: form.get("estDelivery") as string || null,
      created_by: user.id,
    }).select().single();

    if (error) {
      toast({ title: "Error creating shipment", description: error.message, variant: "destructive" });
    } else {
      // Also create the initial LABEL_CREATED event
      if (data) {
        await supabase.from("shipment_events").insert({
          shipment_id: data.id,
          status: "LABEL_CREATED",
          description: "Shipping label created",
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
    } else if (data && !(data as any).success) {
      toast({ title: "Error", description: (data as any).error || "Failed to update", variant: "destructive" });
    } else {
      toast({ title: "Status Updated", description: `${editingShipment.tracking_id} → ${STATUS_LABELS[newStatus as ShipmentStatus] || newStatus}` });
      setEditingShipment(null);
      setNewStatus("");
      setStatusDescription("");
      setStatusLocation("");
      fetchShipments();
    }
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
            <Button onClick={() => navigate("/auth")} className="bg-primary text-primary-foreground">Sign In</Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />
      <div className="container py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage shipments, drivers, and fleet operations</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-primary text-primary-foreground font-mono text-xs gap-1.5">
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
                    <div><Label className="text-xs">Name *</Label><Input name="senderName" required className="text-sm" /></div>
                    <div><Label className="text-xs">Street</Label><Input name="senderStreet" className="text-sm" /></div>
                    <div><Label className="text-xs">City *</Label><Input name="senderCity" required className="text-sm" /></div>
                    <div><Label className="text-xs">State *</Label><Input name="senderState" required className="text-sm" /></div>
                  </div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Receiver</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label className="text-xs">Name *</Label><Input name="receiverName" required className="text-sm" /></div>
                    <div><Label className="text-xs">Street</Label><Input name="receiverStreet" className="text-sm" /></div>
                    <div><Label className="text-xs">City *</Label><Input name="receiverCity" required className="text-sm" /></div>
                    <div><Label className="text-xs">State *</Label><Input name="receiverState" required className="text-sm" /></div>
                  </div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Package</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Service Type</Label>
                      <Select name="serviceType" defaultValue="EXPRESS">
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EXPRESS">Express</SelectItem>
                          <SelectItem value="STANDARD">Standard</SelectItem>
                          <SelectItem value="OVERNIGHT">Overnight</SelectItem>
                          <SelectItem value="ECONOMY">Economy</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label className="text-xs">Weight (kg)</Label><Input name="weight" type="number" step="0.1" defaultValue="1" className="text-sm" /></div>
                    <div><Label className="text-xs">Est. Delivery</Label><Input name="estDelivery" type="date" className="text-sm" /></div>
                    <div className="flex items-end gap-2 pb-1">
                      <input type="checkbox" name="signature" id="signature" className="rounded" />
                      <Label htmlFor="signature" className="text-xs">Requires Signature</Label>
                    </div>
                  </div>
                  <Button type="submit" disabled={creating} className="w-full bg-primary text-primary-foreground">
                    {creating ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Creating...</> : "Create Shipment"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
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

        {/* Filters */}
        <div className="flex gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search tracking ID..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 font-mono text-sm" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="All statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
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
                      <td className="p-3 hidden lg:table-cell text-xs">{s.sender_city}, {s.sender_state}</td>
                      <td className="p-3 hidden lg:table-cell text-xs">{s.receiver_city}, {s.receiver_state}</td>
                      <td className="p-3 flex gap-1">
                        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => navigate(`/track/${s.tracking_id}`)}>
                          <Eye className="h-3 w-3" /> Track
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => { setEditingShipment(s); setNewStatus(s.status); }}>
                          <Edit2 className="h-3 w-3" /> Status
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

      {/* Status update dialog */}
      <Dialog open={!!editingShipment} onOpenChange={(open) => { if (!open) setEditingShipment(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">Update Shipment Status</DialogTitle>
          </DialogHeader>
          {editingShipment && (
            <div className="space-y-4">
              <p className="font-mono text-sm font-bold">{editingShipment.tracking_id}</p>
              <p className="text-xs text-muted-foreground">Current: <Badge className={`${statusClass[editingShipment.status]} text-xs ml-1`}>{STATUS_LABELS[editingShipment.status as ShipmentStatus] || editingShipment.status}</Badge></p>
              <div>
                <Label className="text-xs">New Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Description</Label>
                <Input value={statusDescription} onChange={(e) => setStatusDescription(e.target.value)} placeholder="e.g. Package arrived at sorting facility" className="text-sm" />
              </div>
              <div>
                <Label className="text-xs">Location</Label>
                <Input value={statusLocation} onChange={(e) => setStatusLocation(e.target.value)} placeholder="e.g. New York, NY" className="text-sm" />
              </div>
              <Button onClick={handleUpdateStatus} disabled={updatingStatus} className="w-full bg-primary text-primary-foreground">
                {updatingStatus ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Updating...</> : "Update Status"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPage;
