export interface EventTicketTier {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  price_cents: number;
  currency: string;
  qty_total: number;
  qty_sold: number;
  qty_pending: number;
  min_per_order: number;
  max_per_order: number;
  sale_starts_at: string | null;
  sale_ends_at: string | null;
  is_active: boolean;
  position: number;
}

export function getAvailableTicketQuantity(
  ticket: Pick<EventTicketTier, "qty_total" | "qty_sold" | "qty_pending">,
) {
  return Math.max(0, ticket.qty_total - ticket.qty_sold - ticket.qty_pending);
}

export function formatTicketPriceCents(priceCents: number, currency: string) {
  if (priceCents === 0) return "Free";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "COP",
    maximumFractionDigits: 0,
  }).format(priceCents / 100);
}
