import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";

const CookiesPage = () => (
  <div className="min-h-screen flex flex-col">
    <AppHeader />
    <section className="bg-secondary py-20">
      <div className="container text-center">
        <h1 className="font-display text-5xl md:text-7xl font-black text-secondary-foreground">COOKIE <span className="text-primary">POLICY</span></h1>
        <p className="text-secondary-foreground/70 text-sm mt-4">Last updated: March 1, 2024</p>
      </div>
    </section>
    <section className="container py-16">
      <div className="max-w-3xl mx-auto">
        {[
          { title: "What Are Cookies?", content: "Cookies are small text files stored on your device when you visit our website. They help us provide a better experience by remembering your preferences and understanding how you use our services." },
          { title: "Essential Cookies", content: "These cookies are necessary for the website to function properly. They enable core features like security, session management, and tracking page functionality. You cannot opt out of essential cookies." },
          { title: "Analytics Cookies", content: "We use analytics cookies to understand how visitors interact with our website. This helps us improve our services and user experience. Data collected is aggregated and anonymized." },
          { title: "Functional Cookies", content: "These cookies remember your preferences such as language, region, and display settings. They enhance your experience but are not essential for the site to work." },
          { title: "Marketing Cookies", content: "We may use marketing cookies to deliver relevant advertisements and measure campaign effectiveness. You can opt out of marketing cookies through your browser settings." },
          { title: "Managing Cookies", content: "You can control cookies through your browser settings. Most browsers allow you to block or delete cookies. Note that blocking essential cookies may affect website functionality." },
          { title: "Contact", content: "For questions about our cookie policy, contact us at privacy@transporthaven.com or call +1 (213) 595-7723 (call or text)." },
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

export default CookiesPage;
