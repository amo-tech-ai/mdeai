import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Star,
  Heart,
  Share2,
  Clock,
  Phone,
  Globe,
  CheckCircle,
  Leaf,
  DollarSign,
  ExternalLink,
} from "lucide-react";
import { ThreePanelLayout, useThreePanelContext } from "@/components/explore/ThreePanelLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRestaurant } from "@/hooks/useRestaurants";
import { useToggleSave, useIsSaved } from "@/hooks/useSavedPlaces";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import restaurantPlaceholder from "@/assets/restaurant-1.jpg";

const priceLevelDisplay = (level: number) => "$".repeat(level);

const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

function RestaurantDetailRightPanel({ restaurant }: { restaurant: any }) {
  const today = DAY_NAMES[new Date().getDay()];
  const todayHours = restaurant.hours_of_operation?.[today];

  return (
    <div className="space-y-6">
      {/* Reserve Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Make a Reservation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {priceLevelDisplay(restaurant.price_level)}
            </div>
            <p className="text-sm text-muted-foreground">
              {restaurant.price_level === 1 && "Budget-friendly"}
              {restaurant.price_level === 2 && "Moderate"}
              {restaurant.price_level === 3 && "Upscale"}
              {restaurant.price_level === 4 && "Fine Dining"}
            </p>
          </div>
          <Button className="w-full" size="lg">
            Reserve a Table
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            AI-powered reservations coming soon
          </p>
        </CardContent>
      </Card>

      {/* Today's Hours */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Hours Today</CardTitle>
        </CardHeader>
        <CardContent>
          {todayHours ? (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span>
                {todayHours.open} - {todayHours.close}
              </span>
              {restaurant.is_open_now && (
                <Badge variant="outline" className="ml-auto text-green-600 border-green-600">
                  Open
                </Badge>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Hours not available</p>
          )}
        </CardContent>
      </Card>

      {/* Contact */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Contact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {restaurant.phone && (
            <a
              href={`tel:${restaurant.phone}`}
              className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
            >
              <Phone className="w-4 h-4 text-muted-foreground" />
              {restaurant.phone}
            </a>
          )}
          {restaurant.website && (
            <a
              href={restaurant.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
            >
              <Globe className="w-4 h-4 text-muted-foreground" />
              Visit Website
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function RestaurantDetailContent({
  restaurant,
  isSaved,
  user,
  handleSave,
}: {
  restaurant: any;
  isSaved: boolean | undefined;
  user: any;
  handleSave: () => void;
}) {
  const { setRightPanelContent } = useThreePanelContext();

  useEffect(() => {
    setRightPanelContent(<RestaurantDetailRightPanel restaurant={restaurant} />);
    return () => setRightPanelContent(null);
  }, [restaurant, setRightPanelContent]);

  const mainImage =
    restaurant.primary_image_url || restaurant.images?.[0]?.url || restaurantPlaceholder;

  return (
    <div className="p-6 max-w-4xl">
      {/* Back Link */}
      <Link
        to="/restaurants"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Restaurants
      </Link>

      {/* Image Gallery */}
      <div className="relative rounded-xl overflow-hidden mb-6">
        <img
          src={mainImage}
          alt={restaurant.name}
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
        <div className="absolute top-4 left-4 flex gap-2">
          {restaurant.is_verified && (
            <Badge className="bg-primary">
              <CheckCircle className="w-3 h-3 mr-1" />
              Verified
            </Badge>
          )}
          {restaurant.is_open_now && (
            <Badge variant="secondary" className="bg-green-500 text-white">
              <Clock className="w-3 h-3 mr-1" />
              Open Now
            </Badge>
          )}
        </div>
      </div>

      {/* Title & Location */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-display font-bold mb-2">{restaurant.name}</h1>
        <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
          <div className="flex items-center gap-1">
            <DollarSign className="w-4 h-4" />
            <span className="font-medium text-foreground">
              {priceLevelDisplay(restaurant.price_level)}
            </span>
          </div>
          {restaurant.rating && (
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium text-foreground">{restaurant.rating}</span>
              <span>({restaurant.rating_count || 0} reviews)</span>
            </div>
          )}
          {restaurant.address && (
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{restaurant.city || restaurant.address}</span>
            </div>
          )}
        </div>
      </div>

      {/* Cuisine Types */}
      {restaurant.cuisine_types && restaurant.cuisine_types.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {restaurant.cuisine_types.map((cuisine: string) => (
            <Badge key={cuisine} variant="secondary">
              {cuisine}
            </Badge>
          ))}
        </div>
      )}

      <Separator className="my-6" />

      {/* Description */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">About</h2>
        <p className="text-muted-foreground leading-relaxed">
          {restaurant.description || "No description available."}
        </p>
      </div>

      {/* Dietary Options */}
      {restaurant.dietary_options && restaurant.dietary_options.length > 0 && (
        <>
          <Separator className="my-6" />
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
              <Leaf className="w-5 h-5 text-green-500" />
              Dietary Options
            </h2>
            <div className="flex flex-wrap gap-2">
              {restaurant.dietary_options.map((option: string) => (
                <Badge key={option} variant="outline" className="text-green-600 border-green-600">
                  {option}
                </Badge>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Ambiance */}
      {restaurant.ambiance && restaurant.ambiance.length > 0 && (
        <>
          <Separator className="my-6" />
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3">Ambiance</h2>
            <div className="flex flex-wrap gap-2">
              {restaurant.ambiance.map((vibe: string) => (
                <Badge key={vibe} variant="secondary">
                  {vibe}
                </Badge>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Hours of Operation */}
      {restaurant.hours_of_operation && (
        <>
          <Separator className="my-6" />
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3">Hours</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              {DAY_NAMES.map((day) => {
                const hours = restaurant.hours_of_operation?.[day];
                const isToday = day === DAY_NAMES[new Date().getDay()];
                return (
                  <div
                    key={day}
                    className={cn(
                      "flex justify-between py-2 px-3 rounded-lg",
                      isToday && "bg-primary/10"
                    )}
                  >
                    <span className={cn("capitalize", isToday && "font-medium")}>{day}</span>
                    <span className="text-muted-foreground">
                      {hours ? `${hours.open} - ${hours.close}` : "Closed"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Address */}
      {restaurant.address && (
        <>
          <Separator className="my-6" />
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3">Location</h2>
            <p className="text-muted-foreground">{restaurant.address}</p>
            {restaurant.city && <p className="text-muted-foreground">{restaurant.city}</p>}
          </div>
        </>
      )}

      {/* Mobile CTA */}
      <div className="md:hidden fixed bottom-20 left-0 right-0 p-4 bg-background border-t">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="font-bold text-lg">{priceLevelDisplay(restaurant.price_level)}</div>
            <p className="text-xs text-muted-foreground">
              {restaurant.cuisine_types?.slice(0, 2).join(", ")}
            </p>
          </div>
          <Button size="lg">Reserve a Table</Button>
        </div>
      </div>
    </div>
  );
}

export default function RestaurantDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: restaurant, isLoading, error } = useRestaurant(id!);
  const { user } = useAuth();
  const { data: isSaved } = useIsSaved(id!, "restaurant");
  const toggleSave = useToggleSave();

  const handleSave = () => {
    if (!user || !restaurant) return;
    toggleSave.mutate({
      locationId: restaurant.id,
      locationType: "restaurant",
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

  if (error || !restaurant) {
    return (
      <ThreePanelLayout>
        <div className="p-6">
          <Link
            to="/restaurants"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Restaurants
          </Link>
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">Restaurant not found</p>
            <Button asChild className="mt-4">
              <Link to="/restaurants">Browse Restaurants</Link>
            </Button>
          </div>
        </div>
      </ThreePanelLayout>
    );
  }

  return (
    <ThreePanelLayout>
      <RestaurantDetailContent
        restaurant={restaurant}
        isSaved={isSaved}
        user={user}
        handleSave={handleSave}
      />
    </ThreePanelLayout>
  );
}
