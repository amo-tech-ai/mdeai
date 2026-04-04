import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { 
  Search, 
  MapPin, 
  Calendar, 
  MessageCircle, 
  CheckCircle2,
  ArrowRight 
} from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Discover",
    description: "Explore curated restaurants, events, apartments, and car rentals across Medellín's vibrant neighborhoods.",
    features: ["Browse by category", "Filter by location", "See ratings & reviews"]
  },
  {
    icon: MapPin,
    title: "Plan",
    description: "Create personalized trips with our visual itinerary builder. Drag, drop, and optimize your route.",
    features: ["Day-by-day planning", "Route optimization", "Travel time estimates"]
  },
  {
    icon: Calendar,
    title: "Book",
    description: "Reserve tables, apartments, cars, and event tickets directly through our platform.",
    features: ["Instant confirmation", "Secure payments", "Manage all bookings"]
  },
  {
    icon: MessageCircle,
    title: "Concierge",
    description: "Get AI-powered recommendations tailored to your preferences. Ask anything about Medellín.",
    features: ["24/7 AI assistant", "Local insights", "Personalized suggestions"]
  }
];

export default function HowItWorks() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            to="/"
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
          >
            <BrandLogo variant="nav" />
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/how-it-works" className="text-foreground font-medium">How It Works</Link>
            <Link to="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
            <Link to="/explore" className="text-muted-foreground hover:text-foreground transition-colors">Explore</Link>
            <Button asChild>
              <Link to="/signup">Get Started</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            Your Complete Guide to<br />
            <span className="text-primary">Medellín</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            From discovering hidden gems to booking your perfect stay, we make exploring Medellín effortless.
          </p>
          <Button size="lg" asChild>
            <Link to="/signup">
              Start Exploring <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Steps */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            Four Simple Steps
          </h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <Card key={step.title} className="relative overflow-hidden group hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="absolute top-4 right-4 text-6xl font-bold text-muted/20">
                    {index + 1}
                  </div>
                  <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <step.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground mb-4">{step.description}</p>
                  <ul className="space-y-2">
                    {step.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Experience Medellín?
          </h2>
          <p className="text-xl opacity-90 max-w-2xl mx-auto mb-8">
            Join thousands of travelers who've discovered the magic of Medellín with our platform.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/signup">Create Free Account</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary" asChild>
              <Link to="/explore">Browse Listings</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-6 justify-center text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <Link to="/how-it-works" className="hover:text-foreground transition-colors">How It Works</Link>
            <Link to="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
          </div>
          <p className="text-center text-sm text-muted-foreground mt-4">
            © {new Date().getFullYear()} mdeai.co. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}