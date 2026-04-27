import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, MapPin, Users, Fuel, Star, Heart, Share2, Calendar, CheckCircle, Gauge, Settings2 } from "lucide-react";
import { ThreePanelLayout, useThreePanelContext } from "@/components/explore/ThreePanelLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useCar } from "@/hooks/useCars";
import { useToggleSave, useIsSaved } from "@/hooks/useSavedPlaces";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { CarBookingWizardPremium } from "@/components/bookings/CarBookingWizardPremium";

// Right panel content for car detail
function CarDetailRightPanel({ car, onBookNow }: { car: any; onBookNow: () => void }) {
  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Rent This Car</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">
              ${car.price_daily?.toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground">per day</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-center p-2 rounded-lg bg-muted">
              <div className="font-medium">${car.price_weekly || "N/A"}</div>
              <div className="text-xs text-muted-foreground">weekly</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-muted">
              <div className="font-medium">${car.price_monthly || "N/A"}</div>
              <div className="text-xs text-muted-foreground">monthly</div>
            </div>
          </div>
          <Button className="w-full" size="lg" onClick={onBookNow}>
            <Calendar className="w-4 h-4 mr-2" />
            Book Now
          </Button>
          <Button variant="outline" className="w-full">
            Contact Rental Company
          </Button>
        </CardContent>
      </Card>

      {/* Key Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Rental Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Min Rental</span>
            <span className="font-medium">{car.minimum_rental_days || 1} days</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Deposit</span>
            <span className="font-medium">${car.deposit_amount || "N/A"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Insurance</span>
            <span className="font-medium">{car.insurance_included ? "Included" : "Optional"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Mileage</span>
            <span className="font-medium">
              {car.unlimited_mileage ? "Unlimited" : `${car.mileage_limit_daily || "N/A"} km/day`}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Rental Company */}
      {car.rental_company && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Rental Company</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-lg">🚗</span>
              </div>
              <div>
                <p className="font-medium">{car.rental_company}</p>
                <p className="text-sm text-muted-foreground">Verified Partner</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Inner component that uses the panel context
function CarDetailContent() {
  const { id } = useParams<{ id: string }>();
  const { data: car, isLoading, error } = useCar(id!);
  const { user } = useAuth();
  const { data: isSaved } = useIsSaved(id!, "car");
  const toggleSave = useToggleSave();
  const { setRightPanelContent } = useThreePanelContext();
  const [showBookingWizard, setShowBookingWizard] = useState(false);

  const handleBookNow = () => {
    if (!user) {
      // Could redirect to login or show toast
      return;
    }
    setShowBookingWizard(true);
  };

  // Set right panel content when car loads
  useEffect(() => {
    if (car) {
      setRightPanelContent(<CarDetailRightPanel car={car} onBookNow={handleBookNow} />);
    }
    return () => setRightPanelContent(null);
  }, [car, setRightPanelContent, user]);

  const handleSave = () => {
    if (!user || !car) return;
    toggleSave.mutate({
      locationId: car.id,
      locationType: "car",
      isSaved: !!isSaved,
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-[400px] w-full rounded-xl" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    );
  }

  if (error || !car) {
    return (
      <div className="p-6">
        <Link to="/cars" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Cars
        </Link>
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground">Car not found</p>
          <Button asChild className="mt-4">
            <Link to="/cars">Browse Cars</Link>
          </Button>
        </div>
      </div>
    );
  }

  const mainImage = car.images?.[0] || "/placeholder.svg";
  const title = `${car.year || ""} ${car.make} ${car.model}`.trim();

  return (
    <div className="p-6 max-w-4xl">
      {/* Back Link */}
      <Link to="/cars" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Cars
      </Link>

      {/* Image Gallery */}
      <div className="relative rounded-xl overflow-hidden mb-6">
        <img
          src={mainImage}
          alt={title}
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
        {car.featured && (
          <Badge className="absolute top-4 left-4 bg-primary">
            Featured
          </Badge>
        )}
      </div>

      {/* Title & Info */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          {car.vehicle_type && (
            <Badge variant="secondary">{car.vehicle_type}</Badge>
          )}
          {car.transmission && (
            <Badge variant="outline">{car.transmission}</Badge>
          )}
        </div>
        <h1 className="text-2xl md:text-3xl font-display font-bold mb-2">{title}</h1>
        <div className="flex items-center gap-4 text-muted-foreground">
          {car.rental_company && (
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{car.rental_company}</span>
            </div>
          )}
          {car.rating && (
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium text-foreground">{car.rating}</span>
              <span>({car.review_count || 0} reviews)</span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="flex items-center gap-3 p-4 rounded-xl bg-muted">
          <Users className="w-5 h-5 text-primary" />
          <div>
            <p className="font-medium">{car.seats || "N/A"}</p>
            <p className="text-xs text-muted-foreground">Seats</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-xl bg-muted">
          <Settings2 className="w-5 h-5 text-primary" />
          <div>
            <p className="font-medium">{car.transmission || "N/A"}</p>
            <p className="text-xs text-muted-foreground">Transmission</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-xl bg-muted">
          <Fuel className="w-5 h-5 text-primary" />
          <div>
            <p className="font-medium">{car.fuel_type || "N/A"}</p>
            <p className="text-xs text-muted-foreground">Fuel Type</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-xl bg-muted">
          <Gauge className="w-5 h-5 text-primary" />
          <div>
            <p className="font-medium">{car.doors || "N/A"}</p>
            <p className="text-xs text-muted-foreground">Doors</p>
          </div>
        </div>
      </div>

      <Separator className="my-6" />

      {/* Description */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">About This Car</h2>
        <p className="text-muted-foreground leading-relaxed">
          {car.description || `The ${title} is a reliable ${car.vehicle_type?.toLowerCase() || "vehicle"} perfect for exploring Medellín and its surroundings.`}
        </p>
      </div>

      {/* Features */}
      {car.features && car.features.length > 0 && (
        <>
          <Separator className="my-6" />
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3">Features</h2>
            <div className="flex flex-wrap gap-2">
              {car.features.map((feature: string) => (
                <Badge key={feature} variant="secondary">
                  {feature}
                </Badge>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Included Features */}
      <Separator className="my-6" />
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">What's Included</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            {car.has_ac ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <span className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />
            )}
            <span>Air Conditioning</span>
          </div>
          <div className="flex items-center gap-2">
            {car.has_gps ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <span className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />
            )}
            <span>GPS Navigation</span>
          </div>
          <div className="flex items-center gap-2">
            {car.has_bluetooth ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <span className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />
            )}
            <span>Bluetooth</span>
          </div>
          <div className="flex items-center gap-2">
            {car.insurance_included ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <span className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />
            )}
            <span>Insurance Included</span>
          </div>
          <div className="flex items-center gap-2">
            {car.unlimited_mileage ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <span className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />
            )}
            <span>Unlimited Mileage</span>
          </div>
          <div className="flex items-center gap-2">
            {car.delivery_available ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <span className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />
            )}
            <span>Delivery Available</span>
          </div>
        </div>
      </div>

      {/* Mobile CTA */}
      <div className="md:hidden fixed bottom-20 left-0 right-0 p-4 bg-background border-t">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="font-bold text-lg">${car.price_daily}/day</div>
            <p className="text-xs text-muted-foreground">${car.price_weekly}/week</p>
          </div>
          <Button size="lg" onClick={handleBookNow}>Book Now</Button>
        </div>
      </div>

      {/* Booking Wizard Dialog */}
      <Dialog open={showBookingWizard} onOpenChange={setShowBookingWizard}>
        <DialogContent className="max-w-6xl h-[90vh] p-0 overflow-hidden">
          <CarBookingWizardPremium 
            car={{
              id: car.id,
              make: car.make,
              model: car.model,
              year: car.year,
              price_daily: car.price_daily,
              price_weekly: car.price_weekly,
              deposit_amount: car.deposit_amount,
              insurance_included: car.insurance_included,
              primary_image_url: car.images?.[0],
              fuel_type: car.fuel_type,
              transmission: car.transmission,
            }}
            onComplete={() => setShowBookingWizard(false)}
            onCancel={() => setShowBookingWizard(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function CarDetail() {
  return (
    <ThreePanelLayout>
      <CarDetailContent />
    </ThreePanelLayout>
  );
}
