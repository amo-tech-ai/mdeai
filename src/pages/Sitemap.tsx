import { Link } from "react-router-dom";
import {
  Home,
  Compass,
  Building2,
  Car,
  UtensilsCrossed,
  Calendar,
  Heart,
  FolderHeart,
  Map,
  Ticket,
  MessageSquare,
  LogIn,
  UserPlus,
  KeyRound,
  RotateCcw,
  LayoutDashboard,
  Users,
  Lock,
  ExternalLink,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BrandLogo } from "@/components/layout/BrandLogo";

interface SitemapLink {
  path: string;
  label: string;
  description: string;
  icon: React.ElementType;
  isProtected?: boolean;
  badge?: string;
}

interface SitemapSection {
  title: string;
  description: string;
  links: SitemapLink[];
}

const sitemapData: SitemapSection[] = [
  {
    title: "Discovery",
    description: "Explore Medellín's best experiences",
    links: [
      {
        path: "/",
        label: "Home",
        description: "Landing page with hero and featured content",
        icon: Home,
      },
      {
        path: "/explore",
        label: "Explore",
        description: "Unified discovery with map and filters",
        icon: Compass,
      },
      {
        path: "/onboarding",
        label: "Onboarding",
        description: "Personalization wizard for new users",
        icon: Sparkles,
      },
    ],
  },
  {
    title: "Apartments",
    description: "Find your perfect stay",
    links: [
      {
        path: "/apartments",
        label: "All Apartments",
        description: "Browse apartment listings with filters",
        icon: Building2,
      },
      {
        path: "/apartments/demo",
        label: "Apartment Detail",
        description: "Individual apartment with booking wizard",
        icon: Building2,
        badge: "Demo ID",
      },
    ],
  },
  {
    title: "Car Rentals",
    description: "Wheels for your adventure",
    links: [
      {
        path: "/cars",
        label: "All Cars",
        description: "Vehicle rentals with specifications",
        icon: Car,
      },
      {
        path: "/cars/demo",
        label: "Car Detail",
        description: "Car details with premium booking wizard",
        icon: Car,
        badge: "Demo ID",
      },
    ],
  },
  {
    title: "Restaurants",
    description: "Discover culinary experiences",
    links: [
      {
        path: "/restaurants",
        label: "All Restaurants",
        description: "Restaurant discovery with dietary filters",
        icon: UtensilsCrossed,
      },
      {
        path: "/restaurants/demo",
        label: "Restaurant Detail",
        description: "Menu, hours, and reservation wizard",
        icon: UtensilsCrossed,
        badge: "Demo ID",
      },
    ],
  },
  {
    title: "Events",
    description: "What's happening in Medellín",
    links: [
      {
        path: "/events",
        label: "All Events",
        description: "Event calendar with category filters",
        icon: Calendar,
      },
      {
        path: "/events/demo",
        label: "Event Detail",
        description: "Event info with ticket booking wizard",
        icon: Calendar,
        badge: "Demo ID",
      },
    ],
  },
  {
    title: "User Features",
    description: "Personalized trip planning",
    links: [
      {
        path: "/saved",
        label: "Saved Places",
        description: "Your favorite discoveries",
        icon: Heart,
        isProtected: true,
      },
      {
        path: "/collections",
        label: "Collections",
        description: "Organized groups of saved places",
        icon: FolderHeart,
        isProtected: true,
      },
      {
        path: "/trips",
        label: "My Trips",
        description: "Trip itinerary management",
        icon: Map,
        isProtected: true,
      },
      {
        path: "/trips/new",
        label: "Create Trip",
        description: "Start planning a new trip",
        icon: Map,
        isProtected: true,
      },
      {
        path: "/bookings",
        label: "My Bookings",
        description: "All reservations and confirmations",
        icon: Ticket,
        isProtected: true,
      },
    ],
  },
  {
    title: "AI Concierge",
    description: "Intelligent travel assistant",
    links: [
      {
        path: "/concierge",
        label: "AI Concierge",
        description: "Chat with AI for trip planning",
        icon: MessageSquare,
        badge: "AI Powered",
      },
    ],
  },
  {
    title: "Authentication",
    description: "Account access and security",
    links: [
      {
        path: "/login",
        label: "Login",
        description: "Sign in to your account",
        icon: LogIn,
      },
      {
        path: "/signup",
        label: "Sign Up",
        description: "Create a new account",
        icon: UserPlus,
      },
      {
        path: "/forgot-password",
        label: "Forgot Password",
        description: "Reset your password via email",
        icon: KeyRound,
      },
      {
        path: "/reset-password",
        label: "Reset Password",
        description: "Set a new password",
        icon: RotateCcw,
      },
    ],
  },
  {
    title: "Admin Dashboard",
    description: "Platform management (requires admin role)",
    links: [
      {
        path: "/admin",
        label: "Admin Home",
        description: "Dashboard overview and stats",
        icon: LayoutDashboard,
        isProtected: true,
      },
      {
        path: "/admin/apartments",
        label: "Manage Apartments",
        description: "CRUD for apartment listings",
        icon: Building2,
        isProtected: true,
      },
      {
        path: "/admin/restaurants",
        label: "Manage Restaurants",
        description: "CRUD for restaurant listings",
        icon: UtensilsCrossed,
        isProtected: true,
      },
      {
        path: "/admin/events",
        label: "Manage Events",
        description: "CRUD for event listings",
        icon: Calendar,
        isProtected: true,
      },
      {
        path: "/admin/cars",
        label: "Manage Cars",
        description: "CRUD for car rentals",
        icon: Car,
        isProtected: true,
      },
      {
        path: "/admin/users",
        label: "Manage Users",
        description: "User roles and permissions",
        icon: Users,
        isProtected: true,
      },
    ],
  },
];

function SitemapCard({ link }: { link: SitemapLink }) {
  const Icon = link.icon;

  return (
    <Link
      to={link.path}
      className="group flex items-start gap-4 p-4 rounded-xl border border-border bg-card hover:shadow-elevated hover:-translate-y-0.5 transition-all duration-300"
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
            {link.label}
          </h3>
          {link.isProtected && (
            <Lock className="w-3.5 h-3.5 text-muted-foreground" />
          )}
          {link.badge && (
            <Badge variant="secondary" className="text-xs">
              {link.badge}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
          {link.description}
        </p>
        <code className="text-xs text-muted-foreground/70 font-mono mt-1 block">
          {link.path}
        </code>
      </div>
      <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
    </Link>
  );
}

export default function Sitemap() {
  const totalPages = sitemapData.reduce(
    (acc, section) => acc + section.links.length,
    0
  );
  const protectedPages = sitemapData.reduce(
    (acc, section) =>
      acc + section.links.filter((link) => link.isProtected).length,
    0
  );
  const publicPages = totalPages - protectedPages;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back to Home</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
            >
              <BrandLogo variant="nav" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 md:py-24 gradient-hero text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Site Map
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-8">
            Complete overview of all pages and screens on mdeai.co
          </p>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 flex-wrap">
            <div className="text-center">
              <div className="text-3xl font-bold">{totalPages}</div>
              <div className="text-sm text-primary-foreground/70">
                Total Pages
              </div>
            </div>
            <Separator
              orientation="vertical"
              className="h-12 bg-primary-foreground/20 hidden sm:block"
            />
            <div className="text-center">
              <div className="text-3xl font-bold">{publicPages}</div>
              <div className="text-sm text-primary-foreground/70">
                Public Pages
              </div>
            </div>
            <Separator
              orientation="vertical"
              className="h-12 bg-primary-foreground/20 hidden sm:block"
            />
            <div className="text-center">
              <div className="text-3xl font-bold">{protectedPages}</div>
              <div className="text-sm text-primary-foreground/70">
                Protected Pages
              </div>
            </div>
            <Separator
              orientation="vertical"
              className="h-12 bg-primary-foreground/20 hidden sm:block"
            />
            <div className="text-center">
              <div className="text-3xl font-bold">
                {sitemapData.length}
              </div>
              <div className="text-sm text-primary-foreground/70">
                Sections
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="space-y-12">
          {sitemapData.map((section, idx) => (
            <section key={section.title}>
              <div className="mb-6">
                <h2 className="font-display text-2xl font-semibold text-foreground">
                  {section.title}
                </h2>
                <p className="text-muted-foreground mt-1">
                  {section.description}
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {section.links.map((link) => (
                  <SitemapCard key={link.path} link={link} />
                ))}
              </div>
              {idx < sitemapData.length - 1 && (
                <Separator className="mt-12" />
              )}
            </section>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-16 p-6 rounded-xl border border-border bg-muted/30">
          <h3 className="font-display text-lg font-semibold mb-4">Legend</h3>
          <div className="flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                Requires authentication
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                Demo ID
              </Badge>
              <span className="text-muted-foreground">
                Uses placeholder ID for preview
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                AI Powered
              </Badge>
              <span className="text-muted-foreground">
                Features AI assistance
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} mdeai.co. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
