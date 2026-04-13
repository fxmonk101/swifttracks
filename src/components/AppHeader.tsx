import { Link, useLocation } from "react-router-dom";
import { Package, Search, MapPin, Phone, Clock, Menu, X } from "lucide-react";
import { useState } from "react";

const AppHeader = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { to: "/", label: "Home" },
    { to: "/track", label: "Track", icon: Search },
    { to: "/services", label: "Services" },
    { to: "/support", label: "Support" },
  ];

  return (
    <>
      {/* Top utility bar */}
      <div className="bg-secondary text-secondary-foreground/80 text-xs">
        <div className="container flex items-center justify-between h-8">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> 1-800-SWIFT-TK</span>
            <span className="hidden sm:flex items-center gap-1"><Clock className="h-3 w-3" /> Mon-Sat 8AM-8PM EST</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/track" className="hover:text-secondary-foreground transition-colors">Track a Package</Link>
            <span className="hidden sm:inline">Help & Support</span>
          </div>
        </div>
      </div>

      {/* Main header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="container flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
              <Package className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-2xl font-black tracking-wide text-foreground">
              SWIFT<span className="text-primary">TRACK</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
                  location.pathname === to
                    ? "text-primary bg-primary/5"
                    : "text-foreground/70 hover:text-foreground hover:bg-muted"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/track"
              className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-md font-display font-bold text-sm tracking-wide hover:bg-primary/90 transition-colors"
            >
              <Search className="h-4 w-4" />
              TRACK NOW
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-foreground"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border bg-card">
            <div className="container py-4 space-y-2">
              {navItems.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-4 py-2.5 rounded-md text-sm font-semibold transition-colors ${
                    location.pathname === to
                      ? "text-primary bg-primary/5"
                      : "text-foreground/70 hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {label}
                </Link>
              ))}
              <Link
                to="/track"
                onClick={() => setMobileOpen(false)}
                className="block text-center bg-primary text-primary-foreground px-5 py-2.5 rounded-md font-display font-bold text-sm tracking-wide mt-3"
              >
                TRACK NOW
              </Link>
            </div>
          </div>
        )}
      </header>
    </>
  );
};

export default AppHeader;
