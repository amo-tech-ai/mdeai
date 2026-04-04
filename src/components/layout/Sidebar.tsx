import { Link, useLocation } from "react-router-dom";
import { Home, Compass, Heart, Sparkles, Bell, Calendar, User, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { BrandLogo } from "@/components/layout/BrandLogo";

const navItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Compass, label: "Explore", path: "/explore" },
  { icon: Heart, label: "Saved", path: "/saved", protected: true },
  { icon: Calendar, label: "Trips", path: "/trips", protected: true },
  { icon: Sparkles, label: "Concierge", path: "/concierge" },
];

export function Sidebar() {
  const location = useLocation();
  const { user, signOut } = useAuth();

  return (
    <aside className="hidden lg:flex w-64 flex-col border-r border-sidebar-border bg-sidebar h-screen sticky top-0">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md">
          <BrandLogo variant="sidebar" />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary font-medium"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Notifications & User Profile */}
      <div className="p-4 border-t border-sidebar-border space-y-4">
        {user && (
          <div className="flex items-center justify-between px-2">
            <span className="text-sm text-muted-foreground">Notifications</span>
            <NotificationBell />
          </div>
        )}
        
        {user ? (
          <div className="space-y-2">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-sidebar-accent/30">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {user.email?.split("@")[0]}
                </p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
              onClick={signOut}
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </Button>
          </div>
        ) : (
          <Link to="/login">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-sidebar-accent/30 cursor-pointer hover:bg-sidebar-accent/50 transition-colors">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  Guest User
                </p>
                <p className="text-xs text-muted-foreground">Sign in to save</p>
              </div>
            </div>
          </Link>
        )}
      </div>
    </aside>
  );
}
