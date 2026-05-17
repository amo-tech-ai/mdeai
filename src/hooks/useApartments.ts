import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Apartment, ApartmentFilters } from "@/types/listings";

export function useApartments(filters: ApartmentFilters = {}) {
  return useQuery({
    queryKey: ["apartments", filters],
    queryFn: async () => {
      let query = supabase
        .from("apartments")
        .select("*")
        .eq("status", "active");

      // Apply search filter
      if (filters.search) {
        query = query.or(
          `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,neighborhood.ilike.%${filters.search}%`
        );
      }

      // Apply neighborhood filter
      if (filters.neighborhoods?.length) {
        query = query.in("neighborhood", filters.neighborhoods);
      }

      // Apply price range filter
      if (filters.priceRange?.min !== undefined) {
        query = query.gte("price_monthly", filters.priceRange.min);
      }
      if (filters.priceRange?.max !== undefined) {
        query = query.lte("price_monthly", filters.priceRange.max);
      }

      // Apply bedrooms filter
      if (filters.bedrooms?.length) {
        if (filters.bedrooms.includes(3)) {
          // 3+ bedrooms
          query = query.or(
            `bedrooms.in.(${filters.bedrooms.filter(b => b < 3).join(",")}),bedrooms.gte.3`
          );
        } else {
          query = query.in("bedrooms", filters.bedrooms);
        }
      }

      // Apply furnished filter
      if (filters.furnished !== undefined) {
        query = query.eq("furnished", filters.furnished);
      }

      // Apply pet-friendly filter
      if (filters.petFriendly !== undefined) {
        query = query.eq("pet_friendly", filters.petFriendly);
      }

      // Apply WiFi speed filter
      if (filters.wifiSpeedMin !== undefined) {
        query = query.gte("wifi_speed", filters.wifiSpeedMin);
      }

      // Apply available from filter
      if (filters.availableFrom) {
        query = query.lte("available_from", filters.availableFrom);
      }

      // Apply ID filter — used by chat "See all on the map" hand-off
      if (filters.ids?.length) {
        query = query.in("id", filters.ids);
      }

      // Apply sorting
      const sortBy = filters.sortBy || "created_at";
      const sortOrder = filters.sortOrder || "desc";
      query = query.order(sortBy, { ascending: sortOrder === "asc" });

      // Apply pagination
      const page = filters.page || 1;
      const limit = filters.limit || 12;
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        apartments: data as Apartment[],
        total: count || 0,
        page,
        limit,
      };
    },
  });
}

export function useApartment(id: string) {
  return useQuery({
    queryKey: ["apartment", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("apartments")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Apartment;
    },
    enabled: !!id,
  });
}

export function useFeaturedApartments(limit = 4) {
  return useQuery({
    queryKey: ["apartments", "featured", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("apartments")
        .select("*")
        .eq("status", "active")
        .eq("featured", true)
        .order("rating", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as Apartment[];
    },
  });
}

export function useNeighborhoods() {
  return useQuery({
    queryKey: ["neighborhoods"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("apartments")
        .select("neighborhood")
        .eq("status", "active");

      if (error) throw error;

      // Get unique neighborhoods with counts
      const counts = (data || []).reduce((acc, apt) => {
        acc[apt.neighborhood] = (acc[apt.neighborhood] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return Object.entries(counts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
    },
  });
}
