import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Event, EventFilters } from "@/types/event";

export function useEvents(filters: EventFilters = {}) {
  return useQuery({
    queryKey: ["events", filters],
    queryFn: async (): Promise<Event[]> => {
      let query = supabase
        .from("events")
        .select("*")
        .eq("is_active", true)
        .order("event_start_time", { ascending: true });

      // Apply filters
      if (filters.eventType) {
        query = query.eq("event_type", filters.eventType);
      }

      if (filters.city) {
        query = query.ilike("city", `%${filters.city}%`);
      }

      if (filters.dateFrom) {
        query = query.gte("event_start_time", filters.dateFrom);
      }

      if (filters.dateTo) {
        query = query.lte("event_start_time", filters.dateTo);
      }

      if (filters.isFree) {
        query = query.or("ticket_price_min.is.null,ticket_price_min.eq.0");
      }

      if (filters.search) {
        query = query.or(
          `name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
        );
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data || [];
    },
  });
}

export function useEvent(id: string | undefined) {
  return useQuery({
    queryKey: ["event", id],
    queryFn: async (): Promise<Event | null> => {
      if (!id) return null;

      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    enabled: !!id,
  });
}

export function useFeaturedEvents(limit = 4) {
  return useQuery({
    queryKey: ["events", "featured", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("is_active", true)
        .gte("event_start_time", new Date().toISOString())
        .order("event_start_time", { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data as Event[];
    },
  });
}

export function useUpcomingEvents(limit = 5) {
  return useQuery({
    queryKey: ["events", "upcoming", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("is_active", true)
        .gte("event_start_time", new Date().toISOString())
        .order("event_start_time", { ascending: true })
        .limit(limit);

      if (error) throw error;
      return { events: data as Event[], total: data?.length || 0 };
    },
  });
}
