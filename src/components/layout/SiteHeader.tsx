import { useState } from "react";
import { Link } from "react-router-dom";
import { LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { MAIN_NAV_LINKS } from "@/config/marketingNav";

/**
 * Global fixed header: logo, primary nav (md+), mobile sheet, auth.
 * Used on the homepage; other marketing pages can adopt the same pattern.
 */
export function SiteHeader() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { user, signOut } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 shadow-sm backdrop-blur-sm supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto px-4 py-3 md:py-4 flex items-center gap-3">
        <Link
          to="/"
          className="flex min-w-0 shrink-0 items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <BrandLogo variant="nav" className="max-w-[min(54vw,248px)] sm:max-w-[290px] md:max-w-none" />
        </Link>

        <nav
          className="hidden min-w-0 flex-1 items-center justify-center gap-4 px-2 md:flex lg:gap-6"
          aria-label="Primary"
        >
          {MAIN_NAV_LINKS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className="whitespace-nowrap text-sm text-muted-foreground transition-colors hover:text-foreground lg:text-base"
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[min(100%,320px)]">
              <SheetHeader>
                <SheetTitle className="text-left">Menu</SheetTitle>
              </SheetHeader>
              <nav className="mt-8 flex flex-col gap-1" aria-label="Mobile primary">
                {MAIN_NAV_LINKS.map(({ to, label }) => (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setMobileNavOpen(false)}
                    className="border-b border-border/60 py-3 text-lg text-foreground hover:text-primary"
                  >
                    {label}
                  </Link>
                ))}
                <Link
                  to="/how-it-works"
                  onClick={() => setMobileNavOpen(false)}
                  className="mt-4 border-t border-border pt-6 py-3 text-muted-foreground hover:text-foreground"
                >
                  How it works
                </Link>
                <Link
                  to="/pricing"
                  onClick={() => setMobileNavOpen(false)}
                  className="py-3 text-muted-foreground hover:text-foreground"
                >
                  Pricing
                </Link>
              </nav>
            </SheetContent>
          </Sheet>

          {user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="hidden max-w-[120px] truncate text-sm text-muted-foreground sm:inline">
                {user.email?.split("@")[0]}
              </span>
              <Button variant="ghost" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Link to="/login">
              <Button size="sm" className="rounded-full">
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
