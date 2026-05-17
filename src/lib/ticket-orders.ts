import type { StoredTicketOrder } from "@/lib/event-ticket-storage";
import { supabase } from "@/integrations/supabase/client";

export interface TicketOrderPayload {
  order: {
    id: string;
    event_id: string;
    status: string;
    total_cents: number;
    currency: string;
    buyer_email: string | null;
    buyer_name: string | null;
    created_at: string;
    paid_at: string | null;
    short_id?: string | null;
  };
  event: {
    id: string;
    name: string;
    event_start_time: string;
    event_end_time: string | null;
    address: string | null;
    city: string | null;
    primary_image_url: string | null;
  };
  attendees: Array<{
    id: string;
    order_id: string;
    event_id: string;
    ticket_id: string;
    full_name: string | null;
    email: string | null;
    status: string;
    qr_token: string | null;
    checked_in_at: string | null;
  }>;
}

export interface StoredTicketOrderResult {
  stored: StoredTicketOrder;
  payload: TicketOrderPayload | null;
  error: string | null;
}

type UntypedSupabase = typeof supabase & {
  rpc(
    fn: "get_anonymous_order",
    args: { p_order_id: string; p_access_token: string },
  ): Promise<{ data: TicketOrderPayload | null; error: { message?: string } | null }>;
};

export async function fetchAnonymousTicketOrder(
  stored: StoredTicketOrder,
): Promise<StoredTicketOrderResult> {
  const { data, error } = await (supabase as UntypedSupabase).rpc("get_anonymous_order", {
    p_order_id: stored.orderId,
    p_access_token: stored.accessToken,
  });

  return {
    stored,
    payload: data,
    error: error?.message || null,
  };
}
