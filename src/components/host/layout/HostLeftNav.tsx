import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Inbox,
  UserCircle2,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLeads } from "@/hooks/host/useLeads";

/**
 * HostLeftNav — sidebar nav for /host/* pages.
 *
 *   D7  Listings live
 *   D9  Leads live + "new" count badge
 *   D15 Profile
 *   D17 Settings
 *
 * The "new leads" badge reuses the same useLeads cache that powers the
 * /host/leads page, so flipping between dashboard ↔ leads doesn't
 * trigger an extra fetch.
 */

interface HostLeftNavProps {
  className?: string;
}

interface NavItem {
  to: string;
  label: string;
  Icon: typeof LayoutDashboard;
  /** When set, render a small numeric badge to the right of the label. */
  badge?: number;
  /** When true, item shows but is not clickable; tooltip explains. */
  disabled?: boolean;
  comingDay?: string;
}

export function HostLeftNav({ className }: HostLeftNavProps) {
  const { counts } = useLeads();
  const newLeadsCount = counts?.new ?? 0;

  const items: NavItem[] = [
    { to: "/host/dashboard", label: "Listings", Icon: LayoutDashboard },
    {
      to: "/host/leads",
      label: "Leads",
      Icon: Inbox,
      badge: newLeadsCount > 0 ? newLeadsCount : undefined,
    },
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
        {items.map(({ to, label, Icon, badge, disabled, comingDay }) => (
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
                <span className="flex-1">{label}</span>
                {typeof badge === "number" ? (
                  <span
                    className="rounded-full bg-primary text-primary-foreground text-[11px] font-semibold px-1.5 min-w-[1.25rem] h-5 inline-flex items-center justify-center tabular-nums"
                    data-testid={`host-nav-${label.toLowerCase()}-badge`}
                    aria-label={`${badge} new`}
                  >
                    {badge > 99 ? "99+" : badge}
                  </span>
                ) : null}
              </NavLink>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
