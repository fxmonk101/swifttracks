import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Package, Truck, MapPin, CheckCircle, AlertTriangle, Search, Download, Plus, Eye, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import AppHeader from "@/components/AppHeader";
import { mockShipments, mockDrivers } from "@/lib/mockData";
import { STATUS_LABELS, ShipmentStatus } from "@/lib/types";
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

const stats = [
  { label: "Total Shipments", value: mockShipments.length, icon: Package, color: "text-secondary" },
  { label: "In Transit", value: mockShipments.filter((s) => s.status === "IN_TRANSIT").length, icon: Truck, color: "text-secondary" },
  { label: "Out for Delivery", value: mockShipments.filter((s) => s.status === "OUT_FOR_DELIVERY").length, icon: MapPin, color: "text-warning" },
  { label: "Delivered Today", value: mockShipments.filter((s) => s.status === "DELIVERED").length, icon: CheckCircle, color: "text-success" },
  { label: "Exceptions", value: mockShipments.filter((s) => s.status === "EXCEPTION").length, icon: AlertTriangle, color: "text-destructive" },
];

const AdminPage = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const filtered = mockShipments.filter((s) => {
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    if (searchQuery && !s.trackingId.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleCreateShipment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const trackingId = `ST-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    toast({
      title: "Shipment Created!",
      description: `Tracking ID: ${trackingId}. Use this ID on the tracking page to test.`,
    });
    setShowCreateDialog(false);
  };

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
            <Button variant="outline" size="sm" className="font-mono text-xs gap-1.5">
              <Download className="h-3.5 w-3.5" /> Export CSV
            </Button>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-primary text-primary-foreground font-mono text-xs gap-1.5">
                  <Plus className="h-3.5 w-3.5" /> New Shipment
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle className="font-display">Create Test Shipment</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateShipment} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Sender Name</Label>
                      <Input name="senderName" defaultValue="TechCorp Inc" className="text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs">Sender City</Label>
                      <Input name="senderCity" defaultValue="New York" className="text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs">Receiver Name</Label>
                      <Input name="receiverName" defaultValue="Jane Smith" className="text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs">Receiver City</Label>
                      <Input name="receiverCity" defaultValue="Washington" className="text-sm" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Service Type</Label>
                      <Select defaultValue="EXPRESS">
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EXPRESS">Express</SelectItem>
                          <SelectItem value="STANDARD">Standard</SelectItem>
                          <SelectItem value="OVERNIGHT">Overnight</SelectItem>
                          <SelectItem value="ECONOMY">Economy</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Weight (kg)</Label>
                      <Input name="weight" type="number" defaultValue="2.5" className="text-sm" />
                    </div>
                  </div>
                  <Button type="submit" className="w-full bg-primary text-primary-foreground">
                    Create Shipment & Get Tracking ID
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
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-semibold text-xs text-muted-foreground uppercase tracking-wider">Tracking ID</th>
                  <th className="text-left p-3 font-semibold text-xs text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="text-left p-3 font-semibold text-xs text-muted-foreground uppercase tracking-wider hidden md:table-cell">Service</th>
                  <th className="text-left p-3 font-semibold text-xs text-muted-foreground uppercase tracking-wider hidden lg:table-cell">From</th>
                  <th className="text-left p-3 font-semibold text-xs text-muted-foreground uppercase tracking-wider hidden lg:table-cell">To</th>
                  <th className="text-left p-3 font-semibold text-xs text-muted-foreground uppercase tracking-wider hidden md:table-cell">Driver</th>
                  <th className="text-left p-3 font-semibold text-xs text-muted-foreground uppercase tracking-wider">Est. Delivery</th>
                  <th className="text-left p-3 font-semibold text-xs text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  const driver = mockDrivers.find((d) => d.id === s.assignedDriver);
                  return (
                    <tr key={s.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-3 font-mono text-xs font-medium">{s.trackingId}</td>
                      <td className="p-3">
                        <Badge className={`${statusClass[s.status]} text-xs font-mono`}>{STATUS_LABELS[s.status]}</Badge>
                      </td>
                      <td className="p-3 hidden md:table-cell text-xs">{s.serviceType}</td>
                      <td className="p-3 hidden lg:table-cell text-xs">{s.sender.city}, {s.sender.state}</td>
                      <td className="p-3 hidden lg:table-cell text-xs">{s.receiver.city}, {s.receiver.state}</td>
                      <td className="p-3 hidden md:table-cell text-xs">{driver?.name || "—"}</td>
                      <td className="p-3 text-xs font-mono">{new Date(s.estimatedDeliveryDate).toLocaleDateString()}</td>
                      <td className="p-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={() => navigate(`/track/${s.trackingId}`)}
                        >
                          <Eye className="h-3 w-3" /> Track
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Active Drivers */}
        <div>
          <h2 className="font-display text-xl font-bold mb-3">Active Fleet</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {mockDrivers.map((d) => (
              <Card key={d.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm">{d.name}</h3>
                    <Badge variant={d.onDuty ? "default" : "secondary"} className={`text-xs ${d.onDuty ? "bg-success text-success-foreground" : ""}`}>
                      {d.onDuty ? "On Duty" : "Off Duty"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">{d.activeShipments.length} active shipment{d.activeShipments.length !== 1 ? "s" : ""}</p>
                  {d.speed !== undefined && d.onDuty && (
                    <p className="text-xs text-muted-foreground mt-1">{d.speed} km/h · Accuracy: {d.accuracy}m</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
