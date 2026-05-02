/**
 * HostCard — public-listing-only landlord display card.
 *
 * Shows the verified host badge, display name, primary neighborhood,
 * languages, and a basic responsiveness signal. Reads from
 * landlord_profiles_public (security_invoker view) so PII like phone
 * numbers never reach the wire on a public page.
 *
 * Renders a graceful skeleton during the fetch and renders nothing if
 * the apartment doesn't have a landlord_id (legacy seeded listings).
 */

import { CheckCircle2, MapPin, Languages } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useLandlordPublicProfile } from "@/hooks/useLandlordPublicProfile";

interface HostCardProps {
  landlordId: string | null | undefined;
}

export function HostCard({ landlordId }: HostCardProps) {
  const { data, isLoading } = useLandlordPublicProfile(landlordId);

  if (!landlordId) return null;

  if (isLoading) {
    return (
      <Card data-testid="host-card-loading">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Hosted by</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const initial = data.display_name?.trim()?.[0]?.toUpperCase() ?? "H";
  const responseLabel =
    data.median_response_time_minutes != null
      ? data.median_response_time_minutes < 60
        ? `Replies in ~${Math.max(1, data.median_response_time_minutes)} min`
        : `Replies in ~${Math.round(data.median_response_time_minutes / 60)} h`
      : null;

  return (
    <Card data-testid="host-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Hosted by</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-start gap-3">
          {data.avatar_url ? (
            <img
              src={data.avatar_url}
              alt={data.display_name}
              className="h-12 w-12 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
              {initial}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p
                className="truncate font-medium text-foreground"
                data-testid="host-card-name"
              >
                {data.display_name}
              </p>
              {data.is_verified && (
                <CheckCircle2
                  className="h-4 w-4 flex-shrink-0 text-primary"
                  aria-label="Verified host"
                  data-testid="host-card-verified"
                />
              )}
            </div>
            {data.primary_neighborhood && (
              <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" aria-hidden="true" />
                {data.primary_neighborhood}
              </p>
            )}
            {responseLabel && (
              <p
                className="mt-0.5 text-xs text-muted-foreground"
                data-testid="host-card-response"
              >
                {responseLabel}
              </p>
            )}
          </div>
        </div>

        {data.bio && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {data.bio}
          </p>
        )}

        {data.languages?.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <Languages
              className="h-3 w-3 text-muted-foreground"
              aria-hidden="true"
            />
            {data.languages.map((lang) => (
              <Badge key={lang} variant="secondary" className="text-xs">
                {lang}
              </Badge>
            ))}
          </div>
        )}

        {data.active_listings > 1 && (
          <p className="text-xs text-muted-foreground">
            {data.active_listings} active listings on mdeai
          </p>
        )}
      </CardContent>
    </Card>
  );
}
