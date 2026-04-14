import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  { q: "How do I track my package?", a: "Enter your tracking ID (format: ST-YYYY-XXXXXXXX) on our Track page. You'll see real-time GPS location, delivery timeline, and estimated delivery window." },
  { q: "What are your delivery timeframes?", a: "Express Overnight: Next business day by 10:30 AM. Standard Ground: 3-5 business days. Economy Saver: 5-7 business days." },
  { q: "How much does shipping cost?", a: "Prices start at $5.99 for Economy Saver, $9.99 for Standard Ground, and $24.99 for Express Overnight. Final pricing depends on weight, dimensions, and destination." },
  { q: "Can I schedule a pickup?", a: "Yes! Visit our Schedule Pickup page to arrange a convenient time for us to collect your packages from your location." },
  { q: "What is the maximum package weight?", a: "Express and Standard services accept packages up to 150 lbs. Economy Saver accepts up to 70 lbs. For heavier items, contact us for special handling." },
  { q: "Do you offer signature confirmation?", a: "Yes, signature confirmation is available on all service tiers. It's included free with Express Overnight and available as an add-on for other services." },
  { q: "What happens if my package is delayed?", a: "We'll notify you immediately via email and SMS if there's any delay. Express Overnight shipments come with a money-back guarantee if not delivered on time." },
  { q: "How do I file a claim for a damaged package?", a: "Contact our support team at 1-800-SWIFT-TK or email support@swifttrack.com with your tracking ID and photos of the damage. Claims are typically resolved within 5 business days." },
  { q: "Do you deliver on weekends?", a: "Saturday delivery is available for Express Overnight and Standard Ground shipments. Sunday delivery is not currently available." },
  { q: "Can I change the delivery address after shipping?", a: "Yes, you can redirect a package to a different address before it's out for delivery. Log in to your account or contact support with your tracking ID." },
];

const FAQPage = () => (
  <div className="min-h-screen flex flex-col">
    <AppHeader />
    <section className="bg-secondary py-20">
      <div className="container text-center">
        <h1 className="font-display text-5xl md:text-7xl font-black text-secondary-foreground">FREQUENTLY ASKED <span className="text-primary">QUESTIONS</span></h1>
      </div>
    </section>

    <section className="container py-16">
      <div className="max-w-3xl mx-auto">
        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="bg-card border border-border rounded-lg px-6">
              <AccordionTrigger className="font-display font-bold text-foreground text-left">{faq.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
    <Footer />
  </div>
);

export default FAQPage;
