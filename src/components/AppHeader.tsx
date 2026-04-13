import { Link, useLocation } from "react-router-dom";
import { Package, LayoutDashboard, Truck, Search } from "lucide-react";

const AppHeader = () => {
  const location = useLocation();

  const navItems = [
    { to: "/", label: "Track", icon: Search },
    { to: "/admin", label: "Admin", icon: LayoutDashboard },
    { to: "/driver", label: "Driver", icon: Truck },
  ];

  return (
    <header className="sticky top-0 z-50 bg-secondary border-b-4 border-primary">
      <div className="container flex items-center justify-between h-[60px]">
        <Link to="/" className="flex items-center gap-2">
          <Package className="h-6 w-6 text-primary" />
          <span className="font-display text-2xl font-black tracking-wide text-primary-foreground">
            SWIFT<span className="text-primary">TRACK</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm font-mono text-xs tracking-wider transition-colors ${
                location.pathname === to
                  ? "bg-primary text-primary-foreground"
                  : "text-secondary-foreground/80 hover:bg-secondary/80 hover:text-secondary-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
};

export default AppHeader;
