import { useState } from "react";
import { Package, Truck, MapPin, CheckCircle, AlertTriangle, Search, Download, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AppHeader from "@/components/AppHeader";
import { mockShipments, mockDrivers } from "@/lib/mockData";
import { STATUS_LABELS, ShipmentStatus } from "@/lib/types";

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

const stats = [
  { label: "Total Shipments", value: mockShipments.length, icon: Package, color: "text-secondary" },
  { label: "In Transit", value: mockShipments.filter((s) => s.status === "IN_TRANSIT").length, icon: Truck, color: "text-secondary" },
  { label: "Out for Delivery", value: mockShipments.filter((s) => s.status === "OUT_FOR_DELIVERY").length, icon: MapPin, color: "text-warning" },
  { label: "Delivered Today", value: mockShipments.filter((s) => s.status === "DELIVERED").length, icon: CheckCircle, color: "text-success" },
  { label: "Exceptions", value: mockShipments.filter((s) => s.status === "EXCEPTION").length, icon: AlertTriangle, color: "text-destructive" },
];

const AdminPage = () => {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = mockShipments.filter((s) => {
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    if (searchQuery && !s.trackingId.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />
      <div className="container py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-3xl font-bold">Dashboard</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="font-mono text-xs gap-1.5">
              <Download className="h-3.5 w-3.5" /> Export CSV
            </Button>
            <Button size="sm" className="bg-primary text-primary-foreground font-mono text-xs gap-1.5">
              <Plus className="h-3.5 w-3.5" /> New Shipment
            </Button>
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
