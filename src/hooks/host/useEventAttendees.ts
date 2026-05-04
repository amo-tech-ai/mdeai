import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AttendeeRow {
  id: string;
  full_name: string;
  email: string;
  status: "pending" | "active" | "cancelled" | "refunded";
  qr_used_at: string | null;
  tier_name: string;
  purchase_time: string;
  order_short_id: string;
  stripe_payment_intent: string | null;
}

export interface AttendeePage {
  total: number;
  rows: AttendeeRow[];
}

export function useEventAttendees(
  eventId: string | undefined,
  search: string,
  page: number,
  pageSize = 50,
) {
  return useQuery<AttendeePage>({
    queryKey: ["event-attendees", eventId, search, page, pageSize],
    enabled: !!eventId,
    staleTime: 15_000,
    queryFn: async (): Promise<AttendeePage> => {
      if (!eventId) throw new Error("eventId required");
      const { data, error } = await supabase.rpc("event_attendees_paginated", {
        p_event_id: eventId,
        p_search: search,
        p_limit: pageSize,
        p_offset: page * pageSize,
      });
      if (error) throw error;
      return data as AttendeePage;
    },
  });
}
