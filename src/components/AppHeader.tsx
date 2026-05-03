import { Link, useLocation } from "react-router-dom";
import { Search, Menu, X, Phone, Clock, Star, User, LogOut } from "lucide-react";
import logoImg from "@/assets/logo.png";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ThemeToggle from "@/components/ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const AppHeader = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useTranslation();
  const { user, signOut } = useAuth();

  const navItems = [
    { to: "/", label: t("nav.home") },
    { to: "/services", label: t("nav.services") },
    { to: "/international", label: "International" },
    { to: "/business", label: "Business" },
    { to: "/support", label: t("nav.support") },
    { to: "/contact", label: "Contact" },
  ];

  return (
    <>
      <div className="bg-secondary text-secondary-foreground/80 text-xs">
        <div className="container flex items-center justify-between h-8">
          <div className="flex items-center gap-4">
            <a href="tel:+12132469750" className="flex items-center gap-1 hover:text-secondary-foreground transition-colors"><Phone className="h-3 w-3" /> +1 (213) 246-9750</a>
            <span className="hidden sm:flex items-center gap-1"><Clock className="h-3 w-3" /> Mon-Sat 8AM-8PM EST</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/track" className="hover:text-secondary-foreground transition-colors">{t("topBar.trackPackage")}</Link>
            <Link to="/reviews" className="hidden sm:inline hover:text-secondary-foreground transition-colors">
              <span className="flex items-center gap-1"><Star className="h-3 w-3" /> {t("nav.reviews")}</span>
            </Link>
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="container flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoImg} alt="TransportHaven" className="h-10 w-auto object-contain" />
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`px-3 py-2 rounded-md text-sm font-semibold transition-colors ${
                  location.pathname === to
                    ? "text-primary bg-primary/5"
                    : "text-foreground/70 hover:text-foreground hover:bg-muted"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-2">
            <ThemeToggle />
            <Link
              to="/quote"
              className="flex items-center gap-2 bg-accent text-accent-foreground px-4 py-2.5 rounded-md font-display font-bold text-sm tracking-wide hover:bg-accent/90 transition-colors"
            >
              {t("nav.getQuote")}
            </Link>
            <Link
              to="/track"
              className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-md font-display font-bold text-sm tracking-wide hover:bg-primary/90 transition-colors"
            >
              <Search className="h-4 w-4" />
              {t("nav.trackNow")}
            </Link>
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1 px-3 py-2 rounded-md text-sm font-semibold text-foreground/70 hover:text-foreground hover:bg-muted transition-colors">
                  <User className="h-4 w-4" />
                  <span className="max-w-[100px] truncate">{user.email?.split("@")[0]}</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to="/create-shipment" className="cursor-pointer">Create Shipment</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive">
                    <LogOut className="h-4 w-4 mr-2" /> {t("nav.signOut")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link
                to="/auth"
                className="flex items-center gap-1 px-3 py-2 rounded-md text-sm font-semibold text-foreground/70 hover:text-foreground hover:bg-muted transition-colors"
              >
                <User className="h-4 w-4" />
                {t("nav.signIn")}
              </Link>
            )}
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <ThemeToggle />
            <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 text-foreground">
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="lg:hidden border-t border-border bg-card">
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
              <Link to="/reviews" onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 rounded-md text-sm font-semibold text-foreground/70 hover:text-foreground hover:bg-muted">
                {t("nav.reviews")}
              </Link>
              {user ? (
                <button onClick={() => { signOut(); setMobileOpen(false); }} className="block w-full text-left px-4 py-2.5 rounded-md text-sm font-semibold text-destructive hover:bg-muted">
                  {t("nav.signOut")}
                </button>
              ) : (
                <Link to="/auth" onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 rounded-md text-sm font-semibold text-foreground/70 hover:text-foreground hover:bg-muted">
                  {t("nav.signIn")} / {t("nav.signUp")}
                </Link>
              )}
              <Link to="/quote" onClick={() => setMobileOpen(false)} className="block text-center bg-accent text-accent-foreground px-5 py-2.5 rounded-md font-display font-bold text-sm tracking-wide mt-2">
                {t("nav.getQuote")}
              </Link>
              <Link to="/track" onClick={() => setMobileOpen(false)} className="block text-center bg-primary text-primary-foreground px-5 py-2.5 rounded-md font-display font-bold text-sm tracking-wide mt-2">
                {t("nav.trackNow")}
              </Link>
            </div>
          </div>
        )}
      </header>
    </>
  );
};

export default AppHeader;
