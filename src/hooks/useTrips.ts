import { useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRealtimeChannel, RealtimeEvent } from "@/hooks/useRealtimeChannel";
import type { Trip, TripFilters, TripWithItems, CreateTripInput, TripStatus } from "@/types/trip";

export function useTrips(filters: TripFilters = {}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["trips", user?.id, filters],
    queryFn: async () => {
      if (!user?.id) return { trips: [], total: 0 };

      let query = supabase
        .from("trips")
        .select("*", { count: "exact" })
        .eq("user_id", user.id)
        .is("deleted_at", null);

      // Apply status filter
      if (filters.status?.length) {
        query = query.in("status", filters.status);
      }

      // Apply search filter
      if (filters.search) {
        query = query.or(
          `title.ilike.%${filters.search}%,destination.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
        );
      }

      // Apply date range filter
      if (filters.dateRange?.start) {
        query = query.gte("start_date", filters.dateRange.start);
      }
      if (filters.dateRange?.end) {
        query = query.lte("end_date", filters.dateRange.end);
      }

      // Order by start date
      query = query.order("start_date", { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        trips: data as Trip[],
        total: count || 0,
      };
    },
    enabled: !!user?.id,
  });
}

export function useTrip(id: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Realtime handler for trip items changes
  const handleItemsEvent = useCallback((event: RealtimeEvent) => {
    // Invalidate query to refetch on any item change
    queryClient.invalidateQueries({ queryKey: ["trip", id] });
  }, [queryClient, id]);

  // Realtime handler for trip meta changes
  const handleMetaEvent = useCallback((event: RealtimeEvent) => {
    // Invalidate query to refetch on any trip meta change
    queryClient.invalidateQueries({ queryKey: ["trip", id] });
    queryClient.invalidateQueries({ queryKey: ["trips"] });
  }, [queryClient, id]);

  // Subscribe to trip items changes
  useRealtimeChannel({
    topic: `trip:${id}:items`,
    enabled: !!id && !!user?.id,
    onEvent: handleItemsEvent,
  });

  // Subscribe to trip meta changes
  useRealtimeChannel({
    topic: `trip:${id}:meta`,
    enabled: !!id && !!user?.id,
    onEvent: handleMetaEvent,
  });

  return useQuery({
    queryKey: ["trip", id],
    queryFn: async () => {
      const { data: trip, error: tripError } = await supabase
        .from("trips")
        .select("*")
        .eq("id", id)
        .single();

      if (tripError) throw tripError;

      const { data: items, error: itemsError } = await supabase
        .from("trip_items")
        .select("*")
        .eq("trip_id", id)
        .order("start_at", { ascending: true });

      if (itemsError) throw itemsError;

      return {
        ...trip,
        items: items || [],
      } as TripWithItems;
    },
    enabled: !!id && !!user?.id,
  });
}

export function useCreateTrip() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateTripInput) => {
      if (!user?.id) throw new Error("Must be logged in to create a trip");

      const { data, error } = await supabase
        .from("trips")
        .insert({
          user_id: user.id,
          title: input.title,
          destination: input.destination || null,
          description: input.description || null,
          start_date: input.start_date,
          end_date: input.end_date,
          budget: input.budget || null,
          currency: input.currency || "USD",
          status: "draft" as TripStatus,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Trip;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
    },
  });
}

export function useUpdateTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<Trip> & { id: string }) => {
      const { data, error } = await supabase
        .from("trips")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Trip;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      queryClient.invalidateQueries({ queryKey: ["trip", data.id] });
    },
  });
}

export function useDeleteTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Soft delete
      const { error } = await supabase
        .from("trips")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
    },
  });
}

export function useArchiveTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("trips")
        .update({ status: "completed" as TripStatus })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
    },
  });
}

export function useUnarchiveTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("trips")
        .update({ status: "draft" as TripStatus })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
    },
  });
}

export function useUpcomingTrips(limit = 3) {
  const { user } = useAuth();
  const today = new Date().toISOString().split("T")[0];

  return useQuery({
    queryKey: ["trips", "upcoming", user?.id, limit],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("trips")
        .select("*")
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .in("status", ["draft", "active"])
        .gte("end_date", today)
        .order("start_date", { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data as Trip[];
    },
    enabled: !!user?.id,
  });
}
