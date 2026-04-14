import { Link } from "react-router-dom";
import { Package, Phone, Mail, Clock } from "lucide-react";

const Footer = () => (
  <footer className="bg-foreground text-background/60">
    <div className="container py-12">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Package className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-black text-background">
              SWIFT<span className="text-primary">TRACK</span>
            </span>
          </div>
          <p className="text-sm leading-relaxed">Delivering certainty, not just packages. Real-time logistics for the modern world.</p>
        </div>
        <div>
          <h4 className="font-display font-bold text-background mb-3 text-sm uppercase tracking-wider">Ship</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/track" className="hover:text-background transition-colors">Track Package</Link></li>
            <li><Link to="/quote" className="hover:text-background transition-colors">Get a Quote</Link></li>
            <li><Link to="/schedule-pickup" className="hover:text-background transition-colors">Schedule Pickup</Link></li>
            <li><Link to="/services-guide" className="hover:text-background transition-colors">Service Guide</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-display font-bold text-background mb-3 text-sm uppercase tracking-wider">Company</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/about" className="hover:text-background transition-colors">About Us</Link></li>
            <li><Link to="/careers" className="hover:text-background transition-colors">Careers</Link></li>
            <li><Link to="/press" className="hover:text-background transition-colors">Press</Link></li>
            <li><Link to="/sustainability" className="hover:text-background transition-colors">Sustainability</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-display font-bold text-background mb-3 text-sm uppercase tracking-wider">Support</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/faq" className="hover:text-background transition-colors">FAQ</Link></li>
            <li><Link to="/reviews" className="hover:text-background transition-colors">Reviews</Link></li>
            <li className="flex items-center gap-2"><Phone className="h-3 w-3" /> 1-800-SWIFT-TK</li>
            <li className="flex items-center gap-2"><Mail className="h-3 w-3" /> support@swifttrack.com</li>
            <li className="flex items-center gap-2"><Clock className="h-3 w-3" /> Mon-Sat 8AM-8PM</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-background/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <span className="font-mono text-xs">© 2024 SwiftTrack Logistics. All rights reserved.</span>
        <div className="flex gap-4 text-xs">
          <Link to="/privacy" className="hover:text-background transition-colors">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-background transition-colors">Terms of Service</Link>
          <Link to="/cookies" className="hover:text-background transition-colors">Cookie Policy</Link>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
