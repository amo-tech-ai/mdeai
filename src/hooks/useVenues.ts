import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { z } from "zod";

/**
 * Phase 1 events MVP — venue picker support (task 035 lite — embedded in wizard).
 * Lists organizer's venues for autocomplete; inline-creates a new venue from
 * Step 1 of the wizard.
 */

export const venueCreateSchema = z.object({
  name: z.string().trim().min(3, "Venue name 3+ chars").max(120),
  address: z.string().trim().min(5, "Address 5+ chars").max(300),
  city: z.string().trim().min(2).max(80).default("Medellín"),
  capacity: z.number().int().min(1).max(200_000).optional(),
  postal_code: z.string().trim().max(20).optional().or(z.literal("")),
});

export type VenueCreateInput = z.infer<typeof venueCreateSchema>;

export interface VenueRow {
  id: string;
  name: string;
  address: string;
  city: string;
  capacity: number | null;
  postal_code: string | null;
}

export function useVenues() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["venues", user?.id],
    enabled: !!user,
    staleTime: 30_000,
    queryFn: async (): Promise<VenueRow[]> => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("event_venues")
        .select("id,name,address,city,capacity,postal_code")
        .eq("organizer_id", user.id)
        .order("name", { ascending: true });
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
}

export function useCreateVenue() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: VenueCreateInput): Promise<VenueRow> => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("event_venues")
        .insert({
          organizer_id: user.id,
          name: input.name,
          address: input.address,
          city: input.city,
          country: "CO",
          capacity: input.capacity ?? null,
          postal_code: input.postal_code || null,
        })
        .select("id,name,address,city,capacity,postal_code")
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["venues"] });
    },
  });
}
