import { useState } from "react";
import { Phone, Mail, Clock, MapPin, Send, MessageSquare } from "lucide-react";
import { z } from "zod";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const SUPPORT_PHONE = "+1 (213) 595-7723";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Invalid email").max(255),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  subject: z.string().trim().min(1, "Subject is required").max(120),
  message: z.string().trim().min(5, "Please add a bit more detail").max(2000),
});

const ContactPage = () => {
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = schema.safeParse({
      name: fd.get("name"),
      email: fd.get("email"),
      phone: fd.get("phone"),
      subject: fd.get("subject"),
      message: fd.get("message"),
    });
    if (!parsed.success) {
      toast({ title: "Please check the form", description: parsed.error.issues[0].message, variant: "destructive" });
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      toast({ title: "Message sent", description: "Our support team will reply within 24 hours." });
      e.currentTarget.reset();
    }, 600);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />
      <PageTransition>
        <section className="bg-secondary py-14">
          <div className="container text-center">
            <h1 className="font-display text-4xl md:text-5xl font-black text-secondary-foreground">Contact TransportHaven</h1>
            <p className="text-secondary-foreground/70 mt-3 max-w-2xl mx-auto">
              Talk to a human about a shipment, a quote, or partnership opportunities. Available by phone, text and email.
            </p>
          </div>
        </section>

        <section className="container py-12 grid lg:grid-cols-3 gap-6">
          <Card className="p-6 space-y-3 lg:col-span-1">
            <h2 className="font-display text-xl font-bold">Reach us directly</h2>
            <div className="space-y-3 text-sm">
              <a href={`tel:${SUPPORT_PHONE.replace(/[^+\d]/g, "")}`} className="flex items-start gap-3 group">
                <Phone className="h-4 w-4 text-primary mt-0.5" />
                <div>
                  <div className="font-semibold group-hover:text-primary">{SUPPORT_PHONE}</div>
                  <div className="text-xs text-muted-foreground">Calls & SMS · 24/7 dispatch</div>
                </div>
              </a>
              <a href={`sms:${SUPPORT_PHONE.replace(/[^+\d]/g, "")}`} className="flex items-start gap-3 group">
                <MessageSquare className="h-4 w-4 text-primary mt-0.5" />
                <div>
                  <div className="font-semibold group-hover:text-primary">Text us</div>
                  <div className="text-xs text-muted-foreground">Fastest for tracking questions</div>
                </div>
              </a>
              <a href="mailto:support@transporthaven.com" className="flex items-start gap-3 group">
                <Mail className="h-4 w-4 text-primary mt-0.5" />
                <div>
                  <div className="font-semibold group-hover:text-primary">support@transporthaven.com</div>
                  <div className="text-xs text-muted-foreground">Replies within 4 business hours</div>
                </div>
              </a>
              <div className="flex items-start gap-3">
                <Clock className="h-4 w-4 text-primary mt-0.5" />
                <div>
                  <div className="font-semibold">Mon–Sat · 8AM–8PM EST</div>
                  <div className="text-xs text-muted-foreground">Sunday: emergency dispatch only</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-primary mt-0.5" />
                <div>
                  <div className="font-semibold">Headquarters</div>
                  <div className="text-xs text-muted-foreground">1500 Logistics Way, Dallas, TX 75201</div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 lg:col-span-2">
            <h2 className="font-display text-xl font-bold mb-4">Send a message</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Name *</Label>
                  <Input name="name" required maxLength={100} />
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input name="email" type="email" required maxLength={255} />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input name="phone" type="tel" maxLength={40} />
                </div>
                <div>
                  <Label>Subject *</Label>
                  <Input name="subject" required maxLength={120} />
                </div>
              </div>
              <div>
                <Label>Message *</Label>
                <Textarea name="message" required rows={6} maxLength={2000} />
              </div>
              <Button type="submit" disabled={submitting} className="bg-primary text-primary-foreground font-display font-bold">
                <Send className="h-4 w-4 mr-2" /> {submitting ? "Sending..." : "Send message"}
              </Button>
            </form>
          </Card>
        </section>
      </PageTransition>
      <Footer />
    </div>
  );
};

export default ContactPage;
