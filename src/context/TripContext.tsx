import { createContext, useContext, useState, useCallback, useEffect, ReactNode, type Context } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTrips, useTrip } from "@/hooks/useTrips";
import type { Trip, TripWithItems } from "@/types/trip";

interface TripContextType {
  // Active trip state
  activeTrip: Trip | null;
  activeTripWithItems: TripWithItems | null;
  isLoadingActiveTrip: boolean;
  
  // All user trips for quick access
  trips: Trip[];
  isLoadingTrips: boolean;
  
  // Trip status helpers
  upcomingTrips: Trip[];
  pastTrips: Trip[];
  
  // Actions
  setActiveTrip: (trip: Trip | null) => void;
  setActiveTripById: (tripId: string | null) => void;
  clearActiveTrip: () => void;
  
  // Helpers
  hasActiveTrip: boolean;
  activeTripId: string | null;
}

const TripContext: Context<TripContextType | null> =
  (window as any).__mdeTripContext ??
  ((window as any).__mdeTripContext = createContext<TripContextType | null>(null));

const ACTIVE_TRIP_STORAGE_KEY = "ilovemedellin_active_trip_id";

export function useTripContext() {
  const context = useContext(TripContext);
  if (!context) {
    throw new Error("useTripContext must be used within TripProvider");
  }
  return context;
}

// Alias for convenience
export const useActiveTrip = useTripContext;

interface TripProviderProps {
  children: ReactNode;
}

export function TripProvider({ children }: TripProviderProps) {
  const { user } = useAuth();
  const [activeTripId, setActiveTripId] = useState<string | null>(() => {
    // Restore from localStorage on mount
    if (typeof window !== "undefined") {
      return localStorage.getItem(ACTIVE_TRIP_STORAGE_KEY);
    }
    return null;
  });

  // Fetch all trips for the user
  const { data: tripsData, isLoading: isLoadingTrips } = useTrips();
  const trips = tripsData?.trips || [];

  // Fetch the active trip with items
  const { data: activeTripWithItems, isLoading: isLoadingActiveTrip } = useTrip(activeTripId || "");

  // Derive active trip from trips list (lighter weight)
  const activeTrip = trips.find((t) => t.id === activeTripId) || null;

  // Categorize trips by status
  const today = new Date().toISOString().split("T")[0];
  
  const upcomingTrips = trips.filter(
    (t) => t.end_date >= today && (t.status === "draft" || t.status === "active")
  );
  
  const pastTrips = trips.filter(
    (t) => t.end_date < today || t.status === "completed"
  );

  // Persist active trip to localStorage
  useEffect(() => {
    if (activeTripId) {
      localStorage.setItem(ACTIVE_TRIP_STORAGE_KEY, activeTripId);
    } else {
      localStorage.removeItem(ACTIVE_TRIP_STORAGE_KEY);
    }
  }, [activeTripId]);

  // Clear active trip when user logs out
  useEffect(() => {
    if (!user) {
      setActiveTripId(null);
    }
  }, [user]);

  // Validate that stored trip ID still exists
  useEffect(() => {
    if (activeTripId && trips.length > 0) {
      const tripExists = trips.some((t) => t.id === activeTripId);
      if (!tripExists) {
        setActiveTripId(null);
      }
    }
  }, [activeTripId, trips]);

  const setActiveTrip = useCallback((trip: Trip | null) => {
    setActiveTripId(trip?.id || null);
  }, []);

  const setActiveTripById = useCallback((tripId: string | null) => {
    setActiveTripId(tripId);
  }, []);

  const clearActiveTrip = useCallback(() => {
    setActiveTripId(null);
  }, []);

  return (
    <TripContext.Provider
      value={{
        activeTrip,
        activeTripWithItems: activeTripWithItems || null,
        isLoadingActiveTrip,
        trips,
        isLoadingTrips,
        upcomingTrips,
        pastTrips,
        setActiveTrip,
        setActiveTripById,
        clearActiveTrip,
        hasActiveTrip: !!activeTrip,
        activeTripId,
      }}
    >
      {children}
    </TripContext.Provider>
  );
}
