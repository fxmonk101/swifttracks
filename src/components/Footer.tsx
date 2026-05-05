import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Phone, Mail, Clock } from "lucide-react";
import logoImg from "@/assets/logo.png";

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-foreground text-background/60">
      <div className="container py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <Link to="/" className="inline-flex items-center gap-2 mb-4 bg-background/95 px-3 py-2 rounded-md">
              <img src={logoImg} alt="TransportHaven" className="h-9 w-auto object-contain" />
            </Link>
            <p className="text-sm leading-relaxed">{t("footer.tagline")}</p>
          </div>
          <div>
            <h4 className="font-display font-bold text-background mb-3 text-sm uppercase tracking-wider">{t("footer.ship")}</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/track" className="hover:text-background transition-colors">{t("footer.trackPackage")}</Link></li>
              <li><Link to="/quote" className="hover:text-background transition-colors">{t("footer.getQuote")}</Link></li>
              <li><Link to="/schedule-pickup" className="hover:text-background transition-colors">{t("footer.schedulePickup")}</Link></li>
              <li><Link to="/create-shipment" className="hover:text-background transition-colors">Create Shipment</Link></li>
              <li><Link to="/international" className="hover:text-background transition-colors">International</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-bold text-background mb-3 text-sm uppercase tracking-wider">{t("footer.company")}</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about" className="hover:text-background transition-colors">{t("footer.aboutUs")}</Link></li>
              <li><Link to="/careers" className="hover:text-background transition-colors">{t("footer.careers")}</Link></li>
              <li><Link to="/press" className="hover:text-background transition-colors">{t("footer.press")}</Link></li>
              <li><Link to="/sustainability" className="hover:text-background transition-colors">{t("footer.sustainability")}</Link></li>
              <li><Link to="/business" className="hover:text-background transition-colors">Business Solutions</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-bold text-background mb-3 text-sm uppercase tracking-wider">{t("footer.support")}</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/contact" className="hover:text-background transition-colors">Contact Us</Link></li>
              <li><Link to="/faq" className="hover:text-background transition-colors">{t("footer.faq")}</Link></li>
              <li><Link to="/reviews" className="hover:text-background transition-colors">{t("footer.reviews")}</Link></li>
              <li><a href="tel:+12135957723" className="flex items-center gap-2 hover:text-background"><Phone className="h-3 w-3" /> +1 (213) 595-7723</a></li>
              <li className="flex items-center gap-2"><Mail className="h-3 w-3" /> support@transporthaven.com</li>
              <li className="flex items-center gap-2"><Clock className="h-3 w-3" /> Mon-Sat 8AM-8PM</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-background/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="font-mono text-xs">© 2026 TransportHaven Logistics. {t("footer.rights")}</span>
          <div className="flex gap-4 text-xs">
            <Link to="/privacy" className="hover:text-background transition-colors">{t("footer.privacy")}</Link>
            <Link to="/terms" className="hover:text-background transition-colors">{t("footer.terms")}</Link>
            <Link to="/cookies" className="hover:text-background transition-colors">{t("footer.cookies")}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
