import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Provider as GadgetProvider } from "@gadgetinc/react";
import { gadgetApi } from "@/integrations/gadget/client";
import { AuthProvider } from "@/hooks/useAuth";
import { TripProvider } from "@/context/TripContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { FloatingChatWidget } from "@/components/chat/FloatingChatWidget";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Onboarding from "./pages/Onboarding";
import Explore from "./pages/Explore";
import Apartments from "./pages/Apartments";
import ApartmentDetail from "./pages/ApartmentDetail";
import Rentals from "./pages/Rentals";
import Coffee from "./pages/Coffee";
import CoffeeDetail from "./pages/CoffeeDetail";
import Cars from "./pages/Cars";
import CarDetail from "./pages/CarDetail";
import Restaurants from "./pages/Restaurants";
import RestaurantDetail from "./pages/RestaurantDetail";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import PlaceDetail from "./pages/PlaceDetail";
import Saved from "./pages/Saved";
import Collections from "./pages/Collections";
import Trips from "./pages/Trips";
import TripDetail from "./pages/TripDetail";
import TripNew from "./pages/TripNew";
import Bookings from "./pages/Bookings";
import Concierge from "./pages/Concierge";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import Sitemap from "./pages/Sitemap";
// Marketing pages
import HowItWorks from "./pages/HowItWorks";
import Pricing from "./pages/Pricing";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Notifications from "./pages/Notifications";
// Admin pages
import {
  AdminDashboard,
  AdminApartments,
  AdminRestaurants,
  AdminEvents,
  AdminCars,
  AdminUsers,
} from "./pages/admin";

const queryClient = new QueryClient();

const App = () => (
  <GadgetProvider api={gadgetApi}>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <TripProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/onboarding" element={<Onboarding />} />
            {/* Marketing Routes */}
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/apartments" element={<Apartments />} />
            <Route path="/apartments/:id" element={<ApartmentDetail />} />
            <Route path="/rentals" element={<Rentals />} />
            <Route path="/coffee" element={<Coffee />} />
            <Route path="/coffee/:handle" element={<CoffeeDetail />} />
            <Route path="/cars" element={<Cars />} />
            <Route path="/cars/:id" element={<CarDetail />} />
            <Route path="/restaurants" element={<Restaurants />} />
            <Route path="/restaurants/:id" element={<RestaurantDetail />} />
            <Route path="/events" element={<Events />} />
            <Route path="/events/:id" element={<EventDetail />} />
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
            {/* Global Floating Chat Widget */}
            <FloatingChatWidget />
          </TripProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </GadgetProvider>
);

export default App;
