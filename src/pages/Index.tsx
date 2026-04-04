import { Link } from "react-router-dom";
import { ArrowRight, Home, Utensils, Calendar, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { categories } from "@/lib/mockData";
import { PlaceCard } from "@/components/places/PlaceCard";
import { HeroSection } from "@/components/home/HeroSection";
import { GetInspiredSlider } from "@/components/home/GetInspiredSlider";
import { AIFeaturesSection } from "@/components/home/AIFeaturesSection";
import { useFeaturedPlaces } from "@/hooks/useFeaturedPlaces";
import { Skeleton } from "@/components/ui/skeleton";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { BrandLogo } from "@/components/layout/BrandLogo";

const categoryIcons = {
  apartments: Home,
  restaurants: Utensils,
  events: Calendar,
  cars: Car,
};

export default function Index() {
  const { data: featuredPlaces, isLoading: placesLoading } = useFeaturedPlaces(4);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Spacer for fixed header (matches logo + py-4) */}
      <div className="h-[88px] sm:h-[96px] md:h-[104px]" />

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
      <footer className="bg-foreground text-background py-14 md:py-16">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-10 md:gap-x-10 lg:gap-x-12 mb-12 items-start">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1 space-y-4 max-w-sm md:max-w-none">
              <BrandLogo variant="footer" />
              <p className="text-sm leading-relaxed text-background/70">
                Your AI-powered guide to the City of Eternal Spring.
              </p>
            </div>

            {/* Explore */}
            <div className="min-w-0">
              <p className="font-sans text-xs font-semibold uppercase tracking-wider text-background/90 mb-4">
                Explore
              </p>
              <ul className="space-y-2.5 text-sm text-background/70">
                <li>
                  <Link to="/apartments" className="hover:text-background transition-colors">
                    Apartments
                  </Link>
                </li>
                <li>
                  <Link to="/restaurants" className="hover:text-background transition-colors">
                    Restaurants
                  </Link>
                </li>
                <li>
                  <Link to="/events" className="hover:text-background transition-colors">
                    Events
                  </Link>
                </li>
                <li>
                  <Link to="/cars" className="hover:text-background transition-colors">
                    Car Rentals
                  </Link>
                </li>
              </ul>
            </div>

            {/* Features */}
            <div className="min-w-0">
              <p className="font-sans text-xs font-semibold uppercase tracking-wider text-background/90 mb-4">
                Features
              </p>
              <ul className="space-y-2.5 text-sm text-background/70">
                <li>
                  <Link to="/concierge" className="hover:text-background transition-colors">
                    AI Concierge
                  </Link>
                </li>
                <li>
                  <Link to="/trips" className="hover:text-background transition-colors">
                    Trip Planning
                  </Link>
                </li>
                <li>
                  <Link to="/bookings" className="hover:text-background transition-colors">
                    Bookings
                  </Link>
                </li>
                <li>
                  <Link to="/saved" className="hover:text-background transition-colors">
                    Saved Places
                  </Link>
                </li>
              </ul>
            </div>

            {/* Account */}
            <div className="min-w-0">
              <p className="font-sans text-xs font-semibold uppercase tracking-wider text-background/90 mb-4">
                Account
              </p>
              <ul className="space-y-2.5 text-sm text-background/70">
                <li>
                  <Link to="/login" className="hover:text-background transition-colors">
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link to="/signup" className="hover:text-background transition-colors">
                    Create Account
                  </Link>
                </li>
                <li>
                  <Link to="/onboarding" className="hover:text-background transition-colors">
                    Get Started
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-10 border-t border-background/15 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm text-background/55">
            <p>© {new Date().getFullYear()} mdeai.co. Made in the City of Eternal Spring.</p>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <Link to="/how-it-works" className="hover:text-background transition-colors">
                How It Works
              </Link>
              <Link to="/pricing" className="hover:text-background transition-colors">
                Pricing
              </Link>
              <Link to="/privacy" className="hover:text-background transition-colors">
                Privacy
              </Link>
              <Link to="/terms" className="hover:text-background transition-colors">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
