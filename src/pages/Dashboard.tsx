import { useEffect } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import {
  Building2,
  Car,
  UtensilsCrossed,
  Calendar,
  MapPin,
  Sparkles,
  MessageSquare,
  Clock,
  TrendingUp,
  Heart,
  Sun,
  CloudSun,
} from "lucide-react";
import { ThreePanelLayout, useThreePanelContext } from "@/components/explore/ThreePanelLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useBookings } from "@/hooks/useBookings";
import { useFeaturedApartments } from "@/hooks/useApartments";
import { useFeaturedCars } from "@/hooks/useCars";
import { useFeaturedRestaurants } from "@/hooks/useRestaurants";
import { useUpcomingEvents } from "@/hooks/useEvents";

function DashboardContent() {
  const { user } = useAuth();
  const { data: bookingsData, isLoading: bookingsLoading } = useBookings({});
  const { data: apartments = [], isLoading: apartmentsLoading } = useFeaturedApartments(3);
  const { data: cars = [], isLoading: carsLoading } = useFeaturedCars(3);
  const { data: restaurants = [], isLoading: restaurantsLoading } = useFeaturedRestaurants(3);
  const { data: eventsData, isLoading: eventsLoading } = useUpcomingEvents(3);
  const { setRightPanelContent } = useThreePanelContext();

  const upcomingBookings = bookingsData?.bookings?.slice(0, 5) || [];
  const upcomingEvents = eventsData?.events || [];

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const userName = user?.user_metadata?.full_name?.split(" ")[0] || "Explorer";

  // Set right panel content
  useEffect(() => {
    setRightPanelContent(
      <div className="p-6 space-y-6">
        {/* AI Picks */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Today's AI Picks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Based on your preferences and the weather, here are our top suggestions for today.
            </p>
            <div className="space-y-2">
              <div className="p-3 rounded-lg bg-background border">
                <p className="font-medium text-sm">🌤️ Perfect day for El Poblado</p>
                <p className="text-xs text-muted-foreground">Great weather for outdoor cafés</p>
              </div>
              <div className="p-3 rounded-lg bg-background border">
                <p className="font-medium text-sm">🍽️ Try La Octava tonight</p>
                <p className="text-xs text-muted-foreground">Matches your Colombian cuisine interest</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weather Widget */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sun className="w-5 h-5 text-yellow-500" />
              Medellín Weather
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold">24°C</p>
                <p className="text-sm text-muted-foreground">Partly Cloudy</p>
              </div>
              <CloudSun className="w-12 h-12 text-yellow-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Great day for exploring outdoors!
            </p>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/trips/new">
                <MapPin className="w-4 h-4 mr-2" />
                Plan a New Trip
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/concierge">
                <MessageSquare className="w-4 h-4 mr-2" />
                Chat with AI Concierge
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/saved">
                <Heart className="w-4 h-4 mr-2" />
                View Saved Places
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );

    return () => setRightPanelContent(null);
  }, [setRightPanelContent]);

  return (
    <div className="p-6 space-y-8">
      {/* Welcome Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-display font-bold">
          {getGreeting()}, {userName}! 👋
        </h1>
        <p className="text-muted-foreground">
          {format(new Date(), "EEEE, MMMM d, yyyy")} • Here's your personalized overview
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{upcomingBookings.length}</p>
                <p className="text-xs text-muted-foreground">Upcoming</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{apartments.length + cars.length}</p>
                <p className="text-xs text-muted-foreground">Featured</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Clock className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{upcomingEvents.length}</p>
                <p className="text-xs text-muted-foreground">Events</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Sparkles className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">AI</p>
                <p className="text-xs text-muted-foreground">Ready</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Bookings */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Upcoming Bookings</h2>
          <Button asChild variant="ghost" size="sm">
            <Link to="/bookings">View All</Link>
          </Button>
        </div>
        {bookingsLoading ? (
          <div className="grid gap-4">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : upcomingBookings.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No upcoming bookings</p>
              <Button asChild variant="link" className="mt-2">
                <Link to="/apartments">Explore apartments</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {upcomingBookings.map((booking) => (
              <Card key={booking.id} className="hover:shadow-md transition-shadow">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-primary/10">
                        {booking.booking_type === "apartment" && <Building2 className="w-5 h-5 text-primary" />}
                        {booking.booking_type === "car" && <Car className="w-5 h-5 text-primary" />}
                        {booking.booking_type === "restaurant" && <UtensilsCrossed className="w-5 h-5 text-primary" />}
                        {booking.booking_type === "event" && <Calendar className="w-5 h-5 text-primary" />}
                      </div>
                      <div>
                        <p className="font-medium">{booking.resource_title}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(booking.start_date), "MMM d, yyyy")}
                          {booking.start_time && ` at ${booking.start_time}`}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">{booking.status}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Quick Actions Grid */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Explore Medellín</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Link to="/apartments" className="group">
            <Card className="hover:shadow-md transition-all group-hover:border-primary/50">
              <CardContent className="py-6 text-center">
                <Building2 className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="font-medium">Apartments</p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/cars" className="group">
            <Card className="hover:shadow-md transition-all group-hover:border-primary/50">
              <CardContent className="py-6 text-center">
                <Car className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="font-medium">Cars</p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/restaurants" className="group">
            <Card className="hover:shadow-md transition-all group-hover:border-primary/50">
              <CardContent className="py-6 text-center">
                <UtensilsCrossed className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="font-medium">Restaurants</p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/events" className="group">
            <Card className="hover:shadow-md transition-all group-hover:border-primary/50">
              <CardContent className="py-6 text-center">
                <Calendar className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="font-medium">Events</p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/trips/new" className="group">
            <Card className="hover:shadow-md transition-all group-hover:border-primary/50">
              <CardContent className="py-6 text-center">
                <MapPin className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="font-medium">Plan Trip</p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/concierge" className="group">
            <Card className="hover:shadow-md transition-all group-hover:border-primary/50">
              <CardContent className="py-6 text-center">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="font-medium">AI Chat</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </section>

      {/* Featured Recommendations */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Recommended For You
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {/* Featured Apartments */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Top Apartments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {apartmentsLoading ? (
                <Skeleton className="h-20 w-full" />
              ) : apartments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No featured apartments</p>
              ) : (
                <div className="space-y-2">
                  {apartments.slice(0, 2).map((apt) => (
                    <Link
                      key={apt.id}
                      to={`/apartments/${apt.id}`}
                      className="block p-2 rounded-lg hover:bg-muted transition-colors"
                    >
                      <p className="font-medium text-sm line-clamp-1">{apt.title}</p>
                      <p className="text-xs text-muted-foreground">
                        ${apt.price_monthly?.toLocaleString()}/mo • {apt.neighborhood}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Featured Cars */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Car className="w-4 h-4" />
                Top Cars
              </CardTitle>
            </CardHeader>
            <CardContent>
              {carsLoading ? (
                <Skeleton className="h-20 w-full" />
              ) : cars.length === 0 ? (
                <p className="text-sm text-muted-foreground">No featured cars</p>
              ) : (
                <div className="space-y-2">
                  {cars.slice(0, 2).map((car) => (
                    <Link
                      key={car.id}
                      to={`/cars/${car.id}`}
                      className="block p-2 rounded-lg hover:bg-muted transition-colors"
                    >
                      <p className="font-medium text-sm line-clamp-1">
                        {car.make} {car.model}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ${car.price_daily}/day • {car.year}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Featured Restaurants */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4" />
                Top Restaurants
              </CardTitle>
            </CardHeader>
            <CardContent>
              {restaurantsLoading ? (
                <Skeleton className="h-20 w-full" />
              ) : restaurants.length === 0 ? (
                <p className="text-sm text-muted-foreground">No featured restaurants</p>
              ) : (
                <div className="space-y-2">
                  {restaurants.slice(0, 2).map((restaurant) => (
                    <Link
                      key={restaurant.id}
                      to={`/restaurants/${restaurant.id}`}
                      className="block p-2 rounded-lg hover:bg-muted transition-colors"
                    >
                      <p className="font-medium text-sm line-clamp-1">{restaurant.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {restaurant.cuisine_types?.slice(0, 2).join(", ")}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

export default function Dashboard() {
  return (
    <ThreePanelLayout>
      <DashboardContent />
    </ThreePanelLayout>
  );
}
