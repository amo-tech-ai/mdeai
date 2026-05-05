import { Link } from "react-router-dom";
import { Plus, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HostShell } from "@/components/host/layout/HostShell";
import { RoleProtectedRoute } from "@/components/host/layout/RoleProtectedRoute";
import { ListingCard } from "@/components/host/listing/ListingCard";
import { LandlordPerformanceCard } from "@/components/host/dashboard/LandlordPerformanceCard";
import { useOwnListings } from "@/hooks/host/useListings";
import { useOwnLandlordProfile } from "@/hooks/host/useLandlordOnboarding";
import { useLandlordMetrics } from "@/hooks/host/useLandlordMetrics";

/**
 * /host/dashboard — landlord home. D7 + D12 KPIs.
 *
 * Sections (top to bottom):
 *   1. Greeting + Create-listing CTA
 *   2. Performance KPIs (D12) — only when total leads > 0
 *   3. Your listings (D7)
 *
 * Role gate via <RoleProtectedRoute>: anon → /login, renter →
 * /dashboard, landlord-without-profile → /host/onboarding.
 */

export default function HostDashboard() {
  return (
    <RoleProtectedRoute>
      <HostShell>
        <DashboardContent />
      </HostShell>
    </RoleProtectedRoute>
  );
}

function DashboardContent() {
  const { data: profile } = useOwnLandlordProfile();
  const { data: listings, isLoading, error, refetch } = useOwnListings();
  const { metrics, isLoading: metricsLoading } = useLandlordMetrics();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <header className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-xs font-medium text-primary uppercase tracking-wider">
            Host dashboard
          </p>
          <h1 className="mt-1 font-display text-3xl sm:text-4xl font-bold text-foreground">
            {greeting()}
            {profile?.display_name ? `, ${profile.display_name.split(" ")[0]}` : ""}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Tus anuncios y consultas — un vistazo rápido a tu actividad.
          </p>
        </div>
        <Button asChild size="lg" data-testid="host-dashboard-create">
          <Link to="/host/listings/new" className="gap-2">
            <Plus className="w-4 h-4" /> Create listing
          </Link>
        </Button>
      </header>

      {!metricsLoading && metrics.total > 0 ? (
        <div className="mb-8">
          <LandlordPerformanceCard metrics={metrics} />
        </div>
      ) : null}

      <section aria-labelledby="listings-heading">
        <h2
          id="listings-heading"
          className="text-lg font-semibold text-foreground mb-3"
        >
          Your listings
        </h2>

        {isLoading ? <ListingsLoading /> : null}
        {error ? <ListingsError onRetry={refetch} /> : null}
        {!isLoading && !error && (!listings || listings.length === 0) ? (
          <ListingsEmpty />
        ) : null}
        {!isLoading && !error && listings && listings.length > 0 ? (
          <div className="space-y-3" data-testid="host-listings-grid">
            {listings.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}

function ListingsLoading() {
  return (
    <div
      className="rounded-xl border border-border bg-card p-10 text-center text-muted-foreground"
      data-testid="host-listings-loading"
    >
      <Loader2 className="w-5 h-5 mx-auto animate-spin" aria-hidden="true" />
      <p className="mt-3 text-sm">Loading your listings…</p>
    </div>
  );
}

function ListingsError({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-destructive/30 bg-destructive/5 p-6"
      data-testid="host-listings-error"
    >
      <div className="flex items-center gap-2 text-destructive font-medium">
        <AlertCircle className="w-4 h-4" aria-hidden="true" />
        Couldn't load your listings.
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Check your connection and try again. Drafts are still saved locally.
      </p>
      <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}

function ListingsEmpty() {
  return (
    <div
      className="rounded-xl border-2 border-dashed border-border bg-card px-6 py-12 text-center"
      data-testid="host-listings-empty"
    >
      <h3 className="text-lg font-semibold text-foreground">
        No listings yet
      </h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
        Create your first listing — it takes about 5 minutes if your photos are ready.
      </p>
      <Button asChild size="lg" className="mt-5">
        <Link to="/host/listings/new" className="gap-2">
          <Plus className="w-4 h-4" /> Create your first listing
        </Link>
      </Button>
    </div>
  );
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}
