/**
 * Canonical RLS contract for event commerce tables (EVT-010).
 * Must match supabase/migrations/20260503011925_event_phase1.sql + remote pg_policies.
 */

export const EVENT_COMMERCE_RLS_TABLES = [
  "event_venues",
  "event_tickets",
  "event_orders",
  "event_attendees",
  "event_check_ins",
] as const;

export type EventCommerceRlsTable = (typeof EVENT_COMMERCE_RLS_TABLES)[number];

/** Policy names expected on production per table (SELECT-focused; writes via service_role RPCs). */
export const EVENT_COMMERCE_POLICIES: Record<
  EventCommerceRlsTable,
  readonly string[]
> = {
  event_venues: ["venues_public_select", "venues_owner_all"],
  event_tickets: ["tickets_public_select", "tickets_organizer_all"],
  event_orders: ["orders_buyer_select", "orders_organizer_select"],
  event_attendees: ["attendees_via_order_select"],
  event_check_ins: ["checkins_organizer_select"],
} as const;

/** Related payments policy for event_order_id rows (same buyer/organizer chain as orders). */
export const PAYMENTS_EVENT_ORDER_POLICY = "payments_event_order_select";

/**
 * Anonymous buyers must not SELECT event_orders directly; wallet uses
 * get_anonymous_order(order_id, access_token) SECURITY DEFINER RPC.
 */
export const ANON_ORDER_ACCESS_RPC = "get_anonymous_order";

/** Tables that must have RLS enabled (relrowsecurity). */
export const EVENT_COMMERCE_RLS_ENABLED = EVENT_COMMERCE_RLS_TABLES;

export function allEventCommercePolicyNames(): string[] {
  return [
    ...Object.values(EVENT_COMMERCE_POLICIES).flat(),
    PAYMENTS_EVENT_ORDER_POLICY,
  ];
}
