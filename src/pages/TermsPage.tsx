import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";

const TermsPage = () => (
  <div className="min-h-screen flex flex-col">
    <AppHeader />
    <section className="bg-secondary py-20">
      <div className="container text-center">
        <h1 className="font-display text-5xl md:text-7xl font-black text-secondary-foreground">TERMS OF <span className="text-primary">USE</span></h1>
        <p className="text-secondary-foreground/70 text-sm mt-4">Last updated: March 1, 2024</p>
      </div>
    </section>
    <section className="container py-16">
      <div className="max-w-3xl mx-auto">
        {[
          { title: "1. Acceptance of Terms", content: "By accessing and using TransportHaven's services, you agree to be bound by these Terms of Use. If you do not agree, please discontinue use of our services immediately." },
          { title: "2. Service Description", content: "TransportHaven provides courier and logistics services including package pickup, transportation, delivery, and real-time tracking. Service availability, delivery times, and pricing may vary by location and service tier." },
          { title: "3. Shipping Responsibilities", content: "Senders are responsible for proper packaging, accurate labeling, and compliance with shipping regulations. Prohibited items include hazardous materials, illegal substances, and items restricted by federal/state law." },
          { title: "4. Liability Limitations", content: "TransportHaven's liability is limited to the declared value of the shipment or $100, whichever is less, unless additional insurance is purchased. We are not liable for delays caused by weather, natural disasters, or other force majeure events." },
          { title: "5. Claims and Disputes", content: "Claims for lost or damaged packages must be filed within 30 days of the expected delivery date. Claims can be submitted via our support team at 1-800-TRANS-HV or support@transporthaven.com." },
          { title: "6. Account Terms", content: "Users are responsible for maintaining the confidentiality of their account credentials. TransportHaven reserves the right to suspend or terminate accounts that violate these terms." },
          { title: "7. Modifications", content: "TransportHaven reserves the right to modify these terms at any time. Continued use after modifications constitutes acceptance of the updated terms." },
        ].map((s) => (
          <div key={s.title} className="mb-8">
            <h2 className="font-display text-xl font-bold text-foreground mb-3">{s.title}</h2>
            <p className="text-muted-foreground leading-relaxed">{s.content}</p>
          </div>
        ))}
      </div>
    </section>
    <Footer />
  </div>
);

export default TermsPage;
