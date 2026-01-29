import { useState, useEffect } from "react";
import { MapPin, Bed, Bath, Wifi, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import type { Apartment } from "@/types/listings";

interface SearchResult {
  listings: Apartment[];
  total: number;
  facets?: {
    neighborhoods: { name: string; count: number }[];
    price_ranges: { min: number; max: number; count: number }[];
  };
  map_pins?: { id: string; lat: number; lng: number; price: number }[];
}

interface RentalsSearchResultsProps {
  filterJson: Record<string, unknown>;
  onSelectListing: (listing: Apartment) => void;
}

export function RentalsSearchResults({ filterJson, onSelectListing }: RentalsSearchResultsProps) {
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function search() {
      setIsLoading(true);
      setError(null);

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;

        const response = await fetch(
          "https://zkwcbyxiwklihegjhuql.supabase.co/functions/v1/rentals",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: JSON.stringify({
              action: "search",
              filter_json: filterJson,
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Search failed");
        }

        const data: SearchResult = await response.json();
        setResults(data);
      } catch (err) {
        console.error("Search error:", err);
        setError("Failed to search apartments. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }

    search();
  }, [filterJson]);

  const getFreshnessIcon = (status: string | undefined) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case "stale":
        return <AlertCircle className="w-3 h-3 text-red-500" />;
      default:
        return <AlertCircle className="w-3 h-3 text-yellow-500" />;
    }
  };

  const getFreshnessBadge = (status: string | undefined) => {
    switch (status) {
      case "active":
        return <Badge variant="secondary" className="bg-green-500/10 text-green-700 text-xs">Verified</Badge>;
      case "stale":
        return <Badge variant="secondary" className="bg-red-500/10 text-red-700 text-xs">May be unavailable</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">Unverified</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Searching apartments...</span>
        </div>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="py-6 text-center">
          <AlertCircle className="w-8 h-8 mx-auto text-destructive mb-2" />
          <p className="text-destructive">{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!results || results.listings.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="font-medium">No apartments found</p>
          <p className="text-sm text-muted-foreground mt-1">
            Try adjusting your search criteria
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Results Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Found <span className="font-medium text-foreground">{results.total}</span> apartments
        </p>
        {results.facets?.neighborhoods && (
          <div className="flex gap-1">
            {results.facets.neighborhoods.slice(0, 3).map((n) => (
              <Badge key={n.name} variant="outline" className="text-xs">
                {n.name} ({n.count})
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Listings */}
      <div className="grid gap-4">
        {results.listings.map((listing) => (
          <Card
            key={listing.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onSelectListing(listing)}
          >
            <CardContent className="p-4">
              <div className="flex gap-4">
                {/* Image */}
                <div className="w-32 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                  {listing.images?.[0] ? (
                    <img
                      src={listing.images[0]}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-medium line-clamp-1">{listing.title}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {listing.neighborhood}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">
                        ${listing.price_monthly?.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">/month</p>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Bed className="w-3 h-3" />
                      {listing.bedrooms} bed
                    </span>
                    <span className="flex items-center gap-1">
                      <Bath className="w-3 h-3" />
                      {listing.bathrooms} bath
                    </span>
                    {listing.wifi_speed && (
                      <span className="flex items-center gap-1">
                        <Wifi className="w-3 h-3" />
                        {listing.wifi_speed} Mbps
                      </span>
                    )}
                  </div>

                  {/* Freshness & Rating */}
                  <div className="flex items-center gap-2 mt-2">
                    {getFreshnessBadge(listing.freshness_status)}
                    {listing.rating && (
                      <span className="text-xs flex items-center gap-1">
                        <span className="text-yellow-500">★</span>
                        {listing.rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
