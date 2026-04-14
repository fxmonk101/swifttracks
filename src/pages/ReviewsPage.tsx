import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { useState } from "react";
import { Star, MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const existingReviews = [
  { name: "Sarah M.", role: "E-commerce Owner", stars: 5, text: "SwiftTrack's real-time GPS tracking is a game-changer. I can see exactly where my packages are at any moment.", date: "Mar 10, 2024" },
  { name: "James K.", role: "Operations Manager", stars: 5, text: "The delivery notifications are spot-on. Estimated delivery times are incredibly accurate.", date: "Feb 28, 2024" },
  { name: "Lisa W.", role: "Retail Director", stars: 5, text: "Photo proof of delivery gives us peace of mind. We've reduced delivery disputes by 95%.", date: "Feb 15, 2024" },
  { name: "Mike R.", role: "Small Business Owner", stars: 4, text: "Great service overall. The Express Overnight is worth every penny for urgent shipments.", date: "Jan 22, 2024" },
  { name: "Amanda P.", role: "Online Seller", stars: 5, text: "Switched from our previous carrier and haven't looked back. Customer support is excellent.", date: "Jan 10, 2024" },
  { name: "David T.", role: "Warehouse Manager", stars: 4, text: "Reliable and consistent. The schedule pickup feature saves us so much time.", date: "Dec 18, 2023" },
];

const ReviewsPage = () => {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [form, setForm] = useState({ name: "", role: "", text: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) { toast({ title: "Please select a rating", variant: "destructive" }); return; }
    toast({ title: "Review Submitted!", description: "Thank you for your feedback!" });
    setShowForm(false);
    setForm({ name: "", role: "", text: "" });
    setRating(0);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <section className="bg-secondary py-20">
        <div className="container text-center">
          <h1 className="font-display text-5xl md:text-7xl font-black text-secondary-foreground">CUSTOMER <span className="text-primary">REVIEWS</span></h1>
          <p className="text-secondary-foreground/70 text-lg mt-4 max-w-2xl mx-auto">See what our customers are saying about SwiftTrack.</p>
          <Button onClick={() => setShowForm(!showForm)} className="mt-6 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold tracking-wide">
            <MessageSquare className="mr-2 h-4 w-4" /> {showForm ? "CLOSE FORM" : "WRITE A REVIEW"}
          </Button>
        </div>
      </section>

      {showForm && (
        <section className="container py-8">
          <Card className="max-w-2xl mx-auto border-primary/20 shadow-lg animate-fade-in">
            <CardContent className="p-6">
              <h3 className="font-display text-xl font-bold text-foreground mb-4">Share Your Experience</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Your Rating</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button key={s} type="button" onClick={() => setRating(s)} onMouseEnter={() => setHovered(s)} onMouseLeave={() => setHovered(0)}>
                        <Star className={`h-8 w-8 transition-colors ${s <= (hovered || rating) ? "fill-accent text-accent" : "text-muted-foreground/30"}`} />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Your Name</label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="John D." required />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Your Role</label>
                    <Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="Business Owner" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Your Review</label>
                  <textarea value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} placeholder="Tell us about your experience..." required
                    className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                </div>
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold tracking-wide">SUBMIT REVIEW</Button>
              </form>
            </CardContent>
          </Card>
        </section>
      )}

      <section className="container py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {existingReviews.map((r) => (
            <Card key={r.name} className="hover:shadow-lg transition-all">
              <CardContent className="p-6">
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: r.stars }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                  ))}
                  {Array.from({ length: 5 - r.stars }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-muted-foreground/30" />
                  ))}
                </div>
                <p className="text-foreground/80 text-sm leading-relaxed mb-4">"{r.text}"</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm text-foreground">{r.name}</p>
                    <p className="text-xs text-muted-foreground">{r.role}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{r.date}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default ReviewsPage;
