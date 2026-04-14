import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Calculator, Zap, Truck, Globe } from "lucide-react";

const QuotePage = () => {
  const { toast } = useToast();
  const [form, setForm] = useState({ fromZip: "", toZip: "", weight: "", length: "", width: "", height: "" });
  const [quote, setQuote] = useState<null | { express: string; standard: string; economy: string }>(null);
  const update = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(form.weight) || 1;
    setQuote({
      express: `$${(24.99 + w * 0.45).toFixed(2)}`,
      standard: `$${(9.99 + w * 0.25).toFixed(2)}`,
      economy: `$${(5.99 + w * 0.15).toFixed(2)}`,
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <section className="bg-secondary py-20">
        <div className="container text-center">
          <h1 className="font-display text-5xl md:text-7xl font-black text-secondary-foreground">GET A <span className="text-primary">QUOTE</span></h1>
          <p className="text-secondary-foreground/70 text-lg mt-4 max-w-2xl mx-auto">Calculate shipping costs instantly.</p>
        </div>
      </section>

      <section className="container py-16">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-2xl font-black flex items-center gap-2"><Calculator className="h-6 w-6 text-primary" /> Shipping Calculator</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">From ZIP</label>
                    <Input value={form.fromZip} onChange={(e) => update("fromZip", e.target.value)} placeholder="10001" required />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">To ZIP</label>
                    <Input value={form.toZip} onChange={(e) => update("toZip", e.target.value)} placeholder="90210" required />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Weight (lbs)</label>
                  <Input type="number" min="0.1" step="0.1" value={form.weight} onChange={(e) => update("weight", e.target.value)} placeholder="5" required />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Length (in)</label>
                    <Input type="number" value={form.length} onChange={(e) => update("length", e.target.value)} placeholder="12" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Width (in)</label>
                    <Input type="number" value={form.width} onChange={(e) => update("width", e.target.value)} placeholder="8" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Height (in)</label>
                    <Input type="number" value={form.height} onChange={(e) => update("height", e.target.value)} placeholder="6" />
                  </div>
                </div>
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold tracking-wide py-6 text-base">
                  CALCULATE RATES
                </Button>
              </form>
            </CardContent>
          </Card>

          {quote && (
            <div className="grid md:grid-cols-3 gap-4 mt-8 animate-fade-in">
              {[
                { icon: Zap, title: "Express Overnight", price: quote.express, delivery: "Next day by 10:30 AM", color: "border-t-primary" },
                { icon: Truck, title: "Standard Ground", price: quote.standard, delivery: "3-5 business days", color: "border-t-secondary" },
                { icon: Globe, title: "Economy Saver", price: quote.economy, delivery: "5-7 business days", color: "border-t-accent" },
              ].map((q) => (
                <Card key={q.title} className={`border-t-4 ${q.color} hover:shadow-lg transition-all`}>
                  <CardContent className="p-6 text-center">
                    <q.icon className="h-8 w-8 text-primary mx-auto mb-2" />
                    <h3 className="font-display font-bold text-foreground mb-1">{q.title}</h3>
                    <p className="font-display text-3xl font-black text-primary mb-1">{q.price}</p>
                    <p className="text-xs text-muted-foreground">{q.delivery}</p>
                    <Button className="mt-4 w-full bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold text-sm">SELECT</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default QuotePage;
