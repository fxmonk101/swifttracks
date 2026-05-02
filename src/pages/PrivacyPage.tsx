import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";

const PrivacyPage = () => (
  <div className="min-h-screen flex flex-col">
    <AppHeader />
    <section className="bg-secondary py-20">
      <div className="container text-center">
        <h1 className="font-display text-5xl md:text-7xl font-black text-secondary-foreground">PRIVACY <span className="text-primary">POLICY</span></h1>
        <p className="text-secondary-foreground/70 text-sm mt-4">Last updated: March 1, 2024</p>
      </div>
    </section>
    <section className="container py-16">
      <div className="max-w-3xl mx-auto prose prose-sm">
        {[
          { title: "1. Information We Collect", content: "We collect information you provide directly (name, address, email, phone number) when you create shipments, track packages, or contact support. We also collect usage data including IP addresses, browser type, device information, and pages visited. GPS location data is collected from drivers using our Driver Module during active duty." },
          { title: "2. How We Use Your Information", content: "We use your information to process and deliver shipments, provide real-time tracking updates, send delivery notifications via email and SMS, improve our services, and communicate with you about your account. We never sell your personal information to third parties." },
          { title: "3. Data Sharing", content: "We share information with delivery drivers (limited to what's needed for delivery), payment processors, notification service providers (email and SMS), and law enforcement when legally required. All third-party providers are bound by strict data protection agreements." },
          { title: "4. Data Security", content: "We implement industry-standard security measures including encryption in transit (TLS 1.3), encrypted storage, access controls, and regular security audits. Customer tracking pages display city/state only — never raw email addresses or driver IDs." },
          { title: "5. Data Retention", content: "Shipment records are retained for 7 years for business and legal purposes. GPS location history is automatically deleted after 30 days. Account data is deleted within 30 days of account closure upon request." },
          { title: "6. Your Rights", content: "You have the right to access, correct, or delete your personal data. You can opt out of marketing communications at any time. California residents have additional rights under CCPA. Contact privacy@transporthaven.com for any data requests." },
          { title: "7. Contact Us", content: "For privacy questions or concerns, email privacy@transporthaven.com or call 1-800-TRANS-HV. Our Data Protection Officer can be reached at dpo@transporthaven.com." },
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

export default PrivacyPage;
