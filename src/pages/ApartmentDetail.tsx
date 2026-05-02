import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft, MapPin, Bed, Bath, Wifi, Star, Heart, Share2, Calendar, CheckCircle, XCircle, Sparkles } from "lucide-react";
import { ThreePanelLayout, useThreePanelContext } from "@/components/explore/ThreePanelLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useApartment } from "@/hooks/useApartments";
import { useToggleSave, useIsSaved } from "@/hooks/useSavedPlaces";
import { useAuth } from "@/hooks/useAuth";
import { BookingDialog } from "@/components/apartments/BookingDialog";
import { ContactHostDialog } from "@/components/apartments/ContactHostDialog";
import { WhatsAppContactModal } from "@/components/apartments/WhatsAppContactModal";
import { HostCard } from "@/components/apartments/HostCard";
import type { Apartment } from "@/types/listings";
import { cn } from "@/lib/utils";
import { formatListingPrice } from "@/lib/format-price";
import { savePendingPrompt } from "@/lib/pending-prompt";
import { trackEvent } from "@/lib/posthog";

// Right panel content for apartment detail
function ApartmentDetailRightPanel({
  apartment,
  onCheckAvailability,
  onContactHost,
  onAskMdeai,
}: {
  apartment: Apartment;
  onCheckAvailability: () => void;
  onContactHost: () => void;
  onAskMdeai: () => void;
}) {
  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Book This Place</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center" data-testid="apt-price-block">
            <div className="text-3xl font-bold text-primary">
              {formatListingPrice(apartment.price_monthly, apartment.currency)}
            </div>
            <p className="text-sm text-muted-foreground">per month</p>
          </div>
          {/* Only render weekly/daily tiles when the landlord actually
              priced those terms — most monthly listings don't, and the
              old "$N/A" placeholder confused renters. */}
          {(apartment.price_weekly || apartment.price_daily) && (
            <div className="grid grid-cols-2 gap-2 text-sm">
              {apartment.price_weekly && (
                <div className="text-center p-2 rounded-lg bg-muted">
                  <div className="font-medium">
                    {formatListingPrice(
                      apartment.price_weekly,
                      apartment.currency,
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">weekly</div>
                </div>
              )}
              {apartment.price_daily && (
                <div className="text-center p-2 rounded-lg bg-muted">
                  <div className="font-medium">
                    {formatListingPrice(
                      apartment.price_daily,
                      apartment.currency,
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">daily</div>
                </div>
              )}
            </div>
          )}
          <Button className="w-full" size="lg" onClick={onCheckAvailability}>
            <Calendar className="w-4 h-4 mr-2" />
            Check Availability
          </Button>
          <Button variant="outline" className="w-full" onClick={onContactHost}>
            Contact Host
          </Button>
          {/* SEO acquisition loop — bring search-traffic users into the
              chat-first experience without losing the listing context.
              The pending-prompt is auto-fired post-auth (anon: directly). */}
          <Button
            variant="ghost"
            className="w-full text-primary hover:text-primary"
            onClick={onAskMdeai}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Ask mdeai about this →
          </Button>
        </CardContent>
      </Card>

      {/* Key Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Key Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Min Stay</span>
            <span className="font-medium">{apartment.minimum_stay_days || 1} days</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Deposit</span>
            <span className="font-medium">${apartment.deposit_amount || "N/A"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Utilities</span>
            <span className="font-medium">{apartment.utilities_included ? "Included" : "Not included"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">WiFi Speed</span>
            <span className="font-medium">{apartment.wifi_speed ? `${apartment.wifi_speed} Mbps` : "N/A"}</span>
          </div>
        </CardContent>
      </Card>

      {/* Host Info — pulls from landlord_profiles_public when the listing
          has a landlord_id. Falls back to the legacy host_name display
          for legacy / scraped listings that pre-date Landlord V1. */}
      {apartment.landlord_id ? (
        <HostCard landlordId={apartment.landlord_id} />
      ) : apartment.host_name ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Hosted by</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-lg">👤</span>
              </div>
              <div>
                <p className="font-medium">{apartment.host_name}</p>
                <p className="text-sm text-muted-foreground">
                  Response: {apartment.host_response_time || "Within 24h"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

// Inner component that can safely use useThreePanelContext (must be inside
// the ThreePanelLayout's <ThreePanelProvider>).
function ApartmentDetailContent({ apartment, isSaved, handleSave, user }: {
  apartment: Apartment;
  isSaved: boolean | undefined;
  handleSave: () => void;
  user: ReturnType<typeof useAuth>["user"];
}) {
  const { setRightPanelContent } = useThreePanelContext();
  const navigate = useNavigate();
  const [bookingOpen, setBookingOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

  // SEO → chat handoff. Save a contextual prompt to sessionStorage and
  // route to /chat?send=pending; ChatCanvas auto-fires it (anon) or
  // through Supabase auth (signed-in). The prompt names the listing so
  // Gemini's first turn is grounded in the specific apartment, not a
  // cold open.
  const askMdeai = () => {
    if (!apartment) return;
    const where = [apartment.neighborhood, apartment.city]
      .filter(Boolean)
      .join(", ");
    const prompt = where
      ? `I'm looking at "${apartment.title}" in ${where}. Tell me about this place and similar options.`
      : `I'm looking at "${apartment.title}". Tell me about this place and similar options.`;
    savePendingPrompt(prompt);
    trackEvent({
      name: "prompt_send",
      source: "chat_input",
      promptLength: prompt.length,
      authed: !!user,
    });
    navigate("/chat?send=pending");
  };

  useEffect(() => {
    if (apartment) {
      setRightPanelContent(
        <ApartmentDetailRightPanel
          apartment={apartment}
          onCheckAvailability={() => setBookingOpen(true)}
          onContactHost={() => setContactOpen(true)}
          onAskMdeai={askMdeai}
        />,
      );
    }
    return () => setRightPanelContent(null);
    // askMdeai depends on apartment + navigate + user; the apartment dep
    // here re-builds the panel when the listing changes (which is the
    // only case the closure can become stale for the user's purpose).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apartment, setRightPanelContent]);

  const mainImage = apartment.images?.[0] || "/placeholder.svg";

  return (
    <div className="p-6 max-w-4xl">
      {/* Back Link */}
      <Link to="/apartments" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Apartments
      </Link>

      {/* Image Gallery */}
      <div className="relative rounded-xl overflow-hidden mb-6">
        <img
          src={mainImage}
          alt={apartment.title}
          className="w-full h-[400px] object-cover"
        />
        <div className="absolute top-4 right-4 flex gap-2">
          <Button
            variant="secondary"
            size="icon"
            className="rounded-full bg-background/80 backdrop-blur-sm"
            onClick={handleSave}
            disabled={!user}
          >
            <Heart className={cn("w-5 h-5", isSaved && "fill-red-500 text-red-500")} />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="rounded-full bg-background/80 backdrop-blur-sm"
          >
            <Share2 className="w-5 h-5" />
          </Button>
        </div>
        {apartment.verified && (
          <Badge className="absolute top-4 left-4 bg-primary">
            <CheckCircle className="w-3 h-3 mr-1" />
            Verified
          </Badge>
        )}
      </div>

      {/* Title & Location */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-display font-bold mb-2">{apartment.title}</h1>
        <div className="flex items-center gap-4 text-muted-foreground">
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            <span>{apartment.neighborhood}</span>
            {apartment.city && <span>, {apartment.city}</span>}
          </div>
          {apartment.rating && (
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium text-foreground">{apartment.rating}</span>
              <span>({apartment.review_count || 0} reviews)</span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="flex items-center gap-3 p-4 rounded-xl bg-muted">
          <Bed className="w-5 h-5 text-primary" />
          <div>
            <p className="font-medium">{apartment.bedrooms || 1} Beds</p>
            <p className="text-xs text-muted-foreground">Bedrooms</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-xl bg-muted">
          <Bath className="w-5 h-5 text-primary" />
          <div>
            <p className="font-medium">{apartment.bathrooms || 1} Baths</p>
            <p className="text-xs text-muted-foreground">Bathrooms</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-xl bg-muted">
          <Wifi className="w-5 h-5 text-primary" />
          <div>
            <p className="font-medium">{apartment.wifi_speed || "N/A"} Mbps</p>
            <p className="text-xs text-muted-foreground">WiFi Speed</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-xl bg-muted">
          <MapPin className="w-5 h-5 text-primary" />
          <div>
            <p className="font-medium">{apartment.size_sqm || "N/A"} m²</p>
            <p className="text-xs text-muted-foreground">Size</p>
          </div>
        </div>
      </div>

      <Separator className="my-6" />

      {/* Description */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">About This Place</h2>
        <p className="text-muted-foreground leading-relaxed">
          {apartment.description || "No description available."}
        </p>
      </div>

      {/* Amenities */}
      {apartment.amenities && apartment.amenities.length > 0 && (
        <>
          <Separator className="my-6" />
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3">Amenities</h2>
            <div className="flex flex-wrap gap-2">
              {apartment.amenities.map((amenity: string) => (
                <Badge key={amenity} variant="secondary">
                  {amenity}
                </Badge>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Building Amenities */}
      {apartment.building_amenities && apartment.building_amenities.length > 0 && (
        <>
          <Separator className="my-6" />
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3">Building Amenities</h2>
            <div className="flex flex-wrap gap-2">
              {apartment.building_amenities.map((amenity: string) => (
                <Badge key={amenity} variant="outline">
                  {amenity}
                </Badge>
              ))}
            </div>
          </div>
        </>
      )}

      {/* House Rules */}
      <Separator className="my-6" />
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">House Rules</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            {apartment.pet_friendly ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500" />
            )}
            <span>Pets {apartment.pet_friendly ? "allowed" : "not allowed"}</span>
          </div>
          <div className="flex items-center gap-2">
            {apartment.smoking_allowed ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500" />
            )}
            <span>Smoking {apartment.smoking_allowed ? "allowed" : "not allowed"}</span>
          </div>
          <div className="flex items-center gap-2">
            {apartment.parking_included ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500" />
            )}
            <span>Parking {apartment.parking_included ? "included" : "not included"}</span>
          </div>
          <div className="flex items-center gap-2">
            {apartment.furnished ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500" />
            )}
            <span>{apartment.furnished ? "Furnished" : "Unfurnished"}</span>
          </div>
        </div>
      </div>

      {/* Mobile CTA — only show /night line when there's actually a daily
          price; monthly-only listings looked broken with "$undefined/night". */}
      <div className="md:hidden fixed bottom-20 left-0 right-0 p-4 bg-background border-t z-30">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="font-bold text-lg">
              {formatListingPrice(apartment.price_monthly, apartment.currency)}
              <span className="text-sm font-normal text-muted-foreground">
                {" "}
                /mo
              </span>
            </div>
            {apartment.price_daily ? (
              <p className="text-xs text-muted-foreground">
                {formatListingPrice(apartment.price_daily, apartment.currency)}{" "}
                /night
              </p>
            ) : null}
          </div>
          <Button size="lg" onClick={() => setBookingOpen(true)}>
            Check Availability
          </Button>
        </div>
      </div>

      {/* Booking + Contact Host dialogs — portal to document root, so it's
          fine to mount them here even though the trigger lives in the
          right panel (different DOM subtree). */}
      <BookingDialog
        open={bookingOpen}
        onOpenChange={setBookingOpen}
        apartment={apartment}
      />
      {apartment.landlord_id ? (
        <WhatsAppContactModal
          open={contactOpen}
          onOpenChange={setContactOpen}
          apartment={{
            id: apartment.id,
            title: apartment.title,
            neighborhood: apartment.neighborhood ?? "",
          }}
          hostFirstName={
            apartment.host_name?.split(" ")[0]?.trim() || "the host"
          }
        />
      ) : (
        <ContactHostDialog
          open={contactOpen}
          onOpenChange={setContactOpen}
          apartment={apartment}
        />
      )}
    </div>
  );
}

export default function ApartmentDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: apartment, isLoading, error } = useApartment(id!);
  const { user } = useAuth();
  const { data: isSaved } = useIsSaved(id!, "apartment");
  const toggleSave = useToggleSave();

  const handleSave = () => {
    if (!user || !apartment) return;
    toggleSave.mutate({
      locationId: apartment.id,
      locationType: "apartment",
      isSaved: !!isSaved,
    });
  };

  if (isLoading) {
    return (
      <ThreePanelLayout>
        <div className="p-6 space-y-6">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-[400px] w-full rounded-xl" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </ThreePanelLayout>
    );
  }

  if (error || !apartment) {
    return (
      <ThreePanelLayout>
        <div className="p-6">
          <Link to="/apartments" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Apartments
          </Link>
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">Apartment not found</p>
            <Button asChild className="mt-4">
              <Link to="/apartments">Browse Apartments</Link>
            </Button>
          </div>
        </div>
      </ThreePanelLayout>
    );
  }

  return (
    <ThreePanelLayout>
      <ApartmentDetailContent 
        apartment={apartment} 
        isSaved={isSaved} 
        handleSave={handleSave} 
        user={user} 
      />
    </ThreePanelLayout>
  );
}
