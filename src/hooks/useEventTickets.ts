import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EventTicketTier {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  currency: string;
  qty_total: number;
  qty_sold: number;
  qty_pending: number;
  is_active: boolean;
  position: number;
  min_per_order: number;
  max_per_order: number;
  sale_starts_at: string | null;
  sale_ends_at: string | null;
}

export function useEventTickets(eventId: string | undefined) {
  return useQuery({
    queryKey: ["event-tickets", eventId],
    enabled: !!eventId,
    staleTime: 60_000,
    queryFn: async (): Promise<EventTicketTier[]> => {
      const { data, error } = await supabase
        .from("event_tickets")
        .select(
          "id, name, description, price_cents, currency, qty_total, qty_sold, qty_pending, is_active, position, min_per_order, max_per_order, sale_starts_at, sale_ends_at",
        )
        .eq("event_id", eventId!)
        .eq("is_active", true)
        .order("position", { ascending: true });

      if (error) throw error;
      return data ?? [];
    },
  });
}
