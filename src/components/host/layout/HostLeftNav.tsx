import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Inbox,
  UserCircle2,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * HostLeftNav — sidebar nav for /host/* pages (D7).
 *
 * V1 has one live link (Dashboard). Inbox lands D9, Profile D15, Settings
 * stays grayed out as a placeholder so landlords see the surface area
 * without us having to build the page on D7.
 *
 * The mobile fallback is just hiding the sidebar — for V1 the host UI is
 * desktop-first because most landlords manage listings from a laptop. We
 * revisit responsive nav on D7 buffer or as a follow-up if data shows
 * mobile usage.
 */

interface HostLeftNavProps {
  className?: string;
}

interface NavItem {
  to: string;
  label: string;
  Icon: typeof LayoutDashboard;
  /** When true, item shows but is not clickable; tooltip explains. */
  disabled?: boolean;
  comingDay?: string;
}

const ITEMS: NavItem[] = [
  { to: "/host/dashboard", label: "Listings", Icon: LayoutDashboard },
  { to: "/host/leads", label: "Leads", Icon: Inbox, disabled: true, comingDay: "D9" },
  {
    to: "/host/profile",
    label: "Profile",
    Icon: UserCircle2,
    disabled: true,
    comingDay: "D15",
  },
  {
    to: "/host/settings",
    label: "Settings",
    Icon: Settings,
    disabled: true,
    comingDay: "D17",
  },
];

export function HostLeftNav({ className }: HostLeftNavProps) {
  return (
    <nav
      aria-label="Host navigation"
      className={cn(
        "hidden md:flex md:flex-col md:w-56 md:shrink-0 md:border-r md:border-border md:bg-card md:px-3 md:py-6",
        className,
      )}
    >
      <p className="px-3 pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Host
      </p>
      <ul className="space-y-1">
        {ITEMS.map(({ to, label, Icon, disabled, comingDay }) => (
          <li key={to}>
            {disabled ? (
              <span
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground/70 cursor-not-allowed"
                title={comingDay ? `Coming ${comingDay}` : undefined}
                aria-disabled="true"
                data-testid={`host-nav-${label.toLowerCase()}`}
              >
                <Icon className="w-4 h-4" aria-hidden="true" />
                <span className="flex-1">{label}</span>
                {comingDay ? (
                  <span className="text-[10px] uppercase tracking-wider rounded bg-muted px-1.5 py-0.5">
                    Soon
                  </span>
                ) : null}
              </span>
            ) : (
              <NavLink
                to={to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-muted",
                  )
                }
                data-testid={`host-nav-${label.toLowerCase()}`}
              >
                <Icon className="w-4 h-4" aria-hidden="true" />
                <span>{label}</span>
              </NavLink>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
