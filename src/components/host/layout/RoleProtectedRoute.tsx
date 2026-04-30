import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useOwnLandlordProfile } from "@/hooks/host/useLandlordOnboarding";

/**
 * RoleProtectedRoute — landlord-only gate for /host/* pages (D7).
 *
 * Decision tree (matches the existing per-page gates in /host/onboarding
 * and /host/listings/new — extracted here so D7+ pages don't each re-implement it):
 *
 *   loading                       → spinner
 *   anon                          → /login?returnTo=<current path>
 *   account_type !== 'landlord'   → /dashboard
 *   landlord without profile row  → /host/onboarding
 *   landlord with profile row     → render children
 *
 * `returnTo` is preserved on the login redirect so a deep link
 * (e.g. /host/listings/abc/edit pasted from Slack) lands on the right
 * page after sign-in instead of dumping the user on the home page.
 */

interface RoleProtectedRouteProps {
  children: ReactNode;
}

export function RoleProtectedRoute({ children }: RoleProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useOwnLandlordProfile();
  const location = useLocation();

  if (authLoading || (user && profileLoading)) {
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
    const returnTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?returnTo=${returnTo}`} replace />;
  }

  const accountType = user.user_metadata?.account_type;
  if (accountType !== "landlord") {
    return <Navigate to="/dashboard" replace />;
  }

  if (!profile) {
    return <Navigate to="/host/onboarding" replace />;
  }

  return <>{children}</>;
}
