import { Link } from "react-router-dom";
import { ArrowRight, Home, Utensils, Calendar, Car, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { categories } from "@/lib/mockData";
import { PlaceCard } from "@/components/places/PlaceCard";
import { useAuth } from "@/hooks/useAuth";
import { HeroSection } from "@/components/home/HeroSection";
import { GetInspiredSlider } from "@/components/home/GetInspiredSlider";
import { AIFeaturesSection } from "@/components/home/AIFeaturesSection";
import { useFeaturedPlaces } from "@/hooks/useFeaturedPlaces";
import { Skeleton } from "@/components/ui/skeleton";

const categoryIcons = {
  apartments: Home,
  restaurants: Utensils,
  events: Calendar,
  cars: Car,
};

export default function Index() {
  const { data: featuredPlaces, isLoading: placesLoading } = useFeaturedPlaces(4);
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">💚</span>
            <span className="font-display text-xl font-semibold text-foreground italic">
              i love Medellín
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
              Home
            </Link>
            <Link to="/concierge" className="text-muted-foreground hover:text-foreground transition-colors">
              Concierge
            </Link>
            <Link to="/events" className="text-muted-foreground hover:text-foreground transition-colors">
              Events
            </Link>
            <Link to="/apartments" className="text-muted-foreground hover:text-foreground transition-colors">
              Real Estate
            </Link>
            <Link to="/explore" className="text-muted-foreground hover:text-foreground transition-colors">
              Itinerary
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground text-sm hidden sm:inline">
                  {user.email?.split("@")[0]}
                </span>
                <Button variant="ghost" size="sm" onClick={signOut}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Link to="/login">
                <Button size="sm" className="rounded-full">
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Spacer for fixed header */}
      <div className="h-[72px]" />

      {/* Hero Section */}
      <HeroSection />

      {/* Get Inspired Slider */}
      <GetInspiredSlider />

      {/* Categories Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-sm font-medium text-accent uppercase tracking-wider">Explore</p>
            <h2 className="font-display text-3xl font-bold text-foreground mt-2">
              Discover your next adventure
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((category) => {
              const Icon = categoryIcons[category.id];
              return (
                <Link
                  key={category.id}
                  to={`/explore?category=${category.id}`}
                  className="group bg-card rounded-2xl p-6 shadow-card hover:shadow-elevated transition-all duration-300 text-center"
                >
                  <div className="w-14 h-14 mx-auto rounded-xl bg-secondary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="mt-4 font-semibold text-card-foreground">{category.label}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {category.id === "apartments" && "Find your perfect stay"}
                    {category.id === "restaurants" && "Taste the city"}
                    {category.id === "events" && "Never miss a moment"}
                    {category.id === "cars" && "Drive your adventure"}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* AI Features Section */}
      <AIFeaturesSection />

      {/* Featured Places */}
      <section className="py-16 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-sm font-medium text-accent uppercase tracking-wider">Featured</p>
              <h2 className="font-display text-3xl font-bold text-foreground mt-2">
                Popular in Medellín
              </h2>
            </div>
            <Link to="/explore">
              <Button variant="ghost">
                See all
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {placesLoading ? (
              // Loading skeletons
              Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="space-y-3">
                  <Skeleton className="h-48 w-full rounded-xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))
            ) : featuredPlaces && featuredPlaces.length > 0 ? (
              featuredPlaces.map((place, index) => (
                <div
                  key={place.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <PlaceCard place={place} />
                </div>
              ))
            ) : (
              // Empty state - fallback message
              <div className="col-span-full text-center py-8">
                <p className="text-muted-foreground">Check back soon for featured places!</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* AI Concierge Teaser */}
      <section className="py-20 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <p className="text-sm font-medium text-accent uppercase tracking-wider">Coming Soon</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mt-4">
              AI that works for you, not instead of you
            </h2>
            <p className="mt-4 text-primary-foreground/80">
              Our AI concierge will learn your preferences and help you discover places you'll love.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button variant="hero">
                Join Waitlist
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-foreground text-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">💚</span>
                <span className="font-display text-lg font-semibold">I Love Medellín</span>
              </div>
              <p className="text-sm text-muted opacity-80">
                Your AI-powered guide to the City of Eternal Spring.
              </p>
            </div>

            {/* Explore */}
            <div>
              <h4 className="font-semibold mb-4">Explore</h4>
              <ul className="space-y-2 text-sm opacity-80">
                <li><Link to="/apartments" className="hover:opacity-100 transition-opacity">Apartments</Link></li>
                <li><Link to="/restaurants" className="hover:opacity-100 transition-opacity">Restaurants</Link></li>
                <li><Link to="/events" className="hover:opacity-100 transition-opacity">Events</Link></li>
                <li><Link to="/cars" className="hover:opacity-100 transition-opacity">Car Rentals</Link></li>
              </ul>
            </div>

            {/* Features */}
            <div>
              <h4 className="font-semibold mb-4">Features</h4>
              <ul className="space-y-2 text-sm opacity-80">
                <li><Link to="/concierge" className="hover:opacity-100 transition-opacity">AI Concierge</Link></li>
                <li><Link to="/trips" className="hover:opacity-100 transition-opacity">Trip Planning</Link></li>
                <li><Link to="/bookings" className="hover:opacity-100 transition-opacity">Bookings</Link></li>
                <li><Link to="/saved" className="hover:opacity-100 transition-opacity">Saved Places</Link></li>
              </ul>
            </div>

            {/* Account */}
            <div>
              <h4 className="font-semibold mb-4">Account</h4>
              <ul className="space-y-2 text-sm opacity-80">
                <li><Link to="/login" className="hover:opacity-100 transition-opacity">Sign In</Link></li>
                <li><Link to="/signup" className="hover:opacity-100 transition-opacity">Create Account</Link></li>
                <li><Link to="/onboarding" className="hover:opacity-100 transition-opacity">Get Started</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-background/20 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm opacity-60">
              © 2025 I Love Medellín. Made with 💚 in the City of Eternal Spring.
            </p>
            <div className="flex items-center gap-4 text-sm opacity-60">
              <Link to="/how-it-works" className="hover:opacity-100">How It Works</Link>
              <Link to="/pricing" className="hover:opacity-100">Pricing</Link>
              <Link to="/privacy" className="hover:opacity-100">Privacy</Link>
              <Link to="/terms" className="hover:opacity-100">Terms</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
