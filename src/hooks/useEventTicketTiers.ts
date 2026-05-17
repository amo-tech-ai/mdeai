import { useQuery } from "@tanstack/react-query";
import type { EventTicketTier } from "@/lib/event-ticket-tier";
export type { EventTicketTier } from "@/lib/event-ticket-tier";
import { supabase } from "@/integrations/supabase/client";

type UntypedSupabase = typeof supabase & {
  from(table: "event_tickets"): {
    select(columns: string): {
      eq(column: string, value: unknown): unknown;
    };
  };
};

export function useEventTicketTiers(eventId: string | undefined) {
  return useQuery({
    queryKey: ["event-ticket-tiers", eventId],
    queryFn: async (): Promise<EventTicketTier[]> => {
      if (!eventId) return [];

      const query = (supabase as UntypedSupabase)
        .from("event_tickets")
        .select(
          [
            "id",
            "event_id",
            "name",
            "description",
            "price_cents",
            "currency",
            "qty_total",
            "qty_sold",
            "qty_pending",
            "min_per_order",
            "max_per_order",
            "sale_starts_at",
            "sale_ends_at",
            "is_active",
            "position",
          ].join(","),
        );

      const { data, error } = await (query as any)
        .eq("event_id", eventId)
        .eq("is_active", true)
        .order("position", { ascending: true })
        .order("price_cents", { ascending: true });

      if (error) throw error;
      return (data || []) as EventTicketTier[];
    },
    enabled: !!eventId,
  });
}
