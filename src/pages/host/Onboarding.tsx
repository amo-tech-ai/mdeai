import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { CheckCircle2, Loader2 } from "lucide-react";

/**
 * /host/onboarding — destination after a landlord confirms their email.
 *
 * D2 ships this as a placeholder that proves the post-signup redirect works
 * end-to-end. The 3-step wizard (basics + verification + welcome) lands D3
 * per tasks/plan/06-landlord-v1-30day.md §5.1.
 *
 * Auth gate behavior:
 *   - Anonymous user — bounced to /login with returnTo carry-over.
 *   - Renter user (account_type !== 'landlord') — bounced to /dashboard.
 *     They got here by accident; we don't show the host onboarding to
 *     non-landlords. They can still become a landlord later via /signup.
 *   - Landlord user — sees the welcome screen below.
 */
export default function HostOnboarding() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2
          className="w-6 h-6 animate-spin text-muted-foreground"
          aria-label="Loading"
        />
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login?returnTo=%2Fhost%2Fonboarding"
        replace
      />
    );
  }

  const accountType = user.user_metadata?.account_type;
  if (accountType !== "landlord") {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-xl w-full text-center">
        <BrandLogo variant="header" />
        <div className="mt-10 mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary">
          <CheckCircle2 className="w-8 h-8" aria-hidden="true" />
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
          Welcome to mdeai, host.
        </h1>
        <p className="mt-4 text-muted-foreground text-base sm:text-lg">
          You're in the Founding Beta — free for the first 100 landlords.
          The 3-step onboarding wizard launches in the next release. For now,
          you can browse the platform from your dashboard.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg">
            <Link to="/dashboard">Go to dashboard</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/apartments">See live listings</Link>
          </Button>
        </div>
        <p className="mt-8 text-xs text-muted-foreground">
          Need help right now? WhatsApp the founder at{" "}
          <a
            href="https://wa.me/573000000000"
            className="text-primary hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            +57 300 000 0000
          </a>
          .
        </p>
      </div>
    </div>
  );
}
