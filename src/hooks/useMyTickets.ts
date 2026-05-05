import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface MyTicketEvent {
  id: string;
  name: string;
  event_start_time: string;
  event_end_time: string | null;
  address: string | null;
  primary_image_url: string | null;
}

export interface MyTicketTier {
  id: string;
  name: string;
  price_cents: number;
  currency: string;
}

export interface MyTicket {
  attendeeId: string;
  orderId: string;
  orderShortId: string;
  orderStatus: string;
  attendeeName: string;
  attendeeEmail: string;
  qrToken: string;
  qrUsedAt: string | null;
  attendeeStatus: "pending" | "active" | "cancelled" | "refunded";
  tier: MyTicketTier;
  event: MyTicketEvent;
  totalCents: number;
  currency: string;
  createdAt: string;
}

export type TicketDisplayStatus = "active" | "used" | "expired" | "refunded" | "pending";

export function getTicketDisplayStatus(
  ticket: MyTicket,
  now = new Date(),
): TicketDisplayStatus {
  if (ticket.attendeeStatus === "refunded" || ticket.orderStatus === "refunded") {
    return "refunded";
  }
  if (ticket.attendeeStatus === "pending") return "pending";
  if (ticket.attendeeStatus === "cancelled") return "refunded";
  if (ticket.qrUsedAt) return "used";
  if (ticket.event.event_end_time && new Date(ticket.event.event_end_time) < now) {
    return "expired";
  }
  return "active";
}

export function useMyTickets() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-tickets", user?.id],
    enabled: !!user,
    staleTime: 30_000,
    queryFn: async (): Promise<MyTicket[]> => {
      const { data: orders, error } = await supabase
        .from("event_orders")
        .select(
          `
          id,
          event_id,
          ticket_id,
          quantity,
          total_cents,
          currency,
          status,
          short_id,
          created_at,
          events!event_id(id, name, event_start_time, event_end_time, address, primary_image_url),
          event_tickets!ticket_id(id, name, price_cents, currency),
          event_attendees(id, full_name, email, qr_token, qr_used_at, status)
        `,
        )
        .eq("buyer_user_id", user!.id)
        .in("status", ["paid", "partial_refund", "refunded"])
        .order("created_at", { ascending: false });

      if (error) throw error;

      const tickets: MyTicket[] = [];
      for (const order of orders ?? []) {
        const event = order.events as unknown as MyTicketEvent;
        const tier = order.event_tickets as unknown as MyTicketTier;
        const attendees = order.event_attendees as unknown as {
          id: string;
          full_name: string;
          email: string;
          qr_token: string;
          qr_used_at: string | null;
          status: string;
        }[];

        for (const a of attendees ?? []) {
          tickets.push({
            attendeeId: a.id,
            orderId: order.id,
            orderShortId: order.short_id,
            orderStatus: order.status,
            attendeeName: a.full_name,
            attendeeEmail: a.email,
            qrToken: a.qr_token,
            qrUsedAt: a.qr_used_at,
            attendeeStatus: a.status as MyTicket["attendeeStatus"],
            tier,
            event,
            totalCents: order.total_cents,
            currency: order.currency,
            createdAt: order.created_at,
          });
        }
      }

      return tickets;
    },
  });
}
