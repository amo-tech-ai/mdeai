import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
// Gadget client + provider are NO longer eager-imported here. They live
// inside <CoffeeShell> (lazy-loaded below) so the ~24 KB gzip gadget
// chunk only ships on `/coffee*` routes. See vite.config.ts manualChunks.
import { AuthProvider } from "@/hooks/useAuth";
import { TripProvider } from "@/context/TripContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { FloatingChatWidget } from "@/components/chat/FloatingChatWidget";

// EAGER imports — only the routes most likely to load on first paint:
//   • Home    — every anonymous landing hits this.
//   • NotFound — catch-all needs to be available even when chunks fail.
// Everything else lazy-loads behind a Suspense boundary so the entry
// chunk stays small. See vite.config.ts for the vendor split.
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";

// LAZY routes — React.lazy creates a separate chunk per import, named
// after the source file (e.g. `ApartmentDetail-<hash>.js`). Default-
// export pages can use the simple form; named exports need the
// `.then(m => ({ default: m.X }))` shim.
const ChatCanvas = lazy(() =>
  import("@/components/chat/ChatCanvas").then((m) => ({ default: m.ChatCanvas })),
);
const Index = lazy(() => import("./pages/Index"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Explore = lazy(() => import("./pages/Explore"));
const Apartments = lazy(() => import("./pages/Apartments"));
const ApartmentDetail = lazy(() => import("./pages/ApartmentDetail"));
const Rentals = lazy(() => import("./pages/Rentals"));
const Coffee = lazy(() => import("./pages/Coffee"));
const CoffeeDetail = lazy(() => import("./pages/CoffeeDetail"));
// CoffeeShell wraps `/coffee*` routes with <GadgetProvider>. Lazy so
// the gadget vendor chunk is only fetched when a user lands on coffee.
const CoffeeShell = lazy(() => import("./components/coffee/CoffeeShell"));
const Cars = lazy(() => import("./pages/Cars"));
const CarDetail = lazy(() => import("./pages/CarDetail"));
const Restaurants = lazy(() => import("./pages/Restaurants"));
const RestaurantDetail = lazy(() => import("./pages/RestaurantDetail"));
const Events = lazy(() => import("./pages/Events"));
const EventDetail = lazy(() => import("./pages/EventDetail"));
const PlaceDetail = lazy(() => import("./pages/PlaceDetail"));
const Saved = lazy(() => import("./pages/Saved"));
const Collections = lazy(() => import("./pages/Collections"));
const Trips = lazy(() => import("./pages/Trips"));
const TripDetail = lazy(() => import("./pages/TripDetail"));
const TripNew = lazy(() => import("./pages/TripNew"));
const Bookings = lazy(() => import("./pages/Bookings"));
const Concierge = lazy(() => import("./pages/Concierge"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Sitemap = lazy(() => import("./pages/Sitemap"));
const HowItWorks = lazy(() => import("./pages/HowItWorks"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Notifications = lazy(() => import("./pages/Notifications"));
// Host pages — landlord V1. Lazy so the host bundle is zero cost on the
// renter side. RoleProtectedRoute lands D7; for D2 the route is gated
// inside the page (anon -> /login, renter -> /dashboard, landlord -> ok).
const HostOnboarding = lazy(() => import("./pages/host/Onboarding"));
const HostListingNew = lazy(() => import("./pages/host/ListingNew"));
const HostDashboard = lazy(() => import("./pages/host/Dashboard"));
const HostLeads = lazy(() => import("./pages/host/Leads"));
const HostLeadDetail = lazy(() => import("./pages/host/LeadDetail"));
const HostEventNew = lazy(() => import("./pages/host/HostEventNew"));
const HostEventDashboard = lazy(() => import("./pages/host/HostEventDashboard"));
// Buyer ticket pages (task 008) — lazy so the qrcode chunk only ships when needed.
const MyTickets = lazy(() => import("./pages/me/MyTickets"));
const TicketDetail = lazy(() => import("./pages/me/TicketDetail"));
// Staff check-in PWA (task 007) — public route; staff JWT is the auth.
const StaffCheckIn = lazy(() => import("./pages/staff/StaffCheckIn"));
// Contest voting pages (task 012) — mobile-first, lazy so the chunk is zero cost elsewhere.
const ContestVote = lazy(() => import("./pages/contest/Vote"));
// Admin pages — default exports per file, lazy-loaded individually so
// the admin bundle only ships when an admin actually navigates here.
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminApartments = lazy(() => import("./pages/admin/AdminApartments"));
const AdminRestaurants = lazy(() => import("./pages/admin/AdminRestaurants"));
const AdminEvents = lazy(() => import("./pages/admin/AdminEvents"));
const AdminCars = lazy(() => import("./pages/admin/AdminCars"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));

const queryClient = new QueryClient();

/**
 * Full-screen Suspense fallback. Intentionally minimal — most lazy
 * chunks resolve in <300 ms on a warm cache, so a heavy skeleton would
 * cause more layout shift than the spinner. The container has the
 * background class so cold-load doesn't flash white.
 */
function RouteFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" aria-label="Loading" />
    </div>
  );
}

/**
 * Render the FloatingChatWidget on every route EXCEPT the chat-canvas pages.
 * Canvas pages (`/` and future `/c/:id`) already have chat as their primary
 * surface — a floating widget would be redundant and confusing.
 */
function ConditionalFloatingChat() {
  const { pathname } = useLocation();
  if (pathname === "/" || pathname.startsWith("/c/")) return null;
  return <FloatingChatWidget />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <TripProvider>
          <Suspense fallback={<RouteFallback />}>
          <Routes>
            {/* Public marketing homepage — logged-in users get
                <Navigate to="/chat" replace /> inside <Home>. */}
            <Route path="/" element={<Home />} />
            {/* Chat-as-app — anon (3-msg gate) + authed both supported.
                Auto-fires saved pending prompt when URL is /chat?send=pending. */}
            <Route path="/chat" element={<ChatCanvas defaultTab="concierge" />} />
            {/* Legacy alias; kept reachable. */}
            <Route path="/welcome" element={<Index />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/onboarding" element={<Onboarding />} />
            {/* Landlord V1 — see tasks/plan/06-landlord-v1-30day.md §5.1.
                D2: post-signup landing only. D3: 3-step onboarding wizard.
                D7: full host shell (HostShell + HostLeftNav + dashboard). */}
            <Route path="/host/onboarding" element={<HostOnboarding />} />
            {/* D4: 4-step listing wizard. Steps 1-3 functional; Step 4 + submit land D5. */}
            <Route path="/host/listings/new" element={<HostListingNew />} />
            {/* D7: host dashboard — landlord home, listings list, leads CTA. */}
            <Route path="/host/dashboard" element={<HostDashboard />} />
            {/* D9: leads inbox. D10 detail page. */}
            <Route path="/host/leads" element={<HostLeads />} />
            <Route path="/host/leads/:id" element={<HostLeadDetail />} />
            {/* Phase 1 events MVP — task 002 organizer wizard */}
            <Route path="/host/event/new" element={<HostEventNew />} />
            <Route path="/host/event/:id" element={<HostEventDashboard />} />
            {/* D7: /host/ alias → dashboard */}
            <Route path="/host" element={<Navigate to="/host/dashboard" replace />} />
            {/* Marketing Routes */}
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/apartments" element={<Apartments />} />
            <Route path="/apartments/:id" element={<ApartmentDetail />} />
            <Route path="/rentals" element={<Rentals />} />
            {/* Coffee routes share <GadgetProvider> via the shell — see
                src/components/coffee/CoffeeShell.tsx for rationale. The
                shell + the gadget vendor chunk are lazy-loaded so they
                cost zero on every other route. */}
            <Route element={<CoffeeShell />}>
              <Route path="/coffee" element={<Coffee />} />
              <Route path="/coffee/:handle" element={<CoffeeDetail />} />
            </Route>
            <Route path="/cars" element={<Cars />} />
            <Route path="/cars/:id" element={<CarDetail />} />
            <Route path="/restaurants" element={<Restaurants />} />
            <Route path="/restaurants/:id" element={<RestaurantDetail />} />
            <Route path="/events" element={<Events />} />
            <Route path="/events/:id" element={<EventDetail />} />
            {/* Contest voting (task 012) — public, mobile-first */}
            <Route path="/vote/:slug" element={<ContestVote />} />
            <Route path="/:type/:id" element={<PlaceDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route
              path="/saved"
              element={
                <ProtectedRoute>
                  <Saved />
                </ProtectedRoute>
              }
            />
            <Route
              path="/collections"
              element={
                <ProtectedRoute>
                  <Collections />
                </ProtectedRoute>
              }
            />
            <Route
              path="/trips"
              element={
                <ProtectedRoute>
                  <Trips />
                </ProtectedRoute>
              }
            />
            <Route
              path="/trips/new"
              element={
                <ProtectedRoute>
                  <TripNew />
                </ProtectedRoute>
              }
            />
            <Route
              path="/trips/:id"
              element={
                <ProtectedRoute>
                  <TripDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bookings"
              element={
                <ProtectedRoute>
                  <Bookings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <Notifications />
                </ProtectedRoute>
              }
            />
            <Route path="/concierge" element={<Concierge />} />
            <Route path="/sitemap" element={<Sitemap />} />
            {/* Buyer ticket routes (task 008).
                /me/tickets — authenticated list (ProtectedRoute).
                /me/tickets/:id — fullscreen QR, public (handles both auth + anon ?token= path). */}
            <Route
              path="/me/tickets"
              element={
                <ProtectedRoute>
                  <MyTickets />
                </ProtectedRoute>
              }
            />
            <Route path="/me/tickets/:id" element={<TicketDetail />} />
            {/* Staff check-in PWA — public (task 007). Auth via ?token= staff JWT. */}
            <Route path="/staff/check-in/:event_id" element={<StaffCheckIn />} />
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/apartments" element={<AdminApartments />} />
            <Route path="/admin/restaurants" element={<AdminRestaurants />} />
            <Route path="/admin/events" element={<AdminEvents />} />
            <Route path="/admin/cars" element={<AdminCars />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
            {/* Floating widget only on non-chat routes; the canvas at `/` IS the chat. */}
            <ConditionalFloatingChat />
          </TripProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
