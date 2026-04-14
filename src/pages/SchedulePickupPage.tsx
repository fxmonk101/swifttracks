import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Package, MapPin, Calendar, Clock } from "lucide-react";

const SchedulePickupPage = () => {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", address: "", city: "", state: "", zip: "", date: "", time: "", packages: "1", notes: "" });
  const update = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: "Pickup Scheduled!", description: `We'll pick up ${form.packages} package(s) on ${form.date} at ${form.time}.` });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <section className="bg-secondary py-20">
        <div className="container text-center">
          <h1 className="font-display text-5xl md:text-7xl font-black text-secondary-foreground">SCHEDULE <span className="text-primary">PICKUP</span></h1>
          <p className="text-secondary-foreground/70 text-lg mt-4 max-w-2xl mx-auto">We'll come to you. Schedule a convenient pickup time.</p>
        </div>
      </section>

      <section className="container py-16">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-2xl font-black">Pickup Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Full Name</label>
                  <Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="John Doe" required />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Pickup Address</label>
                  <Input value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="123 Main Street" required />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">City</label>
                    <Input value={form.city} onChange={(e) => update("city", e.target.value)} placeholder="New York" required />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">State</label>
                    <Input value={form.state} onChange={(e) => update("state", e.target.value)} placeholder="NY" required />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">ZIP Code</label>
                    <Input value={form.zip} onChange={(e) => update("zip", e.target.value)} placeholder="10001" required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Pickup Date</label>
                    <Input type="date" value={form.date} onChange={(e) => update("date", e.target.value)} required />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Preferred Time</label>
                    <Input type="time" value={form.time} onChange={(e) => update("time", e.target.value)} required />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Number of Packages</label>
                  <Input type="number" min="1" value={form.packages} onChange={(e) => update("packages", e.target.value)} required />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Special Instructions</label>
                  <Input value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Gate code, building entrance, etc." />
                </div>
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold tracking-wide py-6 text-base">
                  SCHEDULE PICKUP
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default SchedulePickupPage;
