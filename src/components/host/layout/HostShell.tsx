import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { HostLeftNav } from "./HostLeftNav";

/**
 * HostShell — page chrome for every /host/* logged-in route (D7+).
 *
 *   ┌──────── header (logo + "View public site" link) ────────┐
 *   │ HostLeftNav │ <main>{children}</main>                    │
 *   └─────────────┴──────────────────────────────────────────┘
 *
 * Pages should pass their own `<header>` with title/CTA inside `children` —
 * the shell only owns the global chrome. Page-level container width and
 * padding live in the page so different pages can choose between full-bleed
 * (e.g. eventual map-heavy listing-detail) and constrained (lists, forms).
 */

interface HostShellProps {
  children: ReactNode;
}

export function HostShell({ children }: HostShellProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <BrandLogo variant="header" />
          <Link
            to="/apartments"
            className="text-sm text-muted-foreground hover:text-foreground"
            data-testid="host-shell-public-link"
          >
            View public site →
          </Link>
        </div>
      </header>
      <div className="flex flex-1">
        <HostLeftNav />
        <main className="flex-1 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
