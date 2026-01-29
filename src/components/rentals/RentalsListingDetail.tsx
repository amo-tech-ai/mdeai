import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  Bed,
  Bath,
  Wifi,
  CheckCircle,
  AlertCircle,
  Calendar,
  Heart,
  ExternalLink,
  RefreshCw,
  Loader2,
  Expand,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIsSaved, useToggleSave } from "@/hooks/useSavedPlaces";
import type { Apartment } from "@/types/listings";

interface RentalsListingDetailProps {
  listingId: string;
  initialData?: Apartment;
  onClose?: () => void;
}

export function RentalsListingDetail({ listingId, initialData, onClose }: RentalsListingDetailProps) {
  const { user } = useAuth();
  const [listing, setListing] = useState<Apartment | null>(initialData || null);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{ status: string; message: string } | null>(null);
  
  const { data: isSaved = false } = useIsSaved(listingId, "apartment");
  const toggleSave = useToggleSave();

  // Fetch listing details if not provided
  useEffect(() => {
    if (initialData) return;

    async function fetchListing() {
      setIsLoading(true);
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
              action: "listing",
              listing_id: listingId,
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          setListing(data.listing);
        }
      } catch (error) {
        console.error("Failed to fetch listing:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchListing();
  }, [listingId, initialData]);

  // Verify listing availability
  const handleVerify = async () => {
    if (!listing?.source_url) return;

    setIsVerifying(true);
    setVerifyResult(null);

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
            action: "verify",
            listing_id: listingId,
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        setVerifyResult({
          status: result.freshness_status,
          message:
            result.freshness_status === "active"
              ? "Listing is currently available!"
              : result.freshness_status === "stale"
              ? "This listing may no longer be available."
              : "Could not verify availability.",
        });
        // Update local listing state
        setListing((prev) =>
          prev ? { ...prev, freshness_status: result.freshness_status } : prev
        );
      }
    } catch (error) {
      console.error("Verify error:", error);
      setVerifyResult({
        status: "error",
        message: "Failed to verify listing.",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSave = () => {
    if (!user) return;
    toggleSave.mutate({
      locationId: listingId,
      locationType: "apartment",
      isSaved,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">Listing not found</p>
      </div>
    );
  }

  const freshnessColor =
    listing.freshness_status === "active"
      ? "text-green-600"
      : listing.freshness_status === "stale"
      ? "text-red-600"
      : "text-yellow-600";

  return (
    <div className="space-y-6">
      {/* Hero Image */}
      {listing.images?.[0] && (
        <div className="relative h-48 -mx-4 -mt-4 overflow-hidden">
          <img
            src={listing.images[0]}
            alt={listing.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <h2 className="text-white font-bold text-lg line-clamp-2">{listing.title}</h2>
            <p className="text-white/80 text-sm flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {listing.neighborhood}
            </p>
          </div>
        </div>
      )}

      {/* View Full Page */}
      <Button asChild variant="outline" className="w-full">
        <Link to={`/apartments/${listing.id}`}>
          <Expand className="w-4 h-4 mr-2" />
          View Full Page
        </Link>
      </Button>

      {/* Price & Freshness */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-primary">
                ${listing.price_monthly?.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">per month</p>
            </div>
            <div className={cn("flex items-center gap-1", freshnessColor)}>
              {listing.freshness_status === "active" ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              <span className="text-sm font-medium capitalize">
                {listing.freshness_status || "Unverified"}
              </span>
            </div>
          </div>

          {/* Verify Button */}
          {listing.source_url && (
            <Button
              variant="outline"
              size="sm"
              className="mt-3 w-full"
              onClick={handleVerify}
              disabled={isVerifying}
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Verify Availability
                </>
              )}
            </Button>
          )}

          {/* Verify Result */}
          {verifyResult && (
            <div
              className={cn(
                "mt-2 p-2 rounded text-sm",
                verifyResult.status === "active"
                  ? "bg-green-500/10 text-green-700"
                  : verifyResult.status === "stale"
                  ? "bg-red-500/10 text-red-700"
                  : "bg-yellow-500/10 text-yellow-700"
              )}
            >
              {verifyResult.message}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Key Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Bed className="w-4 h-4 text-muted-foreground" />
            <span>{listing.bedrooms} Bedrooms</span>
          </div>
          <div className="flex items-center gap-2">
            <Bath className="w-4 h-4 text-muted-foreground" />
            <span>{listing.bathrooms} Bathrooms</span>
          </div>
          {listing.wifi_speed && (
            <div className="flex items-center gap-2">
              <Wifi className="w-4 h-4 text-muted-foreground" />
              <span>{listing.wifi_speed} Mbps WiFi</span>
            </div>
          )}
          {listing.minimum_stay_days && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>Min {listing.minimum_stay_days} days</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Amenities */}
      {listing.amenities && listing.amenities.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Amenities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {listing.amenities.map((amenity) => (
                <Badge key={amenity} variant="secondary">
                  {amenity}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Description */}
      {listing.description && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">About</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {listing.description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="space-y-2">
        <Button className="w-full" size="lg">
          <Calendar className="w-4 h-4 mr-2" />
          Check Availability
        </Button>

        <Button
          variant="outline"
          className={cn("w-full", isSaved && "text-red-500")}
          onClick={handleSave}
          disabled={!user || toggleSave.isPending}
        >
          <Heart className={cn("w-4 h-4 mr-2", isSaved && "fill-current")} />
          {isSaved ? "Saved" : "Save Apartment"}
        </Button>

        {listing.source_url && (
          <Button asChild variant="ghost" className="w-full">
            <a href={listing.source_url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              View Original Listing
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}
