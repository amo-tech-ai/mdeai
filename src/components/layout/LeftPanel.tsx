import { Link, useLocation } from "react-router-dom";
import { Home, Compass, Heart, Sparkles, User, LogOut, ChevronLeft, ChevronRight, Building2, Car, UtensilsCrossed, CalendarDays, Plane, CalendarCheck, LayoutDashboard, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { TripSelector } from "@/components/trips/TripSelector";

interface NavItem {
  icon: typeof Home;
  label: string;
  path: string;
  badge?: string;
  protected?: boolean;
}

const mainNavItems: NavItem[] = [
  { icon: Home, label: "Home", path: "/" },
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard", protected: true },
  { icon: Compass, label: "Explore", path: "/explore" },
];

const listingsNavItems: NavItem[] = [
  { icon: Search, label: "AI Rentals", path: "/rentals" },
  { icon: Building2, label: "Apartments", path: "/apartments" },
  { icon: Car, label: "Cars", path: "/cars" },
  { icon: UtensilsCrossed, label: "Restaurants", path: "/restaurants" },
  { icon: CalendarDays, label: "Events", path: "/events" },
];

const userNavItems: NavItem[] = [
  { icon: Plane, label: "My Trips", path: "/trips", protected: true },
  { icon: CalendarCheck, label: "Bookings", path: "/bookings", protected: true },
  { icon: Heart, label: "Saved", path: "/saved", protected: true },
  { icon: Sparkles, label: "Concierge", path: "/concierge" },
];

interface LeftPanelProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export function LeftPanel({ collapsed = false, onToggle }: LeftPanelProps) {
  const location = useLocation();
  const { user, signOut } = useAuth();

  const NavItemComponent = ({ item }: { item: NavItem }) => {
    const isActive = location.pathname === item.path;
    const content = (
      <Link
        to={item.path}
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
          isActive
            ? "bg-sidebar-accent text-sidebar-primary font-medium"
            : "text-sidebar-foreground hover:bg-sidebar-accent/50",
          collapsed && "justify-center px-2"
        )}
      >
        <item.icon className="w-5 h-5 flex-shrink-0" />
        {!collapsed && (
          <>
            <span>{item.label}</span>
            {item.badge && (
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent-foreground">
                {item.badge}
              </span>
            )}
          </>
        )}
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right">
            <p>{item.label}</p>
          </TooltipContent>
        </Tooltip>
      );
    }

    return content;
  };

  return (
    <aside className="flex flex-col border-r border-sidebar-border bg-sidebar h-screen sticky top-0">
      {/* Logo */}
      <div className={cn("p-6 border-b border-sidebar-border", collapsed && "p-3")}>
        <Link to="/" className="flex items-center gap-3">
          <div className={cn(
            "rounded-xl bg-primary flex items-center justify-center flex-shrink-0",
            collapsed ? "w-10 h-10" : "w-10 h-10"
          )}>
            <span className="text-xl">💚</span>
          </div>
          {!collapsed && (
            <div>
              <h1 className="font-display text-lg font-semibold text-sidebar-foreground">
                I Love Medellín
              </h1>
            </div>
          )}
        </Link>
      </div>

      {/* Toggle Button (tablet only) */}
      {onToggle && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-3 top-20 z-10 rounded-full bg-background border shadow-sm"
          onClick={onToggle}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </Button>
      )}

      {/* Trip Selector */}
      <div className={cn("px-4 pt-4", collapsed && "px-2")}>
        <TripSelector collapsed={collapsed} />
      </div>

      {/* Navigation */}
      <nav className={cn("flex-1 p-4 space-y-1 overflow-y-auto", collapsed && "p-2")}>
        {/* Main Navigation */}
        {mainNavItems.map((item) => (
          <NavItemComponent key={item.path} item={item} />
        ))}
        
        {!collapsed && (
          <div className="pt-4 pb-2">
            <p className="px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Listings
            </p>
          </div>
        )}
        {collapsed && <Separator className="my-2" />}
        
        {listingsNavItems.map((item) => (
          <NavItemComponent key={item.path} item={item} />
        ))}
        
        {!collapsed && (
          <div className="pt-4 pb-2">
            <p className="px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Personal
            </p>
          </div>
        )}
        {collapsed && <Separator className="my-2" />}
        
        {userNavItems.map((item) => (
          <NavItemComponent key={item.path} item={item} />
        ))}
      </nav>

      {/* User Profile */}
      <div className={cn("p-4 border-t border-sidebar-border", collapsed && "p-2")}>
        {user ? (
          <div className="space-y-2">
            {!collapsed ? (
              <>
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
              </>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-full"
                    onClick={signOut}
                  >
                    <LogOut className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Sign out</TooltipContent>
              </Tooltip>
            )}
          </div>
        ) : (
          <Link to="/login">
            {!collapsed ? (
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
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="w-10 h-10 mx-auto rounded-full bg-primary/10 flex items-center justify-center cursor-pointer hover:bg-primary/20 transition-colors">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">Sign in</TooltipContent>
              </Tooltip>
            )}
          </Link>
        )}
      </div>
    </aside>
  );
}
