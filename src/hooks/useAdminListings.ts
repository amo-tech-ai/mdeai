import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

export type ListingType = "apartments" | "restaurants" | "events" | "car_rentals";

type ApartmentRow = Database["public"]["Tables"]["apartments"]["Row"];
type RestaurantRow = Database["public"]["Tables"]["restaurants"]["Row"];
type EventRow = Database["public"]["Tables"]["events"]["Row"];
type CarRentalRow = Database["public"]["Tables"]["car_rentals"]["Row"];

export type ListingRow = ApartmentRow | RestaurantRow | EventRow | CarRentalRow;

interface ListingFilters {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

async function fetchApartments(filters: ListingFilters, from: number, to: number) {
  let query = supabase.from("apartments").select("*", { count: "exact" });
  if (filters.search) {
    query = query.or(`title.ilike.%${filters.search}%,neighborhood.ilike.%${filters.search}%`);
  }
  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }
  return query.order("created_at", { ascending: false }).range(from, to);
}

async function fetchRestaurants(filters: ListingFilters, from: number, to: number) {
  let query = supabase.from("restaurants").select("*", { count: "exact" });
  if (filters.search) {
    query = query.or(`name.ilike.%${filters.search}%,address.ilike.%${filters.search}%`);
  }
  if (filters.status && filters.status !== "all") {
    query = query.eq("is_active", filters.status === "active");
  }
  return query.order("created_at", { ascending: false }).range(from, to);
}

async function fetchEvents(filters: ListingFilters, from: number, to: number) {
  let query = supabase.from("events").select("*", { count: "exact" });
  if (filters.search) {
    query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }
  if (filters.status && filters.status !== "all") {
    query = query.eq("is_active", filters.status === "active");
  }
  return query.order("created_at", { ascending: false }).range(from, to);
}

async function fetchCarRentals(filters: ListingFilters, from: number, to: number) {
  let query = supabase.from("car_rentals").select("*", { count: "exact" });
  if (filters.search) {
    query = query.or(`make.ilike.%${filters.search}%,model.ilike.%${filters.search}%`);
  }
  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }
  return query.order("created_at", { ascending: false }).range(from, to);
}

export function useAdminListings(type: ListingType, filters: ListingFilters = {}) {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  return useQuery({
    queryKey: ["admin", type, filters],
    queryFn: async () => {
      let data: ListingRow[] = [];
      let count: number | null = 0;
      let error: Error | null = null;

      switch (type) {
        case "apartments": {
          const result = await fetchApartments(filters, from, to);
          data = (result.data || []) as ApartmentRow[];
          count = result.count;
          error = result.error;
          break;
        }
        case "restaurants": {
          const result = await fetchRestaurants(filters, from, to);
          data = (result.data || []) as RestaurantRow[];
          count = result.count;
          error = result.error;
          break;
        }
        case "events": {
          const result = await fetchEvents(filters, from, to);
          data = (result.data || []) as EventRow[];
          count = result.count;
          error = result.error;
          break;
        }
        case "car_rentals": {
          const result = await fetchCarRentals(filters, from, to);
          data = (result.data || []) as CarRentalRow[];
          count = result.count;
          error = result.error;
          break;
        }
      }

      if (error) throw error;

      return {
        listings: data,
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      };
    },
  });
}

export function useCreateListing(type: ListingType) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inputData: Partial<ListingRow>) => {
      switch (type) {
        case "apartments": {
          const { data, error } = await supabase.from("apartments").insert(inputData as Database["public"]["Tables"]["apartments"]["Insert"]).select().single();
          if (error) throw error;
          return data;
        }
        case "restaurants": {
          const { data, error } = await supabase.from("restaurants").insert(inputData as Database["public"]["Tables"]["restaurants"]["Insert"]).select().single();
          if (error) throw error;
          return data;
        }
        case "events": {
          const { data, error } = await supabase.from("events").insert(inputData as Database["public"]["Tables"]["events"]["Insert"]).select().single();
          if (error) throw error;
          return data;
        }
        case "car_rentals": {
          const { data, error } = await supabase.from("car_rentals").insert(inputData as Database["public"]["Tables"]["car_rentals"]["Insert"]).select().single();
          if (error) throw error;
          return data;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", type] });
      toast.success("Listing created successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create listing: ${error.message}`);
    },
  });
}

export function useUpdateListing(type: ListingType) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data: inputData }: { id: string; data: Partial<ListingRow> }) => {
      switch (type) {
        case "apartments": {
          const { data, error } = await supabase.from("apartments").update(inputData as Database["public"]["Tables"]["apartments"]["Update"]).eq("id", id).select().single();
          if (error) throw error;
          return data;
        }
        case "restaurants": {
          const { data, error } = await supabase.from("restaurants").update(inputData as Database["public"]["Tables"]["restaurants"]["Update"]).eq("id", id).select().single();
          if (error) throw error;
          return data;
        }
        case "events": {
          const { data, error } = await supabase.from("events").update(inputData as Database["public"]["Tables"]["events"]["Update"]).eq("id", id).select().single();
          if (error) throw error;
          return data;
        }
        case "car_rentals": {
          const { data, error } = await supabase.from("car_rentals").update(inputData as Database["public"]["Tables"]["car_rentals"]["Update"]).eq("id", id).select().single();
          if (error) throw error;
          return data;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", type] });
      toast.success("Listing updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update listing: ${error.message}`);
    },
  });
}

export function useDeleteListing(type: ListingType) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(type).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", type] });
      toast.success("Listing deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete listing: ${error.message}`);
    },
  });
}

export function useToggleListingStatus(type: ListingType) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      switch (type) {
        case "apartments": {
          const { data, error } = await supabase.from("apartments").update({ status: isActive ? "active" : "inactive" }).eq("id", id).select().single();
          if (error) throw error;
          return data;
        }
        case "car_rentals": {
          const { data, error } = await supabase.from("car_rentals").update({ status: isActive ? "active" : "inactive" }).eq("id", id).select().single();
          if (error) throw error;
          return data;
        }
        case "restaurants": {
          const { data, error } = await supabase.from("restaurants").update({ is_active: isActive }).eq("id", id).select().single();
          if (error) throw error;
          return data;
        }
        case "events": {
          const { data, error } = await supabase
            .from("events")
            .update({
              is_active: isActive,
              status: isActive ? "published" : "draft",
            })
            .eq("id", id)
            .select()
            .single();
          if (error) throw error;
          return data;
        }
      }
    },
    onSuccess: (_, { isActive }) => {
      queryClient.invalidateQueries({ queryKey: ["admin", type] });
      toast.success(`Listing ${isActive ? "activated" : "deactivated"}`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to update status: ${error.message}`);
    },
  });
}
