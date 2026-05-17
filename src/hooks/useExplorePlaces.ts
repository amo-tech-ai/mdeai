import { useQuery } from "@tanstack/react-query";
import { PUBLIC_EVENT_STATUSES } from "@/lib/events-catalog";
import { supabase } from "@/integrations/supabase/client";
import type { ExplorePlaceResult, ExploreCategory, ExploreFilters } from "@/types/explore";

// Helper to format price levels
function getPriceLevel(level: number): string {
  return "$".repeat(Math.max(1, Math.min(4, level)));
}

export function useExplorePlaces(filters: ExploreFilters) {
  return useQuery({
    queryKey: ["explorePlaces", filters],
    queryFn: async () => {
      const results: ExplorePlaceResult[] = [];
      const { category, neighborhood, searchQuery, priceLevel, minRating } = filters;

      // Determine which types to query
      const includeApartments = category === "all" || category === "stays";
      const includeCars = category === "all" || category === "cars";
      const includeRestaurants = category === "all" || category === "restaurants";
      const includeEvents = category === "all" || category === "events";

      // Parallel queries for all types
      const queries = [];

      if (includeApartments) {
        let query = supabase
          .from("apartments")
          .select("*")
          .eq("status", "active")
          .limit(20);

        if (neighborhood && neighborhood !== "All Neighborhoods") {
          query = query.eq("neighborhood", neighborhood);
        }
        if (searchQuery) {
          query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
        }
        if (minRating) {
          query = query.gte("rating", minRating);
        }

        queries.push(
          query.then(({ data, error }) => {
            if (error) throw error;
            return (data || []).map((apt): ExplorePlaceResult => ({
              id: apt.id,
              type: "apartment",
              title: apt.title,
              description: apt.description || "",
              image: apt.images?.[0] || "",
              neighborhood: apt.neighborhood,
              rating: apt.rating,
              price: apt.price_monthly 
                ? `$${apt.price_monthly.toLocaleString()}/mo`
                : apt.price_daily 
                ? `$${apt.price_daily}/night`
                : "",
              priceLevel: apt.price_monthly ? (apt.price_monthly > 3000 ? 4 : apt.price_monthly > 2000 ? 3 : apt.price_monthly > 1000 ? 2 : 1) : 2,
              tags: apt.amenities?.slice(0, 3) || [],
              coordinates: apt.latitude && apt.longitude 
                ? { lat: apt.latitude, lng: apt.longitude }
                : null,
              rawData: apt,
            }));
          })
        );
      }

      if (includeCars) {
        let query = supabase
          .from("car_rentals")
          .select("*")
          .eq("status", "active")
          .limit(20);

        if (searchQuery) {
          query = query.or(`make.ilike.%${searchQuery}%,model.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
        }
        if (minRating) {
          query = query.gte("rating", minRating);
        }

        queries.push(
          query.then(({ data, error }) => {
            if (error) throw error;
            return (data || []).map((car): ExplorePlaceResult => ({
              id: car.id,
              type: "car",
              title: `${car.year || ""} ${car.make} ${car.model}`.trim(),
              description: car.description || "",
              image: car.images?.[0] || "",
              neighborhood: "Medellín",
              rating: car.rating,
              price: `$${car.price_daily}/day`,
              priceLevel: car.price_daily > 200 ? 4 : car.price_daily > 100 ? 3 : car.price_daily > 50 ? 2 : 1,
              tags: car.features?.slice(0, 3) || [],
              coordinates: null,
              rawData: car,
            }));
          })
        );
      }

      if (includeRestaurants) {
        let query = supabase
          .from("restaurants")
          .select("*")
          .eq("is_active", true)
          .limit(20);

        if (neighborhood && neighborhood !== "All Neighborhoods") {
          query = query.eq("city", neighborhood);
        }
        if (searchQuery) {
          query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
        }
        if (minRating) {
          query = query.gte("rating", minRating);
        }
        if (priceLevel?.length) {
          query = query.in("price_level", priceLevel);
        }

        queries.push(
          query.then(({ data, error }) => {
            if (error) throw error;
            return (data || []).map((rest): ExplorePlaceResult => ({
              id: rest.id,
              type: "restaurant",
              title: rest.name,
              description: rest.description || "",
              image: rest.primary_image_url || "",
              neighborhood: rest.city || "Medellín",
              rating: rest.rating,
              price: getPriceLevel(rest.price_level),
              priceLevel: rest.price_level,
              tags: rest.cuisine_types?.slice(0, 3) || [],
              coordinates: rest.latitude && rest.longitude 
                ? { lat: rest.latitude, lng: rest.longitude }
                : null,
              rawData: rest,
            }));
          })
        );
      }

      if (includeEvents) {
        let query = supabase
          .from("events")
          .select("*")
          .in("status", [...PUBLIC_EVENT_STATUSES])
          .gte("event_start_time", new Date().toISOString())
          .order("event_start_time", { ascending: true })
          .limit(20);

        if (neighborhood && neighborhood !== "All Neighborhoods") {
          query = query.eq("city", neighborhood);
        }
        if (searchQuery) {
          query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
        }
        if (minRating) {
          query = query.gte("rating", minRating);
        }

        queries.push(
          query.then(({ data, error }) => {
            if (error) throw error;
            return (data || []).map((evt): ExplorePlaceResult => ({
              id: evt.id,
              type: "event",
              title: evt.name,
              description: evt.description || "",
              image: evt.primary_image_url || "",
              neighborhood: evt.city || "Medellín",
              rating: evt.rating,
              price: evt.ticket_price_min ? `From $${evt.ticket_price_min.toLocaleString()}` : "Free",
              priceLevel: evt.ticket_price_min ? (evt.ticket_price_min > 100 ? 3 : evt.ticket_price_min > 30 ? 2 : 1) : 0,
              tags: evt.tags?.slice(0, 3) || (evt.event_type ? [evt.event_type] : []),
              coordinates: evt.latitude && evt.longitude 
                ? { lat: evt.latitude, lng: evt.longitude }
                : null,
              rawData: evt,
            }));
          })
        );
      }

      // Execute all queries in parallel
      const queryResults = await Promise.all(queries);
      
      // Flatten results
      queryResults.forEach((typeResults) => {
        results.push(...typeResults);
      });

      return results;
    },
    staleTime: 1000 * 60 * 2, // Cache for 2 minutes
  });
}

// Hook to get counts per category
export function useExploreCounts(filters: Omit<ExploreFilters, 'category'>) {
  return useQuery({
    queryKey: ["exploreCounts", filters.neighborhood, filters.searchQuery],
    queryFn: async () => {
      const { neighborhood, searchQuery } = filters;
      const counts: Record<string, number> = {};

      // Query counts in parallel
      const [apartmentsCount, carsCount, restaurantsCount, eventsCount] = await Promise.all([
        // Apartments
        supabase
          .from("apartments")
          .select("id", { count: "exact", head: true })
          .eq("status", "active")
          .then(({ count }) => count || 0),

        // Cars
        supabase
          .from("car_rentals")
          .select("id", { count: "exact", head: true })
          .eq("status", "active")
          .then(({ count }) => count || 0),

        // Restaurants
        supabase
          .from("restaurants")
          .select("id", { count: "exact", head: true })
          .eq("is_active", true)
          .then(({ count }) => count || 0),

        // Events
        supabase
          .from("events")
          .select("id", { count: "exact", head: true })
          .in("status", [...PUBLIC_EVENT_STATUSES])
          .gte("event_start_time", new Date().toISOString())
          .then(({ count }) => count || 0),
      ]);

      return {
        all: apartmentsCount + carsCount + restaurantsCount + eventsCount,
        stays: apartmentsCount,
        cars: carsCount,
        restaurants: restaurantsCount,
        events: eventsCount,
      };
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}
